export const patchEvent = (el, key, value) => {
  // 对函数进行缓存
  const invokers = el._evi || (el._evi = {});

  const exists = invokers[key];

  if (value && exists) {
    // 需要绑定事件  而且还存在的情况下
    exists.value = value;
  } else {
    const eventName = key.slice(2).toLowerCase();
    if (value) {
      // 要绑定事件 以前没有绑定过
      let invoker = (invokers[key] = createInvoder(value));
      el.addEventListener(eventName, invoker);
    } else {
      // 以前绑定了  但是没有VAlue
      el.removeEventListener(eventName, exists);
      invokers[key] = undefined;
    }
  }
};

function createInvoder(value) {
  const invoker = function (e) {
    invoker.value(e);
  };
  // 为了能随时更改value属性
  invoker.value = value;

  return invoker;
}
