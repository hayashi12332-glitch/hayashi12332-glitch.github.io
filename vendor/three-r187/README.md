# Three.js r187 for the blockout world

These files are the unmodified ES modules from `three@0.187.0`, published by
the Three.js project under the MIT license. They are used only by
`/blockout/index.html`. The original street continues to use its own r180
modules. The matching r187 license is in `dist/licenses/Three-r187-MIT.txt`.

Source: https://registry.npmjs.org/three/-/three-0.187.0.tgz

The source tarball was verified against the registry's SHA-512 integrity value:
`sha512-Qiu7R+Cmh8CstZsY1uJOSWnVlfo7ZtNLV7mF8Jltk3LB3AtDu9cRZlcnRKkAk8Y4z6KKw35z7Y7Urd7jWY8etA==`.
Its SHA-256 is `ff540832ded0cfe919764d24a3d88f3e2a05f23303f876423e4f893841e90728`.

Only the runtime and the modules needed by the existing GLTFLoader and Sky
are included. `SkeletonUtils` is a direct dependency of r187 GLTFLoader;
it is not interchangeable with r180's corresponding addons.
