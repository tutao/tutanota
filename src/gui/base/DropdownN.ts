// @flow
import m from "mithril"
import {modal} from "./Modal"
import {animations, opacity, transform} from "../animation/Animations"
import {ease} from "../animation/Easing"
import {px, size} from "../size"
import type {Shortcut} from "../../misc/KeyManager"
import {focusNext, focusPrevious} from "../../misc/KeyManager"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN, isVisible} from "./ButtonN"
import type {NavButtonAttrs} from "./NavButtonN"
import {NavButtonN} from "./NavButtonN"
import {lang} from "../../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import type {PosRect} from "./Dropdown"
import {DomRectReadOnlyPolyfilled} from "./Dropdown"
import {Keys} from "../../api/common/TutanotaConstants"
import {newMouseEvent} from "../HtmlUtils"
import {filterNull} from "@tutao/tutanota-utils"
import {downcast} from "@tutao/tutanota-utils"
import {client} from "../../misc/ClientDetector"
import {pureComponent} from "./PureComponent"
import {delay} from "@tutao/tutanota-utils"
import type {lazy, lazyAsync, $Promisable} from "@tutao/tutanota-utils"
import type {clickHandler} from "./GuiUtils"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()

export type DropdownInfoAttrs = {
	info: string,
	center: boolean,
	bold: boolean,
}

/**
 * Renders small info message inside the dropdown.
 */
const DropdownInfo = pureComponent<DropdownInfoAttrs>(({center, bold, info}) => {
	return m(".dropdown-info.text-break.selectable" + (center ? ".center" : "") + (bold ? ".b" : ""), info)
})

export type DropdownChildAttrs = DropdownInfoAttrs | NavButtonAttrs | ButtonAttrs;

function isDropDownInfo(dropdownChild: DropdownChildAttrs): boolean %checks {
	return dropdownChild.hasOwnProperty("info") && dropdownChild.hasOwnProperty("center") && dropdownChild.hasOwnProperty("bold")
}

// TODO: add resize listener like in the old Dropdown
export class DropdownN {
	children: $ReadOnlyArray<DropdownChildAttrs>;
	_domDropdown: HTMLElement;
	origin: ?PosRect;
	oninit: Function;
	view: Function;
	_width: number;
	shortcuts: Function;
	_filterString: Stream<string>;
	_domInput: HTMLInputElement;
	_domContents: HTMLElement;
	_isFilterable: boolean;
	_maxHeight: ?number;


	constructor(lazyChildren: lazy<$ReadOnlyArray<?DropdownChildAttrs>>, width: number) {
		this.children = []
		this._width = width
		this._filterString = stream("")
		this.oninit = () => {
			this.children = filterNull(lazyChildren())
			this._isFilterable = this.children.length > 10
			this.children.map(child => {
				if (isDropDownInfo(child)) {
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
							this._domInput = downcast<HTMLInputElement>(vnode.dom)
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
						this._domContents = vnode.dom
						window.requestAnimationFrame(() => {
							if (document.activeElement && typeof document.activeElement.blur === "function") {
								document.activeElement.blur()
							}
						})
					},
					onupdate: (vnode) => {
						if (this._maxHeight == null) {
							const children = Array.from(vnode.dom.children)
							this._maxHeight = children.reduce((accumulator, children) => accumulator + children.offsetHeight, 0)
								+ size.vpad
							if (this.origin) {
								// The dropdown-content element is added to the dom has a hidden element first.
								// The maxHeight is available after the first onupdate call. Then this promise will resolve and we can safely
								// show the dropdown.
								// Modal always schedules redraw in oncreate() of a component so we are guaranteed to have onupdate() call.
								showDropdown(this.origin, this._domDropdown, this._maxHeight, this._width).then(() => {
										if (this._domInput && !client.isMobileDevice()) {
											this._domInput.focus()
										} else {
											const button = vnode.dom.querySelector("button")
											button && button.focus()
										}
									}
								)
							}
						}
					},
					onscroll: (ev) => {
						// needed here to prevent flickering on ios
						ev.redraw = (ev.target.scrollTop < 0)
							&& ((ev.target.scrollTop + this._domContents.offsetHeight) > ev.target.scrollHeight)
					},
					style: {
						// Fixed width for the content of this dropdown is needed to avoid that the elements in the dropdown move during
						// animation.
						width: px(this._width),
						top: px(this._getFilterHeight()),
						bottom: 0
					}
				},
				this._visibleChildren().map(child => {
					if (isDropDownInfo(child)) {
						return m(DropdownInfo, downcast<DropdownInfoAttrs>(child))
					} else if (typeof child.href === 'undefined') {
						return m(ButtonN, downcast<ButtonAttrs>(child))
					} else {
						return m(NavButtonN, downcast<NavButtonAttrs>(child))
					}
				}))
		}

		this.view = (): Children => {
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
		let visibleElements: Array<ButtonAttrs | NavButtonAttrs> = downcast(this._visibleChildren().filter(b => !isDropDownInfo(b)))
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

	/**
	 * Is invoked from modal as the two animations (background layer opacity and dropdown) should run in parallel
	 */
	hideAnimation(): Promise<void> {
		return Promise.resolve()
	}


	_visibleChildren(): Array<DropdownChildAttrs> {
		return this.children.filter(b => {
			if (isDropDownInfo(b)) {
				return downcast(b).info.includes(this._filterString().toLowerCase())
			} else if (b.hasOwnProperty("isVisible")) {
				return isVisible(downcast(b))
			} else {
				return true
			}
		})
	}

	_getFilterHeight(): number {
		return this._isFilterable ? size.button_height + size.vpad_xs : 0
	}
}

export function createDropdown(lazyButtons: lazy<$ReadOnlyArray<DropdownChildAttrs>>, width: number = 200): clickHandler {
	return createAsyncDropdown(() => Promise.resolve(lazyButtons()), width)
}

export function createAsyncDropdown(lazyButtons: lazyAsync<$ReadOnlyArray<?DropdownChildAttrs>>, width: number = 200): clickHandler {
	// not all browsers have the actual button as e.currentTarget, but all of them send it as a second argument (see https://github.com/tutao/tutanota/issues/1110)
	return ((e, dom) => {
		const originalButtons = lazyButtons()
		let buttonsResolved = false
		originalButtons.then(() => {
			buttonsResolved = true
		})
		let buttons = originalButtons
		// If the promise is pending and does not resolve in 100ms, show progress dialog
		buttons = Promise.race([
				originalButtons,
				Promise.all([
					delay(100),
					import("../dialogs/ProgressDialog.js")
				]).then(([_, module]) => {
					if (!buttonsResolved) {
						return module.showProgressDialog("loading_msg", originalButtons)
					} else {
						return originalButtons
					}
				})
			]
		)
		buttons.then(buttons => {
			let dropdown = new DropdownN(() => buttons, width)
			dropdown.setOrigin(dom.getBoundingClientRect())
			modal.displayUnique(dropdown, false)
		})
	}: clickHandler)
}

export function showDropdownAtPosition(buttons: $ReadOnlyArray<DropdownChildAttrs>, xPos: number, yPos: number, width: number = 200) {
	const dropdown = new DropdownN(() => buttons, width)
	dropdown.setOrigin(new DomRectReadOnlyPolyfilled(xPos, yPos, 0, 0))
	modal.displayUnique(dropdown, false)
}

// We override type of click to be optional because we wrap it in our own
export type DropdownButtonAttrs = $Rest<ButtonAttrs, {click?: clickHandler}>

/**
 *
 * @param mainButtonAttrs the attributes of the main button. if showDropdown returns false, this buttons onclick will
 * be executed instead of opening the dropdown.
 * @param childAttrs the attributes of the children shown in the dropdown
 * @param showDropdown this will be checked before showing the dropdown
 * @param width width of the dropdown
 * @returns {ButtonAttrs} modified mainButtonAttrs that shows a dropdown on click or
 * executes the original onclick if showDropdown returns false
 */
export function attachDropdown(
	mainButtonAttrs: DropdownButtonAttrs,
	childAttrs: lazy<$Promisable<$ReadOnlyArray<?DropdownChildAttrs>>>,
	showDropdown: lazy<boolean> = () => true,
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