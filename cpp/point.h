#pragma once

#include <string>

struct Point {
	Point() = default;
	Point(float _x, float _y) : x(_x), y(_y) { }

	float squared_distance(const Point &other) {
		float dx = x - other.x;
		float dy = y - other.y;
		return dx * dx + dy * dy;
	}

	std::string to_string() const {
		return "(" + std::to_string(x) + ", " + std::to_string(y) + ")";
	}

	float x;
	float y;
};
