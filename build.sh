#!/bin/bash

# Yes, this is primitive, I know.

google-closure-compiler --language_in=ECMASCRIPT_2021  \
    --js="js/*" \
    --js="static/lib/google-closure-library/closure/goog/**.js" \
    --entry_point="goog:poker.boot" \
    --entry_point="goog:poker.controllers" \
    --dependency_mode=PRUNE \
    --js_output_file="static/generated/compiled.js"


sass -Istatic/lib --style compressed css/main.scss static/generated/main.css
