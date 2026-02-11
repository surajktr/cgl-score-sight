#!/bin/bash
set -e

echo "Removing any corrupted lock files..."
rm -f package-lock.json npm-shrinkwrap.json

echo "Installing fresh dependencies..."
npm install

echo "Dependencies fixed successfully!"
