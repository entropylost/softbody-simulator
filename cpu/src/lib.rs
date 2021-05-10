use array2d::Array2D;
use arrayvec::ArrayVec;
use multimap::MultiMap;
use na::Vector2;
use nalgebra as na;
use std::collections::HashMap;
use std::convert::TryInto;
use std::f32::consts::SQRT_2;
use std::ops::Deref;
use std::path::Path;

pub mod constants;
use constants::*;

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

#[derive(Clone, Debug)]
pub struct Map {
    size: Vector2<u32>,
    pub half_size: Vector2<i32>,
    pub elements: Array2D<ParticleType>,
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
        let elements = Array2D::from_column_major(
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
                let attempt_connect = |connections: &mut ArrayVec<usize, 4>, dx: i32, dy: i32| {
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
                    ty: pt,
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

    pub fn update_physics(&mut self) {
        self.particles = self
            .particles
            .iter()
            .map(|p| {
                let mut p = *p;
                let connection_force = |connection: &mut usize,
                                        connection_length: f32,
                                        position: Vector2<f32>,
                                        velocity: Vector2<f32>|
                 -> Vector2<f32> {
                    let other_particle = self.particles[*connection];
                    if other_particle.ty == ParticleType::Nothing {
                        return Vector2::zeros();
                    }
                    let Particle {
                        position: other_position,
                        velocity: other_velocity,
                        ..
                    } = other_particle;
                    let delta_position = other_position - position;
                    let delta_velocity = other_velocity - velocity;
                    let length = delta_position.magnitude();
                    let direction = delta_position / length;
                    let mut length_ratio_sq = length / connection_length;
                    length_ratio_sq *= length_ratio_sq;
                    let force_mag = (length_ratio_sq - 1.0 / length_ratio_sq) * SPRING_CONSTANT
                        + delta_velocity.dot(&direction) * DAMPING_CONSTANT;
                    if length >= BREAKING_DISTANCE * connection_length {
                        *connection = 0;
                    }
                    return force_mag * direction;
                };
                let mut force = Vector2::new(0.0, -GRAVITY);
                force -= p.velocity * AIR_FRICTION;
                force += connection_force(&mut p.ortho_connections[0], 1.0, p.position, p.velocity);
                force += connection_force(&mut p.ortho_connections[1], 1.0, p.position, p.velocity);
                force += connection_force(&mut p.ortho_connections[2], 1.0, p.position, p.velocity);
                force += connection_force(&mut p.ortho_connections[3], 1.0, p.position, p.velocity);
                force +=
                    connection_force(&mut p.diag_connections[0], SQRT_2, p.position, p.velocity);
                force +=
                    connection_force(&mut p.diag_connections[1], SQRT_2, p.position, p.velocity);
                force +=
                    connection_force(&mut p.diag_connections[2], SQRT_2, p.position, p.velocity);
                force +=
                    connection_force(&mut p.diag_connections[3], SQRT_2, p.position, p.velocity);
                if p.ty != ParticleType::Fixed {
                    p.velocity += force * FRAME_TIME;
                    p.position += p.velocity * FRAME_TIME;
                }
                if p.position.x.abs() > self.half_size.x {
                    p.velocity.x *= WORLD_COLLISION_RESPONSE;
                }
                if p.position.y.abs() > self.half_size.y {
                    p.velocity.y *= WORLD_COLLISION_RESPONSE;
                }
                p
            })
            .collect();
    }

    pub fn update_pixels(&mut self) {
        self.particles_per_pixel.clear();
        for p in &self.particles {
            if p.ty == ParticleType::Nothing {
                continue;
            }
            if p.position.x.abs() > self.half_size.x || p.position.y.abs() > self.half_size.y {
                continue;
            }
            self.particles_per_pixel
                .insert(Vector2::new(p.position.x as i32, p.position.y as i32), *p);
        }
    }

    pub fn update_collision(&mut self) {
        for p in &mut self.particles {
            let pixel = Vector2::new(p.position.x as i32, p.position.y as i32);
            let mut apply_collision = |p2: Particle| {
                if (p.position - p2.position).magnitude() <= 2.0 * PARTICLE_RADIUS {
                    p.velocity += (p.position - p2.position) * COLLISION_RESPONSE;
                }
            };
            let offset = [-1, 0, 1];
            for dx in offset.iter() {
                for dy in offset.iter() {
                    if let Some(colliders) = self
                        .particles_per_pixel
                        .get_vec(&(pixel + Vector2::new(*dx, *dy)))
                    {
                        for p2 in colliders {
                            apply_collision(*p2);
                        }
                    }
                }
            }
        }
    }

    pub fn full_update(&mut self) {
        for _ in 0..NUM_FRAMES_PER_FULL_UPDATE {
            self.update_physics();
        }
        self.update_pixels();
        self.update_collision();
    }

    pub fn ascii_render(&self, pixel_size: Vector2<i32>) -> String {
        let pixel_volume = pixel_size.x * pixel_size.y;
        let mut res = String::new();
        for y in ((-self.half_size.y as i32 / pixel_size.y)
            ..(self.half_size.y as i32 / pixel_size.y))
            .rev()
        {
            for x in
                (-self.half_size.x as i32 / pixel_size.x)..(self.half_size.x as i32 / pixel_size.x)
            {
                let mut particle_count = 0;
                for i in 0..pixel_size.x {
                    for j in 0..pixel_size.y {
                        let pos = Vector2::new(x * pixel_size.x + i, y * pixel_size.y + j);
                        if self.particles_per_pixel.contains_key(&pos) {
                            particle_count += 1;
                        }
                    }
                }
                let density = particle_count as f32 / pixel_volume as f32;
                let mut fill = ' ';
                if density > 0.0 {
                    fill = '░';
                }
                if density > 0.25 {
                    fill = '▒';
                }
                if density > 0.5 {
                    fill = '▓';
                }
                if density > 0.75 {
                    fill = '█';
                }
                res.push(fill);
            }
            res.push('\n');
        }
        res
    }
}
