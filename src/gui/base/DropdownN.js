// @flow
import m from "mithril"
import {modal} from "./Modal"
import {animations, height, width} from "./../animation/Animations"
import {ease} from "../animation/Easing"
import {px, size} from "../size"
import {focusNext, focusPrevious, Keys} from "../../misc/KeyManager"
import {client} from "../../misc/ClientDetector"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN, isVisible} from "./ButtonN"
import type {NavButtonAttrs} from "./NavButtonN"
import {NavButtonN} from "./NavButtonN"
import {assertMainOrNodeBoot} from "../../api/Env"
import {lang} from "../../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import {asyncImport} from "../../api/common/utils/Utils"
import type {PosRect} from "./Dropdown"

assertMainOrNodeBoot()


export type DropDownChildAttrs = string | NavButtonAttrs | ButtonAttrs;

// TODO: add resize listener like in the old Dropdown
export class DropdownN {
	children: $ReadOnlyArray<DropDownChildAttrs>;
	_domDropdown: HTMLElement;
	origin: ?PosRect;
	maxHeight: number;
	oninit: Function;
	view: Function;
	_width: number;
	shortcuts: Function;
	_buttonsHeight: number;
	_filterString: Stream<string>;
	_domInput: HTMLInputElement;
	_domContents: HTMLElement;
	_isFilterable: boolean;


	constructor(lazyChildren: lazy<$ReadOnlyArray<DropDownChildAttrs>>, width: number) {
		this.children = []
		this.maxHeight = 0
		this._width = width
		this._buttonsHeight = 0
		this._filterString = stream("")

		this.oninit = () => {
			this.children = lazyChildren()
			this._isFilterable = this.children.length > 10
			this.children.map(child => {
				if (typeof child === 'string') {
					return child
				}
				child = ((child: any): ButtonAttrs | NavButtonAttrs)
				child.click = this.wrapClick(child.click ? child.click : () => null)
				child.isVisible = this._isFilterable ? this.wrapVisible(child.isVisible, lang.getMaybeLazy(child.label)) : child.isVisible
				if (typeof child.noBubble !== 'undefined') {
					let buttonChild = ((child: any): ButtonAttrs)
					buttonChild.noBubble = false
				}
				return child
			})
		}

		let _shortcuts = this._createShortcuts()
		this.shortcuts = () => {
			return _shortcuts
		}

		const _inputField = () => {
			return this._isFilterable
				? m("input.dropdown-bar.elevated-bg.doNotClose.pl-l.button-height.abs", {
						placeholder: lang.get("typeToFilter_label"),
						oncreate: (vnode) => {
							this._domInput = vnode.dom
							this._domInput.value = this._filterString()
						},
						oninput: e => {
							this._filterString(this._domInput.value)
						},
						style: {
							paddingLeft: px(size.hpad_large * 2),
							paddingRight: px(size.hpad_small),
							width: px(this._width - size.hpad_large),
							top: 0,
							height: px(size.button_height),
							left: 0,
						}
					},
					this._filterString()
				)
				: null
		}

		const _contents = () => {
			return m(".dropdown-content.plr-l.scroll.abs", {
					oncreate: (vnode) => {
						this.setContentHeight(vnode.dom)
						this.show(vnode.dom)
						window.requestAnimationFrame(() => {
							if (document.activeElement && typeof document.activeElement.blur === "function") {
								document.activeElement.blur()
							}
						})
					},
					onscroll: (ev) => {
						// needed here to prevent flickering on ios
						if (ev.target.scrollTop < 0) {
							ev.redraw = true
						} else if ((ev.target.scrollTop + this._domContents.offsetHeight) > ev.target.scrollHeight) {
							ev.redraw = true
						} else {
							ev.redraw = false
						}
					},
					style: {
						width: px(this._width),
						top: px(this._getFilterHeight()),
						bottom: 0
					} // a fixed with for the content of this dropdown is needed to avoid that
					// the elements in the dropdown move during animation
				},
				(this._visibleChildren().map(child => {
					if (typeof child === "string") {
						return m(".flex-v-center.center.button-height.b.text-break.doNotClose.selectable", child)
					} else if (typeof child.href === 'undefined') {
						return m(ButtonN, ((child: any): ButtonAttrs))
					} else {
						return m(NavButtonN, ((child: any): NavButtonAttrs))
					}
				}): any))
		}

		this.view = (): VirtualElement => {
			return m(".dropdown-panel.elevated-bg.border-radius.backface_fix", {
					oncreate: vnode => this._domDropdown = vnode.dom,
					onkeypress: e => {
						if (this._domInput) {
							this._domInput.focus()
						}
					},
				}, [_inputField(), _contents()]
			)
		}
	}

	wrapClick(fn: (MouseEvent, HTMLElement) => any): (MouseEvent, HTMLElement) => any {
		return (e: MouseEvent, dom) => {
			const r = fn(e, dom)
			this.close()
			return r
		}
	}

	wrapVisible(fn: ?() => boolean, label: string): () => boolean {
		return () => {
			return (fn instanceof Function ? fn() : true) && label.toLowerCase().includes(this._filterString().toLowerCase())
		}
	}

	backgroundClick(e: MouseEvent) {
		if (this._domDropdown && !(e.target: any).classList.contains("doNotClose") && (this._domDropdown.contains((e.target: any))
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
			{
				key: Keys.RETURN,
				exec: () => this.chooseMatch(),
				help: "ok_action"
			}
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

	popState(e: Event): boolean {
		this.close()
		return true
	}

	chooseMatch = () => {
		const filterString = this._filterString().toLowerCase()
		let visibleElements: Array<ButtonAttrs | NavButtonAttrs> = (this._visibleChildren().filter(b => (typeof b !== "string")): any)
		let matchingButton = visibleElements.length === 1
			? visibleElements[0]
			: visibleElements.find(b => lang.getMaybeLazy(b.label).toLowerCase() === filterString)
		if (document.activeElement === this._domInput
			&& matchingButton
			&& matchingButton.click) {
			matchingButton.click()
			return false
		}
		return true
	}

	show(domElement: HTMLElement) {
		this._domContents = domElement
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
			let top = this.origin.bottom
			let bottom = window.innerHeight - (this.origin.bottom - this.origin.height)
			if (top < bottom) {
				this._domDropdown.style.top = top + "px"
				this._domDropdown.style.bottom = ''
			} else {
				this._domDropdown.style.top = ''
				this._domDropdown.style.bottom = bottom + "px"
			}

			this._buttonsHeight = this._visibleChildren()
			                          .reduce((sum, current) => sum + size.button_height, 0) + size.vpad_small * 2

			this.maxHeight = Math.min(
				this._buttonsHeight + this._getFilterHeight(),
				Math.max(window.innerHeight - top, window.innerHeight - bottom) - 10
			)

			return animations.add(this._domDropdown, [
				width(0, this._width),
				height(0, this.maxHeight)
			], {easing: ease.out}).then(() => {
				if (this.maxHeight - this._getFilterHeight() < this._buttonsHeight) {
					// do not show the scrollbar during the animation.
					this._domContents.style.maxHeight = px(this.maxHeight - this._getFilterHeight())
					this._domContents.style.overflowY = client.overflowAuto
				}
				if (this._domInput && !client.isMobileDevice()) {
					this._domInput.focus()
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
		if (!this._domContents || !this._domDropdown) {
			return Promise.resolve()
		}
		this._domDropdown.style.overflowY = 'hidden'
		return animations.add(this._domDropdown, [
			width(this._width, 0),
			height(this.maxHeight, 0)
		], {easing: ease.out})
	}

	_visibleChildren(): Array<DropDownChildAttrs> {
		return this.children.filter(b => {
			return (typeof b === "string")
				? b.includes(this._filterString().toLowerCase())
				: isVisible(b)
		})
	}

	_getFilterHeight(): number {
		return this._isFilterable ? size.button_height + size.vpad_xs : 0
	}
}

export function createDropdown(lazyButtons: lazy<$ReadOnlyArray<DropDownChildAttrs>>, width: number = 200): clickHandler {
	return createAsyncDropdown(() => Promise.resolve(lazyButtons()), width)
}

export function createAsyncDropdown(lazyButtons: lazyAsync<$ReadOnlyArray<DropDownChildAttrs>>, width: number = 200): clickHandler {
	// not all browsers have the actual button as e.currentTarget, but all of them send it as a second argument (see https://github.com/tutao/tutanota/issues/1110)
	return ((e, dom) => {
		let originalButtons = lazyButtons()
		let buttons = originalButtons
		if (!buttons.isFulfilled()) {
			buttons = asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
				`${env.rootPathPrefix}src/gui/base/ProgressDialog.js`)
				.then(module => {
					return module.showProgressDialog("loading_msg", originalButtons)
				})
		}
		buttons.then(buttons => {
			let dropdown = new DropdownN(() => buttons, width)
			dropdown.setOrigin(dom.getBoundingClientRect())
			modal.displayUnique(dropdown)
		})
	}: clickHandler)
}

// We override type of click to be optional because we wrap it in our own
export type DropdownButtonAttrs = {click?: (MouseEvent) => void} & ButtonAttrs

/**
 *
 * @param mainButtonAttrs the attributes of the main button
 * @param childAttrs the attributes of the children shown in the dropdown
 * @param showDropdown this will be checked before showing the dropdown
 * @param width width of the dropdown
 * @returns {ButtonAttrs} modified mainButtonAttrs that shows a dropdown on click or
 * executes the original onclick if showDropdown returns false
 */
export function attachDropdown(
	mainButtonAttrs: DropdownButtonAttrs,
	childAttrs: lazy<$Promisable<$ReadOnlyArray<DropDownChildAttrs>>>,
	showDropdown?: lazy<boolean> = () => true,
	width?: number): ButtonAttrs {

	const oldClick = mainButtonAttrs.click
	return Object.assign({}, mainButtonAttrs, {
		click: (e: MouseEvent, dom: HTMLElement) => {
			if (showDropdown()) {
				const dropDownFn = createAsyncDropdown(() => Promise.resolve(childAttrs()), width)
				dropDownFn(e, dom)
				e.stopPropagation()
			} else if (oldClick) {
				oldClick(e)
			}
		}
	})
}
