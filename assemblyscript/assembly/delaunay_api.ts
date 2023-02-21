import { BVHNode, Triangle } from "./bvh";
import { triangulate } from "./delaunay";
import { Point } from "./point";

export function build_triangulation(coordinates: Float32Array): Int32Array {
    const points_count = coordinates.length / 2;
    const points = new StaticArray<Point>(points_count);
    for (let i = 0; i < points_count; i++) {
        points[i] = new Point(
            coordinates[2 * i + 0],
            coordinates[2 * i + 1]
        );
    }

    const triangle_indices = triangulate(points);

    // convert to Int32Array
    const to_return = new Int32Array(triangle_indices.length);
    for (let i = 0, len = triangle_indices.length; i < len; i++) {
        to_return[i] = triangle_indices[i];
    }

    return to_return;
}

export function build_bvh(coordinates: Float32Array): BVHNode {
    const points_count = coordinates.length / 2;
    const points = new StaticArray<Point>(points_count);
    for (let i = 0; i < points_count; i++) {
        points[i] = new Point(
            coordinates[2 * i + 0],
            coordinates[2 * i + 1]
        );
    }

    const triangle_indices = triangulate(points);
    const trinagles = new StaticArray<Triangle>(triangle_indices.length / 3);

    for (let i = 0, len = trinagles.length; i < len; i++) {
        const a_index = triangle_indices[3 * i + 0];
        const b_index = triangle_indices[3 * i + 1];
        const c_index = triangle_indices[3 * i + 2];

        trinagles[i] = new Triangle(
            points[a_index],
            points[b_index],
            points[c_index]
        );
    }

    return new BVHNode(trinagles);
}

export function build_bvh_triangulation(coordinates: Float32Array, triangles: Int32Array): BVHNode {
    const trinagles_array = new StaticArray<Triangle>(triangles.length / 3);
    for (let i = 0, len = trinagles_array.length; i < len; i++) {
        const a = triangles[3 * i + 0];
        const b = triangles[3 * i + 1];
        const c = triangles[3 * i + 2];

        trinagles_array[i] = new Triangle(
            new Point(coordinates[2 * a + 0], coordinates[2 * a + 1]),
            new Point(coordinates[2 * b + 0], coordinates[2 * b + 1]),
            new Point(coordinates[2 * c + 0], coordinates[2 * c + 1])
        );
    }

    return new BVHNode(trinagles_array);
}

export function sample_bvh(bvh: BVHNode, x: f32, y: f32): Float32Array {
    const sample_result = bvh.sample(new Point(x, y));
    if (sample_result) {
        const to_return = new Float32Array(6);

        const a = sample_result.a;
        const b = sample_result.b;
        const c = sample_result.c;

        to_return[0] = a.x;
        to_return[1] = a.y;
        to_return[2] = b.x;
        to_return[3] = b.y;
        to_return[4] = c.x;
        to_return[5] = c.y;

        return to_return;
    } else {
        return new Float32Array(0);
    }
}
