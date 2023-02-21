from wasmer import Store, Module, Instance, ImportObject, Function
import random
import time

class Loader:
    def __init__(self, wasm_path):
        self._heap = [None] * 128
        self._heap.extend([None, None, True, False])

        self._heap_next = len(self._heap)

        self._wasm_vector_len = 0

        store = Store()
        module = Module(store, open(wasm_path, "rb").read())

        imports = ImportObject()
        imports.register("wbg", {
            "__wbindgen_number_new": Function(store, self._import_number_new),
            "__wbindgen_object_drop_ref": Function(store, self._import_drop_ref),
            "__wbg_new_b525de17f44a8943": Function(store, self._import_new),
            "__wbg_newwithlength_0da6f12fbc1ab6eb": Function(store, self._import_new_with_length),
            "__wbg_set_17224bc548dd1d7b": Function(store, self._import_set),
            "__wbg_push_49c286f04dd3bf59": Function(store, self._import_push),
            "__wbindgen_throw": Function(store, self._import_throw),
        })

        self._wasm = Instance(module, imports)
        wasm_exports = self._wasm.exports
        wasm_memory = wasm_exports.memory
        self._float32_memory = wasm_memory.float32_view()
        self._uint32_memory = wasm_memory.uint32_view()

        for e in wasm_exports:
            export_name = e[0]
            export_function = e[1]
            if export_name == "build_triangulation":
                self._build_triangulation = export_function
            elif export_name == "bvhnode_new":
                self._new_bvh = export_function
            elif export_name == "bvhnode_new_trianglulation":
                self._new_bvh_triangulation = export_function
            elif export_name == "bvhnode_sample":
                self._bvh_sample = export_function
            if export_name == "__wbindgen_malloc":
                self._malloc = export_function
            elif export_name == "__wbg_bvhnode_free":
                self._bvh_free = export_function

    def _import_number_new(self, arg: "f64") -> int:
        return self._add_heap_object(arg)

    def _import_drop_ref(self, arg: int):
        self._take_object(arg)

    def _import_new(self) -> int:
        return self._add_heap_object([])

    def _import_new_with_length(self, arg: int) -> int:
        return self._add_heap_object([None] * arg)

    def _import_set(self, arg0: int, arg1: int, arg2: int):
        self._get_object(arg0)[arg1] = self._take_object(arg2)

    def _import_push(self, arg0: int, arg1: int) -> int:
        self._get_object(arg0).append(self._get_object(arg1))
        return len(self._heap)

    def _import_throw(self, arg0: int, arg1: int):
        return "something wrong"

    def _add_heap_object(self, obj: int) -> int:
        if self._heap_next == len(self._heap):
            self._heap.append(len(self._heap) + 1)

        idx = self._heap_next
        self._heap_next = self._heap[idx]
        self._heap[idx] = obj

        return idx

    def _get_object(self, idx: int) -> int:
        return self._heap[idx]

    def _drop_object(self, idx: int):
        if idx < 132:
            return None

        self._heap[idx] = self._heap_next
        self._heap_next = idx

    def _take_object(self, idx: int):
        ret: int = self._get_object(idx)
        self._drop_object(idx)
        return ret

    def _pass_array_f32_to_wasm(self, arg) -> int:
        ptr = self._malloc(len(arg) * 4)
        for i in range(len(arg)):
            self._float32_memory[ptr // 4 + i] = arg[i]
        self._wasm_vector_len = len(arg)
        return ptr

    def _pass_array_32_to_wasm(self, arg) -> int:
        ptr: int = self._malloc(len(arg) * 4)
        for i in range(len(arg)):
            self._uint32_memory[ptr // 4 + i] = arg[i]
        self._wasm_vector_len = len(arg)
        return ptr

    def build_triangulation(self, coordinates: list[float]) -> list[int]:
        ptr = self._pass_array_f32_to_wasm(coordinates)
        length = self._wasm_vector_len
        ret = self._build_triangulation(ptr, length)
        array = self._take_object(ret)
        return [int(v) for v in array]

class BVHNode:
    def __init__(self, loader, coordinates: list[float], triangles=None):
        self._loader = loader
        if triangles is None:
            ptr = loader._pass_array_f32_to_wasm(coordinates)
            length = loader._wasm_vector_len
            self._ptr = loader._new_bvh(ptr, length)
        else:
            ptr_0 = loader._pass_array_f32_to_wasm(coordinates)
            length_0 = loader._wasm_vector_len
            ptr_1 = loader._pass_array_32_to_wasm(triangles)
            length_1 = loader._wasm_vector_len
            self._ptr = loader._new_bvh_triangulation(ptr_0, length_0, ptr_1, length_1)

    def __del__(self):
        self._loader._bvh_free(self._ptr)

    def sample(self, x:float, y: float) -> list[float]:
        return self._loader._take_object(self._loader._bvh_sample(self._ptr, x, y))

if __name__ == "__main__":
    wasm_path = "..\\rust\\pkg\\delaunay_bg.wasm"

    loader = Loader(wasm_path)
    coordinates = [-0.5, 3.0, 8.0, -3.5, -7.0, 3.0, 2.0, -10.0, 7.0, 8.0, 8.0, 5.5]
    t = loader.build_triangulation(coordinates)
    print(t)

    bvh = BVHNode(loader, coordinates, t)
    print(bvh.sample(0.0, 0.0))
