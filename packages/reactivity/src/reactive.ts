import { isObject } from "@vue/shared";

import {
  mutableHandlers,
  readonlyHandlers,
  shallowReactiveHandlers,
  shallowReadOnlyHandlers,
} from "./baseHandlers";

export function reactive(target) {
  return createReactiveObject(target, false, mutableHandlers);
}

export function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers);
}

export function shallowReadonly(target) {
  return createReactiveObject(target, true, shallowReadOnlyHandlers);
}

// 创建一个reactive代理集合
// weakmap好处是会自动垃圾回收  不会造成内存泄露 而且weakmap存储对象的key 只能是对象
const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();

// 使用函数科里化 根据参数不同  处理不同
export function createReactiveObject(target, isReadonly, baseHandlers) {
  // 如果目标不是对象 将无法拦截  reactive->只能拦截对象
  if (!isObject(target)) {
    return target;
  }

  // 如果target被代理过了  就不要在代理了  直接返回该对象  可能一个对象被深度代理  又被仅读代理
  const proxyMap = isReadonly ? readonlyMap : reactiveMap;

  const existProxy = proxyMap.get(target);
  if (existProxy) return existProxy;

  const proxy = new Proxy(target, baseHandlers);

  // 将要代理的对象和对应的代理结果进行缓存
  proxyMap.set(target, proxy);

  return proxy;
}
