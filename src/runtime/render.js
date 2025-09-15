import { mountComponent, patchProps, ShapeFlags } from './index'
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
function unmount(vnode) {
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

function unmountConponent(vnode) {
  unmount(vnode.component.subTree)
}
/**
 * @description 删除所有Fragment节点
 * @param {*} vnode 
 */
function unmountFragment(vnode) {
  const { el: start, anchor: end } = vnode
  while (start != end) {
    const next = start.nextSibling
    unmount(start)
    start = next
  }

  unmount(end)
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

function processComponent(n1, n2, container) {
  if (n1) {
    updateComponent(n1, n2)
  } else {
    mountComponent(n2, container)
  }
}

function updateComponent(n1, n2) {
  n2.component = n1.component
  n1.component.next = n2
  n1.component.update()
}
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
      if (c1[0] && c1[0].key != null && c2[0], c2[0].key != null) {
        // 1.有key
        patchkeyedChildren(c1, c2, el, anchor)
      } else {
        // 2.无key
        patchUnkeyedChildren(c1, c2, el, anchor)
      }
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

/**
 * @description 比较有key的节点
 */
function patchkeyedChildren(c1, c2, el, anchor) {
  let i = 0;
  let e1 = c1.length - 1
  let e2 = c2.length - 1
  // 1.从左往右依次对比
  while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
    patch(c1[i], c2[i], el, anchor)
    i++
  }

  // 2.从右往左依次对比
  while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
    patch(c1[e1--], c2[e2--], el, anchor)
  }

  if (i > e1) {
    // 3 如果i > e1新增节点
    for (let j = i; j <= e2; j++) {
      const nextPos = e2 + 1
      // 若新节点列表中当前位置的下一个节点存在DOM元素，则以此元素为锚点（插入到它前面）
      // 若下一个节点不存在，则使用传入的默认锚点
      const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor
      patch(null, c2[j], el, curAnchor)
    }
  } else if (i > e2) {
    // 4 如果i < e1删除节点
    for (let j = i; j <= e1; j++) {
      unmount(c1[j])
    }
  } else {
    // 5 不满足3 和 4则进行diff
    const map = new Map()
    // 5.1 将需要进行diff的vnode使用map存储起来
    for (let j = i; j <= e1; j++) {
      const prev = c1[j]
      map.set(prev.key, { prev, j })
    }

    let maxNewIndex = 0
    let move = false
    // 用于存储c2节点在c1节点的位置，-1表示需要新增节点
    const source = new Array(e2 - i + 1).fill(-1)
    const toMounted = []
    for (let k = 0; k < source.length; k++) {
      const next = c2[k + i]
      if (map.has(next.key)) {
        const { prev, j } = map.get(next.key)
        patch(prev, next, el, anchor)
        if (j >= maxNewIndex) {
          // 不需要移动
          maxNewIndex = j
        } else {
          // 需要移动
          move = true
        }

        // 记录节点
        source[k] = j
        // 删除map中的值
        map.delete(next.key)
      } else {
        // 需要添加节点的位置
        toMounted.push(k + i)
      }
    }

    // 5.2 删除c2中没有的元素
    map.forEach(({ prev }) => {
      unmount(prev)
    })

    if (move) {
      // 5.3 需要移动
      const seq = getSequence(source)
      let j = seq.length - 1
      for (let k = source.length - 1; k >= 0; k--) {
        // 为最长子序列中的一员，不需要移动
        if (seq[j] === k) {
          j--
        } else {
          // 当前节点的位置
          const pos = k + i
          // 移动到下一个节点的前面
          const nextPos = pos + 1
          const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor
          // 新增节点
          if (source[k] === -1) {
            patch(null, c2[pos], el, curAnchor)
          } else {
            el.insertBefore(c2[pos].el, curAnchor)
          }
        }
      }
    } else if (toMounted.length) {
      // 5.4 不需要移动，但还有元素要添加
      for (let k = toMounted.length - 1; k >= 0; k--) {
        const pos = toMounted[k]
        const nextPos = pos + 1
        const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor
        patch(null, c2[pos], el, curAnchor)
      }
    }
  }
}

/**
 * @description 获取最长上升子序列的索引
 * @param {*} nums 
 */
function getSequence(nums) {
  // 1. 获取第一个节点, arr = [nums[0]]
  const arr = [nums[0]]
  const position = [0]
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === -1) continue
    // 2. 遍历arr,如果当前元素大于arr末尾元素 → 直接加入arr，构成更长的递增子序列
    if (nums[i] > arr[arr.length - 1]) {
      arr.push(nums[i])
      position.push(arr.length - 1)
    } else {
      // 3. 如果当前元素小于等于arr末尾元素 → 二分查找arr中第一个大于等于nums[i]的位置，替换该位置元素
      let left = 0, right = arr.length - 1
      while (left <= right) {
        let middle = Math.floor((left + right) / 2)
        if (nums[i] < arr[middle]) {
          right = middle - 1
        } else if (nums[i] > arr[middle]) {
          left = middle + 1
        } else {
          left = middle
          break
        }
      }

      arr[left] = nums[i]
      position.push(left)
    }
  }

  // 记录最长上升子序列在nums中的索引
  let cur = arr.length - 1
  for (let i = position.length - 1; i >= 0 && cur >= 0; i--) {
    if (position[i] === cur) {
      arr[cur] = i
      cur--
    }
  }

  return arr
}
/**
 * @description 比较没有key的节点
 * @param {*} c1 旧节点
 * @param {*} c2 新节点
 * @param {*} anchor 标记节点需要插入到谁的前面
 */
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