// @flow
import m from "mithril"
import {alpha, animations} from "./../animation/Animations"
import {theme} from "../theme"
import {assertMainOrNodeBoot} from "../../api/Env"
import {keyManager} from "../../misc/KeyManager"
import {module as replaced} from "@hot"
import {windowFacade} from "../../misc/WindowFacade"

assertMainOrNodeBoot()

class Modal {
	components: {key: number, component: ModalComponent}[];
	_uniqueComponent: ?ModalComponent;
	_domModal: HTMLElement;
	view: Function;
	visible: boolean;
	currentKey: number;

	constructor() {
		this.currentKey = 0
		this.components = []
		this.visible = false
		this._uniqueComponent = null

		// modal should never get removed, so not saving unsubscriber
		windowFacade.addHistoryEventListener(e => this._popState(e))

		this.view = (): VirtualElement => {
			return m("#modal.fill-absolute", {
				oncreate: (vnode) => this._domModal = vnode.dom,
				onclick: (e: MouseEvent) => this.components.forEach(c => c.component.backgroundClick(e)),
				style: {
					'z-index': 99,
					display: this.visible ? "" : 'none' // display: null not working for IE11
				}
			}, [
				this.components.map((wrapper, i, array) => {
					return m(".layer.fill-absolute", {
							key: wrapper.key,
							oncreate: vnode => {
								// do not set visible=true already in display() because it leads to modal staying open in a second window in Chrome
								// because onbeforeremove is not called in that case to set visible=false. this is probably an optimization in Chrome to reduce
								// UI updates if the window is not visible. setting visible=true here is fine because this code is not even called then
								this.visible = true
								m.redraw()
								this.addAnimation(vnode.dom, true)
							},
							style: {
								zIndex: 100 + i,
							},
							onbeforeremove: vnode => Promise.all([
								this.addAnimation(vnode.dom, false).then(() => {
									if (this.components.length === 0) {
										this.visible = false
									}
								}),
								wrapper.component.hideAnimation()
							]).then(() => m.redraw()),
						},
						[
							m(wrapper.component)
						]
					)
				})
			])
		}
	}

	display(component: ModalComponent) {
		if (this.components.length > 0) {
			keyManager.unregisterModalShortcuts(this.components[this.components.length - 1].component.shortcuts())
		}
		this.components.push({key: this.currentKey++, component: component})
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
	displayUnique(component: ModalComponent) {
		if (this._uniqueComponent) {
			return
		}
		this.display(component)
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
		if (this.components.length === 0) {
			this.currentKey = 0
		} else if (componentIsLastComponent) {
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

if (replaced && replaced.components) {
	replaced.components.map(wrapper => replaced.remove(wrapper.component))
}

