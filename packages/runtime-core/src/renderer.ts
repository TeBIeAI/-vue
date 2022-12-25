import { ShapeFlags } from "@vue/shared";
import { createAppAPI } from "./apiCreateApp";

export function createRenderer(rendererOptions) {
  const mountComponent = (initalVNode, container) => {
    console.log(initalVNode, container);
    // 组件的渲染流程  最核心的是调用setup  拿到返回值  获取render函数返回的结果 进行渲染
  };

  const processComponent = (n1, n2, container) => {
    if (n1 === null) {
      mountComponent(n2, container);
    } else {
      // 组件跟新流程
    }
  };

  // 根据不同类型  做初始化操作
  const patch = (n1, n2, container) => {
    const { shapeFlag } = n2;
    if (shapeFlag & ShapeFlags.ELEMENT) {
      console.log("元素");
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      console.log("组件");
      processComponent(n1, n2, container);
    }
  };

  // core的核心
  const render = (vnode, container) => {
    // 根据不同的虚拟节点  创建对应的真实元素

    // 默认是调用render 因为可能为初始化
    patch(null, vnode, container);
  };
  return {
    createApp: createAppAPI(render),
  };
}
