import { isObject } from "@vue/shared";
import { extend } from "@vue/shared";
import { reactive, readonly } from "./reactive";

// 是否为仅读 仅读没有set 并且仅读set会报错
// 是不是深度代理
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    debugger;
    const res = Reflect.get(target, key, receiver);

    if (!isReadonly) {
      // 如果数据为仅读  就要收集依赖 数据变化后要出发视图变化
    }

    if (shallow) return res;

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}

function createSetter(shallow = false) {
  return function set(target, key, value, receiver) {
    // Reflect.set()  会返回当前set值是否成功  具备返回值
    const result = Reflect.set(target, key, value, receiver); // target[key] = value

    return result;
  };
}

const get = createGetter();
const shallowGet = createGetter(false, true);
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

const set = createSetter();
const shallowSet = createSetter(true);

export const mutableHandlers = {
  get,
  set,
};

export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet,
};

const readonlyObj = {
  set: (target, key) => {
    console.warn(`set readonly on key ${key} 失败`);
  },
};

export const readonlyHandlers = extend(
  {
    get: readonlyGet,
  },
  readonlyObj
);

export const shallowReadOnlyHandlers = extend(
  {
    get: shallowReadonlyGet,
  },
  readonlyObj
);
