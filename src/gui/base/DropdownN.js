// @flow
import m from "mithril"
import {NavButton} from "./NavButton"
import {modal} from "./Modal"
import {animations, height, width} from "./../animation/Animations"
import {ease} from "../animation/Easing"
import {size, px} from "../size"
import {Button} from "./Button"
import {Keys} from "../../misc/KeyManager"
import {client} from "../../misc/ClientDetector"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN} from "./ButtonN"
import type {NavButtonAttrs} from "./NavButtonN"
import {NavButtonN} from "./NavButtonN"
import {assertMainOrNodeBoot} from "../../api/Env"
import {mod} from "../../misc/MathUtils"

assertMainOrNodeBoot()

export const TABBABLE = "button, input, textarea, div[contenteditable='true']"
export const INPUT = "input, textarea, div[contenteditable='true']"

export function focusNext(dom: HTMLElement) {
	let tabbable = Array.from(dom.querySelectorAll(TABBABLE))
	let selected = tabbable.find(e => document.activeElement === e)
	if (selected) {
		tabbable[mod(tabbable.indexOf(selected) - 1, tabbable.length)].focus()
	} else if (tabbable.length > 0) {
		tabbable[tabbable.length - 1].focus()
	}
}

export function focusPrevious(dom: HTMLElement) {
	let tabbable = Array.from(dom.querySelectorAll(TABBABLE))
	let selected = tabbable.find(e => document.activeElement === e)
	if (selected) {
		tabbable[mod(tabbable.indexOf(selected) + 1, tabbable.length)].focus()
	} else if (tabbable.length > 0) {
		tabbable[0].focus()
	}
}

export class DropdownN {
	children: Array<string | NavButton | Button>;
	_domDropdown: HTMLElement;
	origin: ?ClientRect;
	maxHeight: number;
	oninit: Function;
	view: Function;
	_width: number;
	shortcuts: Function;
	_buttonsHeight: number;


	constructor(lazyChildren: lazy<Array<string | NavButtonAttrs | ButtonAttrs>>, width: number) {
		this.children = []
		this.maxHeight = 0
		this._width = width
		this._buttonsHeight = 0

		this.oninit = () => {
			this.children = lazyChildren()
		}

		let _shortcuts = this._createShortcuts()
		this.shortcuts = () => {
			return _shortcuts
		}

		this.view = (): VirtualElement => {
			return m(".dropdown-panel.border-radius.backface_fix.scroll", {
					oncreate: (vnode) => this.show(vnode.dom),
				}, m(".dropdown-content.plr-l", {
					oncreate: (vnode) => {
						this.setContentHeight(vnode.dom)
						window.requestAnimationFrame(() => {
							if (document.activeElement && typeof document.activeElement.blur === "function") {
								document.activeElement.blur()
							}
						})
					},
					style: {width: px(this._width)} // a fixed with for the content of this dropdown is needed to avoid that the elements in the dropdown move during animation
				},
				(this.children.filter(b => isVisible((b: any))).map(child => {
					if (typeof child === "string") {
						return m(".flex-v-center.center.button-height.b.text-break.doNotClose", child)
					} else if (typeof child.href !== 'undefined') {
						return m(NavButtonN, ((child: any): NavButtonAttrs))
					} else {
						return m(ButtonN, ((child: any): ButtonAttrs))
					}
				}): any))
			)
		}
	}

	backgroundClick(e: MouseEvent) {
		if (!(e.target: any).classList.contains("doNotClose") && (this._domDropdown.contains((e.target: any))
			|| this._domDropdown.parentNode === e.target)) {
			modal.remove(this)
		}
	}

	_createShortcuts() {
		return [
			{
				key: Keys.ESC,
				exec: () => this.close(),
				help: "close_alt"
			},
			{
				key: Keys.TAB,
				shift: true,
				exec: () => focusPrevious(this._domDropdown),
				help: "selectPrevious_action"
			},
			{
				key: Keys.TAB,
				shift: false,
				exec: () => focusNext(this._domDropdown),
				help: "selectNext_action"
			},
			{
				key: Keys.UP,
				exec: () => focusPrevious(this._domDropdown),
				help: "selectPrevious_action"
			},
			{
				key: Keys.DOWN,
				exec: () => focusNext(this._domDropdown),
				help: "selectNext_action"
			},
		]
	}

	setOrigin(origin: ClientRect) {
		this.origin = origin
	}

	close(): void {
		modal.remove(this)
	}

	onClose(): void {
		this.close()
	}

	show(domElement: HTMLElement) {
		this._domDropdown = domElement
		if (this.origin) {
			let left = this.origin.left
			let right = window.innerWidth - this.origin.right
			if (left < right) {
				this._domDropdown.style.left = left + "px"
				this._domDropdown.style.right = ''
			} else {
				this._domDropdown.style.left = ''
				this._domDropdown.style.right = right + "px"
			}
			let top = this.origin.top + this.origin.height
			let bottom = window.innerHeight - (this.origin.bottom - this.origin.height)
			if (top < bottom) {
				this._domDropdown.style.top = top + "px"
				this._domDropdown.style.bottom = ''
			} else {
				this._domDropdown.style.top = ''
				this._domDropdown.style.bottom = bottom + "px"
			}

			this._buttonsHeight = this.children.filter(b => isVisible((b: any)))
			                          .reduce((sum, current) => sum + size.button_height, 0) + size.vpad_small * 2
			this.maxHeight = Math.min(this._buttonsHeight, (top < bottom ? window.innerHeight - top :
				window.innerHeight - bottom) - 10)
			return animations.add(domElement, [
				width(0, this._width),
				height(0, this.maxHeight)
			], {easing: ease.out}).then(() => {
				if (this.maxHeight < this._buttonsHeight) {
					if (this._domDropdown) {
						// do not show the scrollbar during the animation.
						this._domDropdown.style.overflowY = client.overflowAuto
					}
				}
			})
		}
	}

	setContentHeight(domElement: HTMLElement) {
		if (this._buttonsHeight > 0) {
			// in ie the height of dropdown-content is too big because of the line-height. to prevent this set the height here.
			domElement.style.height = this._buttonsHeight + "px"
		}
	}

	/**
	 * Is invoked from modal as the two animations (background layer opacity and dropdown) should run in parallel
	 * @returns {Promise.<void>}
	 */
	hideAnimation(): Promise<void> {
		this._domDropdown.style.overflowY = 'hidden'
		return animations.add(this._domDropdown, [
			width(this._width, 0),
			height(this.maxHeight, 0)
		], {easing: ease.out})
	}


}

function isVisible(dropDownElement: string | NavButtonAttrs | ButtonAttrs) {
	return (typeof dropDownElement.isVisible !== "function") || dropDownElement.isVisible()
}