use crate::constants::*;
use crate::Map;
use crate::Particle;
use crate::ParticleType;
use image::Rgb;
use image::RgbImage;
use multimap::MultiMap;
use na::Vector2;
use nalgebra as na;
use std::collections::HashMap;
use std::f32::consts::SQRT_2;
use std::path::Path;

#[derive(Clone, Debug)]
pub struct World {
    particles: Vec<Particle>,
    particles_per_pixel: MultiMap<Vector2<i32>, Particle>,
    half_size: Vector2<f32>,
}

#[derive(Copy, Clone, Debug)]
pub struct ConnectionConstants {
    pub spring: f32,
    pub damping: f32,
    pub breaking_distance: f32,
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
                let attempt_connect =
                    |dx: i32, dy: i32| *id_map.get(&(pos + Vector2::new(dx, dy))).unwrap_or(&0);
                let ortho_connections = [
                    attempt_connect(1, 0),
                    attempt_connect(-1, 0),
                    attempt_connect(0, 1),
                    attempt_connect(0, -1),
                ];
                let diag_connections = [
                    attempt_connect(1, 1),
                    attempt_connect(-1, 1),
                    attempt_connect(1, -1),
                    attempt_connect(-1, -1),
                ];
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

    pub fn update_physics(&mut self, frame_time: f32) {
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
                    p.velocity += force * frame_time;
                    p.position += p.velocity * frame_time;
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

    pub fn update_collision(&mut self, frame_time: f32) {
        for p in &mut self.particles {
            let pixel = Vector2::new(p.position.x as i32, p.position.y as i32);
            let mut apply_collision = |p2: Particle| {
                if (p.position - p2.position).magnitude() <= 2.0 * PARTICLE_RADIUS {
                    p.velocity += (p.position - p2.position) * COLLISION_RESPONSE * frame_time;
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
                        if let Some(particles) = self.particles_per_pixel.get_vec(&pos) {
                            particle_count += particles.len();
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

    pub fn image_render(&self, path: impl AsRef<Path>) {
        let mut img = RgbImage::new(self.half_size.x as u32 * 2, self.half_size.y as u32 * 2);
        for x in -self.half_size.x as i32..self.half_size.x as i32 {
            for y in -self.half_size.y as i32..self.half_size.y as i32 {
                let color = if let Some(p) = self.particles_per_pixel.get(&Vector2::new(x, y)) {
                    let mut num_connected = 0;
                    for id in p.ortho_connections.iter().chain(p.diag_connections.iter()) {
                        if *id != 0 {
                            num_connected += 1;
                        }
                    }
                    let color_value = 24 * num_connected + 63;
                    Rgb([color_value, color_value, color_value])
                } else {
                    Rgb([0, 0, 0])
                };
                img.put_pixel(
                    x as u32 + self.half_size.x as u32,
                    self.half_size.y as u32 - 1 - y as u32,
                    color,
                );
            }
        }
        img.save(path).unwrap();
    }

    pub fn update(&mut self, frame_time: f32, subdivisions: u32) {
        let subdivided_time = frame_time / (subdivisions as f32);
        for _ in 0..subdivisions {
            self.update_physics(subdivided_time);
        }
        self.update_pixels();
        self.update_collision(frame_time);
    }
}
