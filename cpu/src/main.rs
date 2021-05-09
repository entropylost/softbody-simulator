use cpu::*;
use nalgebra::Vector2;
use console::Term;

fn main() {
    let map = Map::from_file("../assets/start.map");
    let mut world = World::new(&map);
    let term = Term::stdout();
    loop {
        for i in 0..100 {
            world.physics_update();
        }
        world.update_pixels();
        term.clear_screen();
        println!("{}", world.ascii_render(Vector2::new(8, 16)));
    }
}
