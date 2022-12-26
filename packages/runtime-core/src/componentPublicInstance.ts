import { hasOwn } from "@vue/shared";

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // 可以取值时   s要访问 setUpState props state

    const { setupState, props, data } = instance;
    if (key[0] == "$") {
      return; // 不能访问$开头的变量
    }
    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    } else if (hasOwn(data, key)) {
      return data[key];
    } else {
      return undefined;
    }
  },
  set({ _: instance }, key, value) {
    const { setupState, props, data } = instance;
    if (hasOwn(setupState, key)) {
      setupState[key] = value;
    } else if (hasOwn(props, key)) {
      props[key] = value;
    } else if (hasOwn(data, key)) {
      data[key] = value;
    }
    return true;
  },
};

// instance  表示组件的状态   各种各样的状态   组件的相关信息
// context 就4个参数  是为了开发时使用的
// proxy 主要时为了取值方便
