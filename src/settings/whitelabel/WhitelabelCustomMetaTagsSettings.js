// @flow

import stream from "mithril/stream/stream.js"
import {Type} from "../../gui/base/TextField"
import {Dialog} from "../../gui/base/Dialog"
import {lang} from "../../misc/LanguageViewModel"
import m from "mithril"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {Icons} from "../../gui/base/icons/Icons"
import {ButtonN} from "../../gui/base/ButtonN"

export type WhitelabelCustomMetaTagsSettingsAttrs = {
	metaTags: string,
	onMetaTagsChanged: ?(string) => mixed,
}

export class WhitelabelCustomMetaTagsSettings implements MComponent<WhitelabelCustomMetaTagsSettingsAttrs> {
	constructor(vnode: Vnode<WhitelabelCustomMetaTagsSettingsAttrs>) {}

	view(vnode: Vnode<WhitelabelCustomMetaTagsSettingsAttrs>): Children {
		const {metaTags, onMetaTagsChanged} = vnode.attrs

		return this._renderCustomMetaTagsSettings(metaTags, onMetaTagsChanged)
	}

	_renderCustomMetaTagsSettings(metaTags: string, onMetaTagsChanged: ?(string) => mixed,): Children {
		let editCustomMetaTagsButtonAttrs = null
		if (onMetaTagsChanged) {
			const metaTagsAttrs = {
				label: "customMetaTags_label",
				value: stream(metaTags),
				type: Type.Area,
				oninput: (value) => {metaTags = value}
			}

			editCustomMetaTagsButtonAttrs = {
				label: "edit_action",
				click: () => {
					let dialog = Dialog.showActionDialog({
						title: lang.get("customMetaTags_label"),
						child: {view: () => m(TextFieldN, metaTagsAttrs)},
						okAction: (ok) => {
							if (ok) {
								onMetaTagsChanged(metaTags)
								dialog.close()
							}
						}
					})
				},
				icon: () => Icons.Edit
			}
		}

		const customMetaTagsDefined = metaTags.length > 0
		const customMetaTagsTextfieldAttrs = {
			label: "customMetaTags_label",
			value: stream(customMetaTagsDefined ? lang.get("activated_label") : lang.get("deactivated_label")),
			disabled: true,
			injectionsRight: () => [(editCustomMetaTagsButtonAttrs) ? m(ButtonN, editCustomMetaTagsButtonAttrs) : null],
		}

		return m(TextFieldN, customMetaTagsTextfieldAttrs)
	}
}