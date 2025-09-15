import { isString } from "../utils"
import { render } from "./render"
import { h } from "./vnode"

/**
 * @description 挂载内容
 * @param {*} rootConponent 
 * @returns 
 */
export function createApp(rootConponent) {
  const app = {
    mount(rootContainer) {
      let container = rootContainer
      if (isString(rootContainer)) {
        container = document.querySelector(container)
      }

      render(h(rootConponent), container)
    }
  }

  return app
}