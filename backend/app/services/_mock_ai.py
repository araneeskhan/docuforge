"""
Mock AI formatting result generator.
Used as a fallback when OPENAI_API_KEY is not configured.
"""
from app.models.schemas import (
    AIFormattingResult,
    FormattedParagraph,
    ParsedDocument,
    ParagraphType,
)

def create_mock_result(parsed_doc: ParsedDocument) -> AIFormattingResult:
    """
    Creates a mock AIFormattingResult by passing through the original text
    with basic simulated improvements.
    """
    formatted_paragraphs = []
    total_errors = 0
    
    for p in parsed_doc.paragraphs:
        # Simulate some grammar fixes
        corrections = []
        text = p.text
        if len(text) > 20 and "  " in text:
            text = text.replace("  ", " ")
            corrections.append("Removed double spaces")
            total_errors += 1
            
        formatted_paragraphs.append(
            FormattedParagraph(
                index=p.index,
                original_text=p.text,
                formatted_text=text,
                type=p.type,
                grammar_corrections=corrections,
                style_suggestions=["Consider using more active voice"] if len(text) > 100 else []
            )
        )
    
    # Extract title
    title = parsed_doc.file_name.rsplit(".", 1)[0]
    for p in formatted_paragraphs:
        if p.type in (ParagraphType.HEADING_1, ParagraphType.HEADING_2):
            title = p.formatted_text
            break
            
    # Build TOC entries
    toc_entries = [
        {
            "text": p.formatted_text,
            "level": int(p.type.value.split("_")[1]) if p.type.value.startswith("heading_") else 0
        }
        for p in formatted_paragraphs if p.type.value.startswith("heading_")
    ]
    
    return AIFormattingResult(
        title=title,
        paragraphs=formatted_paragraphs,
        toc_entries=toc_entries,
        suggestions=[
            "Document structure looks good.",
            "Consider adding an executive summary.",
            "Ensure consistent terminology throughout."
        ],
        readability_score=75,
        grammar_errors_fixed=total_errors,
        detected_style="Professional"
    )
