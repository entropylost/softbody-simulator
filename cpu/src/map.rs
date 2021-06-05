use crate::ParticleType;
use array2d::Array2D;
use nalgebra::Vector2;
use std::path::Path;

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
