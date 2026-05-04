// lazy because of global dependencies
import { type lazy, lazyMemoized } from "@tutao/utils"
import { lang, MaybeTranslation } from "../../ui/utils/LanguageViewModel"
import m, { Children } from "mithril"
import { DropDownSelector } from "../../ui/base/DropDownSelector"
import { DropDownSelectorNew, DropDownSelectorNewAttrs } from "../../ui/base/DropDownSelectorNew"
import { Icons } from "../../ui/base/icons/Icons"
import { theme } from "../../ui/theme"
import { Countries, Country } from "./CountryList"

const dropdownCountries = lazyMemoized(() => Countries.map((c) => ({ value: c, name: c.n })))

export function renderCountryDropdown(params: {
	selectedCountry: Country | null
	onSelectionChanged: (country: Country) => void
	helpLabel?: lazy<string>
	label?: MaybeTranslation
}): Children {
	return m(DropDownSelector, {
		label: params.label ?? "invoiceCountry_label",
		helpLabel: params.helpLabel,
		items: [...dropdownCountries(), { value: null, name: lang.get("choose_label"), selectable: false }],
		selectedValue: params.selectedCountry,
		selectionChangedHandler: params.onSelectionChanged,
	})
}

export function renderCountryDropdownNew(params: {
	selectedCountry: Country | null
	onSelectionChanged: (country: Country | null) => void
	helpLabel?: lazy<string>
	label?: MaybeTranslation
}): Children {
	return m(DropDownSelectorNew, {
		label: params.label ?? "invoiceCountry_label",
		helpLabel: params.helpLabel,
		items: [
			...dropdownCountries(),
			{
				value: null,
				name: "",
			},
		],
		selectedValue: params.selectedCountry,
		selectionChangedHandler: params.onSelectionChanged,
		icon: {
			icon: Icons.PlaceFilled,
			color: theme.on_surface_variant,
		},
	} satisfies DropDownSelectorNewAttrs<Country | null>)
}
