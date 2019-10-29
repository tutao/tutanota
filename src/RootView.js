// @flow
import m from "mithril"
import {header} from "./gui/base/Header"
import {modal} from "./gui/base/Modal"
import {assertMainOrNodeBoot} from "./api/Env"
import {overlay} from "./gui/base/Overlay"
import {styles} from "./gui/styles"

assertMainOrNodeBoot()

class RootView {
	view: Function;
	viewCache: {[key: string]: Function};

	constructor() {
		this.viewCache = {}

		// On first mouse event disable outline. This is a compromise between keyboard navigation users and mouse users.
		let onmousedown = () => {
			styles.registerStyle("outline", () => ({
				"*": {
					outline: "none",
				}
			}))
			// remove event listener after the first click to not re-register style
			onmousedown = null
		}


		this.view = (vnode): VirtualElement => {
			return m("#root", {onmousedown}, [
				m(overlay),
				m(header),
				m(modal),
				vnode.children
			])
		}
	}
}


export const root: RootView = new RootView()