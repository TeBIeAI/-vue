export const isObject = (value) => typeof value === "object" && value !== null;
export const extend = Object.assign;
export const isArray = (value) => Array.isArray(value);
export const isFunction = (value) => typeof value === "function";
export const isNumber = (value) => typeof value === "number";
export const isString = (value) => typeof value === "string";
export const isIntegerKey = (key) => parseInt(key) + "" === key;

const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (target, key) => hasOwnProperty.call(target, key);

export const hasChanged = (oldValue, value) => oldValue !== value;

export * from "./shapeFlag";
