// @flow
import m from "mithril"
import {modal} from "./Modal"
import {animations, opacity, transform} from "./../animation/Animations"
import {ease} from "../animation/Easing"
import {px, size} from "../size"
import type {Shortcut} from "../../misc/KeyManager"
import {focusNext, focusPrevious} from "../../misc/KeyManager"
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
import {Keys} from "../../api/common/TutanotaConstants"
import {newMouseEvent} from "../HtmlUtils"

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
						this._domContents = vnode.dom
						this._buttonsHeight = this._visibleChildren()
						                          .reduce((sum, current) => sum + size.button_height, 0) + size.vpad_small * 2

						const maxHeight = this._buttonsHeight + this._getFilterHeight()
						if (this.origin) {
							showDropdown(this.origin, this._domDropdown, maxHeight, this._width).then(() => {
									if (this._domInput && !client.isMobileDevice()) {
										this._domInput.focus()
									} else {
										const button = vnode.dom.querySelector("button")
										button && button.focus()
									}
								}
							)
						}
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
			return m(".dropdown-panel.elevated-bg.border-radius.backface_fix.dropdown-shadow", {
					oncreate: vnode => {
						this._domDropdown = vnode.dom
						// It is important to set initial opacity so that user doesn't see it with full opacity before animating.
						vnode.dom.style.opacity = 0
					},
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

	_createShortcuts(): Array<Shortcut> {
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

	chooseMatch: (() => boolean) = () => {
		const filterString = this._filterString().toLowerCase()
		let visibleElements: Array<ButtonAttrs | NavButtonAttrs> = (this._visibleChildren().filter(b => (typeof b !== "string")): any)
		let matchingButton = visibleElements.length === 1
			? visibleElements[0]
			: visibleElements.find(b => lang.getMaybeLazy(b.label).toLowerCase() === filterString)
		if (document.activeElement === this._domInput
			&& matchingButton
			&& matchingButton.click) {
			const click = matchingButton.click
			click(newMouseEvent(), this._domInput)
			return false
		}
		return true
	}

	setContentHeight(domElement: HTMLElement) {
		if (this._buttonsHeight > 0) {
			// in ie the height of dropdown-content is too big because of the line-height. to prevent this set the height here.
			domElement.style.height = this._buttonsHeight + "px"
		}
	}

	/**
	 * Is invoked from modal as the two animations (background layer opacity and dropdown) should run in parallel
	 */
	hideAnimation(): Promise<void> {
		return Promise.resolve()
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

const importBase = typeof module !== "undefined" ? module.id : __moduleName

export function createAsyncDropdown(lazyButtons: lazyAsync<$ReadOnlyArray<DropDownChildAttrs>>, width: number = 200): clickHandler {
	// not all browsers have the actual button as e.currentTarget, but all of them send it as a second argument (see https://github.com/tutao/tutanota/issues/1110)
	return ((e, dom) => {
		let originalButtons = lazyButtons()
		let buttons = originalButtons
		// If the promise is pending and does not resolve in 100ms, show progress dialog
		if (originalButtons.isPending()) {
			buttons = Promise.race([
					originalButtons,
					Promise.all([
						Promise.delay(100),
						asyncImport(importBase, `${env.rootPathPrefix}src/gui/base/ProgressDialog.js`)
					]).then(([_, module]) => {
						if (originalButtons.isPending()) {
							return module.showProgressDialog("loading_msg", originalButtons)
						} else {
							return originalButtons
						}
					})
				]
			)
		}
		buttons.then(buttons => {
			let dropdown = new DropdownN(() => buttons, width)
			dropdown.setOrigin(dom.getBoundingClientRect())
			modal.displayUnique(dropdown, false)
		})
	}: clickHandler)
}

// We override type of click to be optional because we wrap it in our own
export type DropdownButtonAttrs = $Rest<ButtonAttrs, {click?: clickHandler}>

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
				oldClick(e, dom)
			}
		}
	})
}

export const DROPDOWN_MARGIN = 4

export function showDropdown(origin: PosRect, domDropdown: HTMLElement, contentHeight: number, contentWidth: number): Promise<void> {
	// |------------------|    |------------------|    |------------------|    |------------------|
	// |                  |    |                  |    |                  |    |                  |
	// |      |-------|   |    |  |-------|       |    |  |-----------|   |    |  |-----------|   |
	// |      | elem  |   |    |  | elem  |       |    |  | dropdown  |   |    |  | dropdown  |   |
	// |      |-------|   |    |  |-------|       |    |  |-----------|   |    |  |-----------|   |
	// |  |-----------|   |    |  |-----------|   |    |      |-------|   |    |  |-------|       |
	// |  | dropdown  |   |    |  | dropdown  |   |    |      | elem  |   |    |  | elem  |       |
	// /  |-----------|   |    |  |-----------|   |    |      |-------|   |    |  |-------|       |
	//
	// Decide were to open dropdown. We open the dropdown depending on the position of the touched element.
	// For that we devide the screen into four parts which are upper/lower and right/left part of the screen.
	// If the element is in the upper right part for example we try to open the dropdown below the touched element
	// starting from the right edge of the touched element.
	// If the element is in the lower left part of the screen we open the dropdown above the element
	// starting from the left edge of the touched element.

	// If the dropdown width does not fit from its calculated starting position we open it from the edge of the screen.

	const leftEdgeOfElement = origin.left
	const rightEdgeOfElement = origin.right
	const bottomEdgeOfElement = origin.bottom
	const topEdgeOfElement = origin.top

	const upperSpace = origin.top
	const lowerSpace = window.innerHeight - origin.bottom
	const leftSpace = origin.left
	const rightSpace = window.innerWidth - origin.right

	let transformOrigin = ""
	let maxHeight
	if (lowerSpace > upperSpace) {
		// element is in the upper part of the screen, dropdown should be below the element
		transformOrigin += "top"
		domDropdown.style.top = bottomEdgeOfElement + "px"
		domDropdown.style.bottom = ''
		maxHeight = Math.min(contentHeight, lowerSpace)
	} else {
		// element is in the lower part of the screen, dropdown should be above the element
		transformOrigin += "bottom"
		domDropdown.style.top = ''
		// position bottom is defined from the bottom edge of the screen
		// and not like the viewport origin which starts at top/left
		domDropdown.style.bottom = px(window.innerHeight - topEdgeOfElement)

		maxHeight = Math.min(contentHeight, upperSpace)
	}
	let width = contentWidth
	if (leftSpace < rightSpace) {
		// element is in the left part of the screen, dropdown should extend to the right from the element
		transformOrigin += " left"
		const availableSpaceForDropdown = window.innerWidth - leftEdgeOfElement
		let leftEdgeOfDropdown = leftEdgeOfElement
		if (availableSpaceForDropdown < contentWidth) {
			// If the dropdown does not fit, we shift it by the required amount. If it still does not fit, we reduce the width.
			const shiftForDropdown = contentWidth - availableSpaceForDropdown + DROPDOWN_MARGIN
			leftEdgeOfDropdown = leftEdgeOfElement - shiftForDropdown
			width = Math.min(width, window.innerWidth - DROPDOWN_MARGIN * 2)
		}
		domDropdown.style.left = px(Math.max(DROPDOWN_MARGIN, leftEdgeOfDropdown))
		domDropdown.style.right = ''
	} else {
		// element is in the right part of the screen, dropdown should extend to the left from the element
		transformOrigin += " right"
		const availableSpaceForDropdown = origin.right
		let rightEdgeOfDropdown = rightEdgeOfElement
		if (availableSpaceForDropdown < contentWidth) {
			// If the dropdown does not fit, we shift it by the required amount. If it still does not fit, we reduce the width.
			const shiftForDropdown = contentWidth - availableSpaceForDropdown + DROPDOWN_MARGIN
			rightEdgeOfDropdown = rightEdgeOfElement + shiftForDropdown
			width = Math.min(width, window.innerWidth - (DROPDOWN_MARGIN * 2))
		}
		domDropdown.style.left = ''
		// position right is defined from the right edge of the screen
		// and not like the viewport origin which starts at top/left
		domDropdown.style.right = px(Math.max(DROPDOWN_MARGIN, window.innerWidth - rightEdgeOfDropdown))
	}

	domDropdown.style.width = px(width)
	domDropdown.style.height = px(maxHeight)
	domDropdown.style.transformOrigin = transformOrigin

	return animations.add(domDropdown, [
		opacity(0, 1, true),
		transform("scale", 0.5, 1)
	], {easing: ease.out})
}