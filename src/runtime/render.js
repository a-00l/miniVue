import { ShapeFlags } from './index'
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
    parse(prevVNode, vnode, container)
  }
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
export function parse(n1, n2, container) {
  // 1.n1类型和n2类型不相同，则卸载n1
  if (n1 && !isSameType(n1, n2)) {
    unmount(n1)
  }
  // 2.根据n1、n2的类型不同，进行不同处理
  const { shapeFlag } = n2
  if (shapeFlag === ShapeFlags.COMPONENT) {
    processComponent(n1, n2, container)
  } else if (shapeFlag === ShapeFlags.TEXT) {
    processTextNode(n1, n2, container)
  } else if (shapeFlag === ShapeFlags.ELEMENT) {
    processElement(n1, n2, container)
  } else {
    processFragment(n1, n2, container)
  }
}

function processComponent(n1, n2, container) { }
/**
 * @description 对Text节点比较
 */
function processTextNode(n1, n2, container) {
  if (n1) {
    // 1.n1存在，则将n1内容覆盖
    n1.el.textContent = n2.children
  } else {
    // 2.n1不存在，对n2进行挂载操作
    mountTextNode(n2, container)
  }
}

/**
 * @description 对Element节点比较
 */
function processElement(n1, n2, container) {
  if (n1) {
    // 1.n1存在，则比较n1和n2的内容区别
    patchElement(n1, n2, container)
  } else {
    // 2.n1不存在，对n2进行挂载操作
    mountElement(n2, container)
  }
}

/**
 * @description 对Fragment节点比较
 */
function processFragment(n1, n2, container) {
  const { el } = n1
  if (n1) {
    // 1.如果n1存在，则进行比较
    patchFragment(n1, n2, container)
  } else {
    // 2.如果n1不存在，则挂载n2的所有children
    mountChildren(n1, n2, container)
  }
}

function isSameType(n1, n2) {
  return n1.type === n2.type
}