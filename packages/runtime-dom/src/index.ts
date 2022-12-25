import { extend } from "@vue/shared";
import { patchProp } from "./patchProp";
import { nodeOps } from "./nodeOps";
import { createRenderer } from "@vue/runtime-core";
// 核心是提供dom Api  方法

// 渲染时用到的所有方法
const rendererOptions = extend({ patchProp }, nodeOps);

export { rendererOptions };

// vue中使用runtime-core  提供了核心的方法 用来处理渲染  他会使用runtime-dom的api进行渲染
export function createApp(rootComponent, rootProps) {
  const app = createRenderer(rendererOptions).createApp(
    rootComponent,
    rootProps
  );
  const { mount } = app;

  app.mount = function (container) {
    container = nodeOps.querySelector(container);
    container.innerHTNL = "";

    // 将组建渲染成DOM  进行挂载
    // 这一步算是  函数重写  + 函数劫持  对mount进行重写  但是最后调用了mount
    mount(container);
  };

  return app;
}
