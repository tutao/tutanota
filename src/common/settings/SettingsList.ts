import m, { Children, Component, Vnode } from "mithril"
import { lang, Translation } from "../misc/LanguageViewModel"
import { styles } from "../gui/styles"
import { theme } from "../gui/theme"
import { SettingsNavButton, SettingsNavButtonAttrs } from "../../calendar-app/gui/SettingsNavButton"
import { lazyStringValue } from "@tutao/utils"
import { NavButtonAttrs } from "../gui/base/NavButton"

export interface SettingsListSection {
	name: Translation
	items: readonly NavButtonAttrs[]
}

export interface SettingsListAttrs {
	sections: readonly SettingsListSection[]
}

/**
 * Displays a list of settings categories with items in it
 */
export class SettingsList implements Component<SettingsListAttrs> {
	view({ attrs: { sections } }: Vnode<SettingsListAttrs>): Children {
		return m(
			".flex.col",
			sections.map(({ items, name: sectionName }) => {
				return m(
					".flex.col.pl-16.pt-8.pb-8",
					{
						class: styles.isSingleColumnLayout() ? "pr-16" : "pr-8",
					},
					[
						m("small.uppercase.pb-8.b.text-ellipsis", { style: { color: theme.on_surface_variant } }, lang.getTranslationText(sectionName)),
						m(
							".flex.col.border-radius-8.list-bg",
							items.map((item) => {
								return m(SettingsNavButton, {
									label: item.label,
									click: item.click ?? (() => null),
									icon: item.icon,
									href: lazyStringValue(item.href),
									class: "settings-item",
								} satisfies SettingsNavButtonAttrs)
							}),
						),
					],
				)
			}),
		)
	}
}
