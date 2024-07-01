import o from "@tutao/otest"
import {
	ASSIGNMENT_UPDATE_INTERVAL_MS,
	EphemeralUsageTestStorage,
	PersistedAssignmentData,
	StorageBehavior,
	UsageTestModel,
	UsageTestStorage,
} from "../../../src/common/misc/UsageTestModel.js"
import {
	createUsageTestAssignment,
	createUsageTestAssignmentIn,
	createUsageTestAssignmentOut,
	createUsageTestMetricData,
	createUsageTestParticipationIn,
	UsageTestAssignmentInTypeRef,
	UsageTestAssignmentOutTypeRef,
	UsageTestAssignmentTypeRef,
	UsageTestParticipationInTypeRef,
} from "../../../src/common/api/entities/usage/TypeRefs.js"
import { matchers, object, replace, verify, when } from "testdouble"
import { clone } from "@tutao/tutanota-utils"
import { Stage, UsageTest, UsageTestController } from "@tutao/tutanota-usagetests"
import { SuspensionBehavior } from "../../../src/common/api/worker/rest/RestClient.js"
import { UsageTestAssignmentService, UsageTestParticipationService } from "../../../src/common/api/entities/usage/Services.js"
import { IServiceExecutor } from "../../../src/common/api/common/ServiceRequest.js"
import modelInfo from "../../../src/common/api/entities/usage/ModelInfo.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { createCustomerProperties, CustomerPropertiesTypeRef } from "../../../src/common/api/entities/sys/TypeRefs.js"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { createUserSettingsGroupRoot, UserSettingsGroupRootTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { EventController } from "../../../src/common/api/main/EventController.js"
import { createTestEntity } from "../TestUtils.js"

const { anything } = matchers

o.spec("UsageTestModel", function () {
	let usageTestModel: UsageTestModel
	let serviceExecutor: IServiceExecutor
	let entityClient: EntityClient
	let persistentStorage: UsageTestStorage
	let ephemeralStorage: UsageTestStorage
	let userControllerMock: UserController
	let loginControllerMock: LoginController
	let eventControllerMock: EventController
	let usageTestController: UsageTestController
	const testDeviceId = "123testDeviceId321"

	const dateProvider = {
		now(): number {
			return Date.now()
		},
		timeZone(): string {
			throw new Error("Not implemented by this provider")
		},
	}

	const oldAssignment = createTestEntity(UsageTestAssignmentTypeRef, {
		name: "oldAssignment",
		variant: "3",
		stages: [],
		sendPings: true,
		testId: "testId123",
	})
	const assignmentData: PersistedAssignmentData = {
		updatedAt: dateProvider.now() - ASSIGNMENT_UPDATE_INTERVAL_MS * 2,
		usageModelVersion: modelInfo.version,
		assignments: [oldAssignment],
	}

	const newAssignment = createTestEntity(UsageTestAssignmentTypeRef, {
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

		usageTestController = object()

		when(loginControllerMock.getUserController()).thenReturn(userControllerMock)

		ephemeralStorage = new EphemeralUsageTestStorage()
		persistentStorage = new EphemeralUsageTestStorage()
		usageTestModel = new UsageTestModel(
			{
				[StorageBehavior.Persist]: persistentStorage,
				[StorageBehavior.Ephemeral]: ephemeralStorage,
			},
			dateProvider,
			serviceExecutor,
			entityClient,
			loginControllerMock,
			eventControllerMock,
			() => usageTestController,
		)

		replace(usageTestModel, "customerProperties", createTestEntity(CustomerPropertiesTypeRef, { usageDataOptedOut: false }))
		replace(userControllerMock, "userSettingsGroupRoot", createTestEntity(UserSettingsGroupRootTypeRef, { usageDataOptedIn: true }))
	})

	async function assertStored(storage, result, assignment) {
		o(result[0].testId).equals(assignment.testId)
		const storedAssignment = await storage.getAssignments()
		o(storedAssignment?.assignments![0].testId).equals(assignment.testId)
		o(await storage.getTestDeviceId()).equals(testDeviceId)
	}

	o.spec("usage tests", function () {
		o.spec("usage test model loading assignments", function () {
			o("when there's no deviceId it does POST", async function () {
				when(
					serviceExecutor.post(UsageTestAssignmentService, createTestEntity(UsageTestAssignmentInTypeRef, {}), {
						suspensionBehavior: SuspensionBehavior.Throw,
					}),
				).thenResolve(
					createTestEntity(UsageTestAssignmentOutTypeRef, {
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					}),
				)

				const result = await usageTestModel.loadActiveUsageTests()
				await assertStored(ephemeralStorage, result, newAssignment)
			})

			o("loads from server because model version has changed", async function () {
				await ephemeralStorage.storeTestDeviceId(testDeviceId)
				await ephemeralStorage.storeAssignments({
					assignments: [],
					usageModelVersion: -1, // definitely outdated!
					updatedAt: dateProvider.now() - 1,
				})

				when(
					serviceExecutor.put(UsageTestAssignmentService, createTestEntity(UsageTestAssignmentInTypeRef, { testDeviceId }), {
						suspensionBehavior: SuspensionBehavior.Throw,
					}),
				).thenResolve(
					createTestEntity(UsageTestAssignmentOutTypeRef, {
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					}),
				)

				const result = await usageTestModel.loadActiveUsageTests()
				await assertStored(ephemeralStorage, result, newAssignment)
			})

			o("loads from server and stores if nothing is stored", async function () {
				when(
					serviceExecutor.put(UsageTestAssignmentService, createTestEntity(UsageTestAssignmentInTypeRef, { testDeviceId }), {
						suspensionBehavior: SuspensionBehavior.Throw,
					}),
				).thenResolve(
					createTestEntity(UsageTestAssignmentOutTypeRef, {
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					}),
				)

				await ephemeralStorage.storeTestDeviceId(testDeviceId)

				const result = await usageTestModel.loadActiveUsageTests()

				await assertStored(ephemeralStorage, result, newAssignment)
			})

			o("returns result from storage if it's there", async function () {
				await ephemeralStorage.storeTestDeviceId(testDeviceId)
				assignmentData.updatedAt = dateProvider.now()
				await ephemeralStorage.storeAssignments(assignmentData)

				const result = await usageTestModel.loadActiveUsageTests()

				await assertStored(ephemeralStorage, result, oldAssignment)
			})

			o("data outdated, loads from the server and stores", async function () {
				await ephemeralStorage.storeTestDeviceId(testDeviceId)
				await ephemeralStorage.storeAssignments(assignmentData)

				when(
					serviceExecutor.put(UsageTestAssignmentService, createTestEntity(UsageTestAssignmentInTypeRef, { testDeviceId }), {
						suspensionBehavior: SuspensionBehavior.Throw,
					}),
				).thenResolve(
					createTestEntity(UsageTestAssignmentOutTypeRef, {
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					}),
				)
				const result = await usageTestModel.loadActiveUsageTests()
				await assertStored(ephemeralStorage, result, newAssignment)
			})

			o("data not outdated, returns result from storage", async function () {
				await ephemeralStorage.storeTestDeviceId(testDeviceId)
				const nonOutdatedAssignmentData = clone(assignmentData)
				nonOutdatedAssignmentData.updatedAt = dateProvider.now() - ASSIGNMENT_UPDATE_INTERVAL_MS / 2
				await ephemeralStorage.storeAssignments(nonOutdatedAssignmentData)

				const result = await usageTestModel.loadActiveUsageTests()
				await assertStored(ephemeralStorage, result, oldAssignment)
			})
		})

		o.spec("sendPing", function () {
			o("sends ping", async function () {
				await ephemeralStorage.storeTestDeviceId(testDeviceId)

				const usageTest: UsageTest = new UsageTest("testId", "testName", 1, true)
				usageTest.pingAdapter = usageTestModel
				const stage = new Stage(0, usageTest, 1, 1)
				usageTest.addStage(stage)
				const metric = {
					name: "foo",
					value: "bar",
				}
				stage.setMetric(metric)

				when(
					serviceExecutor.post(
						UsageTestParticipationService,
						createTestEntity(UsageTestParticipationInTypeRef, {
							testId: usageTest.testId,
							metrics: [createUsageTestMetricData(metric)],
							stage: stage.number.toString(),
							testDeviceId: testDeviceId,
						}),
					),
				).thenResolve(undefined)

				await usageTestModel.sendPing(usageTest, stage)

				verify(serviceExecutor.post(UsageTestParticipationService, anything()), { times: 1, ignoreExtraArgs: true })
			})

			o("sends pings in correct order", async function () {
				await ephemeralStorage.storeTestDeviceId(testDeviceId)

				const usageTest: UsageTest = new UsageTest("testId", "testName", 1, true)
				usageTest.pingAdapter = usageTestModel

				for (let i = 0; i < 3; i++) {
					const stage = new Stage(i, usageTest, 1, 1)
					usageTest.addStage(stage)
				}

				const pingOrder: Array<string> = []

				when(
					serviceExecutor.post(
						UsageTestParticipationService,
						createTestEntity(UsageTestParticipationInTypeRef, {
							testId: usageTest.testId,
							stage: "0",
							testDeviceId: testDeviceId,
						}),
						anything(),
					),
				).thenDo(async () => {
					// Simulate network delay
					await new Promise((resolve) => setTimeout(resolve, 15))
					pingOrder.push("0")
				})

				when(
					serviceExecutor.post(
						UsageTestParticipationService,
						createTestEntity(UsageTestParticipationInTypeRef, {
							testId: usageTest.testId,
							stage: "1",
							testDeviceId: testDeviceId,
						}),
						anything(),
					),
				).thenDo(async () => {
					// Simulate network delay
					await new Promise((resolve) => setTimeout(resolve, 10))
					pingOrder.push("1")
				})

				when(
					serviceExecutor.post(
						UsageTestParticipationService,
						createTestEntity(UsageTestParticipationInTypeRef, {
							testId: usageTest.testId,
							stage: "2",
							testDeviceId: testDeviceId,
						}),
						anything(),
					),
				).thenDo(async () => {
					pingOrder.push("2")
				})

				usageTest.getStage(0).complete()
				usageTest.getStage(1).complete()
				await usageTest.getStage(2).complete()

				o(pingOrder).deepEquals(["0", "1", "2"])
			})
		})

		o.spec("setting the storage behavior", function () {
			o("uses correct storage backend after the behavior has been set", async function () {
				usageTestModel.setStorageBehavior(StorageBehavior.Persist)

				when(
					serviceExecutor.post(UsageTestAssignmentService, createTestEntity(UsageTestAssignmentInTypeRef, {}), {
						suspensionBehavior: SuspensionBehavior.Throw,
					}),
				).thenResolve(
					createTestEntity(UsageTestAssignmentOutTypeRef, {
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					}),
				)

				const result = await usageTestModel.loadActiveUsageTests()

				await assertStored(persistentStorage, result, newAssignment)
				verify(ephemeralStorage.getTestDeviceId(), { times: 0 })
			})

			o("nothing is stored if customer has opted out", async function () {
				replace(usageTestModel, "customerProperties", createTestEntity(CustomerPropertiesTypeRef, { usageDataOptedOut: true }))

				usageTestModel.setStorageBehavior(StorageBehavior.Persist)

				when(
					serviceExecutor.post(UsageTestAssignmentService, createTestEntity(UsageTestAssignmentInTypeRef, {}), {
						suspensionBehavior: SuspensionBehavior.Throw,
					}),
				).thenResolve(
					createTestEntity(UsageTestAssignmentOutTypeRef, {
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					}),
				)

				await usageTestModel.loadActiveUsageTests()

				o(await persistentStorage.getAssignments()).equals(null)
				verify(ephemeralStorage.getTestDeviceId(), { times: 0 })
			})

			o("nothing is stored if user has not opted in", async function () {
				replace(userControllerMock, "userSettingsGroupRoot", createTestEntity(UserSettingsGroupRootTypeRef, { usageDataOptedIn: false }))

				usageTestModel.setStorageBehavior(StorageBehavior.Persist)

				when(
					serviceExecutor.post(UsageTestAssignmentService, createTestEntity(UsageTestAssignmentInTypeRef, {}), {
						suspensionBehavior: SuspensionBehavior.Throw,
					}),
				).thenResolve(
					createTestEntity(UsageTestAssignmentOutTypeRef, {
						assignments: [newAssignment],
						testDeviceId: testDeviceId,
					}),
				)

				await usageTestModel.loadActiveUsageTests()

				o(await persistentStorage.getAssignments()).equals(null)
				verify(ephemeralStorage.getTestDeviceId(), { times: 0 })
			})
		})
	})
})
