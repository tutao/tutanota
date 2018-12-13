//@flow
import m from "mithril"
import type {DomMutation} from "../animation/Animations"
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

type AnimationProvider = (dom: HTMLElement) => DomMutation

type OverlayAttrs = {
	component: Component;
	position: PositionRect;
	createAnimation?: AnimationProvider;
	closeAnimation?: AnimationProvider;
}

const overlays: Array<[OverlayAttrs, ?HTMLElement]> = []
const boxShadow = (() => {
	const {r, g, b} = hexToRgb(theme.modal_bg)
	return `0 2px 12px rgba(${r}, ${g}, ${b}, 0.4), 0 10px 40px rgba(${r}, ${g}, ${b}, 0.3)`
})()

export function displayOverlay(position: PositionRect, component: Component, createAnimation?: AnimationProvider,
                               closeAnimation?: AnimationProvider): () => void {
	const newAttrs = {
		position,
		component,
		createAnimation,
		closeAnimation
	}
	const pair = [newAttrs, null]
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
	}, overlays.map((pair) => {
		const [attrs] = pair
		return m(".abs.list-bg", {
			style: {
				width: attrs.position.width,
				top: attrs.position.top,
				bottom: attrs.position.bottom,
				right: attrs.position.right,
				left: attrs.position.left,
				height: attrs.position.height,
				'z-index': 200,
				'box-shadow': boxShadow,
			},
			oncreate: (vnode: Vnode<any>) => {
				pair[1] = vnode.dom
				if (attrs.createAnimation) {
					animations.add(vnode.dom, attrs.createAnimation(vnode.dom))
				}
			},
			onremove: () => {
				pair[1] = null
			}
		}, m(attrs.component))
	}))
}

