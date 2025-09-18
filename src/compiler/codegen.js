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
        traversChildren(node.children[0]) :
        traversChildren(node.children)
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

function traversChildren(node) { }
function resolveElementNode(node) { }
function createInterpolation(node) { }
function createText(node) { }