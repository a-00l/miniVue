import { hasChanged, isObject } from "../utils";
import { track, trigger } from './index.js'

const proxyMap = new Map()
/**
 * @description 使对象获得响应式
 * @param {object} target 
 */
export function reactive(target) {
  // 判断target是否是对象
  if (!isObject(target)) return target
  // 目标是否为proxy，是则返回target
  if (isReactive(target)) return target
  // 如果对象已经被代理了，则返回该对象
  if (proxyMap.has(target)) return proxyMap.get(target)

  const proxy = new Proxy(target, {
    get(target, key, receiver) {

      // 如果已经是reactive，则返回
      if (key === '__isReactive') return true
      const res = Reflect.get(target, key, receiver)
      // 收集
      track(target, key)
      // 实现深层响应式：即对象内部的嵌套对象也能被响应式追踪
      return isObject(res) ? reactive(res) : res
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

  proxyMap.set(target, proxy)
  return proxy
}

export function isReactive(target) {
  return !!(target && target.__isReactive)
}