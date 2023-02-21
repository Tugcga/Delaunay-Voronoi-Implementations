from typing import Optional

class Triangle:
    # construct triangle from three 2d-points
    def __init__(self, vertices: list[tuple[float, float]]):
        self._a: tuple[float, float] = vertices[0]
        self._b: tuple[float, float] = vertices[1]
        self._c: tuple[float, float] = vertices[2]

        # construct aabb of the triangle
        x_min: float = float("inf")
        x_max: float = float("-inf")
        y_min: float = float("inf")
        y_max: float = float("-inf")

        x_accum: float = 0.0
        y_accum: float = 0.0

        for v in vertices:
            x: float = v[0]
            y: float = v[1]
            if x < x_min:
                x_min = x
            if x > x_max:
                x_max = x

            if y < y_min:
                y_min = y
            if y > y_max:
                y_max = y

            x_accum += x
            y_accum += y
        self._aabb: tuple[float, float, float, float] = (x_min, y_min, x_max, y_max)

        # calculate the center
        self._center: tuple[float, float] = (x_accum / 3.0, y_accum / 3.0)

    # return true if the point inside the triangle
    def is_point_inside(self, point: tuple[float, float]) -> bool:
        as_x: float = point[0] - self._a[0]
        as_y: float = point[1] - self._a[1]

        s_ab: bool = ((self._b[0] - self._a[0]) * as_y - (self._b[1] - self._a[1]) * as_x) > 0

        if ((self._c[0] - self._a[0]) * as_y - (self._c[1] - self._a[1]) * as_x > 0) == s_ab:
            return False
        if ((self._c[0] - self._b[0]) * (point[1] - self._b[1]) - (self._c[1] - self._b[1]) * (point[0] - self._b[0]) > 0) != s_ab:
            return False
        return True

    def get_x_coordinates(self) -> list[float]:
        return [self._a[0], self._b[0], self._c[0]]

    def get_y_coordinates(self) -> list[float]:
        return [self._a[1], self._b[1], self._c[1]]

    # return aabb of the triangle
    def get_aabb(self) -> tuple[float, float, float, float]:
        return self._aabb

    def get_center(self) -> tuple[float, float]:
        return self._center

    def __repr__(self) -> str:
        return "<" + str(self._a) + ", " + str(self._b) + ", " + str(self._c) + ">"

class BVHNode:
    def __init__(self, objects: list[Triangle]):
        self._triangle: Optional[Triangle] = None
        self._left: Optional[BVHNode] = None
        self._right: Optional[BVHNode] = None
        self._aabb: tuple[float, float, float, float]

        objects_count: int = len(objects)
        if objects_count == 1:
            self._triangle = objects[0]
            self._aabb = objects[0].get_aabb()
        else:
            # find the axis (x or y) to split the space
            x_median: float = 0.0
            y_median: float = 0.0
            x_min: float = float("inf")
            x_max: float = float("-inf")
            y_min: float = float("inf")
            y_max: float = float("-inf")
            for obj in objects:
                c: tuple[float, float] = obj.get_center()
                x_median += c[0]
                y_median += c[1]
                if c[0] < x_min:
                    x_min = c[0]
                if c[0] > x_max:
                    x_max = c[0]
                if c[1] < y_min:
                    z_min = c[1]
                if c[1] > y_max:
                    z_max = c[1]
            split_axis: int = 0 if (x_max - x_min) > (y_max - y_min) else 1
            median: float = x_median / objects_count if (x_max - x_min) > (y_max - y_min) else y_median / objects_count
            left: list[Triangle] = []
            right: list[Triangle] = []
            for obj in objects:
                if obj.get_center()[split_axis] < median:
                    left.append(obj)
                else:
                    right.append(obj)
            if len(left) == 0:
                # move last right node to the left array
                left.append(right.pop())
            else:
                # left array is not empty, but may be empty right array
                if len(right) == 0:
                    right.append(left.pop())
            self._left = BVHNode(left)
            self._right = BVHNode(right)
            l_aabb: tuple[float, float, float, float] = self._left.get_aabb()
            r_aabb: tuple[float, float, float, float] = self._right.get_aabb()
            self._aabb = self._union_aabbs(l_aabb, r_aabb)

    def _union_aabbs(self, b1: tuple[float, float, float, float], b2: tuple[float, float, float, float]) -> tuple[float, float, float, float]:
        return (min(b1[0], b2[0]), min(b1[1], b2[1]),
                max(b1[2], b2[2]), max(b1[3], b2[3]))

    def get_aabb(self) -> tuple[float, float, float, float]:
        return self._aabb

    def is_inside_aabb(self, point: tuple[float, float]) -> bool:
        return self._aabb[0] < point[0] and self._aabb[1] < point[1] and\
               self._aabb[2] > point[0] and self._aabb[3] > point[1]

    def sample(self, point: tuple[float, float]) -> Optional[Triangle]:
        if self.is_inside_aabb(point):
            if self._triangle is None and self._left is not None and self._right is not None:
                # this bvh node contains left and right children, go deeper
                left_sample: Optional[Triangle] = self._left.sample(point)
                right_sample: Optional[Triangle] = self._right.sample(point)
                if left_sample is None:
                    return right_sample
                else:
                    if right_sample is None:
                        return left_sample
                    else:
                        # we should choose from left and right sample the closest to the point
                        l_c: tuple[float, float] = left_sample.get_center()
                        l_dist: float = (l_c[0] - point[0])**2 + (l_c[1] - point[1])**2

                        r_c: tuple[float, float] = right_sample.get_center()
                        r_dist: float = (r_c[0] - point[0])**2 + (r_c[1] - point[1])**2

                        if l_dist < r_dist:
                            return left_sample
                        else:
                            return right_sample
            else:
                # bvh node contains a triangle
                if self._triangle is not None and self._triangle.is_point_inside(point):
                    return self._triangle
                else:
                    return None
        else:
            return None

if __name__ == "__main__":
    points = [(150, 150), (340, 200), (100, 350), (160, 640), (470, 150), (400, 400)]
    triangles_indices = [0, 2, 1, 2, 3, 5, 1, 2, 5, 1, 5, 4, 0, 1, 4]

    triangles: list[Triangle] = []
    triangles_count: int = len(triangles_indices) // 3
    for t_index in range(triangles_count):
        a: int = triangles_indices[t_index * 3]
        b: int = triangles_indices[t_index * 3 + 1]
        c: int = triangles_indices[t_index * 3 + 2]
        t: Triangle = Triangle([points[a], points[b], points[c]])
        triangles.append(t)
    tree: BVHNode = BVHNode(triangles)
    print(tree.sample((200, 250)))
