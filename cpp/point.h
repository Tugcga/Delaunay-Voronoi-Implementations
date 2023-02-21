#pragma once

#include <string>

struct Point
{
	Point() : x(0.0f), y(0.0f) { }
	Point(float _x, float _y) : x(_x), y(_y) { }

	std::string to_string() const
	{
		return "(" + std::to_string(x) + ", " + std::to_string(y) + ")";
	}

	float x;
	float y;
};