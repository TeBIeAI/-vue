import { currentInstance, setCurrentInstance } from "./component";

const enum LifeCycleHooks {
  BEFOR_MOUNT = "bm",
  MOUNTED = "m",
  BEFOR_UPDATE = "bu",
  UPDATE = "u",
}

// 在这个函数中保存了target   闭包
const injectHook = (type, hook, target) => {
  if (!target) {
    return console.warn("钩子使用错误");
  } else {
    const hooks = target[type] || (target[type] = []);

    const wrap = () => {
      setCurrentInstance(target);
      hook.call(target);
      setCurrentInstance(null);
    };

    hooks.push(wrap);
  }
};

export const invokerArrFns = (fns) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i]();
  }
};

const createHook = (lefeCycle) => {
  // target用来表示时那个实例的钩子
  return function (hook, target = currentInstance) {
    // 给当前实例  增加对应的生命周期  即可
    injectHook(lefeCycle, hook, target);
  };
};

export const onBeforMount = createHook(LifeCycleHooks.BEFOR_MOUNT);

export const onMounted = createHook(LifeCycleHooks.MOUNTED);

export const onBeforeUpdate = createHook(LifeCycleHooks.BEFOR_UPDATE);

export const onUpdate = createHook(LifeCycleHooks.UPDATE);
