import o from "@tutao/otest"
import { MISSED_NOTIFICATION_TTL, TutaSseFacade } from "../../../../src/common/desktop/sse/TutaSseFacade.js"
import { func, matchers, object, verify, when } from "testdouble"
import { SseStorage } from "../../../../src/common/desktop/sse/SseStorage.js"
import { TutaNotificationHandler } from "../../../../src/common/desktop/sse/TutaNotificationHandler.js"
import { SseClient, SseConnectOptions } from "../../../../src/common/desktop/sse/SseClient.js"
import { fetch as undiciFetch } from "undici"
import { typeModels } from "../../../../src/common/api/entities/sys/TypeModels.js"
import { assertNotNull, deepEqual, downcast, stringToBase64, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { DateProvider } from "../../../../src/common/api/common/DateProvider.js"
import {
	AlarmInfoTypeRef,
	AlarmNotificationTypeRef,
	CalendarEventRefTypeRef,
	createAlarmInfo,
	createAlarmNotification,
	createCalendarEventRef,
	createIdTupleWrapper,
	createMissedNotification,
	createNotificationInfo,
	MissedNotificationTypeRef,
	NotificationInfo,
	NotificationSessionKeyTypeRef,
	SseConnectDataTypeRef,
} from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { createTestEntity, mockFetchRequest, removeAggregateIds, removeFinalIvs } from "../../TestUtils.js"
import { SseInfo } from "../../../../src/common/desktop/sse/SseInfo.js"
import { OperationType } from "../../../../src/common/api/common/TutanotaConstants"
import { resolveTypeReference } from "../../../../src/common/api/common/EntityFunctions"
import { InstancePipeline } from "../../../../src/common/api/worker/crypto/InstancePipeline"
import { aes256RandomKey } from "@tutao/tutanota-crypto"
import { StrippedEntity } from "../../../../src/common/api/common/utils/EntityUtils"
import { UntypedInstance } from "../../../../src/common/api/common/EntityTypes"
import { DesktopAlarmStorage } from "../../../../src/common/desktop/sse/DesktopAlarmStorage"
import { DesktopAlarmScheduler } from "../../../../src/common/desktop/sse/DesktopAlarmScheduler"
import { EncryptedMissedNotification } from "../../../../src/common/native/common/EncryptedMissedNotification"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { AttributeModel } from "../../../../src/common/api/common/AttributeModel"

const APP_V = env.versionNumber

const instancePipeline = new InstancePipeline(resolveTypeReference, resolveTypeReference)
const { anything } = matchers

o.spec("TutaSseFacade", () => {
	let sseFacade: TutaSseFacade
	let sseStorage: SseStorage
	let notificationHandler: TutaNotificationHandler
	let sseClient: SseClient
	let alarmStorage: DesktopAlarmStorage = object()
	let alarmScheduler: DesktopAlarmScheduler = object()
	let fetch: typeof undiciFetch
	let date: DateProvider
	o.beforeEach(() => {
		sseStorage = object()
		notificationHandler = object()
		sseClient = object()
		alarmStorage = object()
		alarmScheduler = object()
		fetch = func<typeof undiciFetch>()
		date = object()
		sseFacade = new TutaSseFacade(sseStorage, notificationHandler, sseClient, alarmStorage, alarmScheduler, APP_V, fetch, date)
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
		o.test("connect should connect via sse", async () => {
			setupSseInfo()
			await sseFacade.connect()
			const expectedUrl = new URL(
				"http://something.com/sse?_body=%7B%221353%22%3A%220%22%2C%221354%22%3A%22id%22%2C%221355%22%3A%5B%7B%221351%22%3A%22userId%22%7D%5D%7D",
			) // '{"1353":"0","1354":"id", "1355": [{"1351":"userId"}]}'
			verify(
				sseClient.connect(
					matchers.argThat(async (opts: SseConnectOptions) => {
						const actualUrl = opts.url
						const actualBody: UntypedInstance = JSON.parse(assertNotNull(actualUrl.searchParams.get("_body")))
						const connectData = await instancePipeline.decryptAndMapToClient(SseConnectDataTypeRef, actualBody, null)
						return (
							actualUrl.origin === expectedUrl.origin &&
							connectData.identifier === "id" &&
							connectData.userIds.length === 1 &&
							connectData.userIds[0].value === "userId" &&
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
				notificationSessionKeys: [
					createTestEntity(NotificationSessionKeyTypeRef, {
						pushIdentifier: ["pListId", "pElementId"],
						pushIdentifierSessionEncSessionKey: stringToUtf8Uint8Array("sk"),
					}),
				],
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
				alarmNotifications: [alarmNotification],
				notificationInfos: [notificationInfo],
			})

			const sk = aes256RandomKey()
			const untypedInstance = await instancePipeline.mapToServerAndEncrypt(MissedNotificationTypeRef, missedNotification, sk)
			const strippedEncryptedNotificationInfo: StrippedEntity<NotificationInfo> = {
				mailAddress: notificationInfo.mailAddress,
				userId: notificationInfo.userId,
				mailId: notificationInfo.mailId,
			}

			const jsonDefer = mockFetchRequest(fetch, "http://something.com/rest/sys/missednotification/aWQ", headers, 200, untypedInstance)

			when(alarmStorage.getNotificationSessionKey(alarmNotification.notificationSessionKeys)).thenResolve({
				sessionKey: sk,
				notificationSessionKey: alarmNotification.notificationSessionKeys[0],
			})

			await sseFacade.onNewMessage("data: notification")

			await jsonDefer
			verify(sseStorage.setLastProcessedNotificationId("lastProcessedNotificationId"))
			verify(sseStorage.recordMissedNotificationCheckTime())
			verify(
				notificationHandler.onMailNotification(
					sseInfo,
					matchers.argThat((actualNotificationInfo) => {
						actualNotificationInfo.mailId._id = null
						removeFinalIvs(actualNotificationInfo)
						return deepEqual(actualNotificationInfo, notificationInfo)
					}),
				),
			)
			verify(
				alarmScheduler.handleCreateAlarm(
					matchers.argThat((actualAlarmNotification) => {
						removeAggregateIds(removeFinalIvs(actualAlarmNotification), true)
						return deepEqual(actualAlarmNotification, alarmNotification)
					}),
					null,
				),
			)
		})

		o("handles alarm delete notification", async function () {
			const missedNotification = createTestEntity(MissedNotificationTypeRef, {
				_id: "id",
				_permissions: "permissionsId",
				alarmNotifications: [
					createTestEntity(AlarmNotificationTypeRef, {
						_id: "id",
						operation: OperationType.DELETE,
						alarmInfo: createTestEntity(AlarmInfoTypeRef, {
							alarmIdentifier: "alarmId",
							calendarRef: createTestEntity(CalendarEventRefTypeRef, {
								listId: "listId",
								elementId: "id",
							}),
						}),
						notificationSessionKeys: [
							createTestEntity(NotificationSessionKeyTypeRef, {
								pushIdentifier: ["listId", "pid"],
								pushIdentifierSessionEncSessionKey: stringToUtf8Uint8Array("dummy"),
							}),
						],
						user: "userid",
					}),
				],
			})

			const sk = aes256RandomKey()
			when(alarmStorage.getNotificationSessionKey(anything())).thenResolve({
				sessionKey: sk,
				notificationSessionKey: createTestEntity(NotificationSessionKeyTypeRef, {
					pushIdentifier: ["pushIdentifierList", "pid"],
					pushIdentifierSessionEncSessionKey: stringToUtf8Uint8Array("dummy"),
				}),
			})
			const untypedInstance = await instancePipeline.mapToServerAndEncrypt(MissedNotificationTypeRef, missedNotification, sk)
			const encryptedMissedNotification = await EncryptedMissedNotification.from(untypedInstance)
			await sseFacade.handleAlarmNotification(encryptedMissedNotification)
			verify(alarmScheduler.handleDeleteAlarm("alarmId"))
		})

		o("alarmnotification with unavailable pushIdentifierSessionKey", async function () {
			const missedNotification = createTestEntity(MissedNotificationTypeRef, {
				_id: "id",
				_permissions: "permissionsId",
				alarmNotifications: [
					createTestEntity(AlarmNotificationTypeRef, {
						_id: "id",
						alarmInfo: createTestEntity(AlarmInfoTypeRef, {
							calendarRef: createTestEntity(CalendarEventRefTypeRef, {
								listId: "listId",
								elementId: "id",
							}),
						}),
						notificationSessionKeys: [
							createTestEntity(NotificationSessionKeyTypeRef, {
								pushIdentifier: ["listId", "pid"],
								pushIdentifierSessionEncSessionKey: stringToUtf8Uint8Array("dummy"),
							}),
						],
						user: "userid",
					}),
				],
			})

			const sk = aes256RandomKey()
			when(alarmStorage.getNotificationSessionKey(anything())).thenResolve(null)
			const untypedInstance = await instancePipeline.mapToServerAndEncrypt(MissedNotificationTypeRef, missedNotification, sk)
			const encryptedMissedNotification = await EncryptedMissedNotification.from(untypedInstance)

			await assertThrows(CryptoError, () => sseFacade.handleAlarmNotification(encryptedMissedNotification))
			verify(alarmStorage.getNotificationSessionKey(anything()))
		})

		o("alarmnotification with corrupt fields", async function () {
			const missedNotification = createTestEntity(MissedNotificationTypeRef, {
				_id: "id",
				_permissions: "permissionsId",
				alarmNotifications: [
					createTestEntity(AlarmNotificationTypeRef, {
						_id: "id",
						alarmInfo: createTestEntity(AlarmInfoTypeRef, {
							calendarRef: createTestEntity(CalendarEventRefTypeRef, {
								listId: "listId",
								elementId: "id",
							}),
						}),
						notificationSessionKeys: [
							createTestEntity(NotificationSessionKeyTypeRef, {
								pushIdentifier: ["listId", "pid"],
								pushIdentifierSessionEncSessionKey: stringToUtf8Uint8Array("dummy"),
							}),
						],
						user: "userid",
					}),
				],
			})

			const sk = aes256RandomKey()
			when(alarmStorage.getNotificationSessionKey(anything())).thenResolve({
				sessionKey: sk,
				notificationSessionKey: createTestEntity(NotificationSessionKeyTypeRef, {
					pushIdentifier: ["pushIdentifierList", "pid"],
					pushIdentifierSessionEncSessionKey: stringToUtf8Uint8Array("dummy"),
				}),
			})
			when(alarmStorage.removePushIdentifierKey("pid")).thenDo(() => {
				when(alarmStorage.getNotificationSessionKey(anything())).thenResolve(null)
			})

			const untypedInstance = await instancePipeline.mapToServerAndEncrypt(MissedNotificationTypeRef, missedNotification, sk)
			const missedNotificationTypeModel = await resolveTypeReference(MissedNotificationTypeRef)
			const alarmNotificationTypeModel = await resolveTypeReference(AlarmNotificationTypeRef)
			const anAttrId = assertNotNull(AttributeModel.getAttributeId(missedNotificationTypeModel, "alarmNotifications"))
			const eventStartAttrId = assertNotNull(AttributeModel.getAttributeId(alarmNotificationTypeModel, "eventStart"))
			downcast<Array<UntypedInstance>>(untypedInstance[anAttrId])[0][eventStartAttrId] = stringToBase64("newDate")
			const encryptedMissedNotification = await EncryptedMissedNotification.from(untypedInstance)

			await assertThrows(CryptoError, () => sseFacade.handleAlarmNotification(encryptedMissedNotification))
			verify(alarmStorage.removePushIdentifierKey(anything()))
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

			const sk = aes256RandomKey()
			const untypedInstance = await instancePipeline.mapToServerAndEncrypt(MissedNotificationTypeRef, missedNotification, sk)

			await sseFacade.connect()

			const jsonDefer = mockFetchRequest(fetch, "http://something.com/rest/sys/missednotification/aWQ", headers, 200, untypedInstance)

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

			const instance = await instancePipeline.decryptAndMapToClient(SseConnectDataTypeRef, JSON.parse(body), null)
			o(instance.userIds.length).equals(1)
			o(instance.userIds[0].value).equals("user1")
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
