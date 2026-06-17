#!/bin/bash
# Usage: ./scripts/add-image-question.sh <image-file> <raw-json-file>
# Example: ./scripts/add-image-question.sh ~/Downloads/chest-xray.jpg src/data/raw/radiology-image-style.json
#
# Uploads image to ImageKit under /neet-pg/image-questions/
# Prints the imageUrl to add to your question JSON entry.

IMAGE="$1"
if [ -z "$IMAGE" ]; then
  echo "Usage: $0 <image-file> [raw-json-file]"
  exit 1
fi

FILENAME=$(basename "$IMAGE")
echo "Uploading $FILENAME to ImageKit /neet-pg/image-questions/ ..."

python3 /Users/ruthlessravan/.claude/skills/upload-files/resources/upload.py \
  "$IMAGE" \
  --folder "/neet-pg/image-questions" \
  --file-name "$FILENAME"

echo ""
echo "Add the returned URL as \"imageUrl\" in your question JSON:"
echo '  { "subject": "...", "stem": "...", "imageUrl": "<paste URL here>", ... }'
echo ""
echo "Then run: node build-data.mjs"
