import { generate, parse } from "."

export function compile(content) {
  // 1. 将字符串解析为ATS树
  const ast = parse(content)
  // 2. 将ATS树转换为渲染函数
  return generate(ast)
}