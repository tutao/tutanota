import {SecondFactorType} from "../../api/common/TutanotaConstants.js"
import type {Thunk} from "@tutao/tutanota-utils"
import {assertNotNull, firstThrow} from "@tutao/tutanota-utils"
import type {TranslationKey} from "../LanguageViewModel.js"
import {createSecondFactorAuthData} from "../../api/entities/sys/TypeRefs.js"
import {AccessBlockedError, BadRequestError, NotAuthenticatedError} from "../../api/common/error/RestError.js"
import {Dialog} from "../../gui/base/Dialog.js"
import m from "mithril"
import {SecondFactorAuthView} from "./SecondFactorAuthView.js"
import {IWebauthnClient} from "./webauthn/WebauthnClient.js"
import type {Challenge} from "../../api/entities/sys/TypeRefs.js"
import type {LoginFacade} from "../../api/worker/facades/LoginFacade.js"
import {CancelledError} from "../../api/common/error/CancelledError.js"
import {WebauthnError} from "../../api/common/error/WebauthnError.js"
import {appIdToLoginDomain} from "./SecondFactorHandler"

type AuthData = {
	readonly sessionId: IdTuple
	readonly challenges: ReadonlyArray<Challenge>
	readonly mailAddress: string | null
}
type WebauthnState =
	| {state: "init"}
	| {state: "progress"}
	| {state: "error", error: TranslationKey}

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
	private webauthnState: WebauthnState = {state: "init"}
	private otpState: OtpState = {code: "", inProgress: false}

	/** @private */
	private constructor(
		private readonly webauthnClient: IWebauthnClient,
		private readonly loginFacade: LoginFacade,
		private readonly authData: AuthData,
		private readonly onClose: Thunk,
	) {
	}

	/**
	 * @param webauthnClient
	 * @param loginFacade
	 * @param authData
	 * @param onClose will be called when the dialog is closed (one way or another).
	 */
	static show(webauthnClient: IWebauthnClient, loginFacade: LoginFacade, authData: AuthData, onClose: Thunk): SecondFactorAuthDialog {
		const dialog = new SecondFactorAuthDialog(webauthnClient, loginFacade, authData, onClose)

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
			challenge => challenge.type === SecondFactorType.u2f || challenge.type === SecondFactorType.webauthn,
		)

		const otpChallenge = this.authData.challenges.find(challenge => challenge.type === SecondFactorType.totp)
		const u2fSupported = await this.webauthnClient.isSupported()

		console.log("webauthn supported: ", u2fSupported)

		let canLoginWithU2f: boolean
		let otherLoginDomain: string | null
		if (u2fChallenge?.u2f != null && u2fSupported) {
			const {canAttempt, cannotAttempt} = await this.webauthnClient.canAttemptChallenge(u2fChallenge.u2f)
			canLoginWithU2f = canAttempt.length !== 0
			otherLoginDomain = cannotAttempt.length > 0 ? appIdToLoginDomain(firstThrow(cannotAttempt).appId) : null
		} else {
			canLoginWithU2f = false
			otherLoginDomain = null
		}

		const {mailAddress} = this.authData
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
							: otherLoginDomain
								? {
									canLogin: false,
									otherLoginDomain,
								}
								: null,
						otp: otpChallenge
							? {
								codeFieldValue: this.otpState.code,
								inProgress: this.otpState.inProgress,
								onValueChanged: newValue => (this.otpState.code = newValue),
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
			const webauthnResponseData = await this.webauthnClient.authenticate(challenge)
			const authData = createSecondFactorAuthData({
				type: SecondFactorType.webauthn,
				session: sessionId,
				webauthn: webauthnResponseData,
			})
			await this.loginFacade.authenticateWithSecondFactor(authData)
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
		this.close()
		const dialog = await import("../../login/recover/RecoverLoginDialog")
		dialog.show(mailAddress, "secondFactor")
	}
}