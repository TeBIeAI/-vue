// 这里面针对的是一系列属性操作
import { patchAttr } from "./modules/attr";
import { patchStyle } from "./modules/style";
import { patchEvent } from "./modules/event";
import { patchClass } from "./modules/class";

export const patchProp = (el, key, prevValue, nextValue) => {
  switch (key) {
    case "class":
      patchClass(el, nextValue);
      break;
    case "style":
      patchStyle(el, prevValue, nextValue);
      break;
    default:
      // 如果不是事件  才是属性
      if (/^on[^a-z]/.test(key)) {
        patchEvent(el, key, nextValue);
      } else {
        patchAttr(el, key, nextValue);
      }
      break;
  }
};
