#!/bin/bash

# Build script for Wails v3 application
# Usage: ./build.sh [platform] [arch]
# Examples: ./build.sh linux amd64, ./build.sh darwin arm64

set -e

PLATFORM=${1:-"linux"}
ARCH=${2:-"amd64"}
UPX=${3:-"true"}

echo "Building for $PLATFORM/$ARCH"

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm ci
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Create build directory
mkdir -p build/bin

# Build Go application
echo "Building Go application..."
export GOOS=$PLATFORM
export GOARCH=$ARCH
export CGO_ENABLED=1

if [ "$PLATFORM" = "windows" ]; then
    export CC=x86_64-w64-mingw32-gcc
    export CXX=x86_64-w64-mingw32-g++
    OUTPUT="sujian.exe"
else
    OUTPUT="sujian"
fi

# Build the application
go build -ldflags="-s -w" -o build/bin/$OUTPUT main.go

# Apply UPX compression if requested
if [ "$UPX" = "true" ] && command -v upx &> /dev/null; then
    echo "Compressing with UPX..."
    upx --best --lzma build/bin/$OUTPUT
fi

# Create app bundle for macOS
if [ "$PLATFORM" = "darwin" ]; then
    echo "Creating macOS app bundle..."
    
    APP_NAME="sujian"
    if [ "$ARCH" = "arm64" ]; then
        APP_NAME="sujian-arm64"
    fi
    
    APP_DIR="build/bin/${APP_NAME}.app"
    mkdir -p "$APP_DIR/Contents/MacOS"
    mkdir -p "$APP_DIR/Contents/Resources"
    
    # Create Info.plist
    cat > "$APP_DIR/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>素笺 Sujian</string>
    <key>CFBundleExecutable</key>
    <string>sujian</string>
    <key>CFBundleIdentifier</key>
    <string>com.sujian.app</string>
    <key>CFBundleName</key>
    <string>素笺 Sujian</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF
    
    # Move executable to app bundle
    mv "build/bin/$OUTPUT" "$APP_DIR/Contents/MacOS/"
    
    # Create icon placeholder
    echo "Creating app icon placeholder..."
    # In a real project, you would add your icon here
fi

echo "Build completed successfully!"
echo "Output: build/bin/"