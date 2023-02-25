mod point;
mod delaunay;
mod bvh;

use crate::point::Point;
use crate::delaunay::triangulate;
use crate::bvh::{BVHNode, Triangle};

use wasm_bindgen::prelude::*;
use js_sys::{Float32Array, Uint32Array};

#[wasm_bindgen]
pub fn build_triangulation(coordinates: &[f32]) -> Uint32Array {
    let points_count = coordinates.len() / 2;
    let mut points: Vec<Point> = Vec::with_capacity(points_count);
    for i in 0..points_count {
        points.push(Point::new(coordinates[2*i], coordinates[2*i + 1]));
    }

    let triangle_indices = triangulate(&points);
    let indices_length = triangle_indices.len() as u32;

    let to_return = Uint32Array::new_with_length(indices_length);
    to_return.copy_from(&triangle_indices[..]);

    to_return
}

#[derive(Debug)]
#[wasm_bindgen(js_name = BVHNode)]
pub struct BVHNodeWrapper {
    bvh: BVHNode
}

#[wasm_bindgen(js_class = BVHNode)]
impl BVHNodeWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new(coordinates: &[f32]) -> BVHNodeWrapper {
        let points_count = coordinates.len() / 2;
        let mut points: Vec<Point> = Vec::with_capacity(points_count);
        for i in 0..points_count {
            points.push(Point::new(coordinates[2*i], coordinates[2*i + 1]));
        }

        let triangle_indices = triangulate(&points);

        let mut triangles: Vec<Triangle> = Vec::with_capacity(triangle_indices.len() / 3);
        for i in 0..(triangle_indices.len() / 3) {
            let a = triangle_indices[3*i] as usize;
            let b = triangle_indices[3*i + 1] as usize;
            let c = triangle_indices[3*i + 2] as usize;
            triangles.push(Triangle::new(points[a].clone(), points[b].clone(), points[c].clone()));
        }

        BVHNodeWrapper {
            bvh: BVHNode::new(triangles)
        }
    }

    pub fn new_trianglulation(coordinates: &[f32], triangles: &[i32]) -> BVHNodeWrapper {
        let triangles_count = triangles.len() / 3;
        let mut triangles_array: Vec<Triangle> = Vec::with_capacity(triangles_count);
        for i in 0..triangles_count {
            let a = triangles[3*i] as usize;
            let b = triangles[3*i + 1] as usize;
            let c = triangles[3*i + 2] as usize;

            triangles_array.push(Triangle::new(Point::new(coordinates[2*a], coordinates[2*a + 1]), Point::new(coordinates[2*b], coordinates[2*b + 1]), Point::new(coordinates[2*c], coordinates[2*c + 1])));
        }

        BVHNodeWrapper {
            bvh: BVHNode::new(triangles_array)
        }
    }

    pub fn sample(&self, x: f32, y: f32) -> Float32Array {
        let point = Point::new(x, y);
        let s = self.bvh.sample(&point);

        match s {
            Some(t) => {
                let to_return = Float32Array::new_with_length(6);
                to_return.set_index(0, t.a.x); to_return.set_index(1, t.a.y);
                to_return.set_index(2, t.b.x); to_return.set_index(3, t.b.y);
                to_return.set_index(4, t.c.x); to_return.set_index(5, t.c.y);
                to_return
            },
            None => {
                Float32Array::new_with_length(0)
            },
        }
    }
}