// @flow

import stream from "mithril/stream/stream.js"
import {Dialog} from "../../gui/base/Dialog"
import {lang} from "../../misc/LanguageViewModel"
import m from "mithril"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {Icons} from "../../gui/base/icons/Icons"
import {ButtonN} from "../../gui/base/ButtonN"

export type WhitelabelImprintAndPrivacySettingsAttrs = {
	privacyStatementUrl: string,
	onPrivacyStatementUrlChanged: ?(string) => mixed,
	imprintUrl: string,
	onImprintUrlChanged: ?(string) => mixed,
}

export class WhitelabelImprintAndPrivacySettings implements MComponent<WhitelabelImprintAndPrivacySettingsAttrs> {
	constructor(vnode: Vnode<WhitelabelImprintAndPrivacySettingsAttrs>) {

	}

	view(vnode: Vnode<WhitelabelImprintAndPrivacySettingsAttrs>): Children {
		const {privacyStatementUrl, onPrivacyStatementUrlChanged, imprintUrl, onImprintUrlChanged} = vnode.attrs

		return [
			this._renderWhitelabelImprintSetting(imprintUrl, onImprintUrlChanged),
			this._renderPrivacyPolicySetting(privacyStatementUrl, onPrivacyStatementUrlChanged)
		]
	}

	_renderPrivacyPolicySetting(privacyStatementUrl: string, onPrivacyStatementUrlChanged: ?(string) => mixed): Children {
		let editPrivacyUrlButtonAttrs = null
		if (onPrivacyStatementUrlChanged) {
			const privacyUrlTextfieldAttrs = {
				label: "privacyPolicyUrl_label",
				value: stream(privacyStatementUrl),
				oninput: (value) => privacyStatementUrl = value.trim()
			}

			editPrivacyUrlButtonAttrs = {
				label: "edit_action",
				click: () => {
					let dialog = Dialog.showActionDialog({
						title: lang.get("privacyLink_label"),
						child: {view: () => m(TextFieldN, privacyUrlTextfieldAttrs)},
						allowOkWithReturn: true,
						okAction: (ok) => {
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
			value: stream(privacyStatementUrl),
			disabled: true,
			injectionsRight: () => [(editPrivacyUrlButtonAttrs) ? m(ButtonN, editPrivacyUrlButtonAttrs) : null],
		}
		return m(TextFieldN, privacyPolicyConfigTextfieldAttrs)
	}

	_renderWhitelabelImprintSetting(imprintUrl: string, onImprintUrlChanged: ?(string) => mixed): Children {
		let editImprintUrlButtonAttrs = null
		if (onImprintUrlChanged) {
			const imprintUrlTextfieldAttrs = {
				label: "imprintUrl_label",
				value: stream(imprintUrl),
				oninput: (value) => imprintUrl = value.trim(),
			}
			editImprintUrlButtonAttrs = {
				label: "edit_action",
				click: () => {
					const dialog = Dialog.showActionDialog({
						title: lang.get("imprintUrl_label"),
						child: {view: () => m(TextFieldN, imprintUrlTextfieldAttrs)},
						allowOkWithReturn: true,
						okAction: (ok) => {
							if (ok) {
								onImprintUrlChanged(imprintUrl)
								dialog.close()
							}
						}
					})
				},
				icon: () => Icons.Edit
			}
		}

		const whitelabelImprintTextfieldAttrs = {
			label: "imprintUrl_label",
			value: stream(imprintUrl),
			disabled: true,
			injectionsRight: () => [(editImprintUrlButtonAttrs) ? m(ButtonN, editImprintUrlButtonAttrs) : null],
		}
		return m(TextFieldN, whitelabelImprintTextfieldAttrs)
	}
}