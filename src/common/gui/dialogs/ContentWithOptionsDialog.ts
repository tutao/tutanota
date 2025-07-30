import m, { Component, Vnode } from "mithril"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { BaseButton } from "../base/buttons/BaseButton"
import { px, size } from "../size"
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
		return m(".flex.flex-column.pb-ml.height-100p.text-break", [
			m("section.flex.flex-column.pt.pb.height-100p.gap-vpad", children),
			m(
				"section.flex.flex-column",
				{ style: { gap: "1em", "margin-top": "auto" } },
				m(BaseButton, {
					label: attrs.mainActionText,
					text: lang.getTranslationText(attrs.mainActionText),
					onclick: attrs.mainActionClick,
					class: "full-width border-radius-m center b flash accent-bg button-content",
					style: {
						height: px(size.button_height + size.vpad_xs * 1.5),
					},
				}),

				attrs.subActionText
					? m(BaseButton, {
							label: attrs.subActionText,
							text: lang.getTranslationText(attrs.subActionText),
							onclick: attrs.subActionClick,
							class: "full-width border-radius-m center b flash",
							style: {
								border: `2px solid ${theme.content_accent}`,
								height: px(size.button_height + size.vpad_xs * 1.5),
								color: theme.content_accent,
							},
						})
					: null,
			),
		])
	}
}
