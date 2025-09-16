import { normalizeVNode, patch, queueJob } from "."
import { effect, reactive } from "../reactivity"

function updateProps(vnode, instance) {
  const { type: Component, props: vnodeProps } = vnode
  const props = instance.props = {}
  const attrs = instance.attrs = {}
  for (const key in vnodeProps) {
    if (Component.props?.includes(key)) {
      props[key] = vnodeProps[key]
    } else {
      attrs[key] = vnodeProps[key]
    }
  }

  instance.props = reactive(props)
}

export function mountComponent(vnode, container, anchor) {
  const { type: Component } = vnode
  // 1. 创建一个实例
  const instance = vnode.component = {
    props: null,
    attrs: null,
    setupState: null,
    ctx: null,
    subTree: null,
    next: null,
    update: null
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

  // 使用subTree记录当前节点
  // 使用prev来记录还未patch的subTree，也就是上一个节点
  // 将prev、subTree进行patch
  // 在updateComponent时，调用update进行组件更新，但是由于这里的节点不知道什么时候更新，所以用next标记
  // 如果next存在，则进行更新
  // 最后用instance.subTree来记录当前节点，以及将vnode.el更新为subTree.el
  // 5. 挂载节点
  instance.update = effect(() => {
    // 如果两个组件不同，则更新
    if (instance.next) {
      vnode = instance.next
      instance.next = null
      updateProps(vnode, instance)
      instance.ctx = {
        ...instance.props,
        ...instance.setupState
      }
    }

    const prev = instance.subTree
    const subTree = normalizeVNode(Component.render(instance.ctx))
    // 5.1 实现透传
    if (Object.keys(instance.attrs).length) {
      subTree.props = {
        ...subTree?.props,
        ...instance.attrs
      }
    }

    // 5.2 比较两个组件
    patch(prev, subTree, container, anchor)
    instance.subTree = subTree
    vnode.el = subTree.el;
  }, {
    schedule: queueJob
  })
}