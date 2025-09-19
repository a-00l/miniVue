import { normalizeVNode, patch, queueJob } from "."
import { compile } from "../compiler"
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

// component实现思路：
// 1. 定义instance对象，里面包含props、attrs
// 2. 将vnode中的props和attrs做区分，分别存储到instance中
// 3. 调用type.setup(props, { attrs })传入必要参数，获取到其return回来的值
// 4. 定义instance.ctx，将setup中的值和props全都存入到ctx中
// 5. 挂载component，创建instance.mount = () => {}在这里面实现挂载逻辑
// 6. 在mount中调用render(instance.ctx)获取到由h函数返回的数据结构
// 7. 使用normalizeVNode格式化render函数返回的结构（render结构：[]，{}，string | number）
// 8. 调用patch挂载component
// 9. 由于component中可能有响应式对象，因此将mount函数替换为update并用effect包裹instance.update = effect(() => {})
// 10. 定义subTree记录当前节点，使用instance.subTree存储起来
// 11. 定义prev获取现在的subTree，用来与更新后的subTree做比较，最后调用patch
// 12. 触发updateComponent时，在mountComponent中我们不知道新节点vnode是什么，所以定义next来存储新节点
// 13. 使用vnode.component来记录当前component的实例，也好在外面能够使用到组件中的实例，可以用来挂载next
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

  // 使用compiler解析HTML
  if (!Component.render && Component.template) {
    let { template } = Component
    const code = compile(template)
    Component.render = new Function('ctx', code)
  }

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
    const subTree = instance.subTree = normalizeVNode(Component.render(instance.ctx))
    // 5.1 实现透传
    if (Object.keys(instance.attrs).length) {
      subTree.props = {
        ...subTree?.props,
        ...instance.attrs
      }
    }

    // 5.2 比较两个组件
    patch(prev, subTree, container, anchor)
    vnode.el = subTree.el;
  }, {
    schedule: queueJob
  })
}