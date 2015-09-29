#!/bin/bash

closure-library/closure/bin/build/closurebuilder.py \
    --root="closure-library/" \
    --root="js/" \
    --namespace="poker.boot" \
    --namespace="poker.controllers" \
    --output_mode=compiled \
    --output_file="generated/compiled.js" \
    --compiler_jar="compiler.jar"
 

closure-library/closure/bin/build/depswriter.py --root_with_prefix="js ../../js/" > generated/deps.js
