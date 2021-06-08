// @flow

import type {SelectorItem} from "../base/DropDownSelectorN"

export async function showSpellcheckLanguageDialog(): Promise<string> {
	const systemApp = await import('../../native/main/SystemApp')
	const {DesktopConfigKey} = await import('../../desktop/config/ConfigKeys')
	const current = await getCurrentSpellcheckLanguage()
	const {Dialog} = await import('../base/Dialog.js')
	const stream = await import('mithril/stream/stream.js')
	const items = await getItems()

	// this is a language code
	const newLang = await Dialog.showDropDownSelectionDialog(
		"spelling_label",
		"language_label",
		null,
		items,
		stream.default(current)
	)
	await systemApp.setConfigValue(DesktopConfigKey.spellcheck, newLang)
	// return displayable language name
	const selectedItem = items.find(i => i.value === newLang)
	return selectedItem ? selectedItem.name : items[0].name
}

export async function getCurrentSpellcheckLanguageLabel(): Promise<string> {
	const current = await getCurrentSpellcheckLanguage()
	const items = await getItems()
	const selectedItem = items.find(i => i.value === current)
	return selectedItem ? selectedItem.name : items[0].name
}

async function getCurrentSpellcheckLanguage(): Promise<string> {
	const systemApp = await import('../../native/main/SystemApp')
	const {DesktopConfigKey} = await import('../../desktop/config/ConfigKeys')
	return systemApp.getConfigValue(DesktopConfigKey.spellcheck)
}

async function getItems(): Promise<Array<SelectorItem<string>>> {
	const systemApp = await import('../../native/main/SystemApp')
	const {languages, lang} = await import('../../misc/LanguageViewModel.js')
	const options = await systemApp.getSpellcheckLanguages()
	return [
		{name: lang.get('comboBoxSelectionNone_msg'), value: ""}, ...options.map(option => {
			const language = languages.find(l => l.code === option.replace('-', '_').toLowerCase())
				|| languages.find(l => l.code === option.slice(0, 2).toLowerCase())
			const variant = option.length > 3
				? ` (${option.slice(3)})`
				: ""
			const name = language
				? lang.get(language.textId) + variant
				: option
			// some languages that can be spellchecked don't have a
			// textId in the translations.
			return {name, value: option}
		})
	]
}