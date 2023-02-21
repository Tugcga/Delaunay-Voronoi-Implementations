use crate::point::Point;

const EPSILON: f32 = 0.00001;

#[derive(Debug, Clone)]
struct TriangleCircle {
    i: usize,
    j: usize,
    k: usize,

    x: f32,
    y: f32,

    radius_sq: f32
}

fn maximum(a: f32, b: f32) -> f32 {
    if a > b { a } else { b }
}

fn absolute(a: f32, b: f32) -> f32 {
    if a > b { a - b } else { b - a }
}

fn build_supertriangle(points: &Vec<Point>) -> Vec<Point> {
    let mut x_min: f32 = f32::MAX;
    let mut y_min: f32 = f32::MAX;
    let mut x_max: f32 = f32::MIN;
    let mut y_max: f32 = f32::MIN;

    let points_count = points.len();

    for i in 0..points_count {
        let p = &points[i];
        if p.x < x_min { x_min = p.x; }
        if p.x > x_max { x_max = p.x; }
        if p.y < y_min { y_min = p.y; }
        if p.y > y_max { y_max = p.y; }
    }

    let dx = x_max - x_min;
    let dy = y_max - y_min;

    let d_max = maximum(dx, dy);
    let x_mid = x_min + dx * 0.5;
    let y_mid = y_min + dy * 0.5;

    vec![Point::new(x_mid - 20.0 * d_max, y_mid - d_max),
         Point::new(x_mid, y_mid + 20.0 * d_max),
         Point::new(x_mid + 20.0 * d_max, y_mid - d_max)]
}

fn circumcircle(points: &Vec<Point>, i: usize, j: usize, k: usize) -> TriangleCircle {
    let point_i = &points[i];
    let point_j = &points[j];
    let point_k = &points[k];

    let x_1: f32 = point_i.x;
    let y_1: f32 = point_i.y;

    let x_2: f32 = point_j.x;
    let y_2: f32 = point_j.y;    

    let x_3: f32 = point_k.x;
    let y_3: f32 = point_k.y;

    let y1_y2: f32 = absolute(y_1, y_2);
    let y2_y3: f32 = absolute(y_2, y_3);

    let center_x: f32;
    let center_y: f32;
    let m_1: f32;
    let m_2: f32;
    let mx_1: f32;
    let mx_2: f32;
    let my_1: f32;
    let my_2: f32;

    if y1_y2 < EPSILON {
        m_2 = -(x_3 - x_2) / (y_3 - y_2);
        mx_2 = (x_2 + x_3) / 2.0;
        my_2 = (y_2 + y_3) / 2.0;
        center_x = (x_2 + x_1) / 2.0;
        center_y = m_2 * (center_x - mx_2) + my_2;
    } else if y2_y3 < EPSILON {
        m_1 = -(x_2 - x_1) / (y_2 - y_1);
        mx_1 = (x_1 + x_2) / 2.0;
        my_1 = (y_1 + y_2) / 2.0;
        center_x = (x_3 + x_2) / 2.0;
        center_y = m_1 * (center_x - mx_1) + my_1;
    } else {
        m_1 = -(x_2 - x_1) / (y_2 - y_1);
        m_2 = -(x_3 - x_2) / (y_3 - y_2);
        mx_1 = (x_1 + x_2) / 2.0;
        mx_2 = (x_2 + x_3) / 2.0;
        my_1 = (y_1 + y_2) / 2.0;
        my_2 = (y_2 + y_3) / 2.0;
        center_x = (m_1 * mx_1 - m_2 * mx_2 + my_2 - my_1) / (m_1 - m_2);
        center_y = if y1_y2 > y2_y3 { m_1 * (center_x - mx_1) + my_1 } else { m_2 * (center_x - mx_2) + my_2 };
    }

    let dx = x_2 - center_x;
    let dy = y_2 - center_y;

    TriangleCircle { i: i, j: j, k: k, x: center_x, y: center_y, radius_sq: dx*dx + dy*dy }
}

fn remove_duplicates(edges: &mut Vec<usize>) {
    let mut j: usize = edges.len();
    while j >= 2 {
        j = j - 1;
        let b = edges[j];

        j = j - 1;
        let a = edges[j];

        let mut i: usize = j;
        while i >= 2 {
            i = i - 1;
            let n = edges[i];
            i = i - 1;
            let m = edges[i];

            if (a == m && b == n) || (a == n && b == m) {
                edges.remove(j + 1); edges.remove(j);
                edges.remove(i + 1); edges.remove(i);
                j = j - 2;
                break;
            }
        }
    }
}

pub fn triangulate(in_points: &Vec<Point>) -> Vec<usize> {
    let points_count = in_points.len();
    if points_count < 3 {
        return Vec::new();
    }

    let mut indices: Vec<usize> = Vec::with_capacity(points_count);
    for i in 0..points_count {
        indices.push(i);
    }

    indices.sort_by(|a, b| { in_points[*a].x.partial_cmp(&in_points[*b].x).unwrap() });
    
    // create copy of the in_points array
    let mut points: Vec<Point> = in_points.to_vec();
    let mut st = build_supertriangle(&points);
    points.append(&mut st);

    let mut open_list: Vec<TriangleCircle> = Vec::new();
    let mut closed_list: Vec<TriangleCircle> = Vec::new();
    let mut edges_list: Vec<usize> = Vec::new();

    open_list.push(circumcircle(&points, points_count, points_count + 1, points_count + 2));

    for i in 0..points_count {
        let c = indices[i];
        let p = &points[c];
        edges_list.clear();

        for j in (0..open_list.len()).rev() {
            let t = &open_list[j];

            let dx = p.x - t.x;
            if dx > 0.0 && dx*dx > t.radius_sq {
                closed_list.push(t.clone());
                open_list.remove(j);
                continue;
            }

            let dy = p.y - t.y;
            if dx*dx + dy*dy - t.radius_sq > EPSILON {
                continue;
            }
            
            edges_list.push(t.i); edges_list.push(t.j);
            edges_list.push(t.j); edges_list.push(t.k);
            edges_list.push(t.k); edges_list.push(t.i);

            open_list.remove(j);
        }

        remove_duplicates(&mut edges_list);

        let mut k: usize = edges_list.len();
        while k >= 2 {
            k = k - 1;
            let b = edges_list[k];
            k = k - 1;
            let a = edges_list[k];
            open_list.push(circumcircle(&points, a, b, c));
        }
    }

    for i in 0..open_list.len() {
        closed_list.push(open_list[i].clone());
    }

    open_list.clear();
    edges_list.clear();

    let mut triangles: Vec<usize> = Vec::new();
    for i in 0..closed_list.len() {
        let t = &closed_list[i];
        if t.i < points_count && t.j < points_count && t.k < points_count {
            triangles.push(t.i);
            triangles.push(t.j);
            triangles.push(t.k);
        }
    }

    closed_list.clear();

    triangles
}