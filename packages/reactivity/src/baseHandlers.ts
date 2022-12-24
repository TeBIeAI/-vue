import {
  hasChanged,
  hasOwn,
  isArray,
  isIntegerKey,
  isObject,
} from "@vue/shared";
import { extend } from "@vue/shared";
import { track, trigger } from "./effect";
import { TrackOperatorTypes, TriggerOperatorTypes } from "./operators";
import { reactive, readonly } from "./reactive";

// 是否为仅读 仅读没有set 并且仅读set会报错
// 是不是深度代理
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver);
    if (!isReadonly) {
      // 如果数据为仅读  就要收集依赖 数据变化后要出发视图变化
      // 用户执行effect  会从这里取值，此时就要收集effect
      console.log("// 用户执行effect  会从这里取值 此时就要收集effect");
      track(target, TrackOperatorTypes.GET, key);
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
    const oldValue = target[key]; // 获取老的值

    // 判断是新增的还是老的值
    let hasKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key);

    // Reflect.set()  会返回当前set值是否成功  具备返回值
    const result = Reflect.set(target, key, value, receiver); // target[key] = value

    // 我们要区分  是新增的  还是修改的
    if (!hasKey) {
      // 新增
      trigger(target, TriggerOperatorTypes.ADD, key, value);
    } else if (hasChanged(oldValue, value)) {
      // 修改
      trigger(target, TriggerOperatorTypes.SET, key, value, oldValue);
    }

    // 当数据更新时  通知对应属性的effect重新执行

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
