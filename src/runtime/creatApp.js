import { camelize, capitalize, isString } from "../utils"
import { render } from "./render"
import { h } from "./vnode"

let components
/**
 * @description 挂载内容
 * @param {*} rootConponent 
 * @returns 
 */
export function createApp(rootConponent) {
  components = rootConponent.components || {}
  const app = {
    mount(rootContainer) {
      let container = rootContainer
      if (isString(rootContainer)) {
        container = document.querySelector(container)
      }

      if (!rootConponent.render && !rootConponent.template) {
        rootConponent.template = container.innerHTML
      }

      container.innerHTML = ''

      render(h(rootConponent), container)
    }
  }

  return app
}

export function resolveComponents(name) {
  return components && (
    components[name] ||
    components[camelize(name)] ||
    components[camelize(capitalize(name))]
  )
}