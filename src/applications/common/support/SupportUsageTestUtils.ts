import { locator } from "../api/main/CommonLocator.js"

export function getSupportUsageTestStage(stageNumber: number) {
	const isPaidAccount = locator.logins.getUserController().isPaidAccount()
	const usageTest = locator.usageTestController.getTest(isPaidAccount ? "support.paid" : "support.free")

	usageTest.allowEarlyRestarts = true

	return usageTest.getStage(stageNumber)
}
