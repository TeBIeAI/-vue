export const patchAttr = (el, key, value) => {
  if (value == null) {
    el.removeAttrbute(key);
  } else {
    el.setAttrbute(key, value);
  }
};
