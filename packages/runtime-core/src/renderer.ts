import { effect } from "@vue/reactivity";
import { ShapeFlags } from "@vue/shared";
import { createAppAPI } from "./apiCreateApp";
import { invokerArrFns } from "./apiLifecycle";
import { createComponentInstance, setupComponent } from "./component";
import { queueJob } from "./scheduler";
import { normalizeVNode, Text } from "./vnode";

export function createRenderer(rendererOptions) {
  const {
    createElement: hostCreateElement,
    remove: hostRemove,
    patchProp: hostPatchProp,
    insert: hostInsert,
    querySelector: hostQuerySelector,
    setElementText: hostSetElementText,
    createText: hostCreateText,
    setText: hostSetText,
    nextSibling: hostNextSibling,
  } = rendererOptions;

  // --------------  处理组件 start ------------------

  const setupRenderEffect = (instance, container) => {
    // 需要创建一个effect   在effect中调用render方法，  这样render方法中拿到的数据会收集这个effect，属性更新时effect会重新执行

    // 每个组件都有一个effect  vue3 是组件级更新， 数据变化会重新执行对应组件的effect
    instance.update = effect(
      function componentEffect() {
        if (!instance.isMouted) {
          let { bm, m } = instance;
          if (bm) {
            invokerArrFns(bm);
          }

          // 初次渲染
          let proxyToUse = instance.proxy;
          let subTree = (instance.subTree = instance.render.call(
            proxyToUse,
            proxyToUse
          ));
          // 用render函数的返回值  继续渲染
          patch(null, subTree, container);

          instance.isMouted = true;
          if (m) {
            // mounted 要求我们必须子组件完成后  才会调用
            invokerArrFns(m);
          }
        } else {
          console.log("更新了");
          let { bu, u } = instance;
          if (bu) {
            invokerArrFns(bu);
          }
          // 更新逻辑
          // diff算法 （核心 diff + 序列化 watchAPI 生命周期）
          const prevTree = instance.subTree;
          let proxyToUse = instance.proxy;
          const nextTree = instance.render.call(proxyToUse, proxyToUse);
          patch(prevTree, nextTree, container);
          if (u) {
            // update 要求我们必须子组件完成后  才会调用
            invokerArrFns(u);
          }
        }
      },
      {
        scheduler: queueJob,
      }
    );
  };

  const mountComponent = (initalVNode, container) => {
    // 组件的渲染流程  最核心的是调用setup  拿到返回值  获取render函数返回的结果 进行渲染
    // 1 现有实例
    const instance = (initalVNode.component =
      createComponentInstance(initalVNode));
    // 2 需要的数据解析到实例上
    setupComponent(instance);
    // 3 创建一个effect 让render函数执行
    setupRenderEffect(instance, container);
  };

  const processComponent = (n1, n2, container) => {
    if (n1 === null) {
      mountComponent(n2, container);
    } else {
      // 组件跟新流程
    }
  };

  // --------------  处理组件 end ------------------

  // --------------  处理元素 element start ------------------

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      // 对每个节点再处理一次
      let child = normalizeVNode(children[i]);
      patch(null, child, container);
    }
  };

  const mountElement = (vnode, container, anchor = null) => {
    // 此处为递归渲染
    const { props, shapeFlag, type, children } = vnode;
    let el = (vnode.el = hostCreateElement(type));

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本比较简单 直接放进去
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
    hostInsert(el, container, anchor);
  };

  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      for (let key in newProps) {
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev !== next) {
          hostPatchProp(el, key, prev, next);
        }
      }

      for (let key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null);
        }
      }
    }
  };

  const pathKeyedChildren = (c1, c2, el) => {
    // 对特殊情况进行优化
    let i = 0; // 都是默认从头开始比对
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    // 尽可能减少比对的区域

    // sync from start 从头开始一个个比 遇到不同的就停止了
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    // sync from start
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // common sequence + mount

    // 比较厚  有一方已经完全比较完成
    // 怎么确定是要挂载
    // 如果完成后  最终i的值大于e1  说明老的少 新的多
    // 老的少 新的多
    if (i > e1) {
      // 标识有新增的部分
      if (i <= e2) {
        const nextPos = e2 + 1;
        // 怎么知道向前插入  还是向后插入
        const anchor = nextPos < c2.length ? c2[nextPos].el : null;

        while (i <= e2) {
          patch(null, c2[i], el, anchor); // 只是向后追加
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    } else {
      // 乱序比较  需要尽可能的复用  用新的元素做成一个映射表去老的里面找  一样的复用  不一样的删除
      let s1 = i;
      let s2 = i;

      console.log(s1, s2, e1, e2);
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        const childVNode = c2[i];
        keyToNewIndexMap.set(childVNode.key, i);
      }

      // 去老的里面找  看有没有复用的

      const tobePatched = e2 - s2 + 1;
      const newIndexToOldIndexMap = new Array(tobePatched).fill(0);

      for (let i = s1; i <= e1; i++) {
        const oldVnode = c1[i];
        let newIndex = keyToNewIndexMap.get(oldVnode.key);

        if (newIndex === undefined) {
          // 老的不在新的
          unmount(oldVnode);
        } else {
          // 新的和旧的关系， 索引的关系
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(oldVnode, c2[newIndex], el);
        }
      }

      let increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
      let j = increasingNewIndexSequence.length - 1;

      for (let i = tobePatched; i >= 0; i--) {
        const currentIndex = s2 + i;
        let child = c2[currentIndex];

        let anthor =
          currentIndex + 1 < c2.length ? c2[currentIndex + 1].el : null;

        if (newIndexToOldIndexMap[i] === 0) {
          // 如果自己是0  说明没有被patch过
          patch(null, child, el, anthor);
        } else {
          if (i != increasingNewIndexSequence[j]) {
            hostInsert(child.el, el, anthor);
          } else {
            j--;
          }
        }
      }

      // 最后就是移动节点 并且将新增的节点插入
      // 最长递增子序列
    }
  };

  const getSequence = (arr) => {
    const len = arr.length;
    const result = [0];
    const p = arr.slice(0);
    let start, end, middle;

    for (let i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        let resultLastIndex = result[result.length - 1];
        if (arr[resultLastIndex] < arrI) {
          // 当前的值比上一个人大  直接push 并且让当前值  记录他的前一个
          p[i] = resultLastIndex;
          result.push(i);
          continue;
        }

        // 二分查找  找到比当前值大的哪一个
        start = 0;
        end = result.length - 1;

        while (start < end) {
          // 重合就说明找到了
          middle = ((start + end) / 2) | 0; // 找到中间位置的前一个

          if (arr[result[middle]] < arrI) {
            start = middle + 1;
          } else {
            end = middle;
          }
        }
        if (arrI < arr[result[start]]) {
          if (start > 0) {
            p[i] = result[start - 1];
          }
          result[start] = i;
        }
      }
    }

    let len1 = result.length;
    let last = result[len1 - 1];
    // 根据前驱节点  一个个向前查找
    while (len1-- > 0) {
      result[len1] = last;
      last = p[last];
    }

    return result;
  };

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };

  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;

    // 1 老的有儿子  新的没有  2 新的有儿子  老的没有  3新老都是文本
    const prevShapFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老的是n个孩子  新的是文本
      // case 1 之前是数组  现在文本
      if (prevShapFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 如果c1中包含组件 会调用组件的销毁方法
        unmountChildren(c1);
      }
      // 两个都是文本的情况
      // case 2 两个都是文本
      if (c2 !== c1) {
        hostSetElementText(el, c2);
      }
    } else {
      // 现在是元素  上一次有可能是文本  或者数组
      if (prevShapFlag & ShapeFlags.ARRAY_CHILDREN) {
        // case 3 两个都是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 当前是数组  之前是数组
          // 两个数组的比对 -> 核心diff算法 ******************
          pathKeyedChildren(c1, c2, el);
        } else {
          // 没有孩子 特殊情况
          unmountChildren(c1); // 删除掉老的
        }
      } else {
        // 上一次是文本
        // case 4 现在是数组 之前是文本
        if (prevShapFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };

  const patchElement = (n1, n2, container) => {
    // 走到这里 元素是相同节点
    const el = (n2.el = n1.el);
    // 更新属性  更新儿子
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    patchProps(oldProps, newProps, el);

    patchChildren(n1, n2, el);
  };

  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      // 元素更新
      patchElement(n1, n2, container);
    }
  };

  // --------------  处理元素 element end ------------------

  // ------------- 处理文本  start ------------------
  const processText = (n1, n2, container) => {
    if (n1 === null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    }
  };
  // ------------- 处理文本  end ------------------

  const isSameVNodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key;
  };

  const unmount = (n1) => {
    // 如果是组件  调用组件的生命周期
    hostRemove(n1.el);
  };

  // 根据不同类型  做初始化操作
  const patch = (n1, n2, container, anchor = null) => {
    const { shapeFlag, type } = n2;
    if (n1 && !isSameVNodeType(n1, n2)) {
      // 把以前的删除  换成n2
      anchor = hostNextSibling(n1.el);
      unmount(n1);
      n1 = null; // 相当于重新渲 n2 的流程
    }

    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // console.log("元素");
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // console.log("组件");
          processComponent(n1, n2, container);
        }
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
