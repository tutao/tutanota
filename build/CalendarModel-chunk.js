import { __toESM } from "./chunk-chunk.js";
import { TutanotaError } from "./dist-chunk.js";
import { isApp, isDesktop } from "./Env-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { LazyLoaded, assertNotNull, clone, deepEqual, defer, downcast, filterInt, getFromMap, isSameDay, symmetricDifference } from "./dist2-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { CalendarMethod, EXTERNAL_CALENDAR_SYNC_INTERVAL, FeatureType, OperationType } from "./TutanotaConstants-chunk.js";
import { elementIdPart, getElementId, isSameId, listIdPart, removeTechnicalFields } from "./EntityUtils-chunk.js";
import { CalendarEventTypeRef, CalendarEventUpdateTypeRef, CalendarGroupRootTypeRef, FileTypeRef, UserSettingsGroupRootTypeRef, createDefaultAlarmInfo, createGroupSettings } from "./TypeRefs-chunk.js";
import { findAttendeeInAddresses, serializeAlarmInterval } from "./CommonCalendarUtils-chunk.js";
import { GroupInfoTypeRef, GroupTypeRef, UserAlarmInfoTypeRef, createDateWrapper, createMembershipRemoveData } from "./TypeRefs2-chunk.js";
import { ParserError } from "./ParserCombinator-chunk.js";
import { CalendarEventValidity, assignEventId, checkEventValidity, getTimeZone, hasSourceUrl } from "./CalendarUtils-chunk.js";
import { EventImportRejectionReason, SyncStatus, parseCalendarStringData, sortOutParsedEvents } from "./ImportExportUtils-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { SessionKeyNotFoundError } from "./ErrorUtils-chunk.js";
import { LockedError, NotAuthorizedError, NotFoundError, PreconditionFailedError } from "./RestError-chunk.js";
import { isUpdateFor, isUpdateForTypeRef } from "./EntityUpdateUtils-chunk.js";
import { MembershipService } from "./Services-chunk.js";
import { formatDateWithWeekdayAndTime, formatTime } from "./Formatter-chunk.js";
import { NoopProgressMonitor } from "./ProgressMonitor-chunk.js";
import { NotificationType } from "./Notifications-chunk.js";
import { CachingMode } from "./CalendarFacade-chunk.js";
import { isSharedGroupOwner, loadGroupMembers } from "./GroupUtils2-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";

//#region src/common/api/common/utils/ObservableLazyLoaded.ts
var import_stream = __toESM(require_stream(), 1);
var ObservableLazyLoaded = class {
	lazyLoaded;
	stream = (0, import_stream.default)();
	constructor(loadFunction, defaultValue) {
		this.defaultValue = defaultValue;
		this.lazyLoaded = new LazyLoaded(async () => {
			const value = await loadFunction();
			this.stream(value);
			return value;
		}, defaultValue);
		this.stream(defaultValue);
	}
	getAsync() {
		return this.lazyLoaded.getAsync();
	}
	isLoaded() {
		return this.lazyLoaded.isLoaded();
	}
	getLoaded() {
		return this.lazyLoaded.getLoaded();
	}
	/** reset & reload the inner lazyLoaded without an observable default state unless loading fails */
	async reload() {
		try {
			return await this.lazyLoaded.reload();
		} catch (e) {
			this.lazyLoaded.reset();
			this.stream(this.defaultValue);
			return this.defaultValue;
		}
	}
	reset() {
		this.lazyLoaded.reset();
		this.stream(this.defaultValue);
	}
};

//#endregion
//#region src/calendar-app/calendar/model/CalendarModel.ts
const TAG = "[CalendarModel]";
function assertEventValidity(event) {
	switch (checkEventValidity(event)) {
		case CalendarEventValidity.InvalidContainsInvalidDate: throw new UserError("invalidDate_msg");
		case CalendarEventValidity.InvalidEndBeforeStart: throw new UserError("startAfterEnd_label");
		case CalendarEventValidity.InvalidPre1970: throw new UserError("pre1970Start_msg");
		case CalendarEventValidity.Valid:
	}
}
var CalendarModel = class {
	/**
	* Map from calendar event element id to the deferred object with a promise of getting CREATE event for this calendar event. We need to do that because
	* entity updates for CalendarEvent and UserAlarmInfo come in different batches and we need to wait for the event when we want to process new alarm.
	*
	* We use the counter to remove the pending request from map when all alarms are processed. We want to do that in case the event gets updated and we need
	* to wait for the new version of the event.
	*/
	pendingAlarmRequests = new Map();
	userAlarmToAlarmInfo = new Map();
	fileIdToSkippedCalendarEventUpdates = new Map();
	readProgressMonitor;
	/**
	* Map from group id to CalendarInfo
	*/
	calendarInfos = new ObservableLazyLoaded(() => {
		const monitor = this.readProgressMonitor.next().value;
		const calendarInfoPromise = this.loadOrCreateCalendarInfo(monitor);
		monitor.completed();
		return calendarInfoPromise;
	}, new Map());
	constructor(notifications, alarmScheduler, eventController, serviceExecutor, logins, progressTracker, entityClient, mailboxModel, calendarFacade, fileController, zone, externalCalendarFacade, deviceConfig, pushService) {
		this.notifications = notifications;
		this.alarmScheduler = alarmScheduler;
		this.serviceExecutor = serviceExecutor;
		this.logins = logins;
		this.progressTracker = progressTracker;
		this.entityClient = entityClient;
		this.mailboxModel = mailboxModel;
		this.calendarFacade = calendarFacade;
		this.fileController = fileController;
		this.zone = zone;
		this.externalCalendarFacade = externalCalendarFacade;
		this.deviceConfig = deviceConfig;
		this.pushService = pushService;
		this.readProgressMonitor = oneShotProgressMonitorGenerator(progressTracker, logins.getUserController());
		eventController.addEntityListener((updates, eventOwnerGroupId) => this.entityEventsReceived(updates, eventOwnerGroupId));
	}
	getCalendarInfos() {
		return this.calendarInfos.getAsync();
	}
	getCalendarInfosStream() {
		return this.calendarInfos.stream;
	}
	async createEvent(event, alarmInfos, zone, groupRoot) {
		await this.doCreate(event, zone, groupRoot, alarmInfos);
	}
	/** Update existing event when time did not change */
	async updateEvent(newEvent, newAlarms, zone, groupRoot, existingEvent) {
		if (existingEvent._id == null) throw new Error("Invalid existing event for update: no id");
		if (existingEvent.uid != null && newEvent.uid !== existingEvent.uid) throw new Error("Invalid existing event for update: mismatched uids.");
		if (existingEvent._ownerGroup !== groupRoot._id || newEvent.startTime.getTime() !== existingEvent.startTime.getTime() || await didLongStateChange(newEvent, existingEvent, zone)) {
			await this.doCreate(newEvent, zone, groupRoot, newAlarms, existingEvent);
			return await this.entityClient.load(CalendarEventTypeRef, newEvent._id);
		} else {
			newEvent._ownerGroup = groupRoot._id;
			await this.calendarFacade.updateCalendarEvent(newEvent, newAlarms, existingEvent);
			return newEvent;
		}
	}
	/** Load map from group/groupRoot ID to the calendar info */
	async loadCalendarInfos(progressMonitor) {
		const userController = this.logins.getUserController();
		const notFoundMemberships = [];
		const groupInstances = [];
		for (const membership of userController.getCalendarMemberships()) {
			try {
				const result = await Promise.all([
					this.entityClient.load(CalendarGroupRootTypeRef, membership.group),
					this.entityClient.load(GroupInfoTypeRef, membership.groupInfo),
					this.entityClient.load(GroupTypeRef, membership.group)
				]);
				groupInstances.push(result);
			} catch (e) {
				if (e instanceof NotFoundError) notFoundMemberships.push(membership);
else throw e;
			}
			progressMonitor.workDone(3);
		}
		const calendarInfos = new Map();
		const groupSettings = userController.userSettingsGroupRoot.groupSettings;
		for (const [groupRoot, groupInfo, group] of groupInstances) try {
			const groupMembers = await loadGroupMembers(group, this.entityClient);
			const shared = groupMembers.length > 1;
			const userIsOwner = !shared || isSharedGroupOwner(group, userController.userId);
			const isExternal = hasSourceUrl(groupSettings.find((groupSettings$1) => groupSettings$1.group === group._id));
			calendarInfos.set(groupRoot._id, {
				groupRoot,
				groupInfo,
				group,
				shared,
				userIsOwner,
				isExternal
			});
		} catch (e) {
			if (e instanceof NotAuthorizedError) console.log("NotAuthorizedError when initializing calendar. Calendar has been removed ");
else throw e;
		}
		for (const membership of notFoundMemberships) this.serviceExecutor.delete(MembershipService, createMembershipRemoveData({
			user: userController.userId,
			group: membership.group
		})).catch((e) => console.log("error cleaning up membership for group: ", membership.group));
		return calendarInfos;
	}
	async fetchExternalCalendar(url) {
		if (!this.externalCalendarFacade) throw new Error(`externalCalendarFacade is ${typeof this.externalCalendarFacade} at CalendarModel`);
		const calendarStr = await this.externalCalendarFacade?.fetchExternalCalendar(url);
		return calendarStr ?? "";
	}
	scheduleExternalCalendarSync() {
		setInterval(() => {
			this.syncExternalCalendars().catch((e) => console.error(e.message));
		}, EXTERNAL_CALENDAR_SYNC_INTERVAL);
	}
	async syncExternalCalendars(groupSettings = null, syncInterval = EXTERNAL_CALENDAR_SYNC_INTERVAL, longErrorMessage = false, forceSync = false) {
		if (!this.externalCalendarFacade || !locator.logins.isFullyLoggedIn()) return;
		let existingGroupSettings = groupSettings;
		const userController = this.logins.getUserController();
		const groupRootsPromises = [];
		let calendarGroupRootsList = [];
		for (const membership of userController.getCalendarMemberships()) groupRootsPromises.push(this.entityClient.load(CalendarGroupRootTypeRef, membership.group));
		calendarGroupRootsList = await Promise.all(groupRootsPromises);
		if (!existingGroupSettings) {
			const { groupSettings: gSettings } = await locator.entityClient.load(UserSettingsGroupRootTypeRef, userController.user.userGroup.group);
			existingGroupSettings = gSettings;
		}
		const skippedCalendars = new Map();
		for (const { sourceUrl, group, name } of existingGroupSettings) {
			if (!sourceUrl) continue;
			const lastSyncEntry = this.deviceConfig.getLastExternalCalendarSync().get(group);
			const offset = 1e3;
			const shouldSkipSync = !forceSync && lastSyncEntry?.lastSyncStatus === SyncStatus.Success && lastSyncEntry.lastSuccessfulSync && Date.now() + offset - lastSyncEntry.lastSuccessfulSync < syncInterval;
			if (shouldSkipSync) continue;
			const currentCalendarGroupRoot = calendarGroupRootsList.find((calendarGroupRoot) => isSameId(calendarGroupRoot._id, group)) ?? null;
			if (!currentCalendarGroupRoot) {
				console.error(`Trying to sync a calendar the user isn't subscribed to anymore: ${group}`);
				continue;
			}
			let parsedExternalEvents = [];
			try {
				const externalCalendar = await this.fetchExternalCalendar(sourceUrl);
				parsedExternalEvents = parseCalendarStringData(externalCalendar, getTimeZone()).contents;
			} catch (error) {
				let calendarName = name;
				if (!calendarName) {
					const calendars = await this.getCalendarInfos();
					calendarName = calendars.get(group)?.groupInfo.name;
				}
				skippedCalendars.set(group, {
					calendarName,
					error
				});
				continue;
			}
			const existingEventList = await loadAllEvents(currentCalendarGroupRoot);
			const operationsLog = {
				skipped: [],
				updated: [],
				created: [],
				deleted: []
			};
			/**
			* Sync strategy
			* - Replace duplicates
			* - Add new
			* - Remove rest
			*/
			const { rejectedEvents, eventsForCreation } = sortOutParsedEvents(parsedExternalEvents, existingEventList, currentCalendarGroupRoot, getTimeZone());
			const duplicates = rejectedEvents.get(EventImportRejectionReason.Duplicate) ?? [];
			for (const duplicatedEvent of duplicates) {
				const existingEvent = existingEventList.find((event) => event.uid === duplicatedEvent.uid);
				if (!existingEvent) {
					console.warn("Found a duplicate without an existing event!");
					continue;
				}
				if (this.eventHasSameFields(duplicatedEvent, existingEvent)) {
					operationsLog.skipped.push(duplicatedEvent);
					continue;
				}
				await this.updateEventWithExternal(existingEvent, duplicatedEvent);
				operationsLog.updated.push(duplicatedEvent);
			}
			console.log(TAG, `${operationsLog.skipped.length} events skipped (duplication without changes)`);
			console.log(TAG, `${operationsLog.updated.length} events updated (duplication with changes)`);
			for (const { event } of eventsForCreation) {
				assignEventId(event, getTimeZone(), currentCalendarGroupRoot);
				event._ownerEncSessionKey = null;
				if (event.repeatRule != null) event.repeatRule.excludedDates = event.repeatRule.excludedDates.map(({ date }) => createDateWrapper({ date }));
				downcast(event)._permissions = null;
				event._ownerGroup = currentCalendarGroupRoot._id;
				assertEventValidity(event);
				operationsLog.created.push(event);
			}
			await this.calendarFacade.saveImportedCalendarEvents(eventsForCreation, 0);
			console.log(TAG, `${operationsLog.created.length} events created`);
			const eventsToRemove = existingEventList.filter((existingEvent) => !parsedExternalEvents.some((externalEvent) => externalEvent.event.uid === existingEvent.uid));
			for (const event of eventsToRemove) {
				await this.deleteEvent(event).catch((err) => {
					if (err instanceof NotFoundError) return console.log(`Already deleted event`, event);
					throw err;
				});
				operationsLog.deleted.push(event);
			}
			console.log(TAG, `${operationsLog.deleted.length} events removed`);
			this.deviceConfig.updateLastSync(group);
		}
		if (skippedCalendars.size) {
			let errorMessage = lang.get("iCalSync_error") + (longErrorMessage ? "\n\n" : "");
			for (const [group, details] of skippedCalendars.entries()) {
				if (longErrorMessage) errorMessage += `${details.calendarName} - ${details.error.message}\n`;
				this.deviceConfig.updateLastSync(group, SyncStatus.Failed);
			}
			throw new Error(errorMessage);
		}
	}
	eventHasSameFields(a, b) {
		return a.startTime.valueOf() === b.startTime.valueOf() && a.endTime.valueOf() === b.endTime.valueOf() && deepEqual({ ...a.attendees }, { ...b.attendees }) && a.summary === b.summary && a.sequence === b.sequence && a.location === b.location && a.description === b.description && deepEqual(a.organizer, b.organizer) && deepEqual(a.repeatRule, b.repeatRule) && a.recurrenceId?.valueOf() === b.recurrenceId?.valueOf();
	}
	async loadOrCreateCalendarInfo(progressMonitor) {
		const { findFirstPrivateCalendar } = await import("./CalendarUtils2-chunk.js");
		const calendarInfos = await this.loadCalendarInfos(progressMonitor);
		if (!this.logins.isInternalUserLoggedIn() || findFirstPrivateCalendar(calendarInfos)) return calendarInfos;
else {
			await this.createCalendar("", null, [], null);
			return await this.loadCalendarInfos(progressMonitor);
		}
	}
	async createCalendar(name, color, alarms, sourceUrl) {
		const { user, group } = await this.calendarFacade.addCalendar(name);
		this.logins.getUserController().user = user;
		const serializedAlarms = alarms.map((alarm) => createDefaultAlarmInfo({ trigger: serializeAlarmInterval(alarm) }));
		if (color != null) {
			const { userSettingsGroupRoot } = this.logins.getUserController();
			const newGroupSettings = createGroupSettings({
				group: group._id,
				color,
				name: null,
				defaultAlarmsList: serializedAlarms,
				sourceUrl
			});
			userSettingsGroupRoot.groupSettings.push(newGroupSettings);
			await this.entityClient.update(userSettingsGroupRoot);
		}
		return group;
	}
	async doCreate(event, zone, groupRoot, alarmInfos, existingEvent) {
		removeTechnicalFields(event);
		const { assignEventId: assignEventId$1 } = await import("./CalendarUtils2-chunk.js");
		assignEventId$1(event, zone, groupRoot);
		event._ownerEncSessionKey = null;
		if (event.repeatRule != null) event.repeatRule.excludedDates = event.repeatRule.excludedDates.map(({ date }) => createDateWrapper({ date }));
		downcast(event)._permissions = null;
		event._ownerGroup = groupRoot._id;
		return await this.calendarFacade.saveCalendarEvent(event, alarmInfos, existingEvent ?? null);
	}
	async deleteEvent(event) {
		return await this.entityClient.erase(event);
	}
	/**
	* get the "primary" event of a series - the one that contains the repeat rule and is not a repeated or a rescheduled instance.
	*
	* note about recurrenceId in event series https://stackoverflow.com/questions/11456406/recurrence-id-in-icalendar-rfc-5545
	*/
	async resolveCalendarEventProgenitor({ uid }) {
		return (await this.getEventsByUid(assertNotNull(uid, "could not resolve progenitor: no uid")))?.progenitor ?? null;
	}
	async loadAndProcessCalendarUpdates() {
		const { mailboxGroupRoot } = await this.mailboxModel.getUserMailboxDetails();
		const { calendarEventUpdates } = mailboxGroupRoot;
		if (calendarEventUpdates == null) return;
		const invites = await this.entityClient.loadAll(CalendarEventUpdateTypeRef, calendarEventUpdates.list);
		for (const invite of invites) await this.handleCalendarEventUpdate(invite);
	}
	/**
	* Get calendar infos, creating a new calendar info if none exist
	* Not async because we want to return the result directly if it is available when called
	* otherwise we return a promise
	*/
	getCalendarInfosCreateIfNeeded() {
		if (this.calendarInfos.isLoaded() && this.calendarInfos.getLoaded().size > 0) return this.calendarInfos.getLoaded();
		return Promise.resolve().then(async () => {
			const calendars = await this.calendarInfos.getAsync();
			if (calendars.size > 0) return calendars;
else {
				await this.createCalendar("", null, [], null);
				return this.calendarInfos.reload();
			}
		});
	}
	async getCalendarDataForUpdate(fileId) {
		try {
			const file = await this.entityClient.load(FileTypeRef, fileId);
			const dataFile = await this.fileController.getAsDataFile(file);
			const { parseCalendarFile } = await import("./CalendarImporter2-chunk.js");
			return await parseCalendarFile(dataFile);
		} catch (e) {
			if (e instanceof SessionKeyNotFoundError) throw new NoOwnerEncSessionKeyForCalendarEventError("no owner enc session key found on the calendar data's file");
			if (e instanceof ParserError || e instanceof NotFoundError) {
				console.warn(TAG, "could not get calendar update data", e);
				return null;
			}
			throw e;
		}
	}
	async handleCalendarEventUpdate(update) {
		try {
			const parsedCalendarData = await this.getCalendarDataForUpdate(update.file);
			if (parsedCalendarData != null) await this.processCalendarData(update.sender, parsedCalendarData);
		} catch (e) {
			if (e instanceof NotAuthorizedError) {
				console.warn(TAG, "could not process calendar update: not authorized", e);
				return;
			} else if (e instanceof PreconditionFailedError) {
				console.warn(TAG, "could not process calendar update: precondition failed", e);
				return;
			} else if (e instanceof LockedError) {
				console.warn(TAG, "could not process calendar update: locked", e);
				return;
			} else if (e instanceof NotFoundError) console.warn(TAG, "could not process calendar update: not found", e);
else if (e instanceof NoOwnerEncSessionKeyForCalendarEventError) {
				this.fileIdToSkippedCalendarEventUpdates.set(elementIdPart(update.file), update);
				console.warn(TAG, `could not process calendar update: ${e.message}`, e);
				return;
			} else {
				console.warn(TAG, "could not process calendar update:", e);
				await this.eraseUpdate(update);
				throw e;
			}
		}
		await this.eraseUpdate(update);
	}
	/**
	* try to delete a calendar update from the server, ignoring errors
	* @param update the update to erase
	* @private
	*/
	async eraseUpdate(update) {
		try {
			await this.entityClient.erase(update);
		} catch (e) {
			console.log(TAG, "failed to delete update:", e.name);
		}
	}
	/** whether the operation could be performed or not */
	async deleteEventsByUid(uid) {
		const entry = await this.calendarFacade.getEventsByUid(uid);
		if (entry == null) {
			console.log("could not find an uid index entry to delete event");
			return;
		}
		for (const e of entry.alteredInstances) await this.deleteEvent(e);
		if (entry.progenitor) await this.deleteEvent(entry.progenitor);
	}
	/** process a calendar update retrieved from the server automatically. will not apply updates to event series that do not
	*  exist on the server yet (that's being done by calling processCalendarEventMessage manually)
	* public for testing */
	async processCalendarData(sender, calendarData) {
		if (calendarData.contents.length === 0) {
			console.log(TAG, `Calendar update with no events, ignoring`);
			return;
		}
		if (calendarData.contents[0].event.uid == null) {
			console.log(TAG, "invalid event update without UID, ignoring.");
			return;
		}
		const dbEvents = await this.calendarFacade.getEventsByUid(calendarData.contents[0].event.uid, CachingMode.Bypass);
		if (dbEvents == null) {
			console.log(TAG, "received event update for event that has not been saved to the server, ignoring.");
			return;
		}
		const method = calendarData.method;
		for (const content of calendarData.contents) {
			const updateAlarms = content.alarms;
			const updateEvent = content.event;
			await this.processCalendarEventMessage(sender, method, updateEvent, updateAlarms, dbEvents);
		}
	}
	/**
	* Processing calendar update - bring events in calendar up-to-date with ical data sent via email.
	* calendar data are currently processed for
	* - REQUEST: here we have two cases:
	*     - there is an existing event: we apply the update to that event and do the necessary changes to the other parts of the series that may already exist
	*     - there is no existing event: create the event as received, and do the necessary changes to the other parts of the series that may already exist
	* - REPLY: update attendee status,
	* - CANCEL: we delete existing event instance
	*
	* @param sender
	* @param method
	* @param updateEvent the actual instance that needs to be updated
	* @param updateAlarms
	* @param target either the existing event to update or the calendar group Id to create the event in in case of a new event.
	*/
	async processCalendarEventMessage(sender, method, updateEvent, updateAlarms, target) {
		const updateEventTime = updateEvent.recurrenceId?.getTime();
		const targetDbEvent = updateEventTime == null ? target.progenitor : target.alteredInstances.find((e) => e.recurrenceId.getTime() === updateEventTime);
		if (targetDbEvent == null) if (method === CalendarMethod.REQUEST) return await this.processCalendarAccept(target, updateEvent, updateAlarms);
else if (target.progenitor?.repeatRule != null && updateEvent.recurrenceId != null && method === CalendarMethod.CANCEL) {
			target.alteredInstances.push(updateEvent);
			return await this.processCalendarUpdate(target, target.progenitor, target.progenitor);
		} else {
			console.log(TAG, `got something that's not a REQUEST for nonexistent server event on uid:`, method);
			return;
		}
		const sentByOrganizer = targetDbEvent.organizer != null && targetDbEvent.organizer.address === sender;
		if (method === CalendarMethod.REPLY) return this.processCalendarReply(sender, targetDbEvent, updateEvent);
else if (sentByOrganizer && method === CalendarMethod.REQUEST) return await this.processCalendarUpdate(target, targetDbEvent, updateEvent);
else if (sentByOrganizer && method === CalendarMethod.CANCEL) return await this.processCalendarCancellation(targetDbEvent);
else console.log(TAG, `${method} update sent not by organizer, ignoring.`);
	}
	/** process either a request for an existing progenitor or an existing altered instance.
	* @param dbTarget the uid entry containing the other events that are known to us that belong to this event series.
	* @param dbEvent the version of updateEvent stored on the server. must be identical to dbTarget.progenitor or one of dbTarget.alteredInstances
	* @param updateEvent the event that contains the new version of dbEvent. */
	async processCalendarUpdate(dbTarget, dbEvent, updateEvent) {
		console.log(TAG, "processing request for existing event instance");
		const { repeatRuleWithExcludedAlteredInstances } = await import("./CalendarEventWhenModel2-chunk.js");
		if (filterInt(dbEvent.sequence) > filterInt(updateEvent.sequence)) {
			console.log(TAG, "got update for outdated event version, ignoring.");
			return;
		}
		if (updateEvent.recurrenceId == null && updateEvent.repeatRule != null) updateEvent.repeatRule = repeatRuleWithExcludedAlteredInstances(updateEvent, dbTarget.alteredInstances.map((r) => r.recurrenceId), this.zone);
		dbTarget.progenitor = await this.updateEventWithExternal(dbEvent, updateEvent);
	}
	/**
	* do not call this for anything but a REQUEST
	* @param dbTarget the progenitor that must have a repeat rule and an exclusion for this event to be accepted, the known altered instances and the ownergroup.
	* @param updateEvent the event to create
	* @param alarms alarms to set up for this user/event
	*/
	async processCalendarAccept(dbTarget, updateEvent, alarms) {
		console.log(TAG, "processing new instance request");
		const { repeatRuleWithExcludedAlteredInstances } = await import("./CalendarEventWhenModel2-chunk.js");
		if (updateEvent.recurrenceId != null && dbTarget.progenitor != null && dbTarget.progenitor.repeatRule != null) {
			const updatedProgenitor = clone(dbTarget.progenitor);
			updatedProgenitor.repeatRule = repeatRuleWithExcludedAlteredInstances(updatedProgenitor, [updateEvent.recurrenceId], this.zone);
			dbTarget.progenitor = await this.doUpdateEvent(dbTarget.progenitor, updatedProgenitor);
		} else if (updateEvent.recurrenceId == null && updateEvent.repeatRule != null && dbTarget.alteredInstances.length > 0) updateEvent.repeatRule = repeatRuleWithExcludedAlteredInstances(updateEvent, dbTarget.alteredInstances.map((r) => r.recurrenceId), this.zone);
		let calendarGroupRoot;
		try {
			calendarGroupRoot = await this.entityClient.load(CalendarGroupRootTypeRef, dbTarget.ownerGroup);
		} catch (e) {
			if (!(e instanceof NotFoundError) && !(e instanceof NotAuthorizedError)) throw e;
			console.log(TAG, "tried to create new progenitor or got new altered instance for progenitor in nonexistent/inaccessible calendar, ignoring");
			return;
		}
		return await this.doCreate(updateEvent, "", calendarGroupRoot, alarms);
	}
	/** Someone replied whether they attend an event or not. this MUST be applied to all instances in our
	* model since we keep attendee lists in sync for now. */
	async processCalendarReply(sender, dbEvent, updateEvent) {
		console.log("processing calendar reply");
		const replyAttendee = findAttendeeInAddresses(updateEvent.attendees, [sender]);
		if (replyAttendee == null) {
			console.log(TAG, "Sender is not among attendees, ignoring", replyAttendee);
			return;
		}
		const newEvent = clone(dbEvent);
		const dbAttendee = findAttendeeInAddresses(newEvent.attendees, [replyAttendee.address.address]);
		if (dbAttendee == null) {
			console.log(TAG, "attendee was not found", dbEvent._id, replyAttendee);
			return;
		}
		dbAttendee.status = replyAttendee.status;
		await this.doUpdateEvent(dbEvent, newEvent);
	}
	/** handle an event cancellation - either the whole series (progenitor got cancelled)
	* or the altered occurrence. */
	async processCalendarCancellation(dbEvent) {
		console.log(TAG, "processing cancellation");
		if (dbEvent.recurrenceId == null && dbEvent.uid != null) return await this.deleteEventsByUid(dbEvent.uid);
else return await this.entityClient.erase(dbEvent);
	}
	/**
	* Update {@param dbEvent} stored on the server with {@param icsEvent} from the ics file.
	*/
	async updateEventWithExternal(dbEvent, icsEvent) {
		const newEvent = clone(dbEvent);
		newEvent.startTime = icsEvent.startTime;
		newEvent.endTime = icsEvent.endTime;
		newEvent.attendees = icsEvent.attendees;
		newEvent.summary = icsEvent.summary;
		newEvent.sequence = icsEvent.sequence;
		newEvent.location = icsEvent.location;
		newEvent.description = icsEvent.description;
		newEvent.organizer = icsEvent.organizer;
		newEvent.repeatRule = icsEvent.repeatRule;
		newEvent.recurrenceId = icsEvent.recurrenceId;
		return await this.doUpdateEvent(dbEvent, newEvent);
	}
	async doUpdateEvent(dbEvent, newEvent) {
		const [alarms, groupRoot] = await Promise.all([this.loadAlarms(dbEvent.alarmInfos, this.logins.getUserController().user), this.entityClient.load(CalendarGroupRootTypeRef, assertNotNull(dbEvent._ownerGroup))]);
		const alarmInfos = alarms.map((a) => a.alarmInfo);
		return await this.updateEvent(newEvent, alarmInfos, "", groupRoot, dbEvent);
	}
	async init() {
		await this.scheduleAlarmsLocally();
		await this.loadAndProcessCalendarUpdates();
	}
	async scheduleAlarmsLocally() {
		if (!this.localAlarmsEnabled()) return;
		const pushIdentifier = this.pushService?.getLoadedPushIdentifier();
		if (pushIdentifier && pushIdentifier.disabled) return console.log("Push identifier disabled. Skipping alarm schedule");
		const eventsWithInfos = await this.calendarFacade.loadAlarmEvents();
		const scheduler = await this.alarmScheduler();
		for (let { event, userAlarmInfos } of eventsWithInfos) for (let userAlarmInfo of userAlarmInfos) this.scheduleUserAlarmInfo(event, userAlarmInfo, scheduler);
	}
	async loadAlarms(alarmInfos, user) {
		const { alarmInfoList } = user;
		if (alarmInfoList == null) return [];
		const ids = alarmInfos.filter((alarmInfoId) => isSameId(listIdPart(alarmInfoId), alarmInfoList.alarms));
		if (ids.length === 0) return [];
		return this.entityClient.loadMultiple(UserAlarmInfoTypeRef, listIdPart(ids[0]), ids.map(elementIdPart));
	}
	async deleteCalendar(calendar) {
		await this.calendarFacade.deleteCalendar(calendar.groupRoot._id);
		this.deviceConfig.removeLastSync(calendar.group._id);
	}
	async getEventsByUid(uid) {
		return this.calendarFacade.getEventsByUid(uid);
	}
	async entityEventsReceived(updates, eventOwnerGroupId) {
		const calendarInfos = await this.calendarInfos.getAsync();
		const alarmEventsToProcess = [];
		for (const entityEventData of updates) if (isUpdateForTypeRef(UserAlarmInfoTypeRef, entityEventData) && !isApp()) {
			if (entityEventData.operation === OperationType.CREATE) try {
				const userAlarmInfo = await this.entityClient.load(UserAlarmInfoTypeRef, [entityEventData.instanceListId, entityEventData.instanceId]);
				alarmEventsToProcess.push(userAlarmInfo);
				const deferredEvent = this.getPendingAlarmRequest(userAlarmInfo.alarmInfo.calendarRef.elementId);
				deferredEvent.pendingAlarmCounter++;
			} catch (e) {
				if (e instanceof NotFoundError) console.log(TAG, e, "Event or alarm were not found: ", entityEventData, e);
else throw e;
			}
else if (entityEventData.operation === OperationType.DELETE && !isApp()) await this.cancelUserAlarmInfo(entityEventData.instanceId);
		} else if (isUpdateForTypeRef(CalendarEventTypeRef, entityEventData)) {
			if (entityEventData.operation === OperationType.CREATE || entityEventData.operation === OperationType.UPDATE) {
				const deferredEvent = this.getPendingAlarmRequest(entityEventData.instanceId);
				deferredEvent.deferred.resolve(undefined);
			}
		} else if (isUpdateForTypeRef(CalendarEventUpdateTypeRef, entityEventData) && entityEventData.operation === OperationType.CREATE) try {
			const invite = await this.entityClient.load(CalendarEventUpdateTypeRef, [entityEventData.instanceListId, entityEventData.instanceId]);
			await this.handleCalendarEventUpdate(invite);
		} catch (e) {
			if (e instanceof NotFoundError) console.log(TAG, "invite not found", [entityEventData.instanceListId, entityEventData.instanceId], e);
else throw e;
		}
else if (isUpdateForTypeRef(FileTypeRef, entityEventData)) {
			const skippedCalendarEventUpdate = this.fileIdToSkippedCalendarEventUpdates.get(entityEventData.instanceId);
			if (skippedCalendarEventUpdate) try {
				await this.handleCalendarEventUpdate(skippedCalendarEventUpdate);
			} catch (e) {
				if (e instanceof NotFoundError) console.log(TAG, "invite not found", [entityEventData.instanceListId, entityEventData.instanceId], e);
else throw e;
			} finally {
				this.fileIdToSkippedCalendarEventUpdates.delete(entityEventData.instanceId);
			}
		} else if (this.logins.getUserController().isUpdateForLoggedInUserInstance(entityEventData, eventOwnerGroupId)) {
			const calendarMemberships = this.logins.getUserController().getCalendarMemberships();
			const oldGroupIds = new Set(calendarInfos.keys());
			const newGroupIds = new Set(calendarMemberships.map((m) => m.group));
			const diff = symmetricDifference(oldGroupIds, newGroupIds);
			if (diff.size !== 0) this.calendarInfos.reload();
		} else if (isUpdateForTypeRef(GroupInfoTypeRef, entityEventData)) {
			for (const { groupInfo } of calendarInfos.values()) if (isUpdateFor(groupInfo, entityEventData)) {
				this.calendarInfos.reload();
				break;
			}
		}
		if (!isApp()) {
			const pushIdentifier = this.pushService?.getLoadedPushIdentifier();
			if (pushIdentifier && pushIdentifier.disabled) return console.log("Push identifier disabled. Skipping alarm schedule");
		}
		for (const userAlarmInfo of alarmEventsToProcess) {
			const { listId, elementId } = userAlarmInfo.alarmInfo.calendarRef;
			const deferredEvent = this.getPendingAlarmRequest(elementId);
			deferredEvent.deferred.promise = deferredEvent.deferred.promise.then(async () => {
				deferredEvent.pendingAlarmCounter--;
				if (deferredEvent.pendingAlarmCounter === 0) this.pendingAlarmRequests.delete(elementId);
				const calendarEvent = await this.entityClient.load(CalendarEventTypeRef, [listId, elementId]);
				const scheduler = await this.alarmScheduler();
				try {
					this.scheduleUserAlarmInfo(calendarEvent, userAlarmInfo, scheduler);
				} catch (e) {
					if (e instanceof NotFoundError) console.log(TAG, "event not found", [listId, elementId]);
else throw e;
				}
			});
		}
	}
	getPendingAlarmRequest(elementId) {
		return getFromMap(this.pendingAlarmRequests, elementId, () => ({
			pendingAlarmCounter: 0,
			deferred: defer()
		}));
	}
	localAlarmsEnabled() {
		return !isApp() && !isDesktop() && this.logins.isInternalUserLoggedIn() && !this.logins.isEnabled(FeatureType.DisableCalendar);
	}
	scheduleUserAlarmInfo(event, userAlarmInfo, scheduler) {
		this.userAlarmToAlarmInfo.set(getElementId(userAlarmInfo), userAlarmInfo.alarmInfo.alarmIdentifier);
		scheduler.scheduleAlarm(event, userAlarmInfo.alarmInfo, event.repeatRule, (eventTime, summary) => {
			const { title, body } = formatNotificationForDisplay(eventTime, summary);
			this.notifications.showNotification(NotificationType.Calendar, title, { body }, () => mithril_default.route.set("/calendar"));
		});
	}
	async cancelUserAlarmInfo(userAlarmInfoId) {
		const identifier = this.userAlarmToAlarmInfo.get(userAlarmInfoId);
		if (identifier) {
			const alarmScheduler = await this.alarmScheduler();
			alarmScheduler.cancelAlarm(identifier);
		}
	}
	getFileIdToSkippedCalendarEventUpdates() {
		return this.fileIdToSkippedCalendarEventUpdates;
	}
	getBirthdayEventTitle(contactName) {
		return lang.get("birthdayEvent_title", { "{name}": contactName });
	}
	getAgeString(age) {
		return lang.get("birthdayEventAge_title", { "{age}": age });
	}
};
/** return false when the given events (representing the new and old version of the same event) are both long events
* or both short events, true otherwise */
async function didLongStateChange(newEvent, existingEvent, zone) {
	const { isLongEvent } = await import("./CalendarUtils2-chunk.js");
	return isLongEvent(newEvent, zone) !== isLongEvent(existingEvent, zone);
}
var NoOwnerEncSessionKeyForCalendarEventError = class extends TutanotaError {
	constructor(message) {
		super("NoOwnerEncSessionKeyForCalendarEventError", message);
	}
};
/**
* yield the given monitor one time and then switch to noOp monitors forever
*/
function* oneShotProgressMonitorGenerator(progressTracker, userController) {
	const workPerCalendar = 3;
	const totalWork = userController.getCalendarMemberships().length * workPerCalendar;
	const realMonitorId = progressTracker.registerMonitorSync(totalWork);
	const realMonitor = assertNotNull(progressTracker.getMonitor(realMonitorId));
	yield realMonitor;
	while (true) yield new NoopProgressMonitor();
}
function formatNotificationForDisplay(eventTime, summary) {
	let dateString;
	if (isSameDay(eventTime, new Date())) dateString = formatTime(eventTime);
else dateString = formatDateWithWeekdayAndTime(eventTime);
	const body = `${dateString} ${summary}`;
	return {
		body,
		title: body
	};
}
async function loadAllEvents(groupRoot) {
	return Promise.all([locator.entityClient.loadAll(CalendarEventTypeRef, groupRoot.longEvents), locator.entityClient.loadAll(CalendarEventTypeRef, groupRoot.shortEvents)]).then((results) => results.flat());
}

//#endregion
export { CalendarModel, assertEventValidity, formatNotificationForDisplay };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FsZW5kYXJNb2RlbC1jaHVuay5qcyIsIm5hbWVzIjpbImxvYWRGdW5jdGlvbjogbGF6eUFzeW5jPFQ+IiwiZGVmYXVsdFZhbHVlOiBUIiwiZXZlbnQ6IENhbGVuZGFyRXZlbnQiLCJtb25pdG9yOiBJUHJvZ3Jlc3NNb25pdG9yIiwibm90aWZpY2F0aW9uczogTm90aWZpY2F0aW9ucyIsImFsYXJtU2NoZWR1bGVyOiAoKSA9PiBQcm9taXNlPEFsYXJtU2NoZWR1bGVyPiIsImV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyIiwic2VydmljZUV4ZWN1dG9yOiBJU2VydmljZUV4ZWN1dG9yIiwibG9naW5zOiBMb2dpbkNvbnRyb2xsZXIiLCJwcm9ncmVzc1RyYWNrZXI6IFByb2dyZXNzVHJhY2tlciIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50IiwibWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWwiLCJjYWxlbmRhckZhY2FkZTogQ2FsZW5kYXJGYWNhZGUiLCJmaWxlQ29udHJvbGxlcjogRmlsZUNvbnRyb2xsZXIiLCJ6b25lOiBzdHJpbmciLCJleHRlcm5hbENhbGVuZGFyRmFjYWRlOiBFeHRlcm5hbENhbGVuZGFyRmFjYWRlIHwgbnVsbCIsImRldmljZUNvbmZpZzogRGV2aWNlQ29uZmlnIiwicHVzaFNlcnZpY2U6IE5hdGl2ZVB1c2hTZXJ2aWNlQXBwIHwgbnVsbCIsImFsYXJtSW5mb3M6IFJlYWRvbmx5QXJyYXk8QWxhcm1JbmZvVGVtcGxhdGU+IiwiZ3JvdXBSb290OiBDYWxlbmRhckdyb3VwUm9vdCIsIm5ld0V2ZW50OiBDYWxlbmRhckV2ZW50IiwibmV3QWxhcm1zOiBSZWFkb25seUFycmF5PEFsYXJtSW5mb1RlbXBsYXRlPiIsImV4aXN0aW5nRXZlbnQ6IENhbGVuZGFyRXZlbnQiLCJwcm9ncmVzc01vbml0b3I6IElQcm9ncmVzc01vbml0b3IiLCJub3RGb3VuZE1lbWJlcnNoaXBzOiBHcm91cE1lbWJlcnNoaXBbXSIsImdyb3VwSW5zdGFuY2VzOiBBcnJheTxbQ2FsZW5kYXJHcm91cFJvb3QsIEdyb3VwSW5mbywgR3JvdXBdPiIsImNhbGVuZGFySW5mb3M6IE1hcDxJZCwgQ2FsZW5kYXJJbmZvPiIsImdyb3VwU2V0dGluZ3MiLCJ1cmw6IHN0cmluZyIsImdyb3VwU2V0dGluZ3M6IEdyb3VwU2V0dGluZ3NbXSB8IG51bGwiLCJzeW5jSW50ZXJ2YWw6IG51bWJlciIsImxvbmdFcnJvck1lc3NhZ2U6IGJvb2xlYW4iLCJmb3JjZVN5bmM6IGJvb2xlYW4iLCJncm91cFJvb3RzUHJvbWlzZXM6IFByb21pc2U8Q2FsZW5kYXJHcm91cFJvb3Q+W10iLCJjYWxlbmRhckdyb3VwUm9vdHNMaXN0OiBDYWxlbmRhckdyb3VwUm9vdFtdIiwic2tpcHBlZENhbGVuZGFyczogTWFwPElkLCB7IGNhbGVuZGFyTmFtZTogc3RyaW5nOyBlcnJvcjogRXJyb3IgfT4iLCJwYXJzZWRFeHRlcm5hbEV2ZW50czogUGFyc2VkRXZlbnRbXSIsIm9wZXJhdGlvbnNMb2c6IHtcblx0XHRcdFx0c2tpcHBlZDogQ2FsZW5kYXJFdmVudFtdXG5cdFx0XHRcdHVwZGF0ZWQ6IENhbGVuZGFyRXZlbnRbXVxuXHRcdFx0XHRjcmVhdGVkOiBDYWxlbmRhckV2ZW50W11cblx0XHRcdFx0ZGVsZXRlZDogQ2FsZW5kYXJFdmVudFtdXG5cdFx0XHR9IiwiYTogQ2FsZW5kYXJFdmVudCIsImI6IENhbGVuZGFyRXZlbnQiLCJuYW1lOiBzdHJpbmciLCJjb2xvcjogc3RyaW5nIHwgbnVsbCIsImFsYXJtczogQWxhcm1JbnRlcnZhbFtdIiwic291cmNlVXJsOiBzdHJpbmcgfCBudWxsIiwiZXhpc3RpbmdFdmVudD86IENhbGVuZGFyRXZlbnQiLCJmaWxlSWQ6IElkVHVwbGUiLCJ1cGRhdGU6IENhbGVuZGFyRXZlbnRVcGRhdGUiLCJ1aWQ6IHN0cmluZyIsInNlbmRlcjogc3RyaW5nIiwiY2FsZW5kYXJEYXRhOiBQYXJzZWRDYWxlbmRhckRhdGEiLCJtZXRob2Q6IHN0cmluZyIsInVwZGF0ZUV2ZW50OiBSZXF1aXJlPFwidWlkXCIsIENhbGVuZGFyRXZlbnQ+IiwidXBkYXRlQWxhcm1zOiBBcnJheTxBbGFybUluZm9UZW1wbGF0ZT4iLCJ0YXJnZXQ6IENhbGVuZGFyRXZlbnRVaWRJbmRleEVudHJ5Iiwic2VudEJ5T3JnYW5pemVyOiBib29sZWFuIiwiZGJUYXJnZXQ6IENhbGVuZGFyRXZlbnRVaWRJbmRleEVudHJ5IiwiZGJFdmVudDogQ2FsZW5kYXJFdmVudEluc3RhbmNlIiwidXBkYXRlRXZlbnQ6IENhbGVuZGFyRXZlbnQiLCJhbGFybXM6IEFycmF5PEFsYXJtSW5mb1RlbXBsYXRlPiIsImRiRXZlbnQ6IENhbGVuZGFyRXZlbnQiLCJpY3NFdmVudDogQ2FsZW5kYXJFdmVudCIsInNjaGVkdWxlcjogQWxhcm1TY2hlZHVsZXIiLCJhbGFybUluZm9zOiBBcnJheTxJZFR1cGxlPiIsInVzZXI6IFVzZXIiLCJjYWxlbmRhcjogQ2FsZW5kYXJJbmZvIiwidXBkYXRlczogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGVEYXRhPiIsImV2ZW50T3duZXJHcm91cElkOiBJZCIsImFsYXJtRXZlbnRzVG9Qcm9jZXNzOiBVc2VyQWxhcm1JbmZvW10iLCJlbGVtZW50SWQ6IHN0cmluZyIsInVzZXJBbGFybUluZm86IFVzZXJBbGFybUluZm8iLCJ1c2VyQWxhcm1JbmZvSWQ6IElkIiwiY29udGFjdE5hbWU6IHN0cmluZyIsImFnZTogbnVtYmVyIiwibWVzc2FnZTogc3RyaW5nIiwidXNlckNvbnRyb2xsZXI6IFVzZXJDb250cm9sbGVyIiwiZXZlbnRUaW1lOiBEYXRlIiwic3VtbWFyeTogc3RyaW5nIiwiZGF0ZVN0cmluZzogc3RyaW5nIl0sInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL09ic2VydmFibGVMYXp5TG9hZGVkLnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9tb2RlbC9DYWxlbmRhck1vZGVsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGxhenlBc3luYywgTGF6eUxvYWRlZCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuXG5leHBvcnQgY2xhc3MgT2JzZXJ2YWJsZUxhenlMb2FkZWQ8VD4ge1xuXHRwcml2YXRlIGxhenlMb2FkZWQ6IExhenlMb2FkZWQ8VD5cblx0cmVhZG9ubHkgc3RyZWFtOiBTdHJlYW08VD4gPSBzdHJlYW0oKVxuXG5cdGNvbnN0cnVjdG9yKGxvYWRGdW5jdGlvbjogbGF6eUFzeW5jPFQ+LCBwcml2YXRlIHJlYWRvbmx5IGRlZmF1bHRWYWx1ZTogVCkge1xuXHRcdHRoaXMubGF6eUxvYWRlZCA9IG5ldyBMYXp5TG9hZGVkPFQ+KGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IHZhbHVlID0gYXdhaXQgbG9hZEZ1bmN0aW9uKClcblx0XHRcdHRoaXMuc3RyZWFtKHZhbHVlKVxuXHRcdFx0cmV0dXJuIHZhbHVlXG5cdFx0fSwgZGVmYXVsdFZhbHVlKVxuXG5cdFx0dGhpcy5zdHJlYW0oZGVmYXVsdFZhbHVlKVxuXHR9XG5cblx0Z2V0QXN5bmMoKTogUHJvbWlzZTxUPiB7XG5cdFx0cmV0dXJuIHRoaXMubGF6eUxvYWRlZC5nZXRBc3luYygpXG5cdH1cblxuXHRpc0xvYWRlZCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5sYXp5TG9hZGVkLmlzTG9hZGVkKClcblx0fVxuXG5cdGdldExvYWRlZCgpOiBUIHtcblx0XHRyZXR1cm4gdGhpcy5sYXp5TG9hZGVkLmdldExvYWRlZCgpXG5cdH1cblxuXHQvKiogcmVzZXQgJiByZWxvYWQgdGhlIGlubmVyIGxhenlMb2FkZWQgd2l0aG91dCBhbiBvYnNlcnZhYmxlIGRlZmF1bHQgc3RhdGUgdW5sZXNzIGxvYWRpbmcgZmFpbHMgKi9cblx0YXN5bmMgcmVsb2FkKCk6IFByb21pc2U8VD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy5sYXp5TG9hZGVkLnJlbG9hZCgpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0dGhpcy5sYXp5TG9hZGVkLnJlc2V0KClcblx0XHRcdHRoaXMuc3RyZWFtKHRoaXMuZGVmYXVsdFZhbHVlKVxuXHRcdFx0cmV0dXJuIHRoaXMuZGVmYXVsdFZhbHVlXG5cdFx0fVxuXHR9XG5cblx0cmVzZXQoKSB7XG5cdFx0dGhpcy5sYXp5TG9hZGVkLnJlc2V0KClcblx0XHR0aGlzLnN0cmVhbSh0aGlzLmRlZmF1bHRWYWx1ZSlcblx0fVxufVxuIiwiaW1wb3J0IHtcblx0JFByb21pc2FibGUsXG5cdGFzc2VydE5vdE51bGwsXG5cdGNsb25lLFxuXHRkZWVwRXF1YWwsXG5cdGRlZmVyLFxuXHREZWZlcnJlZE9iamVjdCxcblx0ZG93bmNhc3QsXG5cdGZpbHRlckludCxcblx0Z2V0RnJvbU1hcCxcblx0aXNTYW1lRGF5LFxuXHRSZXF1aXJlLFxuXHRzeW1tZXRyaWNEaWZmZXJlbmNlLFxufSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IENhbGVuZGFyTWV0aG9kLCBFWFRFUk5BTF9DQUxFTkRBUl9TWU5DX0lOVEVSVkFMLCBGZWF0dXJlVHlwZSwgT3BlcmF0aW9uVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBFdmVudENvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL0V2ZW50Q29udHJvbGxlclwiXG5pbXBvcnQge1xuXHRjcmVhdGVEYXRlV3JhcHBlcixcblx0Y3JlYXRlTWVtYmVyc2hpcFJlbW92ZURhdGEsXG5cdEdyb3VwLFxuXHRHcm91cEluZm8sXG5cdEdyb3VwSW5mb1R5cGVSZWYsXG5cdEdyb3VwTWVtYmVyc2hpcCxcblx0R3JvdXBUeXBlUmVmLFxuXHRVc2VyLFxuXHRVc2VyQWxhcm1JbmZvLFxuXHRVc2VyQWxhcm1JbmZvVHlwZVJlZixcbn0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7XG5cdENhbGVuZGFyRXZlbnQsXG5cdENhbGVuZGFyRXZlbnRUeXBlUmVmLFxuXHRDYWxlbmRhckV2ZW50VXBkYXRlLFxuXHRDYWxlbmRhckV2ZW50VXBkYXRlVHlwZVJlZixcblx0Q2FsZW5kYXJHcm91cFJvb3QsXG5cdENhbGVuZGFyR3JvdXBSb290VHlwZVJlZixcblx0Y3JlYXRlRGVmYXVsdEFsYXJtSW5mbyxcblx0Y3JlYXRlR3JvdXBTZXR0aW5ncyxcblx0RmlsZVR5cGVSZWYsXG5cdEdyb3VwU2V0dGluZ3MsXG5cdFVzZXJTZXR0aW5nc0dyb3VwUm9vdFR5cGVSZWYsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGlzQXBwLCBpc0Rlc2t0b3AgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB0eXBlIHsgTG9naW5Db250cm9sbGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Mb2dpbkNvbnRyb2xsZXJcIlxuaW1wb3J0IHsgTG9ja2VkRXJyb3IsIE5vdEF1dGhvcml6ZWRFcnJvciwgTm90Rm91bmRFcnJvciwgUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUmVzdEVycm9yXCJcbmltcG9ydCB0eXBlIHsgUGFyc2VkQ2FsZW5kYXJEYXRhLCBQYXJzZWRFdmVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvaW1wb3J0L0NhbGVuZGFySW1wb3J0ZXIuanNcIlxuaW1wb3J0IHsgUGFyc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvcGFyc2luZy9QYXJzZXJDb21iaW5hdG9yXCJcbmltcG9ydCB7IFByb2dyZXNzVHJhY2tlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vUHJvZ3Jlc3NUcmFja2VyXCJcbmltcG9ydCB0eXBlIHsgSVByb2dyZXNzTW9uaXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9Qcm9ncmVzc01vbml0b3JcIlxuaW1wb3J0IHsgTm9vcFByb2dyZXNzTW9uaXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9Qcm9ncmVzc01vbml0b3JcIlxuaW1wb3J0IHsgRW50aXR5Q2xpZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudGl0eUNsaWVudFwiXG5pbXBvcnQgdHlwZSB7IE1haWxib3hNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWFpbEZ1bmN0aW9uYWxpdHkvTWFpbGJveE1vZGVsLmpzXCJcbmltcG9ydCB7IGVsZW1lbnRJZFBhcnQsIGdldEVsZW1lbnRJZCwgaXNTYW1lSWQsIGxpc3RJZFBhcnQsIHJlbW92ZVRlY2huaWNhbEZpZWxkcyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlsc1wiXG5pbXBvcnQgdHlwZSB7IEFsYXJtU2NoZWR1bGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0FsYXJtU2NoZWR1bGVyLmpzXCJcbmltcG9ydCB7IE5vdGlmaWNhdGlvbnMsIE5vdGlmaWNhdGlvblR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9Ob3RpZmljYXRpb25zXCJcbmltcG9ydCBtIGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB0eXBlIHsgQ2FsZW5kYXJFdmVudEluc3RhbmNlLCBDYWxlbmRhckV2ZW50UHJvZ2VuaXRvciwgQ2FsZW5kYXJGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0NhbGVuZGFyRmFjYWRlLmpzXCJcbmltcG9ydCB7XG5cdEFsYXJtSW5mb1RlbXBsYXRlLFxuXHRDYWNoaW5nTW9kZSxcblx0Q2FsZW5kYXJFdmVudEFsdGVyZWRJbnN0YW5jZSxcblx0Q2FsZW5kYXJFdmVudFVpZEluZGV4RW50cnksXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ2FsZW5kYXJGYWNhZGUuanNcIlxuaW1wb3J0IHsgSVNlcnZpY2VFeGVjdXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9TZXJ2aWNlUmVxdWVzdFwiXG5pbXBvcnQgeyBNZW1iZXJzaGlwU2VydmljZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3N5cy9TZXJ2aWNlc1wiXG5pbXBvcnQgeyBGaWxlQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZmlsZS9GaWxlQ29udHJvbGxlclwiXG5pbXBvcnQgeyBmaW5kQXR0ZW5kZWVJbkFkZHJlc3Nlcywgc2VyaWFsaXplQWxhcm1JbnRlcnZhbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9Db21tb25DYWxlbmRhclV0aWxzLmpzXCJcbmltcG9ydCB7IFR1dGFub3RhRXJyb3IgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLWVycm9yXCJcbmltcG9ydCB7IFNlc3Npb25LZXlOb3RGb3VuZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Nlc3Npb25LZXlOb3RGb3VuZEVycm9yLmpzXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7IE9ic2VydmFibGVMYXp5TG9hZGVkIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL09ic2VydmFibGVMYXp5TG9hZGVkLmpzXCJcbmltcG9ydCB7IFVzZXJDb250cm9sbGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Vc2VyQ29udHJvbGxlci5qc1wiXG5pbXBvcnQgeyBmb3JtYXREYXRlV2l0aFdlZWtkYXlBbmRUaW1lLCBmb3JtYXRUaW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0Zvcm1hdHRlci5qc1wiXG5pbXBvcnQgeyBFbnRpdHlVcGRhdGVEYXRhLCBpc1VwZGF0ZUZvciwgaXNVcGRhdGVGb3JUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVVwZGF0ZVV0aWxzLmpzXCJcbmltcG9ydCB7XG5cdEFsYXJtSW50ZXJ2YWwsXG5cdGFzc2lnbkV2ZW50SWQsXG5cdENhbGVuZGFyRXZlbnRWYWxpZGl0eSxcblx0Y2hlY2tFdmVudFZhbGlkaXR5LFxuXHRnZXRUaW1lWm9uZSxcblx0aGFzU291cmNlVXJsLFxufSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBpc1NoYXJlZEdyb3VwT3duZXIsIGxvYWRHcm91cE1lbWJlcnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL3NoYXJpbmcvR3JvdXBVdGlscy5qc1wiXG5pbXBvcnQgeyBFeHRlcm5hbENhbGVuZGFyRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9FeHRlcm5hbENhbGVuZGFyRmFjYWRlLmpzXCJcbmltcG9ydCB7IERldmljZUNvbmZpZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9EZXZpY2VDb25maWcuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBFdmVudEltcG9ydFJlamVjdGlvblJlYXNvbiwgcGFyc2VDYWxlbmRhclN0cmluZ0RhdGEsIHNvcnRPdXRQYXJzZWRFdmVudHMsIFN5bmNTdGF0dXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2ltcG9ydC9JbXBvcnRFeHBvcnRVdGlscy5qc1wiXG5pbXBvcnQgeyBVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL1VzZXJFcnJvci5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IE5hdGl2ZVB1c2hTZXJ2aWNlQXBwIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9uYXRpdmUvbWFpbi9OYXRpdmVQdXNoU2VydmljZUFwcC5qc1wiXG5cbmNvbnN0IFRBRyA9IFwiW0NhbGVuZGFyTW9kZWxdXCJcbmV4cG9ydCB0eXBlIENhbGVuZGFySW5mbyA9IHtcblx0Z3JvdXBSb290OiBDYWxlbmRhckdyb3VwUm9vdFxuXHRncm91cEluZm86IEdyb3VwSW5mb1xuXHRncm91cDogR3JvdXBcblx0c2hhcmVkOiBib29sZWFuXG5cdHVzZXJJc093bmVyOiBib29sZWFuXG5cdGlzRXh0ZXJuYWw6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEV2ZW50VmFsaWRpdHkoZXZlbnQ6IENhbGVuZGFyRXZlbnQpIHtcblx0c3dpdGNoIChjaGVja0V2ZW50VmFsaWRpdHkoZXZlbnQpKSB7XG5cdFx0Y2FzZSBDYWxlbmRhckV2ZW50VmFsaWRpdHkuSW52YWxpZENvbnRhaW5zSW52YWxpZERhdGU6XG5cdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwiaW52YWxpZERhdGVfbXNnXCIpXG5cdFx0Y2FzZSBDYWxlbmRhckV2ZW50VmFsaWRpdHkuSW52YWxpZEVuZEJlZm9yZVN0YXJ0OlxuXHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihcInN0YXJ0QWZ0ZXJFbmRfbGFiZWxcIilcblx0XHRjYXNlIENhbGVuZGFyRXZlbnRWYWxpZGl0eS5JbnZhbGlkUHJlMTk3MDpcblx0XHRcdC8vIHNob3VsZG4ndCBoYXBwZW4gd2hpbGUgdGhlIGNoZWNrIGluIHNldFN0YXJ0RGF0ZSBpcyBzdGlsbCB0aGVyZSwgcmVzZXR0aW5nIHRoZSBkYXRlIGVhY2ggdGltZVxuXHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihcInByZTE5NzBTdGFydF9tc2dcIilcblx0XHRjYXNlIENhbGVuZGFyRXZlbnRWYWxpZGl0eS5WYWxpZDpcblx0XHQvLyBldmVudCBpcyB2YWxpZCwgbm90aGluZyB0byBkb1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBDYWxlbmRhck1vZGVsIHtcblx0LyoqXG5cdCAqIE1hcCBmcm9tIGNhbGVuZGFyIGV2ZW50IGVsZW1lbnQgaWQgdG8gdGhlIGRlZmVycmVkIG9iamVjdCB3aXRoIGEgcHJvbWlzZSBvZiBnZXR0aW5nIENSRUFURSBldmVudCBmb3IgdGhpcyBjYWxlbmRhciBldmVudC4gV2UgbmVlZCB0byBkbyB0aGF0IGJlY2F1c2Vcblx0ICogZW50aXR5IHVwZGF0ZXMgZm9yIENhbGVuZGFyRXZlbnQgYW5kIFVzZXJBbGFybUluZm8gY29tZSBpbiBkaWZmZXJlbnQgYmF0Y2hlcyBhbmQgd2UgbmVlZCB0byB3YWl0IGZvciB0aGUgZXZlbnQgd2hlbiB3ZSB3YW50IHRvIHByb2Nlc3MgbmV3IGFsYXJtLlxuXHQgKlxuXHQgKiBXZSB1c2UgdGhlIGNvdW50ZXIgdG8gcmVtb3ZlIHRoZSBwZW5kaW5nIHJlcXVlc3QgZnJvbSBtYXAgd2hlbiBhbGwgYWxhcm1zIGFyZSBwcm9jZXNzZWQuIFdlIHdhbnQgdG8gZG8gdGhhdCBpbiBjYXNlIHRoZSBldmVudCBnZXRzIHVwZGF0ZWQgYW5kIHdlIG5lZWRcblx0ICogdG8gd2FpdCBmb3IgdGhlIG5ldyB2ZXJzaW9uIG9mIHRoZSBldmVudC5cblx0ICovXG5cdHByaXZhdGUgcGVuZGluZ0FsYXJtUmVxdWVzdHM6IE1hcDxcblx0XHRzdHJpbmcsXG5cdFx0e1xuXHRcdFx0cGVuZGluZ0FsYXJtQ291bnRlcjogbnVtYmVyXG5cdFx0XHRkZWZlcnJlZDogRGVmZXJyZWRPYmplY3Q8dm9pZD5cblx0XHR9XG5cdD4gPSBuZXcgTWFwKClcblx0cHJpdmF0ZSByZWFkb25seSB1c2VyQWxhcm1Ub0FsYXJtSW5mbzogTWFwPHN0cmluZywgc3RyaW5nPiA9IG5ldyBNYXAoKVxuXHRwcml2YXRlIHJlYWRvbmx5IGZpbGVJZFRvU2tpcHBlZENhbGVuZGFyRXZlbnRVcGRhdGVzOiBNYXA8SWQsIENhbGVuZGFyRXZlbnRVcGRhdGU+ID0gbmV3IE1hcCgpXG5cblx0cHJpdmF0ZSByZWFkUHJvZ3Jlc3NNb25pdG9yOiBHZW5lcmF0b3I8SVByb2dyZXNzTW9uaXRvcj5cblxuXHQvKipcblx0ICogTWFwIGZyb20gZ3JvdXAgaWQgdG8gQ2FsZW5kYXJJbmZvXG5cdCAqL1xuXHRwcml2YXRlIHJlYWRvbmx5IGNhbGVuZGFySW5mb3MgPSBuZXcgT2JzZXJ2YWJsZUxhenlMb2FkZWQ8UmVhZG9ubHlNYXA8SWQsIENhbGVuZGFySW5mbz4+KCgpID0+IHtcblx0XHRjb25zdCBtb25pdG9yOiBJUHJvZ3Jlc3NNb25pdG9yID0gdGhpcy5yZWFkUHJvZ3Jlc3NNb25pdG9yLm5leHQoKS52YWx1ZVxuXHRcdGNvbnN0IGNhbGVuZGFySW5mb1Byb21pc2UgPSB0aGlzLmxvYWRPckNyZWF0ZUNhbGVuZGFySW5mbyhtb25pdG9yKVxuXHRcdG1vbml0b3IuY29tcGxldGVkKClcblx0XHRyZXR1cm4gY2FsZW5kYXJJbmZvUHJvbWlzZVxuXHR9LCBuZXcgTWFwKCkpXG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSBub3RpZmljYXRpb25zOiBOb3RpZmljYXRpb25zLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgYWxhcm1TY2hlZHVsZXI6ICgpID0+IFByb21pc2U8QWxhcm1TY2hlZHVsZXI+LFxuXHRcdGV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgc2VydmljZUV4ZWN1dG9yOiBJU2VydmljZUV4ZWN1dG9yLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbG9naW5zOiBMb2dpbkNvbnRyb2xsZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBwcm9ncmVzc1RyYWNrZXI6IFByb2dyZXNzVHJhY2tlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWwsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjYWxlbmRhckZhY2FkZTogQ2FsZW5kYXJGYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBmaWxlQ29udHJvbGxlcjogRmlsZUNvbnRyb2xsZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSB6b25lOiBzdHJpbmcsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBleHRlcm5hbENhbGVuZGFyRmFjYWRlOiBFeHRlcm5hbENhbGVuZGFyRmFjYWRlIHwgbnVsbCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGRldmljZUNvbmZpZzogRGV2aWNlQ29uZmlnLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgcHVzaFNlcnZpY2U6IE5hdGl2ZVB1c2hTZXJ2aWNlQXBwIHwgbnVsbCxcblx0KSB7XG5cdFx0dGhpcy5yZWFkUHJvZ3Jlc3NNb25pdG9yID0gb25lU2hvdFByb2dyZXNzTW9uaXRvckdlbmVyYXRvcihwcm9ncmVzc1RyYWNrZXIsIGxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpKVxuXHRcdGV2ZW50Q29udHJvbGxlci5hZGRFbnRpdHlMaXN0ZW5lcigodXBkYXRlcywgZXZlbnRPd25lckdyb3VwSWQpID0+IHRoaXMuZW50aXR5RXZlbnRzUmVjZWl2ZWQodXBkYXRlcywgZXZlbnRPd25lckdyb3VwSWQpKVxuXHR9XG5cblx0Z2V0Q2FsZW5kYXJJbmZvcygpOiBQcm9taXNlPFJlYWRvbmx5TWFwPElkLCBDYWxlbmRhckluZm8+PiB7XG5cdFx0cmV0dXJuIHRoaXMuY2FsZW5kYXJJbmZvcy5nZXRBc3luYygpXG5cdH1cblxuXHRnZXRDYWxlbmRhckluZm9zU3RyZWFtKCk6IFN0cmVhbTxSZWFkb25seU1hcDxJZCwgQ2FsZW5kYXJJbmZvPj4ge1xuXHRcdHJldHVybiB0aGlzLmNhbGVuZGFySW5mb3Muc3RyZWFtXG5cdH1cblxuXHRhc3luYyBjcmVhdGVFdmVudChldmVudDogQ2FsZW5kYXJFdmVudCwgYWxhcm1JbmZvczogUmVhZG9ubHlBcnJheTxBbGFybUluZm9UZW1wbGF0ZT4sIHpvbmU6IHN0cmluZywgZ3JvdXBSb290OiBDYWxlbmRhckdyb3VwUm9vdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGF3YWl0IHRoaXMuZG9DcmVhdGUoZXZlbnQsIHpvbmUsIGdyb3VwUm9vdCwgYWxhcm1JbmZvcylcblx0fVxuXG5cdC8qKiBVcGRhdGUgZXhpc3RpbmcgZXZlbnQgd2hlbiB0aW1lIGRpZCBub3QgY2hhbmdlICovXG5cdGFzeW5jIHVwZGF0ZUV2ZW50KFxuXHRcdG5ld0V2ZW50OiBDYWxlbmRhckV2ZW50LFxuXHRcdG5ld0FsYXJtczogUmVhZG9ubHlBcnJheTxBbGFybUluZm9UZW1wbGF0ZT4sXG5cdFx0em9uZTogc3RyaW5nLFxuXHRcdGdyb3VwUm9vdDogQ2FsZW5kYXJHcm91cFJvb3QsXG5cdFx0ZXhpc3RpbmdFdmVudDogQ2FsZW5kYXJFdmVudCxcblx0KTogUHJvbWlzZTxDYWxlbmRhckV2ZW50PiB7XG5cdFx0aWYgKGV4aXN0aW5nRXZlbnQuX2lkID09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZXhpc3RpbmcgZXZlbnQgZm9yIHVwZGF0ZTogbm8gaWRcIilcblx0XHR9XG5cblx0XHRpZiAoZXhpc3RpbmdFdmVudC51aWQgIT0gbnVsbCAmJiBuZXdFdmVudC51aWQgIT09IGV4aXN0aW5nRXZlbnQudWlkKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGV4aXN0aW5nIGV2ZW50IGZvciB1cGRhdGU6IG1pc21hdGNoZWQgdWlkcy5cIilcblx0XHR9XG5cblx0XHQvLyBpbiBjYXNlcyB3aGVyZSBzdGFydCB0aW1lIG9yIGNhbGVuZGFyIGNoYW5nZWQsIHdlIG5lZWQgdG8gY2hhbmdlIHRoZSBldmVudCBpZCBhbmQgc28gbmVlZCB0byBkZWxldGUvcmVjcmVhdGUuXG5cdFx0Ly8gaXQncyBhbHNvIHBvc3NpYmxlIHRoYXQgdGhlIGV2ZW50IGhhcyB0byBiZSBtb3ZlZCBmcm9tIHRoZSBsb25nIGV2ZW50IGxpc3QgdG8gdGhlIHNob3J0IGV2ZW50IGxpc3Qgb3IgdmljZSB2ZXJzYS5cblx0XHRpZiAoXG5cdFx0XHRleGlzdGluZ0V2ZW50Ll9vd25lckdyb3VwICE9PSBncm91cFJvb3QuX2lkIHx8XG5cdFx0XHRuZXdFdmVudC5zdGFydFRpbWUuZ2V0VGltZSgpICE9PSBleGlzdGluZ0V2ZW50LnN0YXJ0VGltZS5nZXRUaW1lKCkgfHxcblx0XHRcdChhd2FpdCBkaWRMb25nU3RhdGVDaGFuZ2UobmV3RXZlbnQsIGV4aXN0aW5nRXZlbnQsIHpvbmUpKVxuXHRcdCkge1xuXHRcdFx0Ly8gV2Ugc2hvdWxkIHJlbG9hZCB0aGUgaW5zdGFuY2UgaGVyZSBiZWNhdXNlIHNlc3Npb24ga2V5IGFuZCBwZXJtaXNzaW9ucyBhcmUgdXBkYXRlZCB3aGVuIHdlIHJlY3JlYXRlIGV2ZW50LlxuXHRcdFx0YXdhaXQgdGhpcy5kb0NyZWF0ZShuZXdFdmVudCwgem9uZSwgZ3JvdXBSb290LCBuZXdBbGFybXMsIGV4aXN0aW5nRXZlbnQpXG5cdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZDxDYWxlbmRhckV2ZW50PihDYWxlbmRhckV2ZW50VHlwZVJlZiwgbmV3RXZlbnQuX2lkKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRuZXdFdmVudC5fb3duZXJHcm91cCA9IGdyb3VwUm9vdC5faWRcblx0XHRcdC8vIFdlIGNhbid0IGxvYWQgdXBkYXRlZCBldmVudCBoZXJlIGJlY2F1c2UgY2FjaGUgaXMgbm90IHVwZGF0ZWQgeWV0LiBXZSBhbHNvIHNob3VsZG4ndCBuZWVkIHRvIGxvYWQgaXQsIHdlIGhhdmUgdGhlIGxhdGVzdFxuXHRcdFx0Ly8gdmVyc2lvblxuXHRcdFx0YXdhaXQgdGhpcy5jYWxlbmRhckZhY2FkZS51cGRhdGVDYWxlbmRhckV2ZW50KG5ld0V2ZW50LCBuZXdBbGFybXMsIGV4aXN0aW5nRXZlbnQpXG5cdFx0XHRyZXR1cm4gbmV3RXZlbnRcblx0XHR9XG5cdH1cblxuXHQvKiogTG9hZCBtYXAgZnJvbSBncm91cC9ncm91cFJvb3QgSUQgdG8gdGhlIGNhbGVuZGFyIGluZm8gKi9cblx0cHJpdmF0ZSBhc3luYyBsb2FkQ2FsZW5kYXJJbmZvcyhwcm9ncmVzc01vbml0b3I6IElQcm9ncmVzc01vbml0b3IpOiBQcm9taXNlPFJlYWRvbmx5TWFwPElkLCBDYWxlbmRhckluZm8+PiB7XG5cdFx0Y29uc3QgdXNlckNvbnRyb2xsZXIgPSB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpXG5cblx0XHRjb25zdCBub3RGb3VuZE1lbWJlcnNoaXBzOiBHcm91cE1lbWJlcnNoaXBbXSA9IFtdXG5cdFx0Y29uc3QgZ3JvdXBJbnN0YW5jZXM6IEFycmF5PFtDYWxlbmRhckdyb3VwUm9vdCwgR3JvdXBJbmZvLCBHcm91cF0+ID0gW11cblx0XHRmb3IgKGNvbnN0IG1lbWJlcnNoaXAgb2YgdXNlckNvbnRyb2xsZXIuZ2V0Q2FsZW5kYXJNZW1iZXJzaGlwcygpKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLmFsbChbXG5cdFx0XHRcdFx0dGhpcy5lbnRpdHlDbGllbnQubG9hZChDYWxlbmRhckdyb3VwUm9vdFR5cGVSZWYsIG1lbWJlcnNoaXAuZ3JvdXApLFxuXHRcdFx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoR3JvdXBJbmZvVHlwZVJlZiwgbWVtYmVyc2hpcC5ncm91cEluZm8pLFxuXHRcdFx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoR3JvdXBUeXBlUmVmLCBtZW1iZXJzaGlwLmdyb3VwKSxcblx0XHRcdFx0XSlcblx0XHRcdFx0Z3JvdXBJbnN0YW5jZXMucHVzaChyZXN1bHQpXG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHRcdG5vdEZvdW5kTWVtYmVyc2hpcHMucHVzaChtZW1iZXJzaGlwKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cHJvZ3Jlc3NNb25pdG9yLndvcmtEb25lKDMpXG5cdFx0fVxuXG5cdFx0Y29uc3QgY2FsZW5kYXJJbmZvczogTWFwPElkLCBDYWxlbmRhckluZm8+ID0gbmV3IE1hcCgpXG5cdFx0Y29uc3QgZ3JvdXBTZXR0aW5ncyA9IHVzZXJDb250cm9sbGVyLnVzZXJTZXR0aW5nc0dyb3VwUm9vdC5ncm91cFNldHRpbmdzXG5cdFx0Zm9yIChjb25zdCBbZ3JvdXBSb290LCBncm91cEluZm8sIGdyb3VwXSBvZiBncm91cEluc3RhbmNlcykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgZ3JvdXBNZW1iZXJzID0gYXdhaXQgbG9hZEdyb3VwTWVtYmVycyhncm91cCwgdGhpcy5lbnRpdHlDbGllbnQpXG5cdFx0XHRcdGNvbnN0IHNoYXJlZCA9IGdyb3VwTWVtYmVycy5sZW5ndGggPiAxXG5cdFx0XHRcdGNvbnN0IHVzZXJJc093bmVyID0gIXNoYXJlZCB8fCBpc1NoYXJlZEdyb3VwT3duZXIoZ3JvdXAsIHVzZXJDb250cm9sbGVyLnVzZXJJZClcblx0XHRcdFx0Y29uc3QgaXNFeHRlcm5hbCA9IGhhc1NvdXJjZVVybChncm91cFNldHRpbmdzLmZpbmQoKGdyb3VwU2V0dGluZ3MpID0+IGdyb3VwU2V0dGluZ3MuZ3JvdXAgPT09IGdyb3VwLl9pZCkpXG5cdFx0XHRcdGNhbGVuZGFySW5mb3Muc2V0KGdyb3VwUm9vdC5faWQsIHtcblx0XHRcdFx0XHRncm91cFJvb3QsXG5cdFx0XHRcdFx0Z3JvdXBJbmZvLFxuXHRcdFx0XHRcdGdyb3VwOiBncm91cCxcblx0XHRcdFx0XHRzaGFyZWQsXG5cdFx0XHRcdFx0dXNlcklzT3duZXIsXG5cdFx0XHRcdFx0aXNFeHRlcm5hbCxcblx0XHRcdFx0fSlcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBOb3RBdXRob3JpemVkRXJyb3IpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIk5vdEF1dGhvcml6ZWRFcnJvciB3aGVuIGluaXRpYWxpemluZyBjYWxlbmRhci4gQ2FsZW5kYXIgaGFzIGJlZW4gcmVtb3ZlZCBcIilcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aHJvdyBlXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBjbGVhbnVwIGluY29uc2lzdGVudCBtZW1iZXJzaGlwc1xuXHRcdGZvciAoY29uc3QgbWVtYmVyc2hpcCBvZiBub3RGb3VuZE1lbWJlcnNoaXBzKSB7XG5cdFx0XHQvLyBub2luc3BlY3Rpb24gRVM2TWlzc2luZ0F3YWl0XG5cdFx0XHR0aGlzLnNlcnZpY2VFeGVjdXRvclxuXHRcdFx0XHQuZGVsZXRlKFxuXHRcdFx0XHRcdE1lbWJlcnNoaXBTZXJ2aWNlLFxuXHRcdFx0XHRcdGNyZWF0ZU1lbWJlcnNoaXBSZW1vdmVEYXRhKHtcblx0XHRcdFx0XHRcdHVzZXI6IHVzZXJDb250cm9sbGVyLnVzZXJJZCxcblx0XHRcdFx0XHRcdGdyb3VwOiBtZW1iZXJzaGlwLmdyb3VwLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpXG5cdFx0XHRcdC5jYXRjaCgoZSkgPT4gY29uc29sZS5sb2coXCJlcnJvciBjbGVhbmluZyB1cCBtZW1iZXJzaGlwIGZvciBncm91cDogXCIsIG1lbWJlcnNoaXAuZ3JvdXApKVxuXHRcdH1cblx0XHRyZXR1cm4gY2FsZW5kYXJJbmZvc1xuXHR9XG5cblx0cHVibGljIGFzeW5jIGZldGNoRXh0ZXJuYWxDYWxlbmRhcih1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0aWYgKCF0aGlzLmV4dGVybmFsQ2FsZW5kYXJGYWNhZGUpIHRocm93IG5ldyBFcnJvcihgZXh0ZXJuYWxDYWxlbmRhckZhY2FkZSBpcyAke3R5cGVvZiB0aGlzLmV4dGVybmFsQ2FsZW5kYXJGYWNhZGV9IGF0IENhbGVuZGFyTW9kZWxgKVxuXHRcdGNvbnN0IGNhbGVuZGFyU3RyID0gYXdhaXQgdGhpcy5leHRlcm5hbENhbGVuZGFyRmFjYWRlPy5mZXRjaEV4dGVybmFsQ2FsZW5kYXIodXJsKVxuXHRcdHJldHVybiBjYWxlbmRhclN0ciA/PyBcIlwiXG5cdH1cblxuXHRwdWJsaWMgc2NoZWR1bGVFeHRlcm5hbENhbGVuZGFyU3luYygpIHtcblx0XHRzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHR0aGlzLnN5bmNFeHRlcm5hbENhbGVuZGFycygpLmNhdGNoKChlKSA9PiBjb25zb2xlLmVycm9yKGUubWVzc2FnZSkpXG5cdFx0fSwgRVhURVJOQUxfQ0FMRU5EQVJfU1lOQ19JTlRFUlZBTClcblx0fVxuXG5cdHB1YmxpYyBhc3luYyBzeW5jRXh0ZXJuYWxDYWxlbmRhcnMoXG5cdFx0Z3JvdXBTZXR0aW5nczogR3JvdXBTZXR0aW5nc1tdIHwgbnVsbCA9IG51bGwsXG5cdFx0c3luY0ludGVydmFsOiBudW1iZXIgPSBFWFRFUk5BTF9DQUxFTkRBUl9TWU5DX0lOVEVSVkFMLFxuXHRcdGxvbmdFcnJvck1lc3NhZ2U6IGJvb2xlYW4gPSBmYWxzZSxcblx0XHRmb3JjZVN5bmM6IGJvb2xlYW4gPSBmYWxzZSxcblx0KSB7XG5cdFx0aWYgKCF0aGlzLmV4dGVybmFsQ2FsZW5kYXJGYWNhZGUgfHwgIWxvY2F0b3IubG9naW5zLmlzRnVsbHlMb2dnZWRJbigpKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHRsZXQgZXhpc3RpbmdHcm91cFNldHRpbmdzID0gZ3JvdXBTZXR0aW5nc1xuXHRcdGNvbnN0IHVzZXJDb250cm9sbGVyID0gdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKVxuXG5cdFx0Y29uc3QgZ3JvdXBSb290c1Byb21pc2VzOiBQcm9taXNlPENhbGVuZGFyR3JvdXBSb290PltdID0gW11cblx0XHRsZXQgY2FsZW5kYXJHcm91cFJvb3RzTGlzdDogQ2FsZW5kYXJHcm91cFJvb3RbXSA9IFtdXG5cdFx0Zm9yIChjb25zdCBtZW1iZXJzaGlwIG9mIHVzZXJDb250cm9sbGVyLmdldENhbGVuZGFyTWVtYmVyc2hpcHMoKSkge1xuXHRcdFx0Z3JvdXBSb290c1Byb21pc2VzLnB1c2godGhpcy5lbnRpdHlDbGllbnQubG9hZChDYWxlbmRhckdyb3VwUm9vdFR5cGVSZWYsIG1lbWJlcnNoaXAuZ3JvdXApKVxuXHRcdH1cblx0XHRjYWxlbmRhckdyb3VwUm9vdHNMaXN0ID0gYXdhaXQgUHJvbWlzZS5hbGwoZ3JvdXBSb290c1Byb21pc2VzKVxuXG5cdFx0aWYgKCFleGlzdGluZ0dyb3VwU2V0dGluZ3MpIHtcblx0XHRcdGNvbnN0IHsgZ3JvdXBTZXR0aW5nczogZ1NldHRpbmdzIH0gPSBhd2FpdCBsb2NhdG9yLmVudGl0eUNsaWVudC5sb2FkKFVzZXJTZXR0aW5nc0dyb3VwUm9vdFR5cGVSZWYsIHVzZXJDb250cm9sbGVyLnVzZXIudXNlckdyb3VwLmdyb3VwKVxuXHRcdFx0ZXhpc3RpbmdHcm91cFNldHRpbmdzID0gZ1NldHRpbmdzXG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2tpcHBlZENhbGVuZGFyczogTWFwPElkLCB7IGNhbGVuZGFyTmFtZTogc3RyaW5nOyBlcnJvcjogRXJyb3IgfT4gPSBuZXcgTWFwKClcblx0XHRmb3IgKGNvbnN0IHsgc291cmNlVXJsLCBncm91cCwgbmFtZSB9IG9mIGV4aXN0aW5nR3JvdXBTZXR0aW5ncykge1xuXHRcdFx0aWYgKCFzb3VyY2VVcmwpIHtcblx0XHRcdFx0Y29udGludWVcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgbGFzdFN5bmNFbnRyeSA9IHRoaXMuZGV2aWNlQ29uZmlnLmdldExhc3RFeHRlcm5hbENhbGVuZGFyU3luYygpLmdldChncm91cClcblx0XHRcdGNvbnN0IG9mZnNldCA9IDEwMDAgLy8gQWRkIGFuIG9mZnNldCB0byBhY2NvdW50IGZvciBjcHUgc3BlZWQgd2hlbiBzdG9yaW5nIG9yIGdlbmVyYXRpbmcgdGltZXN0YW1wc1xuXHRcdFx0Y29uc3Qgc2hvdWxkU2tpcFN5bmMgPVxuXHRcdFx0XHQhZm9yY2VTeW5jICYmXG5cdFx0XHRcdGxhc3RTeW5jRW50cnk/Lmxhc3RTeW5jU3RhdHVzID09PSBTeW5jU3RhdHVzLlN1Y2Nlc3MgJiZcblx0XHRcdFx0bGFzdFN5bmNFbnRyeS5sYXN0U3VjY2Vzc2Z1bFN5bmMgJiZcblx0XHRcdFx0RGF0ZS5ub3coKSArIG9mZnNldCAtIGxhc3RTeW5jRW50cnkubGFzdFN1Y2Nlc3NmdWxTeW5jIDwgc3luY0ludGVydmFsXG5cdFx0XHRpZiAoc2hvdWxkU2tpcFN5bmMpIGNvbnRpbnVlXG5cblx0XHRcdGNvbnN0IGN1cnJlbnRDYWxlbmRhckdyb3VwUm9vdCA9IGNhbGVuZGFyR3JvdXBSb290c0xpc3QuZmluZCgoY2FsZW5kYXJHcm91cFJvb3QpID0+IGlzU2FtZUlkKGNhbGVuZGFyR3JvdXBSb290Ll9pZCwgZ3JvdXApKSA/PyBudWxsXG5cdFx0XHRpZiAoIWN1cnJlbnRDYWxlbmRhckdyb3VwUm9vdCkge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBUcnlpbmcgdG8gc3luYyBhIGNhbGVuZGFyIHRoZSB1c2VyIGlzbid0IHN1YnNjcmliZWQgdG8gYW55bW9yZTogJHtncm91cH1gKVxuXHRcdFx0XHRjb250aW51ZVxuXHRcdFx0fVxuXG5cdFx0XHRsZXQgcGFyc2VkRXh0ZXJuYWxFdmVudHM6IFBhcnNlZEV2ZW50W10gPSBbXVxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgZXh0ZXJuYWxDYWxlbmRhciA9IGF3YWl0IHRoaXMuZmV0Y2hFeHRlcm5hbENhbGVuZGFyKHNvdXJjZVVybClcblx0XHRcdFx0cGFyc2VkRXh0ZXJuYWxFdmVudHMgPSBwYXJzZUNhbGVuZGFyU3RyaW5nRGF0YShleHRlcm5hbENhbGVuZGFyLCBnZXRUaW1lWm9uZSgpKS5jb250ZW50c1xuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0bGV0IGNhbGVuZGFyTmFtZSA9IG5hbWVcblx0XHRcdFx0aWYgKCFjYWxlbmRhck5hbWUpIHtcblx0XHRcdFx0XHRjb25zdCBjYWxlbmRhcnMgPSBhd2FpdCB0aGlzLmdldENhbGVuZGFySW5mb3MoKVxuXHRcdFx0XHRcdGNhbGVuZGFyTmFtZSA9IGNhbGVuZGFycy5nZXQoZ3JvdXApPy5ncm91cEluZm8ubmFtZSFcblx0XHRcdFx0fVxuXHRcdFx0XHRza2lwcGVkQ2FsZW5kYXJzLnNldChncm91cCwgeyBjYWxlbmRhck5hbWUsIGVycm9yIH0pXG5cdFx0XHRcdGNvbnRpbnVlXG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGV4aXN0aW5nRXZlbnRMaXN0ID0gYXdhaXQgbG9hZEFsbEV2ZW50cyhjdXJyZW50Q2FsZW5kYXJHcm91cFJvb3QpXG5cblx0XHRcdGNvbnN0IG9wZXJhdGlvbnNMb2c6IHtcblx0XHRcdFx0c2tpcHBlZDogQ2FsZW5kYXJFdmVudFtdXG5cdFx0XHRcdHVwZGF0ZWQ6IENhbGVuZGFyRXZlbnRbXVxuXHRcdFx0XHRjcmVhdGVkOiBDYWxlbmRhckV2ZW50W11cblx0XHRcdFx0ZGVsZXRlZDogQ2FsZW5kYXJFdmVudFtdXG5cdFx0XHR9ID0ge1xuXHRcdFx0XHRza2lwcGVkOiBbXSxcblx0XHRcdFx0dXBkYXRlZDogW10sXG5cdFx0XHRcdGNyZWF0ZWQ6IFtdLFxuXHRcdFx0XHRkZWxldGVkOiBbXSxcblx0XHRcdH1cblx0XHRcdC8qKlxuXHRcdFx0ICogU3luYyBzdHJhdGVneVxuXHRcdFx0ICogLSBSZXBsYWNlIGR1cGxpY2F0ZXNcblx0XHRcdCAqIC0gQWRkIG5ld1xuXHRcdFx0ICogLSBSZW1vdmUgcmVzdFxuXHRcdFx0ICovXG5cdFx0XHRjb25zdCB7IHJlamVjdGVkRXZlbnRzLCBldmVudHNGb3JDcmVhdGlvbiB9ID0gc29ydE91dFBhcnNlZEV2ZW50cyhwYXJzZWRFeHRlcm5hbEV2ZW50cywgZXhpc3RpbmdFdmVudExpc3QsIGN1cnJlbnRDYWxlbmRhckdyb3VwUm9vdCwgZ2V0VGltZVpvbmUoKSlcblx0XHRcdGNvbnN0IGR1cGxpY2F0ZXMgPSByZWplY3RlZEV2ZW50cy5nZXQoRXZlbnRJbXBvcnRSZWplY3Rpb25SZWFzb24uRHVwbGljYXRlKSA/PyBbXVxuXG5cdFx0XHQvLyBSZXBsYWNpbmcgZHVwbGljYXRlcyB3aXRoIGNoYW5nZXNcblx0XHRcdGZvciAoY29uc3QgZHVwbGljYXRlZEV2ZW50IG9mIGR1cGxpY2F0ZXMpIHtcblx0XHRcdFx0Y29uc3QgZXhpc3RpbmdFdmVudCA9IGV4aXN0aW5nRXZlbnRMaXN0LmZpbmQoKGV2ZW50KSA9PiBldmVudC51aWQgPT09IGR1cGxpY2F0ZWRFdmVudC51aWQpXG5cdFx0XHRcdGlmICghZXhpc3RpbmdFdmVudCkge1xuXHRcdFx0XHRcdGNvbnNvbGUud2FybihcIkZvdW5kIGEgZHVwbGljYXRlIHdpdGhvdXQgYW4gZXhpc3RpbmcgZXZlbnQhXCIpXG5cdFx0XHRcdFx0Y29udGludWVcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodGhpcy5ldmVudEhhc1NhbWVGaWVsZHMoZHVwbGljYXRlZEV2ZW50LCBleGlzdGluZ0V2ZW50KSkge1xuXHRcdFx0XHRcdG9wZXJhdGlvbnNMb2cuc2tpcHBlZC5wdXNoKGR1cGxpY2F0ZWRFdmVudClcblx0XHRcdFx0XHRjb250aW51ZVxuXHRcdFx0XHR9XG5cdFx0XHRcdGF3YWl0IHRoaXMudXBkYXRlRXZlbnRXaXRoRXh0ZXJuYWwoZXhpc3RpbmdFdmVudCwgZHVwbGljYXRlZEV2ZW50KVxuXHRcdFx0XHRvcGVyYXRpb25zTG9nLnVwZGF0ZWQucHVzaChkdXBsaWNhdGVkRXZlbnQpXG5cdFx0XHR9XG5cdFx0XHRjb25zb2xlLmxvZyhUQUcsIGAke29wZXJhdGlvbnNMb2cuc2tpcHBlZC5sZW5ndGh9IGV2ZW50cyBza2lwcGVkIChkdXBsaWNhdGlvbiB3aXRob3V0IGNoYW5nZXMpYClcblx0XHRcdGNvbnNvbGUubG9nKFRBRywgYCR7b3BlcmF0aW9uc0xvZy51cGRhdGVkLmxlbmd0aH0gZXZlbnRzIHVwZGF0ZWQgKGR1cGxpY2F0aW9uIHdpdGggY2hhbmdlcylgKVxuXG5cdFx0XHQvLyBBZGQgbmV3IGV2ZW50XG5cdFx0XHRmb3IgKGNvbnN0IHsgZXZlbnQgfSBvZiBldmVudHNGb3JDcmVhdGlvbikge1xuXHRcdFx0XHRhc3NpZ25FdmVudElkKGV2ZW50LCBnZXRUaW1lWm9uZSgpLCBjdXJyZW50Q2FsZW5kYXJHcm91cFJvb3QpXG5cdFx0XHRcdC8vIFJlc2V0IG93bmVyRW5jU2Vzc2lvbktleSBiZWNhdXNlIGl0IGNhbm5vdCBiZSBzZXQgZm9yIG5ldyBlbnRpdHksIGl0IHdpbGwgYmUgYXNzaWduZWQgYnkgdGhlIENyeXB0b0ZhY2FkZVxuXHRcdFx0XHRldmVudC5fb3duZXJFbmNTZXNzaW9uS2V5ID0gbnVsbFxuXG5cdFx0XHRcdGlmIChldmVudC5yZXBlYXRSdWxlICE9IG51bGwpIHtcblx0XHRcdFx0XHRldmVudC5yZXBlYXRSdWxlLmV4Y2x1ZGVkRGF0ZXMgPSBldmVudC5yZXBlYXRSdWxlLmV4Y2x1ZGVkRGF0ZXMubWFwKCh7IGRhdGUgfSkgPT4gY3JlYXRlRGF0ZVdyYXBwZXIoeyBkYXRlIH0pKVxuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIFJlc2V0IHBlcm1pc3Npb25zIGJlY2F1c2Ugc2VydmVyIHdpbGwgYXNzaWduIHRoZW1cblx0XHRcdFx0ZG93bmNhc3QoZXZlbnQpLl9wZXJtaXNzaW9ucyA9IG51bGxcblx0XHRcdFx0ZXZlbnQuX293bmVyR3JvdXAgPSBjdXJyZW50Q2FsZW5kYXJHcm91cFJvb3QuX2lkXG5cdFx0XHRcdGFzc2VydEV2ZW50VmFsaWRpdHkoZXZlbnQpXG5cdFx0XHRcdG9wZXJhdGlvbnNMb2cuY3JlYXRlZC5wdXNoKGV2ZW50KVxuXHRcdFx0fVxuXHRcdFx0YXdhaXQgdGhpcy5jYWxlbmRhckZhY2FkZS5zYXZlSW1wb3J0ZWRDYWxlbmRhckV2ZW50cyhldmVudHNGb3JDcmVhdGlvbiwgMClcblx0XHRcdGNvbnNvbGUubG9nKFRBRywgYCR7b3BlcmF0aW9uc0xvZy5jcmVhdGVkLmxlbmd0aH0gZXZlbnRzIGNyZWF0ZWRgKVxuXG5cdFx0XHQvLyBSZW1vdmUgcmVzdFxuXHRcdFx0Y29uc3QgZXZlbnRzVG9SZW1vdmUgPSBleGlzdGluZ0V2ZW50TGlzdC5maWx0ZXIoXG5cdFx0XHRcdChleGlzdGluZ0V2ZW50KSA9PiAhcGFyc2VkRXh0ZXJuYWxFdmVudHMuc29tZSgoZXh0ZXJuYWxFdmVudCkgPT4gZXh0ZXJuYWxFdmVudC5ldmVudC51aWQgPT09IGV4aXN0aW5nRXZlbnQudWlkKSxcblx0XHRcdClcblx0XHRcdGZvciAoY29uc3QgZXZlbnQgb2YgZXZlbnRzVG9SZW1vdmUpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5kZWxldGVFdmVudChldmVudCkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0XHRcdGlmIChlcnIgaW5zdGFuY2VvZiBOb3RGb3VuZEVycm9yKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gY29uc29sZS5sb2coYEFscmVhZHkgZGVsZXRlZCBldmVudGAsIGV2ZW50KVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHRocm93IGVyclxuXHRcdFx0XHR9KVxuXHRcdFx0XHRvcGVyYXRpb25zTG9nLmRlbGV0ZWQucHVzaChldmVudClcblx0XHRcdH1cblx0XHRcdGNvbnNvbGUubG9nKFRBRywgYCR7b3BlcmF0aW9uc0xvZy5kZWxldGVkLmxlbmd0aH0gZXZlbnRzIHJlbW92ZWRgKVxuXG5cdFx0XHR0aGlzLmRldmljZUNvbmZpZy51cGRhdGVMYXN0U3luYyhncm91cClcblx0XHR9XG5cblx0XHRpZiAoc2tpcHBlZENhbGVuZGFycy5zaXplKSB7XG5cdFx0XHRsZXQgZXJyb3JNZXNzYWdlID0gbGFuZy5nZXQoXCJpQ2FsU3luY19lcnJvclwiKSArIChsb25nRXJyb3JNZXNzYWdlID8gXCJcXG5cXG5cIiA6IFwiXCIpXG5cdFx0XHRmb3IgKGNvbnN0IFtncm91cCwgZGV0YWlsc10gb2Ygc2tpcHBlZENhbGVuZGFycy5lbnRyaWVzKCkpIHtcblx0XHRcdFx0aWYgKGxvbmdFcnJvck1lc3NhZ2UpIGVycm9yTWVzc2FnZSArPSBgJHtkZXRhaWxzLmNhbGVuZGFyTmFtZX0gLSAke2RldGFpbHMuZXJyb3IubWVzc2FnZX1cXG5gXG5cdFx0XHRcdHRoaXMuZGV2aWNlQ29uZmlnLnVwZGF0ZUxhc3RTeW5jKGdyb3VwLCBTeW5jU3RhdHVzLkZhaWxlZClcblx0XHRcdH1cblx0XHRcdHRocm93IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBldmVudEhhc1NhbWVGaWVsZHMoYTogQ2FsZW5kYXJFdmVudCwgYjogQ2FsZW5kYXJFdmVudCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHRhLnN0YXJ0VGltZS52YWx1ZU9mKCkgPT09IGIuc3RhcnRUaW1lLnZhbHVlT2YoKSAmJlxuXHRcdFx0YS5lbmRUaW1lLnZhbHVlT2YoKSA9PT0gYi5lbmRUaW1lLnZhbHVlT2YoKSAmJlxuXHRcdFx0ZGVlcEVxdWFsKHsgLi4uYS5hdHRlbmRlZXMgfSwgeyAuLi5iLmF0dGVuZGVlcyB9KSAmJlxuXHRcdFx0YS5zdW1tYXJ5ID09PSBiLnN1bW1hcnkgJiZcblx0XHRcdGEuc2VxdWVuY2UgPT09IGIuc2VxdWVuY2UgJiZcblx0XHRcdGEubG9jYXRpb24gPT09IGIubG9jYXRpb24gJiZcblx0XHRcdGEuZGVzY3JpcHRpb24gPT09IGIuZGVzY3JpcHRpb24gJiZcblx0XHRcdGRlZXBFcXVhbChhLm9yZ2FuaXplciwgYi5vcmdhbml6ZXIpICYmXG5cdFx0XHRkZWVwRXF1YWwoYS5yZXBlYXRSdWxlLCBiLnJlcGVhdFJ1bGUpICYmXG5cdFx0XHRhLnJlY3VycmVuY2VJZD8udmFsdWVPZigpID09PSBiLnJlY3VycmVuY2VJZD8udmFsdWVPZigpXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBsb2FkT3JDcmVhdGVDYWxlbmRhckluZm8ocHJvZ3Jlc3NNb25pdG9yOiBJUHJvZ3Jlc3NNb25pdG9yKTogUHJvbWlzZTxSZWFkb25seU1hcDxJZCwgQ2FsZW5kYXJJbmZvPj4ge1xuXHRcdGNvbnN0IHsgZmluZEZpcnN0UHJpdmF0ZUNhbGVuZGFyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhclV0aWxzLmpzXCIpXG5cdFx0Y29uc3QgY2FsZW5kYXJJbmZvcyA9IGF3YWl0IHRoaXMubG9hZENhbGVuZGFySW5mb3MocHJvZ3Jlc3NNb25pdG9yKVxuXG5cdFx0aWYgKCF0aGlzLmxvZ2lucy5pc0ludGVybmFsVXNlckxvZ2dlZEluKCkgfHwgZmluZEZpcnN0UHJpdmF0ZUNhbGVuZGFyKGNhbGVuZGFySW5mb3MpKSB7XG5cdFx0XHRyZXR1cm4gY2FsZW5kYXJJbmZvc1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRhd2FpdCB0aGlzLmNyZWF0ZUNhbGVuZGFyKFwiXCIsIG51bGwsIFtdLCBudWxsKVxuXHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMubG9hZENhbGVuZGFySW5mb3MocHJvZ3Jlc3NNb25pdG9yKVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGNyZWF0ZUNhbGVuZGFyKG5hbWU6IHN0cmluZywgY29sb3I6IHN0cmluZyB8IG51bGwsIGFsYXJtczogQWxhcm1JbnRlcnZhbFtdLCBzb3VyY2VVcmw6IHN0cmluZyB8IG51bGwpOiBQcm9taXNlPEdyb3VwPiB7XG5cdFx0Ly8gd2hlbiBhIGNhbGVuZGFyIGdyb3VwIGlzIGFkZGVkLCBhIGdyb3VwIG1lbWJlcnNoaXAgaXMgYWRkZWQgdG8gdGhlIHVzZXIuIHdlIG1pZ2h0IG1pc3MgdGhpcyB3ZWJzb2NrZXQgZXZlbnRcblx0XHQvLyBkdXJpbmcgc3RhcnR1cCBpZiB0aGUgd2Vic29ja2V0IGlzIG5vdCBjb25uZWN0ZWQgZmFzdCBlbm91Z2guIFRoZXJlZm9yZSwgd2UgZXhwbGljaXRseSB1cGRhdGUgdGhlIHVzZXJcblx0XHQvLyB0aGlzIHNob3VsZCBiZSByZW1vdmVkIG9uY2Ugd2UgaGFuZGxlIG1pc3NlZCBldmVudHMgZHVyaW5nIHN0YXJ0dXBcblx0XHRjb25zdCB7IHVzZXIsIGdyb3VwIH0gPSBhd2FpdCB0aGlzLmNhbGVuZGFyRmFjYWRlLmFkZENhbGVuZGFyKG5hbWUpXG5cdFx0dGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyID0gdXNlclxuXG5cdFx0Y29uc3Qgc2VyaWFsaXplZEFsYXJtcyA9IGFsYXJtcy5tYXAoKGFsYXJtKSA9PiBjcmVhdGVEZWZhdWx0QWxhcm1JbmZvKHsgdHJpZ2dlcjogc2VyaWFsaXplQWxhcm1JbnRlcnZhbChhbGFybSkgfSkpXG5cdFx0aWYgKGNvbG9yICE9IG51bGwpIHtcblx0XHRcdGNvbnN0IHsgdXNlclNldHRpbmdzR3JvdXBSb290IH0gPSB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpXG5cdFx0XHRjb25zdCBuZXdHcm91cFNldHRpbmdzID0gY3JlYXRlR3JvdXBTZXR0aW5ncyh7XG5cdFx0XHRcdGdyb3VwOiBncm91cC5faWQsXG5cdFx0XHRcdGNvbG9yOiBjb2xvcixcblx0XHRcdFx0bmFtZTogbnVsbCxcblx0XHRcdFx0ZGVmYXVsdEFsYXJtc0xpc3Q6IHNlcmlhbGl6ZWRBbGFybXMsXG5cdFx0XHRcdHNvdXJjZVVybCxcblx0XHRcdH0pXG5cblx0XHRcdHVzZXJTZXR0aW5nc0dyb3VwUm9vdC5ncm91cFNldHRpbmdzLnB1c2gobmV3R3JvdXBTZXR0aW5ncylcblx0XHRcdGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LnVwZGF0ZSh1c2VyU2V0dGluZ3NHcm91cFJvb3QpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGdyb3VwXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGRvQ3JlYXRlKFxuXHRcdGV2ZW50OiBDYWxlbmRhckV2ZW50LFxuXHRcdHpvbmU6IHN0cmluZyxcblx0XHRncm91cFJvb3Q6IENhbGVuZGFyR3JvdXBSb290LFxuXHRcdGFsYXJtSW5mb3M6IFJlYWRvbmx5QXJyYXk8QWxhcm1JbmZvVGVtcGxhdGU+LFxuXHRcdGV4aXN0aW5nRXZlbnQ/OiBDYWxlbmRhckV2ZW50LFxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHQvLyBJZiB0aGUgZXZlbnQgd2FzIGNvcGllZCBpdCBtaWdodCBzdGlsbCBjYXJyeSBzb21lIGZpZWxkcyBmb3IgcmUtZW5jcnlwdGlvbi4gV2UgY2FuJ3QgcmV1c2UgdGhlbS5cblx0XHRyZW1vdmVUZWNobmljYWxGaWVsZHMoZXZlbnQpXG5cdFx0Y29uc3QgeyBhc3NpZ25FdmVudElkIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhclV0aWxzXCIpXG5cdFx0Ly8gaWYgdmFsdWVzIG9mIHRoZSBleGlzdGluZyBldmVudHMgaGF2ZSBjaGFuZ2VkIHRoYXQgaW5mbHVlbmNlIHRoZSBhbGFybSB0aW1lIHRoZW4gZGVsZXRlIHRoZSBvbGQgZXZlbnQgYW5kIGNyZWF0ZSBhIG5ld1xuXHRcdC8vIG9uZS5cblx0XHRhc3NpZ25FdmVudElkKGV2ZW50LCB6b25lLCBncm91cFJvb3QpXG5cdFx0Ly8gUmVzZXQgb3duZXJFbmNTZXNzaW9uS2V5IGJlY2F1c2UgaXQgY2Fubm90IGJlIHNldCBmb3IgbmV3IGVudGl0eSwgaXQgd2lsbCBiZSBhc3NpZ25lZCBieSB0aGUgQ3J5cHRvRmFjYWRlXG5cdFx0ZXZlbnQuX293bmVyRW5jU2Vzc2lvbktleSA9IG51bGxcblx0XHRpZiAoZXZlbnQucmVwZWF0UnVsZSAhPSBudWxsKSB7XG5cdFx0XHRldmVudC5yZXBlYXRSdWxlLmV4Y2x1ZGVkRGF0ZXMgPSBldmVudC5yZXBlYXRSdWxlLmV4Y2x1ZGVkRGF0ZXMubWFwKCh7IGRhdGUgfSkgPT4gY3JlYXRlRGF0ZVdyYXBwZXIoeyBkYXRlIH0pKVxuXHRcdH1cblx0XHQvLyBSZXNldCBwZXJtaXNzaW9ucyBiZWNhdXNlIHNlcnZlciB3aWxsIGFzc2lnbiB0aGVtXG5cdFx0ZG93bmNhc3QoZXZlbnQpLl9wZXJtaXNzaW9ucyA9IG51bGxcblx0XHRldmVudC5fb3duZXJHcm91cCA9IGdyb3VwUm9vdC5faWRcblx0XHRyZXR1cm4gYXdhaXQgdGhpcy5jYWxlbmRhckZhY2FkZS5zYXZlQ2FsZW5kYXJFdmVudChldmVudCwgYWxhcm1JbmZvcywgZXhpc3RpbmdFdmVudCA/PyBudWxsKVxuXHR9XG5cblx0YXN5bmMgZGVsZXRlRXZlbnQoZXZlbnQ6IENhbGVuZGFyRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQuZXJhc2UoZXZlbnQpXG5cdH1cblxuXHQvKipcblx0ICogZ2V0IHRoZSBcInByaW1hcnlcIiBldmVudCBvZiBhIHNlcmllcyAtIHRoZSBvbmUgdGhhdCBjb250YWlucyB0aGUgcmVwZWF0IHJ1bGUgYW5kIGlzIG5vdCBhIHJlcGVhdGVkIG9yIGEgcmVzY2hlZHVsZWQgaW5zdGFuY2UuXG5cdCAqXG5cdCAqIG5vdGUgYWJvdXQgcmVjdXJyZW5jZUlkIGluIGV2ZW50IHNlcmllcyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMTQ1NjQwNi9yZWN1cnJlbmNlLWlkLWluLWljYWxlbmRhci1yZmMtNTU0NVxuXHQgKi9cblx0YXN5bmMgcmVzb2x2ZUNhbGVuZGFyRXZlbnRQcm9nZW5pdG9yKHsgdWlkIH06IFBpY2s8Q2FsZW5kYXJFdmVudCwgXCJ1aWRcIj4pOiBQcm9taXNlPENhbGVuZGFyRXZlbnQgfCBudWxsPiB7XG5cdFx0cmV0dXJuIChhd2FpdCB0aGlzLmdldEV2ZW50c0J5VWlkKGFzc2VydE5vdE51bGwodWlkLCBcImNvdWxkIG5vdCByZXNvbHZlIHByb2dlbml0b3I6IG5vIHVpZFwiKSkpPy5wcm9nZW5pdG9yID8/IG51bGxcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgbG9hZEFuZFByb2Nlc3NDYWxlbmRhclVwZGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgeyBtYWlsYm94R3JvdXBSb290IH0gPSBhd2FpdCB0aGlzLm1haWxib3hNb2RlbC5nZXRVc2VyTWFpbGJveERldGFpbHMoKVxuXHRcdGNvbnN0IHsgY2FsZW5kYXJFdmVudFVwZGF0ZXMgfSA9IG1haWxib3hHcm91cFJvb3Rcblx0XHRpZiAoY2FsZW5kYXJFdmVudFVwZGF0ZXMgPT0gbnVsbCkgcmV0dXJuXG5cblx0XHRjb25zdCBpbnZpdGVzID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZEFsbChDYWxlbmRhckV2ZW50VXBkYXRlVHlwZVJlZiwgY2FsZW5kYXJFdmVudFVwZGF0ZXMubGlzdClcblx0XHRmb3IgKGNvbnN0IGludml0ZSBvZiBpbnZpdGVzKSB7XG5cdFx0XHRhd2FpdCB0aGlzLmhhbmRsZUNhbGVuZGFyRXZlbnRVcGRhdGUoaW52aXRlKVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgY2FsZW5kYXIgaW5mb3MsIGNyZWF0aW5nIGEgbmV3IGNhbGVuZGFyIGluZm8gaWYgbm9uZSBleGlzdFxuXHQgKiBOb3QgYXN5bmMgYmVjYXVzZSB3ZSB3YW50IHRvIHJldHVybiB0aGUgcmVzdWx0IGRpcmVjdGx5IGlmIGl0IGlzIGF2YWlsYWJsZSB3aGVuIGNhbGxlZFxuXHQgKiBvdGhlcndpc2Ugd2UgcmV0dXJuIGEgcHJvbWlzZVxuXHQgKi9cblx0Z2V0Q2FsZW5kYXJJbmZvc0NyZWF0ZUlmTmVlZGVkKCk6ICRQcm9taXNhYmxlPFJlYWRvbmx5TWFwPElkLCBDYWxlbmRhckluZm8+PiB7XG5cdFx0aWYgKHRoaXMuY2FsZW5kYXJJbmZvcy5pc0xvYWRlZCgpICYmIHRoaXMuY2FsZW5kYXJJbmZvcy5nZXRMb2FkZWQoKS5zaXplID4gMCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuY2FsZW5kYXJJbmZvcy5nZXRMb2FkZWQoKVxuXHRcdH1cblxuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IGNhbGVuZGFycyA9IGF3YWl0IHRoaXMuY2FsZW5kYXJJbmZvcy5nZXRBc3luYygpXG5cblx0XHRcdGlmIChjYWxlbmRhcnMuc2l6ZSA+IDApIHtcblx0XHRcdFx0cmV0dXJuIGNhbGVuZGFyc1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5jcmVhdGVDYWxlbmRhcihcIlwiLCBudWxsLCBbXSwgbnVsbClcblx0XHRcdFx0cmV0dXJuIHRoaXMuY2FsZW5kYXJJbmZvcy5yZWxvYWQoKVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGdldENhbGVuZGFyRGF0YUZvclVwZGF0ZShmaWxlSWQ6IElkVHVwbGUpOiBQcm9taXNlPFBhcnNlZENhbGVuZGFyRGF0YSB8IG51bGw+IHtcblx0XHR0cnkge1xuXHRcdFx0Ly8gV2UgYXJlIG5vdCBzdXBwb3NlZCB0byBsb2FkIGZpbGVzIHdpdGhvdXQgdGhlIGtleSBwcm92aWRlciwgYnV0IHdlIGhvcGUgdGhhdCB0aGUga2V5XG5cdFx0XHQvLyB3YXMgYWxyZWFkeSByZXNvbHZlZCBhbmQgdGhlIGVudGl0eSB1cGRhdGVkLlxuXHRcdFx0Y29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoRmlsZVR5cGVSZWYsIGZpbGVJZClcblx0XHRcdGNvbnN0IGRhdGFGaWxlID0gYXdhaXQgdGhpcy5maWxlQ29udHJvbGxlci5nZXRBc0RhdGFGaWxlKGZpbGUpXG5cdFx0XHRjb25zdCB7IHBhcnNlQ2FsZW5kYXJGaWxlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvaW1wb3J0L0NhbGVuZGFySW1wb3J0ZXIuanNcIilcblx0XHRcdHJldHVybiBhd2FpdCBwYXJzZUNhbGVuZGFyRmlsZShkYXRhRmlsZSlcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFNlc3Npb25LZXlOb3RGb3VuZEVycm9yKSB7XG5cdFx0XHRcdC8vIG93bmVyIGVuYyBzZXNzaW9uIGtleSBub3QgdXBkYXRlZCB5ZXQgLSBzZWUgTm9Pd25lckVuY1Nlc3Npb25LZXlGb3JDYWxlbmRhckV2ZW50RXJyb3IncyBjb21tZW50XG5cdFx0XHRcdHRocm93IG5ldyBOb093bmVyRW5jU2Vzc2lvbktleUZvckNhbGVuZGFyRXZlbnRFcnJvcihcIm5vIG93bmVyIGVuYyBzZXNzaW9uIGtleSBmb3VuZCBvbiB0aGUgY2FsZW5kYXIgZGF0YSdzIGZpbGVcIilcblx0XHRcdH1cblx0XHRcdGlmIChlIGluc3RhbmNlb2YgUGFyc2VyRXJyb3IgfHwgZSBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKFRBRywgXCJjb3VsZCBub3QgZ2V0IGNhbGVuZGFyIHVwZGF0ZSBkYXRhXCIsIGUpXG5cdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHR9XG5cdFx0XHR0aHJvdyBlXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBoYW5kbGVDYWxlbmRhckV2ZW50VXBkYXRlKHVwZGF0ZTogQ2FsZW5kYXJFdmVudFVwZGF0ZSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdC8vIHdlIHdhbnQgdG8gZGVsZXRlIHRoZSBDYWxlbmRhckV2ZW50VXBkYXRlIGFmdGVyIHdlIGFyZSBkb25lLCBldmVuLCBpbiBzb21lIGNhc2VzLCBpZiBzb21ldGhpbmcgd2VudCB3cm9uZy5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcGFyc2VkQ2FsZW5kYXJEYXRhID0gYXdhaXQgdGhpcy5nZXRDYWxlbmRhckRhdGFGb3JVcGRhdGUodXBkYXRlLmZpbGUpXG5cdFx0XHRpZiAocGFyc2VkQ2FsZW5kYXJEYXRhICE9IG51bGwpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5wcm9jZXNzQ2FsZW5kYXJEYXRhKHVwZGF0ZS5zZW5kZXIsIHBhcnNlZENhbGVuZGFyRGF0YSlcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE5vdEF1dGhvcml6ZWRFcnJvcikge1xuXHRcdFx0XHQvLyB3ZSBtaWdodCBiZSBhdXRob3JpemVkIGluIHRoZSBuZWFyIGZ1dHVyZSBpZiBzb21lIHBlcm1pc3Npb24gaXMgZGVsYXllZCwgdW5saWtlbHkgdG8gYmUgcGVybWFuZW50LlxuXHRcdFx0XHRjb25zb2xlLndhcm4oVEFHLCBcImNvdWxkIG5vdCBwcm9jZXNzIGNhbGVuZGFyIHVwZGF0ZTogbm90IGF1dGhvcml6ZWRcIiwgZSlcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9IGVsc2UgaWYgKGUgaW5zdGFuY2VvZiBQcmVjb25kaXRpb25GYWlsZWRFcnJvcikge1xuXHRcdFx0XHQvLyB1bmNsZWFyIHdoZXJlIHByZWNvbiB3b3VsZCBiZSB0aHJvd24sIHByb2JhYmx5IGluIHRoZSBibG9iIHN0b3JlP1xuXHRcdFx0XHRjb25zb2xlLndhcm4oVEFHLCBcImNvdWxkIG5vdCBwcm9jZXNzIGNhbGVuZGFyIHVwZGF0ZTogcHJlY29uZGl0aW9uIGZhaWxlZFwiLCBlKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIExvY2tlZEVycm9yKSB7XG5cdFx0XHRcdC8vIHdlIGNhbiB0cnkgYWdhaW4gYWZ0ZXIgdGhlIGxvY2sgaXMgcmVsZWFzZWRcblx0XHRcdFx0Y29uc29sZS53YXJuKFRBRywgXCJjb3VsZCBub3QgcHJvY2VzcyBjYWxlbmRhciB1cGRhdGU6IGxvY2tlZFwiLCBlKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0Ly8gZWl0aGVyIHRoZSB1cGRhdGVkIGV2ZW50KHMpIG9yIHRoZSBmaWxlIGRhdGEgY291bGQgbm90IGJlIGZvdW5kLFxuXHRcdFx0XHQvLyBzbyB3ZSBzaG91bGQgdHJ5IHRvIGRlbGV0ZSBzaW5jZSB0aGUgdXBkYXRlIGl0c2VsZiBpcyBvYnNvbGV0ZS5cblx0XHRcdFx0Y29uc29sZS53YXJuKFRBRywgXCJjb3VsZCBub3QgcHJvY2VzcyBjYWxlbmRhciB1cGRhdGU6IG5vdCBmb3VuZFwiLCBlKVxuXHRcdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgTm9Pd25lckVuY1Nlc3Npb25LZXlGb3JDYWxlbmRhckV2ZW50RXJyb3IpIHtcblx0XHRcdFx0Ly8gd2Ugd2lsbCBnZXQgYW4gdXBkYXRlIHdpdGggdGhlIG1haWwgYW5kIHNrIHNvb24sIHRoZW4gd2UnbGwgYmUgYWJsZSB0byBmaW5pc2ggdGhpcy5cblx0XHRcdFx0Ly8gd2Ugd2lsbCByZS1lbnRlciB0aGlzIGZ1bmN0aW9uIGFuZCBlcmFzZSBpdCB0aGVuLlxuXHRcdFx0XHR0aGlzLmZpbGVJZFRvU2tpcHBlZENhbGVuZGFyRXZlbnRVcGRhdGVzLnNldChlbGVtZW50SWRQYXJ0KHVwZGF0ZS5maWxlKSwgdXBkYXRlKVxuXHRcdFx0XHRjb25zb2xlLndhcm4oVEFHLCBgY291bGQgbm90IHByb2Nlc3MgY2FsZW5kYXIgdXBkYXRlOiAke2UubWVzc2FnZX1gLCBlKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIHVua25vd24gZXJyb3IgdGhhdCBtYXkgbGVhZCB0byBwZXJtYW5lbnRseSBzdHVjayB1cGRhdGUgaWYgbm90IGNsZWFyZWRcblx0XHRcdFx0Ly8gdGhpcyBpbmNsdWRlcyBDcnlwdG9FcnJvcnMgZHVlIHRvICM1NzUzIHRoYXQgd2Ugd2FudCB0byBzdGlsbCBtb25pdG9yXG5cdFx0XHRcdC8vIGJ1dCBub3cgdGhleSBvbmx5IG9jY3VyIG9uY2Vcblx0XHRcdFx0Y29uc29sZS53YXJuKFRBRywgXCJjb3VsZCBub3QgcHJvY2VzcyBjYWxlbmRhciB1cGRhdGU6XCIsIGUpXG5cdFx0XHRcdGF3YWl0IHRoaXMuZXJhc2VVcGRhdGUodXBkYXRlKVxuXHRcdFx0XHR0aHJvdyBlXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0YXdhaXQgdGhpcy5lcmFzZVVwZGF0ZSh1cGRhdGUpXG5cdH1cblxuXHQvKipcblx0ICogdHJ5IHRvIGRlbGV0ZSBhIGNhbGVuZGFyIHVwZGF0ZSBmcm9tIHRoZSBzZXJ2ZXIsIGlnbm9yaW5nIGVycm9yc1xuXHQgKiBAcGFyYW0gdXBkYXRlIHRoZSB1cGRhdGUgdG8gZXJhc2Vcblx0ICogQHByaXZhdGVcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgZXJhc2VVcGRhdGUodXBkYXRlOiBDYWxlbmRhckV2ZW50VXBkYXRlKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmVyYXNlKHVwZGF0ZSlcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhUQUcsIFwiZmFpbGVkIHRvIGRlbGV0ZSB1cGRhdGU6XCIsIGUubmFtZSlcblx0XHR9XG5cdH1cblxuXHQvKiogd2hldGhlciB0aGUgb3BlcmF0aW9uIGNvdWxkIGJlIHBlcmZvcm1lZCBvciBub3QgKi9cblx0YXN5bmMgZGVsZXRlRXZlbnRzQnlVaWQodWlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBlbnRyeSA9IGF3YWl0IHRoaXMuY2FsZW5kYXJGYWNhZGUuZ2V0RXZlbnRzQnlVaWQodWlkKVxuXHRcdGlmIChlbnRyeSA9PSBudWxsKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcImNvdWxkIG5vdCBmaW5kIGFuIHVpZCBpbmRleCBlbnRyeSB0byBkZWxldGUgZXZlbnRcIilcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHQvLyBub3QgZG9pbmcgdGhpcyBpbiBwYXJhbGxlbCBiZWNhdXNlIHdlIHdvdWxkIGdldCBsb2NrZWQgZXJyb3JzXG5cdFx0Zm9yIChjb25zdCBlIG9mIGVudHJ5LmFsdGVyZWRJbnN0YW5jZXMpIHtcblx0XHRcdGF3YWl0IHRoaXMuZGVsZXRlRXZlbnQoZSlcblx0XHR9XG5cdFx0aWYgKGVudHJ5LnByb2dlbml0b3IpIHtcblx0XHRcdGF3YWl0IHRoaXMuZGVsZXRlRXZlbnQoZW50cnkucHJvZ2VuaXRvcilcblx0XHR9XG5cdH1cblxuXHQvKiogcHJvY2VzcyBhIGNhbGVuZGFyIHVwZGF0ZSByZXRyaWV2ZWQgZnJvbSB0aGUgc2VydmVyIGF1dG9tYXRpY2FsbHkuIHdpbGwgbm90IGFwcGx5IHVwZGF0ZXMgdG8gZXZlbnQgc2VyaWVzIHRoYXQgZG8gbm90XG5cdCAqICBleGlzdCBvbiB0aGUgc2VydmVyIHlldCAodGhhdCdzIGJlaW5nIGRvbmUgYnkgY2FsbGluZyBwcm9jZXNzQ2FsZW5kYXJFdmVudE1lc3NhZ2UgbWFudWFsbHkpXG5cdCAqIHB1YmxpYyBmb3IgdGVzdGluZyAqL1xuXHRhc3luYyBwcm9jZXNzQ2FsZW5kYXJEYXRhKHNlbmRlcjogc3RyaW5nLCBjYWxlbmRhckRhdGE6IFBhcnNlZENhbGVuZGFyRGF0YSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmIChjYWxlbmRhckRhdGEuY29udGVudHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhUQUcsIGBDYWxlbmRhciB1cGRhdGUgd2l0aCBubyBldmVudHMsIGlnbm9yaW5nYClcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGlmIChjYWxlbmRhckRhdGEuY29udGVudHNbMF0uZXZlbnQudWlkID09IG51bGwpIHtcblx0XHRcdGNvbnNvbGUubG9nKFRBRywgXCJpbnZhbGlkIGV2ZW50IHVwZGF0ZSB3aXRob3V0IFVJRCwgaWdub3JpbmcuXCIpXG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHQvLyB3ZSBjYW4gaGF2ZSBtdWx0aXBsZSBjYXNlcyBoZXJlOlxuXHRcdC8vIDEuIGNhbGVuZGFyRGF0YSBoYXMgb25lIGV2ZW50IGFuZCBpdCdzIHRoZSBwcm9nZW5pdG9yXG5cdFx0Ly8gMi4gY2FsZW5kYXJEYXRhIGhhcyBvbmUgZXZlbnQgYW5kIGl0J3MgYW4gYWx0ZXJlZCBvY2N1cnJlbmNlXG5cdFx0Ly8gMy4gaXQncyBib3RoICh0aHVuZGVyYmlyZCBzZW5kcyBpY2FsIGZpbGVzIHdpdGggbXVsdGlwbGUgZXZlbnRzKVxuXG5cdFx0Ly8gTG9hZCB0aGUgZXZlbnRzIGJ5cGFzc2luZyB0aGUgY2FjaGUgYmVjYXVzZSB3ZSBtaWdodCBoYXZlIGFscmVhZHkgcHJvY2Vzc2VkIHNvbWUgdXBkYXRlcyBhbmQgdGhleSBtaWdodCBoYXZlIGNoYW5nZWQgdGhlIGV2ZW50cyB3ZSBhcmUgYWJvdXQgdG8gbG9hZC5cblx0XHQvLyBXZSB3YW50IHRvIG9wZXJhdGUgb24gdGhlIGxhdGVzdCBldmVudHMgb25seSwgb3RoZXJ3aXNlIHdlIG1pZ2h0IGxvc2Ugc29tZSBkYXRhLlxuXHRcdGNvbnN0IGRiRXZlbnRzID0gYXdhaXQgdGhpcy5jYWxlbmRhckZhY2FkZS5nZXRFdmVudHNCeVVpZChjYWxlbmRhckRhdGEuY29udGVudHNbMF0uZXZlbnQudWlkLCBDYWNoaW5nTW9kZS5CeXBhc3MpXG5cblx0XHRpZiAoZGJFdmVudHMgPT0gbnVsbCkge1xuXHRcdFx0Ly8gaWYgd2UgZXZlciB3YW50IHRvIGRpc3BsYXkgZXZlbnQgaW52aXRlcyBpbiB0aGUgY2FsZW5kYXIgYmVmb3JlIGFjY2VwdGluZyB0aGVtLFxuXHRcdFx0Ly8gd2UgcHJvYmFibHkgbmVlZCB0byBkbyBzb21ldGhpbmcgZWxzZSBoZXJlLlxuXHRcdFx0Y29uc29sZS5sb2coVEFHLCBcInJlY2VpdmVkIGV2ZW50IHVwZGF0ZSBmb3IgZXZlbnQgdGhhdCBoYXMgbm90IGJlZW4gc2F2ZWQgdG8gdGhlIHNlcnZlciwgaWdub3JpbmcuXCIpXG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0Y29uc3QgbWV0aG9kID0gY2FsZW5kYXJEYXRhLm1ldGhvZFxuXHRcdGZvciAoY29uc3QgY29udGVudCBvZiBjYWxlbmRhckRhdGEuY29udGVudHMpIHtcblx0XHRcdGNvbnN0IHVwZGF0ZUFsYXJtcyA9IGNvbnRlbnQuYWxhcm1zXG5cdFx0XHRjb25zdCB1cGRhdGVFdmVudCA9IGNvbnRlbnQuZXZlbnRcblx0XHRcdC8vIHRoaXMgYXV0b21hdGljYWxseSBhcHBsaWVzIFJFUVVFU1RzIGZvciBjcmVhdGluZyBwYXJ0cyBvZiB0aGUgZXhpc3RpbmcgZXZlbnQgc2VyaWVzIHRoYXQgZG8gbm90IGV4aXN0IHlldFxuXHRcdFx0Ly8gbGlrZSBhY2NlcHRpbmcgYW5vdGhlciBhbHRlcmVkIGluc3RhbmNlIGludml0ZSBvciBhY2NlcHRpbmcgdGhlIHByb2dlbml0b3IgYWZ0ZXIgYWNjZXB0aW5nIG9ubHkgYW4gYWx0ZXJlZCBpbnN0YW5jZS5cblx0XHRcdGF3YWl0IHRoaXMucHJvY2Vzc0NhbGVuZGFyRXZlbnRNZXNzYWdlKHNlbmRlciwgbWV0aG9kLCB1cGRhdGVFdmVudCwgdXBkYXRlQWxhcm1zLCBkYkV2ZW50cylcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogUHJvY2Vzc2luZyBjYWxlbmRhciB1cGRhdGUgLSBicmluZyBldmVudHMgaW4gY2FsZW5kYXIgdXAtdG8tZGF0ZSB3aXRoIGljYWwgZGF0YSBzZW50IHZpYSBlbWFpbC5cblx0ICogY2FsZW5kYXIgZGF0YSBhcmUgY3VycmVudGx5IHByb2Nlc3NlZCBmb3Jcblx0ICogLSBSRVFVRVNUOiBoZXJlIHdlIGhhdmUgdHdvIGNhc2VzOlxuXHQgKiAgICAgLSB0aGVyZSBpcyBhbiBleGlzdGluZyBldmVudDogd2UgYXBwbHkgdGhlIHVwZGF0ZSB0byB0aGF0IGV2ZW50IGFuZCBkbyB0aGUgbmVjZXNzYXJ5IGNoYW5nZXMgdG8gdGhlIG90aGVyIHBhcnRzIG9mIHRoZSBzZXJpZXMgdGhhdCBtYXkgYWxyZWFkeSBleGlzdFxuXHQgKiAgICAgLSB0aGVyZSBpcyBubyBleGlzdGluZyBldmVudDogY3JlYXRlIHRoZSBldmVudCBhcyByZWNlaXZlZCwgYW5kIGRvIHRoZSBuZWNlc3NhcnkgY2hhbmdlcyB0byB0aGUgb3RoZXIgcGFydHMgb2YgdGhlIHNlcmllcyB0aGF0IG1heSBhbHJlYWR5IGV4aXN0XG5cdCAqIC0gUkVQTFk6IHVwZGF0ZSBhdHRlbmRlZSBzdGF0dXMsXG5cdCAqIC0gQ0FOQ0VMOiB3ZSBkZWxldGUgZXhpc3RpbmcgZXZlbnQgaW5zdGFuY2Vcblx0ICpcblx0ICogQHBhcmFtIHNlbmRlclxuXHQgKiBAcGFyYW0gbWV0aG9kXG5cdCAqIEBwYXJhbSB1cGRhdGVFdmVudCB0aGUgYWN0dWFsIGluc3RhbmNlIHRoYXQgbmVlZHMgdG8gYmUgdXBkYXRlZFxuXHQgKiBAcGFyYW0gdXBkYXRlQWxhcm1zXG5cdCAqIEBwYXJhbSB0YXJnZXQgZWl0aGVyIHRoZSBleGlzdGluZyBldmVudCB0byB1cGRhdGUgb3IgdGhlIGNhbGVuZGFyIGdyb3VwIElkIHRvIGNyZWF0ZSB0aGUgZXZlbnQgaW4gaW4gY2FzZSBvZiBhIG5ldyBldmVudC5cblx0ICovXG5cdGFzeW5jIHByb2Nlc3NDYWxlbmRhckV2ZW50TWVzc2FnZShcblx0XHRzZW5kZXI6IHN0cmluZyxcblx0XHRtZXRob2Q6IHN0cmluZyxcblx0XHR1cGRhdGVFdmVudDogUmVxdWlyZTxcInVpZFwiLCBDYWxlbmRhckV2ZW50Pixcblx0XHR1cGRhdGVBbGFybXM6IEFycmF5PEFsYXJtSW5mb1RlbXBsYXRlPixcblx0XHR0YXJnZXQ6IENhbGVuZGFyRXZlbnRVaWRJbmRleEVudHJ5LFxuXHQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCB1cGRhdGVFdmVudFRpbWUgPSB1cGRhdGVFdmVudC5yZWN1cnJlbmNlSWQ/LmdldFRpbWUoKVxuXHRcdGNvbnN0IHRhcmdldERiRXZlbnQgPSB1cGRhdGVFdmVudFRpbWUgPT0gbnVsbCA/IHRhcmdldC5wcm9nZW5pdG9yIDogdGFyZ2V0LmFsdGVyZWRJbnN0YW5jZXMuZmluZCgoZSkgPT4gZS5yZWN1cnJlbmNlSWQuZ2V0VGltZSgpID09PSB1cGRhdGVFdmVudFRpbWUpXG5cdFx0aWYgKHRhcmdldERiRXZlbnQgPT0gbnVsbCkge1xuXHRcdFx0aWYgKG1ldGhvZCA9PT0gQ2FsZW5kYXJNZXRob2QuUkVRVUVTVCkge1xuXHRcdFx0XHQvLyB3ZSBnb3QgYSBSRVFVRVNUIGZvciB3aGljaCB3ZSBkbyBub3QgaGF2ZSBhIHNhdmVkIHZlcnNpb24gb2YgdGhlIHBhcnRpY3VsYXIgaW5zdGFuY2UgKHByb2dlbml0b3Igb3IgYWx0ZXJlZClcblx0XHRcdFx0Ly8gaXQgbWF5IGJlXG5cdFx0XHRcdC8vIC0gYSBzaW5nbGUtaW5zdGFuY2UgdXBkYXRlIHRoYXQgY3JlYXRlZCB0aGlzIGFsdGVyZWQgaW5zdGFuY2Vcblx0XHRcdFx0Ly8gLSB0aGUgdXNlciBnb3QgdGhlIHByb2dlbml0b3IgaW52aXRlIGZvciBhIHNlcmllcy4gaXQncyBwb3NzaWJsZSB0aGF0IHRoZXJlJ3Ncblx0XHRcdFx0Ly8gICBhbHJlYWR5IGFsdGVyZWQgaW5zdGFuY2VzIG9mIHRoaXMgc2VyaWVzIG9uIHRoZSBzZXJ2ZXIuXG5cdFx0XHRcdHJldHVybiBhd2FpdCB0aGlzLnByb2Nlc3NDYWxlbmRhckFjY2VwdCh0YXJnZXQsIHVwZGF0ZUV2ZW50LCB1cGRhdGVBbGFybXMpXG5cdFx0XHR9IGVsc2UgaWYgKHRhcmdldC5wcm9nZW5pdG9yPy5yZXBlYXRSdWxlICE9IG51bGwgJiYgdXBkYXRlRXZlbnQucmVjdXJyZW5jZUlkICE9IG51bGwgJiYgbWV0aG9kID09PSBDYWxlbmRhck1ldGhvZC5DQU5DRUwpIHtcblx0XHRcdFx0Ly8gc29tZSBjYWxlbmRhcmluZyBhcHBzIHNlbmQgYSBjYW5jZWxsYXRpb24gZm9yIGFuIGFsdGVyZWQgaW5zdGFuY2Ugd2l0aCBhIFJFQ1VSUkVOQ0UtSUQgd2hlblxuXHRcdFx0XHQvLyB1c2VycyBkZWxldGUgYSBzaW5nbGUgaW5zdGFuY2UgZnJvbSBhIHNlcmllcyBldmVuIHRob3VnaCB0aGF0IGluc3RhbmNlIHdhcyBuZXZlciBwdWJsaXNoZWQgYXMgYWx0ZXJlZC5cblx0XHRcdFx0Ly8gd2UgY2FuIGp1c3QgYWRkIHRoZSBleGNsdXNpb24gdG8gdGhlIHByb2dlbml0b3IuIHRoaXMgd291bGQgYmUgYW5vdGhlciBhcmd1bWVudCBmb3IgbWFya2luZ1xuXHRcdFx0XHQvLyBhbHRlcmVkLWluc3RhbmNlLWV4Y2x1c2lvbnMgaW4gc29tZSB3YXkgZGlzdGluY3QgZnJvbSBcIm5vcm1hbFwiIGV4Y2x1c2lvbnNcblx0XHRcdFx0dGFyZ2V0LmFsdGVyZWRJbnN0YW5jZXMucHVzaCh1cGRhdGVFdmVudCBhcyBDYWxlbmRhckV2ZW50QWx0ZXJlZEluc3RhbmNlKVxuXHRcdFx0XHQvLyB0aGlzIHdpbGwgbm93IG1vZGlmeSB0aGUgcHJvZ2VuaXRvciB0byBoYXZlIHRoZSByZXF1aXJlZCBleGNsdXNpb25zXG5cdFx0XHRcdHJldHVybiBhd2FpdCB0aGlzLnByb2Nlc3NDYWxlbmRhclVwZGF0ZSh0YXJnZXQsIHRhcmdldC5wcm9nZW5pdG9yLCB0YXJnZXQucHJvZ2VuaXRvcilcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFRBRywgYGdvdCBzb21ldGhpbmcgdGhhdCdzIG5vdCBhIFJFUVVFU1QgZm9yIG5vbmV4aXN0ZW50IHNlcnZlciBldmVudCBvbiB1aWQ6YCwgbWV0aG9kKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBzZW50QnlPcmdhbml6ZXI6IGJvb2xlYW4gPSB0YXJnZXREYkV2ZW50Lm9yZ2FuaXplciAhPSBudWxsICYmIHRhcmdldERiRXZlbnQub3JnYW5pemVyLmFkZHJlc3MgPT09IHNlbmRlclxuXHRcdGlmIChtZXRob2QgPT09IENhbGVuZGFyTWV0aG9kLlJFUExZKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5wcm9jZXNzQ2FsZW5kYXJSZXBseShzZW5kZXIsIHRhcmdldERiRXZlbnQsIHVwZGF0ZUV2ZW50KVxuXHRcdH0gZWxzZSBpZiAoc2VudEJ5T3JnYW5pemVyICYmIG1ldGhvZCA9PT0gQ2FsZW5kYXJNZXRob2QuUkVRVUVTVCkge1xuXHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMucHJvY2Vzc0NhbGVuZGFyVXBkYXRlKHRhcmdldCwgdGFyZ2V0RGJFdmVudCwgdXBkYXRlRXZlbnQpXG5cdFx0fSBlbHNlIGlmIChzZW50QnlPcmdhbml6ZXIgJiYgbWV0aG9kID09PSBDYWxlbmRhck1ldGhvZC5DQU5DRUwpIHtcblx0XHRcdHJldHVybiBhd2FpdCB0aGlzLnByb2Nlc3NDYWxlbmRhckNhbmNlbGxhdGlvbih0YXJnZXREYkV2ZW50KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLmxvZyhUQUcsIGAke21ldGhvZH0gdXBkYXRlIHNlbnQgbm90IGJ5IG9yZ2FuaXplciwgaWdub3JpbmcuYClcblx0XHR9XG5cdH1cblxuXHQvKiogcHJvY2VzcyBlaXRoZXIgYSByZXF1ZXN0IGZvciBhbiBleGlzdGluZyBwcm9nZW5pdG9yIG9yIGFuIGV4aXN0aW5nIGFsdGVyZWQgaW5zdGFuY2UuXG5cdCAqIEBwYXJhbSBkYlRhcmdldCB0aGUgdWlkIGVudHJ5IGNvbnRhaW5pbmcgdGhlIG90aGVyIGV2ZW50cyB0aGF0IGFyZSBrbm93biB0byB1cyB0aGF0IGJlbG9uZyB0byB0aGlzIGV2ZW50IHNlcmllcy5cblx0ICogQHBhcmFtIGRiRXZlbnQgdGhlIHZlcnNpb24gb2YgdXBkYXRlRXZlbnQgc3RvcmVkIG9uIHRoZSBzZXJ2ZXIuIG11c3QgYmUgaWRlbnRpY2FsIHRvIGRiVGFyZ2V0LnByb2dlbml0b3Igb3Igb25lIG9mIGRiVGFyZ2V0LmFsdGVyZWRJbnN0YW5jZXNcblx0ICogQHBhcmFtIHVwZGF0ZUV2ZW50IHRoZSBldmVudCB0aGF0IGNvbnRhaW5zIHRoZSBuZXcgdmVyc2lvbiBvZiBkYkV2ZW50LiAqL1xuXHRwcml2YXRlIGFzeW5jIHByb2Nlc3NDYWxlbmRhclVwZGF0ZShkYlRhcmdldDogQ2FsZW5kYXJFdmVudFVpZEluZGV4RW50cnksIGRiRXZlbnQ6IENhbGVuZGFyRXZlbnRJbnN0YW5jZSwgdXBkYXRlRXZlbnQ6IENhbGVuZGFyRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zb2xlLmxvZyhUQUcsIFwicHJvY2Vzc2luZyByZXF1ZXN0IGZvciBleGlzdGluZyBldmVudCBpbnN0YW5jZVwiKVxuXHRcdGNvbnN0IHsgcmVwZWF0UnVsZVdpdGhFeGNsdWRlZEFsdGVyZWRJbnN0YW5jZXMgfSA9IGF3YWl0IGltcG9ydChcIi4uL2d1aS9ldmVudGVkaXRvci1tb2RlbC9DYWxlbmRhckV2ZW50V2hlbk1vZGVsLmpzXCIpXG5cdFx0Ly8gc29tZSBwcm92aWRlcnMgZG8gbm90IGluY3JlbWVudCB0aGUgc2VxdWVuY2UgZm9yIGFsbCBlZGl0IG9wZXJhdGlvbnMgKGxpa2UgZ29vZ2xlIHdoZW4gY2hhbmdpbmcgdGhlIHN1bW1hcnkpXG5cdFx0Ly8gd2UnZCByYXRoZXIgYXBwbHkgdGhlIHNhbWUgdXBkYXRlIHRvbyBvZnRlbiB0aGFuIG1pc3Mgc29tZSwgYW5kIHRoaXMgZW5hYmxlcyB1cyB0byB1cGRhdGUgb3VyIG93biBzdGF0dXMgZWFzaWx5XG5cdFx0Ly8gd2l0aG91dCBoYXZpbmcgdG8gaW5jcmVtZW50IHRoZSBzZXF1ZW5jZS5cblx0XHRpZiAoZmlsdGVySW50KGRiRXZlbnQuc2VxdWVuY2UpID4gZmlsdGVySW50KHVwZGF0ZUV2ZW50LnNlcXVlbmNlKSkge1xuXHRcdFx0Y29uc29sZS5sb2coVEFHLCBcImdvdCB1cGRhdGUgZm9yIG91dGRhdGVkIGV2ZW50IHZlcnNpb24sIGlnbm9yaW5nLlwiKVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdGlmICh1cGRhdGVFdmVudC5yZWN1cnJlbmNlSWQgPT0gbnVsbCAmJiB1cGRhdGVFdmVudC5yZXBlYXRSdWxlICE9IG51bGwpIHtcblx0XHRcdC8vIHRoZSB1cGRhdGUgaXMgZm9yIGEgcmVwZWF0aW5nIHByb2dlbml0b3IuIHdlIG5lZWQgdG8gZXhjbHVkZSBhbGwga25vd24gYWx0ZXJlZCBpbnN0YW5jZXMgZnJvbSBpdHMgcmVwZWF0IHJ1bGUuXG5cdFx0XHR1cGRhdGVFdmVudC5yZXBlYXRSdWxlID0gcmVwZWF0UnVsZVdpdGhFeGNsdWRlZEFsdGVyZWRJbnN0YW5jZXMoXG5cdFx0XHRcdHVwZGF0ZUV2ZW50LFxuXHRcdFx0XHRkYlRhcmdldC5hbHRlcmVkSW5zdGFuY2VzLm1hcCgocikgPT4gci5yZWN1cnJlbmNlSWQpLFxuXHRcdFx0XHR0aGlzLnpvbmUsXG5cdFx0XHQpXG5cdFx0fVxuXHRcdC8vIElmIHRoZSB1cGRhdGUgaXMgZm9yIHRoZSBhbHRlcmVkIG9jY3VycmVuY2UsIHdlIGRvIG5vdCBuZWVkIHRvIHVwZGF0ZSB0aGUgcHJvZ2VuaXRvciwgaXQgYWxyZWFkeSBoYXMgdGhlIGV4Y2x1c2lvbi5cblx0XHQvLyBJZiB3ZSBnZXQgaW50byB0aGlzIGZ1bmN0aW9uIHdlIGFscmVhZHkgaGF2ZSB0aGUgYWx0ZXJlZCBvY2N1cnJlbmNlIGluIGRiLlxuXG5cdFx0Ly8gd3JpdGUgdGhlIHByb2dlbml0b3IgYmFjayB0byB0aGUgdWlkIGluZGV4IGVudHJ5IHNvIHRoYXQgdGhlIHN1YnNlcXVlbnQgdXBkYXRlcyBmcm9tIHRoZSBzYW1lIGZpbGUgZ2V0IHRoZSB1cGRhdGVkIGluc3RhbmNlXG5cdFx0ZGJUYXJnZXQucHJvZ2VuaXRvciA9IChhd2FpdCB0aGlzLnVwZGF0ZUV2ZW50V2l0aEV4dGVybmFsKGRiRXZlbnQsIHVwZGF0ZUV2ZW50KSkgYXMgQ2FsZW5kYXJFdmVudFByb2dlbml0b3Jcblx0fVxuXG5cdC8qKlxuXHQgKiBkbyBub3QgY2FsbCB0aGlzIGZvciBhbnl0aGluZyBidXQgYSBSRVFVRVNUXG5cdCAqIEBwYXJhbSBkYlRhcmdldCB0aGUgcHJvZ2VuaXRvciB0aGF0IG11c3QgaGF2ZSBhIHJlcGVhdCBydWxlIGFuZCBhbiBleGNsdXNpb24gZm9yIHRoaXMgZXZlbnQgdG8gYmUgYWNjZXB0ZWQsIHRoZSBrbm93biBhbHRlcmVkIGluc3RhbmNlcyBhbmQgdGhlIG93bmVyZ3JvdXAuXG5cdCAqIEBwYXJhbSB1cGRhdGVFdmVudCB0aGUgZXZlbnQgdG8gY3JlYXRlXG5cdCAqIEBwYXJhbSBhbGFybXMgYWxhcm1zIHRvIHNldCB1cCBmb3IgdGhpcyB1c2VyL2V2ZW50XG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIHByb2Nlc3NDYWxlbmRhckFjY2VwdChcblx0XHRkYlRhcmdldDogQ2FsZW5kYXJFdmVudFVpZEluZGV4RW50cnksXG5cdFx0dXBkYXRlRXZlbnQ6IFJlcXVpcmU8XCJ1aWRcIiwgQ2FsZW5kYXJFdmVudD4sXG5cdFx0YWxhcm1zOiBBcnJheTxBbGFybUluZm9UZW1wbGF0ZT4sXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnNvbGUubG9nKFRBRywgXCJwcm9jZXNzaW5nIG5ldyBpbnN0YW5jZSByZXF1ZXN0XCIpXG5cdFx0Y29uc3QgeyByZXBlYXRSdWxlV2l0aEV4Y2x1ZGVkQWx0ZXJlZEluc3RhbmNlcyB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vZ3VpL2V2ZW50ZWRpdG9yLW1vZGVsL0NhbGVuZGFyRXZlbnRXaGVuTW9kZWwuanNcIilcblx0XHRpZiAodXBkYXRlRXZlbnQucmVjdXJyZW5jZUlkICE9IG51bGwgJiYgZGJUYXJnZXQucHJvZ2VuaXRvciAhPSBudWxsICYmIGRiVGFyZ2V0LnByb2dlbml0b3IucmVwZWF0UnVsZSAhPSBudWxsKSB7XG5cdFx0XHQvLyByZXF1ZXN0IGZvciBhIG5ldyBhbHRlcmVkIGluc3RhbmNlLiB3ZSdsbCB0cnkgYWRkaW5nIHRoZSBleGNsdXNpb24gZm9yIHRoaXMgaW5zdGFuY2UgdG8gdGhlIHByb2dlbml0b3IgaWYgcG9zc2libGVcblx0XHRcdC8vIHNpbmNlIG5vdCBhbGwgY2FsZW5kYXIgYXBwcyBhZGQgYWx0ZXJlZCBpbnN0YW5jZXMgdG8gdGhlIGxpc3Qgb2YgZXhjbHVzaW9ucy5cblx0XHRcdGNvbnN0IHVwZGF0ZWRQcm9nZW5pdG9yID0gY2xvbmUoZGJUYXJnZXQucHJvZ2VuaXRvcilcblx0XHRcdHVwZGF0ZWRQcm9nZW5pdG9yLnJlcGVhdFJ1bGUgPSByZXBlYXRSdWxlV2l0aEV4Y2x1ZGVkQWx0ZXJlZEluc3RhbmNlcyh1cGRhdGVkUHJvZ2VuaXRvciwgW3VwZGF0ZUV2ZW50LnJlY3VycmVuY2VJZF0sIHRoaXMuem9uZSlcblx0XHRcdGRiVGFyZ2V0LnByb2dlbml0b3IgPSAoYXdhaXQgdGhpcy5kb1VwZGF0ZUV2ZW50KGRiVGFyZ2V0LnByb2dlbml0b3IsIHVwZGF0ZWRQcm9nZW5pdG9yKSkgYXMgQ2FsZW5kYXJFdmVudFByb2dlbml0b3Jcblx0XHR9IGVsc2UgaWYgKHVwZGF0ZUV2ZW50LnJlY3VycmVuY2VJZCA9PSBudWxsICYmIHVwZGF0ZUV2ZW50LnJlcGVhdFJ1bGUgIT0gbnVsbCAmJiBkYlRhcmdldC5hbHRlcmVkSW5zdGFuY2VzLmxlbmd0aCA+IDApIHtcblx0XHRcdC8vIHJlcXVlc3QgdG8gYWRkIHRoZSBwcm9nZW5pdG9yIHRvIHRoZSBjYWxlbmRhci4gd2UgaGF2ZSB0byBleGNsdWRlIGFsbCBhbHRlcmVkIGluc3RhbmNlcyB0aGF0IGFyZSBrbm93biB0byB1cyBmcm9tIGl0LlxuXHRcdFx0dXBkYXRlRXZlbnQucmVwZWF0UnVsZSA9IHJlcGVhdFJ1bGVXaXRoRXhjbHVkZWRBbHRlcmVkSW5zdGFuY2VzKFxuXHRcdFx0XHR1cGRhdGVFdmVudCxcblx0XHRcdFx0ZGJUYXJnZXQuYWx0ZXJlZEluc3RhbmNlcy5tYXAoKHIpID0+IHIucmVjdXJyZW5jZUlkKSxcblx0XHRcdFx0dGhpcy56b25lLFxuXHRcdFx0KVxuXHRcdH1cblx0XHRsZXQgY2FsZW5kYXJHcm91cFJvb3Rcblx0XHR0cnkge1xuXHRcdFx0Y2FsZW5kYXJHcm91cFJvb3QgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKENhbGVuZGFyR3JvdXBSb290VHlwZVJlZiwgZGJUYXJnZXQub3duZXJHcm91cClcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoIShlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikgJiYgIShlIGluc3RhbmNlb2YgTm90QXV0aG9yaXplZEVycm9yKSkgdGhyb3cgZVxuXHRcdFx0Y29uc29sZS5sb2coVEFHLCBcInRyaWVkIHRvIGNyZWF0ZSBuZXcgcHJvZ2VuaXRvciBvciBnb3QgbmV3IGFsdGVyZWQgaW5zdGFuY2UgZm9yIHByb2dlbml0b3IgaW4gbm9uZXhpc3RlbnQvaW5hY2Nlc3NpYmxlIGNhbGVuZGFyLCBpZ25vcmluZ1wiKVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdHJldHVybiBhd2FpdCB0aGlzLmRvQ3JlYXRlKHVwZGF0ZUV2ZW50LCBcIlwiLCBjYWxlbmRhckdyb3VwUm9vdCwgYWxhcm1zKVxuXHR9XG5cblx0LyoqIFNvbWVvbmUgcmVwbGllZCB3aGV0aGVyIHRoZXkgYXR0ZW5kIGFuIGV2ZW50IG9yIG5vdC4gdGhpcyBNVVNUIGJlIGFwcGxpZWQgdG8gYWxsIGluc3RhbmNlcyBpbiBvdXJcblx0ICogbW9kZWwgc2luY2Ugd2Uga2VlcCBhdHRlbmRlZSBsaXN0cyBpbiBzeW5jIGZvciBub3cuICovXG5cdHByaXZhdGUgYXN5bmMgcHJvY2Vzc0NhbGVuZGFyUmVwbHkoc2VuZGVyOiBzdHJpbmcsIGRiRXZlbnQ6IENhbGVuZGFyRXZlbnQsIHVwZGF0ZUV2ZW50OiBDYWxlbmRhckV2ZW50KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc29sZS5sb2coXCJwcm9jZXNzaW5nIGNhbGVuZGFyIHJlcGx5XCIpXG5cdFx0Ly8gZmlyc3QgY2hlY2sgaWYgdGhlIHNlbmRlciBvZiB0aGUgZW1haWwgaXMgaW4gdGhlIGF0dGVuZGVlIGxpc3Rcblx0XHRjb25zdCByZXBseUF0dGVuZGVlID0gZmluZEF0dGVuZGVlSW5BZGRyZXNzZXModXBkYXRlRXZlbnQuYXR0ZW5kZWVzLCBbc2VuZGVyXSlcblxuXHRcdGlmIChyZXBseUF0dGVuZGVlID09IG51bGwpIHtcblx0XHRcdGNvbnNvbGUubG9nKFRBRywgXCJTZW5kZXIgaXMgbm90IGFtb25nIGF0dGVuZGVlcywgaWdub3JpbmdcIiwgcmVwbHlBdHRlbmRlZSlcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGNvbnN0IG5ld0V2ZW50ID0gY2xvbmUoZGJFdmVudClcblx0XHQvLyBjaGVjayBpZiB0aGUgYXR0ZW5kZWUgaXMgc3RpbGwgaW4gdGhlIGF0dGVuZGVlIGxpc3Qgb2YgdGhlIGxhdGVzdCBldmVudFxuXHRcdGNvbnN0IGRiQXR0ZW5kZWUgPSBmaW5kQXR0ZW5kZWVJbkFkZHJlc3NlcyhuZXdFdmVudC5hdHRlbmRlZXMsIFtyZXBseUF0dGVuZGVlLmFkZHJlc3MuYWRkcmVzc10pXG5cblx0XHRpZiAoZGJBdHRlbmRlZSA9PSBudWxsKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhUQUcsIFwiYXR0ZW5kZWUgd2FzIG5vdCBmb3VuZFwiLCBkYkV2ZW50Ll9pZCwgcmVwbHlBdHRlbmRlZSlcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGRiQXR0ZW5kZWUuc3RhdHVzID0gcmVwbHlBdHRlbmRlZS5zdGF0dXNcblx0XHRhd2FpdCB0aGlzLmRvVXBkYXRlRXZlbnQoZGJFdmVudCwgbmV3RXZlbnQpXG5cdH1cblxuXHQvKiogaGFuZGxlIGFuIGV2ZW50IGNhbmNlbGxhdGlvbiAtIGVpdGhlciB0aGUgd2hvbGUgc2VyaWVzIChwcm9nZW5pdG9yIGdvdCBjYW5jZWxsZWQpXG5cdCAqIG9yIHRoZSBhbHRlcmVkIG9jY3VycmVuY2UuICovXG5cdHByaXZhdGUgYXN5bmMgcHJvY2Vzc0NhbGVuZGFyQ2FuY2VsbGF0aW9uKGRiRXZlbnQ6IENhbGVuZGFyRXZlbnRJbnN0YW5jZSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnNvbGUubG9nKFRBRywgXCJwcm9jZXNzaW5nIGNhbmNlbGxhdGlvblwiKVxuXHRcdC8vIG5vdCBoYXZpbmcgVUlEIGlzIHRlY2huaWNhbGx5IGFuIGVycm9yLCBidXQgd2UnbGwgZG8gb3VyIGJlc3QgKHRoZSBldmVudCBjYW1lIGZyb20gdGhlIHNlcnZlciBhZnRlciBhbGwpXG5cdFx0aWYgKGRiRXZlbnQucmVjdXJyZW5jZUlkID09IG51bGwgJiYgZGJFdmVudC51aWQgIT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMuZGVsZXRlRXZlbnRzQnlVaWQoZGJFdmVudC51aWQpXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIGVpdGhlciB0aGlzIGhhcyBhIHJlY3VycmVuY2VJZCBhbmQgd2Ugb25seSBkZWxldGUgdGhhdCBpbnN0YW5jZVxuXHRcdFx0Ly8gb3Igd2UgZG9uJ3QgaGF2ZSBhIHVpZCB0byBnZXQgYWxsIGluc3RhbmNlcy5cblx0XHRcdHJldHVybiBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5lcmFzZShkYkV2ZW50KVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGUge0BwYXJhbSBkYkV2ZW50fSBzdG9yZWQgb24gdGhlIHNlcnZlciB3aXRoIHtAcGFyYW0gaWNzRXZlbnR9IGZyb20gdGhlIGljcyBmaWxlLlxuXHQgKi9cblx0YXN5bmMgdXBkYXRlRXZlbnRXaXRoRXh0ZXJuYWwoZGJFdmVudDogQ2FsZW5kYXJFdmVudCwgaWNzRXZlbnQ6IENhbGVuZGFyRXZlbnQpOiBQcm9taXNlPENhbGVuZGFyRXZlbnQ+IHtcblx0XHRjb25zdCBuZXdFdmVudCA9IGNsb25lKGRiRXZlbnQpXG5cdFx0bmV3RXZlbnQuc3RhcnRUaW1lID0gaWNzRXZlbnQuc3RhcnRUaW1lXG5cdFx0bmV3RXZlbnQuZW5kVGltZSA9IGljc0V2ZW50LmVuZFRpbWVcblx0XHRuZXdFdmVudC5hdHRlbmRlZXMgPSBpY3NFdmVudC5hdHRlbmRlZXNcblx0XHRuZXdFdmVudC5zdW1tYXJ5ID0gaWNzRXZlbnQuc3VtbWFyeVxuXHRcdG5ld0V2ZW50LnNlcXVlbmNlID0gaWNzRXZlbnQuc2VxdWVuY2Vcblx0XHRuZXdFdmVudC5sb2NhdGlvbiA9IGljc0V2ZW50LmxvY2F0aW9uXG5cdFx0bmV3RXZlbnQuZGVzY3JpcHRpb24gPSBpY3NFdmVudC5kZXNjcmlwdGlvblxuXHRcdG5ld0V2ZW50Lm9yZ2FuaXplciA9IGljc0V2ZW50Lm9yZ2FuaXplclxuXHRcdG5ld0V2ZW50LnJlcGVhdFJ1bGUgPSBpY3NFdmVudC5yZXBlYXRSdWxlXG5cdFx0bmV3RXZlbnQucmVjdXJyZW5jZUlkID0gaWNzRXZlbnQucmVjdXJyZW5jZUlkXG5cdFx0cmV0dXJuIGF3YWl0IHRoaXMuZG9VcGRhdGVFdmVudChkYkV2ZW50LCBuZXdFdmVudClcblx0fVxuXG5cdGFzeW5jIGRvVXBkYXRlRXZlbnQoZGJFdmVudDogQ2FsZW5kYXJFdmVudCwgbmV3RXZlbnQ6IENhbGVuZGFyRXZlbnQpOiBQcm9taXNlPENhbGVuZGFyRXZlbnQ+IHtcblx0XHRjb25zdCBbYWxhcm1zLCBncm91cFJvb3RdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuXHRcdFx0dGhpcy5sb2FkQWxhcm1zKGRiRXZlbnQuYWxhcm1JbmZvcywgdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyKSxcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LmxvYWQ8Q2FsZW5kYXJHcm91cFJvb3Q+KENhbGVuZGFyR3JvdXBSb290VHlwZVJlZiwgYXNzZXJ0Tm90TnVsbChkYkV2ZW50Ll9vd25lckdyb3VwKSksXG5cdFx0XSlcblx0XHRjb25zdCBhbGFybUluZm9zID0gYWxhcm1zLm1hcCgoYSkgPT4gYS5hbGFybUluZm8pXG5cdFx0cmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlRXZlbnQobmV3RXZlbnQsIGFsYXJtSW5mb3MsIFwiXCIsIGdyb3VwUm9vdCwgZGJFdmVudClcblx0fVxuXG5cdGFzeW5jIGluaXQoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgdGhpcy5zY2hlZHVsZUFsYXJtc0xvY2FsbHkoKVxuXHRcdGF3YWl0IHRoaXMubG9hZEFuZFByb2Nlc3NDYWxlbmRhclVwZGF0ZXMoKVxuXHR9XG5cblx0YXN5bmMgc2NoZWR1bGVBbGFybXNMb2NhbGx5KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICghdGhpcy5sb2NhbEFsYXJtc0VuYWJsZWQoKSkgcmV0dXJuXG5cblx0XHRjb25zdCBwdXNoSWRlbnRpZmllciA9IHRoaXMucHVzaFNlcnZpY2U/LmdldExvYWRlZFB1c2hJZGVudGlmaWVyKClcblx0XHRpZiAocHVzaElkZW50aWZpZXIgJiYgcHVzaElkZW50aWZpZXIuZGlzYWJsZWQpIHtcblx0XHRcdHJldHVybiBjb25zb2xlLmxvZyhcIlB1c2ggaWRlbnRpZmllciBkaXNhYmxlZC4gU2tpcHBpbmcgYWxhcm0gc2NoZWR1bGVcIilcblx0XHR9XG5cblx0XHRjb25zdCBldmVudHNXaXRoSW5mb3MgPSBhd2FpdCB0aGlzLmNhbGVuZGFyRmFjYWRlLmxvYWRBbGFybUV2ZW50cygpXG5cdFx0Y29uc3Qgc2NoZWR1bGVyOiBBbGFybVNjaGVkdWxlciA9IGF3YWl0IHRoaXMuYWxhcm1TY2hlZHVsZXIoKVxuXHRcdGZvciAobGV0IHsgZXZlbnQsIHVzZXJBbGFybUluZm9zIH0gb2YgZXZlbnRzV2l0aEluZm9zKSB7XG5cdFx0XHRmb3IgKGxldCB1c2VyQWxhcm1JbmZvIG9mIHVzZXJBbGFybUluZm9zKSB7XG5cdFx0XHRcdHRoaXMuc2NoZWR1bGVVc2VyQWxhcm1JbmZvKGV2ZW50LCB1c2VyQWxhcm1JbmZvLCBzY2hlZHVsZXIpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgbG9hZEFsYXJtcyhhbGFybUluZm9zOiBBcnJheTxJZFR1cGxlPiwgdXNlcjogVXNlcik6IFByb21pc2U8QXJyYXk8VXNlckFsYXJtSW5mbz4+IHtcblx0XHRjb25zdCB7IGFsYXJtSW5mb0xpc3QgfSA9IHVzZXJcblxuXHRcdGlmIChhbGFybUluZm9MaXN0ID09IG51bGwpIHtcblx0XHRcdHJldHVybiBbXVxuXHRcdH1cblxuXHRcdGNvbnN0IGlkcyA9IGFsYXJtSW5mb3MuZmlsdGVyKChhbGFybUluZm9JZCkgPT4gaXNTYW1lSWQobGlzdElkUGFydChhbGFybUluZm9JZCksIGFsYXJtSW5mb0xpc3QuYWxhcm1zKSlcblxuXHRcdGlmIChpZHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gW11cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5lbnRpdHlDbGllbnQubG9hZE11bHRpcGxlKFVzZXJBbGFybUluZm9UeXBlUmVmLCBsaXN0SWRQYXJ0KGlkc1swXSksIGlkcy5tYXAoZWxlbWVudElkUGFydCkpXG5cdH1cblxuXHRhc3luYyBkZWxldGVDYWxlbmRhcihjYWxlbmRhcjogQ2FsZW5kYXJJbmZvKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgdGhpcy5jYWxlbmRhckZhY2FkZS5kZWxldGVDYWxlbmRhcihjYWxlbmRhci5ncm91cFJvb3QuX2lkKVxuXHRcdHRoaXMuZGV2aWNlQ29uZmlnLnJlbW92ZUxhc3RTeW5jKGNhbGVuZGFyLmdyb3VwLl9pZClcblx0fVxuXG5cdGFzeW5jIGdldEV2ZW50c0J5VWlkKHVpZDogc3RyaW5nKTogUHJvbWlzZTxDYWxlbmRhckV2ZW50VWlkSW5kZXhFbnRyeSB8IG51bGw+IHtcblx0XHRyZXR1cm4gdGhpcy5jYWxlbmRhckZhY2FkZS5nZXRFdmVudHNCeVVpZCh1aWQpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGVudGl0eUV2ZW50c1JlY2VpdmVkKHVwZGF0ZXM6IFJlYWRvbmx5QXJyYXk8RW50aXR5VXBkYXRlRGF0YT4sIGV2ZW50T3duZXJHcm91cElkOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGNhbGVuZGFySW5mb3MgPSBhd2FpdCB0aGlzLmNhbGVuZGFySW5mb3MuZ2V0QXN5bmMoKVxuXHRcdC8vIFdlIGl0ZXJhdGUgb3ZlciB0aGUgYWxhcm1zIHR3aWNlOiBvbmNlIHRvIGNvbGxlY3QgdGhlbSBhbmQgdG8gc2V0IHRoZSBjb3VudGVyIGNvcnJlY3RseSBhbmQgdGhlIHNlY29uZCB0aW1lIHRvIGFjdHVhbGx5IHByb2Nlc3MgdGhlbS5cblx0XHRjb25zdCBhbGFybUV2ZW50c1RvUHJvY2VzczogVXNlckFsYXJtSW5mb1tdID0gW11cblx0XHRmb3IgKGNvbnN0IGVudGl0eUV2ZW50RGF0YSBvZiB1cGRhdGVzKSB7XG5cdFx0XHQvLyBhcHBzIGhhbmRsZSBhbGFybXMgbmF0aXZlbHkuIHRoaXMgY29kZSBpcyBhIGNhbmRpZGF0ZSB0byBtb3ZlIGludG9cblx0XHRcdC8vIGEgZ2VuZXJpYyB3ZWIvbmF0aXZlIGFsYXJtIGhhbmRsZXJcblx0XHRcdGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoVXNlckFsYXJtSW5mb1R5cGVSZWYsIGVudGl0eUV2ZW50RGF0YSkgJiYgIWlzQXBwKCkpIHtcblx0XHRcdFx0aWYgKGVudGl0eUV2ZW50RGF0YS5vcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuQ1JFQVRFKSB7XG5cdFx0XHRcdFx0Ly8gVXBkYXRlcyBmb3IgVXNlckFsYXJtSW5mbyBhbmQgQ2FsZW5kYXJFdmVudCBjb21lIGluIGFcblx0XHRcdFx0XHQvLyBzZXBhcmF0ZSBiYXRjaGVzIGFuZCB0aGVyZSdzIGEgcmFjZSBiZXR3ZWVuIGxvYWRpbmcgb2YgdGhlXG5cdFx0XHRcdFx0Ly8gVXNlckFsYXJtSW5mbyBhbmQgY3JlYXRpb24gb2YgdGhlIGV2ZW50LlxuXHRcdFx0XHRcdC8vIFdlIHRyeSB0byBsb2FkIFVzZXJBbGFybUluZm8uIFRoZW4gd2Ugd2FpdCB1bnRpbCB0aGVcblx0XHRcdFx0XHQvLyBDYWxlbmRhckV2ZW50IGlzIHRoZXJlICh3aGljaCBtaWdodCBhbHJlYWR5IGJlIHRydWUpXG5cdFx0XHRcdFx0Ly8gYW5kIGxvYWQgaXQuXG5cdFx0XHRcdFx0Ly8gQWxsIGFsYXJtcyBmb3IgdGhlIHNhbWUgZXZlbnQgY29tZSBpbiB0aGUgc2FtZSBiYXRjaCBzb1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRjb25zdCB1c2VyQWxhcm1JbmZvID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChVc2VyQWxhcm1JbmZvVHlwZVJlZiwgW2VudGl0eUV2ZW50RGF0YS5pbnN0YW5jZUxpc3RJZCwgZW50aXR5RXZlbnREYXRhLmluc3RhbmNlSWRdKVxuXHRcdFx0XHRcdFx0YWxhcm1FdmVudHNUb1Byb2Nlc3MucHVzaCh1c2VyQWxhcm1JbmZvKVxuXHRcdFx0XHRcdFx0Y29uc3QgZGVmZXJyZWRFdmVudCA9IHRoaXMuZ2V0UGVuZGluZ0FsYXJtUmVxdWVzdCh1c2VyQWxhcm1JbmZvLmFsYXJtSW5mby5jYWxlbmRhclJlZi5lbGVtZW50SWQpXG5cdFx0XHRcdFx0XHRkZWZlcnJlZEV2ZW50LnBlbmRpbmdBbGFybUNvdW50ZXIrK1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhUQUcsIGUsIFwiRXZlbnQgb3IgYWxhcm0gd2VyZSBub3QgZm91bmQ6IFwiLCBlbnRpdHlFdmVudERhdGEsIGUpXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR0aHJvdyBlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2UgaWYgKGVudGl0eUV2ZW50RGF0YS5vcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuREVMRVRFICYmICFpc0FwcCgpKSB7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5jYW5jZWxVc2VyQWxhcm1JbmZvKGVudGl0eUV2ZW50RGF0YS5pbnN0YW5jZUlkKVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGlzVXBkYXRlRm9yVHlwZVJlZihDYWxlbmRhckV2ZW50VHlwZVJlZiwgZW50aXR5RXZlbnREYXRhKSkge1xuXHRcdFx0XHRpZiAoZW50aXR5RXZlbnREYXRhLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5DUkVBVEUgfHwgZW50aXR5RXZlbnREYXRhLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5VUERBVEUpIHtcblx0XHRcdFx0XHRjb25zdCBkZWZlcnJlZEV2ZW50ID0gdGhpcy5nZXRQZW5kaW5nQWxhcm1SZXF1ZXN0KGVudGl0eUV2ZW50RGF0YS5pbnN0YW5jZUlkKVxuXHRcdFx0XHRcdGRlZmVycmVkRXZlbnQuZGVmZXJyZWQucmVzb2x2ZSh1bmRlZmluZWQpXG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoaXNVcGRhdGVGb3JUeXBlUmVmKENhbGVuZGFyRXZlbnRVcGRhdGVUeXBlUmVmLCBlbnRpdHlFdmVudERhdGEpICYmIGVudGl0eUV2ZW50RGF0YS5vcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuQ1JFQVRFKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0Y29uc3QgaW52aXRlID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChDYWxlbmRhckV2ZW50VXBkYXRlVHlwZVJlZiwgW2VudGl0eUV2ZW50RGF0YS5pbnN0YW5jZUxpc3RJZCwgZW50aXR5RXZlbnREYXRhLmluc3RhbmNlSWRdKVxuXHRcdFx0XHRcdGF3YWl0IHRoaXMuaGFuZGxlQ2FsZW5kYXJFdmVudFVwZGF0ZShpbnZpdGUpXG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFRBRywgXCJpbnZpdGUgbm90IGZvdW5kXCIsIFtlbnRpdHlFdmVudERhdGEuaW5zdGFuY2VMaXN0SWQsIGVudGl0eUV2ZW50RGF0YS5pbnN0YW5jZUlkXSwgZSlcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoRmlsZVR5cGVSZWYsIGVudGl0eUV2ZW50RGF0YSkpIHtcblx0XHRcdFx0Ly8gd2l0aCBhIGZpbGUgdXBkYXRlLCB0aGUgb3duZXIgZW5jIHNlc3Npb24ga2V5IHNob3VsZCBiZSBwcmVzZW50IG5vdyBzbyB3ZSBjYW4gdHJ5IHRvIHByb2Nlc3MgYW55IHNraXBwZWQgY2FsZW5kYXIgZXZlbnQgdXBkYXRlc1xuXHRcdFx0XHQvLyAoc2VlIE5vT3duZXJFbmNTZXNzaW9uS2V5Rm9yQ2FsZW5kYXJFdmVudEVycm9yJ3MgY29tbWVudClcblx0XHRcdFx0Y29uc3Qgc2tpcHBlZENhbGVuZGFyRXZlbnRVcGRhdGUgPSB0aGlzLmZpbGVJZFRvU2tpcHBlZENhbGVuZGFyRXZlbnRVcGRhdGVzLmdldChlbnRpdHlFdmVudERhdGEuaW5zdGFuY2VJZClcblx0XHRcdFx0aWYgKHNraXBwZWRDYWxlbmRhckV2ZW50VXBkYXRlKSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMuaGFuZGxlQ2FsZW5kYXJFdmVudFVwZGF0ZShza2lwcGVkQ2FsZW5kYXJFdmVudFVwZGF0ZSlcblx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coVEFHLCBcImludml0ZSBub3QgZm91bmRcIiwgW2VudGl0eUV2ZW50RGF0YS5pbnN0YW5jZUxpc3RJZCwgZW50aXR5RXZlbnREYXRhLmluc3RhbmNlSWRdLCBlKVxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZmluYWxseSB7XG5cdFx0XHRcdFx0XHR0aGlzLmZpbGVJZFRvU2tpcHBlZENhbGVuZGFyRXZlbnRVcGRhdGVzLmRlbGV0ZShlbnRpdHlFdmVudERhdGEuaW5zdGFuY2VJZClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAodGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc1VwZGF0ZUZvckxvZ2dlZEluVXNlckluc3RhbmNlKGVudGl0eUV2ZW50RGF0YSwgZXZlbnRPd25lckdyb3VwSWQpKSB7XG5cdFx0XHRcdGNvbnN0IGNhbGVuZGFyTWVtYmVyc2hpcHMgPSB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmdldENhbGVuZGFyTWVtYmVyc2hpcHMoKVxuXHRcdFx0XHRjb25zdCBvbGRHcm91cElkcyA9IG5ldyBTZXQoY2FsZW5kYXJJbmZvcy5rZXlzKCkpXG5cdFx0XHRcdGNvbnN0IG5ld0dyb3VwSWRzID0gbmV3IFNldChjYWxlbmRhck1lbWJlcnNoaXBzLm1hcCgobSkgPT4gbS5ncm91cCkpXG5cdFx0XHRcdGNvbnN0IGRpZmYgPSBzeW1tZXRyaWNEaWZmZXJlbmNlKG9sZEdyb3VwSWRzLCBuZXdHcm91cElkcylcblxuXHRcdFx0XHRpZiAoZGlmZi5zaXplICE9PSAwKSB7XG5cdFx0XHRcdFx0dGhpcy5jYWxlbmRhckluZm9zLnJlbG9hZCgpXG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoaXNVcGRhdGVGb3JUeXBlUmVmKEdyb3VwSW5mb1R5cGVSZWYsIGVudGl0eUV2ZW50RGF0YSkpIHtcblx0XHRcdFx0Ly8gdGhlIGJhdGNoIGRvZXMgbm90IGJlbG9uZyB0byB0aGF0IGdyb3VwIHNvIHdlIG5lZWQgdG8gZmluZCBpZiB3ZSBhY3R1YWxseSBjYXJlIGFib3V0IHRoZSByZWxhdGVkIEdyb3VwSW5mb1xuXHRcdFx0XHRmb3IgKGNvbnN0IHsgZ3JvdXBJbmZvIH0gb2YgY2FsZW5kYXJJbmZvcy52YWx1ZXMoKSkge1xuXHRcdFx0XHRcdGlmIChpc1VwZGF0ZUZvcihncm91cEluZm8sIGVudGl0eUV2ZW50RGF0YSkpIHtcblx0XHRcdFx0XHRcdHRoaXMuY2FsZW5kYXJJbmZvcy5yZWxvYWQoKVxuXHRcdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoIWlzQXBwKCkpIHtcblx0XHRcdGNvbnN0IHB1c2hJZGVudGlmaWVyID0gdGhpcy5wdXNoU2VydmljZT8uZ2V0TG9hZGVkUHVzaElkZW50aWZpZXIoKVxuXHRcdFx0aWYgKHB1c2hJZGVudGlmaWVyICYmIHB1c2hJZGVudGlmaWVyLmRpc2FibGVkKSB7XG5cdFx0XHRcdHJldHVybiBjb25zb2xlLmxvZyhcIlB1c2ggaWRlbnRpZmllciBkaXNhYmxlZC4gU2tpcHBpbmcgYWxhcm0gc2NoZWR1bGVcIilcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBpbiB0aGUgYXBwcywgdGhpcyBhcnJheSBpcyBndWFyYW50ZWVkIHRvIGJlIGVtcHR5LlxuXHRcdGZvciAoY29uc3QgdXNlckFsYXJtSW5mbyBvZiBhbGFybUV2ZW50c1RvUHJvY2Vzcykge1xuXHRcdFx0Y29uc3QgeyBsaXN0SWQsIGVsZW1lbnRJZCB9ID0gdXNlckFsYXJtSW5mby5hbGFybUluZm8uY2FsZW5kYXJSZWZcblx0XHRcdGNvbnN0IGRlZmVycmVkRXZlbnQgPSB0aGlzLmdldFBlbmRpbmdBbGFybVJlcXVlc3QoZWxlbWVudElkKVxuXHRcdFx0Ly8gRG9uJ3Qgd2FpdCBmb3IgdGhlIGRlZmVycmVkIGV2ZW50IHByb21pc2UgYmVjYXVzZSBpdCBjYW4gbGVhZCB0byBhIGRlYWRsb2NrLlxuXHRcdFx0Ly8gU2luY2UgaXNzdWUgIzIyNjQgd2UgcHJvY2VzcyBldmVudCBiYXRjaGVzIHNlcXVlbnRpYWxseSBhbmQgdGhlXG5cdFx0XHQvLyBkZWZlcnJlZCBldmVudCBjYW4gbmV2ZXIgYmUgcmVzb2x2ZWQgdW50aWwgdGhlIGNhbGVuZGFyIGV2ZW50IHVwZGF0ZSBpcyByZWNlaXZlZC5cblx0XHRcdGRlZmVycmVkRXZlbnQuZGVmZXJyZWQucHJvbWlzZSA9IGRlZmVycmVkRXZlbnQuZGVmZXJyZWQucHJvbWlzZS50aGVuKGFzeW5jICgpID0+IHtcblx0XHRcdFx0ZGVmZXJyZWRFdmVudC5wZW5kaW5nQWxhcm1Db3VudGVyLS1cblx0XHRcdFx0aWYgKGRlZmVycmVkRXZlbnQucGVuZGluZ0FsYXJtQ291bnRlciA9PT0gMCkge1xuXHRcdFx0XHRcdHRoaXMucGVuZGluZ0FsYXJtUmVxdWVzdHMuZGVsZXRlKGVsZW1lbnRJZClcblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCBjYWxlbmRhckV2ZW50ID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChDYWxlbmRhckV2ZW50VHlwZVJlZiwgW2xpc3RJZCwgZWxlbWVudElkXSlcblx0XHRcdFx0Y29uc3Qgc2NoZWR1bGVyID0gYXdhaXQgdGhpcy5hbGFybVNjaGVkdWxlcigpXG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0dGhpcy5zY2hlZHVsZVVzZXJBbGFybUluZm8oY2FsZW5kYXJFdmVudCwgdXNlckFsYXJtSW5mbywgc2NoZWR1bGVyKVxuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBOb3RGb3VuZEVycm9yKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhUQUcsIFwiZXZlbnQgbm90IGZvdW5kXCIsIFtsaXN0SWQsIGVsZW1lbnRJZF0pXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRQZW5kaW5nQWxhcm1SZXF1ZXN0KGVsZW1lbnRJZDogc3RyaW5nKSB7XG5cdFx0cmV0dXJuIGdldEZyb21NYXAodGhpcy5wZW5kaW5nQWxhcm1SZXF1ZXN0cywgZWxlbWVudElkLCAoKSA9PiAoeyBwZW5kaW5nQWxhcm1Db3VudGVyOiAwLCBkZWZlcnJlZDogZGVmZXIoKSB9KSlcblx0fVxuXG5cdHByaXZhdGUgbG9jYWxBbGFybXNFbmFibGVkKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiAhaXNBcHAoKSAmJiAhaXNEZXNrdG9wKCkgJiYgdGhpcy5sb2dpbnMuaXNJbnRlcm5hbFVzZXJMb2dnZWRJbigpICYmICF0aGlzLmxvZ2lucy5pc0VuYWJsZWQoRmVhdHVyZVR5cGUuRGlzYWJsZUNhbGVuZGFyKVxuXHR9XG5cblx0cHJpdmF0ZSBzY2hlZHVsZVVzZXJBbGFybUluZm8oZXZlbnQ6IENhbGVuZGFyRXZlbnQsIHVzZXJBbGFybUluZm86IFVzZXJBbGFybUluZm8sIHNjaGVkdWxlcjogQWxhcm1TY2hlZHVsZXIpOiB2b2lkIHtcblx0XHR0aGlzLnVzZXJBbGFybVRvQWxhcm1JbmZvLnNldChnZXRFbGVtZW50SWQodXNlckFsYXJtSW5mbyksIHVzZXJBbGFybUluZm8uYWxhcm1JbmZvLmFsYXJtSWRlbnRpZmllcilcblxuXHRcdHNjaGVkdWxlci5zY2hlZHVsZUFsYXJtKGV2ZW50LCB1c2VyQWxhcm1JbmZvLmFsYXJtSW5mbywgZXZlbnQucmVwZWF0UnVsZSwgKGV2ZW50VGltZSwgc3VtbWFyeSkgPT4ge1xuXHRcdFx0Y29uc3QgeyB0aXRsZSwgYm9keSB9ID0gZm9ybWF0Tm90aWZpY2F0aW9uRm9yRGlzcGxheShldmVudFRpbWUsIHN1bW1hcnkpXG5cdFx0XHR0aGlzLm5vdGlmaWNhdGlvbnMuc2hvd05vdGlmaWNhdGlvbihcblx0XHRcdFx0Tm90aWZpY2F0aW9uVHlwZS5DYWxlbmRhcixcblx0XHRcdFx0dGl0bGUsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRib2R5LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHQoKSA9PiBtLnJvdXRlLnNldChcIi9jYWxlbmRhclwiKSxcblx0XHRcdClcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBjYW5jZWxVc2VyQWxhcm1JbmZvKHVzZXJBbGFybUluZm9JZDogSWQpOiBQcm9taXNlPGFueT4ge1xuXHRcdGNvbnN0IGlkZW50aWZpZXIgPSB0aGlzLnVzZXJBbGFybVRvQWxhcm1JbmZvLmdldCh1c2VyQWxhcm1JbmZvSWQpXG5cblx0XHRpZiAoaWRlbnRpZmllcikge1xuXHRcdFx0Y29uc3QgYWxhcm1TY2hlZHVsZXIgPSBhd2FpdCB0aGlzLmFsYXJtU2NoZWR1bGVyKClcblx0XHRcdGFsYXJtU2NoZWR1bGVyLmNhbmNlbEFsYXJtKGlkZW50aWZpZXIpXG5cdFx0fVxuXHR9XG5cblx0Ly8gVmlzaWJsZUZvclRlc3Rpbmdcblx0Z2V0RmlsZUlkVG9Ta2lwcGVkQ2FsZW5kYXJFdmVudFVwZGF0ZXMoKTogTWFwPElkLCBDYWxlbmRhckV2ZW50VXBkYXRlPiB7XG5cdFx0cmV0dXJuIHRoaXMuZmlsZUlkVG9Ta2lwcGVkQ2FsZW5kYXJFdmVudFVwZGF0ZXNcblx0fVxuXG5cdGdldEJpcnRoZGF5RXZlbnRUaXRsZShjb250YWN0TmFtZTogc3RyaW5nKSB7XG5cdFx0cmV0dXJuIGxhbmcuZ2V0KFwiYmlydGhkYXlFdmVudF90aXRsZVwiLCB7XG5cdFx0XHRcIntuYW1lfVwiOiBjb250YWN0TmFtZSxcblx0XHR9KVxuXHR9XG5cblx0Z2V0QWdlU3RyaW5nKGFnZTogbnVtYmVyKSB7XG5cdFx0cmV0dXJuIGxhbmcuZ2V0KFwiYmlydGhkYXlFdmVudEFnZV90aXRsZVwiLCB7IFwie2FnZX1cIjogYWdlIH0pXG5cdH1cbn1cblxuLyoqIHJldHVybiBmYWxzZSB3aGVuIHRoZSBnaXZlbiBldmVudHMgKHJlcHJlc2VudGluZyB0aGUgbmV3IGFuZCBvbGQgdmVyc2lvbiBvZiB0aGUgc2FtZSBldmVudCkgYXJlIGJvdGggbG9uZyBldmVudHNcbiAqIG9yIGJvdGggc2hvcnQgZXZlbnRzLCB0cnVlIG90aGVyd2lzZSAqL1xuYXN5bmMgZnVuY3Rpb24gZGlkTG9uZ1N0YXRlQ2hhbmdlKG5ld0V2ZW50OiBDYWxlbmRhckV2ZW50LCBleGlzdGluZ0V2ZW50OiBDYWxlbmRhckV2ZW50LCB6b25lOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0Y29uc3QgeyBpc0xvbmdFdmVudCB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlscy5qc1wiKVxuXHRyZXR1cm4gaXNMb25nRXZlbnQobmV3RXZlbnQsIHpvbmUpICE9PSBpc0xvbmdFdmVudChleGlzdGluZ0V2ZW50LCB6b25lKVxufVxuXG4vKipcbiAqIFRoaXMgaXMgdXNlZCBkdWUgdXMgcmVjZWl2aW5nIGNhbGVuZGFyIGV2ZW50cyBiZWZvcmUgdXBkYXRlT3duZXJFbmNTZXNzaW9uS2V5IGdldHMgdHJpZ2dlcmVkLCBhbmQgdGh1cyB3ZSBjYW4ndCBsb2FkIGNhbGVuZGFyIGRhdGEgYXR0YWNobWVudHMuIFRoaXMgaXNcbiAqIHJlcXVpcmVkIGR1ZSB0byBvdXIgcGVybWlzc2lvbiBzeXN0ZW0gYW5kIHRoZSBmYWN0IHRoYXQgYnVja2V0IGtleXMgYXJlIG5vdCBpbW1lZGlhdGVseSBhY2Nlc3NpYmxlIGZyb20gRmlsZSwgb25seSBNYWlsLlxuICpcbiAqIFRoaXMgaXMgYSBsaW1pdGF0aW9uIHRoYXQgc2hvdWxkIGJlIGFkZHJlc3NlZCBpbiB0aGUgZnV0dXJlLlxuICovXG5jbGFzcyBOb093bmVyRW5jU2Vzc2lvbktleUZvckNhbGVuZGFyRXZlbnRFcnJvciBleHRlbmRzIFR1dGFub3RhRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcblx0XHRzdXBlcihcIk5vT3duZXJFbmNTZXNzaW9uS2V5Rm9yQ2FsZW5kYXJFdmVudEVycm9yXCIsIG1lc3NhZ2UpXG5cdH1cbn1cblxuLyoqXG4gKiB5aWVsZCB0aGUgZ2l2ZW4gbW9uaXRvciBvbmUgdGltZSBhbmQgdGhlbiBzd2l0Y2ggdG8gbm9PcCBtb25pdG9ycyBmb3JldmVyXG4gKi9cbmZ1bmN0aW9uKiBvbmVTaG90UHJvZ3Jlc3NNb25pdG9yR2VuZXJhdG9yKHByb2dyZXNzVHJhY2tlcjogUHJvZ3Jlc3NUcmFja2VyLCB1c2VyQ29udHJvbGxlcjogVXNlckNvbnRyb2xsZXIpOiBHZW5lcmF0b3I8SVByb2dyZXNzTW9uaXRvcj4ge1xuXHQvLyBsb2FkIGFsbCBjYWxlbmRhcnMuIGlmIHRoZXJlIGlzIG5vIGNhbGVuZGFyIHlldCwgY3JlYXRlIG9uZVxuXHQvLyB3ZSBsb2FkIHRocmVlIGluc3RhbmNlcyBwZXIgY2FsZW5kYXIgLyBDYWxlbmRhckdyb3VwUm9vdCAvIEdyb3VwSW5mbyAvIEdyb3VwXG5cdGNvbnN0IHdvcmtQZXJDYWxlbmRhciA9IDNcblx0Y29uc3QgdG90YWxXb3JrID0gdXNlckNvbnRyb2xsZXIuZ2V0Q2FsZW5kYXJNZW1iZXJzaGlwcygpLmxlbmd0aCAqIHdvcmtQZXJDYWxlbmRhclxuXHQvLyB0aGUgZmlyc3QgdGltZSB3ZSB3YW50IGEgcmVhbCBwcm9ncmVzcyBtb25pdG9yIGJ1dCBhbnkgdGltZSB3ZSB3b3VsZCByZWxvYWQgd2UgZG9uJ3QgbmVlZCBpdFxuXHRjb25zdCByZWFsTW9uaXRvcklkID0gcHJvZ3Jlc3NUcmFja2VyLnJlZ2lzdGVyTW9uaXRvclN5bmModG90YWxXb3JrKVxuXHRjb25zdCByZWFsTW9uaXRvciA9IGFzc2VydE5vdE51bGwocHJvZ3Jlc3NUcmFja2VyLmdldE1vbml0b3IocmVhbE1vbml0b3JJZCkpXG5cdHlpZWxkIHJlYWxNb25pdG9yXG5cdHdoaWxlICh0cnVlKSB7XG5cdFx0eWllbGQgbmV3IE5vb3BQcm9ncmVzc01vbml0b3IoKVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXROb3RpZmljYXRpb25Gb3JEaXNwbGF5KGV2ZW50VGltZTogRGF0ZSwgc3VtbWFyeTogc3RyaW5nKTogeyB0aXRsZTogc3RyaW5nOyBib2R5OiBzdHJpbmcgfSB7XG5cdGxldCBkYXRlU3RyaW5nOiBzdHJpbmdcblxuXHRpZiAoaXNTYW1lRGF5KGV2ZW50VGltZSwgbmV3IERhdGUoKSkpIHtcblx0XHRkYXRlU3RyaW5nID0gZm9ybWF0VGltZShldmVudFRpbWUpXG5cdH0gZWxzZSB7XG5cdFx0ZGF0ZVN0cmluZyA9IGZvcm1hdERhdGVXaXRoV2Vla2RheUFuZFRpbWUoZXZlbnRUaW1lKVxuXHR9XG5cblx0Y29uc3QgYm9keSA9IGAke2RhdGVTdHJpbmd9ICR7c3VtbWFyeX1gXG5cblx0cmV0dXJuIHsgYm9keSwgdGl0bGU6IGJvZHkgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkQWxsRXZlbnRzKGdyb3VwUm9vdDogQ2FsZW5kYXJHcm91cFJvb3QpOiBQcm9taXNlPEFycmF5PENhbGVuZGFyRXZlbnQ+PiB7XG5cdHJldHVybiBQcm9taXNlLmFsbChbXG5cdFx0bG9jYXRvci5lbnRpdHlDbGllbnQubG9hZEFsbChDYWxlbmRhckV2ZW50VHlwZVJlZiwgZ3JvdXBSb290LmxvbmdFdmVudHMpLFxuXHRcdGxvY2F0b3IuZW50aXR5Q2xpZW50LmxvYWRBbGwoQ2FsZW5kYXJFdmVudFR5cGVSZWYsIGdyb3VwUm9vdC5zaG9ydEV2ZW50cyksXG5cdF0pLnRoZW4oKHJlc3VsdHMpID0+IHJlc3VsdHMuZmxhdCgpKVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUlhLHVCQUFOLE1BQThCO0NBQ3BDLEFBQVE7Q0FDUixBQUFTLFNBQW9CLDRCQUFRO0NBRXJDLFlBQVlBLGNBQTZDQyxjQUFpQjtFQXNDMUUsS0F0Q3lEO0FBQ3hELE9BQUssYUFBYSxJQUFJLFdBQWMsWUFBWTtHQUMvQyxNQUFNLFFBQVEsTUFBTSxjQUFjO0FBQ2xDLFFBQUssT0FBTyxNQUFNO0FBQ2xCLFVBQU87RUFDUCxHQUFFO0FBRUgsT0FBSyxPQUFPLGFBQWE7Q0FDekI7Q0FFRCxXQUF1QjtBQUN0QixTQUFPLEtBQUssV0FBVyxV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