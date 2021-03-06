#!/bin/bash

# Yes, this is primitive, I know.

lib/bower_components/google-closure-library/closure/bin/build/closurebuilder.py \
    --root="lib/bower_components/google-closure-library/" \
    --root="js/" \
    --namespace="poker.boot" \
    --namespace="poker.controllers" \
    --output_mode=compiled \
    --output_file="generated/compiled.js" \
    --compiler_jar="compiler.jar" \
    --compiler_flags=--language_in=ECMASCRIPT_2017
 

lib/bower_components/google-closure-library/closure/bin/build/depswriter.py \
    --root_with_prefix="js ../../../../js/" > generated/deps.js


sass -Ilib/bower_components --style compressed css/main.scss generated/main.css
