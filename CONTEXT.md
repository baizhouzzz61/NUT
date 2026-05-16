# NUT — English Speaking Practice

A single-user web application for English speaking practice. The user provides English audio (transcribed via AI) or English text directly; saved transcripts serve as source material for AI-generated speaking topics with example sentences.

## Domain Glossary

- **Transcript（原文）**: A saved piece of English text. Has a title, content, and source type. It is the atomic unit of stored material.
- **Audio Transcription（音频转录）**: The process of uploading an English audio file and receiving back an English transcript via Deepgram.
- **Manual Transcript（手动输入）**: A transcript entered directly as text, bypassing audio upload.
- **Topic（话题）**: An AI-generated speaking practice topic consisting of a title and a list of example sentences. Each topic tracks which transcripts were used as source material.
- **Example Sentence（例句）**: A sentence within a topic. It is either AI-generated or sourced from a transcript. Sourced sentences are linked back to their origin transcript.
- **Source Mark（来源标记）**: A label on each example sentence indicating whether it came from AI generation or a specific transcript.
- **Transcript Selection（原文勾选）**: The user selects a subset of stored transcripts before requesting topic generation. At least 50% of the resulting example sentences must be drawn from the selected transcripts.
