use std::io::Write;
use std::fs::File;
use image::io::Reader;
use anyhow::Result;

#[repr(C)]
struct Size {
    width: u32,
    height: u32,
}

fn main() -> Result<()> {
    let args = std::env::args().collect::<Vec<String>>();
    if args.len() != 3 {
        println!("Invalid number of arguments.
Usage:
> create /path/to/image.png /path/to/out.map

The image should consist of only white and black pixels.
");
    }
    let image = Reader::open(&args[1])?.decode()?.to_rgb8();
    let mut output = Vec::<u8>::new();
    unsafe {
        output.extend(std::mem::transmute::<_, [u8; 8]>(Size {
            width: image.width(),
            height: image.height(),
        }).iter().cloned());
    }
    for p in image.pixels() {
        let p = p.0;
        if p[0] != p[1] || p[1] != p[2] || p[2] != p[0] {
            println!("Pixel colors are not equal.");
            return Ok(());
        }
        let p = p[0];
        if p != 255 && p != 0 {
            println!("Pixel is not fully white or fully black.");
            return Ok(());
        }
        if p == 255 {
            output.push(1);
        } else {
            output.push(0);
        }
    }

    File::create(&args[2])?.write_all(&output)?;

    Ok(())
}
