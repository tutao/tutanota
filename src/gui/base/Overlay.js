//@flow
import m from "mithril"
import {hexToRgb} from "../animation/Animations"
import {theme} from "../theme"

type OverlayAttrs = {
	component: Component;
	origin: ClientRect;
}

let attrs: ?OverlayAttrs = null
let overlayShadow = hexToRgb(theme.modal_bg)

export function displayOverlay(origin: ClientRect, component: Component) {
	attrs = {
		origin,
		component
	}
}

export function closeOverlay() {
	attrs = null
}

export function isOverlayVisible() {
	return attrs != null
}


export const overlay = {
	view: () => {
		return m("#overlay", {
			style: {
				display: attrs ? "" : 'none' // display: null not working for IE11
			}
		}, attrs != null ? m(".abs.list-bg", {
				style: {
					width: "350px",
					'z-index': 200,
					right: window.innerWidth - attrs.origin.right + "px",
					top: attrs.origin.bottom + 5 + "px",
					'box-shadow': `0 2px 12px rgba(${overlayShadow.r}, ${overlayShadow.g}, ${overlayShadow.b}, 0.4), 0 10px 40px rgba(${overlayShadow.r}, ${overlayShadow.g}, ${overlayShadow.b}, 0.3)`, //0.23 0.19
				}
			}, m(attrs.component)) : "no component")
	}
}

