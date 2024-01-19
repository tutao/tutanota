import m, { Children, Component, VnodeDOM } from "mithril"
import { LayerType } from "../../RootView"
import type { lazy } from "@tutao/tutanota-utils"
import { assertMainOrNodeBoot } from "../../api/common/Env"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
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
	isClosing: boolean
}

const overlays: Map<number, OverlayAttrs> = new Map()
let key = 0

export function displayOverlay(
	position: lazy<PositionRect>,
	component: Component,
	createAnimation?: string,
	closeAnimation?: string,
	shadowClass: string = "dropdown-shadow",
): () => Promise<void> {
	// Use the inverse of the show animation as the close animation if it is not given
	if (createAnimation != null && closeAnimation == null) closeAnimation = `${createAnimation} animation-reverse`

	const overlayKey = key++
	const pair = {
		position,
		component,
		createAnimation,
		closeAnimation,
		shadowClass,
		isClosing: false,
	} as OverlayAttrs
	// Add the new overlay into the overlay container
	overlays.set(overlayKey, pair)

	return async () => {
		// Get the overlay we added in the above function body
		const overlay: OverlayAttrs | null = overlays.get(overlayKey) ?? null
		if (overlay == null) throw new ProgrammingError(`Failed to remove overlay with key:${overlayKey}!`)

		// Switch its animation CSS class to `closeAnimation`
		overlay.isClosing = true

		// Return a promise to maintain compatibility with legacy code
		return Promise.resolve()
	}
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
			mapToArray(overlays).map((overlay) => {
				const [key, attrs] = overlay
				const position = attrs.position()

				const baseClasses = "abs elevated-bg " + attrs.shadowClass
				const currentAnimation = attrs.isClosing ? attrs.closeAnimation : attrs.createAnimation
				const classes = currentAnimation == null ? baseClasses : baseClasses + " " + currentAnimation

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
						onanimationend: () => {
							if (attrs.isClosing) {
								overlays.delete(key)
							}
						},
						onupdate(vnode: VnodeDOM<any>): any {
							if (attrs.isClosing && attrs.closeAnimation != null) {
								const dom = vnode.dom as HTMLElement

								// Force the environment to restart the animations via a reflow
								dom.className = baseClasses
								void dom.offsetWidth
								dom.className = classes
							}
						},
					},
					m(attrs.component),
				)
			}),
		),
}

function mapToArray<T, K>(map: Map<T, K>): Array<[T, K]> {
	const mapAsArray: Array<[T, K]> = []
	for (const value of map.entries()) {
		mapAsArray.push(value)
	}
	return mapAsArray
}
