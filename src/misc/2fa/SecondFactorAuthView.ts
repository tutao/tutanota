import m, {Children, Component, Vnode} from "mithril"
import type {TranslationKey} from "../LanguageViewModel"
import {lang} from "../LanguageViewModel"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {Icon, progressIcon} from "../../gui/base/Icon"
import {Icons, SecondFactorImage} from "../../gui/base/icons/Icons"
import {theme} from "../../gui/theme"
import type {Thunk} from "@tutao/tutanota-utils"
import {TextFieldN} from "../../gui/base/TextFieldN"
import stream from "mithril/stream"

type WebauthnState =
	| {state: "init"}
	| {state: "progress"}
	| {state: "error", error: TranslationKey}

type WebauthnAnotherDomainParams = {
	canLogin: false
	otherLoginDomain: string
}
type WebauthnLoginParams = {
	canLogin: true
	state: WebauthnState
	doWebauthn: Thunk
}
type WebauthnParams = WebauthnLoginParams | WebauthnAnotherDomainParams
type OtpParams = {
	codeFieldValue: string
	inProgress: boolean
	onValueChanged: (arg0: string) => unknown
}
export type SecondFactorViewAttrs = {
	otp: OtpParams | null
	webauthn: WebauthnParams | null
	onRecover: Thunk | null
}

/** Displays options for second factor authentication. */
export class SecondFactorAuthView implements Component<SecondFactorViewAttrs> {
	view(vnode: Vnode<SecondFactorViewAttrs>): Children {
		const {attrs} = vnode
		return m(".flex.col", [
			m("p.center", [lang.get(attrs.webauthn?.canLogin || attrs.otp ? "secondFactorPending_msg" : "secondFactorPendingOtherClientOnly_msg")]),
			this.renderWebauthn(vnode.attrs),
			this._renderOtp(vnode.attrs),
			this._renderRecover(vnode.attrs),
		])
	}

	_renderOtp(attrs: SecondFactorViewAttrs): Children {
		const {otp} = attrs

		if (!otp) {
			return null
		}

		return m(
			".left.mb",
			m(TextFieldN, {
				label: "totpCode_label",
				value: stream(otp.codeFieldValue),
				oninput: value => otp.onValueChanged(value.trim()),
				injectionsRight: () => (otp.inProgress ? m(".mr-s", progressIcon()) : null),
			}),
		)
	}

	renderWebauthn(attrs: SecondFactorViewAttrs): Children {
		const {webauthn} = attrs

		if (!webauthn) {
			return null
		}

		if (webauthn.canLogin === true) {
			return this.renderWebauthnLogin(webauthn)
		} else {
			return this._renderOtherDomainLogin(webauthn)
		}
	}

	renderWebauthnLogin(webauthn: WebauthnLoginParams): Children {
		let items
		const {state} = webauthn

		switch (state.state) {
			case "init":
				items = [
					m(
						".align-self-center",
						m(ButtonN, {
							label: "useSecurityKey_action",
							click: () => webauthn.doWebauthn(),
							type: ButtonType.Primary,
						}),
					),
				]
				break

			case "progress":
				items = [m(".flex.justify-center", [m(".mr-s", progressIcon()), m("", lang.get("waitingForU2f_msg"))])]
				break

			case "error":
				items = [
					m(".flex.col.items-center", [
						m(".flex.items-center", [
							m(
								".mr-s",
								m(Icon, {
									icon: Icons.Cancel,
									large: true,
									style: {
										fill: theme.content_accent,
									},
								}),
							),
							m("", lang.get(state.error)),
						]),
						m(ButtonN, {
							label: "useSecurityKey_action",
							click: () => webauthn.doWebauthn(),
							type: ButtonType.Primary,
						}),
					]),
				]
				break

			default:
				throw new Error()
		}

		return [m(".flex-center", m("img", {src: SecondFactorImage})), m(".mt.flex.col", items)]
	}

	_renderOtherDomainLogin(attrs: WebauthnAnotherDomainParams): Children {
		const href = `https://${attrs.otherLoginDomain}`
		return m(
			"a",
			{
				href,
			},
			lang.get("differentSecurityKeyDomain_msg", {
				"{domain}": href,
			}),
		)
	}

	_renderRecover(attrs: SecondFactorViewAttrs): Children {
		const {onRecover} = attrs

		if (onRecover == null) {
			return null
		}

		return m(".small.right", [
			m(
				`a[href=#]`,
				{
					onclick: (e: MouseEvent) => {
						onRecover()
						e.preventDefault()
					},
				},
				lang.get("recoverAccountAccess_action"),
			),
		])
	}
}