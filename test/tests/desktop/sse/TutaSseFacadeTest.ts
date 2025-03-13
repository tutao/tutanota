import o from "@tutao/otest"
import { EncryptedMissedNotification, MISSED_NOTIFICATION_TTL, TutaSseFacade } from "../../../../src/common/desktop/sse/TutaSseFacade.js"
import { func, matchers, object, verify, when } from "testdouble"
import { SseStorage } from "../../../../src/common/desktop/sse/SseStorage.js"
import { TutaNotificationHandler } from "../../../../src/common/desktop/sse/TutaNotificationHandler.js"
import { SseClient, SseConnectOptions } from "../../../../src/common/desktop/sse/SseClient.js"
import { DesktopNativeCryptoFacade } from "../../../../src/common/desktop/DesktopNativeCryptoFacade.js"
import { fetch as undiciFetch } from "undici"
import { typeModels } from "../../../../src/common/api/entities/sys/TypeModels.js"
import { deepEqual } from "@tutao/tutanota-utils"
import { DateProvider } from "../../../../src/common/api/common/DateProvider.js"
import {
	createAlarmInfo,
	createAlarmNotification,
	createCalendarEventRef,
	createIdTupleWrapper,
	createMissedNotification,
	createNotificationInfo,
	GeneratedIdWrapperTypeRef,
	MissedNotificationTypeRef,
	SseConnectDataTypeRef,
} from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { mockFetchRequest } from "../../TestUtils.js"
import { SseInfo } from "../../../../src/common/desktop/sse/SseInfo.js"
import { InstanceMapper } from "../../../../src/common/api/worker/crypto/InstanceMapper"
import { OperationType } from "../../../../src/common/api/common/TutanotaConstants"
import { EncryptedAlarmNotification } from "../../../../src/common/native/common/EncryptedAlarmNotification"
import { resolveTypeReference } from "../../../../src/common/api/common/EntityFunctions"

const APP_V = env.versionNumber

const mapper = new InstanceMapper()
o.spec("TutaSseFacade", () => {
	let sseFacade: TutaSseFacade
	let sseStorage: SseStorage
	let notificationHandler: TutaNotificationHandler
	let sseClient: SseClient
	let crypto: DesktopNativeCryptoFacade
	let fetch: typeof undiciFetch
	let date: DateProvider
	o.beforeEach(() => {
		sseStorage = object()
		notificationHandler = object()
		sseClient = object()
		crypto = object()
		fetch = func<typeof undiciFetch>()
		date = object()
		sseFacade = new TutaSseFacade(sseStorage, notificationHandler, sseClient, crypto, APP_V, fetch, date)
	})

	function setupSseInfo(template: Partial<SseInfo> = {}): SseInfo {
		const sseInfo = {
			identifier: "id",
			sseOrigin: "http://something.com",
			userIds: ["userId"],
			...template,
		}
		when(sseStorage.getSseInfo()).thenResolve(sseInfo)
		return sseInfo
	}

	o.spec("connect", () => {
		o.test("connect", async () => {
			setupSseInfo()
			await sseFacade.connect()
			const url = new URL(
				"http://something.com/sse?_body=%7B%221353%22%3A%220%22%2C%221354%22%3A%22id%22%2C%221355%22%3A%5B%7B%221351%22%3A%22userId%22%7D%5D%7D",
			) // '{"1353":"0","1354":"id","1355":[{"1351":"userId"}]}'
			verify(
				sseClient.connect(
					matchers.argThat((opts: SseConnectOptions) => {
						return (
							opts.url.toString() === url.toString() &&
							deepEqual(opts.headers, {
								v: typeModels[MissedNotificationTypeRef.typeId].version,
								cv: env.versionNumber,
							})
						)
					}),
				),
			)
		})
		o.test("connect when notification TTL expired", async () => {
			when(date.now()).thenReturn(MISSED_NOTIFICATION_TTL + 100)
			when(sseStorage.getMissedNotificationCheckTime()).thenResolve(1)
			await sseFacade.connect()
			verify(notificationHandler.onLocalDataInvalidated())
			verify(sseStorage.clear())
			verify(sseClient.connect(matchers.anything()), { times: 0 })
		})
		o.test("disconnect and reconnect when already connected", async () => {
			setupSseInfo()
			await sseFacade.connect()
			await sseFacade.connect()
			verify(sseClient.disconnect())
			verify(sseClient.connect(matchers.anything()), { times: 2 })
		})
		o.test("set heartbeat timeout when connecting", async () => {
			when(sseStorage.getHeartbeatTimeoutSec()).thenResolve(1)
			setupSseInfo()
			await sseFacade.connect()
			verify(sseClient.setReadTimeout(1))
		})
	})

	o.spec("onNotification", () => {
		o.test("downloads and handles notification", async () => {
			const headers: Record<string, string> = {
				userIds: "userId",
				v: typeModels[MissedNotificationTypeRef.typeId].version,
				cv: env.versionNumber,
			}
			const sseInfo = setupSseInfo()
			await sseFacade.connect()
			const alarmNotification = createAlarmNotification({
				operation: OperationType.CREATE,
				summary: "",
				eventStart: new Date(),
				eventEnd: new Date(),
				alarmInfo: createAlarmInfo({
					trigger: "",
					alarmIdentifier: "",
					calendarRef: createCalendarEventRef({
						elementId: "",
						listId: "",
					}),
				}),
				repeatRule: null,
				notificationSessionKeys: [],
				user: "userId",
			})
			const notificationInfo = createNotificationInfo({
				_id: "notificationInfoId",
				userId: "userId",
				mailId: createIdTupleWrapper({
					listId: "mailListId",
					listElementId: "mailElementId",
				}),
				mailAddress: "test@mail.address",
			})
			const missedNotification = createMissedNotification({
				_ownerEncSessionKey: null,
				_ownerKeyVersion: null,
				_ownerGroup: "ownerGroupId",
				_permissions: "permissionsId",
				lastProcessedNotificationId: "lastProcessedNotificationId",
				alarmNotifications: [],
				notificationInfos: [notificationInfo],
			})
			const encryptedMissedNotification = Object.assign({}, missedNotification, {
				alarmNotifications: [alarmNotification],
			})

			const literal = await mapper.mapToLiteral(encryptedMissedNotification, MissedNotificationTypeRef)

			const jsonDefer = mockFetchRequest(fetch, "http://something.com/rest/sys/missednotification/aWQ", headers, 200, literal)

			await sseFacade.onNewMessage("data: notification")

			await jsonDefer
			verify(sseStorage.setLastProcessedNotificationId("lastProcessedNotificationId"))
			verify(sseStorage.recordMissedNotificationCheckTime())
			verify(notificationHandler.onMailNotification(sseInfo, notificationInfo))
			verify(notificationHandler.onAlarmNotification(alarmNotification as unknown as EncryptedAlarmNotification))
		})

		o.test("passes lastProcessedNotificationId if present", async () => {
			const previousLastProcessedNotificationId = "previousLastProcessedNotificationId"
			const newLastProcessedNotificationId = "newLastProcessedNotificationId"
			const headers: Record<string, string> = {
				userIds: "userId",
				v: typeModels[MissedNotificationTypeRef.typeId].version,
				cv: env.versionNumber,
				lastProcessedNotificationId: previousLastProcessedNotificationId,
			}
			setupSseInfo()
			when(sseStorage.getLastProcessedNotificationId()).thenResolve(previousLastProcessedNotificationId)

			const missedNotification = createMissedNotification({
				_ownerEncSessionKey: null,
				_ownerKeyVersion: null,
				_ownerGroup: "ownerGroupId",
				_permissions: "permissionsId",
				lastProcessedNotificationId: newLastProcessedNotificationId,
				alarmNotifications: [],
				notificationInfos: [],
			})
			const encryptedMissedNotification: EncryptedMissedNotification = Object.assign({}, missedNotification, { alarmNotifications: [] })

			const literal = await mapper.mapToLiteral(encryptedMissedNotification, MissedNotificationTypeRef)

			await sseFacade.connect()

			const jsonDefer = mockFetchRequest(fetch, "http://something.com/rest/sys/missednotification/aWQ", headers, 200, literal)

			await sseFacade.onNewMessage("data: notification")

			await jsonDefer
			verify(sseStorage.setLastProcessedNotificationId(newLastProcessedNotificationId))
		})
	})

	o.spec("heartbeat", () => {
		o.test("saves valid heartbeat and passes it to sse client", async () => {
			setupSseInfo()
			await sseFacade.connect()
			await sseFacade.onNewMessage("data: heartbeatTimeout:240")

			verify(sseStorage.setHeartbeatTimeoutSec(240))
			verify(sseClient.setReadTimeout(240))
		})
	})

	o.spec("onNotAuthenticated", () => {
		o.test("when it has more than one user it removes the first one", async () => {
			setupSseInfo({
				userIds: ["user1", "user2"],
			})
			await sseFacade.connect()

			await sseFacade.onNotAuthenticated()

			verify(sseStorage.removeUser("user1"))
			verify(notificationHandler.onUserRemoved("user1"))
		})

		o.test("when it has only one user it invalidates the storage", async () => {
			const sseInfo = setupSseInfo({
				userIds: ["user1"],
			})
			when(sseStorage.removeUser("user1")).thenResolve({ ...sseInfo, userIds: [] })
			await sseFacade.connect()

			await sseFacade.onNotAuthenticated()

			verify(notificationHandler.onUserRemoved("user1"))
			verify(sseStorage.clear())
			verify(notificationHandler.onLocalDataInvalidated())
		})
	})

	o.spec("removeUser", () => {
		o.test("reconnects with new SSE info", async () => {
			when(sseStorage.getSseInfo()).thenResolve(
				{
					identifier: "id",
					sseOrigin: "http://something.com",
					userIds: ["user1", "user2"],
				},
				{
					identifier: "id",
					sseOrigin: "http://something.com",
					userIds: ["user1"],
				},
			)

			await sseFacade.connect()

			await sseFacade.removeUser("user2")

			verify(sseStorage.removeUser("user2"))
			verify(notificationHandler.onUserRemoved("user2"))

			const captor = matchers.captor()
			verify(sseClient.connect(captor.capture()))
			const url = captor.values![1].url
			const body = url.searchParams.get("_body")!

			const literal = await mapper.mapFromLiteral(JSON.parse(body), await resolveTypeReference(SseConnectDataTypeRef))
			o(literal.userIds).deepEquals([{ _type: GeneratedIdWrapperTypeRef, value: "user1" }])
		})

		o.test("does not reconnect if there are no more users", async () => {
			when(sseStorage.getSseInfo()).thenResolve(
				{
					identifier: "id",
					sseOrigin: "http://something.com",
					userIds: ["user1"],
				},
				null,
			)
			when(sseStorage.removeUser("user1")).thenResolve({
				identifier: "id",
				sseOrigin: "http://something.com",
				userIds: [],
			})

			await sseFacade.connect()

			await sseFacade.removeUser("user1")

			verify(sseStorage.removeUser("user1"))
			verify(notificationHandler.onUserRemoved("user1"))
			// that was the last user
			verify(sseStorage.clear())
			verify(notificationHandler.onLocalDataInvalidated())

			verify(sseClient.connect(matchers.anything()), { times: 1 })
		})
	})
})
