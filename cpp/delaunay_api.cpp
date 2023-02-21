#include <emscripten/bind.h>
#include <emscripten/val.h>

#include "point.h"
#include "delaunay.h"
#include "bvh.h"

using namespace emscripten;

emscripten::val build_triangulation(const emscripten::val &in_coordinates)
{
	// prepare input
	const std::vector<float> coordinates = convertJSArrayToNumberVector<float>(in_coordinates);

	int points_count = coordinates.size() / 2;
	std::vector<Point> points(points_count);
	for (size_t i = 0; i < points_count; i++)
	{
		points[i] = Point(coordinates[2*i], coordinates[2*i + 1]);
	}

	std::vector<int> triangles = triangulate(points);

	// prepare output
	emscripten::val view{ emscripten::typed_memory_view(triangles.size(), triangles.data()) };
	emscripten::val result = emscripten::val::global("Int32Array").new_(triangles.size());
	result.call<void>("set", view);

	return result;
}

class BVHNodeWrapper
{
public:
	BVHNodeWrapper(const emscripten::val &in_coordinates);
	BVHNodeWrapper(const emscripten::val &in_coordinates, const emscripten::val &in_triangles);
	~BVHNodeWrapper();

	emscripten::val sample(float x, float y);

private:
	BVHNode* bvh;
};

BVHNodeWrapper::BVHNodeWrapper(const emscripten::val &in_coordinates)
{
	const std::vector<float> coordinates = convertJSArrayToNumberVector<float>(in_coordinates);

	int points_count = coordinates.size() / 2;
	std::vector<Point> points(points_count);
	for (size_t i = 0; i < points_count; i++)
	{
		points[i] = Point(coordinates[2*i], coordinates[2*i + 1]);
	}

	std::vector<int> trinagle_indices = triangulate(points);
	int trinagles_count = trinagle_indices.size() / 3;
	std::vector<Trinangle*> trinagles(trinagles_count);
	for (size_t i = 0; i < trinagles_count; i++)
	{
		int a = trinagle_indices[3 * i];
		int b = trinagle_indices[3 * i + 1];
		int c = trinagle_indices[3 * i + 2];

		std::vector<Point> vertices = { points[a], points[b], points[c] };
		trinagles[i] = new Trinangle(vertices);
	}

	bvh = new BVHNode(trinagles);
}

BVHNodeWrapper::BVHNodeWrapper(const emscripten::val &in_coordinates, const emscripten::val &in_triangles)
{
	const std::vector<float> coordinates = convertJSArrayToNumberVector<float>(in_coordinates);
	const std::vector<int> triangles = convertJSArrayToNumberVector<int>(in_triangles);

	int triangles_count = triangles.size() / 3;
	std::vector<Trinangle*> triangles_array(triangles_count);
	for (size_t i = 0; i < triangles_count; i++)
	{
		int a = triangles[3 * i];
		int b = triangles[3 * i + 1];
		int c = triangles[3 * i + 2];

		std::vector<Point> vertices = {
			Point(coordinates[2 * a], coordinates[2 * a + 1]),
			Point(coordinates[2 * b], coordinates[2 * b + 1]),
			Point(coordinates[2 * c], coordinates[2 * c + 1]) };
		triangles_array[i] = new Trinangle(vertices);
	}

	bvh = new BVHNode(triangles_array);
}

BVHNodeWrapper::~BVHNodeWrapper()
{
	delete bvh;
}

emscripten::val BVHNodeWrapper::sample(float x, float y)
{
	Point p = Point(x, y);
	Trinangle* s = bvh->sample(p);
	std::vector<float> to_return(0);
	if (s)
	{
		Point a = s->get_a();
		Point b = s->get_b();
		Point c = s->get_c();

		to_return.insert(to_return.end(), { a.x, a.y, b.x, b.y, c.x, c.y });
	}

	emscripten::val view{ emscripten::typed_memory_view(to_return.size(), to_return.data()) };
	emscripten::val result = emscripten::val::global("Float32Array").new_(to_return.size());
	result.call<void>("set", view);

	return result;
}

EMSCRIPTEN_BINDINGS(delaunay_module)
{
	class_<BVHNodeWrapper>("BVHNode")
		.constructor<emscripten::val>()
		.constructor<emscripten::val, emscripten::val>()
		.function("sample", &BVHNodeWrapper::sample);
	function("build_triangulation", &build_triangulation);
}