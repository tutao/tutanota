import o from "@tutao/otest"
import { getAvailableLanguageCode, getSubstitutedLanguageCode, lang, LanguageNames, LanguageViewModel } from "../../../src/ui/utils/LanguageViewModel.js"
// @ts-ignore[untyped-import]
import en from "../../../src/ui/translations/en.js"

o.spec("LanguageViewModelTests", function () {
	o(
		"en is default language",
		browser(async function () {
			o.timeout(4500)
			await lang.init(en)
			o(lang.fallback).equals(en)
		}),
	)
	o("getAvailableLanguage", function () {
		const cases = [
			["en", "en"],
			["zh_CN", "zh"],
			["zh_Hant", "zh_hant"],
			["zh_HK", "zh_hant"],
			["zh_TW", "zh_hant"],
			["uk_ua", "uk"],
			["de", "de"],
			["a", "en"],
			["clingon", "en"],
			["pt_pt", "pt_pt"],
			["pt_br", "pt_br"],
			["fi", "fi"],
			["fa", "fa_ir"],
		]
		for (const [k, r] of cases) o(getAvailableLanguageCode(k)).equals(r)
	})
	o("_getSubstitutedLanguageCode", function () {
		const cases: [string, string | null][] = [
			["en", "en"],
			["zh_hant", "zh_hant"],
			["zh_HK", "zh_hant"],
			["uk_ua", "uk"],
			["de", "de"],
			["a", null],
			["clingon", null],
			["pt_pt", "pt_pt"],
			["pt_br", "pt_br"],
			["fi", "fi"],
			["fa", "fa_ir"],
		]
		for (const [k, r] of cases) {
			o(getSubstitutedLanguageCode(k)).equals(r)
		}
	})
	o("_getSubstitutedLanguageCodeWhitelabelCustomizations", function () {
		const globalSelf = typeof window === "undefined" ? global : window
		globalSelf.whitelabelCustomizations = {
			germanLanguageCode: "de_sie",
		}
		o(getSubstitutedLanguageCode("de")).equals("de_sie")
		globalSelf.whitelabelCustomizations = undefined
	})

	o.test("lint translation replacements", async function () {
		let errorsMessage = ""
		const invalidCharactersInReplacement: string[] = []

		const translationKeyToExpectedReplacements = new Map<string, { replacement: string; found: boolean }[]>()

		const languageViewModel = new LanguageViewModel()
		await languageViewModel.setLanguage({ code: "en", languageTag: "us" })
		const enTranslationData = languageViewModel.translations
		let translationData = enTranslationData
		for (const translationKey in translationData.keys) {
			const translationText = translationData.keys[translationKey]
			const expectedReplacements: { replacement: string; found: boolean }[] = []
			translationKeyToExpectedReplacements.set(translationKey, expectedReplacements)
			let inReplacement = false
			let replacementStart = -1
			for (let i = 0; i < translationText.length; ++i) {
				const char = translationText[i]
				if (char === "{") {
					inReplacement = true
					replacementStart = i
				} else if (char === "}") {
					if (inReplacement) {
						if (invalidCharactersInReplacement.length !== 0) {
							errorsMessage += `Invalid characters '${invalidCharactersInReplacement.join("','")}' in replacement '${translationText.slice(replacementStart, i + 1)}' in translation=en:${translationKey}:'${translationText.replaceAll("\n", "\\n")}'! Only characters a-z, A-Z, 0-9 or '-' are allowed.\n`
						} else {
							expectedReplacements.push({ replacement: translationText.slice(replacementStart + 1, i), found: true })
						}
						inReplacement = false
						replacementStart = -1
						invalidCharactersInReplacement.length = 0
					} else {
						errorsMessage += `Closing brace '}' at index=${i} in translation=en:${translationKey}:'${translationText.replaceAll("\n", "\\n")}' does not have matching opening brace!\n`
					}
				} else if (inReplacement) {
					if ((char < "a" || "z" < char) && (char < "A" || "Z" < char) && (char < "0" || "9" < char) && char !== "-") {
						if (!invalidCharactersInReplacement.includes(char)) {
							invalidCharactersInReplacement.push(char)
						}
					}
				}
			}
			if (inReplacement) {
				errorsMessage += `Opening brace '{' at index=${replacementStart} in translation=en:${translationKey}:'${translationText.replaceAll("\n", "⏎")}' does not have matching closing brace!\n`
			}
		}

		for (const languageCode in LanguageNames) {
			if (languageCode === "en") {
				// We already handle English above: skip
				continue
			}

			await languageViewModel.setLanguage({ code: languageCode, languageTag: "us" })
			translationData = languageViewModel.translations

			for (const translationKey in translationData.keys) {
				// Reset all expected replacements for the current translation to "not found"
				let expectedReplacements = translationKeyToExpectedReplacements.get(translationKey)
				if (expectedReplacements === undefined) {
					errorsMessage += `Translation key ${languageCode}:${translationKey} not in default English translations!\n`
					continue
				}
				for (const entry of expectedReplacements) {
					entry.found = false
				}

				const translationText = translationData.keys[translationKey]
				let inReplacement = false
				let replacementStart = -1
				for (let i = 0; i < translationText.length; ++i) {
					const char = translationText[i]
					if (char === "{") {
						inReplacement = true
						replacementStart = i
					} else if (char === "}") {
						if (inReplacement) {
							if (invalidCharactersInReplacement.length !== 0) {
								errorsMessage += `Invalid characters '${invalidCharactersInReplacement.join("','")}' in replacement '${translationText.slice(replacementStart, i + 1)}' in translation=${languageCode}:${translationKey}:'${translationText.replaceAll("\n", "⏎")}'! Only characters a-z, A-Z, 0-9 or '-' are allowed.\n`
							} else {
								const replacement = translationText.slice(replacementStart + 1, i)
								let matchesExpectedReplacement = false
								for (let i = 0; i < expectedReplacements.length; ++i) {
									const entry = expectedReplacements[i]
									if (replacement === entry.replacement) {
										matchesExpectedReplacement = true
										entry.found = true
									}
								}
								if (!matchesExpectedReplacement) {
									errorsMessage += `Replacement '{${replacement}}' in translation=${languageCode}:${translationKey}:'${translationText.replaceAll("\n", "⏎")}' does not match any replacement in the default English translation='${enTranslationData.keys[translationKey].replaceAll("\n", "⏎")}'!\n`
								}
							}
							inReplacement = false
							replacementStart = -1
							invalidCharactersInReplacement.length = 0
						} else {
							errorsMessage += `Closing brace '}' at index=${i} in translation=${languageCode}:${translationKey}:'${translationText.replaceAll("\n", "⏎")}' does not have matching opening brace!\n`
						}
					} else if (inReplacement) {
						if ((char < "a" || "z" < char) && (char < "A" || "Z" < char) && (char < "0" || "9" < char) && char !== "-") {
							if (!invalidCharactersInReplacement.includes(char)) {
								invalidCharactersInReplacement.push(char)
							}
						}
					}
				}
				if (inReplacement) {
					errorsMessage += `Opening brace '{' at index=${replacementStart} in translation=${languageCode}:${translationKey}:'${translationText.replaceAll("\n", "⏎")}' does not have matching closing brace!\n`
				}

				for (let i = 0; i < expectedReplacements.length; ++i) {
					const entry = expectedReplacements[i]
					if (!entry.found) {
						errorsMessage += `Expected replacement '{${entry.replacement}}' from default English translation='${enTranslationData.keys[translationKey].replaceAll("\n", "⏎")}' not found in translation=${languageCode}:${translationKey}:'${translationText.replaceAll("\n", "⏎")}'!\n`
					}
				}
			}
		}

		if (errorsMessage) {
			throw new Error(errorsMessage)
		}
	})
})
