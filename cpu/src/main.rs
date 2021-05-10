use console::Term;
use cpu::constants::{FRAME_TIME, NUM_FRAMES_PER_FULL_UPDATE};
use cpu::*;
use nalgebra::Vector2;
use std::process::Command;

fn main() {
    let args = std::env::args().collect::<Vec<String>>();
    let map = Map::from_file(&args[1]);
    let max_frames = (args[2].parse::<f32>().unwrap() * 1000.0 / FRAME_TIME) as u32;
    let term = Term::stdout();
    std::fs::remove_file("./out.gif").unwrap_or(());
    std::fs::remove_dir_all("./frames").unwrap_or(());
    std::fs::create_dir("./frames").unwrap();
    term.clear_screen().unwrap();

    let mut world = World::new(&map);
    let mut frames = 0;
    while frames < max_frames {
        for _ in 0..5 {
            for _ in 0..6 {
                frames += NUM_FRAMES_PER_FULL_UPDATE;
                world.full_update();
            }
            term.move_cursor_to(0, 0).unwrap();
            println!("{}", world.ascii_render(Vector2::new(4, 8)));
            term.clear_to_end_of_screen().unwrap();
            println!("Time: {}", frames as f32 * FRAME_TIME / 1000.0);
        }
        world.image_render(format!("./frames/image-{:0>5}.png", frames));
    }
    // Create gif
    Command::new("ffmpeg")
        .args(&[
            "-pattern_type",
            "glob",
            "-framerate",
            "10",
            "-i",
            "frames/*.png",
            "out.gif",
        ])
        .spawn()
        .expect("Unable to create gif using ffmpeg");
}
