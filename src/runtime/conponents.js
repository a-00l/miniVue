import { normalizeVNode, patch } from "."
import { effect, reactive } from "../reactivity"

function updateProps(vnode, instance) {
  const { type: Component, props: vnodeProps } = vnode
  const props = instance.props = {}
  const attrs = instance.attrs = {}
  for (const key in vnodeProps) {
    if (Component?.props.includes(key)) {
      props[key] = vnodeProps[key]
    } else {
      attrs[key] = vnodeProps[key]
    }
  }

  instance.props = reactive(props)
}

export function mountComponent(vnode, container) {
  const { type: Component } = vnode
  // 1. 创建一个实例
  const instance = {
    props: null,
    attrs: null,
    setupState: null,
    ctx: null,
    subTree: null
  }

  // 2. 记录props和attrs
  updateProps(vnode, instance)
  // 3. 执行setup获取到其中的值
  instance.setupState = Component.setup?.(instance.props, { attrs: instance.attrs })
  // 4. 合并setup和props的值
  instance.ctx = {
    ...instance.props,
    ...instance.setupState
  }


  // 5. 挂载节点
  instance.update = effect(() => {
    // 5.1 将setup中的值传入render获取vnode
    const prev = instance.subTree
    const subTree = instance.subTree = normalizeVNode(Component.render(instance.ctx))
    patch(prev, subTree, container)
  })
}

export function updateComponent(n1, n2) {

}