import { NodeTypes } from ".";

export function generate(ast) {
  // 1. 解析ast树
  const data = traverseNode(ast)

  // 2. 将渲染函数返回
  const code = `
  with(ctx) {
    const {h,render,Text,Fragment,renderList} = MiniVue
    return ${data}
  }
  `

  return code
}

function traverseNode(node, parent) {
  // 不同的节点做不同的处理
  switch (node.type) {
    case NodeTypes.ROOT:
      // 1. 处理根节点：多个根节点和一个根节点的情况
      return node.children.length === 1 ?
        traverseNode(node.children[0], node) :
        traverseChildren(node)
    case NodeTypes.ELEMENT:
      // 2. 处理Element节点
      return resolveElementATSNode(node, parent)
    case NodeTypes.INTERPOLATION:
      // 3. 处理插值节点
      return createTextNode(node.content)
    case NodeTypes.TEXT:
      // 4. 处理文本节点
      return createTextNode(node)
  }
}

function traverseChildren(node) {
  const { children } = node
  if (children.length === 1) {
    const child = children[0]
    if (child.type === NodeTypes.TEXT) {
      return createText(child)
    } else if (child.type === NodeTypes.INTERPOLATION) {
      return createText(child.content)
    }
  }

  // 1. 使用数组记录节点
  const result = []
  for (let i = 0; i < children.length; i++) {
    result.push(traverseNode(children[i], node))
  }

  return `[${result.join(',')}]`
}

export function resolveElementATSNode(node, parent) {
  // 1. 有指令节点
  // v-model
  const vModel = pluck(node, 'model')
  if (vModel) {
    // :value="test" @input="$event => test = $event.target.value"
    node.directives.push(
      {
        type: NodeTypes.DIRECTIVE,
        name: 'bind',
        exp: vModel.exp, // 表达式节点
        arg: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'value',
          isStatic: true,
        }, // 表达式节点
      },
      {
        type: NodeTypes.DIRECTIVE,
        name: 'on',
        exp: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: `($event) => ${vModel.exp.content} = $event.target.value`,
          isStatic: false,
        }, // 表达式节点
        arg: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'input',
          isStatic: true,
        }, // 表达式节点
      }
    );
  }
  // v-if：exp.content ? createElementNode(node) : h(Text, null, ')
  const ifNode = pluck(node, 'if') || pluck(node, 'else-if')
  if (ifNode) {
    const condition = ifNode.exp.content
    const consequent = resolveElementATSNode(node, parent)
    let alternate = `h(Text, null, "")`
    // 1.1 else-if 和 else 必须要连续，如果不连续，则返回
    const { children } = parent
    const index = children.findIndex(child => child === node) + 1
    const sibling = children[index]
    // 1.2 这里的else-if指令不能立即删除，因为下次递归ifNode需要使用
    if (sibling && (pluck(sibling, 'else-if', false) || pluck(sibling, 'else'))) {
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
function pluck(node, name, remove = true) {
  const index = node.directives.findIndex(dir => dir.name === name)
  const dir = node.directives[index]
  // 该指令存在，则删除
  if (index > -1 && remove) {
    node.directives.splice(index, 1)
  }

  return index === -1 ? null : dir
}

function createElementNode(node) {
  // 返回 h(node.tag, node.props, node.children)
  // 1. 处理标签名
  const { tag, children } = node
  // 2. 处理props
  let props = propsArr(node)
  // 判断是否有值
  props = props.length ? `{ ${props.join(',')} }` : null

  if (!children.length) {
    if (!props) {
      return `h('${tag}')`
    }

    return `h('${tag}', ${props})`
  }
  // 3. 处理children
  const traverseChild = traverseChildren(node)

  // 4. 有子节点时传递children参数，否则只传tag和props
  return `h('${tag}', ${props}, ${traverseChild})`
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

function createText({ isStatic = true, content }) {
  return isStatic ? `'${content}'` : content
}

function createTextNode(node) {
  return `h(Text, null,${createText(node)})`
}

/**
 * @description 首字母大写
 */
function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1)
}