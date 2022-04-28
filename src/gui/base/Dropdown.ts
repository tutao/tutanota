import m, {Children} from "mithril"
import {modal, ModalComponent} from "./Modal"
import {px, size} from "../size"
import {Button} from "./Button"
import stream from "mithril/stream"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {windowFacade} from "../../misc/WindowFacade"
import {Keys} from "../../api/common/TutanotaConstants"
import {newMouseEvent} from "../HtmlUtils"
import {showDropdown} from "./DropdownN"
import type {Shortcut} from "../../misc/KeyManager"
import type {AllIcons, lazyIcon} from "./Icon"
import {assertNotNull, delay, neverNull, Thunk} from "@tutao/tutanota-utils"
import {downcast} from "@tutao/tutanota-utils"
import type {lazy, lazyAsync} from "@tutao/tutanota-utils"
import type {clickHandler} from "./GuiUtils"
import type {windowSizeListener} from "../../misc/WindowFacade"
import {assertMainOrNode} from "../../api/common/Env"
import {mod} from "@tutao/tutanota-utils"
import Stream from "mithril/stream";

assertMainOrNode()

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

export class Dropdown implements ModalComponent {
	children: ReadonlyArray<string | Button>
	private _domDropdown: HTMLElement | null = null
	private _domInput: HTMLInputElement | null = null
	private _domContents: HTMLElement | null = null
	origin: PosRect | null = null
	closeHandler: Thunk | null = null
	maxHeight: number
	oninit: ModalComponent["oninit"]
	view: ModalComponent["view"]
	_width: number
	shortcuts: () => Shortcut[]
	private _filterString: Stream<string>
	private _alignRight: boolean
	private _isFilterable: boolean
	resizeListener: windowSizeListener
	oncreate: ModalComponent["oncreate"]
	onremove: ModalComponent["onremove"]
	private _focusedBeforeShown: HTMLElement | null = null

	constructor(lazyChildren: lazy<ReadonlyArray<string | Button>>, width: number) {
		this.children = []
		this.maxHeight = 0
		this._width = width
		this._filterString = stream("")
		this._alignRight = false
		this._isFilterable = false

		this.oninit = () => {
			this.children = lazyChildren()
			this._isFilterable = this.children.length > 10
		}

		this.resizeListener = (width, height) => {
			if (this._domContents) {
				this.show(this._domContents)
			}
		}

		this.oncreate = vnode => {
			windowFacade.addResizeListener(this.resizeListener)
		}

		this.onremove = () => {
			windowFacade.removeResizeListener(this.resizeListener)
		}

		let _shortcuts = this._createShortcuts()

		this.shortcuts = () => {
			return _shortcuts
		}

		const _inputField = (): Children | null => {
			return this._isFilterable
				? m(
					"input.dropdown-bar.elevated-bg.doNotClose.pl-l.button-height.abs" + (this._alignRight ? ".right" : ""),
					{
						placeholder: lang.get("typeToFilter_label"),
						oncreate: vnode => {
							this._domInput = downcast<HTMLInputElement>(vnode.dom)
							this._domInput.value = this._filterString()
						},
						oninput: () => {
							this._filterString(neverNull(this._domInput).value)
						},
						style: {
							width: px(this._width - size.hpad_large),
							top: 0,
							height: px(size.button_height),
							left: 0,
						},
					},
					this._filterString(),
				)
				: null
		}

		const _contents = (): Children => {
			return m(
				".dropdown-content.plr-l.scroll.abs",
				{
					oncreate: vnode => {
						this.show(vnode.dom as HTMLElement)
						window.requestAnimationFrame(() => {
							const active = document.activeElement as HTMLElement | null
							if (active && typeof active.blur === "function") {
								active.blur()
							}
						})
					},
					onscroll: (ev: Event & {redraw?: boolean}) => {
						const target = ev.target as HTMLElement
						// needed here to prevent flickering on ios
						if (target.scrollTop < 0) {
							ev.redraw = true
						} else if (target.scrollTop + assertNotNull(this._domContents).offsetHeight > target.scrollHeight) {
							ev.redraw = true
						} else {
							ev.redraw = false
						}
					},
					// a fixed with for the content of this dropdown is needed to avoid that
					// the elements in the dropdown move during animation
					style: {
						width: px(this._width),
						top: px(this._getFilterHeight()),
						bottom: 0,
					},
				},
				this._visibleItems().map(button =>
					typeof button === "string"
						? m(".flex-v-center.center.button-height.b.text-break.doNotClose.selectable", button)
						: m(button),
				),
			)
		}

		this.view = (): Children => {
			return m(
				".dropdown-panel.elevated-bg.border-radius.backface_fix.dropdown-shadow",
				{
					oncreate: vnode => {
						this._domDropdown = vnode.dom as HTMLElement
						this._domDropdown.style.opacity = "0"
					},
					onkeypress: () => {
						if (this._domInput) {
							this._domInput.focus()
						}
					},
					onclick: (e: MouseEvent) => {
						if (!(e.target as any).classList.contains("doNotClose")) {
							this.close()
						}
					},
				},
				[_inputField(), _contents()],
			)
		}
	}

	backgroundClick(e: MouseEvent) {
		this.close()
	}

	_getFilterHeight(): number {
		return this._isFilterable ? size.button_height + size.vpad_xs : 0
	}

	_createShortcuts(): Array<Shortcut> {
		const next = () => {
			const visibleElements = this._visibleItems()
										.filter(b => typeof b !== "string")
										.map((b) => (b as Button)._domButton)

			if (this._domInput != null) {
				visibleElements.unshift(this._domInput)
			}

			const selected = visibleElements.find(b => document.activeElement === b)

			if (selected) {
				visibleElements[mod(visibleElements.indexOf(selected) + 1, visibleElements.length)]?.focus()
			} else if (visibleElements.length > 0) {
				visibleElements[0]?.focus()
			}
		}

		const previous = () => {
			const visibleElements = this._visibleItems()
										.filter(b => typeof b !== "string")
										.map((b) => (b as Button)._domButton)

			if (this._domInput != null) {
				visibleElements.unshift(this._domInput)
			}

			const selected = visibleElements.find(b => document.activeElement === b)

			if (selected) {
				visibleElements[mod(visibleElements.indexOf(selected) - 1, visibleElements.length)]?.focus()
			} else if (visibleElements.length > 0) {
				visibleElements[visibleElements.length - 1]?.focus()
			}
		}

		const chooseMatch = () => {
			let visibleElements: Array<Button> = this._visibleItems().filter(b => typeof b !== "string") as any
			let matchingButton = visibleElements.find(b => b.getLabel().toLowerCase() === this._filterString().toLowerCase())
			// Here we can't give click handlers any real arguments but they expect it so we create one
			const clickEvent: MouseEvent = newMouseEvent()

			if (document.activeElement === this._domInput && matchingButton && matchingButton.clickHandler) {
				matchingButton.clickHandler(clickEvent, assertNotNull(this._domInput))
				this.close()
			} else {
				let selected = visibleElements.find(b => document.activeElement === b._domButton)

				if (selected && selected.clickHandler) {
					selected.clickHandler(clickEvent, assertNotNull(this._domInput))
					this.close()
				}
			}
		}

		return [
			{
				key: Keys.ESC,
				exec: () => this.close(),
				help: "close_alt",
			},
			{
				key: Keys.TAB,
				shift: true,
				exec: () => previous(),
				help: "selectPrevious_action",
			},
			{
				key: Keys.TAB,
				shift: false,
				exec: () => next(),
				help: "selectNext_action",
			},
			{
				key: Keys.UP,
				exec: () => previous(),
				help: "selectPrevious_action",
			},
			{
				key: Keys.DOWN,
				exec: () => next(),
				help: "selectNext_action",
			},
			{
				key: Keys.RETURN,
				exec: () => chooseMatch(),
				help: "ok_action",
			},
		]
	}

	setOrigin(origin: PosRect) {
		this.origin = origin
	}

	close(): void {
		if (this.closeHandler) {
			this.closeHandler()
		}

		modal.remove(this)
		this._focusedBeforeShown && this._focusedBeforeShown.focus()
	}

	popState(e: Event): boolean {
		this.close()
		return true
	}

	onClose(): void {
		this.close()
	}

	show(domElement: HTMLElement): Promise<unknown> {
		this._domContents = domElement
		const origin = this.origin

		if (origin) {
			const contentsHeight =
				this._visibleItems().reduce(
					(previous: number, current) => previous + (typeof current === "string" ? size.button_height : current.getHeight()),
					0,
				) +
				size.vpad_small * 2
			return showDropdown(origin, assertNotNull(this._domDropdown), contentsHeight, this._width)
		}

		return Promise.resolve()
	}

	/**
	 * Is invoked from modal as the two animations (background layer opacity and dropdown) should run in parallel
	 * @returns {Promise.<void>}
	 */
	hideAnimation(): Promise<void> {
		return Promise.resolve()
	}

	_visibleItems(): Array<string | Button> {
		return this.children.filter(b => {
			return typeof b === "string"
				? b.includes(this._filterString().toLowerCase())
				: b.isVisible() && b.getLabel().toLowerCase().includes(this._filterString().toLowerCase())
		})
	}
}

export function createDropDownButton(
	labelTextIdOrTextFunction: TranslationKey | lazy<string>,
	icon: lazy<AllIcons> | null,
	lazyButtons: lazy<ReadonlyArray<string | Button>>,
	width: number = 200,
	originOverride?: (() => PosRect),
): Button {
	return createAsyncDropDownButton(labelTextIdOrTextFunction, icon, () => Promise.resolve(lazyButtons()), width, originOverride)
}

export function createAsyncDropDownButton(
	labelTextIdOrTextFunction: TranslationKey | lazy<string>,
	icon: lazyIcon | null,
	lazyButtons: lazyAsync<ReadonlyArray<string | Button>>,
	width: number = 200,
	originOverride?: (() => PosRect),
): Button {
	let mainButton = new Button(
		labelTextIdOrTextFunction,
		(event => {
			event.stopPropagation()

			if (!mainButton.isActive) {
				return
			}

			const buttonPromise = lazyButtons()
			let buttonsResolved = false
			buttonPromise.then(() => {
				buttonsResolved = true
			})
			// If the promise does not resolve in 100ms, show progress dialog
			const resultPromise = Promise.race([
				buttonPromise,
				Promise.all([delay(100), import("../dialogs/ProgressDialog.js")]).then(([_, module]) => {
					if (!buttonsResolved) {
						return module.showProgressDialog("loading_msg", buttonPromise)
					} else {
						return buttonPromise
					}
				}),
			])

			const initialButtonRect: PosRect = assertNotNull(mainButton._domButton).getBoundingClientRect()

			resultPromise.then(buttons => {
				if (buttons.length === 0) {
					import("./Dialog.js").then(module => {
						return module.Dialog.message("selectionNotAvailable_msg")
					})
				} else {
					mainButton.isActive = false
					let dropdown = new Dropdown(() => buttons, width)

					dropdown.closeHandler = () => {
						mainButton.isActive = true
					}

					if (mainButton._domButton) {
						let buttonRect: PosRect = mainButton._domButton.getBoundingClientRect()

						if (originOverride) {
							buttonRect = originOverride()
						} else if (buttonRect.width === 0 && buttonRect.height === 0) {
							// When new instance is created and the old DOM is detached we may have incorrect positioning
							buttonRect = initialButtonRect
						}

						dropdown.setOrigin(buttonRect)
						modal.displayUnique(dropdown, false)
					}
				}
			})
		}) as clickHandler,
		icon ?? undefined,
	)
	return mainButton
}