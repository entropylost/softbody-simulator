use nalgebra::Vector2;
pub mod constants;
mod map;
pub use map::*;
mod world;
pub use world::*;

#[repr(u8)]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum ParticleType {
    Nothing = 0,
    Normal = 1,
    Fixed = 2,
    NoCollision = 3,
}

impl Default for ParticleType {
    fn default() -> Self {
        Self::Nothing
    }
}

#[derive(Copy, Clone, Debug, Default, PartialEq)]
pub struct Particle {
    ty: ParticleType,
    position: Vector2<f32>,
    velocity: Vector2<f32>,
    ortho_connections: [usize; 4],
    diag_connections: [usize; 4],
}
