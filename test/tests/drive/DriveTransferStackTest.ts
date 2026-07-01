import o from "@tutao/otest"
import { calculatePercentage } from "../../../src/applications/drive-app/drive/view/DriveUtils"
import { DriveTransferState } from "../../../src/applications/drive-app/drive/view/DriveTransferController"
import { matchers } from "testdouble"

o.spec("DriveTransferStack", function () {
	o.beforeEach(async function () {})

	o.spec("progress percentage", function () {
		o.test("percentage of huge file sizes should be between 0-100", function () {
			const transfer1: DriveTransferState = {
				id: matchers.anything(),
				type: matchers.anything(),
				filename: matchers.anything(),
				state: "active",
				transferredBytes: 9007199254700000,
				totalBytes: 9007199254740991,
				timeRemainingSec: undefined,
			}
			const transfer2: DriveTransferState = {
				id: matchers.anything(),
				type: matchers.anything(),
				filename: matchers.anything(),
				state: "active",
				transferredBytes: 9007199254000000,
				totalBytes: 9007199254740991,
				timeRemainingSec: undefined,
			}
			const percentage = calculatePercentage([transfer1, transfer2])
			o.check(percentage).satisfies((value) => (value >= 0 && value <= 100 ? { pass: true } : { pass: false, message: "percentage not in range" }))
		})
	})
})
