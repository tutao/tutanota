import o, { verify } from "@tutao/otest"

import { deepEqual, getFirstOrThrow, isEmpty, neverNull, noOp, Require } from "../../../src/platform-kit/utils"
import { CalendarModel } from "../../../src/applications/calendar-app/calendar/model/CalendarModel.js"
import { RepeatPeriod } from "../../../src/platform-kit/app-env"
import { DateTime } from "luxon"
import { EventController } from "../../../src/applications/common/api/main/EventController.js"
import { Notifications } from "../../../src/ui/Notifications.js"
import { LoginController } from "../../../src/applications/common/api/main/LoginController.js"
import { ProgressTracker } from "../../../src/applications/common/api/main/ProgressTracker.js"
import { EntityClient } from "../../../src/platform-kit/network/EntityClient.js"
import {
	CachingMode,
	CalendarEventAlteredInstance,
	CalendarEventProgenitor,
	CalendarFacade,
	CreateCalendarEventsResult,
	ResolvedUidIndexEntry,
} from "../../../src/applications/common/api/worker/facades/lazy/CalendarFacade.js"
import { FileController } from "../../../src/applications/common/file/FileController.js"
import { createTestEntity } from "../TestUtils.js"
import { MailboxModel } from "../../../src/applications/common/mailFunctionality/MailboxModel.js"
import { ExternalCalendarFacade } from "../../../src/app-kit/native-bridge/common/generatedipc/types"
import { DeviceConfig, LastExternalCalendarSyncEntry } from "../../../src/applications/common/misc/DeviceConfig.js"
import { SyncTracker } from "../../../src/applications/common/api/main/SyncTracker.js"
import { LanguageViewModel } from "../../../src/ui/utils/LanguageViewModel.js"
import { NativePushServiceApp } from "../../../src/applications/common/native/NativePushServiceApp.js"
import { AlarmScheduler } from "../../../src/applications/common/calendar/date/AlarmScheduler"
import { IServiceExecutor } from "../../../src/platform-kit/network/ServiceRequest"
import { ContactModel } from "../../../src/applications/common/contactsFunctionality/ContactModel"
import { OperationId, OperationProgressTracker } from "../../../src/applications/common/api/main/OperationProgressTracker"
import {
	CalendarEvent,
	CalendarEventAttendeeTypeRef,
	CalendarEventTypeRef,
	CalendarGroupRoot,
	CalendarGroupRootTypeRef,
	CalendarRepeatRuleTypeRef,
	Contact,
	ContactMailAddressTypeRef,
	ContactTypeRef,
	EncryptedMailAddressTypeRef,
	GroupSettings,
	GroupSettingsTypeRef,
} from "@tutao/entities/tutanota"
import {
	AlarmInfoTypeRef,
	createDateWrapper,
	GroupInfo,
	GroupInfoTypeRef,
	GroupMember,
	GroupMembership,
	GroupMembershipTypeRef,
	GroupMemberTypeRef,
	GroupTypeRef,
	MailAddressAlias,
	RepeatRuleTypeRef,
	User,
	UserAlarmInfoListType,
	UserAlarmInfoTypeRef,
} from "@tutao/entities/sys"
import { clone, elementIdPart, getListId, listIdPart } from "../../../src/platform-kit/meta"
import { ProgressMonitorInterface } from "../../../src/platform-kit/network/ProgressMonitorInterface"
import { GroupType } from "../../../src/entities/sys/Utils"
import { CalendarAttendeeStatus, CalendarMethod } from "../../../src/entities/tutanota/Utils"
import { IcsCalendarEvent, ParsedCalendarData, ParsedEventAlarmTuple } from "../../../src/applications/calendar-app/calendar/export/CalendarParser"
import { EventAlarmInfoTemplatesTuple, SyncStatus } from "../../../src/applications/common/calendar/import/ImportExportUtils"
import { serializeCalendar } from "../../../src/applications/calendar-app/calendar/export/CalendarExporter"
import { DoubledObject, matchers, object, when } from "testdouble"
import stream from "mithril/stream"

o.spec("CalendarModel", function () {
	const { anything } = matchers

	const timeZone = "Europe/Berlin"
	const now = DateTime.fromObject(
		{
			year: 2026,
			month: 6,
			day: 1,
			hour: 14,
		},
		{ zone: timeZone },
	).toJSDate()

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
	let operationProgressTracker: OperationProgressTracker
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
	let baseExistingProgenitor: CalendarEvent
	let baseCalendarEventUidIndexEntry: ResolvedUidIndexEntry

	let userControllerMock: DoubledObject<{
		user: User
		userGroupInfo: GroupInfo
		getCalendarMemberships: () => Array<GroupMembership>
	}>
	let userMock: User

	let calendarGroupMembership: GroupMembership
	let externalCalendarFacadeMock: ExternalCalendarFacade
	let userGroupInfo: GroupInfo
	let contactModelMock: ContactModel

	o.beforeEach(function () {
		notificationsMock = object()
		eventControllerMock = object()
		schedulerMock = object()
		serviceExecutorMock = object()
		loginControllerMock = object()
		userControllerMock = object()
		progressTrackerMock = object()
		operationProgressTracker = object()
		entityClientMock = object()
		mailboxModelMock = object()
		calendarFacadeMock = object()
		fileControllerMock = object()
		contactModelMock = object()
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

		calendarGroupMembership = createTestEntity(GroupMembershipTypeRef, {
			group: "calendar-group-id",
			groupType: GroupType.Calendar,
			groupInfo: ["group-info-listId", "calendar-group-info-id"],
		})
		userControllerMock.getCalendarMemberships = () => {
			return [calendarGroupMembership]
		}

		const progressMonitorMock = object<ProgressMonitorInterface>()
		when(progressTrackerMock.getMonitor(anything())).thenReturn(progressMonitorMock)

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

		const organizerMailAddress = createTestEntity(ContactMailAddressTypeRef, { address: ORGANIZER })
		const guestMailAddress = createTestEntity(ContactMailAddressTypeRef, { address: GUEST })

		const organizerContactMock = createTestEntity(ContactTypeRef, { mailAddresses: [organizerMailAddress] })
		const guestContactMock: Contact = createTestEntity(ContactTypeRef, { mailAddresses: [guestMailAddress] })

		when(contactModelMock.searchForContact(ORGANIZER)).thenResolve(organizerContactMock)
		when(contactModelMock.searchForContact(GUEST)).thenResolve(guestContactMock)

		when(entityClientMock.loadAll(GroupMemberTypeRef, getListId(groupMemberMock))).thenResolve([groupMemberMock])
		when(entityClientMock.load(CalendarGroupRootTypeRef, calendarGroupRoot._id)).thenResolve(calendarGroupRoot)
		when(entityClientMock.load(GroupTypeRef, calendarGroup._id)).thenResolve(calendarGroup)
		when(entityClientMock.load(GroupInfoTypeRef, calendarGroupInfo._id)).thenResolve(calendarGroupInfo)
		when(calendarFacadeMock.createCalendarEvent(anything(), anything())).thenResolve({})

		calendarModel = new CalendarModel(
			notificationsMock,
			() => Promise.resolve(schedulerMock),
			eventControllerMock,
			serviceExecutorMock,
			loginControllerMock,
			progressTrackerMock,
			operationProgressTracker,
			entityClientMock,
			mailboxModelMock,
			calendarFacadeMock,
			fileControllerMock,
			contactModelMock,
			timeZone,
			externalCalendarFacadeMock,
			deviceConfigMock,
			nativePushServiceAppMock,
			syncTrackMock,
			() => {},
			languageViewModelMock,
		)

		baseExistingProgenitor = createTestEntity(CalendarEventTypeRef, {
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
			startTime: baseStartTime,
			endTime: baseEndTime,
		})

		baseCalendarEventUidIndexEntry = object()
		baseCalendarEventUidIndexEntry.ownerGroup = calendarGroupRoot._id
		baseCalendarEventUidIndexEntry.progenitor = baseExistingProgenitor as CalendarEventProgenitor
		baseCalendarEventUidIndexEntry.alteredInstances = []
	})

	o.spec("processCalendarData - CalendarMethod.REPLY", function () {
		let baseParsedCalendarData: ParsedCalendarData
		let baseParsedEventReply: ParsedEventAlarmTuple

		o.beforeEach(function () {
			baseParsedEventReply = {
				icsCalendarEvent: createTestEntity(CalendarEventTypeRef, {
					uid,
					summary: baseExistingProgenitor.summary,
					attendees: [
						createTestEntity(CalendarEventAttendeeTypeRef, {
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

			userGroupInfo = object()
			userGroupInfo.mailAddressAliases = new Array<MailAddressAlias>()
			userGroupInfo.mailAddress = ORGANIZER
			userControllerMock.userGroupInfo = userGroupInfo
		})

		o("reply is ignored if sender is not a guest or organizer", async function () {
			when(calendarFacadeMock.getEventsByUid(uid, anything(), anything())).thenResolve(baseCalendarEventUidIndexEntry)

			await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(UNKNOWN_SENDER, baseParsedCalendarData)
			verify(calendarFacadeMock.updateCalendarEvent(anything(), anything(), anything()), { times: 0 })
		})

		o("reply from guest doesnt change any field from organizer's event besides its own status", async function () {
			when(calendarFacadeMock.getEventsByUid(uid, anything(), anything())).thenResolve(baseCalendarEventUidIndexEntry)
			baseExistingProgenitor.pendingInvitation = false

			baseParsedEventReply.icsCalendarEvent.summary = "Summary modified by the guest"
			baseParsedEventReply.icsCalendarEvent.attendees!.push(
				createTestEntity(CalendarEventAttendeeTypeRef, {
					address: createTestEntity(EncryptedMailAddressTypeRef, {
						address: ORGANIZER,
					}),
					status: CalendarAttendeeStatus.NEEDS_ACTION,
				}),
			)

			const guest = baseExistingProgenitor.attendees.find((attendee) => attendee.address.address === GUEST)!
			guest.status = baseParsedEventReply.icsCalendarEvent.attendees![0].status

			await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(GUEST, baseParsedCalendarData)

			const eventCaptor = matchers.captor()
			verify(calendarFacadeMock.updateCalendarEvent(eventCaptor.capture(), anything(), anything()))
			const createdEvent: CalendarEvent = eventCaptor.value
			o(createdEvent).deepEquals(baseExistingProgenitor)
			o(createdEvent.pendingInvitation).deepEquals(false)
		})
	})

	o.spec("processCalendarData - CalendarMethod.REQUEST", function () {
		o.beforeEach(function () {
			userGroupInfo = object()
			userGroupInfo.mailAddressAliases = new Array<MailAddressAlias>()
			userGroupInfo.mailAddress = GUEST
			userControllerMock.userGroupInfo = userGroupInfo

			baseInvitation = {
				method: CalendarMethod.REQUEST,
				contents: [
					{
						icsCalendarEvent: baseExistingProgenitor as CalendarEventProgenitor,
						alarms: [],
					},
				],
			}

			const createCalendarEventsResult: CreateCalendarEventsResult = object()
			createCalendarEventsResult.failedEvents = []
			createCalendarEventsResult.failedAlarms = []

			when(calendarFacadeMock.createCalendarEvent(anything(), anything())).thenResolve(createCalendarEventsResult)
		})

		o.spec("Pending events", function () {
			o("New REQUEST invite saves new event to db and sets pendingInvitation true according to guest status", async function () {
				// Arrange

				// Act
				await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(ORGANIZER, baseInvitation)

				// ASSERT
				// checks that update route was not taken
				verify(calendarFacadeMock.updateCalendarEvent(anything(), anything(), anything()), { times: 0 })

				// capture created event
				const eventCaptor = matchers.captor()
				verify(calendarFacadeMock.createCalendarEvent(eventCaptor.capture(), anything()))

				const capturedEventInput: CalendarEvent = eventCaptor.value
				o.check(capturedEventInput.pendingInvitation).equals(true)
			})

			// Repeat Rules
			o("New REQUEST invite to repeating event sets pendingInvitation true", async function () {
				// Arrange
				baseInvitation.contents[0].icsCalendarEvent.repeatRule = createTestEntity(RepeatRuleTypeRef, {
					frequency: RepeatPeriod.DAILY,
					interval: "1",
				})

				// Act
				await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(ORGANIZER, baseInvitation)

				// ASSERT
				// capture created event
				verify(calendarFacadeMock.updateCalendarEvent(anything(), anything(), anything()), { times: 0 })
				const eventCaptor = matchers.captor()
				verify(calendarFacadeMock.createCalendarEvent(eventCaptor.capture(), anything()))

				const capturedEventInput: CalendarEvent = eventCaptor.value
				o.check(capturedEventInput.pendingInvitation).equals(true)
				o.check(capturedEventInput.repeatRule?.frequency).equals(RepeatPeriod.DAILY)
				o.check(capturedEventInput.repeatRule?.interval).equals("1")
			})

			o("Invite to an altered instance, without being invited to original repeating series, should create new pendingInvitation", async function () {
				// Arrange -- base invitation needs recurrence ID, not repeat rule
				const recurrenceId = new Date()
				baseInvitation.contents[0].icsCalendarEvent.recurrenceId = recurrenceId

				// Act
				await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(ORGANIZER, baseInvitation)

				// ASSERT
				// capture created event
				verify(calendarFacadeMock.updateCalendarEvent(anything(), anything(), anything()), { times: 0 })
				const eventCaptor = matchers.captor()
				verify(calendarFacadeMock.createCalendarEvent(eventCaptor.capture(), anything()))

				const capturedEventInput: CalendarEvent = eventCaptor.value
				o.check(capturedEventInput.pendingInvitation).equals(true)
				o.check(capturedEventInput.recurrenceId).equals(recurrenceId)
			})

			o("Update to a progenitor with guest status as NEEDS_ACTION sets pendingInvitation to true", async function () {
				const eventByUid: ResolvedUidIndexEntry = object()
				baseExistingProgenitor.pendingInvitation = false
				eventByUid.progenitor = baseExistingProgenitor as CalendarEventProgenitor
				eventByUid.alteredInstances = []

				when(calendarFacadeMock.getEventsByUid(anything(), anything(), anything())).thenResolve(eventByUid)

				// Act
				await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(ORGANIZER, baseInvitation)

				const eventCaptor = matchers.captor()
				const oldEventCaptor = matchers.captor()
				verify(calendarFacadeMock.updateCalendarEvent(eventCaptor.capture(), anything(), oldEventCaptor.capture()), { times: 1 })

				const oldEvent: CalendarEvent = oldEventCaptor.value
				o.check(oldEvent).deepEquals(baseExistingProgenitor)

				const updatedEvent: CalendarEvent = eventCaptor.value
				o.check(updatedEvent._id).deepEquals(oldEvent._id)
				o.check(updatedEvent.summary).equals(baseExistingProgenitor.summary)
				o.check(updatedEvent.pendingInvitation).equals(true)
			})

			o(
				"new altered instances with guest status NEEDS_ACTION SHOULD be a pendingInvitation even if progenitor invitation has been accepted, and progenitor pendingInvitation status should not change",
				async function () {
					// Arrange
					baseExistingProgenitor.repeatRule = createTestEntity(RepeatRuleTypeRef, {
						frequency: RepeatPeriod.DAILY,
						interval: "1",
					})
					baseExistingProgenitor.pendingInvitation = false

					when(
						calendarFacadeMock.getEventsByUid(
							neverNull(baseExistingProgenitor.uid),
							neverNull(baseExistingProgenitor._ownerGroup),
							CachingMode.Bypass,
						),
					).thenResolve(baseCalendarEventUidIndexEntry)

					const alteredInstanceInvitation = clone(baseInvitation)
					const guestAttendee = baseInvitation.contents[0].icsCalendarEvent.attendees!.find((attendee) => attendee.address.address === GUEST)!
					guestAttendee.status = CalendarAttendeeStatus.ACCEPTED // Guest has previously accepted the invitation for the whole series

					// recurrenceId must correspond with original start time of scheduled recurrence.  used baseStartTime+1 because the time is one day
					const alteredInstanceRecurrenceId = DateTime.fromJSDate(baseStartTime).plus({ days: 1 }).toJSDate()

					const alteredInstanceStartTime = DateTime.fromJSDate(baseStartTime).plus({ hours: 25 }).toJSDate()
					const alteredInstanceEndTime = DateTime.fromJSDate(baseEndTime).plus({ hours: 25 }).toJSDate()
					const alteredInstanceEvent = alteredInstanceInvitation.contents[0].icsCalendarEvent

					alteredInstanceEvent.summary = "ALTERED INSTANCE" // for identifying during debugging
					alteredInstanceEvent.startTime = alteredInstanceStartTime
					alteredInstanceEvent.endTime = alteredInstanceEndTime
					alteredInstanceEvent.recurrenceId = alteredInstanceRecurrenceId

					alteredInstanceInvitation.contents.push({ icsCalendarEvent: alteredInstanceEvent, alarms: [] })

					// Act
					await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(ORGANIZER, alteredInstanceInvitation)

					// Assert
					const alteredInstanceCaptor = matchers.captor()
					verify(calendarFacadeMock.createCalendarEvent(alteredInstanceCaptor.capture(), anything()))
					const actualAlteredInstance: CalendarEvent = alteredInstanceCaptor.value
					o.check(actualAlteredInstance.pendingInvitation).equals(true) // true because start time has changed (i.e. does not match recurrenceId) so organizer should send the guest status as NEEDS_ACTION
					o.check(actualAlteredInstance.startTime).equals(alteredInstanceStartTime)
					o.check(actualAlteredInstance.endTime).equals(alteredInstanceEndTime)
					o.check(actualAlteredInstance.recurrenceId).equals(alteredInstanceRecurrenceId)

					const updatedProgenitorCaptor = matchers.captor()
					verify(calendarFacadeMock.updateCalendarEvent(updatedProgenitorCaptor.capture(), anything(), anything()))
					const updatedProgenitor: CalendarEvent = updatedProgenitorCaptor.value
					o.check(updatedProgenitor.pendingInvitation).equals(baseExistingProgenitor.pendingInvitation) // progenitor keeps existing pendingInvitation state
					const excludedDate = getFirstOrThrow(updatedProgenitor.repeatRule!.excludedDates)
					o.check(excludedDate.date.getTime()).equals(alteredInstanceEvent.recurrenceId.getTime())
				},
			)
		})

		o.spec("Previously replied events", function () {
			o("Simple update should NOT create a ghost bubble", async function () {
				const eventByUid: ResolvedUidIndexEntry = object()
				baseExistingProgenitor.pendingInvitation = false
				eventByUid.progenitor = baseExistingProgenitor as CalendarEventProgenitor
				eventByUid.alteredInstances = []
				when(calendarFacadeMock.getEventsByUid(anything(), anything(), anything())).thenResolve(eventByUid)

				const sentEvent = createTestEntity(CalendarEventTypeRef, {
					summary: "v2",
					uid,
					sequence: "2",
					organizer: createTestEntity(EncryptedMailAddressTypeRef, {
						address: ORGANIZER,
					}),
					startTime: baseExistingProgenitor.startTime,
				})

				await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(ORGANIZER, {
					method: CalendarMethod.REQUEST,
					contents: [
						{
							icsCalendarEvent: sentEvent as CalendarEventProgenitor,
							alarms: [],
						},
					],
				})

				const eventCaptor = matchers.captor()
				const oldEventCaptor = matchers.captor()

				verify(calendarFacadeMock.updateCalendarEvent(eventCaptor.capture(), anything(), oldEventCaptor.capture()))
				const updatedEvent = eventCaptor.value
				const oldEvent = oldEventCaptor.value
				o(updatedEvent.summary).equals(sentEvent.summary)
				o(updatedEvent.sequence).equals(sentEvent.sequence)
				o(updatedEvent.pendingInvitation).equals(false)
				o(oldEvent).deepEquals(baseExistingProgenitor)
			})

			o("Update from deleted contact should still be processed", function () {})
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

			baseExistingProgenitor.startTime = DateTime.fromObject(
				{
					year: 2020,
					month: 5,
					day: 10,
				},
				{ zone: "UTC" },
			).toJSDate()
			baseExistingProgenitor.organizer = createTestEntity(EncryptedMailAddressTypeRef, {
				address: ORGANIZER,
			})
			baseExistingProgenitor.alarmInfos = [[alarmsListId, alarmInfo._id]]
			baseExistingProgenitor.pendingInvitation = false

			const icsEvent = clone(baseExistingProgenitor)
			icsEvent.summary = "v2"
			icsEvent.sequence = "2"
			icsEvent.startTime = DateTime.fromObject(
				{
					year: 2020,
					month: 5,
					day: 11,
				},
				{ zone: "UTC" },
			).toJSDate()
			icsEvent.organizer = createTestEntity(EncryptedMailAddressTypeRef, {
				address: ORGANIZER,
			})

			const eventByUid: ResolvedUidIndexEntry = object()
			eventByUid.progenitor = baseExistingProgenitor as CalendarEventProgenitor

			when(calendarFacadeMock.getEventsByUid(anything(), anything(), anything())).thenResolve(eventByUid)

			const expectedNewEvent = clone(baseExistingProgenitor)
			expectedNewEvent.startTime = icsEvent.startTime
			expectedNewEvent.summary = icsEvent.summary
			expectedNewEvent.sequence = icsEvent.sequence

			when(entityClientMock.load<CalendarEvent>(CalendarEventTypeRef, anything())).thenResolve(expectedNewEvent)
			const replaceCalendarEventResult: CreateCalendarEventsResult = object()
			replaceCalendarEventResult.failedEvents = []
			replaceCalendarEventResult.failedAlarms = []
			when(calendarFacadeMock.replaceCalendarEvent(anything(), anything(), anything())).thenResolve(replaceCalendarEventResult)
			// Act
			await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(ORGANIZER, {
				method: CalendarMethod.REQUEST,
				contents: [
					{
						icsCalendarEvent: icsEvent as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})

			const oldEventCaptor = matchers.captor()
			const eventCaptor = matchers.captor()
			const alarmsCaptor = matchers.captor()

			verify(calendarFacadeMock.replaceCalendarEvent(oldEventCaptor.capture(), eventCaptor.capture(), alarmsCaptor.capture()))
			const updatedEvent = eventCaptor.value
			const updatedAlarms = alarmsCaptor.value
			const oldEvent = oldEventCaptor.value

			o(updatedEvent.summary).equals(icsEvent.summary)
			o(updatedEvent.sequence).equals(icsEvent.sequence)
			o(updatedEvent.startTime.toISOString()).equals(icsEvent.startTime.toISOString())
			o(updatedEvent.uid).equals(uid)
			o(updatedAlarms).deepEquals([alarmInfo])
			o(oldEvent).deepEquals(baseExistingProgenitor)
		})
	})

	o.spec("processCalendarData - CalendarMethod.CANCEL", function () {
		let baseParsedCalendarDataCancel: ParsedCalendarData
		let baseParsedEvent: ParsedEventAlarmTuple

		o.beforeEach(function () {
			userGroupInfo = object()
			userGroupInfo.mailAddressAliases = new Array<MailAddressAlias>()
			userGroupInfo.mailAddress = GUEST
			userControllerMock.userGroupInfo = userGroupInfo

			baseParsedEvent = {
				icsCalendarEvent: createTestEntity(CalendarEventTypeRef, {
					uid,
				}) as CalendarEventProgenitor,
				alarms: [],
			}

			baseParsedCalendarDataCancel = {
				method: CalendarMethod.CANCEL,
				contents: [baseParsedEvent],
			}
		})

		o("progenitor is deleted from guest's calendar when cancelled by organizer", async function () {
			when(calendarFacadeMock.getEventsByUid(uid, anything(), CachingMode.Bypass)).thenResolve(baseCalendarEventUidIndexEntry)
			when(calendarFacadeMock.getEventsByUid(uid, anything())).thenResolve(baseCalendarEventUidIndexEntry)

			await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(ORGANIZER, baseParsedCalendarDataCancel)

			const deletedEventCaptor = matchers.captor()
			verify(entityClientMock.erase(deletedEventCaptor.capture()), { times: 1 })
			o(deletedEventCaptor.value).deepEquals(baseExistingProgenitor)
		})

		o("altered instance is deleted from guest's calendar when cancelled by organizer and progenitor is not updated", async function () {
			baseParsedEvent.icsCalendarEvent.summary = "Altered Instance"
			baseParsedEvent.icsCalendarEvent.recurrenceId = new Date()
			baseParsedEvent.icsCalendarEvent.repeatRule = null
			baseParsedEvent.icsCalendarEvent.organizer = createTestEntity(EncryptedMailAddressTypeRef, {
				address: ORGANIZER,
			})
			baseCalendarEventUidIndexEntry.alteredInstances.push(baseParsedEvent.icsCalendarEvent as CalendarEventAlteredInstance)
			when(calendarFacadeMock.getEventsByUid(uid, anything(), anything())).thenResolve(baseCalendarEventUidIndexEntry)

			await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(ORGANIZER, baseParsedCalendarDataCancel)

			const deletedEventCaptor = matchers.captor()
			verify(entityClientMock.erase(deletedEventCaptor.capture()), { times: 1 })
			o(deletedEventCaptor.value).deepEquals(baseParsedEvent.icsCalendarEvent)

			verify(calendarFacadeMock.updateCalendarEvent(anything(), anything(), anything()), { times: 0 })
		})

		o(
			"altered instance is deleted from guest's calendar when cancelled by organizer and updates progenitor by removing its exclusion date",
			async function () {
				baseParsedEvent.icsCalendarEvent.summary = "Altered Instance"
				baseParsedEvent.icsCalendarEvent.recurrenceId = new Date()
				baseParsedEvent.icsCalendarEvent.repeatRule = null
				baseParsedEvent.icsCalendarEvent.organizer = createTestEntity(EncryptedMailAddressTypeRef, {
					address: ORGANIZER,
				})
				baseCalendarEventUidIndexEntry.alteredInstances.push(baseParsedEvent.icsCalendarEvent as CalendarEventAlteredInstance)

				baseExistingProgenitor.repeatRule = createTestEntity(RepeatRuleTypeRef, {
					excludedDates: [createDateWrapper({ date: baseParsedEvent.icsCalendarEvent.recurrenceId })],
				})

				when(calendarFacadeMock.getEventsByUid(uid, anything(), anything())).thenResolve(baseCalendarEventUidIndexEntry)

				await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(ORGANIZER, baseParsedCalendarDataCancel)

				const deletedEventCaptor = matchers.captor()
				verify(entityClientMock.erase(deletedEventCaptor.capture()), { times: 1 })
				o(deletedEventCaptor.value).deepEquals(baseParsedEvent.icsCalendarEvent)

				const progenitorCaptor = matchers.captor()
				verify(calendarFacadeMock.updateCalendarEvent(progenitorCaptor.capture(), anything(), anything()), { times: 1 })
				const capturedProgenitor: CalendarEventProgenitor = progenitorCaptor.value
				o.check(capturedProgenitor.repeatRule?.excludedDates.length).equals(0)
			},
		)

		o("event cannot be cancelled by someone other than organizer", async function () {
			when(calendarFacadeMock.getEventsByUid(uid, anything(), anything())).thenResolve(baseCalendarEventUidIndexEntry)

			await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(UNKNOWN_SENDER, baseParsedCalendarDataCancel)
			verify(entityClientMock.erase(anything()), { times: 0 })

			await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(GUEST, baseParsedCalendarDataCancel)
			verify(entityClientMock.erase(anything()), { times: 0 })
		})
	})

	o.spec("Untrusted contact - unknown sender (not in contacts)", function () {
		let sentEvent: IcsCalendarEvent

		o.beforeEach(function () {
			userGroupInfo = object()
			userGroupInfo.mailAddressAliases = new Array<MailAddressAlias>()
			userGroupInfo.mailAddress = GUEST
			userControllerMock.userGroupInfo = userGroupInfo

			when(contactModelMock.searchForContact(ORGANIZER)).thenResolve(null)

			sentEvent = {
				summary: "v2",
				uid,
				sequence: "2",
				organizer: createTestEntity(EncryptedMailAddressTypeRef, {
					address: ORGANIZER,
				}),
				startTime: baseExistingProgenitor.startTime,
				endTime: baseExistingProgenitor.endTime,
				attendees: baseExistingProgenitor.attendees,
				description: baseExistingProgenitor.description,
				location: baseExistingProgenitor.location,
				repeatRule: baseExistingProgenitor.repeatRule,
				recurrenceId: baseExistingProgenitor.recurrenceId,
				startTimeZone: baseExistingProgenitor.startTimeZone,
				endTimeZone: baseExistingProgenitor.endTimeZone,
			}
		})

		o("If user has never replied or interacted with this calendarEvent, the CalendarEventUpdates should be ignored", async function () {
			when(calendarFacadeMock.getEventsByUid(anything(), anything(), anything())).thenResolve(null)

			await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(UNKNOWN_SENDER, {
				method: CalendarMethod.REQUEST,
				contents: [
					{
						icsCalendarEvent: sentEvent as CalendarEventProgenitor,
						alarms: [],
					},
				],
			})
			verify(calendarFacadeMock.getEventsByUid(anything(), anything(), anything()), { times: 1 })
			verify(calendarModel.handleNewCalendarEventInvitationFromIcs(anything(), anything(), anything()), { times: 0 })
			verify(calendarModel.handleExistingCalendarEventInvitationFromIcs(anything(), anything(), anything(), anything(), anything()), { times: 0 })
		})

		o("Updates to previously replied/interacted calendarEvents should still be applied", async function () {
			baseExistingProgenitor.attendees[1].status = CalendarAttendeeStatus.ACCEPTED // User already accepted previous reply
			when(calendarFacadeMock.getEventsByUid(anything(), anything(), anything())).thenResolve(baseCalendarEventUidIndexEntry)
			when(contactModelMock.searchForContact(ORGANIZER)).thenResolve(null)

			await calendarModel.processParsedCalendarDataFromCalendarEventUpdate(ORGANIZER, {
				method: CalendarMethod.REQUEST,
				contents: [
					{
						icsCalendarEvent: sentEvent,
						alarms: [],
					},
				],
			})

			const eventCaptor = matchers.captor()
			const oldEventCaptor = matchers.captor()

			verify(calendarFacadeMock.updateCalendarEvent(eventCaptor.capture(), anything(), oldEventCaptor.capture()))
			const updatedEvent = eventCaptor.value
			const oldEvent = oldEventCaptor.value
			o(updatedEvent.summary).equals(sentEvent.summary)
			o(updatedEvent.sequence).equals(sentEvent.sequence)
			o(updatedEvent.pendingInvitation).equals(false)
			o(oldEvent).deepEquals(baseExistingProgenitor)
		})
	})

	o.spec("syncExternalCalendars", function () {
		const externalCalSourceUrl = "https://calendar-subscription.com"
		const calendarSubscriptionId = "calendar-subscription-id"
		let externalCalendarGroupSettings: GroupSettings
		let externalCalendarGroupRoot: CalendarGroupRoot
		let lastExternalCalendarSyncRegistry: Map<Id, LastExternalCalendarSyncEntry>

		o.beforeEach(function () {
			externalCalendarGroupSettings = createTestEntity(GroupSettingsTypeRef, {
				group: calendarSubscriptionId,
				sourceUrl: externalCalSourceUrl,
				name: "subscription",
			})

			userGroupInfo = object()
			userGroupInfo.mailAddressAliases = new Array<MailAddressAlias>()
			userGroupInfo.mailAddress = "user@tuta.io"

			userControllerMock = object()
			userControllerMock.userGroupInfo = userGroupInfo
			userControllerMock.getCalendarMemberships = () => {
				return [
					createTestEntity(GroupMembershipTypeRef, {
						group: calendarSubscriptionId,
						groupType: GroupType.Calendar,
						groupInfo: ["group-info-listId", "calendar-group-info-id"],
					}),
				]
			}

			when(loginControllerMock.getUserController()).thenReturn(userControllerMock)
			when(loginControllerMock.isFullyLoggedIn()).thenReturn(true)

			when(operationProgressTracker.startNewOperation()).thenReturn({ id: 0, progress: stream(0), done: noOp })

			externalCalendarGroupRoot = createTestEntity(CalendarGroupRootTypeRef, {
				_id: calendarSubscriptionId,
				longEvents: "longEvents",
				shortEvents: "shortEvents",
			})
			when(entityClientMock.load(CalendarGroupRootTypeRef, calendarSubscriptionId)).thenResolve(externalCalendarGroupRoot)

			lastExternalCalendarSyncRegistry = new Map([
				[
					calendarSubscriptionId,
					{
						lastSuccessfulSync: null,
						lastSyncStatus: SyncStatus.Success,
					},
				],
			])
			when(deviceConfigMock.getLastExternalCalendarSync()).thenReturn(lastExternalCalendarSyncRegistry)
		})

		o.spec("Simple non-recurring events", function () {
			o.test("Sync adds events to empty calendar", async function () {
				const workEvent = makeCalendarEvent(calendarSubscriptionId, "work-event@tuta.com", "Work Event", timeZone)
				const holidayEvent = makeCalendarEvent(calendarSubscriptionId, "holiday-event@tuta.com", "Holiday Event", timeZone)
				const simpleCalendarSubscriptionIcs = serializeCalendar(
					"0",
					[
						{ event: workEvent, alarms: [] },
						{ event: holidayEvent, alarms: [] },
					],
					now,
					timeZone,
				)

				setupCalendarSubscription(simpleCalendarSubscriptionIcs, [], [])

				let eventsToCreate: Array<EventAlarmInfoTemplatesTuple> = []
				when(calendarFacadeMock.createCalendarEvents(anything(), anything())).thenDo(
					(eventAlarmInfoTemplatesTuples: Array<EventAlarmInfoTemplatesTuple>, operationId: OperationId) => {
						eventsToCreate = eventAlarmInfoTemplatesTuples
						const result: CreateCalendarEventsResult = makeCreateCalendarEventsResult({
							successfulEvents: eventAlarmInfoTemplatesTuples.map((tuple) => tuple.event),
						})
						return Promise.resolve(result)
					},
				)

				await calendarModel.syncExternalCalendars([externalCalendarGroupSettings])

				verify(entityClientMock.erase(anything()), { times: 0 })

				verify(calendarFacadeMock.updateCalendarEvent(anything(), anything(), anything()), { times: 0 })
				verify(calendarFacadeMock.replaceCalendarEvent(anything(), anything(), anything()), { times: 0 })

				verify(deviceConfigMock.updateLastSync(calendarSubscriptionId), { times: 1 })

				o.check(eventsToCreate.length).equals(2)
			})

			o.test("Full sync performs all operations: removal, update, creation, skip unchanged", async function () {
				// Arrange
				const unchangedEvent = makeCalendarEvent(calendarSubscriptionId, "simple-unchanged-example@tuta.com", "Simple Unchanged Event", timeZone)
				const originalEventUpdated = makeCalendarEvent(calendarSubscriptionId, "updated-example@tuta.com", "Updated Event New Title", timeZone)
				const newEvent = makeCalendarEvent(calendarSubscriptionId, "new-event-example@tuta.com", "New Event", timeZone)
				const allOperationsEventsCal = serializeCalendar(
					"0",
					[
						{ event: unchangedEvent, alarms: [] },
						{ event: originalEventUpdated, alarms: [] },
						{ event: newEvent, alarms: [] },
					],
					now,
					timeZone,
				)

				const originalEvent = createTestEntity(CalendarEventTypeRef, {
					...originalEventUpdated,
					summary: "Event Old Title",
				})
				const calendarEventToBeRemoved = makeCalendarEvent(calendarSubscriptionId, "simple-deleted-example@tuta.com", "Simple Deleted Event", timeZone)

				setupCalendarSubscription(allOperationsEventsCal, [unchangedEvent, originalEvent, calendarEventToBeRemoved], [])

				// if this does not match on any input, test will fail due to timeout
				// timeout may also occur if calendarFacade.replaceCalendarEvent is called instead of calendarFacade.updateCalendar event
				// due to a date/time change
				when(
					calendarFacadeMock.createCalendarEvents(
						matchers.argThat((arg: EventAlarmInfoTemplatesTuple[]) => {
							return arg.length === 1 && arg[0].event.summary === newEvent.summary && arg[0].event.uid === newEvent.uid
						}),
						anything(),
					),
				).thenResolve(makeCreateCalendarEventsResult({ successfulEvents: [newEvent] }))

				//Act
				await calendarModel.syncExternalCalendars([externalCalendarGroupSettings])

				// Assert
				// capture event deletion input value
				const deleteEventCaptor = matchers.captor()
				verify(entityClientMock.erase(deleteEventCaptor.capture()), { times: 1 })

				verify(calendarFacadeMock.createCalendarEvents(anything(), anything()), { times: 1 })

				const updateEventCaptor = matchers.captor()
				verify(calendarFacadeMock.updateCalendarEvent(updateEventCaptor.capture(), anything(), anything()), { times: 1 })

				const eventToDelete: CalendarEvent = deleteEventCaptor.value
				o.check(eventToDelete.summary).equals(calendarEventToBeRemoved.summary)
				o.check(eventToDelete.uid).equals(calendarEventToBeRemoved.uid)

				const eventToUpdate: CalendarEvent = updateEventCaptor.value
				o.check(eventToUpdate.summary).equals(originalEventUpdated.summary)
				o.check(eventToUpdate.uid).equals(originalEventUpdated.uid)
			})

			o.spec("With existing event stored from previous sync", function () {
				let simpleExistingEvent: CalendarEvent
				let simpleCalendarSubscriptionIcs: string

				o.beforeEach(function () {
					simpleExistingEvent = makeCalendarEvent(calendarSubscriptionId, "test-example@tuta.com", "Simple Event", timeZone)
					simpleCalendarSubscriptionIcs = serializeCalendar("0", [{ event: simpleExistingEvent, alarms: [] }], now, timeZone)

					when(entityClientMock.loadAll(CalendarEventTypeRef, externalCalendarGroupRoot.shortEvents)).thenResolve([simpleExistingEvent])
					when(entityClientMock.loadAll(CalendarEventTypeRef, externalCalendarGroupRoot.longEvents)).thenResolve([])
				})

				o.test("Sync does not update unchanged events", async function () {
					when(externalCalendarFacadeMock.fetchExternalCalendar(externalCalSourceUrl)).thenResolve(simpleCalendarSubscriptionIcs)

					await calendarModel.syncExternalCalendars([externalCalendarGroupSettings])

					verify(entityClientMock.erase(anything()), { times: 0 })

					verify(calendarFacadeMock.updateCalendarEvent(anything(), anything(), anything()), { times: 0 })
					verify(calendarFacadeMock.replaceCalendarEvent(anything(), anything(), anything()), { times: 0 })
					verify(calendarFacadeMock.createCalendarEvents(anything(), anything()), { times: 0 })

					verify(deviceConfigMock.updateLastSync(calendarSubscriptionId), { times: 1 })
				})

				o.test("Sync update events when content changes", async function () {
					const newEventTitle = "New Event Title"
					const calendarSubscriptionIcsWithChange = simpleCalendarSubscriptionIcs.replace("SUMMARY:Simple Event", `SUMMARY:${newEventTitle}`)

					when(externalCalendarFacadeMock.fetchExternalCalendar(externalCalSourceUrl)).thenResolve(calendarSubscriptionIcsWithChange)

					await calendarModel.syncExternalCalendars([externalCalendarGroupSettings])

					verify(entityClientMock.erase(anything()), { times: 0 })

					verify(calendarFacadeMock.createCalendarEvents(anything(), anything()), { times: 0 })
					verify(calendarFacadeMock.replaceCalendarEvent(anything(), anything(), anything()), { times: 0 })

					const eventCaptor = matchers.captor()
					verify(calendarFacadeMock.updateCalendarEvent(eventCaptor.capture(), anything(), anything()), { times: 1 })

					const eventToUpdate: CalendarEvent = eventCaptor.value
					o.check(eventToUpdate.summary).equals(newEventTitle)

					verify(deviceConfigMock.updateLastSync(calendarSubscriptionId), { times: 1 })
				})

				o.test("Simple - Sync add all new events and remove old ones", async function () {
					// Arrange
					const differentCalendarEvent = makeCalendarEvent(calendarSubscriptionId, "different-test-example@tuta.com", "Different Event", timeZone)
					const differentCalendarSubscriptionIcs = serializeCalendar("0", [{ event: differentCalendarEvent, alarms: [] }], now, timeZone)

					when(externalCalendarFacadeMock.fetchExternalCalendar(externalCalSourceUrl)).thenResolve(differentCalendarSubscriptionIcs)

					// if this fails to match, test will fail due to timeout
					when(
						calendarFacadeMock.createCalendarEvents(
							matchers.argThat((arg: EventAlarmInfoTemplatesTuple[]) => {
								return (
									arg.length === 1 &&
									arg[0].event.summary === differentCalendarEvent.summary &&
									arg[0].event.uid === differentCalendarEvent.uid
								)
							}),
							anything(),
						),
					).thenResolve(makeCreateCalendarEventsResult({ successfulEvents: [differentCalendarEvent] }))

					// Act
					await calendarModel.syncExternalCalendars([externalCalendarGroupSettings])

					// capture event deletion input value
					const deleteEventCaptor = matchers.captor()
					verify(entityClientMock.erase(deleteEventCaptor.capture()), { times: 1 })

					verify(calendarFacadeMock.createCalendarEvents(anything(), anything()), { times: 1 })

					// verify updateCalendarEvent is never called
					verify(calendarFacadeMock.updateCalendarEvent(anything(), anything(), anything()), { times: 0 })

					// Assert
					const eventToDelete: CalendarEvent = deleteEventCaptor.value
					o.check(eventToDelete.summary).equals("Simple Event")
					o.check(eventToDelete.uid).equals("test-example@tuta.com")

					verify(deviceConfigMock.updateLastSync(calendarSubscriptionId), { times: 1 })
				})
			})
		})

		o.spec("External calendar with repeating events", function () {
			o.spec("No-changes", function () {
				o.test("Sync skip progenitor with no changes", async function () {
					const progenitor = makeCalendarEvent(calendarSubscriptionId, "event-series-uid@tuta.com", "Progenitor Event", timeZone)
					progenitor.repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
						frequency: RepeatPeriod.DAILY,
						interval: "1",
						timeZone,
					})

					const eventSeriesProgenitorIcs = serializeCalendar("0", [{ event: progenitor, alarms: [] }], now, timeZone)

					setupCalendarSubscription(eventSeriesProgenitorIcs, [], [progenitor])

					// Act
					await calendarModel.syncExternalCalendars([externalCalendarGroupSettings])

					verify(entityClientMock.erase(anything()), { times: 0 })

					verify(calendarFacadeMock.updateCalendarEvent(anything(), anything(), anything()), { times: 0 })
					verify(calendarFacadeMock.replaceCalendarEvent(anything(), anything(), anything()), { times: 0 })
					verify(calendarFacadeMock.createCalendarEvents(anything(), anything()), { times: 0 })

					verify(deviceConfigMock.updateLastSync(calendarSubscriptionId), { times: 1 })
				})

				o.test("Sync skip progenitor and altered instances with no change", async function () {
					const progenitor = makeCalendarEvent(
						calendarSubscriptionId,
						"event-series-uid@tuta.com",
						"Progenitor Event",
						timeZone,
					) as CalendarEventProgenitor
					progenitor.repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
						frequency: RepeatPeriod.DAILY,
						interval: "1",
						timeZone,
					})
					const alteredInstance = makeCalendarEvent(
						calendarSubscriptionId,
						progenitor.uid,
						"Altered Instance",
						timeZone,
					) as CalendarEventAlteredInstance
					alteredInstance.recurrenceId = DateTime.fromJSDate(progenitor.startTime, { zone: progenitor.repeatRule.timeZone })
						.plus({ day: 1 })
						.toJSDate()
					progenitor.repeatRule.excludedDates = [createDateWrapper({ date: alteredInstance.recurrenceId })]

					const eventSeriesIcs = serializeCalendar(
						"0",
						[
							{ event: progenitor, alarms: [] },
							{ event: alteredInstance, alarms: [] },
						],
						now,
						timeZone,
					)

					setupCalendarSubscription(eventSeriesIcs, [alteredInstance], [progenitor])

					// Act
					await calendarModel.syncExternalCalendars([externalCalendarGroupSettings])

					// Assert
					verify(entityClientMock.erase(anything()), { times: 0 })
					verify(calendarFacadeMock.updateCalendarEvent(anything(), anything(), anything()), { times: 0 })
					verify(calendarFacadeMock.replaceCalendarEvent(anything(), anything(), anything()), { times: 0 })
					verify(calendarFacadeMock.createCalendarEvents(anything(), anything()), { times: 0 })

					verify(deviceConfigMock.updateLastSync(calendarSubscriptionId), { times: 1 })
				})

				o.test("Sync skip progenitor and altered instances with no change even when ics does not have excluded dates field", async function () {
					const progenitor = makeCalendarEvent(
						calendarSubscriptionId,
						"event-series-uid@tuta.com",
						"Progenitor Event",
						timeZone,
					) as CalendarEventProgenitor
					progenitor.repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
						frequency: RepeatPeriod.DAILY,
						interval: "1",
						timeZone,
					})
					const alteredInstance = makeCalendarEvent(
						calendarSubscriptionId,
						progenitor.uid,
						"Altered Instance",
						timeZone,
					) as CalendarEventAlteredInstance
					alteredInstance.recurrenceId = DateTime.fromJSDate(progenitor.startTime, { zone: progenitor.repeatRule.timeZone })
						.plus({ day: 1 })
						.toJSDate()

					const eventSeriesIcs = serializeCalendar(
						"0",
						[
							{ event: progenitor, alarms: [] },
							{ event: alteredInstance, alarms: [] },
						],
						now,
						timeZone,
					)

					const existingProgenitorWithExcludedDates = createTestEntity(CalendarEventTypeRef, { ...progenitor })
					existingProgenitorWithExcludedDates.repeatRule!.excludedDates = [createDateWrapper({ date: alteredInstance.recurrenceId })]

					setupCalendarSubscription(eventSeriesIcs, [alteredInstance], [existingProgenitorWithExcludedDates])

					// Act
					await calendarModel.syncExternalCalendars([externalCalendarGroupSettings])

					// Assert
					verify(entityClientMock.erase(anything()), { times: 0 })
					verify(calendarFacadeMock.updateCalendarEvent(anything(), anything(), anything()), { times: 0 })
					verify(calendarFacadeMock.replaceCalendarEvent(anything(), anything(), anything()), { times: 0 })
					verify(calendarFacadeMock.createCalendarEvents(anything(), anything()), { times: 0 })

					verify(deviceConfigMock.updateLastSync(calendarSubscriptionId), { times: 1 })
				})
			})

			o.spec("Sync with changes", function () {
				o.test("Sync update progenitor when content change", async function () {
					const newProgenitor = makeCalendarEvent(calendarSubscriptionId, "event-series-uid@tuta.com", "Progenitor Event", timeZone)
					newProgenitor.repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
						frequency: RepeatPeriod.DAILY,
						interval: "1",
						timeZone,
					})
					const oldProgenitor = createTestEntity(CalendarEventTypeRef, {
						...newProgenitor,
						summary: "Old Progenitor",
					})

					const eventSeriesProgenitorIcs = serializeCalendar("0", [{ event: newProgenitor, alarms: [] }], now, timeZone)

					setupCalendarSubscription(eventSeriesProgenitorIcs, [], [oldProgenitor])

					await calendarModel.syncExternalCalendars([externalCalendarGroupSettings])

					// Assert
					verify(entityClientMock.erase(anything()), { times: 0 })
					verify(
						calendarFacadeMock.updateCalendarEvent(
							matchers.argThat((calendarEvent: CalendarEvent) => {
								return calendarEvent.uid === newProgenitor.uid && calendarEvent.summary === newProgenitor.summary
							}),
							anything(),
							matchers.argThat((existingEvent: CalendarEvent) => {
								return existingEvent.uid === oldProgenitor.uid && existingEvent.summary === oldProgenitor.summary
							}),
						),
						{ times: 1 },
					)
					verify(calendarFacadeMock.replaceCalendarEvent(anything(), anything(), anything()), { times: 0 })
					verify(calendarFacadeMock.createCalendarEvents(anything(), anything()), { times: 0 })

					verify(deviceConfigMock.updateLastSync(calendarSubscriptionId), { times: 1 })
				})

				o.test("Sync update progenitor when content change and keep excluded dates from existing altered instance", async function () {
					const newProgenitor = makeCalendarEvent(
						calendarSubscriptionId,
						"event-series-uid@tuta.com",
						"Progenitor Event",
						timeZone,
					) as CalendarEventProgenitor
					newProgenitor.repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
						frequency: RepeatPeriod.DAILY,
						interval: "1",
						timeZone,
					})

					const existingAlteredInstance = makeCalendarEvent(
						calendarSubscriptionId,
						newProgenitor.uid,
						"Altered Instance",
						timeZone,
					) as CalendarEventAlteredInstance
					existingAlteredInstance.recurrenceId = DateTime.fromJSDate(newProgenitor.startTime, { zone: newProgenitor.repeatRule.timeZone })
						.plus({ day: 1 })
						.toJSDate()

					const oldProgenitor = createTestEntity(CalendarEventTypeRef, {
						...newProgenitor,
						summary: "Old Progenitor",
					}) as CalendarEventProgenitor
					oldProgenitor.repeatRule!.excludedDates = [createDateWrapper({ date: existingAlteredInstance.recurrenceId })]

					const eventSeriesIcs = serializeCalendar(
						"0",
						[
							{ event: newProgenitor, alarms: [] },
							{ event: existingAlteredInstance, alarms: [] },
						],
						now,
						timeZone,
					)

					setupCalendarSubscription(eventSeriesIcs, [existingAlteredInstance], [oldProgenitor])

					// Act
					await calendarModel.syncExternalCalendars([externalCalendarGroupSettings])

					// Assert
					verify(entityClientMock.erase(anything()), { times: 0 })
					verify(
						calendarFacadeMock.updateCalendarEvent(
							matchers.argThat((calendarEvent: CalendarEvent) => {
								return (
									calendarEvent.uid === newProgenitor.uid &&
									calendarEvent.summary === newProgenitor.summary &&
									deepEqual(calendarEvent.repeatRule?.excludedDates, oldProgenitor.repeatRule!.excludedDates)
								)
							}),
							anything(),
							matchers.argThat((existingEvent: CalendarEvent) => {
								return existingEvent.uid === oldProgenitor.uid && existingEvent.summary === oldProgenitor.summary
							}),
						),
						{ times: 1 },
					)
					// should not call update for altered instance because there is no change
					verify(
						calendarFacadeMock.updateCalendarEvent(
							anything(),
							anything(),
							matchers.argThat((existingEvent: CalendarEvent) => {
								return existingEvent.uid === existingAlteredInstance.uid && existingEvent.summary === existingAlteredInstance.summary
							}),
						),
						{ times: 0 },
					)
					verify(calendarFacadeMock.replaceCalendarEvent(anything(), anything(), anything()), { times: 0 })
					verify(calendarFacadeMock.createCalendarEvents(anything(), anything()), { times: 0 })

					verify(deviceConfigMock.updateLastSync(calendarSubscriptionId), { times: 1 })
				})

				o.test("Sync update progenitor with new altered instance, and keep excluded dates from existing altered instance", async function () {
					const newProgenitor = makeCalendarEvent(
						calendarSubscriptionId,
						"event-series-uid@tuta.com",
						"Progenitor Event",
						timeZone,
					) as CalendarEventProgenitor
					newProgenitor.repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
						frequency: RepeatPeriod.DAILY,
						interval: "1",
						timeZone,
					})

					const existingAlteredInstance = makeCalendarEvent(
						calendarSubscriptionId,
						newProgenitor.uid,
						"Altered Instance",
						timeZone,
					) as CalendarEventAlteredInstance
					existingAlteredInstance.recurrenceId = DateTime.fromJSDate(newProgenitor.startTime, { zone: newProgenitor.repeatRule.timeZone })
						.plus({ day: 1 })
						.toJSDate()

					const oldProgenitor = createTestEntity(CalendarEventTypeRef, {
						...newProgenitor,
						summary: "Old Progenitor",
					}) as CalendarEventProgenitor
					oldProgenitor.repeatRule!.excludedDates = [createDateWrapper({ date: existingAlteredInstance.recurrenceId })]

					const newAlteredInstance = makeCalendarEvent(
						calendarSubscriptionId,
						newProgenitor.uid,
						"New Altered Instance",
						timeZone,
					) as CalendarEventAlteredInstance
					newAlteredInstance.recurrenceId = DateTime.fromJSDate(newProgenitor.startTime, { zone: newProgenitor.repeatRule.timeZone })
						.plus({ day: 2 })
						.toJSDate()

					const eventSeriesIcs = serializeCalendar(
						"0",
						[
							{ event: newProgenitor, alarms: [] },
							{ event: existingAlteredInstance, alarms: [] },
							{ event: newAlteredInstance, alarms: [] },
						],
						now,
						timeZone,
					)

					setupCalendarSubscription(eventSeriesIcs, [existingAlteredInstance], [oldProgenitor])

					let eventsToCreate: Array<EventAlarmInfoTemplatesTuple> = []
					when(calendarFacadeMock.createCalendarEvents(anything(), anything())).thenDo(
						(eventAlarmInfoTemplatesTuples: Array<EventAlarmInfoTemplatesTuple>, operationId: OperationId) => {
							eventsToCreate = eventAlarmInfoTemplatesTuples
							const result: CreateCalendarEventsResult = makeCreateCalendarEventsResult({
								successfulEvents: eventAlarmInfoTemplatesTuples.map((tuple) => tuple.event),
							})
							return Promise.resolve(result)
						},
					)

					const expectedExcludedDates = [...oldProgenitor.repeatRule!.excludedDates, createDateWrapper({ date: newAlteredInstance.recurrenceId })]

					// Act
					await calendarModel.syncExternalCalendars([externalCalendarGroupSettings])

					// Assert
					verify(entityClientMock.erase(anything()), { times: 0 })
					verify(
						calendarFacadeMock.updateCalendarEvent(
							matchers.argThat((calendarEvent: CalendarEvent) => {
								return (
									calendarEvent.uid === newProgenitor.uid &&
									calendarEvent.summary === newProgenitor.summary &&
									deepEqual(calendarEvent.repeatRule?.excludedDates, expectedExcludedDates)
								)
							}),
							anything(),
							matchers.argThat((existingEvent: CalendarEvent) => {
								return existingEvent.uid === oldProgenitor.uid && existingEvent.summary === oldProgenitor.summary
							}),
						),
						{ times: 1 },
					)
					// should not call update for altered instance because there is no change
					verify(
						calendarFacadeMock.updateCalendarEvent(
							anything(),
							anything(),
							matchers.argThat((existingEvent: CalendarEvent) => {
								return existingEvent.uid === existingAlteredInstance.uid && existingEvent.summary === existingAlteredInstance.summary
							}),
						),
						{ times: 0 },
					)
					verify(calendarFacadeMock.replaceCalendarEvent(anything(), anything(), anything()), { times: 0 })

					o.check(eventsToCreate.length).equals(1)
					o.check(eventsToCreate[0].event.summary).equals(newAlteredInstance.summary)

					verify(deviceConfigMock.updateLastSync(calendarSubscriptionId), { times: 1 })
				})

				o.test("Sync keep excluded dates in progenitor when altered instances are removed", async function () {
					const progenitor = makeCalendarEvent(
						calendarSubscriptionId,
						"event-series-uid@tuta.com",
						"Progenitor Event",
						timeZone,
					) as CalendarEventProgenitor
					progenitor.repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
						frequency: RepeatPeriod.DAILY,
						interval: "1",
						timeZone,
					})

					const existingAlteredInstance = makeCalendarEvent(
						calendarSubscriptionId,
						progenitor.uid,
						"Altered Instance",
						timeZone,
					) as CalendarEventAlteredInstance
					existingAlteredInstance.recurrenceId = DateTime.fromJSDate(progenitor.startTime, { zone: progenitor.repeatRule.timeZone })
						.plus({ day: 1 })
						.toJSDate()

					progenitor.repeatRule!.excludedDates = [createDateWrapper({ date: existingAlteredInstance.recurrenceId })]

					const eventSeriesProgenitorIcs = serializeCalendar("0", [{ event: progenitor, alarms: [] }], now, timeZone)

					setupCalendarSubscription(eventSeriesProgenitorIcs, [existingAlteredInstance], [progenitor])

					await calendarModel.syncExternalCalendars([externalCalendarGroupSettings])

					// Assert
					verify(
						entityClientMock.erase(matchers.argThat((eventBeingDeleted: CalendarEvent) => deepEqual(eventBeingDeleted, existingAlteredInstance))),
						{ times: 1 },
					)
					verify(calendarFacadeMock.updateCalendarEvent(anything(), anything(), anything()), { times: 0 })
					verify(calendarFacadeMock.replaceCalendarEvent(anything(), anything(), anything()), { times: 0 })
					verify(calendarFacadeMock.createCalendarEvents(anything(), anything()), { times: 0 })

					verify(deviceConfigMock.updateLastSync(calendarSubscriptionId), { times: 1 })
				})

				o.test(
					"Sync remove excluded dates from progenitor when altered instances are removed and not in the excludedDates field from incoming progenitor",
					async function () {
						const progenitor = makeCalendarEvent(
							calendarSubscriptionId,
							"event-series-uid@tuta.com",
							"Progenitor Event",
							timeZone,
						) as CalendarEventProgenitor
						progenitor.repeatRule = createTestEntity(CalendarRepeatRuleTypeRef, {
							frequency: RepeatPeriod.DAILY,
							interval: "1",
							timeZone,
						})
						progenitor.repeatRule!.excludedDates = [createDateWrapper({ date: new Date(2026, 6, 29) })]

						const incomingProgenitor = createTestEntity(CalendarEventTypeRef, {
							...progenitor,
							summary: "Incoming Progenitor",
							repeatRule: createTestEntity(CalendarRepeatRuleTypeRef, {
								frequency: RepeatPeriod.DAILY,
								interval: "1",
								timeZone,
							}),
						}) as CalendarEventProgenitor
						const eventSeriesProgenitorIcs = serializeCalendar("0", [{ event: incomingProgenitor, alarms: [] }], now, timeZone)

						setupCalendarSubscription(eventSeriesProgenitorIcs, [], [progenitor])

						await calendarModel.syncExternalCalendars([externalCalendarGroupSettings])

						verify(
							calendarFacadeMock.updateCalendarEvent(
								matchers.argThat(
									(updatedProgenitor) => updatedProgenitor.uid === progenitor.uid && isEmpty(updatedProgenitor.repeatRule.excludedDates),
								),
								anything(),
								matchers.argThat((eventBeingUpdated) => deepEqual(eventBeingUpdated, progenitor)),
							),
							{ times: 1 },
						)

						verify(calendarFacadeMock.replaceCalendarEvent(anything(), anything(), anything()), { times: 0 })
						verify(calendarFacadeMock.createCalendarEvents(anything(), anything()), { times: 0 })

						verify(deviceConfigMock.updateLastSync(calendarSubscriptionId), { times: 1 })
					},
				)
			})
		})

		function makeCalendarEvent(calendarSubscriptionId: string, uid: string, summary: string, timeZone: string) {
			return createTestEntity(CalendarEventTypeRef, {
				_ownerGroup: calendarSubscriptionId,
				startTime: DateTime.fromObject({ year: 2026, month: 6, day: 1, hour: 9 }, { zone: timeZone }).toJSDate(),
				endTime: DateTime.fromObject(
					{
						year: 2026,
						month: 6,
						day: 1,
						hour: 9,
						minute: 30,
					},
					{ zone: timeZone },
				).toJSDate(),
				uid,
				summary,
			})
		}

		function setupCalendarSubscription(simpleCalendarSubscriptionIcs: string, shortEvents: CalendarEvent[], longEvents: CalendarEvent[]) {
			when(externalCalendarFacadeMock.fetchExternalCalendar(externalCalSourceUrl)).thenResolve(simpleCalendarSubscriptionIcs)
			when(entityClientMock.loadAll(CalendarEventTypeRef, externalCalendarGroupRoot.shortEvents)).thenResolve(shortEvents)
			when(entityClientMock.loadAll(CalendarEventTypeRef, externalCalendarGroupRoot.longEvents)).thenResolve(longEvents)
		}

		function makeCreateCalendarEventsResult(data: Partial<CreateCalendarEventsResult>) {
			return {
				successfulEvents: data.successfulEvents ?? [],
				failedEvents: data.failedEvents ?? [],
				failedEventErrors: data.failedEventErrors ?? [],
				failedAlarms: data.failedAlarms ?? [],
				failedAlarmErrors: data.failedAlarmErrors ?? [],
			}
		}
	})
})
