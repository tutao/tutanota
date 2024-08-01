import type { Children, Vnode } from "mithril"
import m from "mithril"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar.js"
import { SecondFactorImage } from "../gui/base/icons/Icons.js"
import { progressIcon } from "../gui/base/Icon.js"
import { lang } from "../misc/LanguageViewModel.js"
import { ButtonType } from "../gui/base/Button.js"
import { BrowserWebauthn } from "../misc/2fa/webauthn/BrowserWebauthn.js"
import { WebAuthnSignChallenge } from "../native/common/generatedipc/WebAuthnSignChallenge.js"
import { stringToBase64 } from "@tutao/tutanota-utils"
import { WebAuthnRegistrationChallenge } from "../native/common/generatedipc/WebAuthnRegistrationChallenge.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"

export interface MobileWebauthnAttrs extends TopLevelAttrs {
	browserWebauthn: BrowserWebauthn
}

/**
 * This is a special view which is not used by the web client
 * directly but is loaded remotely by mobile client.
 * See AndroidWebauthnFacade and IosWebauthnFacade.
 */
export class MobileWebauthnView implements TopLevelView<MobileWebauthnAttrs> {
	oncreate({ attrs }: Vnode<MobileWebauthnAttrs>) {
		if (attrs.args["action"] === "sign") {
			this.authenticate(attrs)
		} else if (attrs.args["action"] === "register") {
			this.register(attrs)
		} else {
			throw new Error("Not implemented")
		}
	}

	view({ attrs }: Vnode<MobileWebauthnAttrs>): Children {
		const headerBarAttrs: DialogHeaderBarAttrs = {
			left: [
				{
					label: "cancel_action",
					click: () => window.close(),
					type: ButtonType.Secondary,
				},
			],
			right: [],
			middle: () => lang.get("u2fSecurityKey_label"),
		}

		return m(
			".mt.flex.col.flex-center.center",
			{
				style: {
					margin: "0 auto",
				},
			},
			[
				m(".flex.col.justify-center", [
					m(DialogHeaderBar, headerBarAttrs),
					m(".flex-center.mt-s", m("img", { src: SecondFactorImage })),
					m(".mt.flex.col", [m(".flex.justify-center", [m(".mr-s", progressIcon()), m("", lang.get("waitingForU2f_msg"))])]),
				]),
			],
		)
	}

	private async getParams(attrs: MobileWebauthnAttrs): Promise<{ challenge: string; cbUrlTemplate: string }> {
		if (!(await attrs.browserWebauthn.isSupported())) {
			throw new Error("Webauthn not supported?")
		}
		const challenge = attrs.args["challenge"]
		if (typeof challenge !== "string") {
			throw new Error("Challenge is not passed")
		}
		const cbUrlTemplate = attrs.args["cbUrl"]
		if (typeof cbUrlTemplate !== "string") {
			throw new Error("cbUrl is not passed")
		}
		return { challenge, cbUrlTemplate }
	}

	private async sendSuccess(value: unknown, cbUrlTemplate: string) {
		await this.sendResultObject({ type: "success", value }, cbUrlTemplate)
	}

	private async sendFailure(e: Error, cbUrlTemplate: string) {
		await this.sendResultObject({ type: "error", name: e.name, stack: e.stack }, cbUrlTemplate)
	}

	private async sendResultObject(result: object, cbUrlTemplate: string) {
		const { encodeValueForNative } = await import("../native/common/NativeLineProtocol.js")
		const serializedResult = encodeValueForNative(result)
		const base64Result = stringToBase64(serializedResult)
		const cbUrl = cbUrlTemplate.replace("{result}", base64Result)
		window.open(cbUrl, "_self")
	}

	async authenticate(attrs: MobileWebauthnAttrs) {
		const { challenge, cbUrlTemplate } = await this.getParams(attrs)
		try {
			const { decodeValueFromNative } = await import("../native/common/NativeLineProtocol.js")
			const rawChallengeObj = decodeValueFromNative(challenge) as WebAuthnSignChallenge
			const signResult = await attrs.browserWebauthn.sign({
				challenge: rawChallengeObj.challenge,
				domain: rawChallengeObj.domain,
				keys: rawChallengeObj.keys,
			})
			await this.sendSuccess(signResult, cbUrlTemplate)
		} catch (e) {
			await this.sendFailure(e, cbUrlTemplate)
		}
	}

	async register(attrs: MobileWebauthnAttrs) {
		const { challenge, cbUrlTemplate } = await this.getParams(attrs)

		try {
			const { decodeValueFromNative } = await import("../native/common/NativeLineProtocol.js")
			const rawChallengeObj = decodeValueFromNative(challenge) as WebAuthnRegistrationChallenge
			const registrationResult = await attrs.browserWebauthn.register({
				challenge: rawChallengeObj.challenge,
				domain: rawChallengeObj.domain,
				name: rawChallengeObj.name,
				displayName: rawChallengeObj.displayName,
				userId: rawChallengeObj.userId,
			})
			await this.sendSuccess(registrationResult, cbUrlTemplate)
		} catch (e) {
			await this.sendFailure(e, cbUrlTemplate)
		}
	}
}
