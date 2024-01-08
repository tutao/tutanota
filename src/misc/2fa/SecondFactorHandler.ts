import m from "mithril"
import type { Challenge, Session } from "../../api/entities/sys/TypeRefs.js"
import { createSecondFactorAuthData, SessionTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { Dialog } from "../../gui/base/Dialog"
import { OperationType, SessionState } from "../../api/common/TutanotaConstants"
import { lang } from "../LanguageViewModel"
import { neverNull } from "@tutao/tutanota-utils"
import { NotFoundError } from "../../api/common/error/RestError"
import type { EventController } from "../../api/main/EventController"
import { isSameId } from "../../api/common/utils/EntityUtils"
import { assertMainOrNode } from "../../api/common/Env"
import type { EntityClient } from "../../api/common/EntityClient"
import { WebauthnClient } from "./webauthn/WebauthnClient"
import { SecondFactorAuthDialog } from "./SecondFactorAuthDialog"
import type { LoginFacade } from "../../api/worker/facades/LoginFacade"
import { DomainConfigProvider } from "../../api/common/DomainConfigProvider.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../api/common/utils/EntityUpdateUtils.js"

assertMainOrNode()

/**
 * Handles showing and hiding of the following dialogs:
 * 1. Waiting for second factor approval (either token or by other client) during login
 * 2. Ask for approving the login on another client (setupAcceptOtherClientLoginListener() must have been called initially).
 *      If the dialog is visible and another client tries to login at the same time, that second login is ignored.
 */
export class SecondFactorHandler {
	private otherLoginSessionId: IdTuple | null = null
	private otherLoginDialog: Dialog | null = null
	private otherLoginListenerInitialized: boolean = false
	private waitingForSecondFactorDialog: SecondFactorAuthDialog | null = null

	constructor(
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
		private readonly webauthnClient: WebauthnClient,
		private readonly loginFacade: LoginFacade,
		private readonly domainConfigProvider: DomainConfigProvider,
	) {}

	setupAcceptOtherClientLoginListener() {
		if (this.otherLoginListenerInitialized) {
			return
		}

		this.otherLoginListenerInitialized = true
		this.eventController.addEntityListener((updates) => this.entityEventsReceived(updates))
	}

	private async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>) {
		for (const update of updates) {
			const sessionId: IdTuple = [neverNull(update.instanceListId), update.instanceId]

			if (isUpdateForTypeRef(SessionTypeRef, update)) {
				if (update.operation === OperationType.CREATE) {
					let session

					try {
						session = await this.entityClient.load(SessionTypeRef, sessionId)
					} catch (e) {
						if (e instanceof NotFoundError) {
							console.log("Failed to load session", e)
						} else {
							throw e
						}

						continue
					}

					if (session.state === SessionState.SESSION_STATE_PENDING) {
						if (this.otherLoginDialog != null) {
							this.otherLoginDialog.close()
						}

						this.otherLoginSessionId = session._id

						this.showConfirmLoginDialog(session)
					}
				} else if (update.operation === OperationType.UPDATE && this.otherLoginSessionId && isSameId(this.otherLoginSessionId, sessionId)) {
					let session

					try {
						session = await this.entityClient.load(SessionTypeRef, sessionId)
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
						this.otherLoginDialog &&
						isSameId(neverNull(this.otherLoginSessionId), sessionId)
					) {
						this.otherLoginDialog.close()

						this.otherLoginSessionId = null
						this.otherLoginDialog = null
					}
				} else if (update.operation === OperationType.DELETE && this.otherLoginSessionId && isSameId(this.otherLoginSessionId, sessionId)) {
					if (this.otherLoginDialog) {
						this.otherLoginDialog.close()

						this.otherLoginSessionId = null
						this.otherLoginDialog = null
					}
				}
			}
		}
	}

	private showConfirmLoginDialog(session: Session) {
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

		this.otherLoginDialog = Dialog.showActionDialog({
			title: lang.get("secondFactorConfirmLogin_label"),
			child: {
				view: () => m(".text-break.pt", text),
			},
			okAction: async () => {
				await this.loginFacade.authenticateWithSecondFactor(
					createSecondFactorAuthData({
						session: session._id,
						type: null, // Marker for confirming another session
						otpCode: null,
						u2f: null,
						webauthn: null,
					}),
				)

				if (this.otherLoginDialog) {
					this.otherLoginDialog.close()

					this.otherLoginSessionId = null
					this.otherLoginDialog = null
				}
			},
		})
		// close the dialog manually after 1 min because the session is not updated if the other client is closed
		let sessionId = session._id
		setTimeout(() => {
			if (this.otherLoginDialog && isSameId(neverNull(this.otherLoginSessionId), sessionId)) {
				this.otherLoginDialog.close()

				this.otherLoginSessionId = null
				this.otherLoginDialog = null
			}
		}, 60 * 1000)
	}

	closeWaitingForSecondFactorDialog() {
		this.waitingForSecondFactorDialog?.close()
		this.waitingForSecondFactorDialog = null
	}

	/**
	 * @inheritDoc
	 */
	async showSecondFactorAuthenticationDialog(sessionId: IdTuple, challenges: ReadonlyArray<Challenge>, mailAddress: string | null) {
		if (this.waitingForSecondFactorDialog) {
			return
		}

		this.waitingForSecondFactorDialog = SecondFactorAuthDialog.show(
			this.webauthnClient,
			this.loginFacade,
			this.domainConfigProvider,
			{
				sessionId,
				challenges,
				mailAddress,
			},
			() => {
				this.waitingForSecondFactorDialog = null
			},
		)
	}
}
