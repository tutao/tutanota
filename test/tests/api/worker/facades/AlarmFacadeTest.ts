import o from "@tutao/otest"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver } from "../../../TestUtils"
import { matchers, object, verify, when } from "testdouble"
import { elementIdPart, listIdPart, sysServices, sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"
import { assertNotNull } from "@tutao/utils"
import { AesKey, base64ToKey, CryptoWrapper, VersionedKey } from "@tutao/crypto"
import { InstancePipeline } from "@tutao/instance-pipeline"
import { AlarmFacade } from "../../../../../src/common/api/worker/facades/lazy/AlarmFacade"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest"
import { CryptoFacade } from "../../../../../src/common/api/worker/crypto/CryptoFacade"
import { InfoMessageHandler } from "../../../../../src/common/gui/InfoMessageHandler"
import { NativePushFacade } from "../../../../../src/common/native/common/generatedipc/NativePushFacade"
import { AlarmInfoTemplate, EventWithUserAlarmInfos } from "../../../../../src/common/api/worker/facades/lazy/CalendarFacade"
import { OperationType } from "@tutao/app-env"
import { makeEmptyCalendarEvent } from "../../../../../src/common/api/common/utils/CommonCalendarUtils"
import type { EventAlarmInfoTemplatesTuple } from "../../../../../src/common/calendar/gui/ImportExportUtils"

o.spec("AlarmFacadeTest", function () {
	let nativePushFacadeMock: NativePushFacade
	let userFacadeMock: UserFacade
	let cryptoWrapperMock: CryptoWrapper
	let serviceExecutorMock: IServiceExecutor
	let cryptoFacadeMock: CryptoFacade
	let infoMessageHandlerMock: InfoMessageHandler

	let instancePipeline: InstancePipeline
	let alarmFacade: AlarmFacade

	let user: sysTypeRefs.User
	let userGroupMembership: sysTypeRefs.GroupMembership

	o.beforeEach(function () {
		const typeModelResolver = clientInitializedTypeModelResolver()
		instancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
		nativePushFacadeMock = object()
		userFacadeMock = object()
		cryptoWrapperMock = object()
		serviceExecutorMock = object()
		cryptoFacadeMock = object()
		infoMessageHandlerMock = object()

		userGroupMembership = createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
			group: "userGroupId",
		})
		user = createTestEntity(sysTypeRefs.UserTypeRef, { _id: "userId", userGroup: userGroupMembership })

		when(userFacadeMock.getLoggedInUser()).thenReturn(user)

		alarmFacade = new AlarmFacade(
			userFacadeMock,
			serviceExecutorMock,
			cryptoWrapperMock,
			cryptoFacadeMock,
			nativePushFacadeMock,
			instancePipeline,
			infoMessageHandlerMock,
		)
	})

	o.spec("createAlarms", function () {
		let personalCalendarEvent: tutanotaTypeRefs.CalendarEvent
		let personalAlarmInfoTemplate: AlarmInfoTemplate

		const userGroupKey: VersionedKey = object()

		const ownerEncSessionKey = new Uint8Array(1)
		const encryptedTrigger = new Uint8Array(1)

		o.beforeEach(function () {
			when(userFacadeMock.getUserGroupId()).thenReturn(user.userGroup.group)
			when(userFacadeMock.getCurrentUserGroupKey()).thenReturn(userGroupKey)

			personalCalendarEvent = tutanotaTypeRefs.createCalendarEvent(makeEmptyCalendarEvent())
			personalCalendarEvent._id = ["listId", "eventId"]
			personalAlarmInfoTemplate = {
				alarmIdentifier: "personalAlarm",
				trigger: "1D",
			}

			when(cryptoWrapperMock.encryptKey(matchers.anything(), matchers.anything())).thenReturn(ownerEncSessionKey)
			when(cryptoWrapperMock.encryptString(matchers.anything(), personalAlarmInfoTemplate.trigger)).thenReturn(encryptedTrigger)
		})

		o.test("successful scenario", async function () {
			const calendarEventRef = sysTypeRefs.createCalendarEventRef({
				listId: listIdPart(personalCalendarEvent._id),
				elementId: elementIdPart(personalCalendarEvent._id),
			})
			const alarmNotifications: sysTypeRefs.AlarmNotification[] = [
				sysTypeRefs.createAlarmNotification({
					alarmInfo: sysTypeRefs.createAlarmInfo({ ...personalAlarmInfoTemplate, calendarRef: calendarEventRef }),
					repeatRule: null,
					notificationSessionKeys: [],
					operation: OperationType.CREATE,
					summary: personalCalendarEvent.summary,
					eventStart: personalCalendarEvent.startTime,
					eventEnd: personalCalendarEvent.endTime,
					user: user._id,
				}),
			]
			const userAlarmInfoData: sysTypeRefs.UserAlarmInfoData[] = [
				sysTypeRefs.createUserAlarmInfoData({
					ownerEncSessionKey,
					ownerKeyVersion: userGroupKey.version.toString(),
					encryptedTrigger,
					alarmIdentifier: personalAlarmInfoTemplate.alarmIdentifier,
					ownerGroup: user.userGroup.group,
					calendarEventRef: calendarEventRef,
				}),
			]
			const alarmServicePostData = sysTypeRefs.createAlarmServicePost({ alarmNotifications, userAlarmInfoData })

			const eventAlarmsTuple: EventAlarmInfoTemplatesTuple = {
				event: personalCalendarEvent,
				alarmInfoTemplates: [personalAlarmInfoTemplate],
			}
			const pushIdentifier: sysTypeRefs.PushIdentifier = object()

			await alarmFacade.createAlarms(user, [eventAlarmsTuple], [pushIdentifier])

			verify(serviceExecutorMock.post(sysServices.AlarmService, alarmServicePostData, matchers.anything()), { times: 1 })
		})
	})

	o.spec("NetworkDebugging", () => {
		let previousNetworkDebugging: boolean

		o.beforeEach(async function () {
			previousNetworkDebugging = env.networkDebugging
		})

		o.afterEach(() => {
			env.networkDebugging = previousNetworkDebugging
		})

		o("scheduleAlarms should receive instance without network debugging info", async () => {
			env.networkDebugging = true
			const calendarRef = createTestEntity(sysTypeRefs.CalendarEventRefTypeRef, { elementId: "elementId", listId: "listId" })
			const allAlarmEvents: Array<EventWithUserAlarmInfos> = [
				{
					event: createTestEntity(tutanotaTypeRefs.CalendarEventTypeRef),
					userAlarmInfos: [
						createTestEntity(sysTypeRefs.UserAlarmInfoTypeRef, { alarmInfo: createTestEntity(sysTypeRefs.AlarmInfoTypeRef, { calendarRef }) }),
					],
				},
			]

			const pushIdentifier = createTestEntity(sysTypeRefs.PushIdentifierTypeRef, { _id: ["listId", "pushId"] })
			const pushIdentifierSessionKey: AesKey = object()
			when(cryptoFacadeMock.resolveSessionKey(pushIdentifier)).thenResolve(pushIdentifierSessionKey)

			const pushIdentifierEncNotificationSessionKey: Uint8Array = new Uint8Array(0x01)
			when(cryptoWrapperMock.encryptKey(pushIdentifierSessionKey, matchers.anything())).thenReturn(pushIdentifierEncNotificationSessionKey)

			const instanceCaptor = matchers.captor()
			const sessionKeyCaptor = matchers.captor()
			when(nativePushFacadeMock.scheduleAlarms(instanceCaptor.capture(), sessionKeyCaptor.capture())).thenResolve()

			await alarmFacade.scheduleAlarmsForNewDevice(pushIdentifier, allAlarmEvents)

			const sessionKey = base64ToKey(sessionKeyCaptor.value)
			const allInstanceSentToFacade = instanceCaptor.value
			const instanceLiteralSentToFacade = assertNotNull(JSON.parse(allInstanceSentToFacade)[0])

			// if we were able to decryptAndMap, it already verifies that no field has network debug info,
			const instanceSentToFacade = await instancePipeline.decryptAndMap(sysTypeRefs.AlarmNotificationTypeRef, instanceLiteralSentToFacade, sessionKey)
			o(instanceSentToFacade.operation).equals(OperationType.CREATE)
		})
	})
})
