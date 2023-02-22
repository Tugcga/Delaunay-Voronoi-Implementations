#include <iostream>
#include <float.h>

#include "bvh.h"

Trinangle::Trinangle(const Point &a, const Point &b, const Point &c) {
	float x_min = FLT_MAX;
	float y_min = FLT_MAX;
	float x_max = FLT_MIN;
	float y_max = FLT_MIN;

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

	float c_x = (a.x + b.x + c.x) * (1.0f / 3.0f);
	float c_y = (a.y + b.y + c.y) * (1.0f / 3.0f);

	aabb = AABB { x_min, y_min, x_max, y_max };
	center = Point(c_x, c_y);
}

AABB Trinangle::get_aabb() {
	return aabb;
}

Point Trinangle::get_center() {
	return center;
}

bool Trinangle::is_point_inside(const Point& point) {
	float as_x = point.x - a.x;
	float as_y = point.y - a.y;

	bool s_ab = ((b.x - a.x) * as_y - (b.y - a.y) * as_x) > 0;

	if (((c.x - a.x) * as_y - (c.y - a.y) * as_x > 0) == s_ab) {
		return false;
	}
	if (((c.x - b.x) * (point.y - b.y) - (c.y - b.y) * (point.x - b.x) > 0) != s_ab) {
		return false;
	}
	return true;
}

std::string Trinangle::to_string() {
	return "<" + a.to_string() + ", " + b.to_string() + ", " + c.to_string() + ">";
}

Point Trinangle::get_a() {
	return a;
}

Point Trinangle::get_b() {
	return b;
}
Point Trinangle::get_c() {
	return c;
}

AABB union_aabb(AABB &x, AABB &y) {
	return AABB {
		std::min(x.x_min, y.x_min), std::min(x.y_min, y.y_min),
		std::max(x.x_max, y.x_max), std::max(x.y_max, y.y_max)
	};
}

BVHNode::BVHNode(const std::vector<Trinangle*>& triangles) {
	triangle = NULL;
	left_node = NULL;
	right_node = NULL;

	int objects_count = triangles.size();
	if (objects_count == 1) {
		triangle = triangles[0];
		aabb = triangle->get_aabb();
	} else {
		float x_median = 0.0f;
		float y_median = 0.0f;

		float x_min = FLT_MAX;
		float x_max = FLT_MIN;
		float y_min = FLT_MAX;
		float y_max = FLT_MIN;

		for (size_t i = 0; i < objects_count; i++) {
			Trinangle* t = triangles[i];
			Point c = t->get_center();
			x_median += c.x;
			y_median += c.y;

			if (c.x < x_min) { x_min = c.x; }
			if (c.x > x_max) { x_max = c.x; }
			if (c.y < y_min) { y_min = c.y; }
			if (c.y > y_max) { y_max = c.y; }
		}

		int split_axis = (x_max - x_min) > (y_max - y_min) ? 0 : 1;
		float median = split_axis == 0
			? x_median / objects_count
			: y_median / objects_count;

		std::vector<Trinangle*> left;
		std::vector<Trinangle*> right;

		for (size_t i = 0; i < objects_count; i++) {
			Trinangle* t = triangles[i];
			Point c = t->get_center();
			float v = split_axis == 0 ? c.x : c.y;
			if (v < median) {
				left.push_back(t);
			} else {
				right.push_back(t);
			}
		}

		if (left.size() == 0) {
			left.push_back(right[right.size() - 1]);
			right.pop_back();
		}

		if (right.size() == 0) {
			right.push_back(left[left.size() - 1]);
			left.pop_back();
		}

		left_node = new BVHNode(left);
		right_node = new BVHNode(right);

		AABB left_aabb = left_node->get_aabb();
		AABB right_aabb = right_node->get_aabb();

		aabb = union_aabb(left_aabb, right_aabb);
	}
}

BVHNode::~BVHNode() {
	if (triangle) { delete triangle; }
	if (left_node) { delete left_node; }
	if (right_node) { delete right_node; }
}

AABB BVHNode::get_aabb() {
	return aabb;
}

Trinangle* BVHNode::sample(const Point& point) {
	if (aabb.is_point_inside(point)) {
		if (!triangle && left_node && right_node) {
			Trinangle* left_sample = left_node->sample(point);
			Trinangle* right_sample = right_node->sample(point);
			if (!left_sample) {
				return right_sample;
			} else {
				if (!right_sample) {
					return left_sample;
				} else {
					float l_dist = left_sample->get_center().squared_distance(point);
					float r_dist = right_sample->get_center().squared_distance(point);
					return l_dist < r_dist ? left_sample : right_sample;
				}
			}
		} else {
			if (triangle && triangle->is_point_inside(point)) {
				return triangle;
			} else {
				return NULL;
			}
		}
	} else {
		return NULL;
	}
}
