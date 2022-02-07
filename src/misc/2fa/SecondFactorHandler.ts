import m from "mithril"
import type {Session} from "../../api/entities/sys/Session"
import {SessionTypeRef} from "../../api/entities/sys/Session"
import {Dialog} from "../../gui/base/Dialog"
import {createSecondFactorAuthData} from "../../api/entities/sys/SecondFactorAuthData"
import {OperationType, SessionState} from "../../api/common/TutanotaConstants"
import {lang} from "../LanguageViewModel"
import {neverNull} from "@tutao/tutanota-utils"
import {NotFoundError} from "../../api/common/error/RestError"
import {locator} from "../../api/main/MainLocator"
import type {EntityUpdateData, EventController} from "../../api/main/EventController"
import {isUpdateForTypeRef} from "../../api/main/EventController"
import type {Challenge} from "../../api/entities/sys/Challenge"
import {isSameId} from "../../api/common/utils/EntityUtils"
import {assertMainOrNode} from "../../api/common/Env"
import type {EntityClient} from "../../api/common/EntityClient"
import {IWebauthnClient, WebauthnClient} from "./webauthn/WebauthnClient"
import {SecondFactorAuthDialog} from "./SecondFactorAuthDialog"
import type {LoginFacade} from "../../api/worker/facades/LoginFacade"

assertMainOrNode()

export interface SecondFactorAuthHandler {
	/**
	 * Shows a dialog with possibility to use second factor and with a message that the login can be approved from another client.
	 */
	showSecondFactorAuthenticationDialog(sessionId: IdTuple, challenges: ReadonlyArray<Challenge>, mailAddress: string | null): Promise<void>
}

/**
 * Handles showing and hiding of the following dialogs:
 * 1. Waiting for second factor approval (either token or by other client) during login
 * 2. Ask for approving the login on another client (setupAcceptOtherClientLoginListener() must have been called initially).
 *      If the dialog is visible and another client tries to login at the same time, that second login is ignored.
 */
export class SecondFactorHandler implements SecondFactorAuthHandler {
	readonly _eventController: EventController
	readonly _entityClient: EntityClient
	readonly _webauthnClient: IWebauthnClient
	readonly _loginFacade: LoginFacade
	_otherLoginSessionId: IdTuple | null
	_otherLoginDialog: Dialog | null
	_otherLoginListenerInitialized: boolean
	_waitingForSecondFactorDialog: SecondFactorAuthDialog | null

	constructor(eventController: EventController, entityClient: EntityClient, webauthnClient: IWebauthnClient, loginFacade: LoginFacade) {
		this._eventController = eventController
		this._entityClient = entityClient
		this._webauthnClient = webauthnClient
		this._loginFacade = loginFacade
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
		locator.eventController.addEntityListener(updates => this._entityEventsReceived(updates))
	}

	async _entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>) {
		for (const update of updates) {
			const sessionId: IdTuple = [neverNull(update.instanceListId), update.instanceId]

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
				} else if (update.operation === OperationType.UPDATE && this._otherLoginSessionId && isSameId(this._otherLoginSessionId, sessionId)) {
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

					if (
						session.state !== SessionState.SESSION_STATE_PENDING &&
						this._otherLoginDialog &&
						isSameId(neverNull(this._otherLoginSessionId), sessionId)
					) {
						this._otherLoginDialog.close()

						this._otherLoginSessionId = null
						this._otherLoginDialog = null
					}
				} else if (update.operation === OperationType.DELETE && this._otherLoginSessionId && isSameId(this._otherLoginSessionId, sessionId)) {
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
		let text: string

		if (session.loginIpAddress) {
			text = lang.get("secondFactorConfirmLogin_msg", {
				"{clientIdentifier}": session.clientIdentifier,
				"{ipAddress}": session.loginIpAddress,
			})
		} else {
			text = lang.get("secondFactorConfirmLoginNoIp_msg", {
				"{clientIdentifier}": session.clientIdentifier,
			})
		}

		this._otherLoginDialog = Dialog.showActionDialog({
			title: lang.get("secondFactorConfirmLogin_label"),
			child: {
				view: () => m(".text-break.pt", text),
			},
			okAction: async () => {
				await this._loginFacade.authenticateWithSecondFactor(
					createSecondFactorAuthData({
						session: session._id,
						type: null, // Marker for confirming another session
					}),
				)

				if (this._otherLoginDialog) {
					this._otherLoginDialog.close()

					this._otherLoginSessionId = null
					this._otherLoginDialog = null
				}
			},
		})
		// close the dialog manually after 1 min because the session is not updated if the other client is closed
		let sessionId = session._id
		setTimeout(() => {
			if (this._otherLoginDialog && isSameId(neverNull(this._otherLoginSessionId), sessionId)) {
				this._otherLoginDialog.close()

				this._otherLoginSessionId = null
				this._otherLoginDialog = null
			}
		}, 60 * 1000)
	}

	closeWaitingForSecondFactorDialog() {
		this._waitingForSecondFactorDialog?.close()
		this._waitingForSecondFactorDialog = null
	}

	/**
	 * @inheritDoc
	 */
	async showSecondFactorAuthenticationDialog(sessionId: IdTuple, challenges: ReadonlyArray<Challenge>, mailAddress: string | null) {
		if (this._waitingForSecondFactorDialog) {
			return
		}

		this._waitingForSecondFactorDialog = SecondFactorAuthDialog.show(
			this._webauthnClient,
			this._loginFacade,
			{
				sessionId,
				challenges,
				mailAddress,
			},
			() => {
				this._waitingForSecondFactorDialog = null
			},
		)
	}
}

export function appIdToLoginDomain(appId: string): string {
	// If it's legacy U2F key, get domain from before the path part. Otherwise it's just a domain.
	const domain = appId.endsWith(".json") ? appId.split("/")[2] : appId
	return domain === "tutanota.com" ? "mail.tutanota.com" : domain
}