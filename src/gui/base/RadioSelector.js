// @flow
import type {TranslationText} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import m from "mithril"
import {theme} from "../theme"

export type RadioSelectorOption<T> = {
	name: TranslationText,
	value: T,
	helpText: TranslationText,
}

export type RadioSelectorAttrs<T> = {
	options: $ReadOnlyArray<RadioSelectorOption<T>>,
	selectedOption: T,
	onOptionSelected: (T) => mixed,
}

/**
 * Component which shows selection for a single choice.
 */
export class RadioSelector<T> implements MComponent<RadioSelectorAttrs<T>> {
	view({attrs}: Vnode<RadioSelectorAttrs<T>>): Children {
		return attrs.options.map((option) => this._renderOption(option, attrs.selectedOption, attrs.onOptionSelected))
	}

	_renderOption(option: RadioSelectorOption<T>, selectedOption: T, onOptionSelected: (T)=> mixed): Children {
		return m(".border.border-radius.mb.pt.pb.pl.pr", {
			style: {
				borderColor: option.value === selectedOption ? theme.content_accent : theme.content_border,
				borderWidth: "2px",
			},
			onclick: () => {
				onOptionSelected(option.value)
			},
		}, [
			m(".b", lang.getMaybeLazy(option.name)),
			m(".small", lang.getMaybeLazy(option.helpText)),
		])
	}
}
