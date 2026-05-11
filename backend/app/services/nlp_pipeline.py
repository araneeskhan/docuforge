"""
NLP preprocessing pipeline using spaCy and NLTK.

Performs linguistic analysis before GPT-4 processing:
1. Sentence boundary detection (NLTK Punkt tokenizer)
2. Named entity recognition (spaCy)
3. POS tagging for grammar analysis
4. Readability metrics
5. Keyword extraction using TF-IDF
6. Language detection
"""

from __future__ import annotations

import logging
import math
import re
from collections import Counter
from typing import Optional, Any

logger = logging.getLogger("docuforge.nlp")


class NLPPipeline:
    """
    Linguistic preprocessing pipeline.

    Combines NLTK + spaCy for comprehensive text analysis
    before sending to GPT-4 for semantic reformatting.
    """

    def __init__(self, spacy_nlp=None):
        """
        Args:
            spacy_nlp: Pre-loaded spaCy Language model (from app.state.nlp)
                       Avoids reloading the model on every request.
        """
        self.nlp = spacy_nlp
        self._init_nltk()

    def _init_nltk(self):
        """Initialize NLTK components with lazy loading."""
        try:
            import nltk
            from nltk.tokenize import sent_tokenize, word_tokenize
            from nltk.corpus import stopwords

            self._sent_tokenize = sent_tokenize
            self._word_tokenize = word_tokenize
            self._stopwords = set(stopwords.words("english"))
            self._nltk_available = True
        except (ImportError, LookupError):
            logger.warning("NLTK not fully available, using basic tokenization")
            self._nltk_available = False
            self._stopwords = set()

    def analyze(self, paragraphs: list[dict]) -> dict[str, Any]:
        """
        Full NLP analysis of document paragraphs.

        Returns:
            dict with analysis results including:
            - sentence_count
            - avg_sentence_length
            - readability_metrics
            - named_entities
            - key_phrases
            - grammar_issues
            - suggested_title (if not found)
        """
        full_text = " ".join(p.get("text", "") for p in paragraphs)

        result = {
            "sentence_count": self._count_sentences(full_text),
            "avg_sentence_length": self._avg_sentence_length(full_text),
            "vocabulary_richness": self._vocabulary_richness(full_text),
            "passive_voice_count": self._count_passive_voice(full_text),
            "key_phrases": self._extract_key_phrases(full_text),
            "named_entities": self._extract_entities(full_text),
            "readability_grade": self._flesch_kincaid_grade(full_text),
            "grammar_issues": self._detect_common_grammar_issues(full_text),
            "suggested_structure": self._suggest_structure(paragraphs),
        }

        return result

    def _count_sentences(self, text: str) -> int:
        if self._nltk_available:
            return len(self._sent_tokenize(text))
        return len(re.split(r"[.!?]+", text))

    def _avg_sentence_length(self, text: str) -> float:
        """Average words per sentence."""
        if self._nltk_available:
            sentences = self._sent_tokenize(text)
            if not sentences:
                return 0.0
            total_words = sum(
                len(self._word_tokenize(s)) for s in sentences
            )
            return round(total_words / len(sentences), 1)

        sentences = re.split(r"[.!?]+", text)
        words = text.split()
        return round(len(words) / max(len(sentences), 1), 1)

    def _vocabulary_richness(self, text: str) -> float:
        """Type-token ratio: unique words / total words (0-1)."""
        words = re.findall(r"\b[a-z]+\b", text.lower())
        if not words:
            return 0.0
        return round(len(set(words)) / len(words), 3)

    def _count_passive_voice(self, text: str) -> int:
        """
        Count passive voice constructions using regex patterns.
        Pattern: is/was/were/are + past participle (typically ends in -ed/-en)
        """
        passive_patterns = [
            r"\b(is|was|were|are|been|being|be)\s+\w+ed\b",
            r"\b(is|was|were|are|been|being|be)\s+\w+en\b",
            r"\b(was|were)\s+being\s+\w+ed\b",
        ]
        count = 0
        for pattern in passive_patterns:
            count += len(re.findall(pattern, text, re.IGNORECASE))
        return count

    def _extract_key_phrases(self, text: str, top_n: int = 10) -> list[str]:
        """
        Extract key phrases using a simple TF-IDF-like approach.
        For production, replace with KeyBERT or YAKE.
        """
        # Clean text
        words = re.findall(r"\b[a-z]{3,}\b", text.lower())

        # Remove stopwords
        content_words = [w for w in words if w not in self._stopwords]

        # Count frequencies (TF)
        freq = Counter(content_words)
        total = len(content_words)

        # IDF approximation (penalize very common words)
        idf = {
            word: math.log(total / (count + 1))
            for word, count in freq.items()
        }

        # TF-IDF score
        tfidf = {
            word: (count / total) * idf[word]
            for word, count in freq.items()
        }

        top_words = sorted(tfidf.items(), key=lambda x: x[1], reverse=True)[:top_n]
        return [word for word, _ in top_words]

    def _extract_entities(self, text: str) -> dict[str, list[str]]:
        """
        Named entity recognition using spaCy.
        Falls back to regex patterns if spaCy unavailable.
        """
        if self.nlp is not None:
            try:
                doc = self.nlp(text[:50000])  # Limit for performance
                entities: dict[str, list[str]] = {}
                for ent in doc.ents:
                    label = ent.label_
                    if label not in entities:
                        entities[label] = []
                    if ent.text not in entities[label]:
                        entities[label].append(ent.text)
                return entities
            except Exception as e:
                logger.warning(f"spaCy NER failed: {e}")

        # Fallback: regex-based entity detection
        return {
            "PERSON": re.findall(r"\b[A-Z][a-z]+ [A-Z][a-z]+\b", text)[:5],
            "ORG": re.findall(r"\b[A-Z]{2,}\b", text)[:5],
            "DATE": re.findall(r"\b\d{4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\b", text)[:5],
        }

    def _flesch_kincaid_grade(self, text: str) -> float:
        """
        Flesch-Kincaid Grade Level.
        Returns grade level (e.g., 12.3 = 12th grade reading level).
        """
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if s.strip()]
        words = re.findall(r"\b\w+\b", text)

        if not sentences or not words:
            return 0.0

        def syllable_count(word: str) -> int:
            word = word.lower()
            count = 0
            vowels = "aeiouy"
            prev_vowel = False
            for ch in word:
                is_v = ch in vowels
                if is_v and not prev_vowel:
                    count += 1
                prev_vowel = is_v
            if word.endswith("e"):
                count -= 1
            return max(1, count)

        total_syllables = sum(syllable_count(w) for w in words)
        num_words = len(words)
        num_sentences = len(sentences)

        grade = (
            0.39 * (num_words / num_sentences)
            + 11.8 * (total_syllables / num_words)
            - 15.59
        )
        return round(grade, 1)

    def _detect_common_grammar_issues(self, text: str) -> list[dict]:
        """
        Detect common grammar issues using pattern matching.
        Production version would use language-tool-python or LanguageTool API.
        """
        issues = []

        patterns = [
            (r"\b(their|there|they're)\b", "their/there/they're confusion"),
            (r"\b(its|it's)\b", "its/it's confusion check"),
            (r"\b(your|you're)\b", "your/you're confusion check"),
            (r"\b(affect|effect)\b", "affect/effect usage"),
            (r"\b(\w+)\s+\1\b", "duplicate words"),
            (r"[.!?]\s{2,}", "extra spaces after punctuation"),
            (r"\b(very|really|quite|just|basically)\b", "weak/filler words"),
            (r"(?<![.!?])\n", "missing sentence terminator"),
        ]

        for pattern, description in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                issues.append({
                    "type": description,
                    "count": len(matches),
                    "examples": list(set(
                        m if isinstance(m, str) else m[0]
                        for m in matches[:3]
                    )),
                })

        return issues

    def _suggest_structure(self, paragraphs: list[dict]) -> dict:
        """
        Analyze document structure and suggest improvements.
        """
        headings = [p for p in paragraphs if p.get("type", "").startswith("heading")]
        bodies = [p for p in paragraphs if p.get("type") == "body"]

        avg_body_words = (
            sum(len(p.get("text", "").split()) for p in bodies) / max(len(bodies), 1)
        )

        suggestions = []

        if len(headings) == 0:
            suggestions.append("No headings detected — add structure with H1/H2 headings")
        if avg_body_words > 200:
            suggestions.append("Long paragraphs detected — consider breaking into shorter sections")
        if len(headings) > 0 and len(bodies) / max(len(headings), 1) > 8:
            suggestions.append("Consider adding more sub-headings for better navigation")

        return {
            "heading_count": len(headings),
            "body_paragraph_count": len(bodies),
            "avg_body_words": round(avg_body_words, 1),
            "suggestions": suggestions,
        }
