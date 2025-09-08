const depsMap = new Map()
/**
 * @description 收集对应key的effect
 * @param {object} target 
 * @param {string} key 
 */
export function track(target, key) {
  let deps = depsMap.get(target)
  if (!deps) {
    deps = new Map()
    depsMap.set(target, deps)
  }

  let dep = deps.get(key)
  if (!dep) {
    dep = new Set()
    deps.set(key, dep)
  }

  // 收集effect
  dep.add(currentEffect)
}

// 记录effect
let currentEffect;
/**
 * @description 副作用函数
 * @param {Function} fn
 */
export function effect(fn) {
  const effectFn = () => {
    try {
      currentEffect = fn
      return fn()
    } finally {
      currentEffect = null
    }
  }

  // 自动执行一次
  effectFn()

  return effectFn
}