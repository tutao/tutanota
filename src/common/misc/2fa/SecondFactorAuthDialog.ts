import { SecondFactorType } from "../../api/common/TutanotaConstants.js"
import type { Thunk } from "@tutao/tutanota-utils"
import { assertNotNull, getFirstOrThrow } from "@tutao/tutanota-utils"
import type { TranslationKey } from "../LanguageViewModel.js"
import type { Challenge } from "../../api/entities/sys/TypeRefs.js"
import { createSecondFactorAuthData } from "../../api/entities/sys/TypeRefs.js"
import { AccessBlockedError, BadRequestError, LockedError, NotAuthenticatedError } from "../../api/common/error/RestError.js"
import { Dialog } from "../../gui/base/Dialog.js"
import m from "mithril"
import { SecondFactorAuthView } from "./SecondFactorAuthView.js"
import { WebauthnClient } from "./webauthn/WebauthnClient.js"
import type { LoginFacade } from "../../api/worker/facades/LoginFacade.js"
import { CancelledError } from "../../api/common/error/CancelledError.js"
import { WebauthnError } from "../../api/common/error/WebauthnError.js"
import { appIdToLoginUrl } from "./SecondFactorUtils.js"

import { DomainConfigProvider } from "../../api/common/DomainConfigProvider.js"

type AuthData = {
	readonly sessionId: IdTuple
	readonly challenges: ReadonlyArray<Challenge>
	readonly mailAddress: string | null
}
type WebauthnState = { state: "init" } | { state: "progress" } | { state: "error"; error: TranslationKey }

type OtpState = {
	code: string
	inProgress: boolean
}

/**
 * Dialog which allows user to use second factor authentication and allows to reset second factor.
 * It will show that the login can be approved form another session and depending on what is supported it
 * might display one or more of:
 *  - WebAuthentication
 *  - TOTP
 *  - login from another domain message
 *  - lost access button
 * */
export class SecondFactorAuthDialog {
	private waitingForSecondFactorDialog: Dialog | null = null
	private webauthnState: WebauthnState = { state: "init" }
	private otpState: OtpState = { code: "", inProgress: false }

	/** @private */
	private constructor(
		private readonly webauthnClient: WebauthnClient,
		private readonly loginFacade: LoginFacade,
		private readonly domainConfigProvider: DomainConfigProvider,
		private readonly authData: AuthData,
		private readonly onClose: Thunk,
	) {}

	/**
	 * @param onClose will be called when the dialog is closed (one way or another).
	 */
	static show(
		webauthnClient: WebauthnClient,
		loginFacade: LoginFacade,
		domainConfigProvider: DomainConfigProvider,
		authData: AuthData,
		onClose: Thunk,
	): SecondFactorAuthDialog {
		const dialog = new SecondFactorAuthDialog(webauthnClient, loginFacade, domainConfigProvider, authData, onClose)

		dialog.show()

		return dialog
	}

	close() {
		if (this.waitingForSecondFactorDialog?.visible) {
			this.waitingForSecondFactorDialog?.close()
		}

		this.webauthnClient.abortCurrentOperation()
		this.waitingForSecondFactorDialog = null

		this.onClose()
	}

	private async show() {
		const u2fChallenge = this.authData.challenges.find(
			(challenge) => challenge.type === SecondFactorType.u2f || challenge.type === SecondFactorType.webauthn,
		)

		const otpChallenge = this.authData.challenges.find((challenge) => challenge.type === SecondFactorType.totp)
		const u2fSupported = await this.webauthnClient.isSupported()

		console.log("webauthn supported: ", u2fSupported)

		let canLoginWithU2f: boolean
		let otherDomainLoginUrl: string | null
		if (u2fChallenge?.u2f != null && u2fSupported) {
			const { canAttempt, cannotAttempt } = await this.webauthnClient.canAttemptChallenge(u2fChallenge.u2f)
			canLoginWithU2f = canAttempt.length !== 0
			// If we don't have any key we can use to log in we need to show a message to attempt the login on another domain.

			if (cannotAttempt.length > 0) {
				const loginUrlString = appIdToLoginUrl(getFirstOrThrow(cannotAttempt).appId, this.domainConfigProvider)
				const loginUrl = new URL(loginUrlString)
				loginUrl.searchParams.set("noAutoLogin", "true")
				otherDomainLoginUrl = loginUrl.toString()
			} else {
				otherDomainLoginUrl = null
			}
		} else {
			canLoginWithU2f = false
			otherDomainLoginUrl = null
		}

		const { mailAddress } = this.authData
		this.waitingForSecondFactorDialog = Dialog.showActionDialog({
			title: "",
			allowOkWithReturn: true,
			child: {
				view: () => {
					return m(SecondFactorAuthView, {
						webauthn: canLoginWithU2f
							? {
									canLogin: true,
									state: this.webauthnState,
									doWebauthn: () => this.doWebauthn(assertNotNull(u2fChallenge)),
							  }
							: otherDomainLoginUrl
							? {
									canLogin: false,
									otherDomainLoginUrl: otherDomainLoginUrl,
							  }
							: null,
						otp: otpChallenge
							? {
									codeFieldValue: this.otpState.code,
									inProgress: this.otpState.inProgress,
									onValueChanged: (newValue) => (this.otpState.code = newValue),
							  }
							: null,
						onRecover: mailAddress ? () => this.recoverLogin(mailAddress) : null,
					})
				},
			},
			okAction: otpChallenge ? () => this.onConfirmOtp() : null,
			cancelAction: () => this.cancel(),
		})
	}

	async onConfirmOtp() {
		this.otpState.inProgress = true
		const authData = createSecondFactorAuthData({
			type: SecondFactorType.totp,
			session: this.authData.sessionId,
			otpCode: this.otpState.code.replace(/ /g, ""),
			u2f: null,
			webauthn: null,
		})

		try {
			await this.loginFacade.authenticateWithSecondFactor(authData)
			this.waitingForSecondFactorDialog?.close()
		} catch (e) {
			if (e instanceof NotAuthenticatedError) {
				Dialog.message("loginFailed_msg")
			} else if (e instanceof BadRequestError) {
				Dialog.message("loginFailed_msg")
			} else if (e in AccessBlockedError) {
				Dialog.message("loginFailedOften_msg")
				this.close()
			} else {
				throw e
			}
		} finally {
			this.otpState.inProgress = false
		}
	}

	private async cancel(): Promise<void> {
		this.webauthnClient.abortCurrentOperation()
		await this.loginFacade.cancelCreateSession(this.authData.sessionId)
		this.close()
	}

	private async doWebauthn(u2fChallenge: Challenge) {
		this.webauthnState = {
			state: "progress",
		}
		const sessionId = this.authData.sessionId
		const challenge = assertNotNull(u2fChallenge.u2f)

		try {
			const { responseData, apiBaseUrl } = await this.webauthnClient.authenticate(challenge)
			const authData = createSecondFactorAuthData({
				type: SecondFactorType.webauthn,
				session: sessionId,
				webauthn: responseData,
				u2f: null,
				otpCode: null,
			})
			await this.loginFacade.authenticateWithSecondFactor(authData, apiBaseUrl)
		} catch (e) {
			if (e instanceof CancelledError) {
				this.webauthnState = {
					state: "init",
				}
			} else if (e instanceof AccessBlockedError && this.waitingForSecondFactorDialog?.visible) {
				Dialog.message("loginFailedOften_msg")
				this.close()
			} else if (e instanceof WebauthnError) {
				console.log("Error during webAuthn: ", e)
				this.webauthnState = {
					state: "error",
					error: "couldNotAuthU2f_msg",
				}
			} else if (e instanceof LockedError) {
				this.webauthnState = {
					state: "init",
				}
				Dialog.message("serviceUnavailable_msg")
			} else if (e instanceof NotAuthenticatedError) {
				this.webauthnState = {
					state: "init",
				}
				Dialog.message("loginFailed_msg")
			} else {
				throw e
			}
		} finally {
			m.redraw()
		}
	}

	private async recoverLogin(mailAddress: string) {
		this.cancel()
		const dialog = await import("../../login/recover/RecoverLoginDialog")
		dialog.show(mailAddress, "secondFactor")
	}
}
