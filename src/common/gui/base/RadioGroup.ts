import type { TranslationText } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import m, { Child, Children, Component, Vnode } from "mithril"
import { isKeyPressed } from "../../misc/KeyManager.js"
import { Keys } from "../../api/common/TutanotaConstants.js"
import { AriaRole } from "../AriaUtils.js"

export interface SingularOrPluralLabel {
	singular: TranslationText
	plural: TranslationText
}

export type RadioGroupOption<T> = {
	readonly name: TranslationText
	readonly value: T
}

export type RadioGroupAttrs<T> = {
	// The unique name of the radio button group. The browser uses it to group the radio buttons together.
	name: TranslationText
	options: ReadonlyArray<RadioGroupOption<T>>
	ariaLabel: TranslationText
	classes?: Array<string>
	selectedOption: T | null
	onOptionSelected: (arg0: T) => unknown
	injectionMap?: Map<string, Child>
}

/**
 * Component which shows selection for a single choice.
 */
export class RadioGroup<T> implements Component<RadioGroupAttrs<T>> {
	view({ attrs }: Vnode<RadioGroupAttrs<T>>): Children {
		return m(
			"ul.unstyled-list.flex.col.gap-vpad",
			{
				ariaLabel: lang.getMaybeLazy(attrs.ariaLabel),
				role: AriaRole.RadioGroup,
			},
			attrs.options.map((option) =>
				this.renderOption(attrs.name, option, attrs.selectedOption, attrs.classes?.join(" "), attrs.onOptionSelected, attrs.injectionMap),
			),
		)
	}

	private renderOption(
		groupName: TranslationText,
		option: RadioGroupOption<T>,
		selectedOption: T | null,
		optionClass: string | undefined,
		onOptionSelected: (arg0: T) => unknown,
		injectionMap?: Map<string, Child>,
	): Children {
		const name = lang.getMaybeLazy(groupName)
		const valueString = String(option.value)
		const isSelected = option.value === selectedOption

		// IDs used to link the label and description for accessibility
		const optionId = `${name}-${valueString}`

		// The wrapper is needed because <input> is self-closing and will not take the label as a child
		return m(
			"li.flex.gap-vpad.cursor-pointer.full-width.flash",
			{
				class: optionClass ?? "",
				onclick: () => {
					console.log("Clicked?")
					onOptionSelected(option.value)
				},
			},
			[
				m("input[type=radio].m-0.big-radio.content-accent-accent", {
					/* The `name` attribute defines the group the radio button belongs to. Not the name/label of the radio button itself.
					 * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio#defining_a_radio_group
					 */
					name: lang.getMaybeLazy(groupName),
					value: valueString,
					id: optionId,
					// Handle changes in value from the attributes
					checked: isSelected ? true : null,
					onkeydown: (event: KeyboardEvent) => {
						if (isKeyPressed(event.key, Keys.RETURN)) {
							onOptionSelected(option.value)
						}

						return true
					},
				}),
				m(".flex.flex-column.full-width", [
					m("label.cursor-pointer", { for: optionId }, lang.getMaybeLazy(option.name)),
					this.getInjection(String(option.value), injectionMap),
				]),
			],
		)
	}

	private getInjection(key: string, injectionMap?: Map<string, Child>): Child {
		if (!injectionMap || !injectionMap.has(key)) {
			return null
		}

		return injectionMap.get(key)
	}
}
