export const nodeOps = {
  createElement: (targetName) => document.createElement(targetName),

  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },

  insert: (child, parent, anchor = null) => {
    parent.insetBefore(child, anchor);
  },

  querySelector: (selector) => document.querySelector(selector),

  setElementText: (el, text) => (el.textContent = text),

  createText: (text) => document.createTextNode(text),

  setText: (node, text) => (node.value = text),
};
