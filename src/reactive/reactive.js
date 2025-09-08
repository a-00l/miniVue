import { isObject } from "../utils/index.js";
import { track, trigger } from './index.js'

export function reactive(target) {
  // 判断target是否是对象
  if (!isObject(target)) return target
  // 目标是否为proxy，是则返回target
  if (isReactive(target)) return target

  return new Proxy(target, {
    get(target, key, receiver) {
      // 如果已经是reactive，则返回
      if (key === '__isReactive') return true
      // 收集
      track(target, key)
      return Reflect.get(target, key, receiver)
    },
    set(target, key, newValue, receiver) {
      const result = Reflect.set(target, key, newValue, receiver)
      trigger(target, key)
      return result
    }
  })
}

function isReactive(target) {
  return target && target.__isReactive
}