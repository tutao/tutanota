import {createUsageTestAssignmentPostIn} from "../api/entities/sys/UsageTestAssignmentPostIn.js"
import {SysService} from "../api/entities/sys/Services.js"
import {HttpMethod} from "../api/common/EntityFunctions.js"
import {UsageTestAssignmentPostOutTypeRef} from "../api/entities/sys/UsageTestAssignmentPostOut.js"
import {PingAdapter, Stage, StorageAdapter, UsageTest} from "@tutao/tutanota-usagetests"
import {serviceRequest, serviceRequestVoid} from "../api/main/ServiceRequest"
import {createUsageTestParticipationPostIn} from "../api/entities/sys/UsageTestParticipationPostIn"
import {UsageTestParticipationPostOutTypeRef} from "../api/entities/sys/UsageTestParticipationPostOut"
import {createUsageTestParticipationPutIn} from "../api/entities/sys/UsageTestParticipationPutIn"
import {UsageTestState} from "../api/common/TutanotaConstants"
import {ofClass} from "@tutao/tutanota-utils"
import {PreconditionFailedError} from "../api/common/error/RestError"
import {createUsageTestMetricData} from "../api/entities/sys/UsageTestMetricData"

const FIRST_STAGE = 0

export class UsageTestModel implements PingAdapter, StorageAdapter {
	async loadActiveUsageTests(): Promise<UsageTest[]> {
		console.log("loading tests")

		const data = createUsageTestAssignmentPostIn()
		const response = await serviceRequest(SysService.UsageTestAssignmentService, HttpMethod.POST, data, UsageTestAssignmentPostOutTypeRef)

		console.log(response)
		return Promise.resolve(response.assignments.map(usageTestAssignment => {
			const test = new UsageTest(usageTestAssignment.testId, usageTestAssignment.name, Number(usageTestAssignment.variant),
				UsageTestState.Live === usageTestAssignment.state)

			for (let [index, stage] of usageTestAssignment.stages.entries()) {
				test.addStage(new Stage(index, test))
			}

			return test
		}))
	}

	async sendPing(test: UsageTest, stage: Stage): Promise<void> {
		const metrics = Array.from(stage.collectedMetrics).map(([key, {name, value}]) => {
			const metric = createUsageTestMetricData()
			metric.name = name
			metric.value = value

			return metric
		})

		if (stage.number === FIRST_STAGE) {
			const data = createUsageTestParticipationPostIn()
			data.testId = test.testId
			data.metrics = metrics

			serviceRequest(SysService.UsageTestParticipationService, HttpMethod.POST, data, UsageTestParticipationPostOutTypeRef)
				.then(response => {
					test.participationId = response.participationId
				})
				.catch(ofClass(PreconditionFailedError, (e) => {
					test.active = false
					console.log("Tried to send ping for paused test", e)
				}))
		} else {
			const data = createUsageTestParticipationPutIn()
			data.testId = test.testId
			data.metrics = metrics
			data.stage = stage.number.toString()

			if (!test.participationId) {
				console.log(`Cannot send stage ${stage.number} because participationId on test ${test.testId} has not been set. Has stage 0 been completed?`)
				return
			}
			data.participationId = test.participationId

			serviceRequestVoid(SysService.UsageTestParticipationService, HttpMethod.PUT, data)
				.catch(ofClass(PreconditionFailedError, (e) => console.log("Tried to send ping for paused test ", e)))
		}
	}

}