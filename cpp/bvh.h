#pragma once
#include "point.h"
#include <vector>

struct AABB
{
	float x_min;
	float y_min;
	float x_max;
	float y_max;

	std::string to_string()
	{
		return "|" + std::to_string(x_min) + ", " + std::to_string(y_min) + ", " + std::to_string(x_max) + ", " + std::to_string(y_max) + "|";
	}
};

class Trinangle
{
public:
	Trinangle(const std::vector<Point>& vertices);
	~Trinangle() {};
	AABB get_aabb();
	Point get_center();
	bool is_point_inside(const Point &point);
	std::string to_string();

	Point get_a();
	Point get_b();
	Point get_c();

private:
	Point a;
	Point b;
	Point c;

	AABB aabb;
	Point center;
};

class BVHNode
{
public:
	BVHNode(const std::vector<Trinangle*> &triangles);
	~BVHNode();

	AABB get_aabb();
	bool is_inside_aabb(const Point &point);
	Trinangle* sample(const Point &point);

private:
	Trinangle* triangle;
	BVHNode* left_node;
	BVHNode* right_node;
	AABB aabb;
};