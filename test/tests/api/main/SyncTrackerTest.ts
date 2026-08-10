import o from "@tutao/otest"
import { SyncTracker } from "../../../../src/applications/common/api/main/SyncTracker.js"
import { ListenerPriority } from "../../../../src/platform-kit/instance-pipeline/utils/EntityUpdateUtils"

o.spec("SyncTracker", () => {
	o("should execute listeners in descending order of priority", async () => {
		const syncTracker = new SyncTracker()
		const executionOrder: string[] = []
		let waitSyncResolved = false
		const waitSyncPromise = syncTracker.waitSync().then(() => {
			waitSyncResolved = true
		})

		syncTracker.addSyncDoneListener({
			id: "testId1",
			priority: ListenerPriority.LOW,
			onSyncDone: async () => {
				executionOrder.push("LOW")
			},
		})
		syncTracker.addSyncDoneListener({
			id: "testId2",
			priority: ListenerPriority.HIGH,
			onSyncDone: async () => {
				executionOrder.push("HIGH")
			},
		})
		syncTracker.addSyncDoneListener({
			id: "testId3",
			priority: ListenerPriority.NORMAL,
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
