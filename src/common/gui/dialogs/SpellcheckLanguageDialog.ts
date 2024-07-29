import type { SelectorItem } from "../base/DropDownSelector.js"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { locator } from "../../api/main/CommonLocator"

export async function showSpellcheckLanguageDialog(): Promise<string> {
	const { DesktopConfigKey } = await import("../../../common/desktop/config/ConfigKeys")
	const current = await getCurrentSpellcheckLanguage()
	const { Dialog } = await import("../base/Dialog.js")
	const items = await getItems()
	// this is a language code
	const newLang = await Dialog.showDropDownSelectionDialog("spelling_label", "language_label", null, items, current)
	await locator.desktopSettingsFacade.setStringConfigValue(DesktopConfigKey.spellcheck, newLang)
	// return displayable language name
	const selectedItem = items.find((i) => i.value === newLang)
	return selectedItem ? selectedItem.name : items[0].name
}

export async function getCurrentSpellcheckLanguageLabel(): Promise<string> {
	const current = await getCurrentSpellcheckLanguage()
	const items = await getItems()
	const selectedItem = items.find((i) => i.value === current)
	return selectedItem ? selectedItem.name : items[0].name
}

async function getCurrentSpellcheckLanguage(): Promise<string> {
	const { DesktopConfigKey } = await import("../../../common/desktop/config/ConfigKeys")
	return (await locator.desktopSettingsFacade.getStringConfigValue(DesktopConfigKey.spellcheck)) ?? ""
}

async function getItems(): Promise<Array<SelectorItem<string>>> {
	const { languages, lang } = await import("../../misc/LanguageViewModel.js")
	const options = await locator.desktopSettingsFacade.getSpellcheckLanguages()
	return [
		{
			name: lang.get("comboBoxSelectionNone_msg"),
			value: "",
		},
		...options
			.map((code) => {
				const [langCode, locale] = code.split("-")
				// first, find the name for a language given a locale with a perfect match
				const language =
					languages.find((language) => locale && language.code === `${langCode}_${locale.toLowerCase()}`) || // find the name for a language without a locale, with a perfect match
					languages.find((language) => language.code === langCode) || // try to get a missing one before splitting
					getMissingLanguage(langCode) || // the code given by electron doesn't always have a locale when we do,
					// e.g. for Persian we have "fa_ir" in LanguageViewModel, but electron only gives us "fa"
					languages.find((language) => language.code.slice(0, 2) === langCode)
				const textId = language?.textId
				const name = textId ? lang.get(textId) + ` (${code})` : code
				return {
					name,
					value: code,
				}
			})
			.sort((a, b) => a.name.localeCompare(b.name)),
	]
}

/**
 * Electron has a different selection of spellchecker languages from what our client supports,
 * so we can't get all of the names from the LanguageViewModel
 */
function getMissingLanguage(code: string): { textId: TranslationKey; code: string } | null {
	const mapping: Record<string, TranslationKey> = {
		af: "languageAfrikaans_label",
		cy: "languageWelsh_label",
		fo: "languageFaroese_label",
		hy: "languageArmenian_label",
		nb: "languageNorwegianBokmal_label",
		sh: "languageSerboCroatian_label",
		sq: "languageAlbanian_label",
		ta: "languageTamil_label",
		tg: "languageTajik_label",
		pt: "languagePortugese_label",
	}
	const id = mapping[code]
	return id ? { textId: id, code } : null
}
