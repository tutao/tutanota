//@flow
import m from "mithril"
import {hexToRgb} from "../animation/Animations"
import {theme} from "../theme"

export type PositionRect = {
	top?: ?string,
	left?: ?string,
	right?: ?string,
	width?: ?string,
	bottom?: ?string
}

type OverlayAttrs = {
	component: Component;
	position: PositionRect;
}

let attrs: ?OverlayAttrs = null
let overlayShadow = hexToRgb(theme.modal_bg)

export function displayOverlay(position: PositionRect, component: Component) {
	attrs = {
		position,
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
					width: attrs.position.width,
					top: attrs.position.top,
					bottom: attrs.position.bottom,
					right: attrs.position.right,
					left: attrs.position.left,
					'z-index': 200,
					'box-shadow': `0 2px 12px rgba(${overlayShadow.r}, ${overlayShadow.g}, ${overlayShadow.b}, 0.4), 0 10px 40px rgba(${overlayShadow.r}, ${overlayShadow.g}, ${overlayShadow.b}, 0.3)`, //0.23 0.19
				}
			}, m(attrs.component)) : "no component")
	}
}

