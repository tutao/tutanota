import { __toESM } from "./chunk-chunk.js";
import "./dist-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNode } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { LazyLoaded, TypeRef, YEAR_IN_MILLIS, assertNotNull, base64ToBase64Url, base64UrlToBase64, decodeBase64, deepEqual, downcast, filterInt, getEndOfDay, getStartOfDay, incrementMonth, isSameDayOfDate, isSameTypeRef, lazyMemoized, neverNull, ofClass, stringToBase64 } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import { CLIENT_ONLY_CALENDARS, OperationType } from "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./luxon-chunk.js";
import { GENERATED_MAX_ID, assertIsEntity2, elementIdPart, getElementId, isSameId } from "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import { CalendarEventTypeRef, ContactTypeRef, MailTypeRef } from "./TypeRefs-chunk.js";
import "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import { generateCalendarInstancesInRange, getStartOfTheWeekOffsetForUser, retrieveClientOnlyEventsForUser } from "./CalendarUtils-chunk.js";
import "./ImportExportUtils-chunk.js";
import "./FormatValidator-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { ListAutoSelectBehavior } from "./DeviceConfig-chunk.js";
import "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import "./ErrorUtils-chunk.js";
import { NotFoundError } from "./RestError-chunk.js";
import "./SetupMultipleError-chunk.js";
import "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
import "./SuspensionError-chunk.js";
import "./LoginIncompleteError-chunk.js";
import "./CryptoError-chunk.js";
import "./RecipientsNotFoundError-chunk.js";
import "./DbError-chunk.js";
import "./QuotaExceededError-chunk.js";
import "./DeviceStorageUnavailableError-chunk.js";
import "./MailBodyTooLargeError-chunk.js";
import "./ImportError-chunk.js";
import "./WebauthnError-chunk.js";
import "./PermissionError-chunk.js";
import { containsEventOfType, getEventOfType, isUpdateForTypeRef } from "./EntityUpdateUtils-chunk.js";
import "./Services-chunk.js";
import "./EntityClient-chunk.js";
import "./dist3-chunk.js";
import "./BirthdayUtils-chunk.js";
import "./Services2-chunk.js";
import "./GroupUtils-chunk.js";
import "./Button-chunk.js";
import "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import "./CalendarEventWhenModel-chunk.js";
import "./Formatter-chunk.js";
import "./ProgressMonitor-chunk.js";
import "./Notifications-chunk.js";
import "./CalendarFacade-chunk.js";
import "./CalendarModel-chunk.js";
import "./GroupUtils2-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import "./UserError-chunk.js";
import "./MailAddressParser-chunk.js";
import "./BlobUtils-chunk.js";
import "./FileUtils-chunk.js";
import "./ProgressDialog-chunk.js";
import "./SharedMailUtils-chunk.js";
import "./PasswordUtils-chunk.js";
import "./Recipient-chunk.js";
import "./ContactUtils-chunk.js";
import "./RecipientsModel-chunk.js";
import { getClientOnlyCalendars } from "./CalendarGuiUtils-chunk.js";
import "./UpgradeRequiredError-chunk.js";
import "./ColorPickerModel-chunk.js";
import "./ColumnEmptyMessageBox-chunk.js";
import { ListLoadingState } from "./List-chunk.js";
import "./SelectableRowContainer-chunk.js";
import "./CalendarRow-chunk.js";
import { areResultsForTheSameQuery$1 as areResultsForTheSameQuery, hasMoreResults$1 as hasMoreResults, isSameSearchRestriction$1 as isSameSearchRestriction } from "./CalendarSearchModel-chunk.js";
import { throttleRoute } from "./RouteChange-chunk.js";
import "./ListModel-chunk.js";
import { ListElementListModel } from "./ListElementListModel-chunk.js";

//#region src/calendar-app/calendar/search/view/CalendarSearchListView.ts
assertMainOrNode();
var CalendarSearchResultListEntry = class {
	constructor(entry) {
		this.entry = entry;
	}
	get _id() {
		return this.entry._id;
	}
};

//#endregion
//#region src/calendar-app/calendar/search/model/SearchUtils.ts
assertMainOrNode();
let SearchCategoryTypes = function(SearchCategoryTypes$1) {
	SearchCategoryTypes$1["calendar"] = "calendar";
	return SearchCategoryTypes$1;
}({});
const routeSetThrottled = throttleRoute();
function createRestriction(start, end, folderIds, eventSeries) {
	return {
		type: CalendarEventTypeRef,
		start,
		end,
		field: null,
		attributeIds: null,
		folderIds,
		eventSeries
	};
}
function getRestriction(route) {
	let start = null;
	let end = null;
	let folderIds = [];
	let eventSeries = true;
	if (route.startsWith("/calendar") || route.startsWith("/search/calendar")) {
		const { params } = mithril_default.parsePathname(route);
		try {
			if (typeof params["eventSeries"] === "boolean") eventSeries = params["eventSeries"];
			if (typeof params["start"] === "string") start = filterInt(params["start"]);
			if (typeof params["end"] === "string") end = filterInt(params["end"]);
			const folder = params["folder"];
			if (Array.isArray(folder)) folderIds = folder;
		} catch (e) {
			console.log("invalid query: " + route, e);
		}
		if (start == null) {
			const now = new Date();
			now.setDate(1);
			start = getStartOfDay(now).getTime();
		}
		if (end == null) {
			const endDate = incrementMonth(new Date(start), 3);
			endDate.setDate(0);
			end = getEndOfDay(endDate).getTime();
		}
	} else throw new Error("invalid type " + route);
	return createRestriction(start, end, folderIds, eventSeries);
}
function decodeCalendarSearchKey(searchKey) {
	return JSON.parse(decodeBase64("utf-8", base64UrlToBase64(searchKey)));
}
function encodeCalendarSearchKey(event) {
	const eventStartTime = event.startTime.getTime();
	return base64ToBase64Url(stringToBase64(JSON.stringify({
		start: eventStartTime,
		id: getElementId(event)
	})));
}

//#endregion
//#region src/calendar-app/calendar/search/view/CalendarSearchViewModel.ts
var import_stream = __toESM(require_stream(), 1);
const SEARCH_PAGE_SIZE = 100;
let PaidFunctionResult = function(PaidFunctionResult$1) {
	PaidFunctionResult$1[PaidFunctionResult$1["Success"] = 0] = "Success";
	PaidFunctionResult$1[PaidFunctionResult$1["PaidSubscriptionNeeded"] = 1] = "PaidSubscriptionNeeded";
	return PaidFunctionResult$1;
}({});
var CalendarSearchViewModel = class {
	_listModel;
	get listModel() {
		return this._listModel;
	}
	_includeRepeatingEvents = true;
	get includeRepeatingEvents() {
		return this._includeRepeatingEvents;
	}
	get warning() {
		if (this.startDate && this.startDate.getTime() > this.endDate.getTime()) return "startafterend";
else if (this.startDate && this.endDate.getTime() - this.startDate.getTime() > YEAR_IN_MILLIS) return "long";
else return null;
	}
	_startDate = null;
	get startDate() {
		let returnDate = this._startDate;
		if (!returnDate) {
			returnDate = new Date();
			returnDate.setDate(1);
		}
		return returnDate;
	}
	_endDate = null;
	get endDate() {
		let returnDate = this._endDate;
		if (!returnDate) {
			returnDate = incrementMonth(new Date(), 3);
			returnDate.setDate(0);
		}
		return returnDate;
	}
	_selectedCalendar = null;
	get selectedCalendar() {
		return this._selectedCalendar;
	}
	searchResult = null;
	latestCalendarRestriction = null;
	resultSubscription = null;
	listStateSubscription = null;
	loadingAllForSearchResult = null;
	lazyCalendarInfos = new LazyLoaded(async () => {
		const calendarModel = await locator.calendarModel();
		const calendarInfos = await calendarModel.getCalendarInfos();
		mithril_default.redraw();
		return calendarInfos;
	});
	userHasNewPaidPlan = new LazyLoaded(async () => {
		return await this.logins.getUserController().isNewPaidPlan();
	});
	currentQuery = "";
	constructor(router, search, logins, entityClient, eventController, calendarFacade, progressTracker, eventsRepository, updateUi, localCalendars) {
		this.router = router;
		this.search = search;
		this.logins = logins;
		this.entityClient = entityClient;
		this.eventController = eventController;
		this.calendarFacade = calendarFacade;
		this.progressTracker = progressTracker;
		this.eventsRepository = eventsRepository;
		this.updateUi = updateUi;
		this.localCalendars = localCalendars;
		this.currentQuery = this.search.result()?.query ?? "";
		this._listModel = this.createList();
	}
	getLazyCalendarInfos() {
		return this.lazyCalendarInfos;
	}
	getUserHasNewPaidPlan() {
		return this.userHasNewPaidPlan;
	}
	init = lazyMemoized(() => {
		this.resultSubscription = this.search.result.map((result) => {
			if (this.searchResult == null || result == null || !areResultsForTheSameQuery(result, this.searchResult)) {
				this.listModel.cancelLoadAll();
				this.searchResult = result;
				this._listModel = this.createList();
				this.listModel.loadInitial();
				this.listStateSubscription?.end(true);
				this.listStateSubscription = this.listModel.stateStream.map((state) => this.onListStateChange(state));
			}
		});
		this.eventController.addEntityListener(this.entityEventsListener);
	});
	entityEventsListener = async (updates) => {
		for (const update of updates) {
			const mergedUpdate = this.mergeOperationsIfNeeded(update, updates);
			if (mergedUpdate == null) continue;
			await this.entityEventReceived(mergedUpdate);
		}
	};
	mergeOperationsIfNeeded(update, updates) {
		if (!isUpdateForTypeRef(MailTypeRef, update) || this.searchResult == null) return update;
		if (update.operation === OperationType.CREATE && containsEventOfType(updates, OperationType.DELETE, update.instanceId)) if (this.listIdMatchesRestriction(update.instanceListId, this.searchResult.restriction)) return {
			...update,
			operation: OperationType.UPDATE
		};
else return null;
else if (update.operation === OperationType.DELETE && containsEventOfType(updates, OperationType.CREATE, update.instanceId)) {
			const createOperation = assertNotNull(getEventOfType(updates, OperationType.CREATE, update.instanceId));
			if (this.listIdMatchesRestriction(createOperation.instanceListId, this.searchResult.restriction)) return null;
else return update;
		} else return update;
	}
	listIdMatchesRestriction(listId, restriction) {
		return restriction.folderIds.length === 0 || restriction.folderIds.includes(listId);
	}
	onNewUrl(args, requestedPath) {
		let restriction;
		try {
			restriction = getRestriction(requestedPath);
		} catch (e) {
			this.router.routeTo(args.query, createRestriction(null, null, [], false));
			return;
		}
		this.currentQuery = args.query;
		const lastQuery = this.search.lastQueryString();
		const maxResults = isSameTypeRef(MailTypeRef, restriction.type) ? SEARCH_PAGE_SIZE : null;
		const listModel = this.listModel;
		if (Object.hasOwn(args, "query") && this.search.isNewSearch(args.query, restriction)) {
			this.searchResult = null;
			listModel.updateLoadingStatus(ListLoadingState.Loading);
			this.search.search({
				query: args.query,
				restriction,
				minSuggestionCount: 0,
				maxResults
			}, this.progressTracker).then(() => listModel.updateLoadingStatus(ListLoadingState.Done)).catch(() => listModel.updateLoadingStatus(ListLoadingState.ConnectionLost));
		} else if (lastQuery && this.search.isNewSearch(lastQuery, restriction)) {
			this.searchResult = null;
			listModel.selectNone();
			listModel.updateLoadingStatus(ListLoadingState.Loading);
			this.search.search({
				query: lastQuery,
				restriction,
				minSuggestionCount: 0,
				maxResults
			}, this.progressTracker).then(() => listModel.updateLoadingStatus(ListLoadingState.Done)).catch(() => listModel.updateLoadingStatus(ListLoadingState.ConnectionLost));
		} else if (!Object.hasOwn(args, "query") && !lastQuery) listModel.updateLoadingStatus(ListLoadingState.Done);
		this._startDate = restriction.start ? new Date(restriction.start) : null;
		this._endDate = restriction.end ? new Date(restriction.end) : null;
		const selectedCalendar = this.extractCalendarListIds(restriction.folderIds);
		if (!selectedCalendar || Array.isArray(selectedCalendar)) this._selectedCalendar = selectedCalendar;
else if (CLIENT_ONLY_CALENDARS.has(selectedCalendar.toString())) this.getUserHasNewPaidPlan().getAsync().then((isNewPaidPlan) => {
			if (!isNewPaidPlan) return this._selectedCalendar = null;
			this._selectedCalendar = selectedCalendar;
		});
		this._includeRepeatingEvents = restriction.eventSeries ?? true;
		this.lazyCalendarInfos.load();
		this.userHasNewPaidPlan.load();
		this.latestCalendarRestriction = restriction;
		if (args.id != null) try {
			const { start, id } = decodeCalendarSearchKey(args.id);
			this.loadAndSelectIfNeeded(id, ({ entry }) => {
				entry = entry;
				return id === getElementId(entry) && start === entry.startTime.getTime();
			});
		} catch (err) {
			console.log("Invalid ID, selecting none");
			this.listModel.selectNone();
		}
	}
	extractCalendarListIds(listIds) {
		if (listIds.length < 1) return null;
else if (listIds.length === 1) return listIds[0];
		return [listIds[0], listIds[1]];
	}
	loadAndSelectIfNeeded(id, finder) {
		if (id == null) return;
		if (!this.listModel.isItemSelected(id)) this.handleLoadAndSelection(id, finder);
	}
	handleLoadAndSelection(id, finder) {
		if (this.listModel.isLoadedCompletely()) return this.selectItem(id, finder);
		const listStateStream = import_stream.default.combine((a) => a(), [this.listModel.stateStream]);
		listStateStream.map((state) => {
			if (state.loadingStatus === ListLoadingState.Done) {
				this.selectItem(id, finder);
				listStateStream.end(true);
			}
		});
	}
	selectItem(id, finder) {
		const listModel = this.listModel;
		this.listModel.loadAndSelect(id, () => !deepEqual(this.listModel, listModel), finder);
	}
	async loadAll() {
		if (this.loadingAllForSearchResult != null) return;
		this.loadingAllForSearchResult = this.searchResult ?? null;
		this.listModel.selectAll();
		try {
			while (this.searchResult?.restriction && this.loadingAllForSearchResult && isSameSearchRestriction(this.searchResult?.restriction, this.loadingAllForSearchResult.restriction) && !this.listModel.isLoadedCompletely()) {
				await this.listModel.loadMore();
				if (this.searchResult.restriction && this.loadingAllForSearchResult.restriction && isSameSearchRestriction(this.searchResult.restriction, this.loadingAllForSearchResult.restriction)) this.listModel.selectAll();
			}
		} finally {
			this.loadingAllForSearchResult = null;
		}
	}
	stopLoadAll() {
		this.listModel.cancelLoadAll();
	}
	canSelectTimePeriod() {
		return !this.logins.getUserController().isFreeAccount();
	}
	getStartOfTheWeekOffset() {
		return getStartOfTheWeekOffsetForUser(this.logins.getUserController().userSettingsGroupRoot);
	}
	selectCalendar(calendarInfo) {
		if (typeof calendarInfo === "string" || calendarInfo == null) this._selectedCalendar = calendarInfo;
else this._selectedCalendar = [calendarInfo.groupRoot.longEvents, calendarInfo.groupRoot.shortEvents];
		this.searchAgain();
	}
	selectStartDate(startDate) {
		if (isSameDayOfDate(this.startDate, startDate)) return PaidFunctionResult.Success;
		if (!this.canSelectTimePeriod()) return PaidFunctionResult.PaidSubscriptionNeeded;
		this._startDate = startDate;
		this.searchAgain();
		return PaidFunctionResult.Success;
	}
	selectEndDate(endDate) {
		if (isSameDayOfDate(this.endDate, endDate)) return PaidFunctionResult.Success;
		if (!this.canSelectTimePeriod()) return PaidFunctionResult.PaidSubscriptionNeeded;
		this._endDate = endDate;
		this.searchAgain();
		return PaidFunctionResult.Success;
	}
	selectIncludeRepeatingEvents(include) {
		this._includeRepeatingEvents = include;
		this.searchAgain();
	}
	searchAgain() {
		this.updateSearchUrl();
		this.updateUi();
	}
	updateSearchUrl() {
		const selectedElement = this.listModel.state.selectedItems.size === 1 ? this.listModel.getSelectedAsArray().at(0) : null;
		this.routeCalendar(selectedElement?.entry ?? null, createRestriction(this._startDate ? getStartOfDay(this._startDate).getTime() : null, this._endDate ? getEndOfDay(this._endDate).getTime() : null, this.getFolderIds(), this._includeRepeatingEvents));
	}
	getFolderIds() {
		if (typeof this.selectedCalendar === "string") return [this.selectedCalendar];
else if (this.selectedCalendar != null) return [...this.selectedCalendar];
		return [];
	}
	routeCalendar(element, restriction) {
		const selectionKey = this.generateSelectionKey(element);
		this.router.routeTo(this.currentQuery, restriction, selectionKey);
	}
	generateSelectionKey(element) {
		if (element == null) return null;
		return encodeCalendarSearchKey(element);
	}
	isPossibleABirthdayContactUpdate(update) {
		if (isUpdateForTypeRef(ContactTypeRef, update)) {
			const { instanceListId, instanceId } = update;
			const encodedContactId = stringToBase64(`${instanceListId}/${instanceId}`);
			return this.listModel.stateStream().items.some((searchEntry) => searchEntry._id[1].endsWith(encodedContactId));
		}
		return false;
	}
	isSelectedEventAnUpdatedBirthday(update) {
		if (isUpdateForTypeRef(ContactTypeRef, update)) {
			const { instanceListId, instanceId } = update;
			const encodedContactId = stringToBase64(`${instanceListId}/${instanceId}`);
			const selectedItem = this.listModel.getSelectedAsArray().at(0);
			if (!selectedItem) return false;
			return selectedItem._id[1].endsWith(encodedContactId);
		}
		return false;
	}
	async entityEventReceived(update) {
		const isPossibleABirthdayContactUpdate = this.isPossibleABirthdayContactUpdate(update);
		if (!isUpdateForTypeRef(CalendarEventTypeRef, update) && !isPossibleABirthdayContactUpdate) return;
		const { instanceListId, instanceId, operation } = update;
		const id = [neverNull(instanceListId), instanceId];
		const typeRef = new TypeRef(update.application, update.type);
		if (!this.isInSearchResult(typeRef, id) && isPossibleABirthdayContactUpdate) return;
		const selectedItem = this.listModel.getSelectedAsArray().at(0);
		const listModel = this.createList();
		if (isPossibleABirthdayContactUpdate && await this.eventsRepository.canLoadBirthdaysCalendar()) await this.eventsRepository.loadContactsBirthdays(true);
		await listModel.loadInitial();
		if (selectedItem != null) {
			if (isPossibleABirthdayContactUpdate && this.isSelectedEventAnUpdatedBirthday(update)) this.listModel.selectNone();
			await listModel.loadAndSelect(elementIdPart(selectedItem._id), () => false);
		}
		this._listModel = listModel;
		this.listStateSubscription?.end(true);
		this.listStateSubscription = this.listModel.stateStream.map((state) => this.onListStateChange(state));
		this.updateSearchUrl();
		this.updateUi();
	}
	getSelectedEvents() {
		return this.listModel.getSelectedAsArray().map((e) => e.entry).filter(assertIsEntity2(CalendarEventTypeRef));
	}
	onListStateChange(newState) {
		this.updateSearchUrl();
		this.updateUi();
	}
	createList() {
		return new ListElementListModel({
			fetch: async (lastFetchedEntity, count) => {
				const startId = lastFetchedEntity == null ? GENERATED_MAX_ID : getElementId(lastFetchedEntity);
				const lastResult = this.searchResult;
				if (lastResult !== this.searchResult) {
					console.warn("got a fetch request for outdated results object, ignoring");
					return {
						items: [],
						complete: true
					};
				}
				if (!lastResult || lastResult.results.length === 0 && !hasMoreResults(lastResult)) return {
					items: [],
					complete: true
				};
				const { items, newSearchResult } = await this.loadSearchResults(lastResult, startId, count);
				const entries = items.map((instance) => new CalendarSearchResultListEntry(instance));
				const complete = !hasMoreResults(newSearchResult);
				return {
					items: entries,
					complete
				};
			},
			loadSingle: async (_listId, elementId) => {
				const lastResult = this.searchResult;
				if (!lastResult) return null;
				const id = lastResult.results.find((resultId) => elementIdPart(resultId) === elementId);
				if (id) return this.entityClient.load(lastResult.restriction.type, id).then((entity) => new CalendarSearchResultListEntry(entity)).catch(ofClass(NotFoundError, (_) => {
					return null;
				}));
else return null;
			},
			sortCompare: (o1, o2) => downcast(o1.entry).startTime.getTime() - downcast(o2.entry).startTime.getTime(),
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER
		});
	}
	isInSearchResult(typeRef, id) {
		const result = this.searchResult;
		if (result && isSameTypeRef(typeRef, result.restriction.type)) {
			const ignoreList = isSameTypeRef(typeRef, MailTypeRef) && result.restriction.folderIds.length === 0;
			return result.results.some((r) => this.compareItemId(r, id, ignoreList));
		}
		return false;
	}
	compareItemId(id1, id2, ignoreList) {
		return ignoreList ? isSameId(elementIdPart(id1), elementIdPart(id2)) : isSameId(id1, id2);
	}
	async loadSearchResults(currentResult, startId, count) {
		const updatedResult = currentResult;
		this.searchResult = updatedResult;
		let items;
		if (isSameTypeRef(currentResult.restriction.type, CalendarEventTypeRef)) try {
			const { start, end } = currentResult.restriction;
			if (start == null || end == null) throw new ProgrammingError("invalid search time range for calendar");
			items = [...await this.calendarFacade.reifyCalendarSearchResult(start, end, updatedResult.results), ...await this.getClientOnlyEventsSeries(start, end, updatedResult.results)];
		} finally {
			this.updateUi();
		}
else items = [];
		return {
			items,
			newSearchResult: updatedResult
		};
	}
	async getClientOnlyEventsSeries(start, end, events) {
		const eventList = await retrieveClientOnlyEventsForUser(this.logins, events, this.eventsRepository.getBirthdayEvents());
		return generateCalendarInstancesInRange(eventList, {
			start,
			end
		});
	}
	sendStopLoadingSignal() {
		this.search.sendCancelSignal();
	}
	getLocalCalendars() {
		return getClientOnlyCalendars(this.logins.getUserController().userId, this.localCalendars);
	}
	dispose() {
		this.stopLoadAll();
		this.resultSubscription?.end(true);
		this.resultSubscription = null;
		this.listStateSubscription?.end(true);
		this.listStateSubscription = null;
		this.search.sendCancelSignal();
		this.eventController.removeEntityListener(this.entityEventsListener);
	}
};

//#endregion
export { CalendarSearchViewModel };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FsZW5kYXJTZWFyY2hWaWV3TW9kZWwtY2h1bmsuanMiLCJuYW1lcyI6WyJlbnRyeTogQ2FsZW5kYXJFdmVudCIsInJvdXRlU2V0VGhyb3R0bGVkOiBSb3V0ZVNldEZuIiwic3RhcnQ6IG51bWJlciB8IG51bGwiLCJlbmQ6IG51bWJlciB8IG51bGwiLCJmb2xkZXJJZHM6IEFycmF5PHN0cmluZz4iLCJldmVudFNlcmllczogYm9vbGVhbiIsInJvdXRlOiBzdHJpbmciLCJzZWFyY2hLZXk6IHN0cmluZyIsImV2ZW50OiBDYWxlbmRhckV2ZW50Iiwicm91dGVyOiBTZWFyY2hSb3V0ZXIiLCJzZWFyY2g6IENhbGVuZGFyU2VhcmNoTW9kZWwiLCJsb2dpbnM6IExvZ2luQ29udHJvbGxlciIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50IiwiZXZlbnRDb250cm9sbGVyOiBFdmVudENvbnRyb2xsZXIiLCJjYWxlbmRhckZhY2FkZTogQ2FsZW5kYXJGYWNhZGUiLCJwcm9ncmVzc1RyYWNrZXI6IFByb2dyZXNzVHJhY2tlciIsImV2ZW50c1JlcG9zaXRvcnk6IENhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeSIsInVwZGF0ZVVpOiAoKSA9PiB1bmtub3duIiwibG9jYWxDYWxlbmRhcnM6IE1hcDxJZCwgQ2xpZW50T25seUNhbGVuZGFyc0luZm8+IiwidXBkYXRlOiBFbnRpdHlVcGRhdGVEYXRhIiwidXBkYXRlczogcmVhZG9ubHkgRW50aXR5VXBkYXRlRGF0YVtdIiwibGlzdElkOiBzdHJpbmciLCJyZXN0cmljdGlvbjogU2VhcmNoUmVzdHJpY3Rpb24iLCJhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IiwicmVxdWVzdGVkUGF0aDogc3RyaW5nIiwibGlzdElkczogc3RyaW5nW10iLCJpZDogc3RyaW5nIHwgbnVsbCIsImZpbmRlcj86IChhOiBMaXN0RWxlbWVudCkgPT4gYm9vbGVhbiIsImlkOiBzdHJpbmciLCJmaW5kZXI6ICgoYTogTGlzdEVsZW1lbnQpID0+IGJvb2xlYW4pIHwgdW5kZWZpbmVkIiwiY2FsZW5kYXJJbmZvOiBDYWxlbmRhckluZm8gfCBzdHJpbmcgfCBudWxsIiwic3RhcnREYXRlOiBEYXRlIHwgbnVsbCIsImVuZERhdGU6IERhdGUiLCJpbmNsdWRlOiBib29sZWFuIiwiZWxlbWVudDogQ2FsZW5kYXJFdmVudCB8IG51bGwiLCJuZXdTdGF0ZTogTGlzdFN0YXRlPENhbGVuZGFyU2VhcmNoUmVzdWx0TGlzdEVudHJ5PiIsImxhc3RGZXRjaGVkRW50aXR5OiBDYWxlbmRhclNlYXJjaFJlc3VsdExpc3RFbnRyeSIsImNvdW50OiBudW1iZXIiLCJfbGlzdElkOiBJZCIsImVsZW1lbnRJZDogSWQiLCJvMTogQ2FsZW5kYXJTZWFyY2hSZXN1bHRMaXN0RW50cnkiLCJvMjogQ2FsZW5kYXJTZWFyY2hSZXN1bHRMaXN0RW50cnkiLCJ0eXBlUmVmOiBUeXBlUmVmPHVua25vd24+IiwiaWQ6IElkVHVwbGUiLCJpZDE6IElkVHVwbGUiLCJpZDI6IElkVHVwbGUiLCJpZ25vcmVMaXN0OiBib29sZWFuIiwiY3VycmVudFJlc3VsdDogU2VhcmNoUmVzdWx0Iiwic3RhcnRJZDogSWQiLCJpdGVtczogQ2FsZW5kYXJFdmVudFtdIiwic3RhcnQ6IG51bWJlciIsImVuZDogbnVtYmVyIiwiZXZlbnRzOiBJZFR1cGxlW10iXSwic291cmNlcyI6WyIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL3NlYXJjaC92aWV3L0NhbGVuZGFyU2VhcmNoTGlzdFZpZXcudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL3NlYXJjaC9tb2RlbC9TZWFyY2hVdGlscy50cyIsIi4uL3NyYy9jYWxlbmRhci1hcHAvY2FsZW5kYXIvc2VhcmNoL3ZpZXcvQ2FsZW5kYXJTZWFyY2hWaWV3TW9kZWwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBkb3duY2FzdCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgTGlzdCwgTGlzdEF0dHJzLCBNdWx0aXNlbGVjdE1vZGUsIFJlbmRlckNvbmZpZyB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTGlzdC5qc1wiXG5pbXBvcnQgeyBzaXplIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvc2l6ZS5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IENvbHVtbkVtcHR5TWVzc2FnZUJveCBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0NvbHVtbkVtcHR5TWVzc2FnZUJveC5qc1wiXG5pbXBvcnQgeyBCb290SWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0Jvb3RJY29ucy5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgVmlydHVhbFJvdyB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTGlzdFV0aWxzLmpzXCJcbmltcG9ydCB7IHN0eWxlcyB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL3N0eWxlcy5qc1wiXG5pbXBvcnQgeyBLaW5kYUNhbGVuZGFyUm93IH0gZnJvbSBcIi4uLy4uL2d1aS9DYWxlbmRhclJvdy5qc1wiXG5pbXBvcnQgeyBMaXN0RWxlbWVudExpc3RNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWlzYy9MaXN0RWxlbWVudExpc3RNb2RlbFwiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG5leHBvcnQgY2xhc3MgQ2FsZW5kYXJTZWFyY2hSZXN1bHRMaXN0RW50cnkge1xuXHRjb25zdHJ1Y3RvcihyZWFkb25seSBlbnRyeTogQ2FsZW5kYXJFdmVudCkge31cblxuXHRnZXQgX2lkKCk6IElkVHVwbGUge1xuXHRcdHJldHVybiB0aGlzLmVudHJ5Ll9pZFxuXHR9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2FsZW5kYXJTZWFyY2hMaXN0Vmlld0F0dHJzIHtcblx0bGlzdE1vZGVsOiBMaXN0RWxlbWVudExpc3RNb2RlbDxDYWxlbmRhclNlYXJjaFJlc3VsdExpc3RFbnRyeT5cblx0b25TaW5nbGVTZWxlY3Rpb246IChpdGVtOiBDYWxlbmRhclNlYXJjaFJlc3VsdExpc3RFbnRyeSkgPT4gdW5rbm93blxuXHRpc0ZyZWVBY2NvdW50OiBib29sZWFuXG5cdGNhbmNlbENhbGxiYWNrOiAoKSA9PiB1bmtub3duIHwgbnVsbFxufVxuXG5leHBvcnQgY2xhc3MgQ2FsZW5kYXJTZWFyY2hMaXN0VmlldyBpbXBsZW1lbnRzIENvbXBvbmVudDxDYWxlbmRhclNlYXJjaExpc3RWaWV3QXR0cnM+IHtcblx0cHJpdmF0ZSBsaXN0TW9kZWw6IExpc3RFbGVtZW50TGlzdE1vZGVsPENhbGVuZGFyU2VhcmNoUmVzdWx0TGlzdEVudHJ5PlxuXG5cdGNvbnN0cnVjdG9yKHsgYXR0cnMgfTogVm5vZGU8Q2FsZW5kYXJTZWFyY2hMaXN0Vmlld0F0dHJzPikge1xuXHRcdHRoaXMubGlzdE1vZGVsID0gYXR0cnMubGlzdE1vZGVsXG5cdH1cblxuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8Q2FsZW5kYXJTZWFyY2hMaXN0Vmlld0F0dHJzPik6IENoaWxkcmVuIHtcblx0XHR0aGlzLmxpc3RNb2RlbCA9IGF0dHJzLmxpc3RNb2RlbFxuXHRcdGNvbnN0IGljb24gPSBCb290SWNvbnMuQ2FsZW5kYXJcblx0XHRjb25zdCByZW5kZXJDb25maWcgPSB0aGlzLmNhbGVuZGFyUmVuZGVyQ29uZmlnXG5cblx0XHRyZXR1cm4gYXR0cnMubGlzdE1vZGVsLmlzRW1wdHlBbmREb25lKClcblx0XHRcdD8gbShDb2x1bW5FbXB0eU1lc3NhZ2VCb3gsIHtcblx0XHRcdFx0XHRpY29uLFxuXHRcdFx0XHRcdG1lc3NhZ2U6IFwic2VhcmNoTm9SZXN1bHRzX21zZ1wiLFxuXHRcdFx0XHRcdGNvbG9yOiB0aGVtZS5saXN0X21lc3NhZ2VfYmcsXG5cdFx0XHQgIH0pXG5cdFx0XHQ6IG0oTGlzdCwge1xuXHRcdFx0XHRcdHN0YXRlOiBhdHRycy5saXN0TW9kZWwuc3RhdGUsXG5cdFx0XHRcdFx0cmVuZGVyQ29uZmlnLFxuXHRcdFx0XHRcdG9uTG9hZE1vcmU6ICgpID0+IHtcblx0XHRcdFx0XHRcdGF0dHJzLmxpc3RNb2RlbD8ubG9hZE1vcmUoKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0b25SZXRyeUxvYWRpbmc6ICgpID0+IHtcblx0XHRcdFx0XHRcdGF0dHJzLmxpc3RNb2RlbD8ucmV0cnlMb2FkaW5nKClcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9uU2luZ2xlU2VsZWN0aW9uOiAoaXRlbTogQ2FsZW5kYXJTZWFyY2hSZXN1bHRMaXN0RW50cnkpID0+IHtcblx0XHRcdFx0XHRcdGF0dHJzLmxpc3RNb2RlbD8ub25TaW5nbGVTZWxlY3Rpb24oaXRlbSlcblx0XHRcdFx0XHRcdGF0dHJzLm9uU2luZ2xlU2VsZWN0aW9uKGl0ZW0pXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvblNpbmdsZVRvZ2dsaW5nTXVsdGlzZWxlY3Rpb246IChpdGVtOiBDYWxlbmRhclNlYXJjaFJlc3VsdExpc3RFbnRyeSkgPT4ge1xuXHRcdFx0XHRcdFx0YXR0cnMubGlzdE1vZGVsLm9uU2luZ2xlSW5jbHVzaXZlU2VsZWN0aW9uKGl0ZW0sIHN0eWxlcy5pc1NpbmdsZUNvbHVtbkxheW91dCgpKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0b25SYW5nZVNlbGVjdGlvblRvd2FyZHM6IChpdGVtOiBDYWxlbmRhclNlYXJjaFJlc3VsdExpc3RFbnRyeSkgPT4ge1xuXHRcdFx0XHRcdFx0YXR0cnMubGlzdE1vZGVsLnNlbGVjdFJhbmdlVG93YXJkcyhpdGVtKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0b25TdG9wTG9hZGluZygpIHtcblx0XHRcdFx0XHRcdGlmIChhdHRycy5jYW5jZWxDYWxsYmFjayAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdGF0dHJzLmNhbmNlbENhbGxiYWNrKClcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0YXR0cnMubGlzdE1vZGVsLnN0b3BMb2FkaW5nKClcblx0XHRcdFx0XHR9LFxuXHRcdFx0ICB9IHNhdGlzZmllcyBMaXN0QXR0cnM8Q2FsZW5kYXJTZWFyY2hSZXN1bHRMaXN0RW50cnksIFNlYXJjaFJlc3VsdExpc3RSb3c+KVxuXHR9XG5cblx0cHJpdmF0ZSByZWFkb25seSBjYWxlbmRhclJlbmRlckNvbmZpZzogUmVuZGVyQ29uZmlnPENhbGVuZGFyU2VhcmNoUmVzdWx0TGlzdEVudHJ5LCBTZWFyY2hSZXN1bHRMaXN0Um93PiA9IHtcblx0XHRpdGVtSGVpZ2h0OiBzaXplLmxpc3Rfcm93X2hlaWdodCxcblx0XHRtdWx0aXNlbGVjdGlvbkFsbG93ZWQ6IE11bHRpc2VsZWN0TW9kZS5EaXNhYmxlZCxcblx0XHRzd2lwZTogbnVsbCxcblx0XHRjcmVhdGVFbGVtZW50OiAoZG9tOiBIVE1MRWxlbWVudCkgPT4ge1xuXHRcdFx0Y29uc3Qgcm93OiBTZWFyY2hSZXN1bHRMaXN0Um93ID0gbmV3IFNlYXJjaFJlc3VsdExpc3RSb3cobmV3IEtpbmRhQ2FsZW5kYXJSb3coZG9tKSlcblx0XHRcdG0ucmVuZGVyKGRvbSwgcm93LnJlbmRlcigpKVxuXHRcdFx0cmV0dXJuIHJvd1xuXHRcdH0sXG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIFNlYXJjaFJlc3VsdExpc3RSb3cgaW1wbGVtZW50cyBWaXJ0dWFsUm93PENhbGVuZGFyU2VhcmNoUmVzdWx0TGlzdEVudHJ5PiB7XG5cdHRvcDogbnVtYmVyXG5cdC8vIHNldCBmcm9tIExpc3Rcblx0ZG9tRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXG5cdC8vIHRoaXMgaXMgb3VyIG93biBlbnRyeSB3aGljaCB3ZSBuZWVkIGZvciBzb21lIHJlYXNvbiAocHJvYmFibHkgZWFzaWVyIHRvIGRlYWwgd2l0aCB0aGFuIGEgbG90IG9mIHN1bSB0eXBlIGVudHJpZXMpXG5cdHByaXZhdGUgX2VudGl0eTogQ2FsZW5kYXJTZWFyY2hSZXN1bHRMaXN0RW50cnkgfCBudWxsID0gbnVsbFxuXHRnZXQgZW50aXR5KCk6IENhbGVuZGFyU2VhcmNoUmVzdWx0TGlzdEVudHJ5IHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuX2VudGl0eVxuXHR9XG5cblx0cHJpdmF0ZSBfZGVsZWdhdGU6IEtpbmRhQ2FsZW5kYXJSb3dcblxuXHRjb25zdHJ1Y3RvcihkZWxlZ2F0ZTogS2luZGFDYWxlbmRhclJvdykge1xuXHRcdHRoaXMuX2RlbGVnYXRlID0gZGVsZWdhdGVcblx0XHR0aGlzLnRvcCA9IDBcblx0fVxuXG5cdHVwZGF0ZShlbnRyeTogQ2FsZW5kYXJTZWFyY2hSZXN1bHRMaXN0RW50cnksIHNlbGVjdGVkOiBib29sZWFuLCBpc0luTXVsdGlTZWxlY3Q6IGJvb2xlYW4pOiB2b2lkIHtcblx0XHR0aGlzLl9kZWxlZ2F0ZS5kb21FbGVtZW50ID0gdGhpcy5kb21FbGVtZW50IVxuXHRcdHRoaXMuX2VudGl0eSA9IGVudHJ5XG5cblx0XHR0aGlzLl9kZWxlZ2F0ZS51cGRhdGUoZG93bmNhc3QoZW50cnkuZW50cnkpLCBzZWxlY3RlZCwgaXNJbk11bHRpU2VsZWN0KVxuXHR9XG5cblx0cmVuZGVyKCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gdGhpcy5fZGVsZWdhdGUucmVuZGVyKClcblx0fVxufVxuIiwiaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHtcblx0YmFzZTY0VG9CYXNlNjRVcmwsXG5cdGJhc2U2NFVybFRvQmFzZTY0LFxuXHRkZWNvZGVCYXNlNjQsXG5cdGZpbHRlckludCxcblx0Z2V0RW5kT2ZEYXksXG5cdGdldFN0YXJ0T2ZEYXksXG5cdGluY3JlbWVudE1vbnRoLFxuXHRzdHJpbmdUb0Jhc2U2NCxcbn0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBSb3V0ZVNldEZuLCB0aHJvdHRsZVJvdXRlIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9taXNjL1JvdXRlQ2hhbmdlXCJcbmltcG9ydCB0eXBlIHsgU2VhcmNoUmVzdHJpY3Rpb24gfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvc2VhcmNoL1NlYXJjaFR5cGVzXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnQsIENhbGVuZGFyRXZlbnRUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnNcIlxuaW1wb3J0IHsgZ2V0RWxlbWVudElkIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbmNvbnN0IEZJWEVEX0ZSRUVfU0VBUkNIX0RBWVMgPSAyOFxuXG5leHBvcnQgY29uc3QgZW51bSBTZWFyY2hDYXRlZ29yeVR5cGVzIHtcblx0Y2FsZW5kYXIgPSBcImNhbGVuZGFyXCIsXG59XG5cbmNvbnN0IHJvdXRlU2V0VGhyb3R0bGVkOiBSb3V0ZVNldEZuID0gdGhyb3R0bGVSb3V0ZSgpXG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRTZWFyY2hVcmwodXJsOiBzdHJpbmcpIHtcblx0aWYgKHVybCAhPT0gbS5yb3V0ZS5nZXQoKSkge1xuXHRcdHJvdXRlU2V0VGhyb3R0bGVkKHVybCwge30pXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlYXJjaFVybChcblx0cXVlcnk6IHN0cmluZyB8IG51bGwsXG5cdHJlc3RyaWN0aW9uOiBTZWFyY2hSZXN0cmljdGlvbixcblx0c2VsZWN0aW9uS2V5OiBzdHJpbmcgfCBudWxsLFxuKToge1xuXHRwYXRoOiBzdHJpbmdcblx0cGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBudW1iZXIgfCBBcnJheTxzdHJpbmc+PlxufSB7XG5cdGNvbnN0IHBhcmFtczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyIHwgQXJyYXk8c3RyaW5nPj4gPSB7XG5cdFx0cXVlcnk6IHF1ZXJ5ID8/IFwiXCIsXG5cdFx0Y2F0ZWdvcnk6IFNlYXJjaENhdGVnb3J5VHlwZXMuY2FsZW5kYXIsXG5cdH1cblx0Ly8gYSBiaXQgYW5ub3lpbmcgYnV0IGF2b2lkcyBwdXR0aW5nIHVubmVjZXNzYXJ5IHRoaW5ncyBpbnRvIHRoZSB1cmwgKGlmIHdlIHdvdWRsIHB1dCB1bmRlZmluZWQgaW50byBpdClcblx0aWYgKHJlc3RyaWN0aW9uLnN0YXJ0KSB7XG5cdFx0cGFyYW1zLnN0YXJ0ID0gcmVzdHJpY3Rpb24uc3RhcnRcblx0fVxuXHRpZiAocmVzdHJpY3Rpb24uZW5kKSB7XG5cdFx0cGFyYW1zLmVuZCA9IHJlc3RyaWN0aW9uLmVuZFxuXHR9XG5cdGlmIChyZXN0cmljdGlvbi5mb2xkZXJJZHMubGVuZ3RoID4gMCkge1xuXHRcdHBhcmFtcy5mb2xkZXIgPSByZXN0cmljdGlvbi5mb2xkZXJJZHNcblx0fVxuXG5cdGlmIChyZXN0cmljdGlvbi5ldmVudFNlcmllcyAhPSBudWxsKSB7XG5cdFx0cGFyYW1zLmV2ZW50U2VyaWVzID0gU3RyaW5nKHJlc3RyaWN0aW9uLmV2ZW50U2VyaWVzKVxuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRwYXRoOiBcIi9zZWFyY2gvOmNhdGVnb3J5XCIgKyAoc2VsZWN0aW9uS2V5ID8gXCIvXCIgKyBzZWxlY3Rpb25LZXkgOiBcIlwiKSxcblx0XHRwYXJhbXM6IHBhcmFtcyxcblx0fVxufVxuXG4vKipcbiAqIEFkanVzdHMgdGhlIHJlc3RyaWN0aW9uIGFjY29yZGluZyB0byB0aGUgYWNjb3VudCB0eXBlIGlmIG5lY2Vzc2FyeVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmVzdHJpY3Rpb24oc3RhcnQ6IG51bWJlciB8IG51bGwsIGVuZDogbnVtYmVyIHwgbnVsbCwgZm9sZGVySWRzOiBBcnJheTxzdHJpbmc+LCBldmVudFNlcmllczogYm9vbGVhbik6IFNlYXJjaFJlc3RyaWN0aW9uIHtcblx0cmV0dXJuIHtcblx0XHR0eXBlOiBDYWxlbmRhckV2ZW50VHlwZVJlZixcblx0XHRzdGFydDogc3RhcnQsXG5cdFx0ZW5kOiBlbmQsXG5cdFx0ZmllbGQ6IG51bGwsXG5cdFx0YXR0cmlidXRlSWRzOiBudWxsLFxuXHRcdGZvbGRlcklkcyxcblx0XHRldmVudFNlcmllcyxcblx0fVxufVxuXG4vKipcbiAqIEFkanVzdHMgdGhlIHJlc3RyaWN0aW9uIGFjY29yZGluZyB0byB0aGUgYWNjb3VudCB0eXBlIGlmIG5lY2Vzc2FyeVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVzdHJpY3Rpb24ocm91dGU6IHN0cmluZyk6IFNlYXJjaFJlc3RyaWN0aW9uIHtcblx0bGV0IHN0YXJ0OiBudW1iZXIgfCBudWxsID0gbnVsbFxuXHRsZXQgZW5kOiBudW1iZXIgfCBudWxsID0gbnVsbFxuXHRsZXQgZm9sZGVySWRzOiBBcnJheTxzdHJpbmc+ID0gW11cblx0bGV0IGV2ZW50U2VyaWVzOiBib29sZWFuID0gdHJ1ZVxuXG5cdGlmIChyb3V0ZS5zdGFydHNXaXRoKFwiL2NhbGVuZGFyXCIpIHx8IHJvdXRlLnN0YXJ0c1dpdGgoXCIvc2VhcmNoL2NhbGVuZGFyXCIpKSB7XG5cdFx0Y29uc3QgeyBwYXJhbXMgfSA9IG0ucGFyc2VQYXRobmFtZShyb3V0ZSlcblxuXHRcdHRyeSB7XG5cdFx0XHRpZiAodHlwZW9mIHBhcmFtc1tcImV2ZW50U2VyaWVzXCJdID09PSBcImJvb2xlYW5cIikge1xuXHRcdFx0XHRldmVudFNlcmllcyA9IHBhcmFtc1tcImV2ZW50U2VyaWVzXCJdXG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlb2YgcGFyYW1zW1wic3RhcnRcIl0gPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdFx0c3RhcnQgPSBmaWx0ZXJJbnQocGFyYW1zW1wic3RhcnRcIl0pXG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlb2YgcGFyYW1zW1wiZW5kXCJdID09PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRcdGVuZCA9IGZpbHRlckludChwYXJhbXNbXCJlbmRcIl0pXG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGZvbGRlciA9IHBhcmFtc1tcImZvbGRlclwiXVxuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoZm9sZGVyKSkge1xuXHRcdFx0XHRmb2xkZXJJZHMgPSBmb2xkZXJcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcImludmFsaWQgcXVlcnk6IFwiICsgcm91dGUsIGUpXG5cdFx0fVxuXG5cdFx0aWYgKHN0YXJ0ID09IG51bGwpIHtcblx0XHRcdGNvbnN0IG5vdyA9IG5ldyBEYXRlKClcblx0XHRcdG5vdy5zZXREYXRlKDEpXG5cdFx0XHRzdGFydCA9IGdldFN0YXJ0T2ZEYXkobm93KS5nZXRUaW1lKClcblx0XHR9XG5cblx0XHRpZiAoZW5kID09IG51bGwpIHtcblx0XHRcdGNvbnN0IGVuZERhdGUgPSBpbmNyZW1lbnRNb250aChuZXcgRGF0ZShzdGFydCksIDMpXG5cdFx0XHRlbmREYXRlLnNldERhdGUoMClcblx0XHRcdGVuZCA9IGdldEVuZE9mRGF5KGVuZERhdGUpLmdldFRpbWUoKVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIHR5cGUgXCIgKyByb3V0ZSlcblx0fVxuXG5cdHJldHVybiBjcmVhdGVSZXN0cmljdGlvbihzdGFydCwgZW5kLCBmb2xkZXJJZHMsIGV2ZW50U2VyaWVzKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlQ2FsZW5kYXJTZWFyY2hLZXkoc2VhcmNoS2V5OiBzdHJpbmcpOiB7IGlkOiBJZDsgc3RhcnQ6IG51bWJlciB9IHtcblx0cmV0dXJuIEpTT04ucGFyc2UoZGVjb2RlQmFzZTY0KFwidXRmLThcIiwgYmFzZTY0VXJsVG9CYXNlNjQoc2VhcmNoS2V5KSkpIGFzIHsgaWQ6IElkOyBzdGFydDogbnVtYmVyIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZUNhbGVuZGFyU2VhcmNoS2V5KGV2ZW50OiBDYWxlbmRhckV2ZW50KTogc3RyaW5nIHtcblx0Y29uc3QgZXZlbnRTdGFydFRpbWUgPSBldmVudC5zdGFydFRpbWUuZ2V0VGltZSgpXG5cdHJldHVybiBiYXNlNjRUb0Jhc2U2NFVybChzdHJpbmdUb0Jhc2U2NChKU09OLnN0cmluZ2lmeSh7IHN0YXJ0OiBldmVudFN0YXJ0VGltZSwgaWQ6IGdldEVsZW1lbnRJZChldmVudCkgfSkpKVxufVxuIiwiaW1wb3J0IHsgQ2FsZW5kYXJTZWFyY2hSZXN1bHRMaXN0RW50cnkgfSBmcm9tIFwiLi9DYWxlbmRhclNlYXJjaExpc3RWaWV3LmpzXCJcbmltcG9ydCB7IFNlYXJjaFJlc3RyaWN0aW9uLCBTZWFyY2hSZXN1bHQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvc2VhcmNoL1NlYXJjaFR5cGVzLmpzXCJcbmltcG9ydCB7IEVudGl0eUV2ZW50c0xpc3RlbmVyLCBFdmVudENvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL0V2ZW50Q29udHJvbGxlci5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50LCBDYWxlbmRhckV2ZW50VHlwZVJlZiwgQ29udGFjdFR5cGVSZWYsIE1haWxUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgU29tZUVudGl0eSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9FbnRpdHlUeXBlcy5qc1wiXG5pbXBvcnQgeyBDTElFTlRfT05MWV9DQUxFTkRBUlMsIE9wZXJhdGlvblR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgYXNzZXJ0SXNFbnRpdHkyLCBlbGVtZW50SWRQYXJ0LCBHRU5FUkFURURfTUFYX0lELCBnZXRFbGVtZW50SWQsIGlzU2FtZUlkLCBMaXN0RWxlbWVudCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5pbXBvcnQgeyBMaXN0TG9hZGluZ1N0YXRlLCBMaXN0U3RhdGUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0xpc3QuanNcIlxuaW1wb3J0IHtcblx0YXNzZXJ0Tm90TnVsbCxcblx0ZGVlcEVxdWFsLFxuXHRkb3duY2FzdCxcblx0Z2V0RW5kT2ZEYXksXG5cdGdldFN0YXJ0T2ZEYXksXG5cdGluY3JlbWVudE1vbnRoLFxuXHRpc1NhbWVEYXlPZkRhdGUsXG5cdGlzU2FtZVR5cGVSZWYsXG5cdExhenlMb2FkZWQsXG5cdGxhenlNZW1vaXplZCxcblx0bmV2ZXJOdWxsLFxuXHRvZkNsYXNzLFxuXHRzdHJpbmdUb0Jhc2U2NCxcblx0VHlwZVJlZixcblx0WUVBUl9JTl9NSUxMSVMsXG59IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgYXJlUmVzdWx0c0ZvclRoZVNhbWVRdWVyeSwgQ2FsZW5kYXJTZWFyY2hNb2RlbCwgaGFzTW9yZVJlc3VsdHMsIGlzU2FtZVNlYXJjaFJlc3RyaWN0aW9uIH0gZnJvbSBcIi4uL21vZGVsL0NhbGVuZGFyU2VhcmNoTW9kZWwuanNcIlxuaW1wb3J0IHsgTm90Rm91bmRFcnJvciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3IuanNcIlxuaW1wb3J0IHsgY3JlYXRlUmVzdHJpY3Rpb24sIGRlY29kZUNhbGVuZGFyU2VhcmNoS2V5LCBlbmNvZGVDYWxlbmRhclNlYXJjaEtleSwgZ2V0UmVzdHJpY3Rpb24gfSBmcm9tIFwiLi4vbW9kZWwvU2VhcmNoVXRpbHMuanNcIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHtcblx0Z2VuZXJhdGVDYWxlbmRhckluc3RhbmNlc0luUmFuZ2UsXG5cdGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0Rm9yVXNlcixcblx0cmV0cmlldmVDbGllbnRPbmx5RXZlbnRzRm9yVXNlcixcbn0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyVXRpbHMuanNcIlxuaW1wb3J0IHsgTG9naW5Db250cm9sbGVyIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Mb2dpbkNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgRW50aXR5Q2xpZW50IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudGl0eUNsaWVudC5qc1wiXG5pbXBvcnQgeyBjb250YWluc0V2ZW50T2ZUeXBlLCBFbnRpdHlVcGRhdGVEYXRhLCBnZXRFdmVudE9mVHlwZSwgaXNVcGRhdGVGb3JUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVVwZGF0ZVV0aWxzLmpzXCJcbmltcG9ydCB7IENhbGVuZGFySW5mbyB9IGZyb20gXCIuLi8uLi9tb2RlbC9DYWxlbmRhck1vZGVsLmpzXCJcbmltcG9ydCBtIGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IENhbGVuZGFyRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9DYWxlbmRhckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBQcm9ncmVzc1RyYWNrZXIgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL1Byb2dyZXNzVHJhY2tlci5qc1wiXG5pbXBvcnQgeyBDbGllbnRPbmx5Q2FsZW5kYXJzSW5mbywgTGlzdEF1dG9TZWxlY3RCZWhhdmlvciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWlzYy9EZXZpY2VDb25maWcuanNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9Qcm9ncmFtbWluZ0Vycm9yLmpzXCJcbmltcG9ydCB7IFNlYXJjaFJvdXRlciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vc2VhcmNoL3ZpZXcvU2VhcmNoUm91dGVyLmpzXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3IuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudHNSZXBvc2l0b3J5IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeVwiXG5pbXBvcnQgeyBnZXRDbGllbnRPbmx5Q2FsZW5kYXJzIH0gZnJvbSBcIi4uLy4uL2d1aS9DYWxlbmRhckd1aVV0aWxzXCJcbmltcG9ydCB7IExpc3RFbGVtZW50TGlzdE1vZGVsIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9taXNjL0xpc3RFbGVtZW50TGlzdE1vZGVsXCJcblxuY29uc3QgU0VBUkNIX1BBR0VfU0laRSA9IDEwMFxuXG5leHBvcnQgZW51bSBQYWlkRnVuY3Rpb25SZXN1bHQge1xuXHRTdWNjZXNzLFxuXHRQYWlkU3Vic2NyaXB0aW9uTmVlZGVkLFxufVxuXG5leHBvcnQgY2xhc3MgQ2FsZW5kYXJTZWFyY2hWaWV3TW9kZWwge1xuXHRwcml2YXRlIF9saXN0TW9kZWw6IExpc3RFbGVtZW50TGlzdE1vZGVsPENhbGVuZGFyU2VhcmNoUmVzdWx0TGlzdEVudHJ5PlxuXHRnZXQgbGlzdE1vZGVsKCk6IExpc3RFbGVtZW50TGlzdE1vZGVsPENhbGVuZGFyU2VhcmNoUmVzdWx0TGlzdEVudHJ5PiB7XG5cdFx0cmV0dXJuIHRoaXMuX2xpc3RNb2RlbFxuXHR9XG5cblx0cHJpdmF0ZSBfaW5jbHVkZVJlcGVhdGluZ0V2ZW50czogYm9vbGVhbiA9IHRydWVcblx0Z2V0IGluY2x1ZGVSZXBlYXRpbmdFdmVudHMoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuX2luY2x1ZGVSZXBlYXRpbmdFdmVudHNcblx0fVxuXG5cdGdldCB3YXJuaW5nKCk6IFwibG9uZ1wiIHwgXCJzdGFydGFmdGVyZW5kXCIgfCBudWxsIHtcblx0XHRpZiAodGhpcy5zdGFydERhdGUgJiYgdGhpcy5zdGFydERhdGUuZ2V0VGltZSgpID4gdGhpcy5lbmREYXRlLmdldFRpbWUoKSkge1xuXHRcdFx0cmV0dXJuIFwic3RhcnRhZnRlcmVuZFwiXG5cdFx0fSBlbHNlIGlmICh0aGlzLnN0YXJ0RGF0ZSAmJiB0aGlzLmVuZERhdGUuZ2V0VGltZSgpIC0gdGhpcy5zdGFydERhdGUuZ2V0VGltZSgpID4gWUVBUl9JTl9NSUxMSVMpIHtcblx0XHRcdHJldHVybiBcImxvbmdcIlxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgX3N0YXJ0RGF0ZTogRGF0ZSB8IG51bGwgPSBudWxsIC8vIG51bGwgPSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBjdXJyZW50IG1vbnRoXG5cdGdldCBzdGFydERhdGUoKTogRGF0ZSB8IG51bGwge1xuXHRcdGxldCByZXR1cm5EYXRlID0gdGhpcy5fc3RhcnREYXRlXG5cdFx0aWYgKCFyZXR1cm5EYXRlKSB7XG5cdFx0XHRyZXR1cm5EYXRlID0gbmV3IERhdGUoKVxuXHRcdFx0cmV0dXJuRGF0ZS5zZXREYXRlKDEpXG5cdFx0fVxuXHRcdHJldHVybiByZXR1cm5EYXRlXG5cdH1cblxuXHRwcml2YXRlIF9lbmREYXRlOiBEYXRlIHwgbnVsbCA9IG51bGwgLy8gbnVsbCA9IGVuZCBvZiAyIG1vbnRocyBpbiB0aGUgZnV0dXJlXG5cdGdldCBlbmREYXRlKCk6IERhdGUge1xuXHRcdGxldCByZXR1cm5EYXRlID0gdGhpcy5fZW5kRGF0ZVxuXHRcdGlmICghcmV0dXJuRGF0ZSkge1xuXHRcdFx0cmV0dXJuRGF0ZSA9IGluY3JlbWVudE1vbnRoKG5ldyBEYXRlKCksIDMpXG5cdFx0XHRyZXR1cm5EYXRlLnNldERhdGUoMClcblx0XHR9XG5cdFx0cmV0dXJuIHJldHVybkRhdGVcblx0fVxuXG5cdC8vIGlzbid0IGFuIElkVHVwbGUgYmVjYXVzZSBpdCBpcyB0d28gbGlzdCBpZHNcblx0cHJpdmF0ZSBfc2VsZWN0ZWRDYWxlbmRhcjogcmVhZG9ubHkgW0lkLCBJZF0gfCBzdHJpbmcgfCBudWxsID0gbnVsbFxuXHRnZXQgc2VsZWN0ZWRDYWxlbmRhcigpOiByZWFkb25seSBbSWQsIElkXSB8IHN0cmluZyB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLl9zZWxlY3RlZENhbGVuZGFyXG5cdH1cblxuXHQvLyBDb250YWlucyBsb2FkIG1vcmUgcmVzdWx0cyBldmVuIHdoZW4gc2VhcmNoTW9kZWwgZG9lc24ndC5cblx0Ly8gTG9hZCBtb3JlIHNob3VsZCBwcm9iYWJseSBiZSBtb3ZlZCB0byB0aGUgbW9kZWwgdG8gdXBkYXRlIGl0J3MgcmVzdWx0IHN0cmVhbS5cblx0cHJpdmF0ZSBzZWFyY2hSZXN1bHQ6IFNlYXJjaFJlc3VsdCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgbGF0ZXN0Q2FsZW5kYXJSZXN0cmljdGlvbjogU2VhcmNoUmVzdHJpY3Rpb24gfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHJlc3VsdFN1YnNjcmlwdGlvbjogU3RyZWFtPHZvaWQ+IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBsaXN0U3RhdGVTdWJzY3JpcHRpb246IFN0cmVhbTx1bmtub3duPiB8IG51bGwgPSBudWxsXG5cdGxvYWRpbmdBbGxGb3JTZWFyY2hSZXN1bHQ6IFNlYXJjaFJlc3VsdCB8IG51bGwgPSBudWxsXG5cblx0cHJpdmF0ZSByZWFkb25seSBsYXp5Q2FsZW5kYXJJbmZvczogTGF6eUxvYWRlZDxSZWFkb25seU1hcDxzdHJpbmcsIENhbGVuZGFySW5mbz4+ID0gbmV3IExhenlMb2FkZWQoYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IGNhbGVuZGFyTW9kZWwgPSBhd2FpdCBsb2NhdG9yLmNhbGVuZGFyTW9kZWwoKVxuXHRcdGNvbnN0IGNhbGVuZGFySW5mb3MgPSBhd2FpdCBjYWxlbmRhck1vZGVsLmdldENhbGVuZGFySW5mb3MoKVxuXHRcdG0ucmVkcmF3KClcblx0XHRyZXR1cm4gY2FsZW5kYXJJbmZvc1xuXHR9KVxuXG5cdHByaXZhdGUgcmVhZG9ubHkgdXNlckhhc05ld1BhaWRQbGFuOiBMYXp5TG9hZGVkPGJvb2xlYW4+ID0gbmV3IExhenlMb2FkZWQ8Ym9vbGVhbj4oYXN5bmMgKCkgPT4ge1xuXHRcdHJldHVybiBhd2FpdCB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzTmV3UGFpZFBsYW4oKVxuXHR9KVxuXG5cdGN1cnJlbnRRdWVyeTogc3RyaW5nID0gXCJcIlxuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHJlYWRvbmx5IHJvdXRlcjogU2VhcmNoUm91dGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgc2VhcmNoOiBDYWxlbmRhclNlYXJjaE1vZGVsLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbG9naW5zOiBMb2dpbkNvbnRyb2xsZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY2FsZW5kYXJGYWNhZGU6IENhbGVuZGFyRmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgcHJvZ3Jlc3NUcmFja2VyOiBQcm9ncmVzc1RyYWNrZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBldmVudHNSZXBvc2l0b3J5OiBDYWxlbmRhckV2ZW50c1JlcG9zaXRvcnksXG5cdFx0cHJpdmF0ZSByZWFkb25seSB1cGRhdGVVaTogKCkgPT4gdW5rbm93bixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGxvY2FsQ2FsZW5kYXJzOiBNYXA8SWQsIENsaWVudE9ubHlDYWxlbmRhcnNJbmZvPixcblx0KSB7XG5cdFx0dGhpcy5jdXJyZW50UXVlcnkgPSB0aGlzLnNlYXJjaC5yZXN1bHQoKT8ucXVlcnkgPz8gXCJcIlxuXHRcdHRoaXMuX2xpc3RNb2RlbCA9IHRoaXMuY3JlYXRlTGlzdCgpXG5cdH1cblxuXHRnZXRMYXp5Q2FsZW5kYXJJbmZvcygpIHtcblx0XHRyZXR1cm4gdGhpcy5sYXp5Q2FsZW5kYXJJbmZvc1xuXHR9XG5cblx0Z2V0VXNlckhhc05ld1BhaWRQbGFuKCkge1xuXHRcdHJldHVybiB0aGlzLnVzZXJIYXNOZXdQYWlkUGxhblxuXHR9XG5cblx0cmVhZG9ubHkgaW5pdCA9IGxhenlNZW1vaXplZCgoKSA9PiB7XG5cdFx0dGhpcy5yZXN1bHRTdWJzY3JpcHRpb24gPSB0aGlzLnNlYXJjaC5yZXN1bHQubWFwKChyZXN1bHQpID0+IHtcblx0XHRcdGlmICh0aGlzLnNlYXJjaFJlc3VsdCA9PSBudWxsIHx8IHJlc3VsdCA9PSBudWxsIHx8ICFhcmVSZXN1bHRzRm9yVGhlU2FtZVF1ZXJ5KHJlc3VsdCwgdGhpcy5zZWFyY2hSZXN1bHQpKSB7XG5cdFx0XHRcdHRoaXMubGlzdE1vZGVsLmNhbmNlbExvYWRBbGwoKVxuXG5cdFx0XHRcdHRoaXMuc2VhcmNoUmVzdWx0ID0gcmVzdWx0XG5cblx0XHRcdFx0dGhpcy5fbGlzdE1vZGVsID0gdGhpcy5jcmVhdGVMaXN0KClcblx0XHRcdFx0dGhpcy5saXN0TW9kZWwubG9hZEluaXRpYWwoKVxuXHRcdFx0XHR0aGlzLmxpc3RTdGF0ZVN1YnNjcmlwdGlvbj8uZW5kKHRydWUpXG5cdFx0XHRcdHRoaXMubGlzdFN0YXRlU3Vic2NyaXB0aW9uID0gdGhpcy5saXN0TW9kZWwuc3RhdGVTdHJlYW0ubWFwKChzdGF0ZSkgPT4gdGhpcy5vbkxpc3RTdGF0ZUNoYW5nZShzdGF0ZSkpXG5cdFx0XHR9XG5cdFx0fSlcblxuXHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLmFkZEVudGl0eUxpc3RlbmVyKHRoaXMuZW50aXR5RXZlbnRzTGlzdGVuZXIpXG5cdH0pXG5cblx0cHJpdmF0ZSByZWFkb25seSBlbnRpdHlFdmVudHNMaXN0ZW5lcjogRW50aXR5RXZlbnRzTGlzdGVuZXIgPSBhc3luYyAodXBkYXRlcykgPT4ge1xuXHRcdGZvciAoY29uc3QgdXBkYXRlIG9mIHVwZGF0ZXMpIHtcblx0XHRcdGNvbnN0IG1lcmdlZFVwZGF0ZSA9IHRoaXMubWVyZ2VPcGVyYXRpb25zSWZOZWVkZWQodXBkYXRlLCB1cGRhdGVzKVxuXG5cdFx0XHRpZiAobWVyZ2VkVXBkYXRlID09IG51bGwpIGNvbnRpbnVlXG5cblx0XHRcdGF3YWl0IHRoaXMuZW50aXR5RXZlbnRSZWNlaXZlZChtZXJnZWRVcGRhdGUpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBtZXJnZU9wZXJhdGlvbnNJZk5lZWRlZCh1cGRhdGU6IEVudGl0eVVwZGF0ZURhdGEsIHVwZGF0ZXM6IHJlYWRvbmx5IEVudGl0eVVwZGF0ZURhdGFbXSk6IEVudGl0eVVwZGF0ZURhdGEgfCBudWxsIHtcblx0XHQvLyBXZSBhcmUgdHJ5aW5nIHRvIGtlZXAgdGhlIG1haWxzIHRoYXQgYXJlIG1vdmVkIGFuZCB3b3VsZCBtYXRjaCB0aGUgc2VhcmNoIGNyaXRlcmlhIGRpc3BsYXllZC5cblx0XHQvLyBUaGlzIGlzIGEgYml0IGhhY2t5IGFzIHdlIHJlaW1wbGVtZW50IHBhcnQgb2YgdGhlIGZpbHRlcmluZyBieSBsaXN0LlxuXHRcdC8vIElkZWFsbHkgc2VhcmNoIHJlc3VsdCB3b3VsZCB1cGRhdGUgYnkgaXRzZWxmIGFuZCB3ZSB3b3VsZCBvbmx5IG5lZWQgdG8gcmVjb25jaWxlIHRoZSBjaGFuZ2VzLlxuXHRcdGlmICghaXNVcGRhdGVGb3JUeXBlUmVmKE1haWxUeXBlUmVmLCB1cGRhdGUpIHx8IHRoaXMuc2VhcmNoUmVzdWx0ID09IG51bGwpIHtcblx0XHRcdHJldHVybiB1cGRhdGVcblx0XHR9XG5cdFx0aWYgKHVwZGF0ZS5vcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuQ1JFQVRFICYmIGNvbnRhaW5zRXZlbnRPZlR5cGUodXBkYXRlcywgT3BlcmF0aW9uVHlwZS5ERUxFVEUsIHVwZGF0ZS5pbnN0YW5jZUlkKSkge1xuXHRcdFx0Ly8gVGhpcyBpcyBhIG1vdmUgb3BlcmF0aW9uLCBpcyBkZXN0aW5hdGlvbiBsaXN0IGluY2x1ZGVkIGluIHRoZSByZXN0cmljdGlvbnM/XG5cdFx0XHRpZiAodGhpcy5saXN0SWRNYXRjaGVzUmVzdHJpY3Rpb24odXBkYXRlLmluc3RhbmNlTGlzdElkLCB0aGlzLnNlYXJjaFJlc3VsdC5yZXN0cmljdGlvbikpIHtcblx0XHRcdFx0Ly8gSWYgaXQncyBpbmNsdWRlZCwgd2Ugd2FudCB0byBrZWVwIHNob3dpbmcgdGhlIGl0ZW0gYnV0IHdlIHdpbGwgc2ltdWxhdGUgdGhlIFVQREFURVxuXHRcdFx0XHRyZXR1cm4geyAuLi51cGRhdGUsIG9wZXJhdGlvbjogT3BlcmF0aW9uVHlwZS5VUERBVEUgfVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gSWYgaXQncyBub3QgZ29pbmcgdG8gYmUgaW5jbHVkZWQgd2UgbWlnaHQgYXMgd2VsbCBza2lwIHRoZSBjcmVhdGUgb3BlcmF0aW9uXG5cdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh1cGRhdGUub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLkRFTEVURSAmJiBjb250YWluc0V2ZW50T2ZUeXBlKHVwZGF0ZXMsIE9wZXJhdGlvblR5cGUuQ1JFQVRFLCB1cGRhdGUuaW5zdGFuY2VJZCkpIHtcblx0XHRcdC8vIFRoaXMgaXMgYSBtb3ZlIG9wZXJhdGlvbiBhbmQgd2UgYXJlIGluIHRoZSBkZWxldGUgcGFydCBvZiBpdC5cblx0XHRcdC8vIEdyYWIgdGhlIG90aGVyIHBhcnQgdG8gY2hlY2sgdGhlIG1vdmUgZGVzdGluYXRpb24uXG5cdFx0XHRjb25zdCBjcmVhdGVPcGVyYXRpb24gPSBhc3NlcnROb3ROdWxsKGdldEV2ZW50T2ZUeXBlKHVwZGF0ZXMsIE9wZXJhdGlvblR5cGUuQ1JFQVRFLCB1cGRhdGUuaW5zdGFuY2VJZCkpXG5cdFx0XHQvLyBJcyBkZXN0aW5hdGlvbiBpbmNsdWRlZCBpbiB0aGUgc2VhcmNoP1xuXHRcdFx0aWYgKHRoaXMubGlzdElkTWF0Y2hlc1Jlc3RyaWN0aW9uKGNyZWF0ZU9wZXJhdGlvbi5pbnN0YW5jZUxpc3RJZCwgdGhpcy5zZWFyY2hSZXN1bHQucmVzdHJpY3Rpb24pKSB7XG5cdFx0XHRcdC8vIElmIHNvLCBza2lwIHRoZSBkZWxldGUuXG5cdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBPdGhlcndpc2UgZGVsZXRlXG5cdFx0XHRcdHJldHVybiB1cGRhdGVcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHVwZGF0ZVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgbGlzdElkTWF0Y2hlc1Jlc3RyaWN0aW9uKGxpc3RJZDogc3RyaW5nLCByZXN0cmljdGlvbjogU2VhcmNoUmVzdHJpY3Rpb24pOiBib29sZWFuIHtcblx0XHRyZXR1cm4gcmVzdHJpY3Rpb24uZm9sZGVySWRzLmxlbmd0aCA9PT0gMCB8fCByZXN0cmljdGlvbi5mb2xkZXJJZHMuaW5jbHVkZXMobGlzdElkKVxuXHR9XG5cblx0b25OZXdVcmwoYXJnczogUmVjb3JkPHN0cmluZywgYW55PiwgcmVxdWVzdGVkUGF0aDogc3RyaW5nKSB7XG5cdFx0bGV0IHJlc3RyaWN0aW9uXG5cdFx0dHJ5IHtcblx0XHRcdHJlc3RyaWN0aW9uID0gZ2V0UmVzdHJpY3Rpb24ocmVxdWVzdGVkUGF0aClcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHQvLyBpZiByZXN0cmljdGlvbiBpcyBicm9rZW4gcmVwbGFjZSBpdCB3aXRoIG5vbi1icm9rZW4gdmVyc2lvblxuXHRcdFx0dGhpcy5yb3V0ZXIucm91dGVUbyhhcmdzLnF1ZXJ5LCBjcmVhdGVSZXN0cmljdGlvbihudWxsLCBudWxsLCBbXSwgZmFsc2UpKVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0dGhpcy5jdXJyZW50UXVlcnkgPSBhcmdzLnF1ZXJ5XG5cdFx0Y29uc3QgbGFzdFF1ZXJ5ID0gdGhpcy5zZWFyY2gubGFzdFF1ZXJ5U3RyaW5nKClcblx0XHRjb25zdCBtYXhSZXN1bHRzID0gaXNTYW1lVHlwZVJlZihNYWlsVHlwZVJlZiwgcmVzdHJpY3Rpb24udHlwZSkgPyBTRUFSQ0hfUEFHRV9TSVpFIDogbnVsbFxuXHRcdGNvbnN0IGxpc3RNb2RlbCA9IHRoaXMubGlzdE1vZGVsXG5cdFx0Ly8gdXNpbmcgaGFzT3duUHJvcGVydHkgdG8gZGlzdGluZ3Vpc2ggY2FzZSB3aGVuIHVybCBpcyBsaWtlICcvc2VhcmNoL21haWwvcXVlcnk9J1xuXHRcdGlmIChPYmplY3QuaGFzT3duKGFyZ3MsIFwicXVlcnlcIikgJiYgdGhpcy5zZWFyY2guaXNOZXdTZWFyY2goYXJncy5xdWVyeSwgcmVzdHJpY3Rpb24pKSB7XG5cdFx0XHR0aGlzLnNlYXJjaFJlc3VsdCA9IG51bGxcblx0XHRcdGxpc3RNb2RlbC51cGRhdGVMb2FkaW5nU3RhdHVzKExpc3RMb2FkaW5nU3RhdGUuTG9hZGluZylcblx0XHRcdHRoaXMuc2VhcmNoXG5cdFx0XHRcdC5zZWFyY2goXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0cXVlcnk6IGFyZ3MucXVlcnksXG5cdFx0XHRcdFx0XHRyZXN0cmljdGlvbixcblx0XHRcdFx0XHRcdG1pblN1Z2dlc3Rpb25Db3VudDogMCxcblx0XHRcdFx0XHRcdG1heFJlc3VsdHMsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR0aGlzLnByb2dyZXNzVHJhY2tlcixcblx0XHRcdFx0KVxuXHRcdFx0XHQudGhlbigoKSA9PiBsaXN0TW9kZWwudXBkYXRlTG9hZGluZ1N0YXR1cyhMaXN0TG9hZGluZ1N0YXRlLkRvbmUpKVxuXHRcdFx0XHQuY2F0Y2goKCkgPT4gbGlzdE1vZGVsLnVwZGF0ZUxvYWRpbmdTdGF0dXMoTGlzdExvYWRpbmdTdGF0ZS5Db25uZWN0aW9uTG9zdCkpXG5cdFx0fSBlbHNlIGlmIChsYXN0UXVlcnkgJiYgdGhpcy5zZWFyY2guaXNOZXdTZWFyY2gobGFzdFF1ZXJ5LCByZXN0cmljdGlvbikpIHtcblx0XHRcdHRoaXMuc2VhcmNoUmVzdWx0ID0gbnVsbFxuXG5cdFx0XHQvLyBJZiBxdWVyeSBpcyBub3Qgc2V0IGZvciBzb21lIHJlYXNvbiAoZS5nLiBzd2l0Y2hpbmcgc2VhcmNoIHR5cGUpLCB1c2UgdGhlIGxhc3QgcXVlcnkgdmFsdWVcblx0XHRcdGxpc3RNb2RlbC5zZWxlY3ROb25lKClcblx0XHRcdGxpc3RNb2RlbC51cGRhdGVMb2FkaW5nU3RhdHVzKExpc3RMb2FkaW5nU3RhdGUuTG9hZGluZylcblx0XHRcdHRoaXMuc2VhcmNoXG5cdFx0XHRcdC5zZWFyY2goXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0cXVlcnk6IGxhc3RRdWVyeSxcblx0XHRcdFx0XHRcdHJlc3RyaWN0aW9uLFxuXHRcdFx0XHRcdFx0bWluU3VnZ2VzdGlvbkNvdW50OiAwLFxuXHRcdFx0XHRcdFx0bWF4UmVzdWx0cyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHRoaXMucHJvZ3Jlc3NUcmFja2VyLFxuXHRcdFx0XHQpXG5cdFx0XHRcdC50aGVuKCgpID0+IGxpc3RNb2RlbC51cGRhdGVMb2FkaW5nU3RhdHVzKExpc3RMb2FkaW5nU3RhdGUuRG9uZSkpXG5cdFx0XHRcdC5jYXRjaCgoKSA9PiBsaXN0TW9kZWwudXBkYXRlTG9hZGluZ1N0YXR1cyhMaXN0TG9hZGluZ1N0YXRlLkNvbm5lY3Rpb25Mb3N0KSlcblx0XHR9IGVsc2UgaWYgKCFPYmplY3QuaGFzT3duKGFyZ3MsIFwicXVlcnlcIikgJiYgIWxhc3RRdWVyeSkge1xuXHRcdFx0Ly8gbm8gcXVlcnkgYXQgYWxsIHlldFxuXHRcdFx0bGlzdE1vZGVsLnVwZGF0ZUxvYWRpbmdTdGF0dXMoTGlzdExvYWRpbmdTdGF0ZS5Eb25lKVxuXHRcdH1cblxuXHRcdHRoaXMuX3N0YXJ0RGF0ZSA9IHJlc3RyaWN0aW9uLnN0YXJ0ID8gbmV3IERhdGUocmVzdHJpY3Rpb24uc3RhcnQpIDogbnVsbFxuXHRcdHRoaXMuX2VuZERhdGUgPSByZXN0cmljdGlvbi5lbmQgPyBuZXcgRGF0ZShyZXN0cmljdGlvbi5lbmQpIDogbnVsbFxuXG5cdFx0Ly8gQ2hlY2sgaWYgdXNlciBpcyB0cnlpbmcgdG8gc2VhcmNoIGluIGEgY2xpZW50IG9ubHkgY2FsZW5kYXIgd2hpbGUgdXNpbmcgYSBmcmVlIGFjY291bnRcblx0XHRjb25zdCBzZWxlY3RlZENhbGVuZGFyID0gdGhpcy5leHRyYWN0Q2FsZW5kYXJMaXN0SWRzKHJlc3RyaWN0aW9uLmZvbGRlcklkcylcblx0XHRpZiAoIXNlbGVjdGVkQ2FsZW5kYXIgfHwgQXJyYXkuaXNBcnJheShzZWxlY3RlZENhbGVuZGFyKSkge1xuXHRcdFx0dGhpcy5fc2VsZWN0ZWRDYWxlbmRhciA9IHNlbGVjdGVkQ2FsZW5kYXJcblx0XHR9IGVsc2UgaWYgKENMSUVOVF9PTkxZX0NBTEVOREFSUy5oYXMoc2VsZWN0ZWRDYWxlbmRhci50b1N0cmluZygpKSkge1xuXHRcdFx0dGhpcy5nZXRVc2VySGFzTmV3UGFpZFBsYW4oKVxuXHRcdFx0XHQuZ2V0QXN5bmMoKVxuXHRcdFx0XHQudGhlbigoaXNOZXdQYWlkUGxhbikgPT4ge1xuXHRcdFx0XHRcdGlmICghaXNOZXdQYWlkUGxhbikge1xuXHRcdFx0XHRcdFx0cmV0dXJuICh0aGlzLl9zZWxlY3RlZENhbGVuZGFyID0gbnVsbClcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR0aGlzLl9zZWxlY3RlZENhbGVuZGFyID0gc2VsZWN0ZWRDYWxlbmRhclxuXHRcdFx0XHR9KVxuXHRcdH1cblxuXHRcdHRoaXMuX2luY2x1ZGVSZXBlYXRpbmdFdmVudHMgPSByZXN0cmljdGlvbi5ldmVudFNlcmllcyA/PyB0cnVlXG5cdFx0dGhpcy5sYXp5Q2FsZW5kYXJJbmZvcy5sb2FkKClcblx0XHR0aGlzLnVzZXJIYXNOZXdQYWlkUGxhbi5sb2FkKClcblx0XHR0aGlzLmxhdGVzdENhbGVuZGFyUmVzdHJpY3Rpb24gPSByZXN0cmljdGlvblxuXG5cdFx0aWYgKGFyZ3MuaWQgIT0gbnVsbCkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgeyBzdGFydCwgaWQgfSA9IGRlY29kZUNhbGVuZGFyU2VhcmNoS2V5KGFyZ3MuaWQpXG5cdFx0XHRcdHRoaXMubG9hZEFuZFNlbGVjdElmTmVlZGVkKGlkLCAoeyBlbnRyeSB9OiBDYWxlbmRhclNlYXJjaFJlc3VsdExpc3RFbnRyeSkgPT4ge1xuXHRcdFx0XHRcdGVudHJ5ID0gZW50cnkgYXMgQ2FsZW5kYXJFdmVudFxuXHRcdFx0XHRcdHJldHVybiBpZCA9PT0gZ2V0RWxlbWVudElkKGVudHJ5KSAmJiBzdGFydCA9PT0gZW50cnkuc3RhcnRUaW1lLmdldFRpbWUoKVxuXHRcdFx0XHR9KVxuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiSW52YWxpZCBJRCwgc2VsZWN0aW5nIG5vbmVcIilcblx0XHRcdFx0dGhpcy5saXN0TW9kZWwuc2VsZWN0Tm9uZSgpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBleHRyYWN0Q2FsZW5kYXJMaXN0SWRzKGxpc3RJZHM6IHN0cmluZ1tdKTogcmVhZG9ubHkgW3N0cmluZywgc3RyaW5nXSB8IHN0cmluZyB8IG51bGwge1xuXHRcdGlmIChsaXN0SWRzLmxlbmd0aCA8IDEpIHJldHVybiBudWxsXG5cdFx0ZWxzZSBpZiAobGlzdElkcy5sZW5ndGggPT09IDEpIHJldHVybiBsaXN0SWRzWzBdXG5cblx0XHRyZXR1cm4gW2xpc3RJZHNbMF0sIGxpc3RJZHNbMV1dXG5cdH1cblxuXHRwcml2YXRlIGxvYWRBbmRTZWxlY3RJZk5lZWRlZChpZDogc3RyaW5nIHwgbnVsbCwgZmluZGVyPzogKGE6IExpc3RFbGVtZW50KSA9PiBib29sZWFuKSB7XG5cdFx0Ly8gbm90aGluZyB0byBzZWxlY3Rcblx0XHRpZiAoaWQgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLmxpc3RNb2RlbC5pc0l0ZW1TZWxlY3RlZChpZCkpIHtcblx0XHRcdHRoaXMuaGFuZGxlTG9hZEFuZFNlbGVjdGlvbihpZCwgZmluZGVyKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlTG9hZEFuZFNlbGVjdGlvbihpZDogc3RyaW5nLCBmaW5kZXI6ICgoYTogTGlzdEVsZW1lbnQpID0+IGJvb2xlYW4pIHwgdW5kZWZpbmVkKSB7XG5cdFx0aWYgKHRoaXMubGlzdE1vZGVsLmlzTG9hZGVkQ29tcGxldGVseSgpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zZWxlY3RJdGVtKGlkLCBmaW5kZXIpXG5cdFx0fVxuXG5cdFx0Y29uc3QgbGlzdFN0YXRlU3RyZWFtID0gc3RyZWFtLmNvbWJpbmUoKGEpID0+IGEoKSwgW3RoaXMubGlzdE1vZGVsLnN0YXRlU3RyZWFtXSlcblx0XHRsaXN0U3RhdGVTdHJlYW0ubWFwKChzdGF0ZSkgPT4ge1xuXHRcdFx0aWYgKHN0YXRlLmxvYWRpbmdTdGF0dXMgPT09IExpc3RMb2FkaW5nU3RhdGUuRG9uZSkge1xuXHRcdFx0XHR0aGlzLnNlbGVjdEl0ZW0oaWQsIGZpbmRlcilcblx0XHRcdFx0bGlzdFN0YXRlU3RyZWFtLmVuZCh0cnVlKVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHNlbGVjdEl0ZW0oaWQ6IHN0cmluZywgZmluZGVyOiAoKGE6IExpc3RFbGVtZW50KSA9PiBib29sZWFuKSB8IHVuZGVmaW5lZCkge1xuXHRcdGNvbnN0IGxpc3RNb2RlbCA9IHRoaXMubGlzdE1vZGVsXG5cdFx0dGhpcy5saXN0TW9kZWwubG9hZEFuZFNlbGVjdChpZCwgKCkgPT4gIWRlZXBFcXVhbCh0aGlzLmxpc3RNb2RlbCwgbGlzdE1vZGVsKSwgZmluZGVyKVxuXHR9XG5cblx0YXN5bmMgbG9hZEFsbCgpIHtcblx0XHRpZiAodGhpcy5sb2FkaW5nQWxsRm9yU2VhcmNoUmVzdWx0ICE9IG51bGwpIHJldHVyblxuXHRcdHRoaXMubG9hZGluZ0FsbEZvclNlYXJjaFJlc3VsdCA9IHRoaXMuc2VhcmNoUmVzdWx0ID8/IG51bGxcblx0XHR0aGlzLmxpc3RNb2RlbC5zZWxlY3RBbGwoKVxuXHRcdHRyeSB7XG5cdFx0XHR3aGlsZSAoXG5cdFx0XHRcdHRoaXMuc2VhcmNoUmVzdWx0Py5yZXN0cmljdGlvbiAmJlxuXHRcdFx0XHR0aGlzLmxvYWRpbmdBbGxGb3JTZWFyY2hSZXN1bHQgJiZcblx0XHRcdFx0aXNTYW1lU2VhcmNoUmVzdHJpY3Rpb24odGhpcy5zZWFyY2hSZXN1bHQ/LnJlc3RyaWN0aW9uLCB0aGlzLmxvYWRpbmdBbGxGb3JTZWFyY2hSZXN1bHQucmVzdHJpY3Rpb24pICYmXG5cdFx0XHRcdCF0aGlzLmxpc3RNb2RlbC5pc0xvYWRlZENvbXBsZXRlbHkoKVxuXHRcdFx0KSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMubGlzdE1vZGVsLmxvYWRNb3JlKClcblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdHRoaXMuc2VhcmNoUmVzdWx0LnJlc3RyaWN0aW9uICYmXG5cdFx0XHRcdFx0dGhpcy5sb2FkaW5nQWxsRm9yU2VhcmNoUmVzdWx0LnJlc3RyaWN0aW9uICYmXG5cdFx0XHRcdFx0aXNTYW1lU2VhcmNoUmVzdHJpY3Rpb24odGhpcy5zZWFyY2hSZXN1bHQucmVzdHJpY3Rpb24sIHRoaXMubG9hZGluZ0FsbEZvclNlYXJjaFJlc3VsdC5yZXN0cmljdGlvbilcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0dGhpcy5saXN0TW9kZWwuc2VsZWN0QWxsKClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZmluYWxseSB7XG5cdFx0XHR0aGlzLmxvYWRpbmdBbGxGb3JTZWFyY2hSZXN1bHQgPSBudWxsXG5cdFx0fVxuXHR9XG5cblx0c3RvcExvYWRBbGwoKSB7XG5cdFx0dGhpcy5saXN0TW9kZWwuY2FuY2VsTG9hZEFsbCgpXG5cdH1cblxuXHRjYW5TZWxlY3RUaW1lUGVyaW9kKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiAhdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0ZyZWVBY2NvdW50KClcblx0fVxuXG5cdGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0KCk6IG51bWJlciB7XG5cdFx0cmV0dXJuIGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0Rm9yVXNlcih0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJTZXR0aW5nc0dyb3VwUm9vdClcblx0fVxuXG5cdHNlbGVjdENhbGVuZGFyKGNhbGVuZGFySW5mbzogQ2FsZW5kYXJJbmZvIHwgc3RyaW5nIHwgbnVsbCkge1xuXHRcdGlmICh0eXBlb2YgY2FsZW5kYXJJbmZvID09PSBcInN0cmluZ1wiIHx8IGNhbGVuZGFySW5mbyA9PSBudWxsKSB7XG5cdFx0XHR0aGlzLl9zZWxlY3RlZENhbGVuZGFyID0gY2FsZW5kYXJJbmZvXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuX3NlbGVjdGVkQ2FsZW5kYXIgPSBbY2FsZW5kYXJJbmZvLmdyb3VwUm9vdC5sb25nRXZlbnRzLCBjYWxlbmRhckluZm8uZ3JvdXBSb290LnNob3J0RXZlbnRzXVxuXHRcdH1cblx0XHR0aGlzLnNlYXJjaEFnYWluKClcblx0fVxuXG5cdHNlbGVjdFN0YXJ0RGF0ZShzdGFydERhdGU6IERhdGUgfCBudWxsKTogUGFpZEZ1bmN0aW9uUmVzdWx0IHtcblx0XHRpZiAoaXNTYW1lRGF5T2ZEYXRlKHRoaXMuc3RhcnREYXRlLCBzdGFydERhdGUpKSB7XG5cdFx0XHRyZXR1cm4gUGFpZEZ1bmN0aW9uUmVzdWx0LlN1Y2Nlc3Ncblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuY2FuU2VsZWN0VGltZVBlcmlvZCgpKSB7XG5cdFx0XHRyZXR1cm4gUGFpZEZ1bmN0aW9uUmVzdWx0LlBhaWRTdWJzY3JpcHRpb25OZWVkZWRcblx0XHR9XG5cblx0XHR0aGlzLl9zdGFydERhdGUgPSBzdGFydERhdGVcblxuXHRcdHRoaXMuc2VhcmNoQWdhaW4oKVxuXG5cdFx0cmV0dXJuIFBhaWRGdW5jdGlvblJlc3VsdC5TdWNjZXNzXG5cdH1cblxuXHRzZWxlY3RFbmREYXRlKGVuZERhdGU6IERhdGUpOiBQYWlkRnVuY3Rpb25SZXN1bHQge1xuXHRcdGlmIChpc1NhbWVEYXlPZkRhdGUodGhpcy5lbmREYXRlLCBlbmREYXRlKSkge1xuXHRcdFx0cmV0dXJuIFBhaWRGdW5jdGlvblJlc3VsdC5TdWNjZXNzXG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLmNhblNlbGVjdFRpbWVQZXJpb2QoKSkge1xuXHRcdFx0cmV0dXJuIFBhaWRGdW5jdGlvblJlc3VsdC5QYWlkU3Vic2NyaXB0aW9uTmVlZGVkXG5cdFx0fVxuXG5cdFx0dGhpcy5fZW5kRGF0ZSA9IGVuZERhdGVcblxuXHRcdHRoaXMuc2VhcmNoQWdhaW4oKVxuXG5cdFx0cmV0dXJuIFBhaWRGdW5jdGlvblJlc3VsdC5TdWNjZXNzXG5cdH1cblxuXHRzZWxlY3RJbmNsdWRlUmVwZWF0aW5nRXZlbnRzKGluY2x1ZGU6IGJvb2xlYW4pIHtcblx0XHR0aGlzLl9pbmNsdWRlUmVwZWF0aW5nRXZlbnRzID0gaW5jbHVkZVxuXHRcdHRoaXMuc2VhcmNoQWdhaW4oKVxuXHR9XG5cblx0cHJpdmF0ZSBzZWFyY2hBZ2FpbigpOiB2b2lkIHtcblx0XHR0aGlzLnVwZGF0ZVNlYXJjaFVybCgpXG5cdFx0dGhpcy51cGRhdGVVaSgpXG5cdH1cblxuXHRwcml2YXRlIHVwZGF0ZVNlYXJjaFVybCgpIHtcblx0XHRjb25zdCBzZWxlY3RlZEVsZW1lbnQgPSB0aGlzLmxpc3RNb2RlbC5zdGF0ZS5zZWxlY3RlZEl0ZW1zLnNpemUgPT09IDEgPyB0aGlzLmxpc3RNb2RlbC5nZXRTZWxlY3RlZEFzQXJyYXkoKS5hdCgwKSA6IG51bGxcblx0XHR0aGlzLnJvdXRlQ2FsZW5kYXIoXG5cdFx0XHQoc2VsZWN0ZWRFbGVtZW50Py5lbnRyeSBhcyBDYWxlbmRhckV2ZW50KSA/PyBudWxsLFxuXHRcdFx0Y3JlYXRlUmVzdHJpY3Rpb24oXG5cdFx0XHRcdHRoaXMuX3N0YXJ0RGF0ZSA/IGdldFN0YXJ0T2ZEYXkodGhpcy5fc3RhcnREYXRlKS5nZXRUaW1lKCkgOiBudWxsLFxuXHRcdFx0XHR0aGlzLl9lbmREYXRlID8gZ2V0RW5kT2ZEYXkodGhpcy5fZW5kRGF0ZSkuZ2V0VGltZSgpIDogbnVsbCxcblx0XHRcdFx0dGhpcy5nZXRGb2xkZXJJZHMoKSxcblx0XHRcdFx0dGhpcy5faW5jbHVkZVJlcGVhdGluZ0V2ZW50cyxcblx0XHRcdCksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRGb2xkZXJJZHMoKSB7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLnNlbGVjdGVkQ2FsZW5kYXIgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdHJldHVybiBbdGhpcy5zZWxlY3RlZENhbGVuZGFyXVxuXHRcdH0gZWxzZSBpZiAodGhpcy5zZWxlY3RlZENhbGVuZGFyICE9IG51bGwpIHtcblx0XHRcdHJldHVybiBbLi4udGhpcy5zZWxlY3RlZENhbGVuZGFyXVxuXHRcdH1cblxuXHRcdHJldHVybiBbXVxuXHR9XG5cblx0cHJpdmF0ZSByb3V0ZUNhbGVuZGFyKGVsZW1lbnQ6IENhbGVuZGFyRXZlbnQgfCBudWxsLCByZXN0cmljdGlvbjogU2VhcmNoUmVzdHJpY3Rpb24pIHtcblx0XHRjb25zdCBzZWxlY3Rpb25LZXkgPSB0aGlzLmdlbmVyYXRlU2VsZWN0aW9uS2V5KGVsZW1lbnQpXG5cdFx0dGhpcy5yb3V0ZXIucm91dGVUbyh0aGlzLmN1cnJlbnRRdWVyeSwgcmVzdHJpY3Rpb24sIHNlbGVjdGlvbktleSlcblx0fVxuXG5cdHByaXZhdGUgZ2VuZXJhdGVTZWxlY3Rpb25LZXkoZWxlbWVudDogQ2FsZW5kYXJFdmVudCB8IG51bGwpOiBzdHJpbmcgfCBudWxsIHtcblx0XHRpZiAoZWxlbWVudCA9PSBudWxsKSByZXR1cm4gbnVsbFxuXHRcdHJldHVybiBlbmNvZGVDYWxlbmRhclNlYXJjaEtleShlbGVtZW50KVxuXHR9XG5cblx0cHJpdmF0ZSBpc1Bvc3NpYmxlQUJpcnRoZGF5Q29udGFjdFVwZGF0ZSh1cGRhdGU6IEVudGl0eVVwZGF0ZURhdGEpOiBib29sZWFuIHtcblx0XHRpZiAoaXNVcGRhdGVGb3JUeXBlUmVmKENvbnRhY3RUeXBlUmVmLCB1cGRhdGUpKSB7XG5cdFx0XHRjb25zdCB7IGluc3RhbmNlTGlzdElkLCBpbnN0YW5jZUlkIH0gPSB1cGRhdGVcblx0XHRcdGNvbnN0IGVuY29kZWRDb250YWN0SWQgPSBzdHJpbmdUb0Jhc2U2NChgJHtpbnN0YW5jZUxpc3RJZH0vJHtpbnN0YW5jZUlkfWApXG5cblx0XHRcdHJldHVybiB0aGlzLmxpc3RNb2RlbC5zdGF0ZVN0cmVhbSgpLml0ZW1zLnNvbWUoKHNlYXJjaEVudHJ5KSA9PiBzZWFyY2hFbnRyeS5faWRbMV0uZW5kc1dpdGgoZW5jb2RlZENvbnRhY3RJZCkpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHRwcml2YXRlIGlzU2VsZWN0ZWRFdmVudEFuVXBkYXRlZEJpcnRoZGF5KHVwZGF0ZTogRW50aXR5VXBkYXRlRGF0YSk6IGJvb2xlYW4ge1xuXHRcdGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoQ29udGFjdFR5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdGNvbnN0IHsgaW5zdGFuY2VMaXN0SWQsIGluc3RhbmNlSWQgfSA9IHVwZGF0ZVxuXHRcdFx0Y29uc3QgZW5jb2RlZENvbnRhY3RJZCA9IHN0cmluZ1RvQmFzZTY0KGAke2luc3RhbmNlTGlzdElkfS8ke2luc3RhbmNlSWR9YClcblxuXHRcdFx0Y29uc3Qgc2VsZWN0ZWRJdGVtID0gdGhpcy5saXN0TW9kZWwuZ2V0U2VsZWN0ZWRBc0FycmF5KCkuYXQoMClcblx0XHRcdGlmICghc2VsZWN0ZWRJdGVtKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gc2VsZWN0ZWRJdGVtLl9pZFsxXS5lbmRzV2l0aChlbmNvZGVkQ29udGFjdElkKVxuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBlbnRpdHlFdmVudFJlY2VpdmVkKHVwZGF0ZTogRW50aXR5VXBkYXRlRGF0YSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGlzUG9zc2libGVBQmlydGhkYXlDb250YWN0VXBkYXRlID0gdGhpcy5pc1Bvc3NpYmxlQUJpcnRoZGF5Q29udGFjdFVwZGF0ZSh1cGRhdGUpXG5cblx0XHRpZiAoIWlzVXBkYXRlRm9yVHlwZVJlZihDYWxlbmRhckV2ZW50VHlwZVJlZiwgdXBkYXRlKSAmJiAhaXNQb3NzaWJsZUFCaXJ0aGRheUNvbnRhY3RVcGRhdGUpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGNvbnN0IHsgaW5zdGFuY2VMaXN0SWQsIGluc3RhbmNlSWQsIG9wZXJhdGlvbiB9ID0gdXBkYXRlXG5cdFx0Y29uc3QgaWQgPSBbbmV2ZXJOdWxsKGluc3RhbmNlTGlzdElkKSwgaW5zdGFuY2VJZF0gYXMgY29uc3Rcblx0XHRjb25zdCB0eXBlUmVmID0gbmV3IFR5cGVSZWY8U29tZUVudGl0eT4odXBkYXRlLmFwcGxpY2F0aW9uLCB1cGRhdGUudHlwZSlcblx0XHRpZiAoIXRoaXMuaXNJblNlYXJjaFJlc3VsdCh0eXBlUmVmLCBpZCkgJiYgaXNQb3NzaWJsZUFCaXJ0aGRheUNvbnRhY3RVcGRhdGUpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdC8vIGR1ZSB0byB0aGUgd2F5IGNhbGVuZGFyIGV2ZW50IGNoYW5nZXMgYXJlIHNvcnQgb2Ygbm9uLWxvY2FsLCB3ZSB0aHJvdyBhd2F5IHRoZSB3aG9sZSBsaXN0IGFuZCByZS1yZW5kZXIgaXQgaWZcblx0XHQvLyB0aGUgY29udGVudHMgYXJlIGVkaXRlZC4gd2UgZG8gdGhlIGNhbGN1bGF0aW9uIG9uIGEgbmV3IGxpc3QgYW5kIHRoZW4gc3dhcCB0aGUgb2xkIGxpc3Qgb3V0IG9uY2UgdGhlIG5ldyBvbmUgaXNcblx0XHQvLyByZWFkeVxuXHRcdGNvbnN0IHNlbGVjdGVkSXRlbSA9IHRoaXMubGlzdE1vZGVsLmdldFNlbGVjdGVkQXNBcnJheSgpLmF0KDApXG5cdFx0Y29uc3QgbGlzdE1vZGVsID0gdGhpcy5jcmVhdGVMaXN0KClcblxuXHRcdGlmIChpc1Bvc3NpYmxlQUJpcnRoZGF5Q29udGFjdFVwZGF0ZSAmJiAoYXdhaXQgdGhpcy5ldmVudHNSZXBvc2l0b3J5LmNhbkxvYWRCaXJ0aGRheXNDYWxlbmRhcigpKSkge1xuXHRcdFx0YXdhaXQgdGhpcy5ldmVudHNSZXBvc2l0b3J5LmxvYWRDb250YWN0c0JpcnRoZGF5cyh0cnVlKVxuXHRcdH1cblxuXHRcdGF3YWl0IGxpc3RNb2RlbC5sb2FkSW5pdGlhbCgpXG5cdFx0aWYgKHNlbGVjdGVkSXRlbSAhPSBudWxsKSB7XG5cdFx0XHRpZiAoaXNQb3NzaWJsZUFCaXJ0aGRheUNvbnRhY3RVcGRhdGUgJiYgdGhpcy5pc1NlbGVjdGVkRXZlbnRBblVwZGF0ZWRCaXJ0aGRheSh1cGRhdGUpKSB7XG5cdFx0XHRcdC8vIFdlIG11c3QgaW52YWxpZGF0ZSB0aGUgc2VsZWN0ZWQgaXRlbSB0byByZWZyZXNoIHRoZSBjb250YWN0IHByZXZpZXdcblx0XHRcdFx0dGhpcy5saXN0TW9kZWwuc2VsZWN0Tm9uZSgpXG5cdFx0XHR9XG5cblx0XHRcdGF3YWl0IGxpc3RNb2RlbC5sb2FkQW5kU2VsZWN0KGVsZW1lbnRJZFBhcnQoc2VsZWN0ZWRJdGVtLl9pZCksICgpID0+IGZhbHNlKVxuXHRcdH1cblx0XHR0aGlzLl9saXN0TW9kZWwgPSBsaXN0TW9kZWxcblx0XHR0aGlzLmxpc3RTdGF0ZVN1YnNjcmlwdGlvbj8uZW5kKHRydWUpXG5cdFx0dGhpcy5saXN0U3RhdGVTdWJzY3JpcHRpb24gPSB0aGlzLmxpc3RNb2RlbC5zdGF0ZVN0cmVhbS5tYXAoKHN0YXRlKSA9PiB0aGlzLm9uTGlzdFN0YXRlQ2hhbmdlKHN0YXRlKSlcblx0XHR0aGlzLnVwZGF0ZVNlYXJjaFVybCgpXG5cdFx0dGhpcy51cGRhdGVVaSgpXG5cdH1cblxuXHRnZXRTZWxlY3RlZEV2ZW50cygpOiBDYWxlbmRhckV2ZW50W10ge1xuXHRcdHJldHVybiB0aGlzLmxpc3RNb2RlbFxuXHRcdFx0LmdldFNlbGVjdGVkQXNBcnJheSgpXG5cdFx0XHQubWFwKChlKSA9PiBlLmVudHJ5KVxuXHRcdFx0LmZpbHRlcihhc3NlcnRJc0VudGl0eTIoQ2FsZW5kYXJFdmVudFR5cGVSZWYpKVxuXHR9XG5cblx0cHJpdmF0ZSBvbkxpc3RTdGF0ZUNoYW5nZShuZXdTdGF0ZTogTGlzdFN0YXRlPENhbGVuZGFyU2VhcmNoUmVzdWx0TGlzdEVudHJ5Pikge1xuXHRcdHRoaXMudXBkYXRlU2VhcmNoVXJsKClcblx0XHR0aGlzLnVwZGF0ZVVpKClcblx0fVxuXG5cdHByaXZhdGUgY3JlYXRlTGlzdCgpOiBMaXN0RWxlbWVudExpc3RNb2RlbDxDYWxlbmRhclNlYXJjaFJlc3VsdExpc3RFbnRyeT4ge1xuXHRcdC8vIHNpbmNlIHdlIHJlY3JlYXRlIHRoZSBsaXN0IGV2ZXJ5IHRpbWUgd2Ugc2V0IGEgbmV3IHJlc3VsdCBvYmplY3QsXG5cdFx0Ly8gd2UgYmluZCB0aGUgdmFsdWUgb2YgcmVzdWx0IGZvciB0aGUgbGlmZXRpbWUgb2YgdGhpcyBsaXN0IG1vZGVsXG5cdFx0Ly8gYXQgdGhpcyBwb2ludFxuXHRcdC8vIG5vdGUgaW4gY2FzZSBvZiByZWZhY3RvcjogdGhlIGZhY3QgdGhhdCB0aGUgbGlzdCB1cGRhdGVzIHRoZSBVUkwgZXZlcnkgdGltZSBpdCBjaGFuZ2VzXG5cdFx0Ly8gaXRzIHN0YXRlIGlzIGEgbWFqb3Igc291cmNlIG9mIGNvbXBsZXhpdHkgYW5kIG1ha2VzIGV2ZXJ5dGhpbmcgdmVyeSBvcmRlci1kZXBlbmRlbnRcblx0XHRyZXR1cm4gbmV3IExpc3RFbGVtZW50TGlzdE1vZGVsPENhbGVuZGFyU2VhcmNoUmVzdWx0TGlzdEVudHJ5Pih7XG5cdFx0XHRmZXRjaDogYXN5bmMgKGxhc3RGZXRjaGVkRW50aXR5OiBDYWxlbmRhclNlYXJjaFJlc3VsdExpc3RFbnRyeSwgY291bnQ6IG51bWJlcikgPT4ge1xuXHRcdFx0XHRjb25zdCBzdGFydElkID0gbGFzdEZldGNoZWRFbnRpdHkgPT0gbnVsbCA/IEdFTkVSQVRFRF9NQVhfSUQgOiBnZXRFbGVtZW50SWQobGFzdEZldGNoZWRFbnRpdHkpXG5cdFx0XHRcdGNvbnN0IGxhc3RSZXN1bHQgPSB0aGlzLnNlYXJjaFJlc3VsdFxuXHRcdFx0XHRpZiAobGFzdFJlc3VsdCAhPT0gdGhpcy5zZWFyY2hSZXN1bHQpIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oXCJnb3QgYSBmZXRjaCByZXF1ZXN0IGZvciBvdXRkYXRlZCByZXN1bHRzIG9iamVjdCwgaWdub3JpbmdcIilcblx0XHRcdFx0XHQvLyB0aGlzLnNlYXJjaFJlc3VsdHMgd2FzIHJlYXNzaWduZWQsIHdlJ2xsIGNyZWF0ZSBhIG5ldyBMaXN0RWxlbWVudExpc3RNb2RlbCBzb29uXG5cdFx0XHRcdFx0cmV0dXJuIHsgaXRlbXM6IFtdLCBjb21wbGV0ZTogdHJ1ZSB9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIWxhc3RSZXN1bHQgfHwgKGxhc3RSZXN1bHQucmVzdWx0cy5sZW5ndGggPT09IDAgJiYgIWhhc01vcmVSZXN1bHRzKGxhc3RSZXN1bHQpKSkge1xuXHRcdFx0XHRcdHJldHVybiB7IGl0ZW1zOiBbXSwgY29tcGxldGU6IHRydWUgfVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgeyBpdGVtcywgbmV3U2VhcmNoUmVzdWx0IH0gPSBhd2FpdCB0aGlzLmxvYWRTZWFyY2hSZXN1bHRzKGxhc3RSZXN1bHQsIHN0YXJ0SWQsIGNvdW50KVxuXHRcdFx0XHRjb25zdCBlbnRyaWVzID0gaXRlbXMubWFwKChpbnN0YW5jZSkgPT4gbmV3IENhbGVuZGFyU2VhcmNoUmVzdWx0TGlzdEVudHJ5KGluc3RhbmNlKSlcblx0XHRcdFx0Y29uc3QgY29tcGxldGUgPSAhaGFzTW9yZVJlc3VsdHMobmV3U2VhcmNoUmVzdWx0KVxuXG5cdFx0XHRcdHJldHVybiB7IGl0ZW1zOiBlbnRyaWVzLCBjb21wbGV0ZSB9XG5cdFx0XHR9LFxuXHRcdFx0bG9hZFNpbmdsZTogYXN5bmMgKF9saXN0SWQ6IElkLCBlbGVtZW50SWQ6IElkKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGxhc3RSZXN1bHQgPSB0aGlzLnNlYXJjaFJlc3VsdFxuXHRcdFx0XHRpZiAoIWxhc3RSZXN1bHQpIHtcblx0XHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbnN0IGlkID0gbGFzdFJlc3VsdC5yZXN1bHRzLmZpbmQoKHJlc3VsdElkKSA9PiBlbGVtZW50SWRQYXJ0KHJlc3VsdElkKSA9PT0gZWxlbWVudElkKVxuXHRcdFx0XHRpZiAoaWQpIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5lbnRpdHlDbGllbnRcblx0XHRcdFx0XHRcdC5sb2FkKGxhc3RSZXN1bHQucmVzdHJpY3Rpb24udHlwZSwgaWQpXG5cdFx0XHRcdFx0XHQudGhlbigoZW50aXR5KSA9PiBuZXcgQ2FsZW5kYXJTZWFyY2hSZXN1bHRMaXN0RW50cnkoZW50aXR5KSlcblx0XHRcdFx0XHRcdC5jYXRjaChcblx0XHRcdFx0XHRcdFx0b2ZDbGFzcyhOb3RGb3VuZEVycm9yLCAoXykgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRzb3J0Q29tcGFyZTogKG8xOiBDYWxlbmRhclNlYXJjaFJlc3VsdExpc3RFbnRyeSwgbzI6IENhbGVuZGFyU2VhcmNoUmVzdWx0TGlzdEVudHJ5KSA9PlxuXHRcdFx0XHRkb3duY2FzdChvMS5lbnRyeSkuc3RhcnRUaW1lLmdldFRpbWUoKSAtIGRvd25jYXN0KG8yLmVudHJ5KS5zdGFydFRpbWUuZ2V0VGltZSgpLFxuXHRcdFx0YXV0b1NlbGVjdEJlaGF2aW9yOiAoKSA9PiBMaXN0QXV0b1NlbGVjdEJlaGF2aW9yLk9MREVSLFxuXHRcdH0pXG5cdH1cblxuXHRpc0luU2VhcmNoUmVzdWx0KHR5cGVSZWY6IFR5cGVSZWY8dW5rbm93bj4sIGlkOiBJZFR1cGxlKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gdGhpcy5zZWFyY2hSZXN1bHRcblxuXHRcdGlmIChyZXN1bHQgJiYgaXNTYW1lVHlwZVJlZih0eXBlUmVmLCByZXN1bHQucmVzdHJpY3Rpb24udHlwZSkpIHtcblx0XHRcdC8vIFRoZSBsaXN0IGlkIG11c3QgYmUgbnVsbC9lbXB0eSwgb3RoZXJ3aXNlIHRoZSB1c2VyIGlzIGZpbHRlcmluZyBieSBsaXN0LCBhbmQgaXQgc2hvdWxkbid0IGJlIGlnbm9yZWRcblxuXHRcdFx0Y29uc3QgaWdub3JlTGlzdCA9IGlzU2FtZVR5cGVSZWYodHlwZVJlZiwgTWFpbFR5cGVSZWYpICYmIHJlc3VsdC5yZXN0cmljdGlvbi5mb2xkZXJJZHMubGVuZ3RoID09PSAwXG5cblx0XHRcdHJldHVybiByZXN1bHQucmVzdWx0cy5zb21lKChyKSA9PiB0aGlzLmNvbXBhcmVJdGVtSWQociwgaWQsIGlnbm9yZUxpc3QpKVxuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZVxuXHR9XG5cblx0cHJpdmF0ZSBjb21wYXJlSXRlbUlkKGlkMTogSWRUdXBsZSwgaWQyOiBJZFR1cGxlLCBpZ25vcmVMaXN0OiBib29sZWFuKSB7XG5cdFx0cmV0dXJuIGlnbm9yZUxpc3QgPyBpc1NhbWVJZChlbGVtZW50SWRQYXJ0KGlkMSksIGVsZW1lbnRJZFBhcnQoaWQyKSkgOiBpc1NhbWVJZChpZDEsIGlkMilcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgbG9hZFNlYXJjaFJlc3VsdHMoXG5cdFx0Y3VycmVudFJlc3VsdDogU2VhcmNoUmVzdWx0LFxuXHRcdHN0YXJ0SWQ6IElkLFxuXHRcdGNvdW50OiBudW1iZXIsXG5cdCk6IFByb21pc2U8eyBpdGVtczogQ2FsZW5kYXJFdmVudFtdOyBuZXdTZWFyY2hSZXN1bHQ6IFNlYXJjaFJlc3VsdCB9PiB7XG5cdFx0Y29uc3QgdXBkYXRlZFJlc3VsdCA9IGN1cnJlbnRSZXN1bHRcblx0XHQvLyB3ZSBuZWVkIHRvIG92ZXJyaWRlIGdsb2JhbCByZWZlcmVuY2UgZm9yIG90aGVyIGZ1bmN0aW9uc1xuXHRcdHRoaXMuc2VhcmNoUmVzdWx0ID0gdXBkYXRlZFJlc3VsdFxuXG5cdFx0bGV0IGl0ZW1zOiBDYWxlbmRhckV2ZW50W11cblx0XHRpZiAoaXNTYW1lVHlwZVJlZihjdXJyZW50UmVzdWx0LnJlc3RyaWN0aW9uLnR5cGUsIENhbGVuZGFyRXZlbnRUeXBlUmVmKSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgeyBzdGFydCwgZW5kIH0gPSBjdXJyZW50UmVzdWx0LnJlc3RyaWN0aW9uXG5cdFx0XHRcdGlmIChzdGFydCA9PSBudWxsIHx8IGVuZCA9PSBudWxsKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJpbnZhbGlkIHNlYXJjaCB0aW1lIHJhbmdlIGZvciBjYWxlbmRhclwiKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGl0ZW1zID0gW1xuXHRcdFx0XHRcdC4uLihhd2FpdCB0aGlzLmNhbGVuZGFyRmFjYWRlLnJlaWZ5Q2FsZW5kYXJTZWFyY2hSZXN1bHQoc3RhcnQsIGVuZCwgdXBkYXRlZFJlc3VsdC5yZXN1bHRzKSksXG5cdFx0XHRcdFx0Li4uKGF3YWl0IHRoaXMuZ2V0Q2xpZW50T25seUV2ZW50c1NlcmllcyhzdGFydCwgZW5kLCB1cGRhdGVkUmVzdWx0LnJlc3VsdHMpKSxcblx0XHRcdFx0XVxuXHRcdFx0fSBmaW5hbGx5IHtcblx0XHRcdFx0dGhpcy51cGRhdGVVaSgpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIHRoaXMgdHlwZSBpcyBub3Qgc2hvd24gaW4gdGhlIHNlYXJjaCB2aWV3LCBlLmcuIGdyb3VwIGluZm9cblx0XHRcdGl0ZW1zID0gW11cblx0XHR9XG5cblx0XHRyZXR1cm4geyBpdGVtczogaXRlbXMsIG5ld1NlYXJjaFJlc3VsdDogdXBkYXRlZFJlc3VsdCB9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGdldENsaWVudE9ubHlFdmVudHNTZXJpZXMoc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIsIGV2ZW50czogSWRUdXBsZVtdKSB7XG5cdFx0Y29uc3QgZXZlbnRMaXN0ID0gYXdhaXQgcmV0cmlldmVDbGllbnRPbmx5RXZlbnRzRm9yVXNlcih0aGlzLmxvZ2lucywgZXZlbnRzLCB0aGlzLmV2ZW50c1JlcG9zaXRvcnkuZ2V0QmlydGhkYXlFdmVudHMoKSlcblx0XHRyZXR1cm4gZ2VuZXJhdGVDYWxlbmRhckluc3RhbmNlc0luUmFuZ2UoZXZlbnRMaXN0LCB7IHN0YXJ0LCBlbmQgfSlcblx0fVxuXG5cdHNlbmRTdG9wTG9hZGluZ1NpZ25hbCgpIHtcblx0XHR0aGlzLnNlYXJjaC5zZW5kQ2FuY2VsU2lnbmFsKClcblx0fVxuXG5cdGdldExvY2FsQ2FsZW5kYXJzKCkge1xuXHRcdHJldHVybiBnZXRDbGllbnRPbmx5Q2FsZW5kYXJzKHRoaXMubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlcklkLCB0aGlzLmxvY2FsQ2FsZW5kYXJzKVxuXHR9XG5cblx0ZGlzcG9zZSgpIHtcblx0XHR0aGlzLnN0b3BMb2FkQWxsKClcblx0XHR0aGlzLnJlc3VsdFN1YnNjcmlwdGlvbj8uZW5kKHRydWUpXG5cdFx0dGhpcy5yZXN1bHRTdWJzY3JpcHRpb24gPSBudWxsXG5cdFx0dGhpcy5saXN0U3RhdGVTdWJzY3JpcHRpb24/LmVuZCh0cnVlKVxuXHRcdHRoaXMubGlzdFN0YXRlU3Vic2NyaXB0aW9uID0gbnVsbFxuXHRcdHRoaXMuc2VhcmNoLnNlbmRDYW5jZWxTaWduYWwoKVxuXHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLnJlbW92ZUVudGl0eUxpc3RlbmVyKHRoaXMuZW50aXR5RXZlbnRzTGlzdGVuZXIpXG5cdH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFlQSxrQkFBa0I7SUFFTCxnQ0FBTixNQUFvQztDQUMxQyxZQUFxQkEsT0FBc0I7RUFzRzNDLEtBdEdxQjtDQUF3QjtDQUU3QyxJQUFJLE1BQWU7QUFDbEIsU0FBTyxLQUFLLE1BQU07Q0FDbEI7QUFDRDs7OztBQ05ELGtCQUFrQjtJQUlBLHNEQUFYO0FBQ047O0FBQ0E7QUFFRCxNQUFNQyxvQkFBZ0MsZUFBZTtBQTRDOUMsU0FBUyxrQkFBa0JDLE9BQXNCQyxLQUFvQkMsV0FBMEJDLGFBQXlDO0FBQzlJLFFBQU87RUFDTixNQUFNO0VBQ0M7RUFDRjtFQUNMLE9BQU87RUFDUCxjQUFjO0VBQ2Q7RUFDQTtDQUNBO0FBQ0Q7QUFLTSxTQUFTLGVBQWVDLE9BQWtDO0NBQ2hFLElBQUlKLFFBQXVCO0NBQzNCLElBQUlDLE1BQXFCO0NBQ3pCLElBQUlDLFlBQTJCLENBQUU7Q0FDakMsSUFBSUMsY0FBdUI7QUFFM0IsS0FBSSxNQUFNLFdBQVcsWUFBWSxJQUFJLE1BQU0sV0FBVyxtQkFBbUIsRUFBRTtFQUMxRSxNQUFNLEVBQUUsUUFBUSxHQUFHLGdCQUFFLGNBQWMsTUFBTTtBQUV6QyxNQUFJO0FBQ0gsY0FBVyxPQUFPLG1CQUFtQixVQUNwQyxlQUFjLE9BQU87QUFHdEIsY0FBVyxPQUFPLGFBQWEsU0FDOUIsU0FBUSxVQUFVLE9BQU8sU0FBUztBQUduQyxjQUFXLE9BQU8sV0FBVyxTQUM1QixPQUFNLFVBQVUsT0FBTyxPQUFPO0dBRy9CLE1BQU0sU0FBUyxPQUFPO0FBQ3RCLE9BQUksTUFBTSxRQUFRLE9BQU8sQ0FDeEIsYUFBWTtFQUViLFNBQVEsR0FBRztBQUNYLFdBQVEsSUFBSSxv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