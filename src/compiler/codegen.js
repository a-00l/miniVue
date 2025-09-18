import { NodeTypes } from ".";

export function generate(ast) {
  // 1. 解析ast树
  const data = traversNode(ast)
  // 2. 将渲染函数返回
  const code = `
    return ${data}
  `

  return code
}

function traversNode(node) {
  // 不同的节点做不同的处理
  switch (node.type) {
    case NodeTypes.ROOT:
      // 1. 处理根节点：多个根节点和一个根节点的情况
      node.children.lenght === 1 ?
        traversNode(node.children[0]) :
        traversChildren(node)
      break;
    case NodeTypes.ELEMENT:
      // 2. 处理Element节点
      resolveElementNode(node)
      break;
    case NodeTypes.INTERPOLATION:
      // 3. 处理插值节点
      createInterpolation(node)
      break;
    case NodeTypes.TEXT:
      // 4. 处理文本节点
      createText(node)
      break;
  }
}

function traversChildren(node) {
  const { children } = node
  // 1. 使用数组记录节点
  const result = []
  for (let i = 0; i < children.length; i++) {
    result.push(traversNode(children[i]))
  }

  return result.length === 1 ? result[0] : `[${result.join(',')}]`
}

function resolveElementNode(node) {
  // 返回 h(node.tag, node.props, node.children)
  // 1. 处理标签名
  const tag = node.tag
  // 2. 处理props
  const props = propsArr(node)
  // 3. 处理children
  const children = traversChildren(node)

  return `h(${tag}, ${props}, ${children})`
}

function propsArr(node) { }
function createInterpolation(node) {
  return `h(${Text}, null, ${node.content.content})`
}

function createText(node) {
  return `h(${Text}, null, ${node.content})`
}