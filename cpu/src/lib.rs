use std::collections::HashMap;
use array2d::Array2D;
use arrayvec::ArrayVec;
use multimap::MultiMap;
use na::Vector2;
use nalgebra as na;
use std::convert::TryInto;
use std::ops::Deref;
use std::path::Path;

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
    pt: ParticleType,
    position: Vector2<f32>,
    velocity: Vector2<f32>,
    ortho_connections: [u32; 4],
    diag_connections: [u32; 4],
}

#[derive(Clone, Debug)]
pub struct Map {
    size: Vector2<u32>,
    pub half_size: Vector2<i32>,
    elements: Array2D<ParticleType>,
}
impl Map {
    pub fn from_file(file: impl AsRef<Path>) -> Self {
        let bytevec = std::fs::read(file).unwrap();
        if bytevec.len() <= 8 {
            panic!("Invalid map.");
        }
        let size = unsafe {
            let u32bytes = std::mem::transmute::<_, &[u32]>(&bytevec[..]);
            Vector2::new(u32bytes[0], u32bytes[1])
        };
        let elements = Array2D::from_row_major(
            unsafe { std::mem::transmute(&bytevec[8..]) },
            size.x as usize,
            size.y as usize,
        );
        let half_size = (size / 2).cast();
        Map {
            size,
            half_size,
            elements,
        }
    }
    pub fn get(&self, position: Vector2<i32>) -> ParticleType {
        let position = position + self.half_size;
        if position.x < 0
            || position.y < 0
            || position.x >= self.size.x as i32
            || position.y >= self.size.y as i32
        {
            return ParticleType::Nothing;
        }
        return self.elements[(
            position.x as usize,
            (self.size.y - 1 - position.y as u32) as usize,
        )];
    }
    pub fn num_particles(&self) -> u32 {
        let mut num_particles = 0;
        for pt in self.elements.elements_row_major_iter() {
            if *pt != ParticleType::Nothing {
                num_particles += 1;
            }
        }
        return num_particles;
    }
    pub fn for_each(&self, mut f: impl FnMut(Vector2<i32>, ParticleType)) {
        for x in 0..self.size.x {
            for y in 0..self.size.y {
                let position = Vector2::new(x, y).cast() - self.half_size;
                f(position, self.get(position));
            }
        }
    }
}

#[derive(Clone, Debug)]
pub struct World {
    particles: Vec<Particle>,
    particles_per_pixel: MultiMap<Vector2<i32>, Particle>,
    half_size: Vector2<f32>,
}

impl World {
    pub fn new(map: &Map) -> Self {
        let mut world = World {
            particles: vec![Default::default(); (map.num_particles() + 1) as usize],
            particles_per_pixel: Default::default(),
            half_size: map.half_size.cast(),
        };
        let mut id_map = HashMap::new();
        {
            let mut particle_id = 1;
            map.for_each(|pos, pt| {
                if pt == ParticleType::Nothing {
                    return;
                }
                id_map.insert(pos, particle_id);
                particle_id += 1;
            })
        }
        {
            let mut particle_id = 1;
            map.for_each(|pos, pt| {
                if pt == ParticleType::Nothing {
                    return;
                }
                let attempt_connect = |connections: &mut ArrayVec<u32, 4>, dx: i32, dy: i32| {
                    let id = id_map.get(&(pos + Vector2::new(dx, dy)));
                    if let Some(id) = id {
                        connections.push(*id);
                    }
                };
                let ortho_connections = {
                    let mut connections = ArrayVec::from([0; 4]);
                    unsafe { connections.set_len(0) };
                    attempt_connect(&mut connections, 1, 0);
                    attempt_connect(&mut connections, -1, 0);
                    attempt_connect(&mut connections, 0, 1);
                    attempt_connect(&mut connections, 0, -1);
                    unsafe { connections.set_len(4) };
                    connections.deref().try_into().unwrap()
                };
                let diag_connections = {
                    let mut connections = ArrayVec::from([0; 4]);
                    unsafe { connections.set_len(0) };
                    attempt_connect(&mut connections, 1, 1);
                    attempt_connect(&mut connections, -1, 1);
                    attempt_connect(&mut connections, 1, -1);
                    attempt_connect(&mut connections, -1, -1);
                    unsafe { connections.set_len(4) };
                    connections.deref().try_into().unwrap()
                };
                world.particles[particle_id] = Particle {
                    pt,
                    position: pos.cast(),
                    velocity: Vector2::zeros(),
                    ortho_connections,
                    diag_connections,
                };
                particle_id += 1;
            });
        }
        world
    }
}
