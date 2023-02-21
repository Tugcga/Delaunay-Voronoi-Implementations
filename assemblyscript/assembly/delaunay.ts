import { Point } from "./point";

const EPSILON: f32 = 0.0001;

class PointExt extends Point {
    private m_index: i32;

    constructor(in_x: f32, in_y: f32, in_index: i32) {
        super(in_x, in_y);

        this.m_index = in_index;
    }

    index(): i32 {
        return this.m_index;
    }
}

class TriangleCircle {
    private m_i: i32;
    private m_j: i32;
    private m_k: i32;

    private m_x: f32;
    private m_y: f32;

    private m_radius_sq: f32;

    constructor(in_i: i32, in_j: i32, in_k: i32, in_x: f32, in_y: f32, in_r: f32) {
        this.m_i = in_i;
        this.m_j = in_j;
        this.m_k = in_k;

        this.m_x = in_x;
        this.m_y = in_y;

        this.m_radius_sq = in_r;
    }

    i(): i32 { return this.m_i; }
    j(): i32 { return this.m_j; }
    k(): i32 { return this.m_k; }

    x(): f32 { return this.m_x; }
    y(): f32 { return this.m_y; }

    radius_sq(): f32 { return this.m_radius_sq; }

    toString(): string {
        return "<" + this.m_i.toString() + ", " + this.m_j.toString() + ", " + this.m_k.toString() + "|" + this.m_x.toString() + ", " + this.m_y.toString() + "|" + this.m_radius_sq.toString() + ">";
    }
}

function maximum(a: f32, b: f32): f32 {
    if(a > b) {
        return a;
    } else {
        return b;
    }
}

function absolute(a: f32, b: f32): f32 {
    if(a > b) {
        return a - b;
    } else {
        return b - a;
    }
}

function build_supertriangle(points: StaticArray<Point>): StaticArray<Point> {
    let x_min: f32 = f32.MAX_VALUE;
    let y_min: f32 = f32.MAX_VALUE;
    let x_max: f32 = f32.MIN_VALUE;
    let y_max: f32 = f32.MIN_VALUE;

    for(let i = 0, len = points.length; i < len; i++) {
        const p = points[i];
        if (p.x() < x_min) { x_min = p.x(); }
        if (p.x() > x_max) { x_max = p.x(); }
        if (p.y() < y_min) { y_min = p.y(); }
        if (p.y() > y_max) { y_max = p.y(); }
    }

    const dx: f32 = x_max - x_min;
    const dy: f32 = y_max - y_min;

    const d_max: f32 = maximum(dx, dy);
    const x_mid: f32 = x_min + dx * 0.5;
    const y_mid: f32 = y_min + dy * 0.5;

    const vertices = new StaticArray<Point>(3);
    vertices[0] = new Point(x_mid - 20.0 * d_max, y_mid - d_max);
    vertices[1] = new Point(x_mid, y_mid + 20.0 * d_max);
    vertices[2] = new Point(x_mid + 20.0 * d_max, y_mid - d_max);
    return vertices;
}

function circumcircle(points: StaticArray<Point>, i: i32, j: i32, k: i32): TriangleCircle {
    const point_i = points[i];
    const point_j = points[j];
    const point_k = points[k];

    const x_1 = point_i.x();
    const y_1 = point_i.y();

    const x_2 = point_j.x();
    const y_2 = point_j.y();

    const x_3 = point_k.x();
    const y_3 = point_k.y();

    const y1_y2 = absolute(y_1, y_2);
    const y2_y3 = absolute(y_2, y_3);

    let center_x: f32 = 0.0;
    let center_y: f32 = 0.0;
    let m_1: f32 = 0.0;
    let m_2: f32 = 0.0;
    let mx_1: f32 = 0.0;
    let mx_2: f32 = 0.0;
    let my_1: f32 = 0.0;
    let my_2: f32 = 0.0;

    if (y1_y2 < EPSILON) {
        m_2 = -(x_3 - x_2) / (y_3 - y_2);
        mx_2 = (x_2 + x_3) / 2.0;
        my_2 = (y_2 + y_3) / 2.0;
        center_x = (x_2 + x_1) / 2.0;
        center_y = m_2 * (center_x - mx_2) + my_2;
    } else if (y2_y3 < EPSILON)
    {
        m_1 = -(x_2 - x_1) / (y_2 - y_1);
        mx_1 = (x_1 + x_2) / 2.0;
        my_1 = (y_1 + y_2) / 2.0;
        center_x = (x_3 + x_2) / 2.0;
        center_y = m_1 * (center_x - mx_1) + my_1;
    } else
    {
        m_1 = -(x_2 - x_1) / (y_2 - y_1);
        m_2 = -(x_3 - x_2) / (y_3 - y_2);
        mx_1 = (x_1 + x_2) / 2.0;
        mx_2 = (x_2 + x_3) / 2.0;
        my_1 = (y_1 + y_2) / 2.0;
        my_2 = (y_2 + y_3) / 2.0;
        center_x = (m_1 * mx_1 - m_2 * mx_2 + my_2 - my_1) / (m_1 - m_2);
        center_y = y1_y2 > y2_y3 ? (m_1 * (center_x - mx_1) + my_1) : (m_2 * (center_x - mx_2) + my_2);
    }

    const dx = x_2 - center_x;
    const dy = y_2 - center_y;

    return new TriangleCircle(i, j, k, center_x, center_y, dx*dx + dy*dy);
}

// retun new size of the edges array
function remove_duplicates(edges: StaticArray<i32>, in_length: i32): i32 {
    let j = in_length;
    while(j >= 2) {
        const b = edges[--j];
        const a = edges[--j];

        let i = j;
        while(i >= 2) {
            const n = edges[--i];
            const m = edges[--i];

            if((a == m && b == n) || (a == n && b == m)) {
                edges[j] = -1;
                edges[j + 1] = -1;

                edges[i] = -1;
                edges[i + 1] = -1;

                j -= 2;
                break;
            }
        }
    }

    // next remove all -1 values in the array
    let i = -1;  // actual new index
    j = 0;  // pointer to the value in the array
    while(j < in_length) {
        if(edges[j] == -1) {
            j += 1;
        } else {
            edges[++i] = edges[j++];
        }
    }

    return i + 1;
}

function remove_from_array<T>(array: StaticArray<T>, in_length: i32, remove_index: i32): i32 {
    for(let i = remove_index + 1; i < in_length; i++) {
        array[i - 1] = array[i];
    }

    return in_length - 1;
}

export function triangulate(in_points: StaticArray<Point>): StaticArray<i32> {
    const points_count: i32 = in_points.length;
    if(points_count < 3) {
        return new StaticArray<i32>(0);
    }

    // AS does not support closures, so, create array with extended points
    let ext_points = new StaticArray<PointExt>(points_count);
    for(let i = 0; i < points_count; i++) {
        const p = in_points[i];
        ext_points[i] = new PointExt(p.x(), p.y(), i);  // assign in dex to each point
    }

    // sort by using custom comparator
    ext_points.sort((a: PointExt, b: PointExt): i32 => {
        if(a.x() < b.x()) {
            return -1;
        } else if(a.x() > b.x())
        {
            return 1;
        } else {
            return 0;
        }
    });

    // extract indices from sorted array
    let indices = new StaticArray<i32>(points_count);
    for(let i = 0; i < points_count; i++) {
        indices[i] = ext_points[i].index();
    }

    const st = build_supertriangle(in_points);

    // create copy of the input points array and extend it by points from the super triangle
    const points = new StaticArray<Point>(points_count + 3);
    for(let i = 0; i < points_count; i++) {
        points[i] = in_points[i];
    }
    points[points_count] = st[0];
    points[points_count + 1] = st[1];
    points[points_count + 2] = st[2];

    // create buffers
    const buffers_max_size = 6 * (points_count + 3);
    let open_list = new StaticArray<TriangleCircle>(buffers_max_size);
    let open_list_length = 0;  // manually count the used length

    let closed_list = new StaticArray<TriangleCircle>(buffers_max_size);
    let closed_list_length = 0;

    let edges_list = new StaticArray<i32>(6 * buffers_max_size);  // here we place 6 put for each triangle
    let edges_list_length = 0;

    open_list[open_list_length++] = circumcircle(points, points_count, points_count + 1, points_count + 2);

    for(let i = 0; i < points_count; i++) {
        const c: i32 = indices[i];
        const p: Point = points[c];

        edges_list_length = 0;
        for(let j = open_list_length - 1; j >= 0; j--) {
            const t: TriangleCircle = open_list[j];
            const dx: f32 = p.x() - t.x();

            if(dx > EPSILON && dx*dx > t.radius_sq()) {
                open_list_length = remove_from_array(open_list, open_list_length, j);
                closed_list[closed_list_length++] = t;
                continue;
            }

            const dy: f32 = p.y() - t.y();
            if(dx*dx + dy*dy - t.radius_sq() > EPSILON) {
                continue;
            }

            open_list_length = remove_from_array(open_list, open_list_length, j);
            edges_list[edges_list_length++] = t.i();
            edges_list[edges_list_length++] = t.j();
            edges_list[edges_list_length++] = t.j();
            edges_list[edges_list_length++] = t.k();
            edges_list[edges_list_length++] = t.k();
            edges_list[edges_list_length++] = t.i();
        }
        
        edges_list_length = remove_duplicates(edges_list, edges_list_length);

        let k: i32 = edges_list_length;
        while(k >= 2) {
            const b = edges_list[--k];
            const a = edges_list[--k];

            open_list[open_list_length++] = circumcircle(points, a, b, c);
        }
    }

    for(let i = 0; i < open_list_length; i++) {
        closed_list[closed_list_length++] = open_list[i];
    }

    const triangles = new StaticArray<i32>(closed_list_length * 3);
    let t_index: i32 = 0;
    for(let i = 0; i < closed_list_length; i++) {
        const t = closed_list[i];
        if(t.i() < points_count && t.j() < points_count && t.k() < points_count) {
            triangles[3*t_index] = t.i();
            triangles[3*t_index + 1] = t.j();
            triangles[3*t_index + 2] = t.k();

            t_index += 1;
        }
    }
    return triangles.slice<StaticArray<i32>>(0, 3*t_index);
}