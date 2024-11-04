import m, { Children, ClassComponent, Vnode } from "mithril"
import { modal, ModalComponent } from "./Modal.js"
import { assertNotNull, memoized } from "@tutao/tutanota-utils"
import { size } from "../size.js"
import { AriaRole } from "../AriaUtils.js"
import { Keys, TabIndex } from "../../api/common/TutanotaConstants.js"
import { focusNext, focusPrevious, Shortcut } from "../../misc/KeyManager.js"
import { type PosRect, showDropdown } from "./Dropdown.js"
import { lang, TranslationKey } from "../../misc/LanguageViewModel.js"
import { Icon, IconSize } from "./Icon.js"
import { ButtonColor, getColors } from "./Button.js"
import { Icons } from "./icons/Icons.js"
import Mithril from "mithril"

export interface SelectOption<T> {
	// Here we declare everything that is important to use at the select option
	value: T | undefined
}

export interface SelectAttributes<U extends SelectOption<any>> {
	onChange: (newValue: U) => void
	options: Array<U>
	renderOption: (option: U) => Children
	classes?: string
	selected?: U
	placeholder?: TranslationKey
	expanded?: boolean
}

export class Select<U extends SelectOption<any>> implements ClassComponent<SelectAttributes<U>> {
	private isExpanded: boolean = false

	view({ attrs: { onChange, options, renderOption, classes, selected, placeholder, expanded } }: Vnode<SelectAttributes<U>>) {
		return m(
			"button.tutaui-select-trigger",
			{
				class: `${classes ?? ""} ${expanded ? "full-width" : "fit-content"}`,
				onclick: (event: MouseEvent) => event.target && this.renderDropdown(options, event.currentTarget as HTMLElement, onChange, renderOption),
			},
			[
				selected != null ? renderOption(selected) : this.renderPlaceholder(placeholder),
				m(Icon, {
					icon: this.isExpanded ? Icons.ChevronCollapse : Icons.ChevronExpand,
					container: "div",
					class: "fit-content",
					size: IconSize.Medium,
					style: {
						fill: getColors(ButtonColor.Content).button,
					},
				}),
			],
		)
	}

	renderPlaceholder(placeholder?: TranslationKey): Children {
		return m("span.placeholder", lang.get(placeholder ?? "noSelection_msg")) //FIXME Get a proper translation for default
	}

	renderDropdown(options: Array<U>, dom: HTMLElement, onSelect: (option: U) => void, renderOptions: (option: U) => Children) {
		const optionListContainer = new OptionListContainer(
			options.map((option) =>
				m.fragment(
					{
						oncreate(vnode: Mithril.VnodeDOM<any, any>): any {
							;(vnode.dom as HTMLElement).onclick = onSelect.bind(this, option)
						},
					},
					[renderOptions(option)],
				),
			),
			dom.getBoundingClientRect().width,
			onSelect,
		)
		optionListContainer.onClose = () => {
			optionListContainer.close()
			this.isExpanded = false
		}
		optionListContainer.setOrigin(dom.getBoundingClientRect())

		this.isExpanded = true
		modal.displayUnique(optionListContainer, false)
	}
}

class OptionListContainer<T> implements ModalComponent {
	private domDropdown: HTMLElement | null = null
	view: ModalComponent["view"]
	origin: PosRect | null = null
	shortcuts: (...args: Array<any>) => any
	private readonly width: number
	private domContents: HTMLElement | null = null
	private maxHeight: number | null = null
	private focusedBeforeShown: HTMLElement | null = document.activeElement as HTMLElement

	constructor(private readonly children: Children, width: number, onSelect: (option: T) => void) {
		this.width = width
		this.shortcuts = this.buildShortcuts

		this.view = () => {
			return m(
				".dropdown-panel.elevated-bg.border-radius.dropdown-shadow.fit-content",
				{
					oncreate: (vnode) => {
						this.domDropdown = vnode.dom as HTMLElement
						// It is important to set initial opacity so that user doesn't see it with full opacity before animating.
						this.domDropdown.style.opacity = "0"
					},
				},
				m(
					".dropdown-content.scroll.pl-vpad-s.pr-vpad-s.flex.flex-column.gap-vpad-xs",
					{
						role: AriaRole.Menu,
						tabindex: TabIndex.Programmatic,
						oncreate: (vnode) => {
							this.domContents = vnode.dom as HTMLElement
						},
						onupdate: (vnode) => {
							if (this.maxHeight == null) {
								const children = Array.from(vnode.dom.children) as Array<HTMLElement>
								this.maxHeight = children.reduce((accumulator, children) => accumulator + children.offsetHeight, 0) + size.vpad

								if (this.origin) {
									// The dropdown-content element is added to the dom has a hidden element first.
									// The maxHeight is available after the first onupdate call. Then this promise will resolve and we can safely
									// show the dropdown.
									// Modal always schedules redraw in oncreate() of a component so we are guaranteed to have onupdate() call.
									showDropdown(this.origin, assertNotNull(this.domDropdown), this.maxHeight, this.width).then(() => {
										const firstButton = vnode.dom.getElementsByTagName("button").item(0)
										if (firstButton !== null) {
											firstButton.focus()
										} else {
											this.domContents?.focus()
										}
									})
								}
							}
						},
						onscroll: (ev: EventRedraw<Event>) => {
							const target = ev.target as HTMLElement
							// needed here to prevent flickering on ios
							ev.redraw =
								this.domContents != null && target.scrollTop < 0 && target.scrollTop + this.domContents.offsetHeight > target.scrollHeight
						},
					},
					this.children,
				),
			)
		}
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
