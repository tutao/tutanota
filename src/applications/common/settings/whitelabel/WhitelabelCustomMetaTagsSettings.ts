import { LegacyTextField, LegacyTextFieldType } from "../../../../ui/base/LegacyTextField.js"
import { Dialog } from "../../../../ui/base/Dialog"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../../../../ui/base/icons/Icons"
import { IconButton } from "../../../../ui/base/IconButton.js"
import { ButtonSize } from "../../../../ui/base/ButtonSize.js"

export type WhitelabelCustomMetaTagsSettingsAttrs = {
	metaTags: string
	onMetaTagsChanged: ((tags: string) => unknown) | null
}

export class WhitelabelCustomMetaTagsSettings implements Component<WhitelabelCustomMetaTagsSettingsAttrs> {
	view(vnode: Vnode<WhitelabelCustomMetaTagsSettingsAttrs>): Children {
		const { metaTags, onMetaTagsChanged } = vnode.attrs
		const customMetaTagsDefined = metaTags.length > 0
		return m(LegacyTextField, {
			label: "customMetaTags_label",
			value: customMetaTagsDefined ? lang.get("activated_label") : lang.get("deactivated_label"),
			isReadOnly: true,
			injectionsRight: () =>
				onMetaTagsChanged
					? m(IconButton, {
							label: "edit_action",
							click: () => this.showEditMetaTagsDialog(metaTags, onMetaTagsChanged),
							icon: Icons.PenFilled,
							size: ButtonSize.Compact,
						})
					: null,
		})
	}

	private showEditMetaTagsDialog(metaTags: string, onMetaTagsChanged: (tags: string) => unknown) {
		let dialog = Dialog.showActionDialog({
			title: "customMetaTags_label",
			child: {
				view: () =>
					m(LegacyTextField, {
						label: "customMetaTags_label",
						value: metaTags,
						type: LegacyTextFieldType.Area,
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
