use console::Term;
use cpu::constants::{FRAME_TIME, NUM_FRAMES_PER_FULL_UPDATE};
use cpu::*;
use nalgebra::Vector2;

fn main() {
    let map = Map::from_file("../assets/start-collision.map");
    let mut world = World::new(&map);
    let term = Term::stdout();
    let mut frames = 0;
    loop {
        for _ in 0..6 {
            frames += NUM_FRAMES_PER_FULL_UPDATE;
            world.full_update();
        }
        term.clear_screen().unwrap();
        println!("{}", world.ascii_render(Vector2::new(4, 8)));
        println!("Time: {}", frames as f32 * FRAME_TIME / 1000.0);
    }
}
