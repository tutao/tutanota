import o from "@tutao/otest"
import {
	CalendarEvent,
	CalendarEventAttendeeTypeRef,
	CalendarEventTypeRef,
	CalendarGroupRoot,
	CalendarGroupRootTypeRef,
	Contact,
	ContactMailAddressTypeRef,
	ContactTypeRef,
	EncryptedMailAddressTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { clone, getFirstOrThrow, neverNull, Require } from "@tutao/tutanota-utils"
import { CalendarModel } from "../../../src/calendar-app/calendar/model/CalendarModel.js"
import { CalendarAttendeeStatus, CalendarMethod, GroupType, RepeatPeriod } from "../../../src/common/api/common/TutanotaConstants.js"
import { EventController } from "../../../src/common/api/main/EventController.js"
import { Notifications } from "../../../src/common/gui/Notifications.js"
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
} from "../../../src/common/api/entities/sys/TypeRefs.js"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { ProgressTracker } from "../../../src/common/api/main/ProgressTracker.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import {
	CachingMode,
	CalendarEventAlteredInstance,
	CalendarEventProgenitor,
	CalendarEventUidIndexEntry,
	CalendarFacade,
} from "../../../src/common/api/worker/facades/lazy/CalendarFacade.js"
import { verify } from "@tutao/tutanota-test-utils"
import { FileController } from "../../../src/common/file/FileController.js"
import { createTestEntity } from "../TestUtils.js"
import { IProgressMonitor } from "../../../src/common/api/common/utils/ProgressMonitor.js"
import { EntityUpdateData } from "../../../src/common/api/common/utils/EntityUpdateUtils.js"
import { MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { ExternalCalendarFacade } from "../../../src/common/native/common/generatedipc/ExternalCalendarFacade.js"
import { DeviceConfig } from "../../../src/common/misc/DeviceConfig.js"
import { SyncTracker } from "../../../src/common/api/main/SyncTracker.js"
import { LanguageViewModel } from "../../../src/common/misc/LanguageViewModel.js"
import { NativePushServiceApp } from "../../../src/common/native/main/NativePushServiceApp"
import { AlarmScheduler } from "../../../src/common/calendar/date/AlarmScheduler"
import { IServiceExecutor } from "../../../src/common/api/common/ServiceRequest"
import { elementIdPart, getListId, listIdPart } from "../../../src/common/api/common/utils/EntityUtils"
import { DateTime } from "luxon"
import { DoubledObject, matchers, object, when } from "testdouble"
import { ContactModel } from "../../../src/common/contactsFunctionality/ContactModel"
import { IcsCalendarEvent, ParsedCalendarData, ParsedEvent } from "../../../src/common/calendar/gui/ImportExportUtils"

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
	let baseExistingProgenitor: CalendarEvent
	let baseCalendarEventUidIndexEntry: CalendarEventUidIndexEntry

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

		userControllerMock.getCalendarMemberships = () => {
			return [calendarGroupMembership]
		}

		const progressMonitorMock = object<IProgressMonitor>()
		when(progressTrackerMock.getMonitor(anything())).thenReturn(progressMonitorMock)

		calendarGroupMembership = createTestEntity(GroupMembershipTypeRef, {
			group: "calendar-group-id",
			groupType: GroupType.Calendar,
			groupInfo: ["group-info-listId", "calendar-group-info-id"],
		})
		// when(userControllerMock.getCalendarMemberships()).thenReturn([calendarGroupMembership])

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
			contactModelMock,
			"Europe/Berlin",
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

	const noPatchesAndInstance: Pick<EntityUpdateData, "instance" | "patches"> = {
		instance: null,
		patches: null,
	}

	o.spec("processCalendarData - CalendarMethod.REPLY", function () {
		let baseParsedCalendarData: ParsedCalendarData
		let baseParsedEventReply: ParsedEvent

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

			await calendarModel.processParsedCalendarDataFromIcs(UNKNOWN_SENDER, baseParsedCalendarData)
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

			await calendarModel.processParsedCalendarDataFromIcs(GUEST, baseParsedCalendarData)

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
		})

		o.spec("Pending events", function () {
			o("New REQUEST invite saves new event to db and sets pendingInvitation true according to guest status", async function () {
				// Arrange

				// Act
				await calendarModel.processParsedCalendarDataFromIcs(ORGANIZER, baseInvitation)

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
				await calendarModel.processParsedCalendarDataFromIcs(ORGANIZER, baseInvitation)

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
				await calendarModel.processParsedCalendarDataFromIcs(ORGANIZER, baseInvitation)

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
				const eventByUid: CalendarEventUidIndexEntry = object()
				baseExistingProgenitor.pendingInvitation = false
				eventByUid.progenitor = baseExistingProgenitor as CalendarEventProgenitor
				eventByUid.alteredInstances = []

				when(calendarFacadeMock.getEventsByUid(anything(), anything(), anything())).thenResolve(eventByUid)

				// Act
				await calendarModel.processParsedCalendarDataFromIcs(ORGANIZER, baseInvitation)

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
				"new altered instances with guest status NEEDS_ACTION SHOULD be a pendingInvitation even if progenitor invitation has been accepted, and progenitor should keep its pendingInvitation status",
				async function () {
					// Arrange
					baseExistingProgenitor.repeatRule = createTestEntity(RepeatRuleTypeRef, {
						frequency: RepeatPeriod.DAILY,
						interval: "1",
					})
					baseExistingProgenitor.pendingInvitation = false

					when(calendarFacadeMock.getEventsByUid(neverNull(baseExistingProgenitor.uid), CachingMode.Bypass, anything())).thenResolve(
						baseCalendarEventUidIndexEntry,
					)

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
					await calendarModel.processParsedCalendarDataFromIcs(ORGANIZER, alteredInstanceInvitation)

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
				const eventByUid: CalendarEventUidIndexEntry = object()
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

				await calendarModel.processParsedCalendarDataFromIcs(ORGANIZER, {
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

			const eventByUid: CalendarEventUidIndexEntry = object()
			eventByUid.progenitor = baseExistingProgenitor as CalendarEventProgenitor

			when(calendarFacadeMock.getEventsByUid(anything(), anything(), anything())).thenResolve(eventByUid)

			const expectedNewEvent = clone(baseExistingProgenitor)
			expectedNewEvent.startTime = icsEvent.startTime
			expectedNewEvent.summary = icsEvent.summary
			expectedNewEvent.sequence = icsEvent.sequence

			when(entityClientMock.load<CalendarEvent>(CalendarEventTypeRef, anything())).thenResolve(expectedNewEvent)
			// Act
			await calendarModel.processParsedCalendarDataFromIcs(ORGANIZER, {
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
		let baseParsedEvent: ParsedEvent

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
			when(calendarFacadeMock.getEventsByUid(uid, anything(), anything())).thenResolve(baseCalendarEventUidIndexEntry)

			await calendarModel.processParsedCalendarDataFromIcs(ORGANIZER, baseParsedCalendarDataCancel)

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

			await calendarModel.processParsedCalendarDataFromIcs(ORGANIZER, baseParsedCalendarDataCancel)

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

				await calendarModel.processParsedCalendarDataFromIcs(ORGANIZER, baseParsedCalendarDataCancel)

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

			await calendarModel.processParsedCalendarDataFromIcs(UNKNOWN_SENDER, baseParsedCalendarDataCancel)
			verify(entityClientMock.erase(anything()), { times: 0 })

			await calendarModel.processParsedCalendarDataFromIcs(GUEST, baseParsedCalendarDataCancel)
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
			}
		})

		o("If user has never replied or interacted with this calendarEvent, the CalendarEventUpdates should be ignored", async function () {
			when(calendarFacadeMock.getEventsByUid(anything(), anything(), anything())).thenResolve(null)

			await calendarModel.processParsedCalendarDataFromIcs(UNKNOWN_SENDER, {
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

			await calendarModel.processParsedCalendarDataFromIcs(ORGANIZER, {
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
})
