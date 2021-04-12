//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {SessionTypeRef} from "../api/entities/sys/Session"
import {load, serviceRequestVoid} from "../api/main/Entity"
import {Dialog} from "../gui/base/Dialog"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {createSecondFactorAuthData} from "../api/entities/sys/SecondFactorAuthData"
import {OperationType, SecondFactorType, SessionState} from "../api/common/TutanotaConstants"
import type {TranslationKey} from "./LanguageViewModel"
import {lang} from "./LanguageViewModel"
import {neverNull} from "../api/common/utils/Utils"
import {U2fClient, U2fError, U2fTimeoutError, U2fWrongDeviceError} from "./U2fClient"
import {assertMainOrNode} from "../api/common/Env"
import {AccessBlockedError, BadRequestError, NotAuthenticatedError, NotFoundError} from "../api/common/error/RestError"
import {Icons, SecondFactorImage} from "../gui/base/icons/Icons"
import {locator} from "../api/main/MainLocator"
import {worker} from "../api/main/WorkerClient"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {Icon, progressIcon} from "../gui/base/Icon"
import type {Challenge} from "../api/entities/sys/Challenge"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {theme} from "../gui/theme"
import {createSecondFactorAuthDeleteData} from "../api/entities/sys/SecondFactorAuthDeleteData"
import {isSameId} from "../api/common/utils/EntityUtils";
import {TextFieldN} from "../gui/base/TextFieldN"

assertMainOrNode()

/**
 * Handles showing and hiding of the following dialogs:
 * 1. Waiting for second factor approval (either token or by other client) during login
 * 2. Ask for approving the login on another client (setupAcceptOtherClientLoginListener() must have been called initially). If the dialog is visible and another client tries to login at the same time, that second login is ignored.
 */
export class SecondFactorHandler {
	_otherLoginSessionId: ?IdTuple;
	_otherLoginDialog: ?Dialog;
	_otherLoginListenerInitialized: boolean;

	_waitingForSecondFactorDialog: ?Dialog;

	constructor() {
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
		locator.eventController.addEntityListener((updates) => Promise
			.each(updates, (update) => {
				let sessionId = [neverNull(update.instanceListId), update.instanceId];
				if (isUpdateForTypeRef(SessionTypeRef, update)) {
					if (update.operation === OperationType.CREATE) {
						return load(SessionTypeRef, sessionId)
							.then(session => {
								if (session.state === SessionState.SESSION_STATE_PENDING) {
									if (this._otherLoginDialog != null) {
										this._otherLoginDialog.close()
									}
									this._otherLoginSessionId = session._id
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
											serviceRequestVoid(SysService.SecondFactorAuthService, HttpMethod.POST,
												serviceData)
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
							})
							.catch(NotFoundError, (e) => console.log("Failed to load session", e))
					} else if (update.operation === OperationType.UPDATE && this._otherLoginSessionId
						&& isSameId(this._otherLoginSessionId, sessionId)) {
						return load(SessionTypeRef, sessionId)
							.then(session => {
								if (session.state !== SessionState.SESSION_STATE_PENDING && this._otherLoginDialog
									&& isSameId(neverNull(this._otherLoginSessionId), sessionId)) {
									this._otherLoginDialog.close()
									this._otherLoginSessionId = null
									this._otherLoginDialog = null
								}
							})
							.catch(NotFoundError, (e) => console.log("Failed to load session", e))
					} else if (update.operation === OperationType.DELETE && this._otherLoginSessionId
						&& isSameId(this._otherLoginSessionId, sessionId)) {
						if (this._otherLoginDialog) {
							this._otherLoginDialog.close()
							this._otherLoginSessionId = null
							this._otherLoginDialog = null
						}
					}
				}
			})
			.return())
	}

	closeWaitingForSecondFactorDialog() {
		if (this._waitingForSecondFactorDialog) {
			this._waitingForSecondFactorDialog.close()
			this._waitingForSecondFactorDialog = null
		}
	}

	showWaitingForSecondFactorDialog(sessionId: IdTuple, challenges: Challenge[], mailAddress: ?string) {
		if (!this._waitingForSecondFactorDialog) {
			const u2fChallenge = challenges.find(challenge => challenge.type === SecondFactorType.u2f)
			const otpChallenge = challenges.find(challenge => challenge.type === SecondFactorType.totp)
			const u2fClient = new U2fClient()
			const keys = u2fChallenge ? neverNull(u2fChallenge.u2f).keys : []

			let otpCodeFieldValue = ""
			const otpCodeFieldAttrs = {
				label: "totpCode_label",
				value: stream(otpCodeFieldValue),
				oninput: (value) => otpCodeFieldValue = value.trim(),
				injectionsRight: () => state.otpInProgress ? m(".mr-s", progressIcon()) : null,
			}

			const state: {otpInProgress: bool, u2fError: ?TranslationKey} = {otpInProgress: false, u2fError: null}

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
					.catch(NotAuthenticatedError, () => Dialog.error("loginFailed_msg"))
					.catch(BadRequestError, () => Dialog.error("loginFailed_msg"))
					.catch(AccessBlockedError, () => Dialog.error("loginFailedOften_msg"))
					.finally(() => {
						state.otpInProgress = false
					})
			}

			u2fClient.isSupported().then(u2fSupported => {
				console.log("u2fSupport", u2fSupported)
				const keyForThisDomainExisting = keys.filter(key => key.appId === u2fClient.appId).length > 0
				const canLoginWithU2f = u2fSupported && keyForThisDomainExisting

				const otherDomainAppIds = keys.filter(key => key.appId !== u2fClient.appId).map(key => key.appId)
				const otherLoginDomain = otherDomainAppIds.length > 0
					? appIdToLoginDomain(otherDomainAppIds[0])
					: null
				const cancelAction = () => {
					let auth = createSecondFactorAuthDeleteData()
					auth.session = sessionId
					return serviceRequestVoid(SysService.SecondFactorAuthService, HttpMethod.DELETE, auth)
						.then(() => worker.cancelCreateSession())
						.then(() => this.closeWaitingForSecondFactorDialog())
				}
				this._waitingForSecondFactorDialog = Dialog.showActionDialog({
					title: "",
					allowOkWithReturn: true,
					child: {
						view: () => {
							const {u2fError} = state
							return m("", [
								m("p", [
									m("", lang.get((canLoginWithU2f) || otpChallenge
										? "secondFactorPending_msg"
										: "secondFactorPendingOtherClientOnly_msg")),
								]),
								canLoginWithU2f
									? [
										m(".flex-center", m("img[src=" + SecondFactorImage + "]")), m(".mt", [
											u2fError ?
												[
													m("p.flex.items-center.mb-0", [
														m(".mr-s", m(Icon, {
															icon: Icons.Cancel,
															large: true,
															style: {fill: theme.content_accent}
														})), m("", lang.get(u2fError))
													]),
													m(".flex-end", m(ButtonN, {
															label: "retry_action",
															click: () => doU2f(),
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
				const doU2f = () => {
					state.u2fError = null
					u2fClient.sign(sessionId, neverNull(neverNull(u2fChallenge).u2f)).then(u2fSignatureResponse => {
						let auth = createSecondFactorAuthData()
						auth.type = SecondFactorType.u2f
						auth.session = sessionId
						auth.u2f = u2fSignatureResponse
						return serviceRequestVoid(SysService.SecondFactorAuthService, HttpMethod.POST, auth)
					}).catch(e => {
						// We cannot cancel u2f request but we can ignore the error if no one is listening already.
						if (e instanceof AccessBlockedError && this._waitingForSecondFactorDialog
							&& this._waitingForSecondFactorDialog.visible) {
							Dialog.error("loginFailedOften_msg")
							this.closeWaitingForSecondFactorDialog()
						} else if ((e instanceof U2fError || e instanceof U2fWrongDeviceError || e instanceof U2fTimeoutError)
							&& this._waitingForSecondFactorDialog && this._waitingForSecondFactorDialog.visible) {
							state.u2fError = "couldNotAuthU2f_msg"
						} else if (e instanceof NotAuthenticatedError) {
							Dialog.error("loginFailed_msg")
						}
					}).finally(() => {
						m.redraw()
					})
				}
				if (canLoginWithU2f) {
					doU2f()
				}
			})
		}
	}

}

export const secondFactorHandler: SecondFactorHandler = new SecondFactorHandler()

export function appIdToLoginDomain(appId: string): string {
	let domain = appId.split("/")[2]
	return (domain !== "tutanota.com" ? domain : "mail.tutanota.com")
}
