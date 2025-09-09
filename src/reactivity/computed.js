import { isFunction } from "../utils"
import { effect, track, trigger } from "./index"

export function computed(getterOrOption) {
  let getter, setter
  if (isFunction(getterOrOption)) {
    getter = getterOrOption
    setter = () => console.warn('不能修改computed函数');
  } else {
    getter = getterOrOption.get
    setter = getterOrOption.set
  }

  return new ComputedImpl(getter, setter)
}

class ComputedImpl {
  constructor(getter, setter) {
    this._setter = setter
    this._value = null
    // 控制是否触发effect
    this._dirty = true
    // 调度器
    this.effect = effect(getter, {
      lazy: true,
      schedule: () => {
        if (!this._dirty) {
          this._dirty = true
          // 重新运行函数
          trigger(this, 'value')
        }
      }
    })
  }

  get value() {
    if (this._dirty) {
      this._value = this.effect()
      // 收集
      track(this, 'value')
      this._dirty = false
    }

    return this._value
  }

  set value(newValue) {
    this._setter(newValue)
  }
}