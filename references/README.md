# Reference material

Primary sources for authoring CCA-F practice questions. When an agent generates
new questions it should (a) match the question schema documented in the root
`CLAUDE.md`, and (b) ground content in these sources rather than inventing facts.

## Sources

| # | Source | Type | Local file |
|---|--------|------|------------|
| 1 | CCA-F – Foundations Certification **Exam Guide** (Anthropic) | PDF | `sources/cca-f-exam-guide.pdf` |
| 2 | CCA-F – Foundations **FAQs** (Anthropic) | PDF | `sources/cca-f-faqs.pdf` |
| 3 | CCA-F study **article** by @hooeem (X) | web | `sources/hooeem-article.*` (manual) |
| 4 | `paullarionov/claude-certified-architect` **guide_en.MD** | markdown | `sources/paullarionov-guide_en.md` |

URLs:

1. https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F8lsy243ftffjjy1cx9lm3o2bw%2Fpublic%2F1773274827%2FClaude+Certified+Architect+%E2%80%93+Foundations+Certification+Exam+Guide.pdf
2. https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F8lsy243ftffjjy1cx9lm3o2bw%2Fpublic%2F1773276532%2FClaude+Certified+Architect+-+Foundations+%28CCA-F%29+FAQs+%281%29.pdf
3. https://x.com/hooeem/article/2033198345045336559
4. https://github.com/paullarionov/claude-certified-architect/blob/d45ac4d40e22b4b5d0b06ef853ecd746ae399977/guide_en.MD

## Fetching

```bash
bash references/fetch-sources.sh
```

Downloads sources 1, 2, and 4 into `sources/`. Source 3 (X article) is
JS-rendered / auth-gated and cannot be fetched headlessly — save it manually into
`sources/` as `hooeem-article.md` or `.pdf`.

## Licensing note

`sources/` is **gitignored**. Sources 1 and 2 are Anthropic copyrighted material
kept locally for authoring reference only — do not commit or republish them. This
project ships only original, independently written questions in the style of the
guide; it contains no real exam questions.
