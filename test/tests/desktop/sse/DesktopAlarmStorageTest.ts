import o from "@tutao/otest"
import { instance, matchers, object, verify, when } from "testdouble"
import { DesktopAlarmStorage } from "../../../../src/common/desktop/sse/DesktopAlarmStorage.js"
import { DesktopConfig } from "../../../../src/common/desktop/config/DesktopConfig.js"
import { DesktopNativeCryptoFacade } from "../../../../src/common/desktop/DesktopNativeCryptoFacade.js"
import type { DesktopKeyStoreFacade } from "../../../../src/common/desktop/DesktopKeyStoreFacade.js"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver, makeKeyStoreFacade } from "../../TestUtils.js"
import { DesktopConfigKey } from "../../../../src/common/desktop/config/ConfigKeys.js"
import { assertNotNull, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { InstancePipeline } from "../../../../src/common/api/worker/crypto/InstancePipeline"
import { TypeModelResolver } from "../../../../src/common/api/common/EntityFunctions"
import { aes256RandomKey, bitArrayToUint8Array, encryptKey, uint8ArrayToBitArray } from "@tutao/tutanota-crypto"
import {
	AlarmInfoTypeRef,
	AlarmNotificationTypeRef,
	CalendarEventRefTypeRef,
	NotificationSessionKeyTypeRef,
} from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { hasError } from "../../../../src/common/api/common/utils/ErrorUtils.js"

o.spec("DesktopAlarmStorageTest", function () {
	let cryptoMock: DesktopNativeCryptoFacade
	let confMock: DesktopConfig
	let typeModelResolver: TypeModelResolver
	let instancePipeline: InstancePipeline
	let desktopStorage: DesktopAlarmStorage

	const key1 = new Uint8Array([1])
	const key2 = new Uint8Array([2])
	const key3 = new Uint8Array([3])
	const key4 = new Uint8Array([4])
	const decryptedKey = new Uint8Array([0, 1])
	const encryptedKey = new Uint8Array([1, 0])

	o.beforeEach(function () {
		cryptoMock = instance(DesktopNativeCryptoFacade)
		when(cryptoMock.unauthenticatedAes256DecryptKey(matchers.anything(), key3)).thenReturn(decryptedKey)
		when(cryptoMock.aes256EncryptKey(matchers.anything(), matchers.anything())).thenReturn(encryptedKey)

		confMock = object()
		when(confMock.getVar(DesktopConfigKey.pushEncSessionKeys)).thenResolve({
			user1: uint8ArrayToBase64(key1),
			user2: uint8ArrayToBase64(key2),
			twoId: uint8ArrayToBase64(key3),
			fourId: uint8ArrayToBase64(key4),
		})

		typeModelResolver = clientInitializedTypeModelResolver()
		instancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
		const keyStoreFacade: DesktopKeyStoreFacade = makeKeyStoreFacade(new Uint8Array([1, 2, 3]))
		desktopStorage = new DesktopAlarmStorage(confMock, cryptoMock, keyStoreFacade, instancePipeline, typeModelResolver)
	})

	o("getPushIdentifierSessionKey with uncached sessionKey", async function () {
		const pushIdentifier: IdTuple = ["oneId", "twoId"]
		const key = await desktopStorage.getPushIdentifierSessionKey(pushIdentifier)

		verify(confMock.getVar(DesktopConfigKey.pushEncSessionKeys), { times: 1 })
		o(Array.from(assertNotNull(key))).deepEquals(uint8ArrayToBitArray(decryptedKey))
	})

	o("getPushIdentifierSessionKey with cached sessionKey", async function () {
		when(confMock.getVar(matchers.anything())).thenResolve(null)
		await desktopStorage.storePushIdentifierSessionKey("fourId", key4)

		verify(confMock.setVar(DesktopConfigKey.pushEncSessionKeys, { fourId: uint8ArrayToBase64(encryptedKey) }), { times: 1 })

		const pushIdentifier: IdTuple = ["threeId", "fourId"]
		const key = await desktopStorage.getPushIdentifierSessionKey(pushIdentifier)
		o(Array.from(assertNotNull(key))).deepEquals(uint8ArrayToBitArray(key4))
	})

	o("getPushIdentifierSessionKey when sessionKey is unavailable", async function () {
		const pushIdentifier: IdTuple = ["fiveId", "sixId"]
		const key1 = await desktopStorage.getPushIdentifierSessionKey(pushIdentifier)
		o(key1).equals(null)
	})

	o("storing new alarm does not change unrelated alarm session keys", async function () {
		const keyStoreFacade: DesktopKeyStoreFacade = makeKeyStoreFacade(new Uint8Array([1, 2, 3]))
		when(confMock.getVar(matchers.anything())).thenResolve(null)

		const notificationSessionKey = aes256RandomKey()
		const pushSessionKey = aes256RandomKey()
		const pushIdentifierSessionEncSessionKey = encryptKey(pushSessionKey, notificationSessionKey)

		const desktopStorage: DesktopAlarmStorage = new DesktopAlarmStorage(confMock, cryptoMock, keyStoreFacade, instancePipeline, typeModelResolver)
		await desktopStorage.storePushIdentifierSessionKey("fourId", bitArrayToUint8Array(pushSessionKey))
		const pushIdentifier: IdTuple = ["threeId", "fourId"]
		const pushIdentifierSessionKey = await desktopStorage.getPushIdentifierSessionKey(pushIdentifier)
		o(Array.from(assertNotNull(pushIdentifierSessionKey))).deepEquals(pushSessionKey)

		const alarmNotification = createTestEntity(AlarmNotificationTypeRef, {
			_id: "alarmNotificationA",
			alarmInfo: createTestEntity(AlarmInfoTypeRef, {
				calendarRef: createTestEntity(CalendarEventRefTypeRef, {
					elementId: "elementIdA",
					listId: "listIdA",
				}),
			}),
			notificationSessionKeys: [
				createTestEntity(NotificationSessionKeyTypeRef, {
					pushIdentifier,
					pushIdentifierSessionEncSessionKey: pushIdentifierSessionEncSessionKey,
				}),
			],
			user: "userIdA",
		})

		await desktopStorage.storeAlarm(alarmNotification)
		const expectedAlarmsCaptor = matchers.captor()
		verify(confMock.setVar(DesktopConfigKey.scheduledAlarms, expectedAlarmsCaptor.capture()))
		let decryptedSavedAlarmNotification = await instancePipeline.decryptAndMap(
			AlarmNotificationTypeRef,
			assertNotNull(expectedAlarmsCaptor.values)[0][0],
			notificationSessionKey,
		)
		o(alarmNotification._id).equals(decryptedSavedAlarmNotification._id)
		o(hasError(decryptedSavedAlarmNotification)).equals(false)

		const newNotificationSessionKey = aes256RandomKey()
		const newPushSessionKey = aes256RandomKey()
		const newPushIdentifierSessionEncSessionKey = encryptKey(newPushSessionKey, newNotificationSessionKey)

		await desktopStorage.storePushIdentifierSessionKey("fiveId", bitArrayToUint8Array(newPushSessionKey))
		const newPushIdentifier: IdTuple = ["threeId", "fiveId"]
		const newPushIdentifierSessionKey = await desktopStorage.getPushIdentifierSessionKey(newPushIdentifier)
		o(Array.from(assertNotNull(newPushIdentifierSessionKey))).deepEquals(newPushSessionKey)

		const newAlarmNotification = createTestEntity(AlarmNotificationTypeRef, {
			_id: "alarmNotificationB",
			alarmInfo: createTestEntity(AlarmInfoTypeRef, {
				calendarRef: createTestEntity(CalendarEventRefTypeRef, {
					elementId: "elementIdB",
					listId: "listIdB",
				}),
			}),
			notificationSessionKeys: [
				createTestEntity(NotificationSessionKeyTypeRef, {
					pushIdentifier: newPushIdentifier,
					pushIdentifierSessionEncSessionKey: newPushIdentifierSessionEncSessionKey,
				}),
			],
			user: "userIdB",
		})

		await desktopStorage.storeAlarm(newAlarmNotification)
		const newExpectedAlarmsCaptor = matchers.captor()
		verify(confMock.setVar(DesktopConfigKey.scheduledAlarms, newExpectedAlarmsCaptor.capture()))

		// assert that we can decrypt correctly and data alarm notifications match the previously stored ones
		let oldDecryptedSavedAlarmNotification = await instancePipeline.decryptAndMap(
			AlarmNotificationTypeRef,
			assertNotNull(newExpectedAlarmsCaptor.values)[0][0],
			notificationSessionKey,
		)
		let newDecryptedSavedAlarmNotification = await instancePipeline.decryptAndMap(
			AlarmNotificationTypeRef,
			assertNotNull(newExpectedAlarmsCaptor.values)[1][0],
			newNotificationSessionKey,
		)
		o(alarmNotification._id).equals(oldDecryptedSavedAlarmNotification._id)
		o(newAlarmNotification._id).equals(newDecryptedSavedAlarmNotification._id)

		const oldAlarmHasErrors = hasError(oldDecryptedSavedAlarmNotification)
		const newAlarmHasErrors = hasError(newDecryptedSavedAlarmNotification)
		o(oldAlarmHasErrors || newAlarmHasErrors).equals(false)
	})
})
