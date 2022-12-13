import m, {Children, ClassComponent, Vnode} from "mithril"
import {scrollListDom} from "./base/GuiUtils.js"
import {px, size} from "./size.js"
import {windowFacade} from "../misc/WindowFacade.js"
import {MailAddressAvailability} from "../api/entities/sys/TypeRefs.js"
import {lang} from "../misc/LanguageViewModel.js"

const EntryHeight = 60

export interface MailAddressAvailabilityDropDownAttrs {
	availabilities: ReadonlyArray<MailAddressAvailability>
	selectedSuggestionIndex: number
	onSuggestionSelected: (idx: number) => void

	/** max amount of suggestions that can be visible without scrolling */
	maxHeight: number | null
}

export class MailAddressAvailabilityDropDown implements ClassComponent<MailAddressAvailabilityDropDownAttrs> {

	private domSuggestions!: HTMLElement
	private keyboardHeight: number = 0

	oncreate() {
		windowFacade.addKeyboardSizeListener(newSize => {
			// *-------------------*  -
			// |                   |  |
			// |   -------------   |  - <- top
			// |   |           |   |
			// |   |-----------|   |
			// |-------------------|  - <- keyboardHeight
			// | q w e r t z u i o |  |
			// | a s d f g h j k l |  -
			//
			// On iOS screen is not resized when keyboard is opened. Instead we send a signal to WebView with keyboard height.
			this.keyboardHeight = newSize
		})
	}

	view({attrs}: Vnode<MailAddressAvailabilityDropDownAttrs>): Children {
		if (attrs.selectedSuggestionIndex !== attrs.selectedSuggestionIndex && this.domSuggestions) {
			requestAnimationFrame(() => {
				scrollListDom(this.domSuggestions, EntryHeight, attrs.selectedSuggestionIndex)
			})
		}

		// We need to calculate how much space can be actually used for the dropdown. We cannot just add margin like we do with dialog
		// because the availabilities dropdown is absolutely positioned.
		let dropdownHeight = EntryHeight * Math.min(attrs.maxHeight ?? Number.MAX_VALUE, attrs.availabilities.length)
		if (this.domSuggestions) {
			const top = this.domSuggestions.getBoundingClientRect().top
			const availableHeight = window.innerHeight - top - this.keyboardHeight - size.vpad
			dropdownHeight = Math.min(availableHeight, dropdownHeight)
		}

		return m(
			`.abs.z4.full-width.elevated-bg.scroll.text-ellipsis${attrs.availabilities.length ? ".dropdown-shadow" : ""}`,
			{
				oncreate: vnode => this.domSuggestions = vnode.dom as HTMLElement,
				style: {
					transition: "height 0.2s",
					height: px(dropdownHeight)
				},
			},
			attrs.availabilities.map(({mailAddress, available}, idx) => this.renderAvailability(attrs, mailAddress, available, idx))
		)
	}

	private renderAvailability(attrs: MailAddressAvailabilityDropDownAttrs, mailAddress: string, available: boolean, idx: number): Children {
		const selected = idx === attrs.selectedSuggestionIndex

		return m(
			".pt-s.pb-s.click.content-hover",
			{
				class: selected ? "content-accent-fg row-selected" : "",
				onmousedown: () => {
					if (available) {
						attrs.onSuggestionSelected(idx)
					}
				},
				style: {
					"padding-left": selected ? px(size.hpad_large - 3) : px(size.hpad_large),
					"border-left": selected ? "3px solid" : null,
					height: px(EntryHeight),
				},
			},
			[
				m(".small.full-width.text-ellipsis", lang.get(available ? "available_label" : "unavailable_label")),
				m(".name.full-width.text-ellipsis", mailAddress)
			],
		)
	}
}