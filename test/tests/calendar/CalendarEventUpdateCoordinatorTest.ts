import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { CalendarEventUpdateCoordinator } from "../../../src/calendar-app/calendar/model/CalendarEventUpdateCoordinator"
import { CalendarModel, NoOwnerEncSessionKeyForCalendarEventError } from "../../../src/calendar-app/calendar/model/CalendarModel"
import { WebsocketConnectivityModel } from "../../../src/common/misc/WebsocketConnectivityModel"
import { EventController } from "../../../src/common/api/main/EventController"
import { EntityClient } from "../../../src/common/api/common/EntityClient"
import { EntityUpdateData } from "../../../src/common/api/common/utils/EntityUpdateUtils"
import { CalendarEventUpdate, CalendarEventUpdateTypeRef, FileTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs"
import { OperationType } from "../../../src/common/api/common/TutanotaConstants"
import { elementIdPart, listIdPart } from "../../../src/common/api/common/utils/EntityUtils"
import { MailboxDetail, MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel"
import { createTestEntity } from "../TestUtils"
import { defer } from "@tutao/tutanota-utils"
import { SyncTracker } from "../../../src/common/api/main/SyncTracker"

o.spec("CalendarEventUpdateCoordinatorTest", function () {
	const MAILGROUP_ID = "mail-group"

	let calendarEventUpdateCoordinator: CalendarEventUpdateCoordinator
	let calendarModelMock: CalendarModel
	let wsConnectivityModelMock: WebsocketConnectivityModel
	let eventControllerMock: EventController
	let entityClientMock: EntityClient

	let entityUpdateData: EntityUpdateData
	let calendarEventUpdate: CalendarEventUpdate
	let mailboxModel: MailboxModel
	let mailboxDetailMock: MailboxDetail

	const syncTrackMock: SyncTracker = object()
	const deferredWaitSync = defer()
	when(syncTrackMock.waitSync()).thenDo(() => deferredWaitSync.promise)

	o.beforeEach(function () {
		calendarModelMock = object()
		wsConnectivityModelMock = object()
		eventControllerMock = object()
		entityClientMock = object()
		mailboxModel = object()
		mailboxDetailMock = object()
		calendarEventUpdateCoordinator = new CalendarEventUpdateCoordinator(
			wsConnectivityModelMock,
			calendarModelMock,
			eventControllerMock,
			entityClientMock,
			mailboxModel,
			syncTrackMock,
		)

		entityUpdateData = object()
		calendarEventUpdate = object()
		calendarEventUpdate._id = ["listId", "elementId"]
		calendarEventUpdate.file = ["fileListId", "fileId"]

		entityUpdateData.operation = OperationType.CREATE
		entityUpdateData.typeRef = CalendarEventUpdateTypeRef
		// @ts-ignore
		entityUpdateData.instanceListId = listIdPart(calendarEventUpdate._id)
		entityUpdateData.instanceId = elementIdPart(calendarEventUpdate._id)

		mailboxDetailMock.mailboxGroupRoot = object()
		when(mailboxModel.getUserMailboxDetails()).thenResolve(mailboxDetailMock)
	})

	o("process entity events as leader client -- happy path", async function () {
		when(wsConnectivityModelMock.isLeader()).thenReturn(true)
		when(entityClientMock.load(CalendarEventUpdateTypeRef, calendarEventUpdate._id)).thenResolve(calendarEventUpdate)

		await calendarEventUpdateCoordinator.entityEventsReceived([entityUpdateData], MAILGROUP_ID)
		verify(calendarModelMock.handleCalendarEventUpdate(calendarEventUpdate))
	})

	o("becoming leader client processes existing entity events and then attaches the CalendarEventUpdate listener", async function () {
		const mockCalendarEventUpdateArray = [createTestEntity(CalendarEventUpdateTypeRef, {})]
		when(wsConnectivityModelMock.isLeader()).thenReturn(true)
		when(entityClientMock.loadAll(CalendarEventUpdateTypeRef, matchers.anything())).thenResolve(mockCalendarEventUpdateArray)

		await calendarEventUpdateCoordinator.onLeaderStatusChanged(true)

		verify(eventControllerMock.addEntityListener(matchers.anything()), { times: 1 })
		verify(calendarModelMock.handleCalendarEventUpdate(mockCalendarEventUpdateArray[0]))
	})

	o("becoming follower client removes the CalendarEventUpdate listener", async function () {
		when(entityClientMock.loadAll(CalendarEventUpdateTypeRef, matchers.anything())).thenResolve([calendarEventUpdate])

		await calendarEventUpdateCoordinator.onLeaderStatusChanged(false)

		verify(eventControllerMock.removeEntityListener(matchers.anything()), { times: 1 })
		verify(calendarModelMock.handleCalendarEventUpdate(matchers.anything()), { times: 0 })
	})

	o("init() as leader processes existing entity events before attaching the listener", async function () {
		deferredWaitSync.resolve(undefined)
		const mockCalendarEventUpdateArray = [createTestEntity(CalendarEventUpdateTypeRef, {})]
		when(wsConnectivityModelMock.isLeader()).thenReturn(true)
		when(entityClientMock.loadAll(CalendarEventUpdateTypeRef, matchers.anything())).thenResolve(mockCalendarEventUpdateArray)

		await calendarEventUpdateCoordinator.init()

		verify(wsConnectivityModelMock.addLeaderStatusListener(matchers.anything()), { times: 1 })
		verify(eventControllerMock.addEntityListener(matchers.anything()))
		verify(calendarModelMock.handleCalendarEventUpdate(mockCalendarEventUpdateArray[0]))
	})

	o("init as non leader does not register event listeners, and does not process existing calendar event updates", async function () {
		deferredWaitSync.resolve(undefined)
		const mockCalendarEventUpdateArray = [createTestEntity(CalendarEventUpdateTypeRef, {})]
		when(wsConnectivityModelMock.isLeader()).thenReturn(false)
		when(entityClientMock.loadAll(CalendarEventUpdateTypeRef, matchers.anything())).thenResolve(mockCalendarEventUpdateArray)

		await calendarEventUpdateCoordinator.init()

		verify(wsConnectivityModelMock.addLeaderStatusListener(matchers.anything()), { times: 1 })
		verify(eventControllerMock.addEntityListener(matchers.anything()), { times: 0 })
		verify(calendarModelMock.handleCalendarEventUpdate(mockCalendarEventUpdateArray[0]), { times: 0 })
	})

	// this is an integration test because it results in real calls to CalendarImporter.parseCalendarFile
	o("safe calendar events updates when the session key of the file cannot be resolved", async function () {
		when(wsConnectivityModelMock.isLeader()).thenReturn(true)
		when(calendarModelMock.handleCalendarEventUpdate(matchers.anything())).thenReject(new NoOwnerEncSessionKeyForCalendarEventError("test"))

		when(wsConnectivityModelMock.isLeader()).thenReturn(true)
		when(entityClientMock.load(CalendarEventUpdateTypeRef, calendarEventUpdate._id)).thenResolve(calendarEventUpdate)

		await calendarEventUpdateCoordinator.entityEventsReceived([entityUpdateData], MAILGROUP_ID)
		verify(calendarModelMock.handleCalendarEventUpdate(calendarEventUpdate))

		o(calendarEventUpdateCoordinator.getFileIdToSkippedCalendarEventUpdates().get(elementIdPart(calendarEventUpdate.file))!).deepEquals(calendarEventUpdate)
	})

	o("process calendar events when ownerEncSessionKey for a File is available", async function () {
		when(wsConnectivityModelMock.isLeader()).thenReturn(true)
		calendarEventUpdateCoordinator.getFileIdToSkippedCalendarEventUpdates().set(elementIdPart(calendarEventUpdate.file), calendarEventUpdate)

		entityUpdateData.typeRef = FileTypeRef
		// @ts-ignore
		entityUpdateData.instanceListId = listIdPart(calendarEventUpdate.file)
		entityUpdateData.instanceId = elementIdPart(calendarEventUpdate.file)
		entityUpdateData.operation = OperationType.UPDATE

		await calendarEventUpdateCoordinator.entityEventsReceived([entityUpdateData], MAILGROUP_ID)

		o(calendarEventUpdateCoordinator.getFileIdToSkippedCalendarEventUpdates().size).deepEquals(0)
		verify(calendarModelMock.handleCalendarEventUpdate(calendarEventUpdate))
	})
})
