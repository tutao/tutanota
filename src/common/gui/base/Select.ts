import m, { Children, ClassComponent, Component, Vnode, VnodeDOM } from "mithril"
import { px, size } from "../size.js"
import { Keys, TabIndex } from "../../api/common/TutanotaConstants.js"
import { focusNext, focusPrevious, isKeyPressed, keyManager, Shortcut, ShortcutType } from "../../misc/KeyManager.js"
import { DomRectReadOnlyPolyfilled } from "./Dropdown.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { Icon, IconSize } from "./Icon.js"
import { ButtonColor, getColors } from "./Button.js"
import { AriaRole } from "../AriaUtils.js"
import Stream from "mithril/stream"
import { getSafeAreaInsetBottom, getSafeAreaInsetTop } from "../HtmlUtils.js"
import { theme } from "../theme.js"
import { BootIcons } from "./icons/BootIcons.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { animations, opacity, transform, TransformEnum } from "../animation/Animations.js"
import { ease } from "../animation/Easing.js"
import { BaseButton } from "./buttons/BaseButton.js"

/**
 * **GENERIC** Interface to declare everything that is important to use at the select option
 */
export interface SelectOption<T> {
	value: T
	ariaValue: string
}

export interface SelectAttributes<U extends SelectOption<T>, T> {
	onchange: (newValue: U) => void
	options: Stream<Array<U>>
	/**
	 * This attribute is responsible to render the options inside the dropdown.
	 * @example
	 * const renderOption = (option: U) => m("span", option.text);
	 * ...
	 * renderOption(currentOption)
	 * ...
	 * @param {U} option - Option to be rendered
	 * @returns {Children} Returns the rendered option
	 */
	renderOption: (option: U) => Children
	/**
	 * This attribute is responsible to render the selected option inside the trigger.
	 * @example
	 * const renderSelected = (option: U) => m("span", option.text);
	 * ...
	 * renderSelected(currentOption)
	 * ...
	 * @param {U} option - Option to be rendered
	 * @returns {Children} Returns the rendered option
	 */
	renderDisplay: (option: U) => Children
	ariaLabel: string
	id?: string
	classes?: Array<string>
	/**
	 * The selected value
	 */
	selected?: U
	placeholder?: Children
	/**
	 * Expands the Select component horizontally filling its parent width
	 */
	expanded?: boolean
	disabled?: boolean
	noIcon?: boolean
	/**
	 * @example
	 * const attrs = {
	 *     ...
	 *     iconColor: "#202020"
	 *     ...
	 * }
	 */
	iconColor?: string
	/**
	 * tabIndex is a powerful
	 * @example
	 * const attrs = {
	 *     ...
	 *     tabIndex: Number(TabIndex.Programmatic),
	 *     ...
	 * }
	 * @see {@link TabIndex}
	 *
	 * {@link https://webaim.org/techniques/keyboard/tabindex#overview webaim.org - Tabindex Overview}
	 */
	tabIndex?: number
	onclose?: () => void
	oncreate?: (...args: any[]) => unknown
	dropdownPosition?: "top" | "bottom"
	/**
	 * Resizes trigger width according to dropdown width
	 */
	responsive?: boolean
}

export interface SelectState {
	dropdownContainer?: OptionListContainer
}

/**
 * Select component
 * @see Component attributes: {@link SelectAttributes}
 * @example
 *
 * interface CalendarSelectItem extends SelectOption<string> {
 *   color: string
 *     name: string
 * }
 *
 * m(Select<CalendarSelectItem, string>, {
 *   classes: ["custom-margins"],
 *   onChange: (val) => {
 *       this.selected = val
 *   },
 *     options: this.options,
 *     expanded: true,
 *     selected: this.selected,
 *     renderOption: (option) => {
 *       return m(".flex.items-center.gap-vpad-xs", [
 *         m("div", { style: { width: "24px", height: "24px", borderRadius: "50%", backgroundColor: option.color } }),
 *       m("span", option.name),
 *       ])
 *     },
 *     renderDisplay: (option) => m("span", { style: { color: "red" } }, option.name),
 *     ariaLabel: "Calendar"
 * }),
 */
export class Select<U extends SelectOption<T>, T> implements ClassComponent<SelectAttributes<U, T>> {
	private dropdownContainer: OptionListContainer | null = null
	private key: number = 0

	view({
		attrs: {
			onchange,
			options,
			renderOption,
			renderDisplay,
			classes,
			selected,
			placeholder,
			expanded,
			disabled,
			ariaLabel,
			iconColor,
			id,
			noIcon,
			tabIndex,
			onclose,
			oncreate,
			dropdownPosition,
			responsive,
		},
	}: Vnode<SelectAttributes<U, T>, this>) {
		return m(
			".rel.flex.full-width",
			{
				class: responsive && this.dropdownContainer?.dom ? "justify-end" : "",
				style: {
					width: responsive && this.dropdownContainer?.dom ? px(this.dropdownContainer.dom.clientWidth) : undefined,
				},
			},
			[
				m(
					"button.tutaui-select-trigger.clickable",
					{
						id,
						oncreate: (vnode: VnodeDOM<HTMLElement>) => {
							oncreate?.(vnode)

							const dom = vnode.dom
							dom.addEventListener("focusout", (e: FocusEvent) => this.handleSelectFocusOut(dom as HTMLElement, e))
						},
						onremove: ({ dom }: VnodeDOM<HTMLElement>) => {
							dom.removeEventListener("focusout", (e: FocusEvent) => this.handleSelectFocusOut(dom as HTMLElement, e))
						},
						class: this.resolveClasses(classes, disabled, expanded),
						onclick: (event: MouseEvent) => {
							if (event.currentTarget) {
								this.renderDropdown(
									options,
									event.currentTarget as HTMLElement,
									onchange,
									renderOption,
									selected?.value,
									onclose,
									dropdownPosition,
								)
								m.redraw.sync()
							}
						},
						role: AriaRole.Combobox,
						ariaLabel,
						disabled: disabled,
						ariaExpanded: String(this.dropdownContainer?.isOpen ?? false),
						tabIndex: tabIndex ?? Number(disabled ? TabIndex.Programmatic : TabIndex.Default),
						value: selected?.ariaValue,
					},
					[
						selected != null ? renderDisplay(selected) : this.renderPlaceholder(placeholder),
						noIcon !== true
							? m(Icon, {
									icon: BootIcons.Expand,
									container: "div",
									class: `fit-content`,
									size: IconSize.Medium,
									style: {
										fill: iconColor ?? getColors(ButtonColor.Content).button,
									},
								})
							: null,
					],
				),
				this.dropdownContainer != null ? m(this.dropdownContainer) : null,
			],
		)
	}

	private handleSelectFocusOut = (dom: HTMLElement, e: FocusEvent) => {
		if (this.dropdownContainer?.dom != null && this.dropdownContainer.isOpen) {
			const isInsideSelect = dom.contains(e.relatedTarget as HTMLElement) || this.dropdownContainer.dom.contains(e.relatedTarget as HTMLElement)
			if (!isInsideSelect) this.dropdownContainer.onClose()
		}
	}

	private resolveClasses(classes: Array<string> = [], disabled: boolean = false, expanded: boolean = false) {
		const classList = [...classes]
		if (disabled) {
			classList.push("disabled", "click-disabled")
		} else {
			classList.push("flash")
		}

		if (expanded) {
			classList.push("full-width")
		} else {
			classList.push("fit-content")
		}

		return classList.join(" ")
	}

	private renderPlaceholder(placeholder?: Children): Children {
		if (placeholder == null || typeof placeholder === "string") {
			return m("span.placeholder", placeholder ?? lang.get("noSelection_msg"))
		}

		return placeholder
	}

	private renderDropdown(
		options: Stream<Array<U>>,
		dom: HTMLElement,
		onSelect: (option: U) => void,
		renderOptions: (option: U) => Children,
		selected?: T,
		onClose?: () => void,
		dropdownPosition?: "top" | "bottom",
	) {
		const optionListContainer: OptionListContainer = new OptionListContainer(
			options,
			(option: U) => {
				return m.fragment(
					{
						key: ++this.key,
						oncreate: ({ dom }: VnodeDOM<U>) => this.setupOption(dom as HTMLElement, onSelect, option, optionListContainer, selected),
					},
					[renderOptions(option)],
				)
			},
			dropdownPosition,
		)

		optionListContainer.onClose = () => {
			this.dropdownContainer = null
			onClose?.()
		}

		optionListContainer.setOrigin(dom.getBoundingClientRect())

		this.dropdownContainer = optionListContainer
	}

	private setupOption(dom: HTMLElement, onSelect: (option: U) => void, option: U, optionListContainer: OptionListContainer, selected: T | undefined) {
		dom.onclick = () => {
			if (!this.dropdownContainer?.isOpen) return
			this.wrapOnChange.bind(this, onSelect, option, optionListContainer)()
		}

		if (!("disabled" in dom)) {
			// We have to set the tabIndex to make sure that it'll be focusable by tabbing
			dom.tabIndex = Number(TabIndex.Default)

			// We have to set the cursor pointer as a fallback of renderOptions that doesn't set it
			if (!dom.style.cursor) {
				dom.style.cursor = "pointer"
			}

			if (!dom.role) {
				dom.role = AriaRole.Option
			}

			dom.ariaSelected = `${selected === option.value}`
		}

		dom.onkeydown = (e: KeyboardEvent) => {
			if (this.dropdownContainer?.isOpen && isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
				e.preventDefault()
				this.wrapOnChange(onSelect, option, optionListContainer)
			}
		}
	}

	private wrapOnChange(callback: (option: U) => void, option: U, container: OptionListContainer) {
		callback(option)
		container.onClose()
	}
}

/**
 * Internal component responsible for rendering the dropdown with the options
 *
 * @implements {ClassComponent}
 * @param {Stream<Array<unknown>>} items - The options to display.
 * @param {(option: unknown) => Children} buildFunction - The function to build and render each option.
 * @param {number} width - The width of the dropdown.
 * @param {"top" | "bottom"} dropdownPosition - The position of the dropdown.
 *  */
class OptionListContainer implements ClassComponent {
	view: Component["view"]
	origin: DomRectReadOnlyPolyfilled | null = null

	/*
        Visual representation
        ╔══════════════════════╗
        ║     domDropdown      ║
        ║  ╔════════════════╗  ║
        ║  ║                ║  ║
        ║  ║  domDropdown   ║  ║
        ║  ║  Contents      ║  ║
        ║  ║                ║  ║
        ║  ║                ║  ║
        ║  ╚════════════════╝  ║
        ╚══════════════════════╝
    */

	private domDropdown: HTMLElement | null = null
	private domDropdownContents: HTMLElement | null = null
	private maxHeight: number | null = null
	private children: Children[] = []
	private isDropdownOpen = false
	private isInitialFocusTriggered = false
	private oldShortcut = keyManager.getShortcutForKey(Keys.ESC)
	private shortcuts: Shortcut[] = [
		{
			key: Keys.ESC,
			exec: () => this.onClose(),
			help: "close_alt",
		},
	]

	constructor(
		private readonly items: Stream<Array<unknown>>,
		private readonly buildFunction: (option: unknown) => Children,
		dropdownPosition?: "top" | "bottom",
	) {
		this.items.map((newItems) => {
			this.children = []
			this.children.push(newItems.length === 0 ? this.renderNoItem() : newItems.map((item) => this.buildFunction(item)))
			this.children.push(
				m(BaseButton, {
					label: "close_alt",
					text: lang.get("close_alt"),
					class: "hidden-until-focus content-accent-fg button-content tutaui-select-close",
					onclick: () => this.onClose(),
				}),
			)
		})

		this.view = () => {
			return m(
				".dropdown-panel-scrollable.elevated-bg.border-radius.dropdown-shadow",
				{
					style: {
						opacity: 0,
						height: 0,
					},
					oncreate: (vnode: VnodeDOM<HTMLElement>) => {
						this.domDropdown = vnode.dom as HTMLElement
					},
				},
				m(
					".dropdown-content.scroll.flex.flex-column",
					{
						role: AriaRole.Listbox,
						tabindex: TabIndex.Programmatic,
						oncreate: (vnode: VnodeDOM<HTMLElement>) => {
							this.domDropdownContents = vnode.dom as HTMLElement
							this.domDropdownContents.addEventListener("focusout", this.handleDropdownLoseFocus)
							this.domDropdownContents.addEventListener("focusin", this.handleDropdownFocusIn)
							keyManager.registerModalShortcuts(this.shortcuts)
						},
						onremove: (vnode: VnodeDOM<HTMLElement>) => {
							this.domDropdownContents?.removeEventListener("focusout", this.handleDropdownLoseFocus)
							this.domDropdownContents?.removeEventListener("focusin", this.handleDropdownFocusIn)
							keyManager.unregisterModalShortcuts(this.shortcuts)

							this.handleShortcutRestore()
							this.isInitialFocusTriggered = false
							this.isDropdownOpen = false
						},
						onupdate: (vnode: VnodeDOM<HTMLElement>) => {
							if (this.maxHeight == null) {
								const children = Array.from(vnode.dom.children) as Array<HTMLElement>
								const indexToNotCount = children.length - 1
								this.maxHeight = Math.min(
									250 + size.vpad,
									children.reduce(
										(accumulator, children, currentIndex, array) =>
											currentIndex < indexToNotCount ? accumulator + children.offsetHeight : accumulator,
										0,
									) + size.vpad,
								)

								if (this.origin) {
									// Set the scroll before showing the dropdown to avoid flickering issues
									const selectedOption = vnode.dom.querySelector("[aria-selected='true'], [data-target='true']") as HTMLElement | null
									if (selectedOption && this.domDropdown) {
										this.domDropdown.scroll({ top: selectedOption.offsetTop, behavior: "instant" })
									}

									this.displayDropdown(assertNotNull(this.domDropdown), this.origin, this.maxHeight, dropdownPosition).then(
										() => (this.isDropdownOpen = true),
									)
									m.redraw()
								}
							} else {
								this.updateDropdownSize(vnode)
							}
						},
						onscroll: (ev: EventRedraw<Event>) => {
							const target = ev.target as HTMLElement
							// needed here to prevent flickering on ios
							ev.redraw =
								this.domDropdownContents != null &&
								target.scrollTop < 0 &&
								target.scrollTop + this.domDropdownContents.offsetHeight > target.scrollHeight
						},
					},
					this.children,
				),
			)
		}
	}

	get dom(): HTMLElement | null {
		return this.domDropdown
	}

	get isOpen(): boolean {
		return this.isDropdownOpen
	}

	private handleDropdownLoseFocus = (e: FocusEvent) => {
		if (this.domDropdown == null) {
			return
		}

		if (this.domDropdown?.contains(e.relatedTarget as HTMLElement)) {
			e.preventDefault()
			return true
		}

		this.onClose()
	}

	private handleDropdownFocusIn = () => {
		const selectedOption = this.domDropdownContents?.querySelector("[aria-selected='true'], [data-target='true']") as HTMLElement | null
		if (selectedOption && !this.isInitialFocusTriggered) {
			selectedOption.focus()
			this.isInitialFocusTriggered = true
		}
	}

	private handleShortcutRestore() {
		if (!this.oldShortcut) return

		if (this.oldShortcut.type === ShortcutType.MODAL) keyManager.registerModalShortcuts([this.oldShortcut.shortcut])
		else keyManager.registerShortcuts([this.oldShortcut.shortcut])
	}

	displayDropdown(domDropdown: HTMLElement, origin: DomRectReadOnlyPolyfilled, contentHeight: number, position?: "top" | "bottom") {
		let transformOrigin = ""
		const upperSpace = origin.bottom
		const lowerSpace = window.innerHeight - upperSpace - getSafeAreaInsetBottom()
		let maxHeight: number

		const showBelow = (!position && lowerSpace > upperSpace) || position === "bottom"

		if (showBelow) {
			// element is in the upper part of the screen, dropdown should be below the element
			transformOrigin += "top"
			domDropdown.style.top = px(origin.height)
			maxHeight = Math.min(contentHeight, lowerSpace)
		} else {
			// element is in the lower part of the screen, dropdown should be above the element
			transformOrigin += "bottom"
			domDropdown.style.bottom = px(origin.height)
			maxHeight = Math.min(contentHeight, upperSpace)
		}

		domDropdown.style.minWidth = px(origin.width)
		domDropdown.style.height = px(maxHeight)
		domDropdown.style.transformOrigin = transformOrigin

		return animations.add(domDropdown, [opacity(0, 1, true), transform(TransformEnum.Scale, 0.5, 1)], {
			easing: ease.out,
		})
	}

	oncreate() {
		document.addEventListener("keydown", this.handleKeyPress)
		document.addEventListener("mousedown", this.handleMouseClick)
	}

	onremove() {
		document.removeEventListener("keydown", this.handleKeyPress)
		document.removeEventListener("mousedown", this.handleMouseClick)
	}

	private handleMouseClick = (e: MouseEvent) => {
		const dropdownContainsTarget = this.domDropdown?.contains(e.target as HTMLElement)
		if (e.target === this.domDropdown || dropdownContainsTarget) {
			// By default, when an element is clicked, the browser sets focus on that element or its children.
			// Calling preventDefault() stops this default behavior (and any other default actions triggered by the click).
			// In this case, it prevents the 'focusin' event from firing when clicking an option inside the select element.
			e.preventDefault()
		}

		if (!dropdownContainsTarget) {
			this.onClose()
		}
	}

	private handleKeyPress = (e: KeyboardEvent) => {
		if (isKeyPressed(e.key, Keys.UP)) {
			return this.domDropdown ? focusPrevious(this.domDropdown) : false
		} else if (isKeyPressed(e.key, Keys.DOWN)) {
			return this.domDropdown ? focusNext(this.domDropdown) : false
		}

		return true
	}

	private updateDropdownSize(vnode: VnodeDOM<HTMLElement>) {
		if (!(this.origin && this.domDropdown)) {
			return
		}

		const upperSpace = this.origin.top - getSafeAreaInsetTop()
		const lowerSpace = window.innerHeight - this.origin.bottom - getSafeAreaInsetBottom()

		const children = Array.from(vnode.dom.children) as Array<HTMLElement>
		const indexToNotCount = children.length - 1
		const contentHeight = Math.min(
			250 + size.vpad,
			children.reduce(
				(accumulator, children, currentIndex, array) => (currentIndex < indexToNotCount ? accumulator + children.offsetHeight : accumulator),
				0,
			) + size.vpad,
		)

		this.maxHeight = lowerSpace > upperSpace ? Math.min(contentHeight, lowerSpace) : Math.min(contentHeight, upperSpace)
		const newHeight = px(this.maxHeight)
		if (this.domDropdown.style.height !== newHeight) {
			this.domDropdown.style.height = newHeight
			m.redraw()
		}
	}

	private renderNoItem(): Children {
		return m("span.placeholder.text-center", { color: theme.on_surface_variant }, lang.get("noEntries_msg"))
	}

	setOrigin(origin: DomRectReadOnlyPolyfilled): this {
		this.origin = origin
		return this
	}

	/**
	 * Has to be overwritten when an instance of OptionListContainer is created
	 * @example
	 * ...
	 * const instance = new myInstanceOfOptionListContainer(args)
	 * myInstanceOfOptionListContainer.onClose = () => console.log("Closing")
	 * ...
	 */
	onClose(): void {}
}
