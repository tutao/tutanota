import { TextField, TextFieldType } from "../../gui/base/TextField.js"
import { Dialog } from "../../gui/base/Dialog"
import { lang } from "../../misc/LanguageViewModel"
import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../../gui/base/icons/Icons"
import { IconButton } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"

export type WhitelabelCustomMetaTagsSettingsAttrs = {
	metaTags: string
	onMetaTagsChanged: ((tags: string) => unknown) | null
}

export class WhitelabelCustomMetaTagsSettings implements Component<WhitelabelCustomMetaTagsSettingsAttrs> {
	view(vnode: Vnode<WhitelabelCustomMetaTagsSettingsAttrs>): Children {
		const { metaTags, onMetaTagsChanged } = vnode.attrs
		const customMetaTagsDefined = metaTags.length > 0
		return m(TextField, {
			label: "customMetaTags_label",
			value: customMetaTagsDefined ? lang.get("activated_label") : lang.get("deactivated_label"),
			isReadOnly: true,
			injectionsRight: () =>
				onMetaTagsChanged
					? m(IconButton, {
							title: "edit_action",
							click: () => this.showEditMetaTagsDialog(metaTags, onMetaTagsChanged),
							icon: Icons.Edit,
							size: ButtonSize.Compact,
					  })
					: null,
		})
	}

	private showEditMetaTagsDialog(metaTags: string, onMetaTagsChanged: (tags: string) => unknown) {
		let dialog = Dialog.showActionDialog({
			title: lang.get("customMetaTags_label"),
			child: {
				view: () =>
					m(TextField, {
						label: "customMetaTags_label",
						value: metaTags,
						type: TextFieldType.Area,
						oninput: (value: string) => {
							metaTags = value
						},
					}),
			},
			okAction: (ok) => {
				if (ok) {
					onMetaTagsChanged(metaTags)
					dialog.close()
				}
			},
		})
	}
}
