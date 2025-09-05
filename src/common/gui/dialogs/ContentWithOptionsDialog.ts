import m, { Component, Vnode } from "mithril"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { BaseButton } from "../base/buttons/BaseButton"
import { component_size, px, size } from "../size"
import { theme } from "../theme"

// The subActionText is optional, if null is passed it will not display the second Option
export interface ContentWithOptionsDialogAttrs {
	mainActionText: TranslationKey
	mainActionClick: () => unknown
	subActionText: TranslationKey | null
	subActionClick: () => unknown
}

// Returns the layout for this dialog type
export class ContentWithOptionsDialog implements Component<ContentWithOptionsDialogAttrs> {
	view({ attrs, children }: Vnode<ContentWithOptionsDialogAttrs>) {
		return m(".flex.flex-column.pb-24.height-100p.text-break", [
			m("section.flex.flex-column.pt-16.pb-16.height-100p.gap-16", children),
			m(
				"section.flex.flex-column",
				{ style: { gap: "1em", "margin-top": "auto" } },
				m(BaseButton, {
					label: attrs.mainActionText,
					text: lang.getTranslationText(attrs.mainActionText),
					onclick: attrs.mainActionClick,
					class: "full-width border-radius-8 center b flash accent-bg button-content",
					style: {
						height: px(component_size.button_height + size.spacing_4 * 1.5),
					},
				}),

				attrs.subActionText
					? m(BaseButton, {
							label: attrs.subActionText,
							text: lang.getTranslationText(attrs.subActionText),
							onclick: attrs.subActionClick,
							class: "full-width border-radius-8 center b flash",
							style: {
								border: `2px solid ${theme.primary}`,
								height: px(component_size.button_height + size.spacing_4 * 1.5),
								color: theme.primary,
							},
						})
					: null,
			),
		])
	}
}
