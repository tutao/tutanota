import o from "ospec"
import {ASSIGNMENT_UPDATE_INTERVAL_MS, PersistedAssignmentData, TtlBehavior, UsageTestModel, UsageTestStorage} from "../../../src/misc/UsageTestModel"
import {_TypeModel as UsageTestTypeModel, createUsageTestAssignment} from "../../../src/api/entities/sys/UsageTestAssignment"
import {matchers, object, verify, when} from "testdouble"
import {createUsageTestAssignmentIn} from "../../../src/api/entities/sys/UsageTestAssignmentIn"
import {createUsageTestAssignmentOut} from "../../../src/api/entities/sys/UsageTestAssignmentOut"
import {clone} from "@tutao/tutanota-utils"
import {Stage, UsageTest} from "@tutao/tutanota-usagetests"
import {createUsageTestParticipationIn} from "../../../src/api/entities/sys/UsageTestParticipationIn"
import {createUsageTestMetricData} from "../../../src/api/entities/sys/UsageTestMetricData"
import {SuspensionBehavior} from "../../../src/api/worker/rest/RestClient"
import {UsageTestAssignmentService, UsageTestParticipationService} from "../../../src/api/entities/sys/Services"
import {IServiceExecutor} from "../../../src/api/common/ServiceRequest"

const {anything} = matchers

class MockStorage implements UsageTestStorage {
	private assignments: PersistedAssignmentData | null
	private deviceId: string | null

	constructor(assignmentData?: PersistedAssignmentData, testDeviceId?: string) {
		this.assignments = assignmentData ?? null
		this.deviceId = testDeviceId ?? null
	}

	async getAssignments(): Promise<PersistedAssignmentData | null> {
		return this.assignments
	}

	async getTestDeviceId(): Promise<string | null> {
		return this.deviceId
	}

	async storeAssignments(persistedAssignmentData: PersistedAssignmentData): Promise<void> {
		this.assignments = persistedAssignmentData
	}

	async storeTestDeviceId(testDeviceId: string): Promise<void> {
		this.deviceId = testDeviceId
	}
}


o.spec("UsageTestModel", function () {
	let usageTestModel: UsageTestModel
	let serviceExecutor: IServiceExecutor
	let mockStorage: MockStorage
	const testDeviceId = "123testDeviceId321"

	const dateProvider = {
		now(): number {
			return Date.now()
		},
		timeZone(): string {
			throw new Error("Not implemented by this provider")
		}
	}

	const oldAssignment = createUsageTestAssignment({
		name: "oldAssignment",
		variant: "3",
		stages: [],
		state: "0",
		testId: "testId123",
	})
	const assignmentData: PersistedAssignmentData = {
		updatedAt: dateProvider.now() - (ASSIGNMENT_UPDATE_INTERVAL_MS * 2),
		sysModelVersion: Number(UsageTestTypeModel.version),
		assignments: [oldAssignment],
	}

	const newAssignment = createUsageTestAssignment({
		name: "assignment1",
		variant: "1",
		stages: [],
		state: "1",
		testId: "testId123",
	})

	o.beforeEach(function () {
		serviceExecutor = object()
		mockStorage = new MockStorage()
		usageTestModel = new UsageTestModel(mockStorage, dateProvider, serviceExecutor)
	})

	async function assertStored(result, assignment) {
		o(result[0].testId).equals(assignment.testId)
		const storedAssignment = await mockStorage.getAssignments()
		o(storedAssignment?.assignments!![0].testId).equals(assignment.testId)
		o(await mockStorage.getTestDeviceId()).equals(testDeviceId)
	}

	o.spec("usage tests", function () {
		o.spec("usage test model loading assignments", function () {

			o("when there's no deviceId it does POST", async function () {
				when(serviceExecutor.post(UsageTestAssignmentService, createUsageTestAssignmentIn({}), {
					suspensionBehavior: SuspensionBehavior.Throw,
				})).thenResolve(
					createUsageTestAssignmentOut({
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					})
				)

				const result = await usageTestModel.loadActiveUsageTests(TtlBehavior.PossiblyOutdated)
				await assertStored(result, newAssignment)
			})

			o("possibly outdated, loads from server because model version has changed", async function () {

				await mockStorage.storeTestDeviceId(testDeviceId)
				await mockStorage.storeAssignments({
					assignments: [],
					sysModelVersion: 1, // definitely outdated!
					updatedAt: dateProvider.now() - 1,
				})

				when(serviceExecutor.put(UsageTestAssignmentService, createUsageTestAssignmentIn({testDeviceId}), {
					suspensionBehavior: SuspensionBehavior.Throw,
				})).thenResolve(
					createUsageTestAssignmentOut({
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					})
				)

				const result = await usageTestModel.loadActiveUsageTests(TtlBehavior.PossiblyOutdated)
				await assertStored(result, newAssignment)
			})

			o("possibly outdated, loads from server and stores if nothing is stored", async function () {
				when(serviceExecutor.put(UsageTestAssignmentService, createUsageTestAssignmentIn({testDeviceId}), {
					suspensionBehavior: SuspensionBehavior.Throw,
				})).thenResolve(
					createUsageTestAssignmentOut({
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					})
				)

				await mockStorage.storeTestDeviceId(testDeviceId)

				const result = await usageTestModel.loadActiveUsageTests(TtlBehavior.PossiblyOutdated)

				await assertStored(result, newAssignment)
			})

			o("possibly outdated, returns result from storage if it's there", async function () {
				await mockStorage.storeTestDeviceId(testDeviceId)
				await mockStorage.storeAssignments(assignmentData)

				const result = await usageTestModel.loadActiveUsageTests(TtlBehavior.PossiblyOutdated)

				await assertStored(result, oldAssignment)
			})

			o("up to date only, data outdated, loads from the server and stores", async function () {
				await mockStorage.storeTestDeviceId(testDeviceId)
				await mockStorage.storeAssignments(assignmentData)

				when(serviceExecutor.put(UsageTestAssignmentService, createUsageTestAssignmentIn({testDeviceId}), {
					suspensionBehavior: SuspensionBehavior.Throw,
				})).thenResolve(
					createUsageTestAssignmentOut({
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					})
				)
				const result = await usageTestModel.loadActiveUsageTests(TtlBehavior.UpToDateOnly)
				await assertStored(result, newAssignment)
			})

			o("up to date only, data not outdated, returns result from storage", async function () {
				await mockStorage.storeTestDeviceId(testDeviceId)
				const nonOutdatedAssignmentData = clone(assignmentData)
				nonOutdatedAssignmentData.updatedAt = dateProvider.now() - ASSIGNMENT_UPDATE_INTERVAL_MS / 2
				await mockStorage.storeAssignments(nonOutdatedAssignmentData)

				const result = await usageTestModel.loadActiveUsageTests(TtlBehavior.UpToDateOnly)
				await assertStored(result, oldAssignment)
			})
		})

		o.spec("sendPing", function () {
			o("sends ping", async function () {
				await mockStorage.storeTestDeviceId(testDeviceId)

				const usageTest: UsageTest = new UsageTest("testId", "testName", 1, true)
				usageTest.pingAdapter = usageTestModel
				const stage = new Stage(0, usageTest)
				usageTest.addStage(stage)
				const metric = {
					name: "foo",
					value: "bar",
				}
				stage.setMetric(metric)

				when(serviceExecutor.post(
						UsageTestParticipationService,
						createUsageTestParticipationIn({
							testId: usageTest.testId,
							metrics: [createUsageTestMetricData(metric)],
							stage: stage.number.toString(),
							testDeviceId: testDeviceId,
						})
					)
				).thenResolve(undefined)

				await usageTestModel.sendPing(usageTest, stage)

				verify(serviceExecutor.post(UsageTestParticipationService, anything()), {times: 1})
			})
		})
	})
})