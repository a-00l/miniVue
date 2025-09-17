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