#!/usr/bin/env bash
# Downloads third-party CCA-F reference material into references/sources/ (gitignored).
# See references/README.md for the catalog and licensing note.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/sources"
mkdir -p "$DIR"

fetch() {
  local url="$1" out="$2"
  if curl -fsSL -o "$DIR/$out" "$url"; then
    echo "ok   $out"
  else
    echo "FAIL $out  ($url)" >&2
  fi
}

fetch "https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F8lsy243ftffjjy1cx9lm3o2bw%2Fpublic%2F1773274827%2FClaude+Certified+Architect+%E2%80%93+Foundations+Certification+Exam+Guide.pdf" "cca-f-exam-guide.pdf"
fetch "https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F8lsy243ftffjjy1cx9lm3o2bw%2Fpublic%2F1773276532%2FClaude+Certified+Architect+-+Foundations+%28CCA-F%29+FAQs+%281%29.pdf" "cca-f-faqs.pdf"
fetch "https://raw.githubusercontent.com/paullarionov/claude-certified-architect/d45ac4d40e22b4b5d0b06ef853ecd746ae399977/guide_en.MD" "paullarionov-guide_en.md"

echo
echo "Note: the X/Twitter article is JS-rendered/auth-gated — save it manually into:"
echo "  $DIR/hooeem-article.md"
echo "  https://x.com/hooeem/article/2033198345045336559"
