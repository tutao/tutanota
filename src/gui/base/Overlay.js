//@flow
import m from "mithril"
import type {DomMutation} from "../animation/Animations"
import {animations} from "../animation/Animations"
import {requiresStatusBarHack} from "../main-styles"
import {ease} from "../animation/Easing"
import {assertMainOrNodeBoot} from "../../api/common/Env"
import type {LayerTypeEnum} from "../../RootView"
import {LayerType} from "../../RootView"
import {remove} from "../../api/common/utils/ArrayUtils"

assertMainOrNodeBoot()

export type PositionRect = {
	top?: ?string,
	left?: ?string,
	right?: ?string,
	width?: ?string,
	bottom?: ?string,
	height?: ?string,
	zIndex?: LayerTypeEnum
}

type AnimationProvider = (dom: HTMLElement) => DomMutation

type OverlayAttrs = {
	component: MComponent<mixed>,
	position: lazy<PositionRect>,
	createAnimation?: AnimationProvider,
	closeAnimation?: AnimationProvider,
	shadowClass: string
}

const overlays: Array<[OverlayAttrs, ?HTMLElement, number]> = []
let key = 0

export function displayOverlay(position: lazy<PositionRect>, component: MComponent<mixed>, createAnimation?: AnimationProvider,
                               closeAnimation?: AnimationProvider, shadowClass: string = "dropdown-shadow"): () => Promise<void> {
	const newAttrs = {
		position,
		component,
		createAnimation,
		closeAnimation,
		shadowClass
	}
	const pair = [newAttrs, null, key++]
	overlays.push(pair)
	return async () => {
		const dom = pair[1];
		const animation = newAttrs.closeAnimation && dom
			? animations.add(dom, newAttrs.closeAnimation(dom), {
				duration: 100,
				easing: ease.in
			})
			: Promise.resolve()
		await animation
		if (remove(overlays, pair)) {
			m.redraw()
		}
	}
}

export const overlay: MComponent<OverlayAttrs> = {
	view: (): Children => m("#overlay", {
		style: {
			display: overlays.length > 0 ? "" : 'none' // display: null not working for IE11
		},
		"aria-hidden": overlays.length === 0
	}, overlays.map((overlayAttrs) => {
		const [attrs, dom, key] = overlayAttrs
		const position = attrs.position()

		return m(".abs.elevated-bg." + attrs.shadowClass, {
			key,
			style: {
				width: position.width,
				top: position.top,
				bottom: position.bottom,
				right: position.right,
				left: position.left,
				height: position.height,
				'z-index': position.zIndex ? position.zIndex : LayerType.Overlay,
				'margin-top': (requiresStatusBarHack() ? "20px" : 'env(safe-area-inset-top)') // insets for iPhone X
			},
			oncreate: (vnode: Vnode<OverlayAttrs>) => {
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

