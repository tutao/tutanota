import o from "@tutao/otest"
import { SyncDonePriority, SyncTracker } from "../../../../src/common/api/main/SyncTracker.js"

o.spec("SyncTracker", () => {
	o("should execute listeners in descending order of priority", async () => {
		const syncTracker = new SyncTracker()
		const executionOrder: string[] = []
		let waitSyncResolved = false
		const waitSyncPromise = syncTracker.waitSync().then(() => {
			waitSyncResolved = true
		})

		syncTracker.addSyncDoneListener({
			priority: SyncDonePriority.LOW,
			onSyncDone: async () => {
				executionOrder.push("LOW")
			},
		})
		syncTracker.addSyncDoneListener({
			priority: SyncDonePriority.HIGH,
			onSyncDone: async () => {
				executionOrder.push("HIGH")
			},
		})
		syncTracker.addSyncDoneListener({
			priority: SyncDonePriority.NORMAL,
			onSyncDone: async () => {
				executionOrder.push("NORMAL")
			},
		})

		o(waitSyncResolved).equals(false)
		await syncTracker.markSyncAsDone()
		await waitSyncPromise

		o(executionOrder).deepEquals(["HIGH", "NORMAL", "LOW"])
		o(syncTracker.isSyncDone).equals(true)
		o(waitSyncResolved).equals(true)
	})
})
