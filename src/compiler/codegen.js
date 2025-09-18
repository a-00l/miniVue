import { NodeTypes } from ".";

export function generate(ast) {
  // 1. 解析ast树
  const data = traversNode(ast)
  // 2. 将渲染函数返回
  const code = `
    return render(${data})
  `

  return code
}

function traversNode(node, parent) {
  // 不同的节点做不同的处理
  switch (node.type) {
    case NodeTypes.ROOT:
      // 1. 处理根节点：多个根节点和一个根节点的情况
      return node.children.length === 1 ?
        traversNode(node.children[0], node) :
        traversChildren(node)
    case NodeTypes.ELEMENT:
      // 2. 处理Element节点
      return resolveElementATSNode(node, parent)
    case NodeTypes.INTERPOLATION:
      // 3. 处理插值节点
      return createInterpolation(node)
    case NodeTypes.TEXT:
      // 4. 处理文本节点
      return createText(node)
  }
}

function traversChildren(node) {
  const { children } = node
  if (children.length === 1) {
    const child = children[0]
    // <span>hello</span>
    if (child.type === NodeTypes.TEXT) {
      return `'${child.content}'`
    }

    return traversNode(child, node)
  }

  // 1. 使用数组记录节点
  const result = []
  for (let i = 0; i < children.length; i++) {
    result.push(traversNode(children[i], node))
  }

  return `[${result.join(',')}]`
}

export function resolveElementATSNode(node, parent) {
  // 1. 有指令节点
  // v-if：exp.content ? createElementNode(node) : h(Text, null, ')
  const ifNode = pluck(node, 'if')
  if (ifNode) {
    const condition = ifNode.exp.content
    const consequent = resolveElementATSNode(node, parent)
    let alternate = `h(Text, null, "")`
    // 1.1 处理v-else：必须要连续
    const { children } = parent
    const index = children.findIndex(child => child === node) + 1
    const sibling = children[index]
    // 1.2 如果下个节点存在else，修改alternate
    if (pluck(sibling, 'else')) {
      alternate = resolveElementATSNode(sibling, parent)
      children.splice(index, 1)
    }

    return `${condition} ? ${consequent} : ${alternate}`
  }

  // v-for：h(Fragment, null, renderList(list, item => h('li', null, item)))
  const forNode = pluck(node, 'for')
  if (forNode) {
    // v-for="item in items"
    // 将 in 两边的数据存储放到数组
    const [exp, source] = forNode.exp.content.split(/\sin\s|\sof\s/)
    return `h(Fragment, null, renderList(${source.trim()},${exp.trim()} => ${resolveElementATSNode(node, parent)}))`
  }

  // 2. 没有指令节点
  return createElementNode(node)
}

/**
 * @description 返回该指令节点，且删除该指令节点
 */
function pluck(node, name) {
  const index = node.directives.findIndex(dir => dir.name === name)
  const dir = node.directives[index]
  // 该指令存在，则删除
  if (index > -1) {
    node.directives.splice(index, 1)
  }

  return index === -1 ? null : dir
}

function createElementNode(node) {
  // 返回 h(node.tag, node.props, node.children)
  // 1. 处理标签名
  const tag = node.tag
  // 2. 处理props
  let props = propsArr(node)
  // 判断是否有值
  props = props.length ? { ...props } : null

  // 3. 处理children
  const children = traversChildren(node)
  // props和children都为空
  if (!props && !children?.length) {
    return `h(${tag})`
  }

  // 4. 有子节点时传递children参数，否则只传tag和props
  return children.length ? `h(${tag}, ${props}, ${children})` : `h(${tag}, ${props})`
}

function propsArr(node) {
  // 处理为对象 {}
  const { props, directives } = node
  return [
    // 1. 普通属性
    ...props.map(prop => `${prop.name}:'${prop.value.content}'`),
    // 2. 指令: 
    ...directives.map(dir => {
      switch (dir.name) {
        case 'bind':
          // 2.1 动态属性 :class="test", 解析为: class: test
          return `${dir.arg.content}:${dir.exp.content}`
        case 'on':
          // 2.2. 事件 @click="fun", 解析为: onClick: fun
          const arg = capitalize(dir.arg.content)
          return `on${arg}:${dir.exp.content}`
        case 'html':
          // 2.3. 指令 v-html="html", 解析为: innerHTML: html
          return `innerHTML: ${dir.exp.content}`
      }
    })
  ]
}

function createInterpolation(node) {
  return `h(Text, null, ${node.content.content})`
}

function createText(node) {
  return `h(Text, null, ${node.content})`
}

/**
 * @description 首字母大写
 */
function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1)
}