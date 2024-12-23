import m, { Children, Component } from "mithril"
import { alpha, AlphaEnum, animations } from "./../animation/Animations"
import { theme } from "../theme"
import type { Shortcut } from "../../misc/KeyManager"
import { keyManager } from "../../misc/KeyManager"
import { windowFacade } from "../../misc/WindowFacade"
import { insideRect, remove } from "@tutao/tutanota-utils"
import { LayerType } from "../../../RootView"
import { assertMainOrNodeBoot } from "../../api/common/Env"

assertMainOrNodeBoot()

type ModalComponentWrapper = {
	key: number
	component: ModalComponent
	needsBg: boolean
}

class Modal implements Component {
	components: Array<ModalComponentWrapper>
	private uniqueComponent: ModalComponent | null
	view: Component["view"]
	visible: boolean
	currentKey: number
	private closingComponents: Array<ModalComponent>
	private readonly historyEventListener = (e: Event) => this.popState(e)

	constructor() {
		this.currentKey = 0
		this.components = []
		this.visible = false
		this.uniqueComponent = null
		this.closingComponents = []

		this.view = (): Children => {
			return m(
				"#modal.fill-absolute",
				{
					oncreate: (_) => {
						// const lastComponent = last(this.components)
						// if (lastComponent) {
						// 	lastComponent.component.backgroundClick(e)
						// }
					},
					style: {
						"z-index": LayerType.Modal,
						display: this.visible ? "" : "none",
					},
				},
				this.components.map((wrapper, i, array) => {
					return m(
						".fill-absolute",
						{
							key: wrapper.key,
							oncreate: (vnode) => {
								// do not set visible=true already in display() because it leads to modal staying open in a second window in Chrome
								// because onbeforeremove is not called in that case to set visible=false. this is probably an optimization in Chrome to reduce
								// UI updates if the window is not visible. setting visible=true here is fine because this code is not even called then
								this.visible = true
								m.redraw()
								if (wrapper.needsBg) this.addAnimation(vnode.dom as HTMLElement, true)
							},
							onclick: (event: MouseEvent) => {
								const element = event.currentTarget as HTMLElement
								// This layer div has a single child, the modal component
								const child = element.firstElementChild

								// child shouldn't be null but maybe the user click fast idk
								if (child) {
									const childRect = child.getBoundingClientRect()

									if (!insideRect(event, childRect)) {
										wrapper.component.backgroundClick(event)
									}
								}
							},
							style: {
								zIndex: LayerType.Modal + 1 + i,
							},
							onbeforeremove: (vnode) => {
								if (wrapper.needsBg) {
									this.closingComponents.push(wrapper.component)

									return Promise.all([
										this.addAnimation(vnode.dom as HTMLElement, false).then(() => {
											remove(this.closingComponents, wrapper.component)

											if (this.components.length === 0 && this.closingComponents.length === 0) {
												this.visible = false
											}
										}),
										wrapper.component.hideAnimation(),
									]).then(() => {
										m.redraw()
									})
								} else {
									if (this.components.length === 0 && this.closingComponents.length === 0) {
										this.visible = false
									}

									return wrapper.component.hideAnimation().then(() => m.redraw())
								}
							},
						},
						m(wrapper.component),
					)
				}),
			)
		}
	}

	display(component: ModalComponent, needsBg: boolean = true) {
		// move the handler to the top of the handler stack
		windowFacade.removeHistoryEventListener(this.historyEventListener)
		windowFacade.addHistoryEventListener(this.historyEventListener)
		if (this.components.length > 0) {
			keyManager.unregisterModalShortcuts(this.components[this.components.length - 1].component.shortcuts())
		}

		const existingIndex = this.components.findIndex((shownComponent) => shownComponent.component === component)

		if (existingIndex !== -1) {
			console.warn("Attempting to display the same modal component multiple times!")
			this.components.splice(existingIndex, 1)
		}

		this.components.push({
			key: this.currentKey++,
			component: component,
			needsBg,
		})
		m.redraw()
		keyManager.registerModalShortcuts(component.shortcuts())
	}

	/**
	 * notify components that a history state was popped. The Component Stack is notified from the top and the first
	 * Component to return false will stop underlying components from receiving the notification.
	 * Components that return true are expected to remove themselves from the Modal stack, eg dropdowns.
	 * @param e: the DOM Event
	 * @private
	 */
	private popState(e: Event): boolean {
		console.log("modal popstate")
		const len = this.components.length

		if (len === 0) {
			console.log("no modals to close")
			return true
		}

		// get the keys because we're going to modify the component stack during iteration
		const keys = this.components.map((c) => c.key)

		for (let i = len - 1; i >= 0; i--) {
			const component = this.getComponentByKey(keys[i])

			if (!component) {
				console.log("component went AWOL, continuing")
				continue
			}

			if (!component.popState(e)) {
				console.log("component handled popstate")
				return false
			}
		}

		return true
	}

	/**
	 * used for modal components that should only be opened once
	 * multiple calls will be ignored if the first component is still visible
	 * @param component
	 */
	displayUnique(component: ModalComponent, needsBg: boolean = true) {
		if (this.uniqueComponent) {
			console.log("tried to open unique component while another was open!")
			return
		}

		this.display(component, needsBg)
		this.uniqueComponent = component
	}

	private getComponentByKey(key: number): ModalComponent | null {
		const entry = this.components.find((c) => c.key === key)
		return entry?.component ?? null
	}

	remove(component: ModalComponent): void {
		const componentIndex = this.components.findIndex((wrapper) => wrapper.component === component)

		if (componentIndex === -1) {
			console.log("can't remove non existing component from modal")
			return
		}

		const componentIsTopmostComponent = componentIndex === this.components.length - 1

		if (componentIsTopmostComponent) {
			console.log("removed topmost modal component")
			keyManager.unregisterModalShortcuts(component.shortcuts())
		}

		this.components.splice(componentIndex, 1)

		if (this.uniqueComponent === component) {
			this.uniqueComponent = null
		}

		m.redraw()

		if (this.components.length > 0 && componentIsTopmostComponent) {
			// the removed component was the last component, so we can now register the shortcuts of the now last component
			keyManager.registerModalShortcuts(this.components[this.components.length - 1].component.shortcuts())
		}

		// Return the focus back to it's calling element.
		component.callingElement()?.focus()
	}

	/**
	 * adds an animation to the topmost component
	 */
	addAnimation(domLayer: HTMLElement, fadein: boolean): Promise<unknown> {
		const start = 0
		const end = 0.5
		return animations.add(domLayer, alpha(AlphaEnum.BackgroundColor, theme.modal_bg, fadein ? start : end, fadein ? end : start))
	}
}

export const modal: Modal = new Modal()

export interface ModalComponent extends Component {
	hideAnimation(): Promise<void>

	onClose(): void

	shortcuts(): Shortcut[]

	backgroundClick(e: MouseEvent): void

	/**
	 * will be called by the main modal if no other component above this one blocked the event (previous components returned true)
	 * return false if the event was handled and lower components shouldn't be notified, true otherwise
	 * @param e
	 */
	popState(e: Event): boolean

	// The element that was interacted with to show the modal.
	callingElement(): HTMLElement | null
}
