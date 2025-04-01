import { locator } from "../api/main/CommonLocator.js"

export function getSupportUsageTestStage(stageNumber: number) {
	const usageTest = locator.usageTestController.getTest("support")

	usageTest.allowEarlyRestarts = true

	return usageTest.getStage(stageNumber)
}
