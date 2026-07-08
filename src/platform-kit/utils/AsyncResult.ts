export enum AsyncResultStateOptions {
	Pending,
	Complete,
	Failure,
}

type AsyncResultState<T> = {
	state: AsyncResultStateOptions
	promise: Promise<T> | null
	result: T | null
	error: any | null
}

/**
 * Represents a resource that is either not ready, ready, or error
 * Sort of fills a similar role to LazyLoaded, usage is more verbose but also more typesafe. maybe this should be reconciled.
 */
export class AsyncResult<T> {
	_state: AsyncResultState<T>

	constructor(promise: Promise<T>) {
		this._state = pending(promise)
		promise.then((result) => (this._state = complete(result))).catch((error) => (this._state = failure(error)))
	}

	state(): Readonly<AsyncResultState<T>> {
		return this._state
	}
}

function pending<T>(promise: Promise<T>): AsyncResultState<T> {
	return {
		state: AsyncResultStateOptions.Pending,
		promise,
		result: null,
		error: null,
	}
}

function complete<T>(result: T): AsyncResultState<T> {
	return {
		state: AsyncResultStateOptions.Complete,
		promise: null,
		result,
		error: null,
	}
}

function failure<T>(error: any): AsyncResultState<T> {
	return {
		state: AsyncResultStateOptions.Failure,
		promise: null,
		result: null,
		error,
	}
}
