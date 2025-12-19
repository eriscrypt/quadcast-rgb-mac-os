#!/bin/bash
# Script for creating application icon

ICON_DIR="/tmp/quadcast_icon.iconset"
rm -rf "$ICON_DIR"
mkdir -p "$ICON_DIR"

# Create SVG icon of microphone
cat > /tmp/mic_icon.svg << 'SVGEOF'
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="512" height="512" rx="64" fill="#000000"/>
<path d="M238 279.909H277.273L291.455 297.727L315.455 325L346.727 362.818H302L279.818 337L264.909 315.545L238 279.909ZM346.364 255.909C346.364 276.636 342.333 294.121 334.273 308.364C326.212 322.545 315.333 333.303 301.636 340.636C287.939 347.909 272.667 351.545 255.818 351.545C238.848 351.545 223.515 347.879 209.818 340.545C196.182 333.152 185.333 322.364 177.273 308.182C169.273 293.939 165.273 276.515 165.273 255.909C165.273 235.182 169.273 217.727 177.273 203.545C185.333 189.303 196.182 178.545 209.818 171.273C223.515 163.939 238.848 160.273 255.818 160.273C272.667 160.273 287.939 163.939 301.636 171.273C315.333 178.545 326.212 189.303 334.273 203.545C342.333 217.727 346.364 235.182 346.364 255.909ZM294.364 255.909C294.364 244.758 292.879 235.364 289.909 227.727C287 220.03 282.667 214.212 276.909 210.273C271.212 206.273 264.182 204.273 255.818 204.273C247.455 204.273 240.394 206.273 234.636 210.273C228.939 214.212 224.606 220.03 221.636 227.727C218.727 235.364 217.273 244.758 217.273 255.909C217.273 267.061 218.727 276.485 221.636 284.182C224.606 291.818 228.939 297.636 234.636 301.636C240.394 305.576 247.455 307.545 255.818 307.545C264.182 307.545 271.212 305.576 276.909 301.636C282.667 297.636 287 291.818 289.909 284.182C292.879 276.485 294.364 267.061 294.364 255.909Z" fill="white"/>
</svg>
SVGEOF

# Output directory (default to build/)
OUTPUT_DIR="${1:-build}"

# First create a base 1024x1024 PNG from SVG using qlmanage (works on macOS)
qlmanage -t -s 1024 -o /tmp /tmp/mic_icon.svg > /dev/null 2>&1

# If qlmanage worked, rename the file
if [ -f /tmp/mic_icon.svg.png ]; then
  mv /tmp/mic_icon.svg.png "$ICON_DIR/icon_1024x1024.png"
else
  # Fallback: try using sips to convert SVG directly to PNG
  sips -s format png /tmp/mic_icon.svg --out "$ICON_DIR/icon_1024x1024.png" -z 1024 1024 > /dev/null 2>&1
fi

# If we still don't have the base image, exit
if [ ! -f "$ICON_DIR/icon_1024x1024.png" ]; then
  echo "❌ Error: Could not create base PNG from SVG"
  exit 1
fi

# Create PNG files of different sizes from the 1024x1024 base
for size in 16 32 64 128 256 512; do
  sips -z $size $size "$ICON_DIR/icon_1024x1024.png" --out "$ICON_DIR/icon_${size}x${size}.png" > /dev/null 2>&1
done

# Create Retina versions
for size in 16 32 128 256 512; do
  size2=$((size * 2))
  cp "$ICON_DIR/icon_${size2}x${size2}.png" "$ICON_DIR/icon_${size}x${size}@2x.png" 2>/dev/null
done

# Create .icns file
iconutil -c icns "$ICON_DIR" -o "$OUTPUT_DIR/appicon.icns"

if [ $? -eq 0 ]; then
  echo "✅ Icon created: $OUTPUT_DIR/appicon.icns"
else
  echo "❌ Error creating icns"
  exit 1
fi

# Copy 1024x1024 PNG as appicon.png for Wails
cp "$ICON_DIR/icon_1024x1024.png" "$OUTPUT_DIR/appicon.png"
echo "✅ PNG created: $OUTPUT_DIR/appicon.png"

# Remove temporary files
rm -rf "$ICON_DIR" /tmp/mic_icon.svg
