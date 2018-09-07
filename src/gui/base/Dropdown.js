// @flow
import m from "mithril"
import {NavButton} from "./NavButton"
import {modal} from "./Modal"
import {animations, height, width} from "./../animation/Animations"
import {ease} from "../animation/Easing"
import {size, px} from "../size"
import {Button} from "./Button"
import {Keys} from "../../misc/KeyManager"
import {mod} from "../../misc/MathUtils"
import {client} from "../../misc/ClientDetector"
import {assertMainOrNodeBoot} from "../../api/Env"

assertMainOrNodeBoot()

export interface PosRect {
	+height: number;
	+width: number;
	+top: number;
	+left: number;
	+right: number;
	+bottom: number;
}

// Some Android WebViews still don't support DOMRect so we polyfill that
// Implemented according to https://developer.mozilla.org/en-US/docs/Web/API/DOMRectReadOnly and common sense
export class DomRectReadOnlyPolyfilled implements PosRect {
	x: number
	y: number
	width: number
	height: number

	constructor(x: number, y: number, width: number, height: number) {
		this.x = x
		this.y = y
		this.width = width
		this.height = height
	}

	get top(): number {
		return this.height > 0 ? this.y : this.y + this.height
	}

	get bottom(): number {
		return this.height > 0 ? this.y + this.height : this.y
	}

	get left(): number {
		return this.width > 0 ? this.x : this.x + this.width
	}

	get right(): number {
		return this.width > 0 ? this.x + this.width : this.x
	}
}

export class Dropdown {
	children: Array<string | NavButton | Button>;
	_domDropdown: HTMLElement;
	origin: ?PosRect;
	maxHeight: number;
	oninit: Function;
	view: Function;
	_width: number;
	shortcuts: Function;
	_buttonsHeight: number;


	constructor(lazyChildren: lazy<Array<string | NavButton | Button>>, width: number) {
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
				this.children.filter(b => isVisible(b))
				    .map(button => (typeof button === "string") ?
					    m(".flex-v-center.center.button-height.b.text-break.doNotClose.selectable", button) : m(button)))
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
		const next = () => {
			let visibleButtons = this.children.filter(b => (typeof b !== "string") && b.isVisible())
			visibleButtons = ((visibleButtons: any): Array<Button | NavButton>)
			let selected = visibleButtons.find(b => document.activeElement === b._domButton)
			if (selected) {
				visibleButtons[mod(visibleButtons.indexOf(selected) + 1, visibleButtons.length)]._domButton.focus()
			} else if (visibleButtons.length > 0) {
				visibleButtons[0]._domButton.focus()
			}
		}
		const previous = () => {
			let visibleButtons = this.children.filter(b => (typeof b !== "string") && b.isVisible())
			visibleButtons = ((visibleButtons: any): Array<Button | NavButton>)
			let selected = visibleButtons.find(b => document.activeElement === b._domButton)
			if (selected) {
				visibleButtons[mod(visibleButtons.indexOf(selected) - 1, visibleButtons.length)]._domButton.focus()
			} else if (visibleButtons.length > 0) {
				visibleButtons[visibleButtons.length - 1]._domButton.focus()
			}
		}

		return [
			{
				key: Keys.ESC,
				exec: () => this.close(),
				help: "close_alt"
			},
			{
				key: Keys.TAB,
				shift: true,
				exec: () => previous(),
				help: "selectPrevious_action"
			},
			{
				key: Keys.TAB,
				shift: false,
				exec: () => next(),
				help: "selectNext_action"
			},
			{
				key: Keys.UP,
				exec: () => previous(),
				help: "selectPrevious_action"
			},
			{
				key: Keys.DOWN,
				exec: () => next(),
				help: "selectNext_action"
			},
		]
	}

	setOrigin(origin: PosRect) {
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

			let buttonsHeight = this.children.filter(b => isVisible(b))
			                        .reduce((previous: number, current) =>
				                        previous + ((typeof current === "string") ?
				                        size.button_height : current.getHeight()), 0) + size.vpad_small * 2
			this._buttonsHeight = buttonsHeight
			this.maxHeight = Math.min(buttonsHeight, (top < bottom ? window.innerHeight - top : window.innerHeight
				- bottom) - 10)
			return animations.add(domElement, [
				width(0, this._width),
				height(0, this.maxHeight)
			], {easing: ease.out}).then(() => {
				if (this.maxHeight < buttonsHeight) {
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

function isVisible(dropDownElement: string | NavButton | Button) {
	return (typeof dropDownElement === "string") || dropDownElement.isVisible()
}