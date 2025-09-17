import { createRoot } from "."

function parse(content) {
  // 1. 创建解析上下文
  const context = createParseContext(content)
  // 2. 解析子节点
  const children = parseChildren(context)

  return createRoot(children)
}

function parseChildren(context) {
  while (!isEnd(context)) {
    const source = context.source
    if (source.startsWith('<')) {
      // 1. 解析标签 <
      parseElement(context)
    } else if (source.startsWith('{{')) {
      // 2. 解析插值{{ }}
      parseInterpolation(context)
    } else {
      // 3. 解析文本
      parseText(context)
    }
  }
}

/**
 * @description 解析文本
 * @param {*} context 
 * @returns 
 */
function parseText(context) {
  // 遇到 {{ 或者 < 结束文本截取
  const end = [context.option.delimite[0], '<']
  let endIndex;
  // 1. 获取结束位置
  end.forEach(flag => {
    const index = context.source.findIndex(flag)
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
 * @description 从开始位置删除length多个字符 
 * @param {*} context 
 * @param {*} length 
 */
function advance(context, length) {
  return context.source.slice(length)
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
      delimite: ['{{', '}}']
    },
    source: content
  }
}