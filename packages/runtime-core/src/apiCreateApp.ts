import { createVNode } from "./vnode";

export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps) {
    const app = {
      _props: rootProps,
      _component: rootComponent,
      _container: null,
      mount: (container) => {
        console.log("渲染的容器是", container);
        console.log("渲染的组件是", rootComponent);
        console.log("渲染的组件props", rootProps);
        // const vnode = {};
        // render(vnode, container);
        // 1 根据组件创建虚拟节点
        // 创建虚拟节点
        const vnode = createVNode(rootComponent, rootProps);

        console.log(vnode);

        // 2 将虚拟节点和容器获取到后调用render
        render(vnode, container);

        app._container = container;
      },
    };

    return app;
  };
}
