import { defer, DeferredObject } from "@tutao/utils"
import { CacheSyncStatus, ListenerPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"

/**
 * This tracker stores the state of the initial sync, after ending processing
 * missed entity updates batches, the sync status will be updated to OnlineSyncDone and
 * kept as it is as long as the Websocket connection is alive.
 *
 * Additionally, this tracker allows registering listeners to be executed sequentially
 * after the syncStatus changes. The listeners are executed in descending order of priority,
 * i.e., the listener with the highest priority will be executed first.
 *
 * Currently, there are syncDoneListeners, i.e., the listeners with targetStatus=OnlineSyncDone,
 * and listeners to reload the main lists (mail, contact, calendar, drive) that have targetStatus=OnlineSyncOngoing.
 * The syncStatus is set to OnlineSyncOngoing only if the initial work estimate is greater than a certain threshold,
 * otherwise it is set to OnlineSyncOngoingFewUpdates, and the list reloads are not triggered if the work estimate
 * for sync is small.
 *
 * Actions executed by the listeners could still not be awaited and be executed in parallel. (e.g. MailIndexer)
 * The listener only determines the order of execution.
 */

const TAG = "[SyncTracker]"

export type SyncListener = {
	id: string
	// Only invoked when the sync status reaches targetStatus
	onSyncStatusChange: () => Promise<unknown>
	targetStatus: CacheSyncStatus
	priority: ListenerPriority
}

export class SyncTracker {
	private _syncStatus: CacheSyncStatus = CacheSyncStatus.Offline
	private syncListeners: Set<SyncListener> = new Set()
	private readonly syncDone: DeferredObject<unknown> = defer()

	constructor() {}

	get syncStatus(): CacheSyncStatus {
		return this._syncStatus
	}

	get isSyncDone(): boolean {
		return this._syncStatus === CacheSyncStatus.OnlineSyncDone
	}

	addSyncListener(listener: SyncListener) {
		if (!this.syncListeners.has(listener)) {
			this.syncListeners.add(listener)

			// if the status already matches the targetStatus, execute the listener immediately
			if (this._syncStatus === listener.targetStatus) {
				listener.onSyncStatusChange()
			}
		}
	}

	removeSyncListener(listener: SyncListener) {
		const wasRemoved = this.syncListeners.delete(listener)
		if (!wasRemoved) {
			console.log(TAG, "Could not remove listener, possible leak?", listener)
		}
	}

	async updateSyncStatus(syncStatus: CacheSyncStatus): Promise<void> {
		this._syncStatus = syncStatus
		console.log("Sync status changed to", syncStatus)
		if (this.isSyncDone) {
			console.log("Initial sync done")
			this.syncDone.resolve(null)
		}

		const listenersByPriorities = Array.from(this.syncListeners)
			.filter((listener) => listener.targetStatus === syncStatus)
			.sort((listenerA, listenerB) => listenerB.priority.valueOf() - listenerA.priority.valueOf())
		for (const listener of listenersByPriorities) {
			await listener.onSyncStatusChange()
		}
	}

	async waitSync(): Promise<void> {
		await this.syncDone.promise
	}
}
