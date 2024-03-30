#!/bin/bash

# Yes, this is primitive, I know.

python2.7 static/lib/google-closure-library/closure/bin/build/closurebuilder.py \
    --root="static/lib/google-closure-library/" \
    --root="js/" \
    --namespace="poker.boot" \
    --namespace="poker.controllers" \
    --output_mode=compiled \
    --output_file="static/generated/compiled.js" \
    --compiler_jar="compiler.jar" \
    --compiler_flags=--language_in=ECMASCRIPT_2017


static/lib/google-closure-library/closure/bin/build/depswriter.py \
    --root_with_prefix="js ../../../../js/" > static/generated/deps.js


sass -Istatic/lib --style compressed css/main.scss static/generated/main.css
