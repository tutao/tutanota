import {
	createUsageTestAssignmentIn,
	createUsageTestMetricData,
	createUsageTestParticipationIn,
	UsageTestAssignment,
	UsageTestAssignmentOut,
	UsageTestAssignmentTypeRef
} from "../api/entities/sys/TypeRefs.js"
import {PingAdapter, Stage, UsageTest} from "@tutao/tutanota-usagetests"
import {UsageTestState} from "../api/common/TutanotaConstants"
import {filterInt, ofClass} from "@tutao/tutanota-utils"
import {PreconditionFailedError} from "../api/common/error/RestError"
import {SuspensionError} from "../api/common/error/SuspensionError"
import {SuspensionBehavior} from "../api/worker/rest/RestClient"
import {DateProvider} from "../api/common/DateProvider.js"
import {isTest} from "../api/common/Env"
import {IServiceExecutor} from "../api/common/ServiceRequest"
import {UsageTestAssignmentService, UsageTestParticipationService} from "../api/entities/sys/Services.js"
import {resolveTypeReference} from "../api/common/EntityFunctions"

export interface PersistedAssignmentData {
	updatedAt: number
	assignments: UsageTestAssignment[]
	sysModelVersion: number
}

export interface UsageTestStorage {
	getTestDeviceId(): Promise<string | null>

	storeTestDeviceId(testDeviceId: string): Promise<void>

	getAssignments(): Promise<PersistedAssignmentData | null>

	storeAssignments(persistedAssignmentData: PersistedAssignmentData): Promise<void>
}

export const ASSIGNMENT_UPDATE_INTERVAL_MS = 1000 * 60 * 60 // 1h

export const enum TtlBehavior {
	PossiblyOutdated,
	UpToDateOnly,
}

const USAGE_TESTS_ENABLED = isTest()

export class UsageTestModel implements PingAdapter {

	constructor(
		private readonly testStorage: UsageTestStorage,
		private readonly dateProvider: DateProvider,
		private readonly serviceExecutor: IServiceExecutor,
	) {
	}

	async loadActiveUsageTests(ttlBehavior: TtlBehavior): Promise<UsageTest[]> {
		if (!USAGE_TESTS_ENABLED) return []

		const persistedData = await this.testStorage.getAssignments()
		const modelVersion = await this.modelVersion()

		if (persistedData == null ||
			persistedData.sysModelVersion !== modelVersion ||
			(ttlBehavior === TtlBehavior.UpToDateOnly && Date.now() - persistedData.updatedAt > ASSIGNMENT_UPDATE_INTERVAL_MS)
		) {
			return this.assignmentsToTests(await this.loadAssignments())
		} else {
			return this.assignmentsToTests(persistedData.assignments)
		}
	}

	private async modelVersion(): Promise<number> {
		const model = await resolveTypeReference(UsageTestAssignmentTypeRef)
		return filterInt(model.version)
	}

	private async loadAssignments(): Promise<UsageTestAssignment[]> {
		const testDeviceId = await this.testStorage.getTestDeviceId()

		const data = createUsageTestAssignmentIn({
			testDeviceId: testDeviceId
		})

		try {
			const response: UsageTestAssignmentOut = (testDeviceId)
				? await this.serviceExecutor.put(UsageTestAssignmentService, data, {
					suspensionBehavior: SuspensionBehavior.Throw,
				})
				: await this.serviceExecutor.post(UsageTestAssignmentService, data, {
					suspensionBehavior: SuspensionBehavior.Throw,
				})
			await this.testStorage.storeTestDeviceId(response.testDeviceId)
			await this.testStorage.storeAssignments({
				assignments: response.assignments,
				updatedAt: this.dateProvider.now(),
				sysModelVersion: await this.modelVersion(),
			})

			return response.assignments
		} catch (e) {
			if (e instanceof SuspensionError) {
				console.log("rate-limit for new assignments reached, disabling tests")
				return []
			}

			throw e
		}
	}

	private assignmentsToTests(assignments: UsageTestAssignment[]): UsageTest[] {
		return assignments.map(usageTestAssignment => {
			const test = new UsageTest(
				usageTestAssignment.testId,
				usageTestAssignment.name,
				Number(usageTestAssignment.variant),
				UsageTestState.Live === usageTestAssignment.state,
			)

			for (const index of usageTestAssignment.stages.keys()) {
				test.addStage(new Stage(index, test))
			}

			return test
		})
	}

	async sendPing(test: UsageTest, stage: Stage): Promise<void> {
		const testDeviceId = await this.testStorage.getTestDeviceId()
		if (testDeviceId == null) {
			console.warn("No device id set before sending pings")
			return
		}

		const metrics = Array.from(stage.collectedMetrics).map(([key, {name, value}]) =>
			createUsageTestMetricData({
				name: name,
				value: value,
			}))

		const data = createUsageTestParticipationIn({
			testId: test.testId,
			metrics,
			stage: stage.number.toString(),
			testDeviceId: testDeviceId,
		})

		await this.serviceExecutor.post(UsageTestParticipationService, data)
				  .catch(ofClass(PreconditionFailedError, (e) => {
					  test.active = false
					  console.log("Tried to send ping for paused test", e)
				  }))
	}
}