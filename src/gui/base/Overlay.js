//@flow
import m from "mithril"
import {animations, hexToRgb} from "../animation/Animations"
import {theme} from "../theme"

export type PositionRect = {
	top?: ?string,
	left?: ?string,
	right?: ?string,
	width?: ?string,
	bottom?: ?string,
	height?: ?string,
}

type OverlayAttrs = {
	component: Component;
	position: PositionRect;
	createAnimation?: DomMutation;
	closeAnimation?: DomMutation;
}

let attrs: ?OverlayAttrs = null
let overlayShadow = hexToRgb(theme.modal_bg)
let overlayDom: ?HTMLElement

export function displayOverlay(position: PositionRect, component: Component, createAnimation?: DomMutation,
                               closeAnimation?: DomMutation) {
	attrs = {
		position,
		component,
		createAnimation,
		closeAnimation
	}
}

export function closeOverlay() {
	(attrs && attrs.closeAnimation && overlayDom ? animations.add(overlayDom, attrs.closeAnimation) : Promise.resolve())
		.then(() => {
			attrs = null
			overlayDom = null
			m.redraw()
		})
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
				height: attrs.position.height,
				'z-index': 200,
				'box-shadow': `0 2px 12px rgba(${overlayShadow.r}, ${overlayShadow.g}, ${overlayShadow.b}, 0.4), 0 10px 40px rgba(${overlayShadow.r}, ${overlayShadow.g}, ${overlayShadow.b}, 0.3)`, //0.23 0.19
			},
			oncreate: (vnode: Vnode<any>) => {
				overlayDom = vnode.dom
				if (attrs && attrs.createAnimation) {
					animations.add(vnode.dom, attrs.createAnimation)
				}
			},
			onremove: () => {
				overlayDom = null
			}
		}, m(attrs.component)) : "no component")
	}
}

