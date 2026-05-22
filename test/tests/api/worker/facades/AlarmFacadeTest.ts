import o from "@tutao/otest"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver } from "../../../TestUtils"
import { matchers, object, verify, when } from "testdouble"
import { assertNotNull } from "@tutao/utils"
import { AesKey, base64ToKey, CryptoWrapper, VersionedKey } from "@tutao/crypto"
import { InstancePipeline } from "@tutao/instance-pipeline"
import { AlarmFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/AlarmFacade"
import { InfoMessageHandler } from "../../../../../src/applications/common/gui/InfoMessageHandler"
import { AlarmInfoTemplate, EventWithUserAlarmInfos } from "../../../../../src/applications/common/api/worker/facades/lazy/CalendarFacade"
import { makeEmptyCalendarEvent } from "../../../../../src/applications/common/api/common/utils/CommonCalendarUtils"
import type { EventAlarmInfoTemplatesTuple } from "../../../../../src/applications/common/calendar/gui/ImportExportUtils"
import { NativePushFacade } from "@tutao/native-bridge/generatedIpc/types"
import { UserFacade } from "../../../../../src/platform-kits/base/facades/UserFacade"
import { IServiceExecutor } from "../../../../../src/platform-kits/network/ServiceRequest"
import { CryptoFacade } from "../../../../../src/platform-kits/base/crypto/CryptoFacade"
import { elementIdPart, listIdPart, OperationType } from "@tutao/meta"
import {
	AlarmInfoTypeRef,
	AlarmNotification,
	AlarmNotificationTypeRef,
	AlarmService,
	CalendarEventRefTypeRef,
	createAlarmInfo,
	createAlarmNotification,
	createAlarmServicePost,
	createCalendarEventRef,
	createUserAlarmInfoData,
	GroupMembership,
	GroupMembershipTypeRef,
	PushIdentifier,
	PushIdentifierTypeRef,
	User,
	UserAlarmInfoData,
	UserAlarmInfoTypeRef,
	UserTypeRef,
} from "@tutao/entities/sys"
import { CalendarEvent, CalendarEventTypeRef, createCalendarEvent } from "@tutao/entities/tutanota"

o.spec("AlarmFacadeTest", function () {
	let nativePushFacadeMock: NativePushFacade
	let userFacadeMock: UserFacade
	let cryptoWrapperMock: CryptoWrapper
	let serviceExecutorMock: IServiceExecutor
	let cryptoFacadeMock: CryptoFacade
	let infoMessageHandlerMock: InfoMessageHandler

	let instancePipeline: InstancePipeline
	let alarmFacade: AlarmFacade

	let user: User
	let userGroupMembership: GroupMembership

	o.beforeEach(function () {
		const typeModelResolver = clientInitializedTypeModelResolver()
		instancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)
		nativePushFacadeMock = object()
		userFacadeMock = object()
		cryptoWrapperMock = object()
		serviceExecutorMock = object()
		cryptoFacadeMock = object()
		infoMessageHandlerMock = object()

		userGroupMembership = createTestEntity(GroupMembershipTypeRef, {
			group: "userGroupId",
		})
		user = createTestEntity(UserTypeRef, { _id: "userId", userGroup: userGroupMembership })

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
		let personalCalendarEvent: CalendarEvent
		let personalAlarmInfoTemplate: AlarmInfoTemplate

		const userGroupKey: VersionedKey = object()

		const ownerEncSessionKey = new Uint8Array(1)
		const encryptedTrigger = new Uint8Array(1)

		o.beforeEach(function () {
			when(userFacadeMock.getUserGroupId()).thenReturn(user.userGroup.group)
			when(userFacadeMock.getCurrentUserGroupKey()).thenReturn(userGroupKey)

			personalCalendarEvent = createCalendarEvent(makeEmptyCalendarEvent())
			personalCalendarEvent._id = ["listId", "eventId"]
			personalAlarmInfoTemplate = {
				alarmIdentifier: "personalAlarm",
				trigger: "1D",
			}

			when(cryptoWrapperMock.encryptKey(matchers.anything(), matchers.anything())).thenReturn(ownerEncSessionKey)
			when(cryptoWrapperMock.encryptString(matchers.anything(), personalAlarmInfoTemplate.trigger)).thenReturn(encryptedTrigger)
		})

		o.test("successful scenario", async function () {
			const calendarEventRef = createCalendarEventRef({
				listId: listIdPart(personalCalendarEvent._id),
				elementId: elementIdPart(personalCalendarEvent._id),
			})
			const alarmNotifications: AlarmNotification[] = [
				createAlarmNotification({
					alarmInfo: createAlarmInfo({ ...personalAlarmInfoTemplate, calendarRef: calendarEventRef }),
					repeatRule: null,
					notificationSessionKeys: [],
					operation: OperationType.CREATE,
					summary: personalCalendarEvent.summary,
					eventStart: personalCalendarEvent.startTime,
					eventEnd: personalCalendarEvent.endTime,
					user: user._id,
				}),
			]
			const userAlarmInfoData: UserAlarmInfoData[] = [
				createUserAlarmInfoData({
					ownerEncSessionKey,
					ownerKeyVersion: userGroupKey.version.toString(),
					encryptedTrigger,
					alarmIdentifier: personalAlarmInfoTemplate.alarmIdentifier,
					ownerGroup: user.userGroup.group,
					calendarEventRef: calendarEventRef,
				}),
			]
			const alarmServicePostData = createAlarmServicePost({ alarmNotifications, userAlarmInfoData })

			const eventAlarmsTuple: EventAlarmInfoTemplatesTuple = {
				event: personalCalendarEvent,
				alarmInfoTemplates: [personalAlarmInfoTemplate],
			}
			const pushIdentifier: PushIdentifier = object()

			await alarmFacade.createAlarms(user, [eventAlarmsTuple], [pushIdentifier])

			verify(serviceExecutorMock.post(AlarmService, alarmServicePostData, matchers.anything()), { times: 1 })
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
			const calendarRef = createTestEntity(CalendarEventRefTypeRef, { elementId: "elementId", listId: "listId" })
			const allAlarmEvents: Array<EventWithUserAlarmInfos> = [
				{
					event: createTestEntity(CalendarEventTypeRef),
					userAlarmInfos: [createTestEntity(UserAlarmInfoTypeRef, { alarmInfo: createTestEntity(AlarmInfoTypeRef, { calendarRef }) })],
				},
			]

			const pushIdentifier = createTestEntity(PushIdentifierTypeRef, { _id: ["listId", "pushId"] })
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
			const instanceSentToFacade = await instancePipeline.decryptAndMap(AlarmNotificationTypeRef, instanceLiteralSentToFacade, sessionKey)
			o(instanceSentToFacade.operation).equals(OperationType.CREATE)
		})
	})
})
