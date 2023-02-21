#[derive(Debug, Clone)]
pub struct Point {
    pub x: f32,
    pub y: f32
}

impl Point {
    pub fn new(in_x: f32, in_y: f32) -> Point {
        Point{ x: in_x, y: in_y}
    }
}