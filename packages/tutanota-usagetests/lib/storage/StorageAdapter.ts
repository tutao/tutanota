import {UsageTest} from "../model/UsageTest.js"
import {Stage} from "../model/Stage.js"


export interface StorageAdapter {
	/**
	 * Returns active usage tests with the logged-in user's assignments.
	 */
	loadActiveUsageTests(): Promise<UsageTest[]>
}


export class DummyDataStorageAdapter implements StorageAdapter {
	loadActiveUsageTests(): Promise<UsageTest[]> {
		const usageTest = new UsageTest("t123", 1)
		usageTest.addStage(new Stage(0, usageTest, new Set<string>(["testMetric"])))

		return Promise.resolve([usageTest])
	}
}