// @flow
import o from "ospec/ospec.js"
import {lang} from "../../../src/misc/LanguageViewModel"
import en from "../../../src/translations/en"
import {neverNull} from "../../../src/api/common/utils/Utils"

o.spec("LanguageViewModelTests", function () {
	o("en is default language", browser((done) => {
		lang.init(en).then(() => {
			o(neverNull(lang.code).indexOf("en")).equals(0)
			o(lang.get('accountSettings_label')).equals('Account')
		}).then(done)
	}))
})
