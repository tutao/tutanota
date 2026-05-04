import { assertNotNull } from "@tutao/utils"
import { NoopProgressMonitor, ProgressMonitorInterface } from "../../../../network/ProgressMonitorInterface"
import { ProgressTracker } from "../../main/ProgressTracker"

export function makeTrackedProgressMonitor(tracker: ProgressTracker, totalWork: number): ProgressMonitorInterface {
	if (totalWork < 1) return new NoopProgressMonitor()
	const handle = tracker.registerMonitorSync(totalWork)
	return assertNotNull(tracker.getMonitor(handle))
}
