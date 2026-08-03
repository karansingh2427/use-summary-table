#!/usr/bin/env sh
set -eu

# Downloads the local OCR dependency used by app/index.html (R15).
# Usage:
#   sh app/vendor/install-tesseract.sh

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
OUT="$SCRIPT_DIR/tesseract.min.js"
URL="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"

echo "Downloading $URL"
curl -fL "$URL" -o "$OUT"
echo "Saved $OUT"
