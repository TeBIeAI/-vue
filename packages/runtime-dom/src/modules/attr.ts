export const patchAttr = (el, key, value) => {
  if (value == null) {
    el.removeAttrbute(key);
  } else {
    el.setAttribute(key, value);
  }
};
