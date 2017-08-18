//@flow
import m from "mithril"
import {SessionTypeRef} from "../api/entities/sys/Session"
import {load, serviceRequestVoid} from "../api/main/Entity"
import {Dialog} from "../gui/base/Dialog"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod, isSameTypeRef, isSameId} from "../api/common/EntityFunctions"
import {createSecondFactorAuthData} from "../api/entities/sys/SecondFactorAuthData"
import {OperationType, SessionState, SecondFactorType} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {lang} from "../misc/LanguageViewModel"
import {neverNull} from "../api/common/utils/Utils"
import {SecondFactorImage} from "../gui/base/icons/Icons"
import {U2fClient, U2fWrongDeviceError, U2fError} from "../misc/U2fClient"
import {assertMainOrNode} from "../api/Env"
import {NotAuthenticatedError} from "../api/common/error/RestError"

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
		if (!this._otherLoginListenerInitialized) {
			this._otherLoginListenerInitialized = true
			worker.getEntityEventController().addListener((typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum) => {
				let sessionId = [neverNull(listId), elementId];
				if (isSameTypeRef(typeRef, SessionTypeRef)) {
					if (operation == OperationType.CREATE && this._otherLoginSessionId == null) {
						return load(SessionTypeRef, sessionId).then(session => {
							if (session.state == SessionState.SESSION_STATE_PENDING && this._otherLoginSessionId == null) {
								this._otherLoginSessionId = session._id
								let text = lang.get("secondFactorConfirmLogin_msg", {
									"{clientIdentifier}": session.clientIdentifier,
									"{ipAddress}": session.loginIpAddress
								})
								this._otherLoginDialog = Dialog.smallActionDialog(lang.get("secondFactorConfirmLogin_label"), {
									view: () => m(".text-break.pt", text)
								}, () => {
									let serviceData = createSecondFactorAuthData()
									serviceData.session = session._id
									serviceData.type = null
									serviceRequestVoid(SysService.SecondFactorAuthService, HttpMethod.POST, serviceData)
									if (this._otherLoginDialog) {
										this._otherLoginDialog.close()
										this._otherLoginSessionId = null
										this._otherLoginDialog = null
									}
								})
							}
						})
					} else if (operation == OperationType.UPDATE && this._otherLoginSessionId && isSameId(this._otherLoginSessionId, sessionId)) {
						return load(SessionTypeRef, sessionId).then(session => {
							if (session.state != SessionState.SESSION_STATE_PENDING && this._otherLoginDialog && isSameId(neverNull(this._otherLoginSessionId), sessionId)) {
								this._otherLoginDialog.close()
								this._otherLoginSessionId = null
								this._otherLoginDialog = null
							}
						})
					}
				}
			})
		}
	}

	closeWaitingForSecondFactorDialog() {
		if (this._waitingForSecondFactorDialog) {
			this._waitingForSecondFactorDialog.close()
			this._waitingForSecondFactorDialog = null
		}
	}

	showWaitingForSecondFactorDialog(sessionId: IdTuple, challenges: Challenge[]) {
		if (!this._waitingForSecondFactorDialog) {
			// each challenge returns true if this client supports it, false otherwise
			Promise.map(challenges, challenge => {
				if (challenge.type == SecondFactorType.u2f) {
					let u2fClient = new U2fClient()
					return u2fClient.isSupported().then(supported => {
						if (supported) {
							let registerResumeOnError = () => {
								u2fClient.sign(sessionId, neverNull(challenge.u2f)).then(u2fSignatureResponse => {
									let auth = createSecondFactorAuthData()
									auth.type = SecondFactorType.u2f
									auth.session = sessionId
									auth.u2f = u2fSignatureResponse
									return serviceRequestVoid(SysService.SecondFactorAuthService, HttpMethod.POST, auth)
								}).catch(e => {
									if (e instanceof U2fWrongDeviceError) {
										Dialog.error("u2fAuthUnregisteredDevice_msg")
									} else if (e instanceof U2fError) {
										Dialog.error("u2fUnexpectedError_msg")
									} else if (e instanceof NotAuthenticatedError) {
										Dialog.error("loginFailed_msg")
									}
									if (this._waitingForSecondFactorDialog && this._waitingForSecondFactorDialog.visible) registerResumeOnError()
								})
							}

							registerResumeOnError()
						}
						return supported
					})
				} else {
					return false
				}
			}).reduce((overallResult, currentSupported) => {
				// if any challenge is supported we return true
				return overallResult || currentSupported
			}, false).then(supported => {
				this._waitingForSecondFactorDialog = Dialog.pending((supported) ? "secondFactorPending_msg" : "secondFactorPendingOtherClientOnly_msg", SecondFactorImage)
			})
		}
	}
}

export const secondFactorHandler: SecondFactorHandler = new SecondFactorHandler()