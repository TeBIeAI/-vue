// 组建中所有的方法

import { isFunction, isObject, ShapeFlags } from "@vue/shared";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

// 创建组件实例
export function createComponentInstance(vnode) {
  // 组件的实例
  const instance = {
    vnode,
    type: vnode.type,
    props: {},
    attrs: {},
    slots: {},
    ctx: null,
    render: null,
    setupState: {}, // 如果setup返回一个对象，这个对象会作为setupstate
    isMouted: false, // 表示这个组件是否挂载过
  };

  instance.ctx = { _: instance };

  return instance;
}

export function setupComponent(instance) {
  const { props, children } = instance.vnode;

  // 根据props解析处props 和 attrs  将其放到instance上
  instance.props = props;
  instance.children = children; //插槽的解析

  // 需要先看一下当前组件 是不是有状态的组件， 函数组件
  let isStateful = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
  if (isStateful) {
    // 表示现在是一个带状态的组件
    // 调用当前实例的setup方法，用setup的返回值，填充setupState和对应的render方法
    setupStatefullComponent(instance);
  }
}

function setupStatefullComponent(instance) {
  // 1 代理  传递给render函数的参数
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any);

  // 2 获取组件的类型  拿到组件的setup方法
  let Component = instance.type;
  let { setup } = Component;
  // -----没有setup 没有render ? ----
  if (setup) {
    let setupContext = createSetupContext(instance);
    const setupResult = setup(instance.props, setupContext);

    handleSetupResult(instance, setupResult);
  } else {
    // 完成组件的启动
    finishComponentSetup(instance);
    // Component.render(instance.proxy);
  }
}

function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult;
  } else if (isObject(setupResult)) {
    instance.setUpState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  let Component = instance.type;

  if (!instance.render) {
    // 对template模板进行搬移  产生render函数
    // instance.render = render; // 将需要生成render函数  放在实例上
    if (!Component.render && Component.template) {
      // 编译template 将结果赋予Component.render
    }
    instance.render = Component.render;
  }
  console.log(instance);
  // 对vue2.0的api做了兼容处理
}

function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    // props: instance.props,  // 生成环境下  没有props
    slots: instance.slots,
    emit: () => {},
    expose: () => {},
  };
}
