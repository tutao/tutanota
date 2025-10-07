import {
	$Promisable,
	assertNotNull,
	clone,
	debounce,
	deepEqual,
	findAndRemove,
	getStartOfDay,
	groupByAndMapUniquely,
	identity,
	incrementDate,
	last,
	lazy,
	memoized,
} from "@tutao/tutanota-utils"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, GroupSettings } from "../../../common/api/entities/tutanota/TypeRefs.js"
import {
	EndType,
	EXTERNAL_CALENDAR_SYNC_INTERVAL,
	getWeekStart,
	GroupType,
	NewPaidPlans,
	OperationType,
	WeekStart,
} from "../../../common/api/common/TutanotaConstants"
import { NotAuthorizedError, NotFoundError } from "../../../common/api/common/error/RestError"
import { getElementId, getListId, isSameId, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import { LoginController } from "../../../common/api/main/LoginController"
import { IProgressMonitor } from "../../../common/api/common/utils/ProgressMonitor"
import { CustomerInfoTypeRef, GroupInfo, ReceivedGroupInvitation } from "../../../common/api/entities/sys/TypeRefs.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {
	addDaysForRecurringEvent,
	CalendarTimeRange,
	CalendarType,
	extractContactIdFromEvent,
	getDiffIn60mIntervals,
	getMonthRange,
	getStartOfDayWithZone,
	isBirthdayCalendar,
	isEventBetweenDays,
} from "../../../common/calendar/date/CalendarUtils"
import { isAllDayEvent } from "../../../common/api/common/utils/CommonCalendarUtils"
import { CalendarEventModel, CalendarOperation, EventSaveResult, EventType, getNonOrganizerAttendees } from "../gui/eventeditor-model/CalendarEventModel.js"
import { askIfShouldSendCalendarUpdatesToAttendees, getEventType, shouldDisplayEvent } from "../gui/CalendarGuiUtils.js"
import { ReceivedGroupInvitationsModel } from "../../../common/sharing/model/ReceivedGroupInvitationsModel"
import type { CalendarInfo, CalendarInfoBase, CalendarModel } from "../model/CalendarModel"
import { EventController } from "../../../common/api/main/EventController"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { ProgressTracker } from "../../../common/api/main/ProgressTracker"
import { deviceConfig, DeviceConfig } from "../../../common/misc/DeviceConfig"
import type { EventDragHandlerCallbacks } from "./EventDragHandler"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { Time } from "../../../common/calendar/date/Time.js"
import { CalendarEventsRepository, DaysToEvents } from "../../../common/calendar/date/CalendarEventsRepository.js"
import { CalendarEventPreviewViewModel } from "../gui/eventpopup/CalendarEventPreviewViewModel.js"
import { EntityUpdateData, isUpdateFor, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { getEnabledMailAddressesWithUser } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { ContactModel } from "../../../common/contactsFunctionality/ContactModel.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { CalendarContactPreviewViewModel } from "../gui/eventpopup/CalendarContactPreviewViewModel.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import { SearchToken } from "../../../common/api/common/utils/QueryTokenUtils"
import { GroupNameData, GroupSettingsModel } from "../../../common/sharing/model/GroupSettingsModel"
import { EventEditorDialog } from "../gui/eventeditor-view/CalendarEventEditDialog.js"
import { showPlanUpgradeRequiredDialog } from "../../../common/misc/SubscriptionDialogs"
import { formatDate, formatTime } from "../../../common/misc/Formatter"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { SyncStatus } from "../../../common/calendar/gui/ImportExportUtils"
import { CalendarSidebarRowIconData } from "../gui/CalendarSidebarRow"

export type EventRenderWrapper = {
	event: CalendarEvent
	isGhost: boolean
}

export type EventsOnDays = {
	days: Array<Date>
	shortEventsPerDay: Array<Array<EventRenderWrapper>>
	longEvents: Array<EventRenderWrapper>
}

/** container to for the information needed to render & handle a reschedule with drag-and-drop */
export type DraggedEvent = {
	/** the event instance the user grabbed with the mouse */
	originalEvent: CalendarEvent
	/** the temporary event that's shown during the drag */
	eventClone: CalendarEvent
}

export type MouseOrPointerEvent = MouseEvent | PointerEvent
export type CalendarEventBubbleClickHandler = (arg0: CalendarEvent, arg1: MouseOrPointerEvent) => unknown
export type CalendarEventBubbleKeyDownHandler = (arg0: CalendarEvent, arg1: KeyboardEvent) => unknown
export type CalendarEventEditModelsFactory = (mode: CalendarOperation, event: CalendarEvent) => Promise<CalendarEventModel | null>

export type CalendarEventPreviewModelFactory = (
	selectedEvent: CalendarEvent,
	calendars: ReadonlyMap<string, CalendarInfo>,
	highlightedTokens: readonly SearchToken[],
) => Promise<CalendarEventPreviewViewModel>
export type CalendarContactPreviewModelFactory = (event: CalendarEvent, contact: Contact, canEdit: boolean) => Promise<CalendarContactPreviewViewModel>
export type CalendarPreviewModels = CalendarEventPreviewViewModel | CalendarContactPreviewViewModel

export class CalendarViewModel implements EventDragHandlerCallbacks {
	// Should not be changed directly but only through the URL
	readonly selectedDate: Stream<Date> = stream(getStartOfDay(new Date()))

	/**
	 * An event currently being displayed (non-modally)
	 * the {@code model} is {@code null} until it is loaded.
	 *
	 * We keep track of event separately to avoid races with selecting multiple events shortly one after another.
	 */
	private previewedEvent: Stream<{ event: CalendarEvent; model: CalendarPreviewModels | null } | null> = stream(null)
	private previewedEventId: IdTuple | null = null

	private _hiddenCalendars: Set<Id>
	/** Events that have been dropped but still need to be rendered as temporary while waiting for entity updates. */
	// visible for tests
	readonly _transientEvents: Array<EventRenderWrapper>
	// visible for tests
	_draggedEvent: DraggedEvent | null = null
	private readonly _redrawStream: Stream<void> = stream()
	selectedTime: Time | undefined
	// When set to true, ignores the next setting of selectedTime
	ignoreNextValidTimeSelection: boolean

	private scrollPosition: number = 0 // size.calendar_hour_height * DEFAULT_HOUR_OF_DAY
	// The maximum scroll value of the list in the view
	private scrollMax: number | null = null
	// The size of the list in the view
	private viewSize: number | null = null

	private _isNewPaidPlan: boolean = false
	isCreatingExternalCalendar: boolean = false

	private cancelSignal: Stream<boolean> = stream(false)

	private calendarColorsMap: (availableCalendars: ReadonlyArray<CalendarInfoBase>) => Map<Id, string>

	constructor(
		private readonly logins: LoginController,
		private readonly createCalendarEventEditModel: CalendarEventEditModelsFactory,
		private readonly createCalendarEventPreviewModel: CalendarEventPreviewModelFactory,
		private readonly createCalendarContactPreviewModel: CalendarContactPreviewModelFactory,
		private readonly calendarModel: CalendarModel,
		private readonly eventsRepository: CalendarEventsRepository,
		private readonly entityClient: EntityClient,
		eventController: EventController,
		private readonly progressTracker: ProgressTracker,
		private readonly deviceConfig: DeviceConfig,
		private readonly calendarInvitationsModel: ReceivedGroupInvitationsModel<GroupType.Calendar>,
		private readonly timeZone: string,
		private readonly mailboxModel: MailboxModel,
		private readonly contactModel: ContactModel,
		private readonly groupSettingsModel: lazy<Promise<GroupSettingsModel>>,
	) {
		this.calendarColorsMap = memoized((availableCalendars: ReadonlyArray<CalendarInfoBase>) => {
			const calendarColors = new Map()
			for (let calendarInfo of availableCalendars) {
				calendarColors.set(calendarInfo.id, calendarInfo.color)
			}
			return calendarColors
		})

		this._transientEvents = []

		const userId = logins.getUserController().user._id
		const today = new Date()

		this._hiddenCalendars = new Set(this.deviceConfig.getHiddenCalendars(userId))

		this.selectedDate.map(() => {
			this._sendCancelSignal()
			this.updatePreviewedEvent(null)
			this.preloadMonthsAroundSelectedDate()
		})
		this.selectedTime = Time.fromDate(today)
		this.ignoreNextValidTimeSelection = false
		this.calendarModel.getCalendarInfosStream().map((newInfos) => {
			this._sendCancelSignal()
			const event = this.previewedEvent()?.event ?? null
			if (event != null) {
				// redraw if we lost access to the events' list
				const groupRoots = Array.from(newInfos.values()).map((i) => i.groupRoot)
				const lists = [...groupRoots.map((g) => g.longEvents), ...groupRoots.map((g) => g.shortEvents)]
				const previewListId = getListId(event)
				if (!lists.some((id) => isSameId(previewListId, id))) {
					this.updatePreviewedEvent(null)
				}
			}
			this.preloadMonthsAroundSelectedDate()
		})

		eventController.addEntityListener((updates) => this.entityEventReceived(updates))

		calendarInvitationsModel.init()

		this.eventsRepository.getEventsForMonths().map(() => {
			this.doRedraw()
		})

		// disable birthday calendars by default if the user is not on a new paid plan.
		logins
			.getUserController()
			.isNewPaidPlan()
			.then((isNewPaidPlan) => {
				this._isNewPaidPlan = isNewPaidPlan
				if (!isNewPaidPlan && !this.hiddenCalendars.has(this.calendarModel.getBirthdayCalendarInfo().id)) {
					const hidden = new Set(this._hiddenCalendars)
					hidden.add(this.calendarModel.getBirthdayCalendarInfo().id)
					this.setHiddenCalendars(hidden)
				}
			})
	}

	private _sendCancelSignal() {
		this.cancelSignal(true)
		this.cancelSignal.end(true)
		this.cancelSignal = stream(false)
	}

	setPreviewedEventId(id: IdTuple | null) {
		this.previewedEventId = id

		if (id == null) {
			return this.updatePreviewedEvent(null)
		}

		const date = this.selectedDate().getTime()
		const event = this.eventsForDays.get(date)?.find((ev) => isSameId(ev.event._id, id))

		if (event) {
			return this.updatePreviewedEvent(event.event) // FIXME ...
		}

		return Promise.resolve()
	}

	isDaySelectorExpanded(): boolean {
		return this.deviceConfig.isCalendarDaySelectorExpanded()
	}

	setDaySelectorExpanded(expanded: boolean) {
		this.deviceConfig.setCalendarDaySelectorExpanded(expanded)
	}

	get calendarColors() {
		const availableCalendars = this.calendarModel.getAvailableCalendars(true)
		return this.calendarColorsMap(availableCalendars)
	}

	async getCalendarNameData(groupInfo: GroupInfo): Promise<GroupNameData> {
		const groupSettingModel = await this.groupSettingsModel()
		return groupSettingModel.getGroupNameData(groupInfo)
	}

	async setCalendarGroupInfoName(groupInfo: GroupInfo, name: string): Promise<void> {
		const groupSettingModel = await this.groupSettingsModel()
		groupSettingModel.updateGroupInfoName(groupInfo, name)
	}

	async setCalendarGroupSettings(groupInfo: GroupInfo, groupSettings: Partial<GroupSettings>): Promise<void> {
		const groupSettingModel = await this.groupSettingsModel()
		groupSettingModel.updateGroupSettings(groupInfo, groupSettings)
	}

	/**
	 * react to changes to the calendar data by making sure we have the current month + the two adjacent months
	 * ready to be rendered
	 */
	private preloadMonthsAroundSelectedDate = debounce(200, async () => {
		// load all calendars. if there is no calendar yet, create one
		// for each calendar we load short events for three months +3
		const workPerCalendar = 3
		const totalWork = this.logins.getUserController().getCalendarMemberships().length * workPerCalendar
		const monitorHandle = this.progressTracker.registerMonitorSync(totalWork)
		const progressMonitor: IProgressMonitor = assertNotNull(this.progressTracker.getMonitor(monitorHandle))

		const newSelectedDate = this.selectedDate()
		const thisMonthStart = getMonthRange(newSelectedDate, this.timeZone).start
		const previousMonthDate = new Date(thisMonthStart)
		previousMonthDate.setMonth(new Date(thisMonthStart).getMonth() - 1)
		const nextMonthDate = new Date(thisMonthStart)
		nextMonthDate.setMonth(new Date(thisMonthStart).getMonth() + 1)

		try {
			const hasNewPaidPlan = await this.eventsRepository.canLoadBirthdaysCalendar()
			if (hasNewPaidPlan) {
				await this.eventsRepository.loadContactsBirthdays()
			}
			await this.loadMonthsIfNeeded([new Date(thisMonthStart), nextMonthDate, previousMonthDate], progressMonitor, this.cancelSignal)
		} finally {
			progressMonitor.completed()
			this.doRedraw()

			if (this.previewedEventId != null) {
				const date = this.selectedDate().getTime()
				const event = this.eventsForDays.get(date)?.find((ev) => isSameId(ev.event._id, this.previewedEventId))

				if (event) {
					this.updatePreviewedEvent(event.event) // FIXME do i have to say?
				}
			}
		}
	})

	get calendarInvitations(): Stream<Array<ReceivedGroupInvitation>> {
		return this.calendarInvitationsModel.invitations
	}

	get calendarInfos(): ReadonlyMap<Id, CalendarInfo> {
		return this.calendarModel.getCalendarInfosStream()()
	}

	get hiddenCalendars(): ReadonlySet<Id> {
		return this._hiddenCalendars
	}

	get eventsForDays(): DaysToEvents {
		return this.eventsRepository.getEventsForMonths()()
	}

	get redraw(): Stream<void> {
		return this._redrawStream
	}

	get weekStart(): WeekStart {
		return getWeekStart(this.logins.getUserController().userSettingsGroupRoot)
	}

	// visibleForTesting
	allowDrag(event: CalendarEvent): boolean {
		return this.canFullyEditEvent(event)
	}

	/**
	 * Partially mirrors the logic from CalendarEventModel.prototype.isFullyWritable() to determine
	 * if the user can edit more than just alarms for a given event
	 */
	private canFullyEditEvent(event: CalendarEvent): boolean {
		const userController = this.logins.getUserController()
		const userMailGroup = userController.getUserMailGroupMembership().group
		const mailboxDetailsArray = this.mailboxModel.mailboxDetails()
		const mailboxDetails = assertNotNull(mailboxDetailsArray.find((md) => md.mailGroup._id === userMailGroup))
		const ownMailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, userController.userGroupInfo)
		const eventType = getEventType(event, this.calendarInfos, ownMailAddresses, userController)
		return eventType === EventType.OWN || eventType === EventType.SHARED_RW
	}

	onDragStart(originalEvent: CalendarEvent, timeToMoveBy: number) {
		if (this.allowDrag(originalEvent)) {
			let eventClone = clone(originalEvent)
			updateTemporaryEventWithDiff(eventClone, originalEvent, timeToMoveBy)
			this._draggedEvent = {
				originalEvent,
				eventClone,
			}
		}
	}

	onDragUpdate(timeToMoveBy: number) {
		if (this._draggedEvent) {
			updateTemporaryEventWithDiff(this._draggedEvent.eventClone, this._draggedEvent.originalEvent, timeToMoveBy)
		}
	}

	/**
	 * This is called when the event is dropped.
	 */
	async onDragEnd(timeToMoveBy: number, mode: CalendarOperation | null): Promise<void> {
		//if the time of the dragged event is the same as of the original we only cancel the drag
		if (timeToMoveBy !== 0 && mode != null) {
			if (this._draggedEvent == null) return

			const { originalEvent, eventClone } = this._draggedEvent

			if (originalEvent.repeatRule != null && originalEvent.repeatRule.advancedRules.length > 0) {
				this._draggedEvent = null
				return Dialog.message("dragAndDropNotAllowedForAdvancedRecurrences_msg")
			}

			this._draggedEvent = null
			updateTemporaryEventWithDiff(eventClone, originalEvent, timeToMoveBy)

			this._addTransientEvent(eventClone)
			try {
				let didUpdate: EventSaveResult = EventSaveResult.Saved

				if (mode === CalendarOperation.StopSeriesAtDate) {
					didUpdate = await this.moveThisAndFuture(originalEvent, timeToMoveBy)

					// The event id will be different, so we must remove manually
					this._removeTransientEvent(eventClone)
				} else if (mode === CalendarOperation.Create) {
					await this.duplicateEvent(originalEvent, timeToMoveBy)
					this._removeTransientEvent(eventClone)
				} else {
					didUpdate = await this.moveEvent(originalEvent, timeToMoveBy, mode)
				}

				if (didUpdate !== EventSaveResult.Saved && mode !== CalendarOperation.StopSeriesAtDate) {
					this._removeTransientEvent(eventClone)
				}
			} catch (e) {
				this._removeTransientEvent(eventClone)

				throw e
			}
		} else {
			this._draggedEvent = null
		}
	}

	async duplicateEvent(event: CalendarEvent, timeToMoveBy: number) {
		const editModel = await this.createCalendarEventEditModel(CalendarOperation.Create, event)
		if (!editModel) {
			throw new Error("Failed to instantiate")
		}

		editModel.editModels.summary.content = lang.get("copyOf_title", {
			"{title}": editModel.editModels.summary.content,
		})
		editModel.editModels.whenModel.rescheduleEvent({ millisecond: timeToMoveBy })
		editModel.editModels.whenModel.deleteExcludedDates()
		editModel.editModels.whoModel.resetGuestsStatus()

		const dialog = new EventEditorDialog()
		return await dialog.showNewCalendarEventEditDialog(editModel)
	}

	onDragCancel() {
		this._draggedEvent = null
	}

	get temporaryEvents(): Array<EventRenderWrapper> {
		return this._transientEvents.concat(
			this._draggedEvent
				? [
						{
							event: this._draggedEvent.eventClone,
							isGhost: false,
						},
					]
				: [],
		)
	}

	setHiddenCalendars(newHiddenCalendars: Set<Id>) {
		this._hiddenCalendars = newHiddenCalendars

		this.deviceConfig.setHiddenCalendars(this.logins.getUserController().user._id, [...newHiddenCalendars])
	}

	setSelectedTime(time: Time | undefined) {
		// only ignore an actual time, setting to undefined is fine
		if (time != null && this.ignoreNextValidTimeSelection) {
			this.ignoreNextValidTimeSelection = false
		} else {
			this.selectedTime = time
		}
	}

	/**
	 * Given an event and days, return the long and short events of that range of days
	 * we detect events that should be removed based on their UID + start and end time
	 *
	 * @param days The range of days from which events should be returned
	 * @returns    shortEvents: Array<Array<CalendarEvent>>, short events per day
	 *             longEvents: Array<CalendarEvent>: long events over the whole range,
	 *             days: Array<Date>: the original days that were passed in
	 */
	getEventsOnDaysToRender(days: Array<Date>): EventsOnDays {
		// addDaysForRecurringEvents produces some weeks that have non-referentially-identical objects for the same event instance (occurrence)
		// in particular, this happens for the weeks straddling a month border because each month adds a different clone of the occurrence to its part of the week
		// this means we can't use a set to deduplicate these.

		/** A map from event id and start time to the event instance. It is not enough to just use an id because different occurrences will have the same id. */
		const longEvents: Map<string, EventRenderWrapper> = new Map()
		let shortEvents: Array<Array<EventRenderWrapper>> = []
		// It might be the case that a UID is shared by events across calendars, so we need to differentiate them by list ID aswell
		const transientEventUidsByCalendar = groupByAndMapUniquely(
			this._transientEvents,
			(event) => getListId(event.event),
			(event) => event.event.uid,
		)

		const sortEvent = (event: EventRenderWrapper, shortEventsForDay: Array<EventRenderWrapper>) => {
			if (isAllDayEvent(event.event) || getDiffIn60mIntervals(event.event.startTime, event.event.endTime) >= 24) {
				longEvents.set(getElementId(event.event) + event.event.startTime.toString(), event)
			} else {
				shortEventsForDay.push(event) // FIXME Get rid of event.event
			}
		}

		for (const day of days) {
			const shortEventsForDay: EventRenderWrapper[] = []
			const eventsForDay: ReadonlyArray<EventRenderWrapper> = this.eventsRepository.getEventsForMonths()().get(day.getTime()) || []

			for (const event of eventsForDay) {
				if (transientEventUidsByCalendar.get(getListId(event.event))?.has(event.event.uid)) {
					// FIXME get rid of event.event
					continue
				}

				if (this._draggedEvent?.originalEvent !== event.event && shouldDisplayEvent(event.event, this._hiddenCalendars)) {
					// this is not the dragged event (not rendered) and does not belong to a hidden calendar, so we should render it.
					sortEvent(event, shortEventsForDay)
				}
			}

			for (const event of this._transientEvents) {
				if (isEventBetweenDays(event.event, day, day, this.timeZone)) {
					sortEvent(event, shortEventsForDay)
				}
			}

			const temporaryEvent = this._draggedEvent?.eventClone

			if (temporaryEvent && isEventBetweenDays(temporaryEvent, day, day, this.timeZone)) {
				sortEvent({ event: temporaryEvent, isGhost: false }, shortEventsForDay)
			}

			shortEvents.push(shortEventsForDay)
		}

		const longEventsArray = Array.from(longEvents.values())
		return {
			days,
			longEvents: longEventsArray,
			shortEventsPerDay: shortEvents,
		}
	}

	async deleteCalendar(calendar: CalendarInfo): Promise<void> {
		await this.calendarModel.deleteCalendar(calendar)
	}

	_addTransientEvent(event: CalendarEvent) {
		this._transientEvents.push({ event, isGhost: false })
	}

	_removeTransientEvent(event: CalendarEvent) {
		findAndRemove(this._transientEvents, (transient) => transient.event.uid === event.uid)
	}

	/**
	 * move an event to a new start time
	 * @param event the actually dragged event (may be a repeated instance)
	 * @param editModel passed in from the outside for corresponding event
	 * @param diff the amount of milliseconds to shift the event by
	 * @param mode which parts of the series should be rescheduled?
	 */
	private async moveEvent(event: CalendarEvent, diff: number, mode: CalendarOperation): Promise<EventSaveResult> {
		if (event.uid == null) {
			throw new ProgrammingError("called moveEvent for an event without uid")
		}

		const editModel = await this.createCalendarEventEditModel(mode, event)
		if (editModel == null) {
			return EventSaveResult.Failed
		}
		editModel.editModels.whenModel.rescheduleEvent({ millisecond: diff })

		if (getNonOrganizerAttendees(event).length > 0) {
			const response = await askIfShouldSendCalendarUpdatesToAttendees()
			if (response === "yes") {
				editModel.editModels.whoModel.shouldSendUpdates = true
			} else if (response === "cancel") {
				return EventSaveResult.Failed
			}
		}

		// Errors are handled in the individual views
		return await editModel.apply()
	}

	private async moveThisAndFuture(event: CalendarEvent, diff: number): Promise<EventSaveResult> {
		const progenitor = await this.calendarModel.resolveCalendarEventProgenitor(event)
		if (!progenitor) {
			throw new Error("Could not resolve progenitor.")
		}

		if (deepEqual(event, progenitor)) {
			return await this.moveEvent(event, diff, CalendarOperation.EditAll)
		}

		const progenitorModel = await this.createCalendarEventEditModel(CalendarOperation.StopSeriesAtDate, progenitor)
		const newEventModel = await this.createCalendarEventEditModel(CalendarOperation.Create, event)

		if (!newEventModel) {
			throw new Error("Failed to split original series and instantiate a new event model.")
		}

		if (!progenitorModel) {
			throw new Error("Failed to build progenitor model.")
		}

		newEventModel.editModels.whenModel.deleteExcludedDates()
		newEventModel.editModels.whoModel.resetGuestsStatus()
		newEventModel.editModels.whenModel.rescheduleEvent({ millisecond: diff })
		if (newEventModel.editModels.whenModel.repeatEndType === EndType.Count) {
			const generationRange: CalendarTimeRange = {
				start: progenitor.startTime.getTime(),
				end: getStartOfDayWithZone(event.startTime, event.repeatRule!.timeZone).getTime(),
			}
			const occurrencesPerDay = new Map()
			addDaysForRecurringEvent(
				occurrencesPerDay,
				{
					event: progenitor,
					isGhost: false,
				},
				generationRange,
				newEventModel.editModels.whenModel.zone,
			)

			const occurrencesLeft =
				newEventModel.editModels.whenModel.repeatEndOccurrences -
				progenitorModel.editModels.whenModel.excludedDates.length -
				Array.from(occurrencesPerDay.values()).flat().length
			newEventModel.editModels.whenModel.repeatEndOccurrences = occurrencesLeft > 0 ? occurrencesLeft : 1
		}

		if (getNonOrganizerAttendees(event).length > 0) {
			const response = await askIfShouldSendCalendarUpdatesToAttendees()
			if (response === "yes") {
				newEventModel.editModels.whoModel.shouldSendUpdates = true
				progenitorModel.editModels.whoModel.shouldSendUpdates = true
			} else if (response === "cancel") {
				return EventSaveResult.Failed
			}
		}

		progenitorModel.editModels.whenModel.repeatEndType = EndType.UntilDate
		progenitorModel.editModels.whenModel.repeatEndDateForDisplay = incrementDate(getStartOfDayWithZone(event.startTime, event.repeatRule!.timeZone), -1)

		if ((await progenitorModel.apply()) === EventSaveResult.Failed) {
			return EventSaveResult.Failed
		}

		return await newEventModel.apply()
	}

	get eventPreviewModel(): CalendarPreviewModels | null {
		return this.previewedEvent()?.model ?? null
	}

	get previewedEventTuple(): Stream<{ event: CalendarEvent; model: CalendarPreviewModels | null } | null> {
		return this.previewedEvent.map(identity)
	}

	/**
	 * there are several reasons why we might no longer want to preview an event and need to redraw without
	 * a previewed event:
	 * * it was deleted
	 * * it was moved away from the day we're looking at (or the day was moved away)
	 * * the calendar was unshared or deleted
	 *
	 * we would want to keep the selection if the event merely shifted its start time but still intersects the viewed day,
	 * but that would require going through the UID index because moving events changes their ID.
	 * because of this and because previewedEvent is the event _before_ we got the update that caused us to reconsider the
	 * selection, with the old times, this function only works if the selected date changed, but not if the event times
	 * changed.
	 */
	async updatePreviewedEvent(event: CalendarEvent | null) {
		if (event == null) {
			this.previewedEvent(null)
			this.doRedraw()
		} else {
			const calendarInfos = await this.calendarModel.getCalendarInfosCreateIfNeeded()
			let previewModel: CalendarPreviewModels
			if (isBirthdayCalendar(listIdPart(event._id))) {
				const idParts = event._id[1].split("#")!
				const contactId = extractContactIdFromEvent(last(idParts))!
				const contactIdParts = contactId.split("/")
				const contact = await this.contactModel.loadContactFromId([contactIdParts[0], contactIdParts[1]])
				previewModel = await this.createCalendarContactPreviewModel(event, contact, true)
			} else {
				previewModel = await this.createCalendarEventPreviewModel(event, calendarInfos, [])
			}

			this.previewedEvent({ event, model: previewModel })
			this.doRedraw()
		}
	}

	private async entityEventReceived<T>(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(CalendarEventTypeRef, update)) {
				const eventId: IdTuple = [update.instanceListId, update.instanceId]
				const previewedEvent = this.previewedEvent()
				if (previewedEvent != null && isUpdateFor(previewedEvent.event, update)) {
					if (update.operation === OperationType.DELETE) {
						this.previewedEvent(null)
						this.previewedEventId = null
						this.doRedraw()
					} else {
						try {
							const event = await this.entityClient.load(CalendarEventTypeRef, eventId)
							await this.updatePreviewedEvent(event)
						} catch (e) {
							if (e instanceof NotAuthorizedError) {
								// return updates that are not in cache Range if NotAuthorizedError (for those updates that are in cache range)
								console.log("NotAuthorizedError for event in entityEventsReceived of view", e)
							} else if (e instanceof NotFoundError) {
								console.log("Not found event in entityEventsReceived of view", e)
							} else {
								throw e
							}
						}
					}
				}
				const transientEvent = this._transientEvents.find((transientEvent) => isSameId(transientEvent.event._id, eventId))
				if (transientEvent) {
					this._removeTransientEvent(transientEvent.event)
					this.doRedraw()
				}
			} else if (isUpdateForTypeRef(ContactTypeRef, update) && this.isNewPaidPlan) {
				await this.eventsRepository.handleContactEvent(update.operation, [update.instanceListId, update.instanceId])
				this.doRedraw()
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update)) {
				this.logins
					.getUserController()
					.isNewPaidPlan()
					.then((isNewPaidPlan) => (this._isNewPaidPlan = isNewPaidPlan))
			}
		}
	}

	getCalendarInfosCreateIfNeeded(): $Promisable<ReadonlyMap<Id, CalendarInfo>> {
		return this.calendarModel.getCalendarInfosCreateIfNeeded()
	}

	loadMonthsIfNeeded(daysInMonths: Array<Date>, progressMonitor: IProgressMonitor, canceled: Stream<boolean>): Promise<void> {
		return this.eventsRepository.loadMonthsIfNeeded(daysInMonths, canceled, progressMonitor)
	}

	private doRedraw() {
		// Need to pass some argument to make it a "set" operation
		this._redrawStream(undefined)
	}

	getScrollPosition(): number {
		return this.scrollPosition
	}

	setScrollPosition(newPosition: number): void {
		if (newPosition < 0) {
			this.scrollPosition = 0
		} else if (this.scrollMax !== null && newPosition > this.scrollMax) {
			this.scrollPosition = this.scrollMax
		} else {
			this.scrollPosition = newPosition
		}
	}

	getScrollMaximum(): number | null {
		return this.scrollMax
	}

	getViewSize(): number | null {
		return this.viewSize
	}

	setViewParameters(dom: HTMLElement): void {
		this.scrollMax = dom.scrollHeight - dom.clientHeight
		this.viewSize = dom.clientHeight
	}

	scroll(by: number): void {
		this.setScrollPosition(this.scrollPosition + by)
	}

	forceSyncExternal(groupSettings: GroupSettings | null, longErrorMessage: boolean = false) {
		if (!groupSettings) {
			return
		}

		return this.calendarModel.syncExternalCalendars([groupSettings], EXTERNAL_CALENDAR_SYNC_INTERVAL, longErrorMessage, true)
	}

	public getCalendarModel() {
		return this.calendarModel
	}

	async handleBirthdayCalendarUpdate(newBirthdayColor: string) {
		const userSettingsGroupRoot = this.logins.getUserController().userSettingsGroupRoot
		userSettingsGroupRoot.birthdayCalendarColor = newBirthdayColor
		await this.entityClient.update(userSettingsGroupRoot)
	}

	get isNewPaidPlan(): Readonly<boolean> {
		return this._isNewPaidPlan
	}

	toggleHiddenCalendar = (calendarId: string) => {
		if (isBirthdayCalendar(calendarId) && !this.isNewPaidPlan) {
			showPlanUpgradeRequiredDialog(NewPaidPlans)
			return
		}

		const newHiddenCalendars = new Set(this.hiddenCalendars)
		if (this.hiddenCalendars.has(calendarId)) {
			newHiddenCalendars.delete(calendarId)
		} else {
			newHiddenCalendars.add(calendarId)
		}
		this.setHiddenCalendars(newHiddenCalendars)
	}

	getIcon(calendarId: string, calendarType: CalendarType): CalendarSidebarRowIconData | undefined {
		switch (calendarType) {
			case CalendarType.External: {
				const lastSyncEntry = deviceConfig.getLastExternalCalendarSync().get(calendarId)
				if (!lastSyncEntry || lastSyncEntry.lastSyncStatus === SyncStatus.Success) {
					// lastSyncEntry won't exist in the webClient
					return
				}
				const lastSyncDate = lastSyncEntry?.lastSuccessfulSync ? new Date(lastSyncEntry.lastSuccessfulSync) : null
				const lastSyncStr = lastSyncDate
					? lang.get("lastSync_label", { "{date}": `${formatDate(lastSyncDate)} at ${formatTime(lastSyncDate)}` })
					: lang.get("iCalNotSync_msg")
				return {
					icon: Icons.SyncProblem,
					title: lastSyncStr,
				}
			}
		}
	}
}

function updateTemporaryEventWithDiff(eventClone: CalendarEvent, originalEvent: CalendarEvent, mouseDiff: number) {
	eventClone.startTime = new Date(originalEvent.startTime.getTime() + mouseDiff)
	eventClone.endTime = new Date(originalEvent.endTime.getTime() + mouseDiff)
}
