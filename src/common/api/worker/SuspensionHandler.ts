import type { DeferredObject } from "@tutao/tutanota-utils"
import { defer, noOp } from "@tutao/tutanota-utils"
import type { SystemTimeout } from "../common/utils/Scheduler.js"
import { ServiceUnavailableError, TooManyRequestsError } from "../common/error/RestError"

export class SuspensionHandler {
	_isSuspended: boolean
	_suspendedUntil: number
	_deferredRequests: Array<DeferredObject<any>>
	_hasSentInfoMessage: boolean

	constructor(
		private readonly timeout: SystemTimeout,
		private readonly suspensionCallback: () => unknown,
	) {
		this._isSuspended = false
		this._suspendedUntil = 0
		this._deferredRequests = []
		this._hasSentInfoMessage = false
	}

	/**
	 * Activates suspension states for the given amount of seconds. After the end of the suspension time all deferred requests are executed.
	 */
	// if already suspended do we want to ignore incoming suspensions?
	activateSuspensionIfInactive(suspensionDurationSeconds: number, resourceURL: URL) {
		if (!this.isSuspended()) {
			console.log(`Activating suspension (${resourceURL}):  ${suspensionDurationSeconds}s`)
			this._isSuspended = true
			const suspensionStartTime = Date.now()

			this.timeout.setTimeout(async () => {
				this._isSuspended = false
				console.log(`Suspension released after ${(Date.now() - suspensionStartTime) / 1000}s`)
				await this._onSuspensionComplete()
			}, suspensionDurationSeconds * 1000)

			if (!this._hasSentInfoMessage) {
				this.suspensionCallback()

				this._hasSentInfoMessage = true
			}
		}
	}

	isSuspended(): boolean {
		return this._isSuspended
	}

	/**
	 * Adds a request to the deferred queue.
	 * @param request
	 * @returns {Promise<T>}
	 */
	deferRequest(request: () => Promise<any>): Promise<any> {
		if (this._isSuspended) {
			const deferredObject = defer()

			this._deferredRequests.push(deferredObject)

			// assign request promise to deferred object
			deferredObject.promise = deferredObject.promise.then(() => request())
			return deferredObject.promise
		} else {
			// if suspension is not activated then immediately execute the request
			return request()
		}
	}

	async _onSuspensionComplete() {
		const deferredRequests = this._deferredRequests
		this._deferredRequests = []

		// do wee need to delay those requests?
		for (let deferredRequest of deferredRequests) {
			deferredRequest.resolve(null)
			// Ignore all errors here, any errors should be caught by whoever is handling the deferred request
			await deferredRequest.promise.catch(noOp)
		}
	}
}

export function isSuspensionResponse(statusCode: number, suspensionTimeNumberString: string | null): boolean {
	return Number(suspensionTimeNumberString) > 0 && (statusCode === TooManyRequestsError.CODE || statusCode === ServiceUnavailableError.CODE)
}
