import { isArray, isIntegerKey } from "@vue/shared";
import { TriggerOperatorTypes } from "./operators";

export function effect(fn, options: any = {}) {
  // 需要让这个effect编程响应式effect  做到数据变化重新执行
  const effect = createReactiveEffect(fn, options);
  if (!options.lazy) {
    // 响应式的effect会先执行一次
    effect();
  }

  return effect;
}

let uid = 0;
// 存储当前正在运行的effect track函数内部要使用
let activeEffect;
// 用于存储effect嵌套使用时候出现混乱问题  此时effect函数调用是一个栈结构 此处讲解在依赖收集的30分钟
const effectStack = [];
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    // console.log("默认effect 先执行一次");

    // 保证effect没有加入到effectstack
    if (!effectStack.includes(effect)) {
      try {
        effectStack.push(effect);
        activeEffect = effect;
        // 函数执行时候 会执行get方法
        return fn();
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };

  // 制作一个effect标识， 用于区分effect
  effect.id = uid++;
  // 用于标识这是一个响应式的effect
  effect._isEffect = true;
  // 响应式effect所对应的原函数
  effect.raw = fn;
  // 在effect上保存用户的属性
  effect.options = options;
  return effect;
}

// 描述  追踪 target 进行type操作时  的key
// 内部可以拿到当前的effect
// 让某个对象中的属性 收集当前它对应的effect函数
const targetMap = new WeakMap();
export function track(target, type, key) {
  // activeEffect;
  // 比如 {name: '韩超', age: 19} => name => [effect, effect] effect 可能是多个  多个effect处理同一个对象的属性  会产生多个effect
  if (activeEffect === undefined) {
    //此属性不用手机依赖 因为没在effect中使用
    return;
  }

  // 同一个effect内  如果get某个属性2次  只会存储一次   多个effect 如果get同一个对象属性   那么该属性对应的effect就会出现多个
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
  }
}

export function trigger(target, type, key?, newValue?, oldValue?) {
  // 如果这个属性没有收集过effect  那么不需要做任何操作
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const effects = new Set();
  // 需要将所有的要执行的effect  全部存到一个新的集合  最后一起执行

  const add = (effectsToAdd) => {
    if (effectsToAdd) {
      effectsToAdd.forEach((effect) => effects.add(effect));
    }
  };

  // 1 看修改的是不是数组的长度  因为改长度影响比较大
  if (key === "length" && isArray(target)) {
    // 如果对应的长度  有依赖收集  需要更新
    depsMap.forEach((dep, key) => {
      if (key === "length" || key > newValue) {
        // 如果更改的长度  小于收集的索引  那么要触发effect重新执行
        // state.arr.length = 1
        add(dep);
      }
    });
  } else {
    // 可能是对象
    if (key !== undefined) {
      // 这里肯定是修改
      add(depsMap.get(key));
    }

    // 如果修改数组中的某一个索引  该怎么办 比如arr[100] = 1
    // 如果添加一个索引  要触发length的更新
    switch (type) {
      case TriggerOperatorTypes.ADD:
        if (isArray(target) && isIntegerKey(key)) {
          add(depsMap.get("length"));
        }
        break;

      default:
        break;
    }
  }
  effects.forEach((effect: any) => {
    if (effect.options.scheduler) {
      effect.options.scheduler(effect);
    } else {
      effect();
    }
  });
}
