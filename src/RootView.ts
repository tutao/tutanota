import m, { Children, ClassComponent, Vnode } from "mithril"
import { modal } from "./common/gui/base/Modal"
import { overlay } from "./common/gui/base/Overlay"
import { styles } from "./common/gui/styles"
import { assertMainOrNodeBoot, isApp } from "./common/api/common/Env"
import { Keys } from "./common/api/common/TutanotaConstants.js"
import { isKeyPressed } from "./common/misc/KeyManager.js"

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

export const enum PrimaryNavigationType {
	Keyboard,
	Touch,
	Mouse,
	// theoretically pen is also an option
}

// global, in case we have multiple instances for some reason
/** What we infer to be the user's preferred navigation type. */
export let currentNavigationType: PrimaryNavigationType = isApp() ? PrimaryNavigationType.Touch : PrimaryNavigationType.Mouse

/**
 * View which wraps anything that we render.
 * It has overlay, modal and the main layers. It also defines some global handlers for better visual indication depending on the interaction.
 */
export class RootView implements ClassComponent {
	private dom: HTMLElement | null = null

	constructor() {
		// still "old-style" component, we don't want to lose "this" reference
		this.view = this.view.bind(this)
	}

	view(vnode: Vnode): Children {
		return m(
			"#root" + (styles.isUsingBottomNavigation() ? ".mobile" : ""),
			{
				oncreate: (vnode) => {
					this.dom = vnode.dom as HTMLElement
				},
				// use pointer events instead of mousedown/touchdown because mouse events are still fired for touch on mobile
				onpointerup: (e: EventRedraw<PointerEvent>) => {
					if (e.pointerType === "mouse") {
						this.switchNavType(PrimaryNavigationType.Mouse)
					} else {
						// can be "touch" or "pen", treat them the same for now
						this.switchNavType(PrimaryNavigationType.Touch)
					}
					e.redraw = false
				},
				onkeyup: (e: EventRedraw<KeyboardEvent>) => {
					// tab key can be pressed in some other situations e.g. editor but it would be switched back quickly again if needed.
					if (isKeyPressed(e.key, Keys.TAB, Keys.UP, Keys.DOWN, Keys.J, Keys.K)) {
						this.switchNavType(PrimaryNavigationType.Keyboard)
					}
					e.redraw = false
				},
				// See styles for usages of these classes.
				// We basically use them in css combinators as a query for when to show certain interaction indicators.
				class: this.classForType(),
				style: {
					height: "100%",
				},
			},
			[m(overlay), m(modal), vnode.children],
		)
	}

	private switchNavType(newType: PrimaryNavigationType) {
		if (currentNavigationType === newType) {
			return
		}
		this.dom?.classList.remove(this.classForType())
		currentNavigationType = newType
		this.dom?.classList.add(this.classForType())
	}

	private classForType() {
		switch (currentNavigationType) {
			case PrimaryNavigationType.Keyboard:
				return "keyboard-nav"
			case PrimaryNavigationType.Mouse:
				return "mouse-nav"
			case PrimaryNavigationType.Touch:
				return "touch-nav"
		}
	}
}

export const root: RootView = new RootView()
