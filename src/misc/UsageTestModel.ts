import {createUsageTestAssignmentPostIn} from "../api/entities/sys/UsageTestAssignmentPostIn.js"
import {SysService} from "../api/entities/sys/Services.js"
import {HttpMethod} from "../api/common/EntityFunctions.js"
import {UsageTestAssignmentPostOutTypeRef} from "../api/entities/sys/UsageTestAssignmentPostOut.js"
import {PingAdapter, Stage, StorageAdapter, UsageTest} from "@tutao/tutanota-usagetests"
import {serviceRequest, serviceRequestVoid} from "../api/main/ServiceRequest"
import {createUsageTestParticipationPostIn} from "../api/entities/sys/UsageTestParticipationPostIn"
import {UsageTestParticipationPostOutTypeRef} from "../api/entities/sys/UsageTestParticipationPostOut"
import {createUsageTestParticipationPutIn} from "../api/entities/sys/UsageTestParticipationPutIn"
import {createUsageTestMetric} from "../api/entities/sys/UsageTestMetric"

const FIRST_STAGE = 0

export class UsageTestModel implements PingAdapter, StorageAdapter {
	async loadActiveUsageTests(): Promise<UsageTest[]> {
		console.log("loading tests")

		const data = createUsageTestAssignmentPostIn()
		const response = await serviceRequest(SysService.UsageTestAssignmentService, HttpMethod.POST, data, UsageTestAssignmentPostOutTypeRef)

		console.log(response)
		return Promise.resolve(response.assignments.map((usageTestAssignment, idx, arr) => {
			const test = new UsageTest(usageTestAssignment.testId, usageTestAssignment.name, Number(usageTestAssignment.variant))

			for (let i = 0; i < Number(usageTestAssignment.numberOfStages); i++) {
				test.addStage(new Stage(i, test))
			}

			return test
		}))
	}

	async sendPing(test: UsageTest, stage: Stage): Promise<void> {
		const metrics = Array.from(stage.collectedMetrics).map(([key, value], index, array) => {
			const ping = createUsageTestMetric()
			ping.type = key
			ping.value = value

			return ping
		})

		if (stage.number === FIRST_STAGE) {
			const data = createUsageTestParticipationPostIn()
			data.testId = test.testId
			data.metrics = metrics

			const response = await serviceRequest(SysService.UsageTestParticipationService, HttpMethod.POST, data, UsageTestParticipationPostOutTypeRef)
			test.participationId = response.participationId
		} else {
			const data = createUsageTestParticipationPutIn()
			data.testId = test.testId
			data.metrics = metrics
			data.stage = stage.number.toString()

			if (!test.participationId) {
				throw new Error(`participationId on test ${test.testId} has not been set. Has stage 0 been completed?`)
			}
			data.participationId = test.participationId

			await serviceRequestVoid(SysService.UsageTestParticipationService, HttpMethod.PUT, data)
		}
	}

}