import { defer, DeferredObject } from "@tutao/tutanota-utils"

/**
 * This tracker stores the state of the initial sync, after ending processing
 * missed entity updates batches, the sync status will be updated to done and
 * kept as it is until the next login.
 *
 * Additionally, this tracker allows registering listeners to be executed sequentially
 * after the sync is done. The listeners are executed in descending order of priority,
 * i.e., the listener with the highest priority will be executed first.
 */

const TAG = "[SyncTracker]"

export enum SyncDonePriority {
	LOW = 1,
	NORMAL = 2,
	HIGH = 3,
}

export type SyncDoneListener = { onSyncDone: () => Promise<unknown>; priority: SyncDonePriority }

export class SyncTracker {
	private _isSyncDone: boolean = false
	private syncDoneListeners: Set<SyncDoneListener> = new Set()
	private readonly syncDone: DeferredObject<unknown> = defer()

	constructor() {}

	get isSyncDone(): boolean {
		return this._isSyncDone
	}

	addSyncDoneListener(listener: SyncDoneListener) {
		if (this.syncDoneListeners.has(listener)) {
			console.warn(TAG, "Adding the same listener twice!")
		} else {
			this.syncDoneListeners.add(listener)
		}
	}

	removeSyncDoneListener(listener: SyncDoneListener) {
		const wasRemoved = this.syncDoneListeners.delete(listener)
		if (!wasRemoved) {
			console.warn(TAG, "Could not remove listener, possible leak?", listener)
		}
	}

	async markSyncAsDone(): Promise<void> {
		console.log("Initial sync done")
		this._isSyncDone = true
		this.syncDone.resolve(null)

		const listenersByPriorities = Array.from(this.syncDoneListeners).sort(
			(listenerA, listenerB) => listenerB.priority.valueOf() - listenerA.priority.valueOf(),
		)
		for (const listener of listenersByPriorities) {
			await listener.onSyncDone()
		}
	}

	async waitSync(): Promise<void> {
		await this.syncDone.promise
	}
}
