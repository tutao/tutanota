// @flow
import type {ScheduledId, Scheduler} from "../../common/Scheduler";
import {isTest} from "../../common/Env"

type Processor<T> = (Array<T>) => $Promisable<*>;

/**
 * Collects items to process with a given processor, and delays processing them until none have been received for {@link DEFAULT_PROCESS_DELAY_MS}
 *
 * If the processor callback throws, then the passed in items will be saved and the next time it runs, they will be
 * passed back in again with any new items. It is up to the caller to handle any that it may no longer need
 */
export class BufferingProcessor<T> {
	_scheduler: Scheduler;
	_processor: Processor<T>
	_timeoutId: ?ScheduledId = null;
	_buffer: Array<T> = []
	_isProcessing: boolean
	_delay: number

	constructor(scheduler: Scheduler, processor: Processor<T>, delay: number) {
		this._scheduler = scheduler
		this._processor = processor
		this._isProcessing = false
		this._delay = delay
	}

	add(item: T) {
		this._buffer.push(item)
		this._schedule()
	}

	_schedule() {
		if (this._timeoutId != null) {
			this._scheduler.unschedule(this._timeoutId)
		}

		this._timeoutId = this._scheduler.scheduleIn(this._process.bind(this), this._delay)
	}

	async _process(): Promise<void> {
		if (this._isProcessing) {
			return this._schedule()
		}

		this._timeoutId = null
		this._isProcessing = true

		const batches = this._buffer
		this._buffer = []

		try {
			await this._processor(batches)
		} catch (e) {
			if (!isTest()) {
				console.error("Encountered error when processing buffer:", e)
			}
			// we will try them again in the next schedule
			this._buffer = batches.concat(this._buffer)
		} finally {
			this._isProcessing = false
		}
	}
}