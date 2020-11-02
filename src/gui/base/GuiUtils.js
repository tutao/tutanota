//@flow

import type {Country} from "../../api/common/CountryList"
import {DropDownSelector} from "./DropDownSelector"
import {Countries} from "../../api/common/CountryList"
import {lang} from "../../misc/LanguageViewModel"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {Dialog} from "./Dialog"
import {Keys} from "../../api/common/TutanotaConstants"
import type {Shortcut} from "../../misc/KeyManager"

// TODO Use DropDownSelectorN
export function createCountryDropdown(selectedCountry: Stream<?Country>, helpLabel?: lazy<string>, label: TranslationKey | lazy<string> = "invoiceCountry_label"): DropDownSelector<?Country> {
	const countries = Countries.map(c => ({value: c, name: c.n}))
	countries.push({value: null, name: lang.get("choose_label")});

	const countryInput = new DropDownSelector(
		label,
		helpLabel,
		countries,
		selectedCountry,
		250).setSelectionChangedHandler(value => {
		selectedCountry(value)
	})
	return countryInput
}
