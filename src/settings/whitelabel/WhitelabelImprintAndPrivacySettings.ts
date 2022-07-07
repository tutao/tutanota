import {Dialog} from "../../gui/base/Dialog"
import {lang} from "../../misc/LanguageViewModel"
import m, {Children, Component, Vnode} from "mithril"
import {TextFieldAttrs, TextFieldN} from "../../gui/base/TextFieldN"
import {Icons} from "../../gui/base/icons/Icons"
import {ButtonAttrs, Button} from "../../gui/base/Button.js"

export type WhitelabelImprintAndPrivacySettingsAttrs = {
	privacyStatementUrl: string
	onPrivacyStatementUrlChanged: ((arg0: string) => unknown) | null
	imprintUrl: string
	onImprintUrlChanged: ((arg0: string) => unknown) | null
}

export class WhitelabelImprintAndPrivacySettings implements Component<WhitelabelImprintAndPrivacySettingsAttrs> {
	constructor(vnode: Vnode<WhitelabelImprintAndPrivacySettingsAttrs>) {
	}

	view(vnode: Vnode<WhitelabelImprintAndPrivacySettingsAttrs>): Children {
		const {privacyStatementUrl, onPrivacyStatementUrlChanged, imprintUrl, onImprintUrlChanged} = vnode.attrs
		return [
			this._renderWhitelabelImprintSetting(imprintUrl, onImprintUrlChanged),
			this._renderPrivacyPolicySetting(privacyStatementUrl, onPrivacyStatementUrlChanged),
		]
	}

	_renderPrivacyPolicySetting(privacyStatementUrl: string, onPrivacyStatementUrlChanged: ((arg0: string) => unknown) | null): Children {
		let editPrivacyUrlButtonAttrs: ButtonAttrs | null = null

		if (onPrivacyStatementUrlChanged) {
			editPrivacyUrlButtonAttrs = {
				label: "edit_action",
				click: () => {
					let dialog = Dialog.showActionDialog({
						title: lang.get("privacyLink_label"),
						child: {
							view: () => m(TextFieldN, {
								label: "privacyPolicyUrl_label",
								value: privacyStatementUrl,
								oninput: (value) => (privacyStatementUrl = value.trim()),
							}),
						},
						allowOkWithReturn: true,
						okAction: ok => {
							if (ok) {
								onPrivacyStatementUrlChanged(privacyStatementUrl)
								dialog.close()
							}
						},
					})
				},
				icon: () => Icons.Edit,
			}
		}

		const privacyPolicyConfigTextfieldAttrs = {
			label: "privacyPolicyUrl_label",
			value: privacyStatementUrl,
			disabled: true,
			injectionsRight: () => [editPrivacyUrlButtonAttrs ? m(Button, editPrivacyUrlButtonAttrs) : null],
		} as const
		return m(TextFieldN, privacyPolicyConfigTextfieldAttrs)
	}

	_renderWhitelabelImprintSetting(imprintUrl: string, onImprintUrlChanged: ((arg0: string) => unknown) | null): Children {
		let editImprintUrlButtonAttrs: ButtonAttrs | null = null

		if (onImprintUrlChanged) {
			editImprintUrlButtonAttrs = {
				label: "edit_action",
				click: () => {
					const dialog = Dialog.showActionDialog({
						title: lang.get("imprintUrl_label"),
						child: {
							view: () => m(TextFieldN, {
								label: "imprintUrl_label",
								value: imprintUrl,
								oninput: value => (imprintUrl = value.trim()),
							}),
						},
						allowOkWithReturn: true,
						okAction: ok => {
							if (ok) {
								onImprintUrlChanged(imprintUrl)
								dialog.close()
							}
						},
					})
				},
				icon: () => Icons.Edit,
			}
		}

		const whitelabelImprintTextfieldAttrs = {
			label: "imprintUrl_label",
			value: imprintUrl,
			disabled: true,
			injectionsRight: () => [editImprintUrlButtonAttrs ? m(Button, editImprintUrlButtonAttrs) : null],
		} as const
		return m(TextFieldN, whitelabelImprintTextfieldAttrs)
	}
}