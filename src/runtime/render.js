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

function isSameType(n1, n2) {
  return n1.type === n2.type
}