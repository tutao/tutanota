import m, { Children } from "mithril"
import { modal, ModalComponent } from "./Modal"
import { animations, opacity, transform, TransformEnum } from "../animation/Animations"
import { ease } from "../animation/Easing"
import { px, size } from "../size"
import { focusNext, focusPrevious, Shortcut } from "../../misc/KeyManager"
import type { ButtonAttrs } from "./Button.js"
import { lang, TranslationText } from "../../misc/LanguageViewModel"
import { Keys, TabIndex } from "../../api/common/TutanotaConstants"
import { getSafeAreaInsetBottom, getSafeAreaInsetTop } from "../HtmlUtils"
import type { $Promisable, lazy, lazyAsync } from "@tutao/tutanota-utils"
import { assertNotNull, delay, downcast, filterNull, makeSingleUse, neverNull, noOp, Thunk } from "@tutao/tutanota-utils"
import { client } from "../../misc/ClientDetector"
import { pureComponent } from "./PureComponent"
import type { ClickHandler } from "./GuiUtils"
import { assertMainOrNode } from "../../api/common/Env"
import { IconButtonAttrs } from "./IconButton.js"
import { AllIcons } from "./Icon.js"
import { RowButton, RowButtonAttrs } from "./buttons/RowButton.js"
import { AriaRole } from "../AriaUtils.js"

assertMainOrNode()
export type DropdownInfoAttrs = {
	info: string
	center: boolean
	bold: boolean
}

export interface DropdownButtonAttrs {
	/** accessibility & tooltip description */
	label: TranslationText
	/** visible text inside button */
	text?: TranslationText
	icon?: AllIcons
	click?: ClickHandler
	selected?: boolean
}

/**
 * Renders small info message inside the dropdown.
 */
const DropdownInfo = pureComponent<DropdownInfoAttrs>(({ center, bold, info }) => {
	return m(".dropdown-info.text-break.selectable" + (center ? ".center" : "") + (bold ? ".b" : ""), info)
})
export type DropdownChildAttrs = DropdownInfoAttrs | DropdownButtonAttrs

function isDropDownInfo(dropdownChild: DropdownChildAttrs): dropdownChild is DropdownInfoAttrs {
	return dropdownChild.hasOwnProperty("info") && dropdownChild.hasOwnProperty("center") && dropdownChild.hasOwnProperty("bold")
}

export interface PosRect {
	readonly height: number
	readonly width: number
	readonly top: number
	readonly left: number
	readonly right: number
	readonly bottom: number
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

// TODO: add resize listener like in the old Dropdown
export class Dropdown implements ModalComponent {
	private children: ReadonlyArray<DropdownChildAttrs>
	private _domDropdown: HTMLElement | null = null
	origin: PosRect | null = null
	oninit: ModalComponent["oninit"]
	view: ModalComponent["view"]
	private _width: number
	shortcuts: (...args: Array<any>) => any
	private _filterString: string
	private _domInput: HTMLInputElement | null = null
	private _domContents: HTMLElement | null = null
	private _isFilterable: boolean = false
	private _maxHeight: number | null = null
	private closeHandler: Thunk | null = null
	private focusedBeforeShown: HTMLElement | null = document.activeElement as HTMLElement

	constructor(lazyChildren: lazy<ReadonlyArray<DropdownChildAttrs | null>>, width: number) {
		this.children = []
		this._width = width
		this._filterString = ""

		this.oninit = () => {
			this.children = filterNull(lazyChildren())
			this._isFilterable = this.children.length > 10
			this.children.map((child) => {
				if (isDropDownInfo(child)) {
					return child
				}

				const buttonChild: DropdownButtonAttrs = child
				buttonChild.click = this.wrapClick(child.click ? child.click : () => null)

				return child
			})
		}

		let _shortcuts = this._createShortcuts()

		this.shortcuts = () => {
			return _shortcuts
		}

		const _inputField = () => {
			return this._isFilterable
				? m(
						"input.input.dropdown-bar.elevated-bg.doNotClose.pl-l.button-height.abs",
						{
							placeholder: lang.get("typeToFilter_label"),
							oncreate: (vnode) => {
								this._domInput = downcast<HTMLInputElement>(vnode.dom)
								this._domInput.value = this._filterString
							},
							oninput: () => {
								this._filterString = neverNull(this._domInput).value
							},
							style: {
								paddingLeft: px(size.hpad_large * 2),
								paddingRight: px(size.hpad_small),
								width: px(this._width - size.hpad_large),
								top: 0,
								height: px(size.button_height),
								left: 0,
							},
						},
						this._filterString,
				  )
				: null
		}

		const _contents = () => {
			const showingIcons = this.children.some((c) => "icon" in c && typeof c.icon !== "undefined")
			return m(
				".dropdown-content.scroll.abs",
				{
					role: AriaRole.Menu,
					tabindex: TabIndex.Programmatic,
					oncreate: (vnode) => {
						this._domContents = vnode.dom as HTMLElement
					},
					onupdate: (vnode) => {
						if (this._maxHeight == null) {
							const children = Array.from(vnode.dom.children) as Array<HTMLElement>
							this._maxHeight = children.reduce((accumulator, children) => accumulator + children.offsetHeight, 0) + size.vpad

							if (this.origin) {
								// The dropdown-content element is added to the dom has a hidden element first.
								// The maxHeight is available after the first onupdate call. Then this promise will resolve and we can safely
								// show the dropdown.
								// Modal always schedules redraw in oncreate() of a component so we are guaranteed to have onupdate() call.
								showDropdown(this.origin, assertNotNull(this._domDropdown), this._maxHeight, this._width).then(() => {
									if (this._domInput && !client.isMobileDevice()) {
										this._domInput.focus()
									} else {
										this._domContents?.focus()
									}
								})
							}
						}
					},
					onscroll: (ev: EventRedraw<Event>) => {
						const target = ev.target as HTMLElement
						// needed here to prevent flickering on ios
						ev.redraw = this._domContents != null && target.scrollTop < 0 && target.scrollTop + this._domContents.offsetHeight > target.scrollHeight
					},
					style: {
						// Fixed width for the content of this dropdown is needed to avoid that the elements in the dropdown move during
						// animation.
						width: px(this._width),
						top: px(this._getFilterHeight()),
						bottom: 0,
					},
				},
				this._visibleChildren().map((child) => {
					if (isDropDownInfo(child)) {
						return m(DropdownInfo, child)
					} else {
						return Dropdown.renderDropDownButton(child, showingIcons)
					}
				}),
			)
		}

		this.view = (): Children => {
			return m(
				".dropdown-panel.elevated-bg.border-radius.dropdown-shadow",
				{
					oncreate: (vnode) => {
						this._domDropdown = vnode.dom as HTMLElement
						// It is important to set initial opacity so that user doesn't see it with full opacity before animating.
						this._domDropdown.style.opacity = "0"
					},
					onkeypress: () => {
						if (this._domInput) {
							this._domInput.focus()
						}
					},
				},
				[_inputField(), _contents()],
			)
		}
	}

	private static renderDropDownButton(child: DropdownButtonAttrs, showingIcons: boolean) {
		return m(RowButton, {
			role: AriaRole.Option,
			selected: child.selected,
			label: child.label,
			text: child.text,
			icon: child.icon && showingIcons ? child.icon : showingIcons ? "none" : undefined,
			class: "dropdown-button",
			onclick: child.click ? child.click : noOp,
		} satisfies RowButtonAttrs)
	}

	wrapClick(fn: (event: MouseEvent, dom: HTMLElement) => unknown): (event: MouseEvent, dom: HTMLElement) => unknown {
		return (e: MouseEvent, dom) => {
			const r = fn(e, dom)
			this.close()
			return r
		}
	}

	backgroundClick(e: MouseEvent) {
		if (
			this._domDropdown &&
			!(e.target as HTMLElement).classList.contains("doNotClose") &&
			(this._domDropdown.contains(e.target as HTMLElement) || this._domDropdown.parentNode === e.target)
		) {
			this.onClose()
		}
	}

	_createShortcuts(): Array<Shortcut> {
		return [
			{
				key: Keys.ESC,
				exec: () => this.onClose(),
				help: "close_alt",
			},
			{
				key: Keys.TAB,
				shift: true,
				exec: () => (this._domDropdown ? focusPrevious(this._domDropdown) : false),
				help: "selectPrevious_action",
			},
			{
				key: Keys.TAB,
				shift: false,
				exec: () => (this._domDropdown ? focusNext(this._domDropdown) : false),
				help: "selectNext_action",
			},
			{
				key: Keys.UP,
				exec: () => (this._domDropdown ? focusPrevious(this._domDropdown) : false),
				help: "selectPrevious_action",
			},
			{
				key: Keys.DOWN,
				exec: () => (this._domDropdown ? focusNext(this._domDropdown) : false),
				help: "selectNext_action",
			},
			{
				key: Keys.RETURN,
				exec: () => this.chooseMatch(),
				help: "ok_action",
			},
		]
	}

	setOrigin(origin: PosRect): this {
		this.origin = origin
		return this
	}

	close(): void {
		modal.remove(this)
	}

	onClose(): void {
		if (this.closeHandler) {
			this.closeHandler()
		} else {
			this.close()
		}
	}

	popState(e: Event): boolean {
		this.onClose()
		return false
	}

	callingElement(): HTMLElement | null {
		return this.focusedBeforeShown
	}

	chooseMatch: () => boolean = () => {
		const filterString = this._filterString.toLowerCase()

		let visibleElements: Array<ButtonAttrs> = downcast(this._visibleChildren().filter((b) => !isDropDownInfo(b)))
		let matchingButton =
			visibleElements.length === 1 ? visibleElements[0] : visibleElements.find((b) => lang.getMaybeLazy(b.label).toLowerCase() === filterString)

		if (this._domInput && document.activeElement === this._domInput && matchingButton && matchingButton.click) {
			matchingButton.click(new MouseEvent("click"), this._domInput)
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

	setCloseHandler(handler: Thunk): this {
		this.closeHandler = handler
		return this
	}

	_visibleChildren(): Array<DropdownChildAttrs> {
		return this.children.filter((b) => {
			if (isDropDownInfo(b)) {
				return b.info.includes(this._filterString.toLowerCase())
			} else if (this._isFilterable) {
				const filterable = lang.getMaybeLazy(b.text ?? b.label)
				return filterable.toLowerCase().includes(this._filterString.toLowerCase())
			} else {
				return true
			}
		})
	}

	_getFilterHeight(): number {
		return this._isFilterable ? size.button_height + size.vpad_xs : 0
	}
}

export function createDropdown({
	lazyButtons,
	overrideOrigin,
	width,
	withBackground,
}: {
	lazyButtons: lazy<ReadonlyArray<DropdownChildAttrs | null>>
	overrideOrigin?: (original: PosRect) => PosRect
	width?: number
	withBackground?: boolean
}): ClickHandler {
	return createAsyncDropdown({ lazyButtons: async () => lazyButtons(), overrideOrigin, width, withBackground })
}

export function createAsyncDropdown({
	lazyButtons,
	overrideOrigin,
	width = 200,
	withBackground = false,
	onClose = undefined,
}: {
	lazyButtons: lazyAsync<ReadonlyArray<DropdownChildAttrs | null>>
	overrideOrigin?: (original: PosRect) => PosRect
	width?: number
	withBackground?: boolean
	onClose?: Thunk
}): ClickHandler {
	// not all browsers have the actual button as e.currentTarget, but all of them send it as a second argument (see https://github.com/tutao/tutanota/issues/1110)
	return (_, dom) => {
		const originalButtons = lazyButtons()
		let buttonsResolved = false
		originalButtons.then(() => {
			buttonsResolved = true
		})
		let buttons = originalButtons
		// If the promise is pending and does not resolve in 100ms, show progress dialog
		buttons = Promise.race([
			originalButtons,
			Promise.all([delay(100), import("../dialogs/ProgressDialog.js")]).then(([_, module]) => {
				if (!buttonsResolved) {
					return module.showProgressDialog("loading_msg", originalButtons)
				} else {
					return originalButtons
				}
			}),
		])
		buttons.then((buttons) => {
			let dropdown = new Dropdown(() => buttons, width)
			if (onClose) {
				dropdown.setCloseHandler(() => {
					onClose()
					dropdown.close()
				})
			}
			let buttonRect
			if (overrideOrigin) {
				buttonRect = overrideOrigin(dom.getBoundingClientRect())
			} else {
				// When new instance is created and the old DOM is detached we may have incorrect positioning
				buttonRect = dom.getBoundingClientRect()
			}
			dropdown.setOrigin(buttonRect)
			modal.displayUnique(dropdown, withBackground)
		})
	}
}

export function showDropdownAtPosition(
	buttons: ReadonlyArray<DropdownChildAttrs>,
	xPos: number,
	yPos: number,
	closeHandler: Thunk = noOp,
	width: number = 200,
) {
	const dropdown = new Dropdown(() => buttons, width)
	const close = makeSingleUse<void>(() => {
		closeHandler()
		dropdown.close()
	})
	dropdown.setOrigin(new DomRectReadOnlyPolyfilled(xPos, yPos, 0, 0))
	dropdown.setCloseHandler(close)
	modal.displayUnique(dropdown, false)
}

type AttachDropdownParams = {
	mainButtonAttrs: Omit<IconButtonAttrs, "click">
	childAttrs: lazy<$Promisable<ReadonlyArray<DropdownChildAttrs | null>>>
	/** called to determine if the dropdown actually needs to be shown */
	showDropdown?: lazy<boolean>
	width?: number
	overrideOrigin?: (original: PosRect) => PosRect
	onClose?: Thunk
}

/**
 *
 * @param mainButtonAttrs the attributes of the main button. if showDropdown returns false, nothing will happen.
 * @param childAttrs the attributes of the children shown in the dropdown
 * @param showDropdown this will be checked before showing the dropdown
 * @param width width of the dropdown
 * @param onClose callback that is called when the dropdown closes
 * @returns {ButtonAttrs} modified mainButtonAttrs that shows a dropdown on click or
 * button doesn't do anything if showDropdown returns false
 */
export function attachDropdown({
	mainButtonAttrs,
	childAttrs,
	showDropdown = () => true,
	width,
	overrideOrigin,
	onClose,
}: AttachDropdownParams): IconButtonAttrs {
	return Object.assign({}, mainButtonAttrs, {
		click: (e: MouseEvent, dom: HTMLElement) => {
			if (showDropdown()) {
				const dropDownFn = createAsyncDropdown({ lazyButtons: () => Promise.resolve(childAttrs()), overrideOrigin, width, onClose })
				dropDownFn(e, dom)
				e.stopPropagation()
			}
		},
	})
}

export const DROPDOWN_MARGIN = 4

export function showDropdown(origin: PosRect, domDropdown: HTMLElement, contentHeight: number, contentWidth: number): Promise<unknown> {
	// |------------------|    |------------------|    |------------------|    |------------------|
	// |                  |    |                  |    |                  |    |                  |
	// |      |-------|   |    |  |-------|       |    |  |-----------^   |    |  ^-----------|   |
	// |      | elem  |   |    |  | elem  |       |    |  | dropdown  |   |    |  | dropdown  |   |
	// |      |-------|   |    |  |-------|       |    |  |<----------|   |    |  |---------->|   |
	// |  |<----------|   |    |  |---------->|   |    |      |-------|   |    |  |-------|       |
	// |  | dropdown  |   |    |  | dropdown  |   |    |      | elem  |   |    |  | elem  |       |
	// /  |-----------V   |    |  V-----------|   |    |      |-------|   |    |  |-------|       |
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
	const upperSpace = origin.top - getSafeAreaInsetTop()
	const lowerSpace = window.innerHeight - origin.bottom - getSafeAreaInsetBottom()
	const leftSpace = origin.left
	const rightSpace = window.innerWidth - origin.right
	let transformOrigin = ""
	let maxHeight

	if (lowerSpace > upperSpace) {
		// element is in the upper part of the screen, dropdown should be below the element
		transformOrigin += "top"
		domDropdown.style.top = bottomEdgeOfElement + "px"
		domDropdown.style.bottom = ""
		maxHeight = Math.min(contentHeight, lowerSpace)
	} else {
		// element is in the lower part of the screen, dropdown should be above the element
		transformOrigin += "bottom"
		domDropdown.style.top = ""
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
		domDropdown.style.right = ""
	} else {
		// element is in the right part of the screen, dropdown should extend to the left from the element
		transformOrigin += " right"
		const availableSpaceForDropdown = origin.right
		let rightEdgeOfDropdown = rightEdgeOfElement

		if (availableSpaceForDropdown < contentWidth) {
			// If the dropdown does not fit, we shift it by the required amount. If it still does not fit, we reduce the width.
			const shiftForDropdown = contentWidth - availableSpaceForDropdown + DROPDOWN_MARGIN
			rightEdgeOfDropdown = rightEdgeOfElement + shiftForDropdown
			width = Math.min(width, window.innerWidth - DROPDOWN_MARGIN * 2)
		}

		domDropdown.style.left = ""
		// position right is defined from the right edge of the screen
		// and not like the viewport origin which starts at top/left
		domDropdown.style.right = px(Math.max(DROPDOWN_MARGIN, window.innerWidth - rightEdgeOfDropdown))
	}

	domDropdown.style.width = px(width)
	domDropdown.style.height = px(maxHeight)
	domDropdown.style.transformOrigin = transformOrigin
	return animations.add(domDropdown, [opacity(0, 1, true), transform(TransformEnum.Scale, 0.5, 1)], {
		easing: ease.out,
	})
}
