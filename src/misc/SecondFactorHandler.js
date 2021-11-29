//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import type {Session} from "../api/entities/sys/Session"
import {SessionTypeRef} from "../api/entities/sys/Session"
import {serviceRequestVoid} from "../api/main/Entity"
import {Dialog} from "../gui/base/Dialog"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {createSecondFactorAuthData} from "../api/entities/sys/SecondFactorAuthData"
import {OperationType, SecondFactorType, SessionState} from "../api/common/TutanotaConstants"
import type {TranslationKey} from "./LanguageViewModel"
import {lang} from "./LanguageViewModel"
import {assertNotNull, neverNull, ofClass} from "@tutao/tutanota-utils"
import {AccessBlockedError, BadRequestError, NotAuthenticatedError, NotFoundError} from "../api/common/error/RestError"
import {Icons, SecondFactorImage} from "../gui/base/icons/Icons"
import {locator} from "../api/main/MainLocator"
import type {EntityUpdateData, EventController} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {Icon, progressIcon} from "../gui/base/Icon"
import type {Challenge} from "../api/entities/sys/Challenge"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {theme} from "../gui/theme"
import {createSecondFactorAuthDeleteData} from "../api/entities/sys/SecondFactorAuthDeleteData"
import {isSameId} from "../api/common/utils/EntityUtils";
import {TextFieldN} from "../gui/base/TextFieldN"
import {assertMainOrNode} from "../api/common/Env"
import type {EntityClient} from "../api/common/EntityClient"
import {WebauthnCancelledError, WebauthnClient, WebauthnRecoverableError, WebauthnUnrecoverableError} from "./webauthn/WebauthnClient"

assertMainOrNode()

export interface SecondFactorAuthHandler {
	/**
	 * Shows a dialog with possibility to use second factor and with a message that the login can be approved from another client.
	 */
	showSecondFactorAuthenticationDialog(sessionId: IdTuple, challenges: $ReadOnlyArray<Challenge>, mailAddress: ?string): Promise<void>;
}

/**
 * Handles showing and hiding of the following dialogs:
 * 1. Waiting for second factor approval (either token or by other client) during login
 * 2. Ask for approving the login on another client (setupAcceptOtherClientLoginListener() must have been called initially). If the dialog is visible and another client tries to login at the same time, that second login is ignored.
 */
export class SecondFactorHandler implements SecondFactorAuthHandler {
	+_eventController: EventController
	+_entityClient: EntityClient
	+_webauthnClient: WebauthnClient

	_otherLoginSessionId: ?IdTuple;
	_otherLoginDialog: ?Dialog;
	_otherLoginListenerInitialized: boolean;
	_waitingForSecondFactorDialog: ?Dialog;
	_webauthnAbortController: ?AbortController;

	constructor(eventController: EventController, entityClient: EntityClient, webauthnClient: WebauthnClient) {
		this._eventController = eventController
		this._entityClient = entityClient
		this._webauthnClient = webauthnClient
		this._otherLoginSessionId = null
		this._otherLoginDialog = null
		this._otherLoginListenerInitialized = false
		this._waitingForSecondFactorDialog = null
	}

	setupAcceptOtherClientLoginListener() {
		if (this._otherLoginListenerInitialized) {
			return
		}
		this._otherLoginListenerInitialized = true
		locator.eventController.addEntityListener((updates) => this._handleEntityUpdates(updates))
	}

	async _handleEntityUpdates(updates: $ReadOnlyArray<EntityUpdateData>) {
		for (const update of updates) {
			let sessionId = [neverNull(update.instanceListId), update.instanceId];
			if (isUpdateForTypeRef(SessionTypeRef, update)) {
				if (update.operation === OperationType.CREATE) {
					let session
					try {
						session = await this._entityClient.load(SessionTypeRef, sessionId)
					} catch (e) {
						if (e instanceof NotFoundError) {
							console.log("Failed to load session", e)
						} else {
							throw e
						}
						continue
					}
					if (session.state === SessionState.SESSION_STATE_PENDING) {
						if (this._otherLoginDialog != null) {
							this._otherLoginDialog.close()
						}
						this._otherLoginSessionId = session._id
						this._showConfirmLoginDialog(session)
					}
				} else if (update.operation === OperationType.UPDATE
					&& this._otherLoginSessionId
					&& isSameId(this._otherLoginSessionId, sessionId)
				) {
					let session
					try {
						session = await this._entityClient.load(SessionTypeRef, sessionId)
					} catch (e) {
						if (e instanceof NotFoundError) {
							console.log("Failed to load session", e)
						} else {
							throw e
						}
						continue
					}
					if (session.state !== SessionState.SESSION_STATE_PENDING && this._otherLoginDialog
						&& isSameId(neverNull(this._otherLoginSessionId), sessionId)) {
						this._otherLoginDialog.close()
						this._otherLoginSessionId = null
						this._otherLoginDialog = null
					}
				} else if (update.operation === OperationType.DELETE
					&& this._otherLoginSessionId
					&& isSameId(this._otherLoginSessionId, sessionId)
				) {
					if (this._otherLoginDialog) {
						this._otherLoginDialog.close()
						this._otherLoginSessionId = null
						this._otherLoginDialog = null
					}
				}
			}
		}
	}

	_showConfirmLoginDialog(session: Session) {
		let text
		if (session.loginIpAddress) {
			text = lang.get("secondFactorConfirmLogin_msg", {
				"{clientIdentifier}": session.clientIdentifier,
				"{ipAddress}": session.loginIpAddress
			})
		} else {
			text = lang.get("secondFactorConfirmLoginNoIp_msg", {
				"{clientIdentifier}": session.clientIdentifier
			})
		}
		this._otherLoginDialog = Dialog.showActionDialog({
			title: lang.get("secondFactorConfirmLogin_label"),
			child: {view: () => m(".text-break.pt", text)},
			okAction: () => {
				let serviceData = createSecondFactorAuthData()
				serviceData.session = session._id
				serviceData.type = null
				serviceRequestVoid(SysService.SecondFactorAuthService, HttpMethod.POST, serviceData)
				if (this._otherLoginDialog) {
					this._otherLoginDialog.close()
					this._otherLoginSessionId = null
					this._otherLoginDialog = null
				}
			}
		})
		// close the dialog manually after 1 min because the session is not updated if the other client is closed
		let sessionId = session._id
		setTimeout(() => {
			if (this._otherLoginDialog
				&& isSameId(neverNull(this._otherLoginSessionId), sessionId)) {
				this._otherLoginDialog.close()
				this._otherLoginSessionId = null
				this._otherLoginDialog = null
			}
		}, 60 * 1000)
	}

	closeWaitingForSecondFactorDialog() {
		if (this._waitingForSecondFactorDialog) {
			this._waitingForSecondFactorDialog.close()
			this._waitingForSecondFactorDialog = null
		}
		this._webauthnAbortController?.abort()
	}

	/**
	 * @inheritDoc
	 */
	async showSecondFactorAuthenticationDialog(sessionId: IdTuple, challenges: $ReadOnlyArray<Challenge>, mailAddress: ?string) {
		if (this._waitingForSecondFactorDialog) {
			return
		}
		const u2fChallenge = challenges.find(challenge =>
			challenge.type === SecondFactorType.u2f || challenge.type === SecondFactorType.webauthn)
		const otpChallenge = challenges.find(challenge => challenge.type === SecondFactorType.totp)
		const keys = u2fChallenge ? assertNotNull(u2fChallenge.u2f).keys : []
		let otpCodeFieldValue = ""
		const otpCodeFieldAttrs = {
			label: "totpCode_label",
			value: stream(otpCodeFieldValue),
			oninput: (value) => otpCodeFieldValue = value.trim(),
			injectionsRight: () => state.otpInProgress ? m(".mr-s", progressIcon()) : null,
		}
		const state: {otpInProgress: bool, webauthnError: ?TranslationKey} = {otpInProgress: false, webauthnError: null}
		const otpClickHandler = () => {
			state.otpInProgress = true
			let auth = createSecondFactorAuthData()
			auth.type = SecondFactorType.totp
			auth.session = sessionId
			auth.otpCode = otpCodeFieldValue.replace(/ /g, "")
			return serviceRequestVoid(SysService.SecondFactorAuthService, HttpMethod.POST, auth)
				.then(() => {
					this._waitingForSecondFactorDialog && this._waitingForSecondFactorDialog.close()
				})
				.catch(ofClass(NotAuthenticatedError, () => Dialog.message("loginFailed_msg")))
				.catch(ofClass(BadRequestError, () => Dialog.message("loginFailed_msg")))
				.catch(ofClass(AccessBlockedError, () => Dialog.message("loginFailedOften_msg")))
				.finally(() => {
					state.otpInProgress = false
				})
		}
		const u2fSupported = this._webauthnClient.isSupported()
		console.log("webauthn supported: ", u2fSupported)
		const keyForThisDomainExisting = keys.filter(key => key.appId === this._webauthnClient.rpId).length > 0
		const canLoginWithU2f = u2fSupported && keyForThisDomainExisting
		const otherDomainAppIds = keys.filter(key => key.appId !== this._webauthnClient.rpId).map(key => key.appId)
		const otherLoginDomain = otherDomainAppIds.length > 0
			? appIdToLoginDomain(otherDomainAppIds[0])
			: null

		const cancelAction = () => {
			this._webauthnAbortController?.abort()
			let auth = createSecondFactorAuthDeleteData()
			auth.session = sessionId
			return serviceRequestVoid(SysService.SecondFactorAuthService, HttpMethod.DELETE, auth)
				.then(() => locator.loginFacade.cancelCreateSession())
				.then(() => this.closeWaitingForSecondFactorDialog())
		}

		this._waitingForSecondFactorDialog = Dialog.showActionDialog({
			title: "",
			allowOkWithReturn: true,
			child: {
				view: () => {
					const {webauthnError} = state
					return m("", [
						m("p", [
							m("", lang.get((canLoginWithU2f) || otpChallenge
								? "secondFactorPending_msg"
								: "secondFactorPendingOtherClientOnly_msg")),
						]),
						canLoginWithU2f
							? [
								m(".flex-center", m("img[src=" + SecondFactorImage + "]")), m(".mt", [
									webauthnError ?
										[
											m("p.flex.items-center.mb-0", [
												m(".mr-s", m(Icon, {
													icon: Icons.Cancel,
													large: true,
													style: {fill: theme.content_accent}
												})), m("", lang.get(webauthnError))
											]),
											m(".flex-end", m(ButtonN, {
													label: "retry_action",
													click: () => doWebauthn(),
													type: ButtonType.Secondary,
												})
											),
										]
										: m(".flex.items-center", [
											m(".mr-s", progressIcon()),
											m("", lang.get("waitingForU2f_msg"))
										]),
								])
							]
							: null,
						otpChallenge ? m(".left.mb", m(TextFieldN, otpCodeFieldAttrs)) : null,
						(otherLoginDomain && !keyForThisDomainExisting && u2fSupported)
							? m("a", {
								href: "https://" + otherLoginDomain
							}, lang.get("differentSecurityKeyDomain_msg", {"{domain}": "https://" + otherLoginDomain}))
							: null,
						(mailAddress)
							? m(".small.right", [
								m(`a[href=#]`, {
									onclick: (e) => {
										cancelAction()
										this._waitingForSecondFactorDialog && this._waitingForSecondFactorDialog.close()
										import("../login/recover/RecoverLoginDialog")
											.then((dialog) => dialog.show(mailAddress, "secondFactor"))
										e.preventDefault()
									}
								}, lang.get("recoverAccountAccess_action"))
							])
							: null
					])
				}
			},
			okAction: otpChallenge ? otpClickHandler : null,
			cancelAction: cancelAction
		})

		const doWebauthn = async () => {
			state.webauthnError = null
			this._webauthnAbortController = new AbortController()
			const abortSignal = this._webauthnAbortController.signal
			abortSignal.addEventListener("abort", () => console.log("aborted webauthn"))
			try {
				const webauthnResponseData = await this._webauthnClient.sign(sessionId, assertNotNull(u2fChallenge?.u2f), abortSignal)
				const authData = createSecondFactorAuthData({
					type: SecondFactorType.webauthn,
					session: sessionId,
					webauthn: webauthnResponseData,
				})
				await serviceRequestVoid(SysService.SecondFactorAuthService, HttpMethod.POST, authData)
			} catch (e) {
				if (e instanceof WebauthnCancelledError) {
					// If the dialog was not visible we don't care whether it was aborted or not
					if (this._waitingForSecondFactorDialog) {
						this._webauthnAbortController = null
						doWebauthn()
					}
				} else if (e instanceof AccessBlockedError && this._waitingForSecondFactorDialog?.visible) {
					Dialog.message("loginFailedOften_msg")
					this._webauthnAbortController?.abort()
					this.closeWaitingForSecondFactorDialog()
				} else if (e instanceof WebauthnUnrecoverableError) {
					console.log(e)
					Dialog.message("couldNotAuthU2f_msg")
				} else if (e instanceof WebauthnRecoverableError && this._waitingForSecondFactorDialog?.visible) {
					console.log("Error during webAuthn: ", e)
					state.webauthnError = "couldNotAuthU2f_msg"
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
		if (canLoginWithU2f) {
			doWebauthn()
		}
	}
}


export function appIdToLoginDomain(appId: string): string {
	let domain = appId.split("/")[2]
	return (domain !== "tutanota.com" ? domain : "mail.tutanota.com")
}
