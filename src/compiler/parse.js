import { createRoot, ElementTypes, isNativeTag, isVoidTag, NodeTypes } from "."

export function parse(content) {
  // 1. 创建解析上下文
  const context = createParseContext(content)
  // 2. 解析子节点
  const children = parseChildren(context)

  return createRoot(children)
}

function parseChildren(context) {
  const nodes = []
  while (!isEnd(context)) {
    const source = context.source
    let node;
    if (source.startsWith('<')) {
      // 1. 解析标签 <
      node = parseElement(context)
    } else if (source.startsWith('{{')) {
      // 2. 解析插值{{ }}
      node = parseInterpolation(context)
    } else {
      // 3. 解析文本
      node = parseText(context)
    }

    nodes.push(node)
  }

  let remove = false
  // 优化节点：删除不必要的空节点
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].type === NodeTypes.TEXT) {
      const node = nodes[i]
      // 1. 有文本，且文本之间含有多个空白节点，则将他们压缩为一个
      if (/[^\t\r\f\n ]/.test(node.content)) {
        node.content.replace(/^[\t\r\f\n]+/g, '')
      } else {
        // 2. 没有文本
        const prev = nodes[i - 1]
        const next = nodes[i + 1]
        // 2.1 标记为null有三种情况：
        // 空节点在头和尾
        // 满足在上一个节点和下一个节点之间，有回车有空白节点
        if (
          !prev ||
          !next ||
          prev.tagType === NodeTypes.ELEMENT &&
          next.tagType === NodeTypes.ELEMENT &&
          /[\n\r]/.test(node.content)
        ) {
          remove = true
          nodes[i] = null
        } else {
          // 2.2 压缩为一个空白节点需要满足：前后节点都是Element有多个空白节点
          nodes[i] = ' '
        }
      }
    }
  }

  console.log(remove ? nodes.filter(Boolean) : nodes);

  return remove ? nodes.filter(Boolean) : nodes
}

/**
 * @description 解析文本
 * @param {*} context 
 * @returns 
 */
function parseText(context) {
  // 遇到 {{ 或者 < 结束文本截取
  const end = [context.option.delimite[0], '<']
  let endIndex = context.source.length;
  // 1. 获取结束位置
  end.forEach(flag => {
    const index = context.source.indexOf(flag)
    if (endIndex > index && index != -1) {
      endIndex = index
    }
  })

  // 2. 获取到文本
  const text = contentExtraction(context, endIndex)
  // 3. 截取该文本
  return {
    type: NodeTypes.TEXT,
    content: text
  }
}

/**
 * @description 解析插值
 * @param {*} context 
 */
function parseInterpolation(context) {
  // 事例 {{ name }}
  // 1. 删除 {{
  advance(context, 2)
  // 删除多余空格
  advanceSpace(context)
  // 2. 截取里面内容直到 }}
  const endIndex = context.source.indexOf('}}')
  const interpolation = contentExtraction(context, endIndex).trim()
  // 3. 删除 }}
  advance(context, 2)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: interpolation,
      isStatic: false,
    }
  }
}

/**
 * @description 解析标签
 * @param {*} context 
 */
function parseElement(context) {
  // 思路：解析标签，随后解析里面的属性，遇到 /> || > 结束
  // 1. 解析标签
  const element = parseTag(context)
  // 1.1 如果标签是闭合标签或空标签如：<br> <input>为空标签
  if (element.isSelfClosing || context.option.isVoidTag(element.tag)) {
    return element
  }

  // 2. 解析子元素
  element.children = parseChildren(context)
  // 3. 删除末尾标签
  context.source.length ? parseTag(context) : ''

  return element
}

function parseTag(context) {
  // 1. 匹配标签
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)
  // 获取标签
  const tag = match[1]
  advance(context, match[0].length)
  advanceSpace(context)

  // 2. 解析属性
  const { props, directives } = parseAttributes(context)
  // 3. 判断是否为自闭和标签
  const isSelfClosing = context.source.startsWith('/>') ? true : false
  advance(context, isSelfClosing ? 2 : 1)
  advanceSpace(context)

  // 4. 判断是否为组件
  const tagType = isComponents(tag)
  return {
    type: NodeTypes.ELEMENT,
    tag, // 标签名,
    tagType, // 是组件还是原生元素,
    props, // 属性节点数组,
    directives, // 指令数组
    isSelfClosing, // 是否是自闭合标签,
    children: [],
  }
}

function isComponents(tag) {
  return isNativeTag(tag) ? ElementTypes.ELEMENT : ElementTypes.COMPONENT
}
/**
 * @description 解析属性
 * @param {*} context 
 * @returns 返回一个对象
 */
function parseAttributes(context) {
  const props = []
  const directives = []
  // 属性有两种：原生属性、自定义属性
  while (
    context.source.length &&
    !context.source.startsWith('/>') &&
    !context.source.startsWith('>')) {

    const attrs = parseAttribute(context)
    if (attrs.type === NodeTypes.DIRECTIVE) {
      // 1. 指令属性  
      directives.push(attrs)
    } else if (attrs.type === NodeTypes.ATTRIBUTE) {
      // 2. 原生属性
      props.push(attrs)
    }
  }

  return { props, directives }
}

/**
 * @description 处理单个属性
 * @param {*} context 
 */
function parseAttribute(context) {
  // 1. 匹配到 = 之前，记录属性名
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
  const name = match[0]
  // 删除属性名以及后续空格
  advance(context, name.length)
  advanceSpace(context)
  // 如果有等号则删除
  if (context.source[0] === '=') {
    advance(context, 1)
  }

  // 2. 指令属性
  if (/^(@|v-|:)/.test(name)) {
    let argContent, dirName
    // 2.1 获取指令属性
    if (name[0] === '@') {
      dirName = 'on'
      argContent = name.slice(1)
    } else if (name[0] === ':') {
      dirName = 'bind'
      argContent = name.slice(1)
    } else if (name.startsWith('v-')) {
      [dirName, argContent] = name.slice(2).split(':')
    }

    // 2.2 获取指令内容
    let expContent = attributeContent(context)
    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: expContent && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: expContent,
        isStatic: false,
      }, // 表达式节点
      arg: argContent && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: argContent,
        isStatic: true,
      } // 表达式节点
    }
  }

  const value = attributeContent(context)
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value,
    } // 纯文本节点
  }
}

/**
 * @description 处理属性里面的内容
 * @param {*} context 
 */
function attributeContent(context) {
  // 1. 记录引号，因为双引号和单引号都是合法的
  const quite = context.source[0]
  advance(context, 1)
  const endIndex = context.source.indexOf(quite)
  // 2. 获取内容
  const content = contentExtraction(context, endIndex)
  advance(context, 1)
  advanceSpace(context)

  return content
}

/**
 * @description 删除回车、换行、tab、分页
 */
function advanceSpace(context) {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advance(context, match[0].length)
  }
}
/**
 * @description 从开始位置删除length多个字符 
 * @param {*} context 
 * @param {*} length 
 */
function advance(context, length) {
  context.source = context.source.slice(length)
}

/**
 * @description 从开始位置截取length字符，并且删除截取的字符
 * @param {*} context 
 * @param {*} length 
 * @returns 
 */
function contentExtraction(context, length) {
  const text = context.source.slice(0, length)
  // 删除字符
  advance(context, text.length)
  return text
}

function isEnd(context) {
  return !context.source.length || context.source.startsWith('</')
}

function createParseContext(content) {
  return {
    option: {
      delimite: ['{{', '}}'],
      isVoidTag,
      isNativeTag
    },
    source: content
  }
}