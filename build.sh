#!/bin/bash

echo "🚀 Building QuadCast RGB Controller..."
echo ""

# Check for wails
if ! command -v wails &> /dev/null; then
    echo "❌ Wails is not installed. Install it:"
    echo "   go install github.com/wailsapp/wails/v2/cmd/wails@latest"
    exit 1
fi

# Build
echo "📦 Compiling application..."
wails build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    echo "📂 Ready application is located at:"
    echo "   build/bin/quadcast-ui.app"
    echo ""
    echo "💡 To launch:"
    echo "   open build/bin/quadcast-ui.app"
    echo ""
    echo "⚠️  Don't forget to install quadcastrgb:"
    echo "   brew install quadcastrgb"
else
    echo ""
    echo "❌ Build error"
    exit 1
fi
