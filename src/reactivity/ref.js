import { hasChanged, isObject } from "../utils"
import { reactive, track, trigger } from "./index.js"
export function ref(value) {
  // 判断该值是否为ref
  if (isRef(value)) return value

  return new RefImpl(value)
}

class RefImpl {
  constructor(value) {
    this._value = convert(value)
    this.__isRef = true // 标记Ref类型
  }

  get value() {
    track(this, 'value')
    return this._value
  }

  set value(newValue) {
    // 旧值和新值不同则trigger
    if (hasChanged(this._value, newValue)) {
      this._value = convert(newValue)
      trigger(this, 'value')

      return this._value
    }
  }
}

export function isRef(value) {
  return !!(value && value.__isRef)
}

/**
 * @description 如果参数使object则用reactive处理，否则返回 
 * @param {any} value 
 */
function convert(value) {
  return isObject(value) ? reactive(value) : value
}