import {PROGRESS_DONE} from "./ProgressBar.js"
import {WorkerClient, WsConnectionState} from "../../api/main/WorkerClient.js"
import {ExposedCacheStorage} from "../../api/worker/rest/DefaultEntityRestCache.js"
import {LoginListener} from "../../api/main/LoginListener.js"
import {LoginController} from "../../api/main/LoginController.js"
import {OfflineIndicatorAttrs, OfflineIndicatorState} from "./OfflineIndicator.js"
import type {ProgressTracker} from "../../api/main/ProgressTracker.js"

/**
 * the offline indicator must take into account information
 * from multiple different sources:
 * * ws connection state (connected, not connected) from the worker
 * * login state (logged out, partial login, full login)
 * * sync progress
 * * last sync time
 *
 * the state necessary to determine the right indicator state from
 * previous updates from these information sources
 * is maintained in this class
 */
export class OfflineIndicatorViewModel {
	private lastProgress: number = PROGRESS_DONE
	private lastWsState: WsConnectionState = WsConnectionState.connecting
	private lastUpdate: Date | null = null
	/**
	 * keeping this prevents flashing misleading states during login when
	 * the full login succeeded but the ws connection attempt didn't
	 * succeed or fail yet.
	 * wsState is "connecting" both during first connect attempt and after we
	 * disconnected.
	 **/
	private wsWasConnectedBefore: boolean = false
	private callback: () => void = () => {
	}

	constructor(
		private readonly cacheStorage: ExposedCacheStorage,
		private readonly loginListener: LoginListener,
		private readonly worker: WorkerClient,
		private readonly logins: LoginController,
		progressTracker: ProgressTracker
	) {
		logins.waitForFullLogin().then(() => this.cb())

		progressTracker.onProgressUpdate.map(progress => this.onProgressUpdate(progress))
		this.onProgressUpdate(progressTracker.onProgressUpdate())

		this.worker.wsConnection().map(state => this.onWsStateChange(state))
		this.onWsStateChange(this.worker.wsConnection()())
	}

	setCallback(cb: () => void) {
		this.callback = cb
	}

	private cb() {
		this.callback()
	}

	private onProgressUpdate(progress: number): void {
		this.lastProgress = progress
		this.cb()
	}

	private async onWsStateChange(newState: WsConnectionState): Promise<void> {
		this.lastWsState = newState
		if (newState !== WsConnectionState.connected) {
			await this.logins!.waitForPartialLogin()
			const lastUpdate = await this.cacheStorage!.getLastUpdateTime()
			this.lastUpdate = lastUpdate != null
				? new Date(lastUpdate)
				: null

		} else {
			this.wsWasConnectedBefore = true
		}
		this.cb()
	}

	getCurrentAttrs(): OfflineIndicatorAttrs {
		if (this.logins!.isFullyLoggedIn() && this.wsWasConnectedBefore) {
			if (this.lastWsState === WsConnectionState.connected) {
				// normal, full login with a connected websocket
				if (this.lastProgress < PROGRESS_DONE) {
					return {state: OfflineIndicatorState.Synchronizing, progress: this.lastProgress}
				} else {
					return {state: OfflineIndicatorState.Online}
				}
			} else {
				// normal, full login with a disconnected websocket
				return {
					state: OfflineIndicatorState.Offline,
					lastUpdate: this.lastUpdate,
					reconnectAction: () => {
						console.log("try reconnect ws")
						this.worker!.tryReconnectEventBus(true, true, 2000)
					}
				}
			}
		} else {
			// either not fully logged in or the websocket was not connected before
			// in cases where the indicator is visible, this is just offline login.
			if (this.loginListener!.getFullLoginFailed()) {
				return {
					state: OfflineIndicatorState.Offline,
					lastUpdate: this.lastUpdate,
					reconnectAction: () => {
						console.log("try full login")
						this.logins!.retryAsyncLogin().finally(() => this.cb())
					}
				}
			} else {
				// partially logged in, but the last login attempt didn't fail yet
				return {state: OfflineIndicatorState.Connecting}
			}
		}
	}

	/*
	* get the current progress for sync operations
	 */
	getProgress(): number {
		//getting the progress like this ensures that
		// the progress bar and sync percentage are consistent
		const a = this.getCurrentAttrs()
		return a.state === OfflineIndicatorState.Synchronizing
			? a.progress
			: 1
	}
}
