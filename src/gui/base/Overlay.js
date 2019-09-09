//@flow
import m from "mithril"
import type {DomMutation} from "../animation/Animations"
import {animations, hexToRgb} from "../animation/Animations"
import {theme} from "../theme"
import {requiresStatusBarHack} from "../main-styles"

export type PositionRect = {
	top?: ?string,
	left?: ?string,
	right?: ?string,
	width?: ?string,
	bottom?: ?string,
	height?: ?string,
}

type AnimationProvider = (dom: HTMLElement) => DomMutation

type OverlayAttrs = {
	component: Component;
	position: PositionRect;
	createAnimation?: AnimationProvider;
	closeAnimation?: AnimationProvider;
}

const overlays: Array<[OverlayAttrs, ?HTMLElement, number]> = []
const boxShadow = (() => {
	const {r, g, b} = hexToRgb(theme.modal_bg)
	return `0 2px 12px rgba(${r}, ${g}, ${b}, 0.4), 0 10px 40px rgba(${r}, ${g}, ${b}, 0.3)`
})()
let key = 0

export function displayOverlay(position: PositionRect, component: Component, createAnimation?: AnimationProvider,
                               closeAnimation?: AnimationProvider): () => void {
	const newAttrs = {
		position,
		component,
		createAnimation,
		closeAnimation
	}
	const pair = [newAttrs, null, key++]
	overlays.push(pair)
	return () => {
		const dom = pair[1];
		(newAttrs.closeAnimation && dom ? animations.add(dom, newAttrs.closeAnimation(dom)) : Promise.resolve())
			.then(() => {
				overlays.splice(overlays.indexOf(pair), 1)
				m.redraw()
			})
	}
}

export const overlay = {
	view: () => m("#overlay", {
		style: {
			display: overlays.length > 0 ? "" : 'none' // display: null not working for IE11
		}
	}, overlays.map((overlayAttrs) => {
		const [attrs, dom, key] = overlayAttrs
		return m(".abs.list-bg", {
			key,
			style: {
				width: attrs.position.width,
				top: attrs.position.top,
				bottom: attrs.position.bottom,
				right: attrs.position.right,
				left: attrs.position.left,
				height: attrs.position.height,
				'z-index': 200,
				'box-shadow': boxShadow,
				'margin-top': (requiresStatusBarHack() ? "20px" : 'env(safe-area-inset-top)') // insets for iPhone X
			},
			oncreate: (vnode: Vnode<any>) => {
				overlayAttrs[1] = vnode.dom
				if (attrs.createAnimation) {
					animations.add(vnode.dom, attrs.createAnimation(vnode.dom))
				}
			},
			onremove: () => {
				overlayAttrs[1] = null
			}
		}, m(attrs.component))
	}))
}

