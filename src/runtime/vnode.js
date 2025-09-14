import { isArray, isNumber, isObject, isString } from "../utils";

// 用于记录操作类型
export const ShapeFlags = {
  ELEMENT: 1, // 00000001
  TEXT: 1 << 1, // 00000010
  FRAGMENT: 1 << 2, // 00000100
  COMPONENT: 1 << 3, // 00001000
  TEXT_CHILDREN: 1 << 4, // 00010000
  ARRAY_CHILDREN: 1 << 5, // 00100000
  CHILDREN: (1 << 4) | (1 << 5), //00110000
};

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

/**
 * 
 * @description 标记类型
 */
export function h(type, props, children) {
  let shapeFlag
  // 标记type类型
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  } else if (type === Text) {
    shapeFlag = ShapeFlags.TEXT
  } else if (type === Fragment) {
    shapeFlag = ShapeFlags.FRAGMENT
  } else {
    shapeFlag = ShapeFlags.COMPONENT
  }

  // 标记children类型
  if (isString(children) || isNumber(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  return {
    type,
    props,
    children,
    shapeFlag,
    el: null,
    anchor: null,
    key: props && props.key,
    component: null
  }
}

/**
 * @description 格式化render返回的vnode
 * @param {*} vnode 
 */
export function normalizeVNode(vnode) {
  if (isArray(vnode)) {
    return h(Fragment, null, vnode)
  }

  if (isObject(vnode)) {
    return vnode
  }

  if (isString(vnode) || isNumber(vnode)) {
    return h(Text, null, vnode.toString())
  }
}