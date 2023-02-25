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
            "__wbindgen_object_drop_ref": Function(store, self._import_drop_ref),
            "__wbg_buffer_cf65c07de34b9a08": Function(store, self._import_buffer),
            "__wbg_newwithbyteoffsetandlength_5c5a6e21987c3bee": Function(store, self._import_new_with_offset_length),
            "__wbg_set_b7d17bec8c3f4411": Function(store, self._import_set),
            "__wbg_length_78f8a40881924c65": Function(store, self._import_length),
            "__wbg_newwithlength_9e47bf496e7c6f07": Function(store, self._import_new_uint_with_length),
            "__wbg_newwithlength_563e9b820547b3a8": Function(store, self._import_new_f32_with_length),
            "__wbg_setindex_6f3d2e7c148e3c86": Function(store, self._import_set_index),
            "__wbindgen_throw": Function(store, self._import_throw),
            "__wbindgen_memory": Function(store, self._import_memory),
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

    def _import_drop_ref(self, arg0: int):
        self._take_object(arg0)

    def _import_buffer(self, arg0: int) -> int:
        ret = self._get_object(arg0)
        return self._add_heap_object(ret)

    def _import_new_with_offset_length(self, arg0: int, arg1: int, arg2: int) -> int:
        memory_view = self._get_object(arg0).uint32_view(offset=arg1//4)
        ret = [0] * arg2
        for i in range(arg2):
            ret[i] = memory_view[i]
        return self._add_heap_object(ret)

    def _import_set(self, arg0: int, arg1: int, arg2: int):
        self._get_object(arg0)[arg2] = self._get_object(arg1)

    def _import_length(self, arg0: int) -> int:
        ret = len(self._get_object(arg0))
        return ret

    def _import_new_uint_with_length(self, arg0: int) -> int:
        ret = [0] * arg0
        return self._add_heap_object(ret)

    def _import_new_f32_with_length(self, arg0: int) -> int:
        ret = [0.0] * arg0
        return self._add_heap_object(ret)

    def _import_set_index(self, arg0: int, arg1: int, arg2: float):
        self._get_object(arg0)[arg1] = arg2

    def _import_throw(self, arg0: int, arg1: int):
        return "something wrong"

    def _import_memory(self) -> int:
        ret = self._wasm.exports.memory
        return self._add_heap_object(ret)

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
        return self._take_object(ret)[0]

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
