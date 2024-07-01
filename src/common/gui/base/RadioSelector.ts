import type { TranslationText } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../theme"

export type RadioSelectorOption<T> = {
	readonly name: TranslationText
	readonly value: T
}
export type RadioSelectorAttrs<T> = {
	// The unique name of the radio button group. The browser uses it to group the radio buttons together.
	name: TranslationText
	options: ReadonlyArray<RadioSelectorOption<T>>
	class?: string
	selectedOption: T
	onOptionSelected: (arg0: T) => unknown
}

/**
 * Component which shows selection for a single choice.
 */
export class RadioSelector<T> implements Component<RadioSelectorAttrs<T>> {
	view({ attrs }: Vnode<RadioSelectorAttrs<T>>): Children {
		return attrs.options.map((option) => this.renderOption(attrs.name, option, attrs.selectedOption, attrs.class, attrs.onOptionSelected))
	}

	private renderOption(
		groupName: TranslationText,
		option: RadioSelectorOption<T>,
		selectedOption: T,
		optionClass: string | undefined,
		onOptionSelected: (arg0: T) => unknown,
	): Children {
		const name = lang.getMaybeLazy(groupName)
		const valueString = String(option.value)
		const isSelected = option.value === selectedOption

		// IDs used to link the label and description for accessibility
		const optionId = name + valueString

		const attrClasses = optionClass != null ? " " + optionClass : ""

		// The wrapper is needed because <input> is self-closing and will not take the label as a child
		return m(
			".state-bg.border.border-radius.flex.items-center.mb.pl-l.pr",
			{
				// Make the option the same size as a button if a description is not given
				class: "button-min-width button-min-height" + attrClasses,
				style: {
					borderColor: isSelected ? theme.content_accent : theme.content_border,
					borderWidth: "2px",
					height: "fit-content",
				},
				onclick: () => {
					onOptionSelected(option.value)
				},
			},
			[
				m("input[type=radio].m-0.mr-button.content-accent-accent", {
					/* The `name` attribute defines the group the radio button belongs to. Not the name/label of the radio button itself.
					 * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio#defining_a_radio_group
					 */
					name: lang.getMaybeLazy(groupName),
					value: valueString,
					id: optionId,
					// Handle changes in value from the attributes
					checked: isSelected ? true : null,
				}),
				m("label.b.left.pt-xs.pb-xs", { for: optionId }, lang.getMaybeLazy(option.name)),
			],
		)
	}
}
