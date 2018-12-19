// @flow
import o from "ospec/ospec.js"
import {_getSubstitutedLanguageCode, getAvailableLanguageCode, lang} from "../../../src/misc/LanguageViewModel"
import en from "../../../src/translations/en"

o.spec("LanguageViewModelTests", function () {
	o("en is default language", browser((done, timeout) => {
		timeout(500)
		return lang.init(en).then(() => {
			o(lang.fallback).equals(en)
		}).then(done)
	}))

	o("getAvailableLanguage", function () {
		[
			["en", "en"],
			["zh_hant", "zh"],
			["zh_HK", "zh_tw"],
			["uk_ua", "uk"],
			["fil_ph", "fil"],
			["fil", "fil"],
			["de", "de"],
			["a", "en"],
			["clingon", "en"],
			["pt_pt", "pt_pt"],
			["pt_br", "pt_br"],
			["fi", "fi"]
		].forEach(([k, r]) => o(getAvailableLanguageCode(k)).equals(r))
	})

	o("_getSubstitutedLanguageCode", function () {
		[
			["en", "en"],
			["zh_hant", "zh"],
			["zh_HK", "zh_tw"],
			["uk_ua", "uk"],
			["fil_ph", "fil"],
			["fil", "fil"],
			["de", "de"],
			["a", null],
			["clingon", null],
			["pt_pt", "pt_pt"],
			["pt_br", "pt_br"],
			["fi", "fi"]
		].forEach(([k, r]) => o(_getSubstitutedLanguageCode(k)).equals(r))
	})

	o("_getSubstitutedLanguageCodeWhitelabelCustomizations", function () {
		global.whitelabelCustomizations = {germanLanguageCode: "de_sie"}
		o(_getSubstitutedLanguageCode("de")).equals("de_sie")
		global.whitelabelCustomizations = undefined
	})
})
