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
 * @description 挂载Text节点
 */
function mountTextNode(vnode, container) {
  const text = document.createTextNode(vnode.children)
  container.appendChild(text)
  // 记录dom节点
  container.el = vnode
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
 * @description 比较两个Element元素的不同
 * @param {*} n1 
 * @param {*} n2 
 */
function patchElement(n1, n2) {
  patchProps(n1.props, n2.props, n1.el)
  patchChildren(n1, n2, n1.el)
}

function patchChildren(n1, n2, el) {
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
      mountChildren(c2, el)
    } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // TODO：diff
      patchKeyedChildren(c1, c2, el)
    } else {
      mountChildren(c2, el)
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
function mountElement(vnode, container) {
  // 1.创建节点
  const { type, shapeFlag } = vnode
  const el = document.createElement(type)
  // 2.设置props
  patchProps(null, vnode.props, el)
  // 3.根据不同的children进行不同的处理
  if (shapeFlag & ShapeFlags.CHILDREN) {
    // 3.1挂载文本节点
    mountTextNode(el, container)
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // 3.2挂载数组节点
    mountChildren(el, container)
  }

  // 记录dom节点
  container.el = el
}

/**
 * @description 挂载children节点
 */
function mountChildren(children, container) {
  children.forEach(child => {
    parse(null, child, container)
  });
}
/**
 * @description 比较两个节点的props
 */
export function patchProps(oldProps, newProps, el) {
  if (oldProps === newProps) return

  // 1. 遍历新的属性，把新旧属性一一对比
  for (const key in newProps) {
    const newValue = newProps[key]
    const oldValue = oldProps[key]

    if (newValue !== oldValue) {
      // 比较不同的值进行修改
      patchDomProp(oldValue, newValue, key, el)
    }
  }

  // 2. 遍历旧的属性，删除没有的属性
  for (const key in oldProps) {
    if (newProps[key] == null) {
      // 删除旧的属性
      patchDomProp(oldProps[key], null, key, el)
    }
  }
}

// 检查boolean属性
const domPropsRE = /^(value|checked|selected|muted|disabled)$/;
function patchDomProp(oldValue, newValue, key, el) {
  switch (key) {
    case 'class':
      // 1. 处理class，直接赋新值
      el.className = newValue
      break;
    case 'style':
      // 2.1 遍历新节点的style并设置style
      for (const styleName in newValue) {
        el.style[styleName] = newValue[styleName]
      }

      if (oldValue) {
        // 2.2 如果旧节点存在，则遍历旧节点的style，将其置为空
        for (const oldKey in oldValue) {
          if (newValue === null || newValue[oldKey] == null) {
            el.style[oldKey] = ''
          }
        }
      }
      break;
    default:
      // 3. 处理事件，使用正则来判断是否为事件，添加新的事件
      if (/^on[A-Z]/.test(key)) {
        const event = key.slice(2).toLocaleLowerCase()
        // 3.1 如果旧事件存在，则删除该事件
        if (oldValue) {
          el.removeEventListener(event)
        }

        // 3.2 如果新添加的事件有值，则该添加事件
        if (newValue) {
          el.addEventListener(event, newValue)
        }
      } else if (domPropsRE.test(key)) {
        // 4. 特殊处理value、checked、selected、muted、disabled为其设置boolean
        el[key] = true
      } else {
        // 5. 如果属性为null || false则删除，如不则设置新属性
        if (newValue == null || newValue == false) {
          el.removeAttribute(key)
        } else {
          el.setAttribute(key, newValue)
        }
      }
      break;
  }
}
/**
 * @description 对Fragment节点比较
 */
function processFragment(n1, n2, container) {
  if (n1) {
    // 1.如果n1存在，则进行children比较
    patchChildren(n1, n2, container)
  } else {
    // 2.如果n1不存在，则挂载n2的所有children
    mountChildren(n2.children, container)
  }
}

function isSameType(n1, n2) {
  return n1.type === n2.type
}