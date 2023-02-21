EPSILON: float = 0.00001

def maximum(a: float, b: float) -> float:
    return a if a > b else b

def absolute(a: float, b: float) -> float:
    return a - b if a > b else b - a

def build_supertriangle(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    x_min: float = float("inf")
    y_min: float = float("inf")
    x_max: float = float("-inf")
    y_max: float = float("-inf")

    for point in points:
        x: float = point[0]
        y: float = point[1]
        if x < x_min:
            x_min = x
        if x > x_max:
            x_max = x
        if y < y_min:
            y_min = y
        if y > y_max:
            y_max = y

    dx: float = x_max - x_min
    dy: float = y_max - y_min
    d_max: float = maximum(dx, dy)
    x_mid: float = x_min + dx * 0.5
    y_mid: float = y_min + dy * 0.5

    return [(x_mid - 20.0 * d_max, y_mid - d_max), (x_mid, y_mid + 20.0 * d_max), (x_mid + 20.0 * d_max, y_mid - d_max)]

# in this function we calculate parameters of the cirlce around the triangle
# triangle defined by selected points
def circumcircle(points: list[tuple[float, float]], i: int, j: int, k: int) -> tuple[tuple[int, int, int], tuple[float, float], float]:
    x_1: float = points[i][0]
    y_1: float = points[i][1]
    x_2: float = points[j][0]
    y_2: float = points[j][1]
    x_3: float = points[k][0]
    y_3: float = points[k][1]

    y1_y2: float = absolute(y_1, y_2)
    y2_y3: float = absolute(y_2, y_3)

    center_x: float = 0.0
    center_y: float = 0.0
    m_1: float = 0.0
    m_2: float = 0.0
    mx_1: float = 0.0
    mx_2: float = 0.0
    my_1: float = 0.0
    my_2: float = 0.0

    if y1_y2 < EPSILON:
        m_2 = -(x_3 - x_2) / (y_3 - y_2)
        mx_2 = (x_2 + x_3) / 2.0
        my_2 = (y_2 + y_3) / 2.0
        center_x = (x_2 + x_1) / 2.0
        center_y = m_2 * (center_x - mx_2) + my_2
    elif y2_y3 < EPSILON:
        m_1 = -(x_2 - x_1) / (y_2 - y_1)
        mx_1 = (x_1 + x_2) / 2.0
        my_1 = (y_1 + y_2) / 2.0
        center_x = (x_3 + x_2) / 2.0
        center_y = m_1 * (center_x - mx_1) + my_1
    else:
        m_1 = -(x_2 - x_1) / (y_2 - y_1)
        m_2 = -(x_3 - x_2) / (y_3 - y_2)
        mx_1 = (x_1 + x_2) / 2.0
        mx_2 = (x_2 + x_3) / 2.0
        my_1 = (y_1 + y_2) / 2.0
        my_2 = (y_2 + y_3) / 2.0
        center_x = (m_1 * mx_1 - m_2 * mx_2 + my_2 - my_1) / (m_1 - m_2)
        center_y = (m_1 * (center_x - mx_1) + my_1) if y1_y2 > y2_y3 else (m_2 * (center_x - mx_2) + my_2)

    dx: float = x_2 - center_x;
    dy: float = y_2 - center_y;

    return ((i, j, k), (center_x, center_y), dx**2 + dy**2)

def remove_duplicates(edges: list[int]):
    '''If some edge exists in the array two times, then remove both of them
    because it corresponds to the pair of triangles with common edge
    As a result we will remain only edges with one incident triangle
    '''
    j: int = len(edges)
    while j >= 2:
        j -= 1
        b: int = edges[j]
        j -= 1
        a: int = edges[j]

        i: int = j
        while i >= 2:
            i -= 1
            n: int = edges[i]
            i -= 1
            m: int = edges[i]

            if (a == m and b == n) or (a == n and b == m):
                del edges[j:j+2]
                del edges[i:i+2]
                j -= 2
                break

def triangulate(points: list[tuple[float, float]]) -> list[int]:
    n: int = len(points)
    if n < 3:
        return []

    indices: list[int] = [i for i in range(n)]
    indices.sort(key=lambda v: points[v][0])
    
    # build super triangle
    st = build_supertriangle(points)
    # extends input points
    points.extend(st)

    # store triangle with the circle in the following way:
    # (tr_indices, center, radius)
    # where tr_indices = (i, j, k)
    # center = (x, y)
    # radius is square of the curcle radius

    # both open and closed lists store triangles with circels
    open_list: list[tuple[tuple[int, int, int], tuple[float, float], float]] = []
    closed_list: list[tuple[tuple[int, int, int], tuple[float, float], float]] = []
    edges_list: list[int] = []

    # add triangle for the super triangle
    open_list.append(circumcircle(points, n, n + 1, n + 2))

    for c in indices:
        edges_list.clear()
        for j in range(len(open_list) - 1, -1, -1):
            center_x = open_list[j][1][0]  # get x center (this is second tuple)
            center_y = open_list[j][1][1]  # y coordinate of the center
            radius_sqr = open_list[j][2]  # square of the circle radius
            
            dx: float = points[c][0] - center_x
            if dx > 0.0 and dx**2 > radius_sqr:
                closed_list.append(open_list.pop(j))
                continue

            dy: float = points[c][1] - center_y
            if dx**2 + dy**2 - radius_sqr > EPSILON:
                continue

            tr_circle = open_list.pop(j)
            tr_circle_indices = tr_circle[0]
            edges_list.extend([
                tr_circle_indices[0], tr_circle_indices[1],
                tr_circle_indices[1], tr_circle_indices[2],
                tr_circle_indices[2], tr_circle_indices[0]])

        remove_duplicates(edges_list)

        i: int = len(edges_list)
        while i >= 2:
            i -= 1
            b = edges_list[i]
            i -= 1
            a = edges_list[i]
            open_list.append(circumcircle(points, a, b, c))

    for i in range(len(open_list)):
        closed_list.append(open_list[i])

    open_list.clear()

    # output
    triangles: list[int] = []
    for i in range(len(closed_list)):
        tr_indices = closed_list[i][0]
        if tr_indices[0] < n and tr_indices[1] < n and tr_indices[2] < n:
            triangles.extend(tr_indices)

    # remove last three points from input array
    del points[len(points) - 3: len(points)]
    return triangles

if __name__ == "__main__":
    points: list[tuple[float, float]] = [(150, 150), (340, 200), (100, 350), (160, 640), (470, 150), (400, 400)]

    print(triangulate(points))