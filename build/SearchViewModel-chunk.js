import { __toESM } from "./chunk-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNode } from "./Env-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { LazyLoaded, TypeRef, YEAR_IN_MILLIS, assertNotNull, deepEqual, defer, downcast, getEndOfDay, getStartOfDay, incrementMonth, isSameDayOfDate, isSameTypeRef, neverNull, ofClass, stringToBase64 } from "./dist2-chunk.js";
import { styles } from "./styles-chunk.js";
import { theme } from "./theme-chunk.js";
import { CLIENT_ONLY_CALENDARS, FULL_INDEXED_TIMESTAMP, MailSetKind, NOTHING_INDEXED_TIMESTAMP, OperationType } from "./TutanotaConstants-chunk.js";
import { size } from "./size-chunk.js";
import { GENERATED_MAX_ID, assertIsEntity, assertIsEntity2, elementIdPart, getElementId, isSameId, listIdPart, sortCompareByReverseId } from "./EntityUtils-chunk.js";
import { CalendarEventTypeRef, ContactTypeRef, MailTypeRef } from "./TypeRefs-chunk.js";
import { generateCalendarInstancesInRange, getStartOfTheWeekOffsetForUser, retrieveClientOnlyEventsForUser } from "./CalendarUtils-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { ListAutoSelectBehavior } from "./DeviceConfig-chunk.js";
import { NotFoundError } from "./RestError-chunk.js";
import { containsEventOfType, getEventOfType, isUpdateForTypeRef } from "./EntityUpdateUtils-chunk.js";
import { loadMultipleFromLists } from "./EntityClient-chunk.js";
import { BootIcons } from "./Icon-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { getClientOnlyCalendars } from "./CalendarGuiUtils-chunk.js";
import { ColumnEmptyMessageBox } from "./ColumnEmptyMessageBox-chunk.js";
import { List, ListLoadingState, MultiselectMode } from "./List-chunk.js";
import { KindaCalendarRow } from "./CalendarRow-chunk.js";
import { ListElementListModel } from "./ListElementListModel-chunk.js";
import { areResultsForTheSameQuery, hasMoreResults, isSameSearchRestriction, mailLocator } from "./mailLocator-chunk.js";
import { compareContacts } from "./ContactGuiUtils-chunk.js";
import { KindaContactRow } from "./ContactListView-chunk.js";
import { SearchCategoryTypes, createRestriction, decodeCalendarSearchKey, encodeCalendarSearchKey, getRestriction, getSearchUrl, searchCategoryForRestriction } from "./SearchUtils-chunk.js";
import { getMailFilterForType } from "./MailViewerViewModel-chunk.js";
import { MailRow } from "./MailRow-chunk.js";

//#region src/mail-app/search/view/SearchListView.ts
assertMainOrNode();
var SearchResultListEntry = class {
	constructor(entry) {
		this.entry = entry;
	}
	get _id() {
		return this.entry._id;
	}
};
var SearchListView = class {
	attrs;
	get listModel() {
		return this.attrs.listModel;
	}
	constructor({ attrs }) {
		this.attrs = attrs;
	}
	view({ attrs }) {
		this.attrs = attrs;
		const { icon, renderConfig } = this.getRenderItems(attrs.currentType);
		return attrs.listModel.isEmptyAndDone() ? mithril_default(ColumnEmptyMessageBox, {
			icon,
			message: "searchNoResults_msg",
			color: theme.list_message_bg
		}) : mithril_default(List, {
			state: attrs.listModel.state,
			renderConfig,
			onLoadMore: () => {
				attrs.listModel?.loadMore();
			},
			onRetryLoading: () => {
				attrs.listModel?.retryLoading();
			},
			onSingleSelection: (item) => {
				attrs.listModel?.onSingleSelection(item);
				attrs.onSingleSelection(item);
			},
			onSingleTogglingMultiselection: (item) => {
				attrs.listModel.onSingleInclusiveSelection(item, styles.isSingleColumnLayout());
			},
			onRangeSelectionTowards: (item) => {
				attrs.listModel.selectRangeTowards(item);
			},
			onStopLoading() {
				if (attrs.cancelCallback != null) attrs.cancelCallback();
				attrs.listModel.stopLoading();
			}
		});
	}
	getRenderItems(type) {
		if (isSameTypeRef(type, ContactTypeRef)) return {
			icon: BootIcons.Contacts,
			renderConfig: this.contactRenderConfig
		};
else if (isSameTypeRef(type, CalendarEventTypeRef)) return {
			icon: BootIcons.Calendar,
			renderConfig: this.calendarRenderConfig
		};
else return {
			icon: BootIcons.Mail,
			renderConfig: this.mailRenderConfig
		};
	}
	calendarRenderConfig = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom) => {
			const row = new SearchResultListRow(new KindaCalendarRow(dom));
			mithril_default.render(dom, row.render());
			return row;
		}
	};
	mailRenderConfig = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			const row = new SearchResultListRow(new MailRow(true, (mail) => this.attrs.getLabelsForMail(mail), () => row.entity && this.listModel.onSingleExclusiveSelection(row.entity)));
			mithril_default.render(dom, row.render());
			return row;
		}
	};
	contactRenderConfig = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			const row = new SearchResultListRow(new KindaContactRow(dom, () => row.entity && this.listModel.onSingleExclusiveSelection(row.entity)));
			mithril_default.render(dom, row.render());
			return row;
		}
	};
};
var SearchResultListRow = class {
	top;
	domElement = null;
	_entity = null;
	get entity() {
		return this._entity;
	}
	_delegate;
	constructor(delegate) {
		this._delegate = delegate;
		this.top = 0;
	}
	update(entry, selected, isInMultiSelect) {
		this._delegate.domElement = this.domElement;
		this._entity = entry;
		this._delegate.update(downcast(entry.entry), selected, isInMultiSelect);
	}
	render() {
		return this._delegate.render();
	}
};

//#endregion
//#region src/mail-app/search/view/SearchViewModel.ts
var import_stream = __toESM(require_stream(), 1);
const SEARCH_PAGE_SIZE = 100;
let PaidFunctionResult = function(PaidFunctionResult$1) {
	PaidFunctionResult$1[PaidFunctionResult$1["Success"] = 0] = "Success";
	PaidFunctionResult$1[PaidFunctionResult$1["PaidSubscriptionNeeded"] = 1] = "PaidSubscriptionNeeded";
	return PaidFunctionResult$1;
}({});
var SearchViewModel = class {
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
	/**
	* the type ref that determines which search filters and details
	* viewers this view should show.
	* taken from the current results' restriction or, if result is nonexistent,
	* the URL.
	*
	* result might be nonexistent if there is no query or we're not done searching
	* yet.
	*/
	get searchedType() {
		return (this.searchResult?.restriction ?? this.router.getRestriction()).type;
	}
	_conversationViewModel = null;
	get conversationViewModel() {
		return this._conversationViewModel;
	}
	_startDate = null;
	get startDate() {
		return this._startDate ?? this.getCurrentMailIndexDate();
	}
	_endDate = null;
	get endDate() {
		if (this._endDate) return this._endDate;
else if (this.getCategory() === SearchCategoryTypes.calendar) {
			let returnDate = incrementMonth(new Date(), 3);
			returnDate.setDate(0);
			return returnDate;
		} else return new Date();
	}
	_selectedMailFolder = [];
	get selectedMailFolder() {
		return this._selectedMailFolder;
	}
	_selectedCalendar = null;
	get selectedCalendar() {
		return this._selectedCalendar;
	}
	_mailboxes = [];
	get mailboxes() {
		return this._mailboxes;
	}
	_selectedMailField = null;
	get selectedMailField() {
		return this._selectedMailField;
	}
	searchResult = null;
	mailFilterType = null;
	latestMailRestriction = null;
	latestCalendarRestriction = null;
	mailboxSubscription = null;
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
	extendIndexConfirmationCallback = null;
	constructor(router, search, searchFacade, mailboxModel, logins, indexerFacade, entityClient, eventController, mailOpenedListener, calendarFacade, progressTracker, conversationViewModelFactory, eventsRepository, updateUi, selectionBehavior, localCalendars) {
		this.router = router;
		this.search = search;
		this.searchFacade = searchFacade;
		this.mailboxModel = mailboxModel;
		this.logins = logins;
		this.indexerFacade = indexerFacade;
		this.entityClient = entityClient;
		this.eventController = eventController;
		this.mailOpenedListener = mailOpenedListener;
		this.calendarFacade = calendarFacade;
		this.progressTracker = progressTracker;
		this.conversationViewModelFactory = conversationViewModelFactory;
		this.eventsRepository = eventsRepository;
		this.updateUi = updateUi;
		this.selectionBehavior = selectionBehavior;
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
	init(extendIndexConfirmationCallback) {
		if (this.extendIndexConfirmationCallback) return;
		this.extendIndexConfirmationCallback = extendIndexConfirmationCallback;
		this.resultSubscription = this.search.result.map((result) => {
			if (!result || !isSameTypeRef(result.restriction.type, MailTypeRef)) this.mailFilterType = null;
			if (this.searchResult == null || result == null || !areResultsForTheSameQuery(result, this.searchResult)) {
				this._listModel.cancelLoadAll();
				this.searchResult = result;
				this._listModel = this.createList();
				this.setMailFilter(this.mailFilterType);
				this.applyMailFilterIfNeeded();
				this._listModel.loadInitial();
				this.listStateSubscription?.end(true);
				this.listStateSubscription = this._listModel.stateStream.map((state) => this.onListStateChange(state));
			}
		});
		this.mailboxSubscription = this.mailboxModel.mailboxDetails.map((mailboxes) => {
			this.onMailboxesChanged(mailboxes);
		});
		this.eventController.addEntityListener(this.entityEventsListener);
	}
	getRestriction() {
		return this.router.getRestriction();
	}
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
			this.router.routeTo(args.query, createRestriction(SearchCategoryTypes.mail, null, null, null, [], null));
			return;
		}
		this.currentQuery = args.query;
		const lastQuery = this.search.lastQueryString();
		const maxResults = isSameTypeRef(MailTypeRef, restriction.type) ? SEARCH_PAGE_SIZE : null;
		const listModel = this._listModel;
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
		if (isSameTypeRef(restriction.type, ContactTypeRef)) this.loadAndSelectIfNeeded(args.id);
else if (isSameTypeRef(restriction.type, MailTypeRef)) {
			this._selectedMailField = restriction.field;
			this._startDate = restriction.end ? new Date(restriction.end) : null;
			this._endDate = restriction.start ? new Date(restriction.start) : null;
			this._selectedMailFolder = restriction.folderIds;
			this.loadAndSelectIfNeeded(args.id);
			this.latestMailRestriction = restriction;
		} else if (isSameTypeRef(restriction.type, CalendarEventTypeRef)) {
			this._startDate = restriction.start ? new Date(restriction.start) : null;
			this._endDate = restriction.end ? new Date(restriction.end) : null;
			this._includeRepeatingEvents = restriction.eventSeries ?? true;
			this.lazyCalendarInfos.load();
			this.userHasNewPaidPlan.load();
			this.latestCalendarRestriction = restriction;
			const selectedCalendar = this.extractCalendarListIds(restriction.folderIds);
			if (!selectedCalendar || Array.isArray(selectedCalendar)) this._selectedCalendar = selectedCalendar;
else if (CLIENT_ONLY_CALENDARS.has(selectedCalendar.toString())) this.getUserHasNewPaidPlan().getAsync().then((isNewPaidPlan) => {
				if (!isNewPaidPlan) return this._selectedCalendar = null;
				this._selectedCalendar = selectedCalendar;
			});
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
	}
	extractCalendarListIds(listIds) {
		if (listIds.length < 1) return null;
else if (listIds.length === 1) return listIds[0];
		return [listIds[0], listIds[1]];
	}
	loadAndSelectIfNeeded(id, finder) {
		if (id == null) return;
		if (!this._listModel.isItemSelected(id)) {
			if (!this._listModel.isItemSelected(id)) this.handleLoadAndSelection(id, finder);
		}
	}
	handleLoadAndSelection(id, finder) {
		if (this._listModel.isLoadedCompletely()) return this.selectItem(id, finder);
		const listStateStream = import_stream.default.combine((a) => a(), [this._listModel.stateStream]);
		listStateStream.map((state) => {
			if (state.loadingStatus === ListLoadingState.Done) {
				this.selectItem(id, finder);
				listStateStream.end(true);
			}
		});
	}
	selectItem(id, finder) {
		const listModel = this._listModel;
		this._listModel.loadAndSelect(id, () => !deepEqual(this._listModel, listModel), finder);
	}
	async loadAll() {
		if (this.loadingAllForSearchResult != null) return;
		this.loadingAllForSearchResult = this.searchResult ?? null;
		this._listModel.selectAll();
		try {
			while (this.searchResult?.restriction && this.loadingAllForSearchResult && isSameSearchRestriction(this.searchResult?.restriction, this.loadingAllForSearchResult.restriction) && !this._listModel.isLoadedCompletely()) {
				await this._listModel.loadMore();
				if (this.searchResult.restriction && this.loadingAllForSearchResult.restriction && isSameSearchRestriction(this.searchResult.restriction, this.loadingAllForSearchResult.restriction)) this._listModel.selectAll();
			}
		} finally {
			this.loadingAllForSearchResult = null;
		}
	}
	stopLoadAll() {
		this._listModel.cancelLoadAll();
	}
	selectMailField(field) {
		if (this.logins.getUserController().isFreeAccount() && field != null) return PaidFunctionResult.PaidSubscriptionNeeded;
else {
			this._selectedMailField = field;
			this.searchAgain();
			return PaidFunctionResult.Success;
		}
	}
	canSelectTimePeriod() {
		return !this.logins.getUserController().isFreeAccount();
	}
	getStartOfTheWeekOffset() {
		return getStartOfTheWeekOffsetForUser(this.logins.getUserController().userSettingsGroupRoot);
	}
	async selectStartDate(startDate) {
		if (isSameDayOfDate(this.startDate, startDate)) return PaidFunctionResult.Success;
		if (!this.canSelectTimePeriod()) return PaidFunctionResult.PaidSubscriptionNeeded;
		if (startDate && this.getCategory() === SearchCategoryTypes.mail && startDate.getTime() < this.search.indexState().currentMailIndexTimestamp && startDate) {
			const confirmed = await this.extendIndexConfirmationCallback?.() ?? true;
			if (confirmed) {
				this._startDate = startDate;
				this.indexerFacade.extendMailIndex(startDate.getTime()).then(() => {
					this.updateSearchUrl();
					this.updateUi();
				});
			} else return PaidFunctionResult.Success;
		} else this._startDate = startDate;
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
	selectCalendar(calendarInfo) {
		if (typeof calendarInfo === "string" || calendarInfo == null) this._selectedCalendar = calendarInfo;
else this._selectedCalendar = [calendarInfo.groupRoot.longEvents, calendarInfo.groupRoot.shortEvents];
		this.searchAgain();
	}
	selectMailFolder(folder) {
		if (this.logins.getUserController().isFreeAccount() && folder != null) return PaidFunctionResult.PaidSubscriptionNeeded;
else {
			this._selectedMailFolder = folder;
			this.searchAgain();
			return PaidFunctionResult.Success;
		}
	}
	selectIncludeRepeatingEvents(include) {
		this._includeRepeatingEvents = include;
		this.searchAgain();
	}
	/**
	* @returns null if the complete mailbox is indexed
	*/
	getCurrentMailIndexDate() {
		let timestamp = this.search.indexState().currentMailIndexTimestamp;
		if (timestamp === FULL_INDEXED_TIMESTAMP) return null;
else if (timestamp === NOTHING_INDEXED_TIMESTAMP) return getEndOfDay(new Date());
else return new Date(timestamp);
	}
	searchAgain() {
		this.updateSearchUrl();
		this.updateUi();
	}
	getUrlFromSearchCategory(category) {
		if (this.currentQuery) {
			let latestRestriction = null;
			switch (category) {
				case SearchCategoryTypes.mail:
					latestRestriction = this.latestMailRestriction;
					break;
				case SearchCategoryTypes.calendar:
					latestRestriction = this.latestCalendarRestriction;
					break;
				case SearchCategoryTypes.contact: break;
			}
			if (latestRestriction) return getSearchUrl(this.currentQuery, latestRestriction);
else return getSearchUrl(this.currentQuery, createRestriction(category, null, null, null, [], null));
		} else return getSearchUrl("", createRestriction(category, null, null, null, [], null));
	}
	get mailFilter() {
		return this.mailFilterType;
	}
	setMailFilter(filter) {
		this.mailFilterType = filter;
		this.applyMailFilterIfNeeded();
	}
	applyMailFilterIfNeeded() {
		if (isSameTypeRef(this.searchedType, MailTypeRef)) {
			const filterFunction = getMailFilterForType(this.mailFilterType);
			const liftedFilter = filterFunction ? (entry) => filterFunction(entry.entry) : null;
			this._listModel?.setFilter(liftedFilter);
		}
	}
	updateSearchUrl() {
		const selectedElement = this._listModel.state.selectedItems.size === 1 ? this._listModel.getSelectedAsArray().at(0) : null;
		if (isSameTypeRef(this.searchedType, MailTypeRef)) this.routeMail(selectedElement?.entry ?? null, createRestriction(this.getCategory(), this._endDate ? getEndOfDay(this._endDate).getTime() : null, this._startDate ? getStartOfDay(this._startDate).getTime() : null, this._selectedMailField, this._selectedMailFolder, null));
else if (isSameTypeRef(this.searchedType, CalendarEventTypeRef)) this.routeCalendar(selectedElement?.entry ?? null, createRestriction(this.getCategory(), this._startDate ? getStartOfDay(this._startDate).getTime() : null, this._endDate ? getEndOfDay(this._endDate).getTime() : null, null, this.getFolderIds(), this._includeRepeatingEvents));
else if (isSameTypeRef(this.searchedType, ContactTypeRef)) this.routeContact(selectedElement?.entry ?? null, createRestriction(this.getCategory(), null, null, null, [], null));
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
	routeMail(element, restriction) {
		this.router.routeTo(this.currentQuery, restriction, this.generateSelectionKey(element));
	}
	routeContact(element, restriction) {
		this.router.routeTo(this.currentQuery, restriction, this.generateSelectionKey(element));
	}
	generateSelectionKey(element) {
		if (element == null) return null;
		if (assertIsEntity(element, CalendarEventTypeRef)) return encodeCalendarSearchKey(element);
else return getElementId(element);
	}
	getCategory() {
		const restriction = this.router.getRestriction();
		return searchCategoryForRestriction(restriction);
	}
	async onMailboxesChanged(mailboxes) {
		this._mailboxes = mailboxes;
		const selectedMailFolder = this._selectedMailFolder;
		if (selectedMailFolder[0]) {
			const mailFolder = await mailLocator.mailModel.getMailSetById(selectedMailFolder[0]);
			if (!mailFolder) {
				const folderSystem = assertNotNull(mailLocator.mailModel.getFolderSystemByGroupId(mailboxes[0].mailGroup._id));
				this._selectedMailFolder = [getElementId(assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX)))];
				this.updateUi();
			}
		}
	}
	isPossibleABirthdayContactUpdate(update) {
		if (isUpdateForTypeRef(ContactTypeRef, update) && isSameTypeRef(this.searchedType, CalendarEventTypeRef)) {
			const { instanceListId, instanceId } = update;
			const encodedContactId = stringToBase64(`${instanceListId}/${instanceId}`);
			return this.listModel.stateStream().items.some((searchEntry) => searchEntry._id[1].endsWith(encodedContactId));
		}
		return false;
	}
	isSelectedEventAnUpdatedBirthday(update) {
		if (isUpdateForTypeRef(ContactTypeRef, update) && isSameTypeRef(this.searchedType, CalendarEventTypeRef)) {
			const { instanceListId, instanceId } = update;
			const encodedContactId = stringToBase64(`${instanceListId}/${instanceId}`);
			const selectedItem = this.listModel.getSelectedAsArray().at(0);
			if (!selectedItem) return false;
			return selectedItem._id[1].endsWith(encodedContactId);
		}
		return false;
	}
	async entityEventReceived(update) {
		const lastType = this.searchedType;
		const isPossibleABirthdayContactUpdate = this.isPossibleABirthdayContactUpdate(update);
		if (!isUpdateForTypeRef(lastType, update) && !isPossibleABirthdayContactUpdate) return;
		const { instanceListId, instanceId, operation } = update;
		const id = [neverNull(instanceListId), instanceId];
		const typeRef = new TypeRef(update.application, update.type);
		if (!this.isInSearchResult(typeRef, id) && !isPossibleABirthdayContactUpdate) return;
		if (isUpdateForTypeRef(MailTypeRef, update) && operation === OperationType.UPDATE) {
			if (this.searchResult && this.searchResult.results) {
				const index = this.searchResult?.results.findIndex((email) => update.instanceId === elementIdPart(email) && update.instanceListId !== listIdPart(email));
				if (index >= 0) {
					const restrictionLength = this.searchResult.restriction.folderIds.length;
					if (restrictionLength > 0 && this.searchResult.restriction.folderIds.includes(update.instanceListId) || restrictionLength === 0) {
						const newIdTuple = [update.instanceListId, update.instanceId];
						this.searchResult.results[index] = newIdTuple;
					}
				}
			}
		} else if (isUpdateForTypeRef(CalendarEventTypeRef, update) && isSameTypeRef(lastType, CalendarEventTypeRef) || isPossibleABirthdayContactUpdate) {
			const selectedItem = this._listModel.getSelectedAsArray().at(0);
			const listModel = this.createList();
			this.setMailFilter(this.mailFilterType);
			this.applyMailFilterIfNeeded();
			if (isPossibleABirthdayContactUpdate && await this.eventsRepository.canLoadBirthdaysCalendar()) await this.eventsRepository.loadContactsBirthdays(true);
			await listModel.loadInitial();
			if (selectedItem != null) {
				if (isPossibleABirthdayContactUpdate && this.isSelectedEventAnUpdatedBirthday(update)) this.listModel.selectNone();
				await listModel.loadAndSelect(elementIdPart(selectedItem._id), () => false);
			}
			this._listModel = listModel;
			this.listStateSubscription?.end(true);
			this.listStateSubscription = this._listModel.stateStream.map((state) => this.onListStateChange(state));
			this.updateSearchUrl();
			this.updateUi();
			return;
		}
		this._listModel.getUnfilteredAsArray();
		await this._listModel.entityEventReceived(instanceListId, instanceId, operation);
		if (operation === OperationType.UPDATE && this._listModel?.isItemSelected(elementIdPart(id))) try {
			await this.entityClient.load(typeRef, id);
			this.updateUi();
		} catch (e) {}
	}
	getSelectedMails() {
		return this._listModel.getSelectedAsArray().map((e) => e.entry).filter(assertIsEntity2(MailTypeRef));
	}
	getSelectedContacts() {
		return this._listModel.getSelectedAsArray().map((e) => e.entry).filter(assertIsEntity2(ContactTypeRef));
	}
	getSelectedEvents() {
		return this._listModel.getSelectedAsArray().map((e) => e.entry).filter(assertIsEntity2(CalendarEventTypeRef));
	}
	onListStateChange(newState) {
		if (isSameTypeRef(this.searchedType, MailTypeRef)) if (!newState.inMultiselect && newState.selectedItems.size === 1) {
			const mail = this.getSelectedMails()[0];
			if (mail) {
				if (!this._conversationViewModel) this.updateDisplayedConversation(mail);
else if (this._conversationViewModel) {
					const isSameElementId = isSameId(elementIdPart(this._conversationViewModel?.primaryMail._id), elementIdPart(mail._id));
					const isSameListId = isSameId(listIdPart(this._conversationViewModel?.primaryMail._id), listIdPart(mail._id));
					if (!isSameElementId || !isSameListId) {
						this.updateSearchUrl();
						this.updateDisplayedConversation(mail);
					}
				}
			} else this._conversationViewModel = null;
		} else this._conversationViewModel = null;
else this._conversationViewModel = null;
		this.updateUi();
	}
	updateDisplayedConversation(mail) {
		if (this.conversationViewModelFactory && this.mailOpenedListener) {
			this._conversationViewModel = this.conversationViewModelFactory({
				mail,
				showFolder: true
			});
			this.mailOpenedListener.onEmailOpened(mail);
		}
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
				await awaitSearchInitialized(this.search);
				if (!lastResult || lastResult.results.length === 0 && !hasMoreResults(lastResult)) return {
					items: [],
					complete: true
				};
				const { items, newSearchResult } = await this.loadSearchResults(lastResult, startId, count);
				const entries = items.map((instance) => new SearchResultListEntry(instance));
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
				if (id) return this.entityClient.load(lastResult.restriction.type, id).then((entity) => new SearchResultListEntry(entity)).catch(ofClass(NotFoundError, (_) => {
					return null;
				}));
else return null;
			},
			sortCompare: (o1, o2) => {
				if (isSameTypeRef(o1.entry._type, ContactTypeRef)) return compareContacts(o1.entry, o2.entry);
else if (isSameTypeRef(o1.entry._type, CalendarEventTypeRef)) return downcast(o1.entry).startTime.getTime() - downcast(o2.entry).startTime.getTime();
else return sortCompareByReverseId(o1.entry, o2.entry);
			},
			autoSelectBehavior: () => isSameTypeRef(this.searchedType, MailTypeRef) ? this.selectionBehavior : ListAutoSelectBehavior.OLDER
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
		const updatedResult = hasMoreResults(currentResult) ? await this.searchFacade.getMoreSearchResults(currentResult, count) : currentResult;
		this.searchResult = updatedResult;
		let items;
		if (isSameTypeRef(currentResult.restriction.type, MailTypeRef)) {
			let startIndex = 0;
			if (startId !== GENERATED_MAX_ID) {
				startIndex = updatedResult.results.findIndex((id) => id[1] <= startId);
				if (elementIdPart(updatedResult.results[startIndex]) === startId) startIndex++;
else if (startIndex === -1) startIndex = Math.max(updatedResult.results.length - 1, 0);
			}
			const toLoad = updatedResult.results.slice(startIndex);
			items = await this.loadAndFilterInstances(currentResult.restriction.type, toLoad, updatedResult, startIndex);
		} else if (isSameTypeRef(currentResult.restriction.type, ContactTypeRef)) try {
			items = await this.loadAndFilterInstances(currentResult.restriction.type, updatedResult.results, updatedResult, 0);
		} finally {
			this.updateUi();
		}
else if (isSameTypeRef(currentResult.restriction.type, CalendarEventTypeRef)) try {
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
	/**
	* take a list of IDs and load them by list, filtering out the ones that could not be loaded.
	* updates the passed currentResult.result list to not include the failed IDs anymore
	*/
	async loadAndFilterInstances(type, toLoad, currentResult, startIndex) {
		const instances = await loadMultipleFromLists(type, this.entityClient, toLoad);
		if (instances.length < toLoad.length) {
			const resultLength = currentResult.results.length;
			console.log(`Could not load some results: ${instances.length} out of ${toLoad.length}`);
			for (let i = toLoad.length - 1; i >= 0; i--) {
				const toLoadId = toLoad[i];
				if (!instances.some((instance) => isSameId(instance._id, toLoadId))) {
					currentResult.results.splice(startIndex + i, 1);
					if (instances.length === toLoad.length) break;
				}
			}
			console.log(`Fixed results, before ${resultLength}, after: ${currentResult.results.length}`);
		}
		return instances;
	}
	sendStopLoadingSignal() {
		this.search.sendCancelSignal();
	}
	getLocalCalendars() {
		return getClientOnlyCalendars(this.logins.getUserController().userId, this.localCalendars);
	}
	dispose() {
		this.stopLoadAll();
		this.extendIndexConfirmationCallback = null;
		this.resultSubscription?.end(true);
		this.resultSubscription = null;
		this.mailboxSubscription?.end(true);
		this.mailboxSubscription = null;
		this.listStateSubscription?.end(true);
		this.listStateSubscription = null;
		this.search.sendCancelSignal();
		this.eventController.removeEntityListener(this.entityEventsListener);
	}
	getLabelsForMail(mail) {
		return mailLocator.mailModel.getLabelsForMail(mail);
	}
};
function awaitSearchInitialized(searchModel) {
	const deferred = defer();
	const dep = searchModel.indexState.map((state) => {
		if (!state.initializing) Promise.resolve().then(() => {
			dep.end(true);
			deferred.resolve(undefined);
		});
	});
	return deferred.promise;
}

//#endregion
export { PaidFunctionResult, SearchListView, SearchViewModel };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VhcmNoVmlld01vZGVsLWNodW5rLmpzIiwibmFtZXMiOlsiZW50cnk6IFNlYXJjaGFibGVUeXBlcyIsIml0ZW06IFNlYXJjaFJlc3VsdExpc3RFbnRyeSIsInR5cGU6IFR5cGVSZWY8TWFpbD4gfCBUeXBlUmVmPENvbnRhY3Q+IHwgVHlwZVJlZjxDYWxlbmRhckV2ZW50PiIsInJvdzogU2VhcmNoUmVzdWx0TGlzdFJvdyIsImRlbGVnYXRlOiBNYWlsUm93IHwgS2luZGFDb250YWN0Um93IHwgS2luZGFDYWxlbmRhclJvdyIsImVudHJ5OiBTZWFyY2hSZXN1bHRMaXN0RW50cnkiLCJzZWxlY3RlZDogYm9vbGVhbiIsImlzSW5NdWx0aVNlbGVjdDogYm9vbGVhbiIsInJvdXRlcjogU2VhcmNoUm91dGVyIiwic2VhcmNoOiBTZWFyY2hNb2RlbCIsInNlYXJjaEZhY2FkZTogU2VhcmNoRmFjYWRlIiwibWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWwiLCJsb2dpbnM6IExvZ2luQ29udHJvbGxlciIsImluZGV4ZXJGYWNhZGU6IEluZGV4ZXIiLCJlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCIsImV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyIiwibWFpbE9wZW5lZExpc3RlbmVyOiBNYWlsT3BlbmVkTGlzdGVuZXIgfCBudWxsIiwiY2FsZW5kYXJGYWNhZGU6IENhbGVuZGFyRmFjYWRlIiwicHJvZ3Jlc3NUcmFja2VyOiBQcm9ncmVzc1RyYWNrZXIiLCJjb252ZXJzYXRpb25WaWV3TW9kZWxGYWN0b3J5OiBDb252ZXJzYXRpb25WaWV3TW9kZWxGYWN0b3J5IHwgbnVsbCIsImV2ZW50c1JlcG9zaXRvcnk6IENhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeSIsInVwZGF0ZVVpOiAoKSA9PiB1bmtub3duIiwic2VsZWN0aW9uQmVoYXZpb3I6IExpc3RBdXRvU2VsZWN0QmVoYXZpb3IiLCJsb2NhbENhbGVuZGFyczogTWFwPElkLCBDbGllbnRPbmx5Q2FsZW5kYXJzSW5mbz4iLCJleHRlbmRJbmRleENvbmZpcm1hdGlvbkNhbGxiYWNrOiBTZWFyY2hWaWV3TW9kZWxbXCJleHRlbmRJbmRleENvbmZpcm1hdGlvbkNhbGxiYWNrXCJdIiwidXBkYXRlOiBFbnRpdHlVcGRhdGVEYXRhIiwidXBkYXRlczogcmVhZG9ubHkgRW50aXR5VXBkYXRlRGF0YVtdIiwibGlzdElkOiBzdHJpbmciLCJyZXN0cmljdGlvbjogU2VhcmNoUmVzdHJpY3Rpb24iLCJhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IiwicmVxdWVzdGVkUGF0aDogc3RyaW5nIiwibGlzdElkczogc3RyaW5nW10iLCJpZDogc3RyaW5nIHwgbnVsbCIsImZpbmRlcj86IChhOiBMaXN0RWxlbWVudCkgPT4gYm9vbGVhbiIsImlkOiBzdHJpbmciLCJmaW5kZXI6ICgoYTogTGlzdEVsZW1lbnQpID0+IGJvb2xlYW4pIHwgdW5kZWZpbmVkIiwiZmllbGQ6IHN0cmluZyB8IG51bGwiLCJzdGFydERhdGU6IERhdGUgfCBudWxsIiwiZW5kRGF0ZTogRGF0ZSIsImNhbGVuZGFySW5mbzogQ2FsZW5kYXJJbmZvIHwgc3RyaW5nIHwgbnVsbCIsImZvbGRlcjogQXJyYXk8c3RyaW5nPiIsImluY2x1ZGU6IGJvb2xlYW4iLCJjYXRlZ29yeTogU2VhcmNoQ2F0ZWdvcnlUeXBlcyIsImxhdGVzdFJlc3RyaWN0aW9uOiBTZWFyY2hSZXN0cmljdGlvbiB8IG51bGwiLCJmaWx0ZXI6IE1haWxGaWx0ZXJUeXBlIHwgbnVsbCIsImxpZnRlZEZpbHRlcjogTGlzdEZpbHRlcjxTZWFyY2hSZXN1bHRMaXN0RW50cnk+IHwgbnVsbCIsImVsZW1lbnQ6IENhbGVuZGFyRXZlbnQgfCBudWxsIiwiZWxlbWVudDogTWFpbCB8IG51bGwiLCJlbGVtZW50OiBDb250YWN0IHwgbnVsbCIsImVsZW1lbnQ6IFNlYXJjaGFibGVUeXBlcyB8IG51bGwiLCJtYWlsYm94ZXM6IE1haWxib3hEZXRhaWxbXSIsIm5ld0lkVHVwbGU6IElkVHVwbGUiLCJuZXdTdGF0ZTogTGlzdFN0YXRlPFNlYXJjaFJlc3VsdExpc3RFbnRyeT4iLCJtYWlsOiBNYWlsIiwibGFzdEZldGNoZWRFbnRpdHk6IFNlYXJjaFJlc3VsdExpc3RFbnRyeSIsImNvdW50OiBudW1iZXIiLCJfbGlzdElkOiBJZCIsImVsZW1lbnRJZDogSWQiLCJvMTogU2VhcmNoUmVzdWx0TGlzdEVudHJ5IiwibzI6IFNlYXJjaFJlc3VsdExpc3RFbnRyeSIsInR5cGVSZWY6IFR5cGVSZWY8dW5rbm93bj4iLCJpZDogSWRUdXBsZSIsImlkMTogSWRUdXBsZSIsImlkMjogSWRUdXBsZSIsImlnbm9yZUxpc3Q6IGJvb2xlYW4iLCJjdXJyZW50UmVzdWx0OiBTZWFyY2hSZXN1bHQiLCJzdGFydElkOiBJZCIsInN0YXJ0OiBudW1iZXIiLCJlbmQ6IG51bWJlciIsImV2ZW50czogSWRUdXBsZVtdIiwidHlwZTogVHlwZVJlZjxUPiIsInRvTG9hZDogSWRUdXBsZVtdIiwic3RhcnRJbmRleDogbnVtYmVyIiwic2VhcmNoTW9kZWw6IFNlYXJjaE1vZGVsIl0sInNvdXJjZXMiOlsiLi4vc3JjL21haWwtYXBwL3NlYXJjaC92aWV3L1NlYXJjaExpc3RWaWV3LnRzIiwiLi4vc3JjL21haWwtYXBwL3NlYXJjaC92aWV3L1NlYXJjaFZpZXdNb2RlbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IGRvd25jYXN0LCBpc1NhbWVUeXBlUmVmLCBUeXBlUmVmIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBNYWlsUm93IH0gZnJvbSBcIi4uLy4uL21haWwvdmlldy9NYWlsUm93XCJcbmltcG9ydCB7IExpc3RFbGVtZW50TGlzdE1vZGVsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xpc3RFbGVtZW50TGlzdE1vZGVsLmpzXCJcbmltcG9ydCB7IExpc3QsIExpc3RBdHRycywgTXVsdGlzZWxlY3RNb2RlLCBSZW5kZXJDb25maWcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0xpc3QuanNcIlxuaW1wb3J0IHsgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemUuanNcIlxuaW1wb3J0IHsgS2luZGFDb250YWN0Um93IH0gZnJvbSBcIi4uLy4uL2NvbnRhY3RzL3ZpZXcvQ29udGFjdExpc3RWaWV3LmpzXCJcbmltcG9ydCB7IFNlYXJjaGFibGVUeXBlcyB9IGZyb20gXCIuL1NlYXJjaFZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50LCBDYWxlbmRhckV2ZW50VHlwZVJlZiwgQ29udGFjdCwgQ29udGFjdFR5cGVSZWYsIE1haWwsIE1haWxGb2xkZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgQ29sdW1uRW1wdHlNZXNzYWdlQm94IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQ29sdW1uRW1wdHlNZXNzYWdlQm94LmpzXCJcbmltcG9ydCB7IEJvb3RJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvQm9vdEljb25zLmpzXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS90aGVtZS5qc1wiXG5pbXBvcnQgeyBWaXJ0dWFsUm93IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9MaXN0VXRpbHMuanNcIlxuaW1wb3J0IHsgc3R5bGVzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvc3R5bGVzLmpzXCJcbmltcG9ydCB7IEtpbmRhQ2FsZW5kYXJSb3cgfSBmcm9tIFwiLi4vLi4vLi4vY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9DYWxlbmRhclJvdy5qc1wiXG5pbXBvcnQgeyBBbGxJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbi5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG5leHBvcnQgY2xhc3MgU2VhcmNoUmVzdWx0TGlzdEVudHJ5IHtcblx0Y29uc3RydWN0b3IocmVhZG9ubHkgZW50cnk6IFNlYXJjaGFibGVUeXBlcykge31cblxuXHRnZXQgX2lkKCk6IElkVHVwbGUge1xuXHRcdHJldHVybiB0aGlzLmVudHJ5Ll9pZFxuXHR9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VhcmNoTGlzdFZpZXdBdHRycyB7XG5cdGxpc3RNb2RlbDogTGlzdEVsZW1lbnRMaXN0TW9kZWw8U2VhcmNoUmVzdWx0TGlzdEVudHJ5PlxuXHRvblNpbmdsZVNlbGVjdGlvbjogKGl0ZW06IFNlYXJjaFJlc3VsdExpc3RFbnRyeSkgPT4gdW5rbm93blxuXHRjdXJyZW50VHlwZTogVHlwZVJlZjxNYWlsPiB8IFR5cGVSZWY8Q29udGFjdD4gfCBUeXBlUmVmPENhbGVuZGFyRXZlbnQ+XG5cdGlzRnJlZUFjY291bnQ6IGJvb2xlYW5cblx0Y2FuY2VsQ2FsbGJhY2s6ICgpID0+IHVua25vd24gfCBudWxsXG5cdGdldExhYmVsc0Zvck1haWw6IChtYWlsOiBNYWlsKSA9PiBNYWlsRm9sZGVyW11cbn1cblxuZXhwb3J0IGNsYXNzIFNlYXJjaExpc3RWaWV3IGltcGxlbWVudHMgQ29tcG9uZW50PFNlYXJjaExpc3RWaWV3QXR0cnM+IHtcblx0cHJpdmF0ZSBhdHRyczogU2VhcmNoTGlzdFZpZXdBdHRyc1xuXG5cdHByaXZhdGUgZ2V0IGxpc3RNb2RlbCgpOiBMaXN0RWxlbWVudExpc3RNb2RlbDxTZWFyY2hSZXN1bHRMaXN0RW50cnk+IHtcblx0XHRyZXR1cm4gdGhpcy5hdHRycy5saXN0TW9kZWxcblx0fVxuXG5cdGNvbnN0cnVjdG9yKHsgYXR0cnMgfTogVm5vZGU8U2VhcmNoTGlzdFZpZXdBdHRycz4pIHtcblx0XHR0aGlzLmF0dHJzID0gYXR0cnNcblx0fVxuXG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxTZWFyY2hMaXN0Vmlld0F0dHJzPik6IENoaWxkcmVuIHtcblx0XHR0aGlzLmF0dHJzID0gYXR0cnNcblx0XHRjb25zdCB7IGljb24sIHJlbmRlckNvbmZpZyB9ID0gdGhpcy5nZXRSZW5kZXJJdGVtcyhhdHRycy5jdXJyZW50VHlwZSlcblxuXHRcdHJldHVybiBhdHRycy5saXN0TW9kZWwuaXNFbXB0eUFuZERvbmUoKVxuXHRcdFx0PyBtKENvbHVtbkVtcHR5TWVzc2FnZUJveCwge1xuXHRcdFx0XHRcdGljb24sXG5cdFx0XHRcdFx0bWVzc2FnZTogXCJzZWFyY2hOb1Jlc3VsdHNfbXNnXCIsXG5cdFx0XHRcdFx0Y29sb3I6IHRoZW1lLmxpc3RfbWVzc2FnZV9iZyxcblx0XHRcdCAgfSlcblx0XHRcdDogbShMaXN0LCB7XG5cdFx0XHRcdFx0c3RhdGU6IGF0dHJzLmxpc3RNb2RlbC5zdGF0ZSxcblx0XHRcdFx0XHRyZW5kZXJDb25maWcsXG5cdFx0XHRcdFx0b25Mb2FkTW9yZTogKCkgPT4ge1xuXHRcdFx0XHRcdFx0YXR0cnMubGlzdE1vZGVsPy5sb2FkTW9yZSgpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvblJldHJ5TG9hZGluZzogKCkgPT4ge1xuXHRcdFx0XHRcdFx0YXR0cnMubGlzdE1vZGVsPy5yZXRyeUxvYWRpbmcoKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0b25TaW5nbGVTZWxlY3Rpb246IChpdGVtOiBTZWFyY2hSZXN1bHRMaXN0RW50cnkpID0+IHtcblx0XHRcdFx0XHRcdGF0dHJzLmxpc3RNb2RlbD8ub25TaW5nbGVTZWxlY3Rpb24oaXRlbSlcblx0XHRcdFx0XHRcdGF0dHJzLm9uU2luZ2xlU2VsZWN0aW9uKGl0ZW0pXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvblNpbmdsZVRvZ2dsaW5nTXVsdGlzZWxlY3Rpb246IChpdGVtOiBTZWFyY2hSZXN1bHRMaXN0RW50cnkpID0+IHtcblx0XHRcdFx0XHRcdGF0dHJzLmxpc3RNb2RlbC5vblNpbmdsZUluY2x1c2l2ZVNlbGVjdGlvbihpdGVtLCBzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKSlcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9uUmFuZ2VTZWxlY3Rpb25Ub3dhcmRzOiAoaXRlbTogU2VhcmNoUmVzdWx0TGlzdEVudHJ5KSA9PiB7XG5cdFx0XHRcdFx0XHRhdHRycy5saXN0TW9kZWwuc2VsZWN0UmFuZ2VUb3dhcmRzKGl0ZW0pXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvblN0b3BMb2FkaW5nKCkge1xuXHRcdFx0XHRcdFx0aWYgKGF0dHJzLmNhbmNlbENhbGxiYWNrICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0YXR0cnMuY2FuY2VsQ2FsbGJhY2soKVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRhdHRycy5saXN0TW9kZWwuc3RvcExvYWRpbmcoKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHQgIH0gc2F0aXNmaWVzIExpc3RBdHRyczxTZWFyY2hSZXN1bHRMaXN0RW50cnksIFNlYXJjaFJlc3VsdExpc3RSb3c+KVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRSZW5kZXJJdGVtcyh0eXBlOiBUeXBlUmVmPE1haWw+IHwgVHlwZVJlZjxDb250YWN0PiB8IFR5cGVSZWY8Q2FsZW5kYXJFdmVudD4pOiB7XG5cdFx0aWNvbjogQWxsSWNvbnNcblx0XHRyZW5kZXJDb25maWc6IFJlbmRlckNvbmZpZzxTZWFyY2hSZXN1bHRMaXN0RW50cnksIFNlYXJjaFJlc3VsdExpc3RSb3c+XG5cdH0ge1xuXHRcdGlmIChpc1NhbWVUeXBlUmVmKHR5cGUsIENvbnRhY3RUeXBlUmVmKSkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0aWNvbjogQm9vdEljb25zLkNvbnRhY3RzLFxuXHRcdFx0XHRyZW5kZXJDb25maWc6IHRoaXMuY29udGFjdFJlbmRlckNvbmZpZyxcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKGlzU2FtZVR5cGVSZWYodHlwZSwgQ2FsZW5kYXJFdmVudFR5cGVSZWYpKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRpY29uOiBCb290SWNvbnMuQ2FsZW5kYXIsXG5cdFx0XHRcdHJlbmRlckNvbmZpZzogdGhpcy5jYWxlbmRhclJlbmRlckNvbmZpZyxcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0aWNvbjogQm9vdEljb25zLk1haWwsXG5cdFx0XHRcdHJlbmRlckNvbmZpZzogdGhpcy5tYWlsUmVuZGVyQ29uZmlnLFxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVhZG9ubHkgY2FsZW5kYXJSZW5kZXJDb25maWc6IFJlbmRlckNvbmZpZzxTZWFyY2hSZXN1bHRMaXN0RW50cnksIFNlYXJjaFJlc3VsdExpc3RSb3c+ID0ge1xuXHRcdGl0ZW1IZWlnaHQ6IHNpemUubGlzdF9yb3dfaGVpZ2h0LFxuXHRcdG11bHRpc2VsZWN0aW9uQWxsb3dlZDogTXVsdGlzZWxlY3RNb2RlLkRpc2FibGVkLFxuXHRcdHN3aXBlOiBudWxsLFxuXHRcdGNyZWF0ZUVsZW1lbnQ6IChkb20pID0+IHtcblx0XHRcdGNvbnN0IHJvdzogU2VhcmNoUmVzdWx0TGlzdFJvdyA9IG5ldyBTZWFyY2hSZXN1bHRMaXN0Um93KG5ldyBLaW5kYUNhbGVuZGFyUm93KGRvbSkpXG5cdFx0XHRtLnJlbmRlcihkb20sIHJvdy5yZW5kZXIoKSlcblx0XHRcdHJldHVybiByb3dcblx0XHR9LFxuXHR9XG5cblx0cHJpdmF0ZSByZWFkb25seSBtYWlsUmVuZGVyQ29uZmlnOiBSZW5kZXJDb25maWc8U2VhcmNoUmVzdWx0TGlzdEVudHJ5LCBTZWFyY2hSZXN1bHRMaXN0Um93PiA9IHtcblx0XHRpdGVtSGVpZ2h0OiBzaXplLmxpc3Rfcm93X2hlaWdodCxcblx0XHRtdWx0aXNlbGVjdGlvbkFsbG93ZWQ6IE11bHRpc2VsZWN0TW9kZS5FbmFibGVkLFxuXHRcdHN3aXBlOiBudWxsLFxuXHRcdGNyZWF0ZUVsZW1lbnQ6IChkb20pID0+IHtcblx0XHRcdGNvbnN0IHJvdzogU2VhcmNoUmVzdWx0TGlzdFJvdyA9IG5ldyBTZWFyY2hSZXN1bHRMaXN0Um93KFxuXHRcdFx0XHRuZXcgTWFpbFJvdyhcblx0XHRcdFx0XHR0cnVlLFxuXHRcdFx0XHRcdChtYWlsKSA9PiB0aGlzLmF0dHJzLmdldExhYmVsc0Zvck1haWwobWFpbCksXG5cdFx0XHRcdFx0KCkgPT4gcm93LmVudGl0eSAmJiB0aGlzLmxpc3RNb2RlbC5vblNpbmdsZUV4Y2x1c2l2ZVNlbGVjdGlvbihyb3cuZW50aXR5KSxcblx0XHRcdFx0KSxcblx0XHRcdClcblx0XHRcdG0ucmVuZGVyKGRvbSwgcm93LnJlbmRlcigpKVxuXHRcdFx0cmV0dXJuIHJvd1xuXHRcdH0sXG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IGNvbnRhY3RSZW5kZXJDb25maWc6IFJlbmRlckNvbmZpZzxTZWFyY2hSZXN1bHRMaXN0RW50cnksIFNlYXJjaFJlc3VsdExpc3RSb3c+ID0ge1xuXHRcdGl0ZW1IZWlnaHQ6IHNpemUubGlzdF9yb3dfaGVpZ2h0LFxuXHRcdG11bHRpc2VsZWN0aW9uQWxsb3dlZDogTXVsdGlzZWxlY3RNb2RlLkVuYWJsZWQsXG5cdFx0c3dpcGU6IG51bGwsXG5cdFx0Y3JlYXRlRWxlbWVudDogKGRvbSkgPT4ge1xuXHRcdFx0Y29uc3Qgcm93OiBTZWFyY2hSZXN1bHRMaXN0Um93ID0gbmV3IFNlYXJjaFJlc3VsdExpc3RSb3coXG5cdFx0XHRcdG5ldyBLaW5kYUNvbnRhY3RSb3coZG9tLCAoKSA9PiByb3cuZW50aXR5ICYmIHRoaXMubGlzdE1vZGVsLm9uU2luZ2xlRXhjbHVzaXZlU2VsZWN0aW9uKHJvdy5lbnRpdHkpKSxcblx0XHRcdClcblx0XHRcdG0ucmVuZGVyKGRvbSwgcm93LnJlbmRlcigpKVxuXHRcdFx0cmV0dXJuIHJvd1xuXHRcdH0sXG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIFNlYXJjaFJlc3VsdExpc3RSb3cgaW1wbGVtZW50cyBWaXJ0dWFsUm93PFNlYXJjaFJlc3VsdExpc3RFbnRyeT4ge1xuXHR0b3A6IG51bWJlclxuXHQvLyBzZXQgZnJvbSBMaXN0XG5cdGRvbUVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGxcblxuXHQvLyB0aGlzIGlzIG91ciBvd24gZW50cnkgd2hpY2ggd2UgbmVlZCBmb3Igc29tZSByZWFzb24gKHByb2JhYmx5IGVhc2llciB0byBkZWFsIHdpdGggdGhhbiBhIGxvdCBvZiBzdW0gdHlwZSBlbnRyaWVzKVxuXHRwcml2YXRlIF9lbnRpdHk6IFNlYXJjaFJlc3VsdExpc3RFbnRyeSB8IG51bGwgPSBudWxsXG5cdGdldCBlbnRpdHkoKTogU2VhcmNoUmVzdWx0TGlzdEVudHJ5IHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuX2VudGl0eVxuXHR9XG5cblx0cHJpdmF0ZSBfZGVsZWdhdGU6IE1haWxSb3cgfCBLaW5kYUNvbnRhY3RSb3cgfCBLaW5kYUNhbGVuZGFyUm93XG5cblx0Y29uc3RydWN0b3IoZGVsZWdhdGU6IE1haWxSb3cgfCBLaW5kYUNvbnRhY3RSb3cgfCBLaW5kYUNhbGVuZGFyUm93KSB7XG5cdFx0dGhpcy5fZGVsZWdhdGUgPSBkZWxlZ2F0ZVxuXHRcdHRoaXMudG9wID0gMFxuXHR9XG5cblx0dXBkYXRlKGVudHJ5OiBTZWFyY2hSZXN1bHRMaXN0RW50cnksIHNlbGVjdGVkOiBib29sZWFuLCBpc0luTXVsdGlTZWxlY3Q6IGJvb2xlYW4pOiB2b2lkIHtcblx0XHR0aGlzLl9kZWxlZ2F0ZS5kb21FbGVtZW50ID0gdGhpcy5kb21FbGVtZW50XG5cdFx0dGhpcy5fZW50aXR5ID0gZW50cnlcblxuXHRcdHRoaXMuX2RlbGVnYXRlLnVwZGF0ZShkb3duY2FzdChlbnRyeS5lbnRyeSksIHNlbGVjdGVkLCBpc0luTXVsdGlTZWxlY3QpXG5cdH1cblxuXHRyZW5kZXIoKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiB0aGlzLl9kZWxlZ2F0ZS5yZW5kZXIoKVxuXHR9XG59XG4iLCJpbXBvcnQgeyBMaXN0RWxlbWVudExpc3RNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MaXN0RWxlbWVudExpc3RNb2RlbC5qc1wiXG5pbXBvcnQgeyBTZWFyY2hSZXN1bHRMaXN0RW50cnkgfSBmcm9tIFwiLi9TZWFyY2hMaXN0Vmlldy5qc1wiXG5pbXBvcnQgeyBTZWFyY2hSZXN0cmljdGlvbiwgU2VhcmNoUmVzdWx0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL3NlYXJjaC9TZWFyY2hUeXBlcy5qc1wiXG5pbXBvcnQgeyBFbnRpdHlFdmVudHNMaXN0ZW5lciwgRXZlbnRDb250cm9sbGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9FdmVudENvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudCwgQ2FsZW5kYXJFdmVudFR5cGVSZWYsIENvbnRhY3QsIENvbnRhY3RUeXBlUmVmLCBNYWlsLCBNYWlsRm9sZGVyLCBNYWlsVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IExpc3RFbGVtZW50RW50aXR5LCBTb21lRW50aXR5IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudGl0eVR5cGVzLmpzXCJcbmltcG9ydCB7XG5cdENMSUVOVF9PTkxZX0NBTEVOREFSUyxcblx0RlVMTF9JTkRFWEVEX1RJTUVTVEFNUCxcblx0TWFpbFNldEtpbmQsXG5cdE5PVEhJTkdfSU5ERVhFRF9USU1FU1RBTVAsXG5cdE9wZXJhdGlvblR5cGUsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQge1xuXHRhc3NlcnRJc0VudGl0eSxcblx0YXNzZXJ0SXNFbnRpdHkyLFxuXHRlbGVtZW50SWRQYXJ0LFxuXHRHRU5FUkFURURfTUFYX0lELFxuXHRnZXRFbGVtZW50SWQsXG5cdGlzU2FtZUlkLFxuXHRMaXN0RWxlbWVudCxcblx0bGlzdElkUGFydCxcblx0c29ydENvbXBhcmVCeVJldmVyc2VJZCxcbn0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzLmpzXCJcbmltcG9ydCB7IExpc3RMb2FkaW5nU3RhdGUsIExpc3RTdGF0ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTGlzdC5qc1wiXG5pbXBvcnQge1xuXHRhc3NlcnROb3ROdWxsLFxuXHRkZWVwRXF1YWwsXG5cdGRlZmVyLFxuXHRkb3duY2FzdCxcblx0Z2V0RW5kT2ZEYXksXG5cdGdldFN0YXJ0T2ZEYXksXG5cdGluY3JlbWVudE1vbnRoLFxuXHRpc1NhbWVEYXlPZkRhdGUsXG5cdGlzU2FtZVR5cGVSZWYsXG5cdExhenlMb2FkZWQsXG5cdG5ldmVyTnVsbCxcblx0b2ZDbGFzcyxcblx0c3RyaW5nVG9CYXNlNjQsXG5cdFR5cGVSZWYsXG59IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgYXJlUmVzdWx0c0ZvclRoZVNhbWVRdWVyeSwgaGFzTW9yZVJlc3VsdHMsIGlzU2FtZVNlYXJjaFJlc3RyaWN0aW9uLCBTZWFyY2hNb2RlbCB9IGZyb20gXCIuLi9tb2RlbC9TZWFyY2hNb2RlbC5qc1wiXG5pbXBvcnQgeyBOb3RGb3VuZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvci5qc1wiXG5pbXBvcnQgeyBjb21wYXJlQ29udGFjdHMgfSBmcm9tIFwiLi4vLi4vY29udGFjdHMvdmlldy9Db250YWN0R3VpVXRpbHMuanNcIlxuaW1wb3J0IHsgQ29udmVyc2F0aW9uVmlld01vZGVsLCBDb252ZXJzYXRpb25WaWV3TW9kZWxGYWN0b3J5IH0gZnJvbSBcIi4uLy4uL21haWwvdmlldy9Db252ZXJzYXRpb25WaWV3TW9kZWwuanNcIlxuaW1wb3J0IHtcblx0Y3JlYXRlUmVzdHJpY3Rpb24sXG5cdGRlY29kZUNhbGVuZGFyU2VhcmNoS2V5LFxuXHRlbmNvZGVDYWxlbmRhclNlYXJjaEtleSxcblx0Z2V0UmVzdHJpY3Rpb24sXG5cdGdldFNlYXJjaFVybCxcblx0c2VhcmNoQ2F0ZWdvcnlGb3JSZXN0cmljdGlvbixcblx0U2VhcmNoQ2F0ZWdvcnlUeXBlcyxcbn0gZnJvbSBcIi4uL21vZGVsL1NlYXJjaFV0aWxzLmpzXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7IE1haWxib3hEZXRhaWwsIE1haWxib3hNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWFpbEZ1bmN0aW9uYWxpdHkvTWFpbGJveE1vZGVsLmpzXCJcbmltcG9ydCB7IFNlYXJjaEZhY2FkZSB9IGZyb20gXCIuLi8uLi93b3JrZXJVdGlscy9pbmRleC9TZWFyY2hGYWNhZGUuanNcIlxuaW1wb3J0IHsgTG9naW5Db250cm9sbGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Mb2dpbkNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgSW5kZXhlciB9IGZyb20gXCIuLi8uLi93b3JrZXJVdGlscy9pbmRleC9JbmRleGVyLmpzXCJcbmltcG9ydCB7IEVudGl0eUNsaWVudCwgbG9hZE11bHRpcGxlRnJvbUxpc3RzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudGl0eUNsaWVudC5qc1wiXG5pbXBvcnQgeyBTZWFyY2hSb3V0ZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL3NlYXJjaC92aWV3L1NlYXJjaFJvdXRlci5qc1wiXG5pbXBvcnQgeyBNYWlsT3BlbmVkTGlzdGVuZXIgfSBmcm9tIFwiLi4vLi4vbWFpbC92aWV3L01haWxWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgY29udGFpbnNFdmVudE9mVHlwZSwgRW50aXR5VXBkYXRlRGF0YSwgZ2V0RXZlbnRPZlR5cGUsIGlzVXBkYXRlRm9yVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVcGRhdGVVdGlscy5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckluZm8gfSBmcm9tIFwiLi4vLi4vLi4vY2FsZW5kYXItYXBwL2NhbGVuZGFyL21vZGVsL0NhbGVuZGFyTW9kZWwuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgbSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBDYWxlbmRhckZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ2FsZW5kYXJGYWNhZGUuanNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9Qcm9ncmFtbWluZ0Vycm9yLmpzXCJcbmltcG9ydCB7IFByb2dyZXNzVHJhY2tlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vUHJvZ3Jlc3NUcmFja2VyLmpzXCJcbmltcG9ydCB7IENsaWVudE9ubHlDYWxlbmRhcnNJbmZvLCBMaXN0QXV0b1NlbGVjdEJlaGF2aW9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0RldmljZUNvbmZpZy5qc1wiXG5pbXBvcnQge1xuXHRnZW5lcmF0ZUNhbGVuZGFySW5zdGFuY2VzSW5SYW5nZSxcblx0Z2V0U3RhcnRPZlRoZVdlZWtPZmZzZXRGb3JVc2VyLFxuXHRyZXRyaWV2ZUNsaWVudE9ubHlFdmVudHNGb3JVc2VyLFxufSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBtYWlsTG9jYXRvciB9IGZyb20gXCIuLi8uLi9tYWlsTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBnZXRNYWlsRmlsdGVyRm9yVHlwZSwgTWFpbEZpbHRlclR5cGUgfSBmcm9tIFwiLi4vLi4vbWFpbC92aWV3L01haWxWaWV3ZXJVdGlscy5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50c1JlcG9zaXRvcnkgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJFdmVudHNSZXBvc2l0b3J5LmpzXCJcbmltcG9ydCB7IGdldENsaWVudE9ubHlDYWxlbmRhcnMgfSBmcm9tIFwiLi4vLi4vLi4vY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9DYWxlbmRhckd1aVV0aWxzLmpzXCJcbmltcG9ydCB7IFlFQVJfSU5fTUlMTElTIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlscy9kaXN0L0RhdGVVdGlscy5qc1wiXG5pbXBvcnQgeyBMaXN0RmlsdGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xpc3RNb2RlbFwiXG5cbmNvbnN0IFNFQVJDSF9QQUdFX1NJWkUgPSAxMDBcblxuZXhwb3J0IHR5cGUgU2VhcmNoYWJsZVR5cGVzID0gTWFpbCB8IENvbnRhY3QgfCBDYWxlbmRhckV2ZW50XG5cbmV4cG9ydCBlbnVtIFBhaWRGdW5jdGlvblJlc3VsdCB7XG5cdFN1Y2Nlc3MsXG5cdFBhaWRTdWJzY3JpcHRpb25OZWVkZWQsXG59XG5cbmV4cG9ydCBjbGFzcyBTZWFyY2hWaWV3TW9kZWwge1xuXHRwcml2YXRlIF9saXN0TW9kZWw6IExpc3RFbGVtZW50TGlzdE1vZGVsPFNlYXJjaFJlc3VsdExpc3RFbnRyeT5cblx0Z2V0IGxpc3RNb2RlbCgpOiBMaXN0RWxlbWVudExpc3RNb2RlbDxTZWFyY2hSZXN1bHRMaXN0RW50cnk+IHtcblx0XHRyZXR1cm4gdGhpcy5fbGlzdE1vZGVsXG5cdH1cblxuXHRwcml2YXRlIF9pbmNsdWRlUmVwZWF0aW5nRXZlbnRzOiBib29sZWFuID0gdHJ1ZVxuXHRnZXQgaW5jbHVkZVJlcGVhdGluZ0V2ZW50cygpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5faW5jbHVkZVJlcGVhdGluZ0V2ZW50c1xuXHR9XG5cblx0Z2V0IHdhcm5pbmcoKTogXCJsb25nXCIgfCBcInN0YXJ0YWZ0ZXJlbmRcIiB8IG51bGwge1xuXHRcdGlmICh0aGlzLnN0YXJ0RGF0ZSAmJiB0aGlzLnN0YXJ0RGF0ZS5nZXRUaW1lKCkgPiB0aGlzLmVuZERhdGUuZ2V0VGltZSgpKSB7XG5cdFx0XHRyZXR1cm4gXCJzdGFydGFmdGVyZW5kXCJcblx0XHR9IGVsc2UgaWYgKHRoaXMuc3RhcnREYXRlICYmIHRoaXMuZW5kRGF0ZS5nZXRUaW1lKCkgLSB0aGlzLnN0YXJ0RGF0ZS5nZXRUaW1lKCkgPiBZRUFSX0lOX01JTExJUykge1xuXHRcdFx0cmV0dXJuIFwibG9uZ1wiXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIHRoZSB0eXBlIHJlZiB0aGF0IGRldGVybWluZXMgd2hpY2ggc2VhcmNoIGZpbHRlcnMgYW5kIGRldGFpbHNcblx0ICogdmlld2VycyB0aGlzIHZpZXcgc2hvdWxkIHNob3cuXG5cdCAqIHRha2VuIGZyb20gdGhlIGN1cnJlbnQgcmVzdWx0cycgcmVzdHJpY3Rpb24gb3IsIGlmIHJlc3VsdCBpcyBub25leGlzdGVudCxcblx0ICogdGhlIFVSTC5cblx0ICpcblx0ICogcmVzdWx0IG1pZ2h0IGJlIG5vbmV4aXN0ZW50IGlmIHRoZXJlIGlzIG5vIHF1ZXJ5IG9yIHdlJ3JlIG5vdCBkb25lIHNlYXJjaGluZ1xuXHQgKiB5ZXQuXG5cdCAqL1xuXHRnZXQgc2VhcmNoZWRUeXBlKCk6IFR5cGVSZWY8TWFpbD4gfCBUeXBlUmVmPENvbnRhY3Q+IHwgVHlwZVJlZjxDYWxlbmRhckV2ZW50PiB7XG5cdFx0cmV0dXJuICh0aGlzLnNlYXJjaFJlc3VsdD8ucmVzdHJpY3Rpb24gPz8gdGhpcy5yb3V0ZXIuZ2V0UmVzdHJpY3Rpb24oKSkudHlwZVxuXHR9XG5cblx0cHJpdmF0ZSBfY29udmVyc2F0aW9uVmlld01vZGVsOiBDb252ZXJzYXRpb25WaWV3TW9kZWwgfCBudWxsID0gbnVsbFxuXHRnZXQgY29udmVyc2F0aW9uVmlld01vZGVsKCk6IENvbnZlcnNhdGlvblZpZXdNb2RlbCB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLl9jb252ZXJzYXRpb25WaWV3TW9kZWxcblx0fVxuXG5cdHByaXZhdGUgX3N0YXJ0RGF0ZTogRGF0ZSB8IG51bGwgPSBudWxsIC8vIG51bGwgPSBjdXJyZW50IG1haWwgaW5kZXggZGF0ZS4gdGhpcyBhbGxvd3MgdXMgdG8gc3RhcnQgdGhlIHNlYXJjaCAoYW5kIHRoZSB1cmwpIHdpdGhvdXQgZW5kIGRhdGUgc2V0XG5cdGdldCBzdGFydERhdGUoKTogRGF0ZSB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLl9zdGFydERhdGUgPz8gdGhpcy5nZXRDdXJyZW50TWFpbEluZGV4RGF0ZSgpXG5cdH1cblxuXHRwcml2YXRlIF9lbmREYXRlOiBEYXRlIHwgbnVsbCA9IG51bGwgLy8gbnVsbCA9IHRvZGF5IChtYWlsKSwgZW5kIG9mIDIgbW9udGhzIGluIHRoZSBmdXR1cmUgKGNhbGVuZGFyKVxuXHRnZXQgZW5kRGF0ZSgpOiBEYXRlIHtcblx0XHRpZiAodGhpcy5fZW5kRGF0ZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX2VuZERhdGVcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKHRoaXMuZ2V0Q2F0ZWdvcnkoKSA9PT0gU2VhcmNoQ2F0ZWdvcnlUeXBlcy5jYWxlbmRhcikge1xuXHRcdFx0XHRsZXQgcmV0dXJuRGF0ZSA9IGluY3JlbWVudE1vbnRoKG5ldyBEYXRlKCksIDMpXG5cdFx0XHRcdHJldHVybkRhdGUuc2V0RGF0ZSgwKVxuXHRcdFx0XHRyZXR1cm4gcmV0dXJuRGF0ZVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBEYXRlKClcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIF9zZWxlY3RlZE1haWxGb2xkZXI6IEFycmF5PElkPiA9IFtdXG5cdGdldCBzZWxlY3RlZE1haWxGb2xkZXIoKTogQXJyYXk8SWQ+IHtcblx0XHRyZXR1cm4gdGhpcy5fc2VsZWN0ZWRNYWlsRm9sZGVyXG5cdH1cblxuXHQvLyBpc24ndCBhbiBJZFR1cGxlIGJlY2F1c2UgaXQgaXMgdHdvIGxpc3QgaWRzXG5cdHByaXZhdGUgX3NlbGVjdGVkQ2FsZW5kYXI6IHJlYWRvbmx5IFtJZCwgSWRdIHwgc3RyaW5nIHwgbnVsbCA9IG51bGxcblx0Z2V0IHNlbGVjdGVkQ2FsZW5kYXIoKTogcmVhZG9ubHkgW0lkLCBJZF0gfCBzdHJpbmcgfCBudWxsIHtcblx0XHRyZXR1cm4gdGhpcy5fc2VsZWN0ZWRDYWxlbmRhclxuXHR9XG5cblx0cHJpdmF0ZSBfbWFpbGJveGVzOiBNYWlsYm94RGV0YWlsW10gPSBbXVxuXHRnZXQgbWFpbGJveGVzKCk6IE1haWxib3hEZXRhaWxbXSB7XG5cdFx0cmV0dXJuIHRoaXMuX21haWxib3hlc1xuXHR9XG5cblx0cHJpdmF0ZSBfc2VsZWN0ZWRNYWlsRmllbGQ6IHN0cmluZyB8IG51bGwgPSBudWxsXG5cdGdldCBzZWxlY3RlZE1haWxGaWVsZCgpOiBzdHJpbmcgfCBudWxsIHtcblx0XHRyZXR1cm4gdGhpcy5fc2VsZWN0ZWRNYWlsRmllbGRcblx0fVxuXG5cdC8vIENvbnRhaW5zIGxvYWQgbW9yZSByZXN1bHRzIGV2ZW4gd2hlbiBzZWFyY2hNb2RlbCBkb2Vzbid0LlxuXHQvLyBMb2FkIG1vcmUgc2hvdWxkIHByb2JhYmx5IGJlIG1vdmVkIHRvIHRoZSBtb2RlbCB0byB1cGRhdGUgaXQncyByZXN1bHQgc3RyZWFtLlxuXHRwcml2YXRlIHNlYXJjaFJlc3VsdDogU2VhcmNoUmVzdWx0IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBtYWlsRmlsdGVyVHlwZTogTWFpbEZpbHRlclR5cGUgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGxhdGVzdE1haWxSZXN0cmljdGlvbjogU2VhcmNoUmVzdHJpY3Rpb24gfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGxhdGVzdENhbGVuZGFyUmVzdHJpY3Rpb246IFNlYXJjaFJlc3RyaWN0aW9uIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBtYWlsYm94U3Vic2NyaXB0aW9uOiBTdHJlYW08dm9pZD4gfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHJlc3VsdFN1YnNjcmlwdGlvbjogU3RyZWFtPHZvaWQ+IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBsaXN0U3RhdGVTdWJzY3JpcHRpb246IFN0cmVhbTx1bmtub3duPiB8IG51bGwgPSBudWxsXG5cdGxvYWRpbmdBbGxGb3JTZWFyY2hSZXN1bHQ6IFNlYXJjaFJlc3VsdCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgcmVhZG9ubHkgbGF6eUNhbGVuZGFySW5mb3M6IExhenlMb2FkZWQ8UmVhZG9ubHlNYXA8c3RyaW5nLCBDYWxlbmRhckluZm8+PiA9IG5ldyBMYXp5TG9hZGVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCBjYWxlbmRhck1vZGVsID0gYXdhaXQgbG9jYXRvci5jYWxlbmRhck1vZGVsKClcblx0XHRjb25zdCBjYWxlbmRhckluZm9zID0gYXdhaXQgY2FsZW5kYXJNb2RlbC5nZXRDYWxlbmRhckluZm9zKClcblx0XHRtLnJlZHJhdygpXG5cdFx0cmV0dXJuIGNhbGVuZGFySW5mb3Ncblx0fSlcblxuXHRwcml2YXRlIHJlYWRvbmx5IHVzZXJIYXNOZXdQYWlkUGxhbjogTGF6eUxvYWRlZDxib29sZWFuPiA9IG5ldyBMYXp5TG9hZGVkPGJvb2xlYW4+KGFzeW5jICgpID0+IHtcblx0XHRyZXR1cm4gYXdhaXQgdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc05ld1BhaWRQbGFuKClcblx0fSlcblxuXHRjdXJyZW50UXVlcnk6IHN0cmluZyA9IFwiXCJcblxuXHRwcml2YXRlIGV4dGVuZEluZGV4Q29uZmlybWF0aW9uQ2FsbGJhY2s6ICgoKSA9PiBQcm9taXNlPGJvb2xlYW4+KSB8IG51bGwgPSBudWxsXG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cmVhZG9ubHkgcm91dGVyOiBTZWFyY2hSb3V0ZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBzZWFyY2g6IFNlYXJjaE1vZGVsLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgc2VhcmNoRmFjYWRlOiBTZWFyY2hGYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBtYWlsYm94TW9kZWw6IE1haWxib3hNb2RlbCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGxvZ2luczogTG9naW5Db250cm9sbGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgaW5kZXhlckZhY2FkZTogSW5kZXhlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZXZlbnRDb250cm9sbGVyOiBFdmVudENvbnRyb2xsZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBtYWlsT3BlbmVkTGlzdGVuZXI6IE1haWxPcGVuZWRMaXN0ZW5lciB8IG51bGwsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjYWxlbmRhckZhY2FkZTogQ2FsZW5kYXJGYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBwcm9ncmVzc1RyYWNrZXI6IFByb2dyZXNzVHJhY2tlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNvbnZlcnNhdGlvblZpZXdNb2RlbEZhY3Rvcnk6IENvbnZlcnNhdGlvblZpZXdNb2RlbEZhY3RvcnkgfCBudWxsLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZXZlbnRzUmVwb3NpdG9yeTogQ2FsZW5kYXJFdmVudHNSZXBvc2l0b3J5LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgdXBkYXRlVWk6ICgpID0+IHVua25vd24sXG5cdFx0cHJpdmF0ZSByZWFkb25seSBzZWxlY3Rpb25CZWhhdmlvcjogTGlzdEF1dG9TZWxlY3RCZWhhdmlvcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGxvY2FsQ2FsZW5kYXJzOiBNYXA8SWQsIENsaWVudE9ubHlDYWxlbmRhcnNJbmZvPixcblx0KSB7XG5cdFx0dGhpcy5jdXJyZW50UXVlcnkgPSB0aGlzLnNlYXJjaC5yZXN1bHQoKT8ucXVlcnkgPz8gXCJcIlxuXHRcdHRoaXMuX2xpc3RNb2RlbCA9IHRoaXMuY3JlYXRlTGlzdCgpXG5cdH1cblxuXHRnZXRMYXp5Q2FsZW5kYXJJbmZvcygpIHtcblx0XHRyZXR1cm4gdGhpcy5sYXp5Q2FsZW5kYXJJbmZvc1xuXHR9XG5cblx0Z2V0VXNlckhhc05ld1BhaWRQbGFuKCkge1xuXHRcdHJldHVybiB0aGlzLnVzZXJIYXNOZXdQYWlkUGxhblxuXHR9XG5cblx0aW5pdChleHRlbmRJbmRleENvbmZpcm1hdGlvbkNhbGxiYWNrOiBTZWFyY2hWaWV3TW9kZWxbXCJleHRlbmRJbmRleENvbmZpcm1hdGlvbkNhbGxiYWNrXCJdKSB7XG5cdFx0aWYgKHRoaXMuZXh0ZW5kSW5kZXhDb25maXJtYXRpb25DYWxsYmFjaykge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdHRoaXMuZXh0ZW5kSW5kZXhDb25maXJtYXRpb25DYWxsYmFjayA9IGV4dGVuZEluZGV4Q29uZmlybWF0aW9uQ2FsbGJhY2tcblx0XHR0aGlzLnJlc3VsdFN1YnNjcmlwdGlvbiA9IHRoaXMuc2VhcmNoLnJlc3VsdC5tYXAoKHJlc3VsdCkgPT4ge1xuXHRcdFx0aWYgKCFyZXN1bHQgfHwgIWlzU2FtZVR5cGVSZWYocmVzdWx0LnJlc3RyaWN0aW9uLnR5cGUsIE1haWxUeXBlUmVmKSkge1xuXHRcdFx0XHR0aGlzLm1haWxGaWx0ZXJUeXBlID0gbnVsbFxuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5zZWFyY2hSZXN1bHQgPT0gbnVsbCB8fCByZXN1bHQgPT0gbnVsbCB8fCAhYXJlUmVzdWx0c0ZvclRoZVNhbWVRdWVyeShyZXN1bHQsIHRoaXMuc2VhcmNoUmVzdWx0KSkge1xuXHRcdFx0XHR0aGlzLl9saXN0TW9kZWwuY2FuY2VsTG9hZEFsbCgpXG5cblx0XHRcdFx0dGhpcy5zZWFyY2hSZXN1bHQgPSByZXN1bHRcblxuXHRcdFx0XHR0aGlzLl9saXN0TW9kZWwgPSB0aGlzLmNyZWF0ZUxpc3QoKVxuXHRcdFx0XHR0aGlzLnNldE1haWxGaWx0ZXIodGhpcy5tYWlsRmlsdGVyVHlwZSlcblx0XHRcdFx0dGhpcy5hcHBseU1haWxGaWx0ZXJJZk5lZWRlZCgpXG5cdFx0XHRcdHRoaXMuX2xpc3RNb2RlbC5sb2FkSW5pdGlhbCgpXG5cdFx0XHRcdHRoaXMubGlzdFN0YXRlU3Vic2NyaXB0aW9uPy5lbmQodHJ1ZSlcblx0XHRcdFx0dGhpcy5saXN0U3RhdGVTdWJzY3JpcHRpb24gPSB0aGlzLl9saXN0TW9kZWwuc3RhdGVTdHJlYW0ubWFwKChzdGF0ZSkgPT4gdGhpcy5vbkxpc3RTdGF0ZUNoYW5nZShzdGF0ZSkpXG5cdFx0XHR9XG5cdFx0fSlcblxuXHRcdHRoaXMubWFpbGJveFN1YnNjcmlwdGlvbiA9IHRoaXMubWFpbGJveE1vZGVsLm1haWxib3hEZXRhaWxzLm1hcCgobWFpbGJveGVzKSA9PiB7XG5cdFx0XHR0aGlzLm9uTWFpbGJveGVzQ2hhbmdlZChtYWlsYm94ZXMpXG5cdFx0fSlcblx0XHR0aGlzLmV2ZW50Q29udHJvbGxlci5hZGRFbnRpdHlMaXN0ZW5lcih0aGlzLmVudGl0eUV2ZW50c0xpc3RlbmVyKVxuXHR9XG5cblx0Z2V0UmVzdHJpY3Rpb24oKTogU2VhcmNoUmVzdHJpY3Rpb24ge1xuXHRcdHJldHVybiB0aGlzLnJvdXRlci5nZXRSZXN0cmljdGlvbigpXG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IGVudGl0eUV2ZW50c0xpc3RlbmVyOiBFbnRpdHlFdmVudHNMaXN0ZW5lciA9IGFzeW5jICh1cGRhdGVzKSA9PiB7XG5cdFx0Zm9yIChjb25zdCB1cGRhdGUgb2YgdXBkYXRlcykge1xuXHRcdFx0Y29uc3QgbWVyZ2VkVXBkYXRlID0gdGhpcy5tZXJnZU9wZXJhdGlvbnNJZk5lZWRlZCh1cGRhdGUsIHVwZGF0ZXMpXG5cblx0XHRcdGlmIChtZXJnZWRVcGRhdGUgPT0gbnVsbCkgY29udGludWVcblxuXHRcdFx0YXdhaXQgdGhpcy5lbnRpdHlFdmVudFJlY2VpdmVkKG1lcmdlZFVwZGF0ZSlcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIG1lcmdlT3BlcmF0aW9uc0lmTmVlZGVkKHVwZGF0ZTogRW50aXR5VXBkYXRlRGF0YSwgdXBkYXRlczogcmVhZG9ubHkgRW50aXR5VXBkYXRlRGF0YVtdKTogRW50aXR5VXBkYXRlRGF0YSB8IG51bGwge1xuXHRcdC8vIFdlIGFyZSB0cnlpbmcgdG8ga2VlcCB0aGUgbWFpbHMgdGhhdCBhcmUgbW92ZWQgYW5kIHdvdWxkIG1hdGNoIHRoZSBzZWFyY2ggY3JpdGVyaWEgZGlzcGxheWVkLlxuXHRcdC8vIFRoaXMgaXMgYSBiaXQgaGFja3kgYXMgd2UgcmVpbXBsZW1lbnQgcGFydCBvZiB0aGUgZmlsdGVyaW5nIGJ5IGxpc3QuXG5cdFx0Ly8gSWRlYWxseSBzZWFyY2ggcmVzdWx0IHdvdWxkIHVwZGF0ZSBieSBpdHNlbGYgYW5kIHdlIHdvdWxkIG9ubHkgbmVlZCB0byByZWNvbmNpbGUgdGhlIGNoYW5nZXMuXG5cdFx0aWYgKCFpc1VwZGF0ZUZvclR5cGVSZWYoTWFpbFR5cGVSZWYsIHVwZGF0ZSkgfHwgdGhpcy5zZWFyY2hSZXN1bHQgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIHVwZGF0ZVxuXHRcdH1cblx0XHRpZiAodXBkYXRlLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5DUkVBVEUgJiYgY29udGFpbnNFdmVudE9mVHlwZSh1cGRhdGVzLCBPcGVyYXRpb25UeXBlLkRFTEVURSwgdXBkYXRlLmluc3RhbmNlSWQpKSB7XG5cdFx0XHQvLyBUaGlzIGlzIGEgbW92ZSBvcGVyYXRpb24sIGlzIGRlc3RpbmF0aW9uIGxpc3QgaW5jbHVkZWQgaW4gdGhlIHJlc3RyaWN0aW9ucz9cblx0XHRcdGlmICh0aGlzLmxpc3RJZE1hdGNoZXNSZXN0cmljdGlvbih1cGRhdGUuaW5zdGFuY2VMaXN0SWQsIHRoaXMuc2VhcmNoUmVzdWx0LnJlc3RyaWN0aW9uKSkge1xuXHRcdFx0XHQvLyBJZiBpdCdzIGluY2x1ZGVkLCB3ZSB3YW50IHRvIGtlZXAgc2hvd2luZyB0aGUgaXRlbSBidXQgd2Ugd2lsbCBzaW11bGF0ZSB0aGUgVVBEQVRFXG5cdFx0XHRcdHJldHVybiB7IC4uLnVwZGF0ZSwgb3BlcmF0aW9uOiBPcGVyYXRpb25UeXBlLlVQREFURSB9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBJZiBpdCdzIG5vdCBnb2luZyB0byBiZSBpbmNsdWRlZCB3ZSBtaWdodCBhcyB3ZWxsIHNraXAgdGhlIGNyZWF0ZSBvcGVyYXRpb25cblx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHVwZGF0ZS5vcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuREVMRVRFICYmIGNvbnRhaW5zRXZlbnRPZlR5cGUodXBkYXRlcywgT3BlcmF0aW9uVHlwZS5DUkVBVEUsIHVwZGF0ZS5pbnN0YW5jZUlkKSkge1xuXHRcdFx0Ly8gVGhpcyBpcyBhIG1vdmUgb3BlcmF0aW9uIGFuZCB3ZSBhcmUgaW4gdGhlIGRlbGV0ZSBwYXJ0IG9mIGl0LlxuXHRcdFx0Ly8gR3JhYiB0aGUgb3RoZXIgcGFydCB0byBjaGVjayB0aGUgbW92ZSBkZXN0aW5hdGlvbi5cblx0XHRcdGNvbnN0IGNyZWF0ZU9wZXJhdGlvbiA9IGFzc2VydE5vdE51bGwoZ2V0RXZlbnRPZlR5cGUodXBkYXRlcywgT3BlcmF0aW9uVHlwZS5DUkVBVEUsIHVwZGF0ZS5pbnN0YW5jZUlkKSlcblx0XHRcdC8vIElzIGRlc3RpbmF0aW9uIGluY2x1ZGVkIGluIHRoZSBzZWFyY2g/XG5cdFx0XHRpZiAodGhpcy5saXN0SWRNYXRjaGVzUmVzdHJpY3Rpb24oY3JlYXRlT3BlcmF0aW9uLmluc3RhbmNlTGlzdElkLCB0aGlzLnNlYXJjaFJlc3VsdC5yZXN0cmljdGlvbikpIHtcblx0XHRcdFx0Ly8gSWYgc28sIHNraXAgdGhlIGRlbGV0ZS5cblx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIE90aGVyd2lzZSBkZWxldGVcblx0XHRcdFx0cmV0dXJuIHVwZGF0ZVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdXBkYXRlXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBsaXN0SWRNYXRjaGVzUmVzdHJpY3Rpb24obGlzdElkOiBzdHJpbmcsIHJlc3RyaWN0aW9uOiBTZWFyY2hSZXN0cmljdGlvbik6IGJvb2xlYW4ge1xuXHRcdHJldHVybiByZXN0cmljdGlvbi5mb2xkZXJJZHMubGVuZ3RoID09PSAwIHx8IHJlc3RyaWN0aW9uLmZvbGRlcklkcy5pbmNsdWRlcyhsaXN0SWQpXG5cdH1cblxuXHRvbk5ld1VybChhcmdzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCByZXF1ZXN0ZWRQYXRoOiBzdHJpbmcpIHtcblx0XHRsZXQgcmVzdHJpY3Rpb25cblx0XHR0cnkge1xuXHRcdFx0cmVzdHJpY3Rpb24gPSBnZXRSZXN0cmljdGlvbihyZXF1ZXN0ZWRQYXRoKVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdC8vIGlmIHJlc3RyaWN0aW9uIGlzIGJyb2tlbiByZXBsYWNlIGl0IHdpdGggbm9uLWJyb2tlbiB2ZXJzaW9uXG5cdFx0XHR0aGlzLnJvdXRlci5yb3V0ZVRvKGFyZ3MucXVlcnksIGNyZWF0ZVJlc3RyaWN0aW9uKFNlYXJjaENhdGVnb3J5VHlwZXMubWFpbCwgbnVsbCwgbnVsbCwgbnVsbCwgW10sIG51bGwpKVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0dGhpcy5jdXJyZW50UXVlcnkgPSBhcmdzLnF1ZXJ5XG5cdFx0Y29uc3QgbGFzdFF1ZXJ5ID0gdGhpcy5zZWFyY2gubGFzdFF1ZXJ5U3RyaW5nKClcblx0XHRjb25zdCBtYXhSZXN1bHRzID0gaXNTYW1lVHlwZVJlZihNYWlsVHlwZVJlZiwgcmVzdHJpY3Rpb24udHlwZSkgPyBTRUFSQ0hfUEFHRV9TSVpFIDogbnVsbFxuXHRcdGNvbnN0IGxpc3RNb2RlbCA9IHRoaXMuX2xpc3RNb2RlbFxuXHRcdC8vIHVzaW5nIGhhc093blByb3BlcnR5IHRvIGRpc3Rpbmd1aXNoIGNhc2Ugd2hlbiB1cmwgaXMgbGlrZSAnL3NlYXJjaC9tYWlsL3F1ZXJ5PSdcblx0XHRpZiAoT2JqZWN0Lmhhc093bihhcmdzLCBcInF1ZXJ5XCIpICYmIHRoaXMuc2VhcmNoLmlzTmV3U2VhcmNoKGFyZ3MucXVlcnksIHJlc3RyaWN0aW9uKSkge1xuXHRcdFx0dGhpcy5zZWFyY2hSZXN1bHQgPSBudWxsXG5cdFx0XHRsaXN0TW9kZWwudXBkYXRlTG9hZGluZ1N0YXR1cyhMaXN0TG9hZGluZ1N0YXRlLkxvYWRpbmcpXG5cdFx0XHR0aGlzLnNlYXJjaFxuXHRcdFx0XHQuc2VhcmNoKFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHF1ZXJ5OiBhcmdzLnF1ZXJ5LFxuXHRcdFx0XHRcdFx0cmVzdHJpY3Rpb24sXG5cdFx0XHRcdFx0XHRtaW5TdWdnZXN0aW9uQ291bnQ6IDAsXG5cdFx0XHRcdFx0XHRtYXhSZXN1bHRzLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0dGhpcy5wcm9ncmVzc1RyYWNrZXIsXG5cdFx0XHRcdClcblx0XHRcdFx0LnRoZW4oKCkgPT4gbGlzdE1vZGVsLnVwZGF0ZUxvYWRpbmdTdGF0dXMoTGlzdExvYWRpbmdTdGF0ZS5Eb25lKSlcblx0XHRcdFx0LmNhdGNoKCgpID0+IGxpc3RNb2RlbC51cGRhdGVMb2FkaW5nU3RhdHVzKExpc3RMb2FkaW5nU3RhdGUuQ29ubmVjdGlvbkxvc3QpKVxuXHRcdH0gZWxzZSBpZiAobGFzdFF1ZXJ5ICYmIHRoaXMuc2VhcmNoLmlzTmV3U2VhcmNoKGxhc3RRdWVyeSwgcmVzdHJpY3Rpb24pKSB7XG5cdFx0XHR0aGlzLnNlYXJjaFJlc3VsdCA9IG51bGxcblxuXHRcdFx0Ly8gSWYgcXVlcnkgaXMgbm90IHNldCBmb3Igc29tZSByZWFzb24gKGUuZy4gc3dpdGNoaW5nIHNlYXJjaCB0eXBlKSwgdXNlIHRoZSBsYXN0IHF1ZXJ5IHZhbHVlXG5cdFx0XHRsaXN0TW9kZWwuc2VsZWN0Tm9uZSgpXG5cdFx0XHRsaXN0TW9kZWwudXBkYXRlTG9hZGluZ1N0YXR1cyhMaXN0TG9hZGluZ1N0YXRlLkxvYWRpbmcpXG5cdFx0XHR0aGlzLnNlYXJjaFxuXHRcdFx0XHQuc2VhcmNoKFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHF1ZXJ5OiBsYXN0UXVlcnksXG5cdFx0XHRcdFx0XHRyZXN0cmljdGlvbixcblx0XHRcdFx0XHRcdG1pblN1Z2dlc3Rpb25Db3VudDogMCxcblx0XHRcdFx0XHRcdG1heFJlc3VsdHMsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR0aGlzLnByb2dyZXNzVHJhY2tlcixcblx0XHRcdFx0KVxuXHRcdFx0XHQudGhlbigoKSA9PiBsaXN0TW9kZWwudXBkYXRlTG9hZGluZ1N0YXR1cyhMaXN0TG9hZGluZ1N0YXRlLkRvbmUpKVxuXHRcdFx0XHQuY2F0Y2goKCkgPT4gbGlzdE1vZGVsLnVwZGF0ZUxvYWRpbmdTdGF0dXMoTGlzdExvYWRpbmdTdGF0ZS5Db25uZWN0aW9uTG9zdCkpXG5cdFx0fSBlbHNlIGlmICghT2JqZWN0Lmhhc093bihhcmdzLCBcInF1ZXJ5XCIpICYmICFsYXN0UXVlcnkpIHtcblx0XHRcdC8vIG5vIHF1ZXJ5IGF0IGFsbCB5ZXRcblx0XHRcdGxpc3RNb2RlbC51cGRhdGVMb2FkaW5nU3RhdHVzKExpc3RMb2FkaW5nU3RhdGUuRG9uZSlcblx0XHR9XG5cblx0XHRpZiAoaXNTYW1lVHlwZVJlZihyZXN0cmljdGlvbi50eXBlLCBDb250YWN0VHlwZVJlZikpIHtcblx0XHRcdHRoaXMubG9hZEFuZFNlbGVjdElmTmVlZGVkKGFyZ3MuaWQpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmIChpc1NhbWVUeXBlUmVmKHJlc3RyaWN0aW9uLnR5cGUsIE1haWxUeXBlUmVmKSkge1xuXHRcdFx0XHR0aGlzLl9zZWxlY3RlZE1haWxGaWVsZCA9IHJlc3RyaWN0aW9uLmZpZWxkXG5cdFx0XHRcdHRoaXMuX3N0YXJ0RGF0ZSA9IHJlc3RyaWN0aW9uLmVuZCA/IG5ldyBEYXRlKHJlc3RyaWN0aW9uLmVuZCkgOiBudWxsXG5cdFx0XHRcdHRoaXMuX2VuZERhdGUgPSByZXN0cmljdGlvbi5zdGFydCA/IG5ldyBEYXRlKHJlc3RyaWN0aW9uLnN0YXJ0KSA6IG51bGxcblx0XHRcdFx0dGhpcy5fc2VsZWN0ZWRNYWlsRm9sZGVyID0gcmVzdHJpY3Rpb24uZm9sZGVySWRzXG5cdFx0XHRcdHRoaXMubG9hZEFuZFNlbGVjdElmTmVlZGVkKGFyZ3MuaWQpXG5cdFx0XHRcdHRoaXMubGF0ZXN0TWFpbFJlc3RyaWN0aW9uID0gcmVzdHJpY3Rpb25cblx0XHRcdH0gZWxzZSBpZiAoaXNTYW1lVHlwZVJlZihyZXN0cmljdGlvbi50eXBlLCBDYWxlbmRhckV2ZW50VHlwZVJlZikpIHtcblx0XHRcdFx0dGhpcy5fc3RhcnREYXRlID0gcmVzdHJpY3Rpb24uc3RhcnQgPyBuZXcgRGF0ZShyZXN0cmljdGlvbi5zdGFydCkgOiBudWxsXG5cdFx0XHRcdHRoaXMuX2VuZERhdGUgPSByZXN0cmljdGlvbi5lbmQgPyBuZXcgRGF0ZShyZXN0cmljdGlvbi5lbmQpIDogbnVsbFxuXHRcdFx0XHR0aGlzLl9pbmNsdWRlUmVwZWF0aW5nRXZlbnRzID0gcmVzdHJpY3Rpb24uZXZlbnRTZXJpZXMgPz8gdHJ1ZVxuXHRcdFx0XHR0aGlzLmxhenlDYWxlbmRhckluZm9zLmxvYWQoKVxuXHRcdFx0XHR0aGlzLnVzZXJIYXNOZXdQYWlkUGxhbi5sb2FkKClcblx0XHRcdFx0dGhpcy5sYXRlc3RDYWxlbmRhclJlc3RyaWN0aW9uID0gcmVzdHJpY3Rpb25cblxuXHRcdFx0XHQvLyBDaGVjayBpZiB1c2VyIGlzIHRyeWluZyB0byBzZWFyY2ggaW4gYSBjbGllbnQgb25seSBjYWxlbmRhciB3aGlsZSB1c2luZyBhIGZyZWUgYWNjb3VudFxuXHRcdFx0XHRjb25zdCBzZWxlY3RlZENhbGVuZGFyID0gdGhpcy5leHRyYWN0Q2FsZW5kYXJMaXN0SWRzKHJlc3RyaWN0aW9uLmZvbGRlcklkcylcblx0XHRcdFx0aWYgKCFzZWxlY3RlZENhbGVuZGFyIHx8IEFycmF5LmlzQXJyYXkoc2VsZWN0ZWRDYWxlbmRhcikpIHtcblx0XHRcdFx0XHR0aGlzLl9zZWxlY3RlZENhbGVuZGFyID0gc2VsZWN0ZWRDYWxlbmRhclxuXHRcdFx0XHR9IGVsc2UgaWYgKENMSUVOVF9PTkxZX0NBTEVOREFSUy5oYXMoc2VsZWN0ZWRDYWxlbmRhci50b1N0cmluZygpKSkge1xuXHRcdFx0XHRcdHRoaXMuZ2V0VXNlckhhc05ld1BhaWRQbGFuKClcblx0XHRcdFx0XHRcdC5nZXRBc3luYygpXG5cdFx0XHRcdFx0XHQudGhlbigoaXNOZXdQYWlkUGxhbikgPT4ge1xuXHRcdFx0XHRcdFx0XHRpZiAoIWlzTmV3UGFpZFBsYW4pIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gKHRoaXMuX3NlbGVjdGVkQ2FsZW5kYXIgPSBudWxsKVxuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0dGhpcy5fc2VsZWN0ZWRDYWxlbmRhciA9IHNlbGVjdGVkQ2FsZW5kYXJcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoYXJncy5pZCAhPSBudWxsKSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGNvbnN0IHsgc3RhcnQsIGlkIH0gPSBkZWNvZGVDYWxlbmRhclNlYXJjaEtleShhcmdzLmlkKVxuXHRcdFx0XHRcdFx0dGhpcy5sb2FkQW5kU2VsZWN0SWZOZWVkZWQoaWQsICh7IGVudHJ5IH06IFNlYXJjaFJlc3VsdExpc3RFbnRyeSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRlbnRyeSA9IGVudHJ5IGFzIENhbGVuZGFyRXZlbnRcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGlkID09PSBnZXRFbGVtZW50SWQoZW50cnkpICYmIHN0YXJ0ID09PSBlbnRyeS5zdGFydFRpbWUuZ2V0VGltZSgpXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXCJJbnZhbGlkIElELCBzZWxlY3Rpbmcgbm9uZVwiKVxuXHRcdFx0XHRcdFx0dGhpcy5saXN0TW9kZWwuc2VsZWN0Tm9uZSgpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBleHRyYWN0Q2FsZW5kYXJMaXN0SWRzKGxpc3RJZHM6IHN0cmluZ1tdKTogcmVhZG9ubHkgW3N0cmluZywgc3RyaW5nXSB8IHN0cmluZyB8IG51bGwge1xuXHRcdGlmIChsaXN0SWRzLmxlbmd0aCA8IDEpIHJldHVybiBudWxsXG5cdFx0ZWxzZSBpZiAobGlzdElkcy5sZW5ndGggPT09IDEpIHJldHVybiBsaXN0SWRzWzBdXG5cblx0XHRyZXR1cm4gW2xpc3RJZHNbMF0sIGxpc3RJZHNbMV1dXG5cdH1cblxuXHRwcml2YXRlIGxvYWRBbmRTZWxlY3RJZk5lZWRlZChpZDogc3RyaW5nIHwgbnVsbCwgZmluZGVyPzogKGE6IExpc3RFbGVtZW50KSA9PiBib29sZWFuKSB7XG5cdFx0Ly8gbm90aGluZyB0byBzZWxlY3Rcblx0XHRpZiAoaWQgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLl9saXN0TW9kZWwuaXNJdGVtU2VsZWN0ZWQoaWQpKSB7XG5cdFx0XHRpZiAoIXRoaXMuX2xpc3RNb2RlbC5pc0l0ZW1TZWxlY3RlZChpZCkpIHtcblx0XHRcdFx0dGhpcy5oYW5kbGVMb2FkQW5kU2VsZWN0aW9uKGlkLCBmaW5kZXIpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBoYW5kbGVMb2FkQW5kU2VsZWN0aW9uKGlkOiBzdHJpbmcsIGZpbmRlcjogKChhOiBMaXN0RWxlbWVudCkgPT4gYm9vbGVhbikgfCB1bmRlZmluZWQpIHtcblx0XHRpZiAodGhpcy5fbGlzdE1vZGVsLmlzTG9hZGVkQ29tcGxldGVseSgpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5zZWxlY3RJdGVtKGlkLCBmaW5kZXIpXG5cdFx0fVxuXG5cdFx0Y29uc3QgbGlzdFN0YXRlU3RyZWFtID0gU3RyZWFtLmNvbWJpbmUoKGEpID0+IGEoKSwgW3RoaXMuX2xpc3RNb2RlbC5zdGF0ZVN0cmVhbV0pXG5cdFx0bGlzdFN0YXRlU3RyZWFtLm1hcCgoc3RhdGUpID0+IHtcblx0XHRcdGlmIChzdGF0ZS5sb2FkaW5nU3RhdHVzID09PSBMaXN0TG9hZGluZ1N0YXRlLkRvbmUpIHtcblx0XHRcdFx0dGhpcy5zZWxlY3RJdGVtKGlkLCBmaW5kZXIpXG5cdFx0XHRcdGxpc3RTdGF0ZVN0cmVhbS5lbmQodHJ1ZSlcblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBzZWxlY3RJdGVtKGlkOiBzdHJpbmcsIGZpbmRlcjogKChhOiBMaXN0RWxlbWVudCkgPT4gYm9vbGVhbikgfCB1bmRlZmluZWQpIHtcblx0XHRjb25zdCBsaXN0TW9kZWwgPSB0aGlzLl9saXN0TW9kZWxcblx0XHR0aGlzLl9saXN0TW9kZWwubG9hZEFuZFNlbGVjdChpZCwgKCkgPT4gIWRlZXBFcXVhbCh0aGlzLl9saXN0TW9kZWwsIGxpc3RNb2RlbCksIGZpbmRlcilcblx0fVxuXG5cdGFzeW5jIGxvYWRBbGwoKSB7XG5cdFx0aWYgKHRoaXMubG9hZGluZ0FsbEZvclNlYXJjaFJlc3VsdCAhPSBudWxsKSByZXR1cm5cblx0XHR0aGlzLmxvYWRpbmdBbGxGb3JTZWFyY2hSZXN1bHQgPSB0aGlzLnNlYXJjaFJlc3VsdCA/PyBudWxsXG5cdFx0dGhpcy5fbGlzdE1vZGVsLnNlbGVjdEFsbCgpXG5cdFx0dHJ5IHtcblx0XHRcdHdoaWxlIChcblx0XHRcdFx0dGhpcy5zZWFyY2hSZXN1bHQ/LnJlc3RyaWN0aW9uICYmXG5cdFx0XHRcdHRoaXMubG9hZGluZ0FsbEZvclNlYXJjaFJlc3VsdCAmJlxuXHRcdFx0XHRpc1NhbWVTZWFyY2hSZXN0cmljdGlvbih0aGlzLnNlYXJjaFJlc3VsdD8ucmVzdHJpY3Rpb24sIHRoaXMubG9hZGluZ0FsbEZvclNlYXJjaFJlc3VsdC5yZXN0cmljdGlvbikgJiZcblx0XHRcdFx0IXRoaXMuX2xpc3RNb2RlbC5pc0xvYWRlZENvbXBsZXRlbHkoKVxuXHRcdFx0KSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMuX2xpc3RNb2RlbC5sb2FkTW9yZSgpXG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHR0aGlzLnNlYXJjaFJlc3VsdC5yZXN0cmljdGlvbiAmJlxuXHRcdFx0XHRcdHRoaXMubG9hZGluZ0FsbEZvclNlYXJjaFJlc3VsdC5yZXN0cmljdGlvbiAmJlxuXHRcdFx0XHRcdGlzU2FtZVNlYXJjaFJlc3RyaWN0aW9uKHRoaXMuc2VhcmNoUmVzdWx0LnJlc3RyaWN0aW9uLCB0aGlzLmxvYWRpbmdBbGxGb3JTZWFyY2hSZXN1bHQucmVzdHJpY3Rpb24pXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdHRoaXMuX2xpc3RNb2RlbC5zZWxlY3RBbGwoKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHRoaXMubG9hZGluZ0FsbEZvclNlYXJjaFJlc3VsdCA9IG51bGxcblx0XHR9XG5cdH1cblxuXHRzdG9wTG9hZEFsbCgpIHtcblx0XHR0aGlzLl9saXN0TW9kZWwuY2FuY2VsTG9hZEFsbCgpXG5cdH1cblxuXHRzZWxlY3RNYWlsRmllbGQoZmllbGQ6IHN0cmluZyB8IG51bGwpOiBQYWlkRnVuY3Rpb25SZXN1bHQge1xuXHRcdGlmICh0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzRnJlZUFjY291bnQoKSAmJiBmaWVsZCAhPSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gUGFpZEZ1bmN0aW9uUmVzdWx0LlBhaWRTdWJzY3JpcHRpb25OZWVkZWRcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5fc2VsZWN0ZWRNYWlsRmllbGQgPSBmaWVsZFxuXHRcdFx0dGhpcy5zZWFyY2hBZ2FpbigpXG5cdFx0XHRyZXR1cm4gUGFpZEZ1bmN0aW9uUmVzdWx0LlN1Y2Nlc3Ncblx0XHR9XG5cdH1cblxuXHRjYW5TZWxlY3RUaW1lUGVyaW9kKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiAhdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0ZyZWVBY2NvdW50KClcblx0fVxuXG5cdGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0KCk6IG51bWJlciB7XG5cdFx0cmV0dXJuIGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0Rm9yVXNlcih0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJTZXR0aW5nc0dyb3VwUm9vdClcblx0fVxuXG5cdGFzeW5jIHNlbGVjdFN0YXJ0RGF0ZShzdGFydERhdGU6IERhdGUgfCBudWxsKTogUHJvbWlzZTxQYWlkRnVuY3Rpb25SZXN1bHQ+IHtcblx0XHRpZiAoaXNTYW1lRGF5T2ZEYXRlKHRoaXMuc3RhcnREYXRlLCBzdGFydERhdGUpKSB7XG5cdFx0XHRyZXR1cm4gUGFpZEZ1bmN0aW9uUmVzdWx0LlN1Y2Nlc3Ncblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuY2FuU2VsZWN0VGltZVBlcmlvZCgpKSB7XG5cdFx0XHRyZXR1cm4gUGFpZEZ1bmN0aW9uUmVzdWx0LlBhaWRTdWJzY3JpcHRpb25OZWVkZWRcblx0XHR9XG5cblx0XHQvLyBJZiBzdGFydCBkYXRlIGlzIG91dHNpZGUgdGhlIGluZGV4ZWQgcmFuZ2UsIHN1Z2dlc3QgdG8gZXh0ZW5kIHRoZSBpbmRleCBhbmQgb25seSBpZiBjb25maXJtZWQgY2hhbmdlIHRoZSBzZWxlY3RlZCBkYXRlLlxuXHRcdC8vIE90aGVyd2lzZSwga2VlcCB0aGUgZGF0ZSBhcyBpdCB3YXMuXG5cdFx0aWYgKFxuXHRcdFx0c3RhcnREYXRlICYmXG5cdFx0XHR0aGlzLmdldENhdGVnb3J5KCkgPT09IFNlYXJjaENhdGVnb3J5VHlwZXMubWFpbCAmJlxuXHRcdFx0c3RhcnREYXRlLmdldFRpbWUoKSA8IHRoaXMuc2VhcmNoLmluZGV4U3RhdGUoKS5jdXJyZW50TWFpbEluZGV4VGltZXN0YW1wICYmXG5cdFx0XHRzdGFydERhdGVcblx0XHQpIHtcblx0XHRcdGNvbnN0IGNvbmZpcm1lZCA9IChhd2FpdCB0aGlzLmV4dGVuZEluZGV4Q29uZmlybWF0aW9uQ2FsbGJhY2s/LigpKSA/PyB0cnVlXG5cdFx0XHRpZiAoY29uZmlybWVkKSB7XG5cdFx0XHRcdHRoaXMuX3N0YXJ0RGF0ZSA9IHN0YXJ0RGF0ZVxuXHRcdFx0XHR0aGlzLmluZGV4ZXJGYWNhZGUuZXh0ZW5kTWFpbEluZGV4KHN0YXJ0RGF0ZS5nZXRUaW1lKCkpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMudXBkYXRlU2VhcmNoVXJsKClcblx0XHRcdFx0XHR0aGlzLnVwZGF0ZVVpKClcblx0XHRcdFx0fSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIEluIHRoaXMgY2FzZSBpdCBpcyBub3QgYSBzdWNjZXNzIG9mIHBheW1lbnQsIGJ1dCB3ZSBkb24ndCBuZWVkIHRvIHByb21wdCBmb3IgdXBncmFkZVxuXHRcdFx0XHRyZXR1cm4gUGFpZEZ1bmN0aW9uUmVzdWx0LlN1Y2Nlc3Ncblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5fc3RhcnREYXRlID0gc3RhcnREYXRlXG5cdFx0fVxuXG5cdFx0dGhpcy5zZWFyY2hBZ2FpbigpXG5cblx0XHRyZXR1cm4gUGFpZEZ1bmN0aW9uUmVzdWx0LlN1Y2Nlc3Ncblx0fVxuXG5cdHNlbGVjdEVuZERhdGUoZW5kRGF0ZTogRGF0ZSk6IFBhaWRGdW5jdGlvblJlc3VsdCB7XG5cdFx0aWYgKGlzU2FtZURheU9mRGF0ZSh0aGlzLmVuZERhdGUsIGVuZERhdGUpKSB7XG5cdFx0XHRyZXR1cm4gUGFpZEZ1bmN0aW9uUmVzdWx0LlN1Y2Nlc3Ncblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuY2FuU2VsZWN0VGltZVBlcmlvZCgpKSB7XG5cdFx0XHRyZXR1cm4gUGFpZEZ1bmN0aW9uUmVzdWx0LlBhaWRTdWJzY3JpcHRpb25OZWVkZWRcblx0XHR9XG5cblx0XHR0aGlzLl9lbmREYXRlID0gZW5kRGF0ZVxuXG5cdFx0dGhpcy5zZWFyY2hBZ2FpbigpXG5cblx0XHRyZXR1cm4gUGFpZEZ1bmN0aW9uUmVzdWx0LlN1Y2Nlc3Ncblx0fVxuXG5cdHNlbGVjdENhbGVuZGFyKGNhbGVuZGFySW5mbzogQ2FsZW5kYXJJbmZvIHwgc3RyaW5nIHwgbnVsbCkge1xuXHRcdGlmICh0eXBlb2YgY2FsZW5kYXJJbmZvID09PSBcInN0cmluZ1wiIHx8IGNhbGVuZGFySW5mbyA9PSBudWxsKSB7XG5cdFx0XHR0aGlzLl9zZWxlY3RlZENhbGVuZGFyID0gY2FsZW5kYXJJbmZvXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuX3NlbGVjdGVkQ2FsZW5kYXIgPSBbY2FsZW5kYXJJbmZvLmdyb3VwUm9vdC5sb25nRXZlbnRzLCBjYWxlbmRhckluZm8uZ3JvdXBSb290LnNob3J0RXZlbnRzXVxuXHRcdH1cblx0XHR0aGlzLnNlYXJjaEFnYWluKClcblx0fVxuXG5cdHNlbGVjdE1haWxGb2xkZXIoZm9sZGVyOiBBcnJheTxzdHJpbmc+KTogUGFpZEZ1bmN0aW9uUmVzdWx0IHtcblx0XHRpZiAodGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0ZyZWVBY2NvdW50KCkgJiYgZm9sZGVyICE9IG51bGwpIHtcblx0XHRcdHJldHVybiBQYWlkRnVuY3Rpb25SZXN1bHQuUGFpZFN1YnNjcmlwdGlvbk5lZWRlZFxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLl9zZWxlY3RlZE1haWxGb2xkZXIgPSBmb2xkZXJcblx0XHRcdHRoaXMuc2VhcmNoQWdhaW4oKVxuXHRcdFx0cmV0dXJuIFBhaWRGdW5jdGlvblJlc3VsdC5TdWNjZXNzXG5cdFx0fVxuXHR9XG5cblx0c2VsZWN0SW5jbHVkZVJlcGVhdGluZ0V2ZW50cyhpbmNsdWRlOiBib29sZWFuKSB7XG5cdFx0dGhpcy5faW5jbHVkZVJlcGVhdGluZ0V2ZW50cyA9IGluY2x1ZGVcblx0XHR0aGlzLnNlYXJjaEFnYWluKClcblx0fVxuXG5cdC8qKlxuXHQgKiBAcmV0dXJucyBudWxsIGlmIHRoZSBjb21wbGV0ZSBtYWlsYm94IGlzIGluZGV4ZWRcblx0ICovXG5cdGdldEN1cnJlbnRNYWlsSW5kZXhEYXRlKCk6IERhdGUgfCBudWxsIHtcblx0XHRsZXQgdGltZXN0YW1wID0gdGhpcy5zZWFyY2guaW5kZXhTdGF0ZSgpLmN1cnJlbnRNYWlsSW5kZXhUaW1lc3RhbXBcblxuXHRcdGlmICh0aW1lc3RhbXAgPT09IEZVTExfSU5ERVhFRF9USU1FU1RBTVApIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fSBlbHNlIGlmICh0aW1lc3RhbXAgPT09IE5PVEhJTkdfSU5ERVhFRF9USU1FU1RBTVApIHtcblx0XHRcdHJldHVybiBnZXRFbmRPZkRheShuZXcgRGF0ZSgpKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbmV3IERhdGUodGltZXN0YW1wKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgc2VhcmNoQWdhaW4oKSB7XG5cdFx0dGhpcy51cGRhdGVTZWFyY2hVcmwoKVxuXHRcdHRoaXMudXBkYXRlVWkoKVxuXHR9XG5cblx0Z2V0VXJsRnJvbVNlYXJjaENhdGVnb3J5KGNhdGVnb3J5OiBTZWFyY2hDYXRlZ29yeVR5cGVzKTogc3RyaW5nIHtcblx0XHRpZiAodGhpcy5jdXJyZW50UXVlcnkpIHtcblx0XHRcdGxldCBsYXRlc3RSZXN0cmljdGlvbjogU2VhcmNoUmVzdHJpY3Rpb24gfCBudWxsID0gbnVsbFxuXHRcdFx0c3dpdGNoIChjYXRlZ29yeSkge1xuXHRcdFx0XHRjYXNlIFNlYXJjaENhdGVnb3J5VHlwZXMubWFpbDpcblx0XHRcdFx0XHRsYXRlc3RSZXN0cmljdGlvbiA9IHRoaXMubGF0ZXN0TWFpbFJlc3RyaWN0aW9uXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0Y2FzZSBTZWFyY2hDYXRlZ29yeVR5cGVzLmNhbGVuZGFyOlxuXHRcdFx0XHRcdGxhdGVzdFJlc3RyaWN0aW9uID0gdGhpcy5sYXRlc3RDYWxlbmRhclJlc3RyaWN0aW9uXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0Y2FzZSBTZWFyY2hDYXRlZ29yeVR5cGVzLmNvbnRhY3Q6XG5cdFx0XHRcdFx0Ly8gY29udGFjdHMgZG8gbm90IGhhdmUgcmVzdHJpY3Rpb25zIGF0IHRoaXMgdGltZVxuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHR9XG5cblx0XHRcdGlmIChsYXRlc3RSZXN0cmljdGlvbikge1xuXHRcdFx0XHRyZXR1cm4gZ2V0U2VhcmNoVXJsKHRoaXMuY3VycmVudFF1ZXJ5LCBsYXRlc3RSZXN0cmljdGlvbilcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBnZXRTZWFyY2hVcmwodGhpcy5jdXJyZW50UXVlcnksIGNyZWF0ZVJlc3RyaWN0aW9uKGNhdGVnb3J5LCBudWxsLCBudWxsLCBudWxsLCBbXSwgbnVsbCkpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBnZXRTZWFyY2hVcmwoXCJcIiwgY3JlYXRlUmVzdHJpY3Rpb24oY2F0ZWdvcnksIG51bGwsIG51bGwsIG51bGwsIFtdLCBudWxsKSlcblx0XHR9XG5cdH1cblxuXHRnZXQgbWFpbEZpbHRlcigpOiBNYWlsRmlsdGVyVHlwZSB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLm1haWxGaWx0ZXJUeXBlXG5cdH1cblxuXHRzZXRNYWlsRmlsdGVyKGZpbHRlcjogTWFpbEZpbHRlclR5cGUgfCBudWxsKSB7XG5cdFx0dGhpcy5tYWlsRmlsdGVyVHlwZSA9IGZpbHRlclxuXHRcdHRoaXMuYXBwbHlNYWlsRmlsdGVySWZOZWVkZWQoKVxuXHR9XG5cblx0cHJpdmF0ZSBhcHBseU1haWxGaWx0ZXJJZk5lZWRlZCgpIHtcblx0XHRpZiAoaXNTYW1lVHlwZVJlZih0aGlzLnNlYXJjaGVkVHlwZSwgTWFpbFR5cGVSZWYpKSB7XG5cdFx0XHRjb25zdCBmaWx0ZXJGdW5jdGlvbiA9IGdldE1haWxGaWx0ZXJGb3JUeXBlKHRoaXMubWFpbEZpbHRlclR5cGUpXG5cdFx0XHRjb25zdCBsaWZ0ZWRGaWx0ZXI6IExpc3RGaWx0ZXI8U2VhcmNoUmVzdWx0TGlzdEVudHJ5PiB8IG51bGwgPSBmaWx0ZXJGdW5jdGlvbiA/IChlbnRyeSkgPT4gZmlsdGVyRnVuY3Rpb24oZW50cnkuZW50cnkgYXMgTWFpbCkgOiBudWxsXG5cdFx0XHR0aGlzLl9saXN0TW9kZWw/LnNldEZpbHRlcihsaWZ0ZWRGaWx0ZXIpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSB1cGRhdGVTZWFyY2hVcmwoKSB7XG5cdFx0Y29uc3Qgc2VsZWN0ZWRFbGVtZW50ID0gdGhpcy5fbGlzdE1vZGVsLnN0YXRlLnNlbGVjdGVkSXRlbXMuc2l6ZSA9PT0gMSA/IHRoaXMuX2xpc3RNb2RlbC5nZXRTZWxlY3RlZEFzQXJyYXkoKS5hdCgwKSA6IG51bGxcblxuXHRcdGlmIChpc1NhbWVUeXBlUmVmKHRoaXMuc2VhcmNoZWRUeXBlLCBNYWlsVHlwZVJlZikpIHtcblx0XHRcdHRoaXMucm91dGVNYWlsKFxuXHRcdFx0XHQoc2VsZWN0ZWRFbGVtZW50Py5lbnRyeSBhcyBNYWlsKSA/PyBudWxsLFxuXHRcdFx0XHRjcmVhdGVSZXN0cmljdGlvbihcblx0XHRcdFx0XHR0aGlzLmdldENhdGVnb3J5KCksXG5cdFx0XHRcdFx0dGhpcy5fZW5kRGF0ZSA/IGdldEVuZE9mRGF5KHRoaXMuX2VuZERhdGUpLmdldFRpbWUoKSA6IG51bGwsXG5cdFx0XHRcdFx0dGhpcy5fc3RhcnREYXRlID8gZ2V0U3RhcnRPZkRheSh0aGlzLl9zdGFydERhdGUpLmdldFRpbWUoKSA6IG51bGwsXG5cdFx0XHRcdFx0dGhpcy5fc2VsZWN0ZWRNYWlsRmllbGQsXG5cdFx0XHRcdFx0dGhpcy5fc2VsZWN0ZWRNYWlsRm9sZGVyLFxuXHRcdFx0XHRcdG51bGwsXG5cdFx0XHRcdCksXG5cdFx0XHQpXG5cdFx0fSBlbHNlIGlmIChpc1NhbWVUeXBlUmVmKHRoaXMuc2VhcmNoZWRUeXBlLCBDYWxlbmRhckV2ZW50VHlwZVJlZikpIHtcblx0XHRcdHRoaXMucm91dGVDYWxlbmRhcihcblx0XHRcdFx0KHNlbGVjdGVkRWxlbWVudD8uZW50cnkgYXMgQ2FsZW5kYXJFdmVudCkgPz8gbnVsbCxcblx0XHRcdFx0Y3JlYXRlUmVzdHJpY3Rpb24oXG5cdFx0XHRcdFx0dGhpcy5nZXRDYXRlZ29yeSgpLFxuXHRcdFx0XHRcdHRoaXMuX3N0YXJ0RGF0ZSA/IGdldFN0YXJ0T2ZEYXkodGhpcy5fc3RhcnREYXRlKS5nZXRUaW1lKCkgOiBudWxsLFxuXHRcdFx0XHRcdHRoaXMuX2VuZERhdGUgPyBnZXRFbmRPZkRheSh0aGlzLl9lbmREYXRlKS5nZXRUaW1lKCkgOiBudWxsLFxuXHRcdFx0XHRcdG51bGwsXG5cdFx0XHRcdFx0dGhpcy5nZXRGb2xkZXJJZHMoKSxcblx0XHRcdFx0XHR0aGlzLl9pbmNsdWRlUmVwZWF0aW5nRXZlbnRzLFxuXHRcdFx0XHQpLFxuXHRcdFx0KVxuXHRcdH0gZWxzZSBpZiAoaXNTYW1lVHlwZVJlZih0aGlzLnNlYXJjaGVkVHlwZSwgQ29udGFjdFR5cGVSZWYpKSB7XG5cdFx0XHR0aGlzLnJvdXRlQ29udGFjdCgoc2VsZWN0ZWRFbGVtZW50Py5lbnRyeSBhcyBDb250YWN0KSA/PyBudWxsLCBjcmVhdGVSZXN0cmljdGlvbih0aGlzLmdldENhdGVnb3J5KCksIG51bGwsIG51bGwsIG51bGwsIFtdLCBudWxsKSlcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGdldEZvbGRlcklkcygpIHtcblx0XHRpZiAodHlwZW9mIHRoaXMuc2VsZWN0ZWRDYWxlbmRhciA9PT0gXCJzdHJpbmdcIikge1xuXHRcdFx0cmV0dXJuIFt0aGlzLnNlbGVjdGVkQ2FsZW5kYXJdXG5cdFx0fSBlbHNlIGlmICh0aGlzLnNlbGVjdGVkQ2FsZW5kYXIgIT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIFsuLi50aGlzLnNlbGVjdGVkQ2FsZW5kYXJdXG5cdFx0fVxuXG5cdFx0cmV0dXJuIFtdXG5cdH1cblxuXHRwcml2YXRlIHJvdXRlQ2FsZW5kYXIoZWxlbWVudDogQ2FsZW5kYXJFdmVudCB8IG51bGwsIHJlc3RyaWN0aW9uOiBTZWFyY2hSZXN0cmljdGlvbikge1xuXHRcdGNvbnN0IHNlbGVjdGlvbktleSA9IHRoaXMuZ2VuZXJhdGVTZWxlY3Rpb25LZXkoZWxlbWVudClcblx0XHR0aGlzLnJvdXRlci5yb3V0ZVRvKHRoaXMuY3VycmVudFF1ZXJ5LCByZXN0cmljdGlvbiwgc2VsZWN0aW9uS2V5KVxuXHR9XG5cblx0cHJpdmF0ZSByb3V0ZU1haWwoZWxlbWVudDogTWFpbCB8IG51bGwsIHJlc3RyaWN0aW9uOiBTZWFyY2hSZXN0cmljdGlvbikge1xuXHRcdHRoaXMucm91dGVyLnJvdXRlVG8odGhpcy5jdXJyZW50UXVlcnksIHJlc3RyaWN0aW9uLCB0aGlzLmdlbmVyYXRlU2VsZWN0aW9uS2V5KGVsZW1lbnQpKVxuXHR9XG5cblx0cHJpdmF0ZSByb3V0ZUNvbnRhY3QoZWxlbWVudDogQ29udGFjdCB8IG51bGwsIHJlc3RyaWN0aW9uOiBTZWFyY2hSZXN0cmljdGlvbikge1xuXHRcdHRoaXMucm91dGVyLnJvdXRlVG8odGhpcy5jdXJyZW50UXVlcnksIHJlc3RyaWN0aW9uLCB0aGlzLmdlbmVyYXRlU2VsZWN0aW9uS2V5KGVsZW1lbnQpKVxuXHR9XG5cblx0cHJpdmF0ZSBnZW5lcmF0ZVNlbGVjdGlvbktleShlbGVtZW50OiBTZWFyY2hhYmxlVHlwZXMgfCBudWxsKTogc3RyaW5nIHwgbnVsbCB7XG5cdFx0aWYgKGVsZW1lbnQgPT0gbnVsbCkgcmV0dXJuIG51bGxcblx0XHRpZiAoYXNzZXJ0SXNFbnRpdHkoZWxlbWVudCwgQ2FsZW5kYXJFdmVudFR5cGVSZWYpKSB7XG5cdFx0XHRyZXR1cm4gZW5jb2RlQ2FsZW5kYXJTZWFyY2hLZXkoZWxlbWVudClcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGdldEVsZW1lbnRJZChlbGVtZW50KVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgZ2V0Q2F0ZWdvcnkoKTogU2VhcmNoQ2F0ZWdvcnlUeXBlcyB7XG5cdFx0Y29uc3QgcmVzdHJpY3Rpb24gPSB0aGlzLnJvdXRlci5nZXRSZXN0cmljdGlvbigpXG5cdFx0cmV0dXJuIHNlYXJjaENhdGVnb3J5Rm9yUmVzdHJpY3Rpb24ocmVzdHJpY3Rpb24pXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIG9uTWFpbGJveGVzQ2hhbmdlZChtYWlsYm94ZXM6IE1haWxib3hEZXRhaWxbXSkge1xuXHRcdHRoaXMuX21haWxib3hlcyA9IG1haWxib3hlc1xuXG5cdFx0Ly8gaWYgc2VsZWN0ZWQgZm9sZGVyIG5vIGxvbmdlciBleGlzdCBzZWxlY3QgYW5vdGhlciBvbmVcblx0XHRjb25zdCBzZWxlY3RlZE1haWxGb2xkZXIgPSB0aGlzLl9zZWxlY3RlZE1haWxGb2xkZXJcblxuXHRcdGlmIChzZWxlY3RlZE1haWxGb2xkZXJbMF0pIHtcblx0XHRcdGNvbnN0IG1haWxGb2xkZXIgPSBhd2FpdCBtYWlsTG9jYXRvci5tYWlsTW9kZWwuZ2V0TWFpbFNldEJ5SWQoc2VsZWN0ZWRNYWlsRm9sZGVyWzBdKVxuXHRcdFx0aWYgKCFtYWlsRm9sZGVyKSB7XG5cdFx0XHRcdGNvbnN0IGZvbGRlclN5c3RlbSA9IGFzc2VydE5vdE51bGwobWFpbExvY2F0b3IubWFpbE1vZGVsLmdldEZvbGRlclN5c3RlbUJ5R3JvdXBJZChtYWlsYm94ZXNbMF0ubWFpbEdyb3VwLl9pZCkpXG5cdFx0XHRcdHRoaXMuX3NlbGVjdGVkTWFpbEZvbGRlciA9IFtnZXRFbGVtZW50SWQoYXNzZXJ0Tm90TnVsbChmb2xkZXJTeXN0ZW0uZ2V0U3lzdGVtRm9sZGVyQnlUeXBlKE1haWxTZXRLaW5kLklOQk9YKSkpXVxuXHRcdFx0XHR0aGlzLnVwZGF0ZVVpKClcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGlzUG9zc2libGVBQmlydGhkYXlDb250YWN0VXBkYXRlKHVwZGF0ZTogRW50aXR5VXBkYXRlRGF0YSk6IGJvb2xlYW4ge1xuXHRcdGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoQ29udGFjdFR5cGVSZWYsIHVwZGF0ZSkgJiYgaXNTYW1lVHlwZVJlZih0aGlzLnNlYXJjaGVkVHlwZSwgQ2FsZW5kYXJFdmVudFR5cGVSZWYpKSB7XG5cdFx0XHRjb25zdCB7IGluc3RhbmNlTGlzdElkLCBpbnN0YW5jZUlkIH0gPSB1cGRhdGVcblx0XHRcdGNvbnN0IGVuY29kZWRDb250YWN0SWQgPSBzdHJpbmdUb0Jhc2U2NChgJHtpbnN0YW5jZUxpc3RJZH0vJHtpbnN0YW5jZUlkfWApXG5cblx0XHRcdHJldHVybiB0aGlzLmxpc3RNb2RlbC5zdGF0ZVN0cmVhbSgpLml0ZW1zLnNvbWUoKHNlYXJjaEVudHJ5KSA9PiBzZWFyY2hFbnRyeS5faWRbMV0uZW5kc1dpdGgoZW5jb2RlZENvbnRhY3RJZCkpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHRwcml2YXRlIGlzU2VsZWN0ZWRFdmVudEFuVXBkYXRlZEJpcnRoZGF5KHVwZGF0ZTogRW50aXR5VXBkYXRlRGF0YSk6IGJvb2xlYW4ge1xuXHRcdGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoQ29udGFjdFR5cGVSZWYsIHVwZGF0ZSkgJiYgaXNTYW1lVHlwZVJlZih0aGlzLnNlYXJjaGVkVHlwZSwgQ2FsZW5kYXJFdmVudFR5cGVSZWYpKSB7XG5cdFx0XHRjb25zdCB7IGluc3RhbmNlTGlzdElkLCBpbnN0YW5jZUlkIH0gPSB1cGRhdGVcblx0XHRcdGNvbnN0IGVuY29kZWRDb250YWN0SWQgPSBzdHJpbmdUb0Jhc2U2NChgJHtpbnN0YW5jZUxpc3RJZH0vJHtpbnN0YW5jZUlkfWApXG5cblx0XHRcdGNvbnN0IHNlbGVjdGVkSXRlbSA9IHRoaXMubGlzdE1vZGVsLmdldFNlbGVjdGVkQXNBcnJheSgpLmF0KDApXG5cdFx0XHRpZiAoIXNlbGVjdGVkSXRlbSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHNlbGVjdGVkSXRlbS5faWRbMV0uZW5kc1dpdGgoZW5jb2RlZENvbnRhY3RJZClcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2Vcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZW50aXR5RXZlbnRSZWNlaXZlZCh1cGRhdGU6IEVudGl0eVVwZGF0ZURhdGEpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBsYXN0VHlwZSA9IHRoaXMuc2VhcmNoZWRUeXBlXG5cdFx0Y29uc3QgaXNQb3NzaWJsZUFCaXJ0aGRheUNvbnRhY3RVcGRhdGUgPSB0aGlzLmlzUG9zc2libGVBQmlydGhkYXlDb250YWN0VXBkYXRlKHVwZGF0ZSlcblxuXHRcdGlmICghaXNVcGRhdGVGb3JUeXBlUmVmKGxhc3RUeXBlLCB1cGRhdGUpICYmICFpc1Bvc3NpYmxlQUJpcnRoZGF5Q29udGFjdFVwZGF0ZSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Y29uc3QgeyBpbnN0YW5jZUxpc3RJZCwgaW5zdGFuY2VJZCwgb3BlcmF0aW9uIH0gPSB1cGRhdGVcblx0XHRjb25zdCBpZCA9IFtuZXZlck51bGwoaW5zdGFuY2VMaXN0SWQpLCBpbnN0YW5jZUlkXSBhcyBjb25zdFxuXHRcdGNvbnN0IHR5cGVSZWYgPSBuZXcgVHlwZVJlZjxTb21lRW50aXR5Pih1cGRhdGUuYXBwbGljYXRpb24sIHVwZGF0ZS50eXBlKVxuXG5cdFx0aWYgKCF0aGlzLmlzSW5TZWFyY2hSZXN1bHQodHlwZVJlZiwgaWQpICYmICFpc1Bvc3NpYmxlQUJpcnRoZGF5Q29udGFjdFVwZGF0ZSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0aWYgKGlzVXBkYXRlRm9yVHlwZVJlZihNYWlsVHlwZVJlZiwgdXBkYXRlKSAmJiBvcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuVVBEQVRFKSB7XG5cdFx0XHRpZiAodGhpcy5zZWFyY2hSZXN1bHQgJiYgdGhpcy5zZWFyY2hSZXN1bHQucmVzdWx0cykge1xuXHRcdFx0XHRjb25zdCBpbmRleCA9IHRoaXMuc2VhcmNoUmVzdWx0Py5yZXN1bHRzLmZpbmRJbmRleChcblx0XHRcdFx0XHQoZW1haWwpID0+IHVwZGF0ZS5pbnN0YW5jZUlkID09PSBlbGVtZW50SWRQYXJ0KGVtYWlsKSAmJiB1cGRhdGUuaW5zdGFuY2VMaXN0SWQgIT09IGxpc3RJZFBhcnQoZW1haWwpLFxuXHRcdFx0XHQpXG5cdFx0XHRcdGlmIChpbmRleCA+PSAwKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdHJpY3Rpb25MZW5ndGggPSB0aGlzLnNlYXJjaFJlc3VsdC5yZXN0cmljdGlvbi5mb2xkZXJJZHMubGVuZ3RoXG5cdFx0XHRcdFx0aWYgKChyZXN0cmljdGlvbkxlbmd0aCA+IDAgJiYgdGhpcy5zZWFyY2hSZXN1bHQucmVzdHJpY3Rpb24uZm9sZGVySWRzLmluY2x1ZGVzKHVwZGF0ZS5pbnN0YW5jZUxpc3RJZCkpIHx8IHJlc3RyaWN0aW9uTGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0XHQvLyBXZSBuZWVkIHRvIHVwZGF0ZSB0aGUgbGlzdElkIG9mIHRoZSB1cGRhdGVkIGl0ZW0sIHNpbmNlIGl0IHdhcyBtb3ZlZCB0byBhbm90aGVyIGZvbGRlci5cblx0XHRcdFx0XHRcdGNvbnN0IG5ld0lkVHVwbGU6IElkVHVwbGUgPSBbdXBkYXRlLmluc3RhbmNlTGlzdElkLCB1cGRhdGUuaW5zdGFuY2VJZF1cblx0XHRcdFx0XHRcdHRoaXMuc2VhcmNoUmVzdWx0LnJlc3VsdHNbaW5kZXhdID0gbmV3SWRUdXBsZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoKGlzVXBkYXRlRm9yVHlwZVJlZihDYWxlbmRhckV2ZW50VHlwZVJlZiwgdXBkYXRlKSAmJiBpc1NhbWVUeXBlUmVmKGxhc3RUeXBlLCBDYWxlbmRhckV2ZW50VHlwZVJlZikpIHx8IGlzUG9zc2libGVBQmlydGhkYXlDb250YWN0VXBkYXRlKSB7XG5cdFx0XHQvLyBkdWUgdG8gdGhlIHdheSBjYWxlbmRhciBldmVudCBjaGFuZ2VzIGFyZSBzb3J0IG9mIG5vbi1sb2NhbCwgd2UgdGhyb3cgYXdheSB0aGUgd2hvbGUgbGlzdCBhbmQgcmUtcmVuZGVyIGl0IGlmXG5cdFx0XHQvLyB0aGUgY29udGVudHMgYXJlIGVkaXRlZC4gd2UgZG8gdGhlIGNhbGN1bGF0aW9uIG9uIGEgbmV3IGxpc3QgYW5kIHRoZW4gc3dhcCB0aGUgb2xkIGxpc3Qgb3V0IG9uY2UgdGhlIG5ldyBvbmUgaXNcblx0XHRcdC8vIHJlYWR5XG5cdFx0XHRjb25zdCBzZWxlY3RlZEl0ZW0gPSB0aGlzLl9saXN0TW9kZWwuZ2V0U2VsZWN0ZWRBc0FycmF5KCkuYXQoMClcblx0XHRcdGNvbnN0IGxpc3RNb2RlbCA9IHRoaXMuY3JlYXRlTGlzdCgpXG5cdFx0XHR0aGlzLnNldE1haWxGaWx0ZXIodGhpcy5tYWlsRmlsdGVyVHlwZSlcblx0XHRcdHRoaXMuYXBwbHlNYWlsRmlsdGVySWZOZWVkZWQoKVxuXG5cdFx0XHRpZiAoaXNQb3NzaWJsZUFCaXJ0aGRheUNvbnRhY3RVcGRhdGUgJiYgKGF3YWl0IHRoaXMuZXZlbnRzUmVwb3NpdG9yeS5jYW5Mb2FkQmlydGhkYXlzQ2FsZW5kYXIoKSkpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5ldmVudHNSZXBvc2l0b3J5LmxvYWRDb250YWN0c0JpcnRoZGF5cyh0cnVlKVxuXHRcdFx0fVxuXG5cdFx0XHRhd2FpdCBsaXN0TW9kZWwubG9hZEluaXRpYWwoKVxuXHRcdFx0aWYgKHNlbGVjdGVkSXRlbSAhPSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc1Bvc3NpYmxlQUJpcnRoZGF5Q29udGFjdFVwZGF0ZSAmJiB0aGlzLmlzU2VsZWN0ZWRFdmVudEFuVXBkYXRlZEJpcnRoZGF5KHVwZGF0ZSkpIHtcblx0XHRcdFx0XHQvLyBXZSBtdXN0IGludmFsaWRhdGUgdGhlIHNlbGVjdGVkIGl0ZW0gdG8gcmVmcmVzaCB0aGUgY29udGFjdCBwcmV2aWV3XG5cdFx0XHRcdFx0dGhpcy5saXN0TW9kZWwuc2VsZWN0Tm9uZSgpXG5cdFx0XHRcdH1cblx0XHRcdFx0YXdhaXQgbGlzdE1vZGVsLmxvYWRBbmRTZWxlY3QoZWxlbWVudElkUGFydChzZWxlY3RlZEl0ZW0uX2lkKSwgKCkgPT4gZmFsc2UpXG5cdFx0XHR9XG5cdFx0XHR0aGlzLl9saXN0TW9kZWwgPSBsaXN0TW9kZWxcblx0XHRcdHRoaXMubGlzdFN0YXRlU3Vic2NyaXB0aW9uPy5lbmQodHJ1ZSlcblx0XHRcdHRoaXMubGlzdFN0YXRlU3Vic2NyaXB0aW9uID0gdGhpcy5fbGlzdE1vZGVsLnN0YXRlU3RyZWFtLm1hcCgoc3RhdGUpID0+IHRoaXMub25MaXN0U3RhdGVDaGFuZ2Uoc3RhdGUpKVxuXHRcdFx0dGhpcy51cGRhdGVTZWFyY2hVcmwoKVxuXHRcdFx0dGhpcy51cGRhdGVVaSgpXG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHR0aGlzLl9saXN0TW9kZWwuZ2V0VW5maWx0ZXJlZEFzQXJyYXkoKVxuXHRcdGF3YWl0IHRoaXMuX2xpc3RNb2RlbC5lbnRpdHlFdmVudFJlY2VpdmVkKGluc3RhbmNlTGlzdElkLCBpbnN0YW5jZUlkLCBvcGVyYXRpb24pXG5cdFx0Ly8gcnVuIHRoZSBtYWlsIG9yIGNvbnRhY3QgdXBkYXRlIGFmdGVyIHRoZSB1cGRhdGUgb24gdGhlIGxpc3QgaXMgZmluaXNoZWQgdG8gYXZvaWQgcGFyYWxsZWwgbG9hZGluZ1xuXHRcdGlmIChvcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuVVBEQVRFICYmIHRoaXMuX2xpc3RNb2RlbD8uaXNJdGVtU2VsZWN0ZWQoZWxlbWVudElkUGFydChpZCkpKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKHR5cGVSZWYsIGlkKVxuXHRcdFx0XHR0aGlzLnVwZGF0ZVVpKClcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0Ly8gaWdub3JlLiBtaWdodCBoYXBwZW4gaWYgYSBtYWlsIHdhcyBqdXN0IHNlbnRcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRnZXRTZWxlY3RlZE1haWxzKCk6IE1haWxbXSB7XG5cdFx0cmV0dXJuIHRoaXMuX2xpc3RNb2RlbFxuXHRcdFx0LmdldFNlbGVjdGVkQXNBcnJheSgpXG5cdFx0XHQubWFwKChlKSA9PiBlLmVudHJ5KVxuXHRcdFx0LmZpbHRlcihhc3NlcnRJc0VudGl0eTIoTWFpbFR5cGVSZWYpKVxuXHR9XG5cblx0Z2V0U2VsZWN0ZWRDb250YWN0cygpOiBDb250YWN0W10ge1xuXHRcdHJldHVybiB0aGlzLl9saXN0TW9kZWxcblx0XHRcdC5nZXRTZWxlY3RlZEFzQXJyYXkoKVxuXHRcdFx0Lm1hcCgoZSkgPT4gZS5lbnRyeSlcblx0XHRcdC5maWx0ZXIoYXNzZXJ0SXNFbnRpdHkyKENvbnRhY3RUeXBlUmVmKSlcblx0fVxuXG5cdGdldFNlbGVjdGVkRXZlbnRzKCk6IENhbGVuZGFyRXZlbnRbXSB7XG5cdFx0cmV0dXJuIHRoaXMuX2xpc3RNb2RlbFxuXHRcdFx0LmdldFNlbGVjdGVkQXNBcnJheSgpXG5cdFx0XHQubWFwKChlKSA9PiBlLmVudHJ5KVxuXHRcdFx0LmZpbHRlcihhc3NlcnRJc0VudGl0eTIoQ2FsZW5kYXJFdmVudFR5cGVSZWYpKVxuXHR9XG5cblx0cHJpdmF0ZSBvbkxpc3RTdGF0ZUNoYW5nZShuZXdTdGF0ZTogTGlzdFN0YXRlPFNlYXJjaFJlc3VsdExpc3RFbnRyeT4pIHtcblx0XHRpZiAoaXNTYW1lVHlwZVJlZih0aGlzLnNlYXJjaGVkVHlwZSwgTWFpbFR5cGVSZWYpKSB7XG5cdFx0XHRpZiAoIW5ld1N0YXRlLmluTXVsdGlzZWxlY3QgJiYgbmV3U3RhdGUuc2VsZWN0ZWRJdGVtcy5zaXplID09PSAxKSB7XG5cdFx0XHRcdGNvbnN0IG1haWwgPSB0aGlzLmdldFNlbGVjdGVkTWFpbHMoKVswXVxuXG5cdFx0XHRcdC8vIFNvbWV0aW1lcyBhIHN0YWxlIHN0YXRlIGlzIHBhc3NlZCB0aHJvdWdoLCByZXN1bHRpbmcgaW4gbm8gbWFpbFxuXHRcdFx0XHRpZiAobWFpbCkge1xuXHRcdFx0XHRcdGlmICghdGhpcy5fY29udmVyc2F0aW9uVmlld01vZGVsKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnVwZGF0ZURpc3BsYXllZENvbnZlcnNhdGlvbihtYWlsKVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAodGhpcy5fY29udmVyc2F0aW9uVmlld01vZGVsKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBpc1NhbWVFbGVtZW50SWQgPSBpc1NhbWVJZChlbGVtZW50SWRQYXJ0KHRoaXMuX2NvbnZlcnNhdGlvblZpZXdNb2RlbD8ucHJpbWFyeU1haWwuX2lkKSwgZWxlbWVudElkUGFydChtYWlsLl9pZCkpXG5cdFx0XHRcdFx0XHRjb25zdCBpc1NhbWVMaXN0SWQgPSBpc1NhbWVJZChsaXN0SWRQYXJ0KHRoaXMuX2NvbnZlcnNhdGlvblZpZXdNb2RlbD8ucHJpbWFyeU1haWwuX2lkKSwgbGlzdElkUGFydChtYWlsLl9pZCkpXG5cdFx0XHRcdFx0XHRpZiAoIWlzU2FtZUVsZW1lbnRJZCB8fCAhaXNTYW1lTGlzdElkKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMudXBkYXRlU2VhcmNoVXJsKClcblx0XHRcdFx0XHRcdFx0dGhpcy51cGRhdGVEaXNwbGF5ZWRDb252ZXJzYXRpb24obWFpbClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5fY29udmVyc2F0aW9uVmlld01vZGVsID0gbnVsbFxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLl9jb252ZXJzYXRpb25WaWV3TW9kZWwgPSBudWxsXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuX2NvbnZlcnNhdGlvblZpZXdNb2RlbCA9IG51bGxcblx0XHR9XG5cdFx0dGhpcy51cGRhdGVVaSgpXG5cdH1cblxuXHRwcml2YXRlIHVwZGF0ZURpc3BsYXllZENvbnZlcnNhdGlvbihtYWlsOiBNYWlsKTogdm9pZCB7XG5cdFx0aWYgKHRoaXMuY29udmVyc2F0aW9uVmlld01vZGVsRmFjdG9yeSAmJiB0aGlzLm1haWxPcGVuZWRMaXN0ZW5lcikge1xuXHRcdFx0dGhpcy5fY29udmVyc2F0aW9uVmlld01vZGVsID0gdGhpcy5jb252ZXJzYXRpb25WaWV3TW9kZWxGYWN0b3J5KHsgbWFpbCwgc2hvd0ZvbGRlcjogdHJ1ZSB9KVxuXHRcdFx0Ly8gTm90aWZ5IHRoZSBhZG1pbiBjbGllbnQgYWJvdXQgdGhlIG1haWwgYmVpbmcgc2VsZWN0ZWRcblx0XHRcdHRoaXMubWFpbE9wZW5lZExpc3RlbmVyLm9uRW1haWxPcGVuZWQobWFpbClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGNyZWF0ZUxpc3QoKTogTGlzdEVsZW1lbnRMaXN0TW9kZWw8U2VhcmNoUmVzdWx0TGlzdEVudHJ5PiB7XG5cdFx0Ly8gc2luY2Ugd2UgcmVjcmVhdGUgdGhlIGxpc3QgZXZlcnkgdGltZSB3ZSBzZXQgYSBuZXcgcmVzdWx0IG9iamVjdCxcblx0XHQvLyB3ZSBiaW5kIHRoZSB2YWx1ZSBvZiByZXN1bHQgZm9yIHRoZSBsaWZldGltZSBvZiB0aGlzIGxpc3QgbW9kZWxcblx0XHQvLyBhdCB0aGlzIHBvaW50XG5cdFx0Ly8gbm90ZSBpbiBjYXNlIG9mIHJlZmFjdG9yOiB0aGUgZmFjdCB0aGF0IHRoZSBsaXN0IHVwZGF0ZXMgdGhlIFVSTCBldmVyeSB0aW1lIGl0IGNoYW5nZXNcblx0XHQvLyBpdHMgc3RhdGUgaXMgYSBtYWpvciBzb3VyY2Ugb2YgY29tcGxleGl0eSBhbmQgbWFrZXMgZXZlcnl0aGluZyB2ZXJ5IG9yZGVyLWRlcGVuZGVudFxuXHRcdHJldHVybiBuZXcgTGlzdEVsZW1lbnRMaXN0TW9kZWw8U2VhcmNoUmVzdWx0TGlzdEVudHJ5Pih7XG5cdFx0XHRmZXRjaDogYXN5bmMgKGxhc3RGZXRjaGVkRW50aXR5OiBTZWFyY2hSZXN1bHRMaXN0RW50cnksIGNvdW50OiBudW1iZXIpID0+IHtcblx0XHRcdFx0Y29uc3Qgc3RhcnRJZCA9IGxhc3RGZXRjaGVkRW50aXR5ID09IG51bGwgPyBHRU5FUkFURURfTUFYX0lEIDogZ2V0RWxlbWVudElkKGxhc3RGZXRjaGVkRW50aXR5KVxuXG5cdFx0XHRcdGNvbnN0IGxhc3RSZXN1bHQgPSB0aGlzLnNlYXJjaFJlc3VsdFxuXHRcdFx0XHRpZiAobGFzdFJlc3VsdCAhPT0gdGhpcy5zZWFyY2hSZXN1bHQpIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oXCJnb3QgYSBmZXRjaCByZXF1ZXN0IGZvciBvdXRkYXRlZCByZXN1bHRzIG9iamVjdCwgaWdub3JpbmdcIilcblx0XHRcdFx0XHQvLyB0aGlzLl9zZWFyY2hSZXN1bHRzIHdhcyByZWFzc2lnbmVkLCB3ZSdsbCBjcmVhdGUgYSBuZXcgTGlzdEVsZW1lbnRMaXN0TW9kZWwgc29vblxuXHRcdFx0XHRcdHJldHVybiB7IGl0ZW1zOiBbXSwgY29tcGxldGU6IHRydWUgfVxuXHRcdFx0XHR9XG5cdFx0XHRcdGF3YWl0IGF3YWl0U2VhcmNoSW5pdGlhbGl6ZWQodGhpcy5zZWFyY2gpXG5cblx0XHRcdFx0aWYgKCFsYXN0UmVzdWx0IHx8IChsYXN0UmVzdWx0LnJlc3VsdHMubGVuZ3RoID09PSAwICYmICFoYXNNb3JlUmVzdWx0cyhsYXN0UmVzdWx0KSkpIHtcblx0XHRcdFx0XHRyZXR1cm4geyBpdGVtczogW10sIGNvbXBsZXRlOiB0cnVlIH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHsgaXRlbXMsIG5ld1NlYXJjaFJlc3VsdCB9ID0gYXdhaXQgdGhpcy5sb2FkU2VhcmNoUmVzdWx0cyhsYXN0UmVzdWx0LCBzdGFydElkLCBjb3VudClcblx0XHRcdFx0Y29uc3QgZW50cmllcyA9IGl0ZW1zLm1hcCgoaW5zdGFuY2UpID0+IG5ldyBTZWFyY2hSZXN1bHRMaXN0RW50cnkoaW5zdGFuY2UpKVxuXHRcdFx0XHRjb25zdCBjb21wbGV0ZSA9ICFoYXNNb3JlUmVzdWx0cyhuZXdTZWFyY2hSZXN1bHQpXG5cblx0XHRcdFx0cmV0dXJuIHsgaXRlbXM6IGVudHJpZXMsIGNvbXBsZXRlIH1cblx0XHRcdH0sXG5cdFx0XHRsb2FkU2luZ2xlOiBhc3luYyAoX2xpc3RJZDogSWQsIGVsZW1lbnRJZDogSWQpID0+IHtcblx0XHRcdFx0Y29uc3QgbGFzdFJlc3VsdCA9IHRoaXMuc2VhcmNoUmVzdWx0XG5cdFx0XHRcdGlmICghbGFzdFJlc3VsdCkge1xuXHRcdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3QgaWQgPSBsYXN0UmVzdWx0LnJlc3VsdHMuZmluZCgocmVzdWx0SWQpID0+IGVsZW1lbnRJZFBhcnQocmVzdWx0SWQpID09PSBlbGVtZW50SWQpXG5cdFx0XHRcdGlmIChpZCkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmVudGl0eUNsaWVudFxuXHRcdFx0XHRcdFx0LmxvYWQobGFzdFJlc3VsdC5yZXN0cmljdGlvbi50eXBlLCBpZClcblx0XHRcdFx0XHRcdC50aGVuKChlbnRpdHkpID0+IG5ldyBTZWFyY2hSZXN1bHRMaXN0RW50cnkoZW50aXR5KSlcblx0XHRcdFx0XHRcdC5jYXRjaChcblx0XHRcdFx0XHRcdFx0b2ZDbGFzcyhOb3RGb3VuZEVycm9yLCAoXykgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRzb3J0Q29tcGFyZTogKG8xOiBTZWFyY2hSZXN1bHRMaXN0RW50cnksIG8yOiBTZWFyY2hSZXN1bHRMaXN0RW50cnkpID0+IHtcblx0XHRcdFx0aWYgKGlzU2FtZVR5cGVSZWYobzEuZW50cnkuX3R5cGUsIENvbnRhY3RUeXBlUmVmKSkge1xuXHRcdFx0XHRcdHJldHVybiBjb21wYXJlQ29udGFjdHMobzEuZW50cnkgYXMgYW55LCBvMi5lbnRyeSBhcyBhbnkpXG5cdFx0XHRcdH0gZWxzZSBpZiAoaXNTYW1lVHlwZVJlZihvMS5lbnRyeS5fdHlwZSwgQ2FsZW5kYXJFdmVudFR5cGVSZWYpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRvd25jYXN0KG8xLmVudHJ5KS5zdGFydFRpbWUuZ2V0VGltZSgpIC0gZG93bmNhc3QobzIuZW50cnkpLnN0YXJ0VGltZS5nZXRUaW1lKClcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gc29ydENvbXBhcmVCeVJldmVyc2VJZChvMS5lbnRyeSwgbzIuZW50cnkpXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRhdXRvU2VsZWN0QmVoYXZpb3I6ICgpID0+IChpc1NhbWVUeXBlUmVmKHRoaXMuc2VhcmNoZWRUeXBlLCBNYWlsVHlwZVJlZikgPyB0aGlzLnNlbGVjdGlvbkJlaGF2aW9yIDogTGlzdEF1dG9TZWxlY3RCZWhhdmlvci5PTERFUiksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgaXNJblNlYXJjaFJlc3VsdCh0eXBlUmVmOiBUeXBlUmVmPHVua25vd24+LCBpZDogSWRUdXBsZSk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IHJlc3VsdCA9IHRoaXMuc2VhcmNoUmVzdWx0XG5cblx0XHRpZiAocmVzdWx0ICYmIGlzU2FtZVR5cGVSZWYodHlwZVJlZiwgcmVzdWx0LnJlc3RyaWN0aW9uLnR5cGUpKSB7XG5cdFx0XHQvLyBUaGUgbGlzdCBpZCBtdXN0IGJlIG51bGwvZW1wdHksIG90aGVyd2lzZSB0aGUgdXNlciBpcyBmaWx0ZXJpbmcgYnkgbGlzdCwgYW5kIGl0IHNob3VsZG4ndCBiZSBpZ25vcmVkXG5cblx0XHRcdGNvbnN0IGlnbm9yZUxpc3QgPSBpc1NhbWVUeXBlUmVmKHR5cGVSZWYsIE1haWxUeXBlUmVmKSAmJiByZXN1bHQucmVzdHJpY3Rpb24uZm9sZGVySWRzLmxlbmd0aCA9PT0gMFxuXG5cdFx0XHRyZXR1cm4gcmVzdWx0LnJlc3VsdHMuc29tZSgocikgPT4gdGhpcy5jb21wYXJlSXRlbUlkKHIsIGlkLCBpZ25vcmVMaXN0KSlcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2Vcblx0fVxuXG5cdHByaXZhdGUgY29tcGFyZUl0ZW1JZChpZDE6IElkVHVwbGUsIGlkMjogSWRUdXBsZSwgaWdub3JlTGlzdDogYm9vbGVhbikge1xuXHRcdHJldHVybiBpZ25vcmVMaXN0ID8gaXNTYW1lSWQoZWxlbWVudElkUGFydChpZDEpLCBlbGVtZW50SWRQYXJ0KGlkMikpIDogaXNTYW1lSWQoaWQxLCBpZDIpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGxvYWRTZWFyY2hSZXN1bHRzPFQgZXh0ZW5kcyBTZWFyY2hhYmxlVHlwZXM+KFxuXHRcdGN1cnJlbnRSZXN1bHQ6IFNlYXJjaFJlc3VsdCxcblx0XHRzdGFydElkOiBJZCxcblx0XHRjb3VudDogbnVtYmVyLFxuXHQpOiBQcm9taXNlPHsgaXRlbXM6IFRbXTsgbmV3U2VhcmNoUmVzdWx0OiBTZWFyY2hSZXN1bHQgfT4ge1xuXHRcdGNvbnN0IHVwZGF0ZWRSZXN1bHQgPSBoYXNNb3JlUmVzdWx0cyhjdXJyZW50UmVzdWx0KSA/IGF3YWl0IHRoaXMuc2VhcmNoRmFjYWRlLmdldE1vcmVTZWFyY2hSZXN1bHRzKGN1cnJlbnRSZXN1bHQsIGNvdW50KSA6IGN1cnJlbnRSZXN1bHRcblxuXHRcdC8vIHdlIG5lZWQgdG8gb3ZlcnJpZGUgZ2xvYmFsIHJlZmVyZW5jZSBmb3Igb3RoZXIgZnVuY3Rpb25zXG5cdFx0dGhpcy5zZWFyY2hSZXN1bHQgPSB1cGRhdGVkUmVzdWx0XG5cblx0XHRsZXQgaXRlbXNcblx0XHRpZiAoaXNTYW1lVHlwZVJlZihjdXJyZW50UmVzdWx0LnJlc3RyaWN0aW9uLnR5cGUsIE1haWxUeXBlUmVmKSkge1xuXHRcdFx0bGV0IHN0YXJ0SW5kZXggPSAwXG5cblx0XHRcdGlmIChzdGFydElkICE9PSBHRU5FUkFURURfTUFYX0lEKSB7XG5cdFx0XHRcdC8vIHRoaXMgcmVsaWVzIG9uIHRoZSByZXN1bHRzIGJlaW5nIHNvcnRlZCBmcm9tIG5ld2VzdCB0byBvbGRlc3QgSURcblx0XHRcdFx0c3RhcnRJbmRleCA9IHVwZGF0ZWRSZXN1bHQucmVzdWx0cy5maW5kSW5kZXgoKGlkKSA9PiBpZFsxXSA8PSBzdGFydElkKVxuXHRcdFx0XHRpZiAoZWxlbWVudElkUGFydCh1cGRhdGVkUmVzdWx0LnJlc3VsdHNbc3RhcnRJbmRleF0pID09PSBzdGFydElkKSB7XG5cdFx0XHRcdFx0Ly8gdGhlIHN0YXJ0IGVsZW1lbnQgaXMgYWxyZWFkeSBsb2FkZWQsIHNvIHdlIGV4Y2x1ZGUgaXQgZnJvbSB0aGUgbmV4dCBsb2FkXG5cdFx0XHRcdFx0c3RhcnRJbmRleCsrXG5cdFx0XHRcdH0gZWxzZSBpZiAoc3RhcnRJbmRleCA9PT0gLTEpIHtcblx0XHRcdFx0XHQvLyB0aGVyZSBpcyBub3RoaW5nIGluIG91ciByZXN1bHQgdGhhdCdzIG5vdCBsb2FkZWQgeWV0LCBzbyB3ZVxuXHRcdFx0XHRcdC8vIGhhdmUgbm90aGluZyB0byBkb1xuXHRcdFx0XHRcdHN0YXJ0SW5kZXggPSBNYXRoLm1heCh1cGRhdGVkUmVzdWx0LnJlc3VsdHMubGVuZ3RoIC0gMSwgMClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZ25vcmUgY291bnQgd2hlbiBzbGljaW5nIGhlcmUgYmVjYXVzZSB3ZSB3b3VsZCBoYXZlIHRvIG1vZGlmeSBTZWFyY2hSZXN1bHQgdG9vXG5cdFx0XHRjb25zdCB0b0xvYWQgPSB1cGRhdGVkUmVzdWx0LnJlc3VsdHMuc2xpY2Uoc3RhcnRJbmRleClcblx0XHRcdGl0ZW1zID0gYXdhaXQgdGhpcy5sb2FkQW5kRmlsdGVySW5zdGFuY2VzKGN1cnJlbnRSZXN1bHQucmVzdHJpY3Rpb24udHlwZSwgdG9Mb2FkLCB1cGRhdGVkUmVzdWx0LCBzdGFydEluZGV4KVxuXHRcdH0gZWxzZSBpZiAoaXNTYW1lVHlwZVJlZihjdXJyZW50UmVzdWx0LnJlc3RyaWN0aW9uLnR5cGUsIENvbnRhY3RUeXBlUmVmKSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Ly8gbG9hZCBhbGwgY29udGFjdHMgdG8gc29ydCB0aGVtIGJ5IG5hbWUgYWZ0ZXJ3YXJkc1xuXHRcdFx0XHRpdGVtcyA9IGF3YWl0IHRoaXMubG9hZEFuZEZpbHRlckluc3RhbmNlcyhjdXJyZW50UmVzdWx0LnJlc3RyaWN0aW9uLnR5cGUsIHVwZGF0ZWRSZXN1bHQucmVzdWx0cywgdXBkYXRlZFJlc3VsdCwgMClcblx0XHRcdH0gZmluYWxseSB7XG5cdFx0XHRcdHRoaXMudXBkYXRlVWkoKVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoaXNTYW1lVHlwZVJlZihjdXJyZW50UmVzdWx0LnJlc3RyaWN0aW9uLnR5cGUsIENhbGVuZGFyRXZlbnRUeXBlUmVmKSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgeyBzdGFydCwgZW5kIH0gPSBjdXJyZW50UmVzdWx0LnJlc3RyaWN0aW9uXG5cdFx0XHRcdGlmIChzdGFydCA9PSBudWxsIHx8IGVuZCA9PSBudWxsKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJpbnZhbGlkIHNlYXJjaCB0aW1lIHJhbmdlIGZvciBjYWxlbmRhclwiKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGl0ZW1zID0gW1xuXHRcdFx0XHRcdC4uLihhd2FpdCB0aGlzLmNhbGVuZGFyRmFjYWRlLnJlaWZ5Q2FsZW5kYXJTZWFyY2hSZXN1bHQoc3RhcnQsIGVuZCwgdXBkYXRlZFJlc3VsdC5yZXN1bHRzKSksXG5cdFx0XHRcdFx0Li4uKGF3YWl0IHRoaXMuZ2V0Q2xpZW50T25seUV2ZW50c1NlcmllcyhzdGFydCwgZW5kLCB1cGRhdGVkUmVzdWx0LnJlc3VsdHMpKSxcblx0XHRcdFx0XVxuXHRcdFx0fSBmaW5hbGx5IHtcblx0XHRcdFx0dGhpcy51cGRhdGVVaSgpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIHRoaXMgdHlwZSBpcyBub3Qgc2hvd24gaW4gdGhlIHNlYXJjaCB2aWV3LCBlLmcuIGdyb3VwIGluZm9cblx0XHRcdGl0ZW1zID0gW11cblx0XHR9XG5cblx0XHRyZXR1cm4geyBpdGVtczogaXRlbXMsIG5ld1NlYXJjaFJlc3VsdDogdXBkYXRlZFJlc3VsdCB9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGdldENsaWVudE9ubHlFdmVudHNTZXJpZXMoc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIsIGV2ZW50czogSWRUdXBsZVtdKSB7XG5cdFx0Y29uc3QgZXZlbnRMaXN0ID0gYXdhaXQgcmV0cmlldmVDbGllbnRPbmx5RXZlbnRzRm9yVXNlcih0aGlzLmxvZ2lucywgZXZlbnRzLCB0aGlzLmV2ZW50c1JlcG9zaXRvcnkuZ2V0QmlydGhkYXlFdmVudHMoKSlcblx0XHRyZXR1cm4gZ2VuZXJhdGVDYWxlbmRhckluc3RhbmNlc0luUmFuZ2UoZXZlbnRMaXN0LCB7IHN0YXJ0LCBlbmQgfSlcblx0fVxuXG5cdC8qKlxuXHQgKiB0YWtlIGEgbGlzdCBvZiBJRHMgYW5kIGxvYWQgdGhlbSBieSBsaXN0LCBmaWx0ZXJpbmcgb3V0IHRoZSBvbmVzIHRoYXQgY291bGQgbm90IGJlIGxvYWRlZC5cblx0ICogdXBkYXRlcyB0aGUgcGFzc2VkIGN1cnJlbnRSZXN1bHQucmVzdWx0IGxpc3QgdG8gbm90IGluY2x1ZGUgdGhlIGZhaWxlZCBJRHMgYW55bW9yZVxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBsb2FkQW5kRmlsdGVySW5zdGFuY2VzPFQgZXh0ZW5kcyBMaXN0RWxlbWVudEVudGl0eT4oXG5cdFx0dHlwZTogVHlwZVJlZjxUPixcblx0XHR0b0xvYWQ6IElkVHVwbGVbXSxcblx0XHRjdXJyZW50UmVzdWx0OiBTZWFyY2hSZXN1bHQsXG5cdFx0c3RhcnRJbmRleDogbnVtYmVyLFxuXHQpOiBQcm9taXNlPFRbXT4ge1xuXHRcdGNvbnN0IGluc3RhbmNlcyA9IGF3YWl0IGxvYWRNdWx0aXBsZUZyb21MaXN0cyh0eXBlLCB0aGlzLmVudGl0eUNsaWVudCwgdG9Mb2FkKVxuXHRcdC8vIEZpbHRlciBub3QgZm91bmQgaW5zdGFuY2VzIGZyb20gdGhlIGN1cnJlbnQgcmVzdWx0IGFzIHdlbGwgc28gd2UgZG9u4oCZdCBsb29wIHRyeWluZyB0byBsb2FkIHRoZW1cblx0XHRpZiAoaW5zdGFuY2VzLmxlbmd0aCA8IHRvTG9hZC5sZW5ndGgpIHtcblx0XHRcdGNvbnN0IHJlc3VsdExlbmd0aCA9IGN1cnJlbnRSZXN1bHQucmVzdWx0cy5sZW5ndGhcblx0XHRcdGNvbnNvbGUubG9nKGBDb3VsZCBub3QgbG9hZCBzb21lIHJlc3VsdHM6ICR7aW5zdGFuY2VzLmxlbmd0aH0gb3V0IG9mICR7dG9Mb2FkLmxlbmd0aH1gKVxuXG5cdFx0XHQvLyBsb29wIGJhY2t3YXJkcyB0byByZW1vdmUgY29ycmVjdCBlbGVtZW50cyBieSBpbmRleFxuXHRcdFx0Zm9yIChsZXQgaSA9IHRvTG9hZC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRjb25zdCB0b0xvYWRJZCA9IHRvTG9hZFtpXVxuXG5cdFx0XHRcdGlmICghaW5zdGFuY2VzLnNvbWUoKGluc3RhbmNlKSA9PiBpc1NhbWVJZChpbnN0YW5jZS5faWQsIHRvTG9hZElkKSkpIHtcblx0XHRcdFx0XHRjdXJyZW50UmVzdWx0LnJlc3VsdHMuc3BsaWNlKHN0YXJ0SW5kZXggKyBpLCAxKVxuXG5cdFx0XHRcdFx0aWYgKGluc3RhbmNlcy5sZW5ndGggPT09IHRvTG9hZC5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGNvbnNvbGUubG9nKGBGaXhlZCByZXN1bHRzLCBiZWZvcmUgJHtyZXN1bHRMZW5ndGh9LCBhZnRlcjogJHtjdXJyZW50UmVzdWx0LnJlc3VsdHMubGVuZ3RofWApXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGluc3RhbmNlc1xuXHR9XG5cblx0c2VuZFN0b3BMb2FkaW5nU2lnbmFsKCkge1xuXHRcdHRoaXMuc2VhcmNoLnNlbmRDYW5jZWxTaWduYWwoKVxuXHR9XG5cblx0Z2V0TG9jYWxDYWxlbmRhcnMoKSB7XG5cdFx0cmV0dXJuIGdldENsaWVudE9ubHlDYWxlbmRhcnModGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VySWQsIHRoaXMubG9jYWxDYWxlbmRhcnMpXG5cdH1cblxuXHRkaXNwb3NlKCkge1xuXHRcdHRoaXMuc3RvcExvYWRBbGwoKVxuXHRcdHRoaXMuZXh0ZW5kSW5kZXhDb25maXJtYXRpb25DYWxsYmFjayA9IG51bGxcblx0XHR0aGlzLnJlc3VsdFN1YnNjcmlwdGlvbj8uZW5kKHRydWUpXG5cdFx0dGhpcy5yZXN1bHRTdWJzY3JpcHRpb24gPSBudWxsXG5cdFx0dGhpcy5tYWlsYm94U3Vic2NyaXB0aW9uPy5lbmQodHJ1ZSlcblx0XHR0aGlzLm1haWxib3hTdWJzY3JpcHRpb24gPSBudWxsXG5cdFx0dGhpcy5saXN0U3RhdGVTdWJzY3JpcHRpb24/LmVuZCh0cnVlKVxuXHRcdHRoaXMubGlzdFN0YXRlU3Vic2NyaXB0aW9uID0gbnVsbFxuXHRcdHRoaXMuc2VhcmNoLnNlbmRDYW5jZWxTaWduYWwoKVxuXHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLnJlbW92ZUVudGl0eUxpc3RlbmVyKHRoaXMuZW50aXR5RXZlbnRzTGlzdGVuZXIpXG5cdH1cblxuXHRnZXRMYWJlbHNGb3JNYWlsKG1haWw6IE1haWwpOiBNYWlsRm9sZGVyW10ge1xuXHRcdHJldHVybiBtYWlsTG9jYXRvci5tYWlsTW9kZWwuZ2V0TGFiZWxzRm9yTWFpbChtYWlsKVxuXHR9XG59XG5cbmZ1bmN0aW9uIGF3YWl0U2VhcmNoSW5pdGlhbGl6ZWQoc2VhcmNoTW9kZWw6IFNlYXJjaE1vZGVsKTogUHJvbWlzZTx1bmtub3duPiB7XG5cdGNvbnN0IGRlZmVycmVkID0gZGVmZXI8dW5rbm93bj4oKVxuXHRjb25zdCBkZXAgPSBzZWFyY2hNb2RlbC5pbmRleFN0YXRlLm1hcCgoc3RhdGUpID0+IHtcblx0XHRpZiAoIXN0YXRlLmluaXRpYWxpemluZykge1xuXHRcdFx0UHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cdFx0XHRcdGRlcC5lbmQodHJ1ZSlcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZSh1bmRlZmluZWQpXG5cdFx0XHR9KVxuXHRcdH1cblx0fSlcblx0cmV0dXJuIGRlZmVycmVkLnByb21pc2Vcbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkEsa0JBQWtCO0lBRUwsd0JBQU4sTUFBNEI7Q0FDbEMsWUFBcUJBLE9BQXdCO0VBK0o3QyxLQS9KcUI7Q0FBMEI7Q0FFL0MsSUFBSSxNQUFlO0FBQ2xCLFNBQU8sS0FBSyxNQUFNO0NBQ2xCO0FBQ0Q7SUFXWSxpQkFBTixNQUErRDtDQUNyRSxBQUFRO0NBRVIsSUFBWSxZQUF5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