#include "point.h"

#include <vector>
#include <iostream>
#include <algorithm>
#include <float.h>

struct TriangleCircle
{
    // triangle point indices
    int i;
    int j;
    int k;

    // circle center
    float x;
    float y;

    // the square of the circle radius
    float radius_sq;

    std::string to_string() const
    {
        return "<" + std::to_string(i) + ", " + std::to_string(j) + ", " + std::to_string(k) + "|" + std::to_string(x) + ", " + std::to_string(y) + "|" + std::to_string(radius_sq) + ">";
    }
};

void console_log(const std::vector<Point>& points)
{
    std::cout << "[";
    for (size_t i = 0; i < points.size(); i++)
    {
        std::cout << points[i].to_string() << (i == points.size() - 1 ? "" : ", ");
    }

    std::cout << "]" << std::endl;
}

void console_log(const std::vector<int>& array)
{
    std::cout << "[";
    for (size_t i = 0; i < array.size(); i++)
    {
        std::cout << array[i] << (i == array.size() - 1 ? "" : ", ");
    }

    std::cout << "]" << std::endl;
}

void console_log(const std::vector<TriangleCircle>& array)
{
    std::cout << "[";
    for (size_t i = 0; i < array.size(); i++)
    {
        std::cout << array[i].to_string() << (i == array.size() - 1 ? "" : ", ");
    }

    std::cout << "]" << std::endl;
}

std::vector<Point> build_supertriangle(const std::vector<Point> &points)
{
    float x_min = FLT_MAX;
    float y_min = FLT_MAX;
    float x_max = FLT_MIN;
    float y_max = FLT_MIN;

    for (size_t i = 0; i < points.size(); i++)
    {
        const Point p = points[i];
        if (p.x < x_min) { x_min = p.x; }
        if (p.x > x_max) { x_max = p.x; }
        if (p.y < y_min) { y_min = p.y; }
        if (p.y > y_max) { y_max = p.y; }
    }

    float dx = x_max - x_min;
    float dy = y_max - y_min;

    float d_max = std::max(dx, dy);
    float x_mid = x_min + dx * 0.5f;
    float y_mid = y_min + dy * 0.5f;

    return { 
        Point(x_mid - 20.0f * d_max, y_mid - d_max),
        Point(x_mid, y_mid + 20.0f * d_max),
        Point(x_mid + 20.0f * d_max, y_mid - d_max) };
}

TriangleCircle circumcircle(const std::vector<Point> &points, int i, int j, int k)
{
    const Point point_i = points[i];
    const Point point_j = points[j];
    const Point point_k = points[k];

    float x_1 = point_i.x;
    float y_1 = point_i.y;

    float x_2 = point_j.x;
    float y_2 = point_j.y;

    float x_3 = point_k.x;
    float y_3 = point_k.y;

    float y1_y2 = std::abs(y_1 - y_2);
    float y2_y3 = std::abs(y_2 - y_3);

    float center_x = 0.0f;
    float center_y = 0.0f;
    float m_1 = 0.0f;
    float m_2 = 0.0f;
    float mx_1 = 0.0f;
    float mx_2 = 0.0f;
    float my_1 = 0.0f;
    float my_2 = 0.0f;

    float EPSILON = 0.00001f;

    if (y1_y2 < EPSILON)
    {
        m_2 = -(x_3 - x_2) / (y_3 - y_2);
        mx_2 = (x_2 + x_3) / 2.0f;
        my_2 = (y_2 + y_3) / 2.0f;
        center_x = (x_2 + x_1) / 2.0f;
        center_y = m_2 * (center_x - mx_2) + my_2;
    }
    else if (y2_y3 < EPSILON)
    {
        m_1 = -(x_2 - x_1) / (y_2 - y_1);
        mx_1 = (x_1 + x_2) / 2.0f;
        my_1 = (y_1 + y_2) / 2.0f;
        center_x = (x_3 + x_2) / 2.0f;
        center_y = m_1 * (center_x - mx_1) + my_1;
    }
    else
    {
        m_1 = -(x_2 - x_1) / (y_2 - y_1);
        m_2 = -(x_3 - x_2) / (y_3 - y_2);
        mx_1 = (x_1 + x_2) / 2.0f;
        mx_2 = (x_2 + x_3) / 2.0f;
        my_1 = (y_1 + y_2) / 2.0f;
        my_2 = (y_2 + y_3) / 2.0f;
        center_x = (m_1 * mx_1 - m_2 * mx_2 + my_2 - my_1) / (m_1 - m_2);
        center_y = y1_y2 > y2_y3 ? (m_1 * (center_x - mx_1) + my_1) : (m_2 * (center_x - mx_2) + my_2);
    }

    float dx = x_2 - center_x;
    float dy = y_2 - center_y;

    return TriangleCircle{ i, j, k, center_x, center_y, dx*dx + dy*dy};
}

void remove_duplicates(std::vector<int> &edges)
{
    int j = edges.size();
    while (j >= 2)
    {
        int b = edges[--j];
        int a = edges[--j];

        int i = j;
        while (i >= 2)
        {
            int n = edges[--i];
            int m = edges[--i];

            if ((a == m && b == n) || (a == n && b == m))
            {
                edges.erase(std::next(edges.begin(), j), std::next(edges.begin(), j + 2));
                edges.erase(std::next(edges.begin(), i), std::next(edges.begin(), i + 2));

                j -= 2;
                break;
            }
        }
    }
}

std::vector<int> triangulate(std::vector<Point> &points)
{
    size_t points_count = points.size();

    // if the nmber is less than 3, nothing to do
    if (points_count < 3)
    {
        return std::vector<int>(0);
    }

    // sort points by x coordinate
    // create array with indices 0, 1, 2, ...
    std::vector<int> indices(points_count);
    for (size_t  i = 0; i < points_count; i++)
    {
        indices[i] = i;
    }

    // sort it by using input points
    std::sort(indices.begin(), indices.end(), [&points](int a, int b) { return points[a].x < points[b].x; });

    const std::vector<Point> st = build_supertriangle(points);
    // add points of the super triangle into input array
    points.insert(points.end(), st.begin(), st.end());

    // create buffers
    std::vector<TriangleCircle> open_list;
    std::vector<TriangleCircle> closed_list;
    std::vector<int> edges_list;

    // init open buffer by super triangle
    open_list.push_back(circumcircle(points, points_count, points_count + 1, points_count + 2));
    
    for (size_t i = 0; i < points_count; i++)
    {
        int c = indices[i];
        Point p = points[c];
        edges_list.clear();

        for (int j = open_list.size() - 1; j >= 0; j--)
        {
            TriangleCircle t = open_list[j];
            
            float dx = p.x - t.x;
            if (dx > 0.0f && dx*dx > t.radius_sq)
            {
                open_list.erase(open_list.begin() + j);
                closed_list.push_back(t);
                continue;
            }

            float dy = p.y - t.y;
            if (dx*dx + dy*dy - t.radius_sq > 0.00001f)
            {
                continue;
            }

            open_list.erase(open_list.begin() + j);
            edges_list.insert(edges_list.end(), { t.i, t.j, t.j, t.k, t.k, t.i });
        }

        // delete edges with two triangles
        remove_duplicates(edges_list);

        // add triangles for the remain edges to the open list
        int k = edges_list.size();
        while (k >= 2)
        {
            int b = edges_list[--k];
            int a = edges_list[--k];
            open_list.push_back(circumcircle(points, a, b, c));
        }
    }

    // add to the closest list all triangles from the remain open list
    for (size_t i = 0; i < open_list.size(); i++)
    {
        closed_list.push_back(open_list[i]);
    }

    open_list.clear();
    edges_list.clear();

    // form the output array
    std::vector<int> triangles;
    for (size_t i = 0; i < closed_list.size(); i++)
    {
        TriangleCircle t = closed_list[i];
        if (t.i < points_count && t.j < points_count && t.k < points_count)
        {
            triangles.insert(triangles.end(), { t.i, t.j, t.k });
        }
    }

    closed_list.clear();

    return triangles;
}