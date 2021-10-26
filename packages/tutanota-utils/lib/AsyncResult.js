// @flow

type StatePending<T> = {status: "pending", promise: Promise<T>}
type StateComplete<T> = {status: "complete", result: T}
type StateFailure = {status: "failure", error: any}
type AsyncResultState<T> = StatePending<T> | StateComplete<T> | StateFailure

/**
 * Represents a resource that is either not ready, ready, or error
 * Sort of fills a similar role to LazyLoaded, usage is more verbose but also more typesafe. maybe this should be reconciled.
 */
export class AsyncResult<T> {
	_state: AsyncResultState<T>

	constructor(promise: Promise<T>) {
		this._state = pending(promise)
		promise
			.then(result => this._state = complete(result))
			.catch(error => this._state = failure(error))
	}

	state(): $ReadOnly<AsyncResultState<T>> {
		return this._state
	}
}

function pending<T>(promise: Promise<T>): StatePending<T> {
	return {status: "pending", promise}
}

function complete<T>(result: T): StateComplete<T> {
	return {status: "complete", result}
}

function failure(error: any): StateFailure {
	return {status: "failure", error}
}