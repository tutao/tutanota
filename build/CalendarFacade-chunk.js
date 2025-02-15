import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertWorkerOrNode } from "./Env-chunk.js";
import { DAY_IN_MILLIS, assertNotNull, downcast, flatMap, getFromMap, groupBy, groupByAndMap, groupByAndMapUniquely, isNotNull, neverNull, ofClass, pMap, stringToUtf8Uint8Array } from "./dist2-chunk.js";
import { GroupType, OperationType } from "./TutanotaConstants-chunk.js";
import { elementIdPart, getLetId, getListId, isSameId, listIdPart, uint8arrayToCustomId } from "./EntityUtils-chunk.js";
import { CalendarEventTypeRef, CalendarEventUidIndexTypeRef, CalendarGroupRootTypeRef, createCalendarDeleteData } from "./TypeRefs-chunk.js";
import { geEventElementMaxId, getEventElementMinId } from "./CommonCalendarUtils-chunk.js";
import { AlarmServicePostTypeRef, PushIdentifierTypeRef, UserAlarmInfoTypeRef, createAlarmInfo, createAlarmNotification, createAlarmServicePost, createCalendarEventRef, createDateWrapper, createNotificationSessionKey, createRepeatRule, createUserAlarmInfo } from "./TypeRefs2-chunk.js";
import { addDaysForEventInstance, addDaysForRecurringEvent, generateCalendarInstancesInRange, isClientOnlyCalendar } from "./CalendarUtils-chunk.js";
import { resolveTypeReference } from "./EntityFunctions-chunk.js";
import { isOfflineError } from "./ErrorUtils-chunk.js";
import { ConnectionError, NotAuthorizedError, NotFoundError, PayloadTooLargeError } from "./RestError-chunk.js";
import { SetupMultipleError } from "./SetupMultipleError-chunk.js";
import { ImportError } from "./ImportError-chunk.js";
import { AlarmService } from "./Services-chunk.js";
import { EntityClient, loadMultipleFromLists } from "./EntityClient-chunk.js";
import { aes256RandomKey, encryptKey, sha256Hash } from "./dist3-chunk.js";
import { CalendarService } from "./Services2-chunk.js";

//#region src/common/api/worker/facades/lazy/CalendarFacade.ts
assertWorkerOrNode();
var CalendarFacade = class {
	cachingEntityClient;
	constructor(userFacade, groupManagementFacade, entityRestCache, noncachingEntityClient, nativePushFacade, operationProgressTracker, instanceMapper, serviceExecutor, cryptoFacade, infoMessageHandler) {
		this.userFacade = userFacade;
		this.groupManagementFacade = groupManagementFacade;
		this.entityRestCache = entityRestCache;
		this.noncachingEntityClient = noncachingEntityClient;
		this.nativePushFacade = nativePushFacade;
		this.operationProgressTracker = operationProgressTracker;
		this.instanceMapper = instanceMapper;
		this.serviceExecutor = serviceExecutor;
		this.cryptoFacade = cryptoFacade;
		this.infoMessageHandler = infoMessageHandler;
		this.cachingEntityClient = new EntityClient(this.entityRestCache);
	}
	async saveImportedCalendarEvents(eventWrappers, operationId) {
		return this.saveCalendarEvents(eventWrappers, (percent) => this.operationProgressTracker.onProgress(operationId, percent));
	}
	/**
	* extend or one month of the given daysToEvents map
	*
	* @param month only update events that intersect days in this month
	* @param calendarInfos update events contained in these calendars
	* @param daysToEvents the old version of the map
	* @param zone the time zone to consider the event times under
	* @returns a new daysToEventsMap where the given month is updated.
	*/
	async updateEventMap(month, calendarInfos, daysToEvents, zone) {
		const startId = getEventElementMinId(month.start - DAY_IN_MILLIS);
		const endId = geEventElementMaxId(month.end + DAY_IN_MILLIS);
		const calendars = [];
		for (const { groupRoot } of calendarInfos.values()) {
			const [shortEventsResult, longEventsResult] = await Promise.all([this.cachingEntityClient.loadReverseRangeBetween(CalendarEventTypeRef, groupRoot.shortEvents, endId, startId, 200), this.cachingEntityClient.loadAll(CalendarEventTypeRef, groupRoot.longEvents)]);
			calendars.push({
				short: shortEventsResult.elements,
				long: longEventsResult
			});
		}
		const newEvents = new Map(Array.from(daysToEvents.entries()).map(([day, events]) => [day, events.slice()]));
		for (const calendar of calendars) {
			this.generateEventOccurences(newEvents, calendar.short, month, zone, true);
			this.generateEventOccurences(newEvents, calendar.long, month, zone, false);
		}
		return newEvents;
	}
	generateEventOccurences(eventMap, events, range, zone, overwriteRange) {
		for (const e of events) {
			const generationRange = overwriteRange ? {
				...range,
				end: e.endTime.getTime()
			} : range;
			if (e.repeatRule) addDaysForRecurringEvent(eventMap, e, generationRange, zone);
else addDaysForEventInstance(eventMap, e, generationRange, zone);
		}
	}
	/**
	* We try to create as many events as possible and only throw the error at the end.
	* If alarmNotifications are created for an event that will later fail to be created we ignore them.
	* This function does not perform any checks on the event so it should only be called internally when
	* we can be sure that those checks have already been performed.
	* @param eventsWrapper the events and alarmNotifications to be created.
	* @param onProgress
	*/
	async saveCalendarEvents(eventsWrapper, onProgress) {
		let currentProgress = 10;
		await onProgress(currentProgress);
		for (const { event } of eventsWrapper) event.hashedUid = hashUid(assertNotNull(event.uid, "tried to save calendar event without uid."));
		const user = this.userFacade.getLoggedInUser();
		const numEvents = eventsWrapper.length;
		let eventsWithAlarms;
		try {
			eventsWithAlarms = await this.saveMultipleAlarms(user, eventsWrapper);
		} catch (e) {
			if (e instanceof SetupMultipleError) {
				console.log("Saving alarms failed.", e);
				throw new ImportError(e.errors[0], "Could not save alarms.", numEvents);
			}
			throw e;
		}
		for (const { event, alarmInfoIds } of eventsWithAlarms) event.alarmInfos = alarmInfoIds;
		currentProgress = 33;
		await onProgress(currentProgress);
		const eventsWithAlarmsByEventListId = groupBy(eventsWithAlarms, (eventWrapper) => getListId(eventWrapper.event));
		let collectedAlarmNotifications = [];
		const size = eventsWithAlarmsByEventListId.size;
		let failed = 0;
		let errors = [];
		for (const [listId, eventsWithAlarmsOfOneList] of eventsWithAlarmsByEventListId) {
			let successfulEvents = eventsWithAlarmsOfOneList;
			await this.cachingEntityClient.setupMultipleEntities(listId, eventsWithAlarmsOfOneList.map((e) => e.event)).catch(ofClass(SetupMultipleError, (e) => {
				failed += e.failedInstances.length;
				errors = errors.concat(e.errors);
				console.log(e.errors);
				successfulEvents = eventsWithAlarmsOfOneList.filter(({ event }) => !e.failedInstances.includes(event));
			}));
			const allAlarmNotificationsOfListId = successfulEvents.map((event) => event.alarmNotifications).flat();
			collectedAlarmNotifications = collectedAlarmNotifications.concat(allAlarmNotificationsOfListId);
			currentProgress += Math.floor(56 / size);
			await onProgress(currentProgress);
		}
		const pushIdentifierList = await this.cachingEntityClient.loadAll(PushIdentifierTypeRef, neverNull(this.userFacade.getLoggedInUser().pushIdentifierList).list);
		if (collectedAlarmNotifications.length > 0 && pushIdentifierList.length > 0) await this.sendAlarmNotifications(collectedAlarmNotifications, pushIdentifierList);
		await onProgress(100);
		if (failed !== 0) if (errors.some(isOfflineError)) throw new ConnectionError("Connection lost while saving events");
else {
			console.log("Could not save events. Number of failed imports: ", failed);
			throw new ImportError(errors[0], "Could not save events.", failed);
		}
	}
	async saveCalendarEvent(event, alarmInfos, oldEvent) {
		if (event._id == null) throw new Error("No id set on the event");
		if (event._ownerGroup == null) throw new Error("No _ownerGroup is set on the event");
		if (event.uid == null) throw new Error("no uid set on the event");
		event.hashedUid = hashUid(event.uid);
		if (oldEvent) await this.cachingEntityClient.erase(oldEvent).catch(ofClass(NotFoundError, () => console.log("could not delete old event when saving new one")));
		return await this.saveCalendarEvents([{
			event,
			alarms: alarmInfos
		}], () => Promise.resolve());
	}
	async updateCalendarEvent(event, newAlarms, existingEvent) {
		event._id = existingEvent._id;
		event._ownerEncSessionKey = existingEvent._ownerEncSessionKey;
		event._ownerKeyVersion = existingEvent._ownerKeyVersion;
		event._permissions = existingEvent._permissions;
		if (existingEvent.uid == null) throw new Error("no uid set on the existing event");
		event.uid = existingEvent.uid;
		event.hashedUid = hashUid(existingEvent.uid);
		const user = this.userFacade.getLoggedInUser();
		const userAlarmIdsWithAlarmNotificationsPerEvent = await this.saveMultipleAlarms(user, [{
			event,
			alarms: newAlarms
		}]);
		const { alarmInfoIds, alarmNotifications } = userAlarmIdsWithAlarmNotificationsPerEvent[0];
		const userAlarmInfoListId = neverNull(user.alarmInfoList).alarms;
		event.alarmInfos = existingEvent.alarmInfos.filter((a) => !isSameId(listIdPart(a), userAlarmInfoListId)).concat(alarmInfoIds);
		await this.cachingEntityClient.update(event);
		if (alarmNotifications.length > 0) {
			const pushIdentifierList = await this.cachingEntityClient.loadAll(PushIdentifierTypeRef, neverNull(this.userFacade.getLoggedInUser().pushIdentifierList).list);
			await this.sendAlarmNotifications(alarmNotifications, pushIdentifierList);
		}
	}
	/**
	* get all the calendar event instances in the given time range that are generated by the given progenitor Ids
	*/
	async reifyCalendarSearchResult(start, end, results) {
		const filteredEvents = results.filter(([calendarId, eventId]) => !isClientOnlyCalendar(calendarId));
		const progenitors = await loadMultipleFromLists(CalendarEventTypeRef, this.cachingEntityClient, filteredEvents);
		const range = {
			start,
			end
		};
		return generateCalendarInstancesInRange(progenitors, range);
	}
	async addCalendar(name) {
		return await this.groupManagementFacade.createCalendar(name);
	}
	async deleteCalendar(groupRootId) {
		await this.serviceExecutor.delete(CalendarService, createCalendarDeleteData({ groupRootId }));
	}
	async scheduleAlarmsForNewDevice(pushIdentifier) {
		const user = this.userFacade.getLoggedInUser();
		const eventsWithAlarmInfos = await this.loadAlarmEvents();
		const alarmNotifications = flatMap(eventsWithAlarmInfos, ({ event, userAlarmInfos }) => userAlarmInfos.map((userAlarmInfo) => createAlarmNotificationForEvent(event, userAlarmInfo.alarmInfo, user._id)));
		const notificationKey = aes256RandomKey();
		await this.encryptNotificationKeyForDevices(notificationKey, alarmNotifications, [pushIdentifier]);
		const requestEntity = createAlarmServicePost({ alarmNotifications });
		const AlarmServicePostTypeModel = await resolveTypeReference(AlarmServicePostTypeRef);
		const encEntity = await this.instanceMapper.encryptAndMapToLiteral(AlarmServicePostTypeModel, requestEntity, notificationKey);
		const encryptedAlarms = downcast(encEntity).alarmNotifications;
		await this.nativePushFacade.scheduleAlarms(encryptedAlarms);
	}
	/**
	* Load all events that have an alarm assigned.
	* @return: Map from concatenated ListId of an event to list of UserAlarmInfos for that event
	*/
	async loadAlarmEvents() {
		const alarmInfoList = this.userFacade.getLoggedInUser().alarmInfoList;
		if (!alarmInfoList) {
			console.warn("No alarmInfo list on user");
			return [];
		}
		const userAlarmInfos = await this.cachingEntityClient.loadAll(UserAlarmInfoTypeRef, alarmInfoList.alarms);
		const listIdToElementIds = groupByAndMapUniquely(userAlarmInfos, (userAlarmInfo) => userAlarmInfo.alarmInfo.calendarRef.listId, (userAlarmInfo) => userAlarmInfo.alarmInfo.calendarRef.elementId);
		const eventIdToAlarmInfos = groupBy(userAlarmInfos, (userAlarmInfo) => getEventIdFromUserAlarmInfo(userAlarmInfo).join(""));
		const calendarEvents = await pMap(listIdToElementIds.entries(), ([listId, elementIds]) => {
			return this.cachingEntityClient.loadMultiple(CalendarEventTypeRef, listId, Array.from(elementIds)).catch((error) => {
				if (error instanceof NotAuthorizedError) {
					console.warn("NotAuthorized when downloading alarm events", error);
					return [];
				}
				throw error;
			});
		});
		return calendarEvents.flat().map((event) => {
			return {
				event,
				userAlarmInfos: getFromMap(eventIdToAlarmInfos, getLetId(event).join(""), () => [])
			};
		});
	}
	/**
	* Queries the events using the uid index. The index is stored per calendar, so we have to go through all calendars
	* to find the matching events. We currently only need this for calendar event updates and for that we don't want to
	* look into shared calendars.
	*
	* @returns {CalendarEventUidIndexEntry}
	*/
	async getEventsByUid(uid, cacheMode = CachingMode.Cached) {
		const { memberships } = this.userFacade.getLoggedInUser();
		const entityClient = this.getEntityClient(cacheMode);
		for (const membership of memberships) {
			if (membership.groupType !== GroupType.Calendar) continue;
			try {
				const groupRoot = await this.cachingEntityClient.load(CalendarGroupRootTypeRef, membership.group);
				if (groupRoot.index == null) continue;
				const indexEntry = await entityClient.load(CalendarEventUidIndexTypeRef, [groupRoot.index.list, uint8arrayToCustomId(hashUid(uid))]);
				const progenitor = await loadProgenitorFromIndexEntry(entityClient, indexEntry);
				const alteredInstances = await loadAlteredInstancesFromIndexEntry(entityClient, indexEntry);
				return {
					progenitor,
					alteredInstances,
					ownerGroup: assertNotNull(indexEntry._ownerGroup, "ownergroup on index entry was null!")
				};
			} catch (e) {
				if (e instanceof NotFoundError || e instanceof NotAuthorizedError) continue;
				throw e;
			}
		}
		return null;
	}
	async sendAlarmNotifications(alarmNotifications, pushIdentifierList) {
		const notificationSessionKey = aes256RandomKey();
		return this.encryptNotificationKeyForDevices(notificationSessionKey, alarmNotifications, pushIdentifierList).then(async () => {
			const requestEntity = createAlarmServicePost({ alarmNotifications });
			try {
				await this.serviceExecutor.post(AlarmService, requestEntity, { sessionKey: notificationSessionKey });
			} catch (e) {
				if (e instanceof PayloadTooLargeError) return this.infoMessageHandler.onInfoMessage({
					translationKey: "calendarAlarmsTooBigError_msg",
					args: {}
				});
else throw e;
			}
		});
	}
	async encryptNotificationKeyForDevices(notificationSessionKey, alarmNotifications, pushIdentifierList) {
		const maybeEncSessionKeys = await pMap(pushIdentifierList, async (identifier) => {
			const pushIdentifierSk = await this.cryptoFacade.resolveSessionKeyForInstance(identifier);
			if (pushIdentifierSk) {
				const pushIdentifierSessionEncSessionKey = encryptKey(pushIdentifierSk, notificationSessionKey);
				return {
					identifierId: identifier._id,
					pushIdentifierSessionEncSessionKey
				};
			} else return null;
		});
		const encSessionKeys = maybeEncSessionKeys.filter(isNotNull);
		for (let notification of alarmNotifications) notification.notificationSessionKeys = encSessionKeys.map((esk) => {
			return createNotificationSessionKey({
				pushIdentifier: esk.identifierId,
				pushIdentifierSessionEncSessionKey: esk.pushIdentifierSessionEncSessionKey
			});
		});
	}
	async saveMultipleAlarms(user, eventsWrapper) {
		const userAlarmInfosAndNotificationsPerEvent = [];
		const userAlarmInfoListId = neverNull(user.alarmInfoList).alarms;
		const ownerGroup = user.userGroup.group;
		for (const { event, alarms } of eventsWrapper) {
			const userAlarmInfoAndNotification = [];
			const calendarRef = createCalendarEventRef({
				listId: listIdPart(event._id),
				elementId: elementIdPart(event._id)
			});
			for (const alarmInfo of alarms) {
				const userAlarmInfo = createUserAlarmInfo({
					_ownerGroup: ownerGroup,
					alarmInfo: createAlarmInfo({
						alarmIdentifier: alarmInfo.alarmIdentifier,
						trigger: alarmInfo.trigger,
						calendarRef
					})
				});
				const alarmNotification = createAlarmNotificationForEvent(event, userAlarmInfo.alarmInfo, user._id);
				userAlarmInfoAndNotification.push({
					alarm: userAlarmInfo,
					alarmNotification
				});
			}
			userAlarmInfosAndNotificationsPerEvent.push({
				event,
				userAlarmInfoAndNotification
			});
		}
		const allAlarms = userAlarmInfosAndNotificationsPerEvent.flatMap(({ userAlarmInfoAndNotification }) => userAlarmInfoAndNotification.map(({ alarm }) => alarm));
		const alarmIds = await this.cachingEntityClient.setupMultipleEntities(userAlarmInfoListId, allAlarms);
		let currentIndex = 0;
		return userAlarmInfosAndNotificationsPerEvent.map(({ event, userAlarmInfoAndNotification }) => {
			return {
				event,
				alarmInfoIds: userAlarmInfoAndNotification.map(() => [userAlarmInfoListId, alarmIds[currentIndex++]]),
				alarmNotifications: userAlarmInfoAndNotification.map(({ alarmNotification }) => alarmNotification)
			};
		});
	}
	getEntityClient(cacheMode) {
		if (cacheMode === CachingMode.Cached) return this.cachingEntityClient;
else return this.noncachingEntityClient;
	}
};
function createAlarmNotificationForEvent(event, alarmInfo, userId) {
	return createAlarmNotification({
		alarmInfo: createAlarmInfoForAlarmInfo(alarmInfo),
		repeatRule: event.repeatRule && createRepeatRuleForCalendarRepeatRule(event.repeatRule),
		notificationSessionKeys: [],
		operation: OperationType.CREATE,
		summary: event.summary,
		eventStart: event.startTime,
		eventEnd: event.endTime,
		user: userId
	});
}
function createAlarmInfoForAlarmInfo(alarmInfo) {
	const calendarRef = createCalendarEventRef({
		elementId: alarmInfo.calendarRef.elementId,
		listId: alarmInfo.calendarRef.listId
	});
	return createAlarmInfo({
		alarmIdentifier: alarmInfo.alarmIdentifier,
		trigger: alarmInfo.trigger,
		calendarRef
	});
}
function createRepeatRuleForCalendarRepeatRule(calendarRepeatRule) {
	return createRepeatRule({
		endType: calendarRepeatRule.endType,
		endValue: calendarRepeatRule.endValue,
		frequency: calendarRepeatRule.frequency,
		interval: calendarRepeatRule.interval,
		timeZone: calendarRepeatRule.timeZone,
		excludedDates: calendarRepeatRule.excludedDates.map(({ date }) => createDateWrapper({ date })),
		advancedRules: calendarRepeatRule.advancedRules
	});
}
function getEventIdFromUserAlarmInfo(userAlarmInfo) {
	return [userAlarmInfo.alarmInfo.calendarRef.listId, userAlarmInfo.alarmInfo.calendarRef.elementId];
}
/** to make lookup on the encrypted event uid possible, we hash it and use that value as a key. */
function hashUid(uid) {
	return sha256Hash(stringToUtf8Uint8Array(uid));
}
function sortByRecurrenceId(arr) {
	arr.sort((a, b) => a.recurrenceId.getTime() < b.recurrenceId.getTime() ? -1 : 1);
}
async function loadAlteredInstancesFromIndexEntry(entityClient, indexEntry) {
	if (indexEntry.alteredInstances.length === 0) return [];
	const indexedEventIds = groupByAndMap(indexEntry.alteredInstances, (e) => listIdPart(e), (e) => elementIdPart(e));
	const isAlteredInstance = (e) => e.recurrenceId != null && e.uid != null;
	const indexedEvents = await loadMultipleFromLists(CalendarEventTypeRef, entityClient, indexEntry.alteredInstances);
	const alteredInstances = indexedEvents.filter(isAlteredInstance);
	if (indexedEvents.length > alteredInstances.length) console.warn("there were altered instances indexed that do not have a recurrence Id or uid!");
	sortByRecurrenceId(alteredInstances);
	return alteredInstances;
}
async function loadProgenitorFromIndexEntry(entityClient, indexEntry) {
	if (indexEntry.progenitor == null) return null;
	const loadedProgenitor = await entityClient.load(CalendarEventTypeRef, indexEntry.progenitor);
	if (loadedProgenitor.recurrenceId != null) throw new ProgrammingError(`loaded progenitor has a recurrence Id! ${loadedProgenitor.recurrenceId.toISOString()}`);
	assertNotNull(loadedProgenitor.uid, "loaded progenitor has no UID");
	return loadedProgenitor;
}
let CachingMode = function(CachingMode$1) {
	CachingMode$1[CachingMode$1["Cached"] = 0] = "Cached";
	CachingMode$1[CachingMode$1["Bypass"] = 1] = "Bypass";
	return CachingMode$1;
}({});

//#endregion
export { CachingMode, CalendarFacade, sortByRecurrenceId };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FsZW5kYXJGYWNhZGUtY2h1bmsuanMiLCJuYW1lcyI6WyJ1c2VyRmFjYWRlOiBVc2VyRmFjYWRlIiwiZ3JvdXBNYW5hZ2VtZW50RmFjYWRlOiBHcm91cE1hbmFnZW1lbnRGYWNhZGUiLCJlbnRpdHlSZXN0Q2FjaGU6IERlZmF1bHRFbnRpdHlSZXN0Q2FjaGUiLCJub25jYWNoaW5nRW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQiLCJuYXRpdmVQdXNoRmFjYWRlOiBOYXRpdmVQdXNoRmFjYWRlIiwib3BlcmF0aW9uUHJvZ3Jlc3NUcmFja2VyOiBFeHBvc2VkT3BlcmF0aW9uUHJvZ3Jlc3NUcmFja2VyIiwiaW5zdGFuY2VNYXBwZXI6IEluc3RhbmNlTWFwcGVyIiwic2VydmljZUV4ZWN1dG9yOiBJU2VydmljZUV4ZWN1dG9yIiwiY3J5cHRvRmFjYWRlOiBDcnlwdG9GYWNhZGUiLCJpbmZvTWVzc2FnZUhhbmRsZXI6IEluZm9NZXNzYWdlSGFuZGxlciIsImV2ZW50V3JhcHBlcnM6IEFycmF5PEV2ZW50V3JhcHBlcj4iLCJvcGVyYXRpb25JZDogT3BlcmF0aW9uSWQiLCJtb250aDogQ2FsZW5kYXJUaW1lUmFuZ2UiLCJjYWxlbmRhckluZm9zOiBSZWFkb25seU1hcDxJZCwgQ2FsZW5kYXJJbmZvPiIsImRheXNUb0V2ZW50czogRGF5c1RvRXZlbnRzIiwiem9uZTogc3RyaW5nIiwiY2FsZW5kYXJzOiBBcnJheTx7IGxvbmc6IENhbGVuZGFyRXZlbnRbXTsgc2hvcnQ6IENhbGVuZGFyRXZlbnRbXSB9PiIsImV2ZW50TWFwOiBNYXA8bnVtYmVyLCBDYWxlbmRhckV2ZW50W10+IiwiZXZlbnRzOiBDYWxlbmRhckV2ZW50W10iLCJyYW5nZTogQ2FsZW5kYXJUaW1lUmFuZ2UiLCJvdmVyd3JpdGVSYW5nZTogYm9vbGVhbiIsImV2ZW50c1dyYXBwZXI6IEFycmF5PEV2ZW50V3JhcHBlcj4iLCJvblByb2dyZXNzOiAocGVyY2VudDogbnVtYmVyKSA9PiBQcm9taXNlPHZvaWQ+IiwiZXZlbnRzV2l0aEFsYXJtczogQXJyYXk8QWxhcm1Ob3RpZmljYXRpb25zUGVyRXZlbnQ+IiwiY29sbGVjdGVkQWxhcm1Ob3RpZmljYXRpb25zOiBBbGFybU5vdGlmaWNhdGlvbltdIiwiZXZlbnQ6IENhbGVuZGFyRXZlbnQiLCJhbGFybUluZm9zOiBSZWFkb25seUFycmF5PEFsYXJtSW5mb1RlbXBsYXRlPiIsIm9sZEV2ZW50OiBDYWxlbmRhckV2ZW50IHwgbnVsbCIsIm5ld0FsYXJtczogUmVhZG9ubHlBcnJheTxBbGFybUluZm9UZW1wbGF0ZT4iLCJleGlzdGluZ0V2ZW50OiBDYWxlbmRhckV2ZW50Iiwic3RhcnQ6IG51bWJlciIsImVuZDogbnVtYmVyIiwicmVzdWx0czogQXJyYXk8SWRUdXBsZT4iLCJuYW1lOiBzdHJpbmciLCJncm91cFJvb3RJZDogSWQiLCJwdXNoSWRlbnRpZmllcjogUHVzaElkZW50aWZpZXIiLCJlbmNyeXB0ZWRBbGFybXM6IEVuY3J5cHRlZEFsYXJtTm90aWZpY2F0aW9uW10iLCJ1aWQ6IHN0cmluZyIsImNhY2hlTW9kZTogQ2FjaGluZ01vZGUiLCJpbmRleEVudHJ5OiBDYWxlbmRhckV2ZW50VWlkSW5kZXgiLCJwcm9nZW5pdG9yOiBDYWxlbmRhckV2ZW50UHJvZ2VuaXRvciB8IG51bGwiLCJhbHRlcmVkSW5zdGFuY2VzOiBBcnJheTxDYWxlbmRhckV2ZW50QWx0ZXJlZEluc3RhbmNlPiIsImFsYXJtTm90aWZpY2F0aW9uczogQXJyYXk8QWxhcm1Ob3RpZmljYXRpb24+IiwicHVzaElkZW50aWZpZXJMaXN0OiBBcnJheTxQdXNoSWRlbnRpZmllcj4iLCJub3RpZmljYXRpb25TZXNzaW9uS2V5OiBBZXNLZXkiLCJ1c2VyOiBVc2VyIiwiZXZlbnRzV3JhcHBlcjogQXJyYXk8e1xuXHRcdFx0ZXZlbnQ6IENhbGVuZGFyRXZlbnRcblx0XHRcdGFsYXJtczogUmVhZG9ubHlBcnJheTxBbGFybUluZm9UZW1wbGF0ZT5cblx0XHR9PiIsInVzZXJBbGFybUluZm9zQW5kTm90aWZpY2F0aW9uc1BlckV2ZW50OiBBcnJheTx7XG5cdFx0XHRldmVudDogQ2FsZW5kYXJFdmVudFxuXHRcdFx0dXNlckFsYXJtSW5mb0FuZE5vdGlmaWNhdGlvbjogQXJyYXk8e1xuXHRcdFx0XHRhbGFybTogVXNlckFsYXJtSW5mb1xuXHRcdFx0XHRhbGFybU5vdGlmaWNhdGlvbjogQWxhcm1Ob3RpZmljYXRpb25cblx0XHRcdH0+XG5cdFx0fT4iLCJ1c2VyQWxhcm1JbmZvQW5kTm90aWZpY2F0aW9uOiBBcnJheTx7XG5cdFx0XHRcdGFsYXJtOiBVc2VyQWxhcm1JbmZvXG5cdFx0XHRcdGFsYXJtTm90aWZpY2F0aW9uOiBBbGFybU5vdGlmaWNhdGlvblxuXHRcdFx0fT4iLCJhbGFybUlkczogQXJyYXk8SWQ+IiwiYWxhcm1JbmZvOiBBbGFybUluZm8iLCJ1c2VySWQ6IElkIiwiY2FsZW5kYXJSZXBlYXRSdWxlOiBDYWxlbmRhclJlcGVhdFJ1bGUiLCJ1c2VyQWxhcm1JbmZvOiBVc2VyQWxhcm1JbmZvIiwiYXJyOiBBcnJheTxDYWxlbmRhckV2ZW50QWx0ZXJlZEluc3RhbmNlPiIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50IiwiaW5kZXhlZEV2ZW50SWRzOiBNYXA8SWQsIEFycmF5PElkPj4iLCJlOiBJZFR1cGxlIiwiZTogQ2FsZW5kYXJFdmVudEFsdGVyZWRJbnN0YW5jZSJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ2FsZW5kYXJGYWNhZGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYXNzZXJ0V29ya2VyT3JOb2RlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9FbnYuanNcIlxuaW1wb3J0IHR5cGUgeyBBbGFybUluZm8sIEFsYXJtTm90aWZpY2F0aW9uLCBHcm91cCwgUHVzaElkZW50aWZpZXIsIFJlcGVhdFJ1bGUsIFVzZXIsIFVzZXJBbGFybUluZm8gfSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7XG5cdEFsYXJtU2VydmljZVBvc3RUeXBlUmVmLFxuXHRjcmVhdGVBbGFybUluZm8sXG5cdGNyZWF0ZUFsYXJtTm90aWZpY2F0aW9uLFxuXHRjcmVhdGVBbGFybVNlcnZpY2VQb3N0LFxuXHRjcmVhdGVDYWxlbmRhckV2ZW50UmVmLFxuXHRjcmVhdGVEYXRlV3JhcHBlcixcblx0Y3JlYXRlTm90aWZpY2F0aW9uU2Vzc2lvbktleSxcblx0Y3JlYXRlUmVwZWF0UnVsZSxcblx0Y3JlYXRlVXNlckFsYXJtSW5mbyxcblx0UHVzaElkZW50aWZpZXJUeXBlUmVmLFxuXHRVc2VyQWxhcm1JbmZvVHlwZVJlZixcbn0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQge1xuXHRhc3NlcnROb3ROdWxsLFxuXHREQVlfSU5fTUlMTElTLFxuXHRkb3duY2FzdCxcblx0ZmxhdE1hcCxcblx0Z2V0RnJvbU1hcCxcblx0Z3JvdXBCeSxcblx0Z3JvdXBCeUFuZE1hcCxcblx0Z3JvdXBCeUFuZE1hcFVuaXF1ZWx5LFxuXHRpc05vdE51bGwsXG5cdG5ldmVyTnVsbCxcblx0b2ZDbGFzcyxcblx0cHJvbWlzZU1hcCxcblx0UmVxdWlyZSxcblx0c3RyaW5nVG9VdGY4VWludDhBcnJheSxcbn0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBDcnlwdG9GYWNhZGUgfSBmcm9tIFwiLi4vLi4vY3J5cHRvL0NyeXB0b0ZhY2FkZS5qc1wiXG5pbXBvcnQgeyBHcm91cFR5cGUsIE9wZXJhdGlvblR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB0eXBlIHsgQ2FsZW5kYXJFdmVudCwgQ2FsZW5kYXJFdmVudFVpZEluZGV4LCBDYWxlbmRhclJlcGVhdFJ1bGUgfSBmcm9tIFwiLi4vLi4vLi4vZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudFR5cGVSZWYsIENhbGVuZGFyRXZlbnRVaWRJbmRleFR5cGVSZWYsIENhbGVuZGFyR3JvdXBSb290VHlwZVJlZiwgY3JlYXRlQ2FsZW5kYXJEZWxldGVEYXRhIH0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IERlZmF1bHRFbnRpdHlSZXN0Q2FjaGUgfSBmcm9tIFwiLi4vLi4vcmVzdC9EZWZhdWx0RW50aXR5UmVzdENhY2hlLmpzXCJcbmltcG9ydCB7IENvbm5lY3Rpb25FcnJvciwgTm90QXV0aG9yaXplZEVycm9yLCBOb3RGb3VuZEVycm9yLCBQYXlsb2FkVG9vTGFyZ2VFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZXJyb3IvUmVzdEVycm9yLmpzXCJcbmltcG9ydCB7IEVudGl0eUNsaWVudCwgbG9hZE11bHRpcGxlRnJvbUxpc3RzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9FbnRpdHlDbGllbnQuanNcIlxuaW1wb3J0IHsgZWxlbWVudElkUGFydCwgZ2V0TGV0SWQsIGdldExpc3RJZCwgaXNTYW1lSWQsIGxpc3RJZFBhcnQsIHVpbnQ4YXJyYXlUb0N1c3RvbUlkIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5pbXBvcnQgeyBHcm91cE1hbmFnZW1lbnRGYWNhZGUgfSBmcm9tIFwiLi9Hcm91cE1hbmFnZW1lbnRGYWNhZGUuanNcIlxuaW1wb3J0IHsgU2V0dXBNdWx0aXBsZUVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9lcnJvci9TZXR1cE11bHRpcGxlRXJyb3IuanNcIlxuaW1wb3J0IHsgSW1wb3J0RXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2Vycm9yL0ltcG9ydEVycm9yLmpzXCJcbmltcG9ydCB7IGFlczI1NlJhbmRvbUtleSwgQWVzS2V5LCBlbmNyeXB0S2V5LCBzaGEyNTZIYXNoIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS1jcnlwdG9cIlxuaW1wb3J0IHsgSW5zdGFuY2VNYXBwZXIgfSBmcm9tIFwiLi4vLi4vY3J5cHRvL0luc3RhbmNlTWFwcGVyLmpzXCJcbmltcG9ydCB7IFR1dGFub3RhRXJyb3IgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLWVycm9yXCJcbmltcG9ydCB7IElTZXJ2aWNlRXhlY3V0b3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL1NlcnZpY2VSZXF1ZXN0LmpzXCJcbmltcG9ydCB7IEFsYXJtU2VydmljZSB9IGZyb20gXCIuLi8uLi8uLi9lbnRpdGllcy9zeXMvU2VydmljZXMuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uLy4uL2VudGl0aWVzL3R1dGFub3RhL1NlcnZpY2VzLmpzXCJcbmltcG9ydCB7IHJlc29sdmVUeXBlUmVmZXJlbmNlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9FbnRpdHlGdW5jdGlvbnMuanNcIlxuaW1wb3J0IHsgVXNlckZhY2FkZSB9IGZyb20gXCIuLi9Vc2VyRmFjYWRlLmpzXCJcbmltcG9ydCB7IEVuY3J5cHRlZEFsYXJtTm90aWZpY2F0aW9uIH0gZnJvbSBcIi4uLy4uLy4uLy4uL25hdGl2ZS9jb21tb24vRW5jcnlwdGVkQWxhcm1Ob3RpZmljYXRpb24uanNcIlxuaW1wb3J0IHsgTmF0aXZlUHVzaEZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9OYXRpdmVQdXNoRmFjYWRlLmpzXCJcbmltcG9ydCB7IEV4cG9zZWRPcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXIsIE9wZXJhdGlvbklkIH0gZnJvbSBcIi4uLy4uLy4uL21haW4vT3BlcmF0aW9uUHJvZ3Jlc3NUcmFja2VyLmpzXCJcbmltcG9ydCB7IEluZm9NZXNzYWdlSGFuZGxlciB9IGZyb20gXCIuLi8uLi8uLi8uLi9ndWkvSW5mb01lc3NhZ2VIYW5kbGVyLmpzXCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IHtcblx0YWRkRGF5c0ZvckV2ZW50SW5zdGFuY2UsXG5cdGFkZERheXNGb3JSZWN1cnJpbmdFdmVudCxcblx0Q2FsZW5kYXJUaW1lUmFuZ2UsXG5cdGdlbmVyYXRlQ2FsZW5kYXJJbnN0YW5jZXNJblJhbmdlLFxuXHRpc0NsaWVudE9ubHlDYWxlbmRhcixcbn0gZnJvbSBcIi4uLy4uLy4uLy4uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckluZm8gfSBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vY2FsZW5kYXItYXBwL2NhbGVuZGFyL21vZGVsL0NhbGVuZGFyTW9kZWwuanNcIlxuaW1wb3J0IHsgZ2VFdmVudEVsZW1lbnRNYXhJZCwgZ2V0RXZlbnRFbGVtZW50TWluSWQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL3V0aWxzL0NvbW1vbkNhbGVuZGFyVXRpbHMuanNcIlxuaW1wb3J0IHsgRGF5c1RvRXZlbnRzIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJFdmVudHNSZXBvc2l0b3J5LmpzXCJcbmltcG9ydCB7IGlzT2ZmbGluZUVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi91dGlscy9FcnJvclV0aWxzLmpzXCJcbmltcG9ydCB0eXBlIHsgRXZlbnRXcmFwcGVyIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NhbGVuZGFyL2ltcG9ydC9JbXBvcnRFeHBvcnRVdGlscy5qc1wiXG5cbmFzc2VydFdvcmtlck9yTm9kZSgpXG5cbnR5cGUgQWxhcm1Ob3RpZmljYXRpb25zUGVyRXZlbnQgPSB7XG5cdGV2ZW50OiBDYWxlbmRhckV2ZW50XG5cdGFsYXJtSW5mb0lkczogSWRUdXBsZVtdXG5cdGFsYXJtTm90aWZpY2F0aW9uczogQWxhcm1Ob3RpZmljYXRpb25bXVxufVxuXG4vKiogZXZlbnQgdGhhdCBpcyBhIHBhcnQgb2YgYW4gZXZlbnQgc2VyaWVzIGFuZCByZWZlcmVuY2VzIGFub3RoZXIgZXZlbnQgdmlhIGl0cyByZWN1cnJlbmNlSWQgYW5kIHVpZCAqL1xuZXhwb3J0IHR5cGUgQ2FsZW5kYXJFdmVudEFsdGVyZWRJbnN0YW5jZSA9IFJlcXVpcmU8XCJyZWN1cnJlbmNlSWRcIiB8IFwidWlkXCIsIENhbGVuZGFyRXZlbnQ+ICYgeyByZXBlYXRSdWxlOiBudWxsIH1cbi8qKiBldmVudHMgdGhhdCBoYXMgYSB1aWQsIGJ1dCBubyByZWN1cnJlbmNlSWQgZXhpc3Qgb24gdGhlaXIgb3duIGFuZCBtYXkgZGVmaW5lIGEgc2VyaWVzLiBldmVudHMgdGhhdCBkbyBub3QgcmVwZWF0IGFyZSBhbHNvIHByb2dlbml0b3JzLiAqL1xuZXhwb3J0IHR5cGUgQ2FsZW5kYXJFdmVudFByb2dlbml0b3IgPSBSZXF1aXJlPFwidWlkXCIsIENhbGVuZGFyRXZlbnQ+ICYgeyByZWN1cnJlbmNlSWQ6IG51bGwgfVxuZXhwb3J0IHR5cGUgQ2FsZW5kYXJFdmVudEluc3RhbmNlID0gQ2FsZW5kYXJFdmVudEFsdGVyZWRJbnN0YW5jZSB8IENhbGVuZGFyRXZlbnRQcm9nZW5pdG9yXG4vKiogaW5kZXggZW50cnkgdGhhdCBidW5kbGVzIGFsbCB0aGUgZXZlbnRzIHdpdGggdGhlIHNhbWUgdWlkIGluIHRoZSBvd25lckdyb3VwLiAqL1xuZXhwb3J0IHR5cGUgQ2FsZW5kYXJFdmVudFVpZEluZGV4RW50cnkgPSB7XG5cdG93bmVyR3JvdXA6IE5vbk51bGxhYmxlPENhbGVuZGFyRXZlbnRbXCJfb3duZXJHcm91cFwiXT5cblx0cHJvZ2VuaXRvcjogQ2FsZW5kYXJFdmVudFByb2dlbml0b3IgfCBudWxsXG5cdGFsdGVyZWRJbnN0YW5jZXM6IEFycmF5PENhbGVuZGFyRXZlbnRBbHRlcmVkSW5zdGFuY2U+XG59XG5cbmV4cG9ydCBjbGFzcyBDYWxlbmRhckZhY2FkZSB7XG5cdC8vIHZpc2libGUgZm9yIHRlc3Rpbmdcblx0cmVhZG9ubHkgY2FjaGluZ0VudGl0eUNsaWVudDogRW50aXR5Q2xpZW50XG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSB1c2VyRmFjYWRlOiBVc2VyRmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZ3JvdXBNYW5hZ2VtZW50RmFjYWRlOiBHcm91cE1hbmFnZW1lbnRGYWNhZGUsXG5cdFx0Ly8gV2UgaW5qZWN0IGNhY2hlIGRpcmVjdGx5IGJlY2F1c2Ugd2UgbmVlZCB0byBkZWxldGUgdXNlciBmcm9tIGl0IGZvciBhIGhhY2tcblx0XHRwcml2YXRlIHJlYWRvbmx5IGVudGl0eVJlc3RDYWNoZTogRGVmYXVsdEVudGl0eVJlc3RDYWNoZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IG5vbmNhY2hpbmdFbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IG5hdGl2ZVB1c2hGYWNhZGU6IE5hdGl2ZVB1c2hGYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBvcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXI6IEV4cG9zZWRPcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBpbnN0YW5jZU1hcHBlcjogSW5zdGFuY2VNYXBwZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBzZXJ2aWNlRXhlY3V0b3I6IElTZXJ2aWNlRXhlY3V0b3IsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjcnlwdG9GYWNhZGU6IENyeXB0b0ZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGluZm9NZXNzYWdlSGFuZGxlcjogSW5mb01lc3NhZ2VIYW5kbGVyLFxuXHQpIHtcblx0XHR0aGlzLmNhY2hpbmdFbnRpdHlDbGllbnQgPSBuZXcgRW50aXR5Q2xpZW50KHRoaXMuZW50aXR5UmVzdENhY2hlKVxuXHR9XG5cblx0YXN5bmMgc2F2ZUltcG9ydGVkQ2FsZW5kYXJFdmVudHMoZXZlbnRXcmFwcGVyczogQXJyYXk8RXZlbnRXcmFwcGVyPiwgb3BlcmF0aW9uSWQ6IE9wZXJhdGlvbklkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gaXQgaXMgc2FmZSB0byBhc3N1bWUgdGhhdCBhbGwgZXZlbnQgdWlkcyBhcmUgc2V0IGF0IHRoaXMgdGltZVxuXHRcdHJldHVybiB0aGlzLnNhdmVDYWxlbmRhckV2ZW50cyhldmVudFdyYXBwZXJzLCAocGVyY2VudCkgPT4gdGhpcy5vcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXIub25Qcm9ncmVzcyhvcGVyYXRpb25JZCwgcGVyY2VudCkpXG5cdH1cblxuXHQvKipcblx0ICogZXh0ZW5kIG9yIG9uZSBtb250aCBvZiB0aGUgZ2l2ZW4gZGF5c1RvRXZlbnRzIG1hcFxuXHQgKlxuXHQgKiBAcGFyYW0gbW9udGggb25seSB1cGRhdGUgZXZlbnRzIHRoYXQgaW50ZXJzZWN0IGRheXMgaW4gdGhpcyBtb250aFxuXHQgKiBAcGFyYW0gY2FsZW5kYXJJbmZvcyB1cGRhdGUgZXZlbnRzIGNvbnRhaW5lZCBpbiB0aGVzZSBjYWxlbmRhcnNcblx0ICogQHBhcmFtIGRheXNUb0V2ZW50cyB0aGUgb2xkIHZlcnNpb24gb2YgdGhlIG1hcFxuXHQgKiBAcGFyYW0gem9uZSB0aGUgdGltZSB6b25lIHRvIGNvbnNpZGVyIHRoZSBldmVudCB0aW1lcyB1bmRlclxuXHQgKiBAcmV0dXJucyBhIG5ldyBkYXlzVG9FdmVudHNNYXAgd2hlcmUgdGhlIGdpdmVuIG1vbnRoIGlzIHVwZGF0ZWQuXG5cdCAqL1xuXHRhc3luYyB1cGRhdGVFdmVudE1hcChcblx0XHRtb250aDogQ2FsZW5kYXJUaW1lUmFuZ2UsXG5cdFx0Y2FsZW5kYXJJbmZvczogUmVhZG9ubHlNYXA8SWQsIENhbGVuZGFySW5mbz4sXG5cdFx0ZGF5c1RvRXZlbnRzOiBEYXlzVG9FdmVudHMsXG5cdFx0em9uZTogc3RyaW5nLFxuXHQpOiBQcm9taXNlPERheXNUb0V2ZW50cz4ge1xuXHRcdC8vIEJlY2F1c2Ugb2YgdGhlIHRpbWV6b25lcyBhbmQgYWxsIGRheSBldmVudHMsIHdlIG1pZ2h0IG5vdCBsb2FkIGFuIGV2ZW50IHdoaWNoIHdlIG5lZWQgdG8gZGlzcGxheS5cblx0XHQvLyBTbyB3ZSBhZGQgYSBtYXJnaW4gb24gMjQgaG91cnMgdG8gYmUgc3VyZSB3ZSBsb2FkIGV2ZXJ5dGhpbmcgd2UgbmVlZC4gV2Ugd2lsbCBmaWx0ZXIgbWF0Y2hpbmdcblx0XHQvLyBldmVudHMgYW55d2F5LlxuXHRcdGNvbnN0IHN0YXJ0SWQgPSBnZXRFdmVudEVsZW1lbnRNaW5JZChtb250aC5zdGFydCAtIERBWV9JTl9NSUxMSVMpXG5cdFx0Y29uc3QgZW5kSWQgPSBnZUV2ZW50RWxlbWVudE1heElkKG1vbnRoLmVuZCArIERBWV9JTl9NSUxMSVMpXG5cblx0XHQvLyBXZSBjb2xsZWN0IGV2ZW50cyBmcm9tIGFsbCBjYWxlbmRhcnMgdG9nZXRoZXIgYW5kIHRoZW4gcmVwbGFjZSBtYXAgc3luY2hyb25vdXNseS5cblx0XHQvLyBUaGlzIGlzIGltcG9ydGFudCB0byByZXBsYWNlIHRoZSBtYXAgc3luY2hyb25vdXNseSB0byBub3QgZ2V0IHJhY2UgY29uZGl0aW9ucyBiZWNhdXNlIHdlIGxvYWQgZGlmZmVyZW50IG1vbnRocyBpbiBwYXJhbGxlbC5cblx0XHQvLyBXZSBjb3VsZCByZXBsYWNlIG1hcCBtb3JlIG9mdGVuIGluc3RlYWQgb2YgYWdncmVnYXRpbmcgZXZlbnRzIGJ1dCB0aGlzIHdvdWxkIG1lYW4gY3JlYXRpbmcgZXZlbiBtb3JlIChjYWxzICogbW9udGhzKSBtYXBzLlxuXHRcdC8vXG5cdFx0Ly8gTm90ZTogdGhlcmUgbWF5IGJlIGlzc3VlcyBpZiB3ZSBnZXQgZW50aXR5IHVwZGF0ZSBiZWZvcmUgb3RoZXIgY2FsZW5kYXJzIGZpbmlzaCBsb2FkaW5nIGJ1dCB0aGUgY2hhbmNlIGlzIGxvdyBhbmQgd2UgZG8gbm90XG5cdFx0Ly8gdGFrZSBjYXJlIG9mIHRoaXMgbm93LlxuXG5cdFx0Y29uc3QgY2FsZW5kYXJzOiBBcnJheTx7IGxvbmc6IENhbGVuZGFyRXZlbnRbXTsgc2hvcnQ6IENhbGVuZGFyRXZlbnRbXSB9PiA9IFtdXG5cblx0XHRmb3IgKGNvbnN0IHsgZ3JvdXBSb290IH0gb2YgY2FsZW5kYXJJbmZvcy52YWx1ZXMoKSkge1xuXHRcdFx0Y29uc3QgW3Nob3J0RXZlbnRzUmVzdWx0LCBsb25nRXZlbnRzUmVzdWx0XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcblx0XHRcdFx0dGhpcy5jYWNoaW5nRW50aXR5Q2xpZW50LmxvYWRSZXZlcnNlUmFuZ2VCZXR3ZWVuKENhbGVuZGFyRXZlbnRUeXBlUmVmLCBncm91cFJvb3Quc2hvcnRFdmVudHMsIGVuZElkLCBzdGFydElkLCAyMDApLFxuXHRcdFx0XHR0aGlzLmNhY2hpbmdFbnRpdHlDbGllbnQubG9hZEFsbChDYWxlbmRhckV2ZW50VHlwZVJlZiwgZ3JvdXBSb290LmxvbmdFdmVudHMpLFxuXHRcdFx0XSlcblxuXHRcdFx0Y2FsZW5kYXJzLnB1c2goe1xuXHRcdFx0XHRzaG9ydDogc2hvcnRFdmVudHNSZXN1bHQuZWxlbWVudHMsXG5cdFx0XHRcdGxvbmc6IGxvbmdFdmVudHNSZXN1bHQsXG5cdFx0XHR9KVxuXHRcdH1cblx0XHRjb25zdCBuZXdFdmVudHMgPSBuZXcgTWFwPG51bWJlciwgQXJyYXk8Q2FsZW5kYXJFdmVudD4+KEFycmF5LmZyb20oZGF5c1RvRXZlbnRzLmVudHJpZXMoKSkubWFwKChbZGF5LCBldmVudHNdKSA9PiBbZGF5LCBldmVudHMuc2xpY2UoKV0pKVxuXG5cdFx0Ly8gR2VuZXJhdGUgZXZlbnRzIG9jY3VycmVuY2VzIHBlciBjYWxlbmRhciB0byBhdm9pZCBjYWxlbmRhcnMgZmxhc2hpbmcgaW4gdGhlIHNjcmVlblxuXHRcdGZvciAoY29uc3QgY2FsZW5kYXIgb2YgY2FsZW5kYXJzKSB7XG5cdFx0XHR0aGlzLmdlbmVyYXRlRXZlbnRPY2N1cmVuY2VzKG5ld0V2ZW50cywgY2FsZW5kYXIuc2hvcnQsIG1vbnRoLCB6b25lLCB0cnVlKVxuXHRcdFx0dGhpcy5nZW5lcmF0ZUV2ZW50T2NjdXJlbmNlcyhuZXdFdmVudHMsIGNhbGVuZGFyLmxvbmcsIG1vbnRoLCB6b25lLCBmYWxzZSlcblx0XHR9XG5cblx0XHRyZXR1cm4gbmV3RXZlbnRzXG5cdH1cblxuXHRwcml2YXRlIGdlbmVyYXRlRXZlbnRPY2N1cmVuY2VzKFxuXHRcdGV2ZW50TWFwOiBNYXA8bnVtYmVyLCBDYWxlbmRhckV2ZW50W10+LFxuXHRcdGV2ZW50czogQ2FsZW5kYXJFdmVudFtdLFxuXHRcdHJhbmdlOiBDYWxlbmRhclRpbWVSYW5nZSxcblx0XHR6b25lOiBzdHJpbmcsXG5cdFx0b3ZlcndyaXRlUmFuZ2U6IGJvb2xlYW4sXG5cdCkge1xuXHRcdGZvciAoY29uc3QgZSBvZiBldmVudHMpIHtcblx0XHRcdC8vIE92ZXJyaWRlcyBlbmQgb2YgcmFuZ2UgdG8gcHJldmVudCBldmVudHMgZnJvbSBiZWluZyB0cnVuY2F0ZWQuIEdlbmVyYXRpbmcgdGhlbSB1bnRpbCB0aGUgZW5kIG9mIHRoZSBldmVudFxuXHRcdFx0Ly8gaW5zdGVhZCBvZiB0aGUgb3JpZ2luYWwgZW5kIGd1YXJhbnRlZXMgdGhhdCB0aGUgZXZlbnQgd2lsbCBiZSBmdWxseSBkaXNwbGF5ZWQuIFRoaXMgV0lMTCBOT1QgZW5kIGluIGFuXG5cdFx0XHQvLyBlbmRsZXNzIGxvb3AsIGJlY2F1c2Ugc2hvcnQgZXZlbnRzIGxhc3QgYSBtYXhpbXVtIG9mIHR3byB3ZWVrcy5cblx0XHRcdGNvbnN0IGdlbmVyYXRpb25SYW5nZSA9IG92ZXJ3cml0ZVJhbmdlID8geyAuLi5yYW5nZSwgZW5kOiBlLmVuZFRpbWUuZ2V0VGltZSgpIH0gOiByYW5nZVxuXG5cdFx0XHRpZiAoZS5yZXBlYXRSdWxlKSB7XG5cdFx0XHRcdGFkZERheXNGb3JSZWN1cnJpbmdFdmVudChldmVudE1hcCwgZSwgZ2VuZXJhdGlvblJhbmdlLCB6b25lKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YWRkRGF5c0ZvckV2ZW50SW5zdGFuY2UoZXZlbnRNYXAsIGUsIGdlbmVyYXRpb25SYW5nZSwgem9uZSlcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogV2UgdHJ5IHRvIGNyZWF0ZSBhcyBtYW55IGV2ZW50cyBhcyBwb3NzaWJsZSBhbmQgb25seSB0aHJvdyB0aGUgZXJyb3IgYXQgdGhlIGVuZC5cblx0ICogSWYgYWxhcm1Ob3RpZmljYXRpb25zIGFyZSBjcmVhdGVkIGZvciBhbiBldmVudCB0aGF0IHdpbGwgbGF0ZXIgZmFpbCB0byBiZSBjcmVhdGVkIHdlIGlnbm9yZSB0aGVtLlxuXHQgKiBUaGlzIGZ1bmN0aW9uIGRvZXMgbm90IHBlcmZvcm0gYW55IGNoZWNrcyBvbiB0aGUgZXZlbnQgc28gaXQgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIGludGVybmFsbHkgd2hlblxuXHQgKiB3ZSBjYW4gYmUgc3VyZSB0aGF0IHRob3NlIGNoZWNrcyBoYXZlIGFscmVhZHkgYmVlbiBwZXJmb3JtZWQuXG5cdCAqIEBwYXJhbSBldmVudHNXcmFwcGVyIHRoZSBldmVudHMgYW5kIGFsYXJtTm90aWZpY2F0aW9ucyB0byBiZSBjcmVhdGVkLlxuXHQgKiBAcGFyYW0gb25Qcm9ncmVzc1xuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBzYXZlQ2FsZW5kYXJFdmVudHMoZXZlbnRzV3JhcHBlcjogQXJyYXk8RXZlbnRXcmFwcGVyPiwgb25Qcm9ncmVzczogKHBlcmNlbnQ6IG51bWJlcikgPT4gUHJvbWlzZTx2b2lkPik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGxldCBjdXJyZW50UHJvZ3Jlc3MgPSAxMFxuXHRcdGF3YWl0IG9uUHJvZ3Jlc3MoY3VycmVudFByb2dyZXNzKVxuXG5cdFx0Zm9yIChjb25zdCB7IGV2ZW50IH0gb2YgZXZlbnRzV3JhcHBlcikge1xuXHRcdFx0ZXZlbnQuaGFzaGVkVWlkID0gaGFzaFVpZChhc3NlcnROb3ROdWxsKGV2ZW50LnVpZCwgXCJ0cmllZCB0byBzYXZlIGNhbGVuZGFyIGV2ZW50IHdpdGhvdXQgdWlkLlwiKSlcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy51c2VyRmFjYWRlLmdldExvZ2dlZEluVXNlcigpXG5cblx0XHRjb25zdCBudW1FdmVudHMgPSBldmVudHNXcmFwcGVyLmxlbmd0aFxuXHRcdGxldCBldmVudHNXaXRoQWxhcm1zOiBBcnJheTxBbGFybU5vdGlmaWNhdGlvbnNQZXJFdmVudD5cblx0XHR0cnkge1xuXHRcdFx0ZXZlbnRzV2l0aEFsYXJtcyA9IGF3YWl0IHRoaXMuc2F2ZU11bHRpcGxlQWxhcm1zKHVzZXIsIGV2ZW50c1dyYXBwZXIpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBTZXR1cE11bHRpcGxlRXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJTYXZpbmcgYWxhcm1zIGZhaWxlZC5cIiwgZSlcblx0XHRcdFx0dGhyb3cgbmV3IEltcG9ydEVycm9yKGUuZXJyb3JzWzBdLCBcIkNvdWxkIG5vdCBzYXZlIGFsYXJtcy5cIiwgbnVtRXZlbnRzKVxuXHRcdFx0fVxuXHRcdFx0dGhyb3cgZVxuXHRcdH1cblx0XHRmb3IgKGNvbnN0IHsgZXZlbnQsIGFsYXJtSW5mb0lkcyB9IG9mIGV2ZW50c1dpdGhBbGFybXMpIHtcblx0XHRcdGV2ZW50LmFsYXJtSW5mb3MgPSBhbGFybUluZm9JZHNcblx0XHR9XG5cdFx0Y3VycmVudFByb2dyZXNzID0gMzNcblx0XHRhd2FpdCBvblByb2dyZXNzKGN1cnJlbnRQcm9ncmVzcylcblx0XHRjb25zdCBldmVudHNXaXRoQWxhcm1zQnlFdmVudExpc3RJZCA9IGdyb3VwQnkoZXZlbnRzV2l0aEFsYXJtcywgKGV2ZW50V3JhcHBlcikgPT4gZ2V0TGlzdElkKGV2ZW50V3JhcHBlci5ldmVudCkpXG5cdFx0bGV0IGNvbGxlY3RlZEFsYXJtTm90aWZpY2F0aW9uczogQWxhcm1Ob3RpZmljYXRpb25bXSA9IFtdXG5cdFx0Ly93ZSBoYXZlIGRpZmZlcmVudCBsaXN0cyBmb3Igc2hvcnQgYW5kIGxvbmcgZXZlbnRzIHNvIHRoaXMgaXMgMSBvciAyXG5cdFx0Y29uc3Qgc2l6ZSA9IGV2ZW50c1dpdGhBbGFybXNCeUV2ZW50TGlzdElkLnNpemVcblx0XHRsZXQgZmFpbGVkID0gMFxuXHRcdGxldCBlcnJvcnMgPSBbXSBhcyBBcnJheTxUdXRhbm90YUVycm9yPlxuXG5cdFx0Zm9yIChjb25zdCBbbGlzdElkLCBldmVudHNXaXRoQWxhcm1zT2ZPbmVMaXN0XSBvZiBldmVudHNXaXRoQWxhcm1zQnlFdmVudExpc3RJZCkge1xuXHRcdFx0bGV0IHN1Y2Nlc3NmdWxFdmVudHMgPSBldmVudHNXaXRoQWxhcm1zT2ZPbmVMaXN0XG5cdFx0XHRhd2FpdCB0aGlzLmNhY2hpbmdFbnRpdHlDbGllbnRcblx0XHRcdFx0LnNldHVwTXVsdGlwbGVFbnRpdGllcyhcblx0XHRcdFx0XHRsaXN0SWQsXG5cdFx0XHRcdFx0ZXZlbnRzV2l0aEFsYXJtc09mT25lTGlzdC5tYXAoKGUpID0+IGUuZXZlbnQpLFxuXHRcdFx0XHQpXG5cdFx0XHRcdC5jYXRjaChcblx0XHRcdFx0XHRvZkNsYXNzKFNldHVwTXVsdGlwbGVFcnJvciwgKGUpID0+IHtcblx0XHRcdFx0XHRcdGZhaWxlZCArPSBlLmZhaWxlZEluc3RhbmNlcy5sZW5ndGhcblx0XHRcdFx0XHRcdGVycm9ycyA9IGVycm9ycy5jb25jYXQoZS5lcnJvcnMpXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhlLmVycm9ycylcblx0XHRcdFx0XHRcdHN1Y2Nlc3NmdWxFdmVudHMgPSBldmVudHNXaXRoQWxhcm1zT2ZPbmVMaXN0LmZpbHRlcigoeyBldmVudCB9KSA9PiAhZS5mYWlsZWRJbnN0YW5jZXMuaW5jbHVkZXMoZXZlbnQpKVxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpXG5cdFx0XHRjb25zdCBhbGxBbGFybU5vdGlmaWNhdGlvbnNPZkxpc3RJZCA9IHN1Y2Nlc3NmdWxFdmVudHMubWFwKChldmVudCkgPT4gZXZlbnQuYWxhcm1Ob3RpZmljYXRpb25zKS5mbGF0KClcblx0XHRcdGNvbGxlY3RlZEFsYXJtTm90aWZpY2F0aW9ucyA9IGNvbGxlY3RlZEFsYXJtTm90aWZpY2F0aW9ucy5jb25jYXQoYWxsQWxhcm1Ob3RpZmljYXRpb25zT2ZMaXN0SWQpXG5cdFx0XHRjdXJyZW50UHJvZ3Jlc3MgKz0gTWF0aC5mbG9vcig1NiAvIHNpemUpXG5cdFx0XHRhd2FpdCBvblByb2dyZXNzKGN1cnJlbnRQcm9ncmVzcylcblx0XHR9XG5cblx0XHRjb25zdCBwdXNoSWRlbnRpZmllckxpc3QgPSBhd2FpdCB0aGlzLmNhY2hpbmdFbnRpdHlDbGllbnQubG9hZEFsbChcblx0XHRcdFB1c2hJZGVudGlmaWVyVHlwZVJlZixcblx0XHRcdG5ldmVyTnVsbCh0aGlzLnVzZXJGYWNhZGUuZ2V0TG9nZ2VkSW5Vc2VyKCkucHVzaElkZW50aWZpZXJMaXN0KS5saXN0LFxuXHRcdClcblxuXHRcdGlmIChjb2xsZWN0ZWRBbGFybU5vdGlmaWNhdGlvbnMubGVuZ3RoID4gMCAmJiBwdXNoSWRlbnRpZmllckxpc3QubGVuZ3RoID4gMCkge1xuXHRcdFx0YXdhaXQgdGhpcy5zZW5kQWxhcm1Ob3RpZmljYXRpb25zKGNvbGxlY3RlZEFsYXJtTm90aWZpY2F0aW9ucywgcHVzaElkZW50aWZpZXJMaXN0KVxuXHRcdH1cblxuXHRcdGF3YWl0IG9uUHJvZ3Jlc3MoMTAwKVxuXG5cdFx0aWYgKGZhaWxlZCAhPT0gMCkge1xuXHRcdFx0aWYgKGVycm9ycy5zb21lKGlzT2ZmbGluZUVycm9yKSkge1xuXHRcdFx0XHQvL0luIHRoaXMgY2FzZSB0aGUgdXNlciB3aWxsIG5vdCBiZSBpbmZvcm1lZCBhYm91dCB0aGUgbnVtYmVyIG9mIGZhaWxlZCBldmVudHMuIFdlIGNvbnNpZGVyZWQgdGhpcyBpcyBva2F5IGJlY2F1c2UgaXQgaXMgbm90IGFjdGlvbmFibGUgYW55d2F5cy5cblx0XHRcdFx0dGhyb3cgbmV3IENvbm5lY3Rpb25FcnJvcihcIkNvbm5lY3Rpb24gbG9zdCB3aGlsZSBzYXZpbmcgZXZlbnRzXCIpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIkNvdWxkIG5vdCBzYXZlIGV2ZW50cy4gTnVtYmVyIG9mIGZhaWxlZCBpbXBvcnRzOiBcIiwgZmFpbGVkKVxuXHRcdFx0XHR0aHJvdyBuZXcgSW1wb3J0RXJyb3IoZXJyb3JzWzBdLCBcIkNvdWxkIG5vdCBzYXZlIGV2ZW50cy5cIiwgZmFpbGVkKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIHNhdmVDYWxlbmRhckV2ZW50KGV2ZW50OiBDYWxlbmRhckV2ZW50LCBhbGFybUluZm9zOiBSZWFkb25seUFycmF5PEFsYXJtSW5mb1RlbXBsYXRlPiwgb2xkRXZlbnQ6IENhbGVuZGFyRXZlbnQgfCBudWxsKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKGV2ZW50Ll9pZCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJObyBpZCBzZXQgb24gdGhlIGV2ZW50XCIpXG5cdFx0aWYgKGV2ZW50Ll9vd25lckdyb3VwID09IG51bGwpIHRocm93IG5ldyBFcnJvcihcIk5vIF9vd25lckdyb3VwIGlzIHNldCBvbiB0aGUgZXZlbnRcIilcblx0XHRpZiAoZXZlbnQudWlkID09IG51bGwpIHRocm93IG5ldyBFcnJvcihcIm5vIHVpZCBzZXQgb24gdGhlIGV2ZW50XCIpXG5cdFx0ZXZlbnQuaGFzaGVkVWlkID0gaGFzaFVpZChldmVudC51aWQpXG5cblx0XHRpZiAob2xkRXZlbnQpIHtcblx0XHRcdGF3YWl0IHRoaXMuY2FjaGluZ0VudGl0eUNsaWVudC5lcmFzZShvbGRFdmVudCkuY2F0Y2gob2ZDbGFzcyhOb3RGb3VuZEVycm9yLCAoKSA9PiBjb25zb2xlLmxvZyhcImNvdWxkIG5vdCBkZWxldGUgb2xkIGV2ZW50IHdoZW4gc2F2aW5nIG5ldyBvbmVcIikpKVxuXHRcdH1cblxuXHRcdHJldHVybiBhd2FpdCB0aGlzLnNhdmVDYWxlbmRhckV2ZW50cyhcblx0XHRcdFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGV2ZW50LFxuXHRcdFx0XHRcdGFsYXJtczogYWxhcm1JbmZvcyxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0XHQoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcblx0XHQpXG5cdH1cblxuXHRhc3luYyB1cGRhdGVDYWxlbmRhckV2ZW50KGV2ZW50OiBDYWxlbmRhckV2ZW50LCBuZXdBbGFybXM6IFJlYWRvbmx5QXJyYXk8QWxhcm1JbmZvVGVtcGxhdGU+LCBleGlzdGluZ0V2ZW50OiBDYWxlbmRhckV2ZW50KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0ZXZlbnQuX2lkID0gZXhpc3RpbmdFdmVudC5faWRcblx0XHRldmVudC5fb3duZXJFbmNTZXNzaW9uS2V5ID0gZXhpc3RpbmdFdmVudC5fb3duZXJFbmNTZXNzaW9uS2V5XG5cdFx0ZXZlbnQuX293bmVyS2V5VmVyc2lvbiA9IGV4aXN0aW5nRXZlbnQuX293bmVyS2V5VmVyc2lvblxuXHRcdGV2ZW50Ll9wZXJtaXNzaW9ucyA9IGV4aXN0aW5nRXZlbnQuX3Blcm1pc3Npb25zXG5cdFx0aWYgKGV4aXN0aW5nRXZlbnQudWlkID09IG51bGwpIHRocm93IG5ldyBFcnJvcihcIm5vIHVpZCBzZXQgb24gdGhlIGV4aXN0aW5nIGV2ZW50XCIpXG5cdFx0ZXZlbnQudWlkID0gZXhpc3RpbmdFdmVudC51aWRcblx0XHRldmVudC5oYXNoZWRVaWQgPSBoYXNoVWlkKGV4aXN0aW5nRXZlbnQudWlkKVxuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMudXNlckZhY2FkZS5nZXRMb2dnZWRJblVzZXIoKVxuXG5cdFx0Y29uc3QgdXNlckFsYXJtSWRzV2l0aEFsYXJtTm90aWZpY2F0aW9uc1BlckV2ZW50ID0gYXdhaXQgdGhpcy5zYXZlTXVsdGlwbGVBbGFybXModXNlciwgW1xuXHRcdFx0e1xuXHRcdFx0XHRldmVudCxcblx0XHRcdFx0YWxhcm1zOiBuZXdBbGFybXMsXG5cdFx0XHR9LFxuXHRcdF0pXG5cdFx0Y29uc3QgeyBhbGFybUluZm9JZHMsIGFsYXJtTm90aWZpY2F0aW9ucyB9ID0gdXNlckFsYXJtSWRzV2l0aEFsYXJtTm90aWZpY2F0aW9uc1BlckV2ZW50WzBdXG5cdFx0Y29uc3QgdXNlckFsYXJtSW5mb0xpc3RJZCA9IG5ldmVyTnVsbCh1c2VyLmFsYXJtSW5mb0xpc3QpLmFsYXJtc1xuXHRcdC8vIFJlbW92ZSBhbGwgYWxhcm1zIHdoaWNoIGJlbG9uZ3MgdG8gdGhlIGN1cnJlbnQgdXNlci4gV2UgbmVlZCB0byBiZSBjYXJlZnVsIGFib3V0IG90aGVyIHVzZXJzJyBhbGFybXMuXG5cdFx0Ly8gU2VydmVyIHRha2VzIGNhcmUgb2YgdGhlIHJlbW92ZWQgYWxhcm1zLFxuXHRcdGV2ZW50LmFsYXJtSW5mb3MgPSBleGlzdGluZ0V2ZW50LmFsYXJtSW5mb3MuZmlsdGVyKChhKSA9PiAhaXNTYW1lSWQobGlzdElkUGFydChhKSwgdXNlckFsYXJtSW5mb0xpc3RJZCkpLmNvbmNhdChhbGFybUluZm9JZHMpXG5cdFx0YXdhaXQgdGhpcy5jYWNoaW5nRW50aXR5Q2xpZW50LnVwZGF0ZShldmVudClcblxuXHRcdGlmIChhbGFybU5vdGlmaWNhdGlvbnMubGVuZ3RoID4gMCkge1xuXHRcdFx0Y29uc3QgcHVzaElkZW50aWZpZXJMaXN0ID0gYXdhaXQgdGhpcy5jYWNoaW5nRW50aXR5Q2xpZW50LmxvYWRBbGwoXG5cdFx0XHRcdFB1c2hJZGVudGlmaWVyVHlwZVJlZixcblx0XHRcdFx0bmV2ZXJOdWxsKHRoaXMudXNlckZhY2FkZS5nZXRMb2dnZWRJblVzZXIoKS5wdXNoSWRlbnRpZmllckxpc3QpLmxpc3QsXG5cdFx0XHQpXG5cdFx0XHRhd2FpdCB0aGlzLnNlbmRBbGFybU5vdGlmaWNhdGlvbnMoYWxhcm1Ob3RpZmljYXRpb25zLCBwdXNoSWRlbnRpZmllckxpc3QpXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIGdldCBhbGwgdGhlIGNhbGVuZGFyIGV2ZW50IGluc3RhbmNlcyBpbiB0aGUgZ2l2ZW4gdGltZSByYW5nZSB0aGF0IGFyZSBnZW5lcmF0ZWQgYnkgdGhlIGdpdmVuIHByb2dlbml0b3IgSWRzXG5cdCAqL1xuXHRhc3luYyByZWlmeUNhbGVuZGFyU2VhcmNoUmVzdWx0KHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyLCByZXN1bHRzOiBBcnJheTxJZFR1cGxlPik6IFByb21pc2U8QXJyYXk8Q2FsZW5kYXJFdmVudD4+IHtcblx0XHRjb25zdCBmaWx0ZXJlZEV2ZW50cyA9IHJlc3VsdHMuZmlsdGVyKChbY2FsZW5kYXJJZCwgZXZlbnRJZF0pID0+ICFpc0NsaWVudE9ubHlDYWxlbmRhcihjYWxlbmRhcklkKSlcblx0XHRjb25zdCBwcm9nZW5pdG9ycyA9IGF3YWl0IGxvYWRNdWx0aXBsZUZyb21MaXN0cyhDYWxlbmRhckV2ZW50VHlwZVJlZiwgdGhpcy5jYWNoaW5nRW50aXR5Q2xpZW50LCBmaWx0ZXJlZEV2ZW50cylcblx0XHRjb25zdCByYW5nZTogQ2FsZW5kYXJUaW1lUmFuZ2UgPSB7IHN0YXJ0LCBlbmQgfVxuXHRcdHJldHVybiBnZW5lcmF0ZUNhbGVuZGFySW5zdGFuY2VzSW5SYW5nZShwcm9nZW5pdG9ycywgcmFuZ2UpXG5cdH1cblxuXHRhc3luYyBhZGRDYWxlbmRhcihuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHsgdXNlcjogVXNlcjsgZ3JvdXA6IEdyb3VwIH0+IHtcblx0XHRyZXR1cm4gYXdhaXQgdGhpcy5ncm91cE1hbmFnZW1lbnRGYWNhZGUuY3JlYXRlQ2FsZW5kYXIobmFtZSlcblx0fVxuXG5cdGFzeW5jIGRlbGV0ZUNhbGVuZGFyKGdyb3VwUm9vdElkOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLmRlbGV0ZShDYWxlbmRhclNlcnZpY2UsIGNyZWF0ZUNhbGVuZGFyRGVsZXRlRGF0YSh7IGdyb3VwUm9vdElkIH0pKVxuXHR9XG5cblx0YXN5bmMgc2NoZWR1bGVBbGFybXNGb3JOZXdEZXZpY2UocHVzaElkZW50aWZpZXI6IFB1c2hJZGVudGlmaWVyKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMudXNlckZhY2FkZS5nZXRMb2dnZWRJblVzZXIoKVxuXG5cdFx0Y29uc3QgZXZlbnRzV2l0aEFsYXJtSW5mb3MgPSBhd2FpdCB0aGlzLmxvYWRBbGFybUV2ZW50cygpXG5cdFx0Y29uc3QgYWxhcm1Ob3RpZmljYXRpb25zID0gZmxhdE1hcChldmVudHNXaXRoQWxhcm1JbmZvcywgKHsgZXZlbnQsIHVzZXJBbGFybUluZm9zIH0pID0+XG5cdFx0XHR1c2VyQWxhcm1JbmZvcy5tYXAoKHVzZXJBbGFybUluZm8pID0+IGNyZWF0ZUFsYXJtTm90aWZpY2F0aW9uRm9yRXZlbnQoZXZlbnQsIHVzZXJBbGFybUluZm8uYWxhcm1JbmZvLCB1c2VyLl9pZCkpLFxuXHRcdClcblx0XHQvLyBUaGVvcmV0aWNhbGx5IHdlIGRvbid0IG5lZWQgdG8gZW5jcnlwdCBhbnl0aGluZyBpZiB3ZSBhcmUgc2VuZGluZyB0aGluZ3MgbG9jYWxseSBidXQgd2UgdXNlIGFscmVhZHkgZW5jcnlwdGVkIGRhdGEgb24gdGhlIGNsaWVudFxuXHRcdC8vIHRvIHN0b3JlIGFsYXJtcyBzZWN1cmVseS5cblx0XHRjb25zdCBub3RpZmljYXRpb25LZXkgPSBhZXMyNTZSYW5kb21LZXkoKVxuXHRcdGF3YWl0IHRoaXMuZW5jcnlwdE5vdGlmaWNhdGlvbktleUZvckRldmljZXMobm90aWZpY2F0aW9uS2V5LCBhbGFybU5vdGlmaWNhdGlvbnMsIFtwdXNoSWRlbnRpZmllcl0pXG5cdFx0Y29uc3QgcmVxdWVzdEVudGl0eSA9IGNyZWF0ZUFsYXJtU2VydmljZVBvc3Qoe1xuXHRcdFx0YWxhcm1Ob3RpZmljYXRpb25zLFxuXHRcdH0pXG5cdFx0Y29uc3QgQWxhcm1TZXJ2aWNlUG9zdFR5cGVNb2RlbCA9IGF3YWl0IHJlc29sdmVUeXBlUmVmZXJlbmNlKEFsYXJtU2VydmljZVBvc3RUeXBlUmVmKVxuXHRcdGNvbnN0IGVuY0VudGl0eSA9IGF3YWl0IHRoaXMuaW5zdGFuY2VNYXBwZXIuZW5jcnlwdEFuZE1hcFRvTGl0ZXJhbChBbGFybVNlcnZpY2VQb3N0VHlwZU1vZGVsLCByZXF1ZXN0RW50aXR5LCBub3RpZmljYXRpb25LZXkpXG5cdFx0Y29uc3QgZW5jcnlwdGVkQWxhcm1zOiBFbmNyeXB0ZWRBbGFybU5vdGlmaWNhdGlvbltdID0gZG93bmNhc3QoZW5jRW50aXR5KS5hbGFybU5vdGlmaWNhdGlvbnNcblx0XHRhd2FpdCB0aGlzLm5hdGl2ZVB1c2hGYWNhZGUuc2NoZWR1bGVBbGFybXMoZW5jcnlwdGVkQWxhcm1zKVxuXHR9XG5cblx0LyoqXG5cdCAqIExvYWQgYWxsIGV2ZW50cyB0aGF0IGhhdmUgYW4gYWxhcm0gYXNzaWduZWQuXG5cdCAqIEByZXR1cm46IE1hcCBmcm9tIGNvbmNhdGVuYXRlZCBMaXN0SWQgb2YgYW4gZXZlbnQgdG8gbGlzdCBvZiBVc2VyQWxhcm1JbmZvcyBmb3IgdGhhdCBldmVudFxuXHQgKi9cblx0YXN5bmMgbG9hZEFsYXJtRXZlbnRzKCk6IFByb21pc2U8QXJyYXk8RXZlbnRXaXRoVXNlckFsYXJtSW5mb3M+PiB7XG5cdFx0Y29uc3QgYWxhcm1JbmZvTGlzdCA9IHRoaXMudXNlckZhY2FkZS5nZXRMb2dnZWRJblVzZXIoKS5hbGFybUluZm9MaXN0XG5cblx0XHRpZiAoIWFsYXJtSW5mb0xpc3QpIHtcblx0XHRcdGNvbnNvbGUud2FybihcIk5vIGFsYXJtSW5mbyBsaXN0IG9uIHVzZXJcIilcblx0XHRcdHJldHVybiBbXVxuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXJBbGFybUluZm9zID0gYXdhaXQgdGhpcy5jYWNoaW5nRW50aXR5Q2xpZW50LmxvYWRBbGwoVXNlckFsYXJtSW5mb1R5cGVSZWYsIGFsYXJtSW5mb0xpc3QuYWxhcm1zKVxuXHRcdC8vIEdyb3VwIHJlZmVyZW5jZWQgZXZlbnQgaWRzIGJ5IGxpc3QgaWQgc28gd2UgY2FuIGxvYWQgZXZlbnRzIG9mIG9uZSBsaXN0IGluIG9uZSByZXF1ZXN0LlxuXHRcdGNvbnN0IGxpc3RJZFRvRWxlbWVudElkcyA9IGdyb3VwQnlBbmRNYXBVbmlxdWVseShcblx0XHRcdHVzZXJBbGFybUluZm9zLFxuXHRcdFx0KHVzZXJBbGFybUluZm8pID0+IHVzZXJBbGFybUluZm8uYWxhcm1JbmZvLmNhbGVuZGFyUmVmLmxpc3RJZCxcblx0XHRcdCh1c2VyQWxhcm1JbmZvKSA9PiB1c2VyQWxhcm1JbmZvLmFsYXJtSW5mby5jYWxlbmRhclJlZi5lbGVtZW50SWQsXG5cdFx0KVxuXHRcdC8vIHdlIGdyb3VwIGJ5IHRoZSBmdWxsIGNvbmNhdGVuYXRlZCBsaXN0IGlkXG5cdFx0Ly8gYmVjYXVzZSB0aGVyZSBtaWdodCBiZSBjb2xsaXNpb25zIGJldHdlZW4gZXZlbnQgZWxlbWVudCBpZHMgZHVlIHRvIGJlaW5nIGN1c3RvbSBpZHNcblx0XHRjb25zdCBldmVudElkVG9BbGFybUluZm9zID0gZ3JvdXBCeSh1c2VyQWxhcm1JbmZvcywgKHVzZXJBbGFybUluZm8pID0+IGdldEV2ZW50SWRGcm9tVXNlckFsYXJtSW5mbyh1c2VyQWxhcm1JbmZvKS5qb2luKFwiXCIpKVxuXHRcdGNvbnN0IGNhbGVuZGFyRXZlbnRzID0gYXdhaXQgcHJvbWlzZU1hcChsaXN0SWRUb0VsZW1lbnRJZHMuZW50cmllcygpLCAoW2xpc3RJZCwgZWxlbWVudElkc10pID0+IHtcblx0XHRcdHJldHVybiB0aGlzLmNhY2hpbmdFbnRpdHlDbGllbnQubG9hZE11bHRpcGxlKENhbGVuZGFyRXZlbnRUeXBlUmVmLCBsaXN0SWQsIEFycmF5LmZyb20oZWxlbWVudElkcykpLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0XHQvLyBoYW5kbGUgTm90QXV0aG9yaXplZCBoZXJlIGJlY2F1c2UgdXNlciBjb3VsZCBoYXZlIGJlZW4gcmVtb3ZlZCBmcm9tIGdyb3VwLlxuXHRcdFx0XHRpZiAoZXJyb3IgaW5zdGFuY2VvZiBOb3RBdXRob3JpemVkRXJyb3IpIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oXCJOb3RBdXRob3JpemVkIHdoZW4gZG93bmxvYWRpbmcgYWxhcm0gZXZlbnRzXCIsIGVycm9yKVxuXHRcdFx0XHRcdHJldHVybiBbXVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhyb3cgZXJyb3Jcblx0XHRcdH0pXG5cdFx0fSlcblx0XHRyZXR1cm4gY2FsZW5kYXJFdmVudHMuZmxhdCgpLm1hcCgoZXZlbnQpID0+IHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGV2ZW50LFxuXHRcdFx0XHR1c2VyQWxhcm1JbmZvczogZ2V0RnJvbU1hcChldmVudElkVG9BbGFybUluZm9zLCBnZXRMZXRJZChldmVudCkuam9pbihcIlwiKSwgKCkgPT4gW10pLFxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHQvKipcblx0ICogUXVlcmllcyB0aGUgZXZlbnRzIHVzaW5nIHRoZSB1aWQgaW5kZXguIFRoZSBpbmRleCBpcyBzdG9yZWQgcGVyIGNhbGVuZGFyLCBzbyB3ZSBoYXZlIHRvIGdvIHRocm91Z2ggYWxsIGNhbGVuZGFyc1xuXHQgKiB0byBmaW5kIHRoZSBtYXRjaGluZyBldmVudHMuIFdlIGN1cnJlbnRseSBvbmx5IG5lZWQgdGhpcyBmb3IgY2FsZW5kYXIgZXZlbnQgdXBkYXRlcyBhbmQgZm9yIHRoYXQgd2UgZG9uJ3Qgd2FudCB0b1xuXHQgKiBsb29rIGludG8gc2hhcmVkIGNhbGVuZGFycy5cblx0ICpcblx0ICogQHJldHVybnMge0NhbGVuZGFyRXZlbnRVaWRJbmRleEVudHJ5fVxuXHQgKi9cblx0YXN5bmMgZ2V0RXZlbnRzQnlVaWQodWlkOiBzdHJpbmcsIGNhY2hlTW9kZTogQ2FjaGluZ01vZGUgPSBDYWNoaW5nTW9kZS5DYWNoZWQpOiBQcm9taXNlPENhbGVuZGFyRXZlbnRVaWRJbmRleEVudHJ5IHwgbnVsbD4ge1xuXHRcdGNvbnN0IHsgbWVtYmVyc2hpcHMgfSA9IHRoaXMudXNlckZhY2FkZS5nZXRMb2dnZWRJblVzZXIoKVxuXHRcdGNvbnN0IGVudGl0eUNsaWVudCA9IHRoaXMuZ2V0RW50aXR5Q2xpZW50KGNhY2hlTW9kZSlcblx0XHRmb3IgKGNvbnN0IG1lbWJlcnNoaXAgb2YgbWVtYmVyc2hpcHMpIHtcblx0XHRcdGlmIChtZW1iZXJzaGlwLmdyb3VwVHlwZSAhPT0gR3JvdXBUeXBlLkNhbGVuZGFyKSBjb250aW51ZVxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgZ3JvdXBSb290ID0gYXdhaXQgdGhpcy5jYWNoaW5nRW50aXR5Q2xpZW50LmxvYWQoQ2FsZW5kYXJHcm91cFJvb3RUeXBlUmVmLCBtZW1iZXJzaGlwLmdyb3VwKVxuXHRcdFx0XHRpZiAoZ3JvdXBSb290LmluZGV4ID09IG51bGwpIHtcblx0XHRcdFx0XHRjb250aW51ZVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgaW5kZXhFbnRyeTogQ2FsZW5kYXJFdmVudFVpZEluZGV4ID0gYXdhaXQgZW50aXR5Q2xpZW50LmxvYWQ8Q2FsZW5kYXJFdmVudFVpZEluZGV4PihDYWxlbmRhckV2ZW50VWlkSW5kZXhUeXBlUmVmLCBbXG5cdFx0XHRcdFx0Z3JvdXBSb290LmluZGV4Lmxpc3QsXG5cdFx0XHRcdFx0dWludDhhcnJheVRvQ3VzdG9tSWQoaGFzaFVpZCh1aWQpKSxcblx0XHRcdFx0XSlcblxuXHRcdFx0XHRjb25zdCBwcm9nZW5pdG9yOiBDYWxlbmRhckV2ZW50UHJvZ2VuaXRvciB8IG51bGwgPSBhd2FpdCBsb2FkUHJvZ2VuaXRvckZyb21JbmRleEVudHJ5KGVudGl0eUNsaWVudCwgaW5kZXhFbnRyeSlcblx0XHRcdFx0Y29uc3QgYWx0ZXJlZEluc3RhbmNlczogQXJyYXk8Q2FsZW5kYXJFdmVudEFsdGVyZWRJbnN0YW5jZT4gPSBhd2FpdCBsb2FkQWx0ZXJlZEluc3RhbmNlc0Zyb21JbmRleEVudHJ5KGVudGl0eUNsaWVudCwgaW5kZXhFbnRyeSlcblx0XHRcdFx0cmV0dXJuIHsgcHJvZ2VuaXRvciwgYWx0ZXJlZEluc3RhbmNlcywgb3duZXJHcm91cDogYXNzZXJ0Tm90TnVsbChpbmRleEVudHJ5Ll9vd25lckdyb3VwLCBcIm93bmVyZ3JvdXAgb24gaW5kZXggZW50cnkgd2FzIG51bGwhXCIpIH1cblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBOb3RGb3VuZEVycm9yIHx8IGUgaW5zdGFuY2VvZiBOb3RBdXRob3JpemVkRXJyb3IpIHtcblx0XHRcdFx0XHRjb250aW51ZVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRocm93IGVcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbnVsbFxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzZW5kQWxhcm1Ob3RpZmljYXRpb25zKGFsYXJtTm90aWZpY2F0aW9uczogQXJyYXk8QWxhcm1Ob3RpZmljYXRpb24+LCBwdXNoSWRlbnRpZmllckxpc3Q6IEFycmF5PFB1c2hJZGVudGlmaWVyPik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG5vdGlmaWNhdGlvblNlc3Npb25LZXkgPSBhZXMyNTZSYW5kb21LZXkoKVxuXHRcdHJldHVybiB0aGlzLmVuY3J5cHROb3RpZmljYXRpb25LZXlGb3JEZXZpY2VzKG5vdGlmaWNhdGlvblNlc3Npb25LZXksIGFsYXJtTm90aWZpY2F0aW9ucywgcHVzaElkZW50aWZpZXJMaXN0KS50aGVuKGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnN0IHJlcXVlc3RFbnRpdHkgPSBjcmVhdGVBbGFybVNlcnZpY2VQb3N0KHtcblx0XHRcdFx0YWxhcm1Ob3RpZmljYXRpb25zLFxuXHRcdFx0fSlcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLnBvc3QoQWxhcm1TZXJ2aWNlLCByZXF1ZXN0RW50aXR5LCB7IHNlc3Npb25LZXk6IG5vdGlmaWNhdGlvblNlc3Npb25LZXkgfSlcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBQYXlsb2FkVG9vTGFyZ2VFcnJvcikge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmluZm9NZXNzYWdlSGFuZGxlci5vbkluZm9NZXNzYWdlKHtcblx0XHRcdFx0XHRcdHRyYW5zbGF0aW9uS2V5OiBcImNhbGVuZGFyQWxhcm1zVG9vQmlnRXJyb3JfbXNnXCIsXG5cdFx0XHRcdFx0XHRhcmdzOiB7fSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGVuY3J5cHROb3RpZmljYXRpb25LZXlGb3JEZXZpY2VzKFxuXHRcdG5vdGlmaWNhdGlvblNlc3Npb25LZXk6IEFlc0tleSxcblx0XHRhbGFybU5vdGlmaWNhdGlvbnM6IEFycmF5PEFsYXJtTm90aWZpY2F0aW9uPixcblx0XHRwdXNoSWRlbnRpZmllckxpc3Q6IEFycmF5PFB1c2hJZGVudGlmaWVyPixcblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gUHVzaElEIFNLIC0+KiBOb3RpZmljYXRpb24gU0sgLT4gYWxhcm0gZmllbGRzXG5cdFx0Y29uc3QgbWF5YmVFbmNTZXNzaW9uS2V5cyA9IGF3YWl0IHByb21pc2VNYXAocHVzaElkZW50aWZpZXJMaXN0LCBhc3luYyAoaWRlbnRpZmllcikgPT4ge1xuXHRcdFx0Y29uc3QgcHVzaElkZW50aWZpZXJTayA9IGF3YWl0IHRoaXMuY3J5cHRvRmFjYWRlLnJlc29sdmVTZXNzaW9uS2V5Rm9ySW5zdGFuY2UoaWRlbnRpZmllcilcblx0XHRcdGlmIChwdXNoSWRlbnRpZmllclNrKSB7XG5cdFx0XHRcdGNvbnN0IHB1c2hJZGVudGlmaWVyU2Vzc2lvbkVuY1Nlc3Npb25LZXkgPSBlbmNyeXB0S2V5KHB1c2hJZGVudGlmaWVyU2ssIG5vdGlmaWNhdGlvblNlc3Npb25LZXkpXG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0aWRlbnRpZmllcklkOiBpZGVudGlmaWVyLl9pZCxcblx0XHRcdFx0XHRwdXNoSWRlbnRpZmllclNlc3Npb25FbmNTZXNzaW9uS2V5LFxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0fVxuXHRcdH0pIC8vIHJhdGUgbGltaXRpbmcgYWdhaW5zdCBibG9ja2luZyB3aGlsZSByZXNvbHZpbmcgc2Vzc2lvbiBrZXlzIChuZWNjZXNzYXJ5KVxuXHRcdGNvbnN0IGVuY1Nlc3Npb25LZXlzID0gbWF5YmVFbmNTZXNzaW9uS2V5cy5maWx0ZXIoaXNOb3ROdWxsKVxuXG5cdFx0Zm9yIChsZXQgbm90aWZpY2F0aW9uIG9mIGFsYXJtTm90aWZpY2F0aW9ucykge1xuXHRcdFx0bm90aWZpY2F0aW9uLm5vdGlmaWNhdGlvblNlc3Npb25LZXlzID0gZW5jU2Vzc2lvbktleXMubWFwKChlc2spID0+IHtcblx0XHRcdFx0cmV0dXJuIGNyZWF0ZU5vdGlmaWNhdGlvblNlc3Npb25LZXkoe1xuXHRcdFx0XHRcdHB1c2hJZGVudGlmaWVyOiBlc2suaWRlbnRpZmllcklkLFxuXHRcdFx0XHRcdHB1c2hJZGVudGlmaWVyU2Vzc2lvbkVuY1Nlc3Npb25LZXk6IGVzay5wdXNoSWRlbnRpZmllclNlc3Npb25FbmNTZXNzaW9uS2V5LFxuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNhdmVNdWx0aXBsZUFsYXJtcyhcblx0XHR1c2VyOiBVc2VyLFxuXHRcdGV2ZW50c1dyYXBwZXI6IEFycmF5PHtcblx0XHRcdGV2ZW50OiBDYWxlbmRhckV2ZW50XG5cdFx0XHRhbGFybXM6IFJlYWRvbmx5QXJyYXk8QWxhcm1JbmZvVGVtcGxhdGU+XG5cdFx0fT4sXG5cdCk6IFByb21pc2U8QXJyYXk8QWxhcm1Ob3RpZmljYXRpb25zUGVyRXZlbnQ+PiB7XG5cdFx0Y29uc3QgdXNlckFsYXJtSW5mb3NBbmROb3RpZmljYXRpb25zUGVyRXZlbnQ6IEFycmF5PHtcblx0XHRcdGV2ZW50OiBDYWxlbmRhckV2ZW50XG5cdFx0XHR1c2VyQWxhcm1JbmZvQW5kTm90aWZpY2F0aW9uOiBBcnJheTx7XG5cdFx0XHRcdGFsYXJtOiBVc2VyQWxhcm1JbmZvXG5cdFx0XHRcdGFsYXJtTm90aWZpY2F0aW9uOiBBbGFybU5vdGlmaWNhdGlvblxuXHRcdFx0fT5cblx0XHR9PiA9IFtdXG5cdFx0Y29uc3QgdXNlckFsYXJtSW5mb0xpc3RJZCA9IG5ldmVyTnVsbCh1c2VyLmFsYXJtSW5mb0xpc3QpLmFsYXJtc1xuXHRcdGNvbnN0IG93bmVyR3JvdXAgPSB1c2VyLnVzZXJHcm91cC5ncm91cFxuXG5cdFx0Zm9yIChjb25zdCB7IGV2ZW50LCBhbGFybXMgfSBvZiBldmVudHNXcmFwcGVyKSB7XG5cdFx0XHRjb25zdCB1c2VyQWxhcm1JbmZvQW5kTm90aWZpY2F0aW9uOiBBcnJheTx7XG5cdFx0XHRcdGFsYXJtOiBVc2VyQWxhcm1JbmZvXG5cdFx0XHRcdGFsYXJtTm90aWZpY2F0aW9uOiBBbGFybU5vdGlmaWNhdGlvblxuXHRcdFx0fT4gPSBbXVxuXHRcdFx0Y29uc3QgY2FsZW5kYXJSZWYgPSBjcmVhdGVDYWxlbmRhckV2ZW50UmVmKHtcblx0XHRcdFx0bGlzdElkOiBsaXN0SWRQYXJ0KGV2ZW50Ll9pZCksXG5cdFx0XHRcdGVsZW1lbnRJZDogZWxlbWVudElkUGFydChldmVudC5faWQpLFxuXHRcdFx0fSlcblxuXHRcdFx0Zm9yIChjb25zdCBhbGFybUluZm8gb2YgYWxhcm1zKSB7XG5cdFx0XHRcdGNvbnN0IHVzZXJBbGFybUluZm8gPSBjcmVhdGVVc2VyQWxhcm1JbmZvKHtcblx0XHRcdFx0XHRfb3duZXJHcm91cDogb3duZXJHcm91cCxcblx0XHRcdFx0XHRhbGFybUluZm86IGNyZWF0ZUFsYXJtSW5mbyh7XG5cdFx0XHRcdFx0XHRhbGFybUlkZW50aWZpZXI6IGFsYXJtSW5mby5hbGFybUlkZW50aWZpZXIsXG5cdFx0XHRcdFx0XHR0cmlnZ2VyOiBhbGFybUluZm8udHJpZ2dlcixcblx0XHRcdFx0XHRcdGNhbGVuZGFyUmVmOiBjYWxlbmRhclJlZixcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0fSlcblxuXHRcdFx0XHRjb25zdCBhbGFybU5vdGlmaWNhdGlvbiA9IGNyZWF0ZUFsYXJtTm90aWZpY2F0aW9uRm9yRXZlbnQoZXZlbnQsIHVzZXJBbGFybUluZm8uYWxhcm1JbmZvLCB1c2VyLl9pZClcblx0XHRcdFx0dXNlckFsYXJtSW5mb0FuZE5vdGlmaWNhdGlvbi5wdXNoKHtcblx0XHRcdFx0XHRhbGFybTogdXNlckFsYXJtSW5mbyxcblx0XHRcdFx0XHRhbGFybU5vdGlmaWNhdGlvbixcblx0XHRcdFx0fSlcblx0XHRcdH1cblxuXHRcdFx0dXNlckFsYXJtSW5mb3NBbmROb3RpZmljYXRpb25zUGVyRXZlbnQucHVzaCh7XG5cdFx0XHRcdGV2ZW50LFxuXHRcdFx0XHR1c2VyQWxhcm1JbmZvQW5kTm90aWZpY2F0aW9uLFxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRjb25zdCBhbGxBbGFybXMgPSB1c2VyQWxhcm1JbmZvc0FuZE5vdGlmaWNhdGlvbnNQZXJFdmVudC5mbGF0TWFwKCh7IHVzZXJBbGFybUluZm9BbmROb3RpZmljYXRpb24gfSkgPT5cblx0XHRcdHVzZXJBbGFybUluZm9BbmROb3RpZmljYXRpb24ubWFwKCh7IGFsYXJtIH0pID0+IGFsYXJtKSxcblx0XHQpXG5cblx0XHRjb25zdCBhbGFybUlkczogQXJyYXk8SWQ+ID0gYXdhaXQgdGhpcy5jYWNoaW5nRW50aXR5Q2xpZW50LnNldHVwTXVsdGlwbGVFbnRpdGllcyh1c2VyQWxhcm1JbmZvTGlzdElkLCBhbGxBbGFybXMpXG5cdFx0bGV0IGN1cnJlbnRJbmRleCA9IDBcblx0XHRyZXR1cm4gdXNlckFsYXJtSW5mb3NBbmROb3RpZmljYXRpb25zUGVyRXZlbnQubWFwKCh7IGV2ZW50LCB1c2VyQWxhcm1JbmZvQW5kTm90aWZpY2F0aW9uIH0pID0+IHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGV2ZW50LFxuXHRcdFx0XHRhbGFybUluZm9JZHM6IHVzZXJBbGFybUluZm9BbmROb3RpZmljYXRpb24ubWFwKCgpID0+IFt1c2VyQWxhcm1JbmZvTGlzdElkLCBhbGFybUlkc1tjdXJyZW50SW5kZXgrK11dKSxcblx0XHRcdFx0YWxhcm1Ob3RpZmljYXRpb25zOiB1c2VyQWxhcm1JbmZvQW5kTm90aWZpY2F0aW9uLm1hcCgoeyBhbGFybU5vdGlmaWNhdGlvbiB9KSA9PiBhbGFybU5vdGlmaWNhdGlvbiksXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgZ2V0RW50aXR5Q2xpZW50KGNhY2hlTW9kZTogQ2FjaGluZ01vZGUpOiBFbnRpdHlDbGllbnQge1xuXHRcdGlmIChjYWNoZU1vZGUgPT09IENhY2hpbmdNb2RlLkNhY2hlZCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuY2FjaGluZ0VudGl0eUNsaWVudFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5ub25jYWNoaW5nRW50aXR5Q2xpZW50XG5cdFx0fVxuXHR9XG59XG5cbmV4cG9ydCB0eXBlIEV2ZW50V2l0aFVzZXJBbGFybUluZm9zID0ge1xuXHRldmVudDogQ2FsZW5kYXJFdmVudFxuXHR1c2VyQWxhcm1JbmZvczogQXJyYXk8VXNlckFsYXJtSW5mbz5cbn1cblxuZnVuY3Rpb24gY3JlYXRlQWxhcm1Ob3RpZmljYXRpb25Gb3JFdmVudChldmVudDogQ2FsZW5kYXJFdmVudCwgYWxhcm1JbmZvOiBBbGFybUluZm8sIHVzZXJJZDogSWQpOiBBbGFybU5vdGlmaWNhdGlvbiB7XG5cdHJldHVybiBjcmVhdGVBbGFybU5vdGlmaWNhdGlvbih7XG5cdFx0YWxhcm1JbmZvOiBjcmVhdGVBbGFybUluZm9Gb3JBbGFybUluZm8oYWxhcm1JbmZvKSxcblx0XHRyZXBlYXRSdWxlOiBldmVudC5yZXBlYXRSdWxlICYmIGNyZWF0ZVJlcGVhdFJ1bGVGb3JDYWxlbmRhclJlcGVhdFJ1bGUoZXZlbnQucmVwZWF0UnVsZSksXG5cdFx0bm90aWZpY2F0aW9uU2Vzc2lvbktleXM6IFtdLFxuXHRcdG9wZXJhdGlvbjogT3BlcmF0aW9uVHlwZS5DUkVBVEUsXG5cdFx0c3VtbWFyeTogZXZlbnQuc3VtbWFyeSxcblx0XHRldmVudFN0YXJ0OiBldmVudC5zdGFydFRpbWUsXG5cdFx0ZXZlbnRFbmQ6IGV2ZW50LmVuZFRpbWUsXG5cdFx0dXNlcjogdXNlcklkLFxuXHR9KVxufVxuXG5mdW5jdGlvbiBjcmVhdGVBbGFybUluZm9Gb3JBbGFybUluZm8oYWxhcm1JbmZvOiBBbGFybUluZm8pOiBBbGFybUluZm8ge1xuXHRjb25zdCBjYWxlbmRhclJlZiA9IGNyZWF0ZUNhbGVuZGFyRXZlbnRSZWYoe1xuXHRcdGVsZW1lbnRJZDogYWxhcm1JbmZvLmNhbGVuZGFyUmVmLmVsZW1lbnRJZCxcblx0XHRsaXN0SWQ6IGFsYXJtSW5mby5jYWxlbmRhclJlZi5saXN0SWQsXG5cdH0pXG5cdHJldHVybiBjcmVhdGVBbGFybUluZm8oe1xuXHRcdGFsYXJtSWRlbnRpZmllcjogYWxhcm1JbmZvLmFsYXJtSWRlbnRpZmllcixcblx0XHR0cmlnZ2VyOiBhbGFybUluZm8udHJpZ2dlcixcblx0XHRjYWxlbmRhclJlZixcblx0fSlcbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVwZWF0UnVsZUZvckNhbGVuZGFyUmVwZWF0UnVsZShjYWxlbmRhclJlcGVhdFJ1bGU6IENhbGVuZGFyUmVwZWF0UnVsZSk6IFJlcGVhdFJ1bGUge1xuXHRyZXR1cm4gY3JlYXRlUmVwZWF0UnVsZSh7XG5cdFx0ZW5kVHlwZTogY2FsZW5kYXJSZXBlYXRSdWxlLmVuZFR5cGUsXG5cdFx0ZW5kVmFsdWU6IGNhbGVuZGFyUmVwZWF0UnVsZS5lbmRWYWx1ZSxcblx0XHRmcmVxdWVuY3k6IGNhbGVuZGFyUmVwZWF0UnVsZS5mcmVxdWVuY3ksXG5cdFx0aW50ZXJ2YWw6IGNhbGVuZGFyUmVwZWF0UnVsZS5pbnRlcnZhbCxcblx0XHR0aW1lWm9uZTogY2FsZW5kYXJSZXBlYXRSdWxlLnRpbWVab25lLFxuXHRcdGV4Y2x1ZGVkRGF0ZXM6IGNhbGVuZGFyUmVwZWF0UnVsZS5leGNsdWRlZERhdGVzLm1hcCgoeyBkYXRlIH0pID0+IGNyZWF0ZURhdGVXcmFwcGVyKHsgZGF0ZSB9KSksXG5cdFx0YWR2YW5jZWRSdWxlczogY2FsZW5kYXJSZXBlYXRSdWxlLmFkdmFuY2VkUnVsZXMsXG5cdH0pXG59XG5cbmZ1bmN0aW9uIGdldEV2ZW50SWRGcm9tVXNlckFsYXJtSW5mbyh1c2VyQWxhcm1JbmZvOiBVc2VyQWxhcm1JbmZvKTogSWRUdXBsZSB7XG5cdHJldHVybiBbdXNlckFsYXJtSW5mby5hbGFybUluZm8uY2FsZW5kYXJSZWYubGlzdElkLCB1c2VyQWxhcm1JbmZvLmFsYXJtSW5mby5jYWxlbmRhclJlZi5lbGVtZW50SWRdXG59XG5cbi8qKiB0byBtYWtlIGxvb2t1cCBvbiB0aGUgZW5jcnlwdGVkIGV2ZW50IHVpZCBwb3NzaWJsZSwgd2UgaGFzaCBpdCBhbmQgdXNlIHRoYXQgdmFsdWUgYXMgYSBrZXkuICovXG5mdW5jdGlvbiBoYXNoVWlkKHVpZDogc3RyaW5nKTogVWludDhBcnJheSB7XG5cdHJldHVybiBzaGEyNTZIYXNoKHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXkodWlkKSlcbn1cblxuLyoqXG4gKiBzb3J0IGEgbGlzdCBvZiBldmVudHMgYnkgcmVjdXJyZW5jZSBpZCwgc29ydGluZyBldmVudHMgd2l0aG91dCBhIHJlY3VycmVuY2UgaWQgdG8gdGhlIGZyb250LlxuICogQHBhcmFtIGFyciB0aGUgYXJyYXkgb2YgZXZlbnRzIHRvIHNvcnRcbiAqIGV4cG9ydGVkIGZvciB0ZXN0aW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc29ydEJ5UmVjdXJyZW5jZUlkKGFycjogQXJyYXk8Q2FsZW5kYXJFdmVudEFsdGVyZWRJbnN0YW5jZT4pOiB2b2lkIHtcblx0YXJyLnNvcnQoKGEsIGIpID0+IChhLnJlY3VycmVuY2VJZC5nZXRUaW1lKCkgPCBiLnJlY3VycmVuY2VJZC5nZXRUaW1lKCkgPyAtMSA6IDEpKVxufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkQWx0ZXJlZEluc3RhbmNlc0Zyb21JbmRleEVudHJ5KGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LCBpbmRleEVudHJ5OiBDYWxlbmRhckV2ZW50VWlkSW5kZXgpOiBQcm9taXNlPEFycmF5PENhbGVuZGFyRXZlbnRBbHRlcmVkSW5zdGFuY2U+PiB7XG5cdGlmIChpbmRleEVudHJ5LmFsdGVyZWRJbnN0YW5jZXMubGVuZ3RoID09PSAwKSByZXR1cm4gW11cblx0Y29uc3QgaW5kZXhlZEV2ZW50SWRzOiBNYXA8SWQsIEFycmF5PElkPj4gPSBncm91cEJ5QW5kTWFwPElkVHVwbGUsIElkLCBJZD4oXG5cdFx0aW5kZXhFbnRyeS5hbHRlcmVkSW5zdGFuY2VzLFxuXHRcdChlOiBJZFR1cGxlKSA9PiBsaXN0SWRQYXJ0KGUpLFxuXHRcdChlOiBJZFR1cGxlKSA9PiBlbGVtZW50SWRQYXJ0KGUpLFxuXHQpXG5cblx0Y29uc3QgaXNBbHRlcmVkSW5zdGFuY2UgPSAoZTogQ2FsZW5kYXJFdmVudEFsdGVyZWRJbnN0YW5jZSk6IGUgaXMgQ2FsZW5kYXJFdmVudEFsdGVyZWRJbnN0YW5jZSA9PiBlLnJlY3VycmVuY2VJZCAhPSBudWxsICYmIGUudWlkICE9IG51bGxcblx0Y29uc3QgaW5kZXhlZEV2ZW50cyA9IGF3YWl0IGxvYWRNdWx0aXBsZUZyb21MaXN0cyhDYWxlbmRhckV2ZW50VHlwZVJlZiwgZW50aXR5Q2xpZW50LCBpbmRleEVudHJ5LmFsdGVyZWRJbnN0YW5jZXMpXG5cdGNvbnN0IGFsdGVyZWRJbnN0YW5jZXM6IEFycmF5PENhbGVuZGFyRXZlbnRBbHRlcmVkSW5zdGFuY2U+ID0gaW5kZXhlZEV2ZW50cy5maWx0ZXIoaXNBbHRlcmVkSW5zdGFuY2UpXG5cdGlmIChpbmRleGVkRXZlbnRzLmxlbmd0aCA+IGFsdGVyZWRJbnN0YW5jZXMubGVuZ3RoKSB7XG5cdFx0Y29uc29sZS53YXJuKFwidGhlcmUgd2VyZSBhbHRlcmVkIGluc3RhbmNlcyBpbmRleGVkIHRoYXQgZG8gbm90IGhhdmUgYSByZWN1cnJlbmNlIElkIG9yIHVpZCFcIilcblx0fVxuXHRzb3J0QnlSZWN1cnJlbmNlSWQoYWx0ZXJlZEluc3RhbmNlcylcblx0cmV0dXJuIGFsdGVyZWRJbnN0YW5jZXNcbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZFByb2dlbml0b3JGcm9tSW5kZXhFbnRyeShlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCwgaW5kZXhFbnRyeTogQ2FsZW5kYXJFdmVudFVpZEluZGV4KTogUHJvbWlzZTxDYWxlbmRhckV2ZW50UHJvZ2VuaXRvciB8IG51bGw+IHtcblx0aWYgKGluZGV4RW50cnkucHJvZ2VuaXRvciA9PSBudWxsKSByZXR1cm4gbnVsbFxuXHRjb25zdCBsb2FkZWRQcm9nZW5pdG9yID0gYXdhaXQgZW50aXR5Q2xpZW50LmxvYWQ8Q2FsZW5kYXJFdmVudD4oQ2FsZW5kYXJFdmVudFR5cGVSZWYsIGluZGV4RW50cnkucHJvZ2VuaXRvcilcblx0aWYgKGxvYWRlZFByb2dlbml0b3IucmVjdXJyZW5jZUlkICE9IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihgbG9hZGVkIHByb2dlbml0b3IgaGFzIGEgcmVjdXJyZW5jZSBJZCEgJHtsb2FkZWRQcm9nZW5pdG9yLnJlY3VycmVuY2VJZC50b0lTT1N0cmluZygpfWApXG5cdH1cblx0YXNzZXJ0Tm90TnVsbChsb2FkZWRQcm9nZW5pdG9yLnVpZCwgXCJsb2FkZWQgcHJvZ2VuaXRvciBoYXMgbm8gVUlEXCIpXG5cdHJldHVybiBsb2FkZWRQcm9nZW5pdG9yIGFzIENhbGVuZGFyRXZlbnRQcm9nZW5pdG9yXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIENhY2hpbmdNb2RlIHtcblx0Q2FjaGVkLFxuXHRCeXBhc3MsXG59XG5cbmV4cG9ydCB0eXBlIEFsYXJtSW5mb1RlbXBsYXRlID0gUGljazxBbGFybUluZm8sIFwiYWxhcm1JZGVudGlmaWVyXCIgfCBcInRyaWdnZXJcIj5cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvRUEsb0JBQW9CO0lBb0JQLGlCQUFOLE1BQXFCO0NBRTNCLEFBQVM7Q0FFVCxZQUNrQkEsWUFDQUMsdUJBRUFDLGlCQUNBQyx3QkFDQUMsa0JBQ0FDLDBCQUNBQyxnQkFDQUMsaUJBQ0FDLGNBQ0FDLG9CQUNoQjtFQTJpQkYsS0F0akJrQjtFQXNqQmpCLEtBcmpCaUI7RUFxakJoQixLQW5qQmdCO0VBbWpCZixLQWxqQmU7RUFrakJkLEtBampCYztFQWlqQmIsS0FoakJhO0VBZ2pCWixLQS9pQlk7RUEraUJYLEtBOWlCVztFQThpQlYsS0E3aUJVO0VBNmlCVCxLQTVp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