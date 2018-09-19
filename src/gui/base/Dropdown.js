// @flow
import m from "mithril"
import {NavButton} from "./NavButton"
import {modal} from "./Modal"
import {animations, height, width} from "./../animation/Animations"
import {ease} from "../animation/Easing"
import {px, size} from "../size"
import {Button} from "./Button"
import {Keys} from "../../misc/KeyManager"
import {mod} from "../../misc/MathUtils"
import {client} from "../../misc/ClientDetector"
import {assertMainOrNodeBoot} from "../../api/Env"
import stream from "mithril/stream/stream.js"
import {lang} from "../../misc/LanguageViewModel"

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
	_domInput: HTMLInputElement;
	_domContents: HTMLElement;
	_domSpacer: HTMLElement;
	origin: ?PosRect;
	maxHeight: number;
	oninit: Function;
	view: Function;
	_width: number;
	shortcuts: Function;
	_contentsHeight: number;
	_filterString: Stream<string>;
	_alignRight: boolean;

	constructor(lazyChildren: lazy<Array<string | NavButton | Button>>, width: number) {
		this.children = []
		this.maxHeight = 0
		this._width = width
		this._contentsHeight = 0
		this._filterString = stream("")
		this._alignRight = false;
		let isFilterable = false;

		this.oninit = () => {
			this.children = lazyChildren()
			isFilterable = (this.children.length > 10)
		}

		let _shortcuts = this._createShortcuts()
		this.shortcuts = () => {
			return _shortcuts
		}

		const _inputField = (): VirtualElement | null => {
			return isFilterable
				? m("input.dropdown-bar.doNotClose.pl-l.button-height.border-radius"
					+ (this._alignRight ? ".right" : ""), {
						placeholder: lang.get("typeToFilter_label"),
						oncreate: (vnode) => {
							this._domInput = vnode.dom
							this._domInput.value = this._filterString()
						},
						oninput: e => {
							this._filterString(this._domInput.value)
							this.setContentHeight(this._domContents)
						},
						style: {width: px(this._width - size.hpad_large)}
					},
					this._filterString()
				)
				: null
		}

		const _spacer = (): VirtualElement | null => {
			return isFilterable
				? m(".button-height.doNotClose.mt-xs", {
						oncreate: (vnode) => this._domSpacer = vnode.dom
					},
					lang.get("emptyString_msg")
				)
				: null
		}

		const _contents = (): VirtualElement => {
			return m(".dropdown-content.plr-l.scroll", {
					oncreate: (vnode) => {
						this.setContentHeight(vnode.dom)
						this._domContents = vnode.dom
						window.requestAnimationFrame(() => {
							if (document.activeElement && typeof document.activeElement.blur === "function") {
								document.activeElement.blur()
							}
						})
					},
					// a fixed with for the content of this dropdown is needed to avoid that
					// the elements in the dropdown move during animation
					style: {width: px(this._width)}
				},
				this._visibleItems()
				    .map(button => (typeof button === "string")
					    ? m(".flex-v-center.center.button-height.b.text-break.doNotClose.selectable", button)
					    : m(button))
			)
		}

		this.view = (): VirtualElement => {
			return m(".dropdown-panel.border-radius.backface_fix", {
					oncreate: (vnode) => this.show(vnode.dom),
					onkeypress: e => {
						if (this._domInput) {
							this._domInput.focus()
						}
					},
				},
				[_inputField(), _spacer(), _contents()]
			)
		}
	}

	backgroundClick(e: MouseEvent) {
		if (!(e.target: any).classList.contains("doNotClose") && (this._domDropdown.contains((e.target: any))
			|| this._domDropdown.parentNode === e.target)) {
			this.close();
		}
	}

	_createShortcuts() {
		const next = () => {
			let visibleElements = this._visibleItems().filter(b => (typeof b !== "string"))
			visibleElements = ((visibleElements: any): Array<Button | NavButton>).map(b => b._domButton)
			if (this._domInput) {
				visibleElements = [this._domInput].concat(visibleElements)
			}
			let selected = visibleElements.find(b => document.activeElement === b)
			if (selected) {
				visibleElements[mod(visibleElements.indexOf(selected) + 1, visibleElements.length)].focus()
			} else if (visibleElements.length > 0) {
				visibleElements[0].focus()
			}
		}
		const previous = () => {
			let visibleElements = this._visibleItems().filter(b => (typeof b !== "string"))
			visibleElements = ((visibleElements: any): Array<Button | NavButton>).map(b => b._domButton)
			if (this._domInput) {
				visibleElements = [this._domInput].concat(visibleElements)
			}
			let selected = visibleElements.find(b => document.activeElement === b)
			if (selected) {
				visibleElements[mod(visibleElements.indexOf(selected) - 1, visibleElements.length)].focus()
			} else if (visibleElements.length > 0) {
				visibleElements[visibleElements.length - 1].focus()
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
			this.setContentHeight()
			this.maxHeight = Math.min(
				this._contentsHeight,
				Math.max(window.innerHeight - top, window.innerHeight - bottom) - 10
			)
			return animations.add(domElement, [
				width(0, this._width),
				height(0, this.maxHeight)
			], {easing: ease.out}).then(() => {
				const offset = this._domSpacer
					? this._domSpacer.clientHeight + size.vpad_xs
					: 0
				if (this.maxHeight - offset < this._contentsHeight) {
					// do not show the scrollbar during the animation.
					this._domContents.style.maxHeight = px(this.maxHeight - offset)
					this._domContents.style.overflowY = client.overflowAuto
				}
				if (this._domInput) {
					this._domInput.classList.add("fixed")
					this._domInput.focus()
				}
			})
		}
	}

	setContentHeight(domElement: ?HTMLElement) {
		this._contentsHeight = this._visibleItems()
		                           .reduce((previous: number, current) =>
			                           previous + ((typeof current === "string")
			                           ? size.button_height
			                           : current.getHeight()), 0) + size.vpad_small * 2

		if (domElement && this._contentsHeight > size.vpad_small * 2) {
			// in ie the height of dropdown-content is too big because of the
			// line-height. to prevent this set the height here.
			domElement.style.height = this._contentsHeight + "px"
		}
	}

	/**
	 * Is invoked from modal as the two animations (background layer opacity and dropdown) should run in parallel
	 * @returns {Promise.<void>}
	 */
	hideAnimation(): Promise<void> {
		if (this._domInput) {
			this._domInput.classList.remove("fixed")
		}
		this._domDropdown.style.overflowY = 'hidden'
		return animations.add(this._domDropdown, [
			width(this._width, 0),
			height(this.maxHeight, 0)
		], {easing: ease.out})
	}

	_visibleItems(): Array<string | NavButton | Button> {
		return this.children.filter(b => {
			return (typeof b === "string")
				? b.includes(this._filterString().toLowerCase())
				: b.isVisible() && b.getLabel().toLowerCase().includes(this._filterString().toLowerCase())
		})
	}
}