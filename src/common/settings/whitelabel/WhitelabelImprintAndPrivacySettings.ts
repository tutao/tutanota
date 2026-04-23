import { Dialog } from "../../gui/base/Dialog"
import { lang } from "../../misc/LanguageViewModel"
import m, { Children, Component, Vnode } from "mithril"
import { LegacyTextField, LegacyTextFieldType } from "../../gui/base/LegacyTextField.js"
import { Icons } from "../../gui/base/icons/Icons"
import { IconButton } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"

export type WhitelabelImprintAndPrivacySettingsAttrs = {
	privacyStatementUrl: string
	onPrivacyStatementUrlChanged: ((privacyStatementUrl: string) => unknown) | null
	imprintUrl: string
	onImprintUrlChanged: ((imprintUrl: string) => unknown) | null
}

export class WhitelabelImprintAndPrivacySettings implements Component<WhitelabelImprintAndPrivacySettingsAttrs> {
	view(vnode: Vnode<WhitelabelImprintAndPrivacySettingsAttrs>): Children {
		const { privacyStatementUrl, onPrivacyStatementUrlChanged, imprintUrl, onImprintUrlChanged } = vnode.attrs
		return [
			this.renderWhitelabelImprintSetting(imprintUrl, onImprintUrlChanged),
			this.renderPrivacyPolicySetting(privacyStatementUrl, onPrivacyStatementUrlChanged),
		]
	}

	private renderPrivacyPolicySetting(privacyStatementUrl: string, onPrivacyStatementUrlChanged: ((arg0: string) => unknown) | null): Children {
		return m(LegacyTextField, {
			label: "privacyPolicyUrl_label",
			value: privacyStatementUrl,
			isReadOnly: true,
			injectionsRight: () =>
				onPrivacyStatementUrlChanged
					? m(IconButton, {
							title: "edit_action",
							click: () => this.editPrivacyStatementUrl(privacyStatementUrl, onPrivacyStatementUrlChanged),
							icon: Icons.PenFilled,
							size: ButtonSize.Compact,
						})
					: null,
		})
	}

	private editPrivacyStatementUrl(privacyStatementUrl: string, onPrivacyStatementUrlChanged: (arg0: string) => unknown) {
		let dialog = Dialog.showActionDialog({
			title: "privacyLink_label",
			child: {
				view: () =>
					m(LegacyTextField, {
						label: "privacyPolicyUrl_label",
						value: privacyStatementUrl,
						type: LegacyTextFieldType.Url,
						oninput: (value) => (privacyStatementUrl = value.trim()),
					}),
			},
			allowOkWithReturn: true,
			okAction: (ok) => {
				if (ok) {
					onPrivacyStatementUrlChanged(privacyStatementUrl)
					dialog.close()
				}
			},
		})
		return privacyStatementUrl
	}

	private renderWhitelabelImprintSetting(imprintUrl: string, onImprintUrlChanged: ((imprintUrl: string) => unknown) | null): Children {
		return m(LegacyTextField, {
			label: "imprintUrl_label",
			value: imprintUrl,
			isReadOnly: true,
			injectionsRight: () =>
				onImprintUrlChanged
					? m(IconButton, {
							title: "edit_action",
							click: () => this.showEditImprintDialog(imprintUrl, onImprintUrlChanged),
							icon: Icons.PenFilled,
							size: ButtonSize.Compact,
						})
					: null,
		})
	}

	private showEditImprintDialog(imprintUrl: string, onImprintUrlChanged: (imprintUrl: string) => unknown) {
		const dialog = Dialog.showActionDialog({
			title: "imprintUrl_label",
			child: {
				view: () =>
					m(LegacyTextField, {
						label: "imprintUrl_label",
						value: imprintUrl,
						type: LegacyTextFieldType.Url,
						oninput: (value) => (imprintUrl = value.trim()),
					}),
			},
			allowOkWithReturn: true,
			okAction: (ok) => {
				if (ok) {
					onImprintUrlChanged(imprintUrl)
					dialog.close()
				}
			},
		})
		return imprintUrl
	}
}
