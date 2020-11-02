// @flow
import m from "mithril"
import {BootstrapFeatureType} from "../api/common/TutanotaConstants"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {liveDataAttrs} from "../api/common/utils/AriaUtils"
import {show} from "./RecoverLoginDialog"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {showTakeOverDialog} from "./TakeOverDeletedAddressDialog"
import {TextFieldN, Type} from "../gui/base/TextFieldN"
import {CheckboxN} from "../gui/base/CheckboxN"

export type LoginFormAttrs = {
	onSubmit: (username: string, password: string) => void,
	mailAddress: Stream<string>,
	password: Stream<string>,
	savePassword?: Stream<boolean>,
	helpText?: TranslationKey | lazy<string>,
	invalidCredentials?: Stream<boolean>,
	showRecoveryOption?: Stream<boolean>,
	accessExpired?: Stream<boolean>
}

export class LoginForm implements MComponent<LoginFormAttrs> {
	view(vnode: Vnode<LoginFormAttrs>): Children {
		const a = vnode.attrs

		const mailAddressFieldAttrs = {
			label: "mailAddress_label",
			value: a.mailAddress,
			autocomplete: 'username',
			type: Type.Email
		}

		const passwordFieldAttrs = {
			label: "password_label",
			value: a.password,
			autocomplete: 'password',
			type: Type.Password
		}

		return m("form", {
			onsubmit: (e) => {
				// do not post the form, the form is just here to enable browser auto-fill
				e.preventDefault()
				// a.onSubmit(a.mailAddress(), a.password())
			},
		}, [
			m(TextFieldN, mailAddressFieldAttrs),
			m(TextFieldN, passwordFieldAttrs),
			(a.savePassword && (!whitelabelCustomizations ||
				whitelabelCustomizations.bootstrapCustomizations.indexOf(BootstrapFeatureType.DisableSavePassword) === -1))
				? m(CheckboxN, {
					label: () => lang.get("storePassword_action"),
					checked: a.savePassword,
					helpLabel: "onlyPrivateComputer_msg"
				})
				: null,
			m(".pt", m(ButtonN, {
				label: 'login_action',
				click: () => a.onSubmit(a.mailAddress(), a.password()),
				type: ButtonType.Login,
			})),
			m("p.center.statusTextColor", m("small" + liveDataAttrs(),
				[
					a.helpText ? lang.getMaybeLazy(a.helpText) : null,
					" ",
					a.invalidCredentials && a.showRecoveryOption && a.invalidCredentials() && a.showRecoveryOption()
						? m('a', {
							href: '/recover',
							onclick: e => {
								m.route.set('/recover')
								show(a.mailAddress(), "password")
								e.preventDefault()
							}
						}, lang.get("recoverAccountAccess_action"))
						: (a.accessExpired && a.accessExpired() ? m('a', {
							href: '/takeover',
							onclick: e => {
								m.route.set('/takeover')
								showTakeOverDialog(a.mailAddress(), a.password())
								e.preventDefault()
							}
						}, lang.get("help_label")) : null)
				])),
		])
	}
}