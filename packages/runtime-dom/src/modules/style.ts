export const patchStyle = (el, prevValue, nextValue) => {
  const style = el.style;
  if (nextValue == null) {
    el.removeAttrbute("style");
  } else {
    // 老的里新的有没有
    if (prevValue) {
      for (const key in nextValue) {
        if (nextValue[key] == null) {
          style[key] = "";
        }
      }
    }

    // 新的里面 需要复制到style
    for (const key in nextValue) {
      style[key] = nextValue[key];
    }
  }
};
