// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {animations, alpha} from "./../animation/Animations"
import {theme} from "../theme"
import {assertMainOrNode} from "../../api/Env"
import {keyManager} from "../../misc/KeyManager"
import {module as replaced} from "@hot"

assertMainOrNode()

class Modal {
	components: {key: number, component: ModalComponent}[];
	_domModal: HTMLElement;
	onclick: stream<MouseEvent>;
	view: Function;
	visible: boolean;
	currentKey: number;

	constructor() {
		this.currentKey = 0
		this.components = []
		this.visible = false
		this.onclick = stream("")

		this.view = (): VirtualElement => {

			return m("#modal.fill-absolute", {
				oncreate: (vnode) => this._domModal = vnode.dom,
				onclick: (e: MouseEvent) => this.onclick(e),
				style: {
					'z-index': 99,
					display: this.visible ? "" : 'none' // display: null not working for IE11
				}
			}, [
				this.components.map((wrapper, i, array) => {
					return m(".layer.fill-absolute", {
							key: wrapper.key,
							oncreate: vnode => {
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
		this.visible = true
		if (this.components.length > 0) {
			keyManager.unregisterModalShortcuts(this.components[this.components.length - 1].component.shortcuts())
		}
		this.components.push({key: this.currentKey++, component})
		m.redraw()
		keyManager.registerModalShortcuts(component.shortcuts())
	}

	remove(component: ModalComponent) {
		let componentIndex = this.components.findIndex(wrapper => wrapper.component == component)
		let componentIsLastComponent = (componentIndex == this.components.length - 1)
		if (componentIsLastComponent) {
			keyManager.unregisterModalShortcuts(component.shortcuts())
		}
		this.components.splice(componentIndex, 1)
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
