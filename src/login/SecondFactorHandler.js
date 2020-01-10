//@flow
import m from "mithril"
import {SessionTypeRef} from "../api/entities/sys/Session"
import {load, serviceRequestVoid} from "../api/main/Entity"
import {Dialog} from "../gui/base/Dialog"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod, isSameId} from "../api/common/EntityFunctions"
import {createSecondFactorAuthData} from "../api/entities/sys/SecondFactorAuthData"
import {OperationType, SecondFactorType, SessionState} from "../api/common/TutanotaConstants"
import {lang} from "../misc/LanguageViewModel"
import {neverNull} from "../api/common/utils/Utils"
import {U2fClient, U2fError, U2fWrongDeviceError} from "../misc/U2fClient"
import {assertMainOrNode} from "../api/Env"
import {AccessBlockedError, BadRequestError, NotAuthenticatedError, NotFoundError} from "../api/common/error/RestError"
import {SecondFactorImage} from "../gui/base/icons/Icons"
import {TextField} from "../gui/base/TextField"
import {locator} from "../api/main/MainLocator"
import {worker} from "../api/main/WorkerClient"
import {isUpdateForTypeRef} from "../api/main/EventController"
import * as RecoverLoginDialog from "./RecoverLoginDialog"
import {progressIcon} from "../gui/base/Icon"

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
			let u2fChallenge = challenges.find(challenge => challenge.type === SecondFactorType.u2f)
			let otpChallenge = challenges.find(challenge => challenge.type === SecondFactorType.totp)
			let u2fClient = new U2fClient()
			const keys = u2fChallenge ? neverNull(u2fChallenge.u2f).keys : []
			const otpCodeField = new TextField("totpCode_label")
			let showingProgress = false
			const otpClickHandler = () => {
				showingProgress = true
				let auth = createSecondFactorAuthData()
				auth.type = SecondFactorType.totp
				auth.session = sessionId
				auth.otpCode = otpCodeField.value().replace(/ /g, "")
				return serviceRequestVoid(SysService.SecondFactorAuthService, HttpMethod.POST, auth)
					.then(() => {
						this._waitingForSecondFactorDialog && this._waitingForSecondFactorDialog.close()
					})
					.catch(NotAuthenticatedError, () => Dialog.error("loginFailed_msg"))
					.catch(BadRequestError, () => Dialog.error("loginFailed_msg"))
					.catch(AccessBlockedError, () => Dialog.error("loginFailedOften_msg"))
					.finally(() => {
						showingProgress = false
					})
			}

			u2fClient.isSupported().then(u2fSupport => {
				console.log("u2fSupport", u2fSupport)
				let keyForThisDomainExisting = keys.filter(key => key.appId === u2fClient.appId).length > 0
				let otherDomainAppIds = keys.filter(key => key.appId !== u2fClient.appId).map(key => key.appId)
				let otherLoginDomain = otherDomainAppIds.length > 0
					? appIdToLoginDomain(otherDomainAppIds[0])
					: null
				const cancelAction = () => {
					worker.cancelCreateSession()
					this.closeWaitingForSecondFactorDialog()
				}
				this._waitingForSecondFactorDialog = Dialog.showActionDialog({
					title: "",
					allowOkWithReturn: true,
					child: {
						view: () => m("", [
							showingProgress ? m(".mt.flex-center", progressIcon()) : null,
							(u2fSupport && keyForThisDomainExisting)
								? m(".flex-center", m("img[src=" + SecondFactorImage + "]"))
								: null,
							m("p", [
								m(".center", lang.get((u2fSupport && keyForThisDomainExisting) || otpChallenge
									? "secondFactorPending_msg" : "secondFactorPendingOtherClientOnly_msg")),
								otpChallenge ? m(".left.mlr-l", m(otpCodeField)) : null,
							]),
							(otherLoginDomain && !keyForThisDomainExisting && u2fSupport)
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
											RecoverLoginDialog.show(mailAddress, "secondFactor")
											e.preventDefault()
										}
									}, lang.get("recoverAccountAccess_action"))
								])
								: null
						])
					},
					okAction: otpChallenge ? otpClickHandler : null,
					cancelAction: cancelAction
				})
				if (u2fSupport && keyForThisDomainExisting) {
					let registerResumeOnError = () => {
						u2fClient.sign(sessionId, neverNull(neverNull(u2fChallenge).u2f)).then(u2fSignatureResponse => {
							let auth = createSecondFactorAuthData()
							auth.type = SecondFactorType.u2f
							auth.session = sessionId
							auth.u2f = u2fSignatureResponse
							return serviceRequestVoid(SysService.SecondFactorAuthService, HttpMethod.POST, auth)
						}).catch(e => {
							if (e instanceof U2fError) {
								Dialog.error("u2fUnexpectedError_msg")
							} else if (e instanceof AccessBlockedError) {
								Dialog.error("loginFailedOften_msg")
							} else {
								if (e instanceof U2fWrongDeviceError) {
									Dialog.error("u2fAuthUnregisteredDevice_msg")
								} else if (e instanceof NotAuthenticatedError) {
									Dialog.error("loginFailed_msg")
								}
								if (this._waitingForSecondFactorDialog
									&& this._waitingForSecondFactorDialog.visible) {
									registerResumeOnError()
								}
							}
						})
					}
					registerResumeOnError()
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
