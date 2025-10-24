import m, { Component, Vnode } from "mithril"
import { DropDownSelector, type DropDownSelectorAttrs, SelectorItemList } from "./base/DropDownSelector"
import { getLanguage, lang, LanguageCode, languageCodeToTag, languageNative } from "../misc/LanguageViewModel"
import { deviceConfig } from "../misc/DeviceConfig"
import { isDesktop } from "../api/common/Env"
import { locator } from "../api/main/CommonLocator"
import { styles } from "./styles"
import { DropDownSelectorLink } from "./base/DropDownSelectorLink"

interface LanguageDropdownAttrs {
	variant: "Link" | "TextField"
}

export class LanguageDropdown implements Component<LanguageDropdownAttrs> {
	private languageItems: SelectorItemList<LanguageCode | null>
	constructor() {
		const actualLanguageItems: SelectorItemList<LanguageCode | null> = languageNative
			.map((language) => {
				return {
					name: language.textName,
					value: language.code,
				}
			})
			.sort((l1, l2) => l1.name.localeCompare(l2.name))

		this.languageItems = actualLanguageItems.concat({
			name: lang.get("automatic_label"),
			value: null,
		})
	}
	view({ attrs: { variant } }: Vnode<LanguageDropdownAttrs>) {
		const languageDropDownAttrs: DropDownSelectorAttrs<LanguageCode | null> = {
			label: "language_label",
			items: this.languageItems,
			// DropdownSelectorN uses `===` to compare items so if the language is not set then `undefined` will not match `null`
			selectedValue: deviceConfig.getLanguage() || null,
			selectionChangedHandler: async (value) => {
				deviceConfig.setLanguage(value)
				const newLanguage = value
					? {
							code: value,
							languageTag: languageCodeToTag(value),
						}
					: getLanguage()
				await lang.setLanguage(newLanguage)

				if (isDesktop()) {
					await locator.desktopSettingsFacade.changeLanguage(newLanguage.code, newLanguage.languageTag)
				}

				styles.updateStyle("main")
				m.redraw()
			},
		}

		return m(variant === "Link" ? DropDownSelectorLink : DropDownSelector, languageDropDownAttrs)
	}
}
