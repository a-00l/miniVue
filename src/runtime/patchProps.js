/**
 * @description 比较两个节点的props
 */
export function patchProps(oldProps, newProps, el) {
  if (oldProps === newProps) return

  oldProps = oldProps || {}
  newProps = newProps || {}
  // 1. 遍历新的属性，把新旧属性一一对比
  for (const key in newProps) {
    const newValue = newProps[key]
    const oldValue = oldProps[key]
    if (key === 'key') continue

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
const domPropsRE = /^(checked|selected|muted|disabled)$/;
function patchDomProp(oldValue, newValue, key, el) {
  switch (key) {
    case 'class':
      // 1. 处理class，直接赋新值
      el.className = newValue || ''
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
          el.removeEventListener(event, oldValue)
        }

        // 3.2 如果新添加的事件有值，则该添加事件
        if (newValue) {
          el.addEventListener(event, newValue)
        }
      } else if (domPropsRE.test(key)) {
        // 4. 特殊处理value、checked、selected、muted、disabled为其设置boolean
        if (newValue === '') {
          newValue = true
        }

        el[key] = newValue
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