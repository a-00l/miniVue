import { isArray, isNumber, isObject, isString } from "../../utils";

export function renderList(list, listItem) {
  const nodes = []
  if (isString(list) || isArray(list)) {
    // list是数组或字符串
    for (let i = 0; i < list.length; i++) {
      nodes.push(listItem(list[i], i))
    }
  } else if (isObject(list)) {
    // list是对象
    for (const key in list) {
      nodes.push(listItem(list[key], key))
    }
  } else if (isNumber(list)) {
    // list是number
    for (let i = 0; i < list; i++) {
      nodes.push(listItem(i + 1, i))
    }
  }

  return nodes
}