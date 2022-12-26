import { isArray } from "./../../shared/src/index";
import { isObject, isString, ShapeFlags } from "@vue/shared";

export function isVnode(vnode) {
  return vnode.__v_isVnode;
}

export function createVNode(type, props, children = null) {
  // 可以根据type判断是组件还是普通元素

  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;

  // 给虚拟节点加个类型   一个对象来描述对应的内容，虚拟节点有跨平台的能力
  const vnode = {
    __v_isVnode: true,
    props,
    type,
    component: null, // 存放组件对应的实例
    children,
    key: props && props.key, // diff会用到key
    el: null, // 稍后会将虚拟节点和真是节点对应起来
    shapeFlag, // 可以判断出自己的类型  和儿子的类型
  };

  // 判断children 的类型， 看是否是普通元素  还是插槽
  normalizeChildren(vnode, children);

  return vnode;
}

function normalizeChildren(vnode, children) {
  let type = 0;
  if (children === null) {
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    type = ShapeFlags.TEXT_CHILDREN;
  }

  vnode.shapeFlag = vnode.shapeFlag | type;
}

export const Text = Symbol("text");
export function normalizeVNode(child) {
  if (isObject(child)) return child;

  return createVNode(Text, null, String(child));
}
