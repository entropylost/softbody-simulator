# Softbody Simulator

This is a gpu softbody simulator using webgl2.

## Data

The world will be divided into individual "Particles". Each "Particle" will have an ID (array index), and the following values:

* Deleted: u8
* Position: i32x2
* Velocity: i32x2
* Connections:
  - Orthagonal (u32x4)
  - Diagonal (u32x4)

Any 0 values in the Connections will be ignored, as the zeroth particle will always be deleted.

## Current Physics Simulation Method

At each physics step (600 steps per second), the simulator iterates over all the particles, and applies a force equal to (where c is the connection length, and d is the distance):

```
d^2 / c^2 - c^2 / d^2
```

This makes the softbodies much harder to compress.
