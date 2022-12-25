import { isFunction } from "@vue/shared";
import { effect, track, trigger } from "./effect";
import { TrackOperatorTypes, TriggerOperatorTypes } from "./operators";

class ComputedRefImpl {
  public _value;
  // getter时候 是否要去缓存的值
  public _dirty = true;
  public effect;

  constructor(getter, public setter) {
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true;
          trigger(this, TriggerOperatorTypes.SET, "value");
        }
      },
    });
  }

  get value() {
    // 计算属性也是要收集依赖
    if (this._dirty) {
      this._value = this.effect();
      this._dirty = false;
      track(this, TrackOperatorTypes.GET, "value");
    }

    return this._value;
  }

  set value(newValue) {
    debugger;
    this.setter(newValue);
  }
}

export function computed(getterOrOptions) {
  let getter;
  let setter;

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {
      return console.warn("function 类型的 computed 不允许赋值");
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
}
