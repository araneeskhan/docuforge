"""
GPT-4 Turbo powered document formatting engine.

Features:
- Async parallel chunk processing with semaphore rate limiting
- Structured JSON output via Pydantic models
- Context-aware chunking to maintain document coherence
- Grammar correction with change tracking
- Semantic heading level assignment
- Readability scoring using Flesch-Kincaid algorithm
- Retry logic with exponential backoff for API errors
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import time
from typing import Optional

from openai import AsyncOpenAI, APIError, RateLimitError
from pydantic import BaseModel, Field

from app.models.schemas import (
    AIFormattingResult,
    FormattedParagraph,
    FormattingConfig,
    ParsedDocument,
    ParsedParagraph,
    ParagraphType,
)

logger = logging.getLogger("docuforge.ai")


# ─── GPT-4 Response Schema ───────────────────────────────────────────────────

class GPTParagraphOutput(BaseModel):
    index: int
    formatted_text: str
    type: str = "body"  # heading_1/heading_2/heading_3/body/list/quote
    grammar_corrections: list[str] = Field(default_factory=list)
    style_suggestions: list[str] = Field(default_factory=list)


class GPTChunkOutput(BaseModel):
    paragraphs: list[GPTParagraphOutput]
    chunk_suggestions: list[str] = Field(default_factory=list)
    grammar_errors_count: int = 0


# ─── Readability Calculator ───────────────────────────────────────────────────

class ReadabilityCalculator:
    """Flesch-Kincaid readability scoring."""

    @staticmethod
    def count_syllables(word: str) -> int:
        word = word.lower().strip(".,!?;:")
        count = 0
        vowels = "aeiouy"
        prev_vowel = False
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_vowel:
                count += 1
            prev_vowel = is_vowel
        if word.endswith("e"):
            count -= 1
        return max(1, count)

    @staticmethod
    def flesch_kincaid_score(text: str) -> int:
        """Returns score 0-100. Higher = more readable."""
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if s.strip()]
        if not sentences:
            return 50

        words = re.findall(r"\b\w+\b", text)
        if not words:
            return 50

        num_syllables = sum(
            ReadabilityCalculator.count_syllables(w) for w in words
        )
        num_sentences = len(sentences)
        num_words = len(words)

        # Flesch Reading Ease formula
        if num_sentences == 0 or num_words == 0:
            return 50

        score = (
            206.835
            - 1.015 * (num_words / num_sentences)
            - 84.6 * (num_syllables / num_words)
        )
        return max(0, min(100, int(score)))


# ─── Main AI Formatter ───────────────────────────────────────────────────────

class AIDocumentFormatter:
    """
    Async GPT-4 Turbo formatter with:
    - Parallel chunk processing (semaphore-limited)
    - Structured JSON output validation
    - Retry logic with exponential backoff
    - Context continuity between chunks
    """

    MAX_CONCURRENT_REQUESTS = 3
    MAX_RETRIES = 3
    BASE_RETRY_DELAY = 1.0  # seconds

    def __init__(self, api_key: str, base_url: str = "https://api.openai.com/v1", model: str = "gpt-4-turbo-preview"):
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self._semaphore = asyncio.Semaphore(self.MAX_CONCURRENT_REQUESTS)

    async def format_document(
        self,
        parsed_doc: ParsedDocument,
        config: FormattingConfig,
    ) -> AIFormattingResult:
        """
        Main formatting pipeline:
        1. Split paragraphs into manageable chunks
        2. Process chunks in parallel (rate-limited)
        3. Merge results and compute metadata
        4. Score readability on output text
        """
        logger.info(
            f"Starting AI format: {len(parsed_doc.paragraphs)} paragraphs, "
            f"theme={config.theme}, font={config.font}"
        )
        start_time = time.monotonic()

        # Build chunks
        chunks = self._build_chunks(parsed_doc.paragraphs)
        logger.info(f"Split into {len(chunks)} chunks")

        # Process chunks in parallel (semaphore-limited)
        tasks = []
        for i, chunk in enumerate(chunks):
            # Pre-calculate context for coherence (previous chunk's last paragraph)
            chunk_context = ""
            if i > 0 and chunks[i-1]:
                chunk_context = chunks[i-1][-1].text[:300]
                
            tasks.append(
                self._process_chunk_with_retry(
                    chunk=chunk,
                    chunk_index=i,
                    total_chunks=len(chunks),
                    context=chunk_context,
                    config=config,
                )
            )

        # Await all chunks in parallel
        chunk_results = await asyncio.gather(*tasks)

        # Merge all chunks
        merged = self._merge_chunks(chunk_results, parsed_doc)


        elapsed = time.monotonic() - start_time
        logger.info(f"AI formatting complete in {elapsed:.2f}s")

        return merged

    def _build_chunks(
        self, paragraphs: list[ParsedParagraph], max_words_per_chunk: int = 600
    ) -> list[list[ParsedParagraph]]:
        """Split paragraphs into chunks respecting heading boundaries."""
        chunks: list[list[ParsedParagraph]] = []
        current_chunk: list[ParsedParagraph] = []
        current_words = 0

        for para in paragraphs:
            # Start new chunk at H1 boundaries (natural break points)
            if (
                para.type == ParagraphType.HEADING_1
                and current_chunk
                and current_words > 100
            ):
                chunks.append(current_chunk)
                current_chunk = []
                current_words = 0

            current_chunk.append(para)
            current_words += para.word_count

            if current_words >= max_words_per_chunk:
                chunks.append(current_chunk)
                current_chunk = []
                current_words = 0

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    async def _process_chunk_with_retry(
        self,
        chunk: list[ParsedParagraph],
        chunk_index: int,
        total_chunks: int,
        context: str,
        config: FormattingConfig,
    ) -> GPTChunkOutput:
        """Process a single chunk with exponential backoff retry."""
        last_error: Optional[Exception] = None

        for attempt in range(self.MAX_RETRIES):
            try:
                return await self._call_gpt4(
                    chunk=chunk,
                    chunk_index=chunk_index,
                    total_chunks=total_chunks,
                    context=context,
                    config=config,
                )
            except RateLimitError as e:
                wait = self.BASE_RETRY_DELAY * (2**attempt)
                logger.warning(f"Rate limit hit, waiting {wait}s (attempt {attempt + 1})")
                await asyncio.sleep(wait)
                last_error = e
            except APIError as e:
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(self.BASE_RETRY_DELAY * (attempt + 1))
                last_error = e

        logger.error(f"All retries failed for chunk {chunk_index}: {last_error}")
        # Return original text as fallback
        return GPTChunkOutput(
            paragraphs=[
                GPTParagraphOutput(
                    index=p.index,
                    formatted_text=p.text,
                    type=p.type.value,
                )
                for p in chunk
            ]
        )

    async def _call_gpt4(
        self,
        chunk: list[ParsedParagraph],
        chunk_index: int,
        total_chunks: int,
        context: str,
        config: FormattingConfig,
    ) -> GPTChunkOutput:
        """Make the actual GPT-4 API call."""
        async with self._semaphore:
            system_prompt = self._build_system_prompt(config)
            user_content = self._build_user_prompt(
                chunk, chunk_index, total_chunks, context
            )

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                temperature=0.1,
                max_tokens=4096,
                response_format={"type": "json_object"},
            )

            raw = response.choices[0].message.content
            data = json.loads(raw)
            return GPTChunkOutput(**data)

    def _build_system_prompt(self, config: FormattingConfig) -> str:
        theme_instructions = {
            "professional": "Corporate business style. Clear, concise, formal language.",
            "academic": "Academic writing. Precise terminology, passive voice where appropriate.",
            "modern": "Contemporary style. Dynamic language, clear structure.",
            "minimal": "Minimalist. Remove redundancy, strengthen clarity.",
            "executive": "C-suite level. Strategic language, high-level insights.",
        }
        style_note = theme_instructions.get(config.theme.value, "Professional style.")

        return f"""You are DocuForge AI — an expert document formatter and editor.

TASK: Reformat and improve the provided document paragraphs.

STYLE GUIDE: {style_note}
FONT: {config.font} at {config.font_size}pt
LINE SPACING: {config.line_spacing}x
COLOR THEME: {config.primary_color}

FORMATTING RULES:
1. Fix ALL grammar, spelling, and punctuation errors
2. Classify each paragraph with EXACT type: heading_1, heading_2, heading_3, heading_4, body, list_item, numbered_list, block_quote, code_block
3. Improve sentence clarity and flow without changing the author's intent
4. Ensure proper paragraph transitions
5. Apply Chicago Manual of Style (17th edition) conventions
6. Remove redundant words and tighten prose

RESPONSE FORMAT: Return ONLY valid JSON matching this schema:
{{
  "paragraphs": [
    {{
      "index": <original_index>,
      "formatted_text": "<improved text>",
      "type": "<paragraph_type>",
      "grammar_corrections": ["List of specific corrections made"],
      "style_suggestions": ["Optional style improvement notes"]
    }}
  ],
  "chunk_suggestions": ["Overall suggestions for this section"],
  "grammar_errors_count": <number>
}}"""

    def _build_user_prompt(
        self,
        chunk: list[ParsedParagraph],
        chunk_index: int,
        total_chunks: int,
        context: str,
    ) -> str:
        paragraphs_json = json.dumps(
            [
                {
                    "index": p.index,
                    "text": p.text,
                    "current_type": p.type.value,
                    "style": p.style,
                }
                for p in chunk
            ],
            indent=2,
        )

        ctx_section = f"\nPREVIOUS CONTEXT (for coherence):\n{context}\n" if context else ""

        return (
            f"Document chunk {chunk_index + 1} of {total_chunks}:{ctx_section}\n"
            f"PARAGRAPHS TO FORMAT:\n{paragraphs_json}"
        )

    def _merge_chunks(
        self,
        chunk_results: list[GPTChunkOutput],
        parsed_doc: ParsedDocument,
    ) -> AIFormattingResult:
        """Merge all chunk results into a single AIFormattingResult."""
        all_paragraphs: list[FormattedParagraph] = []
        all_suggestions: list[str] = []
        total_errors = 0

        for chunk_result in chunk_results:
            for gpt_para in chunk_result.paragraphs:
                # Map type string to enum
                try:
                    para_type = ParagraphType(gpt_para.type)
                except ValueError:
                    para_type = ParagraphType.BODY

                # Find original text
                original = next(
                    (p.text for p in parsed_doc.paragraphs if p.index == gpt_para.index),
                    gpt_para.formatted_text,
                )

                all_paragraphs.append(
                    FormattedParagraph(
                        index=gpt_para.index,
                        original_text=original,
                        formatted_text=gpt_para.formatted_text,
                        type=para_type,
                        grammar_corrections=gpt_para.grammar_corrections,
                        style_suggestions=gpt_para.style_suggestions,
                    )
                )

            all_suggestions.extend(chunk_result.chunk_suggestions)
            total_errors += chunk_result.grammar_errors_count

        # Sort by original index
        all_paragraphs.sort(key=lambda p: p.index)

        # Compute readability on merged text
        full_text = " ".join(p.formatted_text for p in all_paragraphs)
        readability = ReadabilityCalculator.flesch_kincaid_score(full_text)

        # Extract title (first H1 or H2)
        title = parsed_doc.file_name.rsplit(".", 1)[0]
        for para in all_paragraphs:
            if para.type in (ParagraphType.HEADING_1, ParagraphType.HEADING_2):
                title = para.formatted_text
                break

        # Build TOC entries from headings
        toc_entries = [
            {
                "text": p.formatted_text,
                "level": int(p.type.value.split("_")[1])
                if p.type.value.startswith("heading_")
                else 0,
            }
            for p in all_paragraphs
            if p.type.value.startswith("heading_")
        ]

        # Deduplicate suggestions
        unique_suggestions = list(dict.fromkeys(all_suggestions))[:10]

        return AIFormattingResult(
            title=title,
            paragraphs=all_paragraphs,
            toc_entries=toc_entries,
            suggestions=unique_suggestions,
            readability_score=readability,
            grammar_errors_fixed=total_errors,
            detected_style="Professional",
        )
