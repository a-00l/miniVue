export function isObject(target) {
  return target && typeof target === 'object'
}

export function isString(target) {
  return target && typeof target === 'string'
}

export function hasChanged(n1, n2) {
  return n1 !== n2 && !(Number.isNaN(n1) !== Number.isNaN(n2))
}

export function isFunction(target) {
  return typeof target === 'function'
}