const depsMap = new Map()
/**
 * @description 收集对应key的effect
 * @param {object} target 
 * @param {string} key 
 */
export function track(target, key) {
  // 没有effect，则返回
  if (!currentEffect) return

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

/**
 * @description 触发对应key的effect
 * @param {object} target 
 * @param {string} key 要触发effect的键值 
 */
export function trigger(target, key) {
  let deps = depsMap.get(target)
  if (!deps) return

  let dep = deps.get(key)
  if (!dep) return

  // 触发
  dep.forEach(effectFn => {
    if (effectFn.schedule) {
      // 触发调度器
      effectFn.schedule(effectFn)
    } else {
      effectFn()
    }
  });
}

// 记录effect
let currentEffect;
let effects = []
/**
 * @description 副作用函数
 * @param {Function} fn
 */
export function effect(fn, optoins = {}) {
  const effectFn = () => {
    try {
      effects.push(effectFn)
      currentEffect = effectFn
      return fn()
    } finally {
      effects.pop()
      currentEffect = effects[effects.length - 1]
    }
  }

  // 不是懒加载，再自动执行
  if (!optoins.lazy) {
    effectFn()
  }

  // 挂载schedule方法，好再trigger中手动触发
  effectFn.schedule = optoins.schedule
  return effectFn
}