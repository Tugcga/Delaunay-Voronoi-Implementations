import { Point } from "./point";

@inline
function maximum(a: f32, b: f32): f32 {
    if(a > b) { return a;
    } else { return b; }
}

@inline
function minimum(a: f32, b: f32): f32 {
    if(a > b) { return b;
    } else { return a; }
}

@inline
function square(value: f32): f32 {
    return value * value;
}

class AABB {
    private m_x_min: f32;
    private m_y_min: f32;

    private m_x_max: f32;
    private m_y_max: f32;

    constructor(in_x_min: f32 = 0.0, in_y_min: f32 = 0.0, in_x_max: f32 = 0.0, in_y_max: f32 = 0.0) {
        this.m_x_min = in_x_min;
        this.m_y_min = in_y_min;

        this.m_x_max = in_x_max;
        this.m_y_max = in_y_max;
    }

    @inline
    x_min(): f32 { return this.m_x_min; }

    @inline
    y_min(): f32 { return this.m_y_min; }

    @inline
    x_max(): f32 { return this.m_x_max; }

    @inline
    y_max(): f32 { return this.m_y_max; }

    toString(): string {
        return "|" + this.m_x_min.toString() + ", " + this.m_y_min.toString() + ", " + this.m_x_max.toString() + ", " + this.m_y_max.toString() + "|";
    }
}

export class Triangle {
    private m_a: Point;
    private m_b: Point;
    private m_c: Point;

    private m_aabb: AABB;
    private m_center: Point;

    constructor(vertices: Array<Point>) {
        this.m_a = vertices[0];
        this.m_b = vertices[1];
        this.m_c = vertices[2];

        let x_min = f32.MAX_VALUE;
        let y_min = f32.MAX_VALUE;
        let x_max = f32.MIN_VALUE;
        let y_max = f32.MIN_VALUE;

        let x_accum: f32 = 0.0;
        let y_accum: f32 = 0.0;

        for (let i = 0, len = vertices.length; i < len; i++)
        {
            const v = vertices[i];
            if (v.x() < x_min) { x_min = v.x(); }
            if (v.x() > x_max) { x_max = v.x(); }
            if (v.y() < y_min) { y_min = v.y(); }
            if (v.y() > y_max) { y_max = v.y(); }

            x_accum += v.x();
            y_accum += v.y();
        }

        this.m_aabb = new AABB(x_min, y_min, x_max, y_max);
        this.m_center = new Point(x_accum / <f32>vertices.length, y_accum / <f32>vertices.length);
    }

    @inline
    a(): Point { return this.m_a; }

    @inline
    b(): Point { return this.m_b; }

    @inline
    c(): Point { return this.m_c; }

    @inline
    aabb(): AABB {
        return this.m_aabb;
    }

    @inline
    center(): Point {
        return this.m_center;
    }

    is_point_inside(point: Point): bool {
        const as_x = point.x() - this.m_a.x();
        const as_y = point.y() - this.m_a.y();

        const s_ab: bool = ((this.m_b.x() - this.m_a.x()) * as_y - (this.m_b.y() - this.m_a.y()) * as_x) > 0;

        if (((this.m_c.x() - this.m_a.x()) * as_y - (this.m_c.y() - this.m_a.y()) * as_x > 0) == s_ab)
        {
            return false;
        }
        if (((this.m_c.x() - this.m_b.x()) * (point.y() - this.m_b.y()) - (this.m_c.y() - this.m_b.y()) * (point.x() - this.m_b.x()) > 0) != s_ab)
        {
            return false;
        }
        return true;
    }

    toString(): string {
        return "<" + this.m_a.toString() + ", " + this.m_b.toString() + ", " + this.m_c.toString() + ">";
    }
}

function union_aabb(x: AABB, y: AABB): AABB {
    return new AABB(minimum(x.x_min(), y.x_min()), 
    minimum(x.y_min(), y.y_min()), 
    maximum(x.x_max(), y.x_max()), 
    maximum(x.y_max(), y.y_max()));
}

export class BVHNode {
    private m_triangle: Triangle | null = null;
    private m_left_node: BVHNode | null = null;
    private m_right_node: BVHNode | null = null;
    private m_aabb: AABB = new AABB();

    constructor(triangles: StaticArray<Triangle>) {
        const objects_count = triangles.length;

        if(objects_count == 1) {
            this.m_triangle = triangles[0];
            this.m_aabb = triangles[0].aabb();
        } else {
            let x_median: f32 = 0.0;
            let y_median: f32 = 0.0;

            let x_min = f32.MAX_VALUE;
            let x_max = f32.MIN_VALUE;
            let y_min = f32.MAX_VALUE;
            let y_max = f32.MIN_VALUE;

            for (let i = 0; i < objects_count; i++) {
                const t = triangles[i];
                const c = t.center();
                x_median += c.x();
                y_median += c.y();

                if (c.x() < x_min) { x_min = c.x(); }
                if (c.x() > x_max) { x_max = c.x(); }
                if (c.y() < y_min) { y_min = c.y(); }
                if (c.y() > y_max) { y_max = c.y(); }
            }

            const split_axis: i32 = ((x_max - x_min) > (y_max - y_min)) ? 0 : 1;
            const median: f32 = split_axis == 0 ? (x_median / <f32>objects_count) : (y_median / <f32>objects_count);

            const left = new StaticArray<Triangle>(objects_count);
            let left_length: i32 = 0;
            const right = new StaticArray<Triangle>(objects_count);
            let right_length: i32 = 0;

            for (let i = 0; i < objects_count; i++) {
                const t = triangles[i];
                const c = t.center();
                const v: f32 = split_axis == 0 ? c.x() : c.y();
                if (v < median) {
                    left[left_length++] = t;
                } else {
                    right[right_length++] = t;
                }
            }

            if (left_length == 0)
            {
                left[left_length++] = right[right_length - 1];
                right_length -= 1;
            }

            if (right_length == 0)
            {
                right[right_length++] = left[left_length - 1];
                left_length -= 1;
            }

            let left_node = new BVHNode(left.slice<StaticArray<Triangle>>(0, left_length));
            let right_node = new BVHNode(right.slice<StaticArray<Triangle>>(0, right_length));

            const left_aabb = left_node.aabb();
            const right_aabb = right_node.aabb();

            this.m_aabb = union_aabb(left_aabb, right_aabb);
            this.m_left_node = left_node;
            this.m_right_node = right_node;
        }
    }

    @inline
    aabb(): AABB {
        return this.m_aabb;
    }

    @inline
    is_inside_aabb(point: Point): bool {
        return this.m_aabb.x_min() < point.x() && this.m_aabb.y_min() < point.y() && this.m_aabb.x_max() > point.x() && this.m_aabb.y_max() > point.y();
    }

    sample(point: Point): Triangle | null {
        if(this.is_inside_aabb(point)) {
            let triangle = this.m_triangle;
            let left_node = this.m_left_node;
            let right_node = this.m_right_node;

            if(!triangle && left_node && right_node) {
                let left_sample = left_node.sample(point);
                let right_sample = right_node.sample(point);

                if(!left_sample) {
                    return right_sample;
                } else {
                    if(!right_sample) {
                        return left_sample;
                    } else {
                        const l_c = left_sample.center();
                        const l_dist = square(l_c.x() - point.x()) + square(l_c.y() - point.y());

                        const r_c = right_sample.center();
                        const r_dist = square(r_c.x() - point.x()) + square(r_c.y() - point.y());

                        if (l_dist < r_dist) {
                            return left_sample;
                        } else {
                            return right_sample;
                        }
                    }
                }
            } else {
                if(triangle && triangle.is_point_inside(point)) {
                    return triangle;
                } else {
                    return null;
                }
            }
        } else {
            return null;
        }
    }
}