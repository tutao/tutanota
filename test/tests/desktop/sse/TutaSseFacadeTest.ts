import o, { assertThrows } from "@tutao/otest"
import { MISSED_NOTIFICATION_TTL, TutaSseFacade } from "../../../../src/applications/common/desktop/sse/TutaSseFacade.js"
import { func, matchers, object, verify, when } from "testdouble"
import { SseStorage } from "../../../../src/applications/common/desktop/sse/SseStorage.js"
import TutaNotificationHandler from "../../../../src/applications/common/desktop/sse/TutaNotificationHandler.js"
import { SseClient, SseConnectOptions } from "../../../../src/applications/common/desktop/sse/SseClient.js"
import { fetch as undiciFetch } from "undici"

import { assertNotNull, DateProvider, deepEqual, stringToUtf8Uint8Array } from "../../../../src/platform-kit/utils"
import {
	clientInitializedTypeModelResolver,
	createTestEntity,
	instancePipelineFromTypeModelResolver,
	mockFetchRequest,
	removeAggregateIds,
	removeOriginals,
} from "../../TestUtils.js"
import { SseInfo } from "../../../../src/applications/common/desktop/sse/SseInfo.js"
import { InstancePipeline, TypeModelResolver } from "../../../../src/platform-kit/instance-pipeline"
import { aes256RandomKey, aesEncrypt } from "../../../../src/platform-kit/crypto"
import { DesktopAlarmStorage } from "../../../../src/applications/common/desktop/sse/DesktopAlarmStorage"
import { DesktopAlarmScheduler } from "../../../../src/applications/common/desktop/sse/DesktopAlarmScheduler"
import { EncryptedMissedNotification } from "../../../../src/app-kit/native-bridge/common/EncryptedMissedNotification"
import { CryptoError } from "../../../../src/platform-kit/crypto/error"
import { idToElementId, OperationType } from "../../../../src/platform-kit/meta"
import {
	AlarmInfoTypeRef,
	AlarmNotificationTypeRef,
	CalendarEventRefTypeRef,
	createAlarmInfo,
	createAlarmNotification,
	createCalendarEventRef,
	createIdTupleWrapper,
	createNotificationSessionKey,
	MissedNotificationTypeRef,
	NotificationInfoTypeRef,
	NotificationSessionKeyTypeRef,
	SseConnectData,
	SseConnectDataTypeRef,
	sysTypeModels,
} from "@tutao/entities/sys"
import { IncomingServerJson } from "../../../../src/platform-kit/instance-pipeline/TypeMapper"
import { InstanceDirection, ParsedValue } from "../../../../src/platform-kit/instance-pipeline/ParsedValue"
import { changeInstanceDirection } from "../../instance-pipeline/InstancePipelineTestUtils"

const APP_V = env.versionNumber

const { anything } = matchers

o.spec("TutaSseFacadeTest", () => {
	let sseFacade: TutaSseFacade
	let sseStorage: SseStorage
	let notificationHandler: TutaNotificationHandler
	let sseClient: SseClient
	let alarmStorage: DesktopAlarmStorage = object()
	let alarmScheduler: DesktopAlarmScheduler = object()
	let fetch: typeof undiciFetch
	let date: DateProvider
	let nativeInstancePipeline: InstancePipeline
	let typeModelResolver: TypeModelResolver

	o.beforeEach(() => {
		sseStorage = object()
		notificationHandler = object()
		sseClient = object()
		alarmStorage = object()
		alarmScheduler = object()
		fetch = func<typeof undiciFetch>()
		date = object()
		typeModelResolver = clientInitializedTypeModelResolver()
		nativeInstancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
		sseFacade = new TutaSseFacade(sseStorage, notificationHandler, sseClient, alarmStorage, alarmScheduler, APP_V, fetch, date, nativeInstancePipeline)
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
			const sseConnectDataTypeModel = await typeModelResolver.resolveServerTypeReference(SseConnectDataTypeRef)
			verify(
				sseClient.connect(
					matchers.argThat(async (opts: SseConnectOptions) => {
						const actualUrl = opts.url
						const actualBody = IncomingServerJson.expectSingleInstance(assertNotNull(actualUrl.searchParams.get("_body")), sseConnectDataTypeModel)
						const connectData = await nativeInstancePipeline.decryptAndMap<SseConnectData>(actualBody, null)
						return (
							actualUrl.origin === expectedUrl.origin &&
							connectData.identifier === "id" &&
							connectData.userIds.length === 1 &&
							connectData.userIds[0].value === "userId" &&
							deepEqual(opts.headers, {
								v: sysTypeModels[MissedNotificationTypeRef.typeId].version,
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
				v: sysTypeModels[MissedNotificationTypeRef.typeId].version,
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
					createNotificationSessionKey({
						pushIdentifier: ["pListId", "pElementId"],
						pushIdentifierSessionEncSessionKey: stringToUtf8Uint8Array("sk"),
					}),
				],
				user: "userId",
			})
			const notificationInfo = createTestEntity(NotificationInfoTypeRef, {
				_id: "notificationInfoId",
				userId: "userId",
				mailId: createIdTupleWrapper({
					listId: "mailListId",
					listElementId: "mailElementId",
				}),
				mailAddress: "test@mail.address",
			})
			const missedNotification = createTestEntity(MissedNotificationTypeRef, {
				_ownerEncSessionKey: null,
				_ownerKeyVersion: null,
				_kdfNonce: null,
				_ownerGroup: "ownerGroupId",
				_permissions: "permissionsId",
				lastProcessedNotificationId: "lastProcessedNotificationId",
				alarmNotifications: [alarmNotification],
				notificationInfos: [notificationInfo],
			})

			const sk = aes256RandomKey()
			const untypedInstance = (await nativeInstancePipeline.mapAndEncrypt(MissedNotificationTypeRef, missedNotification, sk)).getJsonRepresentation()
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
					matchers.argThat((actualNotificationInfos) => {
						const actualNotificationInfo = actualNotificationInfos[0]
						actualNotificationInfo.mailId._id = null
						removeOriginals(actualNotificationInfo)
						return deepEqual(actualNotificationInfo, notificationInfo)
					}),
				),
			)
			verify(
				alarmScheduler.handleCreateAlarm(
					matchers.argThat((actualAlarmNotification) => {
						return deepEqual(
							removeOriginals(removeAggregateIds(actualAlarmNotification, true)),
							removeOriginals(removeAggregateIds(alarmNotification, true)),
						)
					}),
				),
			)
		})

		o("handles alarm delete notification", async function () {
			const missedNotification = createTestEntity(MissedNotificationTypeRef, {
				_id: idToElementId("id"),
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
			// casting here is fine, since we just want to mimic server response data
			const untypedInstance = await nativeInstancePipeline.mapAndEncryptToParsedInstance(MissedNotificationTypeRef, missedNotification, sk)
			const encryptedMissedNotification = new EncryptedMissedNotification(untypedInstance)
			await sseFacade.handleAlarmNotification(encryptedMissedNotification)
			verify(alarmScheduler.handleDeleteAlarm("alarmId"))
		})

		o("alarmnotification with unavailable pushIdentifierSessionKey", async function () {
			const missedNotification = createTestEntity(MissedNotificationTypeRef, {
				_id: idToElementId("id"),
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
			// casting here is fine, since we just want to mimic server response data
			const untypedInstance = await nativeInstancePipeline.mapAndEncryptToParsedInstance(MissedNotificationTypeRef, missedNotification, sk)
			const encryptedMissedNotification = new EncryptedMissedNotification(untypedInstance)

			await assertThrows(CryptoError, () => sseFacade.handleAlarmNotification(encryptedMissedNotification))
			verify(alarmStorage.getNotificationSessionKey(anything()))
		})

		o("alarmnotification with corrupt fields", async function () {
			const missedNotification = createTestEntity(MissedNotificationTypeRef, {
				_id: idToElementId("id"),
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

			const encryptedNotificationInstance = await nativeInstancePipeline.mapAndEncryptToParsedInstance(MissedNotificationTypeRef, missedNotification, sk)
			encryptedNotificationInstance
				.getAttributeByName("alarmNotifications")
				.asNestedObjList()[0]
				// encrypt with another random sessionKey so that decrypt fails later
				.addAttributeByName("eventStart", ParsedValue.fromByteArray(aesEncrypt(aes256RandomKey(), stringToUtf8Uint8Array("0"))))

			// simulate notification is coming from server
			changeInstanceDirection(encryptedNotificationInstance, InstanceDirection.IncomingFromServer)

			const encryptedMissedNotification = new EncryptedMissedNotification(encryptedNotificationInstance)

			const err = await assertThrows(CryptoError, () => sseFacade.handleAlarmNotification(encryptedMissedNotification))
			verify(alarmStorage.removePushIdentifierKey(anything()))
			o(err.message).deepEquals("could not find session key to decrypt alarm notification")
		})

		o.test("passes lastProcessedNotificationId if present", async () => {
			const previousLastProcessedNotificationId = "previousLastProcessedNotificationId"
			const newLastProcessedNotificationId = "newLastProcessedNotificationId"
			const headers: Record<string, string> = {
				userIds: "userId",
				v: sysTypeModels[MissedNotificationTypeRef.typeId].version,
				cv: env.versionNumber,
				lastProcessedNotificationId: previousLastProcessedNotificationId,
			}
			setupSseInfo()
			when(sseStorage.getLastProcessedNotificationId()).thenResolve(previousLastProcessedNotificationId)

			const missedNotification = createTestEntity(MissedNotificationTypeRef, {
				_ownerEncSessionKey: null,
				_ownerKeyVersion: null,
				_kdfNonce: null,
				_ownerGroup: "ownerGroupId",
				_permissions: "permissionsId",
				lastProcessedNotificationId: newLastProcessedNotificationId,
				alarmNotifications: [],
				notificationInfos: [],
			})

			const sk = aes256RandomKey()
			const untypedInstance = await nativeInstancePipeline.mapAndEncrypt(MissedNotificationTypeRef, missedNotification, sk)

			await sseFacade.connect()

			const jsonDefer = mockFetchRequest(
				fetch,
				"http://something.com/rest/sys/missednotification/aWQ",
				headers,
				200,
				untypedInstance.getJsonRepresentation(),
			)

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
			const body = IncomingServerJson.expectSingleInstance(
				url.searchParams.get("_body")!,
				await typeModelResolver.resolveServerTypeReference(SseConnectDataTypeRef),
			)

			const instance = await nativeInstancePipeline.decryptAndMap<SseConnectData>(body, null)
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
