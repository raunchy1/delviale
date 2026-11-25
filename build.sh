#!/bin/sh
cd "$(dirname "$0")" && (cat src/fonts.css; echo; cat src/main.css) > style.css
