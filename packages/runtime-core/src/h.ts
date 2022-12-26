import { isArray, isObject } from "@vue/shared";
import { createVNode, isVnode } from "./vnode";

export function h(type, propsOrChildren, children) {
  // 儿子节点要么是字符串，要么是数组 主要针对createVNode
  // console.log(type, propsOrChildren, children);
  const l = arguments.length;
  // 类型+属性 || 类型+children
  if (l == 2) {
    // 如果propsOrChildren是数组，直接作为第三个参数
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren);
    } else {
      // 如果第二个参数 不是对象  那一定是children
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 1);
    } else if (l === 3 && isVnode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}
