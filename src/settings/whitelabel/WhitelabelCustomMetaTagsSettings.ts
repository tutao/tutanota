import {TextFieldN, TextFieldType} from "../../gui/base/TextFieldN"
import {Dialog} from "../../gui/base/Dialog"
import {lang} from "../../misc/LanguageViewModel"
import m, {Children, Component, Vnode} from "mithril"
import {Icons} from "../../gui/base/icons/Icons"
import {ButtonAttrs, Button} from "../../gui/base/Button.js"

export type WhitelabelCustomMetaTagsSettingsAttrs = {
	metaTags: string
	onMetaTagsChanged: ((arg0: string) => unknown) | null
}

export class WhitelabelCustomMetaTagsSettings implements Component<WhitelabelCustomMetaTagsSettingsAttrs> {
	constructor(vnode: Vnode<WhitelabelCustomMetaTagsSettingsAttrs>) {
	}

	view(vnode: Vnode<WhitelabelCustomMetaTagsSettingsAttrs>): Children {
		const {metaTags, onMetaTagsChanged} = vnode.attrs
		return this._renderCustomMetaTagsSettings(metaTags, onMetaTagsChanged)
	}

	_renderCustomMetaTagsSettings(metaTags: string, onMetaTagsChanged: ((arg0: string) => unknown) | null): Children {
		let editCustomMetaTagsButtonAttrs: ButtonAttrs | null = null

		if (onMetaTagsChanged) {
			editCustomMetaTagsButtonAttrs = {
				label: "edit_action",
				click: () => {
					let dialog = Dialog.showActionDialog({
						title: lang.get("customMetaTags_label"),
						child: {
 							view: () => m(TextFieldN, {
								label: "customMetaTags_label",
								value: metaTags,
								type: TextFieldType.Area,
								oninput: (value: string) => {
									metaTags = value
								},
							}),
						},
						okAction: ok => {
							if (ok) {
								onMetaTagsChanged(metaTags)
								dialog.close()
							}
						},
					})
				},
				icon: () => Icons.Edit,
			}
		}

		const customMetaTagsDefined = metaTags.length > 0
		const customMetaTagsTextfieldAttrs = {
			label: "customMetaTags_label",
			value: customMetaTagsDefined ? lang.get("activated_label") : lang.get("deactivated_label"),
			disabled: true,
			injectionsRight: () => [editCustomMetaTagsButtonAttrs ? m(Button, editCustomMetaTagsButtonAttrs) : null],
		} as const
		return m(TextFieldN, customMetaTagsTextfieldAttrs)
	}
}