import stream from "mithril/stream"
import {ConnectionError} from "../api/common/error/RestError"

export enum LoadingState {
	Idle,
	Loading,
	ConnectionLost
}

export class LoadingStateTracker {

	private readonly state: stream<LoadingState>
	private loadingStateListener: stream<void> | null = null

	constructor(
		initialState: LoadingState = LoadingState.Idle
	) {
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

	async trackPromise<T>(promise: Promise<T>): Promise<T> {
		this.set(LoadingState.Loading)

		let connectionLost = false
		try {
			return await promise
		} catch (e) {
			if (e instanceof ConnectionError) {
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