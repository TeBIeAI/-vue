import { hasChanged, isArray, isObject } from "@vue/shared";
import { track, trigger } from "./effect";
import { TrackOperatorTypes, TriggerOperatorTypes } from "./operators";
import { reactive } from "./reactive";

export function ref(value) {
  // 将普通类型 变成一个对象

  return createRef(value);
}

export function shallowRef(value) {
  return createRef(value, true);
}

const convert = (value) => (isObject(value) ? reactive(value) : value);

class RefImpl {
  public _value;
  // 产生的实例添加该属性  标识为ref
  public __v_isRef = true;

  constructor(public rawValue, public shallow) {
    // this._value = rawValue;
    // this.rawValue = rawValue;
    this._value = shallow ? rawValue : convert(rawValue);
  }

  // 类的属性访问器
  get value() {
    track(this, TrackOperatorTypes.GET, "value");
    return this._value;
  }

  set value(newValue) {
    // 判断新老值是否有变化
    if (hasChanged(newValue, this.rawValue)) {
      this.rawValue = newValue;
      this._value = this.shallow ? newValue : convert(newValue);
      trigger(this, TriggerOperatorTypes.SET, "value", newValue);
    }
  }
}

class ObjectRefImpl {
  // 产生的实例添加该属性  标识为ref
  public __v_isRef = true;

  constructor(public target, public key) {}

  // 类的属性访问器
  get value() {
    track(this, TrackOperatorTypes.GET, "value");
    return this.target[this.key];
  }

  set value(newValue) {
    // 判断新老值是否有变化
    this.target[this.key] = newValue;
  }
}

// 可以将target 的 值 转化成ref
export function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}

function createRef(rawValue, shallow = false) {
  return new RefImpl(rawValue, shallow);
}

export function toRefs(object) {
  const result = isArray(object) ? new Array(object.length) : {};

  for (const key in object) {
    result[key] = toRef(object, key);
  }

  return result;
}
