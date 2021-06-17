use anyhow::Result;
use cpu::ParticleType;
use image::io::Reader;
use image::Rgb;
use std::fs::File;
use std::io::Write;

#[repr(C)]
struct Size {
    width: u32,
    height: u32,
}

fn from_color(c: Rgb<u8>) -> ParticleType {
    let c = c.0;
    match c {
        [0, 0, 0] => ParticleType::Nothing,
        [255, 255, 255] => ParticleType::Normal,
        [255, 0, 0] => ParticleType::Fixed,
        [0, 0, 255] => ParticleType::NoCollision,
        _ => panic!("Invalid pixel color: {:?}", c),
    }
}

fn main() -> Result<()> {
    let args = std::env::args().collect::<Vec<String>>();
    if args.len() != 3 {
        println!(
            "Invalid number of arguments.
Usage:
> create /path/to/image.png /path/to/out.map
"
        );
    }
    let image = Reader::open(&args[1])?.decode()?.to_rgb8();
    let mut output = Vec::<u8>::new();
    unsafe {
        output.extend(
            std::mem::transmute::<_, [u8; 8]>(Size {
                width: image.width(),
                height: image.height(),
            })
            .iter()
            .cloned(),
        );
    }
    for c in image.pixels() {
        output.push(from_color(*c) as u8);
    }

    File::create(&args[2])?.write_all(&output)?;

    println!("Successfully wrote map to `{}`.", args[2]);

    Ok(())
}
