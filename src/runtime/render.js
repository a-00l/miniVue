import { patchProps, ShapeFlags } from './index'
export function render(vnode, container) {
  const prevVNode = container._vnode
  // 1.vnode为空，卸载prevVNode
  if (!vnode) {
    if (prevVNode) {
      unmount(prevVNode, container)
    }
  }
  else {
    // 2.vnode有值，将prevVNode和vnode进行比较
    patch(prevVNode, vnode, container)
  }

  container._vnode = vnode
}

/**
 * @description 卸载节点
 * @param {*} vnode 要卸载的节点
 */
function unmount(vnode, container) {
  const { shapeFlag, el } = vnode
  // 根据不同type进行不同卸载操作
  if (shapeFlag === ShapeFlags.COMPONENT) {
    // 1.卸载组件
    unmountConponent(vnode)
  } else if (shapeFlag === ShapeFlags.FRAGMENT) {
    // 2.卸载Fragment
    unmountFragment(vnode)
  } else {
    // 3.卸载Element、Text
    el.parentNode.removeChild(el)
  }
}

/**
 * @description 比较新旧节点
 * @param {*} n1 旧节点 
 * @param {*} n2 新节点
 */
export function patch(n1, n2, container, anchor) {
  // 1.n1类型和n2类型不相同，则卸载n1
  if (n1 && !isSameType(n1, n2)) {
    anchor = n1.el ? n1.el.nextSibling : undefined
    unmount(n1)
    n1 = null
  }
  // 2.根据n1、n2的类型不同，进行不同处理
  const { shapeFlag } = n2
  if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponent(n1, n2, container)
  } else if (shapeFlag & ShapeFlags.TEXT) {
    processTextNode(n1, n2, container, anchor)
  } else if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(n1, n2, container, anchor)
  } else {
    processFragment(n1, n2, container, anchor)
  }
}

function processComponent(n1, n2, container) { }
/**
 * @description 对Text节点比较
 */
function processTextNode(n1, n2, container, anchor) {
  if (n1) {
    n2.el = n1.el;
    // 1.n1存在，则将n1内容覆盖
    n1.el.textContent = n2.children
  } else {
    // 2.n1不存在，对n2进行挂载操作
    mountTextNode(n2, container, anchor)
  }
}

/**
 * @description 挂载Text节点
 */
function mountTextNode(vnode, container, anchor) {
  const text = document.createTextNode(vnode.children)
  container.insertBefore(text, anchor)
  // 记录dom节点
  vnode.el = text
}

/**
 * @description 对Element节点比较
 */
function processElement(n1, n2, container, anchor) {
  if (n1) {
    // 1.n1存在，则比较n1和n2的内容区别
    patchElement(n1, n2, container)
  } else {
    // 2.n1不存在，对n2进行挂载操作
    mountElement(n2, container, anchor)
  }
}

/**
 * @description 比较两个Element元素的不同
 * @param {*} n1 
 * @param {*} n2 
 */
function patchElement(n1, n2) {
  n2.el = n1.el
  patchProps(n1.props, n2.props, n1.el)
  patchChildren(n1, n2, n1.el)
}

function patchChildren(n1, n2, el, anchor) {
  const { children: c1, shapeFlag: prevShapeFlag } = n1
  const { children: c2, shapeFlag } = n2
  // 一共有三种情况：
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // Text
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 卸载旧节点
      unmountChildren(c1)
    }

    el.textContent = n2.children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // array
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = ''
      mountChildren(c2, el, anchor)
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // TODO：diff
      patchUnkeyedChildren(c1, c2, el, anchor)
    } else {
      mountChildren(c2, el, anchor)
    }
  } else {
    // null
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = ''
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(c1)
    }
  }

}

function patchUnkeyedChildren(c1, c2, container, anchor) {
  const oldLength = c1.length
  const newLength = c2.length
  const commonLength = Math.min(oldLength, newLength)
  // 将公共的children进行比较
  for (let i = 0; i < commonLength; i++) {
    patch(c1[i], c2[i], container)
  }

  if (oldLength > newLength) {
    // 卸载旧值多出来的children
    unmountChildren(c1.slice(commonLength))
  } else {
    // 挂载新值多出来的children
    mountChildren(c2.slice(commonLength), container, anchor)
  }
}

/**
 * @description 卸载所有子节点
 * @param {*} vnode 
 */
function unmountChildren(vnode) {
  vnode.forEach(child => {
    unmount(child)
  })
}

/**
 * @description 挂载Element节点
 */
function mountElement(vnode, container, anchor) {
  // 1.创建节点
  const { type, shapeFlag } = vnode
  const el = document.createElement(type)
  // 2.设置props
  patchProps(null, vnode.props, el)
  // 3.根据不同的children进行不同的处理
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // 3.1挂载文本节点
    mountTextNode(vnode, el)
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // 3.2挂载数组节点
    mountChildren(vnode.children, el)
  }

  container.insertBefore(el, anchor)
  // 记录dom节点
  vnode.el = el
}

/**
 * @description 挂载children节点
 */
function mountChildren(children, container, anchor) {
  children.forEach(child => {
    patch(null, child, container, anchor)
  });
}

/**
 * @description 对Fragment节点比较
 */
function processFragment(n1, n2, container, anchor) {
  // 创建空节点，用于标注Fragment位置
  const fragmentStartAnchor = n2.el = n1 ? n1.el : document.createTextNode('')
  const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : document.createTextNode('')
  if (n1) {
    // 1.如果n1存在，则进行children比较
    patchChildren(n1, n2, container, fragmentEndAnchor)
  } else {
    container.insertBefore(fragmentStartAnchor, anchor)
    container.insertBefore(fragmentEndAnchor, anchor)
    // 2.如果n1不存在，则挂载n2的所有children
    mountChildren(n2.children, container, fragmentEndAnchor)
  }
}

function isSameType(n1, n2) {
  return n1.type === n2.type
}