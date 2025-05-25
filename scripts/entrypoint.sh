#!/bin/sh
set -e

echo "💡 Container starting..."
echo "📂 Directory structure:"
find /app -maxdepth 2 -type d | sort

# Check for compiled files
if [ -f "/app/dist/index.js" ]; then
  echo "✅ Found compiled index.js, starting application..."
  exec node dist/index.js
elif [ -f "/app/src/index.js" ]; then
  echo "⚠️ Found source index.js but not compiled. Attempting to use source directly..."
  exec node src/index.js
elif [ -f "/app/src/index.ts" ]; then
  echo "⚠️ Found TypeScript source but not compiled. Attempting to compile first..."
  npm run build
  if [ -f "/app/dist/index.js" ]; then
    echo "✅ Compilation successful, starting application..."
    exec node dist/index.js
  else
    echo "❌ Compilation failed, no runnable code found."
    exit 1
  fi
else
  echo "❌ No runnable code found!"
  echo "Available files:"
  find /app -name "*.js" | grep -v "node_modules" | sort
  exit 1
fi
