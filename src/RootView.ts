import m, {Children} from "mithril"
import {modal} from "./gui/base/Modal"
import {overlay} from "./gui/base/Overlay"
import {styles} from "./gui/styles"
import {assertMainOrNodeBoot} from "./api/common/Env"

assertMainOrNodeBoot()

export const enum LayerType {
	// Minimized editors, SearchBarOverlay
	View = 0,
	// notifications that require no user interaction
	LowPriorityOverlay = 100,
	// Foreground menu in mobile layout
	LowPriorityNotification = 150,
	// Editors, Dialogs
	ForegroundMenu = 200,
	// Error message dialogs, Notifications
	Modal = 300,
	Overlay = 400,
}

export class RootView {
	view: (...args: Array<any>) => any
	viewCache: Record<string, (...args: Array<any>) => any>

	constructor() {
		this.viewCache = {}

		// On first mouse event disable outline. This is a compromise between keyboard navigation users and mouse users.
		let onmousedown: ((e: EventRedraw<MouseEvent>) => unknown) | null = (e) => {
			if (onmousedown) {
				console.log("disabling outline")
				styles.registerStyle("outline", () => ({
					"*": {
						outline: "none",
					},
				}))
				// remove event listener after the first click to not re-register style
				onmousedown = null
				// It is important to not redraw at this point because click event may be lost otherwise and saved login button would not be
				// actually pressed. It's unclear why but preventing redraw (this way or setting listener manually) helps.
				// It's also useless to redraw for this click handler because we just want to add a global style definition.
				e.redraw = false
			}
		}

		this.view = (vnode): Children => {
			return m(
				"#root" + (styles.isUsingBottomNavigation() ? ".mobile" : ""),
				{
					onmousedown,
				},
				[m(overlay), m(modal), vnode.children],
			)
		}
	}
}

export const root: RootView = new RootView()