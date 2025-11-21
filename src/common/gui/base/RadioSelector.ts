import type { MaybeTranslation } from "../../misc/LanguageViewModel"
import m, { Children, Component, Vnode } from "mithril"
import { RadioSelectorItem, RadioSelectorItemAttrs, RadioSelectorOption } from "./RadioSelectorItem"

export type RadioSelectorAttrs<T> = {
	// The unique name of the radio button group. The browser uses it to group the radio buttons together.
	groupName: MaybeTranslation
	options: ReadonlyArray<RadioSelectorOption<T>>
	optionClass?: string
	selectedOption: T
	onOptionSelected: (arg0: T) => unknown
}

/**
 * Component which shows selection for a single choice.
 */
export class RadioSelector<T> implements Component<RadioSelectorAttrs<T>> {
	view({ attrs: { options, groupName, optionClass, selectedOption, onOptionSelected } }: Vnode<RadioSelectorAttrs<T>>): Children {
		return m(
			".flex-start.col.gap-vpad",
			options.map((option) =>
				m(RadioSelectorItem, {
					groupName,
					option,
					optionClass,
					isSelected: option.value === selectedOption,
					onOptionSelected,
				} satisfies RadioSelectorItemAttrs<T>),
			),
		)
	}
}
