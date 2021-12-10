// @flow
import {SecondFactorType} from "../../api/common/TutanotaConstants"
import type {Thunk} from "@tutao/tutanota-utils"
import {assertNotNull} from "@tutao/tutanota-utils"
import type {TranslationKey} from "../LanguageViewModel"
import {createSecondFactorAuthData} from "../../api/entities/sys/SecondFactorAuthData"
import {AccessBlockedError, BadRequestError, NotAuthenticatedError} from "../../api/common/error/RestError"
import {Dialog} from "../../gui/base/Dialog"
import m from "mithril"
import {SecondFactorAuthView} from "./SecondFactorAuthView"
import {WebauthnCancelledError, WebauthnClient, WebauthnRecoverableError, WebauthnUnrecoverableError} from "./webauthn/WebauthnClient"
import {appIdToLoginDomain} from "./SecondFactorHandler"
import type {Challenge} from "../../api/entities/sys/Challenge"
import type {LoginFacade} from "../../api/worker/facades/LoginFacade"

type AuthData = {
	+sessionId: IdTuple,
	+challenges: $ReadOnlyArray<Challenge>,
	+mailAddress: ?string,
}
type WebauthnState = {state: "init"} | {state: "progress"} | {state: "error", error: TranslationKey}
type OtpState = {
	code: string,
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
	+_webauthnClient: WebauthnClient
	+_loginFacade: LoginFacade
	+_authData: AuthData
	+_onClose: Thunk

	_webauthnAbortController: ?AbortController
	_waitingForSecondFactorDialog: ?Dialog
	webauthnState: WebauthnState
	otpState: OtpState

	/** @private */
	constructor(webauthnClient: WebauthnClient, loginFacade: LoginFacade, authData: AuthData, onClose: Thunk) {
		this._webauthnClient = webauthnClient
		this._authData = authData
		this._onClose = onClose
		this._loginFacade = loginFacade

		this.webauthnState = {state: "init"}
		this.otpState = {code: "", inProgress: false}
	}

	/**
	 * @param webauthnClient
	 * @param loginFacade
	 * @param authData
	 * @param onClose will be called when the dialog is closed (one way or another).
	 */
	static show(webauthnClient: WebauthnClient, loginFacade: LoginFacade, authData: AuthData, onClose: Thunk): SecondFactorAuthDialog {
		const dialog = new SecondFactorAuthDialog(webauthnClient, loginFacade, authData, onClose)
		dialog._show()
		return dialog
	}

	close() {
		if (this._waitingForSecondFactorDialog?.visible) {
			this._waitingForSecondFactorDialog?.close()
		}
		this._webauthnAbortController?.abort()
		this._waitingForSecondFactorDialog = null
		this._onClose()
	}

	_show() {
		const u2fChallenge = this._authData.challenges.find(challenge =>
			challenge.type === SecondFactorType.u2f || challenge.type === SecondFactorType.webauthn)
		const otpChallenge = this._authData.challenges.find(challenge => challenge.type === SecondFactorType.totp)
		const keys = u2fChallenge ? assertNotNull(u2fChallenge.u2f).keys : []

		const u2fSupported = this._webauthnClient.isSupported()
		console.log("webauthn supported: ", u2fSupported)

		const keyForThisDomainExisting = keys.filter(key => key.appId === this._webauthnClient.rpId).length > 0
		const canLoginWithU2f = u2fSupported && keyForThisDomainExisting
		const otherDomainAppIds = keys.filter(key => key.appId !== this._webauthnClient.rpId).map(key => key.appId)
		const otherLoginDomain = otherDomainAppIds.length > 0
			? appIdToLoginDomain(otherDomainAppIds[0])
			: null

		const {mailAddress} = this._authData

		this._waitingForSecondFactorDialog = Dialog.showActionDialog({
			title: "",
			allowOkWithReturn: true,
			child: {
				view: () => {
					return m(SecondFactorAuthView, {
						webauthn: canLoginWithU2f
							? {
								canLogin: true,
								state: this.webauthnState,
								doWebauthn: () => this._doWebauthn(assertNotNull(u2fChallenge)),
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
								onValueChanged: (newValue) => this.otpState.code = newValue,
							}
							: null,
						onRecover: mailAddress ? () => this._recover(mailAddress) : null,
					})
				}
			},
			okAction: otpChallenge ? () => this._otpClickHandler() : null,
			cancelAction: () => this._cancelAction()
		})

	}

	async _otpClickHandler() {
		this.otpState.inProgress = true
		const authData = createSecondFactorAuthData({
			type: SecondFactorType.totp,
			session: this._authData.sessionId,
			otpCode: this.otpState.code.replace(/ /g, ""),
		})
		try {
			await this._loginFacade.authenticateWithSecondFactor(authData)
			this._waitingForSecondFactorDialog?.close()
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

	async _cancelAction(): Promise<void> {
		this._webauthnAbortController?.abort()
		await this._loginFacade.cancelCreateSession(this._authData.sessionId)
		this.close()
	}

	async _doWebauthn(u2fChallenge: Challenge)  {
		this.webauthnState = {state: "progress"}
		this._webauthnAbortController = new AbortController()
		const abortSignal = this._webauthnAbortController.signal
		abortSignal.addEventListener("abort", () => console.log("aborted webauthn"))

		const sessionId = this._authData.sessionId
		try {
			const webauthnResponseData = await this._webauthnClient.sign(sessionId, assertNotNull(u2fChallenge.u2f), abortSignal)
			const authData = createSecondFactorAuthData({
				type: SecondFactorType.webauthn,
				session: sessionId,
				webauthn: webauthnResponseData,
			})
			await this._loginFacade.authenticateWithSecondFactor(authData)
		} catch (e) {
			if (e instanceof WebauthnCancelledError) {
				this._webauthnAbortController = null
				this.webauthnState = {state: "init"}
			} else if (e instanceof AccessBlockedError && this._waitingForSecondFactorDialog?.visible) {
				Dialog.message("loginFailedOften_msg")
				this.close()
			} else if ((e instanceof WebauthnUnrecoverableError || e instanceof WebauthnRecoverableError)) {
				console.log("Error during webAuthn: ", e)
				this.webauthnState = {state: "error", error: "couldNotAuthU2f_msg"}
			} else if (e instanceof NotAuthenticatedError) {
				Dialog.message("loginFailed_msg")
			} else {
				throw e
			}
		} finally {
			this._webauthnAbortController = null
			m.redraw()
		}
	}

	async _recover(mailAddress: string) {
		this.close()
		const dialog = await import("../../login/recover/RecoverLoginDialog")
		dialog.show(mailAddress, "secondFactor")
	}
}