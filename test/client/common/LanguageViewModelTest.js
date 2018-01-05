// @flow
import o from "ospec/ospec.js"
import {lang} from "../../../src/misc/LanguageViewModel"
import en from "../../../src/translations/en"

o.spec("LanguageViewModelTests", function () {
	o("en is default language", browser((done, timeout) => {
		timeout(500)
		return lang.init(en).then(() => {
			o(lang.fallback).equals(en)
		}).then(done)
	}))
})
