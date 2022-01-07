// @flow
import m from "mithril"
import {alpha, animations} from "./../animation/Animations"
import {theme} from "../theme"
import type {Shortcut} from "../../misc/KeyManager"
import {keyManager} from "../../misc/KeyManager"
import {windowFacade} from "../../misc/WindowFacade"
import {remove} from "@tutao/tutanota-utils"
import {downcast, insideRect} from "@tutao/tutanota-utils"
import {LayerType} from "../../RootView"
import {assertMainOrNodeBoot} from "../../api/common/Env"

assertMainOrNodeBoot()

type ModalComponentWrapper = {key: number, component: ModalComponent, needsBg: boolean}

class Modal {
	components: Array<ModalComponentWrapper>;
	_uniqueComponent: ?ModalComponent;
	_domModal: HTMLElement;
	view: Function;
	visible: boolean;
	currentKey: number;
	_closingComponents: Array<ModalComponent>

	constructor() {
		this.currentKey = 0
		this.components = []
		this.visible = false
		this._uniqueComponent = null
		this._closingComponents = []

		// modal should never get removed, so not saving unsubscriber
		windowFacade.addHistoryEventListener(e => this._popState(e))

		this.view = (): Children => {
			return m("#modal.fill-absolute", {
				oncreate: (vnode) => {
					this._domModal = vnode.dom
					// TODO
					// const lastComponent = last(this.components)
					// if (lastComponent) {
					// 	lastComponent.component.backgroundClick(e)
					// }
				},
				style: {
					'z-index': LayerType.Modal,
					display: this.visible ? "" : 'none' // display: null not working for IE11
				}
			}, this.components.map((wrapper, i, array) => {
				return m(".layer.fill-absolute", {
						key: wrapper.key,
						oncreate: vnode => {
							// do not set visible=true already in display() because it leads to modal staying open in a second window in Chrome
							// because onbeforeremove is not called in that case to set visible=false. this is probably an optimization in Chrome to reduce
							// UI updates if the window is not visible. setting visible=true here is fine because this code is not even called then
							this.visible = true
							m.redraw()
							if (wrapper.needsBg) this.addAnimation(vnode.dom, true)
						},
						onclick: (event: MouseEvent) => {
							// flow only recognizes currentTarget as an EventTarget, but we know here that it's an HTMLElement
							const element: HTMLElement = downcast(event.currentTarget)
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
						onbeforeremove: vnode => {
							if (wrapper.needsBg) {
								this._closingComponents.push(wrapper.component)
								return Promise.all([
									this.addAnimation(vnode.dom, false).then(() => {
										remove(this._closingComponents, wrapper.component)
										if (this.components.length === 0 && this._closingComponents.length === 0) {
											this.visible = false
										}
									}),
									wrapper.component.hideAnimation()
								]).then(() => {
									m.redraw()
								})
							} else {
								if (this.components.length === 0 && this._closingComponents.length === 0) {
									this.visible = false
								}
								return wrapper.component.hideAnimation()
								              .then(() => m.redraw())
							}
						}
					},
					m(wrapper.component)
				)
			}))
		}
	}

	display(component: ModalComponent, needsBg: boolean = true) {
		if (this.components.length > 0) {
			keyManager.unregisterModalShortcuts(this.components[this.components.length - 1].component.shortcuts())
		}
		const existingIndex = this.components.findIndex((shownComponent) => shownComponent.component === component)
		if (existingIndex !== -1) {
			console.warn("Attempting to display the same modal component multiple times!")
			this.components.splice(existingIndex, 1)
		}
		this.components.push({key: this.currentKey++, component: component, needsBg})
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
	_popState(e: Event): boolean {
		console.log("modal popstate")
		const len = this.components.length
		if (len === 0) {
			console.log("no modals")
			return true // no modals to close
		}
		// get the keys because we're going to modify the component stack during iteration
		const keys = this.components.map(c => c.key)
		for (let i = len - 1; i >= 0; i--) {
			const component = this._getComponentByKey(keys[i])
			if (!component) {
				console.log("component went AWOL, continuing");
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
		if (this._uniqueComponent) {
			return
		}
		this.display(component, needsBg)
		this._uniqueComponent = component
	}

	_getComponentByKey(key: number): ?ModalComponent {
		const entry = this.components.find(c => c.key === key)
		return entry && entry.component
	}

	remove(component: ModalComponent) {
		let componentIndex = this.components.findIndex(wrapper => wrapper.component === component)
		if (componentIndex === -1) {
			console.log("can't remove non existing component from modal")
			return
		}
		let componentIsLastComponent = (componentIndex === this.components.length - 1)
		if (componentIsLastComponent) {
			keyManager.unregisterModalShortcuts(component.shortcuts())
		}
		this.components.splice(componentIndex, 1)
		if (this._uniqueComponent === component) {
			this._uniqueComponent = null
		}
		m.redraw()
		if (this.components.length > 0 && componentIsLastComponent) {
			// the removed component was the last component, so we can now register the shortcuts of the now last component
			keyManager.registerModalShortcuts(this.components[this.components.length - 1].component.shortcuts())
		}
	}

	/**
	 * adds an animation to the topmost component
	 */
	addAnimation(domLayer: HTMLElement, fadein: boolean): Promise<void> {
		let start = 0
		let end = 0.5
		return animations.add(domLayer, alpha(alpha.type.backgroundColor, theme.modal_bg, fadein ? start : end, fadein ? end : start))
	}


}

export const modal: Modal = new Modal()

export interface ModalComponent {
	hideAnimation(): Promise<void>;

	onClose(): void;

	shortcuts(): Shortcut[];

	view(vnode: Vnode<any>): Children;

	backgroundClick(e: MouseEvent): void;

	popState(e: Event): boolean;
}