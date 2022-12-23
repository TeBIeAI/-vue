var VueReactivity = (function (exports) {
  'use strict';

  const isObject = (value) => typeof value === "object" && value !== null;
  const extend = Object.assign;

  // 是否为仅读 仅读没有set 并且仅读set会报错
  // 是不是深度代理
  function createGetter(isReadonly = false, shallow = false) {
      return function get(target, key, receiver) {
          debugger;
          const res = Reflect.get(target, key, receiver);
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
      debugger;
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

  exports.reactive = reactive;
  exports.readonly = readonly;
  exports.shallowReactive = shallowReactive;
  exports.shallowReadonly = shallowReadonly;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
//# sourceMappingURL=reactivity.global.js.map
