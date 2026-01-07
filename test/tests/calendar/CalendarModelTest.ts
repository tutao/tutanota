import o from "@tutao/otest"
import {
	CalendarEvent,
	CalendarEventAttendeeTypeRef,
	CalendarEventTypeRef,
	CalendarGroupRoot,
	CalendarGroupRootTypeRef,
	EncryptedMailAddressTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { clone, downcast, neverNull } from "@tutao/tutanota-utils"
import { CalendarModel } from "../../../src/calendar-app/calendar/model/CalendarModel.js"
import { CalendarAttendeeStatus, CalendarMethod, GroupType, RepeatPeriod } from "../../../src/common/api/common/TutanotaConstants.js"
import { EntityEventsListener, EventController } from "../../../src/common/api/main/EventController.js"
import { Notifications } from "../../../src/common/gui/Notifications.js"
import {
	AlarmInfo,
	AlarmInfoTypeRef,
	GroupInfoTypeRef,
	GroupMember,
	GroupMembership,
	GroupMembershipTypeRef,
	GroupMemberTypeRef,
	GroupTypeRef,
	RepeatRuleTypeRef,
	User,
	UserAlarmInfoListType,
	UserAlarmInfoListTypeTypeRef,
	UserAlarmInfoTypeRef,
	UserTypeRef,
} from "../../../src/common/api/entities/sys/TypeRefs.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { NotFoundError } from "../../../src/common/api/common/error/RestError.js"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { ProgressTracker } from "../../../src/common/api/main/ProgressTracker.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { CachingMode, CalendarEventProgenitor, CalendarEventUidIndexEntry, CalendarFacade } from "../../../src/common/api/worker/facades/lazy/CalendarFacade.js"
import { verify } from "@tutao/tutanota-test-utils"
import type { WorkerClient } from "../../../src/common/api/main/WorkerClient.js"
import { FileController } from "../../../src/common/file/FileController.js"
import { func, instance, matchers, object, when } from "testdouble"
import { createTestEntity } from "../TestUtils.js"
import { IProgressMonitor, NoopProgressMonitor } from "../../../src/common/api/common/utils/ProgressMonitor.js"
import { makeAlarmScheduler } from "./CalendarTestUtils.js"
import { EntityUpdateData } from "../../../src/common/api/common/utils/EntityUpdateUtils.js"
import { MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { ExternalCalendarFacade } from "../../../src/common/native/common/generatedipc/ExternalCalendarFacade.js"
import { DeviceConfig } from "../../../src/common/misc/DeviceConfig.js"
import { SyncTracker } from "../../../src/common/api/main/SyncTracker.js"
import { ClientModelInfo } from "../../../src/common/api/common/EntityFunctions"
import { LanguageViewModel } from "../../../src/common/misc/LanguageViewModel.js"
import { EntityRestClient } from "../../../src/common/api/worker/rest/EntityRestClient"
import { NativePushServiceApp } from "../../../src/common/native/main/NativePushServiceApp"
import { AlarmScheduler } from "../../../src/common/calendar/date/AlarmScheduler"
import { IServiceExecutor } from "../../../src/common/api/common/ServiceRequest"
import { ParsedCalendarData } from "../../../src/common/calendar/gui/CalendarImporter"
import { elementIdPart, getListId, listIdPart } from "../../../src/common/api/common/utils/EntityUtils"
import { DateTime } from "luxon"

o.spec("CalendarModel", function () {
	const { anything } = matchers

	const noPatchesAndInstance: Pick<EntityUpdateData, "instance" | "patches"> = {
		instance: null,
		patches: null,
	}

	o.spec("processCalendarData - CalendarMethod.REPLY", function () {
		let entityRestClientMock: EntityRestClientMock
		let groupRoot: CalendarGroupRoot
		const loginControllerMock = makeLoginController()

		const alarmsListId = neverNull(loginControllerMock.getUserController().user.alarmInfoList).alarms
		o.beforeEach(function () {
			groupRoot = createTestEntity(CalendarGroupRootTypeRef, {
				_id: "groupRootId",
				longEvents: "longEvents",
				shortEvents: "shortEvents",
			})
			entityRestClientMock = new EntityRestClientMock()
			entityRestClientMock.addElementInstances(groupRoot)
		})
		o("reply but sender is not a guest", async function () {
			const uid = "uid"
			const existingEvent = createTestEntity(CalendarEventTypeRef, { uid })
			const calendarFacade = makeCalendarFacade(
				{
					getEventsByUid: (loadUid) =>
						uid === loadUid
							? Promise.resolve({
									progenitor: existingEvent,
									alteredInstances: [],
								})
							: Promise.resolve(null),
				},
				entityRestClientMock,
			)
			const workerClient = makeWorkerClient()
			const model = init({
				workerClient,
				restClientMock: entityRestClientMock,
				calendarFacade,
			})
			await model.processCalendarData("sender@example.com", {
				method: CalendarMethod.REPLY,
				contents: [
					{
						event: createTestEntity(CalendarEventTypeRef, {
							uid,
						}) as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			verify(calendarFacade.updateCalendarEvent(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})
		o("reply", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const anotherGuest = "another-attendee"
			const alarm = createTestEntity(AlarmInfoTypeRef, {
				_id: "alarm-id",
			})
			const existingEvent = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "eventId"],
				uid,
				_ownerGroup: groupRoot._id,
				summary: "v1",
				attendees: [
					createTestEntity(CalendarEventAttendeeTypeRef, {
						address: createTestEntity(EncryptedMailAddressTypeRef, {
							address: sender,
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
					createTestEntity(CalendarEventAttendeeTypeRef, {
						address: createTestEntity(EncryptedMailAddressTypeRef, {
							address: anotherGuest,
						}),
						status: CalendarAttendeeStatus.NEEDS_ACTION,
					}),
				],
				alarmInfos: [[alarmsListId, alarm._id]],
			})
			entityRestClientMock.addListInstances(
				createTestEntity(UserAlarmInfoTypeRef, {
					_id: [alarmsListId, alarm._id],
					alarmInfo: alarm,
				}),
			)
			const workerClient = makeWorkerClient()
			const calendarFacade = makeCalendarFacade(
				{
					getEventsByUid: (loadUid) =>
						uid === loadUid
							? Promise.resolve({
									progenitor: existingEvent,
									alteredInstances: [],
								})
							: Promise.resolve(null),
				},
				entityRestClientMock,
			)
			const model = init({
				workerClient,
				restClientMock: entityRestClientMock,
				calendarFacade,
			})
			await model.processCalendarData(sender, {
				// should be ignored
				method: CalendarMethod.REPLY,
				contents: [
					{
						event: createTestEntity(CalendarEventTypeRef, {
							uid,
							attendees: [
								createTestEntity(CalendarEventAttendeeTypeRef, {
									address: createTestEntity(EncryptedMailAddressTypeRef, {
										address: sender,
									}),
									status: CalendarAttendeeStatus.ACCEPTED,
								}),
								createTestEntity(CalendarEventAttendeeTypeRef, {
									// should be ignored
									address: createTestEntity(EncryptedMailAddressTypeRef, {
										address: anotherGuest,
									}),
									status: CalendarAttendeeStatus.DECLINED,
								}),
							],
						}) as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			const eventCaptor = matchers.captor()
			const alarmsCaptor = matchers.captor()
			verify(calendarFacade.updateCalendarEvent(eventCaptor.capture(), alarmsCaptor.capture(), matchers.anything()))
			const createdEvent: CalendarEvent = eventCaptor.value
			const alarms: ReadonlyArray<AlarmInfo> = alarmsCaptor.value
			o(createdEvent.uid).equals(existingEvent.uid)
			o(createdEvent.summary).equals(existingEvent.summary)
			o(createdEvent.attendees).deepEquals([
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: sender,
					}),
					status: CalendarAttendeeStatus.ACCEPTED,
				}),
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: "another-attendee",
					}),
					status: CalendarAttendeeStatus.NEEDS_ACTION,
				}),
			])
			o(alarms).deepEquals([alarm])
		})
	})

	o.spec("processCalendarData - CalendarMethod.REQUEST", function () {
		let calendarGroupRoot: CalendarGroupRoot
		let calendarModel: CalendarModel
		let notificationsMock: Notifications
		let schedulerMock: AlarmScheduler
		let eventControllerMock: EventController
		let serviceExecutorMock: IServiceExecutor
		let loginControllerMock: LoginController
		let progressTrackerMock: ProgressTracker
		let entityClientMock: EntityClient
		let mailboxModelMock: MailboxModel
		let calendarFacadeMock: CalendarFacade
		let fileControllerMock: FileController
		let deviceConfigMock: DeviceConfig
		let nativePushServiceAppMock: NativePushServiceApp
		let syncTrackMock: SyncTracker
		let languageViewModelMock: LanguageViewModel
		let groupMemberMock: GroupMember

		let baseInvitation: ParsedCalendarData
		let baseExistingEvent: CalendarEvent
		let userControllerMock: UserController
		let userMock: User

		let calendarGroupMembership: GroupMembership

		const sender = "sender@example.com"

		o.beforeEach(function () {
			notificationsMock = object()
			eventControllerMock = object()
			schedulerMock = object()
			serviceExecutorMock = object()
			loginControllerMock = object()
			userControllerMock = object<UserController>()
			progressTrackerMock = object()
			entityClientMock = object()
			mailboxModelMock = object()
			calendarFacadeMock = object()
			fileControllerMock = object()
			deviceConfigMock = object()
			nativePushServiceAppMock = object()
			syncTrackMock = object()
			languageViewModelMock = object()

			when(loginControllerMock.getUserController()).thenReturn(userControllerMock)
			const userId = "user-id"
			userMock = object<User>()
			userMock._id = userId
			userControllerMock.user = userMock

			const progressMonitorMock = object<IProgressMonitor>()
			when(progressTrackerMock.getMonitor(anything())).thenReturn(progressMonitorMock)

			calendarGroupMembership = createTestEntity(GroupMembershipTypeRef, {
				group: "calendar-group-id",
				groupType: GroupType.Calendar,
				groupInfo: ["group-info-listId", "calendar-group-info-id"],
			})
			when(userControllerMock.getCalendarMemberships()).thenReturn([calendarGroupMembership])

			calendarGroupRoot = createTestEntity(CalendarGroupRootTypeRef, {
				_id: calendarGroupMembership.group,
				longEvents: "longEvents",
				shortEvents: "shortEvents",
			})

			const calendarGroupInfo = createTestEntity(GroupInfoTypeRef, {
				_id: calendarGroupMembership.groupInfo,
				group: calendarGroupMembership.group,
			})

			groupMemberMock = createTestEntity(GroupMemberTypeRef, {
				_id: ["group-member-list-id", "group-member-element-id"],
				group: calendarGroupRoot._id,
				user: userMock._id,
				userGroupInfo: calendarGroupInfo._id,
			})

			const calendarGroup = createTestEntity(GroupTypeRef, {
				_id: calendarGroupMembership.group,
				members: "group-member-list-id",
			})

			when(entityClientMock.loadAll(GroupMemberTypeRef, getListId(groupMemberMock))).thenResolve([groupMemberMock])
			when(entityClientMock.load(CalendarGroupRootTypeRef, calendarGroupRoot._id)).thenResolve(calendarGroupRoot)
			when(entityClientMock.load(GroupTypeRef, calendarGroup._id)).thenResolve(calendarGroup)
			when(entityClientMock.load(GroupInfoTypeRef, calendarGroupInfo._id)).thenResolve(calendarGroupInfo)
			when(calendarFacadeMock.createCalendarEvent(anything(), anything())).thenResolve(undefined)

			calendarModel = new CalendarModel(
				notificationsMock,
				() => Promise.resolve(schedulerMock),
				eventControllerMock,
				serviceExecutorMock,
				loginControllerMock,
				progressTrackerMock,
				entityClientMock,
				mailboxModelMock,
				calendarFacadeMock,
				fileControllerMock,
				"Europe/Berlin",
				makeExternalCalendarFacade(),
				deviceConfigMock,
				nativePushServiceAppMock,
				syncTrackMock,
				() => {},
				languageViewModelMock,
			)

			baseExistingEvent = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "eventId"],
				_ownerGroup: calendarGroupRoot._id,
				summary: "v1",
				sequence: "1",
				uid: "uid",
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: sender,
				}),
				startTime: new Date(),
				pendingInvitation: true,
			})

			baseInvitation = {
				method: CalendarMethod.REQUEST,
				contents: [
					{
						event: createTestEntity(CalendarEventTypeRef, {
							uid: "uid",
							attendees: [
								createTestEntity(CalendarEventAttendeeTypeRef, {
									address: createTestEntity(EncryptedMailAddressTypeRef, {
										address: sender,
									}),
									status: CalendarAttendeeStatus.ACCEPTED,
								}),
							],
						}) as CalendarEventProgenitor,
						alarms: [],
					},
				],
			}
		})

		o.spec("Pending events", function () {
			o("New invite -- saves new event to db", async function () {
				// Arrange

				// Act
				await calendarModel.processCalendarData(sender, baseInvitation)

				// ASSERT
				// checks that update route was not taken
				verify(calendarFacadeMock.updateCalendarEvent(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })

				// capture created event
				const eventCaptor = matchers.captor()
				verify(calendarFacadeMock.createCalendarEvent(eventCaptor.capture(), matchers.anything()))

				const capturedEventInput: CalendarEvent = eventCaptor.value
				o.check(capturedEventInput.pendingInvitation).equals(true)
			})

			o("New invite with repeat rule", async function () {
				// Arrange
				baseInvitation.contents[0].event.repeatRule = createTestEntity(RepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
				})

				// Act
				await calendarModel.processCalendarData(sender, baseInvitation)

				// ASSERT

				// capture created event
				const eventCaptor = matchers.captor()
				verify(calendarFacadeMock.createCalendarEvent(eventCaptor.capture(), matchers.anything()))

				const capturedEventInput: CalendarEvent = eventCaptor.value
				o.check(capturedEventInput.pendingInvitation).equals(true)
				o.check(capturedEventInput.repeatRule?.frequency).equals(RepeatPeriod.DAILY)
				o.check(capturedEventInput.repeatRule?.interval).equals("1")
			})

			o("Update any field but startTime", async function () {
				/*
				Simple updates for pending events are treated the same way as an invitation that was already replied.
				The event doesn't have to be deleted and recreated
				 */
				const startTime = new Date()

				const eventByUid: CalendarEventUidIndexEntry = object()
				baseExistingEvent.startTime = startTime
				eventByUid.progenitor = baseExistingEvent as CalendarEventProgenitor
				eventByUid.alteredInstances = []

				when(calendarFacadeMock.getEventsByUid(anything(), anything())).thenResolve(eventByUid)

				const sentEvent = createTestEntity(CalendarEventTypeRef, {
					summary: "v2",
					uid: baseExistingEvent.uid,
					sequence: "2",
					organizer: createTestEntity(EncryptedMailAddressTypeRef, {
						address: sender,
					}),
					startTime,
				})

				// Act
				await calendarModel.processCalendarData(sender, {
					method: CalendarMethod.REQUEST,
					contents: [
						{
							event: sentEvent as CalendarEventProgenitor,
							alarms: [],
						},
					],
				})

				const eventCaptor = matchers.captor()
				const oldEventCaptor = matchers.captor()
				verify(calendarFacadeMock.updateCalendarEvent(eventCaptor.capture(), matchers.anything(), oldEventCaptor.capture()), { times: 1 })

				const oldEvent: CalendarEvent = oldEventCaptor.value
				o.check(oldEvent).deepEquals(baseExistingEvent)

				const updatedEvent: CalendarEvent = eventCaptor.value
				o.check(updatedEvent._id).deepEquals(oldEvent._id)
				o.check(updatedEvent.summary).equals(sentEvent.summary)
				o.check(updatedEvent.sequence).equals(sentEvent.sequence)
				o.check(updatedEvent.pendingInvitation).equals(true)
			})

			o("Change to event start time should create a new pending event and delete the old one", async function () {
				// Arrange
				const startTime = new Date()
				baseExistingEvent.startTime = startTime

				const eventByUid: CalendarEventUidIndexEntry = object()
				eventByUid.progenitor = baseExistingEvent as CalendarEventProgenitor
				eventByUid.alteredInstances = []
				when(calendarFacadeMock.getEventsByUid(anything(), CachingMode.Bypass)).thenResolve(eventByUid)
				when(calendarFacadeMock.replaceCalendarEvent(anything(), anything(), anything())).thenResolve(undefined)

				const newStartTime = new Date(startTime)
				newStartTime.setMinutes(newStartTime.getMinutes() + 42)
				const sentEvent = createTestEntity(CalendarEventTypeRef, {
					summary: "v2",
					uid: "uid",
					sequence: "2",
					organizer: createTestEntity(EncryptedMailAddressTypeRef, {
						address: sender,
					}),
					startTime: newStartTime,
				})

				when(entityClientMock.load(CalendarEventTypeRef, anything())).thenResolve(sentEvent)

				// Act
				await calendarModel.processCalendarData(sender, {
					method: CalendarMethod.REQUEST,
					contents: [
						{
							event: sentEvent as CalendarEventProgenitor,
							alarms: [],
						},
					],
				})

				// Assert
				const newEventCaptor = matchers.captor()
				const oldEventCaptor = matchers.captor()
				verify(calendarFacadeMock.replaceCalendarEvent(oldEventCaptor.capture(), newEventCaptor.capture(), matchers.anything()), { times: 1 })

				const oldEvent: CalendarEvent = oldEventCaptor.value
				const newEvent: CalendarEvent = newEventCaptor.value

				o.check(oldEvent).deepEquals(baseExistingEvent)
				o.check(oldEvent._id).notEquals(newEvent._id)
				o.check(oldEvent.uid).equals(newEvent.uid)
				o.check(newEvent.pendingInvitation).equals(true)
			})
		})

		o("Update to already replied event", async function () {
			const uid = "uid"
			const sender = "sender@example.com"

			const mockUserAlarmListInfoType = object<UserAlarmInfoListType>()
			mockUserAlarmListInfoType.alarms = "alarm-id"

			const alarmsListId = neverNull(loginControllerMock.getUserController().user.alarmInfoList).alarms
			const alarmInfo = createTestEntity(AlarmInfoTypeRef, {
				_id: "alarm-id",
			})
			const alarmInfos: IdTuple[] = [[alarmsListId, alarmInfo._id]]
			const userAlarmInfo = createTestEntity(UserAlarmInfoTypeRef, {
				_id: [alarmsListId, alarmInfo._id],
				alarmInfo: alarmInfo,
			})

			const startTime = new Date()
			const existingEvent = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "eventId"],
				_ownerGroup: calendarGroupRoot._id,
				summary: "v1",
				sequence: "1",
				uid,
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: sender,
				}),
				alarmInfos,
				startTime,
			})

			const eventByUid: CalendarEventUidIndexEntry = object()
			eventByUid.progenitor = existingEvent as CalendarEventProgenitor
			eventByUid.alteredInstances = []
			when(calendarFacadeMock.getEventsByUid(anything(), anything())).thenResolve(eventByUid)

			const sentEvent = createTestEntity(CalendarEventTypeRef, {
				summary: "v2",
				uid,
				sequence: "2",
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: sender,
				}),
				startTime,
			})

			when(entityClientMock.loadMultiple(UserAlarmInfoTypeRef, listIdPart(alarmInfos[0]), alarmInfos.map(elementIdPart))).thenResolve([userAlarmInfo])

			await calendarModel.processCalendarData(sender, {
				method: CalendarMethod.REQUEST,
				contents: [
					{
						event: sentEvent as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})

			const eventCaptor = matchers.captor()
			const alarmsCaptor = matchers.captor()
			const oldEventCaptor = matchers.captor()
			verify(calendarFacadeMock.updateCalendarEvent(eventCaptor.capture(), alarmsCaptor.capture(), oldEventCaptor.capture()))
			const updatedEvent = eventCaptor.value
			const updatedAlarms = alarmsCaptor.value
			const oldEvent = oldEventCaptor.value
			o(updatedEvent.summary).equals(sentEvent.summary)
			o(updatedEvent.sequence).equals(sentEvent.sequence)
			o(updatedAlarms).deepEquals([alarmInfo])
			o(oldEvent).deepEquals(existingEvent)
		})

		o("event entity is re-created when the start time changes", async function () {
			// Arrange

			const uid = "uid"
			const sender = "sender@example.com"

			const mockUserAlarmListInfoType = object<UserAlarmInfoListType>()
			mockUserAlarmListInfoType.alarms = "alarm-id"
			const alarmsListId = neverNull(loginControllerMock.getUserController().user.alarmInfoList).alarms
			const alarmInfo = createTestEntity(AlarmInfoTypeRef, {
				_id: "alarm-id",
			})
			const alarmInfos: IdTuple[] = [[alarmsListId, alarmInfo._id]]
			const userAlarmInfo = createTestEntity(UserAlarmInfoTypeRef, {
				_id: [alarmsListId, alarmInfo._id],
				alarmInfo: alarmInfo,
			})

			when(entityClientMock.loadMultiple(UserAlarmInfoTypeRef, listIdPart(alarmInfos[0]), alarmInfos.map(elementIdPart))).thenResolve([userAlarmInfo])

			const existingEvent = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "eventId"],
				_ownerGroup: calendarGroupRoot._id,
				summary: "v1",
				sequence: "1",
				uid,
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: sender,
				}),
				startTime: DateTime.fromObject(
					{
						year: 2020,
						month: 5,
						day: 10,
					},
					{ zone: "UTC" },
				).toJSDate(),
				alarmInfos: [[alarmsListId, alarmInfo._id]],
			})

			const sentEvent = createTestEntity(CalendarEventTypeRef, {
				summary: "v2",
				uid,
				sequence: "2",
				startTime: DateTime.fromObject(
					{
						year: 2020,
						month: 5,
						day: 11,
					},
					{ zone: "UTC" },
				).toJSDate(),
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: sender,
				}),
			})

			const eventByUid: CalendarEventUidIndexEntry = object()
			eventByUid.progenitor = existingEvent as CalendarEventProgenitor

			when(calendarFacadeMock.getEventsByUid(anything(), anything())).thenResolve(eventByUid)
			when(entityClientMock.load<CalendarEvent>(CalendarEventTypeRef, anything())).thenResolve(clone(sentEvent))

			// Act
			await calendarModel.processCalendarData(sender, {
				method: CalendarMethod.REQUEST,
				contents: [
					{
						event: sentEvent as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})

			// Assert
			verify(calendarFacadeMock.updateCalendarEvent(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })

			const oldEventCaptor = matchers.captor()
			const eventCaptor = matchers.captor()
			const alarmsCaptor = matchers.captor()

			verify(calendarFacadeMock.replaceCalendarEvent(oldEventCaptor.capture(), eventCaptor.capture(), alarmsCaptor.capture()))
			const updatedEvent = eventCaptor.value
			const updatedAlarms = alarmsCaptor.value
			const oldEvent = oldEventCaptor.value

			o(updatedEvent.summary).equals(sentEvent.summary)
			o(updatedEvent.sequence).equals(sentEvent.sequence)
			o(updatedEvent.startTime.toISOString()).equals(sentEvent.startTime.toISOString())
			o(updatedEvent.uid).equals(uid)
			o(updatedAlarms).deepEquals([alarmInfo])
			o(oldEvent).deepEquals(existingEvent)
		})

		// o("reprocess deferred calendar events with no owner enc session key", async function () {
		// 	const calendarFile = createTestEntity(FileTypeRef, {
		// 		_id: ["fileListId", "fileId"],
		// 	})
		//
		// 	const eventUpdate = createTestEntity(CalendarEventUpdateTypeRef, {
		// 		_id: ["calendarEventUpdateListId", "calendarEventUpdateId"],
		// 		file: calendarFile._id,
		// 	})
		//
		// 	const uid = "uid"
		// 	const sender = "sender@example.com"
		// 	const existingEvent = createTestEntity(CalendarEventTypeRef, {
		// 		_id: ["calendarListId", "eventId"],
		// 		_ownerGroup: groupRoot._id,
		// 		sequence: "1",
		// 		uid,
		// 		organizer: createTestEntity(EncryptedMailAddressTypeRef, {
		// 			address: sender,
		// 		}),
		// 	})
		//
		// 	const fileControllerMock = makeFileController()
		//
		// 	const workerClient = makeWorkerClient()
		// 	const eventControllerMock = makeEventController()
		//
		// 	fileControllerMock.getAsDataFile = func<FileController["getAsDataFile"]>()
		// 	when(fileControllerMock.getAsDataFile(matchers.anything())).thenResolve(
		// 		createDataFile("event.ics", "ical", stringToUtf8Uint8Array("UID: " + uid), "cid"),
		// 	)
		//
		// 	const actuallyLoad = entityRestClientMock.load
		// 	entityRestClientMock.load = func<EntityRestClientMock["load"]>()
		// 	when(entityRestClientMock.load(matchers.anything(), matchers.anything()), { ignoreExtraArgs: true }).thenDo((...args) =>
		// 		actuallyLoad.apply(entityRestClientMock, args),
		// 	)
		// 	when(entityRestClientMock.load(FileTypeRef, calendarFile._id), { ignoreExtraArgs: true }).thenReject(new SessionKeyNotFoundError("test"))
		//
		// 	const model = init({
		// 		workerClient,
		// 		restClientMock: entityRestClientMock,
		// 		fileFacade: fileControllerMock,
		// 		eventController: eventControllerMock.eventController,
		// 	})
		//
		// 	entityRestClientMock.addListInstances(calendarFile, eventUpdate, existingEvent)
		//
		// 	// calendar update create event
		// 	await eventControllerMock.sendEvent({
		// 		typeRef: CalendarEventUpdateTypeRef,
		// 		instanceListId: listIdPart(eventUpdate._id) as NonEmptyString,
		// 		instanceId: elementIdPart(eventUpdate._id),
		// 		operation: OperationType.CREATE,
		// 		...noPatchesAndInstance,
		// 		prefetchStatus: PrefetchStatus.NotPrefetched,
		// 	})
		//
		// 	o(model.getFileIdToSkippedCalendarEventUpdates().get(getElementId(calendarFile))!).deepEquals(eventUpdate)
		//
		// 	o(await entityRestClientMock.load(CalendarEventUpdateTypeRef, eventUpdate._id)).deepEquals(eventUpdate)
		//
		// 	entityRestClientMock.load = actuallyLoad
		//
		// 	// set owner enc session key to ensure that we can process the calendar event file
		// 	calendarFile._ownerEncSessionKey = hexToUint8Array("01")
		// 	await eventControllerMock.sendEvent({
		// 		typeRef: FileTypeRef,
		// 		instanceListId: listIdPart(calendarFile._id) as NonEmptyString,
		// 		instanceId: elementIdPart(calendarFile._id),
		// 		operation: OperationType.UPDATE,
		// 		...noPatchesAndInstance,
		// 		prefetchStatus: PrefetchStatus.NotPrefetched,
		// 	})
		//
		// 	o(model.getFileIdToSkippedCalendarEventUpdates().size).deepEquals(0)
		// 	verify(fileControllerMock.getAsDataFile(matchers.anything()), { times: 1 })
		// 	await o(async () => entityRestClientMock.load(CalendarEventUpdateTypeRef, eventUpdate._id)).asyncThrows(NotFoundError)
		// })
	})

	o.spec("processCalendarData - CalendarMethod.CANCEL", function () {
		let entityRestClientMock: EntityRestClientMock
		let groupRoot: CalendarGroupRoot

		o.beforeEach(function () {
			groupRoot = createTestEntity(CalendarGroupRootTypeRef, {
				_id: "groupRootId",
				longEvents: "longEvents",
				shortEvents: "shortEvents",
			})
			entityRestClientMock = new EntityRestClientMock()
			entityRestClientMock.addElementInstances(groupRoot)
		})

		o("event is cancelled by organizer", async function () {
			const uid = "uid"
			const sender = "sender@example.com"
			const existingEvent = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "eventId"],
				_ownerGroup: groupRoot._id,
				sequence: "1",
				uid,
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: sender,
				}),
			})
			entityRestClientMock.addListInstances(existingEvent)
			const workerClient = makeWorkerClient()
			const calendarFacade = makeCalendarFacade(
				{
					getEventsByUid: (loadUid) =>
						uid === loadUid
							? Promise.resolve({
									progenitor: existingEvent,
									alteredInstances: [],
								})
							: Promise.resolve(null),
				},
				entityRestClientMock,
			)
			const model = init({
				workerClient,
				restClientMock: entityRestClientMock,
				calendarFacade: calendarFacade,
			})
			const sentEvent = createTestEntity(CalendarEventTypeRef, {
				uid,
				sequence: "2",
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: sender,
				}),
			})
			await model.processCalendarData(sender, {
				method: CalendarMethod.CANCEL,
				contents: [
					{
						event: sentEvent as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			await o(() => entityRestClientMock.load(CalendarEventTypeRef, existingEvent._id)).asyncThrows(NotFoundError)
		})
		// TODO: Fix broken test with new mocking system
		// o("event is cancelled by someone else than organizer", async function () {
		// 	const uid = "uid"
		// 	const sender = "sender@example.com"
		// 	const existingEvent = createTestEntity(CalendarEventTypeRef, {
		// 		_id: ["listId", "eventId"],
		// 		_ownerGroup: groupRoot._id,
		// 		sequence: "1",
		// 		uid,
		// 		organizer: createTestEntity(EncryptedMailAddressTypeRef, {
		// 			address: sender,
		// 		}),
		// 	})
		// 	entityRestClientMock.addListInstances(existingEvent)
		// 	const workerClient = makeWorkerClient()
		// 	const model = init({
		// 		workerClient,
		// 		restClientMock: entityRestClientMock,
		// 	})
		// 	const sentEvent = createTestEntity(CalendarEventTypeRef, {
		// 		uid,
		// 		sequence: "2",
		// 		organizer: createTestEntity(EncryptedMailAddressTypeRef, {
		// 			address: sender,
		// 		}),
		// 	})
		// 	await model.processCalendarData("another-sender", {
		// 		method: CalendarMethod.CANCEL,
		// 		contents: [
		// 			{
		// 				event: sentEvent as CalendarEventProgenitor,
		// 				alarms: [],
		// 			},
		// 		],
		// 	})
		// 	o(await entityRestClientMock.load(CalendarEventTypeRef, existingEvent._id)).equals(existingEvent)("Calendar event was not deleted")
		// })
	})

	function makeNotifications(): Notifications {
		return downcast({})
	}

	function makeProgressTracker(): ProgressTracker {
		const progressTracker: ProgressTracker = object()
		when(progressTracker.registerMonitorSync(matchers.anything())).thenReturn(0)
		when(progressTracker.getMonitor(matchers.anything())).thenReturn(new NoopProgressMonitor())
		return progressTracker
	}

	function makeSyncTracker(): SyncTracker {
		const syncTracker: SyncTracker = object()
		when(syncTracker.isSyncDone()).thenReturn(true)
		return syncTracker
	}

	function makeEventController(): {
		eventController: EventController
		sendEvent: (arg0: EntityUpdateData) => Promise<void>
	} {
		const listeners = new Array<EntityEventsListener>()
		return {
			eventController: downcast({
				listeners,
				addEntityListener(listener: EntityEventsListener) {
					listeners.push(listener)
				},
			}),
			sendEvent: async (update) => {
				for (let listener of listeners) {
					// @ts-ignore
					await listener([update])
				}
			},
		}
	}

	function makeWorkerClient(): WorkerClient {
		return downcast({})
	}

	function makeLoginController(groupId: Id = "groupId", groupInfoId: IdTuple = ["list", "elementId"]): LoginController {
		const alarmInfoList = createTestEntity(UserAlarmInfoListTypeTypeRef, {
			alarms: "alarms",
		})

		const userController = object<UserController>()
		userController.user = createTestEntity(UserTypeRef, {
			_id: "user-id",
			alarmInfoList,
		})

		const groupMembership = createTestEntity(GroupMembershipTypeRef, {
			group: groupId,
			groupType: GroupType.Calendar,
			groupInfo: groupInfoId,
		})
		when(userController.getCalendarMemberships()).thenReturn([groupMembership])

		const contactGroupMembership = createTestEntity(GroupMembershipTypeRef, { group: "contactGroup" })
		when(userController.getContactGroupMemberships()).thenReturn([contactGroupMembership])

		const loginController = instance(LoginController)
		loginController.getUserController = () => userController

		return loginController
	}

	function makeMailModel(): MailboxModel {
		return downcast({})
	}

	function makeCalendarFacade(
		getEventsByUid: {
			getEventsByUid: (_: any) => unknown
		},
		entityRestClientMock: EntityRestClient,
	): CalendarFacade {
		const createCalendarEvent = func<CalendarFacade["createCalendarEvent"]>()
		when(createCalendarEvent(matchers.anything(), matchers.anything())).thenDo((event) => {
			// testdouble is very insistent on calling such callbacks even during verification and we get weird args here
			if (!event.__matches) {
				// TODO fix
				// entityRestClient.addListInstances(event)
			}
			return Promise.resolve()
		})

		const replaceCalendarEvent = func<CalendarFacade["replaceCalendarEvent"]>()
		when(replaceCalendarEvent(matchers.anything(), matchers.anything(), matchers.anything())).thenDo((event) => {
			// testdouble is very insistent on calling such callbacks even during verification and we get weird args here
			if (!event.__matches) {
				// TODO fix
				// entityRestClient.addListInstances(event)
			}
			return Promise.resolve()
		})

		return {
			getEventsByUid: getEventsByUid.getEventsByUid,
			updateCalendarEvent: func<CalendarFacade["updateCalendarEvent"]>(),
			createCalendarEvent: createCalendarEvent,
		} as Partial<CalendarFacade> as CalendarFacade
	}

	function makeFileController(): FileController {
		return downcast({})
	}

	function makeExternalCalendarFacade(): ExternalCalendarFacade {
		return downcast({})
	}

	function makeDeviceConfig(): DeviceConfig {
		return downcast({})
	}

	function init({
		notifications = makeNotifications(),
		eventController = makeEventController().eventController,
		workerClient,
		restClientMock,
		loginController = makeLoginController(),
		progressTracker = makeProgressTracker(),
		entityClient = new EntityClient(restClientMock, ClientModelInfo.getNewInstanceForTestsOnly()),
		mailModel = makeMailModel(),
		alarmScheduler = makeAlarmScheduler(),
		calendarFacade = makeCalendarFacade(
			{
				getEventsByUid: () => Promise.resolve(null),
			},
			restClientMock,
		),
		fileFacade = makeFileController(),
		externalCalendarFacade = makeExternalCalendarFacade(),
		deviceConfig = makeDeviceConfig(),
		syncTracker = makeSyncTracker(),
	}): CalendarModel {
		const lazyScheduler = async () => alarmScheduler
		const langMock: LanguageViewModel = object()

		return new CalendarModel(
			notifications,
			lazyScheduler,
			eventController,
			workerClient,
			loginController,
			progressTracker,
			entityClient,
			mailModel,
			calendarFacade,
			fileFacade,
			"Europe/Berlin",
			externalCalendarFacade,
			deviceConfig,
			downcast({
				getLoadedPushIdentifier: () => ({
					identifier: "",
					disabled: false,
				}),
			}),
			syncTracker,
			() => {},
			langMock,
		)
	}
})
