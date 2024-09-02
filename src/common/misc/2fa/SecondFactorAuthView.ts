import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../LanguageViewModel"
import { lang } from "../LanguageViewModel"
import { Icon, IconSize, progressIcon } from "../../gui/base/Icon"
import { Icons, SecondFactorImage } from "../../gui/base/icons/Icons"
import { theme } from "../../gui/theme"
import type { Thunk } from "@tutao/tutanota-utils"
import { Autocomplete, TextField } from "../../gui/base/TextField.js"
import { LoginButton } from "../../gui/base/buttons/LoginButton.js"
import { ExternalLink } from "../../gui/base/ExternalLink.js"

type WebauthnState = { state: "init" } | { state: "progress" } | { state: "error"; error: TranslationKey }

type WebauthnAnotherDomainParams = {
	canLogin: false
	otherDomainLoginUrl: string
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
		const { attrs } = vnode
		return m(".flex.col", [
			m("p.center", [lang.get(attrs.webauthn?.canLogin || attrs.otp ? "secondFactorPending_msg" : "secondFactorPendingOtherClientOnly_msg")]),
			this.renderWebauthn(vnode.attrs),
			this._renderOtp(vnode.attrs),
			this._renderRecover(vnode.attrs),
		])
	}

	_renderOtp(attrs: SecondFactorViewAttrs): Children {
		const { otp } = attrs

		if (!otp) {
			return null
		}

		return m(
			".left.mb",
			m(TextField, {
				label: "totpCode_label",
				value: otp.codeFieldValue,
				autocompleteAs: Autocomplete.oneTimeCode,
				oninput: (value) => otp.onValueChanged(value.trim()),
				injectionsRight: () => (otp.inProgress ? m(".mr-s", progressIcon()) : null),
			}),
		)
	}

	renderWebauthn(attrs: SecondFactorViewAttrs): Children {
		const { webauthn } = attrs

		if (!webauthn) {
			return null
		}

		if (webauthn.canLogin) {
			return this.renderWebauthnLogin(webauthn)
		} else {
			return this._renderOtherDomainLogin(webauthn)
		}
	}

	renderWebauthnLogin(webauthn: WebauthnLoginParams): Children {
		let items
		const { state } = webauthn

		const doWebAuthnButton = m(LoginButton, {
			label: "useSecurityKey_action",
			onclick: () => webauthn.doWebauthn(),
		})

		switch (state.state) {
			case "init":
				items = [m(".align-self-center", doWebAuthnButton)]
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
									size: IconSize.Medium,
									style: {
										fill: theme.content_accent,
									},
								}),
							),
							m("", lang.get(state.error)),
						]),
						doWebAuthnButton,
					]),
				]
				break

			default:
				throw new Error()
		}

		return [m(".flex-center", m("img", { src: SecondFactorImage })), m(".mt.flex.col", items)]
	}

	_renderOtherDomainLogin({ otherDomainLoginUrl }: WebauthnAnotherDomainParams): Children {
		const hostname = new URL(otherDomainLoginUrl).hostname
		return [
			lang.get("differentSecurityKeyDomain_msg", {
				"{domain}": hostname,
			}),
			m("br"),
			m(ExternalLink, {
				href: otherDomainLoginUrl,
				text: hostname,
				class: "text-center",
				isCompanySite: false,
			}),
		]
	}

	_renderRecover(attrs: SecondFactorViewAttrs): Children {
		const { onRecover } = attrs

		if (onRecover == null) {
			return null
		}

		return m(".small.text-center.pt", [
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
