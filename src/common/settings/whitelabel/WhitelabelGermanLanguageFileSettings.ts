import stream from "mithril/stream"
import m, { Children, Component, Vnode } from "mithril"
import { DropDownSelectorAttrs, DropDownSelector, SelectorItemList } from "../../gui/base/DropDownSelector.js"

export type GermanLanguageCode = "de" | "de_sie"
export type WhitelabelGermanLanguageFileSettingsAttrs = {
	customGermanLanguageFile: GermanLanguageCode | null
	onGermanLanguageFileChanged: (arg0: GermanLanguageCode) => unknown
}

export class WhitelabelGermanLanguageFileSettings implements Component<WhitelabelGermanLanguageFileSettingsAttrs> {
	constructor(vnode: Vnode<WhitelabelGermanLanguageFileSettingsAttrs>) {}

	view(vnode: Vnode<WhitelabelGermanLanguageFileSettingsAttrs>): Children {
		const { customGermanLanguageFile, onGermanLanguageFileChanged } = vnode.attrs
		return this._renderDefaultGermanLanguageFileSettings(customGermanLanguageFile, onGermanLanguageFileChanged)
	}

	_renderDefaultGermanLanguageFileSettings(
		customGermanLanguageFile: GermanLanguageCode | null,
		onGermanLanguageFileChanged: (arg0: GermanLanguageCode) => unknown,
	): Children {
		const items: SelectorItemList<GermanLanguageCode> = [
			{
				name: "Deutsch (Du)",
				value: "de",
			},
			{
				name: "Deutsch (Sie)",
				value: "de_sie",
			},
		]
		const selectedValue: GermanLanguageCode = customGermanLanguageFile ?? items[0].value
		const defaultGermanLanguageFileDropDownAttrs: DropDownSelectorAttrs<GermanLanguageCode> = {
			label: "germanLanguageFile_label",
			items,
			selectedValue: selectedValue,
			selectionChangedHandler: onGermanLanguageFileChanged,
		} as const
		return m(DropDownSelector, defaultGermanLanguageFileDropDownAttrs)
	}
}
