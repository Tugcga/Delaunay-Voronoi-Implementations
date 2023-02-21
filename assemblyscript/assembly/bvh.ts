import { Point } from "./point";

class AABB {
    constructor(
        public x_min: f32 = 0,
        public y_min: f32 = 0,
        public x_max: f32 = 0,
        public y_max: f32 = 0
    ) {}

    @inline
    is_point_inside(point: Point): bool {
        const px = point.x;
        const py = point.y;
        return (
            this.x_min < px &&
            this.y_min < py &&
            this.x_max > px &&
            this.y_max > py
        );
    }

    @inline
    union(other: AABB): AABB {
        return new AABB(
            Mathf.min(this.x_min, other.x_min),
            Mathf.min(this.y_min, other.y_min),
            Mathf.max(this.x_max, other.x_max),
            Mathf.max(this.y_max, other.y_max)
        );
    }

    toString(): string {
        return `|${this.x_min}, ${this.y_min}, ${this.x_max}, ${this.y_max}|`;
    }
}

export class Triangle {
    public aabb: AABB;
    public center: Point;

    constructor(
        public a: Point,
        public b: Point,
        public c: Point
    ) {
        let x_min = f32.MAX_VALUE;
        let y_min = f32.MAX_VALUE;
        let x_max = f32.MIN_VALUE;
        let y_max = f32.MIN_VALUE;

        if (a.x < x_min) { x_min = a.x; }
        if (a.x > x_max) { x_max = a.x; }
        if (a.y < y_min) { y_min = a.y; }
        if (a.y > y_max) { y_max = a.y; }

        if (b.x < x_min) { x_min = b.x; }
        if (b.x > x_max) { x_max = b.x; }
        if (b.y < y_min) { y_min = b.y; }
        if (b.y > y_max) { y_max = b.y; }

        if (c.x < x_min) { x_min = c.x; }
        if (c.x > x_max) { x_max = c.x; }
        if (c.y < y_min) { y_min = c.y; }
        if (c.y > y_max) { y_max = c.y; }

        let cx = (a.x + b.x + c.x) * (1.0 / 3.0);
        let cy = (a.y + b.y + c.y) * (1.0 / 3.0);

        this.aabb = new AABB(x_min, y_min, x_max, y_max);
        this.center = new Point(cx, cy);
    }

    is_point_inside(point: Point): bool {
        const ax = this.a.x;
        const ay = this.a.y;
        const bx = this.b.x;
        const by = this.b.y;
        const cx = this.c.x;
        const cy = this.c.y;
        const px = point.x;
        const py = point.y;

        const as_x = px - ax;
        const as_y = py - ay;

        const s_ab = ((bx - ax) * as_y - (by - ay) * as_x) > 0;

        if (((cx - ax) * as_y - (cy - ay) * as_x > 0) == s_ab) {
            return false;
        }
        if ((
            (cx - bx) * (py - by) -
            (cy - by) * (px - bx) > 0
        ) != s_ab) {
            return false;
        }

        return true;
    }

    toString(): string {
        return `<${this.a}, ${this.b}, ${this.c}>`;
    }
}

export class BVHNode {
    private m_triangle: Triangle | null = null;
    private m_left_node: BVHNode | null = null;
    private m_right_node: BVHNode | null = null;

    public aabb: AABB = new AABB();

    constructor(triangles: StaticArray<Triangle>) {
        const objects_count = triangles.length;

        if(objects_count == 1) {
            this.m_triangle = triangles[0];
            this.aabb = triangles[0].aabb;
        } else {
            let x_median: f32 = 0;
            let y_median: f32 = 0;

            let x_min = f32.MAX_VALUE;
            let x_max = f32.MIN_VALUE;
            let y_min = f32.MAX_VALUE;
            let y_max = f32.MIN_VALUE;

            for (let i = 0; i < objects_count; i++) {
                const t = triangles[i];
                const c = t.center;
                x_median += c.x;
                y_median += c.y;

                if (c.x < x_min) { x_min = c.x; }
                if (c.x > x_max) { x_max = c.x; }
                if (c.y < y_min) { y_min = c.y; }
                if (c.y > y_max) { y_max = c.y; }
            }

            const split_axis = x_max - x_min > y_max - y_min ? 0 : 1;
            const median = split_axis == 0
                ? (x_median / <f32>objects_count)
                : (y_median / <f32>objects_count);

            const left  = new StaticArray<Triangle>(objects_count);
            const right = new StaticArray<Triangle>(objects_count);
            let left_length  = 0;
            let right_length = 0;

            for (let i = 0; i < objects_count; i++) {
                const t = triangles[i];
                const c = t.center;
                const v = split_axis == 0 ? c.x : c.y;
                if (v < median) {
                    left[left_length++] = t;
                } else {
                    right[right_length++] = t;
                }
            }

            if (left_length == 0) {
                left[left_length++] = right[right_length - 1];
                right_length--;
            }

            if (right_length == 0) {
                right[right_length++] = left[left_length - 1];
                left_length--;
            }

            let left_node  = new BVHNode(left.slice<StaticArray<Triangle>>(0, left_length));
            let right_node = new BVHNode(right.slice<StaticArray<Triangle>>(0, right_length));

            const left_aabb  = left_node.aabb;
            const right_aabb = right_node.aabb;

            this.aabb = left_aabb.union(right_aabb);
            this.m_left_node  = left_node;
            this.m_right_node = right_node;
        }
    }

    sample(point: Point): Triangle | null {
        if (this.aabb.is_point_inside(point)) {
            let triangle   = this.m_triangle;
            let left_node  = this.m_left_node;
            let right_node = this.m_right_node;

            if (!triangle && left_node && right_node) {
                let left_sample  = left_node.sample(point);
                let right_sample = right_node.sample(point);

                if (!left_sample) {
                    return right_sample;
                } else {
                    if (!right_sample) {
                        return left_sample;
                    } else {
                        const l_dist = left_sample.center.squared_distance(point);
                        const r_dist = right_sample.center.squared_distance(point);
                        return l_dist < r_dist ? left_sample : right_sample;
                    }
                }
            } else {
                if (triangle && triangle.is_point_inside(point)) {
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
