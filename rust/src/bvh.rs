use crate::point::Point;

fn minimum(a: f32, b: f32) -> f32 {
    if a < b { return a; } else { return b; }
}

fn maximum(a: f32, b: f32) -> f32 {
    if a < b { return b; } else { return a; }
}

#[derive(Debug, Clone)]
struct AABB {
    x_min: f32,
    y_min: f32,
    x_max: f32,
    y_max: f32,
}

#[derive(Debug, Clone)]
pub struct Triangle {
    pub a: Point,
    pub b: Point,
    pub c: Point,

    aabb: AABB,
    center: Point
}

impl Triangle {
    pub fn new(a: Point, b: Point, c: Point) -> Triangle {
        let mut x_min = f32::MAX;
        let mut y_min = f32::MAX;
        let mut x_max = f32::MIN;
        let mut y_max = f32::MIN;

        if a.x < x_min { x_min = a.x; }
        if a.x > x_max { x_max = a.x; }
        if a.y < y_min { y_min = a.y; }
        if a.y > y_max { y_max = a.y; }

        if b.x < x_min { x_min = b.x; }
        if b.x > x_max { x_max = b.x; }
        if b.y < y_min { y_min = b.y; }
        if b.y > y_max { y_max = b.y; }

        if c.x < x_min { x_min = c.x; }
        if c.x > x_max { x_max = c.x; }
        if c.y < y_min { y_min = c.y; }
        if c.y > y_max { y_max = c.y; }

        let x_c = (a.x + b.x + c.x) * (1.0 / 3.0);
        let y_c = (a.y + b.y + c.y) * (1.0 / 3.0);

        Triangle {
            a,
            b,
            c,
            aabb: AABB { x_min, y_min, x_max, y_max },
            center: Point::new(x_c, y_c)
        }
    }

    fn get_aabb(&self) -> AABB {
        self.aabb.clone()
    }

    fn get_center(&self) -> Point {
        self.center.clone()
    }

    fn is_point_inside(&self, point: &Point) -> bool {
        let as_x = point.x - self.a.x;
        let as_y = point.y - self.a.y;

        let s_ab = ((self.b.x - self.a.x) * as_y - (self.b.y - self.a.y) * as_x) > 0.0;

        if ((self.c.x - self.a.x) * as_y - (self.c.y - self.a.y) * as_x > 0.0) == s_ab {
            return false;
        }
        if ((self.c.x - self.b.x) * (point.y - self.b.y) - (self.c.y - self.b.y) * (point.x - self.b.x) > 0.0) != s_ab {
            return false;
        }
        return true;
    }
}

fn union_aabb(x: AABB, y: AABB) -> AABB {
    AABB {
        x_min: minimum(x.x_min, y.x_min),
        y_min: minimum(x.y_min, y.y_min),
        x_max: maximum(x.x_max, y.x_max),
        y_max: maximum(x.y_max, y.y_max),
    }
}

#[derive(Debug)]
pub struct BVHNode {
    triangle: Option<Triangle>,
    left_node: Option<Box<BVHNode>>,
    right_node: Option<Box<BVHNode>>,
    aabb: AABB
}

impl BVHNode {
    pub fn new(mut triangles: Vec<Triangle>) -> BVHNode {
        let objects_count = triangles.len();
        if objects_count == 1 {
            let t: Triangle = triangles.pop().unwrap();
            let aabb = t.get_aabb();
            BVHNode {
                triangle: Some(t),
                left_node: None,
                right_node: None,
                aabb: aabb
            }
        } else {
            let mut x_median: f32 = 0.0;
            let mut y_median: f32 = 0.0;

            let mut x_min = f32::MAX;
            let mut x_max = f32::MIN;
            let mut y_min = f32::MAX;
            let mut y_max = f32::MIN;

            for i in 0..objects_count {
                let t = &triangles[i];
                let c = t.get_center();
                x_median += c.x;
                y_median += c.y;

                if c.x < x_min { x_min = c.x; }
                if c.x > x_max { x_max = c.x; }
                if c.y < y_min { y_min = c.y; }
                if c.y > y_max { y_max = c.y; }
            }

            let split_axis = if (x_max - x_min) > (y_max - y_min) { 0 } else { 1 };
            let median: f32 = if split_axis == 0 { x_median / objects_count as f32 } else { y_median / objects_count as f32 };

            let mut left: Vec<Triangle> = Vec::new();
            let mut right: Vec<Triangle> = Vec::new();

            for _i in 0..objects_count {
                let t = triangles.pop().unwrap();
                let c = t.get_center();
                let v = if split_axis == 0 { c.x } else { c.y };
                if v < median {
                    left.push(t);
                } else {
                    right.push(t);
                }
            }

            if left.len() == 0 {
                left.push(right.pop().unwrap());
            }

            if right.len() == 0 {
                right.push(left.pop().unwrap());
            }

            let left_node = BVHNode::new(left);
            let right_node = BVHNode::new(right);

            let left_aabb = left_node.get_aabb();
            let right_aabb = right_node.get_aabb();

            BVHNode {
                left_node: Some(Box::new(left_node)),
                right_node: Some(Box::new(right_node)),
                triangle: None,
                aabb: union_aabb(left_aabb, right_aabb)
            }
        }
    }

    fn get_aabb(&self) -> AABB {
        self.aabb.clone()
    }

    fn is_inside_aabb(&self, point: &Point) -> bool {
        self.aabb.x_min < point.x && self.aabb.y_min < point.y && self.aabb.x_max > point.x && self.aabb.y_max > point.y
    }

    pub fn sample(&self, point: &Point) -> Option<Triangle> {
        if self.is_inside_aabb(point) {
           match &self.triangle {
                Some(t) => {
                    if t.is_point_inside(point) {
                        Some(t.clone())
                    } else {
                        None
                    }
                },
                None => {
                    match &self.left_node {
                        Some(node) => {
                            // left node exists
                            match &self.right_node {
                                Some(other) => {
                                    // left and right are exists
                                    let left_sample = node.sample(point);
                                    let right_sample = other.sample(point);

                                    match left_sample {
                                        Some(t) => {
                                            // left sample valid
                                            // check right sample
                                            match right_sample {
                                                Some(u) => {
                                                    // both right and left are valid
                                                    // it should not happens, but we select the closest triangle
                                                    let l_c = t.get_center();
                                                    let r_c = u.get_center();

                                                    let l_dist = (l_c.x - point.x)*(l_c.x - point.x) + (l_c.y - point.y)*(l_c.y - point.y);
                                                    let r_dist = (r_c.x - point.x)*(r_c.x - point.x) + (r_c.y - point.y)*(r_c.y - point.y);

                                                    if l_dist < r_dist {
                                                        Some(t)
                                                    } else {
                                                        Some(u)
                                                    }
                                                },
                                                None => {
                                                    // left valid, right empty
                                                    Some(t)
                                                },
                                            }
                                        },
                                        None => {
                                            // left sample empty
                                            right_sample
                                        },
                                    }
                                },
                                None => {
                                    // only left
                                    node.sample(point)
                                },
                            }
                        },
                        None => {
                            // left node is empty
                            match &self.right_node {
                                Some(node) => {
                                    // only right
                                    node.sample(point)
                                },
                                None => {
                                    // both nodes are empty
                                    None
                                }
                            }
                        }
                    }
                }
            }
        } else {
            None
        }
    }
}
