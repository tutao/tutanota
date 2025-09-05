import m, { Component, Vnode } from "mithril"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import { BaseButton } from "../base/buttons/BaseButton"
import { component_size, px, size } from "../size"
import { theme } from "../theme"

// The subActionText is optional, if null is passed it will not display the second Option
interface ImageWithOptionsDialogAttrs {
	image: string
	titleText: TranslationKey
	messageText: TranslationKey
	mainActionText: TranslationKey
	mainActionClick: () => unknown
	subActionText: TranslationKey | null
	subActionClick: () => unknown
	imageStyle?: Partial<CSSStyleDeclaration>
}

// Returns the layout for this dialog type
export class ImageWithOptionsDialog implements Component<ImageWithOptionsDialogAttrs> {
	view({ attrs }: Vnode<ImageWithOptionsDialogAttrs>) {
		return m(".flex.flex-column.pb-24.height-100p.text-break", [
			m(
				"section",
				m(
					".flex-center.mt-12",
					m("img.pb-16.pt-16.block.height-100p", {
						src: attrs.image,
						alt: "",
						rel: "noreferrer",
						loading: "lazy",
						decoding: "async",
						style: {
							width: "80%",
							...attrs.imageStyle,
						},
					}),
				),
				m("h1.text-center", lang.getTranslationText(attrs.titleText)),
				m("p.text-center", lang.getTranslationText(attrs.messageText)),
			),
			m(
				"section.flex.flex-column",
				{ style: { gap: "1em", "margin-top": "auto" } },
				m(BaseButton, {
					label: attrs.mainActionText,
					text: lang.getTranslationText(attrs.mainActionText),
					onclick: attrs.mainActionClick,
					class: "full-width border-radius-4 center b flash accent-bg button-content",
					style: {
						height: px(component_size.button_height + size.spacing_4 * 1.5),
					},
				}),

				attrs.subActionText
					? m(BaseButton, {
							label: attrs.subActionText,
							text: lang.getTranslationText(attrs.subActionText),
							onclick: attrs.subActionClick,
							class: "full-width border-radius-4 center b flash",
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
