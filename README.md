## What is it

This repository contains source codes for the article on [Habr](https://habr.com) (non-published) about different methods to build wasm-module from c++, AssemblyScript and Rust. These modules build the Delaunay triangulation of the plain. We use a port of [this](https://github.com/darkskyapp/delaunay-fast) algorithm.

## How to build

### c++

It requires [Emscripten](https://emscripten.org/)

Create directory ```\output\libs\``` to store temporary build files. Next build object files

```
emcc .\delaunay.cpp -o output\libs\delaunay.o -c
emcc .\bvh.cpp -o output\libs\bvh.o -c
```

Finally, build the module

```
emcc .\delaunay_api.cpp output\libs\delaunay.o output\libs\bvh.o -o output/delaunay.js -lembind -s MODULARIZE -s EXPORT_NAME=delaunay -s ALLOW_MEMORY_GROWTH=1 -Oz
```


### AssemblyScript

It requires [AssemblyScript](https://www.assemblyscript.org/)

```
asc assembly/delaunay_api.ts -o build/delaunay.wasm --bindings esm -O --converge --noAssert --uncheckedBehavior always
```

### Rust

It requires [wasm-pack](https://github.com/rustwasm/wasm-pack)

```
wasm-pack build
```

## Example application

[Here](https://tugcga.github.io/web_apps/delaunay_demo/) is an example applicarion, which use the module from the Rust.

## Python integration

```./python_wasm/delaunay_wasm.py``` contains an example of the Python class, which loads the module from the Rust by using [Wasmer](https://github.com/wasmerio/wasmer-python).
