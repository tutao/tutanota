import o from "ospec"
import {
	ASSIGNMENT_UPDATE_INTERVAL_MS,
	EphemeralUsageTestStorage,
	PersistedAssignmentData,
	StorageBehavior,
	TtlBehavior,
	UsageTestModel,
	UsageTestStorage
} from "../../../src/misc/UsageTestModel.js"
import {
	createUsageTestAssignment,
	createUsageTestAssignmentIn,
	createUsageTestAssignmentOut,
	createUsageTestMetricData,
	createUsageTestParticipationIn
} from "../../../src/api/entities/usage/TypeRefs.js"
import {matchers, object, replace, verify, when} from "testdouble"
import {clone} from "@tutao/tutanota-utils"
import {Stage, UsageTest} from "@tutao/tutanota-usagetests"
import {SuspensionBehavior} from "../../../src/api/worker/rest/RestClient.js"
import {UsageTestAssignmentService, UsageTestParticipationService} from "../../../src/api/entities/usage/Services.js"
import {IServiceExecutor} from "../../../src/api/common/ServiceRequest.js"
import modelInfo from "../../../src/api/entities/usage/ModelInfo.js"
import {EntityClient} from "../../../src/api/common/EntityClient.js"
import {LoginController} from "../../../src/api/main/LoginController.js"
import {createCustomerProperties} from "../../../src/api/entities/sys/TypeRefs.js"
import {UserController} from "../../../src/api/main/UserController.js"
import {createUserSettingsGroupRoot} from "../../../src/api/entities/tutanota/TypeRefs.js"
import {EventController} from "../../../src/api/main/EventController.js"

const {anything} = matchers


o.spec("UsageTestModel", function () {
	let usageTestModel: UsageTestModel
	let serviceExecutor: IServiceExecutor
	let entityClient: EntityClient
	let persistentStorage: UsageTestStorage
	let ephemeralStorage: UsageTestStorage
	let userControllerMock: UserController
	let loginControllerMock: LoginController
	let eventControllerMock: EventController
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
		sendPings: true,
		testId: "testId123",
	})
	const assignmentData: PersistedAssignmentData = {
		updatedAt: dateProvider.now() - (ASSIGNMENT_UPDATE_INTERVAL_MS * 2),
		usageModelVersion: modelInfo.version,
		assignments: [oldAssignment],
	}

	const newAssignment = createUsageTestAssignment({
		name: "assignment1",
		variant: "1",
		stages: [],
		sendPings: true,
		testId: "testId123",
	})

	o.beforeEach(function () {
		serviceExecutor = object()
		entityClient = object()

		userControllerMock = object()
		loginControllerMock = object()
		replace(loginControllerMock, "isUserLoggedIn", () => true)

		eventControllerMock = object()

		when(loginControllerMock.getUserController()).thenReturn(userControllerMock)

		ephemeralStorage = new EphemeralUsageTestStorage()
		persistentStorage = new EphemeralUsageTestStorage()
		usageTestModel = new UsageTestModel({
				[StorageBehavior.Persist]: persistentStorage,
				[StorageBehavior.Ephemeral]: ephemeralStorage,
			},
			dateProvider,
			serviceExecutor,
			entityClient,
			loginControllerMock,
			eventControllerMock,
		)

		replace(usageTestModel, "customerProperties", createCustomerProperties({usageDataOptedOut: false}))
		replace(userControllerMock, "userSettingsGroupRoot", createUserSettingsGroupRoot({usageDataOptedIn: true}))
	})

	async function assertStored(storage, result, assignment) {
		o(result[0].testId).equals(assignment.testId)
		const storedAssignment = await storage.getAssignments()
		o(storedAssignment?.assignments!![0].testId).equals(assignment.testId)
		o(await storage.getTestDeviceId()).equals(testDeviceId)
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
				await assertStored(ephemeralStorage, result, newAssignment)
			})

			o("possibly outdated, loads from server because model version has changed", async function () {

				await ephemeralStorage.storeTestDeviceId(testDeviceId)
				await ephemeralStorage.storeAssignments({
					assignments: [],
					usageModelVersion: -1, // definitely outdated!
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
				await assertStored(ephemeralStorage, result, newAssignment)
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

				await ephemeralStorage.storeTestDeviceId(testDeviceId)

				const result = await usageTestModel.loadActiveUsageTests(TtlBehavior.PossiblyOutdated)

				await assertStored(ephemeralStorage, result, newAssignment)
			})

			o("possibly outdated, returns result from storage if it's there", async function () {
				await ephemeralStorage.storeTestDeviceId(testDeviceId)
				await ephemeralStorage.storeAssignments(assignmentData)

				const result = await usageTestModel.loadActiveUsageTests(TtlBehavior.PossiblyOutdated)

				await assertStored(ephemeralStorage, result, oldAssignment)
			})

			o("up to date only, data outdated, loads from the server and stores", async function () {
				await ephemeralStorage.storeTestDeviceId(testDeviceId)
				await ephemeralStorage.storeAssignments(assignmentData)

				when(serviceExecutor.put(UsageTestAssignmentService, createUsageTestAssignmentIn({testDeviceId}), {
					suspensionBehavior: SuspensionBehavior.Throw,
				})).thenResolve(
					createUsageTestAssignmentOut({
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					})
				)
				const result = await usageTestModel.loadActiveUsageTests(TtlBehavior.UpToDateOnly)
				await assertStored(ephemeralStorage, result, newAssignment)
			})

			o("up to date only, data not outdated, returns result from storage", async function () {
				await ephemeralStorage.storeTestDeviceId(testDeviceId)
				const nonOutdatedAssignmentData = clone(assignmentData)
				nonOutdatedAssignmentData.updatedAt = dateProvider.now() - ASSIGNMENT_UPDATE_INTERVAL_MS / 2
				await ephemeralStorage.storeAssignments(nonOutdatedAssignmentData)

				const result = await usageTestModel.loadActiveUsageTests(TtlBehavior.UpToDateOnly)
				await assertStored(ephemeralStorage, result, oldAssignment)
			})
		})

		o.spec("sendPing", function () {
			o("sends ping", async function () {
				await ephemeralStorage.storeTestDeviceId(testDeviceId)

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

				verify(serviceExecutor.post(UsageTestParticipationService, anything()), {times: 1, ignoreExtraArgs: true})
			})
		})

		o.spec("setting the storage behavior", function () {
			o("uses correct storage backend after the behavior has been set", async function () {
				usageTestModel.setStorageBehavior(StorageBehavior.Persist)

				when(serviceExecutor.post(UsageTestAssignmentService, createUsageTestAssignmentIn({}), {
					suspensionBehavior: SuspensionBehavior.Throw,
				})).thenResolve(
					createUsageTestAssignmentOut({
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					})
				)

				const result = await usageTestModel.loadActiveUsageTests(TtlBehavior.UpToDateOnly)

				await assertStored(persistentStorage, result, newAssignment)
				verify(ephemeralStorage.getTestDeviceId(), {times: 0})
			})

			o("nothing is stored if customer has opted out", async function () {
				replace(usageTestModel, "customerProperties", createCustomerProperties({usageDataOptedOut: true}))

				usageTestModel.setStorageBehavior(StorageBehavior.Persist)

				when(serviceExecutor.post(UsageTestAssignmentService, createUsageTestAssignmentIn({}), {
					suspensionBehavior: SuspensionBehavior.Throw,
				})).thenResolve(
					createUsageTestAssignmentOut({
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					})
				)

				await usageTestModel.loadActiveUsageTests(TtlBehavior.UpToDateOnly)

				o(await persistentStorage.getAssignments()).equals(null)
				verify(ephemeralStorage.getTestDeviceId(), {times: 0})
			})

			o("nothing is stored if user has not opted in", async function () {
				replace(userControllerMock, "userSettingsGroupRoot", createUserSettingsGroupRoot({usageDataOptedIn: false}))

				usageTestModel.setStorageBehavior(StorageBehavior.Persist)

				when(serviceExecutor.post(UsageTestAssignmentService, createUsageTestAssignmentIn({}), {
					suspensionBehavior: SuspensionBehavior.Throw,
				})).thenResolve(
					createUsageTestAssignmentOut({
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					})
				)

				await usageTestModel.loadActiveUsageTests(TtlBehavior.UpToDateOnly)

				o(await persistentStorage.getAssignments()).equals(null)
				verify(ephemeralStorage.getTestDeviceId(), {times: 0})
			})
		})

	})
})