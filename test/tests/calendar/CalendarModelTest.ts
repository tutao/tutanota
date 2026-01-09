import o from "@tutao/otest"
import { ParsedCalendarData, ParsedEvent } from "../../../src/common/calendar/gui/CalendarImporter"
import {
	CalendarEvent,
	CalendarEventAttendeeTypeRef,
	CalendarEventTypeRef,
	CalendarEventUpdateTypeRef,
	CalendarGroupRoot,
	CalendarGroupRootTypeRef,
	EncryptedMailAddressTypeRef,
	FileTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { clone, hexToUint8Array, neverNull, Require, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { CalendarModel } from "../../../src/calendar-app/calendar/model/CalendarModel.js"
import { CalendarAttendeeStatus, CalendarMethod, GroupType, OperationType, RepeatPeriod } from "../../../src/common/api/common/TutanotaConstants.js"
import { EventController } from "../../../src/common/api/main/EventController.js"
import { Notifications } from "../../../src/common/gui/Notifications.js"
import {
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
	UserAlarmInfoTypeRef,
} from "../../../src/common/api/entities/sys/TypeRefs.js"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { ProgressTracker } from "../../../src/common/api/main/ProgressTracker.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { CachingMode, CalendarEventProgenitor, CalendarEventUidIndexEntry, CalendarFacade } from "../../../src/common/api/worker/facades/lazy/CalendarFacade.js"
import { verify } from "@tutao/tutanota-test-utils"
import { FileController } from "../../../src/common/file/FileController.js"
import { matchers, object, when } from "testdouble"
import { createTestEntity } from "../TestUtils.js"
import { IProgressMonitor } from "../../../src/common/api/common/utils/ProgressMonitor.js"
import { EntityUpdateData, PrefetchStatus } from "../../../src/common/api/common/utils/EntityUpdateUtils.js"
import { MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { ExternalCalendarFacade } from "../../../src/common/native/common/generatedipc/ExternalCalendarFacade.js"
import { DeviceConfig } from "../../../src/common/misc/DeviceConfig.js"
import { SyncTracker } from "../../../src/common/api/main/SyncTracker.js"
import { LanguageViewModel } from "../../../src/common/misc/LanguageViewModel.js"
import { NativePushServiceApp } from "../../../src/common/native/main/NativePushServiceApp"
import { AlarmScheduler } from "../../../src/common/calendar/date/AlarmScheduler"
import { IServiceExecutor } from "../../../src/common/api/common/ServiceRequest"
import { elementIdPart, getElementId, getListId, listIdPart } from "../../../src/common/api/common/utils/EntityUtils"
import { DateTime } from "luxon"
import { createDataFile } from "../../../src/common/api/common/DataFile"
import { SessionKeyNotFoundError } from "../../../src/common/api/common/error/SessionKeyNotFoundError"

o.spec("CalendarModel", function () {
	const { anything } = matchers

	const uid = "uid"
	const UNKNOWN_SENDER = "sender@example.com"
	const ORGANIZER = "organizer@example.com"
	const GUEST = "guest@example.com"
	const baseStartTime = DateTime.fromObject(
		{
			year: 1993,
			month: 5,
			day: 1,
		},
		{ zone: "UTC" },
	).toJSDate()

	const baseEndTime = DateTime.fromObject(
		{
			year: 1993,
			month: 5,
			day: 2,
		},
		{ zone: "UTC" },
	).toJSDate()

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
	let baseCalendarEventUidIndexEntry: CalendarEventUidIndexEntry

	let userControllerMock: UserController
	let userMock: User

	let calendarGroupMembership: GroupMembership
	let externalCalendarFacadeMock: ExternalCalendarFacade

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
		externalCalendarFacadeMock = object()

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
			externalCalendarFacadeMock,
			deviceConfigMock,
			nativePushServiceAppMock,
			syncTrackMock,
			() => {},
			languageViewModelMock,
		)

		baseExistingEvent = createTestEntity(CalendarEventTypeRef, {
			_id: ["listId", "eventId"],
			uid,
			_ownerGroup: calendarGroupRoot._id,
			summary: "v1",
			organizer: createTestEntity(EncryptedMailAddressTypeRef, {
				address: ORGANIZER,
			}),
			attendees: [
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: ORGANIZER,
					}),
					status: CalendarAttendeeStatus.ACCEPTED,
				}),
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: GUEST,
					}),
					status: CalendarAttendeeStatus.NEEDS_ACTION,
				}),
			],
			alarmInfos: [],
		})

		baseCalendarEventUidIndexEntry = object()
		baseCalendarEventUidIndexEntry.ownerGroup = calendarGroupRoot._id
		baseCalendarEventUidIndexEntry.progenitor = baseExistingEvent as CalendarEventProgenitor
		baseCalendarEventUidIndexEntry.alteredInstances = []
	})

	const noPatchesAndInstance: Pick<EntityUpdateData, "instance" | "patches"> = {
		instance: null,
		patches: null,
	}

	o.spec("processCalendarData - CalendarMethod.REPLY", function () {
		let baseParsedCalendarData: ParsedCalendarData
		let baseParsedEventReply: ParsedEvent

		o.beforeEach(function () {
			baseParsedEventReply = {
				event: createTestEntity(CalendarEventTypeRef, {
					uid,
					summary: baseExistingEvent.summary,
					attendees: [
						createTestEntity(CalendarEventAttendeeTypeRef, {
							// should be ignored
							address: createTestEntity(EncryptedMailAddressTypeRef, {
								address: GUEST,
							}),
							status: CalendarAttendeeStatus.ACCEPTED,
						}),
					],
				}) as Require<"uid", CalendarEvent>,
				alarms: [],
			}
			baseParsedCalendarData = {
				method: CalendarMethod.REPLY,
				contents: [baseParsedEventReply],
			}
		})

		o("reply is ignored if sender is not a guest or organizer", async function () {
			when(calendarFacadeMock.getEventsByUid(uid, anything())).thenResolve(baseCalendarEventUidIndexEntry)

			await calendarModel.processCalendarData(UNKNOWN_SENDER, baseParsedCalendarData)
			verify(calendarFacadeMock.updateCalendarEvent(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})

		o("reply from guest is applied to the organizer's calendar", async function () {
			// removed some of the alarm testing criteria -- will recreate some tests specific to alarm behavior.

			when(calendarFacadeMock.getEventsByUid(uid, anything())).thenResolve(baseCalendarEventUidIndexEntry)
			await calendarModel.processCalendarData(GUEST, baseParsedCalendarData)

			const eventCaptor = matchers.captor()
			const alarmsCaptor = matchers.captor()

			verify(calendarFacadeMock.updateCalendarEvent(eventCaptor.capture(), alarmsCaptor.capture(), matchers.anything()))

			const createdEvent: CalendarEvent = eventCaptor.value

			o(createdEvent.uid).equals(baseExistingEvent.uid)
			o(createdEvent.summary).equals(baseExistingEvent.summary)
			const guest = createdEvent.attendees.find((attendee) => attendee.address.address == GUEST)
			o(guest?.status).deepEquals(CalendarAttendeeStatus.ACCEPTED)
		})
	})

	o.spec("processCalendarData - CalendarMethod.REQUEST", function () {
		o.beforeEach(function () {
			baseExistingEvent = createTestEntity(CalendarEventTypeRef, {
				_id: ["listId", "eventId"],
				_ownerGroup: calendarGroupRoot._id,
				summary: "v1",
				sequence: "1",
				uid: "uid",
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: ORGANIZER,
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
										address: ORGANIZER,
									}),
									status: CalendarAttendeeStatus.ACCEPTED,
								}),
							],
						}) as CalendarEventProgenitor,
						alarms: [],
					},
				],
			}

			baseCalendarEventUidIndexEntry.progenitor = baseExistingEvent as CalendarEventProgenitor
		})

		o.spec("Pending events", function () {
			o("New invite -- saves new event to db", async function () {
				// Arrange

				// Act
				await calendarModel.processCalendarData(ORGANIZER, baseInvitation)

				// ASSERT
				// checks that update route was not taken
				verify(calendarFacadeMock.updateCalendarEvent(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })

				// capture created event
				const eventCaptor = matchers.captor()
				verify(calendarFacadeMock.createCalendarEvent(eventCaptor.capture(), matchers.anything()))

				const capturedEventInput: CalendarEvent = eventCaptor.value
				o.check(capturedEventInput.pendingInvitation).equals(true)
			})

			// Repeat Rules
			o("New invite to repeating event should have pendingInvitation as true", async function () {
				// Arrange
				baseInvitation.contents[0].event.repeatRule = createTestEntity(RepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
				})

				// Act
				await calendarModel.processCalendarData(ORGANIZER, baseInvitation)

				// ASSERT
				// capture created event
				const eventCaptor = matchers.captor()
				verify(calendarFacadeMock.createCalendarEvent(eventCaptor.capture(), matchers.anything()))

				const capturedEventInput: CalendarEvent = eventCaptor.value
				o.check(capturedEventInput.pendingInvitation).equals(true)
				o.check(capturedEventInput.repeatRule?.frequency).equals(RepeatPeriod.DAILY)
				o.check(capturedEventInput.repeatRule?.interval).equals("1")
			})

			o("new altered instances should not be pendingInvitations if progenitor was not a pendingInvitation", async function () {
				// Arrange
				baseExistingEvent.startTime = baseStartTime
				baseExistingEvent.endTime = baseEndTime
				baseExistingEvent.repeatRule = createTestEntity(RepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
				})

				baseExistingEvent.pendingInvitation = false
				baseCalendarEventUidIndexEntry.progenitor = baseExistingEvent as CalendarEventProgenitor

				baseInvitation.contents[0].event.startTime = baseStartTime
				baseInvitation.contents[0].event.endTime = baseEndTime
				baseInvitation.contents[0].event.recurrenceId = DateTime.fromJSDate(baseStartTime).plus({ days: 1 }).toJSDate()

				baseInvitation.contents[0].event.repeatRule = createTestEntity(RepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
				})

				when(calendarFacadeMock.getEventsByUid(neverNull(baseExistingEvent.uid), CachingMode.Bypass)).thenResolve(baseCalendarEventUidIndexEntry)

				// Act
				await calendarModel.processCalendarData(ORGANIZER, baseInvitation)

				// Assert
				const eventCaptor = matchers.captor()
				verify(calendarFacadeMock.createCalendarEvent(eventCaptor.capture(), matchers.anything()))
				const capturedEventInput: CalendarEvent = eventCaptor.value
				o.check(capturedEventInput.pendingInvitation).equals(false)
			})

			o("new altered instances SHOULD be pendingInvitations if progenitor WAS still a pendingInvitation", async function () {
				// Arrange
				baseExistingEvent.startTime = baseStartTime
				baseExistingEvent.endTime = baseEndTime
				baseExistingEvent.repeatRule = createTestEntity(RepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
				})

				baseExistingEvent.pendingInvitation = true
				baseCalendarEventUidIndexEntry.progenitor = baseExistingEvent as CalendarEventProgenitor

				baseInvitation.contents[0].event.startTime = baseStartTime
				baseInvitation.contents[0].event.endTime = baseEndTime
				baseInvitation.contents[0].event.recurrenceId = DateTime.fromJSDate(baseStartTime).plus({ days: 1 }).toJSDate()

				baseInvitation.contents[0].event.repeatRule = createTestEntity(RepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
				})

				when(calendarFacadeMock.getEventsByUid(neverNull(baseExistingEvent.uid), CachingMode.Bypass)).thenResolve(baseCalendarEventUidIndexEntry)

				// Act
				await calendarModel.processCalendarData(ORGANIZER, baseInvitation)

				// Assert
				const eventCaptor = matchers.captor()
				verify(calendarFacadeMock.createCalendarEvent(eventCaptor.capture(), matchers.anything()))
				const capturedEventInput: CalendarEvent = eventCaptor.value
				o.check(capturedEventInput.pendingInvitation).equals(true)
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
						address: ORGANIZER,
					}),
					startTime,
				})

				// Act
				await calendarModel.processCalendarData(ORGANIZER, {
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
						address: ORGANIZER,
					}),
					startTime: newStartTime,
				})

				when(entityClientMock.load(CalendarEventTypeRef, anything())).thenResolve(sentEvent)

				// Act
				await calendarModel.processCalendarData(ORGANIZER, {
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
			const startTime = new Date()

			const eventByUid: CalendarEventUidIndexEntry = object()
			eventByUid.progenitor = baseExistingEvent as CalendarEventProgenitor
			eventByUid.alteredInstances = []
			when(calendarFacadeMock.getEventsByUid(anything(), anything())).thenResolve(eventByUid)

			const sentEvent = createTestEntity(CalendarEventTypeRef, {
				summary: "v2",
				uid,
				sequence: "2",
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: ORGANIZER,
				}),
				startTime,
			})

			await calendarModel.processCalendarData(ORGANIZER, {
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

			verify(calendarFacadeMock.updateCalendarEvent(eventCaptor.capture(), matchers.anything(), oldEventCaptor.capture()))
			const updatedEvent = eventCaptor.value
			const oldEvent = oldEventCaptor.value
			o(updatedEvent.summary).equals(sentEvent.summary)
			o(updatedEvent.sequence).equals(sentEvent.sequence)
			o(oldEvent).deepEquals(baseExistingEvent)
		})

		o("event entity is re-created when the start time changes", async function () {
			// Arrange

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
					address: ORGANIZER,
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
					address: ORGANIZER,
				}),
			})

			const eventByUid: CalendarEventUidIndexEntry = object()
			eventByUid.progenitor = existingEvent as CalendarEventProgenitor

			when(calendarFacadeMock.getEventsByUid(anything(), anything())).thenResolve(eventByUid)
			when(entityClientMock.load<CalendarEvent>(CalendarEventTypeRef, anything())).thenResolve(clone(sentEvent))

			// Act
			await calendarModel.processCalendarData(ORGANIZER, {
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

		// this is an integration test because it results in real calls to CalendarImporter.parseCalendarFile
		o("safe calendar events updates when the session key of the file cannot be resolved", async function () {
			const calendarFile = createTestEntity(FileTypeRef, {
				_id: ["fileListId", "fileId"],
				_ownerEncSessionKey: null,
			})

			const calendarEventUpdate = createTestEntity(CalendarEventUpdateTypeRef, {
				_id: ["calendarEventUpdateListId", "calendarEventUpdateId"],
				file: calendarFile._id,
			})

			when(entityClientMock.load(CalendarEventUpdateTypeRef, calendarEventUpdate._id)).thenResolve(calendarEventUpdate)
			when(entityClientMock.load(FileTypeRef, calendarFile._id, anything())).thenReject(new SessionKeyNotFoundError("session key cannot be resolved"))

			await calendarModel.entityEventsReceived(
				[
					{
						typeRef: CalendarEventUpdateTypeRef,
						instanceListId: listIdPart(calendarEventUpdate._id) as NonEmptyString,
						instanceId: elementIdPart(calendarEventUpdate._id),
						operation: OperationType.CREATE,
						...noPatchesAndInstance,
						prefetchStatus: PrefetchStatus.NotPrefetched,
					},
				],
				"ownerGroup",
			)
			o(calendarModel.getFileIdToSkippedCalendarEventUpdates().get(getElementId(calendarFile))!).deepEquals(calendarEventUpdate)
		})

		o("process calendar events when ownerEncSessionKey for a File is available", async function () {
			const calendarFile = createTestEntity(FileTypeRef, {
				_id: ["fileListId", "fileId"],
				_ownerEncSessionKey: hexToUint8Array("01"), // set owner enc session key to ensure that we can process the calendar event file
			})

			const calendarEventUpdate = createTestEntity(CalendarEventUpdateTypeRef, {
				_id: ["calendarEventUpdateListId", "calendarEventUpdateId"],
				file: calendarFile._id,
			})

			when(entityClientMock.load(FileTypeRef, calendarFile._id, anything())).thenResolve(calendarFile)
			when(fileControllerMock.getAsDataFile(calendarFile)).thenResolve(createDataFile("event.ics", "ical", stringToUtf8Uint8Array("UID: " + uid), "cid"))
			calendarModel.getFileIdToSkippedCalendarEventUpdates().set(getElementId(calendarFile), calendarEventUpdate)

			await calendarModel.entityEventsReceived(
				[
					{
						typeRef: FileTypeRef,
						instanceListId: getListId(calendarFile) as NonEmptyString,
						instanceId: getElementId(calendarFile),
						operation: OperationType.UPDATE,
						...noPatchesAndInstance,
						prefetchStatus: PrefetchStatus.NotPrefetched,
					},
				],
				"ownerGroup",
			)

			o(calendarModel.getFileIdToSkippedCalendarEventUpdates().size).deepEquals(0)
			verify(entityClientMock.erase(calendarEventUpdate))
		})
	})

	o.spec("processCalendarData - CalendarMethod.CANCEL", function () {
		//
		let baseParsedCalendarDataCancel: ParsedCalendarData

		o.beforeEach(function () {
			const baseParsedEvent = {
				event: createTestEntity(CalendarEventTypeRef, {
					uid,
					summary: baseExistingEvent.summary,
					attendees: [
						createTestEntity(CalendarEventAttendeeTypeRef, {
							address: createTestEntity(EncryptedMailAddressTypeRef, {
								address: ORGANIZER,
							}),
							status: CalendarAttendeeStatus.ACCEPTED,
						}),
					],
				}) as Require<"uid", CalendarEvent>,
				alarms: [],
			}

			baseParsedCalendarDataCancel = {
				method: CalendarMethod.CANCEL,
				contents: [baseParsedEvent],
			}
		})

		o("event is deleted from guest's calendar when cancelled by organizer", async function () {
			when(calendarFacadeMock.getEventsByUid(uid, anything())).thenResolve(baseCalendarEventUidIndexEntry)
			// when(calendarFacadeMock.getEventsByUid(uid)).thenResolve(baseCalendarEventUidIndexEntry) // can delete was needed for call to getEventsByUid within CalendarModel.deleteEventsByUid, that uses the default CachingMode.Cached value

			// ACT: User receives CalendarEventUpdate with cancellation by event with other organizer
			await calendarModel.processCalendarData(ORGANIZER, baseParsedCalendarDataCancel)

			const deletedEventCaptor = matchers.captor()
			verify(entityClientMock.erase(deletedEventCaptor.capture()), { times: 1 })
			o(deletedEventCaptor.value).deepEquals(baseExistingEvent)
		})

		o("event cannot be cancelled by someone other than organizer", async function () {
			when(calendarFacadeMock.getEventsByUid(uid, anything())).thenResolve(baseCalendarEventUidIndexEntry)
			await calendarModel.processCalendarData(UNKNOWN_SENDER, baseParsedCalendarDataCancel)
			verify(entityClientMock.erase(anything()), { times: 0 })

			await calendarModel.processCalendarData(GUEST, baseParsedCalendarDataCancel)
			verify(entityClientMock.erase(anything()), { times: 0 })
		})
	})
})
