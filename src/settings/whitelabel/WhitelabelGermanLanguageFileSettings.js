// @flow

import stream from "mithril/stream/stream.js"
import m from "mithril"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"

export type WhitelabelGermanLanguageFileSettingsAttrs = {
	customGermanLanguageFile: ?string,
	onGermanLanguageFileChanged: (string) => mixed,
}

export class WhitelabelGermanLanguageFileSettings implements MComponent<WhitelabelGermanLanguageFileSettingsAttrs> {
	constructor(vnode: Vnode<WhitelabelGermanLanguageFileSettingsAttrs>) {}

	view(vnode: Vnode<WhitelabelGermanLanguageFileSettingsAttrs>): Children {
		const {customGermanLanguageFile, onGermanLanguageFileChanged} = vnode.attrs

		return this._renderDefaultGermanLanguageFileSettings(customGermanLanguageFile, onGermanLanguageFileChanged)
	}

	_renderDefaultGermanLanguageFileSettings(customGermanLanguageFile: ?string, onGermanLanguageFileChanged: (string) => mixed): Children {
		const items = [
			{name: "Deutsch (Du)", value: "de"},
			{name: "Deutsch (Sie)", value: "de_sie"}
		]

		const selectedValue = customGermanLanguageFile ? customGermanLanguageFile : items[0].value
		const defaultGermanLanguageFileDropDownAttrs = {
			label: "germanLanguageFile_label",
			items,
			selectedValue: stream(selectedValue),
			selectionChangedHandler: onGermanLanguageFileChanged,
		}
		return m(DropDownSelectorN, defaultGermanLanguageFileDropDownAttrs)
	}
}