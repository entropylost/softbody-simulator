use cpu::*;
use nalgebra::Vector2;

fn main() {
    let map = Map::from_file("../assets/start.map");
    println!("{:?}", map.get(map.half_size + Vector2::new(-1, -1)));
    println!(
        "{:?}",
        map.get(map.half_size.component_mul(&Vector2::new(-1, 1)) + Vector2::new(1, -1))
    );
    println!(
        "{:?}",
        map.get(map.half_size.component_mul(&Vector2::new(1, -1)) + Vector2::new(-1, 1))
    );
    let mut world = World::new(&map);
    world.update_pixels();
    println!("{}", world.ascii_render(Vector2::new(8, 16)));
    // println!("{:?}", world);
}
