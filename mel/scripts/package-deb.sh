#!/bin/bash
# Debian/Ubuntu package builder for Mel

set -e

VERSION=${1:-"1.0.0"}
PACKAGE_NAME="mel"
ARCH="amd64"

echo "Building Debian package for Mel v${VERSION}"

# Create package directory structure
mkdir -p release/packages/debian
cd release/packages/debian

# Create control directory
mkdir -p ${PACKAGE_NAME}_${VERSION}_${ARCH}/DEBIAN
mkdir -p ${PACKAGE_NAME}_${VERSION}_${ARCH}/usr/lib/geany
mkdir -p ${PACKAGE_NAME}_${VERSION}_${ARCH}/etc/mel
mkdir -p ${PACKAGE_NAME}_${VERSION}_${ARCH}/usr/share/doc/${PACKAGE_NAME}

# Create control file
cat > ${PACKAGE_NAME}_${VERSION}_${ARCH}/DEBIAN/control << EOF
Package: ${PACKAGE_NAME}
Version: ${VERSION}
Section: development
Priority: optional
Architecture: ${ARCH}
Depends: geany (>= 1.38), libgtk-3-0, libsqlite3-0, libcurl4, libjson-c5
Maintainer: dealappseo <support@melchizedekai.com>
Description: Adaptive AI Assistant for Geany
 Mel is an adaptive AI assistant that learns your coding patterns
 and provides personalized suggestions within the Geany IDE.
 .
 Features include offline operation, multi-provider AI support,
 and privacy-first design.
Homepage: https://melchizedekai.com
EOF

# Copy files
cp ../../../mel.so ${PACKAGE_NAME}_${VERSION}_${ARCH}/usr/lib/geany/
cp ../../../config/default_config.json ${PACKAGE_NAME}_${VERSION}_${ARCH}/etc/mel/config.json
cp ../../../README.md ${PACKAGE_NAME}_${VERSION}_${ARCH}/usr/share/doc/${PACKAGE_NAME}/
cp ../../../LICENSE ${PACKAGE_NAME}_${VERSION}_${ARCH}/usr/share/doc/${PACKAGE_NAME}/

# Set permissions
chmod 755 ${PACKAGE_NAME}_${VERSION}_${ARCH}/DEBIAN
chmod 644 ${PACKAGE_NAME}_${VERSION}_${ARCH}/DEBIAN/control

# Build package
dpkg-deb --build ${PACKAGE_NAME}_${VERSION}_${ARCH}

echo "Debian package created: ${PACKAGE_NAME}_${VERSION}_${ARCH}.deb"