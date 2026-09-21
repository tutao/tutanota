import m, { Component, Vnode } from "mithril"
import { lang, TranslationKey } from "../utils/LanguageViewModel"
import { px } from "../size"
import { DynamicColorSvg } from "../base/DynamicColorSvg.js"
import { Thunk } from "@tutao/utils"
import { Card } from "../base/Card"
import { Icon, IconSize } from "../base/Icon"
import { Icons } from "../base/icons/Icons"
import { PrimaryButton, SecondaryButton } from "../base/buttons/VariantButtons"

// The subActionText is optional, if null is passed it will not display the second Option
interface ImageWithOptionsAndInputDialogAttrs {
	image: string
	titleText: TranslationKey
	messageText: TranslationKey
	mainActionText: TranslationKey
	mainActionClick: Thunk
	onFeedbackTextInput: (text: string) => unknown
	inputTextPlaceholder: TranslationKey
	subActionText: TranslationKey
	subActionClick: Thunk
	imageStyle?: Partial<CSSStyleDeclaration>
}

// Returns the layout for this dialog type
export class ImageWithOptionsAndInputDialog implements Component<ImageWithOptionsAndInputDialogAttrs> {
	private currentText = ""
	view({ attrs }: Vnode<ImageWithOptionsAndInputDialogAttrs>) {
		return m(".flex.flex-column.pb-24.height-100p.text-break.gap-16", [
			m(
				"section",
				m(
					".flex-center.mt-12",
					m(
						".pb-16.pt-16.block",
						{
							style: {
								width: "80%",
								...attrs.imageStyle,
							},
						},
						m(DynamicColorSvg, {
							path: attrs.image,
						}),
					),
				),
				m("h1.text-center", lang.getTranslationText(attrs.titleText)),
				m(".text-center", lang.getTranslationText(attrs.messageText)),
			),
			this.renderInputForm(attrs),
			m(
				".flex.row.gap-8",
				m(SecondaryButton, {
					width: "flex",
					class: "flex-grow",
					label: attrs.mainActionText,
					text: lang.getTranslationText(attrs.subActionText),
					onclick: attrs.subActionClick,
				}),

				m(PrimaryButton, {
					width: "flex",
					class: "flex-grow",
					icon: Icons.SendOutline,
					label: attrs.subActionText,
					disabled: this.currentText.trim() === "" || new RegExp(/^<div( dir=["'][A-z]*["'])?><br><\/div>$/).test(this.currentText),
					text: lang.getTranslationText(attrs.mainActionText),
					onclick: () => {
						attrs.mainActionClick()
					},
				}),
			),
			m(
				".flex.row.gap-4.justify-center.items-center",
				m(Icon, {
					size: IconSize.PX20,
					icon: Icons.GenericLockFilled,
				}),
				m(".small", lang.getTranslationText("feedbackAnonymousAndHelpUs_label")),
			),
		])
	}
	private renderInputForm(attrs: ImageWithOptionsAndInputDialogAttrs) {
		return m(".flex.col.gap-16", [
			m(
				Card,
				{
					classes: ["child-text-editor", "rel", "height-100p"],
					style: {
						padding: "8",
					},
				},
				m(SimpleTextEditor, {
					oninput: (text) => {
						attrs.onFeedbackTextInput(text)
						this.currentText = text
					},
					placeholder: attrs.inputTextPlaceholder,
				}),
			),
		])
	}
}

interface SimpleTextEditorAttrs {
	oninput: (value: string) => void
	placeholder: TranslationKey
}

class SimpleTextEditor implements Component<SimpleTextEditorAttrs> {
	view(vnode: Vnode<SimpleTextEditorAttrs>) {
		return m("textarea.tutaui-text-field", {
			style: { "field-sizing": "content", resize: "none", "min-height": px(250) },
			placeholder: lang.getTranslationText(vnode.attrs.placeholder),
			oninput: (event: InputEvent) => {
				const target = event.target
				vnode.attrs.oninput(target ? (target as HTMLTextAreaElement).value : "")
			},
		})
	}
}
