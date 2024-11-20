import m, { Children, ClassComponent, Vnode, VnodeDOM } from "mithril"
import { modal, ModalComponent } from "./Modal.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { px, size } from "../size.js"
import { Keys, TabIndex } from "../../api/common/TutanotaConstants.js"
import { focusNext, focusPrevious, isKeyPressed, Shortcut } from "../../misc/KeyManager.js"
import { type PosRect, showDropdown } from "./Dropdown.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { Icon, IconSize } from "./Icon.js"
import { ButtonColor, getColors } from "./Button.js"
import { AriaRole } from "../AriaUtils.js"
import Stream from "mithril/stream"
import { getSafeAreaInsetBottom, getSafeAreaInsetTop } from "../HtmlUtils.js"
import { theme } from "../theme.js"
import { BootIcons } from "./icons/BootIcons.js"

export interface SelectOption<T> {
	// Here we declare everything that is important to use at the select option
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
	selected?: U
	placeholder?: Children
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
	keepFocus?: boolean
	tabIndex?: number
	onclose?: () => void
	oncreate?: (...args: any[]) => unknown
	dropdownPosition?: "top" | "bottom"
}

type HTMLElementWithAttrs = Partial<Pick<m.Attributes, "class"> & Omit<HTMLButtonElement, "style"> & SelectAttributes<SelectOption<unknown>, unknown>>

export interface SelectState {
	dropdownContainer?: OptionListContainer
}

/**
 * Select component
 * @see Component attributes: {SelectAttributes}
 * @example
 *
 * interface CalendarSelectItem extends SelectOption<string> {
 *   color: string
 * 	 name: string
 * }
 *
 * m(Select<CalendarSelectItem, string>, {
 *   classes: ["custom-margins"],
 *   onChange: (val) => {
 * 	   this.selected = val
 *   },
 * 	 options: this.options,
 * 	 expanded: true,
 * 	 selected: this.selected,
 * 	 renderOption: (option) => {
 * 	   return m(".flex.items-center.gap-vpad-xs", [
 * 	     m("div", { style: { width: "24px", height: "24px", borderRadius: "50%", backgroundColor: option.color } }),
 *       m("span", option.name),
 * 	   ])
 * 	 },
 * 	 renderDisplay: (option) => m("span", { style: { color: "red" } }, option.name),
 * 	 ariaLabel: "Calendar"
 * }),
 */
export class Select<U extends SelectOption<T>, T> implements ClassComponent<SelectAttributes<U, T>> {
	private isExpanded: boolean = false
	private dropdownContainer?: OptionListContainer
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
			keepFocus,
			tabIndex,
			onclose,
			dropdownPosition,
		},
	}: Vnode<SelectAttributes<U, T>, this>) {
		return m(
			"button.tutaui-select-trigger.clickable.flash",
			{
				id,
				class: this.resolveClasses(classes, disabled, expanded),
				onclick: (event: MouseEvent) =>
					event.currentTarget &&
					this.renderDropdown(
						options,
						event.currentTarget as HTMLElement,
						onchange,
						renderOption,
						keepFocus ?? false,
						selected?.value,
						onclose,
						dropdownPosition,
					),
				role: AriaRole.Combobox,
				ariaLabel,
				disabled: disabled,
				ariaExpanded: String(this.isExpanded),
				tabIndex: tabIndex ?? Number(disabled ? TabIndex.Programmatic : TabIndex.Default),
				value: selected?.ariaValue,
			} satisfies HTMLElementWithAttrs,
			[
				selected != null ? renderDisplay(selected) : this.renderPlaceholder(placeholder),
				noIcon !== true
					? m(Icon, {
							icon: BootIcons.Expand,
							container: "div",
							class: `fit-content transition-transform`,
							size: IconSize.Medium,
							style: {
								fill: iconColor ?? getColors(ButtonColor.Content).button,
							},
					  })
					: null,
			],
		)
	}

	private resolveClasses(classes: Array<string> = [], disabled: boolean = false, expanded: boolean = false) {
		const classList = [...classes]
		if (disabled) {
			classList.push("disabled", "click-disabled")
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
		keepFocus: boolean,
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
			dom.getBoundingClientRect().width,
			keepFocus,
			dropdownPosition,
		)

		optionListContainer.onClose = () => {
			optionListContainer.close()
			onClose?.()
			this.isExpanded = false
		}

		optionListContainer.setOrigin(dom.getBoundingClientRect())

		this.isExpanded = true
		this.dropdownContainer = optionListContainer
		modal.displayUnique(optionListContainer, false)
	}

	private setupOption(dom: HTMLElement, onSelect: (option: U) => void, option: U, optionListContainer: OptionListContainer, selected: T | undefined) {
		dom.onclick = this.wrapOnChange.bind(this, onSelect, option, optionListContainer)

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
			if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
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

class OptionListContainer implements ModalComponent {
	private domDropdown: HTMLElement | null = null
	view: ModalComponent["view"]
	origin: PosRect | null = null
	shortcuts: (...args: Array<any>) => any
	private readonly width: number
	private domContents: HTMLElement | null = null
	private maxHeight: number | null = null
	private focusedBeforeShown: HTMLElement | null = document.activeElement as HTMLElement

	constructor(
		private readonly items: Stream<Array<unknown>>,
		private readonly buildFunction: (option: unknown) => Children,
		width: number,
		keepFocus: boolean,
		dropdownPosition?: "top" | "bottom",
	) {
		this.width = width
		this.shortcuts = this.buildShortcuts

		this.view = () => {
			return m(
				".dropdown-panel-scrollable.elevated-bg.border-radius.dropdown-shadow.fit-content",
				{
					oncreate: (vnode: VnodeDOM<HTMLElement>) => {
						this.domDropdown = vnode.dom as HTMLElement
						// It is important to set initial opacity so that user doesn't see it with full opacity before animating.
						this.domDropdown.style.opacity = "0"
					},
				},
				m(
					".dropdown-content.scroll.flex.flex-column",
					{
						role: AriaRole.Listbox,
						tabindex: TabIndex.Programmatic,
						oncreate: (vnode: VnodeDOM<HTMLElement>) => {
							this.domContents = vnode.dom as HTMLElement
						},
						onupdate: (vnode: VnodeDOM<HTMLElement>) => {
							if (this.maxHeight == null) {
								const children = Array.from(vnode.dom.children) as Array<HTMLElement>
								this.maxHeight = Math.min(
									400 + size.vpad,
									children.reduce((accumulator, children) => accumulator + children.offsetHeight, 0) + size.vpad,
								) // size.pad accounts for top and bottom padding

								if (this.origin) {
									// The dropdown-content element is added to the dom has a hidden element first.
									// The maxHeight is available after the first onupdate call. Then this promise will resolve and we can safely
									// show the dropdown.
									// Modal always schedules redraw in oncreate() of a component so we are guaranteed to have onupdate() call.
									showDropdown(this.origin, assertNotNull(this.domDropdown), this.maxHeight, this.width, dropdownPosition).then(() => {
										const selectedOption = vnode.dom.querySelector("[aria-selected='true']") as HTMLElement | null
										if (selectedOption && !keepFocus) {
											selectedOption.focus()
										} else if (!keepFocus && (!this.domDropdown || focusNext(this.domDropdown))) {
											this.domContents?.focus()
										}
									})
								}
							} else {
								this.updateDropdownSize(vnode)
							}
						},
						onscroll: (ev: EventRedraw<Event>) => {
							const target = ev.target as HTMLElement
							// needed here to prevent flickering on ios
							ev.redraw =
								this.domContents != null && target.scrollTop < 0 && target.scrollTop + this.domContents.offsetHeight > target.scrollHeight
						},
					},
					this.items().length === 0 ? this.renderNoItem() : this.items().map((item) => this.buildFunction(item)),
				),
			)
		}
	}

	private updateDropdownSize(vnode: VnodeDOM<HTMLElement>) {
		if (!(this.origin && this.domDropdown)) {
			return
		}

		const upperSpace = this.origin.top - getSafeAreaInsetTop()
		const lowerSpace = window.innerHeight - this.origin.bottom - getSafeAreaInsetBottom()

		const children = Array.from(vnode.dom.children) as Array<HTMLElement>
		const contentHeight = Math.min(400 + size.vpad, children.reduce((accumulator, children) => accumulator + children.offsetHeight, 0) + size.vpad)

		this.maxHeight = lowerSpace > upperSpace ? Math.min(contentHeight, lowerSpace) : Math.min(contentHeight, upperSpace)

		this.domDropdown.style.height = px(this.maxHeight)
	}

	private renderNoItem(): Children {
		return m("span.placeholder.text-center", { color: theme.list_message_bg }, lang.get("noEntries_msg"))
	}

	backgroundClick = (e: MouseEvent) => {
		if (
			this.domDropdown &&
			!(e.target as HTMLElement).classList.contains("doNotClose") &&
			(this.domDropdown.contains(e.target as HTMLElement) || this.domDropdown.parentNode === e.target)
		) {
			this.onClose()
		}
	}

	buildShortcuts(): Array<Shortcut> {
		return [
			{
				key: Keys.ESC,
				exec: () => this.onClose(),
				help: "close_alt",
			},
			{
				key: Keys.TAB,
				shift: true,
				exec: () => (this.domDropdown ? focusPrevious(this.domDropdown) : false),
				help: "selectPrevious_action",
			},
			{
				key: Keys.TAB,
				shift: false,
				exec: () => (this.domDropdown ? focusNext(this.domDropdown) : false),
				help: "selectNext_action",
			},
			{
				key: Keys.UP,
				exec: () => (this.domDropdown ? focusPrevious(this.domDropdown) : false),
				help: "selectPrevious_action",
			},
			{
				key: Keys.DOWN,
				exec: () => (this.domDropdown ? focusNext(this.domDropdown) : false),
				help: "selectNext_action",
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

	hideAnimation(): Promise<void> {
		return Promise.resolve()
	}

	onClose(): void {
		this.close()
	}

	popState(e: Event): boolean {
		this.onClose()
		return false
	}

	callingElement(): HTMLElement | null {
		return this.focusedBeforeShown
	}
}
