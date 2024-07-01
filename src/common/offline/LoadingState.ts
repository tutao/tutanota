import stream from "mithril/stream"
import { isOfflineError } from "../api/common/utils/ErrorUtils.js"

export enum LoadingState {
	/** We have not tried to load anything, or the loading is complete */
	Idle,
	/** We are waiting for a resource to load */
	Loading,
	/** We tried to load and got a `ConnectionError` */
	ConnectionLost,
}

/**
 * A utility to track the loaded state of some resource
 * Provides listeners for handling state changes
 */
export class LoadingStateTracker {
	private readonly state: stream<LoadingState>
	private loadingStateListener: stream<void> | null = null

	constructor(initialState: LoadingState = LoadingState.Idle) {
		this.state = stream(initialState)
	}

	get(): LoadingState {
		return this.state()
	}

	isIdle(): boolean {
		return this.get() === LoadingState.Idle
	}

	isLoading(): boolean {
		return this.get() === LoadingState.Loading
	}

	isConnectionLost(): boolean {
		return this.get() === LoadingState.ConnectionLost
	}

	set(state: LoadingState) {
		this.state(state)
	}

	setIdle() {
		this.set(LoadingState.Idle)
	}

	setLoading() {
		this.set(LoadingState.Loading)
	}

	setConnectionLost() {
		this.set(LoadingState.ConnectionLost)
	}

	/**
	 * Follow the state of a promise.
	 * While the promise is not resolved, this will be in `Loading` state
	 * If the promise rejects with a `ConnectionError`, then it will finish in `ConnectionLost` state
	 * Otherwise it will finish in `Idle` state
	 */
	async trackPromise<T>(promise: Promise<T>): Promise<T> {
		this.set(LoadingState.Loading)

		let connectionLost = false
		try {
			return await promise
		} catch (e) {
			if (isOfflineError(e)) {
				connectionLost = true
			}
			throw e
		} finally {
			this.set(connectionLost ? LoadingState.ConnectionLost : LoadingState.Idle)
		}
	}

	setStateChangedListener(listener: (newState: LoadingState) => void) {
		this.clearStateChangedListener()
		this.loadingStateListener = this.state.map(listener)
	}

	clearStateChangedListener() {
		if (this.loadingStateListener != null) {
			this.loadingStateListener.end(true)
			this.loadingStateListener = null
		}
	}
}
