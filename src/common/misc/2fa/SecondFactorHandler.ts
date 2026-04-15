import m from "mithril"
import { entityUpdateUtils, isSameId, sysTypeRefs } from "@tutao/typeRefs"
import { Dialog } from "../../gui/base/Dialog"
import { assertMainOrNode, OperationType, SessionState } from "@tutao/appEnv"
import { lang } from "../LanguageViewModel"
import { neverNull } from "@tutao/utils"
import { restError } from "@tutao/restClient"
import { EventController } from "../../api/main/EventController"
import type { EntityClient } from "../../api/common/EntityClient"
import { WebauthnClient } from "./webauthn/WebauthnClient"
import { SecondFactorAuthDialog } from "./SecondFactorAuthDialog"
import type { LoginFacade } from "../../api/worker/facades/LoginFacade"
import { DomainConfigProvider } from "../../api/common/DomainConfigProvider.js"

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
		this.eventController.addEntityListener({
			onEntityUpdatesReceived: (updates) => this.entityEventsReceived(updates),
			priority: entityUpdateUtils.OnEntityUpdateReceivedPriority.NORMAL,
		})
	}

	private async entityEventsReceived(updates: ReadonlyArray<entityUpdateUtils.EntityUpdateData>) {
		for (const update of updates) {
			const sessionId: IdTuple = [neverNull(update.instanceListId), update.instanceId]

			if (entityUpdateUtils.isUpdateForTypeRef(sysTypeRefs.SessionTypeRef, update)) {
				if (update.operation === OperationType.CREATE) {
					let session

					try {
						session = await this.entityClient.load(sysTypeRefs.SessionTypeRef, sessionId)
					} catch (e) {
						if (e instanceof restError.NotFoundError) {
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
						session = await this.entityClient.load(sysTypeRefs.SessionTypeRef, sessionId)
					} catch (e) {
						if (e instanceof restError.NotFoundError) {
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

	private showConfirmLoginDialog(session: sysTypeRefs.Session) {
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
			title: "secondFactorConfirmLogin_label",
			child: {
				view: () => m(".text-break.pt-16", text),
			},
			okAction: async () => {
				await this.loginFacade.authenticateWithSecondFactor(
					sysTypeRefs.createSecondFactorAuthData({
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
	async showSecondFactorAuthenticationDialog(sessionId: IdTuple, challenges: ReadonlyArray<sysTypeRefs.Challenge>, mailAddress: string | null) {
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
