var VueReactivity = (function (exports) {
  'use strict';

  const isObject = (value) => typeof value === "object" && value !== null;
  const extend = Object.assign;
  const isArray = (value) => Array.isArray(value);
  const isIntegerKey = (key) => parseInt(key) + "" === key;
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn = (target, key) => hasOwnProperty.call(target, key);
  const hasChanged = (oldValue, value) => oldValue !== value;

  function effect(fn, options = {}) {
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
          console.log("默认effect 先执行一次");
          // 保证effect没有加入到effectstack
          if (!effectStack.includes(effect)) {
              try {
                  effectStack.push(effect);
                  activeEffect = effect;
                  // 函数执行时候 会执行get方法
                  return fn();
              }
              finally {
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
  function track(target, type, key) {
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
  function trigger(target, type, key, newValue, oldValue) {
      // 如果这个属性没有收集过effect  那么不需要做任何操作
      const depsMap = targetMap.get(target);
      if (!depsMap)
          return;
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
              console.log(depsMap, dep, key);
              if (key === "length" || key > newValue) {
                  // 如果更改的长度  小于收集的索引  那么要触发effect重新执行
                  // state.arr.length = 1
                  add(dep);
              }
          });
      }
      else {
          // 可能是对象
          if (key !== undefined) {
              // 这里肯定是修改
              add(depsMap.get(key));
          }
          // 如果修改数组中的某一个索引  该怎么办 比如arr[100] = 1
          // 如果添加一个索引  要触发length的更新
          switch (type) {
              case 0 /* TriggerOperatorTypes.ADD */:
                  if (isArray(target) && isIntegerKey(key)) {
                      add(depsMap.get("length"));
                  }
                  break;
          }
      }
      effects.forEach((effect) => effect());
  }

  // 是否为仅读 仅读没有set 并且仅读set会报错
  // 是不是深度代理
  function createGetter(isReadonly = false, shallow = false) {
      return function get(target, key, receiver) {
          const res = Reflect.get(target, key, receiver);
          if (!isReadonly) {
              // 如果数据为仅读  就要收集依赖 数据变化后要出发视图变化
              // 用户执行effect  会从这里取值，此时就要收集effect
              console.log("// 用户执行effect  会从这里取值 此时就要收集effect");
              track(target, 0 /* TrackOperatorTypes.GET */, key);
          }
          if (shallow)
              return res;
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
          let hasKey = isArray(target) && isIntegerKey(key)
              ? Number(key) < target.length
              : hasOwn(target, key);
          // Reflect.set()  会返回当前set值是否成功  具备返回值
          const result = Reflect.set(target, key, value, receiver); // target[key] = value
          // 我们要区分  是新增的  还是修改的
          if (!hasKey) {
              // 新增
              trigger(target, 0 /* TriggerOperatorTypes.ADD */, key, value);
          }
          else if (hasChanged(oldValue, value)) {
              // 修改
              trigger(target, 1 /* TriggerOperatorTypes.SET */, key, value);
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
  const mutableHandlers = {
      get,
      set,
  };
  const shallowReactiveHandlers = {
      get: shallowGet,
      set: shallowSet,
  };
  const readonlyObj = {
      set: (target, key) => {
          console.warn(`set readonly on key ${key} 失败`);
      },
  };
  const readonlyHandlers = extend({
      get: readonlyGet,
  }, readonlyObj);
  const shallowReadOnlyHandlers = extend({
      get: shallowReadonlyGet,
  }, readonlyObj);

  function reactive(target) {
      return createReactiveObject(target, false, mutableHandlers);
  }
  function shallowReactive(target) {
      return createReactiveObject(target, false, shallowReactiveHandlers);
  }
  function readonly(target) {
      return createReactiveObject(target, true, readonlyHandlers);
  }
  function shallowReadonly(target) {
      return createReactiveObject(target, true, shallowReadOnlyHandlers);
  }
  // 创建一个reactive代理集合
  // weakmap好处是会自动垃圾回收  不会造成内存泄露 而且weakmap存储对象的key 只能是对象
  const reactiveMap = new WeakMap();
  const readonlyMap = new WeakMap();
  // 使用函数科里化 根据参数不同  处理不同
  function createReactiveObject(target, isReadonly, baseHandlers) {
      // 如果目标不是对象 将无法拦截  reactive->只能拦截对象
      if (!isObject(target)) {
          return target;
      }
      // 如果target被代理过了  就不要在代理了  直接返回该对象  可能一个对象被深度代理  又被仅读代理
      const proxyMap = isReadonly ? readonlyMap : reactiveMap;
      const existProxy = proxyMap.get(target);
      if (existProxy)
          return existProxy;
      const proxy = new Proxy(target, baseHandlers);
      // 将要代理的对象和对应的代理结果进行缓存
      proxyMap.set(target, proxy);
      return proxy;
  }

  function ref(value) {
      // 将普通类型 变成一个对象
      return createRef(value);
  }
  function shallowRef(value) {
      return createRef(value, true);
  }
  const convert = (value) => (isObject(value) ? reactive(value) : value);
  class RefImpl {
      rawValue;
      shallow;
      _value;
      // 产生的实例添加该属性  标识为ref
      __v_isRef = true;
      constructor(rawValue, shallow) {
          this.rawValue = rawValue;
          this.shallow = shallow;
          // this._value = rawValue;
          // this.rawValue = rawValue;
          this._value = shallow ? rawValue : convert(rawValue);
      }
      // 类的属性访问器
      get value() {
          track(this, 0 /* TrackOperatorTypes.GET */, "value");
          return this._value;
      }
      set value(newValue) {
          // 判断新老值是否有变化
          if (hasChanged(newValue, this.rawValue)) {
              this.rawValue = newValue;
              this._value = this.shallow ? newValue : convert(newValue);
              trigger(this, 1 /* TriggerOperatorTypes.SET */, "value", newValue);
          }
      }
  }
  class ObjectRefImpl {
      target;
      key;
      // 产生的实例添加该属性  标识为ref
      __v_isRef = true;
      constructor(target, key) {
          this.target = target;
          this.key = key;
      }
      // 类的属性访问器
      get value() {
          track(this, 0 /* TrackOperatorTypes.GET */, "value");
          return this.target[this.key];
      }
      set value(newValue) {
          // 判断新老值是否有变化
          this.target[this.key] = newValue;
      }
  }
  // 可以将target 的 值 转化成ref
  function toRef(target, key) {
      return new ObjectRefImpl(target, key);
  }
  function createRef(rawValue, shallow = false) {
      return new RefImpl(rawValue, shallow);
  }
  function toRefs(object) {
      const result = isArray(object) ? new Array(object.length) : {};
      for (const key in object) {
          result[key] = toRef(object, key);
      }
      return result;
  }

  exports.effect = effect;
  exports.reactive = reactive;
  exports.readonly = readonly;
  exports.ref = ref;
  exports.shallowReactive = shallowReactive;
  exports.shallowReadonly = shallowReadonly;
  exports.shallowRef = shallowRef;
  exports.toRef = toRef;
  exports.toRefs = toRefs;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
//# sourceMappingURL=reactivity.global.js.map
