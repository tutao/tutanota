import {createUsageTestAssignmentPostIn} from "../api/entities/sys/UsageTestAssignmentPostIn.js"
import {SysService} from "../api/entities/sys/Services.js"
import {HttpMethod} from "../api/common/EntityFunctions.js"
import {UsageTestAssignmentPostOutTypeRef} from "../api/entities/sys/UsageTestAssignmentPostOut.js"
import {PingAdapter, Stage, StorageAdapter, UsageTest} from "@tutao/tutanota-usagetests"
import {serviceRequest} from "../api/main/ServiceRequest"
import {createUsageTestParticipationPostIn} from "../api/entities/sys/UsageTestParticipationPostIn"
import {UsageTestParticipationPostOutTypeRef} from "../api/entities/sys/UsageTestParticipationPostOut"
import {createUsageTestPingData} from "../api/entities/sys/UsageTestPingData"

const FIRST_STAGE = 0

export class UsageTestModel implements PingAdapter, StorageAdapter {
	async loadActiveUsageTests(): Promise<UsageTest[]> {
		console.log("loading tests")

		const data = createUsageTestAssignmentPostIn()
		const response = await serviceRequest(SysService.UsageTestAssignmentService, HttpMethod.POST, data, UsageTestAssignmentPostOutTypeRef)

		console.log(response)
		return Promise.resolve(response.assignments.map((usageTestAssignment, idx, arr) =>
			new UsageTest(usageTestAssignment.testId, Number(usageTestAssignment.variant))
		))
	}

	async sendPing(test: UsageTest, stage: Stage): Promise<void> {
		if (stage.number === FIRST_STAGE) {
			const data = createUsageTestParticipationPostIn()
			data.testId = test.testId

			data.pingData = Array.from(stage.collectedMetrics).map(([key, value], index, array) => {
				const ping = createUsageTestPingData()
				ping.type = key
				ping.value = value

				return ping
			})

			const response = await serviceRequest(SysService.UsageTestParticipationService, HttpMethod.POST, data, UsageTestParticipationPostOutTypeRef)
			test.participationId = response.participationId
		} else {
			throw new Error("stages beyond 0 are currently not supported")
		}
	}

}