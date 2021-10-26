// @flow

import type {SelectorItem} from "../base/DropDownSelectorN"
import {mapNullable} from "@tutao/tutanota-utils"
import type {TranslationKey} from "../../misc/LanguageViewModel"

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
		{name: lang.get('comboBoxSelectionNone_msg'), value: ""},
		...options.map(code => {

			const [langCode, locale] = code.split("-")

			const textId = mapNullable(languages.find(
				language =>
					// find the name for a language given a locale with a perfect match
					(locale && language.code === `${langCode}_${locale.toLowerCase()}`)
					// fine the name for a language without a locale, with a perfect match
					|| language.code === langCode
					// the code given by electron doesn't always have a locale when we do,
					// e.g. for Persian we have "fa_ir" in LanguageViewModel, but electron only gives us "fa"
					|| language.code.slice(0, 2) === langCode), language => language.textId)
				|| getMissingLanguageLabel(langCode)

			const name = textId
				? lang.get(textId) + ` (${code})`
				: code

			return {name, value: code}
		}).sort((a, b) => a.name.localeCompare(b.name))
	]
}

/**
 * Electron has a different selection of spellchecker languages from what our client supports,
 * so we can't get all of the names from the LanguageViewModel
 */
function getMissingLanguageLabel(code): TranslationKey {
	return {
		"af": "languageAfrikaans_label",
		"cy": "languageWelsh_label",
		"fo": "languageFaroese_label",
		"hy": "languageArmenian_label",
		"nb": "languageNorwegianBokmal_label",
		"sh": "languageSerboCroatian_label",
		"sq": "languageAlbanian_label",
		"ta": "languageTamil_label",
		"tg": "languageTajik_label",
	}[code]
}