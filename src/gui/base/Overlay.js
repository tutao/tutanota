//@flow
import m from "mithril"
import type {DomMutation} from "../animation/Animations"
import {animations} from "../animation/Animations"
import {requiresStatusBarHack} from "../main-styles"
import {ease} from "../animation/Easing"

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
		(newAttrs.closeAnimation && dom
			? animations.add(dom, newAttrs.closeAnimation(dom), {
				duration: 100,
				easing: ease.in
			})
			: Promise.resolve())
			.then(() => {
				overlays.splice(overlays.indexOf(pair), 1)
				m.redraw()
			})
	}
}

export const overlay = {
	view: (): Children => m("#overlay", {
		style: {
			display: overlays.length > 0 ? "" : 'none' // display: null not working for IE11
		},
		"aria-hidden": overlays.length === 0
	}, overlays.map((overlayAttrs) => {
		const [attrs, dom, key] = overlayAttrs
		return m(".abs.elevated-bg.dropdown-shadow", {
			key,
			style: {
				width: attrs.position.width,
				top: attrs.position.top,
				bottom: attrs.position.bottom,
				right: attrs.position.right,
				left: attrs.position.left,
				height: attrs.position.height,
				'z-index': 200,
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

