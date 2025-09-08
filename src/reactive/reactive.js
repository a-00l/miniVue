import { hasChanged, isObject } from "../utils/index.js";
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
      // 获取旧值
      const oldValue = target[key]
      const result = Reflect.set(target, key, newValue, receiver)

      // 如果值改变了，再触发
      if (hasChanged(oldValue, newValue)) {
        trigger(target, key)
      }

      return result
    }
  })
}

function isReactive(target) {
  return target && target.__isReactive
}