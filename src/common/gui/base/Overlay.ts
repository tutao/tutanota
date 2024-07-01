import m, { Children, Component, VnodeDOM } from "mithril"
import { LayerType } from "../../../RootView"
import { lazy, makeSingleUse } from "@tutao/tutanota-utils"
import { assertMainOrNodeBoot } from "../../api/common/Env"
import { px, size } from "../size.js"
import { styles } from "../styles.js"
import { getSafeAreaInsetBottom } from "../HtmlUtils.js"

assertMainOrNodeBoot()
export type PositionRect = {
	top?: string | null
	left?: string | null
	right?: string | null
	width?: string | null
	bottom?: string | null
	height?: string | null
	zIndex?: LayerType
}
type OverlayAttrs = {
	component: Component
	position: lazy<PositionRect>
	createAnimation?: string
	closeAnimation?: string
	shadowClass: string
}

const overlays: Map<number, OverlayAttrs> = new Map()
let key = 0

export function displayOverlay(
	position: lazy<PositionRect>,
	component: Component,
	createAnimation?: string,
	closeAnimation?: string,
	shadowClass: string = "dropdown-shadow",
): () => void {
	// Use the inverse of the show animation as the close animation if it is not given
	if (createAnimation != null && closeAnimation == null) closeAnimation = `${createAnimation} animation-reverse`

	const overlayKey = key++
	const pair = {
		position,
		component,
		createAnimation,
		closeAnimation,
		shadowClass,
	} as OverlayAttrs
	// Add the new overlay into the overlay container
	overlays.set(overlayKey, pair)

	// Make single so fast taps doesn't try to remove
	// the same overlay twice
	return makeSingleUse(() => {
		// Remove the overlay & error if unsuccessful
		if (!overlays.delete(overlayKey)) {
			console.warn(`Missing overlay with key:${overlayKey}!`)
		}
	}) as () => void
}

export const overlay: Component = {
	view: (): Children =>
		m(
			// we want the overlays to position relative to the overlay parent
			// the overlay parent also should fill the root
			"#overlay.fill-absolute.noprint",
			{
				style: {
					display: overlays.size > 0 ? "" : "none",
					"margin-top": "env(safe-area-inset-top)", // insets for iPhone X
					// keep the bottom nav bar clear & inset for iOS
					"margin-bottom": styles.isUsingBottomNavigation() ? px(size.bottom_nav_bar + getSafeAreaInsetBottom()) : "unset",
					// we would need to change this if we wanted something to appear from the side
					"margin-left": "env(safe-area-inset-left)",
					"margin-right": "env(safe-area-inset-right)",
				},
				"aria-hidden": overlays.size === 0,
			},
			Array.from(overlays.entries()).map((overlay) => {
				const [key, attrs] = overlay
				const position = attrs.position()

				const baseClasses = "abs elevated-bg " + attrs.shadowClass
				const classes = attrs.createAnimation == null ? baseClasses : baseClasses + " " + attrs.createAnimation

				return m(
					"",
					{
						key,
						class: classes,
						style: {
							width: position.width,
							top: position.top,
							bottom: position.bottom,
							right: position.right,
							left: position.left,
							height: position.height,
							"z-index": position.zIndex != null ? position.zIndex : LayerType.Overlay,
						},
						onbeforeremove: (vnode: VnodeDOM) => {
							if (attrs.closeAnimation != null) {
								const dom = vnode.dom as HTMLElement

								// Force the environment to restart the animations via a reflow
								dom.className = baseClasses
								void dom.offsetWidth

								// Play the closing animation
								dom.className = baseClasses + " " + attrs.closeAnimation

								// Wait for the close animation to complete
								return new Promise(function (resolve) {
									dom.addEventListener("animationend", resolve)
								})
							}
						},
					},
					m(attrs.component),
				)
			}),
		),
}
