import stream from "mithril/stream"
import { identity } from "@tutao/tutanota-utils"
import Stream from "mithril/stream"

/**
 * This tracker stores the state of the initial sync, after ending processing
 * missed entity updates batches, the sync status will be updated to done and
 * kept as it is until next login.
 */
export class SyncTracker {
	private readonly _isSyncDone: Stream<boolean>

	constructor() {
		this._isSyncDone = stream(false)
	}

	get isSyncDone() {
		return this._isSyncDone.map(identity)
	}

	markSyncAsDone(): void {
		console.log("Initial sync done")
		this._isSyncDone(true)
	}
}
