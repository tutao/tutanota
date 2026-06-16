import { CacheInfo, LoginFailReason, LoginListener } from "../../../../../platform-kit/base/facades/LoginFacade"
import { SessionType } from "@tutao/app-env"
import { Credentials } from "@tutao/network/types"
import { EventBusClient } from "../../../../../app-kit/local-store/event/EventBusClient"
import { CloseEventBusOption, ConnectMode } from "../../../../../platform-kit/network/Constants"
import { Challenge } from "@tutao/entities/sys"
import { UserFacade } from "../../../../../platform-kit/base/facades/UserFacade"
import { lazy } from "@tutao/utils"

export class DefaultLoginListener implements LoginListener {
	constructor(
		private readonly eventBusClient: lazy<EventBusClient>,
		private readonly mainLoginListener: LoginListener,
		private readonly userFacade: UserFacade,
	) {}

	async onPartialLoginSuccess(_sessionType: SessionType, _cacheInfo: CacheInfo, _credentials: Credentials): Promise<void> {
		// no-op
	}

	async onFullLoginSuccess(sessionType: SessionType, cacheInfo: CacheInfo, credentials: Credentials): Promise<void> {
		await this.mainLoginListener.onFullLoginSuccess(sessionType, cacheInfo, credentials)

		// If we have been fully logged in at least once already (probably expired ephemeral session)
		// then we just reconnect and re-download missing events.
		// For new connections we have special handling.
		const wasFullyLoggedIn = this.userFacade.isFullyLoggedIn()
		if (wasFullyLoggedIn) {
			await this.eventBusClient().connect(ConnectMode.Reconnect)
		} else {
			await this.eventBusClient().connect(ConnectMode.Initial)
		}
	}

	onLoginFailure(reason: LoginFailReason): Promise<void> {
		return this.mainLoginListener.onLoginFailure(reason)
	}

	onSecondFactorChallenge(sessionId: IdTuple, challenges: ReadonlyArray<Challenge>, mailAddress: string | null): Promise<void> {
		return this.mainLoginListener.onSecondFactorChallenge(sessionId, challenges, mailAddress)
	}

	onResetSession() {
		this.eventBusClient().close(CloseEventBusOption.Terminate)
	}
}
