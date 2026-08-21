import o from "@tutao/otest"
import { SyncTracker } from "../../../../src/applications/common/api/main/SyncTracker.js"
import { CacheSyncStatus, ListenerPriority } from "../../../../src/platform-kit/instance-pipeline/utils/EntityUpdateUtils"

o.spec("SyncTracker", () => {
	o("should execute listeners in descending order of priority", async () => {
		const syncTracker = new SyncTracker()
		const executionOrder: string[] = []
		let waitSyncResolved = false
		const waitSyncPromise = syncTracker.waitSync().then(() => {
			waitSyncResolved = true
		})

		syncTracker.addSyncListener({
			id: "testId1",
			priority: ListenerPriority.LOW,
			onSyncStatusChange: async () => {
				executionOrder.push("LOW")
			},
			targetStatus: CacheSyncStatus.OnlineSyncDone,
		})
		syncTracker.addSyncListener({
			id: "testId2",
			priority: ListenerPriority.HIGH,
			onSyncStatusChange: async () => {
				executionOrder.push("HIGH")
			},
			targetStatus: CacheSyncStatus.OnlineSyncDone,
		})
		syncTracker.addSyncListener({
			id: "testId3",
			priority: ListenerPriority.NORMAL,
			onSyncStatusChange: async () => {
				executionOrder.push("NORMAL")
			},
			targetStatus: CacheSyncStatus.OnlineSyncDone,
		})

		o(waitSyncResolved).equals(false)
		await syncTracker.updateSyncStatus(CacheSyncStatus.OnlineSyncDone)
		await waitSyncPromise

		o(executionOrder).deepEquals(["HIGH", "NORMAL", "LOW"])
		o(syncTracker.syncStatus).equals(CacheSyncStatus.OnlineSyncDone)
		o(waitSyncResolved).equals(true)
	})

	o("should only invoke listeners whose targetStatus matches the new sync status", async () => {
		const syncTracker = new SyncTracker()
		let onlineSyncOngoingCalls = 0
		let onlineSyncDoneCalls = 0

		syncTracker.addSyncListener({
			id: "ongoingListener",
			priority: ListenerPriority.NORMAL,
			onSyncStatusChange: async () => {
				onlineSyncOngoingCalls++
			},
			targetStatus: CacheSyncStatus.OnlineSyncOngoing,
		})
		syncTracker.addSyncListener({
			id: "doneListener",
			priority: ListenerPriority.NORMAL,
			onSyncStatusChange: async () => {
				onlineSyncDoneCalls++
			},
			targetStatus: CacheSyncStatus.OnlineSyncDone,
		})

		await syncTracker.updateSyncStatus(CacheSyncStatus.OnlineSyncOngoingFewUpdates)
		o(onlineSyncOngoingCalls).equals(0)
		o(onlineSyncDoneCalls).equals(0)

		await syncTracker.updateSyncStatus(CacheSyncStatus.OnlineSyncOngoing)
		o(onlineSyncOngoingCalls).equals(1)
		o(onlineSyncDoneCalls).equals(0)

		await syncTracker.updateSyncStatus(CacheSyncStatus.OnlineSyncDone)
		o(onlineSyncOngoingCalls).equals(1)
		o(onlineSyncDoneCalls).equals(1)
	})

	o("should invoke a listener immediately on registration if the current status already matches its targetStatus", async () => {
		const syncTracker = new SyncTracker()
		await syncTracker.updateSyncStatus(CacheSyncStatus.OnlineSyncOngoing)

		let calls = 0
		syncTracker.addSyncListener({
			id: "lateListener",
			priority: ListenerPriority.NORMAL,
			onSyncStatusChange: async () => {
				calls++
			},
			targetStatus: CacheSyncStatus.OnlineSyncOngoing,
		})

		o(calls).equals(1)
	})

	o("should not invoke a listener on registration if the current status does not match its targetStatus", async () => {
		const syncTracker = new SyncTracker()
		await syncTracker.updateSyncStatus(CacheSyncStatus.OnlineSyncOngoingFewUpdates)

		let calls = 0
		syncTracker.addSyncListener({
			id: "lateListener",
			priority: ListenerPriority.NORMAL,
			onSyncStatusChange: async () => {
				calls++
			},
			targetStatus: CacheSyncStatus.OnlineSyncOngoing,
		})

		o(calls).equals(0)
	})

	o("should not invoke a listener after it has been removed", async () => {
		const syncTracker = new SyncTracker()
		let calls = 0
		const listener = {
			id: "removableListener",
			priority: ListenerPriority.NORMAL,
			onSyncStatusChange: async () => {
				calls++
			},
			targetStatus: CacheSyncStatus.OnlineSyncOngoing,
		}
		syncTracker.addSyncListener(listener)
		syncTracker.removeSyncListener(listener)

		await syncTracker.updateSyncStatus(CacheSyncStatus.OnlineSyncOngoing)

		o(calls).equals(0)
	})
})
