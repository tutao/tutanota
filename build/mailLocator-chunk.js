import { __toESM } from "./chunk-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNode, assertMainOrNodeBoot, getApiBaseUrl, isAndroidApp, isApp, isBrowser, isDesktop, isElectronClient, isIOSApp, isTest } from "./Env-chunk.js";
import { AppType, client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { LazyLoaded, arrayEquals, assert, assertNonNull, assertNotNull, asyncFind, collectToMap, debounceStart, defer, downcast, findAndRemove, first, getFirstOrThrow, getFromMap, groupBy, identity, incrementMonth, isEmpty, isNotNull, isSameDayOfDate, isSameTypeRef, last, lastThrow, lazyMemoized, mapAndFilterNull, neverNull, noOp, ofClass, pMap, partition, partitionAsync, remove, sortableTimestamp, splitInChunks, stringToUtf8Uint8Array, throttle, tokenize, typedValues } from "./dist2-chunk.js";
import { getWhitelabelCustomizations } from "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { styles } from "./styles-chunk.js";
import { getCalendarLogoSvg, getMailLogoSvg, logoDefaultGrey, theme, themes } from "./theme-chunk.js";
import { ArchiveDataType, CLIENT_ONLY_CALENDARS, Const, DEFAULT_CLIENT_ONLY_CALENDAR_COLORS, FeatureType, GroupType, ImportStatus, InboxRuleType, MAX_NBR_MOVE_DELETE_MAIL_SERVICE, MailSetKind, NOTHING_INDEXED_TIMESTAMP, OperationType, SecondFactorType, SessionState, isLabel } from "./TutanotaConstants-chunk.js";
import { windowFacade } from "./WindowFacade-chunk.js";
import { CUSTOM_MIN_ID, GENERATED_MAX_ID, GENERATED_MIN_ID, elementIdPart, getElementId, getListId, isSameId, listIdPart } from "./EntityUtils-chunk.js";
import { CalendarEventTypeRef, ContactTypeRef, ImportMailStateTypeRef, MailBoxTypeRef, MailFolderTypeRef, MailSetEntryTypeRef, MailTypeRef, MailboxGroupRootTypeRef, MailboxPropertiesTypeRef, createContact, createContactAddress, createContactCustomDate, createContactMailAddress, createContactMessengerHandle, createContactPhoneNumber, createContactRelationship, createContactWebsite, createMailAddressProperties, createMailboxProperties, createMoveMailData, createNewsIn } from "./TypeRefs-chunk.js";
import { GroupInfoTypeRef, GroupTypeRef, SessionTypeRef, createSecondFactorAuthData, createU2fRegisteredDevice, createWebauthnResponseData } from "./TypeRefs2-chunk.js";
import { isDomainName, isRegularExpression } from "./FormatValidator-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { deviceConfig } from "./DeviceConfig-chunk.js";
import { ContactStoreError, ImportErrorCategories, MailImportError } from "./ErrorUtils-chunk.js";
import { AccessBlockedError, BadRequestError, LockedError, NotAuthenticatedError, NotFoundError, PreconditionFailedError } from "./RestError-chunk.js";
import { CancelledError } from "./CancelledError-chunk.js";
import { CacheMode, WsConnectionState, bootstrapWorker, decode } from "./EntityRestClient-chunk.js";
import { DbError } from "./DbError-chunk.js";
import { WebauthnError } from "./WebauthnError-chunk.js";
import { PermissionError } from "./PermissionError-chunk.js";
import { containsEventOfType, isUpdateForTypeRef } from "./EntityUpdateUtils-chunk.js";
import { SessionType } from "./SessionType-chunk.js";
import { EntityClient } from "./EntityClient-chunk.js";
import { PageContextLoginListener } from "./PageContextLoginListener-chunk.js";
import { NewsService } from "./Services2-chunk.js";
import { DomainConfigProvider, FolderSystem, NoZoneDateProvider, SchedulerImpl } from "./FolderSystem-chunk.js";
import { isMailInSpamOrTrash, isSpamOrTrashFolder } from "./MailChecks-chunk.js";
import { Icons, SecondFactorImage } from "./Icons-chunk.js";
import { Autocomplete, Dialog, TextField } from "./Dialog-chunk.js";
import { Icon, IconSize, progressIcon } from "./Icon-chunk.js";
import { ProgressMonitor } from "./ProgressMonitor-chunk.js";
import { NotificationType, notifications } from "./Notifications-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import { createReferencingInstance } from "./BlobUtils-chunk.js";
import { assertOnlyDataFiles, assertOnlyFileReferences } from "./FileUtils-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import { CALENDAR_MIME_TYPE, FileController, MAIL_MIME_TYPES, VCARD_MIME_TYPES, getEnabledMailAddressesWithUser, guiDownload, openDataFileInBrowser, zipDataFiles } from "./SharedMailUtils-chunk.js";
import { extractStructuredAddresses, extractStructuredCustomDates, extractStructuredMailAddresses, extractStructuredMessengerHandle, extractStructuredPhoneNumbers, extractStructuredRelationships, extractStructuredWebsites } from "./ContactUtils-chunk.js";
import { ExternalLink } from "./ExternalLink-chunk.js";
import { showSnackBar } from "./SnackBar-chunk.js";
import { show } from "./NotificationOverlay-chunk.js";
import { MAIL_PREFIX, throttleRoute } from "./RouteChange-chunk.js";
import { isCustomizationEnabledForCustomer } from "./CustomerUtils-chunk.js";
import { LoginButton } from "./LoginButton-chunk.js";
import { EphemeralUsageTestStorage, StorageBehavior, UsageTestController, UsageTestModel } from "./UsageTestModel-chunk.js";
import { assertSystemFolderOfType, getMailHeaders } from "./MailUtils-chunk.js";
import { BrowserWebauthn } from "./BrowserWebauthn-chunk.js";
import { PermissionType$1 as PermissionType } from "./PermissionType-chunk.js";
import { getDisplayedSender } from "./CommonMailUtils-chunk.js";
import { SearchCategoryTypes } from "./SearchUtils-chunk.js";

//#region src/common/gui/base/OfflineIndicator.ts
let OfflineIndicatorState = function(OfflineIndicatorState$1) {
	OfflineIndicatorState$1[OfflineIndicatorState$1["Offline"] = 0] = "Offline";
	OfflineIndicatorState$1[OfflineIndicatorState$1["Connecting"] = 1] = "Connecting";
	OfflineIndicatorState$1[OfflineIndicatorState$1["Synchronizing"] = 2] = "Synchronizing";
	OfflineIndicatorState$1[OfflineIndicatorState$1["Online"] = 3] = "Online";
	return OfflineIndicatorState$1;
}({});
/**
* the first line of the offline indicator shows if we're offline or online and
* adds action prompts (if any)
* it's returned as a span so the consumer can decide how to layout it.
*/
function attrToFirstLine(attr) {
	const { state } = attr;
	switch (state) {
		case OfflineIndicatorState.Online:
		case OfflineIndicatorState.Synchronizing: return mithril_default("span", lang.get("online_label"));
		case OfflineIndicatorState.Offline: return mithril_default("span", [lang.get("offline_label"), mithril_default("span.b.content-accent-fg.mlr-s", lang.get("reconnect_action"))]);
		case OfflineIndicatorState.Connecting: return mithril_default("span", lang.get("offline_label"));
	}
}
/**
* the second line provides additional information about the current state.
* it's returned as a span so the consumer can decide how to layout it.
*/
function attrToSecondLine(a) {
	switch (a.state) {
		case OfflineIndicatorState.Online: return mithril_default("span", lang.get("upToDate_label"));
		case OfflineIndicatorState.Offline: if (a.lastUpdate) return mithril_default("span", lang.get("lastSync_label", { "{date}": formatDate(a.lastUpdate) }));
else return null;
		case OfflineIndicatorState.Synchronizing: return mithril_default("span", lang.get("synchronizing_label", { "{progress}": formatPercentage(a.progress) }));
		case OfflineIndicatorState.Connecting: return mithril_default("span", lang.get("reconnecting_label"));
	}
}
/**
* format a number as a percentage string with 0 = 0% and 1 = 100%
*/
function formatPercentage(percentage) {
	return `${Math.round(percentage * 100)}%`;
}
function formatDate(date) {
	return isSameDayOfDate(new Date(), date) ? lang.formats.time.format(date) : lang.formats.simpleDate.format(date);
}
var OfflineIndicator = class {
	view(vnode) {
		const a = vnode.attrs;
		const isOffline = a.state === OfflineIndicatorState.Offline;
		return mithril_default("button.small", {
			class: a.isSingleColumn ? "center mb-xs" : "mlr-l flex col",
			type: "button",
			href: "#",
			tabindex: "0",
			role: "button",
			"aria-disabled": !isOffline,
			onclick: isOffline ? a.reconnectAction : noOp
		}, a.isSingleColumn ? attrToFirstLine(a) : [attrToFirstLine(a), attrToSecondLine(a)]);
	}
};

//#endregion
//#region src/common/gui/base/ProgressBar.ts
let ProgressBarType = function(ProgressBarType$1) {
	ProgressBarType$1[ProgressBarType$1["Small"] = 0] = "Small";
	ProgressBarType$1[ProgressBarType$1["Large"] = 1] = "Large";
	return ProgressBarType$1;
}({});
const PROGRESS_DONE = 1;
var ProgressBar = class {
	lastProgress = null;
	view(vnode) {
		const a = vnode.attrs;
		if (this.lastProgress === null && a.progress >= PROGRESS_DONE) return null;
		if (this.lastProgress !== null && this.lastProgress >= PROGRESS_DONE) return null;
		if (a.progress >= PROGRESS_DONE) mithril_default.redraw();
		this.lastProgress = a.progress;
		let progressBarSelector = a.type == ProgressBarType.Large ? ".abs.accent-bg.border-radius-big" : ".abs.accent-bg";
		return mithril_default(progressBarSelector, {
			onbeforeremove: (vn) => new Promise((resolve) => {
				vn.dom.addEventListener("transitionend", () => {
					this.lastProgress = null;
					resolve();
				});
				setTimeout(() => {
					this.lastProgress = null;
					resolve();
				}, 500);
			}),
			style: {
				top: 0,
				left: 0,
				transition: "width 500ms",
				width: a.progress * 100 + "%",
				height: a.type == ProgressBarType.Large ? "100%" : "2px"
			}
		});
	}
};

//#endregion
//#region src/common/api/main/EventController.ts
var import_stream$7 = __toESM(require_stream(), 1);
assertMainOrNode();
const TAG = "[EventController]";
var EventController = class {
	countersStream = (0, import_stream$7.default)();
	entityListeners = new Set();
	constructor(logins) {
		this.logins = logins;
	}
	addEntityListener(listener) {
		if (this.entityListeners.has(listener)) console.warn(TAG, "Adding the same listener twice!");
else this.entityListeners.add(listener);
	}
	removeEntityListener(listener) {
		const wasRemoved = this.entityListeners.delete(listener);
		if (!wasRemoved) console.warn(TAG, "Could not remove listener, possible leak?", listener);
	}
	getCountersStream() {
		return this.countersStream.map(identity);
	}
	async onEntityUpdateReceived(entityUpdates, eventOwnerGroupId) {
		let loginsUpdates = Promise.resolve();
		if (this.logins.isUserLoggedIn()) loginsUpdates = this.logins.getUserController().entityEventsReceived(entityUpdates, eventOwnerGroupId);
		return loginsUpdates.then(async () => {
			for (const listener of this.entityListeners) {
				let entityUpdatesData = downcast(entityUpdates);
				await listener(entityUpdatesData, eventOwnerGroupId);
			}
		}).then(noOp);
	}
	async onCountersUpdateReceived(update) {
		this.countersStream(update);
	}
};

//#endregion
//#region src/mail-app/search/model/SearchModel.ts
var import_stream$6 = __toESM(require_stream(), 1);
assertMainOrNode();
var SearchModel = class {
	result;
	indexState;
	lastQueryString;
	indexingSupported;
	_searchFacade;
	lastQuery;
	lastSearchPromise;
	cancelSignal;
	constructor(searchFacade, calendarModel) {
		this.calendarModel = calendarModel;
		this._searchFacade = searchFacade;
		this.result = (0, import_stream$6.default)();
		this.lastQueryString = (0, import_stream$6.default)("");
		this.indexingSupported = true;
		this.indexState = (0, import_stream$6.default)({
			initializing: true,
			mailIndexEnabled: false,
			progress: 0,
			currentMailIndexTimestamp: NOTHING_INDEXED_TIMESTAMP,
			aimedMailIndexTimestamp: NOTHING_INDEXED_TIMESTAMP,
			indexedMailCount: 0,
			failedIndexingUpTo: null
		});
		this.lastQuery = null;
		this.lastSearchPromise = Promise.resolve();
		this.cancelSignal = (0, import_stream$6.default)(false);
	}
	async search(searchQuery, progressTracker) {
		if (this.lastQuery && searchQueryEquals(searchQuery, this.lastQuery)) return this.lastSearchPromise;
		this.lastQuery = searchQuery;
		const { query, restriction, minSuggestionCount, maxResults } = searchQuery;
		this.lastQueryString(query);
		let result = this.result();
		if (result && !isSameTypeRef(restriction.type, result.restriction.type)) this.result(null);
else if (this.indexState().progress > 0 && result && isSameTypeRef(MailTypeRef, result.restriction.type)) this.result(null);
		if (query.trim() === "") {
			const result$1 = {
				query,
				restriction,
				results: [],
				currentIndexTimestamp: this.indexState().currentMailIndexTimestamp,
				lastReadSearchIndexRow: [],
				maxResults: 0,
				matchWordOrder: false,
				moreResults: [],
				moreResultsEntries: []
			};
			this.result(result$1);
			this.lastSearchPromise = Promise.resolve(result$1);
		} else if (isSameTypeRef(CalendarEventTypeRef, restriction.type)) {
			let currentDate = new Date(assertNotNull(restriction.start));
			const endDate = new Date(assertNotNull(restriction.end));
			const calendarModel = await this.calendarModel();
			const daysInMonths = [];
			while (currentDate.getTime() <= endDate.getTime()) {
				daysInMonths.push(currentDate);
				currentDate = incrementMonth(currentDate, 1);
			}
			const calendarResult = {
				currentIndexTimestamp: 0,
				moreResults: [],
				moreResultsEntries: [],
				lastReadSearchIndexRow: [],
				matchWordOrder: false,
				restriction,
				results: [],
				query
			};
			const monitorHandle = progressTracker.registerMonitorSync(daysInMonths.length);
			const monitor = assertNotNull(progressTracker.getMonitor(monitorHandle));
			if (this.cancelSignal()) {
				this.result(calendarResult);
				this.lastSearchPromise = Promise.resolve(calendarResult);
				return this.lastSearchPromise;
			}
			const hasNewPaidPlan = await calendarModel.canLoadBirthdaysCalendar();
			if (hasNewPaidPlan) await calendarModel.loadContactsBirthdays();
			await calendarModel.loadMonthsIfNeeded(daysInMonths, monitor, this.cancelSignal);
			monitor.completed();
			const eventsForDays = calendarModel.getEventsForMonths()();
			assertNonNull(restriction.start);
			assertNonNull(restriction.end);
			const tokens = tokenize(query.trim());
			const alreadyAdded = new Set();
			if (this.cancelSignal()) {
				this.result(calendarResult);
				this.lastSearchPromise = Promise.resolve(calendarResult);
				return this.lastSearchPromise;
			}
			const followCommonRestrictions = (key, event) => {
				if (alreadyAdded.has(key)) return false;
				if (restriction.folderIds.length > 0 && !restriction.folderIds.includes(listIdPart(event._id))) return false;
				if (restriction.eventSeries === false && event.repeatRule != null) return false;
				for (const token of tokens) if (event.summary.toLowerCase().includes(token)) {
					alreadyAdded.add(key);
					calendarResult.results.push(event._id);
					return false;
				}
				return true;
			};
			if (tokens.length > 0) {
				for (const [startOfDay, eventsOnDay] of eventsForDays) eventLoop: for (const event of eventsOnDay) {
					if (!(startOfDay >= restriction.start && startOfDay <= restriction.end)) continue;
					const key = idToKey(event._id);
					if (!followCommonRestrictions(key, event)) continue;
					for (const token of tokens) if (event.summary.toLowerCase().includes(token)) {
						alreadyAdded.add(key);
						calendarResult.results.push(event._id);
						continue eventLoop;
					}
					const descriptionToSearch = event.description.replaceAll(/(<[^>]+>)/gi, " ").toLowerCase();
					for (const token of tokens) if (descriptionToSearch.includes(token)) {
						alreadyAdded.add(key);
						calendarResult.results.push(event._id);
						continue eventLoop;
					}
					if (this.cancelSignal()) {
						this.result(calendarResult);
						this.lastSearchPromise = Promise.resolve(calendarResult);
						return this.lastSearchPromise;
					}
				}
				const startDate = new Date(restriction.start);
				const endDate$1 = new Date(restriction.end);
				if (hasNewPaidPlan) {
					const birthdayEvents = Array.from(calendarModel.getBirthdayEvents().values()).flat();
					eventLoop: for (const eventRegistry of birthdayEvents) {
						const month = eventRegistry.event.startTime.getMonth();
						if (!(month >= startDate.getMonth() && month <= endDate$1.getMonth())) continue;
						const key = idToKey(eventRegistry.event._id);
						if (!followCommonRestrictions(key, eventRegistry.event)) continue;
						for (const token of tokens) if (eventRegistry.event.summary.toLowerCase().includes(token)) {
							alreadyAdded.add(key);
							calendarResult.results.push(eventRegistry.event._id);
							continue eventLoop;
						}
						if (this.cancelSignal()) {
							this.result(calendarResult);
							this.lastSearchPromise = Promise.resolve(calendarResult);
							return this.lastSearchPromise;
						}
					}
				}
			}
			this.result(calendarResult);
			this.lastSearchPromise = Promise.resolve(calendarResult);
		} else this.lastSearchPromise = this._searchFacade.search(query, restriction, minSuggestionCount, maxResults ?? undefined).then((result$1) => {
			this.result(result$1);
			return result$1;
		}).catch(ofClass(DbError, (e) => {
			console.log("DBError while search", e);
			throw e;
		}));
		return this.lastSearchPromise;
	}
	isNewSearch(query, restriction) {
		let isNew = false;
		let lastQuery = this.lastQuery;
		if (lastQuery == null) isNew = true;
else if (lastQuery.query !== query) isNew = true;
else if (lastQuery.restriction !== restriction) isNew = !isSameSearchRestriction(restriction, lastQuery.restriction);
		if (isNew) this.sendCancelSignal();
		return isNew;
	}
	sendCancelSignal() {
		this.cancelSignal(true);
		this.cancelSignal.end(true);
		this.cancelSignal = (0, import_stream$6.default)(false);
	}
};
function idToKey(id) {
	return id.join("/");
}
function searchQueryEquals(a, b) {
	return a.query === b.query && isSameSearchRestriction(a.restriction, b.restriction) && a.minSuggestionCount === b.minSuggestionCount && a.maxResults === b.maxResults;
}
function isSameSearchRestriction(a, b) {
	const isSameAttributeIds = a.attributeIds === b.attributeIds || !!a.attributeIds && !!b.attributeIds && arrayEquals(a.attributeIds, b.attributeIds);
	return isSameTypeRef(a.type, b.type) && a.start === b.start && a.end === b.end && a.field === b.field && isSameAttributeIds && (a.eventSeries === b.eventSeries || a.eventSeries === null && b.eventSeries === true || a.eventSeries === true && b.eventSeries === null) && arrayEquals(a.folderIds, b.folderIds);
}
function areResultsForTheSameQuery(a, b) {
	return a.query === b.query && isSameSearchRestriction(a.restriction, b.restriction);
}
function hasMoreResults(searchResult) {
	return searchResult.moreResults.length > 0 || searchResult.lastReadSearchIndexRow.length > 0 && searchResult.lastReadSearchIndexRow.every(([word, id]) => id !== 0);
}

//#endregion
//#region src/common/mailFunctionality/MailboxModel.ts
var import_stream$5 = __toESM(require_stream(), 1);
var MailboxModel = class {
	/** Empty stream until init() is finished, exposed mostly for map()-ing, use getMailboxDetails to get a promise */
	mailboxDetails = (0, import_stream$5.default)();
	initialization = null;
	/**
	* Map from MailboxGroupRoot id to MailboxProperties
	* A way to avoid race conditions in case we try to create mailbox properties from multiple places.
	*
	*/
	mailboxPropertiesPromises = new Map();
	constructor(eventController, entityClient, logins) {
		this.eventController = eventController;
		this.entityClient = entityClient;
		this.logins = logins;
	}
	initListeners = lazyMemoized(() => {
		this.eventController.addEntityListener((updates, eventOwnerGroupId) => this.entityEventsReceived(updates, eventOwnerGroupId));
	});
	init() {
		if (this.initialization) return this.initialization;
		this.initListeners();
		return this._init();
	}
	_init() {
		const mailGroupMemberships = this.logins.getUserController().getMailGroupMemberships();
		const mailBoxDetailsPromises = mailGroupMemberships.map((m) => this.mailboxDetailsFromMembership(m));
		this.initialization = Promise.all(mailBoxDetailsPromises).then((details) => {
			this.mailboxDetails(details);
		});
		return this.initialization.catch((e) => {
			console.warn("mailbox model initialization failed!", e);
			this.initialization = null;
			throw e;
		});
	}
	/**
	* load mailbox details from a mailgroup membership
	*/
	async mailboxDetailsFromMembership(membership) {
		const [mailboxGroupRoot, mailGroupInfo, mailGroup] = await Promise.all([
			this.entityClient.load(MailboxGroupRootTypeRef, membership.group),
			this.entityClient.load(GroupInfoTypeRef, membership.groupInfo),
			this.entityClient.load(GroupTypeRef, membership.group)
		]);
		const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox);
		return {
			mailbox,
			mailGroupInfo,
			mailGroup,
			mailboxGroupRoot
		};
	}
	/**
	* Get the list of MailboxDetails that this user has access to from their memberships.
	*
	* Will wait for successful initialization.
	*/
	async getMailboxDetails() {
		if (this.mailboxDetails()) return this.mailboxDetails();
else return new Promise((resolve) => {
			this.init();
			const end = this.mailboxDetails.map((details) => {
				resolve(details);
				end.end(true);
			});
		});
	}
	async getMailboxDetailByMailboxId(mailboxId) {
		const allDetails = await this.getMailboxDetails();
		return allDetails.find((detail) => isSameId(detail.mailbox._id, mailboxId)) ?? null;
	}
	async getMailboxDetailsForMailGroup(mailGroupId) {
		const mailboxDetails = await this.getMailboxDetails();
		return assertNotNull(mailboxDetails.find((md) => mailGroupId === md.mailGroup._id), "Mailbox detail for mail group does not exist");
	}
	async getUserMailboxDetails() {
		const userMailGroupMembership = this.logins.getUserController().getUserMailGroupMembership();
		const mailboxDetails = await this.getMailboxDetails();
		return assertNotNull(mailboxDetails.find((md) => md.mailGroup._id === userMailGroupMembership.group), "Mailbox detail for user does not exist");
	}
	async entityEventsReceived(updates, eventOwnerGroupId) {
		for (const update of updates) if (isUpdateForTypeRef(GroupInfoTypeRef, update)) {
			if (update.operation === OperationType.UPDATE) {
				await this._init();
				mithril_default.redraw();
			}
		} else if (this.logins.getUserController().isUpdateForLoggedInUserInstance(update, eventOwnerGroupId)) {
			let newMemberships = this.logins.getUserController().getMailGroupMemberships();
			const mailboxDetails = await this.getMailboxDetails();
			if (newMemberships.length !== mailboxDetails.length) {
				await this._init();
				mithril_default.redraw();
			}
		}
	}
	async getMailboxProperties(mailboxGroupRoot) {
		const existingPromise = this.mailboxPropertiesPromises.get(mailboxGroupRoot._id);
		if (existingPromise) return existingPromise;
		const promise = this.loadOrCreateMailboxProperties(mailboxGroupRoot);
		this.mailboxPropertiesPromises.set(mailboxGroupRoot._id, promise);
		return promise.finally(() => this.mailboxPropertiesPromises.delete(mailboxGroupRoot._id));
	}
	async loadOrCreateMailboxProperties(mailboxGroupRoot) {
		if (!mailboxGroupRoot.mailboxProperties) mailboxGroupRoot.mailboxProperties = await this.entityClient.setup(null, createMailboxProperties({
			_ownerGroup: mailboxGroupRoot._ownerGroup ?? "",
			reportMovedMails: "0",
			mailAddressProperties: []
		})).catch(ofClass(PreconditionFailedError, (e) => {
			if (e.data && e.data.startsWith("exists:")) {
				const existingId = e.data.substring("exists:".length);
				console.log("mailboxProperties already exists", existingId);
				return existingId;
			} else throw new ProgrammingError(`Could not create mailboxProperties, precondition: ${e.data}`);
		}));
		const mailboxProperties = await this.entityClient.load(MailboxPropertiesTypeRef, mailboxGroupRoot.mailboxProperties);
		if (mailboxProperties.mailAddressProperties.length === 0) await this.migrateFromOldSenderName(mailboxGroupRoot, mailboxProperties);
		return mailboxProperties;
	}
	/** If there was no sender name configured before take the user's name and assign it to all email addresses. */
	async migrateFromOldSenderName(mailboxGroupRoot, mailboxProperties) {
		const userGroupInfo = this.logins.getUserController().userGroupInfo;
		const legacySenderName = userGroupInfo.name;
		const mailboxDetails = await this.getMailboxDetailsForMailGroup(mailboxGroupRoot._id);
		const mailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, userGroupInfo);
		for (const mailAddress of mailAddresses) mailboxProperties.mailAddressProperties.push(createMailAddressProperties({
			mailAddress,
			senderName: legacySenderName
		}));
		await this.entityClient.update(mailboxProperties);
	}
};

//#endregion
//#region src/mail-app/mail/model/MinimizedMailEditorViewModel.ts
let SaveStatusEnum = function(SaveStatusEnum$1) {
	SaveStatusEnum$1[SaveStatusEnum$1["Saving"] = 0] = "Saving";
	SaveStatusEnum$1[SaveStatusEnum$1["Saved"] = 1] = "Saved";
	SaveStatusEnum$1[SaveStatusEnum$1["NotSaved"] = 2] = "NotSaved";
	return SaveStatusEnum$1;
}({});
let SaveErrorReason = function(SaveErrorReason$1) {
	SaveErrorReason$1[SaveErrorReason$1["Unknown"] = 0] = "Unknown";
	SaveErrorReason$1[SaveErrorReason$1["ConnectionLost"] = 1] = "ConnectionLost";
	return SaveErrorReason$1;
}({});
var MinimizedMailEditorViewModel = class {
	_minimizedEditors;
	constructor() {
		this._minimizedEditors = [];
	}
	minimizeMailEditor(dialog, sendMailModel, dispose, saveStatus, closeOverlayFunction) {
		dialog.close();
		if (!this._minimizedEditors.some((editor) => editor.dialog === dialog)) this._minimizedEditors.push({
			sendMailModel,
			dialog,
			dispose,
			saveStatus,
			closeOverlayFunction
		});
		return lastThrow(this._minimizedEditors);
	}
	reopenMinimizedEditor(editor) {
		editor.closeOverlayFunction();
		editor.dialog.show();
		remove(this._minimizedEditors, editor);
	}
	removeMinimizedEditor(editor) {
		editor.closeOverlayFunction();
		editor.dispose();
		remove(this._minimizedEditors, editor);
	}
	getMinimizedEditors() {
		return this._minimizedEditors;
	}
	getEditorForDraft(mail) {
		return this.getMinimizedEditors().find((e) => {
			const draft = e.sendMailModel.getDraft();
			return draft ? isSameId(draft._id, mail._id) : null;
		}) ?? null;
	}
};

//#endregion
//#region src/common/api/main/ProgressTracker.ts
var import_stream$4 = __toESM(require_stream(), 1);
var ProgressTracker = class {
	onProgressUpdate;
	monitors;
	idCounter;
	constructor() {
		this.onProgressUpdate = (0, import_stream$4.default)(1);
		this.monitors = new Map();
		this.idCounter = 0;
	}
	/**
	* Register a monitor with the tracker, so that it's progress can be displayed
	* Returns an ID as a handle, useful for making calls from the worker
	*
	* Make sure that monitor completes, so it can be unregistered.
	* @param work - total work to do
	*/
	registerMonitorSync(work) {
		const id = this.idCounter++;
		const monitor = new ProgressMonitor(work, (percentage) => this.onProgress(id, percentage));
		this.monitors.set(id, monitor);
		return id;
	}
	/** async wrapper for remote */
	async registerMonitor(work) {
		return this.registerMonitorSync(work);
	}
	async workDoneForMonitor(id, amount) {
		this.getMonitor(id)?.workDone(amount);
	}
	getMonitor(id) {
		return this.monitors.get(id) ?? null;
	}
	onProgress(id, percentage) {
		this.onProgressUpdate(this.completedAmount());
		if (percentage >= 100) this.monitors.delete(id);
	}
	/**
	* Total work that will be done from all monitors
	*/
	totalWork() {
		let total = 0;
		for (const monitor of this.monitors.values()) total += monitor.totalWork;
		return total;
	}
	/**
	* Current absolute amount of completed work from all monitors
	*/
	completedWork() {
		let total = 0;
		for (const monitor of this.monitors.values()) total += monitor.workCompleted;
		return total;
	}
	/**
	* Completed percentage of completed work as a number between 0 and 1
	*/
	completedAmount() {
		const totalWork = this.totalWork();
		const completedWork = this.completedWork();
		return totalWork !== 0 ? Math.min(1, completedWork / totalWork) : 1;
	}
};

//#endregion
//#region src/common/misc/2fa/SecondFactorAuthView.ts
var SecondFactorAuthView = class {
	view(vnode) {
		const { attrs } = vnode;
		return mithril_default(".flex.col", [
			mithril_default("p.center", [lang.get(attrs.webauthn?.canLogin || attrs.otp ? "secondFactorPending_msg" : "secondFactorPendingOtherClientOnly_msg")]),
			this.renderWebauthn(vnode.attrs),
			this._renderOtp(vnode.attrs),
			this._renderRecover(vnode.attrs)
		]);
	}
	_renderOtp(attrs) {
		const { otp } = attrs;
		if (!otp) return null;
		return mithril_default(".left.mb", mithril_default(TextField, {
			label: "totpCode_label",
			value: otp.codeFieldValue,
			autocompleteAs: Autocomplete.oneTimeCode,
			oninput: (value) => otp.onValueChanged(value.trim()),
			injectionsRight: () => otp.inProgress ? mithril_default(".mr-s", progressIcon()) : null
		}));
	}
	renderWebauthn(attrs) {
		const { webauthn } = attrs;
		if (!webauthn) return null;
		if (webauthn.canLogin) return this.renderWebauthnLogin(webauthn);
else return this._renderOtherDomainLogin(webauthn);
	}
	renderWebauthnLogin(webauthn) {
		let items;
		const { state } = webauthn;
		const doWebAuthnButton = mithril_default(LoginButton, {
			label: "useSecurityKey_action",
			onclick: () => webauthn.doWebauthn()
		});
		switch (state.state) {
			case "init":
				items = [mithril_default(".align-self-center", doWebAuthnButton)];
				break;
			case "progress":
				items = [mithril_default(".flex.justify-center", [mithril_default(".mr-s", progressIcon()), mithril_default("", lang.get("waitingForU2f_msg"))])];
				break;
			case "error":
				items = [mithril_default(".flex.col.items-center", [mithril_default(".flex.items-center", [mithril_default(".mr-s", mithril_default(Icon, {
					icon: Icons.Cancel,
					size: IconSize.Medium,
					style: { fill: theme.content_accent }
				})), mithril_default("", lang.get(state.error))]), doWebAuthnButton])];
				break;
			default: throw new Error();
		}
		return [mithril_default(".flex-center", mithril_default("img", { src: SecondFactorImage })), mithril_default(".mt.flex.col", items)];
	}
	_renderOtherDomainLogin({ otherDomainLoginUrl }) {
		const hostname = new URL(otherDomainLoginUrl).hostname;
		return [
			lang.get("differentSecurityKeyDomain_msg", { "{domain}": hostname }),
			mithril_default("br"),
			mithril_default(ExternalLink, {
				href: otherDomainLoginUrl,
				text: hostname,
				class: "text-center",
				isCompanySite: false
			})
		];
	}
	_renderRecover(attrs) {
		const { onRecover } = attrs;
		if (onRecover == null) return null;
		return mithril_default(".small.text-center.pt", [mithril_default(`a[href=#]`, { onclick: (e) => {
			onRecover();
			e.preventDefault();
		} }, lang.get("recoverAccountAccess_action"))]);
	}
};

//#endregion
//#region src/common/misc/2fa/SecondFactorUtils.ts
function appIdToLoginUrl(appId, domainConfigProvider) {
	if (appId === Const.WEBAUTHN_RP_ID) return webauthnUrlToLoginUrl(domainConfigProvider.getCurrentDomainConfig().webauthnUrl);
else if (appId === Const.LEGACY_WEBAUTHN_RP_ID) return webauthnUrlToLoginUrl(domainConfigProvider.getCurrentDomainConfig().legacyWebauthnUrl);
	const parts = (appId.endsWith(".json") ? new URL(appId).hostname : appId).split(":");
	const domain = parts[0];
	const port = parts[1];
	const domainConfig = domainConfigProvider.getDomainConfigForHostname(domain, "https:", port);
	return webauthnUrlToLoginUrl(domainConfig.webauthnUrl);
}
function webauthnUrlToLoginUrl(webauthnUrl) {
	const url = new URL(webauthnUrl);
	url.pathname = "";
	return url.toString();
}

//#endregion
//#region src/common/misc/2fa/SecondFactorAuthDialog.ts
var SecondFactorAuthDialog = class SecondFactorAuthDialog {
	waitingForSecondFactorDialog = null;
	webauthnState = { state: "init" };
	otpState = {
		code: "",
		inProgress: false
	};
	/** @private */
	constructor(webauthnClient, loginFacade, domainConfigProvider, authData, onClose) {
		this.webauthnClient = webauthnClient;
		this.loginFacade = loginFacade;
		this.domainConfigProvider = domainConfigProvider;
		this.authData = authData;
		this.onClose = onClose;
	}
	/**
	* @param onClose will be called when the dialog is closed (one way or another).
	*/
	static show(webauthnClient, loginFacade, domainConfigProvider, authData, onClose) {
		const dialog = new SecondFactorAuthDialog(webauthnClient, loginFacade, domainConfigProvider, authData, onClose);
		dialog.show();
		return dialog;
	}
	close() {
		if (this.waitingForSecondFactorDialog?.visible) this.waitingForSecondFactorDialog?.close();
		this.webauthnClient.abortCurrentOperation();
		this.waitingForSecondFactorDialog = null;
		this.onClose();
	}
	async show() {
		const u2fChallenge = this.authData.challenges.find((challenge) => challenge.type === SecondFactorType.u2f || challenge.type === SecondFactorType.webauthn);
		const otpChallenge = this.authData.challenges.find((challenge) => challenge.type === SecondFactorType.totp);
		const u2fSupported = await this.webauthnClient.isSupported();
		console.log("webauthn supported: ", u2fSupported);
		let canLoginWithU2f;
		let otherDomainLoginUrl;
		if (u2fChallenge?.u2f != null && u2fSupported) {
			const { canAttempt, cannotAttempt } = await this.webauthnClient.canAttemptChallenge(u2fChallenge.u2f);
			canLoginWithU2f = canAttempt.length !== 0;
			if (cannotAttempt.length > 0) {
				const loginUrlString = appIdToLoginUrl(getFirstOrThrow(cannotAttempt).appId, this.domainConfigProvider);
				const loginUrl = new URL(loginUrlString);
				loginUrl.searchParams.set("noAutoLogin", "true");
				otherDomainLoginUrl = loginUrl.toString();
			} else otherDomainLoginUrl = null;
		} else {
			canLoginWithU2f = false;
			otherDomainLoginUrl = null;
		}
		const { mailAddress } = this.authData;
		this.waitingForSecondFactorDialog = Dialog.showActionDialog({
			title: "emptyString_msg",
			allowOkWithReturn: true,
			child: { view: () => {
				return mithril_default(SecondFactorAuthView, {
					webauthn: canLoginWithU2f ? {
						canLogin: true,
						state: this.webauthnState,
						doWebauthn: () => this.doWebauthn(assertNotNull(u2fChallenge))
					} : otherDomainLoginUrl ? {
						canLogin: false,
						otherDomainLoginUrl
					} : null,
					otp: otpChallenge ? {
						codeFieldValue: this.otpState.code,
						inProgress: this.otpState.inProgress,
						onValueChanged: (newValue) => this.otpState.code = newValue
					} : null,
					onRecover: mailAddress ? () => this.recoverLogin(mailAddress) : null
				});
			} },
			okAction: otpChallenge ? () => this.onConfirmOtp() : null,
			cancelAction: () => this.cancel()
		});
	}
	async onConfirmOtp() {
		this.otpState.inProgress = true;
		const authData = createSecondFactorAuthData({
			type: SecondFactorType.totp,
			session: this.authData.sessionId,
			otpCode: this.otpState.code.replace(/ /g, ""),
			u2f: null,
			webauthn: null
		});
		try {
			await this.loginFacade.authenticateWithSecondFactor(authData);
			this.waitingForSecondFactorDialog?.close();
		} catch (e) {
			if (e instanceof NotAuthenticatedError) Dialog.message("loginFailed_msg");
else if (e instanceof BadRequestError) Dialog.message("loginFailed_msg");
else if (e in AccessBlockedError) {
				Dialog.message("loginFailedOften_msg");
				this.close();
			} else throw e;
		} finally {
			this.otpState.inProgress = false;
		}
	}
	async cancel() {
		this.webauthnClient.abortCurrentOperation();
		await this.loginFacade.cancelCreateSession(this.authData.sessionId);
		this.close();
	}
	async doWebauthn(u2fChallenge) {
		this.webauthnState = { state: "progress" };
		const sessionId = this.authData.sessionId;
		const challenge = assertNotNull(u2fChallenge.u2f);
		try {
			const { responseData, apiBaseUrl } = await this.webauthnClient.authenticate(challenge);
			const authData = createSecondFactorAuthData({
				type: SecondFactorType.webauthn,
				session: sessionId,
				webauthn: responseData,
				u2f: null,
				otpCode: null
			});
			await this.loginFacade.authenticateWithSecondFactor(authData, apiBaseUrl);
		} catch (e) {
			if (e instanceof CancelledError) this.webauthnState = { state: "init" };
else if (e instanceof AccessBlockedError && this.waitingForSecondFactorDialog?.visible) {
				Dialog.message("loginFailedOften_msg");
				this.close();
			} else if (e instanceof WebauthnError) {
				console.log("Error during webAuthn: ", e);
				this.webauthnState = {
					state: "error",
					error: "couldNotAuthU2f_msg"
				};
			} else if (e instanceof LockedError) {
				this.webauthnState = { state: "init" };
				Dialog.message("serviceUnavailable_msg");
			} else if (e instanceof NotAuthenticatedError) {
				this.webauthnState = { state: "init" };
				Dialog.message("loginFailed_msg");
			} else throw e;
		} finally {
			mithril_default.redraw();
		}
	}
	async recoverLogin(mailAddress) {
		this.cancel();
		const dialog = await import("./RecoverLoginDialog-chunk.js");
		dialog.show(mailAddress, "secondFactor");
	}
};

//#endregion
//#region src/common/misc/2fa/SecondFactorHandler.ts
assertMainOrNode();
var SecondFactorHandler = class {
	otherLoginSessionId = null;
	otherLoginDialog = null;
	otherLoginListenerInitialized = false;
	waitingForSecondFactorDialog = null;
	constructor(eventController, entityClient, webauthnClient, loginFacade, domainConfigProvider) {
		this.eventController = eventController;
		this.entityClient = entityClient;
		this.webauthnClient = webauthnClient;
		this.loginFacade = loginFacade;
		this.domainConfigProvider = domainConfigProvider;
	}
	setupAcceptOtherClientLoginListener() {
		if (this.otherLoginListenerInitialized) return;
		this.otherLoginListenerInitialized = true;
		this.eventController.addEntityListener((updates) => this.entityEventsReceived(updates));
	}
	async entityEventsReceived(updates) {
		for (const update of updates) {
			const sessionId = [neverNull(update.instanceListId), update.instanceId];
			if (isUpdateForTypeRef(SessionTypeRef, update)) {
				if (update.operation === OperationType.CREATE) {
					let session;
					try {
						session = await this.entityClient.load(SessionTypeRef, sessionId);
					} catch (e) {
						if (e instanceof NotFoundError) console.log("Failed to load session", e);
else throw e;
						continue;
					}
					if (session.state === SessionState.SESSION_STATE_PENDING) {
						if (this.otherLoginDialog != null) this.otherLoginDialog.close();
						this.otherLoginSessionId = session._id;
						this.showConfirmLoginDialog(session);
					}
				} else if (update.operation === OperationType.UPDATE && this.otherLoginSessionId && isSameId(this.otherLoginSessionId, sessionId)) {
					let session;
					try {
						session = await this.entityClient.load(SessionTypeRef, sessionId);
					} catch (e) {
						if (e instanceof NotFoundError) console.log("Failed to load session", e);
else throw e;
						continue;
					}
					if (session.state !== SessionState.SESSION_STATE_PENDING && this.otherLoginDialog && isSameId(neverNull(this.otherLoginSessionId), sessionId)) {
						this.otherLoginDialog.close();
						this.otherLoginSessionId = null;
						this.otherLoginDialog = null;
					}
				} else if (update.operation === OperationType.DELETE && this.otherLoginSessionId && isSameId(this.otherLoginSessionId, sessionId)) {
					if (this.otherLoginDialog) {
						this.otherLoginDialog.close();
						this.otherLoginSessionId = null;
						this.otherLoginDialog = null;
					}
				}
			}
		}
	}
	showConfirmLoginDialog(session) {
		let text;
		if (session.loginIpAddress) text = lang.get("secondFactorConfirmLogin_msg", {
			"{clientIdentifier}": session.clientIdentifier,
			"{ipAddress}": session.loginIpAddress
		});
else text = lang.get("secondFactorConfirmLoginNoIp_msg", { "{clientIdentifier}": session.clientIdentifier });
		this.otherLoginDialog = Dialog.showActionDialog({
			title: "secondFactorConfirmLogin_label",
			child: { view: () => mithril_default(".text-break.pt", text) },
			okAction: async () => {
				await this.loginFacade.authenticateWithSecondFactor(createSecondFactorAuthData({
					session: session._id,
					type: null,
					otpCode: null,
					u2f: null,
					webauthn: null
				}));
				if (this.otherLoginDialog) {
					this.otherLoginDialog.close();
					this.otherLoginSessionId = null;
					this.otherLoginDialog = null;
				}
			}
		});
		let sessionId = session._id;
		setTimeout(() => {
			if (this.otherLoginDialog && isSameId(neverNull(this.otherLoginSessionId), sessionId)) {
				this.otherLoginDialog.close();
				this.otherLoginSessionId = null;
				this.otherLoginDialog = null;
			}
		}, 6e4);
	}
	closeWaitingForSecondFactorDialog() {
		this.waitingForSecondFactorDialog?.close();
		this.waitingForSecondFactorDialog = null;
	}
	/**
	* @inheritDoc
	*/
	async showSecondFactorAuthenticationDialog(sessionId, challenges, mailAddress) {
		if (this.waitingForSecondFactorDialog) return;
		this.waitingForSecondFactorDialog = SecondFactorAuthDialog.show(this.webauthnClient, this.loginFacade, this.domainConfigProvider, {
			sessionId,
			challenges,
			mailAddress
		}, () => {
			this.waitingForSecondFactorDialog = null;
		});
	}
};

//#endregion
//#region src/common/misc/2fa/webauthn/WebauthnClient.ts
var WebauthnClient = class {
	constructor(webauthn, domainConfigProvider, isApp$1) {
		this.webauthn = webauthn;
		this.domainConfigProvider = domainConfigProvider;
		this.isApp = isApp$1;
	}
	isSupported() {
		return this.webauthn.isSupported();
	}
	/** Whether it's possible to attempt a challenge. It might not be possible if there are not keys for this domain. */
	async canAttemptChallenge(challenge) {
		const [canAttempt, cannotAttempt] = await partitionAsync(challenge.keys, async (k) => await this.webauthn.canAttemptChallengeForRpId(k.appId) || await this.webauthn.canAttemptChallengeForU2FAppId(k.appId));
		return {
			canAttempt,
			cannotAttempt
		};
	}
	async register(userId, displayName) {
		const challenge = this.getChallenge();
		const name = `userId="${userId}"`;
		const registrationResult = await this.webauthn.register({
			challenge,
			userId,
			name,
			displayName,
			domain: this.selectRegistrationUrl()
		});
		const attestationObject = this.parseAttestationObject(registrationResult.attestationObject);
		const publicKey = this.parsePublicKey(downcast(attestationObject).authData);
		return createU2fRegisteredDevice({
			keyHandle: new Uint8Array(registrationResult.rawId),
			appId: registrationResult.rpId,
			publicKey: this.serializePublicKey(publicKey),
			compromised: false,
			counter: "-1"
		});
	}
	selectRegistrationUrl() {
		const domainConfig = this.domainConfigProvider.getCurrentDomainConfig();
		return this.getWebauthnUrl(domainConfig, "new");
	}
	/**
	* Attempt to complete Webauthn challenge (the local part, signing of the data).
	* U2fChallenge might have multiple keys for different domains and this method takes care of picking the one we can attempt to solve.
	* @return responseData to send to the server and base api url which should be contacted in order to finish the challenge
	* @throws CancelledError
	* @throws WebauthnError
	*/
	async authenticate(challenge) {
		const allowedKeys = challenge.keys.map((key) => {
			return { id: key.keyHandle };
		});
		const authenticationUrl = this.selectAuthenticationUrl(challenge);
		const signResult = await this.webauthn.sign({
			challenge: challenge.challenge,
			keys: allowedKeys,
			domain: authenticationUrl
		});
		const responseData = createWebauthnResponseData({
			keyHandle: new Uint8Array(signResult.rawId),
			clientData: new Uint8Array(signResult.clientDataJSON),
			signature: new Uint8Array(signResult.signature),
			authenticatorData: new Uint8Array(signResult.authenticatorData)
		});
		const authUrlObject = new URL(authenticationUrl);
		const domainConfig = this.domainConfigProvider.getDomainConfigForHostname(authUrlObject.hostname, authUrlObject.protocol, authUrlObject.port);
		const apiUrl = getApiBaseUrl(domainConfig);
		return {
			responseData,
			apiBaseUrl: apiUrl
		};
	}
	abortCurrentOperation() {
		return this.webauthn.abortCurrentOperation();
	}
	selectAuthenticationUrl(challenge) {
		const domainConfig = this.domainConfigProvider.getCurrentDomainConfig();
		if (challenge.keys.some((k) => k.appId === Const.WEBAUTHN_RP_ID)) return this.getWebauthnUrl(domainConfig, "new");
else if (challenge.keys.some((k) => k.appId === Const.LEGACY_WEBAUTHN_RP_ID)) return this.getWebauthnUrl(domainConfig, "legacy");
else {
			const webauthnKey = challenge.keys.find((k) => !this.isLegacyU2fKey(k));
			if (webauthnKey) {
				const domainConfigForHostname = this.domainConfigProvider.getDomainConfigForHostname(webauthnKey.appId, "https:");
				return this.getWebauthnUrl(domainConfigForHostname, "new");
			} else if (challenge.keys.some((k) => k.appId === Const.U2F_LEGACY_APPID)) return this.getWebauthnUrl(domainConfig, "legacy");
else {
				const keyToUse = getFirstOrThrow(challenge.keys);
				const keyUrl = new URL(keyToUse.appId);
				const domainConfigForHostname = this.domainConfigProvider.getDomainConfigForHostname(keyUrl.hostname, keyUrl.protocol, keyUrl.port);
				return this.getWebauthnUrl(domainConfigForHostname, "new");
			}
		}
	}
	getWebauthnUrl(domainConfig, type) {
		if (type === "legacy") return this.isApp ? domainConfig.legacyWebauthnMobileUrl : domainConfig.legacyWebauthnUrl;
else return this.isApp ? domainConfig.webauthnMobileUrl : domainConfig.webauthnUrl;
	}
	isLegacyU2fKey(key) {
		return key.appId.endsWith(Const.U2f_APPID_SUFFIX);
	}
	getChallenge() {
		const random = new Uint8Array(32);
		crypto.getRandomValues(random);
		return random;
	}
	parseAttestationObject(raw) {
		return decode(new Uint8Array(raw));
	}
	parsePublicKey(authData) {
		const dataView = new DataView(new ArrayBuffer(2));
		const idLenBytes = authData.slice(53, 55);
		for (const [index, value] of idLenBytes.entries()) dataView.setUint8(index, value);
		const credentialIdLength = dataView.getUint16(0);
		const publicKeyBytes = authData.slice(55 + credentialIdLength);
		return decode(new Uint8Array(publicKeyBytes.buffer), { useMaps: true });
	}
	serializePublicKey(publicKey) {
		const encoded = new Uint8Array(65);
		encoded[0] = 4;
		const x = publicKey.get(-2);
		const y = publicKey.get(-3);
		if (!(x instanceof Uint8Array) || !(y instanceof Uint8Array)) throw new Error("Public key is in unknown format");
		encoded.set(x, 1);
		encoded.set(y, 33);
		return encoded;
	}
};
/** authenticators are allowed to truncate strings to this length */
const WEBAUTHN_STRING_MAX_BYTE_LENGTH = 64;
function validateWebauthnDisplayName(displayName) {
	return WEBAUTHN_STRING_MAX_BYTE_LENGTH - stringToUtf8Uint8Array(displayName).byteLength >= 0;
}

//#endregion
//#region src/common/api/main/LoginController.ts
assertMainOrNodeBoot();
var LoginController = class {
	userController = null;
	customizations = null;
	partialLogin = defer();
	_isWhitelabel = !!getWhitelabelCustomizations(window);
	postLoginActions = [];
	fullyLoggedIn = false;
	atLeastPartiallyLoggedIn = false;
	constructor(loginFacade, loginListener, resetAppState) {
		this.loginFacade = loginFacade;
		this.loginListener = loginListener;
		this.resetAppState = resetAppState;
	}
	init() {
		this.waitForFullLogin().then(async () => {
			this.fullyLoggedIn = true;
			await this.waitForPartialLogin();
			for (const lazyAction of this.postLoginActions) {
				const action = await lazyAction();
				await action.onFullLoginSuccess({
					sessionType: this.getUserController().sessionType,
					userId: this.getUserController().userId
				});
			}
		});
	}
	/**
	* create a new session and set up stored credentials and offline database, if applicable.
	* @param username the mail address being used to log in
	* @param password the password given to log in
	* @param sessionType whether to store the credentials in local storage
	* @param databaseKey if given, will use this key for the offline database. if not, will force a new database to be created and generate a key.
	*/
	async createSession(username, password, sessionType, databaseKey = null) {
		const newSessionData = await this.loginFacade.createSession(username, password, client.getIdentifier(), sessionType, databaseKey);
		const { user, credentials, sessionId, userGroupInfo } = newSessionData;
		await this.onPartialLoginSuccess({
			user,
			userGroupInfo,
			sessionId,
			accessToken: credentials.accessToken,
			sessionType,
			loginUsername: username
		}, sessionType);
		return newSessionData;
	}
	addPostLoginAction(handler) {
		this.postLoginActions.push(handler);
	}
	async onPartialLoginSuccess(initData, sessionType) {
		const { initUserController } = await import("./UserController-chunk.js");
		this.userController = await initUserController(initData);
		await this.loadCustomizations();
		await this._determineIfWhitelabel();
		for (const lazyHandler of this.postLoginActions) {
			const handler = await lazyHandler();
			await handler.onPartialLoginSuccess({
				sessionType,
				userId: initData.user._id
			});
		}
		this.atLeastPartiallyLoggedIn = true;
		this.partialLogin.resolve();
	}
	async createExternalSession(userId, password, salt, kdfType, clientIdentifier, sessionType) {
		const persistentSession = sessionType === SessionType.Persistent;
		const { user, credentials, sessionId, userGroupInfo } = await this.loginFacade.createExternalSession(userId, password, salt, kdfType, clientIdentifier, persistentSession);
		await this.onPartialLoginSuccess({
			user,
			accessToken: credentials.accessToken,
			sessionType,
			sessionId,
			userGroupInfo,
			loginUsername: userId
		}, SessionType.Login);
		return credentials;
	}
	/**
	* Resume an existing session using stored credentials, may or may not unlock a persistent local database
	* @param unencryptedCredentials The stored credentials and optional database key for the offline db
	* @param externalUserKeyDeriver The KDF type and salt to resume a session
	* @param offlineTimeRangeDays the user configured time range for their offline storage, used to initialize the offline db
	*/
	async resumeSession(unencryptedCredentials, externalUserKeyDeriver, offlineTimeRangeDays) {
		const { unencryptedToCredentials } = await import("./Credentials2-chunk.js");
		const credentials = unencryptedToCredentials(unencryptedCredentials);
		const resumeResult = await this.loginFacade.resumeSession(credentials, externalUserKeyDeriver ?? null, unencryptedCredentials.databaseKey ?? null, offlineTimeRangeDays ?? null);
		if (resumeResult.type === "error") return resumeResult;
else {
			const { user, userGroupInfo, sessionId } = resumeResult.data;
			try {
				await this.onPartialLoginSuccess({
					user,
					accessToken: credentials.accessToken,
					userGroupInfo,
					sessionId,
					sessionType: SessionType.Persistent,
					loginUsername: credentials.login
				}, SessionType.Persistent);
			} catch (e) {
				console.log("Error finishing login, logging out now!", e);
				await this.logout(false);
				throw e;
			}
			return { type: "success" };
		}
	}
	isUserLoggedIn() {
		return this.userController != null;
	}
	isFullyLoggedIn() {
		return this.fullyLoggedIn;
	}
	isAtLeastPartiallyLoggedIn() {
		return this.atLeastPartiallyLoggedIn;
	}
	waitForPartialLogin() {
		return this.partialLogin.promise;
	}
	async waitForFullLogin() {
		await this.waitForPartialLogin();
		const loginListener = await this.loginListener();
		return loginListener.waitForFullLogin();
	}
	isInternalUserLoggedIn() {
		return this.isUserLoggedIn() && this.getUserController().isInternalUser();
	}
	isGlobalAdminUserLoggedIn() {
		return this.isUserLoggedIn() && this.getUserController().isGlobalAdmin();
	}
	getUserController() {
		return assertNotNull(this.userController);
	}
	isEnabled(feature) {
		return this.customizations != null ? this.customizations.indexOf(feature) !== -1 : false;
	}
	async loadCustomizations(cacheMode = CacheMode.ReadAndWrite) {
		if (this.getUserController().isInternalUser()) {
			const customer = await this.getUserController().loadCustomer(cacheMode);
			this.customizations = customer.customizations.map((f) => f.feature);
		}
	}
	/**
	* Reset login state, delete session, if not {@link SessionType.Persistent}.
	* @param sync whether to try and close the session before the window is closed
	*/
	async logout(sync) {
		if (this.userController) await this.userController.deleteSession(sync);
else console.log("No session to delete");
		await this.resetAppState();
		this.userController = null;
		this.partialLogin = defer();
		this.fullyLoggedIn = false;
		const loginListener = await this.loginListener();
		loginListener.reset();
		this.init();
	}
	async _determineIfWhitelabel() {
		this._isWhitelabel = await this.getUserController().isWhitelabelAccount();
	}
	isWhitelabel() {
		return this._isWhitelabel;
	}
	/**
	* Deletes the session on the server.
	* @param credentials
	* @param pushIdentifier identifier associated with this device, if any, to delete PushIdentifier on the server
	*/
	async deleteOldSession(credentials, pushIdentifier = null) {
		try {
			await this.loginFacade.deleteSession(credentials.accessToken, pushIdentifier);
		} catch (e) {
			if (e instanceof NotFoundError) console.log("session already deleted");
else throw e;
		}
	}
	async retryAsyncLogin() {
		const loginListener = await this.loginListener();
		loginListener.onRetryLogin();
		await this.loginFacade.retryAsyncLogin();
	}
};

//#endregion
//#region src/common/misc/news/NewsModel.ts
var NewsModel = class {
	liveNewsIds = [];
	liveNewsListItems = {};
	constructor(serviceExecutor, storage, newsListItemFactory) {
		this.serviceExecutor = serviceExecutor;
		this.storage = storage;
		this.newsListItemFactory = newsListItemFactory;
	}
	/**
	* Loads the user's unacknowledged NewsItems.
	*/
	async loadNewsIds() {
		const response = await this.serviceExecutor.get(NewsService, null);
		this.liveNewsIds = [];
		this.liveNewsListItems = {};
		for (const newsItemId of response.newsItemIds) {
			const newsItemName = newsItemId.newsItemName;
			const newsListItem = await this.newsListItemFactory(newsItemName);
			if (!!newsListItem && await newsListItem.isShown(newsItemId)) {
				const unsupportedIosNewsItem = isIOSApp() && ["newPlans", "newPlansOfferEnding"].includes(newsItemId.newsItemName);
				if (!unsupportedIosNewsItem) {
					this.liveNewsIds.push(newsItemId);
					this.liveNewsListItems[newsItemName] = newsListItem;
				}
			}
		}
		return this.liveNewsIds;
	}
	/**
	* Acknowledges the NewsItem with the given ID.
	*/
	async acknowledgeNews(newsItemId) {
		const data = createNewsIn({ newsItemId });
		try {
			await this.serviceExecutor.post(NewsService, data);
			return true;
		} catch (e) {
			if (e instanceof NotFoundError) {
				console.log(`Could not acknowledge newsItem with ID '${newsItemId}'`);
				return false;
			} else throw e;
		} finally {
			await this.loadNewsIds();
		}
	}
	acknowledgeNewsForDevice(newsItemId) {
		return this.storage.acknowledgeNewsItemForDevice(newsItemId);
	}
	hasAcknowledgedNewsForDevice(newsItemId) {
		return this.storage.hasAcknowledgedNewsItemForDevice(newsItemId);
	}
};

//#endregion
//#region src/common/misc/WebsocketConnectivityModel.ts
var import_stream$3 = __toESM(require_stream(), 1);
var WebsocketConnectivityModel = class {
	wsState = (0, import_stream$3.default)(WsConnectionState.terminated);
	leaderStatus = false;
	constructor(eventBus) {
		this.eventBus = eventBus;
	}
	async updateWebSocketState(wsConnectionState) {
		this.wsState(wsConnectionState);
	}
	async onLeaderStatusChanged(leaderStatus) {
		this.leaderStatus = leaderStatus.leaderStatus;
	}
	isLeader() {
		return this.leaderStatus;
	}
	wsConnection() {
		return this.wsState.map(identity);
	}
	tryReconnect(closeIfOpen, enableAutomaticState, delay = null) {
		return this.eventBus.tryReconnect(closeIfOpen, enableAutomaticState, delay);
	}
	close(option) {
		return this.eventBus.close(option);
	}
};

//#endregion
//#region src/common/api/main/OperationProgressTracker.ts
var import_stream$2 = __toESM(require_stream(), 1);
var OperationProgressTracker = class {
	progressPerOp = new Map();
	operationId = 0;
	/**
	* Prepares a new operation and gives a handle for it which contains:
	*   - id for sending updates
	*   - progress, a stream to observe
	*   - done, a handle to stop tracking the operation progress
	*/
	startNewOperation() {
		const id = this.operationId++;
		const progress = (0, import_stream$2.default)(0);
		this.progressPerOp.set(id, progress);
		return {
			id,
			progress,
			done: () => this.progressPerOp.delete(id)
		};
	}
	/** Updates the progress for {@param operation} with {@param progressValue}. */
	async onProgress(operation, progressValue) {
		this.progressPerOp.get(operation)?.(progressValue);
	}
};

//#endregion
//#region src/common/gui/InfoMessageHandler.ts
assertMainOrNode();
var InfoMessageHandler = class {
	constructor(handleIndexStateUpdate) {
		this.handleIndexStateUpdate = handleIndexStateUpdate;
	}
	async onInfoMessage(message) {
		show({ view: () => mithril_default("", lang.get(message.translationKey, message.args)) }, { label: "close_alt" }, []);
	}
	async onSearchIndexStateUpdate(state) {
		this.handleIndexStateUpdate(state);
	}
};

//#endregion
//#region src/common/gui/base/OfflineIndicatorViewModel.ts
var OfflineIndicatorViewModel = class {
	lastProgress = PROGRESS_DONE;
	lastWsState = WsConnectionState.connecting;
	lastUpdate = null;
	/**
	* keeping this prevents flashing misleading states during login when
	* the full login succeeded but the ws connection attempt didn't
	* succeed or fail yet.
	* wsState is "connecting" both during first connect attempt and after we
	* disconnected.
	**/
	wsWasConnectedBefore = false;
	constructor(cacheStorage, loginListener, connectivityModel, logins, progressTracker, cb) {
		this.cacheStorage = cacheStorage;
		this.loginListener = loginListener;
		this.connectivityModel = connectivityModel;
		this.logins = logins;
		this.cb = cb;
		logins.waitForFullLogin().then(() => this.cb());
		this.setProgressUpdateStream(progressTracker.onProgressUpdate);
		this.setWsStateStream(this.connectivityModel.wsConnection());
	}
	setProgressUpdateStream(progressStream) {
		progressStream.map((progress) => this.onProgressUpdate(progress));
		this.onProgressUpdate(progressStream());
	}
	setWsStateStream(wsStream) {
		wsStream.map((state) => {
			this.onWsStateChange(state);
		});
		this.onWsStateChange(wsStream()).then();
	}
	onProgressUpdate(progress) {
		this.lastProgress = progress;
		this.cb();
	}
	async onWsStateChange(newState) {
		this.lastWsState = newState;
		if (newState !== WsConnectionState.connected) {
			const lastUpdate = await this.cacheStorage.getLastUpdateTime();
			switch (lastUpdate.type) {
				case "recorded":
					this.lastUpdate = new Date(lastUpdate.time);
					break;
				case "never":
				case "uninitialized":
					this.lastUpdate = null;
					this.wsWasConnectedBefore = false;
					break;
			}
		} else this.wsWasConnectedBefore = true;
		this.cb();
	}
	getCurrentAttrs() {
		const isSingleColumn = styles.isUsingBottomNavigation();
		if (this.logins.isFullyLoggedIn() && this.wsWasConnectedBefore) if (this.lastWsState === WsConnectionState.connected) if (this.lastProgress < PROGRESS_DONE) return {
			state: OfflineIndicatorState.Synchronizing,
			progress: this.lastProgress,
			isSingleColumn
		};
else return {
			state: OfflineIndicatorState.Online,
			isSingleColumn
		};
else return {
			state: OfflineIndicatorState.Offline,
			lastUpdate: this.lastUpdate,
			reconnectAction: () => {
				console.log("try reconnect ws");
				this.connectivityModel.tryReconnect(true, true, 2e3);
			},
			isSingleColumn
		};
else if (this.loginListener.getFullLoginFailed()) return {
			state: OfflineIndicatorState.Offline,
			lastUpdate: this.lastUpdate,
			reconnectAction: () => {
				console.log("try full login");
				this.logins.retryAsyncLogin().finally(() => this.cb());
			},
			isSingleColumn
		};
else return {
			state: OfflineIndicatorState.Connecting,
			isSingleColumn
		};
	}
	getProgress() {
		const a = this.getCurrentAttrs();
		return a.state === OfflineIndicatorState.Synchronizing && this.logins?.isUserLoggedIn() ? a.progress : 1;
	}
};

//#endregion
//#region src/common/gui/ScopedRouter.ts
var ThrottledRouter = class {
	throttledRoute = debounceStart(32, throttleRoute());
	getFullPath() {
		return mithril_default.route.get();
	}
	routeTo(path, params) {
		this.throttledRoute(path, params);
	}
};
var ScopedRouter = class {
	scope;
	constructor(router, scope) {
		this.router = router;
		if (!scope.startsWith("/")) throw new ProgrammingError(`Scope must start with a forward slash! got: ${scope}`);
		if (scope.split("/").length > 2) throw new ProgrammingError(`Does not support nested scopes yet. Easter egg! got: ${scope}`);
		this.scope = scope.substring(1);
	}
	getFullPath() {
		return this.router.getFullPath();
	}
	routeTo(path, params) {
		if (routeMatchesPrefix(this.scope, this.router.getFullPath())) this.router.routeTo(path, params);
	}
};
function routeMatchesPrefix(prefixWithoutLeadingSlash, route) {
	const { path } = mithril_default.parsePathname(route);
	return path.split("/")[1] === prefixWithoutLeadingSlash;
}

//#endregion
//#region src/mail-app/mail/model/InboxRuleHandler.ts
assertMainOrNode();
const moveMailDataPerFolder = [];
const DEBOUNCE_FIRST_MOVE_MAIL_REQUEST_MS = 200;
let applyingRules = false;
async function sendMoveMailRequest(mailFacade) {
	if (moveMailDataPerFolder.length) {
		const moveToTargetFolder = assertNotNull(moveMailDataPerFolder.shift());
		const mailChunks = splitInChunks(MAX_NBR_MOVE_DELETE_MAIL_SERVICE, moveToTargetFolder.mails);
		await pMap(mailChunks, (mailChunk) => {
			moveToTargetFolder.mails = mailChunk;
			const sourceFolder = assertNotNull(moveToTargetFolder.sourceFolder);
			return mailFacade.moveMails(mailChunk, sourceFolder, moveToTargetFolder.targetFolder);
		}).catch(ofClass(LockedError, (e) => {
			console.log("moving mail failed", e, moveToTargetFolder);
		})).catch(ofClass(PreconditionFailedError, (e) => {
			console.log("moving mail failed", e, moveToTargetFolder);
		})).finally(() => {
			return sendMoveMailRequest(mailFacade);
		});
	}
}
const applyMatchingRules = throttle(DEBOUNCE_FIRST_MOVE_MAIL_REQUEST_MS, (mailFacade) => {
	if (applyingRules) return;
	applyingRules = true;
	sendMoveMailRequest(mailFacade).finally(() => {
		applyingRules = false;
	});
});
function getInboxRuleTypeNameMapping() {
	return [
		{
			value: InboxRuleType.FROM_EQUALS,
			name: lang.get("inboxRuleSenderEquals_action")
		},
		{
			value: InboxRuleType.RECIPIENT_TO_EQUALS,
			name: lang.get("inboxRuleToRecipientEquals_action")
		},
		{
			value: InboxRuleType.RECIPIENT_CC_EQUALS,
			name: lang.get("inboxRuleCCRecipientEquals_action")
		},
		{
			value: InboxRuleType.RECIPIENT_BCC_EQUALS,
			name: lang.get("inboxRuleBCCRecipientEquals_action")
		},
		{
			value: InboxRuleType.SUBJECT_CONTAINS,
			name: lang.get("inboxRuleSubjectContains_action")
		},
		{
			value: InboxRuleType.MAIL_HEADER_CONTAINS,
			name: lang.get("inboxRuleMailHeaderContains_action")
		}
	];
}
function getInboxRuleTypeName(type) {
	let typeNameMapping = getInboxRuleTypeNameMapping().find((t) => t.value === type);
	return typeNameMapping != null ? typeNameMapping.name : "";
}
var InboxRuleHandler = class {
	constructor(mailFacade, logins) {
		this.mailFacade = mailFacade;
		this.logins = logins;
	}
	/**
	* Checks the mail for an existing inbox rule and moves the mail to the target folder of the rule.
	* @returns true if a rule matches otherwise false
	*/
	async findAndApplyMatchingRule(mailboxDetail, mail, applyRulesOnServer) {
		if (mail._errors || !mail.unread || !await isInboxFolder(mailboxDetail, mail) || !this.logins.getUserController().isPremiumAccount() || mailboxDetail.mailbox.folders == null) return null;
		const inboxRule = await _findMatchingRule(this.mailFacade, mail, this.logins.getUserController().props.inboxRules);
		if (inboxRule) {
			const folders = await mailLocator.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id);
			const inboxFolder = assertNotNull(folders.getSystemFolderByType(MailSetKind.INBOX));
			const targetFolder = folders.getFolderById(elementIdPart(inboxRule.targetFolder));
			if (targetFolder && targetFolder.folderType !== MailSetKind.INBOX) {
				if (applyRulesOnServer) {
					let moveMailData = moveMailDataPerFolder.find((folderMoveMailData) => isSameId(folderMoveMailData.targetFolder, inboxRule.targetFolder));
					if (moveMailData) moveMailData.mails.push(mail._id);
else {
						moveMailData = createMoveMailData({
							sourceFolder: inboxFolder._id,
							targetFolder: inboxRule.targetFolder,
							mails: [mail._id]
						});
						moveMailDataPerFolder.push(moveMailData);
					}
					applyMatchingRules(this.mailFacade);
				}
				return {
					folder: targetFolder,
					mail
				};
			} else return null;
		} else return null;
	}
};
async function _findMatchingRule(mailFacade, mail, rules) {
	return asyncFind(rules, (rule) => checkInboxRule(mailFacade, mail, rule)).then((v) => v ?? null);
}
async function checkInboxRule(mailFacade, mail, inboxRule) {
	const ruleType = inboxRule.type;
	try {
		if (ruleType === InboxRuleType.FROM_EQUALS) {
			let mailAddresses = [mail.sender.address];
			if (mail.differentEnvelopeSender) mailAddresses.push(mail.differentEnvelopeSender);
			return _checkEmailAddresses(mailAddresses, inboxRule);
		} else if (ruleType === InboxRuleType.RECIPIENT_TO_EQUALS) {
			const toRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.toRecipients;
			return _checkEmailAddresses(toRecipients.map((m) => m.address), inboxRule);
		} else if (ruleType === InboxRuleType.RECIPIENT_CC_EQUALS) {
			const ccRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.ccRecipients;
			return _checkEmailAddresses(ccRecipients.map((m) => m.address), inboxRule);
		} else if (ruleType === InboxRuleType.RECIPIENT_BCC_EQUALS) {
			const bccRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.bccRecipients;
			return _checkEmailAddresses(bccRecipients.map((m) => m.address), inboxRule);
		} else if (ruleType === InboxRuleType.SUBJECT_CONTAINS) return _checkContainsRule(mail.subject, inboxRule);
else if (ruleType === InboxRuleType.MAIL_HEADER_CONTAINS) {
			const details = await mailFacade.loadMailDetailsBlob(mail);
			if (details.headers != null) return _checkContainsRule(getMailHeaders(details.headers), inboxRule);
else return false;
		} else {
			console.warn("Unknown rule type: ", inboxRule.type);
			return false;
		}
	} catch (e) {
		console.error("Error processing inbox rule:", e.message);
		return false;
	}
}
function _checkContainsRule(value, inboxRule) {
	return isRegularExpression(inboxRule.value) && _matchesRegularExpression(value, inboxRule) || value.includes(inboxRule.value);
}
function _matchesRegularExpression(value, inboxRule) {
	if (isRegularExpression(inboxRule.value)) {
		let flags = inboxRule.value.replace(/.*\/([gimsuy]*)$/, "$1");
		let pattern = inboxRule.value.replace(new RegExp("^/(.*?)/" + flags + "$"), "$1");
		let regExp = new RegExp(pattern, flags);
		return regExp.test(value);
	}
	return false;
}
function _checkEmailAddresses(mailAddresses, inboxRule) {
	const mailAddress = mailAddresses.find((mailAddress$1) => {
		let cleanMailAddress = mailAddress$1.toLowerCase().trim();
		if (isRegularExpression(inboxRule.value)) return _matchesRegularExpression(cleanMailAddress, inboxRule);
else if (isDomainName(inboxRule.value)) {
			let domain = cleanMailAddress.split("@")[1];
			return domain === inboxRule.value;
		} else return cleanMailAddress === inboxRule.value;
	});
	return mailAddress != null;
}
async function isInboxFolder(mailboxDetail, mail) {
	const folders = await mailLocator.mailModel.getMailboxFoldersForId(assertNotNull(mailboxDetail.mailbox.folders)._id);
	const mailFolder = folders.getFolderByMail(mail);
	return mailFolder?.folderType === MailSetKind.INBOX;
}

//#endregion
//#region src/common/api/main/EntropyCollector.ts
assertMainOrNode();
var EntropyCollector = class EntropyCollector {
	static SEND_INTERVAL = 5e3;
	stopped = true;
	entropyCache = [];
	constructor(entropyFacade, scheduler, window$1) {
		this.entropyFacade = entropyFacade;
		this.scheduler = scheduler;
		this.window = window$1;
	}
	mouse = (e) => {
		const value = e.clientX ^ e.clientY;
		this.addEntropy(value, 2, "mouse");
	};
	keyDown = (e) => {
		const value = e.key ? e.key.charCodeAt(0) : undefined;
		this.addEntropy(value, 2, "key");
	};
	touch = (e) => {
		const value = e.touches[0].clientX ^ e.touches[0].clientY;
		this.addEntropy(value, 2, "touch");
	};
	/** e is a DeviceMotionEvent but it's typed in a very annoying way */
	accelerometer = (e) => {
		if (e.accelerationIncludingGravity) this.addEntropy(e.accelerationIncludingGravity.x ^ e.accelerationIncludingGravity.y ^ e.accelerationIncludingGravity.z, 2, "accel");
		this.addEntropy(this.window.screen.orientation.angle, 0, "accel");
	};
	/**
	* Adds entropy to the random number generator algorithm
	* @param data Any number value, or undefined
	* @param entropy The amount of entropy in the number in bit.
	* @param source The source of the number. One of RandomizerInterface.ENTROPY_SRC_*.
	*/
	addEntropy(data, entropy, source) {
		if (data) this.entropyCache.push({
			source,
			entropy,
			data
		});
		if (this.window.performance && typeof window.performance.now === "function") this.entropyCache.push({
			source: "time",
			entropy: 2,
			data: this.window.performance.now()
		});
else this.entropyCache.push({
			source: "time",
			entropy: 2,
			data: new Date().valueOf()
		});
	}
	start() {
		this.addPerformanceTimingValues();
		this.window.addEventListener("mousemove", this.mouse);
		this.window.addEventListener("click", this.mouse);
		this.window.addEventListener("touchstart", this.touch);
		this.window.addEventListener("touchmove", this.touch);
		this.window.addEventListener("keydown", this.keyDown);
		this.window.addEventListener("devicemotion", this.accelerometer);
		this.scheduler.schedulePeriodic(() => this.sendEntropyToWorker(), EntropyCollector.SEND_INTERVAL);
		this.stopped = false;
	}
	addPerformanceTimingValues() {
		if (!this.window.performance) return;
		const entries = this.window.performance.getEntries();
		let added = [];
		for (const entry of entries.map((e) => e.toJSON())) for (let key in entry) {
			const value = entry[key];
			if (typeof value === "number" && value !== 0) {
				if (added.indexOf(value) === -1) {
					this.addEntropy(value, 1, "static");
					added.push(value);
				}
			}
		}
	}
	/**
	* Add data from secure random source as entropy.
	*/
	addNativeRandomValues(nbrOf32BitValues) {
		let valueList = new Uint32Array(nbrOf32BitValues);
		this.window.crypto.getRandomValues(valueList);
		for (let i = 0; i < valueList.length; i++) this.addEntropy(valueList[i], 32, "random");
	}
	sendEntropyToWorker() {
		if (this.entropyCache.length > 0) {
			this.addNativeRandomValues(1);
			this.entropyFacade.addEntropy(this.entropyCache);
			this.entropyCache = [];
		}
	}
	stop() {
		this.stopped = true;
		this.window.removeEventListener("mousemove", this.mouse);
		this.window.removeEventListener("mouseclick", this.mouse);
		this.window.removeEventListener("touchstart", this.touch);
		this.window.removeEventListener("touchmove", this.touch);
		this.window.removeEventListener("keydown", this.keyDown);
		this.window.removeEventListener("devicemotion", this.accelerometer);
	}
};

//#endregion
//#region src/common/file/FileControllerBrowser.ts
assertMainOrNode();
var FileControllerBrowser = class extends FileController {
	constructor(blobFacade, guiDownload$1) {
		super(blobFacade, guiDownload$1);
	}
	async saveDataFile(file) {
		return openDataFileInBrowser(file);
	}
	async downloadAndDecrypt(file) {
		return this.getAsDataFile(file);
	}
	async writeDownloadedFiles(downloadedFiles) {
		if (downloadedFiles.length < 1) return;
		assertOnlyDataFiles(downloadedFiles);
		const fileToSave = downloadedFiles.length > 1 ? await zipDataFiles(downloadedFiles, `${sortableTimestamp()}-attachments.zip`) : downloadedFiles[0];
		return await openDataFileInBrowser(fileToSave);
	}
	async cleanUp(downloadedFiles) {}
	async openDownloadedFiles(downloadedFiles) {
		return await this.writeDownloadedFiles(downloadedFiles);
	}
};

//#endregion
//#region src/common/file/FileControllerNative.ts
assertMainOrNode();
var FileControllerNative = class extends FileController {
	constructor(blobFacade, guiDownload$1, fileApp) {
		assert(isElectronClient() || isApp() || isTest(), "Don't make native file controller when not in native");
		super(blobFacade, guiDownload$1);
		this.fileApp = fileApp;
	}
	async cleanUp(files) {
		assertOnlyFileReferences(files);
		if (files.length > 0) for (const file of files) try {
			await this.fileApp.deleteFile(file.location);
		} catch (e) {
			console.log("failed to delete file", file.location, e);
		}
	}
	/**
	* Does not delete temporary file in app.
	*/
	async saveDataFile(file) {
		try {
			const fileReference = await this.fileApp.writeDataFile(file);
			if (isAndroidApp() || isDesktop()) {
				await this.fileApp.putFileIntoDownloadsFolder(fileReference.location, fileReference.name);
				return;
			} else if (isIOSApp()) return this.fileApp.open(fileReference);
		} catch (e) {
			if (e instanceof CancelledError) console.log("saveDataFile cancelled");
else {
				console.warn("openDataFile failed", e);
				await Dialog.message("canNotOpenFileOnDevice_msg");
			}
		}
	}
	/** Public for testing */
	async downloadAndDecrypt(tutanotaFile) {
		return await this.blobFacade.downloadAndDecryptNative(ArchiveDataType.Attachments, createReferencingInstance(tutanotaFile), tutanotaFile.name, assertNotNull(tutanotaFile.mimeType, "tried to call blobfacade.downloadAndDecryptNative with null mimeType"));
	}
	async writeDownloadedFiles(downloadedFiles) {
		if (isIOSApp()) await this.processDownloadedFilesIOS(downloadedFiles);
else if (isDesktop()) await this.processDownloadedFilesDesktop(downloadedFiles);
else if (isAndroidApp()) await pMap(downloadedFiles, (file) => this.fileApp.putFileIntoDownloadsFolder(file.location, file.name));
else throw new ProgrammingError("in filecontroller native but not in ios, android or desktop? - tried to write");
	}
	async openDownloadedFiles(downloadedFiles) {
		if (isIOSApp()) await this.processDownloadedFilesIOS(downloadedFiles);
else if (isDesktop() || isAndroidApp()) await this.openFiles(downloadedFiles);
else throw new ProgrammingError("in filecontroller native but not in ios, android or desktop? - tried to open");
	}
	/**
	* for downloading multiple files on desktop. multiple files are bundled in a zip file, single files
	*
	* we could use the same strategy as on android, but
	* if the user doesn't have a default dl path selected on desktop,
	* the client will ask for a location for each file separately, so we zip them for now.
	*/
	async processDownloadedFilesDesktop(downloadedFiles) {
		if (downloadedFiles.length < 1) return;
		console.log("downloaded files in processing", downloadedFiles);
		const dataFiles = (await pMap(downloadedFiles, (f) => this.fileApp.readDataFile(f.location))).filter(Boolean);
		const fileInTemp = dataFiles.length === 1 ? downloadedFiles[0] : await this.fileApp.writeDataFile(await zipDataFiles(dataFiles, `${sortableTimestamp()}-attachments.zip`));
		await this.fileApp.putFileIntoDownloadsFolder(fileInTemp.location, fileInTemp.name);
	}
	async processDownloadedFilesIOS(downloadedFiles) {
		await pMap(downloadedFiles, async (file) => {
			try {
				await this.fileApp.open(file);
			} finally {
				await this.fileApp.deleteFile(file.location).catch((e) => console.log("failed to delete file", file.location, e));
			}
		});
	}
	async openFiles(downloadedFiles) {
		return pMap(downloadedFiles, async (file) => {
			try {
				await this.fileApp.open(file);
			} finally {
				if (isApp()) await this.fileApp.deleteFile(file.location).catch((e) => console.log("failed to delete file", file.location, e));
			}
		});
	}
};

//#endregion
//#region src/mail-app/contacts/model/NativeContactsSyncManager.ts
assertMainOrNode();
var NativeContactsSyncManager = class {
	entityUpdateLock = Promise.resolve();
	constructor(loginController, mobileContactsFacade, entityClient, eventController, contactModel, deviceConfig$1) {
		this.loginController = loginController;
		this.mobileContactsFacade = mobileContactsFacade;
		this.entityClient = entityClient;
		this.eventController = eventController;
		this.contactModel = contactModel;
		this.deviceConfig = deviceConfig$1;
		this.eventController.addEntityListener((updates) => this.nativeContactEntityEventsListener(updates));
	}
	async nativeContactEntityEventsListener(events) {
		await this.entityUpdateLock;
		await this.processContactEventUpdate(events);
	}
	async processContactEventUpdate(events) {
		const loginUsername = this.loginController.getUserController().loginUsername;
		const userId = this.loginController.getUserController().userId;
		const allowSync = this.deviceConfig.getUserSyncContactsWithPhonePreference(userId) ?? false;
		if (!allowSync) return;
		const contactsIdToCreateOrUpdate = new Map();
		for (const event of events) {
			if (!isUpdateForTypeRef(ContactTypeRef, event)) continue;
			if (event.operation === OperationType.CREATE) getFromMap(contactsIdToCreateOrUpdate, event.instanceListId, () => []).push(event.instanceId);
else if (event.operation === OperationType.UPDATE) getFromMap(contactsIdToCreateOrUpdate, event.instanceListId, () => []).push(event.instanceId);
else if (event.operation === OperationType.DELETE) await this.mobileContactsFacade.deleteContacts(loginUsername, event.instanceId).catch(ofClass(PermissionError, (e) => this.handleNoPermissionError(userId, e))).catch(ofClass(ContactStoreError, (e) => console.warn("Could not delete contact during sync: ", e)));
		}
		const contactsToInsertOrUpdate = [];
		for (const [listId, elementIds] of contactsIdToCreateOrUpdate.entries()) {
			const contactList = await this.entityClient.loadMultiple(ContactTypeRef, listId, elementIds);
			contactList.map((contact) => {
				contactsToInsertOrUpdate.push({
					id: getElementId(contact),
					firstName: contact.firstName,
					lastName: contact.lastName,
					nickname: contact.nickname ?? "",
					birthday: contact.birthdayIso,
					company: contact.company,
					mailAddresses: extractStructuredMailAddresses(contact.mailAddresses),
					phoneNumbers: extractStructuredPhoneNumbers(contact.phoneNumbers),
					addresses: extractStructuredAddresses(contact.addresses),
					rawId: null,
					customDate: extractStructuredCustomDates(contact.customDate),
					department: contact.department,
					messengerHandles: extractStructuredMessengerHandle(contact.messengerHandles),
					middleName: contact.middleName,
					nameSuffix: contact.nameSuffix,
					phoneticFirst: contact.phoneticFirst,
					phoneticLast: contact.phoneticLast,
					phoneticMiddle: contact.phoneticMiddle,
					relationships: extractStructuredRelationships(contact.relationships),
					websites: extractStructuredWebsites(contact.websites),
					notes: contact.comment,
					title: contact.title ?? "",
					role: contact.role
				});
			});
		}
		if (contactsToInsertOrUpdate.length > 0) await this.mobileContactsFacade.saveContacts(loginUsername, contactsToInsertOrUpdate).catch(ofClass(PermissionError, (e) => this.handleNoPermissionError(userId, e))).catch(ofClass(ContactStoreError, (e) => console.warn("Could not save contacts:", e)));
	}
	isEnabled() {
		return this.deviceConfig.getUserSyncContactsWithPhonePreference(this.loginController.getUserController().userId) ?? false;
	}
	/**
	* @return is sync succeeded. It might fail if we don't have a permission.
	*/
	async enableSync() {
		const loginUsername = this.loginController.getUserController().loginUsername;
		const contactListId = await this.contactModel.getContactListId();
		if (contactListId == null) return false;
		const contacts = await this.entityClient.loadAll(ContactTypeRef, contactListId);
		const structuredContacts = contacts.map((c) => this.toStructuredContact(c));
		try {
			await this.mobileContactsFacade.syncContacts(loginUsername, structuredContacts);
		} catch (e) {
			console.warn("Could not sync contacts:", e);
			if (e instanceof PermissionError) return false;
else if (e instanceof ContactStoreError) return false;
			throw e;
		}
		this.deviceConfig.setUserSyncContactsWithPhonePreference(this.loginController.getUserController().userId, true);
		await this.askToDedupeContacts(structuredContacts);
		return true;
	}
	/**
	* Check if syncing contacts is possible/allowed right now.
	*
	* On Android, this method simply requests permission to access contacts. On iOS, this also checks iCloud sync, as
	* it can interfere with
	*/
	async canSync() {
		if (!isApp()) throw new ProgrammingError("Can only check Contact permissions on app");
		const isContactPermissionGranted = await locator.systemPermissionHandler.requestPermission(PermissionType.Contacts, "allowContactReadWrite_msg");
		if (!isContactPermissionGranted) return false;
		return !isIOSApp() || this.checkIfExternalCloudSyncOnIos();
	}
	/**
	* Check that we are allowed to sync contacts on an iOS device
	* @returns false if no permission or iCloud sync is enabled and the user cancelled, or true if permission is granted and iCloud sync is disabled (or the user bypassed the warning dialog)
	*/
	async checkIfExternalCloudSyncOnIos() {
		assert(isIOSApp(), "Can only check cloud syncing on iOS");
		let localContactStorage = await this.mobileContactsFacade.isLocalStorageAvailable();
		if (!localContactStorage) {
			const choice = await Dialog.choiceVertical("externalContactSyncDetectedWarning_msg", [
				{
					text: "settings_label",
					value: "settings",
					type: "primary"
				},
				{
					text: "enableAnyway_action",
					value: "enable"
				},
				{
					text: "cancel_action",
					value: "cancel"
				}
			]);
			switch (choice) {
				case "enable": break;
				case "settings":
					locator.systemFacade.openLink("App-prefs:CONTACTS&path=ACCOUNTS");
					return false;
				case "cancel": return false;
			}
		}
		return true;
	}
	/**
	* @return is sync succeeded. It might fail if we don't have a permission.
	*/
	async syncContacts() {
		if (!this.isEnabled()) return false;
		const contactListId = await this.contactModel.getContactListId();
		if (contactListId == null) return false;
		const userId = this.loginController.getUserController().userId;
		const loginUsername = this.loginController.getUserController().loginUsername;
		const contacts = await this.entityClient.loadAll(ContactTypeRef, contactListId);
		const structuredContacts = contacts.map((contact) => this.toStructuredContact(contact));
		try {
			const syncResult = await this.mobileContactsFacade.syncContacts(loginUsername, structuredContacts);
			await this.applyDeviceChangesToServerContacts(contacts, syncResult, contactListId);
		} catch (e) {
			if (e instanceof PermissionError) {
				this.handleNoPermissionError(userId, e);
				return false;
			} else if (e instanceof ContactStoreError) {
				console.warn("Could not sync contacts:", e);
				return false;
			}
			throw e;
		}
		return true;
	}
	async askToDedupeContacts(contactsToDedupe) {
		const duplicateContacts = await this.mobileContactsFacade.findLocalMatches(contactsToDedupe);
		if (duplicateContacts.length === 0) return;
		const shouldDedupe = await Dialog.confirm(lang.getTranslation("importContactRemoveDuplicatesConfirm_msg", { "{count}": duplicateContacts.length }));
		if (shouldDedupe) await showProgressDialog("progressDeleting_msg", this.mobileContactsFacade.deleteLocalContacts(duplicateContacts));
	}
	toStructuredContact(contact) {
		return {
			id: getElementId(contact),
			firstName: contact.firstName,
			lastName: contact.lastName,
			mailAddresses: extractStructuredMailAddresses(contact.mailAddresses),
			phoneNumbers: extractStructuredPhoneNumbers(contact.phoneNumbers),
			nickname: contact.nickname ?? "",
			company: contact.company,
			birthday: contact.birthdayIso,
			addresses: extractStructuredAddresses(contact.addresses),
			rawId: null,
			customDate: extractStructuredCustomDates(contact.customDate),
			department: contact.department,
			messengerHandles: extractStructuredMessengerHandle(contact.messengerHandles),
			middleName: contact.middleName,
			nameSuffix: contact.nameSuffix,
			phoneticFirst: contact.phoneticFirst,
			phoneticLast: contact.phoneticLast,
			phoneticMiddle: contact.phoneticMiddle,
			relationships: extractStructuredRelationships(contact.relationships),
			websites: extractStructuredWebsites(contact.websites),
			notes: contact.comment,
			title: contact.title ?? "",
			role: contact.role
		};
	}
	async disableSync(userId, login) {
		const userIdToRemove = userId ?? this.loginController.getUserController().userId;
		if (this.deviceConfig.getUserSyncContactsWithPhonePreference(userIdToRemove)) {
			this.deviceConfig.setUserSyncContactsWithPhonePreference(userIdToRemove, false);
			await this.mobileContactsFacade.deleteContacts(login ?? this.loginController.getUserController().loginUsername, null).catch(ofClass(PermissionError, (e) => console.log("No permission to clear contacts", e)));
		}
	}
	handleNoPermissionError(userId, error) {
		console.log("No permission to sync contacts, disabling sync", error);
		this.deviceConfig.setUserSyncContactsWithPhonePreference(userId, false);
	}
	async applyDeviceChangesToServerContacts(contacts, syncResult, listId) {
		const entityUpdateDefer = defer();
		this.entityUpdateLock = entityUpdateDefer.promise;
		await this.loginController.waitForFullLogin();
		for (const contact of syncResult.createdOnDevice) {
			const newContact = createContact(this.createContactFromNative(contact));
			const entityId = await this.entityClient.setup(listId, newContact);
			const loginUsername = this.loginController.getUserController().loginUsername;
			await this.mobileContactsFacade.saveContacts(loginUsername, [{
				...contact,
				id: entityId
			}]);
		}
		for (const contact of syncResult.editedOnDevice) {
			const cleanContact = contacts.find((c) => elementIdPart(c._id) === contact.id);
			if (cleanContact == null) console.warn("Could not find a server contact for the contact edited on device: ", contact.id);
else {
				const updatedContact = this.mergeNativeContactWithTutaContact(contact, cleanContact);
				try {
					await this.entityClient.update(updatedContact);
				} catch (e) {
					if (e instanceof NotFoundError) console.warn("Not found contact to update during sync: ", cleanContact._id, e);
else throw e;
				}
			}
		}
		for (const deletedContactId of syncResult.deletedOnDevice) {
			const cleanContact = contacts.find((c) => elementIdPart(c._id) === deletedContactId);
			if (cleanContact == null) console.warn("Could not find a server contact for the contact deleted on device: ", deletedContactId);
else try {
				await this.entityClient.erase(cleanContact);
			} catch (e) {
				if (e instanceof NotFoundError) console.warn("Not found contact to delete during sync: ", cleanContact._id, e);
else throw e;
			}
		}
		entityUpdateDefer.resolve();
	}
	createContactFromNative(contact) {
		return {
			_ownerGroup: getFirstOrThrow(this.loginController.getUserController().user.memberships.filter((membership) => membership.groupType === GroupType.Contact)).group,
			oldBirthdayDate: null,
			presharedPassword: null,
			oldBirthdayAggregate: null,
			photo: null,
			socialIds: [],
			firstName: contact.firstName,
			lastName: contact.lastName,
			mailAddresses: contact.mailAddresses.map((mail) => createContactMailAddress(mail)),
			phoneNumbers: contact.phoneNumbers.map((phone) => createContactPhoneNumber(phone)),
			nickname: contact.nickname,
			company: contact.company,
			birthdayIso: contact.birthday,
			addresses: contact.addresses.map((address) => createContactAddress(address)),
			customDate: contact.customDate.map((date) => createContactCustomDate(date)),
			department: contact.department,
			messengerHandles: contact.messengerHandles.map((handle) => createContactMessengerHandle(handle)),
			middleName: contact.middleName,
			nameSuffix: contact.nameSuffix,
			phoneticFirst: contact.phoneticFirst,
			phoneticLast: contact.phoneticLast,
			phoneticMiddle: contact.phoneticMiddle,
			pronouns: [],
			relationships: contact.relationships.map((relation) => createContactRelationship(relation)),
			websites: contact.websites.map((website) => createContactWebsite(website)),
			comment: contact.notes,
			title: contact.title ?? "",
			role: contact.role
		};
	}
	mergeNativeContactWithTutaContact(contact, partialContact) {
		const canMergeCommentField = !isIOSApp();
		return {
			...partialContact,
			firstName: contact.firstName,
			lastName: contact.lastName,
			mailAddresses: contact.mailAddresses.map((mail) => createContactMailAddress(mail)),
			phoneNumbers: contact.phoneNumbers.map((phone) => createContactPhoneNumber(phone)),
			nickname: contact.nickname,
			company: contact.company,
			birthdayIso: contact.birthday,
			addresses: contact.addresses.map((address) => createContactAddress(address)),
			customDate: contact.customDate.map((date) => createContactCustomDate(date)),
			department: contact.department,
			messengerHandles: contact.messengerHandles.map((handle) => createContactMessengerHandle(handle)),
			middleName: contact.middleName,
			nameSuffix: contact.nameSuffix,
			phoneticFirst: contact.phoneticFirst,
			phoneticLast: contact.phoneticLast,
			phoneticMiddle: contact.phoneticMiddle,
			relationships: contact.relationships.map((relation) => createContactRelationship(relation)),
			websites: contact.websites.map((website) => createContactWebsite(website)),
			comment: canMergeCommentField ? contact.notes : partialContact.comment,
			title: contact.title ?? "",
			role: contact.role
		};
	}
};

//#endregion
//#region src/common/gui/ThemeController.ts
var import_stream$1 = __toESM(require_stream(), 1);
assertMainOrNodeBoot();
const defaultThemeId = "light";
var ThemeController = class {
	theme;
	_themeId;
	_themePreference;
	observableThemeId;
	initialized;
	constructor(themeSingleton, themeFacade, htmlSanitizer, app) {
		this.themeFacade = themeFacade;
		this.htmlSanitizer = htmlSanitizer;
		this.app = app;
		this._themeId = defaultThemeId;
		this._themePreference = "auto:light|dark";
		this.theme = Object.assign(themeSingleton, this.getDefaultTheme());
		this.observableThemeId = (0, import_stream$1.default)(this.themeId);
		this.initialized = Promise.all([this._initializeTheme(), this.updateSavedBuiltinThemes()]);
	}
	async _initializeTheme() {
		const whitelabelCustomizations = getWhitelabelCustomizations(window);
		if (whitelabelCustomizations && whitelabelCustomizations.theme) {
			const assembledTheme = await this.applyCustomizations(whitelabelCustomizations.theme, false);
			this._themePreference = assembledTheme.themeId;
		} else {
			const themeJson = window.location.href ? new URL(window.location.href).searchParams.get("theme") : null;
			if ((isApp() || isDesktop()) && themeJson) {
				const parsedTheme = this.parseCustomizations(themeJson);
				await this.applyCustomizations(parsedTheme, false);
			}
			await this.setThemePreference(await this.themeFacade.getThemePreference() ?? this._themePreference);
		}
	}
	parseCustomizations(stringTheme) {
		return JSON.parse(stringTheme, (k, v) => k === "__proto__" ? undefined : v);
	}
	async updateSavedBuiltinThemes() {
		for (const theme$1 of typedValues(themes())) await this.updateSavedThemeDefinition(theme$1);
		const oldThemes = await this.themeFacade.getThemes();
		findAndRemove(oldThemes, (t) => t.themeId === "blue");
		await this.themeFacade.setThemes(oldThemes);
		const themePreference = await this.themeFacade.getThemePreference();
		if (!themePreference || themePreference !== "blue") return;
		await this.setThemePreference("auto:light|dark", true);
	}
	async reloadTheme() {
		const themePreference = await this.themeFacade.getThemePreference();
		if (!themePreference) return;
		await this.setThemePreference(themePreference, false);
	}
	get themeId() {
		return this._themeId;
	}
	get themePreference() {
		return this._themePreference;
	}
	async getTheme(themeId) {
		if (themes()[themeId]) return Object.assign({}, themes()[themeId]);
else {
			const loadedThemes = await this.themeFacade.getThemes();
			const customTheme = loadedThemes.find((t) => t.themeId === themeId);
			if (customTheme) {
				await this.sanitizeTheme(customTheme);
				return customTheme;
			} else return this.getDefaultTheme();
		}
	}
	getCurrentTheme() {
		return Object.assign({}, this.theme);
	}
	/**
	* Set the theme, if permanent is true then the locally saved theme will be updated
	*/
	async setThemePreference(newThemePreference, permanent = true) {
		const themeId = await this.resolveThemePreference(newThemePreference);
		const newTheme = await this.getTheme(themeId);
		this.applyTrustedTheme(newTheme, themeId);
		this._themePreference = newThemePreference;
		if (permanent) await this.themeFacade.setThemePreference(newThemePreference);
	}
	async resolveThemePreference(newThemePreference) {
		if (newThemePreference === "auto:light|dark") return await this.themeFacade.prefersDark() ? "dark" : "light";
else return newThemePreference;
	}
	applyTrustedTheme(newTheme, newThemeId) {
		for (const key of Object.keys(this.theme)) delete downcast(this.theme)[key];
		Object.assign(this.theme, this.getDefaultTheme(), newTheme);
		this._themeId = newThemeId;
		this.observableThemeId(newThemeId);
		mithril_default.redraw();
	}
	/**
	* Apply the custom theme, if permanent === true, then the new theme will be saved
	*/
	async applyCustomizations(customizations, permanent = true) {
		const updatedTheme = this.assembleTheme(customizations);
		const filledWithoutLogo = Object.assign({}, updatedTheme, { logo: "" });
		this.applyTrustedTheme(filledWithoutLogo, filledWithoutLogo.themeId);
		await this.sanitizeTheme(updatedTheme);
		this.applyTrustedTheme(updatedTheme, filledWithoutLogo.themeId);
		if (permanent) {
			this._themePreference = updatedTheme.themeId;
			await this.updateSavedThemeDefinition(updatedTheme);
			await this.themeFacade.setThemePreference(updatedTheme.themeId);
		}
		return updatedTheme;
	}
	async storeCustomThemeForCustomizations(customizations) {
		const newTheme = this.assembleTheme(customizations);
		await this.updateSavedThemeDefinition(newTheme);
	}
	async sanitizeTheme(theme$1) {
		if (theme$1.logo) {
			const logo = theme$1.logo;
			const htmlSanitizer = await this.htmlSanitizer();
			theme$1.logo = htmlSanitizer.sanitizeHTML(logo).html;
		}
	}
	/**
	* Save theme to the storage.
	*/
	async updateSavedThemeDefinition(updatedTheme) {
		const nonNullTheme = Object.assign({}, this.getDefaultTheme(), updatedTheme);
		await this.sanitizeTheme(nonNullTheme);
		const oldThemes = await this.themeFacade.getThemes();
		findAndRemove(oldThemes, (t) => t.themeId === updatedTheme.themeId);
		oldThemes.push(nonNullTheme);
		await this.themeFacade.setThemes(oldThemes);
		return nonNullTheme;
	}
	getDefaultTheme() {
		return Object.assign({}, themes()[defaultThemeId]);
	}
	getBaseTheme(baseId) {
		return Object.assign({}, themes()[baseId]);
	}
	shouldAllowChangingTheme() {
		return window.whitelabelCustomizations == null;
	}
	/**
	* Assembles a new theme object from customizations.
	*/
	assembleTheme(customizations) {
		if (!customizations.base) return Object.assign({}, customizations);
else if (customizations.base && customizations.logo) return Object.assign({}, this.getBaseTheme(customizations.base), customizations);
else {
			const themeWithoutLogo = Object.assign({}, this.getBaseTheme(customizations.base), customizations);
			const grayedLogo = this.app === AppType.Calendar ? getCalendarLogoSvg(logoDefaultGrey, logoDefaultGrey, logoDefaultGrey) : getMailLogoSvg(logoDefaultGrey, logoDefaultGrey, logoDefaultGrey);
			return {
				...themeWithoutLogo,
				...{ logo: grayedLogo }
			};
		}
	}
	async getCustomThemes() {
		return mapAndFilterNull(await this.themeFacade.getThemes(), (theme$1) => {
			return !(theme$1.themeId in themes()) ? theme$1.themeId : null;
		});
	}
};
var NativeThemeFacade = class {
	constructor(themeFacade) {
		this.themeFacade = themeFacade;
	}
	async getThemePreference() {
		const dispatcher = await this.themeFacade.getAsync();
		return dispatcher.getThemePreference();
	}
	async setThemePreference(theme$1) {
		const dispatcher = await this.themeFacade.getAsync();
		return dispatcher.setThemePreference(theme$1);
	}
	async getThemes() {
		const dispatcher = await this.themeFacade.getAsync();
		return await dispatcher.getThemes();
	}
	async setThemes(themes$1) {
		const dispatcher = await this.themeFacade.getAsync();
		return dispatcher.setThemes(themes$1);
	}
	async prefersDark() {
		const dispatcher = await this.themeFacade.getAsync();
		return dispatcher.prefersDark();
	}
};
var WebThemeFacade = class {
	mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
	constructor(deviceConfig$1) {
		this.deviceConfig = deviceConfig$1;
	}
	async getThemePreference() {
		return this.deviceConfig.getTheme();
	}
	async setThemePreference(theme$1) {
		return this.deviceConfig.setTheme(theme$1);
	}
	async getThemes() {
		return [];
	}
	async setThemes(themes$1) {}
	async prefersDark() {
		return this.mediaQuery?.matches ?? false;
	}
	addDarkListener(listener) {
		this.mediaQuery?.addEventListener("change", listener);
	}
};

//#endregion
//#region src/mail-app/mail/model/MailModel.ts
var import_stream = __toESM(require_stream(), 1);
let LabelState = function(LabelState$1) {
	/** Label was applied to all emails*/
	LabelState$1[LabelState$1["Applied"] = 0] = "Applied";
	/** Label was applied to some of the emails but not to others*/
	LabelState$1[LabelState$1["AppliedToSome"] = 1] = "AppliedToSome";
	/** Label was applied to none of the emails */
	LabelState$1[LabelState$1["NotApplied"] = 2] = "NotApplied";
	return LabelState$1;
}({});
var MailModel = class {
	mailboxCounters = (0, import_stream.default)({});
	/**
	* map from mailbox folders list to folder system
	*/
	mailSets = new Map();
	constructor(notifications$1, mailboxModel, eventController, entityClient, logins, mailFacade, connectivityModel, inboxRuleHandler) {
		this.notifications = notifications$1;
		this.mailboxModel = mailboxModel;
		this.eventController = eventController;
		this.entityClient = entityClient;
		this.logins = logins;
		this.mailFacade = mailFacade;
		this.connectivityModel = connectivityModel;
		this.inboxRuleHandler = inboxRuleHandler;
	}
	initListeners = lazyMemoized(() => {
		this.eventController.addEntityListener((updates) => this.entityEventsReceived(updates));
		this.eventController.getCountersStream().map((update) => {
			this._mailboxCountersUpdates(update);
		});
		this.mailboxModel.mailboxDetails.map(() => {
			this.loadMailSets().then((newFolders) => this.mailSets = newFolders);
		});
	});
	async init() {
		this.initListeners();
		this.mailSets = await this.loadMailSets();
	}
	async loadMailSets() {
		const mailboxDetails = await this.mailboxModel.getMailboxDetails();
		const tempFolders = new Map();
		for (let detail of mailboxDetails) if (detail.mailbox.folders) {
			const mailSets = await this.loadMailSetsForListId(neverNull(detail.mailbox.folders).folders);
			const [labels, folders] = partition(mailSets, isLabel);
			const labelsMap = collectToMap(labels, getElementId);
			const folderSystem = new FolderSystem(folders);
			tempFolders.set(detail.mailbox.folders._id, {
				folders: folderSystem,
				labels: labelsMap
			});
		}
		return tempFolders;
	}
	loadMailSetsForListId(listId) {
		return this.entityClient.loadAll(MailFolderTypeRef, listId).then((folders) => {
			return folders.filter((f) => {
				if (!this.logins.isInternalUserLoggedIn() && (f.folderType === MailSetKind.SPAM || f.folderType === MailSetKind.ARCHIVE)) return false;
else return !(this.logins.isEnabled(FeatureType.InternalCommunication) && f.folderType === MailSetKind.SPAM);
			});
		});
	}
	async getFolders() {
		if (this.mailSets.size === 0) return await this.loadMailSets();
else return this.mailSets;
	}
	async entityEventsReceived(updates) {
		for (const update of updates) if (isUpdateForTypeRef(MailFolderTypeRef, update)) {
			await this.init();
			mithril_default.redraw();
		} else if (isUpdateForTypeRef(MailTypeRef, update) && update.operation === OperationType.CREATE && !containsEventOfType(updates, OperationType.DELETE, update.instanceId)) {
			if (this.inboxRuleHandler && this.connectivityModel) {
				const mailId = [update.instanceListId, update.instanceId];
				try {
					const mail = await this.entityClient.load(MailTypeRef, mailId);
					const folder = this.getMailFolderForMail(mail);
					if (folder && folder.folderType === MailSetKind.INBOX) await this.getMailboxDetailsForMail(mail).then((mailboxDetail) => {
						return mailboxDetail && this.inboxRuleHandler?.findAndApplyMatchingRule(mailboxDetail, mail, this.connectivityModel ? this.connectivityModel.isLeader() : false);
					}).then((newFolderAndMail) => {
						if (newFolderAndMail) this._showNotification(newFolderAndMail.folder, newFolderAndMail.mail);
else this._showNotification(folder, mail);
					}).catch(noOp);
				} catch (e) {
					if (e instanceof NotFoundError) console.log(`Could not find updated mail ${JSON.stringify(mailId)}`);
else throw e;
				}
			}
		}
	}
	async getMailboxDetailsForMail(mail) {
		const detail = await this.mailboxModel.getMailboxDetailsForMailGroup(assertNotNull(mail._ownerGroup));
		if (detail == null) console.warn("Mailbox detail for mail does not exist", mail);
		return detail;
	}
	async getMailboxDetailsForMailFolder(mailFolder) {
		const detail = await this.mailboxModel.getMailboxDetailsForMailGroup(assertNotNull(mailFolder._ownerGroup));
		if (detail == null) console.warn("Mailbox detail for mail folder does not exist", mailFolder);
		return detail;
	}
	async getMailboxFoldersForMail(mail) {
		const mailboxDetail = await this.getMailboxDetailsForMail(mail);
		if (mailboxDetail && mailboxDetail.mailbox.folders) {
			const folders = await this.getFolders();
			return folders.get(mailboxDetail.mailbox.folders._id)?.folders ?? null;
		} else return null;
	}
	async getMailboxFoldersForId(foldersId) {
		const folderStructures = await this.loadMailSets();
		const folderSystem = folderStructures.get(foldersId)?.folders;
		if (folderSystem == null) throw new ProgrammingError(`no folder system for folder id ${foldersId}`);
		return folderSystem;
	}
	getMailFolderForMail(mail) {
		const folderSystem = this.getFolderSystemByGroupId(assertNotNull(mail._ownerGroup));
		if (folderSystem == null) return null;
		return folderSystem.getFolderByMail(mail);
	}
	getFolderSystemByGroupId(groupId) {
		return this.getMailSetsForGroup(groupId)?.folders ?? null;
	}
	getLabelsByGroupId(groupId) {
		return this.getMailSetsForGroup(groupId)?.labels ?? new Map();
	}
	/**
	* @return all labels that could be applied to the {@param mails} with the state relative to {@param mails}.
	*/
	getLabelStatesForMails(mails) {
		if (mails.length === 0) return [];
		const labels = this.getLabelsByGroupId(assertNotNull(getFirstOrThrow(mails)._ownerGroup));
		const allUsedSets = new Map();
		for (const mail of mails) for (const set of mail.sets) {
			const currentValue = allUsedSets.get(elementIdPart(set)) ?? 0;
			allUsedSets.set(elementIdPart(set), currentValue + 1);
		}
		return Array.from(labels.values()).map((label) => {
			const count = allUsedSets.get(getElementId(label)) ?? 0;
			const state = count === 0 ? LabelState.NotApplied : count === mails.length ? LabelState.Applied : LabelState.AppliedToSome;
			return {
				label,
				state
			};
		});
	}
	getLabelsForMails(mails) {
		const labelsForMails = new Map();
		for (const mail of mails) labelsForMails.set(getElementId(mail), this.getLabelsForMail(mail));
		return labelsForMails;
	}
	/**
	* @return labels that are currently applied to {@param mail}.
	*/
	getLabelsForMail(mail) {
		const groupLabels = this.getLabelsByGroupId(assertNotNull(mail._ownerGroup));
		return mail.sets.map((labelId) => groupLabels.get(elementIdPart(labelId))).filter(isNotNull);
	}
	getMailSetsForGroup(groupId) {
		const mailboxDetails = this.mailboxModel.mailboxDetails() || [];
		const detail = mailboxDetails.find((md) => groupId === md.mailGroup._id);
		const sets = detail?.mailbox?.folders?._id;
		if (sets == null) return null;
		return this.mailSets.get(sets) ?? null;
	}
	/**
	* Finally move all given mails. Caller must ensure that mails are only from
	* * one folder (because we send one source folder)
	* * from one list (for locking it on the server)
	*/
	async _moveMails(mails, targetMailFolder) {
		const sourceMailFolder = this.getMailFolderForMail(mails[0]);
		let moveMails = mails.filter((m) => sourceMailFolder !== targetMailFolder && targetMailFolder._ownerGroup === m._ownerGroup);
		if (moveMails.length > 0 && sourceMailFolder && !isSameId(targetMailFolder._id, sourceMailFolder._id)) {
			const mailChunks = splitInChunks(MAX_NBR_MOVE_DELETE_MAIL_SERVICE, mails.map((m) => m._id));
			for (const mailChunk of mailChunks) await this.mailFacade.moveMails(mailChunk, sourceMailFolder._id, targetMailFolder._id);
		}
	}
	/**
	* Preferably use moveMails() in MailGuiUtils.js which has built-in error handling
	* @throws PreconditionFailedError or LockedError if operation is locked on the server
	*/
	async moveMails(mails, targetMailFolder) {
		const mailsPerFolder = groupBy(mails, (mail) => {
			return this.getMailFolderForMail(mail)?._id?.[1];
		});
		for (const [folderId, mailsInFolder] of mailsPerFolder) {
			const sourceMailFolder = this.getMailFolderForMail(mailsInFolder[0]);
			if (sourceMailFolder) {
				const mailsPerList = groupBy(mailsInFolder, (mail) => getListId(mail));
				for (const [listId, mailsInList] of mailsPerList) await this._moveMails(mailsInList, targetMailFolder);
			} else console.log("Move mail: no mail folder for folder id", folderId);
		}
	}
	/**
	* Finally deletes the given mails if they are already in the trash or spam folders,
	* otherwise moves them to the trash folder.
	* A deletion confirmation must have been show before.
	*/
	async deleteMails(mails) {
		if (mails.length === 0) return;
		const mailsPerFolder = groupBy(mails, (mail) => {
			return this.getMailFolderForMail(mail)?._id?.[1];
		});
		const folders = await this.getMailboxFoldersForMail(mails[0]);
		if (folders == null) return;
		const trashFolder = assertNotNull(folders.getSystemFolderByType(MailSetKind.TRASH));
		for (const [folder, mailsInFolder] of mailsPerFolder) {
			const sourceMailFolder = this.getMailFolderForMail(mailsInFolder[0]);
			const mailsPerList = groupBy(mailsInFolder, (mail) => getListId(mail));
			for (const [listId, mailsInList] of mailsPerList) if (sourceMailFolder) if (isSpamOrTrashFolder(folders, sourceMailFolder)) await this.finallyDeleteMails(mailsInList);
else await this._moveMails(mailsInList, trashFolder);
else console.log("Delete mail: no mail folder for list id", folder);
		}
	}
	/**
	* Finally deletes all given mails. Caller must ensure that mails are only from one folder and the folder must allow final delete operation.
	*/
	async finallyDeleteMails(mails) {
		if (!mails.length) return Promise.resolve();
		const mailFolder = neverNull(this.getMailFolderForMail(mails[0]));
		const mailIds = mails.map((m) => m._id);
		const mailChunks = splitInChunks(MAX_NBR_MOVE_DELETE_MAIL_SERVICE, mailIds);
		for (const mailChunk of mailChunks) await this.mailFacade.deleteMails(mailChunk, mailFolder._id);
	}
	/**
	* Sends the given folder and all its descendants to the spam folder, reporting mails (if applicable) and removes any empty folders
	*/
	async sendFolderToSpam(folder) {
		const mailboxDetail = await this.getMailboxDetailsForMailFolder(folder);
		if (mailboxDetail == null) return;
		const folderSystem = this.getFolderSystemByGroupId(assertNotNull(folder._ownerGroup));
		if (folderSystem == null) return;
		const deletedFolder = await this.removeAllEmpty(folderSystem, folder);
		if (!deletedFolder) return this.mailFacade.updateMailFolderParent(folder, assertSystemFolderOfType(folderSystem, MailSetKind.SPAM)._id);
	}
	async reportMails(reportType, mails) {
		for (const mail of mails) await this.mailFacade.reportMail(mail, reportType).catch(ofClass(NotFoundError, (e) => console.log("mail to be reported not found", e)));
	}
	isMovingMailsAllowed() {
		return this.logins.getUserController().isInternalUser();
	}
	canManageLabels() {
		return this.logins.getUserController().isInternalUser();
	}
	canAssignLabels() {
		return this.logins.getUserController().isInternalUser();
	}
	isExportingMailsAllowed() {
		return !this.logins.isEnabled(FeatureType.DisableMailExport);
	}
	async markMails(mails, unread) {
		await pMap(mails, async (mail) => {
			if (mail.unread !== unread) {
				mail.unread = unread;
				return this.entityClient.update(mail).catch(ofClass(NotFoundError, noOp)).catch(ofClass(LockedError, noOp));
			}
		}, { concurrency: 5 });
	}
	async applyLabels(mails, addedLabels, removedLabels) {
		const groupedByListIds = groupBy(mails, (mail) => listIdPart(mail._id));
		for (const [_, groupedMails] of groupedByListIds) {
			const mailChunks = splitInChunks(MAX_NBR_MOVE_DELETE_MAIL_SERVICE, groupedMails);
			for (const mailChunk of mailChunks) await this.mailFacade.applyLabels(mailChunk, addedLabels, removedLabels);
		}
	}
	_mailboxCountersUpdates(counters) {
		const normalized = this.mailboxCounters() || {};
		const group = normalized[counters.mailGroup] || {};
		for (const value of counters.counterValues) group[value.counterId] = Number(value.count) || 0;
		normalized[counters.mailGroup] = group;
		this.mailboxCounters(normalized);
	}
	_showNotification(folder, mail) {
		this.notifications.showNotification(NotificationType.Mail, lang.get("newMails_msg"), { actions: [] }, (_) => {
			mithril_default.route.set(`/mail/${getElementId(folder)}/${getElementId(mail)}`);
			window.focus();
		});
	}
	getCounterValue(folder) {
		return this.getMailboxDetailsForMailFolder(folder).then((mailboxDetails) => {
			if (mailboxDetails == null) return null;
else {
				const mailGroupCounter = this.mailboxCounters()[mailboxDetails.mailGroup._id];
				if (mailGroupCounter) {
					const counterId = folder.isMailSet ? getElementId(folder) : folder.mails;
					return mailGroupCounter[counterId];
				} else return null;
			}
		}).catch(() => null);
	}
	checkMailForPhishing(mail, links) {
		return this.mailFacade.checkMailForPhishing(mail, links);
	}
	/**
	* Sends the given folder and all its descendants to the trash folder, removes any empty folders
	*/
	async trashFolderAndSubfolders(folder) {
		const mailboxDetail = await this.getMailboxDetailsForMailFolder(folder);
		if (mailboxDetail == null) return;
		const folderSystem = this.getFolderSystemByGroupId(assertNotNull(folder._ownerGroup));
		if (folderSystem == null) return;
		const deletedFolder = await this.removeAllEmpty(folderSystem, folder);
		if (!deletedFolder) {
			const trash = assertSystemFolderOfType(folderSystem, MailSetKind.TRASH);
			return this.mailFacade.updateMailFolderParent(folder, trash._id);
		}
	}
	/**
	* This is called when moving a folder to SPAM or TRASH, which do not allow empty folders (since only folders that contain mail are allowed)
	*/
	async removeAllEmpty(folderSystem, folder) {
		const descendants = folderSystem.getDescendantFoldersOfParent(folder._id).sort((l, r) => r.level - l.level);
		let someNonEmpty = false;
		const deleted = new Set();
		for (const descendant of descendants) if (await this.isEmptyFolder(descendant.folder) && folderSystem.getCustomFoldersOfParent(descendant.folder._id).every((f) => deleted.has(getElementId(f)))) {
			deleted.add(getElementId(descendant.folder));
			await this.finallyDeleteCustomMailFolder(descendant.folder);
		} else someNonEmpty = true;
		if (await this.isEmptyFolder(folder) && folderSystem.getCustomFoldersOfParent(folder._id).every((f) => deleted.has(getElementId(f))) && !someNonEmpty) {
			await this.finallyDeleteCustomMailFolder(folder);
			return true;
		} else return false;
	}
	async isEmptyFolder(descendant) {
		if (descendant.isMailSet) return (await this.entityClient.loadRange(MailSetEntryTypeRef, descendant.entries, CUSTOM_MIN_ID, 1, false)).length === 0;
else return (await this.entityClient.loadRange(MailTypeRef, descendant.mails, GENERATED_MAX_ID, 1, true)).length === 0;
	}
	async finallyDeleteCustomMailFolder(folder) {
		if (folder.folderType !== MailSetKind.CUSTOM && folder.folderType !== MailSetKind.Imported) throw new ProgrammingError("Cannot delete non-custom folder: " + String(folder._id));
		return await this.mailFacade.deleteFolder(folder._id).catch(ofClass(NotFoundError, () => console.log("mail folder already deleted"))).catch(ofClass(PreconditionFailedError, () => {
			throw new UserError("operationStillActive_msg");
		}));
	}
	async fixupCounterForFolder(folder, unreadMails) {
		const mailboxDetails = await this.getMailboxDetailsForMailFolder(folder);
		if (mailboxDetails) await this.mailFacade.fixupCounterForFolder(mailboxDetails.mailGroup._id, folder, unreadMails);
	}
	async clearFolder(folder) {
		await this.mailFacade.clearFolder(folder._id);
	}
	async unsubscribe(mail, recipient, headers) {
		await this.mailFacade.unsubscribe(mail._id, recipient, headers);
	}
	async saveReportMovedMails(mailboxGroupRoot, reportMovedMails) {
		const mailboxProperties = await this.mailboxModel.loadOrCreateMailboxProperties(mailboxGroupRoot);
		mailboxProperties.reportMovedMails = reportMovedMails;
		await this.entityClient.update(mailboxProperties);
		return mailboxProperties;
	}
	/**
	* Create a label (aka MailSet aka {@link MailFolder} of kind {@link MailSetKind.LABEL}) for the group {@param mailGroupId}.
	*/
	async createLabel(mailGroupId, labelData) {
		await this.mailFacade.createLabel(mailGroupId, labelData);
	}
	async updateLabel(label, newData) {
		await this.mailFacade.updateLabel(label, newData.name, newData.color);
	}
	async deleteLabel(label) {
		await this.mailFacade.deleteLabel(label);
	}
	async getMailSetById(folderElementId) {
		const folderStructures = await this.loadMailSets();
		for (const folders of folderStructures.values()) {
			const folder = folders.folders.getFolderById(folderElementId);
			if (folder) return folder;
			const label = folders.labels.get(folderElementId);
			if (label) return label;
		}
		return null;
	}
	getImportedMailSets() {
		return [...this.mailSets.values()].filter((f) => f.folders.importedMailSet).map((f) => f.folders.importedMailSet);
	}
};

//#endregion
//#region src/common/api/common/utils/EstimatingProgressMonitor.ts
const DEFAULT_RATE_PER_SECOND = .5;
const DEFAULT_PROGRESS_ESTIMATION_REFRESH_MS = 1e3;
const MINIMUM_HISTORY_LENGTH_FOR_ESTIMATION = 3;
const RATE_PER_SECOND_MAXIMUM_SCALING_RATIO = .75;
const WORK_MAX_PERCENTAGE = 100;
const WORK_COMPLETED_MIN = 0;
var EstimatingProgressMonitor = class {
	workCompleted;
	ratePerSecondHistory = Array.of([Date.now(), DEFAULT_RATE_PER_SECOND]);
	totalWork;
	progressEstimation;
	constructor(totalWork, updater) {
		this.updater = updater;
		this.workCompleted = WORK_COMPLETED_MIN;
		this.totalWork = totalWork;
	}
	updateTotalWork(value) {
		this.totalWork = value;
	}
	continueEstimation() {
		clearInterval(this.progressEstimation);
		this.progressEstimation = setInterval(() => {
			if (this.ratePerSecondHistory.length < MINIMUM_HISTORY_LENGTH_FOR_ESTIMATION) this.workEstimate(DEFAULT_RATE_PER_SECOND);
else {
				const previousRateEntry = this.ratePerSecondHistory[this.ratePerSecondHistory.length - 2];
				const previousRateEntryTimestamp = first(previousRateEntry);
				const lastRateEntry = last(this.ratePerSecondHistory);
				const lastRateEntryTimestamp = first(lastRateEntry);
				const lastRatePerSecond = last(lastRateEntry);
				let lastDurationBetweenRatePerSecondUpdatesMs = lastRateEntryTimestamp - previousRateEntryTimestamp;
				let currentDurationMs = Date.now() - lastRateEntryTimestamp;
				let ratePerSecondScalingRatio = Math.min(RATE_PER_SECOND_MAXIMUM_SCALING_RATIO, lastDurationBetweenRatePerSecondUpdatesMs / currentDurationMs);
				let newRatePerSecondEstimate = lastRatePerSecond * ratePerSecondScalingRatio;
				let workDoneEstimation = Math.max(DEFAULT_RATE_PER_SECOND, newRatePerSecondEstimate);
				if (this.workCompleted + workDoneEstimation < this.totalWork) this.workEstimate(workDoneEstimation);
			}
		}, DEFAULT_PROGRESS_ESTIMATION_REFRESH_MS);
	}
	pauseEstimation() {
		clearInterval(this.progressEstimation);
		this.ratePerSecondHistory = Array.of([Date.now(), DEFAULT_RATE_PER_SECOND]);
	}
	updateRatePerSecond(newWorkAmount) {
		let lastRateEntry = last(this.ratePerSecondHistory);
		let lastTimestamp = first(lastRateEntry);
		let now = Date.now();
		let durationSinceLastRateEntrySeconds = (now - lastTimestamp) / 1e3;
		let ratePerSecond = newWorkAmount / durationSinceLastRateEntrySeconds;
		let newRateEntry = [now, ratePerSecond];
		this.ratePerSecondHistory.push(newRateEntry);
	}
	workEstimate(estimate) {
		this.workCompleted += estimate;
		this.updater(this.percentage());
	}
	workDone(amount) {
		this.updateRatePerSecond(amount);
		this.workCompleted += amount;
		this.updater(this.percentage());
	}
	totalWorkDone(totalAmount) {
		let workDifference = totalAmount - this.workCompleted;
		this.updateRatePerSecond(workDifference);
		this.workCompleted = totalAmount;
		this.updater(this.percentage());
	}
	percentage() {
		const result = WORK_MAX_PERCENTAGE * this.workCompleted / this.totalWork;
		return Math.min(WORK_MAX_PERCENTAGE, result);
	}
	completed() {
		this.workCompleted = this.totalWork;
		this.updater(WORK_MAX_PERCENTAGE);
	}
};

//#endregion
//#region src/mail-app/mail/import/MailImporter.ts
let ImportProgressAction = function(ImportProgressAction$1) {
	ImportProgressAction$1[ImportProgressAction$1["Continue"] = 0] = "Continue";
	ImportProgressAction$1[ImportProgressAction$1["Pause"] = 1] = "Pause";
	ImportProgressAction$1[ImportProgressAction$1["Stop"] = 2] = "Stop";
	return ImportProgressAction$1;
}({});
const DEFAULT_TOTAL_WORK = 1e4;
var MailImporter = class {
	finalisedImportStates = new Map();
	activeImport = null;
	foldersForMailbox;
	selectedTargetFolder = null;
	constructor(domainConfigProvider, loginController, mailboxModel, entityClient, eventController, credentialsProvider, nativeMailImportFacade, openSettingsHandler) {
		this.domainConfigProvider = domainConfigProvider;
		this.loginController = loginController;
		this.mailboxModel = mailboxModel;
		this.entityClient = entityClient;
		this.credentialsProvider = credentialsProvider;
		this.nativeMailImportFacade = nativeMailImportFacade;
		this.openSettingsHandler = openSettingsHandler;
		eventController.addEntityListener((updates) => this.entityEventsReceived(updates));
	}
	async getMailbox() {
		return assertNotNull(first(await this.mailboxModel.getMailboxDetails())).mailbox;
	}
	async initImportMailStates() {
		await this.checkForResumableImport();
		const importMailStatesCollection = await this.entityClient.loadAll(ImportMailStateTypeRef, (await this.getMailbox()).mailImportStates);
		for (const importMailState of importMailStatesCollection) if (this.isFinalisedImport(importMailState)) this.updateFinalisedImport(elementIdPart(importMailState._id), importMailState);
		mithril_default.redraw();
	}
	async checkForResumableImport() {
		const importFacade = assertNotNull(this.nativeMailImportFacade);
		const mailbox = await this.getMailbox();
		this.foldersForMailbox = this.getFoldersForMailGroup(assertNotNull(mailbox._ownerGroup));
		this.selectedTargetFolder = this.foldersForMailbox.getSystemFolderByType(MailSetKind.INBOX);
		let activeImportId = null;
		if (this.activeImport === null) {
			const mailOwnerGroupId = assertNotNull(mailbox._ownerGroup);
			const userId = this.loginController.getUserController().userId;
			const unencryptedCredentials = assertNotNull(await this.credentialsProvider?.getDecryptedCredentialsByUserId(userId));
			const apiUrl = getApiBaseUrl(this.domainConfigProvider.getCurrentDomainConfig());
			try {
				activeImportId = await importFacade.getResumableImport(mailbox._id, mailOwnerGroupId, unencryptedCredentials, apiUrl);
			} catch (e) {
				if (e instanceof MailImportError) this.handleError(e).catch();
else throw e;
			}
			this.listenForError(importFacade, mailbox._id).then();
		}
		if (activeImportId) {
			const importMailState = await this.entityClient.load(ImportMailStateTypeRef, activeImportId);
			const remoteStatus = parseInt(importMailState.status);
			switch (remoteStatus) {
				case ImportStatus.Canceled:
				case ImportStatus.Finished:
					activeImportId = null;
					this.activeImport = null;
					this.selectedTargetFolder = this.foldersForMailbox.getSystemFolderByType(MailSetKind.INBOX);
					break;
				case ImportStatus.Paused:
				case ImportStatus.Running: {
					let progressMonitor = this.activeImport?.progressMonitor ?? null;
					if (!progressMonitor) {
						const totalCount = parseInt(importMailState.totalMails);
						const doneCount = parseInt(importMailState.failedMails) + parseInt(importMailState.successfulMails);
						progressMonitor = this.createEstimatingProgressMonitor(totalCount);
						progressMonitor.totalWorkDone(doneCount);
					}
					this.activeImport = {
						remoteStateId: activeImportId,
						uiStatus: UiImportStatus.Paused,
						progressMonitor
					};
					this.selectedTargetFolder = await this.entityClient.load(MailFolderTypeRef, importMailState.targetFolder);
				}
			}
		}
	}
	async entityEventsReceived(updates) {
		for (const update of updates) if (isUpdateForTypeRef(ImportMailStateTypeRef, update)) {
			const updatedState = await this.entityClient.load(ImportMailStateTypeRef, [update.instanceListId, update.instanceId]);
			await this.newImportStateFromServer(updatedState);
		}
	}
	async newImportStateFromServer(serverState) {
		const remoteStatus = parseInt(serverState.status);
		const wasUpdatedForThisImport = this.activeImport !== null && isSameId(this.activeImport.remoteStateId, serverState._id);
		if (wasUpdatedForThisImport) if (isFinalisedImport(remoteStatus)) {
			this.resetStatus();
			this.updateFinalisedImport(elementIdPart(serverState._id), serverState);
		} else {
			const activeImport = assertNotNull(this.activeImport);
			activeImport.uiStatus = importStatusToUiImportStatus(remoteStatus);
			const newTotalWork = parseInt(serverState.totalMails);
			const newDoneWork = parseInt(serverState.successfulMails) + parseInt(serverState.failedMails);
			activeImport.progressMonitor.updateTotalWork(newTotalWork);
			activeImport.progressMonitor.totalWorkDone(newDoneWork);
			if (remoteStatus === ImportStatus.Paused) activeImport.progressMonitor.pauseEstimation();
else activeImport.progressMonitor.continueEstimation();
		}
else this.updateFinalisedImport(elementIdPart(serverState._id), serverState);
		mithril_default.redraw();
	}
	createEstimatingProgressMonitor(totalWork = DEFAULT_TOTAL_WORK) {
		return new EstimatingProgressMonitor(totalWork, (_) => {
			mithril_default.redraw();
		});
	}
	isFinalisedImport(importMailState) {
		return parseInt(importMailState.status) == ImportStatus.Finished || parseInt(importMailState.status) == ImportStatus.Canceled;
	}
	getFoldersForMailGroup(mailGroupId) {
		if (mailGroupId) {
			const folderSystem = mailLocator.mailModel.getFolderSystemByGroupId(mailGroupId);
			if (folderSystem) return folderSystem;
		}
		throw new Error("could not load folder list");
	}
	async listenForError(importFacade, mailboxId) {
		while (true) {
			try {
				await importFacade.setAsyncErrorHook(mailboxId);
			} catch (e) {
				if (e instanceof MailImportError) {
					this.handleError(e).catch();
					continue;
				}
				throw e;
			}
			throw new ProgrammingError("setAsyncErrorHook should never complete normally!");
		}
	}
	async handleError(err) {
		if (err.data.category == ImportErrorCategories.ImportFeatureDisabled) {
			if (this.activeImport) this.activeImport.uiStatus = UiImportStatus.Paused;
			await Dialog.message("mailImportErrorServiceUnavailable_msg");
		} else if (err.data.category == ImportErrorCategories.ConcurrentImport) {
			console.log("Tried to start concurrent import");
			showSnackBar({
				message: "pleaseWait_msg",
				button: {
					label: "ok_action",
					click: () => {}
				}
			});
		} else {
			console.log(`Error while importing mails, category: ${err.data.category}, source: ${err.data.source}`);
			const navigateToImportSettings = {
				label: "show_action",
				click: () => this.openSettingsHandler.openSettings("mailImport")
			};
			showSnackBar({
				message: "someMailFailedImport_msg",
				button: navigateToImportSettings
			});
		}
	}
	/**
	* Call to the nativeMailImportFacade in worker to start a mail import from .eml or .mbox files.
	* @param filePaths to the .eml/.mbox files to import mails from
	*/
	async onStartBtnClick(filePaths) {
		if (isEmpty(filePaths)) return;
		if (!this.shouldRenderStartButton()) throw new ProgrammingError("can't change state to starting");
		const apiUrl = getApiBaseUrl(this.domainConfigProvider.getCurrentDomainConfig());
		const mailbox = await this.getMailbox();
		const mailboxId = mailbox._id;
		const mailOwnerGroupId = assertNotNull(mailbox._ownerGroup);
		const userId = this.loginController.getUserController().userId;
		const importFacade = assertNotNull(this.nativeMailImportFacade);
		const selectedTargetFolder = assertNotNull(this.selectedTargetFolder);
		const unencryptedCredentials = assertNotNull(await this.credentialsProvider?.getDecryptedCredentialsByUserId(userId));
		this.resetStatus();
		let progressMonitor = this.createEstimatingProgressMonitor();
		this.activeImport = {
			remoteStateId: [GENERATED_MIN_ID, GENERATED_MIN_ID],
			uiStatus: UiImportStatus.Starting,
			progressMonitor
		};
		this.activeImport?.progressMonitor?.continueEstimation();
		mithril_default.redraw();
		try {
			this.activeImport.remoteStateId = await importFacade.prepareNewImport(mailboxId, mailOwnerGroupId, selectedTargetFolder._id, filePaths, unencryptedCredentials, apiUrl);
		} catch (e) {
			if (e instanceof MailImportError) this.handleError(e).catch();
else throw e;
		}
		await importFacade.setProgressAction(mailboxId, ImportProgressAction.Continue);
	}
	async onPauseBtnClick() {
		let activeImport = assertNotNull(this.activeImport);
		if (activeImport.uiStatus !== UiImportStatus.Running) throw new ProgrammingError("can't change state to pausing");
		activeImport.uiStatus = UiImportStatus.Pausing;
		activeImport.progressMonitor.pauseEstimation();
		mithril_default.redraw();
		const mailboxId = (await this.getMailbox())._id;
		const nativeImportFacade = assertNotNull(this.nativeMailImportFacade);
		await nativeImportFacade.setProgressAction(mailboxId, ImportProgressAction.Pause);
	}
	async onResumeBtnClick() {
		if (!this.shouldRenderResumeButton()) throw new ProgrammingError("can't change state to resuming");
		let activeImport = assertNotNull(this.activeImport);
		activeImport.uiStatus = UiImportStatus.Resuming;
		activeImport.progressMonitor.continueEstimation();
		mithril_default.redraw();
		const mailboxId = (await this.getMailbox())._id;
		const nativeImportFacade = assertNotNull(this.nativeMailImportFacade);
		await nativeImportFacade.setProgressAction(mailboxId, ImportProgressAction.Continue);
	}
	async onCancelBtnClick() {
		if (!this.shouldRenderCancelButton()) throw new ProgrammingError("can't change state to cancelling");
		let activeImport = assertNotNull(this.activeImport);
		activeImport.uiStatus = UiImportStatus.Cancelling;
		activeImport.progressMonitor.pauseEstimation();
		mithril_default.redraw();
		const mailboxId = (await this.getMailbox())._id;
		const nativeImportFacade = assertNotNull(this.nativeMailImportFacade);
		await nativeImportFacade.setProgressAction(mailboxId, ImportProgressAction.Stop);
	}
	shouldRenderStartButton() {
		return this.activeImport === null;
	}
	shouldRenderImportStatus() {
		const activeImportStatus = this.getUiStatus();
		if (activeImportStatus === null) return false;
		return activeImportStatus === UiImportStatus.Starting || activeImportStatus === UiImportStatus.Running || activeImportStatus === UiImportStatus.Pausing || activeImportStatus === UiImportStatus.Paused || activeImportStatus === UiImportStatus.Cancelling || activeImportStatus === UiImportStatus.Resuming;
	}
	shouldRenderPauseButton() {
		const activeImportStatus = this.getUiStatus();
		if (activeImportStatus === null) return false;
		return activeImportStatus === UiImportStatus.Running || activeImportStatus === UiImportStatus.Starting || activeImportStatus === UiImportStatus.Pausing;
	}
	shouldDisablePauseButton() {
		const activeImportStatus = this.getUiStatus();
		if (activeImportStatus === null) return false;
		return activeImportStatus === UiImportStatus.Pausing || activeImportStatus === UiImportStatus.Starting;
	}
	shouldRenderResumeButton() {
		const activeImportStatus = this.getUiStatus();
		if (activeImportStatus === null) return false;
		return activeImportStatus === UiImportStatus.Paused || activeImportStatus === UiImportStatus.Resuming;
	}
	shouldDisableResumeButton() {
		const activeImportStatus = this.getUiStatus();
		if (activeImportStatus === null) return false;
		return activeImportStatus === UiImportStatus.Resuming || activeImportStatus === UiImportStatus.Starting;
	}
	shouldRenderCancelButton() {
		const activeImportStatus = this.getUiStatus();
		if (activeImportStatus === null) return false;
		return activeImportStatus === UiImportStatus.Paused || activeImportStatus === UiImportStatus.Running || activeImportStatus === UiImportStatus.Pausing || activeImportStatus === UiImportStatus.Cancelling;
	}
	shouldDisableCancelButton() {
		const activeImportStatus = this.getUiStatus();
		return activeImportStatus === UiImportStatus.Cancelling || activeImportStatus === UiImportStatus.Pausing || activeImportStatus === UiImportStatus.Starting;
	}
	shouldRenderProcessedMails() {
		const activeImportStatus = this.getUiStatus();
		return this.activeImport?.progressMonitor?.totalWork != DEFAULT_TOTAL_WORK && (activeImportStatus === UiImportStatus.Running || activeImportStatus === UiImportStatus.Resuming || activeImportStatus === UiImportStatus.Pausing || activeImportStatus === UiImportStatus.Paused);
	}
	getTotalMailsCount() {
		return assertNotNull(this.activeImport).progressMonitor.totalWork;
	}
	getProcessedMailsCount() {
		const progressMonitor = assertNotNull(this.activeImport).progressMonitor;
		return Math.min(Math.round(progressMonitor.workCompleted), progressMonitor.totalWork);
	}
	getProgress() {
		const progressMonitor = assertNotNull(this.activeImport).progressMonitor;
		return Math.ceil(progressMonitor.percentage());
	}
	getFinalisedImports() {
		return Array.from(this.finalisedImportStates.values());
	}
	updateFinalisedImport(importMailStateElementId, importMailState) {
		this.finalisedImportStates.set(importMailStateElementId, importMailState);
	}
	resetStatus() {
		this.activeImport = null;
	}
	getUiStatus() {
		return this.activeImport?.uiStatus ?? null;
	}
};
let UiImportStatus = function(UiImportStatus$1) {
	UiImportStatus$1[UiImportStatus$1["Starting"] = 0] = "Starting";
	UiImportStatus$1[UiImportStatus$1["Resuming"] = 1] = "Resuming";
	UiImportStatus$1[UiImportStatus$1["Running"] = 2] = "Running";
	UiImportStatus$1[UiImportStatus$1["Pausing"] = 3] = "Pausing";
	UiImportStatus$1[UiImportStatus$1["Paused"] = 4] = "Paused";
	UiImportStatus$1[UiImportStatus$1["Cancelling"] = 5] = "Cancelling";
	return UiImportStatus$1;
}({});
function importStatusToUiImportStatus(importStatus) {
	switch (importStatus) {
		case ImportStatus.Finished: return UiImportStatus.Running;
		case ImportStatus.Canceled: return UiImportStatus.Cancelling;
		case ImportStatus.Paused: return UiImportStatus.Paused;
		case ImportStatus.Running: return UiImportStatus.Running;
	}
}
function isFinalisedImport(remoteImportStatus) {
	return remoteImportStatus == ImportStatus.Canceled || remoteImportStatus == ImportStatus.Finished;
}

//#endregion
//#region src/mail-app/mailLocator.ts
assertMainOrNode();
var MailLocator = class {
	eventController;
	search;
	mailboxModel;
	mailModel;
	minimizedMailModel;
	contactModel;
	entityClient;
	progressTracker;
	credentialsProvider;
	worker;
	fileController;
	secondFactorHandler;
	webAuthn;
	loginFacade;
	logins;
	header;
	customerFacade;
	keyLoaderFacade;
	giftCardFacade;
	groupManagementFacade;
	configFacade;
	calendarFacade;
	mailFacade;
	shareFacade;
	counterFacade;
	indexerFacade;
	searchFacade;
	bookingFacade;
	mailAddressFacade;
	blobFacade;
	userManagementFacade;
	recoverCodeFacade;
	contactFacade;
	usageTestController;
	usageTestModel;
	newsModel;
	serviceExecutor;
	cryptoFacade;
	searchTextFacade;
	desktopSettingsFacade;
	desktopSystemFacade;
	exportFacade;
	webMobileFacade;
	systemPermissionHandler;
	interWindowEventSender;
	cacheStorage;
	workerFacade;
	loginListener;
	random;
	connectivityModel;
	operationProgressTracker;
	infoMessageHandler;
	themeController;
	Const;
	bulkMailLoader;
	mailExportFacade;
	nativeInterfaces = null;
	mailImporter = null;
	entropyFacade;
	sqlCipherFacade;
	recipientsModel = lazyMemoized(async () => {
		const { RecipientsModel } = await import("./RecipientsModel2-chunk.js");
		return new RecipientsModel(this.contactModel, this.logins, this.mailFacade, this.entityClient);
	});
	async noZoneDateProvider() {
		return new NoZoneDateProvider();
	}
	async sendMailModel(mailboxDetails, mailboxProperties) {
		const factory = await this.sendMailModelSyncFactory(mailboxDetails, mailboxProperties);
		return factory();
	}
	redraw = lazyMemoized(async () => {
		const m = await import("./mithril2-chunk.js");
		return m.redraw;
	});
	offlineIndicatorViewModel = lazyMemoized(async () => {
		return new OfflineIndicatorViewModel(this.cacheStorage, this.loginListener, this.connectivityModel, this.logins, this.progressTracker, await this.redraw());
	});
	async appHeaderAttrs() {
		return {
			offlineIndicatorModel: await this.offlineIndicatorViewModel(),
			newsModel: this.newsModel
		};
	}
	mailViewModel = lazyMemoized(async () => {
		const { MailViewModel } = await import("./MailViewModel-chunk.js");
		const conversationViewModelFactory = await this.conversationViewModelFactory();
		const router = new ScopedRouter(this.throttledRouter(), "/mail");
		return new MailViewModel(this.mailboxModel, this.mailModel, this.entityClient, this.eventController, this.connectivityModel, this.cacheStorage, conversationViewModelFactory, this.mailOpenedListener, deviceConfig, this.inboxRuleHanlder(), router, await this.redraw());
	});
	affiliateViewModel = lazyMemoized(async () => {
		const { AffiliateViewModel } = await import("./AffiliateViewModel-chunk.js");
		return new AffiliateViewModel();
	});
	inboxRuleHanlder() {
		return new InboxRuleHandler(this.mailFacade, this.logins);
	}
	async searchViewModelFactory() {
		const { SearchViewModel } = await import("./SearchViewModel2-chunk.js");
		const conversationViewModelFactory = await this.conversationViewModelFactory();
		const redraw = await this.redraw();
		const searchRouter = await this.scopedSearchRouter();
		const calendarEventsRepository = await this.calendarEventsRepository();
		return () => {
			return new SearchViewModel(searchRouter, this.search, this.searchFacade, this.mailboxModel, this.logins, this.indexerFacade, this.entityClient, this.eventController, this.mailOpenedListener, this.calendarFacade, this.progressTracker, conversationViewModelFactory, calendarEventsRepository, redraw, deviceConfig.getMailAutoSelectBehavior(), deviceConfig.getClientOnlyCalendars());
		};
	}
	throttledRouter = lazyMemoized(() => new ThrottledRouter());
	scopedSearchRouter = lazyMemoized(async () => {
		const { SearchRouter } = await import("./SearchRouter2-chunk.js");
		return new SearchRouter(new ScopedRouter(this.throttledRouter(), "/search"));
	});
	unscopedSearchRouter = lazyMemoized(async () => {
		const { SearchRouter } = await import("./SearchRouter2-chunk.js");
		return new SearchRouter(this.throttledRouter());
	});
	mailOpenedListener = { onEmailOpened: isDesktop() ? (mail) => {
		this.desktopSystemFacade.sendSocketMessage(getDisplayedSender(mail).address);
	} : noOp };
	contactViewModel = lazyMemoized(async () => {
		const { ContactViewModel } = await import("./ContactViewModel-chunk.js");
		const router = new ScopedRouter(this.throttledRouter(), "/contact");
		return new ContactViewModel(this.contactModel, this.entityClient, this.eventController, router, await this.redraw());
	});
	contactListViewModel = lazyMemoized(async () => {
		const { ContactListViewModel } = await import("./ContactListViewModel-chunk.js");
		const router = new ScopedRouter(this.throttledRouter(), "/contactlist");
		return new ContactListViewModel(this.entityClient, this.groupManagementFacade, this.logins, this.eventController, this.contactModel, await this.receivedGroupInvitationsModel(GroupType.ContactList), router, await this.redraw());
	});
	async receivedGroupInvitationsModel(groupType) {
		const { ReceivedGroupInvitationsModel } = await import("./ReceivedGroupInvitationsModel2-chunk.js");
		return new ReceivedGroupInvitationsModel(groupType, this.eventController, this.entityClient, this.logins);
	}
	calendarViewModel = lazyMemoized(async () => {
		const { CalendarViewModel } = await import("./CalendarViewModel-chunk.js");
		const { DefaultDateProvider } = await import("./CalendarUtils2-chunk.js");
		const timeZone = new DefaultDateProvider().timeZone();
		return new CalendarViewModel(this.logins, async (mode, event) => {
			const mailboxDetail = await this.mailboxModel.getUserMailboxDetails();
			const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetail.mailboxGroupRoot);
			return await this.calendarEventModel(mode, event, mailboxDetail, mailboxProperties, null);
		}, (...args) => this.calendarEventPreviewModel(...args), (...args) => this.calendarContactPreviewModel(...args), await this.calendarModel(), await this.calendarEventsRepository(), this.entityClient, this.eventController, this.progressTracker, deviceConfig, await this.receivedGroupInvitationsModel(GroupType.Calendar), timeZone, this.mailboxModel, this.contactModel);
	});
	calendarEventsRepository = lazyMemoized(async () => {
		const { CalendarEventsRepository } = await import("./CalendarEventsRepository-chunk.js");
		const { DefaultDateProvider } = await import("./CalendarUtils2-chunk.js");
		const timeZone = new DefaultDateProvider().timeZone();
		return new CalendarEventsRepository(await this.calendarModel(), this.calendarFacade, timeZone, this.entityClient, this.eventController, this.contactModel, this.logins);
	});
	/** This ugly bit exists because CalendarEventWhoModel wants a sync factory. */
	async sendMailModelSyncFactory(mailboxDetails, mailboxProperties) {
		const { SendMailModel } = await import("./SendMailModel-chunk.js");
		const recipientsModel = await this.recipientsModel();
		const dateProvider = await this.noZoneDateProvider();
		return () => new SendMailModel(this.mailFacade, this.entityClient, this.logins, this.mailboxModel, this.contactModel, this.eventController, mailboxDetails, recipientsModel, dateProvider, mailboxProperties, async (mail) => {
			return await isMailInSpamOrTrash(mail, mailLocator.mailModel);
		});
	}
	async calendarEventModel(editMode, event, mailboxDetail, mailboxProperties, responseTo) {
		const [{ makeCalendarEventModel }, { getTimeZone }, { calendarNotificationSender }] = await Promise.all([
			import("./CalendarEventModel-chunk.js"),
			import("./CalendarUtils2-chunk.js"),
			import("./CalendarNotificationSender-chunk.js")
		]);
		const sendMailModelFactory = await this.sendMailModelSyncFactory(mailboxDetail, mailboxProperties);
		const showProgress = (p) => showProgressDialog("pleaseWait_msg", p);
		return await makeCalendarEventModel(editMode, event, await this.recipientsModel(), await this.calendarModel(), this.logins, mailboxDetail, mailboxProperties, sendMailModelFactory, calendarNotificationSender, this.entityClient, responseTo, getTimeZone(), showProgress);
	}
	async recipientsSearchModel() {
		const { RecipientsSearchModel } = await import("./RecipientsSearchModel-chunk.js");
		const suggestionsProvider = await this.contactSuggestionProvider();
		return new RecipientsSearchModel(await this.recipientsModel(), this.contactModel, suggestionsProvider, this.entityClient);
	}
	async contactSuggestionProvider() {
		if (isApp()) {
			const { MobileContactSuggestionProvider } = await import("./MobileContactSuggestionProvider-chunk.js");
			return new MobileContactSuggestionProvider(this.mobileContactsFacade);
		} else return { async getContactSuggestions(_query) {
			return [];
		} };
	}
	conversationViewModelFactory = async () => {
		const { ConversationViewModel } = await import("./ConversationViewModel-chunk.js");
		const factory = await this.mailViewerViewModelFactory();
		const m = await import("./mithril2-chunk.js");
		return (options) => {
			return new ConversationViewModel(options, (options$1) => factory(options$1), this.entityClient, this.eventController, deviceConfig, this.mailModel, m.redraw);
		};
	};
	async conversationViewModel(options) {
		const factory = await this.conversationViewModelFactory();
		return factory(options);
	}
	contactImporter = async () => {
		const { ContactImporter } = await import("./ContactImporter-chunk.js");
		return new ContactImporter(this.contactFacade, this.systemPermissionHandler, isApp() ? this.mobileContactsFacade : null, isApp() ? this.nativeContactsSyncManager() : null);
	};
	async mailViewerViewModelFactory() {
		const { MailViewerViewModel } = await import("./MailViewerViewModel2-chunk.js");
		return ({ mail, showFolder }) => new MailViewerViewModel(mail, showFolder, this.entityClient, this.mailboxModel, this.mailModel, this.contactModel, this.configFacade, this.fileController, this.logins, async (mailboxDetails) => {
			const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot);
			return this.sendMailModel(mailboxDetails, mailboxProperties);
		}, this.eventController, this.workerFacade, this.search, this.mailFacade, this.cryptoFacade, () => this.contactImporter());
	}
	async externalLoginViewModelFactory() {
		const { ExternalLoginViewModel } = await import("./ExternalLoginView-chunk.js");
		return () => new ExternalLoginViewModel(this.credentialsProvider);
	}
	get deviceConfig() {
		return deviceConfig;
	}
	get native() {
		return this.getNativeInterface("native");
	}
	get fileApp() {
		return this.getNativeInterface("fileApp");
	}
	get pushService() {
		return this.getNativeInterface("pushService");
	}
	get commonSystemFacade() {
		return this.getNativeInterface("commonSystemFacade");
	}
	get themeFacade() {
		return this.getNativeInterface("themeFacade");
	}
	get externalCalendarFacade() {
		return this.getNativeInterface("externalCalendarFacade");
	}
	get systemFacade() {
		return this.getNativeInterface("mobileSystemFacade");
	}
	get mobileContactsFacade() {
		return this.getNativeInterface("mobileContactsFacade");
	}
	get nativeCredentialsFacade() {
		return this.getNativeInterface("nativeCredentialsFacade");
	}
	get mobilePaymentsFacade() {
		return this.getNativeInterface("mobilePaymentsFacade");
	}
	async mailAddressTableModelForOwnMailbox() {
		const { MailAddressTableModel } = await import("./MailAddressTableModel2-chunk.js");
		const nameChanger = await this.ownMailAddressNameChanger();
		return new MailAddressTableModel(this.entityClient, this.serviceExecutor, this.mailAddressFacade, this.logins, this.eventController, this.logins.getUserController().userGroupInfo, nameChanger, await this.redraw());
	}
	async mailAddressTableModelForAdmin(mailGroupId, userId, userGroupInfo) {
		const { MailAddressTableModel } = await import("./MailAddressTableModel2-chunk.js");
		const nameChanger = await this.adminNameChanger(mailGroupId, userId);
		return new MailAddressTableModel(this.entityClient, this.serviceExecutor, this.mailAddressFacade, this.logins, this.eventController, userGroupInfo, nameChanger, await this.redraw());
	}
	async ownMailAddressNameChanger() {
		const { OwnMailAddressNameChanger } = await import("./OwnMailAddressNameChanger-chunk.js");
		return new OwnMailAddressNameChanger(this.mailboxModel, this.entityClient);
	}
	async adminNameChanger(mailGroupId, userId) {
		const { AnotherUserMailAddressNameChanger } = await import("./AnotherUserMailAddressNameChanger-chunk.js");
		return new AnotherUserMailAddressNameChanger(this.mailAddressFacade, mailGroupId, userId);
	}
	async drawerAttrsFactory() {
		return () => ({
			logins: this.logins,
			newsModel: this.newsModel,
			desktopSystemFacade: this.desktopSystemFacade
		});
	}
	domainConfigProvider() {
		return new DomainConfigProvider();
	}
	async credentialsRemovalHandler() {
		const { NoopCredentialRemovalHandler, AppsCredentialRemovalHandler } = await import("./CredentialRemovalHandler-chunk.js");
		return isBrowser() ? new NoopCredentialRemovalHandler() : new AppsCredentialRemovalHandler(this.pushService, this.configFacade, async (login, userId) => {
			if (isApp()) await mailLocator.nativeContactsSyncManager().disableSync(userId, login);
			await mailLocator.indexerFacade.deleteIndex(userId);
			if (isDesktop()) await mailLocator.exportFacade.clearExportState(userId);
		});
	}
	async loginViewModelFactory() {
		const { LoginViewModel } = await import("./LoginViewModel-chunk.js");
		const credentialsRemovalHandler = await mailLocator.credentialsRemovalHandler();
		const { MobileAppLock, NoOpAppLock } = await import("./AppLock-chunk.js");
		const appLock = isApp() ? new MobileAppLock(assertNotNull(this.nativeInterfaces).mobileSystemFacade, assertNotNull(this.nativeInterfaces).nativeCredentialsFacade) : new NoOpAppLock();
		return () => {
			const domainConfig = isBrowser() ? mailLocator.domainConfigProvider().getDomainConfigForHostname(location.hostname, location.protocol, location.port) : mailLocator.domainConfigProvider().getCurrentDomainConfig();
			return new LoginViewModel(mailLocator.logins, mailLocator.credentialsProvider, mailLocator.secondFactorHandler, deviceConfig, domainConfig, credentialsRemovalHandler, isBrowser() ? null : this.pushService, appLock);
		};
	}
	getNativeInterface(name) {
		if (!this.nativeInterfaces) throw new ProgrammingError(`Tried to use ${name} in web`);
		return this.nativeInterfaces[name];
	}
	getMailImporter() {
		if (this.mailImporter == null) throw new ProgrammingError(`Tried to use mail importer in web or mobile`);
		return this.mailImporter;
	}
	_workerDeferred;
	_entropyCollector;
	_deferredInitialized = defer();
	get initialized() {
		return this._deferredInitialized.promise;
	}
	constructor() {
		this._workerDeferred = defer();
	}
	async init() {
		this.worker = bootstrapWorker(this);
		await this._createInstances();
		this._entropyCollector = new EntropyCollector(this.entropyFacade, await this.scheduler(), window);
		this._entropyCollector.start();
		this._deferredInitialized.resolve();
	}
	async _createInstances() {
		const { loginFacade, customerFacade, giftCardFacade, groupManagementFacade, configFacade, calendarFacade, mailFacade, shareFacade, counterFacade, indexerFacade, searchFacade, bookingFacade, mailAddressFacade, blobFacade, userManagementFacade, recoverCodeFacade, restInterface, serviceExecutor, cryptoFacade, cacheStorage, random, eventBus, entropyFacade, workerFacade, sqlCipherFacade, contactFacade, bulkMailLoader, mailExportFacade } = this.worker.getWorkerInterface();
		this.loginFacade = loginFacade;
		this.customerFacade = customerFacade;
		this.giftCardFacade = giftCardFacade;
		this.groupManagementFacade = groupManagementFacade;
		this.configFacade = configFacade;
		this.calendarFacade = calendarFacade;
		this.mailFacade = mailFacade;
		this.shareFacade = shareFacade;
		this.counterFacade = counterFacade;
		this.indexerFacade = indexerFacade;
		this.searchFacade = searchFacade;
		this.bookingFacade = bookingFacade;
		this.mailAddressFacade = mailAddressFacade;
		this.blobFacade = blobFacade;
		this.userManagementFacade = userManagementFacade;
		this.recoverCodeFacade = recoverCodeFacade;
		this.contactFacade = contactFacade;
		this.serviceExecutor = serviceExecutor;
		this.sqlCipherFacade = sqlCipherFacade;
		this.logins = new LoginController(this.loginFacade, async () => this.loginListener, () => this.worker.reset());
		this.logins.init();
		this.eventController = new EventController(mailLocator.logins);
		this.progressTracker = new ProgressTracker();
		this.search = new SearchModel(this.searchFacade, () => this.calendarEventsRepository());
		this.entityClient = new EntityClient(restInterface);
		this.cryptoFacade = cryptoFacade;
		this.cacheStorage = cacheStorage;
		this.entropyFacade = entropyFacade;
		this.workerFacade = workerFacade;
		this.bulkMailLoader = bulkMailLoader;
		this.mailExportFacade = mailExportFacade;
		this.connectivityModel = new WebsocketConnectivityModel(eventBus);
		this.mailboxModel = new MailboxModel(this.eventController, this.entityClient, this.logins);
		this.mailModel = new MailModel(notifications, this.mailboxModel, this.eventController, this.entityClient, this.logins, this.mailFacade, this.connectivityModel, this.inboxRuleHanlder());
		this.operationProgressTracker = new OperationProgressTracker();
		this.infoMessageHandler = new InfoMessageHandler((state) => {
			mailLocator.search.indexState(state);
		});
		this.usageTestModel = new UsageTestModel({
			[StorageBehavior.Persist]: deviceConfig,
			[StorageBehavior.Ephemeral]: new EphemeralUsageTestStorage()
		}, {
			now() {
				return Date.now();
			},
			timeZone() {
				throw new Error("Not implemented by this provider");
			}
		}, this.serviceExecutor, this.entityClient, this.logins, this.eventController, () => this.usageTestController);
		this.usageTestController = new UsageTestController(this.usageTestModel);
		this.Const = Const;
		if (!isBrowser()) {
			const { WebDesktopFacade } = await import("./WebDesktopFacade-chunk.js");
			const { WebMobileFacade } = await import("./WebMobileFacade-chunk.js");
			const { WebCommonNativeFacade } = await import("./WebCommonNativeFacade-chunk.js");
			const { WebInterWindowEventFacade } = await import("./WebInterWindowEventFacade-chunk.js");
			const { WebAuthnFacadeSendDispatcher } = await import("./WebAuthnFacadeSendDispatcher-chunk.js");
			const { OpenMailboxHandler } = await import("./OpenMailboxHandler-chunk.js");
			const { createNativeInterfaces, createDesktopInterfaces } = await import("./NativeInterfaceFactory-chunk.js");
			const openMailboxHandler = new OpenMailboxHandler(this.logins, this.mailModel, this.mailboxModel);
			const { OpenCalendarHandler } = await import("./OpenCalendarHandler-chunk.js");
			const openCalendarHandler = new OpenCalendarHandler(this.logins);
			const { OpenSettingsHandler } = await import("./OpenSettingsHandler-chunk.js");
			const openSettingsHandler = new OpenSettingsHandler(this.logins);
			this.webMobileFacade = new WebMobileFacade(this.connectivityModel, MAIL_PREFIX);
			this.nativeInterfaces = createNativeInterfaces(this.webMobileFacade, new WebDesktopFacade(this.logins, async () => this.native), new WebInterWindowEventFacade(this.logins, windowFacade, deviceConfig), new WebCommonNativeFacade(this.logins, this.mailboxModel, this.usageTestController, async () => this.fileApp, async () => this.pushService, this.handleFileImport.bind(this), (userId, address, requestedPath) => openMailboxHandler.openMailbox(userId, address, requestedPath), (userId) => openCalendarHandler.openCalendar(userId), AppType.Integrated, (path) => openSettingsHandler.openSettings(path)), cryptoFacade, calendarFacade, this.entityClient, this.logins, AppType.Integrated);
			this.credentialsProvider = await this.createCredentialsProvider();
			if (isElectronClient()) {
				const desktopInterfaces = createDesktopInterfaces(this.native);
				this.searchTextFacade = desktopInterfaces.searchTextFacade;
				this.interWindowEventSender = desktopInterfaces.interWindowEventSender;
				this.webAuthn = new WebauthnClient(new WebAuthnFacadeSendDispatcher(this.native), this.domainConfigProvider(), isApp());
				if (isDesktop()) {
					this.desktopSettingsFacade = desktopInterfaces.desktopSettingsFacade;
					this.desktopSystemFacade = desktopInterfaces.desktopSystemFacade;
					this.mailImporter = new MailImporter(this.domainConfigProvider(), this.logins, this.mailboxModel, this.entityClient, this.eventController, this.credentialsProvider, desktopInterfaces.nativeMailImportFacade, openSettingsHandler);
					this.exportFacade = desktopInterfaces.exportFacade;
				}
			} else if (isAndroidApp() || isIOSApp()) {
				const { SystemPermissionHandler } = await import("./SystemPermissionHandler-chunk.js");
				this.systemPermissionHandler = new SystemPermissionHandler(this.systemFacade);
				this.webAuthn = new WebauthnClient(new WebAuthnFacadeSendDispatcher(this.native), this.domainConfigProvider(), isApp());
			}
		} else this.credentialsProvider = await this.createCredentialsProvider();
		if (this.webAuthn == null) this.webAuthn = new WebauthnClient(new BrowserWebauthn(navigator.credentials, this.domainConfigProvider().getCurrentDomainConfig()), this.domainConfigProvider(), isApp());
		this.secondFactorHandler = new SecondFactorHandler(this.eventController, this.entityClient, this.webAuthn, this.loginFacade, this.domainConfigProvider());
		this.loginListener = new PageContextLoginListener(this.secondFactorHandler, this.credentialsProvider);
		this.random = random;
		this.newsModel = new NewsModel(this.serviceExecutor, deviceConfig, async (name) => {
			switch (name) {
				case "usageOptIn": {
					const { UsageOptInNews } = await import("./UsageOptInNews-chunk.js");
					return new UsageOptInNews(this.newsModel, this.usageTestModel);
				}
				case "recoveryCode": {
					const { RecoveryCodeNews } = await import("./RecoveryCodeNews-chunk.js");
					return new RecoveryCodeNews(this.newsModel, this.logins.getUserController(), this.recoverCodeFacade);
				}
				case "pinBiometrics": {
					const { PinBiometricsNews } = await import("./PinBiometricsNews-chunk.js");
					return new PinBiometricsNews(this.newsModel, this.credentialsProvider, this.logins.getUserController().userId);
				}
				case "referralLink": {
					const { ReferralLinkNews } = await import("./ReferralLinkNews-chunk.js");
					const dateProvider = await this.noZoneDateProvider();
					return new ReferralLinkNews(this.newsModel, dateProvider, this.logins.getUserController());
				}
				case "richNotifications": {
					const { RichNotificationsNews } = await import("./RichNotificationsNews-chunk.js");
					return new RichNotificationsNews(this.newsModel, isApp() || isDesktop() ? this.pushService : null);
				}
				default:
					console.log(`No implementation for news named '${name}'`);
					return null;
			}
		});
		this.fileController = this.nativeInterfaces == null ? new FileControllerBrowser(blobFacade, guiDownload) : new FileControllerNative(blobFacade, guiDownload, this.nativeInterfaces.fileApp);
		const { ContactModel } = await import("./ContactModel-chunk.js");
		this.contactModel = new ContactModel(this.entityClient, this.logins, this.eventController, async (query, field, minSuggestionCount, maxResults) => {
			const { createRestriction } = await import("./SearchUtils2-chunk.js");
			return mailLocator.searchFacade.search(query, createRestriction(SearchCategoryTypes.contact, null, null, field, [], null), minSuggestionCount, maxResults);
		});
		this.minimizedMailModel = new MinimizedMailEditorViewModel();
		const sanitizerStub = {
			sanitizeHTML: () => {
				return {
					html: "",
					blockedExternalContent: 0,
					inlineImageCids: [],
					links: []
				};
			},
			sanitizeSVG(svg, configExtra) {
				throw new Error("stub!");
			},
			sanitizeFragment(html, configExtra) {
				throw new Error("stub!");
			}
		};
		const selectedThemeFacade = isApp() || isDesktop() ? new NativeThemeFacade(new LazyLoaded(async () => mailLocator.themeFacade)) : new WebThemeFacade(deviceConfig);
		const lazySanitizer = isTest() ? () => Promise.resolve(sanitizerStub) : () => import("./HtmlSanitizer2-chunk.js").then(({ htmlSanitizer }) => htmlSanitizer);
		this.themeController = new ThemeController(theme, selectedThemeFacade, lazySanitizer, AppType.Mail);
		if (selectedThemeFacade instanceof WebThemeFacade) selectedThemeFacade.addDarkListener(() => mailLocator.themeController.reloadTheme());
	}
	calendarModel = lazyMemoized(async () => {
		const { DefaultDateProvider } = await import("./CalendarUtils2-chunk.js");
		const { CalendarModel } = await import("./CalendarModel2-chunk.js");
		const timeZone = new DefaultDateProvider().timeZone();
		return new CalendarModel(notifications, this.alarmScheduler, this.eventController, this.serviceExecutor, this.logins, this.progressTracker, this.entityClient, this.mailboxModel, this.calendarFacade, this.fileController, timeZone, !isBrowser() ? this.externalCalendarFacade : null, deviceConfig, !isBrowser() ? this.pushService : null);
	});
	calendarInviteHandler = lazyMemoized(async () => {
		const { CalendarInviteHandler } = await import("./CalendarInvites2-chunk.js");
		const { calendarNotificationSender } = await import("./CalendarNotificationSender-chunk.js");
		return new CalendarInviteHandler(this.mailboxModel, await this.calendarModel(), this.logins, calendarNotificationSender, (...arg) => this.sendMailModel(...arg));
	});
	async handleFileImport(filesUris) {
		const files = await this.fileApp.getFilesMetaData(filesUris);
		const areAllFilesVCard = files.every((file) => file.mimeType === VCARD_MIME_TYPES.X_VCARD || file.mimeType === VCARD_MIME_TYPES.VCARD);
		const areAllFilesICS = files.every((file) => file.mimeType === CALENDAR_MIME_TYPE);
		const areAllFilesMail = files.every((file) => file.mimeType === MAIL_MIME_TYPES.EML || file.mimeType === MAIL_MIME_TYPES.MBOX);
		if (areAllFilesVCard) {
			const importer = await this.contactImporter();
			const { parseContacts } = await import("./ContactImporter-chunk.js");
			const contacts = await parseContacts(files, this.fileApp);
			const vCardData = contacts.join("\n");
			const contactListId = assertNotNull(await this.contactModel.getContactListId());
			await importer.importContactsFromFile(vCardData, contactListId);
		} else if (areAllFilesICS) {
			const calendarModel = await this.calendarModel();
			const groupSettings = this.logins.getUserController().userSettingsGroupRoot.groupSettings;
			const calendarInfos = await calendarModel.getCalendarInfos();
			const groupColors = groupSettings.reduce((acc, gc) => {
				acc.set(gc.group, gc.color);
				return acc;
			}, new Map());
			const { calendarSelectionDialog, parseCalendarFile } = await import("./CalendarImporter2-chunk.js");
			const { handleCalendarImport } = await import("./CalendarImporterDialog-chunk.js");
			let parsedEvents = [];
			for (const fileRef of files) {
				const dataFile = await this.fileApp.readDataFile(fileRef.location);
				if (dataFile == null) continue;
				const data = parseCalendarFile(dataFile);
				parsedEvents.push(...data.contents);
			}
			calendarSelectionDialog(Array.from(calendarInfos.values()), this.logins.getUserController(), groupColors, (dialog, selectedCalendar) => {
				dialog.close();
				handleCalendarImport(selectedCalendar.groupRoot, parsedEvents);
			});
		}
	}
	alarmScheduler = lazyMemoized(async () => {
		const { AlarmScheduler } = await import("./AlarmScheduler-chunk.js");
		const { DefaultDateProvider } = await import("./CalendarUtils2-chunk.js");
		const dateProvider = new DefaultDateProvider();
		return new AlarmScheduler(dateProvider, await this.scheduler());
	});
	async scheduler() {
		const dateProvider = await this.noZoneDateProvider();
		return new SchedulerImpl(dateProvider, window, window);
	}
	async calendarEventPreviewModel(selectedEvent, calendars) {
		const { findAttendeeInAddresses } = await import("./CommonCalendarUtils2-chunk.js");
		const { getEventType } = await import("./CalendarGuiUtils2-chunk.js");
		const { CalendarEventPreviewViewModel } = await import("./CalendarEventPreviewViewModel-chunk.js");
		const mailboxDetails = await this.mailboxModel.getUserMailboxDetails();
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot);
		const userController = this.logins.getUserController();
		const customer = await userController.loadCustomer();
		const ownMailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, userController.userGroupInfo);
		const ownAttendee = findAttendeeInAddresses(selectedEvent.attendees, ownMailAddresses);
		const eventType = getEventType(selectedEvent, calendars, ownMailAddresses, userController);
		const hasBusinessFeature = isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled) || await userController.isNewPaidPlan();
		const lazyIndexEntry = async () => selectedEvent.uid != null ? this.calendarFacade.getEventsByUid(selectedEvent.uid) : null;
		const popupModel = new CalendarEventPreviewViewModel(selectedEvent, await this.calendarModel(), eventType, hasBusinessFeature, ownAttendee, lazyIndexEntry, async (mode) => this.calendarEventModel(mode, selectedEvent, mailboxDetails, mailboxProperties, null));
		await popupModel.sanitizeDescription();
		return popupModel;
	}
	async calendarContactPreviewModel(event, contact, canEdit) {
		const { CalendarContactPreviewViewModel } = await import("./CalendarContactPreviewViewModel-chunk.js");
		return new CalendarContactPreviewViewModel(event, contact, canEdit);
	}
	nativeContactsSyncManager = lazyMemoized(() => {
		assert(isApp(), "isApp");
		return new NativeContactsSyncManager(this.logins, this.mobileContactsFacade, this.entityClient, this.eventController, this.contactModel, deviceConfig);
	});
	postLoginActions = lazyMemoized(async () => {
		const { PostLoginActions } = await import("./PostLoginActions-chunk.js");
		return new PostLoginActions(this.credentialsProvider, this.secondFactorHandler, this.connectivityModel, this.logins, await this.noZoneDateProvider(), this.entityClient, this.userManagementFacade, this.customerFacade, this.themeController, () => this.showSetupWizard(), () => this.handleExternalSync(), () => this.setUpClientOnlyCalendars());
	});
	showSetupWizard = async () => {
		if (isApp()) {
			const { showSetupWizard } = await import("./SetupWizard-chunk.js");
			return showSetupWizard(this.systemPermissionHandler, this.webMobileFacade, await this.contactImporter(), this.systemFacade, this.credentialsProvider, await this.nativeContactsSyncManager(), deviceConfig, true);
		}
	};
	async handleExternalSync() {
		const calendarModel = await locator.calendarModel();
		if (isApp() || isDesktop()) {
			calendarModel.syncExternalCalendars().catch(async (e) => {
				showSnackBar({
					message: lang.makeTranslation("exception_msg", e.message),
					button: {
						label: "ok_action",
						click: noOp
					},
					waitingTime: 1e3
				});
			});
			calendarModel.scheduleExternalCalendarSync();
		}
	}
	setUpClientOnlyCalendars() {
		let configs = deviceConfig.getClientOnlyCalendars();
		for (const [id, name] of CLIENT_ONLY_CALENDARS.entries()) {
			const calendarId = `${this.logins.getUserController().userId}#${id}`;
			const config = configs.get(calendarId);
			if (!config) deviceConfig.updateClientOnlyCalendars(calendarId, {
				name: lang.get(name),
				color: DEFAULT_CLIENT_ONLY_CALENDAR_COLORS.get(id)
			});
		}
	}
	credentialFormatMigrator = lazyMemoized(async () => {
		const { CredentialFormatMigrator } = await import("./CredentialFormatMigrator-chunk.js");
		if (isDesktop()) return new CredentialFormatMigrator(deviceConfig, this.nativeCredentialsFacade, null);
else if (isApp()) return new CredentialFormatMigrator(deviceConfig, this.nativeCredentialsFacade, this.systemFacade);
else return new CredentialFormatMigrator(deviceConfig, null, null);
	});
	async addNotificationEmailDialog() {
		const { AddNotificationEmailDialog } = await import("./AddNotificationEmailDialog-chunk.js");
		return new AddNotificationEmailDialog(this.logins, this.entityClient);
	}
	mailExportController = lazyMemoized(async () => {
		const { htmlSanitizer } = await import("./HtmlSanitizer2-chunk.js");
		const { MailExportController } = await import("./MailExportController-chunk.js");
		return new MailExportController(this.mailExportFacade, htmlSanitizer, this.exportFacade, this.logins, this.mailboxModel, await this.scheduler());
	});
	/**
	* Factory method for credentials provider that will return an instance injected with the implementations appropriate for the platform.
	*/
	async createCredentialsProvider() {
		const { CredentialsProvider } = await import("./CredentialsProvider2-chunk.js");
		if (isDesktop() || isApp()) return new CredentialsProvider(this.nativeCredentialsFacade, this.sqlCipherFacade, isDesktop() ? this.interWindowEventSender : null);
else {
			const { WebCredentialsFacade } = await import("./WebCredentialsFacade-chunk.js");
			return new CredentialsProvider(new WebCredentialsFacade(deviceConfig), null, null);
		}
	}
};
const mailLocator = new MailLocator();
if (typeof window !== "undefined") window.tutao.locator = mailLocator;

//#endregion
export { EntropyCollector, EventController, FileControllerBrowser, FileControllerNative, InfoMessageHandler, LabelState, LoginController, MailboxModel, NativeThemeFacade, NewsModel, OfflineIndicator, OfflineIndicatorViewModel, OperationProgressTracker, ProgressBar, ProgressBarType, ProgressTracker, SaveErrorReason, SaveStatusEnum, ScopedRouter, SecondFactorHandler, ThemeController, ThrottledRouter, UiImportStatus, WebThemeFacade, WebauthnClient, WebsocketConnectivityModel, appIdToLoginUrl, areResultsForTheSameQuery, getInboxRuleTypeName, getInboxRuleTypeNameMapping, hasMoreResults, isSameSearchRestriction, mailLocator, validateWebauthnDisplayName };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbExvY2F0b3ItY2h1bmsuanMiLCJuYW1lcyI6WyJhdHRyOiBPZmZsaW5lSW5kaWNhdG9yQXR0cnMiLCJhOiBPZmZsaW5lSW5kaWNhdG9yQXR0cnMiLCJwZXJjZW50YWdlOiBudW1iZXIiLCJkYXRlOiBEYXRlIiwidm5vZGU6IFZub2RlPE9mZmxpbmVJbmRpY2F0b3JBdHRycz4iLCJ2bm9kZTogVm5vZGU8UHJvZ3Jlc3NCYXJBdHRycz4iLCJsb2dpbnM6IExvZ2luQ29udHJvbGxlciIsImxpc3RlbmVyOiBFbnRpdHlFdmVudHNMaXN0ZW5lciIsImVudGl0eVVwZGF0ZXM6IFJlYWRvbmx5QXJyYXk8RW50aXR5VXBkYXRlPiIsImV2ZW50T3duZXJHcm91cElkOiBJZCIsImVudGl0eVVwZGF0ZXNEYXRhOiBBcnJheTxFbnRpdHlVcGRhdGVEYXRhPiIsInVwZGF0ZTogV2Vic29ja2V0Q291bnRlckRhdGEiLCJzZWFyY2hGYWNhZGU6IFNlYXJjaEZhY2FkZSIsImNhbGVuZGFyTW9kZWw6IGxhenlBc3luYzxDYWxlbmRhckV2ZW50c1JlcG9zaXRvcnk+Iiwic2VhcmNoUXVlcnk6IFNlYXJjaFF1ZXJ5IiwicHJvZ3Jlc3NUcmFja2VyOiBQcm9ncmVzc1RyYWNrZXIiLCJyZXN1bHQ6IFNlYXJjaFJlc3VsdCIsInJlc3VsdCIsImRheXNJbk1vbnRoczogQXJyYXk8RGF0ZT4iLCJjYWxlbmRhclJlc3VsdDogU2VhcmNoUmVzdWx0IiwibW9uaXRvcjogSVByb2dyZXNzTW9uaXRvciIsImFscmVhZHlBZGRlZDogU2V0PHN0cmluZz4iLCJrZXk6IHN0cmluZyIsImV2ZW50OiBDYWxlbmRhckV2ZW50IiwiZW5kRGF0ZSIsInF1ZXJ5OiBzdHJpbmciLCJyZXN0cmljdGlvbjogU2VhcmNoUmVzdHJpY3Rpb24iLCJpZDogSWRUdXBsZSIsImE6IFNlYXJjaFF1ZXJ5IiwiYjogU2VhcmNoUXVlcnkiLCJhOiBTZWFyY2hSZXN0cmljdGlvbiIsImI6IFNlYXJjaFJlc3RyaWN0aW9uIiwiYTogU2VhcmNoUmVzdWx0IiwiYjogU2VhcmNoUmVzdWx0Iiwic2VhcmNoUmVzdWx0OiBTZWFyY2hSZXN1bHQiLCJldmVudENvbnRyb2xsZXI6IEV2ZW50Q29udHJvbGxlciIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50IiwibG9naW5zOiBMb2dpbkNvbnRyb2xsZXIiLCJtZW1iZXJzaGlwOiBHcm91cE1lbWJlcnNoaXAiLCJtYWlsYm94SWQ6IElkIiwibWFpbEdyb3VwSWQ6IElkIiwidXBkYXRlczogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGVEYXRhPiIsImV2ZW50T3duZXJHcm91cElkOiBJZCIsIm1haWxib3hHcm91cFJvb3Q6IE1haWxib3hHcm91cFJvb3QiLCJwcm9taXNlOiBQcm9taXNlPE1haWxib3hQcm9wZXJ0aWVzPiIsIm1haWxib3hQcm9wZXJ0aWVzOiBNYWlsYm94UHJvcGVydGllcyIsImRpYWxvZzogRGlhbG9nIiwic2VuZE1haWxNb2RlbDogU2VuZE1haWxNb2RlbCIsImRpc3Bvc2U6ICgpID0+IHZvaWQiLCJzYXZlU3RhdHVzOiBTdHJlYW08U2F2ZVN0YXR1cz4iLCJjbG9zZU92ZXJsYXlGdW5jdGlvbjogKCkgPT4gdm9pZCIsImVkaXRvcjogTWluaW1pemVkRWRpdG9yIiwibWFpbDogTWFpbCIsIndvcms6IG51bWJlciIsImlkOiBQcm9ncmVzc01vbml0b3JJZCIsImFtb3VudDogbnVtYmVyIiwicGVyY2VudGFnZTogbnVtYmVyIiwidm5vZGU6IFZub2RlPFNlY29uZEZhY3RvclZpZXdBdHRycz4iLCJhdHRyczogU2Vjb25kRmFjdG9yVmlld0F0dHJzIiwid2ViYXV0aG46IFdlYmF1dGhuTG9naW5QYXJhbXMiLCJlOiBNb3VzZUV2ZW50IiwiYXBwSWQ6IHN0cmluZyIsImRvbWFpbkNvbmZpZ1Byb3ZpZGVyOiBEb21haW5Db25maWdQcm92aWRlciIsIndlYmF1dGhuVXJsOiBzdHJpbmciLCJ3ZWJhdXRobkNsaWVudDogV2ViYXV0aG5DbGllbnQiLCJsb2dpbkZhY2FkZTogTG9naW5GYWNhZGUiLCJkb21haW5Db25maWdQcm92aWRlcjogRG9tYWluQ29uZmlnUHJvdmlkZXIiLCJhdXRoRGF0YTogQXV0aERhdGEiLCJvbkNsb3NlOiBUaHVuayIsImNhbkxvZ2luV2l0aFUyZjogYm9vbGVhbiIsIm90aGVyRG9tYWluTG9naW5Vcmw6IHN0cmluZyB8IG51bGwiLCJ1MmZDaGFsbGVuZ2U6IENoYWxsZW5nZSIsIm1haWxBZGRyZXNzOiBzdHJpbmciLCJldmVudENvbnRyb2xsZXI6IEV2ZW50Q29udHJvbGxlciIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50Iiwid2ViYXV0aG5DbGllbnQ6IFdlYmF1dGhuQ2xpZW50IiwibG9naW5GYWNhZGU6IExvZ2luRmFjYWRlIiwiZG9tYWluQ29uZmlnUHJvdmlkZXI6IERvbWFpbkNvbmZpZ1Byb3ZpZGVyIiwidXBkYXRlczogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGVEYXRhPiIsInNlc3Npb25JZDogSWRUdXBsZSIsInNlc3Npb246IFNlc3Npb24iLCJ0ZXh0OiBzdHJpbmciLCJjaGFsbGVuZ2VzOiBSZWFkb25seUFycmF5PENoYWxsZW5nZT4iLCJtYWlsQWRkcmVzczogc3RyaW5nIHwgbnVsbCIsIndlYmF1dGhuOiBXZWJBdXRobkZhY2FkZSIsImRvbWFpbkNvbmZpZ1Byb3ZpZGVyOiBEb21haW5Db25maWdQcm92aWRlciIsImlzQXBwOiBib29sZWFuIiwiY2hhbGxlbmdlOiBVMmZDaGFsbGVuZ2UiLCJ1c2VySWQ6IElkIiwiZGlzcGxheU5hbWU6IHN0cmluZyIsImFsbG93ZWRLZXlzOiBXZWJhdXRobktleURlc2NyaXB0b3JbXSIsImRvbWFpbkNvbmZpZzogRG9tYWluQ29uZmlnIiwidHlwZTogXCJsZWdhY3lcIiB8IFwibmV3XCIiLCJrZXk6IFUyZktleSIsInJhdzogQXJyYXlCdWZmZXIiLCJhdXRoRGF0YTogVWludDhBcnJheSIsInB1YmxpY0tleTogTWFwPG51bWJlciwgbnVtYmVyIHwgVWludDhBcnJheT4iLCJsb2dpbkZhY2FkZTogTG9naW5GYWNhZGUiLCJsb2dpbkxpc3RlbmVyOiBsYXp5QXN5bmM8UGFnZUNvbnRleHRMb2dpbkxpc3RlbmVyPiIsInJlc2V0QXBwU3RhdGU6ICgpID0+IFByb21pc2U8dW5rbm93bj4iLCJ1c2VybmFtZTogc3RyaW5nIiwicGFzc3dvcmQ6IHN0cmluZyIsInNlc3Npb25UeXBlOiBTZXNzaW9uVHlwZSIsImRhdGFiYXNlS2V5OiBVaW50OEFycmF5IHwgbnVsbCIsImhhbmRsZXI6IGxhenk8UHJvbWlzZTxQb3N0TG9naW5BY3Rpb24+PiIsImluaXREYXRhOiBVc2VyQ29udHJvbGxlckluaXREYXRhIiwidXNlcklkOiBJZCIsInNhbHQ6IFVpbnQ4QXJyYXkiLCJrZGZUeXBlOiBLZGZUeXBlIiwiY2xpZW50SWRlbnRpZmllcjogc3RyaW5nIiwidW5lbmNyeXB0ZWRDcmVkZW50aWFsczogVW5lbmNyeXB0ZWRDcmVkZW50aWFscyIsImV4dGVybmFsVXNlcktleURlcml2ZXI/OiBFeHRlcm5hbFVzZXJLZXlEZXJpdmVyIHwgbnVsbCIsIm9mZmxpbmVUaW1lUmFuZ2VEYXlzPzogbnVtYmVyIHwgbnVsbCIsImZlYXR1cmU6IEZlYXR1cmVUeXBlIiwiY2FjaGVNb2RlOiBDYWNoZU1vZGUiLCJzeW5jOiBib29sZWFuIiwiY3JlZGVudGlhbHM6IFVuZW5jcnlwdGVkQ3JlZGVudGlhbHMiLCJwdXNoSWRlbnRpZmllcjogc3RyaW5nIHwgbnVsbCIsInNlcnZpY2VFeGVjdXRvcjogSVNlcnZpY2VFeGVjdXRvciIsInN0b3JhZ2U6IE5ld3NJdGVtU3RvcmFnZSIsIm5ld3NMaXN0SXRlbUZhY3Rvcnk6IChuYW1lOiBzdHJpbmcpID0+IFByb21pc2U8TmV3c0xpc3RJdGVtIHwgbnVsbD4iLCJyZXNwb25zZTogTmV3c091dCIsIm5ld3NJdGVtSWQ6IElkIiwiZXZlbnRCdXM6IEV4cG9zZWRFdmVudEJ1cyIsIndzQ29ubmVjdGlvblN0YXRlOiBXc0Nvbm5lY3Rpb25TdGF0ZSIsImxlYWRlclN0YXR1czogV2Vic29ja2V0TGVhZGVyU3RhdHVzIiwiY2xvc2VJZk9wZW46IGJvb2xlYW4iLCJlbmFibGVBdXRvbWF0aWNTdGF0ZTogYm9vbGVhbiIsImRlbGF5OiBudW1iZXIgfCBudWxsIiwib3B0aW9uOiBDbG9zZUV2ZW50QnVzT3B0aW9uIiwib3BlcmF0aW9uOiBPcGVyYXRpb25JZCIsInByb2dyZXNzVmFsdWU6IG51bWJlciIsImhhbmRsZUluZGV4U3RhdGVVcGRhdGU6IChzdGF0ZTogU2VhcmNoSW5kZXhTdGF0ZUluZm8pID0+IHZvaWQiLCJtZXNzYWdlOiBJbmZvTWVzc2FnZSIsInN0YXRlOiBTZWFyY2hJbmRleFN0YXRlSW5mbyIsImNhY2hlU3RvcmFnZTogRXhwb3NlZENhY2hlU3RvcmFnZSIsImxvZ2luTGlzdGVuZXI6IFBhZ2VDb250ZXh0TG9naW5MaXN0ZW5lciIsImNvbm5lY3Rpdml0eU1vZGVsOiBXZWJzb2NrZXRDb25uZWN0aXZpdHlNb2RlbCIsImxvZ2luczogTG9naW5Db250cm9sbGVyIiwicHJvZ3Jlc3NUcmFja2VyOiBQcm9ncmVzc1RyYWNrZXIiLCJjYjogKCkgPT4gdm9pZCIsInByb2dyZXNzU3RyZWFtOiBTdHJlYW08bnVtYmVyPiIsIndzU3RyZWFtOiBTdHJlYW08V3NDb25uZWN0aW9uU3RhdGU+IiwicHJvZ3Jlc3M6IG51bWJlciIsIm5ld1N0YXRlOiBXc0Nvbm5lY3Rpb25TdGF0ZSIsInBhdGg6IHN0cmluZyIsInBhcmFtczogUmVjb3JkPHN0cmluZywgYW55PiIsInJvdXRlcjogUm91dGVyIiwic2NvcGU6IFNjb3BlIiwicHJlZml4V2l0aG91dExlYWRpbmdTbGFzaDogc3RyaW5nIiwicm91dGU6IHN0cmluZyIsIm1vdmVNYWlsRGF0YVBlckZvbGRlcjogTW92ZU1haWxEYXRhW10iLCJtYWlsRmFjYWRlOiBNYWlsRmFjYWRlIiwidHlwZTogc3RyaW5nIiwibG9naW5zOiBMb2dpbkNvbnRyb2xsZXIiLCJtYWlsYm94RGV0YWlsOiBNYWlsYm94RGV0YWlsIiwibWFpbDogTWFpbCIsImFwcGx5UnVsZXNPblNlcnZlcjogYm9vbGVhbiIsInJ1bGVzOiBJbmJveFJ1bGVbXSIsImluYm94UnVsZTogSW5ib3hSdWxlIiwidmFsdWU6IHN0cmluZyIsIm1haWxBZGRyZXNzZXM6IHN0cmluZ1tdIiwibWFpbEFkZHJlc3MiLCJlbnRyb3B5RmFjYWRlOiBFbnRyb3B5RmFjYWRlIiwic2NoZWR1bGVyOiBTY2hlZHVsZXIiLCJ3aW5kb3c6IFdpbmRvdyIsImU6IE1vdXNlRXZlbnQiLCJlOiBLZXlib2FyZEV2ZW50IiwiZTogVG91Y2hFdmVudCIsImU6IGFueSIsImRhdGE6IG51bWJlciB8IHVuZGVmaW5lZCIsImVudHJvcHk6IG51bWJlciIsInNvdXJjZTogRW50cm9weVNvdXJjZSIsImFkZGVkOiBudW1iZXJbXSIsIm5ick9mMzJCaXRWYWx1ZXM6IG51bWJlciIsImJsb2JGYWNhZGU6IEJsb2JGYWNhZGUiLCJndWlEb3dubG9hZDogUHJvZ3Jlc3NPYnNlcnZlciIsImd1aURvd25sb2FkIiwiZmlsZTogRGF0YUZpbGUiLCJmaWxlOiBUdXRhbm90YUZpbGUiLCJkb3dubG9hZGVkRmlsZXM6IEFycmF5PEZpbGVSZWZlcmVuY2UgfCBEYXRhRmlsZT4iLCJkb3dubG9hZGVkRmlsZXM6IERhdGFGaWxlW10iLCJibG9iRmFjYWRlOiBCbG9iRmFjYWRlIiwiZ3VpRG93bmxvYWQ6IFByb2dyZXNzT2JzZXJ2ZXIiLCJmaWxlQXBwOiBOYXRpdmVGaWxlQXBwIiwiZ3VpRG93bmxvYWQiLCJmaWxlczogQXJyYXk8RmlsZVJlZmVyZW5jZSB8IERhdGFGaWxlPiIsImZpbGU6IERhdGFGaWxlIiwidHV0YW5vdGFGaWxlOiBUdXRhbm90YUZpbGUiLCJkb3dubG9hZGVkRmlsZXM6IEZpbGVSZWZlcmVuY2VbXSIsImU6IGFueSIsImxvZ2luQ29udHJvbGxlcjogTG9naW5Db250cm9sbGVyIiwibW9iaWxlQ29udGFjdHNGYWNhZGU6IE1vYmlsZUNvbnRhY3RzRmFjYWRlIiwiZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQiLCJldmVudENvbnRyb2xsZXI6IEV2ZW50Q29udHJvbGxlciIsImNvbnRhY3RNb2RlbDogQ29udGFjdE1vZGVsIiwiZGV2aWNlQ29uZmlnOiBEZXZpY2VDb25maWciLCJldmVudHM6IFJlYWRvbmx5QXJyYXk8RW50aXR5VXBkYXRlRGF0YT4iLCJjb250YWN0c0lkVG9DcmVhdGVPclVwZGF0ZTogTWFwPElkLCBBcnJheTxJZD4+IiwiY29udGFjdHNUb0luc2VydE9yVXBkYXRlOiBTdHJ1Y3R1cmVkQ29udGFjdFtdIiwic3RydWN0dXJlZENvbnRhY3RzOiBSZWFkb25seUFycmF5PFN0cnVjdHVyZWRDb250YWN0PiIsImNvbnRhY3RzVG9EZWR1cGU6IHJlYWRvbmx5IFN0cnVjdHVyZWRDb250YWN0W10iLCJjb250YWN0OiBDb250YWN0IiwidXNlcklkPzogc3RyaW5nIiwibG9naW4/OiBzdHJpbmciLCJ1c2VySWQ6IHN0cmluZyIsImVycm9yOiBQZXJtaXNzaW9uRXJyb3IiLCJjb250YWN0czogUmVhZG9ubHlBcnJheTxDb250YWN0PiIsInN5bmNSZXN1bHQ6IENvbnRhY3RTeW5jUmVzdWx0IiwibGlzdElkOiBzdHJpbmciLCJjb250YWN0OiBTdHJ1Y3R1cmVkQ29udGFjdCIsInBhcnRpYWxDb250YWN0OiBDb250YWN0IiwiZGVmYXVsdFRoZW1lSWQ6IFRoZW1lSWQiLCJ0aGVtZVNpbmdsZXRvbjogb2JqZWN0IiwidGhlbWVGYWNhZGU6IFRoZW1lRmFjYWRlIiwiaHRtbFNhbml0aXplcjogKCkgPT4gUHJvbWlzZTxIdG1sU2FuaXRpemVyPiIsImFwcDogQXBwVHlwZSIsInBhcnNlZFRoZW1lOiBUaGVtZUN1c3RvbWl6YXRpb25zIiwic3RyaW5nVGhlbWU6IHN0cmluZyIsInRoZW1lIiwidGhlbWVJZDogVGhlbWVJZCIsIm5ld1RoZW1lUHJlZmVyZW5jZTogVGhlbWVQcmVmZXJlbmNlIiwicGVybWFuZW50OiBib29sZWFuIiwibmV3VGhlbWU6IFRoZW1lIiwibmV3VGhlbWVJZDogVGhlbWVJZCIsImN1c3RvbWl6YXRpb25zOiBUaGVtZUN1c3RvbWl6YXRpb25zIiwidGhlbWU6IFRoZW1lIiwidXBkYXRlZFRoZW1lOiBUaGVtZSIsImJhc2VJZDogQmFzZVRoZW1lSWQiLCJ0aGVtZUZhY2FkZTogTGF6eUxvYWRlZDxUaGVtZUZhY2FkZT4iLCJ0aGVtZTogVGhlbWVJZCIsInRoZW1lczogUmVhZG9ubHlBcnJheTxUaGVtZT4iLCJ0aGVtZXMiLCJkZXZpY2VDb25maWc6IERldmljZUNvbmZpZyIsImxpc3RlbmVyOiAoKSA9PiB1bmtub3duIiwibm90aWZpY2F0aW9uczogTm90aWZpY2F0aW9ucyIsIm1haWxib3hNb2RlbDogTWFpbGJveE1vZGVsIiwiZXZlbnRDb250cm9sbGVyOiBFdmVudENvbnRyb2xsZXIiLCJlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCIsImxvZ2luczogTG9naW5Db250cm9sbGVyIiwibWFpbEZhY2FkZTogTWFpbEZhY2FkZSIsImNvbm5lY3Rpdml0eU1vZGVsOiBXZWJzb2NrZXRDb25uZWN0aXZpdHlNb2RlbCB8IG51bGwiLCJpbmJveFJ1bGVIYW5kbGVyOiBJbmJveFJ1bGVIYW5kbGVyIHwgbnVsbCIsImxpc3RJZDogSWQiLCJ1cGRhdGVzOiBSZWFkb25seUFycmF5PEVudGl0eVVwZGF0ZURhdGE+IiwibWFpbElkOiBJZFR1cGxlIiwibWFpbDogTWFpbCIsIm1haWxGb2xkZXI6IE1haWxGb2xkZXIiLCJmb2xkZXJzSWQ6IElkIiwiZ3JvdXBJZDogSWQiLCJtYWlsczogcmVhZG9ubHkgTWFpbFtdIiwic3RhdGU6IExhYmVsU3RhdGUiLCJtYWlsczogTWFpbFtdIiwidGFyZ2V0TWFpbEZvbGRlcjogTWFpbEZvbGRlciIsIm1haWxzOiBSZWFkb25seUFycmF5PE1haWw+IiwiZm9sZGVyOiBNYWlsRm9sZGVyIiwicmVwb3J0VHlwZTogTWFpbFJlcG9ydFR5cGUiLCJ1bnJlYWQ6IGJvb2xlYW4iLCJhZGRlZExhYmVsczogcmVhZG9ubHkgTWFpbEZvbGRlcltdIiwicmVtb3ZlZExhYmVsczogcmVhZG9ubHkgTWFpbEZvbGRlcltdIiwiY291bnRlcnM6IFdlYnNvY2tldENvdW50ZXJEYXRhIiwibGlua3M6IEFycmF5PHtcblx0XHRcdGhyZWY6IHN0cmluZ1xuXHRcdFx0aW5uZXJIVE1MOiBzdHJpbmdcblx0XHR9PiIsImZvbGRlclN5c3RlbTogRm9sZGVyU3lzdGVtIiwiZGVzY2VuZGFudDogTWFpbEZvbGRlciIsInVucmVhZE1haWxzOiBudW1iZXIiLCJyZWNpcGllbnQ6IHN0cmluZyIsImhlYWRlcnM6IHN0cmluZ1tdIiwibWFpbGJveEdyb3VwUm9vdDogTWFpbGJveEdyb3VwUm9vdCIsInJlcG9ydE1vdmVkTWFpbHM6IFJlcG9ydE1vdmVkTWFpbHNUeXBlIiwibWFpbEdyb3VwSWQ6IElkIiwibGFiZWxEYXRhOiB7IG5hbWU6IHN0cmluZzsgY29sb3I6IHN0cmluZyB9IiwibGFiZWw6IE1haWxGb2xkZXIiLCJuZXdEYXRhOiB7IG5hbWU6IHN0cmluZzsgY29sb3I6IHN0cmluZyB9IiwiZm9sZGVyRWxlbWVudElkOiBJZCIsIkRFRkFVTFRfUFJPR1JFU1NfRVNUSU1BVElPTl9SRUZSRVNIX01TOiBudW1iZXIiLCJSQVRFX1BFUl9TRUNPTkRfTUFYSU1VTV9TQ0FMSU5HX1JBVElPOiBudW1iZXIiLCJ0b3RhbFdvcms6IG51bWJlciIsInVwZGF0ZXI6IFByb2dyZXNzTGlzdGVuZXIiLCJ2YWx1ZTogbnVtYmVyIiwicmF0ZVBlclNlY29uZFNjYWxpbmdSYXRpbzogbnVtYmVyIiwibmV3V29ya0Ftb3VudDogbnVtYmVyIiwibmV3UmF0ZUVudHJ5OiBSZWFkb25seTxbbnVtYmVyLCBudW1iZXJdPiIsImVzdGltYXRlOiBudW1iZXIiLCJhbW91bnQ6IG51bWJlciIsInRvdGFsQW1vdW50OiBudW1iZXIiLCJERUZBVUxUX1RPVEFMX1dPUks6IG51bWJlciIsImRvbWFpbkNvbmZpZ1Byb3ZpZGVyOiBEb21haW5Db25maWdQcm92aWRlciIsImxvZ2luQ29udHJvbGxlcjogTG9naW5Db250cm9sbGVyIiwibWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWwiLCJlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCIsImV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyIiwiY3JlZGVudGlhbHNQcm92aWRlcjogQ3JlZGVudGlhbHNQcm92aWRlciIsIm5hdGl2ZU1haWxJbXBvcnRGYWNhZGU6IE5hdGl2ZU1haWxJbXBvcnRGYWNhZGUiLCJvcGVuU2V0dGluZ3NIYW5kbGVyOiBPcGVuU2V0dGluZ3NIYW5kbGVyIiwiYWN0aXZlSW1wb3J0SWQ6IElkVHVwbGUgfCBudWxsIiwidXBkYXRlczogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGVEYXRhPiIsInNlcnZlclN0YXRlOiBJbXBvcnRNYWlsU3RhdGUiLCJ0b3RhbFdvcms6IG51bWJlciIsImltcG9ydE1haWxTdGF0ZTogSW1wb3J0TWFpbFN0YXRlIiwibWFpbEdyb3VwSWQ6IElkIiwiaW1wb3J0RmFjYWRlOiBOYXRpdmVNYWlsSW1wb3J0RmFjYWRlIiwibWFpbGJveElkOiBzdHJpbmciLCJlcnI6IE1haWxJbXBvcnRFcnJvciIsIm5hdmlnYXRlVG9JbXBvcnRTZXR0aW5nczogU25hY2tCYXJCdXR0b25BdHRycyIsImZpbGVQYXRoczogQXJyYXk8c3RyaW5nPiIsImltcG9ydE1haWxTdGF0ZUVsZW1lbnRJZDogSWQiLCJpbXBvcnRTdGF0dXM6IEltcG9ydFN0YXR1cyIsInJlbW90ZUltcG9ydFN0YXR1czogSW1wb3J0U3RhdHVzIiwibWFpbGJveERldGFpbHM6IE1haWxib3hEZXRhaWwiLCJtYWlsYm94UHJvcGVydGllczogTWFpbGJveFByb3BlcnRpZXMiLCJncm91cFR5cGU6IFR5cGVPZkdyb3VwIiwibW9kZTogQ2FsZW5kYXJPcGVyYXRpb24iLCJldmVudDogQ2FsZW5kYXJFdmVudCIsIm1haWw6IE1haWwiLCJlZGl0TW9kZTogQ2FsZW5kYXJPcGVyYXRpb24iLCJldmVudDogUGFydGlhbDxDYWxlbmRhckV2ZW50PiIsIm1haWxib3hEZXRhaWw6IE1haWxib3hEZXRhaWwiLCJyZXNwb25zZVRvOiBNYWlsIHwgbnVsbCIsInA6IFByb21pc2U8VD4iLCJfcXVlcnk6IHN0cmluZyIsIm9wdGlvbnM6IENyZWF0ZU1haWxWaWV3ZXJPcHRpb25zIiwib3B0aW9ucyIsIm1haWxHcm91cElkOiBJZCIsInVzZXJJZDogSWQiLCJ1c2VyR3JvdXBJbmZvOiBHcm91cEluZm8iLCJuYW1lOiBUIiwic3RhdGU6IFNlYXJjaEluZGV4U3RhdGVJbmZvIiwibmFtZTogc3RyaW5nIiwicXVlcnk6IHN0cmluZyIsImZpZWxkOiBzdHJpbmciLCJtaW5TdWdnZXN0aW9uQ291bnQ6IG51bWJlciIsIm1heFJlc3VsdHM/OiBudW1iZXIiLCJzYW5pdGl6ZXJTdHViOiBQYXJ0aWFsPEh0bWxTYW5pdGl6ZXI+IiwiZmlsZXNVcmlzOiBSZWFkb25seUFycmF5PHN0cmluZz4iLCJncm91cENvbG9yczogTWFwPElkLCBzdHJpbmc+IiwicGFyc2VkRXZlbnRzOiBQYXJzZWRFdmVudFtdIiwic2VsZWN0ZWRFdmVudDogQ2FsZW5kYXJFdmVudCIsImNhbGVuZGFyczogUmVhZG9ubHlNYXA8c3RyaW5nLCBDYWxlbmRhckluZm8+Iiwib3duQXR0ZW5kZWU6IENhbGVuZGFyRXZlbnRBdHRlbmRlZSB8IG51bGwiLCJjb250YWN0OiBDb250YWN0IiwiY2FuRWRpdDogYm9vbGVhbiIsIm1haWxMb2NhdG9yOiBJTWFpbExvY2F0b3IiXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL2d1aS9iYXNlL09mZmxpbmVJbmRpY2F0b3IudHMiLCIuLi9zcmMvY29tbW9uL2d1aS9iYXNlL1Byb2dyZXNzQmFyLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvbWFpbi9FdmVudENvbnRyb2xsZXIudHMiLCIuLi9zcmMvbWFpbC1hcHAvc2VhcmNoL21vZGVsL1NlYXJjaE1vZGVsLnRzIiwiLi4vc3JjL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9NYWlsYm94TW9kZWwudHMiLCIuLi9zcmMvbWFpbC1hcHAvbWFpbC9tb2RlbC9NaW5pbWl6ZWRNYWlsRWRpdG9yVmlld01vZGVsLnRzIiwiLi4vc3JjL2NvbW1vbi9hcGkvbWFpbi9Qcm9ncmVzc1RyYWNrZXIudHMiLCIuLi9zcmMvY29tbW9uL21pc2MvMmZhL1NlY29uZEZhY3RvckF1dGhWaWV3LnRzIiwiLi4vc3JjL2NvbW1vbi9taXNjLzJmYS9TZWNvbmRGYWN0b3JVdGlscy50cyIsIi4uL3NyYy9jb21tb24vbWlzYy8yZmEvU2Vjb25kRmFjdG9yQXV0aERpYWxvZy50cyIsIi4uL3NyYy9jb21tb24vbWlzYy8yZmEvU2Vjb25kRmFjdG9ySGFuZGxlci50cyIsIi4uL3NyYy9jb21tb24vbWlzYy8yZmEvd2ViYXV0aG4vV2ViYXV0aG5DbGllbnQudHMiLCIuLi9zcmMvY29tbW9uL2FwaS9tYWluL0xvZ2luQ29udHJvbGxlci50cyIsIi4uL3NyYy9jb21tb24vbWlzYy9uZXdzL05ld3NNb2RlbC50cyIsIi4uL3NyYy9jb21tb24vbWlzYy9XZWJzb2NrZXRDb25uZWN0aXZpdHlNb2RlbC50cyIsIi4uL3NyYy9jb21tb24vYXBpL21haW4vT3BlcmF0aW9uUHJvZ3Jlc3NUcmFja2VyLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvSW5mb01lc3NhZ2VIYW5kbGVyLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvYmFzZS9PZmZsaW5lSW5kaWNhdG9yVmlld01vZGVsLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvU2NvcGVkUm91dGVyLnRzIiwiLi4vc3JjL21haWwtYXBwL21haWwvbW9kZWwvSW5ib3hSdWxlSGFuZGxlci50cyIsIi4uL3NyYy9jb21tb24vYXBpL21haW4vRW50cm9weUNvbGxlY3Rvci50cyIsIi4uL3NyYy9jb21tb24vZmlsZS9GaWxlQ29udHJvbGxlckJyb3dzZXIudHMiLCIuLi9zcmMvY29tbW9uL2ZpbGUvRmlsZUNvbnRyb2xsZXJOYXRpdmUudHMiLCIuLi9zcmMvbWFpbC1hcHAvY29udGFjdHMvbW9kZWwvTmF0aXZlQ29udGFjdHNTeW5jTWFuYWdlci50cyIsIi4uL3NyYy9jb21tb24vZ3VpL1RoZW1lQ29udHJvbGxlci50cyIsIi4uL3NyYy9tYWlsLWFwcC9tYWlsL21vZGVsL01haWxNb2RlbC50cyIsIi4uL3NyYy9jb21tb24vYXBpL2NvbW1vbi91dGlscy9Fc3RpbWF0aW5nUHJvZ3Jlc3NNb25pdG9yLnRzIiwiLi4vc3JjL21haWwtYXBwL21haWwvaW1wb3J0L01haWxJbXBvcnRlci50cyIsIi4uL3NyYy9tYWlsLWFwcC9tYWlsTG9jYXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IGlzU2FtZURheU9mRGF0ZSwgbm9PcCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcblxuZXhwb3J0IGNvbnN0IGVudW0gT2ZmbGluZUluZGljYXRvclN0YXRlIHtcblx0T2ZmbGluZSA9IDAsXG5cdENvbm5lY3RpbmcgPSAxLFxuXHRTeW5jaHJvbml6aW5nID0gMixcblx0T25saW5lID0gMyxcbn1cblxuZXhwb3J0IHR5cGUgT2ZmbGluZUluZGljYXRvckF0dHJzID1cblx0fCB7IHN0YXRlOiBPZmZsaW5lSW5kaWNhdG9yU3RhdGUuT25saW5lOyBpc1NpbmdsZUNvbHVtbjogYm9vbGVhbiB9XG5cdHwgeyBzdGF0ZTogT2ZmbGluZUluZGljYXRvclN0YXRlLkNvbm5lY3Rpbmc7IGlzU2luZ2xlQ29sdW1uOiBib29sZWFuIH1cblx0fCB7IHN0YXRlOiBPZmZsaW5lSW5kaWNhdG9yU3RhdGUuU3luY2hyb25pemluZzsgcHJvZ3Jlc3M6IG51bWJlcjsgaXNTaW5nbGVDb2x1bW46IGJvb2xlYW4gfVxuXHR8IHsgc3RhdGU6IE9mZmxpbmVJbmRpY2F0b3JTdGF0ZS5PZmZsaW5lOyBsYXN0VXBkYXRlOiBEYXRlIHwgbnVsbDsgcmVjb25uZWN0QWN0aW9uOiAoKSA9PiB2b2lkOyBpc1NpbmdsZUNvbHVtbjogYm9vbGVhbiB9XG5cbi8qKlxuICogdGhlIGZpcnN0IGxpbmUgb2YgdGhlIG9mZmxpbmUgaW5kaWNhdG9yIHNob3dzIGlmIHdlJ3JlIG9mZmxpbmUgb3Igb25saW5lIGFuZFxuICogYWRkcyBhY3Rpb24gcHJvbXB0cyAoaWYgYW55KVxuICogaXQncyByZXR1cm5lZCBhcyBhIHNwYW4gc28gdGhlIGNvbnN1bWVyIGNhbiBkZWNpZGUgaG93IHRvIGxheW91dCBpdC5cbiAqL1xuZnVuY3Rpb24gYXR0clRvRmlyc3RMaW5lKGF0dHI6IE9mZmxpbmVJbmRpY2F0b3JBdHRycyk6IENoaWxkcmVuIHtcblx0Y29uc3QgeyBzdGF0ZSB9ID0gYXR0clxuXHRzd2l0Y2ggKHN0YXRlKSB7XG5cdFx0Y2FzZSBPZmZsaW5lSW5kaWNhdG9yU3RhdGUuT25saW5lOlxuXHRcdGNhc2UgT2ZmbGluZUluZGljYXRvclN0YXRlLlN5bmNocm9uaXppbmc6XG5cdFx0XHRyZXR1cm4gbShcInNwYW5cIiwgbGFuZy5nZXQoXCJvbmxpbmVfbGFiZWxcIikpXG5cdFx0Y2FzZSBPZmZsaW5lSW5kaWNhdG9yU3RhdGUuT2ZmbGluZTpcblx0XHRcdHJldHVybiBtKFwic3BhblwiLCBbbGFuZy5nZXQoXCJvZmZsaW5lX2xhYmVsXCIpLCBtKFwic3Bhbi5iLmNvbnRlbnQtYWNjZW50LWZnLm1sci1zXCIsIGxhbmcuZ2V0KFwicmVjb25uZWN0X2FjdGlvblwiKSldKVxuXHRcdGNhc2UgT2ZmbGluZUluZGljYXRvclN0YXRlLkNvbm5lY3Rpbmc6XG5cdFx0XHRyZXR1cm4gbShcInNwYW5cIiwgbGFuZy5nZXQoXCJvZmZsaW5lX2xhYmVsXCIpKVxuXHR9XG59XG5cbi8qKlxuICogdGhlIHNlY29uZCBsaW5lIHByb3ZpZGVzIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgc3RhdGUuXG4gKiBpdCdzIHJldHVybmVkIGFzIGEgc3BhbiBzbyB0aGUgY29uc3VtZXIgY2FuIGRlY2lkZSBob3cgdG8gbGF5b3V0IGl0LlxuICovXG5mdW5jdGlvbiBhdHRyVG9TZWNvbmRMaW5lKGE6IE9mZmxpbmVJbmRpY2F0b3JBdHRycyk6IENoaWxkcmVuIHtcblx0c3dpdGNoIChhLnN0YXRlKSB7XG5cdFx0Y2FzZSBPZmZsaW5lSW5kaWNhdG9yU3RhdGUuT25saW5lOlxuXHRcdFx0cmV0dXJuIG0oXCJzcGFuXCIsIGxhbmcuZ2V0KFwidXBUb0RhdGVfbGFiZWxcIikpXG5cdFx0Y2FzZSBPZmZsaW5lSW5kaWNhdG9yU3RhdGUuT2ZmbGluZTpcblx0XHRcdGlmIChhLmxhc3RVcGRhdGUpIHtcblx0XHRcdFx0cmV0dXJuIG0oXCJzcGFuXCIsIGxhbmcuZ2V0KFwibGFzdFN5bmNfbGFiZWxcIiwgeyBcIntkYXRlfVwiOiBmb3JtYXREYXRlKGEubGFzdFVwZGF0ZSkgfSkpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBuZXZlciBzeW5jZWQsIGRvbid0IHNob3cgbGFzdCBzeW5jIGxhYmVsXG5cdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHR9XG5cdFx0Y2FzZSBPZmZsaW5lSW5kaWNhdG9yU3RhdGUuU3luY2hyb25pemluZzpcblx0XHRcdHJldHVybiBtKFwic3BhblwiLCBsYW5nLmdldChcInN5bmNocm9uaXppbmdfbGFiZWxcIiwgeyBcIntwcm9ncmVzc31cIjogZm9ybWF0UGVyY2VudGFnZShhLnByb2dyZXNzKSB9KSlcblx0XHRjYXNlIE9mZmxpbmVJbmRpY2F0b3JTdGF0ZS5Db25uZWN0aW5nOlxuXHRcdFx0cmV0dXJuIG0oXCJzcGFuXCIsIGxhbmcuZ2V0KFwicmVjb25uZWN0aW5nX2xhYmVsXCIpKVxuXHR9XG59XG5cbi8qKlxuICogZm9ybWF0IGEgbnVtYmVyIGFzIGEgcGVyY2VudGFnZSBzdHJpbmcgd2l0aCAwID0gMCUgYW5kIDEgPSAxMDAlXG4gKi9cbmZ1bmN0aW9uIGZvcm1hdFBlcmNlbnRhZ2UocGVyY2VudGFnZTogbnVtYmVyKTogc3RyaW5nIHtcblx0cmV0dXJuIGAke01hdGgucm91bmQocGVyY2VudGFnZSAqIDEwMCl9JWBcbn1cblxuLypcbiAqIGZvcm1hdCBhIGRhdGUgZWl0aGVyIGFzIGEgdGltZSB3aXRob3V0IGRhdGUgKGlmIGl0J3MgdG9kYXkpIG9yXG4gKiBhcyBhIGRhdGUgd2l0aG91dCB0aW1lXG4gKi9cbmZ1bmN0aW9uIGZvcm1hdERhdGUoZGF0ZTogRGF0ZSk6IHN0cmluZyB7XG5cdHJldHVybiBpc1NhbWVEYXlPZkRhdGUobmV3IERhdGUoKSwgZGF0ZSkgPyBsYW5nLmZvcm1hdHMudGltZS5mb3JtYXQoZGF0ZSkgOiBsYW5nLmZvcm1hdHMuc2ltcGxlRGF0ZS5mb3JtYXQoZGF0ZSlcbn1cblxuZXhwb3J0IGNsYXNzIE9mZmxpbmVJbmRpY2F0b3IgaW1wbGVtZW50cyBDb21wb25lbnQ8T2ZmbGluZUluZGljYXRvckF0dHJzPiB7XG5cdHZpZXcodm5vZGU6IFZub2RlPE9mZmxpbmVJbmRpY2F0b3JBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgYSA9IHZub2RlLmF0dHJzXG5cdFx0Y29uc3QgaXNPZmZsaW5lID0gYS5zdGF0ZSA9PT0gT2ZmbGluZUluZGljYXRvclN0YXRlLk9mZmxpbmVcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiYnV0dG9uLnNtYWxsXCIsXG5cdFx0XHR7XG5cdFx0XHRcdGNsYXNzOiBhLmlzU2luZ2xlQ29sdW1uID8gXCJjZW50ZXIgbWIteHNcIiA6IFwibWxyLWwgZmxleCBjb2xcIixcblx0XHRcdFx0dHlwZTogXCJidXR0b25cIixcblx0XHRcdFx0aHJlZjogXCIjXCIsXG5cdFx0XHRcdHRhYmluZGV4OiBcIjBcIixcblx0XHRcdFx0cm9sZTogXCJidXR0b25cIixcblx0XHRcdFx0XCJhcmlhLWRpc2FibGVkXCI6ICFpc09mZmxpbmUsXG5cdFx0XHRcdG9uY2xpY2s6IGlzT2ZmbGluZSA/IGEucmVjb25uZWN0QWN0aW9uIDogbm9PcCxcblx0XHRcdH0sXG5cdFx0XHRhLmlzU2luZ2xlQ29sdW1uID8gYXR0clRvRmlyc3RMaW5lKGEpIDogW2F0dHJUb0ZpcnN0TGluZShhKSwgYXR0clRvU2Vjb25kTGluZShhKV0sXG5cdFx0KVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuXG5leHBvcnQgdHlwZSBQcm9ncmVzc0JhckF0dHJzID0ge1xuXHRwcm9ncmVzczogbnVtYmVyXG5cdHR5cGU/OiBQcm9ncmVzc0JhclR5cGVcbn1cblxuZXhwb3J0IGVudW0gUHJvZ3Jlc3NCYXJUeXBlIHtcblx0U21hbGwsXG5cdExhcmdlLFxufVxuXG5leHBvcnQgY29uc3QgUFJPR1JFU1NfRE9ORSA9IDFcblxuLyoqXG4gKiBhIHByb2dyZXNzIGJhciB0aGF0IHRha2VzIGEgcHJvZ3Jlc3MgdmFsdWUgYW5kIGRpc3BsYXlzIGl0IGFzXG4gKiBhIHBvcnRpb24gb2YgaXRzIGNvbnRhaW5lcnMgd2lkdGhcbiAqL1xuZXhwb3J0IGNsYXNzIFByb2dyZXNzQmFyIGltcGxlbWVudHMgQ29tcG9uZW50PFByb2dyZXNzQmFyQXR0cnM+IHtcblx0cHJpdmF0ZSBsYXN0UHJvZ3Jlc3M6IG51bWJlciB8IG51bGwgPSBudWxsXG5cblx0dmlldyh2bm9kZTogVm5vZGU8UHJvZ3Jlc3NCYXJBdHRycz4pIHtcblx0XHRjb25zdCBhID0gdm5vZGUuYXR0cnNcblx0XHRpZiAodGhpcy5sYXN0UHJvZ3Jlc3MgPT09IG51bGwgJiYgYS5wcm9ncmVzcyA+PSBQUk9HUkVTU19ET05FKSB7XG5cdFx0XHQvLyBubyBuZWVkIHRvIGRyYXcgYW55dGhpbmcgaWYgd2Ugd2VudCBmcm9tIDAgdG8gMTAwIHJlYWwgcXVpY2tcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMubGFzdFByb2dyZXNzICE9PSBudWxsICYmIHRoaXMubGFzdFByb2dyZXNzID49IFBST0dSRVNTX0RPTkUpIHtcblx0XHRcdC8vIG9uIHRoZSBsYXN0IHJlZHJhdywgd2Ugd2VyZSBkb25lXG5cdFx0XHQvLyBzbyB3ZSBjYW4gc3RhcnQgdG8gcmVtb3ZlIG5vd1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cdFx0aWYgKGEucHJvZ3Jlc3MgPj0gUFJPR1JFU1NfRE9ORSkge1xuXHRcdFx0Ly8gc2NoZWR1bGUgdGhlIHJlbW92YWwgcmVkcmF3IG5vdyBiZWNhdXNlXG5cdFx0XHQvLyB3ZSBtaWdodCBub3QgZ2V0IGFub3RoZXIgcmVkcmF3IGZvciBhIHdoaWxlXG5cdFx0XHQvLyBvdGhlcndpc2UgKHNpbmNlIHByb2dyZXNzIGlzIGRvbmUpXG5cdFx0XHRtLnJlZHJhdygpXG5cdFx0fVxuXG5cdFx0dGhpcy5sYXN0UHJvZ3Jlc3MgPSBhLnByb2dyZXNzXG5cdFx0bGV0IHByb2dyZXNzQmFyU2VsZWN0b3IgPSBhLnR5cGUgPT0gUHJvZ3Jlc3NCYXJUeXBlLkxhcmdlID8gXCIuYWJzLmFjY2VudC1iZy5ib3JkZXItcmFkaXVzLWJpZ1wiIDogXCIuYWJzLmFjY2VudC1iZ1wiXG5cdFx0cmV0dXJuIG0ocHJvZ3Jlc3NCYXJTZWxlY3Rvciwge1xuXHRcdFx0b25iZWZvcmVyZW1vdmU6ICh2bikgPT5cblx0XHRcdFx0bmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcblx0XHRcdFx0XHR2bi5kb20uYWRkRXZlbnRMaXN0ZW5lcihcInRyYW5zaXRpb25lbmRcIiwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5sYXN0UHJvZ3Jlc3MgPSBudWxsXG5cdFx0XHRcdFx0XHRyZXNvbHZlKClcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5sYXN0UHJvZ3Jlc3MgPSBudWxsXG5cdFx0XHRcdFx0XHRyZXNvbHZlKClcblx0XHRcdFx0XHR9LCA1MDApXG5cdFx0XHRcdH0pLFxuXHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0dG9wOiAwLFxuXHRcdFx0XHRsZWZ0OiAwLFxuXHRcdFx0XHR0cmFuc2l0aW9uOiBcIndpZHRoIDUwMG1zXCIsXG5cdFx0XHRcdHdpZHRoOiBhLnByb2dyZXNzICogMTAwICsgXCIlXCIsXG5cdFx0XHRcdGhlaWdodDogYS50eXBlID09IFByb2dyZXNzQmFyVHlwZS5MYXJnZSA/IFwiMTAwJVwiIDogXCIycHhcIixcblx0XHRcdH0sXG5cdFx0fSlcblx0fVxufVxuIiwiaW1wb3J0IHsgZG93bmNhc3QsIGlkZW50aXR5LCBub09wIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgdHlwZSB7IExvZ2luQ29udHJvbGxlciB9IGZyb20gXCIuL0xvZ2luQ29udHJvbGxlclwiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgU3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgRW50aXR5VXBkYXRlLCBXZWJzb2NrZXRDb3VudGVyRGF0YSB9IGZyb20gXCIuLi9lbnRpdGllcy9zeXMvVHlwZVJlZnNcIlxuaW1wb3J0IHsgRW50aXR5VXBkYXRlRGF0YSB9IGZyb20gXCIuLi9jb21tb24vdXRpbHMvRW50aXR5VXBkYXRlVXRpbHMuanNcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcblxuZXhwb3J0IHR5cGUgRXhwb3NlZEV2ZW50Q29udHJvbGxlciA9IFBpY2s8RXZlbnRDb250cm9sbGVyLCBcIm9uRW50aXR5VXBkYXRlUmVjZWl2ZWRcIiB8IFwib25Db3VudGVyc1VwZGF0ZVJlY2VpdmVkXCI+XG5cbmNvbnN0IFRBRyA9IFwiW0V2ZW50Q29udHJvbGxlcl1cIlxuXG5leHBvcnQgdHlwZSBFbnRpdHlFdmVudHNMaXN0ZW5lciA9ICh1cGRhdGVzOiBSZWFkb25seUFycmF5PEVudGl0eVVwZGF0ZURhdGE+LCBldmVudE93bmVyR3JvdXBJZDogSWQpID0+IFByb21pc2U8dW5rbm93bj5cblxuZXhwb3J0IGNsYXNzIEV2ZW50Q29udHJvbGxlciB7XG5cdHByaXZhdGUgY291bnRlcnNTdHJlYW06IFN0cmVhbTxXZWJzb2NrZXRDb3VudGVyRGF0YT4gPSBzdHJlYW0oKVxuXHRwcml2YXRlIGVudGl0eUxpc3RlbmVyczogU2V0PEVudGl0eUV2ZW50c0xpc3RlbmVyPiA9IG5ldyBTZXQoKVxuXG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgbG9naW5zOiBMb2dpbkNvbnRyb2xsZXIpIHt9XG5cblx0YWRkRW50aXR5TGlzdGVuZXIobGlzdGVuZXI6IEVudGl0eUV2ZW50c0xpc3RlbmVyKSB7XG5cdFx0aWYgKHRoaXMuZW50aXR5TGlzdGVuZXJzLmhhcyhsaXN0ZW5lcikpIHtcblx0XHRcdGNvbnNvbGUud2FybihUQUcsIFwiQWRkaW5nIHRoZSBzYW1lIGxpc3RlbmVyIHR3aWNlIVwiKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmVudGl0eUxpc3RlbmVycy5hZGQobGlzdGVuZXIpXG5cdFx0fVxuXHR9XG5cblx0cmVtb3ZlRW50aXR5TGlzdGVuZXIobGlzdGVuZXI6IEVudGl0eUV2ZW50c0xpc3RlbmVyKSB7XG5cdFx0Y29uc3Qgd2FzUmVtb3ZlZCA9IHRoaXMuZW50aXR5TGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcilcblx0XHRpZiAoIXdhc1JlbW92ZWQpIHtcblx0XHRcdGNvbnNvbGUud2FybihUQUcsIFwiQ291bGQgbm90IHJlbW92ZSBsaXN0ZW5lciwgcG9zc2libGUgbGVhaz9cIiwgbGlzdGVuZXIpXG5cdFx0fVxuXHR9XG5cblx0Z2V0Q291bnRlcnNTdHJlYW0oKTogU3RyZWFtPFdlYnNvY2tldENvdW50ZXJEYXRhPiB7XG5cdFx0Ly8gQ3JlYXRlIGNvcHkgc28gaXQncyBuZXZlciBlbmRlZFxuXHRcdHJldHVybiB0aGlzLmNvdW50ZXJzU3RyZWFtLm1hcChpZGVudGl0eSlcblx0fVxuXG5cdGFzeW5jIG9uRW50aXR5VXBkYXRlUmVjZWl2ZWQoZW50aXR5VXBkYXRlczogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGU+LCBldmVudE93bmVyR3JvdXBJZDogSWQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRsZXQgbG9naW5zVXBkYXRlcyA9IFByb21pc2UucmVzb2x2ZSgpXG5cblx0XHRpZiAodGhpcy5sb2dpbnMuaXNVc2VyTG9nZ2VkSW4oKSkge1xuXHRcdFx0Ly8gdGhlIFVzZXJDb250cm9sbGVyIG11c3QgYmUgbm90aWZpZWQgZmlyc3QgYXMgb3RoZXIgZXZlbnQgcmVjZWl2ZXJzIGRlcGVuZCBvbiBpdCB0byBiZSB1cC10by1kYXRlXG5cdFx0XHRsb2dpbnNVcGRhdGVzID0gdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5lbnRpdHlFdmVudHNSZWNlaXZlZChlbnRpdHlVcGRhdGVzIGFzIFJlYWRvbmx5QXJyYXk8RW50aXR5VXBkYXRlRGF0YT4sIGV2ZW50T3duZXJHcm91cElkKVxuXHRcdH1cblxuXHRcdHJldHVybiBsb2dpbnNVcGRhdGVzXG5cdFx0XHQudGhlbihhc3luYyAoKSA9PiB7XG5cdFx0XHRcdC8vIHNlcXVlbnRpYWxseSB0byBwcmV2ZW50IHBhcmFsbGVsIGxvYWRpbmcgb2YgaW5zdGFuY2VzXG5cdFx0XHRcdGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5lbnRpdHlMaXN0ZW5lcnMpIHtcblx0XHRcdFx0XHRsZXQgZW50aXR5VXBkYXRlc0RhdGE6IEFycmF5PEVudGl0eVVwZGF0ZURhdGE+ID0gZG93bmNhc3QoZW50aXR5VXBkYXRlcylcblx0XHRcdFx0XHRhd2FpdCBsaXN0ZW5lcihlbnRpdHlVcGRhdGVzRGF0YSwgZXZlbnRPd25lckdyb3VwSWQpXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQudGhlbihub09wKVxuXHR9XG5cblx0YXN5bmMgb25Db3VudGVyc1VwZGF0ZVJlY2VpdmVkKHVwZGF0ZTogV2Vic29ja2V0Q291bnRlckRhdGEpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmNvdW50ZXJzU3RyZWFtKHVwZGF0ZSlcblx0fVxufVxuIiwiaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudCwgQ2FsZW5kYXJFdmVudFR5cGVSZWYsIE1haWxUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgTk9USElOR19JTkRFWEVEX1RJTUVTVEFNUCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBEYkVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL0RiRXJyb3JcIlxuaW1wb3J0IHR5cGUgeyBTZWFyY2hJbmRleFN0YXRlSW5mbywgU2VhcmNoUmVzdHJpY3Rpb24sIFNlYXJjaFJlc3VsdCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9zZWFyY2gvU2VhcmNoVHlwZXNcIlxuaW1wb3J0IHsgYXJyYXlFcXVhbHMsIGFzc2VydE5vbk51bGwsIGFzc2VydE5vdE51bGwsIGluY3JlbWVudE1vbnRoLCBpc1NhbWVUeXBlUmVmLCBsYXp5QXN5bmMsIG9mQ2xhc3MsIHRva2VuaXplIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgdHlwZSB7IFNlYXJjaEZhY2FkZSB9IGZyb20gXCIuLi8uLi93b3JrZXJVdGlscy9pbmRleC9TZWFyY2hGYWNhZGUuanNcIlxuaW1wb3J0IHsgYXNzZXJ0TWFpbk9yTm9kZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgbGlzdElkUGFydCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5pbXBvcnQgeyBJUHJvZ3Jlc3NNb25pdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL1Byb2dyZXNzTW9uaXRvci5qc1wiXG5pbXBvcnQgeyBQcm9ncmVzc1RyYWNrZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL1Byb2dyZXNzVHJhY2tlci5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50c1JlcG9zaXRvcnkgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJFdmVudHNSZXBvc2l0b3J5LmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5leHBvcnQgdHlwZSBTZWFyY2hRdWVyeSA9IHtcblx0cXVlcnk6IHN0cmluZ1xuXHRyZXN0cmljdGlvbjogU2VhcmNoUmVzdHJpY3Rpb25cblx0bWluU3VnZ2VzdGlvbkNvdW50OiBudW1iZXJcblx0bWF4UmVzdWx0czogbnVtYmVyIHwgbnVsbFxufVxuXG5leHBvcnQgY2xhc3MgU2VhcmNoTW9kZWwge1xuXHRyZXN1bHQ6IFN0cmVhbTxTZWFyY2hSZXN1bHQgfCBudWxsPlxuXHRpbmRleFN0YXRlOiBTdHJlYW08U2VhcmNoSW5kZXhTdGF0ZUluZm8+XG5cdC8vIHdlIHN0b3JlIHRoaXMgYXMgYSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnRseSBydW5uaW5nIHNlYXJjaC4gaWYgd2UgZG9uJ3QsIHdlIG9ubHkgaGF2ZSB0aGUgbGFzdCByZXN1bHQncyBxdWVyeSBpbmZvXG5cdC8vIHRvIGNvbXBhcmUgYWdhaW5zdCBpbmNvbWluZyBuZXcgcXVlcmllc1xuXHRsYXN0UXVlcnlTdHJpbmc6IFN0cmVhbTxzdHJpbmcgfCBudWxsPlxuXHRpbmRleGluZ1N1cHBvcnRlZDogYm9vbGVhblxuXHRfc2VhcmNoRmFjYWRlOiBTZWFyY2hGYWNhZGVcblx0cHJpdmF0ZSBsYXN0UXVlcnk6IFNlYXJjaFF1ZXJ5IHwgbnVsbFxuXHRwcml2YXRlIGxhc3RTZWFyY2hQcm9taXNlOiBQcm9taXNlPFNlYXJjaFJlc3VsdCB8IHZvaWQ+XG5cdGNhbmNlbFNpZ25hbDogU3RyZWFtPGJvb2xlYW4+XG5cblx0Y29uc3RydWN0b3Ioc2VhcmNoRmFjYWRlOiBTZWFyY2hGYWNhZGUsIHByaXZhdGUgcmVhZG9ubHkgY2FsZW5kYXJNb2RlbDogbGF6eUFzeW5jPENhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeT4pIHtcblx0XHR0aGlzLl9zZWFyY2hGYWNhZGUgPSBzZWFyY2hGYWNhZGVcblx0XHR0aGlzLnJlc3VsdCA9IHN0cmVhbSgpXG5cdFx0dGhpcy5sYXN0UXVlcnlTdHJpbmcgPSBzdHJlYW08c3RyaW5nIHwgbnVsbD4oXCJcIilcblx0XHR0aGlzLmluZGV4aW5nU3VwcG9ydGVkID0gdHJ1ZVxuXHRcdHRoaXMuaW5kZXhTdGF0ZSA9IHN0cmVhbTxTZWFyY2hJbmRleFN0YXRlSW5mbz4oe1xuXHRcdFx0aW5pdGlhbGl6aW5nOiB0cnVlLFxuXHRcdFx0bWFpbEluZGV4RW5hYmxlZDogZmFsc2UsXG5cdFx0XHRwcm9ncmVzczogMCxcblx0XHRcdGN1cnJlbnRNYWlsSW5kZXhUaW1lc3RhbXA6IE5PVEhJTkdfSU5ERVhFRF9USU1FU1RBTVAsXG5cdFx0XHRhaW1lZE1haWxJbmRleFRpbWVzdGFtcDogTk9USElOR19JTkRFWEVEX1RJTUVTVEFNUCxcblx0XHRcdGluZGV4ZWRNYWlsQ291bnQ6IDAsXG5cdFx0XHRmYWlsZWRJbmRleGluZ1VwVG86IG51bGwsXG5cdFx0fSlcblx0XHR0aGlzLmxhc3RRdWVyeSA9IG51bGxcblx0XHR0aGlzLmxhc3RTZWFyY2hQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKClcblx0XHR0aGlzLmNhbmNlbFNpZ25hbCA9IHN0cmVhbShmYWxzZSlcblx0fVxuXG5cdGFzeW5jIHNlYXJjaChzZWFyY2hRdWVyeTogU2VhcmNoUXVlcnksIHByb2dyZXNzVHJhY2tlcjogUHJvZ3Jlc3NUcmFja2VyKTogUHJvbWlzZTxTZWFyY2hSZXN1bHQgfCB2b2lkPiB7XG5cdFx0aWYgKHRoaXMubGFzdFF1ZXJ5ICYmIHNlYXJjaFF1ZXJ5RXF1YWxzKHNlYXJjaFF1ZXJ5LCB0aGlzLmxhc3RRdWVyeSkpIHtcblx0XHRcdHJldHVybiB0aGlzLmxhc3RTZWFyY2hQcm9taXNlXG5cdFx0fVxuXG5cdFx0dGhpcy5sYXN0UXVlcnkgPSBzZWFyY2hRdWVyeVxuXHRcdGNvbnN0IHsgcXVlcnksIHJlc3RyaWN0aW9uLCBtaW5TdWdnZXN0aW9uQ291bnQsIG1heFJlc3VsdHMgfSA9IHNlYXJjaFF1ZXJ5XG5cdFx0dGhpcy5sYXN0UXVlcnlTdHJpbmcocXVlcnkpXG5cdFx0bGV0IHJlc3VsdCA9IHRoaXMucmVzdWx0KClcblxuXHRcdGlmIChyZXN1bHQgJiYgIWlzU2FtZVR5cGVSZWYocmVzdHJpY3Rpb24udHlwZSwgcmVzdWx0LnJlc3RyaWN0aW9uLnR5cGUpKSB7XG5cdFx0XHQvLyByZXNldCB0aGUgcmVzdWx0IGluIGNhc2Ugb25seSB0aGUgc2VhcmNoIHR5cGUgaGFzIGNoYW5nZWRcblx0XHRcdHRoaXMucmVzdWx0KG51bGwpXG5cdFx0fSBlbHNlIGlmICh0aGlzLmluZGV4U3RhdGUoKS5wcm9ncmVzcyA+IDAgJiYgcmVzdWx0ICYmIGlzU2FtZVR5cGVSZWYoTWFpbFR5cGVSZWYsIHJlc3VsdC5yZXN0cmljdGlvbi50eXBlKSkge1xuXHRcdFx0Ly8gcmVzZXQgdGhlIHJlc3VsdCBpZiBpbmRleGluZyBpcyBpbiBwcm9ncmVzcyBhbmQgdGhlIGN1cnJlbnQgc2VhcmNoIHJlc3VsdCBpcyBvZiB0eXBlIG1haWxcblx0XHRcdHRoaXMucmVzdWx0KG51bGwpXG5cdFx0fVxuXG5cdFx0aWYgKHF1ZXJ5LnRyaW0oKSA9PT0gXCJcIikge1xuXHRcdFx0Ly8gaWYgdGhlcmUgd2FzIGFuIGVtcHR5IHF1ZXJ5LCBqdXN0IHNlbmQgZW1wdHkgcmVzdWx0XG5cdFx0XHRjb25zdCByZXN1bHQ6IFNlYXJjaFJlc3VsdCA9IHtcblx0XHRcdFx0cXVlcnk6IHF1ZXJ5LFxuXHRcdFx0XHRyZXN0cmljdGlvbjogcmVzdHJpY3Rpb24sXG5cdFx0XHRcdHJlc3VsdHM6IFtdLFxuXHRcdFx0XHRjdXJyZW50SW5kZXhUaW1lc3RhbXA6IHRoaXMuaW5kZXhTdGF0ZSgpLmN1cnJlbnRNYWlsSW5kZXhUaW1lc3RhbXAsXG5cdFx0XHRcdGxhc3RSZWFkU2VhcmNoSW5kZXhSb3c6IFtdLFxuXHRcdFx0XHRtYXhSZXN1bHRzOiAwLFxuXHRcdFx0XHRtYXRjaFdvcmRPcmRlcjogZmFsc2UsXG5cdFx0XHRcdG1vcmVSZXN1bHRzOiBbXSxcblx0XHRcdFx0bW9yZVJlc3VsdHNFbnRyaWVzOiBbXSxcblx0XHRcdH1cblx0XHRcdHRoaXMucmVzdWx0KHJlc3VsdClcblx0XHRcdHRoaXMubGFzdFNlYXJjaFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUocmVzdWx0KVxuXHRcdH0gZWxzZSBpZiAoaXNTYW1lVHlwZVJlZihDYWxlbmRhckV2ZW50VHlwZVJlZiwgcmVzdHJpY3Rpb24udHlwZSkpIHtcblx0XHRcdC8vIHdlIGludGVycHJldCByZXN0cmljdGlvbi5zdGFydCBhcyB0aGUgc3RhcnQgb2YgdGhlIGZpcnN0IGRheSBvZiB0aGUgZmlyc3QgbW9udGggd2Ugd2FudCB0byBzZWFyY2hcblx0XHRcdC8vIHJlc3RyaWN0aW9uLmVuZCBpcyB0aGUgZW5kIG9mIHRoZSBsYXN0IGRheSBvZiB0aGUgbGFzdCBtb250aCB3ZSB3YW50IHRvIHNlYXJjaFxuXHRcdFx0bGV0IGN1cnJlbnREYXRlID0gbmV3IERhdGUoYXNzZXJ0Tm90TnVsbChyZXN0cmljdGlvbi5zdGFydCkpXG5cdFx0XHRjb25zdCBlbmREYXRlID0gbmV3IERhdGUoYXNzZXJ0Tm90TnVsbChyZXN0cmljdGlvbi5lbmQpKVxuXHRcdFx0Y29uc3QgY2FsZW5kYXJNb2RlbCA9IGF3YWl0IHRoaXMuY2FsZW5kYXJNb2RlbCgpXG5cdFx0XHRjb25zdCBkYXlzSW5Nb250aHM6IEFycmF5PERhdGU+ID0gW11cblx0XHRcdHdoaWxlIChjdXJyZW50RGF0ZS5nZXRUaW1lKCkgPD0gZW5kRGF0ZS5nZXRUaW1lKCkpIHtcblx0XHRcdFx0ZGF5c0luTW9udGhzLnB1c2goY3VycmVudERhdGUpXG5cdFx0XHRcdGN1cnJlbnREYXRlID0gaW5jcmVtZW50TW9udGgoY3VycmVudERhdGUsIDEpXG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGNhbGVuZGFyUmVzdWx0OiBTZWFyY2hSZXN1bHQgPSB7XG5cdFx0XHRcdC8vIGluZGV4IHJlbGF0ZWQsIGtlZXAgZW1wdHlcblx0XHRcdFx0Y3VycmVudEluZGV4VGltZXN0YW1wOiAwLFxuXHRcdFx0XHRtb3JlUmVzdWx0czogW10sXG5cdFx0XHRcdG1vcmVSZXN1bHRzRW50cmllczogW10sXG5cdFx0XHRcdGxhc3RSZWFkU2VhcmNoSW5kZXhSb3c6IFtdLFxuXHRcdFx0XHQvLyBkYXRhIHRoYXQgaXMgcmVsZXZhbnQgdG8gY2FsZW5kYXIgc2VhcmNoXG5cdFx0XHRcdG1hdGNoV29yZE9yZGVyOiBmYWxzZSxcblx0XHRcdFx0cmVzdHJpY3Rpb24sXG5cdFx0XHRcdHJlc3VsdHM6IFtdLFxuXHRcdFx0XHRxdWVyeSxcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgbW9uaXRvckhhbmRsZSA9IHByb2dyZXNzVHJhY2tlci5yZWdpc3Rlck1vbml0b3JTeW5jKGRheXNJbk1vbnRocy5sZW5ndGgpXG5cdFx0XHRjb25zdCBtb25pdG9yOiBJUHJvZ3Jlc3NNb25pdG9yID0gYXNzZXJ0Tm90TnVsbChwcm9ncmVzc1RyYWNrZXIuZ2V0TW9uaXRvcihtb25pdG9ySGFuZGxlKSlcblxuXHRcdFx0aWYgKHRoaXMuY2FuY2VsU2lnbmFsKCkpIHtcblx0XHRcdFx0dGhpcy5yZXN1bHQoY2FsZW5kYXJSZXN1bHQpXG5cdFx0XHRcdHRoaXMubGFzdFNlYXJjaFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoY2FsZW5kYXJSZXN1bHQpXG5cdFx0XHRcdHJldHVybiB0aGlzLmxhc3RTZWFyY2hQcm9taXNlXG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGhhc05ld1BhaWRQbGFuID0gYXdhaXQgY2FsZW5kYXJNb2RlbC5jYW5Mb2FkQmlydGhkYXlzQ2FsZW5kYXIoKVxuXHRcdFx0aWYgKGhhc05ld1BhaWRQbGFuKSB7XG5cdFx0XHRcdGF3YWl0IGNhbGVuZGFyTW9kZWwubG9hZENvbnRhY3RzQmlydGhkYXlzKClcblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgY2FsZW5kYXJNb2RlbC5sb2FkTW9udGhzSWZOZWVkZWQoZGF5c0luTW9udGhzLCBtb25pdG9yLCB0aGlzLmNhbmNlbFNpZ25hbClcblx0XHRcdG1vbml0b3IuY29tcGxldGVkKClcblxuXHRcdFx0Y29uc3QgZXZlbnRzRm9yRGF5cyA9IGNhbGVuZGFyTW9kZWwuZ2V0RXZlbnRzRm9yTW9udGhzKCkoKVxuXG5cdFx0XHRhc3NlcnROb25OdWxsKHJlc3RyaWN0aW9uLnN0YXJ0KVxuXHRcdFx0YXNzZXJ0Tm9uTnVsbChyZXN0cmljdGlvbi5lbmQpXG5cblx0XHRcdGNvbnN0IHRva2VucyA9IHRva2VuaXplKHF1ZXJ5LnRyaW0oKSlcblx0XHRcdC8vIHdlIHdhbnQgZXZlbnQgaW5zdGFuY2VzIHRoYXQgb2NjdXIgb24gbXVsdGlwbGUgZGF5cyB0byBvbmx5IGFwcGVhciBvbmNlLCBidXQgd2FudFxuXHRcdFx0Ly8gc2VwYXJhdGUgaW5zdGFuY2VzIG9mIGV2ZW50IHNlcmllcyB0byBvY2N1ciBvbiB0aGVpciBvd24uXG5cdFx0XHRjb25zdCBhbHJlYWR5QWRkZWQ6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpXG5cblx0XHRcdGlmICh0aGlzLmNhbmNlbFNpZ25hbCgpKSB7XG5cdFx0XHRcdHRoaXMucmVzdWx0KGNhbGVuZGFyUmVzdWx0KVxuXHRcdFx0XHR0aGlzLmxhc3RTZWFyY2hQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKGNhbGVuZGFyUmVzdWx0KVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5sYXN0U2VhcmNoUHJvbWlzZVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBmb2xsb3dDb21tb25SZXN0cmljdGlvbnMgPSAoa2V5OiBzdHJpbmcsIGV2ZW50OiBDYWxlbmRhckV2ZW50KSA9PiB7XG5cdFx0XHRcdGlmIChhbHJlYWR5QWRkZWQuaGFzKGtleSkpIHtcblx0XHRcdFx0XHQvLyB3ZSBvbmx5IG5lZWQgdGhlIGZpcnN0IGV2ZW50IGluIHRoZSBzZXJpZXMsIHRoZSB2aWV3IHdpbGwgbG9hZCAmIHRoZW4gZ2VuZXJhdGVcblx0XHRcdFx0XHQvLyB0aGUgc2VyaWVzIGZvciB0aGUgc2VhcmNoZWQgdGltZSByYW5nZS5cblx0XHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyZXN0cmljdGlvbi5mb2xkZXJJZHMubGVuZ3RoID4gMCAmJiAhcmVzdHJpY3Rpb24uZm9sZGVySWRzLmluY2x1ZGVzKGxpc3RJZFBhcnQoZXZlbnQuX2lkKSkpIHtcblx0XHRcdFx0XHQvLyBjaGVjayB0aGF0IHRoZSBldmVudCBpcyBpbiB0aGUgc2VhcmNoZWQgY2FsZW5kYXIuXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAocmVzdHJpY3Rpb24uZXZlbnRTZXJpZXMgPT09IGZhbHNlICYmIGV2ZW50LnJlcGVhdFJ1bGUgIT0gbnVsbCkge1xuXHRcdFx0XHRcdC8vIGFwcGxpZWQgXCJyZXBlYXRpbmdcIiBzZWFyY2ggZmlsdGVyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucykge1xuXHRcdFx0XHRcdGlmIChldmVudC5zdW1tYXJ5LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXModG9rZW4pKSB7XG5cdFx0XHRcdFx0XHRhbHJlYWR5QWRkZWQuYWRkKGtleSlcblx0XHRcdFx0XHRcdGNhbGVuZGFyUmVzdWx0LnJlc3VsdHMucHVzaChldmVudC5faWQpXG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAodG9rZW5zLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0Ly8gd2UncmUgaXRlcmF0aW5nIGJ5IGV2ZW50IGZpcnN0IHRvIG9ubHkgaGF2ZSB0byBzYW5pdGl6ZSB0aGUgZGVzY3JpcHRpb24gb25jZS5cblx0XHRcdFx0Ly8gdGhhdCdzIGEgc21hbGxlciBzYXZpbmdzIHRoYW4gb25lIG1pZ2h0IHRoaW5rIGJlY2F1c2UgZm9yIHRoZSB2YXN0IG1ham9yaXR5IG9mXG5cdFx0XHRcdC8vIGV2ZW50cyB3ZSdyZSBwcm9iYWJseSBub3QgbWF0Y2hpbmcgYW5kIGxvb2tpbmcgaW50byB0aGUgZGVzY3JpcHRpb24gYW55d2F5LlxuXHRcdFx0XHRmb3IgKGNvbnN0IFtzdGFydE9mRGF5LCBldmVudHNPbkRheV0gb2YgZXZlbnRzRm9yRGF5cykge1xuXHRcdFx0XHRcdGV2ZW50TG9vcDogZm9yIChjb25zdCBldmVudCBvZiBldmVudHNPbkRheSkge1xuXHRcdFx0XHRcdFx0aWYgKCEoc3RhcnRPZkRheSA+PSByZXN0cmljdGlvbi5zdGFydCAmJiBzdGFydE9mRGF5IDw9IHJlc3RyaWN0aW9uLmVuZCkpIHtcblx0XHRcdFx0XHRcdFx0Y29udGludWVcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y29uc3Qga2V5ID0gaWRUb0tleShldmVudC5faWQpXG5cblx0XHRcdFx0XHRcdGlmICghZm9sbG93Q29tbW9uUmVzdHJpY3Rpb25zKGtleSwgZXZlbnQpKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGZvciAoY29uc3QgdG9rZW4gb2YgdG9rZW5zKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChldmVudC5zdW1tYXJ5LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXModG9rZW4pKSB7XG5cdFx0XHRcdFx0XHRcdFx0YWxyZWFkeUFkZGVkLmFkZChrZXkpXG5cdFx0XHRcdFx0XHRcdFx0Y2FsZW5kYXJSZXN1bHQucmVzdWx0cy5wdXNoKGV2ZW50Ll9pZClcblx0XHRcdFx0XHRcdFx0XHRjb250aW51ZSBldmVudExvb3Bcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBjaGVja2luZyB0aGUgc3VtbWFyeSB3YXMgY2hlYXAsIG5vdyB3ZSBzdG9yZSB0aGUgc2FuaXRpemVkIGRlc2NyaXB0aW9uIHRvIGNoZWNrIGl0IGFnYWluc3Rcblx0XHRcdFx0XHRcdC8vIGFsbCB0b2tlbnMuXG5cdFx0XHRcdFx0XHRjb25zdCBkZXNjcmlwdGlvblRvU2VhcmNoID0gZXZlbnQuZGVzY3JpcHRpb24ucmVwbGFjZUFsbCgvKDxbXj5dKz4pL2dpLCBcIiBcIikudG9Mb3dlckNhc2UoKVxuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGRlc2NyaXB0aW9uVG9TZWFyY2guaW5jbHVkZXModG9rZW4pKSB7XG5cdFx0XHRcdFx0XHRcdFx0YWxyZWFkeUFkZGVkLmFkZChrZXkpXG5cdFx0XHRcdFx0XHRcdFx0Y2FsZW5kYXJSZXN1bHQucmVzdWx0cy5wdXNoKGV2ZW50Ll9pZClcblx0XHRcdFx0XHRcdFx0XHRjb250aW51ZSBldmVudExvb3Bcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAodGhpcy5jYW5jZWxTaWduYWwoKSkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnJlc3VsdChjYWxlbmRhclJlc3VsdClcblx0XHRcdFx0XHRcdFx0dGhpcy5sYXN0U2VhcmNoUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZShjYWxlbmRhclJlc3VsdClcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMubGFzdFNlYXJjaFByb21pc2Vcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBzdGFydERhdGUgPSBuZXcgRGF0ZShyZXN0cmljdGlvbi5zdGFydClcblx0XHRcdFx0Y29uc3QgZW5kRGF0ZSA9IG5ldyBEYXRlKHJlc3RyaWN0aW9uLmVuZClcblxuXHRcdFx0XHRpZiAoaGFzTmV3UGFpZFBsYW4pIHtcblx0XHRcdFx0XHRjb25zdCBiaXJ0aGRheUV2ZW50cyA9IEFycmF5LmZyb20oY2FsZW5kYXJNb2RlbC5nZXRCaXJ0aGRheUV2ZW50cygpLnZhbHVlcygpKS5mbGF0KClcblxuXHRcdFx0XHRcdGV2ZW50TG9vcDogZm9yIChjb25zdCBldmVudFJlZ2lzdHJ5IG9mIGJpcnRoZGF5RXZlbnRzKSB7XG5cdFx0XHRcdFx0XHQvLyBCaXJ0aGRheXMgc2hvdWxkIHN0aWxsIGFwcGVhciBvbiBzZWFyY2ggZXZlbiBpZiB0aGUgZGF0ZSBpdHNlbGYgZG9lc24ndCBjb21wbHkgdG8gdGhlIHdob2xlIHJlc3RyaWN0aW9uXG5cdFx0XHRcdFx0XHQvLyB3ZSBvbmx5IGNhcmUgYWJvdXQgbW9udGhzXG5cdFx0XHRcdFx0XHRjb25zdCBtb250aCA9IGV2ZW50UmVnaXN0cnkuZXZlbnQuc3RhcnRUaW1lLmdldE1vbnRoKClcblx0XHRcdFx0XHRcdGlmICghKG1vbnRoID49IHN0YXJ0RGF0ZS5nZXRNb250aCgpICYmIG1vbnRoIDw9IGVuZERhdGUuZ2V0TW9udGgoKSkpIHtcblx0XHRcdFx0XHRcdFx0Y29udGludWVcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y29uc3Qga2V5ID0gaWRUb0tleShldmVudFJlZ2lzdHJ5LmV2ZW50Ll9pZClcblxuXHRcdFx0XHRcdFx0aWYgKCFmb2xsb3dDb21tb25SZXN0cmljdGlvbnMoa2V5LCBldmVudFJlZ2lzdHJ5LmV2ZW50KSkge1xuXHRcdFx0XHRcdFx0XHRjb250aW51ZVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucykge1xuXHRcdFx0XHRcdFx0XHRpZiAoZXZlbnRSZWdpc3RyeS5ldmVudC5zdW1tYXJ5LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXModG9rZW4pKSB7XG5cdFx0XHRcdFx0XHRcdFx0YWxyZWFkeUFkZGVkLmFkZChrZXkpXG5cdFx0XHRcdFx0XHRcdFx0Y2FsZW5kYXJSZXN1bHQucmVzdWx0cy5wdXNoKGV2ZW50UmVnaXN0cnkuZXZlbnQuX2lkKVxuXHRcdFx0XHRcdFx0XHRcdGNvbnRpbnVlIGV2ZW50TG9vcFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICh0aGlzLmNhbmNlbFNpZ25hbCgpKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMucmVzdWx0KGNhbGVuZGFyUmVzdWx0KVxuXHRcdFx0XHRcdFx0XHR0aGlzLmxhc3RTZWFyY2hQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKGNhbGVuZGFyUmVzdWx0KVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5sYXN0U2VhcmNoUHJvbWlzZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnJlc3VsdChjYWxlbmRhclJlc3VsdClcblx0XHRcdHRoaXMubGFzdFNlYXJjaFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoY2FsZW5kYXJSZXN1bHQpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMubGFzdFNlYXJjaFByb21pc2UgPSB0aGlzLl9zZWFyY2hGYWNhZGVcblx0XHRcdFx0LnNlYXJjaChxdWVyeSwgcmVzdHJpY3Rpb24sIG1pblN1Z2dlc3Rpb25Db3VudCwgbWF4UmVzdWx0cyA/PyB1bmRlZmluZWQpXG5cdFx0XHRcdC50aGVuKChyZXN1bHQpID0+IHtcblx0XHRcdFx0XHR0aGlzLnJlc3VsdChyZXN1bHQpXG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdFxuXHRcdFx0XHR9KVxuXHRcdFx0XHQuY2F0Y2goXG5cdFx0XHRcdFx0b2ZDbGFzcyhEYkVycm9yLCAoZSkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXCJEQkVycm9yIHdoaWxlIHNlYXJjaFwiLCBlKVxuXHRcdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMubGFzdFNlYXJjaFByb21pc2Vcblx0fVxuXG5cdGlzTmV3U2VhcmNoKHF1ZXJ5OiBzdHJpbmcsIHJlc3RyaWN0aW9uOiBTZWFyY2hSZXN0cmljdGlvbik6IGJvb2xlYW4ge1xuXHRcdGxldCBpc05ldyA9IGZhbHNlXG5cdFx0bGV0IGxhc3RRdWVyeSA9IHRoaXMubGFzdFF1ZXJ5XG5cdFx0aWYgKGxhc3RRdWVyeSA9PSBudWxsKSB7XG5cdFx0XHRpc05ldyA9IHRydWVcblx0XHR9IGVsc2UgaWYgKGxhc3RRdWVyeS5xdWVyeSAhPT0gcXVlcnkpIHtcblx0XHRcdGlzTmV3ID0gdHJ1ZVxuXHRcdH0gZWxzZSBpZiAobGFzdFF1ZXJ5LnJlc3RyaWN0aW9uICE9PSByZXN0cmljdGlvbikge1xuXHRcdFx0Ly8gYm90aCBhcmUgdGhlIHNhbWUgaW5zdGFuY2Vcblx0XHRcdGlzTmV3ID0gIWlzU2FtZVNlYXJjaFJlc3RyaWN0aW9uKHJlc3RyaWN0aW9uLCBsYXN0UXVlcnkucmVzdHJpY3Rpb24pXG5cdFx0fVxuXG5cdFx0aWYgKGlzTmV3KSB0aGlzLnNlbmRDYW5jZWxTaWduYWwoKVxuXHRcdHJldHVybiBpc05ld1xuXHR9XG5cblx0c2VuZENhbmNlbFNpZ25hbCgpIHtcblx0XHR0aGlzLmNhbmNlbFNpZ25hbCh0cnVlKVxuXHRcdHRoaXMuY2FuY2VsU2lnbmFsLmVuZCh0cnVlKVxuXHRcdHRoaXMuY2FuY2VsU2lnbmFsID0gc3RyZWFtKGZhbHNlKVxuXHR9XG59XG5cbmZ1bmN0aW9uIGlkVG9LZXkoaWQ6IElkVHVwbGUpOiBzdHJpbmcge1xuXHRyZXR1cm4gaWQuam9pbihcIi9cIilcbn1cblxuZnVuY3Rpb24gc2VhcmNoUXVlcnlFcXVhbHMoYTogU2VhcmNoUXVlcnksIGI6IFNlYXJjaFF1ZXJ5KSB7XG5cdHJldHVybiAoXG5cdFx0YS5xdWVyeSA9PT0gYi5xdWVyeSAmJlxuXHRcdGlzU2FtZVNlYXJjaFJlc3RyaWN0aW9uKGEucmVzdHJpY3Rpb24sIGIucmVzdHJpY3Rpb24pICYmXG5cdFx0YS5taW5TdWdnZXN0aW9uQ291bnQgPT09IGIubWluU3VnZ2VzdGlvbkNvdW50ICYmXG5cdFx0YS5tYXhSZXN1bHRzID09PSBiLm1heFJlc3VsdHNcblx0KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTYW1lU2VhcmNoUmVzdHJpY3Rpb24oYTogU2VhcmNoUmVzdHJpY3Rpb24sIGI6IFNlYXJjaFJlc3RyaWN0aW9uKTogYm9vbGVhbiB7XG5cdGNvbnN0IGlzU2FtZUF0dHJpYnV0ZUlkcyA9IGEuYXR0cmlidXRlSWRzID09PSBiLmF0dHJpYnV0ZUlkcyB8fCAoISFhLmF0dHJpYnV0ZUlkcyAmJiAhIWIuYXR0cmlidXRlSWRzICYmIGFycmF5RXF1YWxzKGEuYXR0cmlidXRlSWRzLCBiLmF0dHJpYnV0ZUlkcykpXG5cdHJldHVybiAoXG5cdFx0aXNTYW1lVHlwZVJlZihhLnR5cGUsIGIudHlwZSkgJiZcblx0XHRhLnN0YXJ0ID09PSBiLnN0YXJ0ICYmXG5cdFx0YS5lbmQgPT09IGIuZW5kICYmXG5cdFx0YS5maWVsZCA9PT0gYi5maWVsZCAmJlxuXHRcdGlzU2FtZUF0dHJpYnV0ZUlkcyAmJlxuXHRcdChhLmV2ZW50U2VyaWVzID09PSBiLmV2ZW50U2VyaWVzIHx8IChhLmV2ZW50U2VyaWVzID09PSBudWxsICYmIGIuZXZlbnRTZXJpZXMgPT09IHRydWUpIHx8IChhLmV2ZW50U2VyaWVzID09PSB0cnVlICYmIGIuZXZlbnRTZXJpZXMgPT09IG51bGwpKSAmJlxuXHRcdGFycmF5RXF1YWxzKGEuZm9sZGVySWRzLCBiLmZvbGRlcklkcylcblx0KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJlUmVzdWx0c0ZvclRoZVNhbWVRdWVyeShhOiBTZWFyY2hSZXN1bHQsIGI6IFNlYXJjaFJlc3VsdCkge1xuXHRyZXR1cm4gYS5xdWVyeSA9PT0gYi5xdWVyeSAmJiBpc1NhbWVTZWFyY2hSZXN0cmljdGlvbihhLnJlc3RyaWN0aW9uLCBiLnJlc3RyaWN0aW9uKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzTW9yZVJlc3VsdHMoc2VhcmNoUmVzdWx0OiBTZWFyY2hSZXN1bHQpOiBib29sZWFuIHtcblx0cmV0dXJuIChcblx0XHRzZWFyY2hSZXN1bHQubW9yZVJlc3VsdHMubGVuZ3RoID4gMCB8fFxuXHRcdChzZWFyY2hSZXN1bHQubGFzdFJlYWRTZWFyY2hJbmRleFJvdy5sZW5ndGggPiAwICYmIHNlYXJjaFJlc3VsdC5sYXN0UmVhZFNlYXJjaEluZGV4Um93LmV2ZXJ5KChbd29yZCwgaWRdKSA9PiBpZCAhPT0gMCkpXG5cdClcbn1cbiIsImltcG9ydCB7XG5cdGNyZWF0ZU1haWxBZGRyZXNzUHJvcGVydGllcyxcblx0Y3JlYXRlTWFpbGJveFByb3BlcnRpZXMsXG5cdE1haWxCb3gsXG5cdE1haWxib3hHcm91cFJvb3QsXG5cdE1haWxib3hHcm91cFJvb3RUeXBlUmVmLFxuXHRNYWlsYm94UHJvcGVydGllcyxcblx0TWFpbGJveFByb3BlcnRpZXNUeXBlUmVmLFxuXHRNYWlsQm94VHlwZVJlZixcbn0gZnJvbSBcIi4uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBHcm91cCwgR3JvdXBJbmZvLCBHcm91cEluZm9UeXBlUmVmLCBHcm91cE1lbWJlcnNoaXAsIEdyb3VwVHlwZVJlZiB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7IEV2ZW50Q29udHJvbGxlciB9IGZyb20gXCIuLi9hcGkvbWFpbi9FdmVudENvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgRW50aXR5Q2xpZW50IH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7IExvZ2luQ29udHJvbGxlciB9IGZyb20gXCIuLi9hcGkvbWFpbi9Mb2dpbkNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCwgbGF6eU1lbW9pemVkLCBvZkNsYXNzIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBPcGVyYXRpb25UeXBlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgZ2V0RW5hYmxlZE1haWxBZGRyZXNzZXNXaXRoVXNlciB9IGZyb20gXCIuL1NoYXJlZE1haWxVdGlscy5qc1wiXG5pbXBvcnQgeyBQcmVjb25kaXRpb25GYWlsZWRFcnJvciB9IGZyb20gXCIuLi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvci5qc1wiXG5pbXBvcnQgeyBFbnRpdHlVcGRhdGVEYXRhLCBpc1VwZGF0ZUZvclR5cGVSZWYgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVcGRhdGVVdGlscy5qc1wiXG5pbXBvcnQgbSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvci5qc1wiXG5pbXBvcnQgeyBpc1NhbWVJZCB9IGZyb20gXCIuLi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzLmpzXCJcblxuZXhwb3J0IHR5cGUgTWFpbGJveERldGFpbCA9IHtcblx0bWFpbGJveDogTWFpbEJveFxuXHRtYWlsR3JvdXBJbmZvOiBHcm91cEluZm9cblx0bWFpbEdyb3VwOiBHcm91cFxuXHRtYWlsYm94R3JvdXBSb290OiBNYWlsYm94R3JvdXBSb290XG59XG5cbmV4cG9ydCB0eXBlIE1haWxib3hDb3VudGVycyA9IFJlY29yZDxJZCwgUmVjb3JkPHN0cmluZywgbnVtYmVyPj5cblxuZXhwb3J0IGNsYXNzIE1haWxib3hNb2RlbCB7XG5cdC8qKiBFbXB0eSBzdHJlYW0gdW50aWwgaW5pdCgpIGlzIGZpbmlzaGVkLCBleHBvc2VkIG1vc3RseSBmb3IgbWFwKCktaW5nLCB1c2UgZ2V0TWFpbGJveERldGFpbHMgdG8gZ2V0IGEgcHJvbWlzZSAqL1xuXHRyZWFkb25seSBtYWlsYm94RGV0YWlsczogU3RyZWFtPE1haWxib3hEZXRhaWxbXT4gPSBzdHJlYW0oKVxuXHRwcml2YXRlIGluaXRpYWxpemF0aW9uOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGxcblx0LyoqXG5cdCAqIE1hcCBmcm9tIE1haWxib3hHcm91cFJvb3QgaWQgdG8gTWFpbGJveFByb3BlcnRpZXNcblx0ICogQSB3YXkgdG8gYXZvaWQgcmFjZSBjb25kaXRpb25zIGluIGNhc2Ugd2UgdHJ5IHRvIGNyZWF0ZSBtYWlsYm94IHByb3BlcnRpZXMgZnJvbSBtdWx0aXBsZSBwbGFjZXMuXG5cdCAqXG5cdCAqL1xuXHRwcml2YXRlIG1haWxib3hQcm9wZXJ0aWVzUHJvbWlzZXM6IE1hcDxJZCwgUHJvbWlzZTxNYWlsYm94UHJvcGVydGllcz4+ID0gbmV3IE1hcCgpXG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBldmVudENvbnRyb2xsZXI6IEV2ZW50Q29udHJvbGxlciwgcHJpdmF0ZSByZWFkb25seSBlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCwgcHJpdmF0ZSByZWFkb25seSBsb2dpbnM6IExvZ2luQ29udHJvbGxlcikge31cblxuXHQvLyBvbmx5IGluaXQgbGlzdGVuZXJzIG9uY2Vcblx0cHJpdmF0ZSByZWFkb25seSBpbml0TGlzdGVuZXJzID0gbGF6eU1lbW9pemVkKCgpID0+IHtcblx0XHR0aGlzLmV2ZW50Q29udHJvbGxlci5hZGRFbnRpdHlMaXN0ZW5lcigodXBkYXRlcywgZXZlbnRPd25lckdyb3VwSWQpID0+IHRoaXMuZW50aXR5RXZlbnRzUmVjZWl2ZWQodXBkYXRlcywgZXZlbnRPd25lckdyb3VwSWQpKVxuXHR9KVxuXG5cdGluaXQoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gaWYgd2UgYXJlIGluIHRoZSBwcm9jZXNzIG9mIGxvYWRpbmcgZG8gbm90IHN0YXJ0IGFub3RoZXIgb25lIGluIHBhcmFsbGVsXG5cdFx0aWYgKHRoaXMuaW5pdGlhbGl6YXRpb24pIHtcblx0XHRcdHJldHVybiB0aGlzLmluaXRpYWxpemF0aW9uXG5cdFx0fVxuXHRcdHRoaXMuaW5pdExpc3RlbmVycygpXG5cblx0XHRyZXR1cm4gdGhpcy5faW5pdCgpXG5cdH1cblxuXHRwcml2YXRlIF9pbml0KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG1haWxHcm91cE1lbWJlcnNoaXBzID0gdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5nZXRNYWlsR3JvdXBNZW1iZXJzaGlwcygpXG5cdFx0Y29uc3QgbWFpbEJveERldGFpbHNQcm9taXNlcyA9IG1haWxHcm91cE1lbWJlcnNoaXBzLm1hcCgobSkgPT4gdGhpcy5tYWlsYm94RGV0YWlsc0Zyb21NZW1iZXJzaGlwKG0pKVxuXHRcdHRoaXMuaW5pdGlhbGl6YXRpb24gPSBQcm9taXNlLmFsbChtYWlsQm94RGV0YWlsc1Byb21pc2VzKS50aGVuKChkZXRhaWxzKSA9PiB7XG5cdFx0XHR0aGlzLm1haWxib3hEZXRhaWxzKGRldGFpbHMpXG5cdFx0fSlcblx0XHRyZXR1cm4gdGhpcy5pbml0aWFsaXphdGlvbi5jYXRjaCgoZSkgPT4ge1xuXHRcdFx0Y29uc29sZS53YXJuKFwibWFpbGJveCBtb2RlbCBpbml0aWFsaXphdGlvbiBmYWlsZWQhXCIsIGUpXG5cdFx0XHR0aGlzLmluaXRpYWxpemF0aW9uID0gbnVsbFxuXHRcdFx0dGhyb3cgZVxuXHRcdH0pXG5cdH1cblxuXHQvKipcblx0ICogbG9hZCBtYWlsYm94IGRldGFpbHMgZnJvbSBhIG1haWxncm91cCBtZW1iZXJzaGlwXG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIG1haWxib3hEZXRhaWxzRnJvbU1lbWJlcnNoaXAobWVtYmVyc2hpcDogR3JvdXBNZW1iZXJzaGlwKTogUHJvbWlzZTxNYWlsYm94RGV0YWlsPiB7XG5cdFx0Y29uc3QgW21haWxib3hHcm91cFJvb3QsIG1haWxHcm91cEluZm8sIG1haWxHcm91cF0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG5cdFx0XHR0aGlzLmVudGl0eUNsaWVudC5sb2FkKE1haWxib3hHcm91cFJvb3RUeXBlUmVmLCBtZW1iZXJzaGlwLmdyb3VwKSxcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoR3JvdXBJbmZvVHlwZVJlZiwgbWVtYmVyc2hpcC5ncm91cEluZm8pLFxuXHRcdFx0dGhpcy5lbnRpdHlDbGllbnQubG9hZChHcm91cFR5cGVSZWYsIG1lbWJlcnNoaXAuZ3JvdXApLFxuXHRcdF0pXG5cdFx0Y29uc3QgbWFpbGJveCA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoTWFpbEJveFR5cGVSZWYsIG1haWxib3hHcm91cFJvb3QubWFpbGJveClcblx0XHRyZXR1cm4ge1xuXHRcdFx0bWFpbGJveCxcblx0XHRcdG1haWxHcm91cEluZm8sXG5cdFx0XHRtYWlsR3JvdXAsXG5cdFx0XHRtYWlsYm94R3JvdXBSb290LFxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgdGhlIGxpc3Qgb2YgTWFpbGJveERldGFpbHMgdGhhdCB0aGlzIHVzZXIgaGFzIGFjY2VzcyB0byBmcm9tIHRoZWlyIG1lbWJlcnNoaXBzLlxuXHQgKlxuXHQgKiBXaWxsIHdhaXQgZm9yIHN1Y2Nlc3NmdWwgaW5pdGlhbGl6YXRpb24uXG5cdCAqL1xuXHRhc3luYyBnZXRNYWlsYm94RGV0YWlscygpOiBQcm9taXNlPEFycmF5PE1haWxib3hEZXRhaWw+PiB7XG5cdFx0Ly8gSWYgZGV0YWlscyBhcmUgdGhlcmUsIHVzZSB0aGVtXG5cdFx0aWYgKHRoaXMubWFpbGJveERldGFpbHMoKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMubWFpbGJveERldGFpbHMoKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBJZiB0aGV5IGFyZSBub3QgdGhlcmUsIHRyaWdnZXIgbG9hZGluZyBhZ2FpbiAoanVzdCBpbiBjYXNlKSBidXQgZG8gbm90IGZhaWwgYW5kIHdhaXQgdW50aWwgd2UgYWN0dWFsbHkgaGF2ZSB0aGUgZGV0YWlscy5cblx0XHRcdC8vIFRoaXMgaXMgc28gdGhhdCB0aGUgcmVzdCBvZiB0aGUgYXBwIGlzIG5vdCBpbiB0aGUgYnJva2VuIHN0YXRlIGlmIGRldGFpbHMgZmFpbCB0byBsb2FkIGJ1dCBpcyBqdXN0IHdhaXRpbmcgdW50aWwgdGhlIHN1Y2Nlc3MuXG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdFx0dGhpcy5pbml0KClcblx0XHRcdFx0Y29uc3QgZW5kID0gdGhpcy5tYWlsYm94RGV0YWlscy5tYXAoKGRldGFpbHMpID0+IHtcblx0XHRcdFx0XHRyZXNvbHZlKGRldGFpbHMpXG5cdFx0XHRcdFx0ZW5kLmVuZCh0cnVlKVxuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cblxuXHRhc3luYyBnZXRNYWlsYm94RGV0YWlsQnlNYWlsYm94SWQobWFpbGJveElkOiBJZCk6IFByb21pc2U8TWFpbGJveERldGFpbCB8IG51bGw+IHtcblx0XHRjb25zdCBhbGxEZXRhaWxzID0gYXdhaXQgdGhpcy5nZXRNYWlsYm94RGV0YWlscygpXG5cdFx0cmV0dXJuIGFsbERldGFpbHMuZmluZCgoZGV0YWlsKSA9PiBpc1NhbWVJZChkZXRhaWwubWFpbGJveC5faWQsIG1haWxib3hJZCkpID8/IG51bGxcblx0fVxuXG5cdGFzeW5jIGdldE1haWxib3hEZXRhaWxzRm9yTWFpbEdyb3VwKG1haWxHcm91cElkOiBJZCk6IFByb21pc2U8TWFpbGJveERldGFpbD4ge1xuXHRcdGNvbnN0IG1haWxib3hEZXRhaWxzID0gYXdhaXQgdGhpcy5nZXRNYWlsYm94RGV0YWlscygpXG5cdFx0cmV0dXJuIGFzc2VydE5vdE51bGwoXG5cdFx0XHRtYWlsYm94RGV0YWlscy5maW5kKChtZCkgPT4gbWFpbEdyb3VwSWQgPT09IG1kLm1haWxHcm91cC5faWQpLFxuXHRcdFx0XCJNYWlsYm94IGRldGFpbCBmb3IgbWFpbCBncm91cCBkb2VzIG5vdCBleGlzdFwiLFxuXHRcdClcblx0fVxuXG5cdGFzeW5jIGdldFVzZXJNYWlsYm94RGV0YWlscygpOiBQcm9taXNlPE1haWxib3hEZXRhaWw+IHtcblx0XHRjb25zdCB1c2VyTWFpbEdyb3VwTWVtYmVyc2hpcCA9IHRoaXMubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuZ2V0VXNlck1haWxHcm91cE1lbWJlcnNoaXAoKVxuXHRcdGNvbnN0IG1haWxib3hEZXRhaWxzID0gYXdhaXQgdGhpcy5nZXRNYWlsYm94RGV0YWlscygpXG5cdFx0cmV0dXJuIGFzc2VydE5vdE51bGwoXG5cdFx0XHRtYWlsYm94RGV0YWlscy5maW5kKChtZCkgPT4gbWQubWFpbEdyb3VwLl9pZCA9PT0gdXNlck1haWxHcm91cE1lbWJlcnNoaXAuZ3JvdXApLFxuXHRcdFx0XCJNYWlsYm94IGRldGFpbCBmb3IgdXNlciBkb2VzIG5vdCBleGlzdFwiLFxuXHRcdClcblx0fVxuXG5cdGFzeW5jIGVudGl0eUV2ZW50c1JlY2VpdmVkKHVwZGF0ZXM6IFJlYWRvbmx5QXJyYXk8RW50aXR5VXBkYXRlRGF0YT4sIGV2ZW50T3duZXJHcm91cElkOiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGZvciAoY29uc3QgdXBkYXRlIG9mIHVwZGF0ZXMpIHtcblx0XHRcdGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoR3JvdXBJbmZvVHlwZVJlZiwgdXBkYXRlKSkge1xuXHRcdFx0XHRpZiAodXBkYXRlLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5VUERBVEUpIHtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLl9pbml0KClcblx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAodGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc1VwZGF0ZUZvckxvZ2dlZEluVXNlckluc3RhbmNlKHVwZGF0ZSwgZXZlbnRPd25lckdyb3VwSWQpKSB7XG5cdFx0XHRcdGxldCBuZXdNZW1iZXJzaGlwcyA9IHRoaXMubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuZ2V0TWFpbEdyb3VwTWVtYmVyc2hpcHMoKVxuXHRcdFx0XHRjb25zdCBtYWlsYm94RGV0YWlscyA9IGF3YWl0IHRoaXMuZ2V0TWFpbGJveERldGFpbHMoKVxuXG5cdFx0XHRcdGlmIChuZXdNZW1iZXJzaGlwcy5sZW5ndGggIT09IG1haWxib3hEZXRhaWxzLmxlbmd0aCkge1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMuX2luaXQoKVxuXHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGdldE1haWxib3hQcm9wZXJ0aWVzKG1haWxib3hHcm91cFJvb3Q6IE1haWxib3hHcm91cFJvb3QpOiBQcm9taXNlPE1haWxib3hQcm9wZXJ0aWVzPiB7XG5cdFx0Ly8gTWFpbGJveFByb3BlcnRpZXMgaXMgYW4gZW5jcnlwdGVkIGluc3RhbmNlIHRoYXQgaXMgY3JlYXRlZCBsYXppbHkuIFdoZW4gd2UgY3JlYXRlIGl0IHRoZSByZWZlcmVuY2UgaXMgYXV0b21hdGljYWxseSB3cml0dGVuIHRvIHRoZSBNYWlsYm94R3JvdXBSb290LlxuXHRcdC8vIFVuZm9ydHVuYXRlbHkgd2Ugd2lsbCBvbmx5IGdldCB1cGRhdGVkIG5ldyBNYWlsYm94R3JvdXBSb290IHdpdGggdGhlIG5leHQgRW50aXR5VXBkYXRlLlxuXHRcdC8vIFRvIHByZXZlbnQgcGFyYWxsZWwgY3JlYXRpb24gYXR0ZW1wdHMgd2UgZG8gdHdvIHRoaW5nczpcblx0XHQvLyAgLSB3ZSBzYXZlIHRoZSBsb2FkaW5nIHByb21pc2UgdG8gYXZvaWQgY2FsbGluZyBzZXR1cCgpIHR3aWNlIGluIHBhcmFsbGVsXG5cdFx0Ly8gIC0gd2Ugc2V0IG1haWxib3hQcm9wZXJ0aWVzIHJlZmVyZW5jZSBtYW51YWxseSAod2UgY291bGQgc2F2ZSB0aGUgaWQgZWxzZXdoZXJlIGJ1dCBpdCdzIGVhc2llciB0aGlzIHdheSlcblxuXHRcdC8vIElmIHdlIGFyZSBhbHJlYWR5IGxvYWRpbmcvY3JlYXRpbmcsIGp1c3QgcmV0dXJuIGl0IHRvIGF2b2lkIHJhY2VzXG5cdFx0Y29uc3QgZXhpc3RpbmdQcm9taXNlID0gdGhpcy5tYWlsYm94UHJvcGVydGllc1Byb21pc2VzLmdldChtYWlsYm94R3JvdXBSb290Ll9pZClcblx0XHRpZiAoZXhpc3RpbmdQcm9taXNlKSB7XG5cdFx0XHRyZXR1cm4gZXhpc3RpbmdQcm9taXNlXG5cdFx0fVxuXG5cdFx0Y29uc3QgcHJvbWlzZTogUHJvbWlzZTxNYWlsYm94UHJvcGVydGllcz4gPSB0aGlzLmxvYWRPckNyZWF0ZU1haWxib3hQcm9wZXJ0aWVzKG1haWxib3hHcm91cFJvb3QpXG5cdFx0dGhpcy5tYWlsYm94UHJvcGVydGllc1Byb21pc2VzLnNldChtYWlsYm94R3JvdXBSb290Ll9pZCwgcHJvbWlzZSlcblx0XHRyZXR1cm4gcHJvbWlzZS5maW5hbGx5KCgpID0+IHRoaXMubWFpbGJveFByb3BlcnRpZXNQcm9taXNlcy5kZWxldGUobWFpbGJveEdyb3VwUm9vdC5faWQpKVxuXHR9XG5cblx0YXN5bmMgbG9hZE9yQ3JlYXRlTWFpbGJveFByb3BlcnRpZXMobWFpbGJveEdyb3VwUm9vdDogTWFpbGJveEdyb3VwUm9vdCk6IFByb21pc2U8TWFpbGJveFByb3BlcnRpZXM+IHtcblx0XHRpZiAoIW1haWxib3hHcm91cFJvb3QubWFpbGJveFByb3BlcnRpZXMpIHtcblx0XHRcdG1haWxib3hHcm91cFJvb3QubWFpbGJveFByb3BlcnRpZXMgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudFxuXHRcdFx0XHQuc2V0dXAoXG5cdFx0XHRcdFx0bnVsbCxcblx0XHRcdFx0XHRjcmVhdGVNYWlsYm94UHJvcGVydGllcyh7XG5cdFx0XHRcdFx0XHRfb3duZXJHcm91cDogbWFpbGJveEdyb3VwUm9vdC5fb3duZXJHcm91cCA/PyBcIlwiLFxuXHRcdFx0XHRcdFx0cmVwb3J0TW92ZWRNYWlsczogXCIwXCIsXG5cdFx0XHRcdFx0XHRtYWlsQWRkcmVzc1Byb3BlcnRpZXM6IFtdLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHQpXG5cdFx0XHRcdC5jYXRjaChcblx0XHRcdFx0XHRvZkNsYXNzKFByZWNvbmRpdGlvbkZhaWxlZEVycm9yLCAoZSkgPT4ge1xuXHRcdFx0XHRcdFx0Ly8gV2UgdHJ5IHRvIHByZXZlbnQgcmFjZSBjb25kaXRpb25zIGJ1dCB0aGV5IGNhbiBzdGlsbCBoYXBwZW4gd2l0aCBtdWx0aXBsZSBjbGllbnRzIHRyeWluZyBvdCBjcmVhdGUgbWFpbGJveFByb3BlcnRpZXMgYXQgdGhlIHNhbWUgdGltZS5cblx0XHRcdFx0XHRcdC8vIFdlIHNlbmQgc3BlY2lhbCBwcmVjb25kaXRpb24gZnJvbSB0aGUgc2VydmVyIHdpdGggYW4gZXhpc3RpbmcgaWQuXG5cdFx0XHRcdFx0XHRpZiAoZS5kYXRhICYmIGUuZGF0YS5zdGFydHNXaXRoKFwiZXhpc3RzOlwiKSkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBleGlzdGluZ0lkID0gZS5kYXRhLnN1YnN0cmluZyhcImV4aXN0czpcIi5sZW5ndGgpXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwibWFpbGJveFByb3BlcnRpZXMgYWxyZWFkeSBleGlzdHNcIiwgZXhpc3RpbmdJZClcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGV4aXN0aW5nSWRcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKGBDb3VsZCBub3QgY3JlYXRlIG1haWxib3hQcm9wZXJ0aWVzLCBwcmVjb25kaXRpb246ICR7ZS5kYXRhfWApXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdClcblx0XHR9XG5cdFx0Y29uc3QgbWFpbGJveFByb3BlcnRpZXMgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKE1haWxib3hQcm9wZXJ0aWVzVHlwZVJlZiwgbWFpbGJveEdyb3VwUm9vdC5tYWlsYm94UHJvcGVydGllcylcblx0XHRpZiAobWFpbGJveFByb3BlcnRpZXMubWFpbEFkZHJlc3NQcm9wZXJ0aWVzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0YXdhaXQgdGhpcy5taWdyYXRlRnJvbU9sZFNlbmRlck5hbWUobWFpbGJveEdyb3VwUm9vdCwgbWFpbGJveFByb3BlcnRpZXMpXG5cdFx0fVxuXHRcdHJldHVybiBtYWlsYm94UHJvcGVydGllc1xuXHR9XG5cblx0LyoqIElmIHRoZXJlIHdhcyBubyBzZW5kZXIgbmFtZSBjb25maWd1cmVkIGJlZm9yZSB0YWtlIHRoZSB1c2VyJ3MgbmFtZSBhbmQgYXNzaWduIGl0IHRvIGFsbCBlbWFpbCBhZGRyZXNzZXMuICovXG5cdHByaXZhdGUgYXN5bmMgbWlncmF0ZUZyb21PbGRTZW5kZXJOYW1lKG1haWxib3hHcm91cFJvb3Q6IE1haWxib3hHcm91cFJvb3QsIG1haWxib3hQcm9wZXJ0aWVzOiBNYWlsYm94UHJvcGVydGllcykge1xuXHRcdGNvbnN0IHVzZXJHcm91cEluZm8gPSB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJHcm91cEluZm9cblx0XHRjb25zdCBsZWdhY3lTZW5kZXJOYW1lID0gdXNlckdyb3VwSW5mby5uYW1lXG5cdFx0Y29uc3QgbWFpbGJveERldGFpbHMgPSBhd2FpdCB0aGlzLmdldE1haWxib3hEZXRhaWxzRm9yTWFpbEdyb3VwKG1haWxib3hHcm91cFJvb3QuX2lkKVxuXHRcdGNvbnN0IG1haWxBZGRyZXNzZXMgPSBnZXRFbmFibGVkTWFpbEFkZHJlc3Nlc1dpdGhVc2VyKG1haWxib3hEZXRhaWxzLCB1c2VyR3JvdXBJbmZvKVxuXHRcdGZvciAoY29uc3QgbWFpbEFkZHJlc3Mgb2YgbWFpbEFkZHJlc3Nlcykge1xuXHRcdFx0bWFpbGJveFByb3BlcnRpZXMubWFpbEFkZHJlc3NQcm9wZXJ0aWVzLnB1c2goXG5cdFx0XHRcdGNyZWF0ZU1haWxBZGRyZXNzUHJvcGVydGllcyh7XG5cdFx0XHRcdFx0bWFpbEFkZHJlc3MsXG5cdFx0XHRcdFx0c2VuZGVyTmFtZTogbGVnYWN5U2VuZGVyTmFtZSxcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0fVxuXHRcdGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LnVwZGF0ZShtYWlsYm94UHJvcGVydGllcylcblx0fVxufVxuIiwiaW1wb3J0IHR5cGUgeyBEaWFsb2cgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgdHlwZSB7IFNlbmRNYWlsTW9kZWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L1NlbmRNYWlsTW9kZWwuanNcIlxuaW1wb3J0IHsgbGFzdFRocm93LCByZW1vdmUgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB0eXBlIHsgTWFpbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGlzU2FtZUlkIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcblxuZXhwb3J0IGNvbnN0IGVudW0gU2F2ZVN0YXR1c0VudW0ge1xuXHRTYXZpbmcgPSAwLFxuXHRTYXZlZCA9IDEsXG5cdE5vdFNhdmVkID0gMixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gU2F2ZUVycm9yUmVhc29uIHtcblx0VW5rbm93bixcblx0Q29ubmVjdGlvbkxvc3QsXG59XG5cbmV4cG9ydCB0eXBlIFNhdmVTdGF0dXMgPVxuXHR8IHtcblx0XHRcdHN0YXR1czogU2F2ZVN0YXR1c0VudW0uU2F2aW5nXG5cdCAgfVxuXHR8IHtcblx0XHRcdHN0YXR1czogU2F2ZVN0YXR1c0VudW0uU2F2ZWRcblx0ICB9XG5cdHwge1xuXHRcdFx0c3RhdHVzOiBTYXZlU3RhdHVzRW51bS5Ob3RTYXZlZFxuXHRcdFx0cmVhc29uOiBTYXZlRXJyb3JSZWFzb25cblx0ICB9XG5cbmV4cG9ydCB0eXBlIE1pbmltaXplZEVkaXRvciA9IHtcblx0ZGlhbG9nOiBEaWFsb2dcblx0c2VuZE1haWxNb2RlbDogU2VuZE1haWxNb2RlbFxuXHQvLyB3ZSBwYXNzIHNlbmRNYWlsTW9kZWwgZm9yIGVhc2llciBhY2Nlc3MgdG8gY29udGVudHMgb2YgbWFpbCxcblx0ZGlzcG9zZTogKCkgPT4gdm9pZFxuXHQvLyBkaXNwb3NlcyBkaWFsb2cgYW5kIHRlbXBsYXRlUG9wdXAgZXZlbnRMaXN0ZW5lcnMgd2hlbiBtaW5pbWl6ZWQgbWFpbCBpcyByZW1vdmVkXG5cdHNhdmVTdGF0dXM6IFN0cmVhbTxTYXZlU3RhdHVzPlxuXHRjbG9zZU92ZXJsYXlGdW5jdGlvbjogKCkgPT4gdm9pZFxufVxuXG4vKipcbiAqIGhhbmRsZXMgbWluaW1pemVkIEVkaXRvcnNcbiAqL1xuZXhwb3J0IGNsYXNzIE1pbmltaXplZE1haWxFZGl0b3JWaWV3TW9kZWwge1xuXHRfbWluaW1pemVkRWRpdG9yczogQXJyYXk8TWluaW1pemVkRWRpdG9yPlxuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuX21pbmltaXplZEVkaXRvcnMgPSBbXVxuXHR9XG5cblx0bWluaW1pemVNYWlsRWRpdG9yKFxuXHRcdGRpYWxvZzogRGlhbG9nLFxuXHRcdHNlbmRNYWlsTW9kZWw6IFNlbmRNYWlsTW9kZWwsXG5cdFx0ZGlzcG9zZTogKCkgPT4gdm9pZCxcblx0XHRzYXZlU3RhdHVzOiBTdHJlYW08U2F2ZVN0YXR1cz4sXG5cdFx0Y2xvc2VPdmVybGF5RnVuY3Rpb246ICgpID0+IHZvaWQsXG5cdCk6IE1pbmltaXplZEVkaXRvciB7XG5cdFx0ZGlhbG9nLmNsb3NlKClcblxuXHRcdC8vIGRpc2FsbG93IGNyZWF0aW9uIG9mIGR1cGxpY2F0ZSBtaW5pbWl6ZWQgbWFpbHNcblx0XHRpZiAoIXRoaXMuX21pbmltaXplZEVkaXRvcnMuc29tZSgoZWRpdG9yKSA9PiBlZGl0b3IuZGlhbG9nID09PSBkaWFsb2cpKSB7XG5cdFx0XHR0aGlzLl9taW5pbWl6ZWRFZGl0b3JzLnB1c2goe1xuXHRcdFx0XHRzZW5kTWFpbE1vZGVsOiBzZW5kTWFpbE1vZGVsLFxuXHRcdFx0XHRkaWFsb2c6IGRpYWxvZyxcblx0XHRcdFx0ZGlzcG9zZTogZGlzcG9zZSxcblx0XHRcdFx0c2F2ZVN0YXR1cyxcblx0XHRcdFx0Y2xvc2VPdmVybGF5RnVuY3Rpb24sXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdHJldHVybiBsYXN0VGhyb3codGhpcy5fbWluaW1pemVkRWRpdG9ycylcblx0fVxuXG5cdC8vIGZ1bGx5IHJlbW92ZXMgYW5kIHJlb3BlbnMgY2xpY2tlZCBtYWlsXG5cdHJlb3Blbk1pbmltaXplZEVkaXRvcihlZGl0b3I6IE1pbmltaXplZEVkaXRvcik6IHZvaWQge1xuXHRcdGVkaXRvci5jbG9zZU92ZXJsYXlGdW5jdGlvbigpXG5cdFx0ZWRpdG9yLmRpYWxvZy5zaG93KClcblx0XHRyZW1vdmUodGhpcy5fbWluaW1pemVkRWRpdG9ycywgZWRpdG9yKVxuXHR9XG5cblx0Ly8gZnVsbHkgcmVtb3ZlcyBjbGlja2VkIG1haWxcblx0cmVtb3ZlTWluaW1pemVkRWRpdG9yKGVkaXRvcjogTWluaW1pemVkRWRpdG9yKTogdm9pZCB7XG5cdFx0ZWRpdG9yLmNsb3NlT3ZlcmxheUZ1bmN0aW9uKClcblx0XHRlZGl0b3IuZGlzcG9zZSgpXG5cdFx0cmVtb3ZlKHRoaXMuX21pbmltaXplZEVkaXRvcnMsIGVkaXRvcilcblx0fVxuXG5cdGdldE1pbmltaXplZEVkaXRvcnMoKTogQXJyYXk8TWluaW1pemVkRWRpdG9yPiB7XG5cdFx0cmV0dXJuIHRoaXMuX21pbmltaXplZEVkaXRvcnNcblx0fVxuXG5cdGdldEVkaXRvckZvckRyYWZ0KG1haWw6IE1haWwpOiBNaW5pbWl6ZWRFZGl0b3IgfCBudWxsIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0dGhpcy5nZXRNaW5pbWl6ZWRFZGl0b3JzKCkuZmluZCgoZSkgPT4ge1xuXHRcdFx0XHRjb25zdCBkcmFmdCA9IGUuc2VuZE1haWxNb2RlbC5nZXREcmFmdCgpXG5cdFx0XHRcdHJldHVybiBkcmFmdCA/IGlzU2FtZUlkKGRyYWZ0Ll9pZCwgbWFpbC5faWQpIDogbnVsbFxuXHRcdFx0fSkgPz8gbnVsbFxuXHRcdClcblx0fVxufVxuIiwiaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHR5cGUgeyBQcm9ncmVzc01vbml0b3JJZCB9IGZyb20gXCIuLi9jb21tb24vdXRpbHMvUHJvZ3Jlc3NNb25pdG9yXCJcbmltcG9ydCB7IFByb2dyZXNzTW9uaXRvciB9IGZyb20gXCIuLi9jb21tb24vdXRpbHMvUHJvZ3Jlc3NNb25pdG9yXCJcblxuZXhwb3J0IHR5cGUgRXhwb3NlZFByb2dyZXNzVHJhY2tlciA9IFBpY2s8UHJvZ3Jlc3NUcmFja2VyLCBcInJlZ2lzdGVyTW9uaXRvclwiIHwgXCJ3b3JrRG9uZUZvck1vbml0b3JcIj5cblxuLyoqXG4gKiBUaGUgcHJvZ3Jlc3MgdHJhY2tlciBjb250cm9scyB0aGUgcHJvZ3Jlc3MgYmFyIGxvY2F0ZWQgaW4gSGVhZGVyLmpzXG4gKiBZb3UgY2FuIHJlZ2lzdGVyIHByb2dyZXNzIG1vbml0b3JzIHdpdGggaXQgYW5kIHRoZW4gbWFrZSB3b3JrRG9uZSBjYWxscyBvbiB0aGVtXG4gKiBhbmQgdGhlbiB0aGUgdG90YWwgcHJvZ3Jlc3Mgd2lsbCBiZSBzaG93biBhdCB0aGUgdG9wIG9mIHRoZSB3aW5kb3dcbiAqL1xuZXhwb3J0IGNsYXNzIFByb2dyZXNzVHJhY2tlciB7XG5cdC8vIFdpbGwgc3RyZWFtIGEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMVxuXHRvblByb2dyZXNzVXBkYXRlOiBzdHJlYW08bnVtYmVyPlxuXHRwcml2YXRlIHJlYWRvbmx5IG1vbml0b3JzOiBNYXA8UHJvZ3Jlc3NNb25pdG9ySWQsIFByb2dyZXNzTW9uaXRvcj5cblx0cHJpdmF0ZSBpZENvdW50ZXI6IFByb2dyZXNzTW9uaXRvcklkXG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0Ly8gaW5pdGlhbGx5LCB0aGVyZSBpcyBubyB3b3JrLCBzbyB3ZSBhcmUgZG9uZSBieSBkZWZhdWx0LlxuXHRcdHRoaXMub25Qcm9ncmVzc1VwZGF0ZSA9IHN0cmVhbSgxKVxuXHRcdHRoaXMubW9uaXRvcnMgPSBuZXcgTWFwKClcblx0XHR0aGlzLmlkQ291bnRlciA9IDBcblx0fVxuXG5cdC8qKlxuXHQgKiBSZWdpc3RlciBhIG1vbml0b3Igd2l0aCB0aGUgdHJhY2tlciwgc28gdGhhdCBpdCdzIHByb2dyZXNzIGNhbiBiZSBkaXNwbGF5ZWRcblx0ICogUmV0dXJucyBhbiBJRCBhcyBhIGhhbmRsZSwgdXNlZnVsIGZvciBtYWtpbmcgY2FsbHMgZnJvbSB0aGUgd29ya2VyXG5cdCAqXG5cdCAqIE1ha2Ugc3VyZSB0aGF0IG1vbml0b3IgY29tcGxldGVzLCBzbyBpdCBjYW4gYmUgdW5yZWdpc3RlcmVkLlxuXHQgKiBAcGFyYW0gd29yayAtIHRvdGFsIHdvcmsgdG8gZG9cblx0ICovXG5cdHJlZ2lzdGVyTW9uaXRvclN5bmMod29yazogbnVtYmVyKTogUHJvZ3Jlc3NNb25pdG9ySWQge1xuXHRcdGNvbnN0IGlkID0gdGhpcy5pZENvdW50ZXIrK1xuXHRcdGNvbnN0IG1vbml0b3IgPSBuZXcgUHJvZ3Jlc3NNb25pdG9yKHdvcmssIChwZXJjZW50YWdlKSA9PiB0aGlzLm9uUHJvZ3Jlc3MoaWQsIHBlcmNlbnRhZ2UpKVxuXG5cdFx0dGhpcy5tb25pdG9ycy5zZXQoaWQsIG1vbml0b3IpXG5cblx0XHRyZXR1cm4gaWRcblx0fVxuXG5cdC8qKiBhc3luYyB3cmFwcGVyIGZvciByZW1vdGUgKi9cblx0YXN5bmMgcmVnaXN0ZXJNb25pdG9yKHdvcms6IG51bWJlcik6IFByb21pc2U8UHJvZ3Jlc3NNb25pdG9ySWQ+IHtcblx0XHRyZXR1cm4gdGhpcy5yZWdpc3Rlck1vbml0b3JTeW5jKHdvcmspXG5cdH1cblxuXHRhc3luYyB3b3JrRG9uZUZvck1vbml0b3IoaWQ6IFByb2dyZXNzTW9uaXRvcklkLCBhbW91bnQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMuZ2V0TW9uaXRvcihpZCk/LndvcmtEb25lKGFtb3VudClcblx0fVxuXG5cdGdldE1vbml0b3IoaWQ6IFByb2dyZXNzTW9uaXRvcklkKTogUHJvZ3Jlc3NNb25pdG9yIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMubW9uaXRvcnMuZ2V0KGlkKSA/PyBudWxsXG5cdH1cblxuXHRwcml2YXRlIG9uUHJvZ3Jlc3MoaWQ6IFByb2dyZXNzTW9uaXRvcklkLCBwZXJjZW50YWdlOiBudW1iZXIpIHtcblx0XHQvLyBub3RpZnlcblx0XHR0aGlzLm9uUHJvZ3Jlc3NVcGRhdGUodGhpcy5jb21wbGV0ZWRBbW91bnQoKSlcblx0XHQvLyB3ZSBtaWdodCBiZSBkb25lIHdpdGggdGhpcyBvbmVcblx0XHRpZiAocGVyY2VudGFnZSA+PSAxMDApIHRoaXMubW9uaXRvcnMuZGVsZXRlKGlkKVxuXHR9XG5cblx0LyoqXG5cdCAqIFRvdGFsIHdvcmsgdGhhdCB3aWxsIGJlIGRvbmUgZnJvbSBhbGwgbW9uaXRvcnNcblx0ICovXG5cdHRvdGFsV29yaygpOiBudW1iZXIge1xuXHRcdGxldCB0b3RhbCA9IDBcblxuXHRcdGZvciAoY29uc3QgbW9uaXRvciBvZiB0aGlzLm1vbml0b3JzLnZhbHVlcygpKSB7XG5cdFx0XHR0b3RhbCArPSBtb25pdG9yLnRvdGFsV29ya1xuXHRcdH1cblxuXHRcdHJldHVybiB0b3RhbFxuXHR9XG5cblx0LyoqXG5cdCAqIEN1cnJlbnQgYWJzb2x1dGUgYW1vdW50IG9mIGNvbXBsZXRlZCB3b3JrIGZyb20gYWxsIG1vbml0b3JzXG5cdCAqL1xuXHRjb21wbGV0ZWRXb3JrKCk6IG51bWJlciB7XG5cdFx0bGV0IHRvdGFsID0gMFxuXG5cdFx0Zm9yIChjb25zdCBtb25pdG9yIG9mIHRoaXMubW9uaXRvcnMudmFsdWVzKCkpIHtcblx0XHRcdHRvdGFsICs9IG1vbml0b3Iud29ya0NvbXBsZXRlZFxuXHRcdH1cblxuXHRcdHJldHVybiB0b3RhbFxuXHR9XG5cblx0LyoqXG5cdCAqIENvbXBsZXRlZCBwZXJjZW50YWdlIG9mIGNvbXBsZXRlZCB3b3JrIGFzIGEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMVxuXHQgKi9cblx0Y29tcGxldGVkQW1vdW50KCk6IG51bWJlciB7XG5cdFx0Y29uc3QgdG90YWxXb3JrID0gdGhpcy50b3RhbFdvcmsoKVxuXHRcdGNvbnN0IGNvbXBsZXRlZFdvcmsgPSB0aGlzLmNvbXBsZXRlZFdvcmsoKVxuXHRcdC8vIG5vIHdvcmsgdG8gZG8gbWVhbnMgeW91IGhhdmUgZG9uZSBhbGwgdGhlIHdvcmtcblx0XHRyZXR1cm4gdG90YWxXb3JrICE9PSAwID8gTWF0aC5taW4oMSwgY29tcGxldGVkV29yayAvIHRvdGFsV29yaykgOiAxXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHR5cGUgeyBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IEljb24sIEljb25TaXplLCBwcm9ncmVzc0ljb24gfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvSWNvblwiXG5pbXBvcnQgeyBJY29ucywgU2Vjb25kRmFjdG9ySW1hZ2UgfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvaWNvbnMvSWNvbnNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vLi4vZ3VpL3RoZW1lXCJcbmltcG9ydCB0eXBlIHsgVGh1bmsgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IEF1dG9jb21wbGV0ZSwgVGV4dEZpZWxkIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBMb2dpbkJ1dHRvbiB9IGZyb20gXCIuLi8uLi9ndWkvYmFzZS9idXR0b25zL0xvZ2luQnV0dG9uLmpzXCJcbmltcG9ydCB7IEV4dGVybmFsTGluayB9IGZyb20gXCIuLi8uLi9ndWkvYmFzZS9FeHRlcm5hbExpbmsuanNcIlxuXG50eXBlIFdlYmF1dGhuU3RhdGUgPSB7IHN0YXRlOiBcImluaXRcIiB9IHwgeyBzdGF0ZTogXCJwcm9ncmVzc1wiIH0gfCB7IHN0YXRlOiBcImVycm9yXCI7IGVycm9yOiBUcmFuc2xhdGlvbktleSB9XG5cbnR5cGUgV2ViYXV0aG5Bbm90aGVyRG9tYWluUGFyYW1zID0ge1xuXHRjYW5Mb2dpbjogZmFsc2Vcblx0b3RoZXJEb21haW5Mb2dpblVybDogc3RyaW5nXG59XG50eXBlIFdlYmF1dGhuTG9naW5QYXJhbXMgPSB7XG5cdGNhbkxvZ2luOiB0cnVlXG5cdHN0YXRlOiBXZWJhdXRoblN0YXRlXG5cdGRvV2ViYXV0aG46IFRodW5rXG59XG50eXBlIFdlYmF1dGhuUGFyYW1zID0gV2ViYXV0aG5Mb2dpblBhcmFtcyB8IFdlYmF1dGhuQW5vdGhlckRvbWFpblBhcmFtc1xudHlwZSBPdHBQYXJhbXMgPSB7XG5cdGNvZGVGaWVsZFZhbHVlOiBzdHJpbmdcblx0aW5Qcm9ncmVzczogYm9vbGVhblxuXHRvblZhbHVlQ2hhbmdlZDogKGFyZzA6IHN0cmluZykgPT4gdW5rbm93blxufVxuZXhwb3J0IHR5cGUgU2Vjb25kRmFjdG9yVmlld0F0dHJzID0ge1xuXHRvdHA6IE90cFBhcmFtcyB8IG51bGxcblx0d2ViYXV0aG46IFdlYmF1dGhuUGFyYW1zIHwgbnVsbFxuXHRvblJlY292ZXI6IFRodW5rIHwgbnVsbFxufVxuXG4vKiogRGlzcGxheXMgb3B0aW9ucyBmb3Igc2Vjb25kIGZhY3RvciBhdXRoZW50aWNhdGlvbi4gKi9cbmV4cG9ydCBjbGFzcyBTZWNvbmRGYWN0b3JBdXRoVmlldyBpbXBsZW1lbnRzIENvbXBvbmVudDxTZWNvbmRGYWN0b3JWaWV3QXR0cnM+IHtcblx0dmlldyh2bm9kZTogVm5vZGU8U2Vjb25kRmFjdG9yVmlld0F0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IGF0dHJzIH0gPSB2bm9kZVxuXHRcdHJldHVybiBtKFwiLmZsZXguY29sXCIsIFtcblx0XHRcdG0oXCJwLmNlbnRlclwiLCBbbGFuZy5nZXQoYXR0cnMud2ViYXV0aG4/LmNhbkxvZ2luIHx8IGF0dHJzLm90cCA/IFwic2Vjb25kRmFjdG9yUGVuZGluZ19tc2dcIiA6IFwic2Vjb25kRmFjdG9yUGVuZGluZ090aGVyQ2xpZW50T25seV9tc2dcIildKSxcblx0XHRcdHRoaXMucmVuZGVyV2ViYXV0aG4odm5vZGUuYXR0cnMpLFxuXHRcdFx0dGhpcy5fcmVuZGVyT3RwKHZub2RlLmF0dHJzKSxcblx0XHRcdHRoaXMuX3JlbmRlclJlY292ZXIodm5vZGUuYXR0cnMpLFxuXHRcdF0pXG5cdH1cblxuXHRfcmVuZGVyT3RwKGF0dHJzOiBTZWNvbmRGYWN0b3JWaWV3QXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgeyBvdHAgfSA9IGF0dHJzXG5cblx0XHRpZiAoIW90cCkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmxlZnQubWJcIixcblx0XHRcdG0oVGV4dEZpZWxkLCB7XG5cdFx0XHRcdGxhYmVsOiBcInRvdHBDb2RlX2xhYmVsXCIsXG5cdFx0XHRcdHZhbHVlOiBvdHAuY29kZUZpZWxkVmFsdWUsXG5cdFx0XHRcdGF1dG9jb21wbGV0ZUFzOiBBdXRvY29tcGxldGUub25lVGltZUNvZGUsXG5cdFx0XHRcdG9uaW5wdXQ6ICh2YWx1ZSkgPT4gb3RwLm9uVmFsdWVDaGFuZ2VkKHZhbHVlLnRyaW0oKSksXG5cdFx0XHRcdGluamVjdGlvbnNSaWdodDogKCkgPT4gKG90cC5pblByb2dyZXNzID8gbShcIi5tci1zXCIsIHByb2dyZXNzSWNvbigpKSA6IG51bGwpLFxuXHRcdFx0fSksXG5cdFx0KVxuXHR9XG5cblx0cmVuZGVyV2ViYXV0aG4oYXR0cnM6IFNlY29uZEZhY3RvclZpZXdBdHRycyk6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IHdlYmF1dGhuIH0gPSBhdHRyc1xuXG5cdFx0aWYgKCF3ZWJhdXRobikge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cblx0XHRpZiAod2ViYXV0aG4uY2FuTG9naW4pIHtcblx0XHRcdHJldHVybiB0aGlzLnJlbmRlcldlYmF1dGhuTG9naW4od2ViYXV0aG4pXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLl9yZW5kZXJPdGhlckRvbWFpbkxvZ2luKHdlYmF1dGhuKVxuXHRcdH1cblx0fVxuXG5cdHJlbmRlcldlYmF1dGhuTG9naW4od2ViYXV0aG46IFdlYmF1dGhuTG9naW5QYXJhbXMpOiBDaGlsZHJlbiB7XG5cdFx0bGV0IGl0ZW1zXG5cdFx0Y29uc3QgeyBzdGF0ZSB9ID0gd2ViYXV0aG5cblxuXHRcdGNvbnN0IGRvV2ViQXV0aG5CdXR0b24gPSBtKExvZ2luQnV0dG9uLCB7XG5cdFx0XHRsYWJlbDogXCJ1c2VTZWN1cml0eUtleV9hY3Rpb25cIixcblx0XHRcdG9uY2xpY2s6ICgpID0+IHdlYmF1dGhuLmRvV2ViYXV0aG4oKSxcblx0XHR9KVxuXG5cdFx0c3dpdGNoIChzdGF0ZS5zdGF0ZSkge1xuXHRcdFx0Y2FzZSBcImluaXRcIjpcblx0XHRcdFx0aXRlbXMgPSBbbShcIi5hbGlnbi1zZWxmLWNlbnRlclwiLCBkb1dlYkF1dGhuQnV0dG9uKV1cblx0XHRcdFx0YnJlYWtcblxuXHRcdFx0Y2FzZSBcInByb2dyZXNzXCI6XG5cdFx0XHRcdGl0ZW1zID0gW20oXCIuZmxleC5qdXN0aWZ5LWNlbnRlclwiLCBbbShcIi5tci1zXCIsIHByb2dyZXNzSWNvbigpKSwgbShcIlwiLCBsYW5nLmdldChcIndhaXRpbmdGb3JVMmZfbXNnXCIpKV0pXVxuXHRcdFx0XHRicmVha1xuXG5cdFx0XHRjYXNlIFwiZXJyb3JcIjpcblx0XHRcdFx0aXRlbXMgPSBbXG5cdFx0XHRcdFx0bShcIi5mbGV4LmNvbC5pdGVtcy1jZW50ZXJcIiwgW1xuXHRcdFx0XHRcdFx0bShcIi5mbGV4Lml0ZW1zLWNlbnRlclwiLCBbXG5cdFx0XHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcdFx0XCIubXItc1wiLFxuXHRcdFx0XHRcdFx0XHRcdG0oSWNvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuQ2FuY2VsLFxuXHRcdFx0XHRcdFx0XHRcdFx0c2l6ZTogSWNvblNpemUuTWVkaXVtLFxuXHRcdFx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZmlsbDogdGhlbWUuY29udGVudF9hY2NlbnQsXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XHRtKFwiXCIsIGxhbmcuZ2V0KHN0YXRlLmVycm9yKSksXG5cdFx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHRcdGRvV2ViQXV0aG5CdXR0b24sXG5cdFx0XHRcdFx0XSksXG5cdFx0XHRcdF1cblx0XHRcdFx0YnJlYWtcblxuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKClcblx0XHR9XG5cblx0XHRyZXR1cm4gW20oXCIuZmxleC1jZW50ZXJcIiwgbShcImltZ1wiLCB7IHNyYzogU2Vjb25kRmFjdG9ySW1hZ2UgfSkpLCBtKFwiLm10LmZsZXguY29sXCIsIGl0ZW1zKV1cblx0fVxuXG5cdF9yZW5kZXJPdGhlckRvbWFpbkxvZ2luKHsgb3RoZXJEb21haW5Mb2dpblVybCB9OiBXZWJhdXRobkFub3RoZXJEb21haW5QYXJhbXMpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgaG9zdG5hbWUgPSBuZXcgVVJMKG90aGVyRG9tYWluTG9naW5VcmwpLmhvc3RuYW1lXG5cdFx0cmV0dXJuIFtcblx0XHRcdGxhbmcuZ2V0KFwiZGlmZmVyZW50U2VjdXJpdHlLZXlEb21haW5fbXNnXCIsIHtcblx0XHRcdFx0XCJ7ZG9tYWlufVwiOiBob3N0bmFtZSxcblx0XHRcdH0pLFxuXHRcdFx0bShcImJyXCIpLFxuXHRcdFx0bShFeHRlcm5hbExpbmssIHtcblx0XHRcdFx0aHJlZjogb3RoZXJEb21haW5Mb2dpblVybCxcblx0XHRcdFx0dGV4dDogaG9zdG5hbWUsXG5cdFx0XHRcdGNsYXNzOiBcInRleHQtY2VudGVyXCIsXG5cdFx0XHRcdGlzQ29tcGFueVNpdGU6IGZhbHNlLFxuXHRcdFx0fSksXG5cdFx0XVxuXHR9XG5cblx0X3JlbmRlclJlY292ZXIoYXR0cnM6IFNlY29uZEZhY3RvclZpZXdBdHRycyk6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IG9uUmVjb3ZlciB9ID0gYXR0cnNcblxuXHRcdGlmIChvblJlY292ZXIgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cblx0XHRyZXR1cm4gbShcIi5zbWFsbC50ZXh0LWNlbnRlci5wdFwiLCBbXG5cdFx0XHRtKFxuXHRcdFx0XHRgYVtocmVmPSNdYCxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG9uY2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRvblJlY292ZXIoKVxuXHRcdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0bGFuZy5nZXQoXCJyZWNvdmVyQWNjb3VudEFjY2Vzc19hY3Rpb25cIiksXG5cdFx0XHQpLFxuXHRcdF0pXG5cdH1cbn1cbiIsImltcG9ydCB7IERvbWFpbkNvbmZpZ1Byb3ZpZGVyIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vRG9tYWluQ29uZmlnUHJvdmlkZXIuanNcIlxuaW1wb3J0IHsgQ29uc3QgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5cbi8qKlxuICogR2l2ZW4gYXBwSWQgKGZyb20gdGhlIFUyZktleSksIGZpZ3VyZSBvdXQgd2hpY2ggdXJsIHNob3VsZCB0aGUgdXNlciB1c2UgZm9yIHRoZSBsb2dpbiB3aXRoIHRoYXQgYXBwSWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBJZFRvTG9naW5VcmwoYXBwSWQ6IHN0cmluZywgZG9tYWluQ29uZmlnUHJvdmlkZXI6IERvbWFpbkNvbmZpZ1Byb3ZpZGVyKTogc3RyaW5nIHtcblx0Ly8gV2ViYXV0aG4ga2V5cyBmb3Igb3VyIGRvbWFpbnMgYXJlIHNwZWNpYWwgY2FzZSBiZWNhdXNlIGxvY2FsLCB0ZXN0IGFuZCBwcm9kIGtleXMgYXJlIHJlZ2lzdGVyZWQgZm9yIHRoZSBzYW1lIHN1cGVyZG9tYWluLlxuXHRpZiAoYXBwSWQgPT09IENvbnN0LldFQkFVVEhOX1JQX0lEKSB7XG5cdFx0cmV0dXJuIHdlYmF1dGhuVXJsVG9Mb2dpblVybChkb21haW5Db25maWdQcm92aWRlci5nZXRDdXJyZW50RG9tYWluQ29uZmlnKCkud2ViYXV0aG5VcmwpXG5cdH0gZWxzZSBpZiAoYXBwSWQgPT09IENvbnN0LkxFR0FDWV9XRUJBVVRITl9SUF9JRCkge1xuXHRcdHJldHVybiB3ZWJhdXRoblVybFRvTG9naW5VcmwoZG9tYWluQ29uZmlnUHJvdmlkZXIuZ2V0Q3VycmVudERvbWFpbkNvbmZpZygpLmxlZ2FjeVdlYmF1dGhuVXJsKVxuXHR9XG5cblx0Ly8gSWYgd2UgZ2V0IGhlcmUsIHRoZXJlIGFyZSB0d28gb3B0aW9uczpcblx0Ly8gICogbGVnYWN5IChwcmUtV2ViYXV0aG4pIFUyRiBrZXlzIHVzZSB0aGUgVVJMIG9mIGEganNvbiBmaWxlIGFzIGFwcElkLiBpbiB0aGF0IGNhc2UsIHdlIHVzZSB0aGUgaG9zdG5hbWUgb2YgdGhhdCBVUkwgdG8gZmlndXJlIG91dCB3aGVyZSB0byBhdXRoZW50aWNhdGUuXG5cdC8vICAqIG5ld2VyIG9uZXMgdXNlIHNvbWUgZG9tYWluIChubyBwcm90b2NvbCwgbm8gcG9ydCkgZm9yIGEgd2hpdGVsYWJlbCBkb21haW4uIHdlIHVzZSB0aGUgd2hpdGVsYWJlbCBkb21haW4gaWYgdGhlIGtleSBpcyByZWdpc3RlcmVkIHRocm91Z2ggYSB3aGl0ZWxhYmVsXG5cdC8vICAgICAgIGxvZ2luLiBpdCBtaWdodCBoYXZlIGEgcG9ydCBvbiBsb2NhbCBidWlsZHMuXG5cdGNvbnN0IHBhcnRzID0gKGFwcElkLmVuZHNXaXRoKFwiLmpzb25cIikgPyBuZXcgVVJMKGFwcElkKS5ob3N0bmFtZSA6IGFwcElkKS5zcGxpdChcIjpcIilcblx0Y29uc3QgZG9tYWluID0gcGFydHNbMF1cblx0Ly8gVGhpcyBtaWdodCBiZSB1bmRlZmluZWQsIGJ1dCB0aGF0J3Mgb2theS5cblx0Y29uc3QgcG9ydCA9IHBhcnRzWzFdXG5cdC8vIElmIHdlIHVzZSB3ZWJhdXRobiwgd2UgY2FuIGFzc3VtZSBodHRwcyBiZWNhdXNlIG5vIGJyb3dzZXIgYWxsb3dzIHdlYmF1dGhuIG92ZXIgaHR0cC5cblx0Y29uc3QgZG9tYWluQ29uZmlnID0gZG9tYWluQ29uZmlnUHJvdmlkZXIuZ2V0RG9tYWluQ29uZmlnRm9ySG9zdG5hbWUoZG9tYWluLCBcImh0dHBzOlwiLCBwb3J0KVxuXHRyZXR1cm4gd2ViYXV0aG5VcmxUb0xvZ2luVXJsKGRvbWFpbkNvbmZpZy53ZWJhdXRoblVybClcbn1cblxuZnVuY3Rpb24gd2ViYXV0aG5VcmxUb0xvZ2luVXJsKHdlYmF1dGhuVXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCB1cmwgPSBuZXcgVVJMKHdlYmF1dGhuVXJsKVxuXHR1cmwucGF0aG5hbWUgPSBcIlwiXG5cdHJldHVybiB1cmwudG9TdHJpbmcoKVxufVxuIiwiaW1wb3J0IHsgU2Vjb25kRmFjdG9yVHlwZSB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB0eXBlIHsgVGh1bmsgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIGdldEZpcnN0T3JUaHJvdyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHR5cGUgeyBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgdHlwZSB7IENoYWxsZW5nZSB9IGZyb20gXCIuLi8uLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGNyZWF0ZVNlY29uZEZhY3RvckF1dGhEYXRhIH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgQWNjZXNzQmxvY2tlZEVycm9yLCBCYWRSZXF1ZXN0RXJyb3IsIExvY2tlZEVycm9yLCBOb3RBdXRoZW50aWNhdGVkRXJyb3IgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3IuanNcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL0RpYWxvZy5qc1wiXG5pbXBvcnQgbSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBTZWNvbmRGYWN0b3JBdXRoVmlldyB9IGZyb20gXCIuL1NlY29uZEZhY3RvckF1dGhWaWV3LmpzXCJcbmltcG9ydCB7IFdlYmF1dGhuQ2xpZW50IH0gZnJvbSBcIi4vd2ViYXV0aG4vV2ViYXV0aG5DbGllbnQuanNcIlxuaW1wb3J0IHR5cGUgeyBMb2dpbkZhY2FkZSB9IGZyb20gXCIuLi8uLi9hcGkvd29ya2VyL2ZhY2FkZXMvTG9naW5GYWNhZGUuanNcIlxuaW1wb3J0IHsgQ2FuY2VsbGVkRXJyb3IgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9lcnJvci9DYW5jZWxsZWRFcnJvci5qc1wiXG5pbXBvcnQgeyBXZWJhdXRobkVycm9yIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vZXJyb3IvV2ViYXV0aG5FcnJvci5qc1wiXG5pbXBvcnQgeyBhcHBJZFRvTG9naW5VcmwgfSBmcm9tIFwiLi9TZWNvbmRGYWN0b3JVdGlscy5qc1wiXG5cbmltcG9ydCB7IERvbWFpbkNvbmZpZ1Byb3ZpZGVyIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vRG9tYWluQ29uZmlnUHJvdmlkZXIuanNcIlxuXG50eXBlIEF1dGhEYXRhID0ge1xuXHRyZWFkb25seSBzZXNzaW9uSWQ6IElkVHVwbGVcblx0cmVhZG9ubHkgY2hhbGxlbmdlczogUmVhZG9ubHlBcnJheTxDaGFsbGVuZ2U+XG5cdHJlYWRvbmx5IG1haWxBZGRyZXNzOiBzdHJpbmcgfCBudWxsXG59XG50eXBlIFdlYmF1dGhuU3RhdGUgPSB7IHN0YXRlOiBcImluaXRcIiB9IHwgeyBzdGF0ZTogXCJwcm9ncmVzc1wiIH0gfCB7IHN0YXRlOiBcImVycm9yXCI7IGVycm9yOiBUcmFuc2xhdGlvbktleSB9XG5cbnR5cGUgT3RwU3RhdGUgPSB7XG5cdGNvZGU6IHN0cmluZ1xuXHRpblByb2dyZXNzOiBib29sZWFuXG59XG5cbi8qKlxuICogRGlhbG9nIHdoaWNoIGFsbG93cyB1c2VyIHRvIHVzZSBzZWNvbmQgZmFjdG9yIGF1dGhlbnRpY2F0aW9uIGFuZCBhbGxvd3MgdG8gcmVzZXQgc2Vjb25kIGZhY3Rvci5cbiAqIEl0IHdpbGwgc2hvdyB0aGF0IHRoZSBsb2dpbiBjYW4gYmUgYXBwcm92ZWQgZm9ybSBhbm90aGVyIHNlc3Npb24gYW5kIGRlcGVuZGluZyBvbiB3aGF0IGlzIHN1cHBvcnRlZCBpdFxuICogbWlnaHQgZGlzcGxheSBvbmUgb3IgbW9yZSBvZjpcbiAqICAtIFdlYkF1dGhlbnRpY2F0aW9uXG4gKiAgLSBUT1RQXG4gKiAgLSBsb2dpbiBmcm9tIGFub3RoZXIgZG9tYWluIG1lc3NhZ2VcbiAqICAtIGxvc3QgYWNjZXNzIGJ1dHRvblxuICogKi9cbmV4cG9ydCBjbGFzcyBTZWNvbmRGYWN0b3JBdXRoRGlhbG9nIHtcblx0cHJpdmF0ZSB3YWl0aW5nRm9yU2Vjb25kRmFjdG9yRGlhbG9nOiBEaWFsb2cgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHdlYmF1dGhuU3RhdGU6IFdlYmF1dGhuU3RhdGUgPSB7IHN0YXRlOiBcImluaXRcIiB9XG5cdHByaXZhdGUgb3RwU3RhdGU6IE90cFN0YXRlID0geyBjb2RlOiBcIlwiLCBpblByb2dyZXNzOiBmYWxzZSB9XG5cblx0LyoqIEBwcml2YXRlICovXG5cdHByaXZhdGUgY29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSB3ZWJhdXRobkNsaWVudDogV2ViYXV0aG5DbGllbnQsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBsb2dpbkZhY2FkZTogTG9naW5GYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBkb21haW5Db25maWdQcm92aWRlcjogRG9tYWluQ29uZmlnUHJvdmlkZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBhdXRoRGF0YTogQXV0aERhdGEsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBvbkNsb3NlOiBUaHVuayxcblx0KSB7fVxuXG5cdC8qKlxuXHQgKiBAcGFyYW0gb25DbG9zZSB3aWxsIGJlIGNhbGxlZCB3aGVuIHRoZSBkaWFsb2cgaXMgY2xvc2VkIChvbmUgd2F5IG9yIGFub3RoZXIpLlxuXHQgKi9cblx0c3RhdGljIHNob3coXG5cdFx0d2ViYXV0aG5DbGllbnQ6IFdlYmF1dGhuQ2xpZW50LFxuXHRcdGxvZ2luRmFjYWRlOiBMb2dpbkZhY2FkZSxcblx0XHRkb21haW5Db25maWdQcm92aWRlcjogRG9tYWluQ29uZmlnUHJvdmlkZXIsXG5cdFx0YXV0aERhdGE6IEF1dGhEYXRhLFxuXHRcdG9uQ2xvc2U6IFRodW5rLFxuXHQpOiBTZWNvbmRGYWN0b3JBdXRoRGlhbG9nIHtcblx0XHRjb25zdCBkaWFsb2cgPSBuZXcgU2Vjb25kRmFjdG9yQXV0aERpYWxvZyh3ZWJhdXRobkNsaWVudCwgbG9naW5GYWNhZGUsIGRvbWFpbkNvbmZpZ1Byb3ZpZGVyLCBhdXRoRGF0YSwgb25DbG9zZSlcblxuXHRcdGRpYWxvZy5zaG93KClcblxuXHRcdHJldHVybiBkaWFsb2dcblx0fVxuXG5cdGNsb3NlKCkge1xuXHRcdGlmICh0aGlzLndhaXRpbmdGb3JTZWNvbmRGYWN0b3JEaWFsb2c/LnZpc2libGUpIHtcblx0XHRcdHRoaXMud2FpdGluZ0ZvclNlY29uZEZhY3RvckRpYWxvZz8uY2xvc2UoKVxuXHRcdH1cblxuXHRcdHRoaXMud2ViYXV0aG5DbGllbnQuYWJvcnRDdXJyZW50T3BlcmF0aW9uKClcblx0XHR0aGlzLndhaXRpbmdGb3JTZWNvbmRGYWN0b3JEaWFsb2cgPSBudWxsXG5cblx0XHR0aGlzLm9uQ2xvc2UoKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzaG93KCkge1xuXHRcdGNvbnN0IHUyZkNoYWxsZW5nZSA9IHRoaXMuYXV0aERhdGEuY2hhbGxlbmdlcy5maW5kKFxuXHRcdFx0KGNoYWxsZW5nZSkgPT4gY2hhbGxlbmdlLnR5cGUgPT09IFNlY29uZEZhY3RvclR5cGUudTJmIHx8IGNoYWxsZW5nZS50eXBlID09PSBTZWNvbmRGYWN0b3JUeXBlLndlYmF1dGhuLFxuXHRcdClcblxuXHRcdGNvbnN0IG90cENoYWxsZW5nZSA9IHRoaXMuYXV0aERhdGEuY2hhbGxlbmdlcy5maW5kKChjaGFsbGVuZ2UpID0+IGNoYWxsZW5nZS50eXBlID09PSBTZWNvbmRGYWN0b3JUeXBlLnRvdHApXG5cdFx0Y29uc3QgdTJmU3VwcG9ydGVkID0gYXdhaXQgdGhpcy53ZWJhdXRobkNsaWVudC5pc1N1cHBvcnRlZCgpXG5cblx0XHRjb25zb2xlLmxvZyhcIndlYmF1dGhuIHN1cHBvcnRlZDogXCIsIHUyZlN1cHBvcnRlZClcblxuXHRcdGxldCBjYW5Mb2dpbldpdGhVMmY6IGJvb2xlYW5cblx0XHRsZXQgb3RoZXJEb21haW5Mb2dpblVybDogc3RyaW5nIHwgbnVsbFxuXHRcdGlmICh1MmZDaGFsbGVuZ2U/LnUyZiAhPSBudWxsICYmIHUyZlN1cHBvcnRlZCkge1xuXHRcdFx0Y29uc3QgeyBjYW5BdHRlbXB0LCBjYW5ub3RBdHRlbXB0IH0gPSBhd2FpdCB0aGlzLndlYmF1dGhuQ2xpZW50LmNhbkF0dGVtcHRDaGFsbGVuZ2UodTJmQ2hhbGxlbmdlLnUyZilcblx0XHRcdGNhbkxvZ2luV2l0aFUyZiA9IGNhbkF0dGVtcHQubGVuZ3RoICE9PSAwXG5cdFx0XHQvLyBJZiB3ZSBkb24ndCBoYXZlIGFueSBrZXkgd2UgY2FuIHVzZSB0byBsb2cgaW4gd2UgbmVlZCB0byBzaG93IGEgbWVzc2FnZSB0byBhdHRlbXB0IHRoZSBsb2dpbiBvbiBhbm90aGVyIGRvbWFpbi5cblxuXHRcdFx0aWYgKGNhbm5vdEF0dGVtcHQubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRjb25zdCBsb2dpblVybFN0cmluZyA9IGFwcElkVG9Mb2dpblVybChnZXRGaXJzdE9yVGhyb3coY2Fubm90QXR0ZW1wdCkuYXBwSWQsIHRoaXMuZG9tYWluQ29uZmlnUHJvdmlkZXIpXG5cdFx0XHRcdGNvbnN0IGxvZ2luVXJsID0gbmV3IFVSTChsb2dpblVybFN0cmluZylcblx0XHRcdFx0bG9naW5Vcmwuc2VhcmNoUGFyYW1zLnNldChcIm5vQXV0b0xvZ2luXCIsIFwidHJ1ZVwiKVxuXHRcdFx0XHRvdGhlckRvbWFpbkxvZ2luVXJsID0gbG9naW5VcmwudG9TdHJpbmcoKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0b3RoZXJEb21haW5Mb2dpblVybCA9IG51bGxcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Y2FuTG9naW5XaXRoVTJmID0gZmFsc2Vcblx0XHRcdG90aGVyRG9tYWluTG9naW5VcmwgPSBudWxsXG5cdFx0fVxuXG5cdFx0Y29uc3QgeyBtYWlsQWRkcmVzcyB9ID0gdGhpcy5hdXRoRGF0YVxuXHRcdHRoaXMud2FpdGluZ0ZvclNlY29uZEZhY3RvckRpYWxvZyA9IERpYWxvZy5zaG93QWN0aW9uRGlhbG9nKHtcblx0XHRcdHRpdGxlOiBcImVtcHR5U3RyaW5nX21zZ1wiLFxuXHRcdFx0YWxsb3dPa1dpdGhSZXR1cm46IHRydWUsXG5cdFx0XHRjaGlsZDoge1xuXHRcdFx0XHR2aWV3OiAoKSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIG0oU2Vjb25kRmFjdG9yQXV0aFZpZXcsIHtcblx0XHRcdFx0XHRcdHdlYmF1dGhuOiBjYW5Mb2dpbldpdGhVMmZcblx0XHRcdFx0XHRcdFx0PyB7XG5cdFx0XHRcdFx0XHRcdFx0XHRjYW5Mb2dpbjogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRcdHN0YXRlOiB0aGlzLndlYmF1dGhuU3RhdGUsXG5cdFx0XHRcdFx0XHRcdFx0XHRkb1dlYmF1dGhuOiAoKSA9PiB0aGlzLmRvV2ViYXV0aG4oYXNzZXJ0Tm90TnVsbCh1MmZDaGFsbGVuZ2UpKSxcblx0XHRcdFx0XHRcdFx0ICB9XG5cdFx0XHRcdFx0XHRcdDogb3RoZXJEb21haW5Mb2dpblVybFxuXHRcdFx0XHRcdFx0XHQ/IHtcblx0XHRcdFx0XHRcdFx0XHRcdGNhbkxvZ2luOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRcdG90aGVyRG9tYWluTG9naW5Vcmw6IG90aGVyRG9tYWluTG9naW5VcmwsXG5cdFx0XHRcdFx0XHRcdCAgfVxuXHRcdFx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdFx0XHRvdHA6IG90cENoYWxsZW5nZVxuXHRcdFx0XHRcdFx0XHQ/IHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvZGVGaWVsZFZhbHVlOiB0aGlzLm90cFN0YXRlLmNvZGUsXG5cdFx0XHRcdFx0XHRcdFx0XHRpblByb2dyZXNzOiB0aGlzLm90cFN0YXRlLmluUHJvZ3Jlc3MsXG5cdFx0XHRcdFx0XHRcdFx0XHRvblZhbHVlQ2hhbmdlZDogKG5ld1ZhbHVlKSA9PiAodGhpcy5vdHBTdGF0ZS5jb2RlID0gbmV3VmFsdWUpLFxuXHRcdFx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRcdFx0b25SZWNvdmVyOiBtYWlsQWRkcmVzcyA/ICgpID0+IHRoaXMucmVjb3ZlckxvZ2luKG1haWxBZGRyZXNzKSA6IG51bGwsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRva0FjdGlvbjogb3RwQ2hhbGxlbmdlID8gKCkgPT4gdGhpcy5vbkNvbmZpcm1PdHAoKSA6IG51bGwsXG5cdFx0XHRjYW5jZWxBY3Rpb246ICgpID0+IHRoaXMuY2FuY2VsKCksXG5cdFx0fSlcblx0fVxuXG5cdGFzeW5jIG9uQ29uZmlybU90cCgpIHtcblx0XHR0aGlzLm90cFN0YXRlLmluUHJvZ3Jlc3MgPSB0cnVlXG5cdFx0Y29uc3QgYXV0aERhdGEgPSBjcmVhdGVTZWNvbmRGYWN0b3JBdXRoRGF0YSh7XG5cdFx0XHR0eXBlOiBTZWNvbmRGYWN0b3JUeXBlLnRvdHAsXG5cdFx0XHRzZXNzaW9uOiB0aGlzLmF1dGhEYXRhLnNlc3Npb25JZCxcblx0XHRcdG90cENvZGU6IHRoaXMub3RwU3RhdGUuY29kZS5yZXBsYWNlKC8gL2csIFwiXCIpLFxuXHRcdFx0dTJmOiBudWxsLFxuXHRcdFx0d2ViYXV0aG46IG51bGwsXG5cdFx0fSlcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmxvZ2luRmFjYWRlLmF1dGhlbnRpY2F0ZVdpdGhTZWNvbmRGYWN0b3IoYXV0aERhdGEpXG5cdFx0XHR0aGlzLndhaXRpbmdGb3JTZWNvbmRGYWN0b3JEaWFsb2c/LmNsb3NlKClcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE5vdEF1dGhlbnRpY2F0ZWRFcnJvcikge1xuXHRcdFx0XHREaWFsb2cubWVzc2FnZShcImxvZ2luRmFpbGVkX21zZ1wiKVxuXHRcdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgQmFkUmVxdWVzdEVycm9yKSB7XG5cdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwibG9naW5GYWlsZWRfbXNnXCIpXG5cdFx0XHR9IGVsc2UgaWYgKGUgaW4gQWNjZXNzQmxvY2tlZEVycm9yKSB7XG5cdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwibG9naW5GYWlsZWRPZnRlbl9tc2dcIilcblx0XHRcdFx0dGhpcy5jbG9zZSgpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBlXG5cdFx0XHR9XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHRoaXMub3RwU3RhdGUuaW5Qcm9ncmVzcyA9IGZhbHNlXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBjYW5jZWwoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy53ZWJhdXRobkNsaWVudC5hYm9ydEN1cnJlbnRPcGVyYXRpb24oKVxuXHRcdGF3YWl0IHRoaXMubG9naW5GYWNhZGUuY2FuY2VsQ3JlYXRlU2Vzc2lvbih0aGlzLmF1dGhEYXRhLnNlc3Npb25JZClcblx0XHR0aGlzLmNsb3NlKClcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZG9XZWJhdXRobih1MmZDaGFsbGVuZ2U6IENoYWxsZW5nZSkge1xuXHRcdHRoaXMud2ViYXV0aG5TdGF0ZSA9IHtcblx0XHRcdHN0YXRlOiBcInByb2dyZXNzXCIsXG5cdFx0fVxuXHRcdGNvbnN0IHNlc3Npb25JZCA9IHRoaXMuYXV0aERhdGEuc2Vzc2lvbklkXG5cdFx0Y29uc3QgY2hhbGxlbmdlID0gYXNzZXJ0Tm90TnVsbCh1MmZDaGFsbGVuZ2UudTJmKVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHsgcmVzcG9uc2VEYXRhLCBhcGlCYXNlVXJsIH0gPSBhd2FpdCB0aGlzLndlYmF1dGhuQ2xpZW50LmF1dGhlbnRpY2F0ZShjaGFsbGVuZ2UpXG5cdFx0XHRjb25zdCBhdXRoRGF0YSA9IGNyZWF0ZVNlY29uZEZhY3RvckF1dGhEYXRhKHtcblx0XHRcdFx0dHlwZTogU2Vjb25kRmFjdG9yVHlwZS53ZWJhdXRobixcblx0XHRcdFx0c2Vzc2lvbjogc2Vzc2lvbklkLFxuXHRcdFx0XHR3ZWJhdXRobjogcmVzcG9uc2VEYXRhLFxuXHRcdFx0XHR1MmY6IG51bGwsXG5cdFx0XHRcdG90cENvZGU6IG51bGwsXG5cdFx0XHR9KVxuXHRcdFx0YXdhaXQgdGhpcy5sb2dpbkZhY2FkZS5hdXRoZW50aWNhdGVXaXRoU2Vjb25kRmFjdG9yKGF1dGhEYXRhLCBhcGlCYXNlVXJsKVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgQ2FuY2VsbGVkRXJyb3IpIHtcblx0XHRcdFx0dGhpcy53ZWJhdXRoblN0YXRlID0ge1xuXHRcdFx0XHRcdHN0YXRlOiBcImluaXRcIixcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgQWNjZXNzQmxvY2tlZEVycm9yICYmIHRoaXMud2FpdGluZ0ZvclNlY29uZEZhY3RvckRpYWxvZz8udmlzaWJsZSkge1xuXHRcdFx0XHREaWFsb2cubWVzc2FnZShcImxvZ2luRmFpbGVkT2Z0ZW5fbXNnXCIpXG5cdFx0XHRcdHRoaXMuY2xvc2UoKVxuXHRcdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgV2ViYXV0aG5FcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIkVycm9yIGR1cmluZyB3ZWJBdXRobjogXCIsIGUpXG5cdFx0XHRcdHRoaXMud2ViYXV0aG5TdGF0ZSA9IHtcblx0XHRcdFx0XHRzdGF0ZTogXCJlcnJvclwiLFxuXHRcdFx0XHRcdGVycm9yOiBcImNvdWxkTm90QXV0aFUyZl9tc2dcIixcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgTG9ja2VkRXJyb3IpIHtcblx0XHRcdFx0dGhpcy53ZWJhdXRoblN0YXRlID0ge1xuXHRcdFx0XHRcdHN0YXRlOiBcImluaXRcIixcblx0XHRcdFx0fVxuXHRcdFx0XHREaWFsb2cubWVzc2FnZShcInNlcnZpY2VVbmF2YWlsYWJsZV9tc2dcIilcblx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIE5vdEF1dGhlbnRpY2F0ZWRFcnJvcikge1xuXHRcdFx0XHR0aGlzLndlYmF1dGhuU3RhdGUgPSB7XG5cdFx0XHRcdFx0c3RhdGU6IFwiaW5pdFwiLFxuXHRcdFx0XHR9XG5cdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwibG9naW5GYWlsZWRfbXNnXCIpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBlXG5cdFx0XHR9XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdG0ucmVkcmF3KClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHJlY292ZXJMb2dpbihtYWlsQWRkcmVzczogc3RyaW5nKSB7XG5cdFx0dGhpcy5jYW5jZWwoKVxuXHRcdGNvbnN0IGRpYWxvZyA9IGF3YWl0IGltcG9ydChcIi4uLy4uL2xvZ2luL3JlY292ZXIvUmVjb3ZlckxvZ2luRGlhbG9nXCIpXG5cdFx0ZGlhbG9nLnNob3cobWFpbEFkZHJlc3MsIFwic2Vjb25kRmFjdG9yXCIpXG5cdH1cbn1cbiIsImltcG9ydCBtIGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB0eXBlIHsgQ2hhbGxlbmdlLCBTZXNzaW9uIH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgY3JlYXRlU2Vjb25kRmFjdG9yQXV0aERhdGEsIFNlc3Npb25UeXBlUmVmIH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL0RpYWxvZ1wiXG5pbXBvcnQgeyBPcGVyYXRpb25UeXBlLCBTZXNzaW9uU3RhdGUgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IG5ldmVyTnVsbCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgTm90Rm91bmRFcnJvciB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvclwiXG5pbXBvcnQgdHlwZSB7IEV2ZW50Q29udHJvbGxlciB9IGZyb20gXCIuLi8uLi9hcGkvbWFpbi9FdmVudENvbnRyb2xsZXJcIlxuaW1wb3J0IHsgaXNTYW1lSWQgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlsc1wiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB0eXBlIHsgRW50aXR5Q2xpZW50IH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50XCJcbmltcG9ydCB7IFdlYmF1dGhuQ2xpZW50IH0gZnJvbSBcIi4vd2ViYXV0aG4vV2ViYXV0aG5DbGllbnRcIlxuaW1wb3J0IHsgU2Vjb25kRmFjdG9yQXV0aERpYWxvZyB9IGZyb20gXCIuL1NlY29uZEZhY3RvckF1dGhEaWFsb2dcIlxuaW1wb3J0IHR5cGUgeyBMb2dpbkZhY2FkZSB9IGZyb20gXCIuLi8uLi9hcGkvd29ya2VyL2ZhY2FkZXMvTG9naW5GYWNhZGVcIlxuaW1wb3J0IHsgRG9tYWluQ29uZmlnUHJvdmlkZXIgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9Eb21haW5Db25maWdQcm92aWRlci5qc1wiXG5pbXBvcnQgeyBFbnRpdHlVcGRhdGVEYXRhLCBpc1VwZGF0ZUZvclR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVcGRhdGVVdGlscy5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG4vKipcbiAqIEhhbmRsZXMgc2hvd2luZyBhbmQgaGlkaW5nIG9mIHRoZSBmb2xsb3dpbmcgZGlhbG9nczpcbiAqIDEuIFdhaXRpbmcgZm9yIHNlY29uZCBmYWN0b3IgYXBwcm92YWwgKGVpdGhlciB0b2tlbiBvciBieSBvdGhlciBjbGllbnQpIGR1cmluZyBsb2dpblxuICogMi4gQXNrIGZvciBhcHByb3ZpbmcgdGhlIGxvZ2luIG9uIGFub3RoZXIgY2xpZW50IChzZXR1cEFjY2VwdE90aGVyQ2xpZW50TG9naW5MaXN0ZW5lcigpIG11c3QgaGF2ZSBiZWVuIGNhbGxlZCBpbml0aWFsbHkpLlxuICogICAgICBJZiB0aGUgZGlhbG9nIGlzIHZpc2libGUgYW5kIGFub3RoZXIgY2xpZW50IHRyaWVzIHRvIGxvZ2luIGF0IHRoZSBzYW1lIHRpbWUsIHRoYXQgc2Vjb25kIGxvZ2luIGlzIGlnbm9yZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBTZWNvbmRGYWN0b3JIYW5kbGVyIHtcblx0cHJpdmF0ZSBvdGhlckxvZ2luU2Vzc2lvbklkOiBJZFR1cGxlIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBvdGhlckxvZ2luRGlhbG9nOiBEaWFsb2cgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIG90aGVyTG9naW5MaXN0ZW5lckluaXRpYWxpemVkOiBib29sZWFuID0gZmFsc2Vcblx0cHJpdmF0ZSB3YWl0aW5nRm9yU2Vjb25kRmFjdG9yRGlhbG9nOiBTZWNvbmRGYWN0b3JBdXRoRGlhbG9nIHwgbnVsbCA9IG51bGxcblxuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIHJlYWRvbmx5IGV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQsXG5cdFx0cHJpdmF0ZSByZWFkb25seSB3ZWJhdXRobkNsaWVudDogV2ViYXV0aG5DbGllbnQsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBsb2dpbkZhY2FkZTogTG9naW5GYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBkb21haW5Db25maWdQcm92aWRlcjogRG9tYWluQ29uZmlnUHJvdmlkZXIsXG5cdCkge31cblxuXHRzZXR1cEFjY2VwdE90aGVyQ2xpZW50TG9naW5MaXN0ZW5lcigpIHtcblx0XHRpZiAodGhpcy5vdGhlckxvZ2luTGlzdGVuZXJJbml0aWFsaXplZCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0dGhpcy5vdGhlckxvZ2luTGlzdGVuZXJJbml0aWFsaXplZCA9IHRydWVcblx0XHR0aGlzLmV2ZW50Q29udHJvbGxlci5hZGRFbnRpdHlMaXN0ZW5lcigodXBkYXRlcykgPT4gdGhpcy5lbnRpdHlFdmVudHNSZWNlaXZlZCh1cGRhdGVzKSlcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZW50aXR5RXZlbnRzUmVjZWl2ZWQodXBkYXRlczogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGVEYXRhPikge1xuXHRcdGZvciAoY29uc3QgdXBkYXRlIG9mIHVwZGF0ZXMpIHtcblx0XHRcdGNvbnN0IHNlc3Npb25JZDogSWRUdXBsZSA9IFtuZXZlck51bGwodXBkYXRlLmluc3RhbmNlTGlzdElkKSwgdXBkYXRlLmluc3RhbmNlSWRdXG5cblx0XHRcdGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoU2Vzc2lvblR5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdFx0aWYgKHVwZGF0ZS5vcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuQ1JFQVRFKSB7XG5cdFx0XHRcdFx0bGV0IHNlc3Npb25cblxuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRzZXNzaW9uID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChTZXNzaW9uVHlwZVJlZiwgc2Vzc2lvbklkKVxuXHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIkZhaWxlZCB0byBsb2FkIHNlc3Npb25cIiwgZSlcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y29udGludWVcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoc2Vzc2lvbi5zdGF0ZSA9PT0gU2Vzc2lvblN0YXRlLlNFU1NJT05fU1RBVEVfUEVORElORykge1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMub3RoZXJMb2dpbkRpYWxvZyAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMub3RoZXJMb2dpbkRpYWxvZy5jbG9zZSgpXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRoaXMub3RoZXJMb2dpblNlc3Npb25JZCA9IHNlc3Npb24uX2lkXG5cblx0XHRcdFx0XHRcdHRoaXMuc2hvd0NvbmZpcm1Mb2dpbkRpYWxvZyhzZXNzaW9uKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIGlmICh1cGRhdGUub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLlVQREFURSAmJiB0aGlzLm90aGVyTG9naW5TZXNzaW9uSWQgJiYgaXNTYW1lSWQodGhpcy5vdGhlckxvZ2luU2Vzc2lvbklkLCBzZXNzaW9uSWQpKSB7XG5cdFx0XHRcdFx0bGV0IHNlc3Npb25cblxuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRzZXNzaW9uID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChTZXNzaW9uVHlwZVJlZiwgc2Vzc2lvbklkKVxuXHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIkZhaWxlZCB0byBsb2FkIHNlc3Npb25cIiwgZSlcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y29udGludWVcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0XHRzZXNzaW9uLnN0YXRlICE9PSBTZXNzaW9uU3RhdGUuU0VTU0lPTl9TVEFURV9QRU5ESU5HICYmXG5cdFx0XHRcdFx0XHR0aGlzLm90aGVyTG9naW5EaWFsb2cgJiZcblx0XHRcdFx0XHRcdGlzU2FtZUlkKG5ldmVyTnVsbCh0aGlzLm90aGVyTG9naW5TZXNzaW9uSWQpLCBzZXNzaW9uSWQpXG5cdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHR0aGlzLm90aGVyTG9naW5EaWFsb2cuY2xvc2UoKVxuXG5cdFx0XHRcdFx0XHR0aGlzLm90aGVyTG9naW5TZXNzaW9uSWQgPSBudWxsXG5cdFx0XHRcdFx0XHR0aGlzLm90aGVyTG9naW5EaWFsb2cgPSBudWxsXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2UgaWYgKHVwZGF0ZS5vcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuREVMRVRFICYmIHRoaXMub3RoZXJMb2dpblNlc3Npb25JZCAmJiBpc1NhbWVJZCh0aGlzLm90aGVyTG9naW5TZXNzaW9uSWQsIHNlc3Npb25JZCkpIHtcblx0XHRcdFx0XHRpZiAodGhpcy5vdGhlckxvZ2luRGlhbG9nKSB7XG5cdFx0XHRcdFx0XHR0aGlzLm90aGVyTG9naW5EaWFsb2cuY2xvc2UoKVxuXG5cdFx0XHRcdFx0XHR0aGlzLm90aGVyTG9naW5TZXNzaW9uSWQgPSBudWxsXG5cdFx0XHRcdFx0XHR0aGlzLm90aGVyTG9naW5EaWFsb2cgPSBudWxsXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBzaG93Q29uZmlybUxvZ2luRGlhbG9nKHNlc3Npb246IFNlc3Npb24pIHtcblx0XHRsZXQgdGV4dDogc3RyaW5nXG5cblx0XHRpZiAoc2Vzc2lvbi5sb2dpbklwQWRkcmVzcykge1xuXHRcdFx0dGV4dCA9IGxhbmcuZ2V0KFwic2Vjb25kRmFjdG9yQ29uZmlybUxvZ2luX21zZ1wiLCB7XG5cdFx0XHRcdFwie2NsaWVudElkZW50aWZpZXJ9XCI6IHNlc3Npb24uY2xpZW50SWRlbnRpZmllcixcblx0XHRcdFx0XCJ7aXBBZGRyZXNzfVwiOiBzZXNzaW9uLmxvZ2luSXBBZGRyZXNzLFxuXHRcdFx0fSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGV4dCA9IGxhbmcuZ2V0KFwic2Vjb25kRmFjdG9yQ29uZmlybUxvZ2luTm9JcF9tc2dcIiwge1xuXHRcdFx0XHRcIntjbGllbnRJZGVudGlmaWVyfVwiOiBzZXNzaW9uLmNsaWVudElkZW50aWZpZXIsXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdHRoaXMub3RoZXJMb2dpbkRpYWxvZyA9IERpYWxvZy5zaG93QWN0aW9uRGlhbG9nKHtcblx0XHRcdHRpdGxlOiBcInNlY29uZEZhY3RvckNvbmZpcm1Mb2dpbl9sYWJlbFwiLFxuXHRcdFx0Y2hpbGQ6IHtcblx0XHRcdFx0dmlldzogKCkgPT4gbShcIi50ZXh0LWJyZWFrLnB0XCIsIHRleHQpLFxuXHRcdFx0fSxcblx0XHRcdG9rQWN0aW9uOiBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdGF3YWl0IHRoaXMubG9naW5GYWNhZGUuYXV0aGVudGljYXRlV2l0aFNlY29uZEZhY3Rvcihcblx0XHRcdFx0XHRjcmVhdGVTZWNvbmRGYWN0b3JBdXRoRGF0YSh7XG5cdFx0XHRcdFx0XHRzZXNzaW9uOiBzZXNzaW9uLl9pZCxcblx0XHRcdFx0XHRcdHR5cGU6IG51bGwsIC8vIE1hcmtlciBmb3IgY29uZmlybWluZyBhbm90aGVyIHNlc3Npb25cblx0XHRcdFx0XHRcdG90cENvZGU6IG51bGwsXG5cdFx0XHRcdFx0XHR1MmY6IG51bGwsXG5cdFx0XHRcdFx0XHR3ZWJhdXRobjogbnVsbCxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0KVxuXG5cdFx0XHRcdGlmICh0aGlzLm90aGVyTG9naW5EaWFsb2cpIHtcblx0XHRcdFx0XHR0aGlzLm90aGVyTG9naW5EaWFsb2cuY2xvc2UoKVxuXG5cdFx0XHRcdFx0dGhpcy5vdGhlckxvZ2luU2Vzc2lvbklkID0gbnVsbFxuXHRcdFx0XHRcdHRoaXMub3RoZXJMb2dpbkRpYWxvZyA9IG51bGxcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHR9KVxuXHRcdC8vIGNsb3NlIHRoZSBkaWFsb2cgbWFudWFsbHkgYWZ0ZXIgMSBtaW4gYmVjYXVzZSB0aGUgc2Vzc2lvbiBpcyBub3QgdXBkYXRlZCBpZiB0aGUgb3RoZXIgY2xpZW50IGlzIGNsb3NlZFxuXHRcdGxldCBzZXNzaW9uSWQgPSBzZXNzaW9uLl9pZFxuXHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMub3RoZXJMb2dpbkRpYWxvZyAmJiBpc1NhbWVJZChuZXZlck51bGwodGhpcy5vdGhlckxvZ2luU2Vzc2lvbklkKSwgc2Vzc2lvbklkKSkge1xuXHRcdFx0XHR0aGlzLm90aGVyTG9naW5EaWFsb2cuY2xvc2UoKVxuXG5cdFx0XHRcdHRoaXMub3RoZXJMb2dpblNlc3Npb25JZCA9IG51bGxcblx0XHRcdFx0dGhpcy5vdGhlckxvZ2luRGlhbG9nID0gbnVsbFxuXHRcdFx0fVxuXHRcdH0sIDYwICogMTAwMClcblx0fVxuXG5cdGNsb3NlV2FpdGluZ0ZvclNlY29uZEZhY3RvckRpYWxvZygpIHtcblx0XHR0aGlzLndhaXRpbmdGb3JTZWNvbmRGYWN0b3JEaWFsb2c/LmNsb3NlKClcblx0XHR0aGlzLndhaXRpbmdGb3JTZWNvbmRGYWN0b3JEaWFsb2cgPSBudWxsXG5cdH1cblxuXHQvKipcblx0ICogQGluaGVyaXREb2Ncblx0ICovXG5cdGFzeW5jIHNob3dTZWNvbmRGYWN0b3JBdXRoZW50aWNhdGlvbkRpYWxvZyhzZXNzaW9uSWQ6IElkVHVwbGUsIGNoYWxsZW5nZXM6IFJlYWRvbmx5QXJyYXk8Q2hhbGxlbmdlPiwgbWFpbEFkZHJlc3M6IHN0cmluZyB8IG51bGwpIHtcblx0XHRpZiAodGhpcy53YWl0aW5nRm9yU2Vjb25kRmFjdG9yRGlhbG9nKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHR0aGlzLndhaXRpbmdGb3JTZWNvbmRGYWN0b3JEaWFsb2cgPSBTZWNvbmRGYWN0b3JBdXRoRGlhbG9nLnNob3coXG5cdFx0XHR0aGlzLndlYmF1dGhuQ2xpZW50LFxuXHRcdFx0dGhpcy5sb2dpbkZhY2FkZSxcblx0XHRcdHRoaXMuZG9tYWluQ29uZmlnUHJvdmlkZXIsXG5cdFx0XHR7XG5cdFx0XHRcdHNlc3Npb25JZCxcblx0XHRcdFx0Y2hhbGxlbmdlcyxcblx0XHRcdFx0bWFpbEFkZHJlc3MsXG5cdFx0XHR9LFxuXHRcdFx0KCkgPT4ge1xuXHRcdFx0XHR0aGlzLndhaXRpbmdGb3JTZWNvbmRGYWN0b3JEaWFsb2cgPSBudWxsXG5cdFx0XHR9LFxuXHRcdClcblx0fVxufVxuIiwiaW1wb3J0IHsgZGVjb2RlIH0gZnJvbSBcImNib3JnXCJcbmltcG9ydCB7IGFzc2VydCwgZG93bmNhc3QsIGdldEZpcnN0T3JUaHJvdywgcGFydGl0aW9uQXN5bmMsIHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB0eXBlIHsgVTJmQ2hhbGxlbmdlLCBVMmZSZWdpc3RlcmVkRGV2aWNlLCBXZWJhdXRoblJlc3BvbnNlRGF0YSB9IGZyb20gXCIuLi8uLi8uLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGNyZWF0ZVUyZlJlZ2lzdGVyZWREZXZpY2UsIGNyZWF0ZVdlYmF1dGhuUmVzcG9uc2VEYXRhLCBVMmZLZXkgfSBmcm9tIFwiLi4vLi4vLi4vYXBpL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBXZWJBdXRobkZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9XZWJBdXRobkZhY2FkZS5qc1wiXG5pbXBvcnQgeyBXZWJhdXRobktleURlc2NyaXB0b3IgfSBmcm9tIFwiLi4vLi4vLi4vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvV2ViYXV0aG5LZXlEZXNjcmlwdG9yLmpzXCJcbmltcG9ydCB7IGdldEFwaUJhc2VVcmwgfSBmcm9tIFwiLi4vLi4vLi4vYXBpL2NvbW1vbi9FbnYuanNcIlxuaW1wb3J0IHsgQ29uc3QgfSBmcm9tIFwiLi4vLi4vLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBEb21haW5Db25maWdQcm92aWRlciB9IGZyb20gXCIuLi8uLi8uLi9hcGkvY29tbW9uL0RvbWFpbkNvbmZpZ1Byb3ZpZGVyLmpzXCJcblxuLyoqIFdlYiBhdXRoZW50aWNhdGlvbiBlbnRyeSBwb2ludCBmb3IgdGhlIHJlc3Qgb2YgdGhlIGFwcC4gKi9cbmV4cG9ydCBjbGFzcyBXZWJhdXRobkNsaWVudCB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgd2ViYXV0aG46IFdlYkF1dGhuRmFjYWRlLCBwcml2YXRlIHJlYWRvbmx5IGRvbWFpbkNvbmZpZ1Byb3ZpZGVyOiBEb21haW5Db25maWdQcm92aWRlciwgcHJpdmF0ZSByZWFkb25seSBpc0FwcDogYm9vbGVhbikge31cblxuXHRpc1N1cHBvcnRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRyZXR1cm4gdGhpcy53ZWJhdXRobi5pc1N1cHBvcnRlZCgpXG5cdH1cblxuXHQvKiogV2hldGhlciBpdCdzIHBvc3NpYmxlIHRvIGF0dGVtcHQgYSBjaGFsbGVuZ2UuIEl0IG1pZ2h0IG5vdCBiZSBwb3NzaWJsZSBpZiB0aGVyZSBhcmUgbm90IGtleXMgZm9yIHRoaXMgZG9tYWluLiAqL1xuXHRhc3luYyBjYW5BdHRlbXB0Q2hhbGxlbmdlKGNoYWxsZW5nZTogVTJmQ2hhbGxlbmdlKTogUHJvbWlzZTx7IGNhbkF0dGVtcHQ6IEFycmF5PFUyZktleT47IGNhbm5vdEF0dGVtcHQ6IEFycmF5PFUyZktleT4gfT4ge1xuXHRcdC8vIFdoaXRlbGFiZWwga2V5cyBjYW4gZ2UgcmVnaXN0ZXJlZCBvdGhlciAod2hpdGVsYWJlbCkgZG9tYWlucy5cblx0XHQvLyBJZiBpdCdzIGEgbmV3IFdlYmF1dGhuIGtleSBpdCB3aWxsIG1hdGNoIHJwSWQsIG90aGVyd2lzZSBpdCB3aWxsIG1hdGNoIGxlZ2FjeSBhcHBJZC5cblxuXHRcdC8vIFBhcnRpdGlvbiBpbiBrZXlzIHRoYXQgbWlnaHQgd29yayBhbmQgd2hpY2ggY2VydGFpbmx5IGNhbm5vdCB3b3JrLlxuXHRcdGNvbnN0IFtjYW5BdHRlbXB0LCBjYW5ub3RBdHRlbXB0XSA9IGF3YWl0IHBhcnRpdGlvbkFzeW5jKFxuXHRcdFx0Y2hhbGxlbmdlLmtleXMsXG5cdFx0XHRhc3luYyAoaykgPT4gKGF3YWl0IHRoaXMud2ViYXV0aG4uY2FuQXR0ZW1wdENoYWxsZW5nZUZvclJwSWQoay5hcHBJZCkpIHx8IChhd2FpdCB0aGlzLndlYmF1dGhuLmNhbkF0dGVtcHRDaGFsbGVuZ2VGb3JVMkZBcHBJZChrLmFwcElkKSksXG5cdFx0KVxuXHRcdHJldHVybiB7IGNhbkF0dGVtcHQsIGNhbm5vdEF0dGVtcHQgfVxuXHR9XG5cblx0YXN5bmMgcmVnaXN0ZXIodXNlcklkOiBJZCwgZGlzcGxheU5hbWU6IHN0cmluZyk6IFByb21pc2U8VTJmUmVnaXN0ZXJlZERldmljZT4ge1xuXHRcdGNvbnN0IGNoYWxsZW5nZSA9IHRoaXMuZ2V0Q2hhbGxlbmdlKClcblx0XHQvLyB0aGlzIG11c3QgYmUgYXQgbW9zdCA2NCBieXRlcyBiZWNhdXNlIHRoZSBhdXRoZW50aWNhdG9ycyBhcmUgYWxsb3dlZCB0byB0cnVuY2F0ZSBpdFxuXHRcdC8vIGh0dHBzOi8vd3d3LnczLm9yZy9UUi93ZWJhdXRobi0yLyN1c2VyLWhhbmRsZVxuXHRcdGNvbnN0IG5hbWUgPSBgdXNlcklkPVwiJHt1c2VySWR9XCJgXG5cdFx0Y29uc3QgcmVnaXN0cmF0aW9uUmVzdWx0ID0gYXdhaXQgdGhpcy53ZWJhdXRobi5yZWdpc3Rlcih7IGNoYWxsZW5nZSwgdXNlcklkLCBuYW1lLCBkaXNwbGF5TmFtZSwgZG9tYWluOiB0aGlzLnNlbGVjdFJlZ2lzdHJhdGlvblVybCgpIH0pXG5cdFx0Y29uc3QgYXR0ZXN0YXRpb25PYmplY3QgPSB0aGlzLnBhcnNlQXR0ZXN0YXRpb25PYmplY3QocmVnaXN0cmF0aW9uUmVzdWx0LmF0dGVzdGF0aW9uT2JqZWN0KVxuXHRcdGNvbnN0IHB1YmxpY0tleSA9IHRoaXMucGFyc2VQdWJsaWNLZXkoZG93bmNhc3QoYXR0ZXN0YXRpb25PYmplY3QpLmF1dGhEYXRhKVxuXG5cdFx0cmV0dXJuIGNyZWF0ZVUyZlJlZ2lzdGVyZWREZXZpY2Uoe1xuXHRcdFx0a2V5SGFuZGxlOiBuZXcgVWludDhBcnJheShyZWdpc3RyYXRpb25SZXN1bHQucmF3SWQpLFxuXHRcdFx0Ly8gRm9yIFdlYmF1dGhuIGtleXMgd2Ugc2F2ZSBycElkIGludG8gYXBwSWQuIFRoZXkgZG8gbm90IGNvbmZsaWN0OiBvbmUgb2YgdGhlbSBpcyBqc29uIFVSTCwgYW5vdGhlciBpcyBkb21haW4uXG5cdFx0XHRhcHBJZDogcmVnaXN0cmF0aW9uUmVzdWx0LnJwSWQsXG5cdFx0XHRwdWJsaWNLZXk6IHRoaXMuc2VyaWFsaXplUHVibGljS2V5KHB1YmxpY0tleSksXG5cdFx0XHRjb21wcm9taXNlZDogZmFsc2UsXG5cdFx0XHRjb3VudGVyOiBcIi0xXCIsXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgc2VsZWN0UmVnaXN0cmF0aW9uVXJsKCkge1xuXHRcdGNvbnN0IGRvbWFpbkNvbmZpZyA9IHRoaXMuZG9tYWluQ29uZmlnUHJvdmlkZXIuZ2V0Q3VycmVudERvbWFpbkNvbmZpZygpXG5cdFx0cmV0dXJuIHRoaXMuZ2V0V2ViYXV0aG5VcmwoZG9tYWluQ29uZmlnLCBcIm5ld1wiKVxuXHR9XG5cblx0LyoqXG5cdCAqIEF0dGVtcHQgdG8gY29tcGxldGUgV2ViYXV0aG4gY2hhbGxlbmdlICh0aGUgbG9jYWwgcGFydCwgc2lnbmluZyBvZiB0aGUgZGF0YSkuXG5cdCAqIFUyZkNoYWxsZW5nZSBtaWdodCBoYXZlIG11bHRpcGxlIGtleXMgZm9yIGRpZmZlcmVudCBkb21haW5zIGFuZCB0aGlzIG1ldGhvZCB0YWtlcyBjYXJlIG9mIHBpY2tpbmcgdGhlIG9uZSB3ZSBjYW4gYXR0ZW1wdCB0byBzb2x2ZS5cblx0ICogQHJldHVybiByZXNwb25zZURhdGEgdG8gc2VuZCB0byB0aGUgc2VydmVyIGFuZCBiYXNlIGFwaSB1cmwgd2hpY2ggc2hvdWxkIGJlIGNvbnRhY3RlZCBpbiBvcmRlciB0byBmaW5pc2ggdGhlIGNoYWxsZW5nZVxuXHQgKiBAdGhyb3dzIENhbmNlbGxlZEVycm9yXG5cdCAqIEB0aHJvd3MgV2ViYXV0aG5FcnJvclxuXHQgKi9cblx0YXN5bmMgYXV0aGVudGljYXRlKGNoYWxsZW5nZTogVTJmQ2hhbGxlbmdlKTogUHJvbWlzZTx7IHJlc3BvbnNlRGF0YTogV2ViYXV0aG5SZXNwb25zZURhdGE7IGFwaUJhc2VVcmw6IHN0cmluZyB9PiB7XG5cdFx0Y29uc3QgYWxsb3dlZEtleXM6IFdlYmF1dGhuS2V5RGVzY3JpcHRvcltdID0gY2hhbGxlbmdlLmtleXMubWFwKChrZXkpID0+IHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGlkOiBrZXkua2V5SGFuZGxlLFxuXHRcdFx0fVxuXHRcdH0pXG5cblx0XHRjb25zdCBhdXRoZW50aWNhdGlvblVybCA9IHRoaXMuc2VsZWN0QXV0aGVudGljYXRpb25VcmwoY2hhbGxlbmdlKVxuXHRcdGNvbnN0IHNpZ25SZXN1bHQgPSBhd2FpdCB0aGlzLndlYmF1dGhuLnNpZ24oe1xuXHRcdFx0Y2hhbGxlbmdlOiBjaGFsbGVuZ2UuY2hhbGxlbmdlLFxuXHRcdFx0a2V5czogYWxsb3dlZEtleXMsXG5cdFx0XHRkb21haW46IGF1dGhlbnRpY2F0aW9uVXJsLFxuXHRcdH0pXG5cblx0XHRjb25zdCByZXNwb25zZURhdGEgPSBjcmVhdGVXZWJhdXRoblJlc3BvbnNlRGF0YSh7XG5cdFx0XHRrZXlIYW5kbGU6IG5ldyBVaW50OEFycmF5KHNpZ25SZXN1bHQucmF3SWQpLFxuXHRcdFx0Y2xpZW50RGF0YTogbmV3IFVpbnQ4QXJyYXkoc2lnblJlc3VsdC5jbGllbnREYXRhSlNPTiksXG5cdFx0XHRzaWduYXR1cmU6IG5ldyBVaW50OEFycmF5KHNpZ25SZXN1bHQuc2lnbmF0dXJlKSxcblx0XHRcdGF1dGhlbnRpY2F0b3JEYXRhOiBuZXcgVWludDhBcnJheShzaWduUmVzdWx0LmF1dGhlbnRpY2F0b3JEYXRhKSxcblx0XHR9KVxuXHRcdC8vIHRha2UgaHR0cHM6Ly9hcHAudHV0YS5jb20vd2ViYXV0aG4gYW5kIGNvbnZlcnQgaXQgdG8gYXBpczovL2FwcC50dXRhLmNvbVxuXHRcdGNvbnN0IGF1dGhVcmxPYmplY3QgPSBuZXcgVVJMKGF1dGhlbnRpY2F0aW9uVXJsKVxuXHRcdGNvbnN0IGRvbWFpbkNvbmZpZyA9IHRoaXMuZG9tYWluQ29uZmlnUHJvdmlkZXIuZ2V0RG9tYWluQ29uZmlnRm9ySG9zdG5hbWUoYXV0aFVybE9iamVjdC5ob3N0bmFtZSwgYXV0aFVybE9iamVjdC5wcm90b2NvbCwgYXV0aFVybE9iamVjdC5wb3J0KVxuXHRcdGNvbnN0IGFwaVVybCA9IGdldEFwaUJhc2VVcmwoZG9tYWluQ29uZmlnKVxuXG5cdFx0cmV0dXJuIHsgcmVzcG9uc2VEYXRhLCBhcGlCYXNlVXJsOiBhcGlVcmwgfVxuXHR9XG5cblx0YWJvcnRDdXJyZW50T3BlcmF0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLndlYmF1dGhuLmFib3J0Q3VycmVudE9wZXJhdGlvbigpXG5cdH1cblxuXHRwcml2YXRlIHNlbGVjdEF1dGhlbnRpY2F0aW9uVXJsKGNoYWxsZW5nZTogVTJmQ2hhbGxlbmdlKTogc3RyaW5nIHtcblx0XHQvLyBXZSBuZWVkIHRvIGZpZ3VyZSBvdXIgZm9yIHdoaWNoIHBhZ2Ugd2UgbmVlZCB0byBvcGVuIGF1dGhlbnRpY2F0aW9uIGJhc2VkIG9uIHRoZSBrZXlzIHRoYXQgdXNlciBoYXMgYWRkZWQgYmVjYXVzZSB1c2VycyBjYW4gcmVnaXN0ZXIga2V5cyBmb3Igb3VyXG5cdFx0Ly8gZG9tYWlucyBhcyB3ZWxsIGFzIGZvciB3aGl0ZWxhYmVsIGRvbWFpbnMuXG5cblx0XHRjb25zdCBkb21haW5Db25maWcgPSB0aGlzLmRvbWFpbkNvbmZpZ1Byb3ZpZGVyLmdldEN1cnJlbnREb21haW5Db25maWcoKVxuXHRcdGlmIChjaGFsbGVuZ2Uua2V5cy5zb21lKChrKSA9PiBrLmFwcElkID09PSBDb25zdC5XRUJBVVRITl9SUF9JRCkpIHtcblx0XHRcdC8vIFRoaXMgZnVuY3Rpb24gaXMgbm90IG5lZWRlZCBmb3IgdGhlIHdlYmFwcCEgV2UgY2FuIHNhZmVseSBhc3N1bWUgdGhhdCBvdXIgY2xpZW50V2ViUm9vdCBpcyBhIG5ldyBkb21haW4uXG5cdFx0XHRyZXR1cm4gdGhpcy5nZXRXZWJhdXRoblVybChkb21haW5Db25maWcsIFwibmV3XCIpXG5cdFx0fSBlbHNlIGlmIChjaGFsbGVuZ2Uua2V5cy5zb21lKChrKSA9PiBrLmFwcElkID09PSBDb25zdC5MRUdBQ1lfV0VCQVVUSE5fUlBfSUQpKSB7XG5cdFx0XHQvLyBJZiB0aGVyZSdzIGEgV2ViYXV0aG4ga2V5IGZvciBvdXIgb2xkIGRvbWFpbiB3ZSBuZWVkIHRvIG9wZW4gdGhlIHdlYmFwcCBvbiB0aGUgb2xkIGRvbWFpbi5cblx0XHRcdHJldHVybiB0aGlzLmdldFdlYmF1dGhuVXJsKGRvbWFpbkNvbmZpZywgXCJsZWdhY3lcIilcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gSWYgaXQgaXNuJ3QgdGhlcmUsIGxvb2sgZm9yIGFueSBXZWJhdXRobiBrZXkuIExlZ2FjeSBVMkYga2V5IGlkcyBlbmRzIHdpdGgganNvbiBzdWJwYXRoLlxuXHRcdFx0Y29uc3Qgd2ViYXV0aG5LZXkgPSBjaGFsbGVuZ2Uua2V5cy5maW5kKChrKSA9PiAhdGhpcy5pc0xlZ2FjeVUyZktleShrKSlcblx0XHRcdGlmICh3ZWJhdXRobktleSkge1xuXHRcdFx0XHRjb25zdCBkb21haW5Db25maWdGb3JIb3N0bmFtZSA9IHRoaXMuZG9tYWluQ29uZmlnUHJvdmlkZXIuZ2V0RG9tYWluQ29uZmlnRm9ySG9zdG5hbWUod2ViYXV0aG5LZXkuYXBwSWQsIFwiaHR0cHM6XCIpXG5cdFx0XHRcdHJldHVybiB0aGlzLmdldFdlYmF1dGhuVXJsKGRvbWFpbkNvbmZpZ0Zvckhvc3RuYW1lLCBcIm5ld1wiKVxuXHRcdFx0fSBlbHNlIGlmIChjaGFsbGVuZ2Uua2V5cy5zb21lKChrKSA9PiBrLmFwcElkID09PSBDb25zdC5VMkZfTEVHQUNZX0FQUElEKSkge1xuXHRcdFx0XHQvLyBUaGVyZSBhcmUgb25seSBsZWdhY3kgVTJGIGtleXMgYnV0IHRoZXJlIGlzIG9uZSBmb3Igb3VyIGRvbWFpbiwgdGFrZSBpdFxuXHRcdFx0XHRyZXR1cm4gdGhpcy5nZXRXZWJhdXRoblVybChkb21haW5Db25maWcsIFwibGVnYWN5XCIpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBOb3RoaW5nIGVsc2Ugd29ya2VkLCBzZWxlY3QgbGVnYWN5IFUyRiBrZXkgZm9yIHdoaXRlbGFiZWwgZG9tYWluXG5cdFx0XHRcdGNvbnN0IGtleVRvVXNlID0gZ2V0Rmlyc3RPclRocm93KGNoYWxsZW5nZS5rZXlzKVxuXHRcdFx0XHRjb25zdCBrZXlVcmwgPSBuZXcgVVJMKGtleVRvVXNlLmFwcElkKVxuXHRcdFx0XHRjb25zdCBkb21haW5Db25maWdGb3JIb3N0bmFtZSA9IHRoaXMuZG9tYWluQ29uZmlnUHJvdmlkZXIuZ2V0RG9tYWluQ29uZmlnRm9ySG9zdG5hbWUoa2V5VXJsLmhvc3RuYW1lLCBrZXlVcmwucHJvdG9jb2wsIGtleVVybC5wb3J0KVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5nZXRXZWJhdXRoblVybChkb21haW5Db25maWdGb3JIb3N0bmFtZSwgXCJuZXdcIilcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGdldFdlYmF1dGhuVXJsKGRvbWFpbkNvbmZpZzogRG9tYWluQ29uZmlnLCB0eXBlOiBcImxlZ2FjeVwiIHwgXCJuZXdcIikge1xuXHRcdGlmICh0eXBlID09PSBcImxlZ2FjeVwiKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5pc0FwcCA/IGRvbWFpbkNvbmZpZy5sZWdhY3lXZWJhdXRobk1vYmlsZVVybCA6IGRvbWFpbkNvbmZpZy5sZWdhY3lXZWJhdXRoblVybFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5pc0FwcCA/IGRvbWFpbkNvbmZpZy53ZWJhdXRobk1vYmlsZVVybCA6IGRvbWFpbkNvbmZpZy53ZWJhdXRoblVybFxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgaXNMZWdhY3lVMmZLZXkoa2V5OiBVMmZLZXkpOiBib29sZWFuIHtcblx0XHRyZXR1cm4ga2V5LmFwcElkLmVuZHNXaXRoKENvbnN0LlUyZl9BUFBJRF9TVUZGSVgpXG5cdH1cblxuXHRwcml2YXRlIGdldENoYWxsZW5nZSgpOiBVaW50OEFycmF5IHtcblx0XHQvLyBTaG91bGQgYmUgcmVwbGFjZWQgd2l0aCBvdXIgb3duIGVudHJvcHkgZ2VuZXJhdG9yIGluIHRoZSBmdXR1cmUuXG5cdFx0Y29uc3QgcmFuZG9tID0gbmV3IFVpbnQ4QXJyYXkoMzIpXG5cdFx0Y3J5cHRvLmdldFJhbmRvbVZhbHVlcyhyYW5kb20pXG5cdFx0cmV0dXJuIHJhbmRvbVxuXHR9XG5cblx0cHJpdmF0ZSBwYXJzZUF0dGVzdGF0aW9uT2JqZWN0KHJhdzogQXJyYXlCdWZmZXIpOiB1bmtub3duIHtcblx0XHRyZXR1cm4gZGVjb2RlKG5ldyBVaW50OEFycmF5KHJhdykpXG5cdH1cblxuXHRwcml2YXRlIHBhcnNlUHVibGljS2V5KGF1dGhEYXRhOiBVaW50OEFycmF5KTogTWFwPG51bWJlciwgbnVtYmVyIHwgVWludDhBcnJheT4ge1xuXHRcdC8vIGdldCB0aGUgbGVuZ3RoIG9mIHRoZSBjcmVkZW50aWFsIElEXG5cdFx0Y29uc3QgZGF0YVZpZXcgPSBuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKDIpKVxuXHRcdGNvbnN0IGlkTGVuQnl0ZXMgPSBhdXRoRGF0YS5zbGljZSg1MywgNTUpXG5cdFx0Zm9yIChjb25zdCBbaW5kZXgsIHZhbHVlXSBvZiBpZExlbkJ5dGVzLmVudHJpZXMoKSkge1xuXHRcdFx0ZGF0YVZpZXcuc2V0VWludDgoaW5kZXgsIHZhbHVlKVxuXHRcdH1cblx0XHRjb25zdCBjcmVkZW50aWFsSWRMZW5ndGggPSBkYXRhVmlldy5nZXRVaW50MTYoMClcblx0XHQvLyBnZXQgdGhlIHB1YmxpYyBrZXkgb2JqZWN0XG5cdFx0Y29uc3QgcHVibGljS2V5Qnl0ZXMgPSBhdXRoRGF0YS5zbGljZSg1NSArIGNyZWRlbnRpYWxJZExlbmd0aClcblx0XHQvLyB0aGUgcHVibGljS2V5Qnl0ZXMgYXJlIGVuY29kZWQgYWdhaW4gYXMgQ0JPUlxuXHRcdC8vIFdlIGhhdmUgdG8gdXNlIG1hcHMgaGVyZSBiZWNhdXNlIGtleXMgYXJlIG51bWVyaWMgYW5kIGNib3JnIG9ubHkgYWxsb3dzIHRoZW0gaW4gbWFwc1xuXHRcdHJldHVybiBkZWNvZGUobmV3IFVpbnQ4QXJyYXkocHVibGljS2V5Qnl0ZXMuYnVmZmVyKSwge1xuXHRcdFx0dXNlTWFwczogdHJ1ZSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBzZXJpYWxpemVQdWJsaWNLZXkocHVibGljS2V5OiBNYXA8bnVtYmVyLCBudW1iZXIgfCBVaW50OEFycmF5Pik6IFVpbnQ4QXJyYXkge1xuXHRcdGNvbnN0IGVuY29kZWQgPSBuZXcgVWludDhBcnJheSg2NSlcblx0XHRlbmNvZGVkWzBdID0gMHgwNFxuXHRcdGNvbnN0IHggPSBwdWJsaWNLZXkuZ2V0KC0yKVxuXHRcdGNvbnN0IHkgPSBwdWJsaWNLZXkuZ2V0KC0zKVxuXG5cdFx0aWYgKCEoeCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHx8ICEoeSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJQdWJsaWMga2V5IGlzIGluIHVua25vd24gZm9ybWF0XCIpXG5cdFx0fVxuXG5cdFx0ZW5jb2RlZC5zZXQoeCwgMSlcblx0XHRlbmNvZGVkLnNldCh5LCAzMylcblx0XHRyZXR1cm4gZW5jb2RlZFxuXHR9XG59XG5cbi8qKiBhdXRoZW50aWNhdG9ycyBhcmUgYWxsb3dlZCB0byB0cnVuY2F0ZSBzdHJpbmdzIHRvIHRoaXMgbGVuZ3RoICovXG5jb25zdCBXRUJBVVRITl9TVFJJTkdfTUFYX0JZVEVfTEVOR1RIID0gNjRcblxuLyoqXG4gKiBzb21lIGF1dGhlbnRpY2F0b3JzIHRydW5jYXRlIHRoaXMgYW5kIG90aGVycyByZWZ1c2UgdG8gYmUgcmVnaXN0ZXJlZFxuICogYXQgYWxsIGlmIHRoaXMgdmFsaWRhdGlvbiBkb2VzIG5vdCBwYXNzLlxuICpcbiAqIE5vdGU6IHRlY2huaWNhbGx5LCB3ZSdkIGFsc28gYmUgc3VwcG9zZWQgdG8gZW5jb2RlIHRleHQgZGlyZWN0aW9uIGFuZCBhIGxhbmd1YWdlXG4gKiBjb2RlIGludG8gdGhlIGRpc3BsYXkgbmFtZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlV2ViYXV0aG5EaXNwbGF5TmFtZShkaXNwbGF5TmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG5cdHJldHVybiBXRUJBVVRITl9TVFJJTkdfTUFYX0JZVEVfTEVOR1RIIC0gc3RyaW5nVG9VdGY4VWludDhBcnJheShkaXNwbGF5TmFtZSkuYnl0ZUxlbmd0aCA+PSAwXG59XG4iLCJpbXBvcnQgdHlwZSB7IERlZmVycmVkT2JqZWN0LCBsYXp5LCBsYXp5QXN5bmMgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIGRlZmVyIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlQm9vdCB9IGZyb20gXCIuLi9jb21tb24vRW52XCJcbmltcG9ydCB0eXBlIHsgVXNlckNvbnRyb2xsZXIsIFVzZXJDb250cm9sbGVySW5pdERhdGEgfSBmcm9tIFwiLi9Vc2VyQ29udHJvbGxlclwiXG5pbXBvcnQgeyBnZXRXaGl0ZWxhYmVsQ3VzdG9taXphdGlvbnMgfSBmcm9tIFwiLi4vLi4vbWlzYy9XaGl0ZWxhYmVsQ3VzdG9taXphdGlvbnMuanNcIlxuaW1wb3J0IHsgTm90Rm91bmRFcnJvciB9IGZyb20gXCIuLi9jb21tb24vZXJyb3IvUmVzdEVycm9yXCJcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gXCIuLi8uLi9taXNjL0NsaWVudERldGVjdG9yXCJcbmltcG9ydCB0eXBlIHsgTG9naW5GYWNhZGUsIE5ld1Nlc3Npb25EYXRhIH0gZnJvbSBcIi4uL3dvcmtlci9mYWNhZGVzL0xvZ2luRmFjYWRlXCJcbmltcG9ydCB7IFJlc3VtZVNlc3Npb25FcnJvclJlYXNvbiB9IGZyb20gXCIuLi93b3JrZXIvZmFjYWRlcy9Mb2dpbkZhY2FkZVwiXG5pbXBvcnQgdHlwZSB7IENyZWRlbnRpYWxzIH0gZnJvbSBcIi4uLy4uL21pc2MvY3JlZGVudGlhbHMvQ3JlZGVudGlhbHNcIlxuaW1wb3J0IHsgRmVhdHVyZVR5cGUsIEtkZlR5cGUgfSBmcm9tIFwiLi4vY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IFNlc3Npb25UeXBlIH0gZnJvbSBcIi4uL2NvbW1vbi9TZXNzaW9uVHlwZVwiXG5pbXBvcnQgeyBFeHRlcm5hbFVzZXJLZXlEZXJpdmVyIH0gZnJvbSBcIi4uLy4uL21pc2MvTG9naW5VdGlscy5qc1wiXG5pbXBvcnQgeyBVbmVuY3J5cHRlZENyZWRlbnRpYWxzIH0gZnJvbSBcIi4uLy4uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1VuZW5jcnlwdGVkQ3JlZGVudGlhbHMuanNcIlxuaW1wb3J0IHsgUGFnZUNvbnRleHRMb2dpbkxpc3RlbmVyIH0gZnJvbSBcIi4vUGFnZUNvbnRleHRMb2dpbkxpc3RlbmVyLmpzXCJcbmltcG9ydCB7IENhY2hlTW9kZSB9IGZyb20gXCIuLi93b3JrZXIvcmVzdC9FbnRpdHlSZXN0Q2xpZW50LmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZUJvb3QoKVxuXG5leHBvcnQgaW50ZXJmYWNlIFBvc3RMb2dpbkFjdGlvbiB7XG5cdC8qKiBQYXJ0aWFsIGxvZ2luIGlzIGFjaGlldmVkIHdpdGggZ2V0dGluZyB0aGUgdXNlciwgY2FuIGhhcHBlbiBvZmZsaW5lLiBUaGUgbG9naW4gd2lsbCB3YWl0IGZvciB0aGUgcmV0dXJuZWQgcHJvbWlzZS4gKi9cblx0b25QYXJ0aWFsTG9naW5TdWNjZXNzKGxvZ2dlZEluRXZlbnQ6IExvZ2dlZEluRXZlbnQpOiBQcm9taXNlPHZvaWQ+XG5cblx0LyoqIEZ1bGwgbG9naW4gaXMgYWNoaWV2ZWQgd2l0aCBnZXR0aW5nIGdyb3VwIGtleXMuIENhbiBkbyBzZXJ2aWNlIGNhbGxzIGZyb20gdGhpcyBwb2ludCBvbi4gKi9cblx0b25GdWxsTG9naW5TdWNjZXNzKGxvZ2dlZEluRXZlbnQ6IExvZ2dlZEluRXZlbnQpOiBQcm9taXNlPHZvaWQ+XG59XG5cbmV4cG9ydCB0eXBlIExvZ2dlZEluRXZlbnQgPSB7XG5cdHJlYWRvbmx5IHNlc3Npb25UeXBlOiBTZXNzaW9uVHlwZVxuXHRyZWFkb25seSB1c2VySWQ6IElkXG59XG5cbmV4cG9ydCB0eXBlIFJlc3VtZVNlc3Npb25SZXN1bHQgPSB7IHR5cGU6IFwic3VjY2Vzc1wiIH0gfCB7IHR5cGU6IFwiZXJyb3JcIjsgcmVhc29uOiBSZXN1bWVTZXNzaW9uRXJyb3JSZWFzb24gfVxuXG5leHBvcnQgY2xhc3MgTG9naW5Db250cm9sbGVyIHtcblx0cHJpdmF0ZSB1c2VyQ29udHJvbGxlcjogVXNlckNvbnRyb2xsZXIgfCBudWxsID0gbnVsbFxuXHQvLyB0aGV5IGFyZSBGZWF0dXJlVHlwZSBidXQgd2UgbWlnaHQgbm90IGJlIGF3YXJlIG9mIG5ld2VyIHZhbHVlcyBmb3IgaXQsIHNvIGl0IGlzIG5vdCBqdXN0IEZlYXR1cmVUeXBlXG5cdHByaXZhdGUgY3VzdG9taXphdGlvbnM6IE51bWJlclN0cmluZ1tdIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBwYXJ0aWFsTG9naW46IERlZmVycmVkT2JqZWN0PHZvaWQ+ID0gZGVmZXIoKVxuXHRwcml2YXRlIF9pc1doaXRlbGFiZWw6IGJvb2xlYW4gPSAhIWdldFdoaXRlbGFiZWxDdXN0b21pemF0aW9ucyh3aW5kb3cpXG5cdHByaXZhdGUgcG9zdExvZ2luQWN0aW9uczogQXJyYXk8bGF6eTxQcm9taXNlPFBvc3RMb2dpbkFjdGlvbj4+PiA9IFtdXG5cdHByaXZhdGUgZnVsbHlMb2dnZWRJbjogYm9vbGVhbiA9IGZhbHNlXG5cdHByaXZhdGUgYXRMZWFzdFBhcnRpYWxseUxvZ2dlZEluOiBib29sZWFuID0gZmFsc2VcblxuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIHJlYWRvbmx5IGxvZ2luRmFjYWRlOiBMb2dpbkZhY2FkZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGxvZ2luTGlzdGVuZXI6IGxhenlBc3luYzxQYWdlQ29udGV4dExvZ2luTGlzdGVuZXI+LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgcmVzZXRBcHBTdGF0ZTogKCkgPT4gUHJvbWlzZTx1bmtub3duPixcblx0KSB7fVxuXG5cdGluaXQoKSB7XG5cdFx0dGhpcy53YWl0Rm9yRnVsbExvZ2luKCkudGhlbihhc3luYyAoKSA9PiB7XG5cdFx0XHR0aGlzLmZ1bGx5TG9nZ2VkSW4gPSB0cnVlXG5cdFx0XHRhd2FpdCB0aGlzLndhaXRGb3JQYXJ0aWFsTG9naW4oKVxuXHRcdFx0Zm9yIChjb25zdCBsYXp5QWN0aW9uIG9mIHRoaXMucG9zdExvZ2luQWN0aW9ucykge1xuXHRcdFx0XHRjb25zdCBhY3Rpb24gPSBhd2FpdCBsYXp5QWN0aW9uKClcblx0XHRcdFx0YXdhaXQgYWN0aW9uLm9uRnVsbExvZ2luU3VjY2Vzcyh7XG5cdFx0XHRcdFx0c2Vzc2lvblR5cGU6IHRoaXMuZ2V0VXNlckNvbnRyb2xsZXIoKS5zZXNzaW9uVHlwZSxcblx0XHRcdFx0XHR1c2VySWQ6IHRoaXMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VySWQsXG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdC8qKlxuXHQgKiBjcmVhdGUgYSBuZXcgc2Vzc2lvbiBhbmQgc2V0IHVwIHN0b3JlZCBjcmVkZW50aWFscyBhbmQgb2ZmbGluZSBkYXRhYmFzZSwgaWYgYXBwbGljYWJsZS5cblx0ICogQHBhcmFtIHVzZXJuYW1lIHRoZSBtYWlsIGFkZHJlc3MgYmVpbmcgdXNlZCB0byBsb2cgaW5cblx0ICogQHBhcmFtIHBhc3N3b3JkIHRoZSBwYXNzd29yZCBnaXZlbiB0byBsb2cgaW5cblx0ICogQHBhcmFtIHNlc3Npb25UeXBlIHdoZXRoZXIgdG8gc3RvcmUgdGhlIGNyZWRlbnRpYWxzIGluIGxvY2FsIHN0b3JhZ2Vcblx0ICogQHBhcmFtIGRhdGFiYXNlS2V5IGlmIGdpdmVuLCB3aWxsIHVzZSB0aGlzIGtleSBmb3IgdGhlIG9mZmxpbmUgZGF0YWJhc2UuIGlmIG5vdCwgd2lsbCBmb3JjZSBhIG5ldyBkYXRhYmFzZSB0byBiZSBjcmVhdGVkIGFuZCBnZW5lcmF0ZSBhIGtleS5cblx0ICovXG5cdGFzeW5jIGNyZWF0ZVNlc3Npb24odXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZywgc2Vzc2lvblR5cGU6IFNlc3Npb25UeXBlLCBkYXRhYmFzZUtleTogVWludDhBcnJheSB8IG51bGwgPSBudWxsKTogUHJvbWlzZTxOZXdTZXNzaW9uRGF0YT4ge1xuXHRcdGNvbnN0IG5ld1Nlc3Npb25EYXRhID0gYXdhaXQgdGhpcy5sb2dpbkZhY2FkZS5jcmVhdGVTZXNzaW9uKHVzZXJuYW1lLCBwYXNzd29yZCwgY2xpZW50LmdldElkZW50aWZpZXIoKSwgc2Vzc2lvblR5cGUsIGRhdGFiYXNlS2V5KVxuXHRcdGNvbnN0IHsgdXNlciwgY3JlZGVudGlhbHMsIHNlc3Npb25JZCwgdXNlckdyb3VwSW5mbyB9ID0gbmV3U2Vzc2lvbkRhdGFcblx0XHRhd2FpdCB0aGlzLm9uUGFydGlhbExvZ2luU3VjY2Vzcyhcblx0XHRcdHtcblx0XHRcdFx0dXNlcixcblx0XHRcdFx0dXNlckdyb3VwSW5mbyxcblx0XHRcdFx0c2Vzc2lvbklkLFxuXHRcdFx0XHRhY2Nlc3NUb2tlbjogY3JlZGVudGlhbHMuYWNjZXNzVG9rZW4sXG5cdFx0XHRcdHNlc3Npb25UeXBlLFxuXHRcdFx0XHRsb2dpblVzZXJuYW1lOiB1c2VybmFtZSxcblx0XHRcdH0sXG5cdFx0XHRzZXNzaW9uVHlwZSxcblx0XHQpXG5cdFx0cmV0dXJuIG5ld1Nlc3Npb25EYXRhXG5cdH1cblxuXHRhZGRQb3N0TG9naW5BY3Rpb24oaGFuZGxlcjogbGF6eTxQcm9taXNlPFBvc3RMb2dpbkFjdGlvbj4+KSB7XG5cdFx0dGhpcy5wb3N0TG9naW5BY3Rpb25zLnB1c2goaGFuZGxlcilcblx0fVxuXG5cdGFzeW5jIG9uUGFydGlhbExvZ2luU3VjY2Vzcyhpbml0RGF0YTogVXNlckNvbnRyb2xsZXJJbml0RGF0YSwgc2Vzc2lvblR5cGU6IFNlc3Npb25UeXBlKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgeyBpbml0VXNlckNvbnRyb2xsZXIgfSA9IGF3YWl0IGltcG9ydChcIi4vVXNlckNvbnRyb2xsZXJcIilcblx0XHR0aGlzLnVzZXJDb250cm9sbGVyID0gYXdhaXQgaW5pdFVzZXJDb250cm9sbGVyKGluaXREYXRhKVxuXG5cdFx0YXdhaXQgdGhpcy5sb2FkQ3VzdG9taXphdGlvbnMoKVxuXHRcdGF3YWl0IHRoaXMuX2RldGVybWluZUlmV2hpdGVsYWJlbCgpXG5cblx0XHRmb3IgKGNvbnN0IGxhenlIYW5kbGVyIG9mIHRoaXMucG9zdExvZ2luQWN0aW9ucykge1xuXHRcdFx0Y29uc3QgaGFuZGxlciA9IGF3YWl0IGxhenlIYW5kbGVyKClcblx0XHRcdGF3YWl0IGhhbmRsZXIub25QYXJ0aWFsTG9naW5TdWNjZXNzKHtcblx0XHRcdFx0c2Vzc2lvblR5cGUsXG5cdFx0XHRcdHVzZXJJZDogaW5pdERhdGEudXNlci5faWQsXG5cdFx0XHR9KVxuXHRcdH1cblx0XHR0aGlzLmF0TGVhc3RQYXJ0aWFsbHlMb2dnZWRJbiA9IHRydWVcblx0XHR0aGlzLnBhcnRpYWxMb2dpbi5yZXNvbHZlKClcblx0fVxuXG5cdGFzeW5jIGNyZWF0ZUV4dGVybmFsU2Vzc2lvbihcblx0XHR1c2VySWQ6IElkLFxuXHRcdHBhc3N3b3JkOiBzdHJpbmcsXG5cdFx0c2FsdDogVWludDhBcnJheSxcblx0XHRrZGZUeXBlOiBLZGZUeXBlLFxuXHRcdGNsaWVudElkZW50aWZpZXI6IHN0cmluZyxcblx0XHRzZXNzaW9uVHlwZTogU2Vzc2lvblR5cGUsXG5cdCk6IFByb21pc2U8Q3JlZGVudGlhbHM+IHtcblx0XHRjb25zdCBwZXJzaXN0ZW50U2Vzc2lvbiA9IHNlc3Npb25UeXBlID09PSBTZXNzaW9uVHlwZS5QZXJzaXN0ZW50XG5cdFx0Y29uc3QgeyB1c2VyLCBjcmVkZW50aWFscywgc2Vzc2lvbklkLCB1c2VyR3JvdXBJbmZvIH0gPSBhd2FpdCB0aGlzLmxvZ2luRmFjYWRlLmNyZWF0ZUV4dGVybmFsU2Vzc2lvbihcblx0XHRcdHVzZXJJZCxcblx0XHRcdHBhc3N3b3JkLFxuXHRcdFx0c2FsdCxcblx0XHRcdGtkZlR5cGUsXG5cdFx0XHRjbGllbnRJZGVudGlmaWVyLFxuXHRcdFx0cGVyc2lzdGVudFNlc3Npb24sXG5cdFx0KVxuXHRcdGF3YWl0IHRoaXMub25QYXJ0aWFsTG9naW5TdWNjZXNzKFxuXHRcdFx0e1xuXHRcdFx0XHR1c2VyLFxuXHRcdFx0XHRhY2Nlc3NUb2tlbjogY3JlZGVudGlhbHMuYWNjZXNzVG9rZW4sXG5cdFx0XHRcdHNlc3Npb25UeXBlLFxuXHRcdFx0XHRzZXNzaW9uSWQsXG5cdFx0XHRcdHVzZXJHcm91cEluZm8sXG5cdFx0XHRcdGxvZ2luVXNlcm5hbWU6IHVzZXJJZCxcblx0XHRcdH0sXG5cdFx0XHRTZXNzaW9uVHlwZS5Mb2dpbixcblx0XHQpXG5cdFx0cmV0dXJuIGNyZWRlbnRpYWxzXG5cdH1cblxuXHQvKipcblx0ICogUmVzdW1lIGFuIGV4aXN0aW5nIHNlc3Npb24gdXNpbmcgc3RvcmVkIGNyZWRlbnRpYWxzLCBtYXkgb3IgbWF5IG5vdCB1bmxvY2sgYSBwZXJzaXN0ZW50IGxvY2FsIGRhdGFiYXNlXG5cdCAqIEBwYXJhbSB1bmVuY3J5cHRlZENyZWRlbnRpYWxzIFRoZSBzdG9yZWQgY3JlZGVudGlhbHMgYW5kIG9wdGlvbmFsIGRhdGFiYXNlIGtleSBmb3IgdGhlIG9mZmxpbmUgZGJcblx0ICogQHBhcmFtIGV4dGVybmFsVXNlcktleURlcml2ZXIgVGhlIEtERiB0eXBlIGFuZCBzYWx0IHRvIHJlc3VtZSBhIHNlc3Npb25cblx0ICogQHBhcmFtIG9mZmxpbmVUaW1lUmFuZ2VEYXlzIHRoZSB1c2VyIGNvbmZpZ3VyZWQgdGltZSByYW5nZSBmb3IgdGhlaXIgb2ZmbGluZSBzdG9yYWdlLCB1c2VkIHRvIGluaXRpYWxpemUgdGhlIG9mZmxpbmUgZGJcblx0ICovXG5cdGFzeW5jIHJlc3VtZVNlc3Npb24oXG5cdFx0dW5lbmNyeXB0ZWRDcmVkZW50aWFsczogVW5lbmNyeXB0ZWRDcmVkZW50aWFscyxcblx0XHRleHRlcm5hbFVzZXJLZXlEZXJpdmVyPzogRXh0ZXJuYWxVc2VyS2V5RGVyaXZlciB8IG51bGwsXG5cdFx0b2ZmbGluZVRpbWVSYW5nZURheXM/OiBudW1iZXIgfCBudWxsLFxuXHQpOiBQcm9taXNlPFJlc3VtZVNlc3Npb25SZXN1bHQ+IHtcblx0XHRjb25zdCB7IHVuZW5jcnlwdGVkVG9DcmVkZW50aWFscyB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vLi4vbWlzYy9jcmVkZW50aWFscy9DcmVkZW50aWFscy5qc1wiKVxuXHRcdGNvbnN0IGNyZWRlbnRpYWxzID0gdW5lbmNyeXB0ZWRUb0NyZWRlbnRpYWxzKHVuZW5jcnlwdGVkQ3JlZGVudGlhbHMpXG5cdFx0Y29uc3QgcmVzdW1lUmVzdWx0ID0gYXdhaXQgdGhpcy5sb2dpbkZhY2FkZS5yZXN1bWVTZXNzaW9uKFxuXHRcdFx0Y3JlZGVudGlhbHMsXG5cdFx0XHRleHRlcm5hbFVzZXJLZXlEZXJpdmVyID8/IG51bGwsXG5cdFx0XHR1bmVuY3J5cHRlZENyZWRlbnRpYWxzLmRhdGFiYXNlS2V5ID8/IG51bGwsXG5cdFx0XHRvZmZsaW5lVGltZVJhbmdlRGF5cyA/PyBudWxsLFxuXHRcdClcblx0XHRpZiAocmVzdW1lUmVzdWx0LnR5cGUgPT09IFwiZXJyb3JcIikge1xuXHRcdFx0cmV0dXJuIHJlc3VtZVJlc3VsdFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCB7IHVzZXIsIHVzZXJHcm91cEluZm8sIHNlc3Npb25JZCB9ID0gcmVzdW1lUmVzdWx0LmRhdGFcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMub25QYXJ0aWFsTG9naW5TdWNjZXNzKFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHVzZXIsXG5cdFx0XHRcdFx0XHRhY2Nlc3NUb2tlbjogY3JlZGVudGlhbHMuYWNjZXNzVG9rZW4sXG5cdFx0XHRcdFx0XHR1c2VyR3JvdXBJbmZvLFxuXHRcdFx0XHRcdFx0c2Vzc2lvbklkLFxuXHRcdFx0XHRcdFx0c2Vzc2lvblR5cGU6IFNlc3Npb25UeXBlLlBlcnNpc3RlbnQsXG5cdFx0XHRcdFx0XHRsb2dpblVzZXJuYW1lOiBjcmVkZW50aWFscy5sb2dpbixcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFNlc3Npb25UeXBlLlBlcnNpc3RlbnQsXG5cdFx0XHRcdClcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0Ly8gU29tZSBwYXJ0cyBvZiBpbml0aWFsaXphdGlvbiBjYW4gZmFpbCBhbmQgd2Ugc2hvdWxkIHJlc2V0IHRoZSBzdGF0ZSwgYm90aCBvbiB0aGlzIHNpZGUgYW5kIHRoZSB3b3JrZXJcblx0XHRcdFx0Ly8gc2lkZSwgb3RoZXJ3aXNlIGxvZ2luIGNhbm5vdCBiZSBhdHRlbXB0ZWQgYWdhaW5cblx0XHRcdFx0Y29uc29sZS5sb2coXCJFcnJvciBmaW5pc2hpbmcgbG9naW4sIGxvZ2dpbmcgb3V0IG5vdyFcIiwgZSlcblx0XHRcdFx0YXdhaXQgdGhpcy5sb2dvdXQoZmFsc2UpXG5cdFx0XHRcdHRocm93IGVcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHsgdHlwZTogXCJzdWNjZXNzXCIgfVxuXHRcdH1cblx0fVxuXG5cdGlzVXNlckxvZ2dlZEluKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLnVzZXJDb250cm9sbGVyICE9IG51bGxcblx0fVxuXG5cdGlzRnVsbHlMb2dnZWRJbigpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5mdWxseUxvZ2dlZEluXG5cdH1cblxuXHRpc0F0TGVhc3RQYXJ0aWFsbHlMb2dnZWRJbigpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5hdExlYXN0UGFydGlhbGx5TG9nZ2VkSW5cblx0fVxuXG5cdHdhaXRGb3JQYXJ0aWFsTG9naW4oKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMucGFydGlhbExvZ2luLnByb21pc2Vcblx0fVxuXG5cdGFzeW5jIHdhaXRGb3JGdWxsTG9naW4oKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gRnVsbCBsb2dpbiBldmVudCBtaWdodCBiZSByZWNlaXZlZCBiZWZvcmUgd2UgZmluaXNoIHVzZXJMb2dpbiBvbiB0aGUgY2xpZW50IHNpZGUgYmVjYXVzZSB0aGV5IGFyZSBkb25lIGluIHBhcmFsbGVsLlxuXHRcdC8vIFNvIHdlIG1ha2Ugc3VyZSB0byB3YWl0IGZvciB1c2VyTG9naW4gZmlyc3QuXG5cdFx0YXdhaXQgdGhpcy53YWl0Rm9yUGFydGlhbExvZ2luKClcblx0XHRjb25zdCBsb2dpbkxpc3RlbmVyID0gYXdhaXQgdGhpcy5sb2dpbkxpc3RlbmVyKClcblx0XHRyZXR1cm4gbG9naW5MaXN0ZW5lci53YWl0Rm9yRnVsbExvZ2luKClcblx0fVxuXG5cdGlzSW50ZXJuYWxVc2VyTG9nZ2VkSW4oKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuaXNVc2VyTG9nZ2VkSW4oKSAmJiB0aGlzLmdldFVzZXJDb250cm9sbGVyKCkuaXNJbnRlcm5hbFVzZXIoKVxuXHR9XG5cblx0aXNHbG9iYWxBZG1pblVzZXJMb2dnZWRJbigpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5pc1VzZXJMb2dnZWRJbigpICYmIHRoaXMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0dsb2JhbEFkbWluKClcblx0fVxuXG5cdGdldFVzZXJDb250cm9sbGVyKCk6IFVzZXJDb250cm9sbGVyIHtcblx0XHRyZXR1cm4gYXNzZXJ0Tm90TnVsbCh0aGlzLnVzZXJDb250cm9sbGVyKSAvLyBvbmx5IHRvIGJlIHVzZWQgYWZ0ZXIgbG9naW4gKHdoZW4gdXNlciBpcyBkZWZpbmVkKVxuXHR9XG5cblx0aXNFbmFibGVkKGZlYXR1cmU6IEZlYXR1cmVUeXBlKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuY3VzdG9taXphdGlvbnMgIT0gbnVsbCA/IHRoaXMuY3VzdG9taXphdGlvbnMuaW5kZXhPZihmZWF0dXJlKSAhPT0gLTEgOiBmYWxzZVxuXHR9XG5cblx0YXN5bmMgbG9hZEN1c3RvbWl6YXRpb25zKGNhY2hlTW9kZTogQ2FjaGVNb2RlID0gQ2FjaGVNb2RlLlJlYWRBbmRXcml0ZSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICh0aGlzLmdldFVzZXJDb250cm9sbGVyKCkuaXNJbnRlcm5hbFVzZXIoKSkge1xuXHRcdFx0Y29uc3QgY3VzdG9tZXIgPSBhd2FpdCB0aGlzLmdldFVzZXJDb250cm9sbGVyKCkubG9hZEN1c3RvbWVyKGNhY2hlTW9kZSlcblx0XHRcdHRoaXMuY3VzdG9taXphdGlvbnMgPSBjdXN0b21lci5jdXN0b21pemF0aW9ucy5tYXAoKGYpID0+IGYuZmVhdHVyZSlcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogUmVzZXQgbG9naW4gc3RhdGUsIGRlbGV0ZSBzZXNzaW9uLCBpZiBub3Qge0BsaW5rIFNlc3Npb25UeXBlLlBlcnNpc3RlbnR9LlxuXHQgKiBAcGFyYW0gc3luYyB3aGV0aGVyIHRvIHRyeSBhbmQgY2xvc2UgdGhlIHNlc3Npb24gYmVmb3JlIHRoZSB3aW5kb3cgaXMgY2xvc2VkXG5cdCAqL1xuXHRhc3luYyBsb2dvdXQoc3luYzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuXHRcdC8vIG1ha2UgYWxsIHBhcnRzIG9mIExvZ2luQ29udHJvbGxlciB1c2FibGUgZm9yIGFub3RoZXIgbG9naW5cblx0XHRpZiAodGhpcy51c2VyQ29udHJvbGxlcikge1xuXHRcdFx0YXdhaXQgdGhpcy51c2VyQ29udHJvbGxlci5kZWxldGVTZXNzaW9uKHN5bmMpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUubG9nKFwiTm8gc2Vzc2lvbiB0byBkZWxldGVcIilcblx0XHR9XG5cdFx0Ly8gVXNpbmcgdGhpcyBvdmVyIExvZ2luRmFjYWRlLnJlc2V0U2Vzc2lvbigpIHRvIHJlc2V0IGFsbCBhcHAgc3RhdGUgdGhhdCBtaWdodCBoYXZlIGJlZW4gYWxyZWFkeSBib3VuZCB0b1xuXHRcdC8vIGEgdXNlciBvbiB0aGUgd29ya2VyIHNpZGUuXG5cdFx0YXdhaXQgdGhpcy5yZXNldEFwcFN0YXRlKClcblx0XHR0aGlzLnVzZXJDb250cm9sbGVyID0gbnVsbFxuXHRcdHRoaXMucGFydGlhbExvZ2luID0gZGVmZXIoKVxuXHRcdHRoaXMuZnVsbHlMb2dnZWRJbiA9IGZhbHNlXG5cdFx0Y29uc3QgbG9naW5MaXN0ZW5lciA9IGF3YWl0IHRoaXMubG9naW5MaXN0ZW5lcigpXG5cdFx0bG9naW5MaXN0ZW5lci5yZXNldCgpXG5cdFx0dGhpcy5pbml0KClcblx0fVxuXG5cdGFzeW5jIF9kZXRlcm1pbmVJZldoaXRlbGFiZWwoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5faXNXaGl0ZWxhYmVsID0gYXdhaXQgdGhpcy5nZXRVc2VyQ29udHJvbGxlcigpLmlzV2hpdGVsYWJlbEFjY291bnQoKVxuXHR9XG5cblx0aXNXaGl0ZWxhYmVsKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLl9pc1doaXRlbGFiZWxcblx0fVxuXG5cdC8qKlxuXHQgKiBEZWxldGVzIHRoZSBzZXNzaW9uIG9uIHRoZSBzZXJ2ZXIuXG5cdCAqIEBwYXJhbSBjcmVkZW50aWFsc1xuXHQgKiBAcGFyYW0gcHVzaElkZW50aWZpZXIgaWRlbnRpZmllciBhc3NvY2lhdGVkIHdpdGggdGhpcyBkZXZpY2UsIGlmIGFueSwgdG8gZGVsZXRlIFB1c2hJZGVudGlmaWVyIG9uIHRoZSBzZXJ2ZXJcblx0ICovXG5cdGFzeW5jIGRlbGV0ZU9sZFNlc3Npb24oY3JlZGVudGlhbHM6IFVuZW5jcnlwdGVkQ3JlZGVudGlhbHMsIHB1c2hJZGVudGlmaWVyOiBzdHJpbmcgfCBudWxsID0gbnVsbCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmxvZ2luRmFjYWRlLmRlbGV0ZVNlc3Npb24oY3JlZGVudGlhbHMuYWNjZXNzVG9rZW4sIHB1c2hJZGVudGlmaWVyKVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcInNlc3Npb24gYWxyZWFkeSBkZWxldGVkXCIpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBlXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgcmV0cnlBc3luY0xvZ2luKCkge1xuXHRcdGNvbnN0IGxvZ2luTGlzdGVuZXIgPSBhd2FpdCB0aGlzLmxvZ2luTGlzdGVuZXIoKVxuXHRcdGxvZ2luTGlzdGVuZXIub25SZXRyeUxvZ2luKClcblx0XHRhd2FpdCB0aGlzLmxvZ2luRmFjYWRlLnJldHJ5QXN5bmNMb2dpbigpXG5cdH1cbn1cbiIsImltcG9ydCB7IGNyZWF0ZU5ld3NJbiwgTmV3c0lkLCBOZXdzT3V0IH0gZnJvbSBcIi4uLy4uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBJU2VydmljZUV4ZWN1dG9yIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vU2VydmljZVJlcXVlc3QuanNcIlxuaW1wb3J0IHsgTmV3c1NlcnZpY2UgfSBmcm9tIFwiLi4vLi4vYXBpL2VudGl0aWVzL3R1dGFub3RhL1NlcnZpY2VzLmpzXCJcbmltcG9ydCB7IE5vdEZvdW5kRXJyb3IgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9lcnJvci9SZXN0RXJyb3IuanNcIlxuaW1wb3J0IHsgTmV3c0xpc3RJdGVtIH0gZnJvbSBcIi4vTmV3c0xpc3RJdGVtLmpzXCJcbmltcG9ydCB7IGlzSU9TQXBwIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vRW52LmpzXCJcblxuLyoqXG4gKiBJbnRlcmZhY2UgZm9yIHN0b3JpbmcgaW5mb3JtYXRpb24gYWJvdXQgZGlzcGxheWVkIG5ld3MgaXRlbXMgb24gdGhlIGRldmljZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBOZXdzSXRlbVN0b3JhZ2Uge1xuXHRhY2tub3dsZWRnZU5ld3NJdGVtRm9yRGV2aWNlKG5ld3NJZDogSWQpOiB2b2lkXG5cblx0aGFzQWNrbm93bGVkZ2VkTmV3c0l0ZW1Gb3JEZXZpY2UobmV3c0lkOiBJZCk6IGJvb2xlYW5cbn1cblxuLyoqXG4gKiBNYWtlcyBjYWxscyB0byB0aGUgTmV3c1NlcnZpY2UgaW4gb3JkZXIgdG8gbG9hZCB0aGUgdXNlcidzIHVuYWNrbm93bGVkZ2VkIE5ld3NJdGVtcyBhbmQgc3RvcmVzIHRoZW0uXG4gKi9cbmV4cG9ydCBjbGFzcyBOZXdzTW9kZWwge1xuXHRsaXZlTmV3c0lkczogTmV3c0lkW10gPSBbXVxuXHRsaXZlTmV3c0xpc3RJdGVtczogUmVjb3JkPHN0cmluZywgTmV3c0xpc3RJdGVtPiA9IHt9XG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSBzZXJ2aWNlRXhlY3V0b3I6IElTZXJ2aWNlRXhlY3V0b3IsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBzdG9yYWdlOiBOZXdzSXRlbVN0b3JhZ2UsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBuZXdzTGlzdEl0ZW1GYWN0b3J5OiAobmFtZTogc3RyaW5nKSA9PiBQcm9taXNlPE5ld3NMaXN0SXRlbSB8IG51bGw+LFxuXHQpIHt9XG5cblx0LyoqXG5cdCAqIExvYWRzIHRoZSB1c2VyJ3MgdW5hY2tub3dsZWRnZWQgTmV3c0l0ZW1zLlxuXHQgKi9cblx0YXN5bmMgbG9hZE5ld3NJZHMoKTogUHJvbWlzZTxOZXdzSWRbXT4ge1xuXHRcdGNvbnN0IHJlc3BvbnNlOiBOZXdzT3V0ID0gYXdhaXQgdGhpcy5zZXJ2aWNlRXhlY3V0b3IuZ2V0KE5ld3NTZXJ2aWNlLCBudWxsKVxuXG5cdFx0dGhpcy5saXZlTmV3c0lkcyA9IFtdXG5cdFx0dGhpcy5saXZlTmV3c0xpc3RJdGVtcyA9IHt9XG5cblx0XHRmb3IgKGNvbnN0IG5ld3NJdGVtSWQgb2YgcmVzcG9uc2UubmV3c0l0ZW1JZHMpIHtcblx0XHRcdGNvbnN0IG5ld3NJdGVtTmFtZSA9IG5ld3NJdGVtSWQubmV3c0l0ZW1OYW1lXG5cdFx0XHRjb25zdCBuZXdzTGlzdEl0ZW0gPSBhd2FpdCB0aGlzLm5ld3NMaXN0SXRlbUZhY3RvcnkobmV3c0l0ZW1OYW1lKVxuXG5cdFx0XHRpZiAoISFuZXdzTGlzdEl0ZW0gJiYgKGF3YWl0IG5ld3NMaXN0SXRlbS5pc1Nob3duKG5ld3NJdGVtSWQpKSkge1xuXHRcdFx0XHQvLyB3ZSBjYW4ndCBkaXNwbGF5IHRob3NlIG5ld3MgaXRlbXMgdW5sZXNzIHdlIGFsbG93IGFwcGxlIHBheW1lbnRzXG5cdFx0XHRcdGNvbnN0IHVuc3VwcG9ydGVkSW9zTmV3c0l0ZW0gPSBpc0lPU0FwcCgpICYmIFtcIm5ld1BsYW5zXCIsIFwibmV3UGxhbnNPZmZlckVuZGluZ1wiXS5pbmNsdWRlcyhuZXdzSXRlbUlkLm5ld3NJdGVtTmFtZSlcblx0XHRcdFx0aWYgKCF1bnN1cHBvcnRlZElvc05ld3NJdGVtKSB7XG5cdFx0XHRcdFx0dGhpcy5saXZlTmV3c0lkcy5wdXNoKG5ld3NJdGVtSWQpXG5cdFx0XHRcdFx0dGhpcy5saXZlTmV3c0xpc3RJdGVtc1tuZXdzSXRlbU5hbWVdID0gbmV3c0xpc3RJdGVtXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5saXZlTmV3c0lkc1xuXHR9XG5cblx0LyoqXG5cdCAqIEFja25vd2xlZGdlcyB0aGUgTmV3c0l0ZW0gd2l0aCB0aGUgZ2l2ZW4gSUQuXG5cdCAqL1xuXHRhc3luYyBhY2tub3dsZWRnZU5ld3MobmV3c0l0ZW1JZDogSWQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRjb25zdCBkYXRhID0gY3JlYXRlTmV3c0luKHsgbmV3c0l0ZW1JZCB9KVxuXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuc2VydmljZUV4ZWN1dG9yLnBvc3QoTmV3c1NlcnZpY2UsIGRhdGEpXG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHQvLyBOZXdzSXRlbSBub3QgZm91bmQsIGxpa2VseSBkZWxldGVkIG9uIHRoZSBzZXJ2ZXJcblx0XHRcdFx0Y29uc29sZS5sb2coYENvdWxkIG5vdCBhY2tub3dsZWRnZSBuZXdzSXRlbSB3aXRoIElEICcke25ld3NJdGVtSWR9J2ApXG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH0gZmluYWxseSB7XG5cdFx0XHRhd2FpdCB0aGlzLmxvYWROZXdzSWRzKClcblx0XHR9XG5cdH1cblxuXHRhY2tub3dsZWRnZU5ld3NGb3JEZXZpY2UobmV3c0l0ZW1JZDogSWQpIHtcblx0XHRyZXR1cm4gdGhpcy5zdG9yYWdlLmFja25vd2xlZGdlTmV3c0l0ZW1Gb3JEZXZpY2UobmV3c0l0ZW1JZClcblx0fVxuXG5cdGhhc0Fja25vd2xlZGdlZE5ld3NGb3JEZXZpY2UobmV3c0l0ZW1JZDogSWQpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5zdG9yYWdlLmhhc0Fja25vd2xlZGdlZE5ld3NJdGVtRm9yRGV2aWNlKG5ld3NJdGVtSWQpXG5cdH1cbn1cbiIsImltcG9ydCB7IFdzQ29ubmVjdGlvblN0YXRlIH0gZnJvbSBcIi4uL2FwaS9tYWluL1dvcmtlckNsaWVudC5qc1wiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBpZGVudGl0eSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgQ2xvc2VFdmVudEJ1c09wdGlvbiB9IGZyb20gXCIuLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IFdlYnNvY2tldExlYWRlclN0YXR1cyB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IEV4cG9zZWRFdmVudEJ1cyB9IGZyb20gXCIuLi9hcGkvd29ya2VyL3dvcmtlckludGVyZmFjZXMuanNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIFdlYnNvY2tldENvbm5lY3Rpdml0eUxpc3RlbmVyIHtcblx0dXBkYXRlV2ViU29ja2V0U3RhdGUod3NDb25uZWN0aW9uU3RhdGU6IFdzQ29ubmVjdGlvblN0YXRlKTogUHJvbWlzZTx2b2lkPlxuXHRvbkxlYWRlclN0YXR1c0NoYW5nZWQobGVhZGVyU3RhdHVzOiBXZWJzb2NrZXRMZWFkZXJTdGF0dXMpOiBQcm9taXNlPHZvaWQ+XG59XG5cbi8qKiBBIHdlYiBwYWdlIHRocmVhZCB2aWV3IG9uIHdlYnNvY2tldC9ldmVudCBidXMuICovXG5leHBvcnQgY2xhc3MgV2Vic29ja2V0Q29ubmVjdGl2aXR5TW9kZWwgaW1wbGVtZW50cyBXZWJzb2NrZXRDb25uZWN0aXZpdHlMaXN0ZW5lciB7XG5cdHByaXZhdGUgcmVhZG9ubHkgd3NTdGF0ZSA9IHN0cmVhbTxXc0Nvbm5lY3Rpb25TdGF0ZT4oV3NDb25uZWN0aW9uU3RhdGUudGVybWluYXRlZClcblx0cHJpdmF0ZSBsZWFkZXJTdGF0dXM6IGJvb2xlYW4gPSBmYWxzZVxuXG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgZXZlbnRCdXM6IEV4cG9zZWRFdmVudEJ1cykge31cblxuXHRhc3luYyB1cGRhdGVXZWJTb2NrZXRTdGF0ZSh3c0Nvbm5lY3Rpb25TdGF0ZTogV3NDb25uZWN0aW9uU3RhdGUpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLndzU3RhdGUod3NDb25uZWN0aW9uU3RhdGUpXG5cdH1cblxuXHRhc3luYyBvbkxlYWRlclN0YXR1c0NoYW5nZWQobGVhZGVyU3RhdHVzOiBXZWJzb2NrZXRMZWFkZXJTdGF0dXMpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmxlYWRlclN0YXR1cyA9IGxlYWRlclN0YXR1cy5sZWFkZXJTdGF0dXNcblx0fVxuXG5cdGlzTGVhZGVyKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmxlYWRlclN0YXR1c1xuXHR9XG5cblx0d3NDb25uZWN0aW9uKCk6IHN0cmVhbTxXc0Nvbm5lY3Rpb25TdGF0ZT4ge1xuXHRcdC8vIC5tYXAoKSB0byBtYWtlIGEgZGVmZW5zaXZlIGNvcHlcblx0XHRyZXR1cm4gdGhpcy53c1N0YXRlLm1hcChpZGVudGl0eSlcblx0fVxuXG5cdHRyeVJlY29ubmVjdChjbG9zZUlmT3BlbjogYm9vbGVhbiwgZW5hYmxlQXV0b21hdGljU3RhdGU6IGJvb2xlYW4sIGRlbGF5OiBudW1iZXIgfCBudWxsID0gbnVsbCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLmV2ZW50QnVzLnRyeVJlY29ubmVjdChjbG9zZUlmT3BlbiwgZW5hYmxlQXV0b21hdGljU3RhdGUsIGRlbGF5KVxuXHR9XG5cblx0Y2xvc2Uob3B0aW9uOiBDbG9zZUV2ZW50QnVzT3B0aW9uKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXZlbnRCdXMuY2xvc2Uob3B0aW9uKVxuXHR9XG59XG4iLCJpbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgU3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5cbmV4cG9ydCB0eXBlIE9wZXJhdGlvbklkID0gbnVtYmVyXG5cbmV4cG9ydCB0eXBlIEV4cG9zZWRPcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXIgPSBQaWNrPE9wZXJhdGlvblByb2dyZXNzVHJhY2tlciwgXCJvblByb2dyZXNzXCI+XG5cbi8qKlxuICogVGhpcyBpcyBhIG11bHRpcGxleGVyIGZvciB0cmFja2luZyBpbmRpdmlkdWFsIHJlbW90ZSBhc3luYyBvcGVyYXRpb25zLlxuICogVW5saWtlIHtAbGluayBQcm9ncmVzc1RyYWNrZXJ9IGRvZXMgbm90IGFjY3VtdWxhdGUgdGhlIHByb2dyZXNzIGFuZCBkb2Vzbid0IGNvbXB1dGUgdGhlIHBlcmNlbnRhZ2UgZnJvbSB1bml0cyBvZiB3b3JrLlxuICpcbiAqIHByb2dyZXNzIGlzIHRyYWNrZWQgd2l0aCBudW1iZXJzIGJldHdlZW4gMCBhbmQgMTAwXG4gKi9cbmV4cG9ydCBjbGFzcyBPcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXIge1xuXHRwcml2YXRlIHJlYWRvbmx5IHByb2dyZXNzUGVyT3A6IE1hcDxPcGVyYXRpb25JZCwgU3RyZWFtPG51bWJlcj4+ID0gbmV3IE1hcCgpXG5cdHByaXZhdGUgb3BlcmF0aW9uSWQgPSAwXG5cblx0LyoqXG5cdCAqIFByZXBhcmVzIGEgbmV3IG9wZXJhdGlvbiBhbmQgZ2l2ZXMgYSBoYW5kbGUgZm9yIGl0IHdoaWNoIGNvbnRhaW5zOlxuXHQgKiAgIC0gaWQgZm9yIHNlbmRpbmcgdXBkYXRlc1xuXHQgKiAgIC0gcHJvZ3Jlc3MsIGEgc3RyZWFtIHRvIG9ic2VydmVcblx0ICogICAtIGRvbmUsIGEgaGFuZGxlIHRvIHN0b3AgdHJhY2tpbmcgdGhlIG9wZXJhdGlvbiBwcm9ncmVzc1xuXHQgKi9cblx0c3RhcnROZXdPcGVyYXRpb24oKTogeyBpZDogT3BlcmF0aW9uSWQ7IHByb2dyZXNzOiBTdHJlYW08bnVtYmVyPjsgZG9uZTogKCkgPT4gdW5rbm93biB9IHtcblx0XHRjb25zdCBpZCA9IHRoaXMub3BlcmF0aW9uSWQrK1xuXHRcdGNvbnN0IHByb2dyZXNzID0gc3RyZWFtPG51bWJlcj4oMClcblx0XHR0aGlzLnByb2dyZXNzUGVyT3Auc2V0KGlkLCBwcm9ncmVzcylcblx0XHRyZXR1cm4geyBpZCwgcHJvZ3Jlc3MsIGRvbmU6ICgpID0+IHRoaXMucHJvZ3Jlc3NQZXJPcC5kZWxldGUoaWQpIH1cblx0fVxuXG5cdC8qKiBVcGRhdGVzIHRoZSBwcm9ncmVzcyBmb3Ige0BwYXJhbSBvcGVyYXRpb259IHdpdGgge0BwYXJhbSBwcm9ncmVzc1ZhbHVlfS4gKi9cblx0YXN5bmMgb25Qcm9ncmVzcyhvcGVyYXRpb246IE9wZXJhdGlvbklkLCBwcm9ncmVzc1ZhbHVlOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLnByb2dyZXNzUGVyT3AuZ2V0KG9wZXJhdGlvbik/Lihwcm9ncmVzc1ZhbHVlKVxuXHR9XG59XG4iLCJpbXBvcnQgbSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBzaG93IGFzIHNob3dOb3RpZmljYXRpb25PdmVybGF5IH0gZnJvbSBcIi4vYmFzZS9Ob3RpZmljYXRpb25PdmVybGF5XCJcbmltcG9ydCB7IGxhbmcsIFRyYW5zbGF0aW9uS2V5IH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgYXNzZXJ0TWFpbk9yTm9kZSB9IGZyb20gXCIuLi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBTZWFyY2hJbmRleFN0YXRlSW5mbyB9IGZyb20gXCIuLi9hcGkvd29ya2VyL3NlYXJjaC9TZWFyY2hUeXBlcy5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG5leHBvcnQgaW50ZXJmYWNlIEluZm9NZXNzYWdlIHtcblx0dHJhbnNsYXRpb25LZXk6IFRyYW5zbGF0aW9uS2V5XG5cdGFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT5cbn1cblxuZXhwb3J0IGNsYXNzIEluZm9NZXNzYWdlSGFuZGxlciB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgaGFuZGxlSW5kZXhTdGF0ZVVwZGF0ZTogKHN0YXRlOiBTZWFyY2hJbmRleFN0YXRlSW5mbykgPT4gdm9pZCkge31cblxuXHRhc3luYyBvbkluZm9NZXNzYWdlKG1lc3NhZ2U6IEluZm9NZXNzYWdlKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0c2hvd05vdGlmaWNhdGlvbk92ZXJsYXkoXG5cdFx0XHR7XG5cdFx0XHRcdHZpZXc6ICgpID0+IG0oXCJcIiwgbGFuZy5nZXQobWVzc2FnZS50cmFuc2xhdGlvbktleSwgbWVzc2FnZS5hcmdzKSksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRsYWJlbDogXCJjbG9zZV9hbHRcIixcblx0XHRcdH0sXG5cdFx0XHRbXSxcblx0XHQpXG5cdH1cblxuXHRhc3luYyBvblNlYXJjaEluZGV4U3RhdGVVcGRhdGUoc3RhdGU6IFNlYXJjaEluZGV4U3RhdGVJbmZvKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5oYW5kbGVJbmRleFN0YXRlVXBkYXRlKHN0YXRlKVxuXHR9XG59XG4iLCJpbXBvcnQgeyBQUk9HUkVTU19ET05FIH0gZnJvbSBcIi4vUHJvZ3Jlc3NCYXIuanNcIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgV3NDb25uZWN0aW9uU3RhdGUgfSBmcm9tIFwiLi4vLi4vYXBpL21haW4vV29ya2VyQ2xpZW50LmpzXCJcbmltcG9ydCB7IEV4cG9zZWRDYWNoZVN0b3JhZ2UgfSBmcm9tIFwiLi4vLi4vYXBpL3dvcmtlci9yZXN0L0RlZmF1bHRFbnRpdHlSZXN0Q2FjaGUuanNcIlxuaW1wb3J0IHsgUGFnZUNvbnRleHRMb2dpbkxpc3RlbmVyIH0gZnJvbSBcIi4uLy4uL2FwaS9tYWluL1BhZ2VDb250ZXh0TG9naW5MaXN0ZW5lci5qc1wiXG5pbXBvcnQgeyBMb2dpbkNvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vYXBpL21haW4vTG9naW5Db250cm9sbGVyLmpzXCJcbmltcG9ydCB7IE9mZmxpbmVJbmRpY2F0b3JBdHRycywgT2ZmbGluZUluZGljYXRvclN0YXRlIH0gZnJvbSBcIi4vT2ZmbGluZUluZGljYXRvci5qc1wiXG5pbXBvcnQgeyBXZWJzb2NrZXRDb25uZWN0aXZpdHlNb2RlbCB9IGZyb20gXCIuLi8uLi9taXNjL1dlYnNvY2tldENvbm5lY3Rpdml0eU1vZGVsLmpzXCJcbmltcG9ydCB7IFByb2dyZXNzVHJhY2tlciB9IGZyb20gXCIuLi8uLi9hcGkvbWFpbi9Qcm9ncmVzc1RyYWNrZXIuanNcIlxuaW1wb3J0IHsgc3R5bGVzIH0gZnJvbSBcIi4uL3N0eWxlcy5qc1wiXG5cbi8qKlxuICogdGhlIG9mZmxpbmUgaW5kaWNhdG9yIG11c3QgdGFrZSBpbnRvIGFjY291bnQgaW5mb3JtYXRpb25cbiAqIGZyb20gbXVsdGlwbGUgZGlmZmVyZW50IHNvdXJjZXM6XG4gKiAqIHdzIGNvbm5lY3Rpb24gc3RhdGUgKGNvbm5lY3RlZCwgbm90IGNvbm5lY3RlZCkgZnJvbSB0aGUgd29ya2VyXG4gKiAqIGxvZ2luIHN0YXRlIChsb2dnZWQgb3V0LCBwYXJ0aWFsIGxvZ2luLCBmdWxsIGxvZ2luKVxuICogKiBzeW5jIHByb2dyZXNzXG4gKiAqIGxhc3Qgc3luYyB0aW1lXG4gKlxuICogdGhlIHN0YXRlIG5lY2Vzc2FyeSB0byBkZXRlcm1pbmUgdGhlIHJpZ2h0IGluZGljYXRvciBzdGF0ZSBmcm9tXG4gKiBwcmV2aW91cyB1cGRhdGVzIGZyb20gdGhlc2UgaW5mb3JtYXRpb24gc291cmNlc1xuICogaXMgbWFpbnRhaW5lZCBpbiB0aGlzIGNsYXNzXG4gKi9cbmV4cG9ydCBjbGFzcyBPZmZsaW5lSW5kaWNhdG9yVmlld01vZGVsIHtcblx0cHJpdmF0ZSBsYXN0UHJvZ3Jlc3M6IG51bWJlciA9IFBST0dSRVNTX0RPTkVcblx0cHJpdmF0ZSBsYXN0V3NTdGF0ZTogV3NDb25uZWN0aW9uU3RhdGUgPSBXc0Nvbm5lY3Rpb25TdGF0ZS5jb25uZWN0aW5nXG5cdHByaXZhdGUgbGFzdFVwZGF0ZTogRGF0ZSB8IG51bGwgPSBudWxsXG5cdC8qKlxuXHQgKiBrZWVwaW5nIHRoaXMgcHJldmVudHMgZmxhc2hpbmcgbWlzbGVhZGluZyBzdGF0ZXMgZHVyaW5nIGxvZ2luIHdoZW5cblx0ICogdGhlIGZ1bGwgbG9naW4gc3VjY2VlZGVkIGJ1dCB0aGUgd3MgY29ubmVjdGlvbiBhdHRlbXB0IGRpZG4ndFxuXHQgKiBzdWNjZWVkIG9yIGZhaWwgeWV0LlxuXHQgKiB3c1N0YXRlIGlzIFwiY29ubmVjdGluZ1wiIGJvdGggZHVyaW5nIGZpcnN0IGNvbm5lY3QgYXR0ZW1wdCBhbmQgYWZ0ZXIgd2Vcblx0ICogZGlzY29ubmVjdGVkLlxuXHQgKiovXG5cdHByaXZhdGUgd3NXYXNDb25uZWN0ZWRCZWZvcmU6IGJvb2xlYW4gPSBmYWxzZVxuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY2FjaGVTdG9yYWdlOiBFeHBvc2VkQ2FjaGVTdG9yYWdlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbG9naW5MaXN0ZW5lcjogUGFnZUNvbnRleHRMb2dpbkxpc3RlbmVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY29ubmVjdGl2aXR5TW9kZWw6IFdlYnNvY2tldENvbm5lY3Rpdml0eU1vZGVsLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbG9naW5zOiBMb2dpbkNvbnRyb2xsZXIsXG5cdFx0cHJvZ3Jlc3NUcmFja2VyOiBQcm9ncmVzc1RyYWNrZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjYjogKCkgPT4gdm9pZCxcblx0KSB7XG5cdFx0bG9naW5zLndhaXRGb3JGdWxsTG9naW4oKS50aGVuKCgpID0+IHRoaXMuY2IoKSlcblx0XHR0aGlzLnNldFByb2dyZXNzVXBkYXRlU3RyZWFtKHByb2dyZXNzVHJhY2tlci5vblByb2dyZXNzVXBkYXRlKVxuXHRcdHRoaXMuc2V0V3NTdGF0ZVN0cmVhbSh0aGlzLmNvbm5lY3Rpdml0eU1vZGVsLndzQ29ubmVjdGlvbigpKVxuXHR9XG5cblx0cHJpdmF0ZSBzZXRQcm9ncmVzc1VwZGF0ZVN0cmVhbShwcm9ncmVzc1N0cmVhbTogU3RyZWFtPG51bWJlcj4pOiB2b2lkIHtcblx0XHRwcm9ncmVzc1N0cmVhbS5tYXAoKHByb2dyZXNzKSA9PiB0aGlzLm9uUHJvZ3Jlc3NVcGRhdGUocHJvZ3Jlc3MpKVxuXHRcdHRoaXMub25Qcm9ncmVzc1VwZGF0ZShwcm9ncmVzc1N0cmVhbSgpKVxuXHR9XG5cblx0cHJpdmF0ZSBzZXRXc1N0YXRlU3RyZWFtKHdzU3RyZWFtOiBTdHJlYW08V3NDb25uZWN0aW9uU3RhdGU+KTogdm9pZCB7XG5cdFx0d3NTdHJlYW0ubWFwKChzdGF0ZSkgPT4ge1xuXHRcdFx0dGhpcy5vbldzU3RhdGVDaGFuZ2Uoc3RhdGUpXG5cdFx0fSlcblx0XHR0aGlzLm9uV3NTdGF0ZUNoYW5nZSh3c1N0cmVhbSgpKS50aGVuKClcblx0fVxuXG5cdHByaXZhdGUgb25Qcm9ncmVzc1VwZGF0ZShwcm9ncmVzczogbnVtYmVyKTogdm9pZCB7XG5cdFx0dGhpcy5sYXN0UHJvZ3Jlc3MgPSBwcm9ncmVzc1xuXHRcdHRoaXMuY2IoKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBvbldzU3RhdGVDaGFuZ2UobmV3U3RhdGU6IFdzQ29ubmVjdGlvblN0YXRlKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5sYXN0V3NTdGF0ZSA9IG5ld1N0YXRlXG5cdFx0aWYgKG5ld1N0YXRlICE9PSBXc0Nvbm5lY3Rpb25TdGF0ZS5jb25uZWN0ZWQpIHtcblx0XHRcdGNvbnN0IGxhc3RVcGRhdGUgPSBhd2FpdCB0aGlzLmNhY2hlU3RvcmFnZSEuZ2V0TGFzdFVwZGF0ZVRpbWUoKVxuXHRcdFx0c3dpdGNoIChsYXN0VXBkYXRlLnR5cGUpIHtcblx0XHRcdFx0Y2FzZSBcInJlY29yZGVkXCI6XG5cdFx0XHRcdFx0dGhpcy5sYXN0VXBkYXRlID0gbmV3IERhdGUobGFzdFVwZGF0ZS50aW1lKVxuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdGNhc2UgXCJuZXZlclwiOlxuXHRcdFx0XHQvLyBXZSBjYW4gZ2V0IGludG8gdW5pbml0aWFsaXplZCBzdGF0ZSBhZnRlciB0ZW1wb3JhcnkgbG9naW4gZS5nLiBkdXJpbmcgc2lnbnVwXG5cdFx0XHRcdC8vIGZhbGxzIHRocm91Z2hcblx0XHRcdFx0Y2FzZSBcInVuaW5pdGlhbGl6ZWRcIjpcblx0XHRcdFx0XHR0aGlzLmxhc3RVcGRhdGUgPSBudWxsXG5cdFx0XHRcdFx0dGhpcy53c1dhc0Nvbm5lY3RlZEJlZm9yZSA9IGZhbHNlXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy53c1dhc0Nvbm5lY3RlZEJlZm9yZSA9IHRydWVcblx0XHR9XG5cdFx0dGhpcy5jYigpXG5cdH1cblxuXHRnZXRDdXJyZW50QXR0cnMoKTogT2ZmbGluZUluZGljYXRvckF0dHJzIHtcblx0XHRjb25zdCBpc1NpbmdsZUNvbHVtbiA9IHN0eWxlcy5pc1VzaW5nQm90dG9tTmF2aWdhdGlvbigpXG5cdFx0aWYgKHRoaXMubG9naW5zLmlzRnVsbHlMb2dnZWRJbigpICYmIHRoaXMud3NXYXNDb25uZWN0ZWRCZWZvcmUpIHtcblx0XHRcdGlmICh0aGlzLmxhc3RXc1N0YXRlID09PSBXc0Nvbm5lY3Rpb25TdGF0ZS5jb25uZWN0ZWQpIHtcblx0XHRcdFx0Ly8gbm9ybWFsLCBmdWxsIGxvZ2luIHdpdGggYSBjb25uZWN0ZWQgd2Vic29ja2V0XG5cdFx0XHRcdGlmICh0aGlzLmxhc3RQcm9ncmVzcyA8IFBST0dSRVNTX0RPTkUpIHtcblx0XHRcdFx0XHRyZXR1cm4geyBzdGF0ZTogT2ZmbGluZUluZGljYXRvclN0YXRlLlN5bmNocm9uaXppbmcsIHByb2dyZXNzOiB0aGlzLmxhc3RQcm9ncmVzcywgaXNTaW5nbGVDb2x1bW4gfVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB7IHN0YXRlOiBPZmZsaW5lSW5kaWNhdG9yU3RhdGUuT25saW5lLCBpc1NpbmdsZUNvbHVtbiB9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIG5vcm1hbCwgZnVsbCBsb2dpbiB3aXRoIGEgZGlzY29ubmVjdGVkIHdlYnNvY2tldFxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdHN0YXRlOiBPZmZsaW5lSW5kaWNhdG9yU3RhdGUuT2ZmbGluZSxcblx0XHRcdFx0XHRsYXN0VXBkYXRlOiB0aGlzLmxhc3RVcGRhdGUsXG5cdFx0XHRcdFx0cmVjb25uZWN0QWN0aW9uOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcInRyeSByZWNvbm5lY3Qgd3NcIilcblx0XHRcdFx0XHRcdHRoaXMuY29ubmVjdGl2aXR5TW9kZWwhLnRyeVJlY29ubmVjdCh0cnVlLCB0cnVlLCAyMDAwKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0aXNTaW5nbGVDb2x1bW4sXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gZWl0aGVyIG5vdCBmdWxseSBsb2dnZWQgaW4gb3IgdGhlIHdlYnNvY2tldCB3YXMgbm90IGNvbm5lY3RlZCBiZWZvcmVcblx0XHRcdC8vIGluIGNhc2VzIHdoZXJlIHRoZSBpbmRpY2F0b3IgaXMgdmlzaWJsZSwgdGhpcyBpcyBqdXN0IG9mZmxpbmUgbG9naW4uXG5cdFx0XHRpZiAodGhpcy5sb2dpbkxpc3RlbmVyLmdldEZ1bGxMb2dpbkZhaWxlZCgpKSB7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0c3RhdGU6IE9mZmxpbmVJbmRpY2F0b3JTdGF0ZS5PZmZsaW5lLFxuXHRcdFx0XHRcdGxhc3RVcGRhdGU6IHRoaXMubGFzdFVwZGF0ZSxcblx0XHRcdFx0XHRyZWNvbm5lY3RBY3Rpb246ICgpID0+IHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwidHJ5IGZ1bGwgbG9naW5cIilcblx0XHRcdFx0XHRcdHRoaXMubG9naW5zIS5yZXRyeUFzeW5jTG9naW4oKS5maW5hbGx5KCgpID0+IHRoaXMuY2IoKSlcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGlzU2luZ2xlQ29sdW1uLFxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBwYXJ0aWFsbHkgbG9nZ2VkIGluLCBidXQgdGhlIGxhc3QgbG9naW4gYXR0ZW1wdCBkaWRuJ3QgZmFpbCB5ZXRcblx0XHRcdFx0cmV0dXJuIHsgc3RhdGU6IE9mZmxpbmVJbmRpY2F0b3JTdGF0ZS5Db25uZWN0aW5nLCBpc1NpbmdsZUNvbHVtbiB9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Lypcblx0ICogZ2V0IHRoZSBjdXJyZW50IHByb2dyZXNzIGZvciBzeW5jIG9wZXJhdGlvbnNcblx0ICovXG5cdGdldFByb2dyZXNzKCk6IG51bWJlciB7XG5cdFx0Ly9nZXR0aW5nIHRoZSBwcm9ncmVzcyBsaWtlIHRoaXMgZW5zdXJlcyB0aGF0XG5cdFx0Ly8gdGhlIHByb2dyZXNzIGJhciBhbmQgc3luYyBwZXJjZW50YWdlIGFyZSBjb25zaXN0ZW50XG5cdFx0Y29uc3QgYSA9IHRoaXMuZ2V0Q3VycmVudEF0dHJzKClcblx0XHRyZXR1cm4gYS5zdGF0ZSA9PT0gT2ZmbGluZUluZGljYXRvclN0YXRlLlN5bmNocm9uaXppbmcgJiYgdGhpcy5sb2dpbnM/LmlzVXNlckxvZ2dlZEluKCkgPyBhLnByb2dyZXNzIDogMVxuXHR9XG59XG4iLCJpbXBvcnQgeyB0aHJvdHRsZVJvdXRlIH0gZnJvbSBcIi4uL21pc2MvUm91dGVDaGFuZ2UuanNcIlxuaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgZGVib3VuY2VTdGFydCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuXG4vKiogVVJMLXJlbGF0ZWQgZnVuY3Rpb25zICovXG5leHBvcnQgaW50ZXJmYWNlIFJvdXRlciB7XG5cdGdldEZ1bGxQYXRoKCk6IHN0cmluZ1xuXG5cdC8qKiB3aWxsIGRvIHBhcmFtZXRlciBzdWJzdGl0dXRpb24gbGlrZSBtaXRocmlsIHJvdXRlICovXG5cdHJvdXRlVG8ocGF0aDogc3RyaW5nLCBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT4pOiB2b2lkXG59XG5cbmV4cG9ydCBjbGFzcyBUaHJvdHRsZWRSb3V0ZXIgaW1wbGVtZW50cyBSb3V0ZXIge1xuXHRwcml2YXRlIHJlYWRvbmx5IHRocm90dGxlZFJvdXRlID0gZGVib3VuY2VTdGFydCgzMiwgdGhyb3R0bGVSb3V0ZSgpKVxuXG5cdGdldEZ1bGxQYXRoKCk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIG0ucm91dGUuZ2V0KClcblx0fVxuXG5cdHJvdXRlVG8ocGF0aDogc3RyaW5nLCBwYXJhbXM6IFJlY29yZDxzdHJpbmcsIGFueT4pIHtcblx0XHR0aGlzLnRocm90dGxlZFJvdXRlKHBhdGgsIHBhcmFtcylcblx0fVxufVxuXG4vKiogcm91dGVyIHRoYXQgaXMgc2NvcGVkIHRvIGEgc3BlY2lmaWMgcHJlZml4IGFuZCB3aWxsIGlnbm9yZSB0aGUgcGF0aCBjaGFuZ2VzIG91dHNpZGUgb2YgaXQgKi9cbmV4cG9ydCBjbGFzcyBTY29wZWRSb3V0ZXI8U2NvcGUgZXh0ZW5kcyBzdHJpbmc+IGltcGxlbWVudHMgUm91dGVyIHtcblx0cHJpdmF0ZSByZWFkb25seSBzY29wZTogc3RyaW5nXG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSByb3V0ZXI6IFJvdXRlciwgc2NvcGU6IFNjb3BlKSB7XG5cdFx0aWYgKCFzY29wZS5zdGFydHNXaXRoKFwiL1wiKSkge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoYFNjb3BlIG11c3Qgc3RhcnQgd2l0aCBhIGZvcndhcmQgc2xhc2ghIGdvdDogJHtzY29wZX1gKVxuXHRcdH1cblx0XHRpZiAoc2NvcGUuc3BsaXQoXCIvXCIpLmxlbmd0aCA+IDIpIHtcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKGBEb2VzIG5vdCBzdXBwb3J0IG5lc3RlZCBzY29wZXMgeWV0LiBFYXN0ZXIgZWdnISBnb3Q6ICR7c2NvcGV9YClcblx0XHR9XG5cdFx0dGhpcy5zY29wZSA9IHNjb3BlLnN1YnN0cmluZygxKVxuXHR9XG5cblx0Z2V0RnVsbFBhdGgoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gdGhpcy5yb3V0ZXIuZ2V0RnVsbFBhdGgoKVxuXHR9XG5cblx0cm91dGVUbyhwYXRoOiBzdHJpbmcsIHBhcmFtczogUmVjb3JkPHN0cmluZywgYW55Pikge1xuXHRcdGlmIChyb3V0ZU1hdGNoZXNQcmVmaXgodGhpcy5zY29wZSwgdGhpcy5yb3V0ZXIuZ2V0RnVsbFBhdGgoKSkpIHtcblx0XHRcdHRoaXMucm91dGVyLnJvdXRlVG8ocGF0aCwgcGFyYW1zKVxuXHRcdH1cblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcm91dGVNYXRjaGVzUHJlZml4KHByZWZpeFdpdGhvdXRMZWFkaW5nU2xhc2g6IHN0cmluZywgcm91dGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRjb25zdCB7IHBhdGggfSA9IG0ucGFyc2VQYXRobmFtZShyb3V0ZSlcblx0cmV0dXJuIHBhdGguc3BsaXQoXCIvXCIpWzFdID09PSBwcmVmaXhXaXRob3V0TGVhZGluZ1NsYXNoXG59XG4iLCJpbXBvcnQgdHlwZSB7IEluYm94UnVsZSwgTWFpbCwgTWFpbEZvbGRlciwgTW92ZU1haWxEYXRhIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgY3JlYXRlTW92ZU1haWxEYXRhIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgSW5ib3hSdWxlVHlwZSwgTWFpbFNldEtpbmQsIE1BWF9OQlJfTU9WRV9ERUxFVEVfTUFJTF9TRVJWSUNFIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IGlzRG9tYWluTmFtZSwgaXNSZWd1bGFyRXhwcmVzc2lvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9Gb3JtYXRWYWxpZGF0b3JcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCwgYXN5bmNGaW5kLCBkZWJvdW5jZSwgb2ZDbGFzcywgcHJvbWlzZU1hcCwgc3BsaXRJbkNodW5rcyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgdHlwZSB7IE1haWxib3hEZXRhaWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L01haWxib3hNb2RlbC5qc1wiXG5pbXBvcnQgeyBMb2NrZWRFcnJvciwgUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUmVzdEVycm9yXCJcbmltcG9ydCB0eXBlIHsgU2VsZWN0b3JJdGVtTGlzdCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRHJvcERvd25TZWxlY3Rvci5qc1wiXG5pbXBvcnQgeyBlbGVtZW50SWRQYXJ0LCBpc1NhbWVJZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlsc1wiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBNYWlsRmFjYWRlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9NYWlsRmFjYWRlLmpzXCJcbmltcG9ydCB7IExvZ2luQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vTG9naW5Db250cm9sbGVyLmpzXCJcbmltcG9ydCB7IHRocm90dGxlIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlscy9kaXN0L1V0aWxzLmpzXCJcbmltcG9ydCB7IG1haWxMb2NhdG9yIH0gZnJvbSBcIi4uLy4uL21haWxMb2NhdG9yLmpzXCJcbmltcG9ydCB7IGdldE1haWxIZWFkZXJzIH0gZnJvbSBcIi4vTWFpbFV0aWxzLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5jb25zdCBtb3ZlTWFpbERhdGFQZXJGb2xkZXI6IE1vdmVNYWlsRGF0YVtdID0gW11cbmNvbnN0IERFQk9VTkNFX0ZJUlNUX01PVkVfTUFJTF9SRVFVRVNUX01TID0gMjAwXG5sZXQgYXBwbHlpbmdSdWxlcyA9IGZhbHNlIC8vIHVzZWQgdG8gYXZvaWQgY29uY3VycmVudCBhcHBsaWNhdGlvbiBvZiBydWxlcyAoLT4gcmVxdWVzdHMgdG8gbG9ja2VkIHNlcnZpY2UpXG5cbmFzeW5jIGZ1bmN0aW9uIHNlbmRNb3ZlTWFpbFJlcXVlc3QobWFpbEZhY2FkZTogTWFpbEZhY2FkZSk6IFByb21pc2U8dm9pZD4ge1xuXHRpZiAobW92ZU1haWxEYXRhUGVyRm9sZGVyLmxlbmd0aCkge1xuXHRcdGNvbnN0IG1vdmVUb1RhcmdldEZvbGRlciA9IGFzc2VydE5vdE51bGwobW92ZU1haWxEYXRhUGVyRm9sZGVyLnNoaWZ0KCkpXG5cdFx0Y29uc3QgbWFpbENodW5rcyA9IHNwbGl0SW5DaHVua3MoTUFYX05CUl9NT1ZFX0RFTEVURV9NQUlMX1NFUlZJQ0UsIG1vdmVUb1RhcmdldEZvbGRlci5tYWlscylcblx0XHRhd2FpdCBwcm9taXNlTWFwKG1haWxDaHVua3MsIChtYWlsQ2h1bmspID0+IHtcblx0XHRcdG1vdmVUb1RhcmdldEZvbGRlci5tYWlscyA9IG1haWxDaHVua1xuXHRcdFx0Y29uc3Qgc291cmNlRm9sZGVyID0gYXNzZXJ0Tm90TnVsbChtb3ZlVG9UYXJnZXRGb2xkZXIuc291cmNlRm9sZGVyKSAvLyBvbGQgY2xpZW50cyBkb24ndCBzZW5kIHNvdXJjZUZvbGRlci4gYXNzZXJ0Tm90TnVsbCBjYW4gYmUgcmVtb3ZlZCBvbmNlIHNvdXJjZUZvbGRlciBjYXJkaW5hbGl0eSBpcyBPTkVcblx0XHRcdHJldHVybiBtYWlsRmFjYWRlLm1vdmVNYWlscyhtYWlsQ2h1bmssIHNvdXJjZUZvbGRlciwgbW92ZVRvVGFyZ2V0Rm9sZGVyLnRhcmdldEZvbGRlcilcblx0XHR9KVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKExvY2tlZEVycm9yLCAoZSkgPT4ge1xuXHRcdFx0XHRcdC8vTG9ja2VkRXJyb3Igc2hvdWxkIG5vIGxvbmdlciBiZSB0aHJvd24hPyFcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIm1vdmluZyBtYWlsIGZhaWxlZFwiLCBlLCBtb3ZlVG9UYXJnZXRGb2xkZXIpXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKFByZWNvbmRpdGlvbkZhaWxlZEVycm9yLCAoZSkgPT4ge1xuXHRcdFx0XHRcdC8vIG1vdmUgbWFpbCBvcGVyYXRpb24gbWF5IGhhdmUgYmVlbiBsb2NrZWQgYnkgb3RoZXIgcHJvY2Vzc1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwibW92aW5nIG1haWwgZmFpbGVkXCIsIGUsIG1vdmVUb1RhcmdldEZvbGRlcilcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0XHQuZmluYWxseSgoKSA9PiB7XG5cdFx0XHRcdHJldHVybiBzZW5kTW92ZU1haWxSZXF1ZXN0KG1haWxGYWNhZGUpXG5cdFx0XHR9KVxuXHR9IC8vV2UgYXJlIGRvbmUgYW5kIHVubG9jayBmb3IgZnV0dXJlIHJlcXVlc3RzXG59XG5cbi8vIFdlIHRocm90dGxlIHRoZSBtb3ZlTWFpbCByZXF1ZXN0cyB0byBhIHJhdGUgb2YgMjAwbXNcbi8vIEVhY2ggdGFyZ2V0IGZvbGRlciByZXF1aXJlcyBvbmUgcmVxdWVzdFxuY29uc3QgYXBwbHlNYXRjaGluZ1J1bGVzID0gdGhyb3R0bGUoREVCT1VOQ0VfRklSU1RfTU9WRV9NQUlMX1JFUVVFU1RfTVMsIChtYWlsRmFjYWRlOiBNYWlsRmFjYWRlKSA9PiB7XG5cdGlmIChhcHBseWluZ1J1bGVzKSByZXR1cm5cblx0Ly8gV2UgbG9jayB0byBhdm9pZCBjb25jdXJyZW50IHJlcXVlc3RzXG5cdGFwcGx5aW5nUnVsZXMgPSB0cnVlXG5cdHNlbmRNb3ZlTWFpbFJlcXVlc3QobWFpbEZhY2FkZSkuZmluYWxseSgoKSA9PiB7XG5cdFx0YXBwbHlpbmdSdWxlcyA9IGZhbHNlXG5cdH0pXG59KVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5ib3hSdWxlVHlwZU5hbWVNYXBwaW5nKCk6IFNlbGVjdG9ySXRlbUxpc3Q8c3RyaW5nPiB7XG5cdHJldHVybiBbXG5cdFx0e1xuXHRcdFx0dmFsdWU6IEluYm94UnVsZVR5cGUuRlJPTV9FUVVBTFMsXG5cdFx0XHRuYW1lOiBsYW5nLmdldChcImluYm94UnVsZVNlbmRlckVxdWFsc19hY3Rpb25cIiksXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR2YWx1ZTogSW5ib3hSdWxlVHlwZS5SRUNJUElFTlRfVE9fRVFVQUxTLFxuXHRcdFx0bmFtZTogbGFuZy5nZXQoXCJpbmJveFJ1bGVUb1JlY2lwaWVudEVxdWFsc19hY3Rpb25cIiksXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR2YWx1ZTogSW5ib3hSdWxlVHlwZS5SRUNJUElFTlRfQ0NfRVFVQUxTLFxuXHRcdFx0bmFtZTogbGFuZy5nZXQoXCJpbmJveFJ1bGVDQ1JlY2lwaWVudEVxdWFsc19hY3Rpb25cIiksXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR2YWx1ZTogSW5ib3hSdWxlVHlwZS5SRUNJUElFTlRfQkNDX0VRVUFMUyxcblx0XHRcdG5hbWU6IGxhbmcuZ2V0KFwiaW5ib3hSdWxlQkNDUmVjaXBpZW50RXF1YWxzX2FjdGlvblwiKSxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHZhbHVlOiBJbmJveFJ1bGVUeXBlLlNVQkpFQ1RfQ09OVEFJTlMsXG5cdFx0XHRuYW1lOiBsYW5nLmdldChcImluYm94UnVsZVN1YmplY3RDb250YWluc19hY3Rpb25cIiksXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR2YWx1ZTogSW5ib3hSdWxlVHlwZS5NQUlMX0hFQURFUl9DT05UQUlOUyxcblx0XHRcdG5hbWU6IGxhbmcuZ2V0KFwiaW5ib3hSdWxlTWFpbEhlYWRlckNvbnRhaW5zX2FjdGlvblwiKSxcblx0XHR9LFxuXHRdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmJveFJ1bGVUeXBlTmFtZSh0eXBlOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRsZXQgdHlwZU5hbWVNYXBwaW5nID0gZ2V0SW5ib3hSdWxlVHlwZU5hbWVNYXBwaW5nKCkuZmluZCgodCkgPT4gdC52YWx1ZSA9PT0gdHlwZSlcblx0cmV0dXJuIHR5cGVOYW1lTWFwcGluZyAhPSBudWxsID8gdHlwZU5hbWVNYXBwaW5nLm5hbWUgOiBcIlwiXG59XG5cbmV4cG9ydCBjbGFzcyBJbmJveFJ1bGVIYW5kbGVyIHtcblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBtYWlsRmFjYWRlOiBNYWlsRmFjYWRlLCBwcml2YXRlIHJlYWRvbmx5IGxvZ2luczogTG9naW5Db250cm9sbGVyKSB7fVxuXG5cdC8qKlxuXHQgKiBDaGVja3MgdGhlIG1haWwgZm9yIGFuIGV4aXN0aW5nIGluYm94IHJ1bGUgYW5kIG1vdmVzIHRoZSBtYWlsIHRvIHRoZSB0YXJnZXQgZm9sZGVyIG9mIHRoZSBydWxlLlxuXHQgKiBAcmV0dXJucyB0cnVlIGlmIGEgcnVsZSBtYXRjaGVzIG90aGVyd2lzZSBmYWxzZVxuXHQgKi9cblx0YXN5bmMgZmluZEFuZEFwcGx5TWF0Y2hpbmdSdWxlKG1haWxib3hEZXRhaWw6IE1haWxib3hEZXRhaWwsIG1haWw6IE1haWwsIGFwcGx5UnVsZXNPblNlcnZlcjogYm9vbGVhbik6IFByb21pc2U8eyBmb2xkZXI6IE1haWxGb2xkZXI7IG1haWw6IE1haWwgfSB8IG51bGw+IHtcblx0XHRpZiAoXG5cdFx0XHRtYWlsLl9lcnJvcnMgfHxcblx0XHRcdCFtYWlsLnVucmVhZCB8fFxuXHRcdFx0IShhd2FpdCBpc0luYm94Rm9sZGVyKG1haWxib3hEZXRhaWwsIG1haWwpKSB8fFxuXHRcdFx0IXRoaXMubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuaXNQcmVtaXVtQWNjb3VudCgpIHx8XG5cdFx0XHRtYWlsYm94RGV0YWlsLm1haWxib3guZm9sZGVycyA9PSBudWxsXG5cdFx0KSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblxuXHRcdGNvbnN0IGluYm94UnVsZSA9IGF3YWl0IF9maW5kTWF0Y2hpbmdSdWxlKHRoaXMubWFpbEZhY2FkZSwgbWFpbCwgdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5wcm9wcy5pbmJveFJ1bGVzKVxuXHRcdGlmIChpbmJveFJ1bGUpIHtcblx0XHRcdGNvbnN0IGZvbGRlcnMgPSBhd2FpdCBtYWlsTG9jYXRvci5tYWlsTW9kZWwuZ2V0TWFpbGJveEZvbGRlcnNGb3JJZChtYWlsYm94RGV0YWlsLm1haWxib3guZm9sZGVycy5faWQpXG5cdFx0XHRjb25zdCBpbmJveEZvbGRlciA9IGFzc2VydE5vdE51bGwoZm9sZGVycy5nZXRTeXN0ZW1Gb2xkZXJCeVR5cGUoTWFpbFNldEtpbmQuSU5CT1gpKVxuXHRcdFx0Y29uc3QgdGFyZ2V0Rm9sZGVyID0gZm9sZGVycy5nZXRGb2xkZXJCeUlkKGVsZW1lbnRJZFBhcnQoaW5ib3hSdWxlLnRhcmdldEZvbGRlcikpXG5cblx0XHRcdGlmICh0YXJnZXRGb2xkZXIgJiYgdGFyZ2V0Rm9sZGVyLmZvbGRlclR5cGUgIT09IE1haWxTZXRLaW5kLklOQk9YKSB7XG5cdFx0XHRcdGlmIChhcHBseVJ1bGVzT25TZXJ2ZXIpIHtcblx0XHRcdFx0XHRsZXQgbW92ZU1haWxEYXRhID0gbW92ZU1haWxEYXRhUGVyRm9sZGVyLmZpbmQoKGZvbGRlck1vdmVNYWlsRGF0YSkgPT4gaXNTYW1lSWQoZm9sZGVyTW92ZU1haWxEYXRhLnRhcmdldEZvbGRlciwgaW5ib3hSdWxlLnRhcmdldEZvbGRlcikpXG5cblx0XHRcdFx0XHRpZiAobW92ZU1haWxEYXRhKSB7XG5cdFx0XHRcdFx0XHRtb3ZlTWFpbERhdGEubWFpbHMucHVzaChtYWlsLl9pZClcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0bW92ZU1haWxEYXRhID0gY3JlYXRlTW92ZU1haWxEYXRhKHtcblx0XHRcdFx0XHRcdFx0c291cmNlRm9sZGVyOiBpbmJveEZvbGRlci5faWQsXG5cdFx0XHRcdFx0XHRcdHRhcmdldEZvbGRlcjogaW5ib3hSdWxlLnRhcmdldEZvbGRlcixcblx0XHRcdFx0XHRcdFx0bWFpbHM6IFttYWlsLl9pZF0sXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0bW92ZU1haWxEYXRhUGVyRm9sZGVyLnB1c2gobW92ZU1haWxEYXRhKVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGFwcGx5TWF0Y2hpbmdSdWxlcyh0aGlzLm1haWxGYWNhZGUpXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4geyBmb2xkZXI6IHRhcmdldEZvbGRlciwgbWFpbCB9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblx0fVxufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBmaXJzdCBtYXRjaGluZyBpbmJveCBydWxlIGZvciB0aGUgbWFpbCBhbmQgcmV0dXJucyBpdC5cbiAqIGV4cG9ydCBvbmx5IGZvciB0ZXN0aW5nXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBfZmluZE1hdGNoaW5nUnVsZShtYWlsRmFjYWRlOiBNYWlsRmFjYWRlLCBtYWlsOiBNYWlsLCBydWxlczogSW5ib3hSdWxlW10pOiBQcm9taXNlPEluYm94UnVsZSB8IG51bGw+IHtcblx0cmV0dXJuIGFzeW5jRmluZChydWxlcywgKHJ1bGUpID0+IGNoZWNrSW5ib3hSdWxlKG1haWxGYWNhZGUsIG1haWwsIHJ1bGUpKS50aGVuKCh2KSA9PiB2ID8/IG51bGwpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNoZWNrSW5ib3hSdWxlKG1haWxGYWNhZGU6IE1haWxGYWNhZGUsIG1haWw6IE1haWwsIGluYm94UnVsZTogSW5ib3hSdWxlKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdGNvbnN0IHJ1bGVUeXBlID0gaW5ib3hSdWxlLnR5cGVcblx0dHJ5IHtcblx0XHRpZiAocnVsZVR5cGUgPT09IEluYm94UnVsZVR5cGUuRlJPTV9FUVVBTFMpIHtcblx0XHRcdGxldCBtYWlsQWRkcmVzc2VzID0gW21haWwuc2VuZGVyLmFkZHJlc3NdXG5cblx0XHRcdGlmIChtYWlsLmRpZmZlcmVudEVudmVsb3BlU2VuZGVyKSB7XG5cdFx0XHRcdG1haWxBZGRyZXNzZXMucHVzaChtYWlsLmRpZmZlcmVudEVudmVsb3BlU2VuZGVyKVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gX2NoZWNrRW1haWxBZGRyZXNzZXMobWFpbEFkZHJlc3NlcywgaW5ib3hSdWxlKVxuXHRcdH0gZWxzZSBpZiAocnVsZVR5cGUgPT09IEluYm94UnVsZVR5cGUuUkVDSVBJRU5UX1RPX0VRVUFMUykge1xuXHRcdFx0Y29uc3QgdG9SZWNpcGllbnRzID0gKGF3YWl0IG1haWxGYWNhZGUubG9hZE1haWxEZXRhaWxzQmxvYihtYWlsKSkucmVjaXBpZW50cy50b1JlY2lwaWVudHNcblx0XHRcdHJldHVybiBfY2hlY2tFbWFpbEFkZHJlc3Nlcyhcblx0XHRcdFx0dG9SZWNpcGllbnRzLm1hcCgobSkgPT4gbS5hZGRyZXNzKSxcblx0XHRcdFx0aW5ib3hSdWxlLFxuXHRcdFx0KVxuXHRcdH0gZWxzZSBpZiAocnVsZVR5cGUgPT09IEluYm94UnVsZVR5cGUuUkVDSVBJRU5UX0NDX0VRVUFMUykge1xuXHRcdFx0Y29uc3QgY2NSZWNpcGllbnRzID0gKGF3YWl0IG1haWxGYWNhZGUubG9hZE1haWxEZXRhaWxzQmxvYihtYWlsKSkucmVjaXBpZW50cy5jY1JlY2lwaWVudHNcblx0XHRcdHJldHVybiBfY2hlY2tFbWFpbEFkZHJlc3Nlcyhcblx0XHRcdFx0Y2NSZWNpcGllbnRzLm1hcCgobSkgPT4gbS5hZGRyZXNzKSxcblx0XHRcdFx0aW5ib3hSdWxlLFxuXHRcdFx0KVxuXHRcdH0gZWxzZSBpZiAocnVsZVR5cGUgPT09IEluYm94UnVsZVR5cGUuUkVDSVBJRU5UX0JDQ19FUVVBTFMpIHtcblx0XHRcdGNvbnN0IGJjY1JlY2lwaWVudHMgPSAoYXdhaXQgbWFpbEZhY2FkZS5sb2FkTWFpbERldGFpbHNCbG9iKG1haWwpKS5yZWNpcGllbnRzLmJjY1JlY2lwaWVudHNcblx0XHRcdHJldHVybiBfY2hlY2tFbWFpbEFkZHJlc3Nlcyhcblx0XHRcdFx0YmNjUmVjaXBpZW50cy5tYXAoKG0pID0+IG0uYWRkcmVzcyksXG5cdFx0XHRcdGluYm94UnVsZSxcblx0XHRcdClcblx0XHR9IGVsc2UgaWYgKHJ1bGVUeXBlID09PSBJbmJveFJ1bGVUeXBlLlNVQkpFQ1RfQ09OVEFJTlMpIHtcblx0XHRcdHJldHVybiBfY2hlY2tDb250YWluc1J1bGUobWFpbC5zdWJqZWN0LCBpbmJveFJ1bGUpXG5cdFx0fSBlbHNlIGlmIChydWxlVHlwZSA9PT0gSW5ib3hSdWxlVHlwZS5NQUlMX0hFQURFUl9DT05UQUlOUykge1xuXHRcdFx0Y29uc3QgZGV0YWlscyA9IGF3YWl0IG1haWxGYWNhZGUubG9hZE1haWxEZXRhaWxzQmxvYihtYWlsKVxuXHRcdFx0aWYgKGRldGFpbHMuaGVhZGVycyAhPSBudWxsKSB7XG5cdFx0XHRcdHJldHVybiBfY2hlY2tDb250YWluc1J1bGUoZ2V0TWFpbEhlYWRlcnMoZGV0YWlscy5oZWFkZXJzKSwgaW5ib3hSdWxlKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUud2FybihcIlVua25vd24gcnVsZSB0eXBlOiBcIiwgaW5ib3hSdWxlLnR5cGUpXG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRjb25zb2xlLmVycm9yKFwiRXJyb3IgcHJvY2Vzc2luZyBpbmJveCBydWxlOlwiLCBlLm1lc3NhZ2UpXG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cbn1cblxuZnVuY3Rpb24gX2NoZWNrQ29udGFpbnNSdWxlKHZhbHVlOiBzdHJpbmcsIGluYm94UnVsZTogSW5ib3hSdWxlKTogYm9vbGVhbiB7XG5cdHJldHVybiAoaXNSZWd1bGFyRXhwcmVzc2lvbihpbmJveFJ1bGUudmFsdWUpICYmIF9tYXRjaGVzUmVndWxhckV4cHJlc3Npb24odmFsdWUsIGluYm94UnVsZSkpIHx8IHZhbHVlLmluY2x1ZGVzKGluYm94UnVsZS52YWx1ZSlcbn1cblxuLyoqIGV4cG9ydCBmb3IgdGVzdC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfbWF0Y2hlc1JlZ3VsYXJFeHByZXNzaW9uKHZhbHVlOiBzdHJpbmcsIGluYm94UnVsZTogSW5ib3hSdWxlKTogYm9vbGVhbiB7XG5cdGlmIChpc1JlZ3VsYXJFeHByZXNzaW9uKGluYm94UnVsZS52YWx1ZSkpIHtcblx0XHRsZXQgZmxhZ3MgPSBpbmJveFJ1bGUudmFsdWUucmVwbGFjZSgvLipcXC8oW2dpbXN1eV0qKSQvLCBcIiQxXCIpXG5cdFx0bGV0IHBhdHRlcm4gPSBpbmJveFJ1bGUudmFsdWUucmVwbGFjZShuZXcgUmVnRXhwKFwiXi8oLio/KS9cIiArIGZsYWdzICsgXCIkXCIpLCBcIiQxXCIpXG5cdFx0bGV0IHJlZ0V4cCA9IG5ldyBSZWdFeHAocGF0dGVybiwgZmxhZ3MpXG5cdFx0cmV0dXJuIHJlZ0V4cC50ZXN0KHZhbHVlKVxuXHR9XG5cblx0cmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIF9jaGVja0VtYWlsQWRkcmVzc2VzKG1haWxBZGRyZXNzZXM6IHN0cmluZ1tdLCBpbmJveFJ1bGU6IEluYm94UnVsZSk6IGJvb2xlYW4ge1xuXHRjb25zdCBtYWlsQWRkcmVzcyA9IG1haWxBZGRyZXNzZXMuZmluZCgobWFpbEFkZHJlc3MpID0+IHtcblx0XHRsZXQgY2xlYW5NYWlsQWRkcmVzcyA9IG1haWxBZGRyZXNzLnRvTG93ZXJDYXNlKCkudHJpbSgpXG5cblx0XHRpZiAoaXNSZWd1bGFyRXhwcmVzc2lvbihpbmJveFJ1bGUudmFsdWUpKSB7XG5cdFx0XHRyZXR1cm4gX21hdGNoZXNSZWd1bGFyRXhwcmVzc2lvbihjbGVhbk1haWxBZGRyZXNzLCBpbmJveFJ1bGUpXG5cdFx0fSBlbHNlIGlmIChpc0RvbWFpbk5hbWUoaW5ib3hSdWxlLnZhbHVlKSkge1xuXHRcdFx0bGV0IGRvbWFpbiA9IGNsZWFuTWFpbEFkZHJlc3Muc3BsaXQoXCJAXCIpWzFdXG5cdFx0XHRyZXR1cm4gZG9tYWluID09PSBpbmJveFJ1bGUudmFsdWVcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGNsZWFuTWFpbEFkZHJlc3MgPT09IGluYm94UnVsZS52YWx1ZVxuXHRcdH1cblx0fSlcblx0cmV0dXJuIG1haWxBZGRyZXNzICE9IG51bGxcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzSW5ib3hGb2xkZXIobWFpbGJveERldGFpbDogTWFpbGJveERldGFpbCwgbWFpbDogTWFpbCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRjb25zdCBmb2xkZXJzID0gYXdhaXQgbWFpbExvY2F0b3IubWFpbE1vZGVsLmdldE1haWxib3hGb2xkZXJzRm9ySWQoYXNzZXJ0Tm90TnVsbChtYWlsYm94RGV0YWlsLm1haWxib3guZm9sZGVycykuX2lkKVxuXHRjb25zdCBtYWlsRm9sZGVyID0gZm9sZGVycy5nZXRGb2xkZXJCeU1haWwobWFpbClcblx0cmV0dXJuIG1haWxGb2xkZXI/LmZvbGRlclR5cGUgPT09IE1haWxTZXRLaW5kLklOQk9YXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBsaWI9XCJkb21cIiAvPiAvLyBmaXhlcyBNb3VzZUV2ZW50IGNvbmZsaWN0IHdpdGggcmVhY3RcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vY29tbW9uL0VudlwiXG5pbXBvcnQgdHlwZSB7IEVudHJvcHlTb3VyY2UgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLWNyeXB0b1wiXG5pbXBvcnQgdHlwZSB7IEVudHJvcHlEYXRhQ2h1bmssIEVudHJvcHlGYWNhZGUgfSBmcm9tIFwiLi4vd29ya2VyL2ZhY2FkZXMvRW50cm9weUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tIFwiLi4vY29tbW9uL3V0aWxzL1NjaGVkdWxlci5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG5leHBvcnQgdHlwZSBFbnRyb3B5Q2FsbGJhY2sgPSAoZGF0YTogbnVtYmVyLCBlbnRyb3B5OiBudW1iZXIsIHNvdXJjZTogRW50cm9weVNvdXJjZSkgPT4gdW5rbm93blxuXG4vKipcbiAqIEF1dG9tYXRpY2FsbHkgY29sbGVjdHMgZW50cm9weSBmcm9tIHZhcmlvdXMgZXZlbnRzIGFuZCBzZW5kcyBpdCB0byB0aGUgcmFuZG9taXplciBpbiB0aGUgd29ya2VyIHJlZ3VsYXJseS5cbiAqL1xuZXhwb3J0IGNsYXNzIEVudHJvcHlDb2xsZWN0b3Ige1xuXHQvLyBhY2Nlc3NpYmxlIGZyb20gdGVzdCBjYXNlXG5cdHN0YXRpYyByZWFkb25seSBTRU5EX0lOVEVSVkFMOiBudW1iZXIgPSA1MDAwXG5cblx0cHJpdmF0ZSBzdG9wcGVkOiBib29sZWFuID0gdHJ1ZVxuXHQvLyB0aGUgZW50cm9weSBpcyBjYWNoZWQgYW5kIHRyYW5zbWl0dGVkIHRvIHRoZSB3b3JrZXIgaW4gZGVmaW5lZCBpbnRlcnZhbHNcblx0cHJpdmF0ZSBlbnRyb3B5Q2FjaGU6IEVudHJvcHlEYXRhQ2h1bmtbXSA9IFtdXG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBlbnRyb3B5RmFjYWRlOiBFbnRyb3B5RmFjYWRlLCBwcml2YXRlIHJlYWRvbmx5IHNjaGVkdWxlcjogU2NoZWR1bGVyLCBwcml2YXRlIHJlYWRvbmx5IHdpbmRvdzogV2luZG93KSB7fVxuXG5cdHByaXZhdGUgbW91c2UgPSAoZTogTW91c2VFdmVudCkgPT4ge1xuXHRcdGNvbnN0IHZhbHVlID0gZS5jbGllbnRYIF4gZS5jbGllbnRZXG5cblx0XHR0aGlzLmFkZEVudHJvcHkodmFsdWUsIDIsIFwibW91c2VcIilcblx0fVxuXG5cdHByaXZhdGUga2V5RG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG5cdFx0Y29uc3QgdmFsdWUgPSBlLmtleSA/IGUua2V5LmNoYXJDb2RlQXQoMCkgOiB1bmRlZmluZWRcblx0XHR0aGlzLmFkZEVudHJvcHkodmFsdWUsIDIsIFwia2V5XCIpXG5cdH1cblxuXHRwcml2YXRlIHRvdWNoID0gKGU6IFRvdWNoRXZlbnQpID0+IHtcblx0XHRjb25zdCB2YWx1ZSA9IGUudG91Y2hlc1swXS5jbGllbnRYIF4gZS50b3VjaGVzWzBdLmNsaWVudFlcblxuXHRcdHRoaXMuYWRkRW50cm9weSh2YWx1ZSwgMiwgXCJ0b3VjaFwiKVxuXHR9XG5cblx0LyoqIGUgaXMgYSBEZXZpY2VNb3Rpb25FdmVudCBidXQgaXQncyB0eXBlZCBpbiBhIHZlcnkgYW5ub3lpbmcgd2F5ICovXG5cdHByaXZhdGUgYWNjZWxlcm9tZXRlciA9IChlOiBhbnkpID0+IHtcblx0XHRpZiAoZS5hY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5KSB7XG5cdFx0XHR0aGlzLmFkZEVudHJvcHkoZS5hY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5LnggXiBlLmFjY2VsZXJhdGlvbkluY2x1ZGluZ0dyYXZpdHkueSBeIGUuYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eS56LCAyLCBcImFjY2VsXCIpXG5cdFx0fVxuXG5cdFx0dGhpcy5hZGRFbnRyb3B5KHRoaXMud2luZG93LnNjcmVlbi5vcmllbnRhdGlvbi5hbmdsZSwgMCwgXCJhY2NlbFwiKVxuXHR9XG5cblx0LyoqXG5cdCAqIEFkZHMgZW50cm9weSB0byB0aGUgcmFuZG9tIG51bWJlciBnZW5lcmF0b3IgYWxnb3JpdGhtXG5cdCAqIEBwYXJhbSBkYXRhIEFueSBudW1iZXIgdmFsdWUsIG9yIHVuZGVmaW5lZFxuXHQgKiBAcGFyYW0gZW50cm9weSBUaGUgYW1vdW50IG9mIGVudHJvcHkgaW4gdGhlIG51bWJlciBpbiBiaXQuXG5cdCAqIEBwYXJhbSBzb3VyY2UgVGhlIHNvdXJjZSBvZiB0aGUgbnVtYmVyLiBPbmUgb2YgUmFuZG9taXplckludGVyZmFjZS5FTlRST1BZX1NSQ18qLlxuXHQgKi9cblx0cHJpdmF0ZSBhZGRFbnRyb3B5KGRhdGE6IG51bWJlciB8IHVuZGVmaW5lZCwgZW50cm9weTogbnVtYmVyLCBzb3VyY2U6IEVudHJvcHlTb3VyY2UpIHtcblx0XHRpZiAoZGF0YSkge1xuXHRcdFx0dGhpcy5lbnRyb3B5Q2FjaGUucHVzaCh7XG5cdFx0XHRcdHNvdXJjZTogc291cmNlLFxuXHRcdFx0XHRlbnRyb3B5OiBlbnRyb3B5LFxuXHRcdFx0XHRkYXRhOiBkYXRhLFxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRpZiAodGhpcy53aW5kb3cucGVyZm9ybWFuY2UgJiYgdHlwZW9mIHdpbmRvdy5wZXJmb3JtYW5jZS5ub3cgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0dGhpcy5lbnRyb3B5Q2FjaGUucHVzaCh7XG5cdFx0XHRcdHNvdXJjZTogXCJ0aW1lXCIsXG5cdFx0XHRcdGVudHJvcHk6IDIsXG5cdFx0XHRcdGRhdGE6IHRoaXMud2luZG93LnBlcmZvcm1hbmNlLm5vdygpLFxuXHRcdFx0fSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5lbnRyb3B5Q2FjaGUucHVzaCh7XG5cdFx0XHRcdHNvdXJjZTogXCJ0aW1lXCIsXG5cdFx0XHRcdGVudHJvcHk6IDIsXG5cdFx0XHRcdGRhdGE6IG5ldyBEYXRlKCkudmFsdWVPZigpLFxuXHRcdFx0fSlcblx0XHR9XG5cdH1cblxuXHRzdGFydCgpIHtcblx0XHR0aGlzLmFkZFBlcmZvcm1hbmNlVGltaW5nVmFsdWVzKClcblxuXHRcdHRoaXMud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5tb3VzZSlcblx0XHR0aGlzLndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5tb3VzZSlcblx0XHR0aGlzLndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCB0aGlzLnRvdWNoKVxuXHRcdHRoaXMud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdGhpcy50b3VjaClcblx0XHR0aGlzLndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmtleURvd24pXG5cdFx0dGhpcy53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImRldmljZW1vdGlvblwiLCB0aGlzLmFjY2VsZXJvbWV0ZXIpXG5cblx0XHR0aGlzLnNjaGVkdWxlci5zY2hlZHVsZVBlcmlvZGljKCgpID0+IHRoaXMuc2VuZEVudHJvcHlUb1dvcmtlcigpLCBFbnRyb3B5Q29sbGVjdG9yLlNFTkRfSU5URVJWQUwpXG5cdFx0dGhpcy5zdG9wcGVkID0gZmFsc2Vcblx0fVxuXG5cdHByaXZhdGUgYWRkUGVyZm9ybWFuY2VUaW1pbmdWYWx1ZXMoKSB7XG5cdFx0aWYgKCF0aGlzLndpbmRvdy5wZXJmb3JtYW5jZSkgcmV0dXJuXG5cdFx0Y29uc3QgZW50cmllcyA9IHRoaXMud2luZG93LnBlcmZvcm1hbmNlLmdldEVudHJpZXMoKVxuXHRcdGxldCBhZGRlZDogbnVtYmVyW10gPSBbXVxuXHRcdGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcy5tYXAoKGUpID0+IGUudG9KU09OKCkpKSB7XG5cdFx0XHRmb3IgKGxldCBrZXkgaW4gZW50cnkpIHtcblx0XHRcdFx0Y29uc3QgdmFsdWUgPSBlbnRyeVtrZXldXG5cdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiYgdmFsdWUgIT09IDApIHtcblx0XHRcdFx0XHRpZiAoYWRkZWQuaW5kZXhPZih2YWx1ZSkgPT09IC0xKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmFkZEVudHJvcHkodmFsdWUsIDEsIFwic3RhdGljXCIpXG5cdFx0XHRcdFx0XHRhZGRlZC5wdXNoKHZhbHVlKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBBZGQgZGF0YSBmcm9tIHNlY3VyZSByYW5kb20gc291cmNlIGFzIGVudHJvcHkuXG5cdCAqL1xuXHRwcml2YXRlIGFkZE5hdGl2ZVJhbmRvbVZhbHVlcyhuYnJPZjMyQml0VmFsdWVzOiBudW1iZXIpIHtcblx0XHRsZXQgdmFsdWVMaXN0ID0gbmV3IFVpbnQzMkFycmF5KG5ick9mMzJCaXRWYWx1ZXMpXG5cdFx0dGhpcy53aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyh2YWx1ZUxpc3QpXG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlTGlzdC5sZW5ndGg7IGkrKykge1xuXHRcdFx0Ly8gMzIgYmVjYXVzZSB3ZSBoYXZlIDMyLWJpdCB2YWx1ZXMgVWludDMyQXJyYXlcblx0XHRcdHRoaXMuYWRkRW50cm9weSh2YWx1ZUxpc3RbaV0sIDMyLCBcInJhbmRvbVwiKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgc2VuZEVudHJvcHlUb1dvcmtlcigpIHtcblx0XHRpZiAodGhpcy5lbnRyb3B5Q2FjaGUubGVuZ3RoID4gMCkge1xuXHRcdFx0dGhpcy5hZGROYXRpdmVSYW5kb21WYWx1ZXMoMSlcblxuXHRcdFx0dGhpcy5lbnRyb3B5RmFjYWRlLmFkZEVudHJvcHkodGhpcy5lbnRyb3B5Q2FjaGUpXG5cblx0XHRcdHRoaXMuZW50cm9weUNhY2hlID0gW11cblx0XHR9XG5cdH1cblxuXHRzdG9wKCkge1xuXHRcdHRoaXMuc3RvcHBlZCA9IHRydWVcblx0XHR0aGlzLndpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMubW91c2UpXG5cdFx0dGhpcy53aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlY2xpY2tcIiwgdGhpcy5tb3VzZSlcblx0XHR0aGlzLndpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCB0aGlzLnRvdWNoKVxuXHRcdHRoaXMud2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdGhpcy50b3VjaClcblx0XHR0aGlzLndpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmtleURvd24pXG5cdFx0dGhpcy53aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImRldmljZW1vdGlvblwiLCB0aGlzLmFjY2VsZXJvbWV0ZXIpXG5cdH1cbn1cbiIsImltcG9ydCB7IERhdGFGaWxlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRGF0YUZpbGVcIlxuaW1wb3J0IHsgYXNzZXJ0TWFpbk9yTm9kZSB9IGZyb20gXCIuLi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBGaWxlIGFzIFR1dGFub3RhRmlsZSB9IGZyb20gXCIuLi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgRmlsZUNvbnRyb2xsZXIsIG9wZW5EYXRhRmlsZUluQnJvd3NlciwgUHJvZ3Jlc3NPYnNlcnZlciwgemlwRGF0YUZpbGVzIH0gZnJvbSBcIi4vRmlsZUNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgc29ydGFibGVUaW1lc3RhbXAgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IEJsb2JGYWNhZGUgfSBmcm9tIFwiLi4vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQmxvYkZhY2FkZS5qc1wiXG5pbXBvcnQgeyBhc3NlcnRPbmx5RGF0YUZpbGVzLCBGaWxlUmVmZXJlbmNlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vdXRpbHMvRmlsZVV0aWxzLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbmV4cG9ydCBjbGFzcyBGaWxlQ29udHJvbGxlckJyb3dzZXIgZXh0ZW5kcyBGaWxlQ29udHJvbGxlciB7XG5cdGNvbnN0cnVjdG9yKGJsb2JGYWNhZGU6IEJsb2JGYWNhZGUsIGd1aURvd25sb2FkOiBQcm9ncmVzc09ic2VydmVyKSB7XG5cdFx0c3VwZXIoYmxvYkZhY2FkZSwgZ3VpRG93bmxvYWQpXG5cdH1cblxuXHRhc3luYyBzYXZlRGF0YUZpbGUoZmlsZTogRGF0YUZpbGUpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gb3BlbkRhdGFGaWxlSW5Ccm93c2VyKGZpbGUpXG5cdH1cblxuXHRhc3luYyBkb3dubG9hZEFuZERlY3J5cHQoZmlsZTogVHV0YW5vdGFGaWxlKTogUHJvbWlzZTxEYXRhRmlsZSB8IEZpbGVSZWZlcmVuY2U+IHtcblx0XHRyZXR1cm4gdGhpcy5nZXRBc0RhdGFGaWxlKGZpbGUpXG5cdH1cblxuXHRhc3luYyB3cml0ZURvd25sb2FkZWRGaWxlcyhkb3dubG9hZGVkRmlsZXM6IEFycmF5PEZpbGVSZWZlcmVuY2UgfCBEYXRhRmlsZT4pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAoZG93bmxvYWRlZEZpbGVzLmxlbmd0aCA8IDEpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHRhc3NlcnRPbmx5RGF0YUZpbGVzKGRvd25sb2FkZWRGaWxlcylcblx0XHRjb25zdCBmaWxlVG9TYXZlID0gZG93bmxvYWRlZEZpbGVzLmxlbmd0aCA+IDEgPyBhd2FpdCB6aXBEYXRhRmlsZXMoZG93bmxvYWRlZEZpbGVzLCBgJHtzb3J0YWJsZVRpbWVzdGFtcCgpfS1hdHRhY2htZW50cy56aXBgKSA6IGRvd25sb2FkZWRGaWxlc1swXVxuXHRcdHJldHVybiBhd2FpdCBvcGVuRGF0YUZpbGVJbkJyb3dzZXIoZmlsZVRvU2F2ZSlcblx0fVxuXG5cdGFzeW5jIGNsZWFuVXAoZG93bmxvYWRlZEZpbGVzOiBEYXRhRmlsZVtdKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gdGhlcmUgaXMgbm90aGluZyB0byBkbyBzaW5jZSBub3RoaW5nIGdldHMgc2F2ZWQgdW50aWwgdGhlIGJyb3dzZXIgcHV0cyBpdCBpbnRvIHRoZSBmaW5hbCBsb2NhdGlvblxuXHR9XG5cblx0cHJvdGVjdGVkIGFzeW5jIG9wZW5Eb3dubG9hZGVkRmlsZXMoZG93bmxvYWRlZEZpbGVzOiBBcnJheTxGaWxlUmVmZXJlbmNlIHwgRGF0YUZpbGU+KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gb3BlbmluZyBhbmQgZG93bmxvYWRpbmcgYSBmaWxlIGlzIHRoZSBzYW1lIHRoaW5nIGluIGJyb3dzZXIgZW52aXJvbm1lbnRcblx0XHRyZXR1cm4gYXdhaXQgdGhpcy53cml0ZURvd25sb2FkZWRGaWxlcyhkb3dubG9hZGVkRmlsZXMpXG5cdH1cbn1cbiIsImltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi9ndWkvYmFzZS9EaWFsb2cuanNcIlxuaW1wb3J0IHsgRGF0YUZpbGUgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9EYXRhRmlsZVwiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlLCBpc0FuZHJvaWRBcHAsIGlzQXBwLCBpc0Rlc2t0b3AsIGlzRWxlY3Ryb25DbGllbnQsIGlzSU9TQXBwLCBpc1Rlc3QgfSBmcm9tIFwiLi4vYXBpL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgYXNzZXJ0LCBhc3NlcnROb3ROdWxsLCBwcm9taXNlTWFwLCBzb3J0YWJsZVRpbWVzdGFtcCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgRmlsZSBhcyBUdXRhbm90YUZpbGUgfSBmcm9tIFwiLi4vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGFzc2VydE9ubHlGaWxlUmVmZXJlbmNlcywgRmlsZVJlZmVyZW5jZSB9IGZyb20gXCIuLi9hcGkvY29tbW9uL3V0aWxzL0ZpbGVVdGlsc1wiXG5pbXBvcnQgeyBDYW5jZWxsZWRFcnJvciB9IGZyb20gXCIuLi9hcGkvY29tbW9uL2Vycm9yL0NhbmNlbGxlZEVycm9yXCJcbmltcG9ydCB0eXBlIHsgTmF0aXZlRmlsZUFwcCB9IGZyb20gXCIuLi9uYXRpdmUvY29tbW9uL0ZpbGVBcHAuanNcIlxuaW1wb3J0IHsgQXJjaGl2ZURhdGFUeXBlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgQmxvYkZhY2FkZSB9IGZyb20gXCIuLi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9CbG9iRmFjYWRlLmpzXCJcbmltcG9ydCB7IEZpbGVDb250cm9sbGVyLCBQcm9ncmVzc09ic2VydmVyLCB6aXBEYXRhRmlsZXMgfSBmcm9tIFwiLi9GaWxlQ29udHJvbGxlci5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vZXJyb3IvUHJvZ3JhbW1pbmdFcnJvci5qc1wiXG5pbXBvcnQgeyBjcmVhdGVSZWZlcmVuY2luZ0luc3RhbmNlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vdXRpbHMvQmxvYlV0aWxzLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbi8qKlxuICogY29vcmRpbmF0ZXMgZG93bmxvYWRzIHdoZW4gd2UgaGF2ZSBhY2Nlc3MgdG8gbmF0aXZlIGZ1bmN0aW9uYWxpdHlcbiAqL1xuZXhwb3J0IGNsYXNzIEZpbGVDb250cm9sbGVyTmF0aXZlIGV4dGVuZHMgRmlsZUNvbnRyb2xsZXIge1xuXHRjb25zdHJ1Y3RvcihibG9iRmFjYWRlOiBCbG9iRmFjYWRlLCBndWlEb3dubG9hZDogUHJvZ3Jlc3NPYnNlcnZlciwgcHJpdmF0ZSByZWFkb25seSBmaWxlQXBwOiBOYXRpdmVGaWxlQXBwKSB7XG5cdFx0YXNzZXJ0KGlzRWxlY3Ryb25DbGllbnQoKSB8fCBpc0FwcCgpIHx8IGlzVGVzdCgpLCBcIkRvbid0IG1ha2UgbmF0aXZlIGZpbGUgY29udHJvbGxlciB3aGVuIG5vdCBpbiBuYXRpdmVcIilcblx0XHRzdXBlcihibG9iRmFjYWRlLCBndWlEb3dubG9hZClcblx0fVxuXG5cdHByb3RlY3RlZCBhc3luYyBjbGVhblVwKGZpbGVzOiBBcnJheTxGaWxlUmVmZXJlbmNlIHwgRGF0YUZpbGU+KSB7XG5cdFx0YXNzZXJ0T25seUZpbGVSZWZlcmVuY2VzKGZpbGVzKVxuXHRcdGlmIChmaWxlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLmZpbGVBcHAuZGVsZXRlRmlsZShmaWxlLmxvY2F0aW9uKVxuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJmYWlsZWQgdG8gZGVsZXRlIGZpbGVcIiwgZmlsZS5sb2NhdGlvbiwgZSlcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBEb2VzIG5vdCBkZWxldGUgdGVtcG9yYXJ5IGZpbGUgaW4gYXBwLlxuXHQgKi9cblx0YXN5bmMgc2F2ZURhdGFGaWxlKGZpbGU6IERhdGFGaWxlKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gRm9yIGFwcHMgXCJvcGVuaW5nXCIgRGF0YUZpbGUgY3VycmVudGx5IG1lYW5zIHNhdmluZyBhbmQgb3BlbmluZyBpdC5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgZmlsZVJlZmVyZW5jZSA9IGF3YWl0IHRoaXMuZmlsZUFwcC53cml0ZURhdGFGaWxlKGZpbGUpXG5cdFx0XHRpZiAoaXNBbmRyb2lkQXBwKCkgfHwgaXNEZXNrdG9wKCkpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5maWxlQXBwLnB1dEZpbGVJbnRvRG93bmxvYWRzRm9sZGVyKGZpbGVSZWZlcmVuY2UubG9jYXRpb24sIGZpbGVSZWZlcmVuY2UubmFtZSlcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9IGVsc2UgaWYgKGlzSU9TQXBwKCkpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuZmlsZUFwcC5vcGVuKGZpbGVSZWZlcmVuY2UpXG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBDYW5jZWxsZWRFcnJvcikge1xuXHRcdFx0XHQvLyBuby1vcC4gVXNlciBjYW5jZWxsZWQgZmlsZSBkaWFsb2dcblx0XHRcdFx0Y29uc29sZS5sb2coXCJzYXZlRGF0YUZpbGUgY2FuY2VsbGVkXCIpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oXCJvcGVuRGF0YUZpbGUgZmFpbGVkXCIsIGUpXG5cdFx0XHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFwiY2FuTm90T3BlbkZpbGVPbkRldmljZV9tc2dcIilcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKiogUHVibGljIGZvciB0ZXN0aW5nICovXG5cdGFzeW5jIGRvd25sb2FkQW5kRGVjcnlwdCh0dXRhbm90YUZpbGU6IFR1dGFub3RhRmlsZSk6IFByb21pc2U8RmlsZVJlZmVyZW5jZT4ge1xuXHRcdHJldHVybiBhd2FpdCB0aGlzLmJsb2JGYWNhZGUuZG93bmxvYWRBbmREZWNyeXB0TmF0aXZlKFxuXHRcdFx0QXJjaGl2ZURhdGFUeXBlLkF0dGFjaG1lbnRzLFxuXHRcdFx0Y3JlYXRlUmVmZXJlbmNpbmdJbnN0YW5jZSh0dXRhbm90YUZpbGUpLFxuXHRcdFx0dHV0YW5vdGFGaWxlLm5hbWUsXG5cdFx0XHRhc3NlcnROb3ROdWxsKHR1dGFub3RhRmlsZS5taW1lVHlwZSwgXCJ0cmllZCB0byBjYWxsIGJsb2JmYWNhZGUuZG93bmxvYWRBbmREZWNyeXB0TmF0aXZlIHdpdGggbnVsbCBtaW1lVHlwZVwiKSxcblx0XHQpXG5cdH1cblxuXHRhc3luYyB3cml0ZURvd25sb2FkZWRGaWxlcyhkb3dubG9hZGVkRmlsZXM6IEZpbGVSZWZlcmVuY2VbXSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmIChpc0lPU0FwcCgpKSB7XG5cdFx0XHRhd2FpdCB0aGlzLnByb2Nlc3NEb3dubG9hZGVkRmlsZXNJT1MoZG93bmxvYWRlZEZpbGVzKVxuXHRcdH0gZWxzZSBpZiAoaXNEZXNrdG9wKCkpIHtcblx0XHRcdGF3YWl0IHRoaXMucHJvY2Vzc0Rvd25sb2FkZWRGaWxlc0Rlc2t0b3AoZG93bmxvYWRlZEZpbGVzKVxuXHRcdH0gZWxzZSBpZiAoaXNBbmRyb2lkQXBwKCkpIHtcblx0XHRcdGF3YWl0IHByb21pc2VNYXAoZG93bmxvYWRlZEZpbGVzLCAoZmlsZSkgPT4gdGhpcy5maWxlQXBwLnB1dEZpbGVJbnRvRG93bmxvYWRzRm9sZGVyKGZpbGUubG9jYXRpb24sIGZpbGUubmFtZSkpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwiaW4gZmlsZWNvbnRyb2xsZXIgbmF0aXZlIGJ1dCBub3QgaW4gaW9zLCBhbmRyb2lkIG9yIGRlc2t0b3A/IC0gdHJpZWQgdG8gd3JpdGVcIilcblx0XHR9XG5cdH1cblxuXHRhc3luYyBvcGVuRG93bmxvYWRlZEZpbGVzKGRvd25sb2FkZWRGaWxlczogRmlsZVJlZmVyZW5jZVtdKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKGlzSU9TQXBwKCkpIHtcblx0XHRcdGF3YWl0IHRoaXMucHJvY2Vzc0Rvd25sb2FkZWRGaWxlc0lPUyhkb3dubG9hZGVkRmlsZXMpXG5cdFx0fSBlbHNlIGlmIChpc0Rlc2t0b3AoKSB8fCBpc0FuZHJvaWRBcHAoKSkge1xuXHRcdFx0YXdhaXQgdGhpcy5vcGVuRmlsZXMoZG93bmxvYWRlZEZpbGVzKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcImluIGZpbGVjb250cm9sbGVyIG5hdGl2ZSBidXQgbm90IGluIGlvcywgYW5kcm9pZCBvciBkZXNrdG9wPyAtIHRyaWVkIHRvIG9wZW5cIilcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogZm9yIGRvd25sb2FkaW5nIG11bHRpcGxlIGZpbGVzIG9uIGRlc2t0b3AuIG11bHRpcGxlIGZpbGVzIGFyZSBidW5kbGVkIGluIGEgemlwIGZpbGUsIHNpbmdsZSBmaWxlc1xuXHQgKlxuXHQgKiB3ZSBjb3VsZCB1c2UgdGhlIHNhbWUgc3RyYXRlZ3kgYXMgb24gYW5kcm9pZCwgYnV0XG5cdCAqIGlmIHRoZSB1c2VyIGRvZXNuJ3QgaGF2ZSBhIGRlZmF1bHQgZGwgcGF0aCBzZWxlY3RlZCBvbiBkZXNrdG9wLFxuXHQgKiB0aGUgY2xpZW50IHdpbGwgYXNrIGZvciBhIGxvY2F0aW9uIGZvciBlYWNoIGZpbGUgc2VwYXJhdGVseSwgc28gd2UgemlwIHRoZW0gZm9yIG5vdy5cblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcHJvY2Vzc0Rvd25sb2FkZWRGaWxlc0Rlc2t0b3AoZG93bmxvYWRlZEZpbGVzOiBGaWxlUmVmZXJlbmNlW10pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAoZG93bmxvYWRlZEZpbGVzLmxlbmd0aCA8IDEpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHRjb25zb2xlLmxvZyhcImRvd25sb2FkZWQgZmlsZXMgaW4gcHJvY2Vzc2luZ1wiLCBkb3dubG9hZGVkRmlsZXMpXG5cdFx0Y29uc3QgZGF0YUZpbGVzID0gKGF3YWl0IHByb21pc2VNYXAoZG93bmxvYWRlZEZpbGVzLCAoZikgPT4gdGhpcy5maWxlQXBwLnJlYWREYXRhRmlsZShmLmxvY2F0aW9uKSkpLmZpbHRlcihCb29sZWFuKVxuXHRcdGNvbnN0IGZpbGVJblRlbXAgPVxuXHRcdFx0ZGF0YUZpbGVzLmxlbmd0aCA9PT0gMVxuXHRcdFx0XHQ/IGRvd25sb2FkZWRGaWxlc1swXVxuXHRcdFx0XHQ6IGF3YWl0IHRoaXMuZmlsZUFwcC53cml0ZURhdGFGaWxlKGF3YWl0IHppcERhdGFGaWxlcyhkYXRhRmlsZXMgYXMgQXJyYXk8RGF0YUZpbGU+LCBgJHtzb3J0YWJsZVRpbWVzdGFtcCgpfS1hdHRhY2htZW50cy56aXBgKSlcblx0XHRhd2FpdCB0aGlzLmZpbGVBcHAucHV0RmlsZUludG9Eb3dubG9hZHNGb2xkZXIoZmlsZUluVGVtcC5sb2NhdGlvbiwgZmlsZUluVGVtcC5uYW1lKVxuXHR9XG5cblx0Ly8gb24gaU9TLCB3ZSBkb24ndCBhY3R1YWxseSBzaG93IGRvd25sb2FkQWxsIGFuZCBvcGVuIHRoZSBhdHRhY2htZW50IGltbWVkaWF0ZWx5XG5cdC8vIHRoZSB1c2VyIGlzIHByZXNlbnRlZCB3aXRoIGFuIG9wdGlvbiB0byBzYXZlIHRoZSBmaWxlIHRvIHRoZWlyIGZpbGUgc3lzdGVtIGJ5IHRoZSBPU1xuXHRwcml2YXRlIGFzeW5jIHByb2Nlc3NEb3dubG9hZGVkRmlsZXNJT1MoZG93bmxvYWRlZEZpbGVzOiBGaWxlUmVmZXJlbmNlW10pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRhd2FpdCBwcm9taXNlTWFwKGRvd25sb2FkZWRGaWxlcywgYXN5bmMgKGZpbGUpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMuZmlsZUFwcC5vcGVuKGZpbGUpXG5cdFx0XHR9IGZpbmFsbHkge1xuXHRcdFx0XHRhd2FpdCB0aGlzLmZpbGVBcHAuZGVsZXRlRmlsZShmaWxlLmxvY2F0aW9uKS5jYXRjaCgoZTogYW55KSA9PiBjb25zb2xlLmxvZyhcImZhaWxlZCB0byBkZWxldGUgZmlsZVwiLCBmaWxlLmxvY2F0aW9uLCBlKSlcblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBvcGVuRmlsZXMoZG93bmxvYWRlZEZpbGVzOiBGaWxlUmVmZXJlbmNlW10pOiBQcm9taXNlPHZvaWRbXT4ge1xuXHRcdHJldHVybiBwcm9taXNlTWFwKGRvd25sb2FkZWRGaWxlcywgYXN5bmMgKGZpbGUpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMuZmlsZUFwcC5vcGVuKGZpbGUpXG5cdFx0XHR9IGZpbmFsbHkge1xuXHRcdFx0XHQvLyBvbiBkZXNrdG9wLCB3ZSBkb24ndCBnZXQgdG8ga25vdyB3aGVuIHRoZSBvdGhlciBhcHAgaXMgZG9uZSB3aXRoIHRoZSBmaWxlLCBzbyB3ZSBsZWF2ZSBjbGVhbnVwIHRvIHRoZSBPU1xuXHRcdFx0XHRpZiAoaXNBcHAoKSkgYXdhaXQgdGhpcy5maWxlQXBwLmRlbGV0ZUZpbGUoZmlsZS5sb2NhdGlvbikuY2F0Y2goKGU6IGFueSkgPT4gY29uc29sZS5sb2coXCJmYWlsZWQgdG8gZGVsZXRlIGZpbGVcIiwgZmlsZS5sb2NhdGlvbiwgZSkpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxufVxuIiwiaW1wb3J0IHsgRW50aXR5VXBkYXRlRGF0YSwgaXNVcGRhdGVGb3JUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVVwZGF0ZVV0aWxzLmpzXCJcbmltcG9ydCB7XG5cdENvbnRhY3QsXG5cdENvbnRhY3RUeXBlUmVmLFxuXHRjcmVhdGVDb250YWN0LFxuXHRjcmVhdGVDb250YWN0QWRkcmVzcyxcblx0Y3JlYXRlQ29udGFjdEN1c3RvbURhdGUsXG5cdGNyZWF0ZUNvbnRhY3RNYWlsQWRkcmVzcyxcblx0Y3JlYXRlQ29udGFjdE1lc3NlbmdlckhhbmRsZSxcblx0Y3JlYXRlQ29udGFjdFBob25lTnVtYmVyLFxuXHRjcmVhdGVDb250YWN0UmVsYXRpb25zaGlwLFxuXHRjcmVhdGVDb250YWN0V2Vic2l0ZSxcbn0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgR3JvdXBUeXBlLCBPcGVyYXRpb25UeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IGFzc2VydCwgZGVmZXIsIGdldEZpcnN0T3JUaHJvdywgZ2V0RnJvbU1hcCwgb2ZDbGFzcyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgU3RydWN0dXJlZENvbnRhY3QgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1N0cnVjdHVyZWRDb250YWN0LmpzXCJcbmltcG9ydCB7IGVsZW1lbnRJZFBhcnQsIGdldEVsZW1lbnRJZCwgU3RyaXBwZWRFbnRpdHkgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHtcblx0ZXh0cmFjdFN0cnVjdHVyZWRBZGRyZXNzZXMsXG5cdGV4dHJhY3RTdHJ1Y3R1cmVkQ3VzdG9tRGF0ZXMsXG5cdGV4dHJhY3RTdHJ1Y3R1cmVkTWFpbEFkZHJlc3Nlcyxcblx0ZXh0cmFjdFN0cnVjdHVyZWRNZXNzZW5nZXJIYW5kbGUsXG5cdGV4dHJhY3RTdHJ1Y3R1cmVkUGhvbmVOdW1iZXJzLFxuXHRleHRyYWN0U3RydWN0dXJlZFJlbGF0aW9uc2hpcHMsXG5cdGV4dHJhY3RTdHJ1Y3R1cmVkV2Vic2l0ZXMsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vY29udGFjdHNGdW5jdGlvbmFsaXR5L0NvbnRhY3RVdGlscy5qc1wiXG5pbXBvcnQgeyBMb2dpbkNvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL0xvZ2luQ29udHJvbGxlci5qc1wiXG5pbXBvcnQgeyBFbnRpdHlDbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7IEV2ZW50Q29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vRXZlbnRDb250cm9sbGVyLmpzXCJcbmltcG9ydCB7IENvbnRhY3RNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vY29udGFjdHNGdW5jdGlvbmFsaXR5L0NvbnRhY3RNb2RlbC5qc1wiXG5pbXBvcnQgeyBEZXZpY2VDb25maWcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvRGV2aWNlQ29uZmlnLmpzXCJcbmltcG9ydCB7IFBlcm1pc3Npb25FcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9QZXJtaXNzaW9uRXJyb3IuanNcIlxuaW1wb3J0IHsgTW9iaWxlQ29udGFjdHNGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL01vYmlsZUNvbnRhY3RzRmFjYWRlLmpzXCJcbmltcG9ydCB7IENvbnRhY3RTeW5jUmVzdWx0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9Db250YWN0U3luY1Jlc3VsdC5qc1wiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlLCBpc0FwcCwgaXNJT1NBcHAgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IENvbnRhY3RTdG9yZUVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL0NvbnRhY3RTdG9yZUVycm9yLmpzXCJcbmltcG9ydCB7IE5vdEZvdW5kRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUmVzdEVycm9yLmpzXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nLmpzXCJcbmltcG9ydCB7IHNob3dQcm9ncmVzc0RpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2RpYWxvZ3MvUHJvZ3Jlc3NEaWFsb2cuanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7IFBlcm1pc3Npb25UeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9QZXJtaXNzaW9uVHlwZVwiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3JcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcblxuZXhwb3J0IGNsYXNzIE5hdGl2ZUNvbnRhY3RzU3luY01hbmFnZXIge1xuXHRwcml2YXRlIGVudGl0eVVwZGF0ZUxvY2s6IFByb21pc2U8dm9pZD4gPSBQcm9taXNlLnJlc29sdmUoKVxuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbG9naW5Db250cm9sbGVyOiBMb2dpbkNvbnRyb2xsZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBtb2JpbGVDb250YWN0c0ZhY2FkZTogTW9iaWxlQ29udGFjdHNGYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY29udGFjdE1vZGVsOiBDb250YWN0TW9kZWwsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBkZXZpY2VDb25maWc6IERldmljZUNvbmZpZyxcblx0KSB7XG5cdFx0dGhpcy5ldmVudENvbnRyb2xsZXIuYWRkRW50aXR5TGlzdGVuZXIoKHVwZGF0ZXMpID0+IHRoaXMubmF0aXZlQ29udGFjdEVudGl0eUV2ZW50c0xpc3RlbmVyKHVwZGF0ZXMpKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBuYXRpdmVDb250YWN0RW50aXR5RXZlbnRzTGlzdGVuZXIoZXZlbnRzOiBSZWFkb25seUFycmF5PEVudGl0eVVwZGF0ZURhdGE+KSB7XG5cdFx0YXdhaXQgdGhpcy5lbnRpdHlVcGRhdGVMb2NrXG5cblx0XHRhd2FpdCB0aGlzLnByb2Nlc3NDb250YWN0RXZlbnRVcGRhdGUoZXZlbnRzKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBwcm9jZXNzQ29udGFjdEV2ZW50VXBkYXRlKGV2ZW50czogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGVEYXRhPikge1xuXHRcdGNvbnN0IGxvZ2luVXNlcm5hbWUgPSB0aGlzLmxvZ2luQ29udHJvbGxlci5nZXRVc2VyQ29udHJvbGxlcigpLmxvZ2luVXNlcm5hbWVcblx0XHRjb25zdCB1c2VySWQgPSB0aGlzLmxvZ2luQ29udHJvbGxlci5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJJZFxuXHRcdGNvbnN0IGFsbG93U3luYyA9IHRoaXMuZGV2aWNlQ29uZmlnLmdldFVzZXJTeW5jQ29udGFjdHNXaXRoUGhvbmVQcmVmZXJlbmNlKHVzZXJJZCkgPz8gZmFsc2Vcblx0XHRpZiAoIWFsbG93U3luYykge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Y29uc3QgY29udGFjdHNJZFRvQ3JlYXRlT3JVcGRhdGU6IE1hcDxJZCwgQXJyYXk8SWQ+PiA9IG5ldyBNYXAoKVxuXG5cdFx0Zm9yIChjb25zdCBldmVudCBvZiBldmVudHMpIHtcblx0XHRcdGlmICghaXNVcGRhdGVGb3JUeXBlUmVmKENvbnRhY3RUeXBlUmVmLCBldmVudCkpIGNvbnRpbnVlXG5cdFx0XHRpZiAoZXZlbnQub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLkNSRUFURSkge1xuXHRcdFx0XHRnZXRGcm9tTWFwKGNvbnRhY3RzSWRUb0NyZWF0ZU9yVXBkYXRlLCBldmVudC5pbnN0YW5jZUxpc3RJZCwgKCkgPT4gW10pLnB1c2goZXZlbnQuaW5zdGFuY2VJZClcblx0XHRcdH0gZWxzZSBpZiAoZXZlbnQub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLlVQREFURSkge1xuXHRcdFx0XHRnZXRGcm9tTWFwKGNvbnRhY3RzSWRUb0NyZWF0ZU9yVXBkYXRlLCBldmVudC5pbnN0YW5jZUxpc3RJZCwgKCkgPT4gW10pLnB1c2goZXZlbnQuaW5zdGFuY2VJZClcblx0XHRcdH0gZWxzZSBpZiAoZXZlbnQub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLkRFTEVURSkge1xuXHRcdFx0XHRhd2FpdCB0aGlzLm1vYmlsZUNvbnRhY3RzRmFjYWRlXG5cdFx0XHRcdFx0LmRlbGV0ZUNvbnRhY3RzKGxvZ2luVXNlcm5hbWUsIGV2ZW50Lmluc3RhbmNlSWQpXG5cdFx0XHRcdFx0LmNhdGNoKG9mQ2xhc3MoUGVybWlzc2lvbkVycm9yLCAoZSkgPT4gdGhpcy5oYW5kbGVOb1Blcm1pc3Npb25FcnJvcih1c2VySWQsIGUpKSlcblx0XHRcdFx0XHQuY2F0Y2gob2ZDbGFzcyhDb250YWN0U3RvcmVFcnJvciwgKGUpID0+IGNvbnNvbGUud2FybihcIkNvdWxkIG5vdCBkZWxldGUgY29udGFjdCBkdXJpbmcgc3luYzogXCIsIGUpKSlcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBjb250YWN0c1RvSW5zZXJ0T3JVcGRhdGU6IFN0cnVjdHVyZWRDb250YWN0W10gPSBbXVxuXG5cdFx0Zm9yIChjb25zdCBbbGlzdElkLCBlbGVtZW50SWRzXSBvZiBjb250YWN0c0lkVG9DcmVhdGVPclVwZGF0ZS5lbnRyaWVzKCkpIHtcblx0XHRcdGNvbnN0IGNvbnRhY3RMaXN0ID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZE11bHRpcGxlKENvbnRhY3RUeXBlUmVmLCBsaXN0SWQsIGVsZW1lbnRJZHMpXG5cdFx0XHRjb250YWN0TGlzdC5tYXAoKGNvbnRhY3QpID0+IHtcblx0XHRcdFx0Y29udGFjdHNUb0luc2VydE9yVXBkYXRlLnB1c2goe1xuXHRcdFx0XHRcdGlkOiBnZXRFbGVtZW50SWQoY29udGFjdCksXG5cdFx0XHRcdFx0Zmlyc3ROYW1lOiBjb250YWN0LmZpcnN0TmFtZSxcblx0XHRcdFx0XHRsYXN0TmFtZTogY29udGFjdC5sYXN0TmFtZSxcblx0XHRcdFx0XHRuaWNrbmFtZTogY29udGFjdC5uaWNrbmFtZSA/PyBcIlwiLFxuXHRcdFx0XHRcdGJpcnRoZGF5OiBjb250YWN0LmJpcnRoZGF5SXNvLFxuXHRcdFx0XHRcdGNvbXBhbnk6IGNvbnRhY3QuY29tcGFueSxcblx0XHRcdFx0XHRtYWlsQWRkcmVzc2VzOiBleHRyYWN0U3RydWN0dXJlZE1haWxBZGRyZXNzZXMoY29udGFjdC5tYWlsQWRkcmVzc2VzKSxcblx0XHRcdFx0XHRwaG9uZU51bWJlcnM6IGV4dHJhY3RTdHJ1Y3R1cmVkUGhvbmVOdW1iZXJzKGNvbnRhY3QucGhvbmVOdW1iZXJzKSxcblx0XHRcdFx0XHRhZGRyZXNzZXM6IGV4dHJhY3RTdHJ1Y3R1cmVkQWRkcmVzc2VzKGNvbnRhY3QuYWRkcmVzc2VzKSxcblx0XHRcdFx0XHRyYXdJZDogbnVsbCxcblx0XHRcdFx0XHRjdXN0b21EYXRlOiBleHRyYWN0U3RydWN0dXJlZEN1c3RvbURhdGVzKGNvbnRhY3QuY3VzdG9tRGF0ZSksXG5cdFx0XHRcdFx0ZGVwYXJ0bWVudDogY29udGFjdC5kZXBhcnRtZW50LFxuXHRcdFx0XHRcdG1lc3NlbmdlckhhbmRsZXM6IGV4dHJhY3RTdHJ1Y3R1cmVkTWVzc2VuZ2VySGFuZGxlKGNvbnRhY3QubWVzc2VuZ2VySGFuZGxlcyksXG5cdFx0XHRcdFx0bWlkZGxlTmFtZTogY29udGFjdC5taWRkbGVOYW1lLFxuXHRcdFx0XHRcdG5hbWVTdWZmaXg6IGNvbnRhY3QubmFtZVN1ZmZpeCxcblx0XHRcdFx0XHRwaG9uZXRpY0ZpcnN0OiBjb250YWN0LnBob25ldGljRmlyc3QsXG5cdFx0XHRcdFx0cGhvbmV0aWNMYXN0OiBjb250YWN0LnBob25ldGljTGFzdCxcblx0XHRcdFx0XHRwaG9uZXRpY01pZGRsZTogY29udGFjdC5waG9uZXRpY01pZGRsZSxcblx0XHRcdFx0XHRyZWxhdGlvbnNoaXBzOiBleHRyYWN0U3RydWN0dXJlZFJlbGF0aW9uc2hpcHMoY29udGFjdC5yZWxhdGlvbnNoaXBzKSxcblx0XHRcdFx0XHR3ZWJzaXRlczogZXh0cmFjdFN0cnVjdHVyZWRXZWJzaXRlcyhjb250YWN0LndlYnNpdGVzKSxcblx0XHRcdFx0XHRub3RlczogY29udGFjdC5jb21tZW50LFxuXHRcdFx0XHRcdHRpdGxlOiBjb250YWN0LnRpdGxlID8/IFwiXCIsXG5cdFx0XHRcdFx0cm9sZTogY29udGFjdC5yb2xlLFxuXHRcdFx0XHR9KVxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRpZiAoY29udGFjdHNUb0luc2VydE9yVXBkYXRlLmxlbmd0aCA+IDApIHtcblx0XHRcdGF3YWl0IHRoaXMubW9iaWxlQ29udGFjdHNGYWNhZGVcblx0XHRcdFx0LnNhdmVDb250YWN0cyhsb2dpblVzZXJuYW1lLCBjb250YWN0c1RvSW5zZXJ0T3JVcGRhdGUpXG5cdFx0XHRcdC5jYXRjaChvZkNsYXNzKFBlcm1pc3Npb25FcnJvciwgKGUpID0+IHRoaXMuaGFuZGxlTm9QZXJtaXNzaW9uRXJyb3IodXNlcklkLCBlKSkpXG5cdFx0XHRcdC5jYXRjaChvZkNsYXNzKENvbnRhY3RTdG9yZUVycm9yLCAoZSkgPT4gY29uc29sZS53YXJuKFwiQ291bGQgbm90IHNhdmUgY29udGFjdHM6XCIsIGUpKSlcblx0XHR9XG5cdH1cblxuXHRpc0VuYWJsZWQoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuZGV2aWNlQ29uZmlnLmdldFVzZXJTeW5jQ29udGFjdHNXaXRoUGhvbmVQcmVmZXJlbmNlKHRoaXMubG9naW5Db250cm9sbGVyLmdldFVzZXJDb250cm9sbGVyKCkudXNlcklkKSA/PyBmYWxzZVxuXHR9XG5cblx0LyoqXG5cdCAqIEByZXR1cm4gaXMgc3luYyBzdWNjZWVkZWQuIEl0IG1pZ2h0IGZhaWwgaWYgd2UgZG9uJ3QgaGF2ZSBhIHBlcm1pc3Npb24uXG5cdCAqL1xuXHRhc3luYyBlbmFibGVTeW5jKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IGxvZ2luVXNlcm5hbWUgPSB0aGlzLmxvZ2luQ29udHJvbGxlci5nZXRVc2VyQ29udHJvbGxlcigpLmxvZ2luVXNlcm5hbWVcblx0XHRjb25zdCBjb250YWN0TGlzdElkID0gYXdhaXQgdGhpcy5jb250YWN0TW9kZWwuZ2V0Q29udGFjdExpc3RJZCgpXG5cdFx0aWYgKGNvbnRhY3RMaXN0SWQgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG5cdFx0Y29uc3QgY29udGFjdHMgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkQWxsKENvbnRhY3RUeXBlUmVmLCBjb250YWN0TGlzdElkKVxuXHRcdGNvbnN0IHN0cnVjdHVyZWRDb250YWN0cyA9IGNvbnRhY3RzLm1hcCgoYykgPT4gdGhpcy50b1N0cnVjdHVyZWRDb250YWN0KGMpKVxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLm1vYmlsZUNvbnRhY3RzRmFjYWRlLnN5bmNDb250YWN0cyhsb2dpblVzZXJuYW1lLCBzdHJ1Y3R1cmVkQ29udGFjdHMpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y29uc29sZS53YXJuKFwiQ291bGQgbm90IHN5bmMgY29udGFjdHM6XCIsIGUpXG5cdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFBlcm1pc3Npb25FcnJvcikge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIENvbnRhY3RTdG9yZUVycm9yKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fVxuXG5cdFx0XHR0aHJvdyBlXG5cdFx0fVxuXG5cdFx0dGhpcy5kZXZpY2VDb25maWcuc2V0VXNlclN5bmNDb250YWN0c1dpdGhQaG9uZVByZWZlcmVuY2UodGhpcy5sb2dpbkNvbnRyb2xsZXIuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VySWQsIHRydWUpXG5cdFx0YXdhaXQgdGhpcy5hc2tUb0RlZHVwZUNvbnRhY3RzKHN0cnVjdHVyZWRDb250YWN0cylcblx0XHRyZXR1cm4gdHJ1ZVxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrIGlmIHN5bmNpbmcgY29udGFjdHMgaXMgcG9zc2libGUvYWxsb3dlZCByaWdodCBub3cuXG5cdCAqXG5cdCAqIE9uIEFuZHJvaWQsIHRoaXMgbWV0aG9kIHNpbXBseSByZXF1ZXN0cyBwZXJtaXNzaW9uIHRvIGFjY2VzcyBjb250YWN0cy4gT24gaU9TLCB0aGlzIGFsc28gY2hlY2tzIGlDbG91ZCBzeW5jLCBhc1xuXHQgKiBpdCBjYW4gaW50ZXJmZXJlIHdpdGhcblx0ICovXG5cdGFzeW5jIGNhblN5bmMoKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0aWYgKCFpc0FwcCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIkNhbiBvbmx5IGNoZWNrIENvbnRhY3QgcGVybWlzc2lvbnMgb24gYXBwXCIpXG5cdFx0fVxuXG5cdFx0Y29uc3QgaXNDb250YWN0UGVybWlzc2lvbkdyYW50ZWQgPSBhd2FpdCBsb2NhdG9yLnN5c3RlbVBlcm1pc3Npb25IYW5kbGVyLnJlcXVlc3RQZXJtaXNzaW9uKFBlcm1pc3Npb25UeXBlLkNvbnRhY3RzLCBcImFsbG93Q29udGFjdFJlYWRXcml0ZV9tc2dcIilcblx0XHRpZiAoIWlzQ29udGFjdFBlcm1pc3Npb25HcmFudGVkKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cblx0XHRyZXR1cm4gIWlzSU9TQXBwKCkgfHwgdGhpcy5jaGVja0lmRXh0ZXJuYWxDbG91ZFN5bmNPbklvcygpXG5cdH1cblxuXHQvKipcblx0ICogQ2hlY2sgdGhhdCB3ZSBhcmUgYWxsb3dlZCB0byBzeW5jIGNvbnRhY3RzIG9uIGFuIGlPUyBkZXZpY2Vcblx0ICogQHJldHVybnMgZmFsc2UgaWYgbm8gcGVybWlzc2lvbiBvciBpQ2xvdWQgc3luYyBpcyBlbmFibGVkIGFuZCB0aGUgdXNlciBjYW5jZWxsZWQsIG9yIHRydWUgaWYgcGVybWlzc2lvbiBpcyBncmFudGVkIGFuZCBpQ2xvdWQgc3luYyBpcyBkaXNhYmxlZCAob3IgdGhlIHVzZXIgYnlwYXNzZWQgdGhlIHdhcm5pbmcgZGlhbG9nKVxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBjaGVja0lmRXh0ZXJuYWxDbG91ZFN5bmNPbklvcygpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRhc3NlcnQoaXNJT1NBcHAoKSwgXCJDYW4gb25seSBjaGVjayBjbG91ZCBzeW5jaW5nIG9uIGlPU1wiKVxuXG5cdFx0bGV0IGxvY2FsQ29udGFjdFN0b3JhZ2UgPSBhd2FpdCB0aGlzLm1vYmlsZUNvbnRhY3RzRmFjYWRlLmlzTG9jYWxTdG9yYWdlQXZhaWxhYmxlKClcblx0XHRpZiAoIWxvY2FsQ29udGFjdFN0b3JhZ2UpIHtcblx0XHRcdGNvbnN0IGNob2ljZSA9IGF3YWl0IERpYWxvZy5jaG9pY2VWZXJ0aWNhbChcImV4dGVybmFsQ29udGFjdFN5bmNEZXRlY3RlZFdhcm5pbmdfbXNnXCIsIFtcblx0XHRcdFx0eyB0ZXh0OiBcInNldHRpbmdzX2xhYmVsXCIsIHZhbHVlOiBcInNldHRpbmdzXCIsIHR5cGU6IFwicHJpbWFyeVwiIH0sXG5cdFx0XHRcdHsgdGV4dDogXCJlbmFibGVBbnl3YXlfYWN0aW9uXCIsIHZhbHVlOiBcImVuYWJsZVwiIH0sXG5cdFx0XHRcdHsgdGV4dDogXCJjYW5jZWxfYWN0aW9uXCIsIHZhbHVlOiBcImNhbmNlbFwiIH0sXG5cdFx0XHRdKVxuXHRcdFx0c3dpdGNoIChjaG9pY2UpIHtcblx0XHRcdFx0Y2FzZSBcImVuYWJsZVwiOlxuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdGNhc2UgXCJzZXR0aW5nc1wiOlxuXHRcdFx0XHRcdGxvY2F0b3Iuc3lzdGVtRmFjYWRlLm9wZW5MaW5rKFwiQXBwLXByZWZzOkNPTlRBQ1RTJnBhdGg9QUNDT1VOVFNcIilcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdFx0Y2FzZSBcImNhbmNlbFwiOlxuXHRcdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlXG5cdH1cblxuXHQvKipcblx0ICogQHJldHVybiBpcyBzeW5jIHN1Y2NlZWRlZC4gSXQgbWlnaHQgZmFpbCBpZiB3ZSBkb24ndCBoYXZlIGEgcGVybWlzc2lvbi5cblx0ICovXG5cdGFzeW5jIHN5bmNDb250YWN0cygpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRpZiAoIXRoaXMuaXNFbmFibGVkKCkpIHtcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdH1cblxuXHRcdGNvbnN0IGNvbnRhY3RMaXN0SWQgPSBhd2FpdCB0aGlzLmNvbnRhY3RNb2RlbC5nZXRDb250YWN0TGlzdElkKClcblx0XHRpZiAoY29udGFjdExpc3RJZCA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cblx0XHRjb25zdCB1c2VySWQgPSB0aGlzLmxvZ2luQ29udHJvbGxlci5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJJZFxuXHRcdGNvbnN0IGxvZ2luVXNlcm5hbWUgPSB0aGlzLmxvZ2luQ29udHJvbGxlci5nZXRVc2VyQ29udHJvbGxlcigpLmxvZ2luVXNlcm5hbWVcblx0XHRjb25zdCBjb250YWN0cyA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWRBbGwoQ29udGFjdFR5cGVSZWYsIGNvbnRhY3RMaXN0SWQpXG5cdFx0Y29uc3Qgc3RydWN0dXJlZENvbnRhY3RzOiBSZWFkb25seUFycmF5PFN0cnVjdHVyZWRDb250YWN0PiA9IGNvbnRhY3RzLm1hcCgoY29udGFjdCkgPT4gdGhpcy50b1N0cnVjdHVyZWRDb250YWN0KGNvbnRhY3QpKVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHN5bmNSZXN1bHQgPSBhd2FpdCB0aGlzLm1vYmlsZUNvbnRhY3RzRmFjYWRlLnN5bmNDb250YWN0cyhsb2dpblVzZXJuYW1lLCBzdHJ1Y3R1cmVkQ29udGFjdHMpXG5cdFx0XHRhd2FpdCB0aGlzLmFwcGx5RGV2aWNlQ2hhbmdlc1RvU2VydmVyQ29udGFjdHMoY29udGFjdHMsIHN5bmNSZXN1bHQsIGNvbnRhY3RMaXN0SWQpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBQZXJtaXNzaW9uRXJyb3IpIHtcblx0XHRcdFx0dGhpcy5oYW5kbGVOb1Blcm1pc3Npb25FcnJvcih1c2VySWQsIGUpXG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fSBlbHNlIGlmIChlIGluc3RhbmNlb2YgQ29udGFjdFN0b3JlRXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKFwiQ291bGQgbm90IHN5bmMgY29udGFjdHM6XCIsIGUpXG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0fVxuXG5cdFx0XHR0aHJvdyBlXG5cdFx0fVxuXHRcdHJldHVybiB0cnVlXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGFza1RvRGVkdXBlQ29udGFjdHMoY29udGFjdHNUb0RlZHVwZTogcmVhZG9ubHkgU3RydWN0dXJlZENvbnRhY3RbXSkge1xuXHRcdGNvbnN0IGR1cGxpY2F0ZUNvbnRhY3RzID0gYXdhaXQgdGhpcy5tb2JpbGVDb250YWN0c0ZhY2FkZS5maW5kTG9jYWxNYXRjaGVzKGNvbnRhY3RzVG9EZWR1cGUpXG5cdFx0aWYgKGR1cGxpY2F0ZUNvbnRhY3RzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0Ly8gbm8gZHVwbGljYXRlIGNvbnRhY3RzOyBubyBuZWVkIHRvIGFza1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2hvdWxkRGVkdXBlID0gYXdhaXQgRGlhbG9nLmNvbmZpcm0obGFuZy5nZXRUcmFuc2xhdGlvbihcImltcG9ydENvbnRhY3RSZW1vdmVEdXBsaWNhdGVzQ29uZmlybV9tc2dcIiwgeyBcIntjb3VudH1cIjogZHVwbGljYXRlQ29udGFjdHMubGVuZ3RoIH0pKVxuXHRcdGlmIChzaG91bGREZWR1cGUpIHtcblx0XHRcdGF3YWl0IHNob3dQcm9ncmVzc0RpYWxvZyhcInByb2dyZXNzRGVsZXRpbmdfbXNnXCIsIHRoaXMubW9iaWxlQ29udGFjdHNGYWNhZGUuZGVsZXRlTG9jYWxDb250YWN0cyhkdXBsaWNhdGVDb250YWN0cykpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSB0b1N0cnVjdHVyZWRDb250YWN0KGNvbnRhY3Q6IENvbnRhY3QpOiBTdHJ1Y3R1cmVkQ29udGFjdCB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGlkOiBnZXRFbGVtZW50SWQoY29udGFjdCksXG5cdFx0XHRmaXJzdE5hbWU6IGNvbnRhY3QuZmlyc3ROYW1lLFxuXHRcdFx0bGFzdE5hbWU6IGNvbnRhY3QubGFzdE5hbWUsXG5cdFx0XHRtYWlsQWRkcmVzc2VzOiBleHRyYWN0U3RydWN0dXJlZE1haWxBZGRyZXNzZXMoY29udGFjdC5tYWlsQWRkcmVzc2VzKSxcblx0XHRcdHBob25lTnVtYmVyczogZXh0cmFjdFN0cnVjdHVyZWRQaG9uZU51bWJlcnMoY29udGFjdC5waG9uZU51bWJlcnMpLFxuXHRcdFx0bmlja25hbWU6IGNvbnRhY3Qubmlja25hbWUgPz8gXCJcIixcblx0XHRcdGNvbXBhbnk6IGNvbnRhY3QuY29tcGFueSxcblx0XHRcdGJpcnRoZGF5OiBjb250YWN0LmJpcnRoZGF5SXNvLFxuXHRcdFx0YWRkcmVzc2VzOiBleHRyYWN0U3RydWN0dXJlZEFkZHJlc3Nlcyhjb250YWN0LmFkZHJlc3NlcyksXG5cdFx0XHRyYXdJZDogbnVsbCxcblx0XHRcdGN1c3RvbURhdGU6IGV4dHJhY3RTdHJ1Y3R1cmVkQ3VzdG9tRGF0ZXMoY29udGFjdC5jdXN0b21EYXRlKSxcblx0XHRcdGRlcGFydG1lbnQ6IGNvbnRhY3QuZGVwYXJ0bWVudCxcblx0XHRcdG1lc3NlbmdlckhhbmRsZXM6IGV4dHJhY3RTdHJ1Y3R1cmVkTWVzc2VuZ2VySGFuZGxlKGNvbnRhY3QubWVzc2VuZ2VySGFuZGxlcyksXG5cdFx0XHRtaWRkbGVOYW1lOiBjb250YWN0Lm1pZGRsZU5hbWUsXG5cdFx0XHRuYW1lU3VmZml4OiBjb250YWN0Lm5hbWVTdWZmaXgsXG5cdFx0XHRwaG9uZXRpY0ZpcnN0OiBjb250YWN0LnBob25ldGljRmlyc3QsXG5cdFx0XHRwaG9uZXRpY0xhc3Q6IGNvbnRhY3QucGhvbmV0aWNMYXN0LFxuXHRcdFx0cGhvbmV0aWNNaWRkbGU6IGNvbnRhY3QucGhvbmV0aWNNaWRkbGUsXG5cdFx0XHRyZWxhdGlvbnNoaXBzOiBleHRyYWN0U3RydWN0dXJlZFJlbGF0aW9uc2hpcHMoY29udGFjdC5yZWxhdGlvbnNoaXBzKSxcblx0XHRcdHdlYnNpdGVzOiBleHRyYWN0U3RydWN0dXJlZFdlYnNpdGVzKGNvbnRhY3Qud2Vic2l0ZXMpLFxuXHRcdFx0bm90ZXM6IGNvbnRhY3QuY29tbWVudCxcblx0XHRcdHRpdGxlOiBjb250YWN0LnRpdGxlID8/IFwiXCIsXG5cdFx0XHRyb2xlOiBjb250YWN0LnJvbGUsXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgZGlzYWJsZVN5bmModXNlcklkPzogc3RyaW5nLCBsb2dpbj86IHN0cmluZykge1xuXHRcdGNvbnN0IHVzZXJJZFRvUmVtb3ZlID0gdXNlcklkID8/IHRoaXMubG9naW5Db250cm9sbGVyLmdldFVzZXJDb250cm9sbGVyKCkudXNlcklkXG5cblx0XHRpZiAodGhpcy5kZXZpY2VDb25maWcuZ2V0VXNlclN5bmNDb250YWN0c1dpdGhQaG9uZVByZWZlcmVuY2UodXNlcklkVG9SZW1vdmUpKSB7XG5cdFx0XHR0aGlzLmRldmljZUNvbmZpZy5zZXRVc2VyU3luY0NvbnRhY3RzV2l0aFBob25lUHJlZmVyZW5jZSh1c2VySWRUb1JlbW92ZSwgZmFsc2UpXG5cdFx0XHRhd2FpdCB0aGlzLm1vYmlsZUNvbnRhY3RzRmFjYWRlXG5cdFx0XHRcdC5kZWxldGVDb250YWN0cyhsb2dpbiA/PyB0aGlzLmxvZ2luQ29udHJvbGxlci5nZXRVc2VyQ29udHJvbGxlcigpLmxvZ2luVXNlcm5hbWUsIG51bGwpXG5cdFx0XHRcdC5jYXRjaChvZkNsYXNzKFBlcm1pc3Npb25FcnJvciwgKGUpID0+IGNvbnNvbGUubG9nKFwiTm8gcGVybWlzc2lvbiB0byBjbGVhciBjb250YWN0c1wiLCBlKSkpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBoYW5kbGVOb1Blcm1pc3Npb25FcnJvcih1c2VySWQ6IHN0cmluZywgZXJyb3I6IFBlcm1pc3Npb25FcnJvcikge1xuXHRcdGNvbnNvbGUubG9nKFwiTm8gcGVybWlzc2lvbiB0byBzeW5jIGNvbnRhY3RzLCBkaXNhYmxpbmcgc3luY1wiLCBlcnJvcilcblx0XHR0aGlzLmRldmljZUNvbmZpZy5zZXRVc2VyU3luY0NvbnRhY3RzV2l0aFBob25lUHJlZmVyZW5jZSh1c2VySWQsIGZhbHNlKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBhcHBseURldmljZUNoYW5nZXNUb1NlcnZlckNvbnRhY3RzKGNvbnRhY3RzOiBSZWFkb25seUFycmF5PENvbnRhY3Q+LCBzeW5jUmVzdWx0OiBDb250YWN0U3luY1Jlc3VsdCwgbGlzdElkOiBzdHJpbmcpIHtcblx0XHQvLyBVcGRhdGUgbG9jayBzdGF0ZSBzbyB0aGUgZW50aXR5IGxpc3RlbmVyIGRvZXNuJ3QgcHJvY2VzcyBhbnlcblx0XHQvLyBuZXcgZXZlbnQuIFRoZXknbGwgYmUgaGFuZGxlZCBieSB0aGUgZW5kIG9mIHRoaXMgZnVuY3Rpb25cblx0XHRjb25zdCBlbnRpdHlVcGRhdGVEZWZlciA9IGRlZmVyPHZvaWQ+KClcblx0XHR0aGlzLmVudGl0eVVwZGF0ZUxvY2sgPSBlbnRpdHlVcGRhdGVEZWZlci5wcm9taXNlXG5cblx0XHQvLyBXZSBuZWVkIHRvIHdhaXQgdW50aWwgdGhlIHVzZXIgaXMgZnVsbHkgbG9nZ2VkIGluIHRvIGhhbmRsZSBlbmNyeXB0ZWQgZW50aXRpZXNcblx0XHRhd2FpdCB0aGlzLmxvZ2luQ29udHJvbGxlci53YWl0Rm9yRnVsbExvZ2luKClcblx0XHRmb3IgKGNvbnN0IGNvbnRhY3Qgb2Ygc3luY1Jlc3VsdC5jcmVhdGVkT25EZXZpY2UpIHtcblx0XHRcdGNvbnN0IG5ld0NvbnRhY3QgPSBjcmVhdGVDb250YWN0KHRoaXMuY3JlYXRlQ29udGFjdEZyb21OYXRpdmUoY29udGFjdCkpXG5cdFx0XHRjb25zdCBlbnRpdHlJZCA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LnNldHVwKGxpc3RJZCwgbmV3Q29udGFjdClcblx0XHRcdGNvbnN0IGxvZ2luVXNlcm5hbWUgPSB0aGlzLmxvZ2luQ29udHJvbGxlci5nZXRVc2VyQ29udHJvbGxlcigpLmxvZ2luVXNlcm5hbWVcblx0XHRcdC8vIHNhdmUgdGhlIGNvbnRhY3QgcmlnaHQgYXdheSBzbyB0aGF0IHdlIGRvbid0IGxvc2UgdGhlIHNlcnZlciBpZCB0byBuYXRpdmUgY29udGFjdCBtYXBwaW5nIGlmIHdlIGRvbid0IHByb2Nlc3MgZW50aXR5IHVwZGF0ZSBxdWlja2x5IGVub3VnaFxuXHRcdFx0YXdhaXQgdGhpcy5tb2JpbGVDb250YWN0c0ZhY2FkZS5zYXZlQ29udGFjdHMobG9naW5Vc2VybmFtZSwgW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Li4uY29udGFjdCxcblx0XHRcdFx0XHRpZDogZW50aXR5SWQsXG5cdFx0XHRcdH0sXG5cdFx0XHRdKVxuXHRcdH1cblx0XHRmb3IgKGNvbnN0IGNvbnRhY3Qgb2Ygc3luY1Jlc3VsdC5lZGl0ZWRPbkRldmljZSkge1xuXHRcdFx0Y29uc3QgY2xlYW5Db250YWN0ID0gY29udGFjdHMuZmluZCgoYykgPT4gZWxlbWVudElkUGFydChjLl9pZCkgPT09IGNvbnRhY3QuaWQpXG5cdFx0XHRpZiAoY2xlYW5Db250YWN0ID09IG51bGwpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKFwiQ291bGQgbm90IGZpbmQgYSBzZXJ2ZXIgY29udGFjdCBmb3IgdGhlIGNvbnRhY3QgZWRpdGVkIG9uIGRldmljZTogXCIsIGNvbnRhY3QuaWQpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCB1cGRhdGVkQ29udGFjdCA9IHRoaXMubWVyZ2VOYXRpdmVDb250YWN0V2l0aFR1dGFDb250YWN0KGNvbnRhY3QsIGNsZWFuQ29udGFjdClcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLmVudGl0eUNsaWVudC51cGRhdGUodXBkYXRlZENvbnRhY3QpXG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybihcIk5vdCBmb3VuZCBjb250YWN0IHRvIHVwZGF0ZSBkdXJpbmcgc3luYzogXCIsIGNsZWFuQ29udGFjdC5faWQsIGUpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0Zm9yIChjb25zdCBkZWxldGVkQ29udGFjdElkIG9mIHN5bmNSZXN1bHQuZGVsZXRlZE9uRGV2aWNlKSB7XG5cdFx0XHRjb25zdCBjbGVhbkNvbnRhY3QgPSBjb250YWN0cy5maW5kKChjKSA9PiBlbGVtZW50SWRQYXJ0KGMuX2lkKSA9PT0gZGVsZXRlZENvbnRhY3RJZClcblx0XHRcdGlmIChjbGVhbkNvbnRhY3QgPT0gbnVsbCkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oXCJDb3VsZCBub3QgZmluZCBhIHNlcnZlciBjb250YWN0IGZvciB0aGUgY29udGFjdCBkZWxldGVkIG9uIGRldmljZTogXCIsIGRlbGV0ZWRDb250YWN0SWQpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmVyYXNlKGNsZWFuQ29udGFjdClcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKFwiTm90IGZvdW5kIGNvbnRhY3QgdG8gZGVsZXRlIGR1cmluZyBzeW5jOiBcIiwgY2xlYW5Db250YWN0Ll9pZCwgZSlcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFJlbGVhc2UgdGhlIGxvY2sgc3RhdGUgYW5kIHByb2Nlc3MgdGhlIGVudGl0aWVzLiBXZSBkb24ndFxuXHRcdC8vIGhhdmUgYW55dGhpbmcgbW9yZSB0byBpbmNsdWRlIGluc2lkZSBldmVudHMgdG8gYXBwbHlcblx0XHRlbnRpdHlVcGRhdGVEZWZlci5yZXNvbHZlKClcblx0fVxuXG5cdHByaXZhdGUgY3JlYXRlQ29udGFjdEZyb21OYXRpdmUoY29udGFjdDogU3RydWN0dXJlZENvbnRhY3QpOiBTdHJpcHBlZEVudGl0eTxDb250YWN0PiB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdF9vd25lckdyb3VwOiBnZXRGaXJzdE9yVGhyb3coXG5cdFx0XHRcdHRoaXMubG9naW5Db250cm9sbGVyLmdldFVzZXJDb250cm9sbGVyKCkudXNlci5tZW1iZXJzaGlwcy5maWx0ZXIoKG1lbWJlcnNoaXApID0+IG1lbWJlcnNoaXAuZ3JvdXBUeXBlID09PSBHcm91cFR5cGUuQ29udGFjdCksXG5cdFx0XHQpLmdyb3VwLFxuXHRcdFx0b2xkQmlydGhkYXlEYXRlOiBudWxsLFxuXHRcdFx0cHJlc2hhcmVkUGFzc3dvcmQ6IG51bGwsXG5cdFx0XHRvbGRCaXJ0aGRheUFnZ3JlZ2F0ZTogbnVsbCxcblx0XHRcdHBob3RvOiBudWxsLFxuXHRcdFx0c29jaWFsSWRzOiBbXSxcblx0XHRcdGZpcnN0TmFtZTogY29udGFjdC5maXJzdE5hbWUsXG5cdFx0XHRsYXN0TmFtZTogY29udGFjdC5sYXN0TmFtZSxcblx0XHRcdG1haWxBZGRyZXNzZXM6IGNvbnRhY3QubWFpbEFkZHJlc3Nlcy5tYXAoKG1haWwpID0+IGNyZWF0ZUNvbnRhY3RNYWlsQWRkcmVzcyhtYWlsKSksXG5cdFx0XHRwaG9uZU51bWJlcnM6IGNvbnRhY3QucGhvbmVOdW1iZXJzLm1hcCgocGhvbmUpID0+IGNyZWF0ZUNvbnRhY3RQaG9uZU51bWJlcihwaG9uZSkpLFxuXHRcdFx0bmlja25hbWU6IGNvbnRhY3Qubmlja25hbWUsXG5cdFx0XHRjb21wYW55OiBjb250YWN0LmNvbXBhbnksXG5cdFx0XHRiaXJ0aGRheUlzbzogY29udGFjdC5iaXJ0aGRheSxcblx0XHRcdGFkZHJlc3NlczogY29udGFjdC5hZGRyZXNzZXMubWFwKChhZGRyZXNzKSA9PiBjcmVhdGVDb250YWN0QWRkcmVzcyhhZGRyZXNzKSksXG5cdFx0XHRjdXN0b21EYXRlOiBjb250YWN0LmN1c3RvbURhdGUubWFwKChkYXRlKSA9PiBjcmVhdGVDb250YWN0Q3VzdG9tRGF0ZShkYXRlKSksXG5cdFx0XHRkZXBhcnRtZW50OiBjb250YWN0LmRlcGFydG1lbnQsXG5cdFx0XHRtZXNzZW5nZXJIYW5kbGVzOiBjb250YWN0Lm1lc3NlbmdlckhhbmRsZXMubWFwKChoYW5kbGUpID0+IGNyZWF0ZUNvbnRhY3RNZXNzZW5nZXJIYW5kbGUoaGFuZGxlKSksXG5cdFx0XHRtaWRkbGVOYW1lOiBjb250YWN0Lm1pZGRsZU5hbWUsXG5cdFx0XHRuYW1lU3VmZml4OiBjb250YWN0Lm5hbWVTdWZmaXgsXG5cdFx0XHRwaG9uZXRpY0ZpcnN0OiBjb250YWN0LnBob25ldGljRmlyc3QsXG5cdFx0XHRwaG9uZXRpY0xhc3Q6IGNvbnRhY3QucGhvbmV0aWNMYXN0LFxuXHRcdFx0cGhvbmV0aWNNaWRkbGU6IGNvbnRhY3QucGhvbmV0aWNNaWRkbGUsXG5cdFx0XHRwcm9ub3VuczogW10sXG5cdFx0XHRyZWxhdGlvbnNoaXBzOiBjb250YWN0LnJlbGF0aW9uc2hpcHMubWFwKChyZWxhdGlvbikgPT4gY3JlYXRlQ29udGFjdFJlbGF0aW9uc2hpcChyZWxhdGlvbikpLFxuXHRcdFx0d2Vic2l0ZXM6IGNvbnRhY3Qud2Vic2l0ZXMubWFwKCh3ZWJzaXRlKSA9PiBjcmVhdGVDb250YWN0V2Vic2l0ZSh3ZWJzaXRlKSksXG5cdFx0XHRjb21tZW50OiBjb250YWN0Lm5vdGVzLFxuXHRcdFx0dGl0bGU6IGNvbnRhY3QudGl0bGUgPz8gXCJcIixcblx0XHRcdHJvbGU6IGNvbnRhY3Qucm9sZSxcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIG1lcmdlTmF0aXZlQ29udGFjdFdpdGhUdXRhQ29udGFjdChjb250YWN0OiBTdHJ1Y3R1cmVkQ29udGFjdCwgcGFydGlhbENvbnRhY3Q6IENvbnRhY3QpOiBDb250YWN0IHtcblx0XHQvLyBUT0RPOiBpT1MgcmVxdWlyZXMgYSBzcGVjaWFsIGVudGl0bGVtZW50IGZyb20gQXBwbGUgdG8gYWNjZXNzIHRoZXNlIGZpZWxkc1xuXHRcdGNvbnN0IGNhbk1lcmdlQ29tbWVudEZpZWxkID0gIWlzSU9TQXBwKClcblxuXHRcdHJldHVybiB7XG5cdFx0XHQuLi5wYXJ0aWFsQ29udGFjdCxcblx0XHRcdGZpcnN0TmFtZTogY29udGFjdC5maXJzdE5hbWUsXG5cdFx0XHRsYXN0TmFtZTogY29udGFjdC5sYXN0TmFtZSxcblx0XHRcdG1haWxBZGRyZXNzZXM6IGNvbnRhY3QubWFpbEFkZHJlc3Nlcy5tYXAoKG1haWwpID0+IGNyZWF0ZUNvbnRhY3RNYWlsQWRkcmVzcyhtYWlsKSksXG5cdFx0XHRwaG9uZU51bWJlcnM6IGNvbnRhY3QucGhvbmVOdW1iZXJzLm1hcCgocGhvbmUpID0+IGNyZWF0ZUNvbnRhY3RQaG9uZU51bWJlcihwaG9uZSkpLFxuXHRcdFx0bmlja25hbWU6IGNvbnRhY3Qubmlja25hbWUsXG5cdFx0XHRjb21wYW55OiBjb250YWN0LmNvbXBhbnksXG5cdFx0XHRiaXJ0aGRheUlzbzogY29udGFjdC5iaXJ0aGRheSxcblx0XHRcdGFkZHJlc3NlczogY29udGFjdC5hZGRyZXNzZXMubWFwKChhZGRyZXNzKSA9PiBjcmVhdGVDb250YWN0QWRkcmVzcyhhZGRyZXNzKSksXG5cdFx0XHRjdXN0b21EYXRlOiBjb250YWN0LmN1c3RvbURhdGUubWFwKChkYXRlKSA9PiBjcmVhdGVDb250YWN0Q3VzdG9tRGF0ZShkYXRlKSksXG5cdFx0XHRkZXBhcnRtZW50OiBjb250YWN0LmRlcGFydG1lbnQsXG5cdFx0XHRtZXNzZW5nZXJIYW5kbGVzOiBjb250YWN0Lm1lc3NlbmdlckhhbmRsZXMubWFwKChoYW5kbGUpID0+IGNyZWF0ZUNvbnRhY3RNZXNzZW5nZXJIYW5kbGUoaGFuZGxlKSksXG5cdFx0XHRtaWRkbGVOYW1lOiBjb250YWN0Lm1pZGRsZU5hbWUsXG5cdFx0XHRuYW1lU3VmZml4OiBjb250YWN0Lm5hbWVTdWZmaXgsXG5cdFx0XHRwaG9uZXRpY0ZpcnN0OiBjb250YWN0LnBob25ldGljRmlyc3QsXG5cdFx0XHRwaG9uZXRpY0xhc3Q6IGNvbnRhY3QucGhvbmV0aWNMYXN0LFxuXHRcdFx0cGhvbmV0aWNNaWRkbGU6IGNvbnRhY3QucGhvbmV0aWNNaWRkbGUsXG5cdFx0XHRyZWxhdGlvbnNoaXBzOiBjb250YWN0LnJlbGF0aW9uc2hpcHMubWFwKChyZWxhdGlvbikgPT4gY3JlYXRlQ29udGFjdFJlbGF0aW9uc2hpcChyZWxhdGlvbikpLFxuXHRcdFx0d2Vic2l0ZXM6IGNvbnRhY3Qud2Vic2l0ZXMubWFwKCh3ZWJzaXRlKSA9PiBjcmVhdGVDb250YWN0V2Vic2l0ZSh3ZWJzaXRlKSksXG5cdFx0XHRjb21tZW50OiBjYW5NZXJnZUNvbW1lbnRGaWVsZCA/IGNvbnRhY3Qubm90ZXMgOiBwYXJ0aWFsQ29udGFjdC5jb21tZW50LFxuXHRcdFx0dGl0bGU6IGNvbnRhY3QudGl0bGUgPz8gXCJcIixcblx0XHRcdHJvbGU6IGNvbnRhY3Qucm9sZSxcblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCB7IERldmljZUNvbmZpZyB9IGZyb20gXCIuLi9taXNjL0RldmljZUNvbmZpZ1wiXG5pbXBvcnQgdHlwZSB7IEh0bWxTYW5pdGl6ZXIgfSBmcm9tIFwiLi4vbWlzYy9IdG1sU2FuaXRpemVyXCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGVCb290LCBpc0FwcCwgaXNEZXNrdG9wIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IGRvd25jYXN0LCBmaW5kQW5kUmVtb3ZlLCBMYXp5TG9hZGVkLCBtYXBBbmRGaWx0ZXJOdWxsLCB0eXBlZFZhbHVlcyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHR5cGUgeyBCYXNlVGhlbWVJZCwgVGhlbWUsIFRoZW1lSWQsIFRoZW1lUHJlZmVyZW5jZSB9IGZyb20gXCIuL3RoZW1lXCJcbmltcG9ydCB7IGxvZ29EZWZhdWx0R3JleSwgdGhlbWVzIH0gZnJvbSBcIi4vYnVpbHRpblRoZW1lc1wiXG5pbXBvcnQgdHlwZSB7IFRoZW1lQ3VzdG9taXphdGlvbnMgfSBmcm9tIFwiLi4vbWlzYy9XaGl0ZWxhYmVsQ3VzdG9taXphdGlvbnNcIlxuaW1wb3J0IHsgZ2V0V2hpdGVsYWJlbEN1c3RvbWl6YXRpb25zIH0gZnJvbSBcIi4uL21pc2MvV2hpdGVsYWJlbEN1c3RvbWl6YXRpb25zXCJcbmltcG9ydCB7IGdldENhbGVuZGFyTG9nb1N2ZywgZ2V0TWFpbExvZ29TdmcgfSBmcm9tIFwiLi9iYXNlL0xvZ29cIlxuaW1wb3J0IHsgVGhlbWVGYWNhZGUgfSBmcm9tIFwiLi4vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvVGhlbWVGYWNhZGVcIlxuaW1wb3J0IHsgQXBwVHlwZSB9IGZyb20gXCIuLi9taXNjL0NsaWVudENvbnN0YW50cy5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGVCb290KClcblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRUaGVtZUlkOiBUaGVtZUlkID0gXCJsaWdodFwiXG5cbmV4cG9ydCBjbGFzcyBUaGVtZUNvbnRyb2xsZXIge1xuXHRwcml2YXRlIHJlYWRvbmx5IHRoZW1lOiBUaGVtZVxuXHRfdGhlbWVJZDogVGhlbWVJZFxuXHRwcml2YXRlIF90aGVtZVByZWZlcmVuY2U6IFRoZW1lUHJlZmVyZW5jZVxuXHQvLyBTdWJzY3JpYmUgdG8gdGhpcyB0byBnZXQgdGhlbWUgY2hhbmdlIGV2ZW50cy4gQ2Fubm90IGJlIHVzZWQgdG8gdXBkYXRlIHRoZSB0aGVtZVxuXHRyZWFkb25seSBvYnNlcnZhYmxlVGhlbWVJZDogU3RyZWFtPFRoZW1lSWQ+XG5cdHJlYWRvbmx5IGluaXRpYWxpemVkOiBQcm9taXNlPGFueT5cblxuXHRjb25zdHJ1Y3Rvcihcblx0XHR0aGVtZVNpbmdsZXRvbjogb2JqZWN0LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgdGhlbWVGYWNhZGU6IFRoZW1lRmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgaHRtbFNhbml0aXplcjogKCkgPT4gUHJvbWlzZTxIdG1sU2FuaXRpemVyPixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGFwcDogQXBwVHlwZSxcblx0KSB7XG5cdFx0Ly8gdGhpcyB3aWxsIGJlIG92ZXJ3cml0dGVuIHF1aWNrbHlcblx0XHR0aGlzLl90aGVtZUlkID0gZGVmYXVsdFRoZW1lSWRcblx0XHR0aGlzLl90aGVtZVByZWZlcmVuY2UgPSBcImF1dG86bGlnaHR8ZGFya1wiXG5cdFx0dGhpcy50aGVtZSA9IE9iamVjdC5hc3NpZ24odGhlbWVTaW5nbGV0b24sIHRoaXMuZ2V0RGVmYXVsdFRoZW1lKCkpXG5cdFx0dGhpcy5vYnNlcnZhYmxlVGhlbWVJZCA9IHN0cmVhbSh0aGlzLnRoZW1lSWQpXG5cdFx0Ly8gV2UgcnVuIHRoZW0gaW4gcGFyYWxsZWwgdG8gaW5pdGlhbGl6ZSBhcyBzb29uIGFzIHBvc3NpYmxlXG5cdFx0dGhpcy5pbml0aWFsaXplZCA9IFByb21pc2UuYWxsKFt0aGlzLl9pbml0aWFsaXplVGhlbWUoKSwgdGhpcy51cGRhdGVTYXZlZEJ1aWx0aW5UaGVtZXMoKV0pXG5cdH1cblxuXHRhc3luYyBfaW5pdGlhbGl6ZVRoZW1lKCkge1xuXHRcdC8vIElmIGJlaW5nIGFjY2Vzc2VkIGZyb20gYSBjdXN0b20gZG9tYWluLCB0aGUgZGVmaW5pdGlvbiBvZiB3aGl0ZWxhYmVsQ3VzdG9taXphdGlvbnMgaXMgYWRkZWQgdG8gaW5kZXguanMgc2VydmVyc2lkZSB1cG9uIHJlcXVlc3Rcblx0XHQvLyBzZWUgUm9vdEhhbmRsZXI6OmFwcGx5V2hpdGVsYWJlbEZpbGVNb2RpZmljYXRpb25zLlxuXHRcdGNvbnN0IHdoaXRlbGFiZWxDdXN0b21pemF0aW9ucyA9IGdldFdoaXRlbGFiZWxDdXN0b21pemF0aW9ucyh3aW5kb3cpXG5cblx0XHRpZiAod2hpdGVsYWJlbEN1c3RvbWl6YXRpb25zICYmIHdoaXRlbGFiZWxDdXN0b21pemF0aW9ucy50aGVtZSkge1xuXHRcdFx0Ly8gbm8gbmVlZCB0byBwZXJzaXN0IGFueXRoaW5nIGlmIHdlIGFyZSBvbiB3aGl0ZWxhYmVsIGRvbWFpblxuXHRcdFx0Y29uc3QgYXNzZW1ibGVkVGhlbWUgPSBhd2FpdCB0aGlzLmFwcGx5Q3VzdG9taXphdGlvbnMod2hpdGVsYWJlbEN1c3RvbWl6YXRpb25zLnRoZW1lLCBmYWxzZSlcblx0XHRcdHRoaXMuX3RoZW1lUHJlZmVyZW5jZSA9IGFzc2VtYmxlZFRoZW1lLnRoZW1lSWRcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gSXQgaXMgdGhlbWUgaW5mbyBwYXNzZWQgZnJvbSBuYXRpdmUgdG8gYmUgYXBwbGllZCBhcyBlYXJseSBhcyBwb3NzaWJsZS5cblx0XHRcdC8vIEltcG9ydGFudCEgRG8gbm90IGJsaW5kbHkgYXBwbHkgbG9jYXRpb24uc2VhcmNoLCBzb21lb25lIGNvdWxkIHRyeSB0byBkbyBwcm90b3R5cGUgcG9sbHV0aW9uLlxuXHRcdFx0Ly8gV2UgY2hlY2sgZW52aXJvbm1lbnQgYW5kIGFsc28gZmlsdGVyIG91dCBfX3Byb3RvX19cblx0XHRcdC8vIG1pdGhyaWwncyBwYXJzZVF1ZXJ5U3RyaW5nIGRvZXMgbm90IGZvbGxvdyBzdGFuZGFyZCBleGFjdGx5IHNvIHdlIHRyeSB0byB1c2UgdGhlIHNhbWUgdGhpbmcgd2UgdXNlIG9uIHRoZSBuYXRpdmUgc2lkZVxuXHRcdFx0Y29uc3QgdGhlbWVKc29uID0gd2luZG93LmxvY2F0aW9uLmhyZWYgPyBuZXcgVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKS5zZWFyY2hQYXJhbXMuZ2V0KFwidGhlbWVcIikgOiBudWxsXG5cblx0XHRcdGlmICgoaXNBcHAoKSB8fCBpc0Rlc2t0b3AoKSkgJiYgdGhlbWVKc29uKSB7XG5cdFx0XHRcdGNvbnN0IHBhcnNlZFRoZW1lOiBUaGVtZUN1c3RvbWl6YXRpb25zID0gdGhpcy5wYXJzZUN1c3RvbWl6YXRpb25zKHRoZW1lSnNvbilcblxuXHRcdFx0XHQvLyBXZSBhbHNvIGRvbid0IG5lZWQgdG8gc2F2ZSBhbnl0aGluZyBpbiB0aGlzIGNhc2Vcblx0XHRcdFx0YXdhaXQgdGhpcy5hcHBseUN1c3RvbWl6YXRpb25zKHBhcnNlZFRoZW1lLCBmYWxzZSlcblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgaXQncyBhIGZpcnN0IHN0YXJ0IHdlIG1pZ2h0IGdldCBhIGZhbGxiYWNrIHRoZW1lIGZyb20gbmF0aXZlLiBXZSBjYW4gYXBwbHkgaXQgZm9yIGEgc2hvcnQgdGltZSBidXQgd2Ugc2hvdWxkIHN3aXRjaCB0byB0aGUgZnVsbCwgcmVzb2x2ZWRcblx0XHRcdC8vIHRoZW1lIGFmdGVyIHRoYXQuXG5cdFx0XHRhd2FpdCB0aGlzLnNldFRoZW1lUHJlZmVyZW5jZSgoYXdhaXQgdGhpcy50aGVtZUZhY2FkZS5nZXRUaGVtZVByZWZlcmVuY2UoKSkgPz8gdGhpcy5fdGhlbWVQcmVmZXJlbmNlKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcGFyc2VDdXN0b21pemF0aW9ucyhzdHJpbmdUaGVtZTogc3RyaW5nKTogVGhlbWVDdXN0b21pemF0aW9ucyB7XG5cdFx0Ly8gRmlsdGVyIG91dCBfX3Byb3RvX18gdG8gYXZvaWQgcHJvdG90eXBlIHBvbGx1dGlvbi4gV2UgdXNlIE9iamVjdC5hc3NpZ24oKSB3aGljaCBpcyBub3Qgc3VzY2VwdGlibGUgdG8gaXQgYnV0IGl0IGRvZXNuJ3QgaHVydC5cblx0XHRyZXR1cm4gSlNPTi5wYXJzZShzdHJpbmdUaGVtZSwgKGssIHYpID0+IChrID09PSBcIl9fcHJvdG9fX1wiID8gdW5kZWZpbmVkIDogdikpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHVwZGF0ZVNhdmVkQnVpbHRpblRoZW1lcygpIHtcblx0XHQvLyBJbiBjYXNlIHdlIGNoYW5nZSBidWlsdC1pbiB0aGVtZXMgd2Ugd2FudCB0byBzYXZlIG5ldyBjb3B5IG9uIHRoZSBkZXZpY2UuXG5cdFx0Zm9yIChjb25zdCB0aGVtZSBvZiB0eXBlZFZhbHVlcyh0aGVtZXMoKSkpIHtcblx0XHRcdGF3YWl0IHRoaXMudXBkYXRlU2F2ZWRUaGVtZURlZmluaXRpb24odGhlbWUpXG5cdFx0fVxuXG5cdFx0Ly8gUmVtb3ZlIGJsdWUgdGhlbWUgYmVjYXVzZSB3ZSBkb24ndCBoYXZlIGl0IGFueW1vcmVcblx0XHRjb25zdCBvbGRUaGVtZXMgPSAoYXdhaXQgdGhpcy50aGVtZUZhY2FkZS5nZXRUaGVtZXMoKSkgYXMgQXJyYXk8VGhlbWU+XG5cdFx0ZmluZEFuZFJlbW92ZShvbGRUaGVtZXMsICh0KSA9PiB0LnRoZW1lSWQgPT09IFwiYmx1ZVwiKVxuXHRcdGF3YWl0IHRoaXMudGhlbWVGYWNhZGUuc2V0VGhlbWVzKG9sZFRoZW1lcylcblxuXHRcdC8vIENoZWNrIGlmIHRoZSBibHVlIHRoZW1lIHdhcyBzZWxlY3RlZCBhbmQgZmFsbGJhY2sgZm9yIGF1dG9cblx0XHRjb25zdCB0aGVtZVByZWZlcmVuY2UgPSBhd2FpdCB0aGlzLnRoZW1lRmFjYWRlLmdldFRoZW1lUHJlZmVyZW5jZSgpXG5cdFx0aWYgKCF0aGVtZVByZWZlcmVuY2UgfHwgdGhlbWVQcmVmZXJlbmNlICE9PSBcImJsdWVcIikgcmV0dXJuXG5cdFx0YXdhaXQgdGhpcy5zZXRUaGVtZVByZWZlcmVuY2UoXCJhdXRvOmxpZ2h0fGRhcmtcIiwgdHJ1ZSlcblx0fVxuXG5cdGFzeW5jIHJlbG9hZFRoZW1lKCkge1xuXHRcdGNvbnN0IHRoZW1lUHJlZmVyZW5jZSA9IGF3YWl0IHRoaXMudGhlbWVGYWNhZGUuZ2V0VGhlbWVQcmVmZXJlbmNlKClcblx0XHRpZiAoIXRoZW1lUHJlZmVyZW5jZSkgcmV0dXJuXG5cdFx0YXdhaXQgdGhpcy5zZXRUaGVtZVByZWZlcmVuY2UodGhlbWVQcmVmZXJlbmNlLCBmYWxzZSlcblx0fVxuXG5cdGdldCB0aGVtZUlkKCk6IFRoZW1lSWQge1xuXHRcdHJldHVybiB0aGlzLl90aGVtZUlkXG5cdH1cblxuXHRnZXQgdGhlbWVQcmVmZXJlbmNlKCk6IFRoZW1lUHJlZmVyZW5jZSB7XG5cdFx0cmV0dXJuIHRoaXMuX3RoZW1lUHJlZmVyZW5jZVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBnZXRUaGVtZSh0aGVtZUlkOiBUaGVtZUlkKTogUHJvbWlzZTxUaGVtZT4ge1xuXHRcdGlmICh0aGVtZXMoKVt0aGVtZUlkXSkge1xuXHRcdFx0Ly8gTWFrZSBhIGRlZmVuc2l2ZSBjb3B5IHNvIHRoYXQgb3JpZ2luYWwgdGhlbWUgZGVmaW5pdGlvbiBpcyBub3QgbW9kaWZpZWQuXG5cdFx0XHRyZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhlbWVzKClbdGhlbWVJZF0pXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IGxvYWRlZFRoZW1lcyA9IChhd2FpdCB0aGlzLnRoZW1lRmFjYWRlLmdldFRoZW1lcygpKSBhcyBSZWFkb25seUFycmF5PFRoZW1lPlxuXHRcdFx0Y29uc3QgY3VzdG9tVGhlbWUgPSBsb2FkZWRUaGVtZXMuZmluZCgodCkgPT4gdC50aGVtZUlkID09PSB0aGVtZUlkKVxuXG5cdFx0XHRpZiAoY3VzdG9tVGhlbWUpIHtcblx0XHRcdFx0YXdhaXQgdGhpcy5zYW5pdGl6ZVRoZW1lKGN1c3RvbVRoZW1lKVxuXHRcdFx0XHRyZXR1cm4gY3VzdG9tVGhlbWVcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmdldERlZmF1bHRUaGVtZSgpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Z2V0Q3VycmVudFRoZW1lKCk6IFRoZW1lIHtcblx0XHRyZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy50aGVtZSlcblx0fVxuXG5cdC8qKlxuXHQgKiBTZXQgdGhlIHRoZW1lLCBpZiBwZXJtYW5lbnQgaXMgdHJ1ZSB0aGVuIHRoZSBsb2NhbGx5IHNhdmVkIHRoZW1lIHdpbGwgYmUgdXBkYXRlZFxuXHQgKi9cblx0YXN5bmMgc2V0VGhlbWVQcmVmZXJlbmNlKG5ld1RoZW1lUHJlZmVyZW5jZTogVGhlbWVQcmVmZXJlbmNlLCBwZXJtYW5lbnQ6IGJvb2xlYW4gPSB0cnVlKSB7XG5cdFx0Y29uc3QgdGhlbWVJZCA9IGF3YWl0IHRoaXMucmVzb2x2ZVRoZW1lUHJlZmVyZW5jZShuZXdUaGVtZVByZWZlcmVuY2UpXG5cdFx0Y29uc3QgbmV3VGhlbWUgPSBhd2FpdCB0aGlzLmdldFRoZW1lKHRoZW1lSWQpXG5cblx0XHR0aGlzLmFwcGx5VHJ1c3RlZFRoZW1lKG5ld1RoZW1lLCB0aGVtZUlkKVxuXHRcdHRoaXMuX3RoZW1lUHJlZmVyZW5jZSA9IG5ld1RoZW1lUHJlZmVyZW5jZVxuXG5cdFx0aWYgKHBlcm1hbmVudCkge1xuXHRcdFx0YXdhaXQgdGhpcy50aGVtZUZhY2FkZS5zZXRUaGVtZVByZWZlcmVuY2UobmV3VGhlbWVQcmVmZXJlbmNlKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgcmVzb2x2ZVRoZW1lUHJlZmVyZW5jZShuZXdUaGVtZVByZWZlcmVuY2U6IFRoZW1lUHJlZmVyZW5jZSk6IFByb21pc2U8VGhlbWVJZD4ge1xuXHRcdGlmIChuZXdUaGVtZVByZWZlcmVuY2UgPT09IFwiYXV0bzpsaWdodHxkYXJrXCIpIHtcblx0XHRcdHJldHVybiAoYXdhaXQgdGhpcy50aGVtZUZhY2FkZS5wcmVmZXJzRGFyaygpKSA/IFwiZGFya1wiIDogXCJsaWdodFwiXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBuZXdUaGVtZVByZWZlcmVuY2Vcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFwcGx5VHJ1c3RlZFRoZW1lKG5ld1RoZW1lOiBUaGVtZSwgbmV3VGhlbWVJZDogVGhlbWVJZCkge1xuXHRcdC8vIFRoZW1lIG9iamVjdCBpcyBlZmZlY3RpdmVseSBhIHNpbmdsZXRvbiBhbmQgaXMgaW1wb3J0ZWQgZXZlcnl3aGVyZS4gSXQgbXVzdCBiZSB1cGRhdGVkIGluIHBsYWNlLlxuXHRcdC8vIHNlZSB0aGVtZS5qc1xuXG5cdFx0Ly8gQ2xlYXIgYWxsIHRoZSBrZXlzIGZpcnN0LlxuXHRcdGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHRoaXMudGhlbWUpKSB7XG5cdFx0XHRkZWxldGUgZG93bmNhc3QodGhpcy50aGVtZSlba2V5XVxuXHRcdH1cblx0XHQvLyBXcml0ZSBuZXcga2V5cyBvbiBpdCBsYXRlci4gRmlyc3QgZGVmYXVsdCB0aGVtZSBhcyBiYXNlIChzbyB0aGF0IG9wdGlvbmFsIHZhbHVlcyBhcmUgY29ycmVjdGx5IGZpbGxlZCBpbikgYW5kIHRoZW4gdGhlIG5ldyB0aGVtZS5cblx0XHRPYmplY3QuYXNzaWduKHRoaXMudGhlbWUsIHRoaXMuZ2V0RGVmYXVsdFRoZW1lKCksIG5ld1RoZW1lKVxuXHRcdHRoaXMuX3RoZW1lSWQgPSBuZXdUaGVtZUlkXG5cdFx0dGhpcy5vYnNlcnZhYmxlVGhlbWVJZChuZXdUaGVtZUlkKVxuXHRcdG0ucmVkcmF3KClcblx0fVxuXG5cdC8qKlxuXHQgKiBBcHBseSB0aGUgY3VzdG9tIHRoZW1lLCBpZiBwZXJtYW5lbnQgPT09IHRydWUsIHRoZW4gdGhlIG5ldyB0aGVtZSB3aWxsIGJlIHNhdmVkXG5cdCAqL1xuXHRhc3luYyBhcHBseUN1c3RvbWl6YXRpb25zKGN1c3RvbWl6YXRpb25zOiBUaGVtZUN1c3RvbWl6YXRpb25zLCBwZXJtYW5lbnQ6IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTxUaGVtZT4ge1xuXHRcdGNvbnN0IHVwZGF0ZWRUaGVtZSA9IHRoaXMuYXNzZW1ibGVUaGVtZShjdXN0b21pemF0aW9ucylcblx0XHQvLyBTZXQgbm8gbG9nbyB1bnRpbCB3ZSBzYW5pdGl6ZSBpdC5cblx0XHRjb25zdCBmaWxsZWRXaXRob3V0TG9nbyA9IE9iamVjdC5hc3NpZ24oe30sIHVwZGF0ZWRUaGVtZSwge1xuXHRcdFx0bG9nbzogXCJcIixcblx0XHR9KVxuXG5cdFx0dGhpcy5hcHBseVRydXN0ZWRUaGVtZShmaWxsZWRXaXRob3V0TG9nbywgZmlsbGVkV2l0aG91dExvZ28udGhlbWVJZClcblxuXHRcdGF3YWl0IHRoaXMuc2FuaXRpemVUaGVtZSh1cGRhdGVkVGhlbWUpXG5cblx0XHQvLyBOb3cgYXBwbHkgd2l0aCB0aGUgbG9nb1xuXHRcdHRoaXMuYXBwbHlUcnVzdGVkVGhlbWUodXBkYXRlZFRoZW1lLCBmaWxsZWRXaXRob3V0TG9nby50aGVtZUlkKVxuXG5cdFx0aWYgKHBlcm1hbmVudCkge1xuXHRcdFx0dGhpcy5fdGhlbWVQcmVmZXJlbmNlID0gdXBkYXRlZFRoZW1lLnRoZW1lSWRcblx0XHRcdGF3YWl0IHRoaXMudXBkYXRlU2F2ZWRUaGVtZURlZmluaXRpb24odXBkYXRlZFRoZW1lKVxuXHRcdFx0YXdhaXQgdGhpcy50aGVtZUZhY2FkZS5zZXRUaGVtZVByZWZlcmVuY2UodXBkYXRlZFRoZW1lLnRoZW1lSWQpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVwZGF0ZWRUaGVtZVxuXHR9XG5cblx0YXN5bmMgc3RvcmVDdXN0b21UaGVtZUZvckN1c3RvbWl6YXRpb25zKGN1c3RvbWl6YXRpb25zOiBUaGVtZUN1c3RvbWl6YXRpb25zKSB7XG5cdFx0Y29uc3QgbmV3VGhlbWUgPSB0aGlzLmFzc2VtYmxlVGhlbWUoY3VzdG9taXphdGlvbnMpXG5cdFx0YXdhaXQgdGhpcy51cGRhdGVTYXZlZFRoZW1lRGVmaW5pdGlvbihuZXdUaGVtZSlcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2FuaXRpemVUaGVtZSh0aGVtZTogVGhlbWUpIHtcblx0XHRpZiAodGhlbWUubG9nbykge1xuXHRcdFx0Y29uc3QgbG9nbyA9IHRoZW1lLmxvZ29cblx0XHRcdGNvbnN0IGh0bWxTYW5pdGl6ZXIgPSBhd2FpdCB0aGlzLmh0bWxTYW5pdGl6ZXIoKVxuXHRcdFx0dGhlbWUubG9nbyA9IGh0bWxTYW5pdGl6ZXIuc2FuaXRpemVIVE1MKGxvZ28pLmh0bWxcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogU2F2ZSB0aGVtZSB0byB0aGUgc3RvcmFnZS5cblx0ICovXG5cdHByaXZhdGUgYXN5bmMgdXBkYXRlU2F2ZWRUaGVtZURlZmluaXRpb24odXBkYXRlZFRoZW1lOiBUaGVtZSk6IFByb21pc2U8VGhlbWU+IHtcblx0XHRjb25zdCBub25OdWxsVGhlbWUgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldERlZmF1bHRUaGVtZSgpLCB1cGRhdGVkVGhlbWUpXG5cdFx0YXdhaXQgdGhpcy5zYW5pdGl6ZVRoZW1lKG5vbk51bGxUaGVtZSlcblx0XHRjb25zdCBvbGRUaGVtZXMgPSAoYXdhaXQgdGhpcy50aGVtZUZhY2FkZS5nZXRUaGVtZXMoKSkgYXMgQXJyYXk8VGhlbWU+XG5cdFx0ZmluZEFuZFJlbW92ZShvbGRUaGVtZXMsICh0KSA9PiB0LnRoZW1lSWQgPT09IHVwZGF0ZWRUaGVtZS50aGVtZUlkKVxuXHRcdG9sZFRoZW1lcy5wdXNoKG5vbk51bGxUaGVtZSlcblx0XHRhd2FpdCB0aGlzLnRoZW1lRmFjYWRlLnNldFRoZW1lcyhvbGRUaGVtZXMpXG5cdFx0cmV0dXJuIG5vbk51bGxUaGVtZVxuXHR9XG5cblx0Z2V0RGVmYXVsdFRoZW1lKCk6IFRoZW1lIHtcblx0XHRyZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhlbWVzKClbZGVmYXVsdFRoZW1lSWRdKVxuXHR9XG5cblx0Z2V0QmFzZVRoZW1lKGJhc2VJZDogQmFzZVRoZW1lSWQpOiBUaGVtZSB7XG5cdFx0Ly8gTWFrZSBhIGRlZmVuc2l2ZSBjb3B5IHNvIHRoYXQgb3JpZ2luYWwgdGhlbWUgZGVmaW5pdGlvbiBpcyBub3QgbW9kaWZpZWQuXG5cdFx0cmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoZW1lcygpW2Jhc2VJZF0pXG5cdH1cblxuXHRzaG91bGRBbGxvd0NoYW5naW5nVGhlbWUoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHdpbmRvdy53aGl0ZWxhYmVsQ3VzdG9taXphdGlvbnMgPT0gbnVsbFxuXHR9XG5cblx0LyoqXG5cdCAqIEFzc2VtYmxlcyBhIG5ldyB0aGVtZSBvYmplY3QgZnJvbSBjdXN0b21pemF0aW9ucy5cblx0ICovXG5cdHByaXZhdGUgYXNzZW1ibGVUaGVtZShjdXN0b21pemF0aW9uczogVGhlbWVDdXN0b21pemF0aW9ucyk6IFRoZW1lIHtcblx0XHRpZiAoIWN1c3RvbWl6YXRpb25zLmJhc2UpIHtcblx0XHRcdHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBjdXN0b21pemF0aW9ucyBhcyBUaGVtZSlcblx0XHR9IGVsc2UgaWYgKGN1c3RvbWl6YXRpb25zLmJhc2UgJiYgY3VzdG9taXphdGlvbnMubG9nbykge1xuXHRcdFx0cmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0QmFzZVRoZW1lKGN1c3RvbWl6YXRpb25zLmJhc2UpLCBjdXN0b21pemF0aW9ucylcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgdGhlbWVXaXRob3V0TG9nbyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0QmFzZVRoZW1lKGN1c3RvbWl6YXRpb25zLmJhc2UpLCBjdXN0b21pemF0aW9ucylcblx0XHRcdC8vIFRoaXMgaXMgYSB3aGl0ZWxhYmVsIHRoZW1lIHdoZXJlIGxvZ28gaGFzIG5vdCBiZWVuIG92ZXJ3cml0dGVuLlxuXHRcdFx0Ly8gR2VuZXJhdGUgYSBsb2dvIHdpdGggbXV0ZWQgY29sb3JzLiBXZSBkbyBub3Qgd2FudCB0byBjb2xvciBvdXIgbG9nbyBpblxuXHRcdFx0Ly8gc29tZSByYW5kb20gY29sb3IuXG5cdFx0XHRjb25zdCBncmF5ZWRMb2dvID1cblx0XHRcdFx0dGhpcy5hcHAgPT09IEFwcFR5cGUuQ2FsZW5kYXJcblx0XHRcdFx0XHQ/IGdldENhbGVuZGFyTG9nb1N2Zyhsb2dvRGVmYXVsdEdyZXksIGxvZ29EZWZhdWx0R3JleSwgbG9nb0RlZmF1bHRHcmV5KVxuXHRcdFx0XHRcdDogZ2V0TWFpbExvZ29TdmcobG9nb0RlZmF1bHRHcmV5LCBsb2dvRGVmYXVsdEdyZXksIGxvZ29EZWZhdWx0R3JleSlcblx0XHRcdHJldHVybiB7IC4uLnRoZW1lV2l0aG91dExvZ28sIC4uLnsgbG9nbzogZ3JheWVkTG9nbyB9IH1cblx0XHR9XG5cdH1cblxuXHRhc3luYyBnZXRDdXN0b21UaGVtZXMoKTogUHJvbWlzZTxBcnJheTxUaGVtZUlkPj4ge1xuXHRcdHJldHVybiBtYXBBbmRGaWx0ZXJOdWxsKGF3YWl0IHRoaXMudGhlbWVGYWNhZGUuZ2V0VGhlbWVzKCksICh0aGVtZSkgPT4ge1xuXHRcdFx0cmV0dXJuICEodGhlbWUudGhlbWVJZCBpbiB0aGVtZXMoKSkgPyB0aGVtZS50aGVtZUlkIDogbnVsbFxuXHRcdH0pXG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIE5hdGl2ZVRoZW1lRmFjYWRlIGltcGxlbWVudHMgVGhlbWVGYWNhZGUge1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHRoZW1lRmFjYWRlOiBMYXp5TG9hZGVkPFRoZW1lRmFjYWRlPikge31cblxuXHRhc3luYyBnZXRUaGVtZVByZWZlcmVuY2UoKTogUHJvbWlzZTxUaGVtZUlkIHwgbnVsbD4ge1xuXHRcdGNvbnN0IGRpc3BhdGNoZXIgPSBhd2FpdCB0aGlzLnRoZW1lRmFjYWRlLmdldEFzeW5jKClcblx0XHRyZXR1cm4gZGlzcGF0Y2hlci5nZXRUaGVtZVByZWZlcmVuY2UoKVxuXHR9XG5cblx0YXN5bmMgc2V0VGhlbWVQcmVmZXJlbmNlKHRoZW1lOiBUaGVtZUlkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgZGlzcGF0Y2hlciA9IGF3YWl0IHRoaXMudGhlbWVGYWNhZGUuZ2V0QXN5bmMoKVxuXHRcdHJldHVybiBkaXNwYXRjaGVyLnNldFRoZW1lUHJlZmVyZW5jZSh0aGVtZSlcblx0fVxuXG5cdGFzeW5jIGdldFRoZW1lcygpOiBQcm9taXNlPEFycmF5PFRoZW1lPj4ge1xuXHRcdGNvbnN0IGRpc3BhdGNoZXIgPSBhd2FpdCB0aGlzLnRoZW1lRmFjYWRlLmdldEFzeW5jKClcblx0XHRyZXR1cm4gKGF3YWl0IGRpc3BhdGNoZXIuZ2V0VGhlbWVzKCkpIGFzIFRoZW1lW11cblx0fVxuXG5cdGFzeW5jIHNldFRoZW1lcyh0aGVtZXM6IFJlYWRvbmx5QXJyYXk8VGhlbWU+KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgZGlzcGF0Y2hlciA9IGF3YWl0IHRoaXMudGhlbWVGYWNhZGUuZ2V0QXN5bmMoKVxuXHRcdHJldHVybiBkaXNwYXRjaGVyLnNldFRoZW1lcyh0aGVtZXMpXG5cdH1cblxuXHRhc3luYyBwcmVmZXJzRGFyaygpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRjb25zdCBkaXNwYXRjaGVyID0gYXdhaXQgdGhpcy50aGVtZUZhY2FkZS5nZXRBc3luYygpXG5cdFx0cmV0dXJuIGRpc3BhdGNoZXIucHJlZmVyc0RhcmsoKVxuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBXZWJUaGVtZUZhY2FkZSBpbXBsZW1lbnRzIFRoZW1lRmFjYWRlIHtcblx0cHJpdmF0ZSByZWFkb25seSBtZWRpYVF1ZXJ5OiBNZWRpYVF1ZXJ5TGlzdCB8IHVuZGVmaW5lZCA9IHdpbmRvdy5tYXRjaE1lZGlhPy4oXCIocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspXCIpXG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBkZXZpY2VDb25maWc6IERldmljZUNvbmZpZykge31cblxuXHRhc3luYyBnZXRUaGVtZVByZWZlcmVuY2UoKTogUHJvbWlzZTxUaGVtZUlkIHwgbnVsbD4ge1xuXHRcdHJldHVybiB0aGlzLmRldmljZUNvbmZpZy5nZXRUaGVtZSgpXG5cdH1cblxuXHRhc3luYyBzZXRUaGVtZVByZWZlcmVuY2UodGhlbWU6IFRoZW1lSWQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gdGhpcy5kZXZpY2VDb25maWcuc2V0VGhlbWUodGhlbWUpXG5cdH1cblxuXHRhc3luYyBnZXRUaGVtZXMoKTogUHJvbWlzZTxBcnJheTxUaGVtZT4+IHtcblx0XHQvLyBuby1vcFxuXHRcdHJldHVybiBbXVxuXHR9XG5cblx0YXN5bmMgc2V0VGhlbWVzKHRoZW1lczogUmVhZG9ubHlBcnJheTxUaGVtZT4pIHtcblx0XHQvLyBuby1vcFxuXHR9XG5cblx0YXN5bmMgcHJlZmVyc0RhcmsoKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0cmV0dXJuIHRoaXMubWVkaWFRdWVyeT8ubWF0Y2hlcyA/PyBmYWxzZVxuXHR9XG5cblx0YWRkRGFya0xpc3RlbmVyKGxpc3RlbmVyOiAoKSA9PiB1bmtub3duKSB7XG5cdFx0dGhpcy5tZWRpYVF1ZXJ5Py5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGxpc3RlbmVyKVxuXHR9XG59XG4iLCJpbXBvcnQgU3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBNYWlsYm94Q291bnRlcnMsIE1haWxib3hEZXRhaWwsIE1haWxib3hNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWFpbEZ1bmN0aW9uYWxpdHkvTWFpbGJveE1vZGVsLmpzXCJcbmltcG9ydCB7IEZvbGRlclN5c3RlbSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9tYWlsL0ZvbGRlclN5c3RlbS5qc1wiXG5pbXBvcnQge1xuXHRhc3NlcnROb3ROdWxsLFxuXHRjb2xsZWN0VG9NYXAsXG5cdGdldEZpcnN0T3JUaHJvdyxcblx0Z3JvdXBCeSxcblx0aXNOb3ROdWxsLFxuXHRsYXp5TWVtb2l6ZWQsXG5cdG5ldmVyTnVsbCxcblx0bm9PcCxcblx0b2ZDbGFzcyxcblx0cGFydGl0aW9uLFxuXHRwcm9taXNlTWFwLFxuXHRzcGxpdEluQ2h1bmtzLFxufSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7XG5cdE1haWwsXG5cdE1haWxib3hHcm91cFJvb3QsXG5cdE1haWxib3hQcm9wZXJ0aWVzLFxuXHRNYWlsRm9sZGVyLFxuXHRNYWlsRm9sZGVyVHlwZVJlZixcblx0TWFpbFNldEVudHJ5VHlwZVJlZixcblx0TWFpbFR5cGVSZWYsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7XG5cdEZlYXR1cmVUeXBlLFxuXHRpc0xhYmVsLFxuXHRNYWlsUmVwb3J0VHlwZSxcblx0TWFpbFNldEtpbmQsXG5cdE1BWF9OQlJfTU9WRV9ERUxFVEVfTUFJTF9TRVJWSUNFLFxuXHRPcGVyYXRpb25UeXBlLFxuXHRSZXBvcnRNb3ZlZE1haWxzVHlwZSxcbn0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IENVU1RPTV9NSU5fSUQsIGVsZW1lbnRJZFBhcnQsIEdFTkVSQVRFRF9NQVhfSUQsIGdldEVsZW1lbnRJZCwgZ2V0TGlzdElkLCBpc1NhbWVJZCwgbGlzdElkUGFydCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5pbXBvcnQgeyBjb250YWluc0V2ZW50T2ZUeXBlLCBFbnRpdHlVcGRhdGVEYXRhLCBpc1VwZGF0ZUZvclR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXBkYXRlVXRpbHMuanNcIlxuaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgV2Vic29ja2V0Q291bnRlckRhdGEgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgTm90aWZpY2F0aW9ucywgTm90aWZpY2F0aW9uVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL05vdGlmaWNhdGlvbnMuanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IHsgTG9ja2VkRXJyb3IsIE5vdEZvdW5kRXJyb3IsIFByZWNvbmRpdGlvbkZhaWxlZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvci5qc1wiXG5pbXBvcnQgeyBVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL1VzZXJFcnJvci5qc1wiXG5pbXBvcnQgeyBFdmVudENvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL0V2ZW50Q29udHJvbGxlci5qc1wiXG5pbXBvcnQgeyBJbmJveFJ1bGVIYW5kbGVyIH0gZnJvbSBcIi4vSW5ib3hSdWxlSGFuZGxlci5qc1wiXG5pbXBvcnQgeyBXZWJzb2NrZXRDb25uZWN0aXZpdHlNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9XZWJzb2NrZXRDb25uZWN0aXZpdHlNb2RlbC5qc1wiXG5pbXBvcnQgeyBFbnRpdHlDbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7IExvZ2luQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vTG9naW5Db250cm9sbGVyLmpzXCJcbmltcG9ydCB7IE1haWxGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L01haWxGYWNhZGUuanNcIlxuaW1wb3J0IHsgYXNzZXJ0U3lzdGVtRm9sZGVyT2ZUeXBlIH0gZnJvbSBcIi4vTWFpbFV0aWxzLmpzXCJcbmltcG9ydCB7IGlzU3BhbU9yVHJhc2hGb2xkZXIgfSBmcm9tIFwiLi9NYWlsQ2hlY2tzLmpzXCJcblxuaW50ZXJmYWNlIE1haWxib3hTZXRzIHtcblx0Zm9sZGVyczogRm9sZGVyU3lzdGVtXG5cdC8qKiBhIG1hcCBmcm9tIGVsZW1lbnQgaWQgdG8gdGhlIG1haWwgc2V0ICovXG5cdGxhYmVsczogUmVhZG9ubHlNYXA8SWQsIE1haWxGb2xkZXI+XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIExhYmVsU3RhdGUge1xuXHQvKiogTGFiZWwgd2FzIGFwcGxpZWQgdG8gYWxsIGVtYWlscyovXG5cdEFwcGxpZWQsXG5cdC8qKiBMYWJlbCB3YXMgYXBwbGllZCB0byBzb21lIG9mIHRoZSBlbWFpbHMgYnV0IG5vdCB0byBvdGhlcnMqL1xuXHRBcHBsaWVkVG9Tb21lLFxuXHQvKiogTGFiZWwgd2FzIGFwcGxpZWQgdG8gbm9uZSBvZiB0aGUgZW1haWxzICovXG5cdE5vdEFwcGxpZWQsXG59XG5cbmV4cG9ydCBjbGFzcyBNYWlsTW9kZWwge1xuXHRyZWFkb25seSBtYWlsYm94Q291bnRlcnM6IFN0cmVhbTxNYWlsYm94Q291bnRlcnM+ID0gc3RyZWFtKHt9KVxuXHQvKipcblx0ICogbWFwIGZyb20gbWFpbGJveCBmb2xkZXJzIGxpc3QgdG8gZm9sZGVyIHN5c3RlbVxuXHQgKi9cblx0cHJpdmF0ZSBtYWlsU2V0czogTWFwPElkLCBNYWlsYm94U2V0cz4gPSBuZXcgTWFwKClcblxuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIHJlYWRvbmx5IG5vdGlmaWNhdGlvbnM6IE5vdGlmaWNhdGlvbnMsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBtYWlsYm94TW9kZWw6IE1haWxib3hNb2RlbCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGV2ZW50Q29udHJvbGxlcjogRXZlbnRDb250cm9sbGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBsb2dpbnM6IExvZ2luQ29udHJvbGxlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IG1haWxGYWNhZGU6IE1haWxGYWNhZGUsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBjb25uZWN0aXZpdHlNb2RlbDogV2Vic29ja2V0Q29ubmVjdGl2aXR5TW9kZWwgfCBudWxsLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgaW5ib3hSdWxlSGFuZGxlcjogSW5ib3hSdWxlSGFuZGxlciB8IG51bGwsXG5cdCkge31cblxuXHQvLyBvbmx5IGluaXQgbGlzdGVuZXJzIG9uY2Vcblx0cHJpdmF0ZSByZWFkb25seSBpbml0TGlzdGVuZXJzID0gbGF6eU1lbW9pemVkKCgpID0+IHtcblx0XHR0aGlzLmV2ZW50Q29udHJvbGxlci5hZGRFbnRpdHlMaXN0ZW5lcigodXBkYXRlcykgPT4gdGhpcy5lbnRpdHlFdmVudHNSZWNlaXZlZCh1cGRhdGVzKSlcblxuXHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLmdldENvdW50ZXJzU3RyZWFtKCkubWFwKCh1cGRhdGUpID0+IHtcblx0XHRcdHRoaXMuX21haWxib3hDb3VudGVyc1VwZGF0ZXModXBkYXRlKVxuXHRcdH0pXG5cblx0XHR0aGlzLm1haWxib3hNb2RlbC5tYWlsYm94RGV0YWlscy5tYXAoKCkgPT4ge1xuXHRcdFx0Ly8gdGhpcyBjYW4gY2F1c2UgbGl0dGxlIHJhY2UgYmV0d2VlbiBsb2FkaW5nIHRoZSBmb2xkZXJzIGJ1dCBpdCBzaG91bGQgYmUgZmluZVxuXHRcdFx0dGhpcy5sb2FkTWFpbFNldHMoKS50aGVuKChuZXdGb2xkZXJzKSA9PiAodGhpcy5tYWlsU2V0cyA9IG5ld0ZvbGRlcnMpKVxuXHRcdH0pXG5cdH0pXG5cblx0YXN5bmMgaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmluaXRMaXN0ZW5lcnMoKVxuXHRcdHRoaXMubWFpbFNldHMgPSBhd2FpdCB0aGlzLmxvYWRNYWlsU2V0cygpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGxvYWRNYWlsU2V0cygpOiBQcm9taXNlPE1hcDxJZCwgTWFpbGJveFNldHM+PiB7XG5cdFx0Y29uc3QgbWFpbGJveERldGFpbHMgPSBhd2FpdCB0aGlzLm1haWxib3hNb2RlbC5nZXRNYWlsYm94RGV0YWlscygpXG5cblx0XHRjb25zdCB0ZW1wRm9sZGVycyA9IG5ldyBNYXA8SWQsIE1haWxib3hTZXRzPigpXG5cblx0XHRmb3IgKGxldCBkZXRhaWwgb2YgbWFpbGJveERldGFpbHMpIHtcblx0XHRcdGlmIChkZXRhaWwubWFpbGJveC5mb2xkZXJzKSB7XG5cdFx0XHRcdGNvbnN0IG1haWxTZXRzID0gYXdhaXQgdGhpcy5sb2FkTWFpbFNldHNGb3JMaXN0SWQobmV2ZXJOdWxsKGRldGFpbC5tYWlsYm94LmZvbGRlcnMpLmZvbGRlcnMpXG5cdFx0XHRcdGNvbnN0IFtsYWJlbHMsIGZvbGRlcnNdID0gcGFydGl0aW9uKG1haWxTZXRzLCBpc0xhYmVsKVxuXHRcdFx0XHRjb25zdCBsYWJlbHNNYXAgPSBjb2xsZWN0VG9NYXAobGFiZWxzLCBnZXRFbGVtZW50SWQpXG5cdFx0XHRcdGNvbnN0IGZvbGRlclN5c3RlbSA9IG5ldyBGb2xkZXJTeXN0ZW0oZm9sZGVycylcblx0XHRcdFx0dGVtcEZvbGRlcnMuc2V0KGRldGFpbC5tYWlsYm94LmZvbGRlcnMuX2lkLCB7IGZvbGRlcnM6IGZvbGRlclN5c3RlbSwgbGFiZWxzOiBsYWJlbHNNYXAgfSlcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHRlbXBGb2xkZXJzXG5cdH1cblxuXHRwcml2YXRlIGxvYWRNYWlsU2V0c0Zvckxpc3RJZChsaXN0SWQ6IElkKTogUHJvbWlzZTxNYWlsRm9sZGVyW10+IHtcblx0XHRyZXR1cm4gdGhpcy5lbnRpdHlDbGllbnQubG9hZEFsbChNYWlsRm9sZGVyVHlwZVJlZiwgbGlzdElkKS50aGVuKChmb2xkZXJzKSA9PiB7XG5cdFx0XHRyZXR1cm4gZm9sZGVycy5maWx0ZXIoKGYpID0+IHtcblx0XHRcdFx0Ly8gV2UgZG8gbm90IHNob3cgc3BhbSBvciBhcmNoaXZlIGZvciBleHRlcm5hbCB1c2Vyc1xuXHRcdFx0XHRpZiAoIXRoaXMubG9naW5zLmlzSW50ZXJuYWxVc2VyTG9nZ2VkSW4oKSAmJiAoZi5mb2xkZXJUeXBlID09PSBNYWlsU2V0S2luZC5TUEFNIHx8IGYuZm9sZGVyVHlwZSA9PT0gTWFpbFNldEtpbmQuQVJDSElWRSkpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gISh0aGlzLmxvZ2lucy5pc0VuYWJsZWQoRmVhdHVyZVR5cGUuSW50ZXJuYWxDb21tdW5pY2F0aW9uKSAmJiBmLmZvbGRlclR5cGUgPT09IE1haWxTZXRLaW5kLlNQQU0pXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZ2V0Rm9sZGVycygpOiBQcm9taXNlPE1hcDxJZCwgTWFpbGJveFNldHM+PiB7XG5cdFx0aWYgKHRoaXMubWFpbFNldHMuc2l6ZSA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMubG9hZE1haWxTZXRzKClcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRoaXMubWFpbFNldHNcblx0XHR9XG5cdH1cblxuXHQvLyB2aXNpYmxlRm9yVGVzdGluZ1xuXHRhc3luYyBlbnRpdHlFdmVudHNSZWNlaXZlZCh1cGRhdGVzOiBSZWFkb25seUFycmF5PEVudGl0eVVwZGF0ZURhdGE+KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Zm9yIChjb25zdCB1cGRhdGUgb2YgdXBkYXRlcykge1xuXHRcdFx0aWYgKGlzVXBkYXRlRm9yVHlwZVJlZihNYWlsRm9sZGVyVHlwZVJlZiwgdXBkYXRlKSkge1xuXHRcdFx0XHRhd2FpdCB0aGlzLmluaXQoKVxuXHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHR9IGVsc2UgaWYgKFxuXHRcdFx0XHRpc1VwZGF0ZUZvclR5cGVSZWYoTWFpbFR5cGVSZWYsIHVwZGF0ZSkgJiZcblx0XHRcdFx0dXBkYXRlLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5DUkVBVEUgJiZcblx0XHRcdFx0IWNvbnRhaW5zRXZlbnRPZlR5cGUodXBkYXRlcywgT3BlcmF0aW9uVHlwZS5ERUxFVEUsIHVwZGF0ZS5pbnN0YW5jZUlkKVxuXHRcdFx0KSB7XG5cdFx0XHRcdGlmICh0aGlzLmluYm94UnVsZUhhbmRsZXIgJiYgdGhpcy5jb25uZWN0aXZpdHlNb2RlbCkge1xuXHRcdFx0XHRcdGNvbnN0IG1haWxJZDogSWRUdXBsZSA9IFt1cGRhdGUuaW5zdGFuY2VMaXN0SWQsIHVwZGF0ZS5pbnN0YW5jZUlkXVxuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRjb25zdCBtYWlsID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChNYWlsVHlwZVJlZiwgbWFpbElkKVxuXHRcdFx0XHRcdFx0Y29uc3QgZm9sZGVyID0gdGhpcy5nZXRNYWlsRm9sZGVyRm9yTWFpbChtYWlsKVxuXG5cdFx0XHRcdFx0XHRpZiAoZm9sZGVyICYmIGZvbGRlci5mb2xkZXJUeXBlID09PSBNYWlsU2V0S2luZC5JTkJPWCkge1xuXHRcdFx0XHRcdFx0XHQvLyBJZiB3ZSBkb24ndCBmaW5kIGFub3RoZXIgZGVsZXRlIG9wZXJhdGlvbiBvbiB0aGlzIGVtYWlsIGluIHRoZSBiYXRjaCwgdGhlbiBpdCBzaG91bGQgYmUgYSBjcmVhdGUgb3BlcmF0aW9uLFxuXHRcdFx0XHRcdFx0XHQvLyBvdGhlcndpc2UgaXQncyBhIG1vdmVcblx0XHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5nZXRNYWlsYm94RGV0YWlsc0Zvck1haWwobWFpbClcblx0XHRcdFx0XHRcdFx0XHQudGhlbigobWFpbGJveERldGFpbCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0Ly8gV2Ugb25seSBhcHBseSBydWxlcyBvbiBzZXJ2ZXIgaWYgd2UgYXJlIHRoZSBsZWFkZXIgaW4gY2FzZSBvZiBpbmNvbWluZyBtZXNzYWdlc1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIChcblx0XHRcdFx0XHRcdFx0XHRcdFx0bWFpbGJveERldGFpbCAmJlxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmluYm94UnVsZUhhbmRsZXI/LmZpbmRBbmRBcHBseU1hdGNoaW5nUnVsZShcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtYWlsYm94RGV0YWlsLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG1haWwsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5jb25uZWN0aXZpdHlNb2RlbCA/IHRoaXMuY29ubmVjdGl2aXR5TW9kZWwuaXNMZWFkZXIoKSA6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHQudGhlbigobmV3Rm9sZGVyQW5kTWFpbCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKG5ld0ZvbGRlckFuZE1haWwpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5fc2hvd05vdGlmaWNhdGlvbihuZXdGb2xkZXJBbmRNYWlsLmZvbGRlciwgbmV3Rm9sZGVyQW5kTWFpbC5tYWlsKVxuXHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5fc2hvd05vdGlmaWNhdGlvbihmb2xkZXIsIG1haWwpXG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHQuY2F0Y2gobm9PcClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coYENvdWxkIG5vdCBmaW5kIHVwZGF0ZWQgbWFpbCAke0pTT04uc3RyaW5naWZ5KG1haWxJZCl9YClcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHRocm93IGVcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRhc3luYyBnZXRNYWlsYm94RGV0YWlsc0Zvck1haWwobWFpbDogTWFpbCk6IFByb21pc2U8TWFpbGJveERldGFpbCB8IG51bGw+IHtcblx0XHRjb25zdCBkZXRhaWwgPSBhd2FpdCB0aGlzLm1haWxib3hNb2RlbC5nZXRNYWlsYm94RGV0YWlsc0Zvck1haWxHcm91cChhc3NlcnROb3ROdWxsKG1haWwuX293bmVyR3JvdXApKVxuXHRcdGlmIChkZXRhaWwgPT0gbnVsbCkge1xuXHRcdFx0Y29uc29sZS53YXJuKFwiTWFpbGJveCBkZXRhaWwgZm9yIG1haWwgZG9lcyBub3QgZXhpc3RcIiwgbWFpbClcblx0XHR9XG5cdFx0cmV0dXJuIGRldGFpbFxuXHR9XG5cblx0YXN5bmMgZ2V0TWFpbGJveERldGFpbHNGb3JNYWlsRm9sZGVyKG1haWxGb2xkZXI6IE1haWxGb2xkZXIpOiBQcm9taXNlPE1haWxib3hEZXRhaWwgfCBudWxsPiB7XG5cdFx0Y29uc3QgZGV0YWlsID0gYXdhaXQgdGhpcy5tYWlsYm94TW9kZWwuZ2V0TWFpbGJveERldGFpbHNGb3JNYWlsR3JvdXAoYXNzZXJ0Tm90TnVsbChtYWlsRm9sZGVyLl9vd25lckdyb3VwKSlcblx0XHRpZiAoZGV0YWlsID09IG51bGwpIHtcblx0XHRcdGNvbnNvbGUud2FybihcIk1haWxib3ggZGV0YWlsIGZvciBtYWlsIGZvbGRlciBkb2VzIG5vdCBleGlzdFwiLCBtYWlsRm9sZGVyKVxuXHRcdH1cblx0XHRyZXR1cm4gZGV0YWlsXG5cdH1cblxuXHRhc3luYyBnZXRNYWlsYm94Rm9sZGVyc0Zvck1haWwobWFpbDogTWFpbCk6IFByb21pc2U8Rm9sZGVyU3lzdGVtIHwgbnVsbD4ge1xuXHRcdGNvbnN0IG1haWxib3hEZXRhaWwgPSBhd2FpdCB0aGlzLmdldE1haWxib3hEZXRhaWxzRm9yTWFpbChtYWlsKVxuXHRcdGlmIChtYWlsYm94RGV0YWlsICYmIG1haWxib3hEZXRhaWwubWFpbGJveC5mb2xkZXJzKSB7XG5cdFx0XHRjb25zdCBmb2xkZXJzID0gYXdhaXQgdGhpcy5nZXRGb2xkZXJzKClcblx0XHRcdHJldHVybiBmb2xkZXJzLmdldChtYWlsYm94RGV0YWlsLm1haWxib3guZm9sZGVycy5faWQpPy5mb2xkZXJzID8/IG51bGxcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cdH1cblxuXHRhc3luYyBnZXRNYWlsYm94Rm9sZGVyc0ZvcklkKGZvbGRlcnNJZDogSWQpOiBQcm9taXNlPEZvbGRlclN5c3RlbT4ge1xuXHRcdGNvbnN0IGZvbGRlclN0cnVjdHVyZXMgPSBhd2FpdCB0aGlzLmxvYWRNYWlsU2V0cygpXG5cdFx0Y29uc3QgZm9sZGVyU3lzdGVtID0gZm9sZGVyU3RydWN0dXJlcy5nZXQoZm9sZGVyc0lkKT8uZm9sZGVyc1xuXHRcdGlmIChmb2xkZXJTeXN0ZW0gPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoYG5vIGZvbGRlciBzeXN0ZW0gZm9yIGZvbGRlciBpZCAke2ZvbGRlcnNJZH1gKVxuXHRcdH1cblx0XHRyZXR1cm4gZm9sZGVyU3lzdGVtXG5cdH1cblxuXHRnZXRNYWlsRm9sZGVyRm9yTWFpbChtYWlsOiBNYWlsKTogTWFpbEZvbGRlciB8IG51bGwge1xuXHRcdGNvbnN0IGZvbGRlclN5c3RlbSA9IHRoaXMuZ2V0Rm9sZGVyU3lzdGVtQnlHcm91cElkKGFzc2VydE5vdE51bGwobWFpbC5fb3duZXJHcm91cCkpXG5cdFx0aWYgKGZvbGRlclN5c3RlbSA9PSBudWxsKSByZXR1cm4gbnVsbFxuXG5cdFx0cmV0dXJuIGZvbGRlclN5c3RlbS5nZXRGb2xkZXJCeU1haWwobWFpbClcblx0fVxuXG5cdGdldEZvbGRlclN5c3RlbUJ5R3JvdXBJZChncm91cElkOiBJZCk6IEZvbGRlclN5c3RlbSB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLmdldE1haWxTZXRzRm9yR3JvdXAoZ3JvdXBJZCk/LmZvbGRlcnMgPz8gbnVsbFxuXHR9XG5cblx0Z2V0TGFiZWxzQnlHcm91cElkKGdyb3VwSWQ6IElkKTogUmVhZG9ubHlNYXA8SWQsIE1haWxGb2xkZXI+IHtcblx0XHRyZXR1cm4gdGhpcy5nZXRNYWlsU2V0c0Zvckdyb3VwKGdyb3VwSWQpPy5sYWJlbHMgPz8gbmV3IE1hcCgpXG5cdH1cblxuXHQvKipcblx0ICogQHJldHVybiBhbGwgbGFiZWxzIHRoYXQgY291bGQgYmUgYXBwbGllZCB0byB0aGUge0BwYXJhbSBtYWlsc30gd2l0aCB0aGUgc3RhdGUgcmVsYXRpdmUgdG8ge0BwYXJhbSBtYWlsc30uXG5cdCAqL1xuXHRnZXRMYWJlbFN0YXRlc0Zvck1haWxzKG1haWxzOiByZWFkb25seSBNYWlsW10pOiB7IGxhYmVsOiBNYWlsRm9sZGVyOyBzdGF0ZTogTGFiZWxTdGF0ZSB9W10ge1xuXHRcdGlmIChtYWlscy5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybiBbXVxuXHRcdH1cblx0XHRjb25zdCBsYWJlbHMgPSB0aGlzLmdldExhYmVsc0J5R3JvdXBJZChhc3NlcnROb3ROdWxsKGdldEZpcnN0T3JUaHJvdyhtYWlscykuX293bmVyR3JvdXApKVxuXHRcdGNvbnN0IGFsbFVzZWRTZXRzID0gbmV3IE1hcDxJZCwgbnVtYmVyPigpXG5cdFx0Zm9yIChjb25zdCBtYWlsIG9mIG1haWxzKSB7XG5cdFx0XHRmb3IgKGNvbnN0IHNldCBvZiBtYWlsLnNldHMpIHtcblx0XHRcdFx0Y29uc3QgY3VycmVudFZhbHVlID0gYWxsVXNlZFNldHMuZ2V0KGVsZW1lbnRJZFBhcnQoc2V0KSkgPz8gMFxuXHRcdFx0XHRhbGxVc2VkU2V0cy5zZXQoZWxlbWVudElkUGFydChzZXQpLCBjdXJyZW50VmFsdWUgKyAxKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBBcnJheS5mcm9tKGxhYmVscy52YWx1ZXMoKSkubWFwKChsYWJlbCkgPT4ge1xuXHRcdFx0Y29uc3QgY291bnQgPSBhbGxVc2VkU2V0cy5nZXQoZ2V0RWxlbWVudElkKGxhYmVsKSkgPz8gMFxuXHRcdFx0Y29uc3Qgc3RhdGU6IExhYmVsU3RhdGUgPSBjb3VudCA9PT0gMCA/IExhYmVsU3RhdGUuTm90QXBwbGllZCA6IGNvdW50ID09PSBtYWlscy5sZW5ndGggPyBMYWJlbFN0YXRlLkFwcGxpZWQgOiBMYWJlbFN0YXRlLkFwcGxpZWRUb1NvbWVcblx0XHRcdHJldHVybiB7IGxhYmVsLCBzdGF0ZSB9XG5cdFx0fSlcblx0fVxuXG5cdGdldExhYmVsc0Zvck1haWxzKG1haWxzOiByZWFkb25seSBNYWlsW10pOiBSZWFkb25seU1hcDxJZCwgUmVhZG9ubHlBcnJheTxNYWlsRm9sZGVyPj4ge1xuXHRcdGNvbnN0IGxhYmVsc0Zvck1haWxzID0gbmV3IE1hcDxJZCwgTWFpbEZvbGRlcltdPigpXG5cdFx0Zm9yIChjb25zdCBtYWlsIG9mIG1haWxzKSB7XG5cdFx0XHRsYWJlbHNGb3JNYWlscy5zZXQoZ2V0RWxlbWVudElkKG1haWwpLCB0aGlzLmdldExhYmVsc0Zvck1haWwobWFpbCkpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGxhYmVsc0Zvck1haWxzXG5cdH1cblxuXHQvKipcblx0ICogQHJldHVybiBsYWJlbHMgdGhhdCBhcmUgY3VycmVudGx5IGFwcGxpZWQgdG8ge0BwYXJhbSBtYWlsfS5cblx0ICovXG5cdGdldExhYmVsc0Zvck1haWwobWFpbDogTWFpbCk6IE1haWxGb2xkZXJbXSB7XG5cdFx0Y29uc3QgZ3JvdXBMYWJlbHMgPSB0aGlzLmdldExhYmVsc0J5R3JvdXBJZChhc3NlcnROb3ROdWxsKG1haWwuX293bmVyR3JvdXApKVxuXHRcdHJldHVybiBtYWlsLnNldHMubWFwKChsYWJlbElkKSA9PiBncm91cExhYmVscy5nZXQoZWxlbWVudElkUGFydChsYWJlbElkKSkpLmZpbHRlcihpc05vdE51bGwpXG5cdH1cblxuXHRwcml2YXRlIGdldE1haWxTZXRzRm9yR3JvdXAoZ3JvdXBJZDogSWQpOiBNYWlsYm94U2V0cyB8IG51bGwge1xuXHRcdGNvbnN0IG1haWxib3hEZXRhaWxzID0gdGhpcy5tYWlsYm94TW9kZWwubWFpbGJveERldGFpbHMoKSB8fCBbXVxuXHRcdGNvbnN0IGRldGFpbCA9IG1haWxib3hEZXRhaWxzLmZpbmQoKG1kKSA9PiBncm91cElkID09PSBtZC5tYWlsR3JvdXAuX2lkKVxuXHRcdGNvbnN0IHNldHMgPSBkZXRhaWw/Lm1haWxib3g/LmZvbGRlcnM/Ll9pZFxuXHRcdGlmIChzZXRzID09IG51bGwpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLm1haWxTZXRzLmdldChzZXRzKSA/PyBudWxsXG5cdH1cblxuXHQvKipcblx0ICogRmluYWxseSBtb3ZlIGFsbCBnaXZlbiBtYWlscy4gQ2FsbGVyIG11c3QgZW5zdXJlIHRoYXQgbWFpbHMgYXJlIG9ubHkgZnJvbVxuXHQgKiAqIG9uZSBmb2xkZXIgKGJlY2F1c2Ugd2Ugc2VuZCBvbmUgc291cmNlIGZvbGRlcilcblx0ICogKiBmcm9tIG9uZSBsaXN0IChmb3IgbG9ja2luZyBpdCBvbiB0aGUgc2VydmVyKVxuXHQgKi9cblx0YXN5bmMgX21vdmVNYWlscyhtYWlsczogTWFpbFtdLCB0YXJnZXRNYWlsRm9sZGVyOiBNYWlsRm9sZGVyKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gRG8gbm90IG1vdmUgaWYgdGFyZ2V0IGlzIHRoZSBzYW1lIGFzIHRoZSBjdXJyZW50IG1haWxGb2xkZXJcblx0XHRjb25zdCBzb3VyY2VNYWlsRm9sZGVyID0gdGhpcy5nZXRNYWlsRm9sZGVyRm9yTWFpbChtYWlsc1swXSlcblx0XHRsZXQgbW92ZU1haWxzID0gbWFpbHMuZmlsdGVyKChtKSA9PiBzb3VyY2VNYWlsRm9sZGVyICE9PSB0YXJnZXRNYWlsRm9sZGVyICYmIHRhcmdldE1haWxGb2xkZXIuX293bmVyR3JvdXAgPT09IG0uX293bmVyR3JvdXApIC8vIHByZXZlbnQgbW92aW5nIG1haWxzIGJldHdlZW4gbWFpbCBib3hlcy5cblxuXHRcdGlmIChtb3ZlTWFpbHMubGVuZ3RoID4gMCAmJiBzb3VyY2VNYWlsRm9sZGVyICYmICFpc1NhbWVJZCh0YXJnZXRNYWlsRm9sZGVyLl9pZCwgc291cmNlTWFpbEZvbGRlci5faWQpKSB7XG5cdFx0XHRjb25zdCBtYWlsQ2h1bmtzID0gc3BsaXRJbkNodW5rcyhcblx0XHRcdFx0TUFYX05CUl9NT1ZFX0RFTEVURV9NQUlMX1NFUlZJQ0UsXG5cdFx0XHRcdG1haWxzLm1hcCgobSkgPT4gbS5faWQpLFxuXHRcdFx0KVxuXG5cdFx0XHRmb3IgKGNvbnN0IG1haWxDaHVuayBvZiBtYWlsQ2h1bmtzKSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMubWFpbEZhY2FkZS5tb3ZlTWFpbHMobWFpbENodW5rLCBzb3VyY2VNYWlsRm9sZGVyLl9pZCwgdGFyZ2V0TWFpbEZvbGRlci5faWQpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFByZWZlcmFibHkgdXNlIG1vdmVNYWlscygpIGluIE1haWxHdWlVdGlscy5qcyB3aGljaCBoYXMgYnVpbHQtaW4gZXJyb3IgaGFuZGxpbmdcblx0ICogQHRocm93cyBQcmVjb25kaXRpb25GYWlsZWRFcnJvciBvciBMb2NrZWRFcnJvciBpZiBvcGVyYXRpb24gaXMgbG9ja2VkIG9uIHRoZSBzZXJ2ZXJcblx0ICovXG5cdGFzeW5jIG1vdmVNYWlscyhtYWlsczogUmVhZG9ubHlBcnJheTxNYWlsPiwgdGFyZ2V0TWFpbEZvbGRlcjogTWFpbEZvbGRlcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG1haWxzUGVyRm9sZGVyID0gZ3JvdXBCeShtYWlscywgKG1haWwpID0+IHtcblx0XHRcdHJldHVybiB0aGlzLmdldE1haWxGb2xkZXJGb3JNYWlsKG1haWwpPy5faWQ/LlsxXVxuXHRcdH0pXG5cblx0XHRmb3IgKGNvbnN0IFtmb2xkZXJJZCwgbWFpbHNJbkZvbGRlcl0gb2YgbWFpbHNQZXJGb2xkZXIpIHtcblx0XHRcdGNvbnN0IHNvdXJjZU1haWxGb2xkZXIgPSB0aGlzLmdldE1haWxGb2xkZXJGb3JNYWlsKG1haWxzSW5Gb2xkZXJbMF0pXG5cblx0XHRcdGlmIChzb3VyY2VNYWlsRm9sZGVyKSB7XG5cdFx0XHRcdC8vIGdyb3VwIGFub3RoZXIgdGltZSBiZWNhdXNlIG1haWxzIGluIHRoZSBzYW1lIFNldCBjYW4gYmUgZnJvbSBkaWZmZXJlbnQgbWFpbCBiYWdzLlxuXHRcdFx0XHRjb25zdCBtYWlsc1Blckxpc3QgPSBncm91cEJ5KG1haWxzSW5Gb2xkZXIsIChtYWlsKSA9PiBnZXRMaXN0SWQobWFpbCkpXG5cdFx0XHRcdGZvciAoY29uc3QgW2xpc3RJZCwgbWFpbHNJbkxpc3RdIG9mIG1haWxzUGVyTGlzdCkge1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMuX21vdmVNYWlscyhtYWlsc0luTGlzdCwgdGFyZ2V0TWFpbEZvbGRlcilcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJNb3ZlIG1haWw6IG5vIG1haWwgZm9sZGVyIGZvciBmb2xkZXIgaWRcIiwgZm9sZGVySWQpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEZpbmFsbHkgZGVsZXRlcyB0aGUgZ2l2ZW4gbWFpbHMgaWYgdGhleSBhcmUgYWxyZWFkeSBpbiB0aGUgdHJhc2ggb3Igc3BhbSBmb2xkZXJzLFxuXHQgKiBvdGhlcndpc2UgbW92ZXMgdGhlbSB0byB0aGUgdHJhc2ggZm9sZGVyLlxuXHQgKiBBIGRlbGV0aW9uIGNvbmZpcm1hdGlvbiBtdXN0IGhhdmUgYmVlbiBzaG93IGJlZm9yZS5cblx0ICovXG5cdGFzeW5jIGRlbGV0ZU1haWxzKG1haWxzOiBSZWFkb25seUFycmF5PE1haWw+KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKG1haWxzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Y29uc3QgbWFpbHNQZXJGb2xkZXIgPSBncm91cEJ5KG1haWxzLCAobWFpbCkgPT4ge1xuXHRcdFx0cmV0dXJuIHRoaXMuZ2V0TWFpbEZvbGRlckZvck1haWwobWFpbCk/Ll9pZD8uWzFdXG5cdFx0fSlcblxuXHRcdGNvbnN0IGZvbGRlcnMgPSBhd2FpdCB0aGlzLmdldE1haWxib3hGb2xkZXJzRm9yTWFpbChtYWlsc1swXSlcblx0XHRpZiAoZm9sZGVycyA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0Y29uc3QgdHJhc2hGb2xkZXIgPSBhc3NlcnROb3ROdWxsKGZvbGRlcnMuZ2V0U3lzdGVtRm9sZGVyQnlUeXBlKE1haWxTZXRLaW5kLlRSQVNIKSlcblxuXHRcdGZvciAoY29uc3QgW2ZvbGRlciwgbWFpbHNJbkZvbGRlcl0gb2YgbWFpbHNQZXJGb2xkZXIpIHtcblx0XHRcdGNvbnN0IHNvdXJjZU1haWxGb2xkZXIgPSB0aGlzLmdldE1haWxGb2xkZXJGb3JNYWlsKG1haWxzSW5Gb2xkZXJbMF0pXG5cblx0XHRcdGNvbnN0IG1haWxzUGVyTGlzdCA9IGdyb3VwQnkobWFpbHNJbkZvbGRlciwgKG1haWwpID0+IGdldExpc3RJZChtYWlsKSlcblx0XHRcdGZvciAoY29uc3QgW2xpc3RJZCwgbWFpbHNJbkxpc3RdIG9mIG1haWxzUGVyTGlzdCkge1xuXHRcdFx0XHRpZiAoc291cmNlTWFpbEZvbGRlcikge1xuXHRcdFx0XHRcdGlmIChpc1NwYW1PclRyYXNoRm9sZGVyKGZvbGRlcnMsIHNvdXJjZU1haWxGb2xkZXIpKSB7XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLmZpbmFsbHlEZWxldGVNYWlscyhtYWlsc0luTGlzdClcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5fbW92ZU1haWxzKG1haWxzSW5MaXN0LCB0cmFzaEZvbGRlcilcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJEZWxldGUgbWFpbDogbm8gbWFpbCBmb2xkZXIgZm9yIGxpc3QgaWRcIiwgZm9sZGVyKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIEZpbmFsbHkgZGVsZXRlcyBhbGwgZ2l2ZW4gbWFpbHMuIENhbGxlciBtdXN0IGVuc3VyZSB0aGF0IG1haWxzIGFyZSBvbmx5IGZyb20gb25lIGZvbGRlciBhbmQgdGhlIGZvbGRlciBtdXN0IGFsbG93IGZpbmFsIGRlbGV0ZSBvcGVyYXRpb24uXG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGZpbmFsbHlEZWxldGVNYWlscyhtYWlsczogTWFpbFtdKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKCFtYWlscy5sZW5ndGgpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHRcdGNvbnN0IG1haWxGb2xkZXIgPSBuZXZlck51bGwodGhpcy5nZXRNYWlsRm9sZGVyRm9yTWFpbChtYWlsc1swXSkpXG5cdFx0Y29uc3QgbWFpbElkcyA9IG1haWxzLm1hcCgobSkgPT4gbS5faWQpXG5cdFx0Y29uc3QgbWFpbENodW5rcyA9IHNwbGl0SW5DaHVua3MoTUFYX05CUl9NT1ZFX0RFTEVURV9NQUlMX1NFUlZJQ0UsIG1haWxJZHMpXG5cblx0XHRmb3IgKGNvbnN0IG1haWxDaHVuayBvZiBtYWlsQ2h1bmtzKSB7XG5cdFx0XHRhd2FpdCB0aGlzLm1haWxGYWNhZGUuZGVsZXRlTWFpbHMobWFpbENodW5rLCBtYWlsRm9sZGVyLl9pZClcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogU2VuZHMgdGhlIGdpdmVuIGZvbGRlciBhbmQgYWxsIGl0cyBkZXNjZW5kYW50cyB0byB0aGUgc3BhbSBmb2xkZXIsIHJlcG9ydGluZyBtYWlscyAoaWYgYXBwbGljYWJsZSkgYW5kIHJlbW92ZXMgYW55IGVtcHR5IGZvbGRlcnNcblx0ICovXG5cdGFzeW5jIHNlbmRGb2xkZXJUb1NwYW0oZm9sZGVyOiBNYWlsRm9sZGVyKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgbWFpbGJveERldGFpbCA9IGF3YWl0IHRoaXMuZ2V0TWFpbGJveERldGFpbHNGb3JNYWlsRm9sZGVyKGZvbGRlcilcblx0XHRpZiAobWFpbGJveERldGFpbCA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHRjb25zdCBmb2xkZXJTeXN0ZW0gPSB0aGlzLmdldEZvbGRlclN5c3RlbUJ5R3JvdXBJZChhc3NlcnROb3ROdWxsKGZvbGRlci5fb3duZXJHcm91cCkpXG5cdFx0aWYgKGZvbGRlclN5c3RlbSA9PSBudWxsKSByZXR1cm5cblx0XHRjb25zdCBkZWxldGVkRm9sZGVyID0gYXdhaXQgdGhpcy5yZW1vdmVBbGxFbXB0eShmb2xkZXJTeXN0ZW0sIGZvbGRlcilcblx0XHRpZiAoIWRlbGV0ZWRGb2xkZXIpIHtcblx0XHRcdHJldHVybiB0aGlzLm1haWxGYWNhZGUudXBkYXRlTWFpbEZvbGRlclBhcmVudChmb2xkZXIsIGFzc2VydFN5c3RlbUZvbGRlck9mVHlwZShmb2xkZXJTeXN0ZW0sIE1haWxTZXRLaW5kLlNQQU0pLl9pZClcblx0XHR9XG5cdH1cblxuXHRhc3luYyByZXBvcnRNYWlscyhyZXBvcnRUeXBlOiBNYWlsUmVwb3J0VHlwZSwgbWFpbHM6IFJlYWRvbmx5QXJyYXk8TWFpbD4pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRmb3IgKGNvbnN0IG1haWwgb2YgbWFpbHMpIHtcblx0XHRcdGF3YWl0IHRoaXMubWFpbEZhY2FkZS5yZXBvcnRNYWlsKG1haWwsIHJlcG9ydFR5cGUpLmNhdGNoKG9mQ2xhc3MoTm90Rm91bmRFcnJvciwgKGUpID0+IGNvbnNvbGUubG9nKFwibWFpbCB0byBiZSByZXBvcnRlZCBub3QgZm91bmRcIiwgZSkpKVxuXHRcdH1cblx0fVxuXG5cdGlzTW92aW5nTWFpbHNBbGxvd2VkKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzSW50ZXJuYWxVc2VyKClcblx0fVxuXG5cdGNhbk1hbmFnZUxhYmVscygpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0ludGVybmFsVXNlcigpXG5cdH1cblxuXHRjYW5Bc3NpZ25MYWJlbHMoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuaXNJbnRlcm5hbFVzZXIoKVxuXHR9XG5cblx0aXNFeHBvcnRpbmdNYWlsc0FsbG93ZWQoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuICF0aGlzLmxvZ2lucy5pc0VuYWJsZWQoRmVhdHVyZVR5cGUuRGlzYWJsZU1haWxFeHBvcnQpXG5cdH1cblxuXHRhc3luYyBtYXJrTWFpbHMobWFpbHM6IHJlYWRvbmx5IE1haWxbXSwgdW5yZWFkOiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgcHJvbWlzZU1hcChcblx0XHRcdG1haWxzLFxuXHRcdFx0YXN5bmMgKG1haWwpID0+IHtcblx0XHRcdFx0aWYgKG1haWwudW5yZWFkICE9PSB1bnJlYWQpIHtcblx0XHRcdFx0XHRtYWlsLnVucmVhZCA9IHVucmVhZFxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmVudGl0eUNsaWVudC51cGRhdGUobWFpbCkuY2F0Y2gob2ZDbGFzcyhOb3RGb3VuZEVycm9yLCBub09wKSkuY2F0Y2gob2ZDbGFzcyhMb2NrZWRFcnJvciwgbm9PcCkpXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHR7IGNvbmN1cnJlbmN5OiA1IH0sXG5cdFx0KVxuXHR9XG5cblx0YXN5bmMgYXBwbHlMYWJlbHMobWFpbHM6IHJlYWRvbmx5IE1haWxbXSwgYWRkZWRMYWJlbHM6IHJlYWRvbmx5IE1haWxGb2xkZXJbXSwgcmVtb3ZlZExhYmVsczogcmVhZG9ubHkgTWFpbEZvbGRlcltdKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgZ3JvdXBlZEJ5TGlzdElkcyA9IGdyb3VwQnkobWFpbHMsIChtYWlsKSA9PiBsaXN0SWRQYXJ0KG1haWwuX2lkKSlcblx0XHRmb3IgKGNvbnN0IFtfLCBncm91cGVkTWFpbHNdIG9mIGdyb3VwZWRCeUxpc3RJZHMpIHtcblx0XHRcdGNvbnN0IG1haWxDaHVua3MgPSBzcGxpdEluQ2h1bmtzKE1BWF9OQlJfTU9WRV9ERUxFVEVfTUFJTF9TRVJWSUNFLCBncm91cGVkTWFpbHMpXG5cdFx0XHRmb3IgKGNvbnN0IG1haWxDaHVuayBvZiBtYWlsQ2h1bmtzKSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMubWFpbEZhY2FkZS5hcHBseUxhYmVscyhtYWlsQ2h1bmssIGFkZGVkTGFiZWxzLCByZW1vdmVkTGFiZWxzKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdF9tYWlsYm94Q291bnRlcnNVcGRhdGVzKGNvdW50ZXJzOiBXZWJzb2NrZXRDb3VudGVyRGF0YSkge1xuXHRcdGNvbnN0IG5vcm1hbGl6ZWQgPSB0aGlzLm1haWxib3hDb3VudGVycygpIHx8IHt9XG5cdFx0Y29uc3QgZ3JvdXAgPSBub3JtYWxpemVkW2NvdW50ZXJzLm1haWxHcm91cF0gfHwge31cblx0XHRmb3IgKGNvbnN0IHZhbHVlIG9mIGNvdW50ZXJzLmNvdW50ZXJWYWx1ZXMpIHtcblx0XHRcdGdyb3VwW3ZhbHVlLmNvdW50ZXJJZF0gPSBOdW1iZXIodmFsdWUuY291bnQpIHx8IDBcblx0XHR9XG5cdFx0bm9ybWFsaXplZFtjb3VudGVycy5tYWlsR3JvdXBdID0gZ3JvdXBcblx0XHR0aGlzLm1haWxib3hDb3VudGVycyhub3JtYWxpemVkKVxuXHR9XG5cblx0X3Nob3dOb3RpZmljYXRpb24oZm9sZGVyOiBNYWlsRm9sZGVyLCBtYWlsOiBNYWlsKSB7XG5cdFx0dGhpcy5ub3RpZmljYXRpb25zLnNob3dOb3RpZmljYXRpb24oXG5cdFx0XHROb3RpZmljYXRpb25UeXBlLk1haWwsXG5cdFx0XHRsYW5nLmdldChcIm5ld01haWxzX21zZ1wiKSxcblx0XHRcdHtcblx0XHRcdFx0YWN0aW9uczogW10sXG5cdFx0XHR9LFxuXHRcdFx0KF8pID0+IHtcblx0XHRcdFx0bS5yb3V0ZS5zZXQoYC9tYWlsLyR7Z2V0RWxlbWVudElkKGZvbGRlcil9LyR7Z2V0RWxlbWVudElkKG1haWwpfWApXG5cdFx0XHRcdHdpbmRvdy5mb2N1cygpXG5cdFx0XHR9LFxuXHRcdClcblx0fVxuXG5cdGdldENvdW50ZXJWYWx1ZShmb2xkZXI6IE1haWxGb2xkZXIpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcblx0XHRyZXR1cm4gdGhpcy5nZXRNYWlsYm94RGV0YWlsc0Zvck1haWxGb2xkZXIoZm9sZGVyKVxuXHRcdFx0LnRoZW4oKG1haWxib3hEZXRhaWxzKSA9PiB7XG5cdFx0XHRcdGlmIChtYWlsYm94RGV0YWlscyA9PSBudWxsKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zdCBtYWlsR3JvdXBDb3VudGVyID0gdGhpcy5tYWlsYm94Q291bnRlcnMoKVttYWlsYm94RGV0YWlscy5tYWlsR3JvdXAuX2lkXVxuXHRcdFx0XHRcdGlmIChtYWlsR3JvdXBDb3VudGVyKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBjb3VudGVySWQgPSBmb2xkZXIuaXNNYWlsU2V0ID8gZ2V0RWxlbWVudElkKGZvbGRlcikgOiBmb2xkZXIubWFpbHNcblx0XHRcdFx0XHRcdHJldHVybiBtYWlsR3JvdXBDb3VudGVyW2NvdW50ZXJJZF1cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2goKCkgPT4gbnVsbClcblx0fVxuXG5cdGNoZWNrTWFpbEZvclBoaXNoaW5nKFxuXHRcdG1haWw6IE1haWwsXG5cdFx0bGlua3M6IEFycmF5PHtcblx0XHRcdGhyZWY6IHN0cmluZ1xuXHRcdFx0aW5uZXJIVE1MOiBzdHJpbmdcblx0XHR9Pixcblx0KTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0cmV0dXJuIHRoaXMubWFpbEZhY2FkZS5jaGVja01haWxGb3JQaGlzaGluZyhtYWlsLCBsaW5rcylcblx0fVxuXG5cdC8qKlxuXHQgKiBTZW5kcyB0aGUgZ2l2ZW4gZm9sZGVyIGFuZCBhbGwgaXRzIGRlc2NlbmRhbnRzIHRvIHRoZSB0cmFzaCBmb2xkZXIsIHJlbW92ZXMgYW55IGVtcHR5IGZvbGRlcnNcblx0ICovXG5cdGFzeW5jIHRyYXNoRm9sZGVyQW5kU3ViZm9sZGVycyhmb2xkZXI6IE1haWxGb2xkZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBtYWlsYm94RGV0YWlsID0gYXdhaXQgdGhpcy5nZXRNYWlsYm94RGV0YWlsc0Zvck1haWxGb2xkZXIoZm9sZGVyKVxuXHRcdGlmIChtYWlsYm94RGV0YWlsID09IG51bGwpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHRjb25zdCBmb2xkZXJTeXN0ZW0gPSB0aGlzLmdldEZvbGRlclN5c3RlbUJ5R3JvdXBJZChhc3NlcnROb3ROdWxsKGZvbGRlci5fb3duZXJHcm91cCkpXG5cdFx0aWYgKGZvbGRlclN5c3RlbSA9PSBudWxsKSByZXR1cm5cblxuXHRcdGNvbnN0IGRlbGV0ZWRGb2xkZXIgPSBhd2FpdCB0aGlzLnJlbW92ZUFsbEVtcHR5KGZvbGRlclN5c3RlbSwgZm9sZGVyKVxuXHRcdGlmICghZGVsZXRlZEZvbGRlcikge1xuXHRcdFx0Y29uc3QgdHJhc2ggPSBhc3NlcnRTeXN0ZW1Gb2xkZXJPZlR5cGUoZm9sZGVyU3lzdGVtLCBNYWlsU2V0S2luZC5UUkFTSClcblx0XHRcdHJldHVybiB0aGlzLm1haWxGYWNhZGUudXBkYXRlTWFpbEZvbGRlclBhcmVudChmb2xkZXIsIHRyYXNoLl9pZClcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogVGhpcyBpcyBjYWxsZWQgd2hlbiBtb3ZpbmcgYSBmb2xkZXIgdG8gU1BBTSBvciBUUkFTSCwgd2hpY2ggZG8gbm90IGFsbG93IGVtcHR5IGZvbGRlcnMgKHNpbmNlIG9ubHkgZm9sZGVycyB0aGF0IGNvbnRhaW4gbWFpbCBhcmUgYWxsb3dlZClcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcmVtb3ZlQWxsRW1wdHkoZm9sZGVyU3lzdGVtOiBGb2xkZXJTeXN0ZW0sIGZvbGRlcjogTWFpbEZvbGRlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdC8vIHNvcnQgZGVzY2VuZGFudHMgZGVlcGVzdCBmaXJzdCBzbyB0aGF0IHdlIGNhbiBjbGVhbiB0aGVtIHVwIGJlZm9yZSBjaGVja2luZyB0aGVpciBhbmNlc3RvcnNcblx0XHRjb25zdCBkZXNjZW5kYW50cyA9IGZvbGRlclN5c3RlbS5nZXREZXNjZW5kYW50Rm9sZGVyc09mUGFyZW50KGZvbGRlci5faWQpLnNvcnQoKGwsIHIpID0+IHIubGV2ZWwgLSBsLmxldmVsKVxuXG5cdFx0Ly8gd2UgY29tcGxldGVseSBkZWxldGUgZW1wdHkgZm9sZGVyc1xuXHRcdGxldCBzb21lTm9uRW1wdHkgPSBmYWxzZVxuXHRcdC8vIHdlIGRvbid0IHVwZGF0ZSBmb2xkZXIgc3lzdGVtIHF1aWNrbHkgZW5vdWdoIHNvIHdlIGtlZXAgdHJhY2sgb2YgZGVsZXRlZCBmb2xkZXJzIGhlcmUgYW5kIGNvbnNpZGVyIHRoZW0gXCJlbXB0eVwiIHdoZW4gYWxsIHRoZWlyIGNoaWxkcmVuIGFyZSBoZXJlXG5cdFx0Y29uc3QgZGVsZXRlZCA9IG5ldyBTZXQ8SWQ+KClcblx0XHRmb3IgKGNvbnN0IGRlc2NlbmRhbnQgb2YgZGVzY2VuZGFudHMpIHtcblx0XHRcdGlmIChcblx0XHRcdFx0KGF3YWl0IHRoaXMuaXNFbXB0eUZvbGRlcihkZXNjZW5kYW50LmZvbGRlcikpICYmXG5cdFx0XHRcdGZvbGRlclN5c3RlbS5nZXRDdXN0b21Gb2xkZXJzT2ZQYXJlbnQoZGVzY2VuZGFudC5mb2xkZXIuX2lkKS5ldmVyeSgoZikgPT4gZGVsZXRlZC5oYXMoZ2V0RWxlbWVudElkKGYpKSlcblx0XHRcdCkge1xuXHRcdFx0XHRkZWxldGVkLmFkZChnZXRFbGVtZW50SWQoZGVzY2VuZGFudC5mb2xkZXIpKVxuXHRcdFx0XHRhd2FpdCB0aGlzLmZpbmFsbHlEZWxldGVDdXN0b21NYWlsRm9sZGVyKGRlc2NlbmRhbnQuZm9sZGVyKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c29tZU5vbkVtcHR5ID0gdHJ1ZVxuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoXG5cdFx0XHQoYXdhaXQgdGhpcy5pc0VtcHR5Rm9sZGVyKGZvbGRlcikpICYmXG5cdFx0XHRmb2xkZXJTeXN0ZW0uZ2V0Q3VzdG9tRm9sZGVyc09mUGFyZW50KGZvbGRlci5faWQpLmV2ZXJ5KChmKSA9PiBkZWxldGVkLmhhcyhnZXRFbGVtZW50SWQoZikpKSAmJlxuXHRcdFx0IXNvbWVOb25FbXB0eVxuXHRcdCkge1xuXHRcdFx0YXdhaXQgdGhpcy5maW5hbGx5RGVsZXRlQ3VzdG9tTWFpbEZvbGRlcihmb2xkZXIpXG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cdH1cblxuXHQvLyBPbmx5IGxvYWQgb25lIG1haWwsIGlmIHRoZXJlIGlzIGV2ZW4gb25lIHdlIHdvbid0IHJlbW92ZVxuXHRwcml2YXRlIGFzeW5jIGlzRW1wdHlGb2xkZXIoZGVzY2VuZGFudDogTWFpbEZvbGRlcikge1xuXHRcdGlmIChkZXNjZW5kYW50LmlzTWFpbFNldCkge1xuXHRcdFx0cmV0dXJuIChhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkUmFuZ2UoTWFpbFNldEVudHJ5VHlwZVJlZiwgZGVzY2VuZGFudC5lbnRyaWVzLCBDVVNUT01fTUlOX0lELCAxLCBmYWxzZSkpLmxlbmd0aCA9PT0gMFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gKGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWRSYW5nZShNYWlsVHlwZVJlZiwgZGVzY2VuZGFudC5tYWlscywgR0VORVJBVEVEX01BWF9JRCwgMSwgdHJ1ZSkpLmxlbmd0aCA9PT0gMFxuXHRcdH1cblx0fVxuXG5cdHB1YmxpYyBhc3luYyBmaW5hbGx5RGVsZXRlQ3VzdG9tTWFpbEZvbGRlcihmb2xkZXI6IE1haWxGb2xkZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAoZm9sZGVyLmZvbGRlclR5cGUgIT09IE1haWxTZXRLaW5kLkNVU1RPTSAmJiBmb2xkZXIuZm9sZGVyVHlwZSAhPT0gTWFpbFNldEtpbmQuSW1wb3J0ZWQpIHtcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwiQ2Fubm90IGRlbGV0ZSBub24tY3VzdG9tIGZvbGRlcjogXCIgKyBTdHJpbmcoZm9sZGVyLl9pZCkpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGF3YWl0IHRoaXMubWFpbEZhY2FkZVxuXHRcdFx0LmRlbGV0ZUZvbGRlcihmb2xkZXIuX2lkKVxuXHRcdFx0LmNhdGNoKG9mQ2xhc3MoTm90Rm91bmRFcnJvciwgKCkgPT4gY29uc29sZS5sb2coXCJtYWlsIGZvbGRlciBhbHJlYWR5IGRlbGV0ZWRcIikpKVxuXHRcdFx0LmNhdGNoKFxuXHRcdFx0XHRvZkNsYXNzKFByZWNvbmRpdGlvbkZhaWxlZEVycm9yLCAoKSA9PiB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFVzZXJFcnJvcihcIm9wZXJhdGlvblN0aWxsQWN0aXZlX21zZ1wiKVxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0fVxuXG5cdGFzeW5jIGZpeHVwQ291bnRlckZvckZvbGRlcihmb2xkZXI6IE1haWxGb2xkZXIsIHVucmVhZE1haWxzOiBudW1iZXIpIHtcblx0XHRjb25zdCBtYWlsYm94RGV0YWlscyA9IGF3YWl0IHRoaXMuZ2V0TWFpbGJveERldGFpbHNGb3JNYWlsRm9sZGVyKGZvbGRlcilcblx0XHRpZiAobWFpbGJveERldGFpbHMpIHtcblx0XHRcdGF3YWl0IHRoaXMubWFpbEZhY2FkZS5maXh1cENvdW50ZXJGb3JGb2xkZXIobWFpbGJveERldGFpbHMubWFpbEdyb3VwLl9pZCwgZm9sZGVyLCB1bnJlYWRNYWlscylcblx0XHR9XG5cdH1cblxuXHRhc3luYyBjbGVhckZvbGRlcihmb2xkZXI6IE1haWxGb2xkZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRhd2FpdCB0aGlzLm1haWxGYWNhZGUuY2xlYXJGb2xkZXIoZm9sZGVyLl9pZClcblx0fVxuXG5cdGFzeW5jIHVuc3Vic2NyaWJlKG1haWw6IE1haWwsIHJlY2lwaWVudDogc3RyaW5nLCBoZWFkZXJzOiBzdHJpbmdbXSkge1xuXHRcdGF3YWl0IHRoaXMubWFpbEZhY2FkZS51bnN1YnNjcmliZShtYWlsLl9pZCwgcmVjaXBpZW50LCBoZWFkZXJzKVxuXHR9XG5cblx0YXN5bmMgc2F2ZVJlcG9ydE1vdmVkTWFpbHMobWFpbGJveEdyb3VwUm9vdDogTWFpbGJveEdyb3VwUm9vdCwgcmVwb3J0TW92ZWRNYWlsczogUmVwb3J0TW92ZWRNYWlsc1R5cGUpOiBQcm9taXNlPE1haWxib3hQcm9wZXJ0aWVzPiB7XG5cdFx0Y29uc3QgbWFpbGJveFByb3BlcnRpZXMgPSBhd2FpdCB0aGlzLm1haWxib3hNb2RlbC5sb2FkT3JDcmVhdGVNYWlsYm94UHJvcGVydGllcyhtYWlsYm94R3JvdXBSb290KVxuXHRcdG1haWxib3hQcm9wZXJ0aWVzLnJlcG9ydE1vdmVkTWFpbHMgPSByZXBvcnRNb3ZlZE1haWxzXG5cdFx0YXdhaXQgdGhpcy5lbnRpdHlDbGllbnQudXBkYXRlKG1haWxib3hQcm9wZXJ0aWVzKVxuXHRcdHJldHVybiBtYWlsYm94UHJvcGVydGllc1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhIGxhYmVsIChha2EgTWFpbFNldCBha2Ege0BsaW5rIE1haWxGb2xkZXJ9IG9mIGtpbmQge0BsaW5rIE1haWxTZXRLaW5kLkxBQkVMfSkgZm9yIHRoZSBncm91cCB7QHBhcmFtIG1haWxHcm91cElkfS5cblx0ICovXG5cdGFzeW5jIGNyZWF0ZUxhYmVsKG1haWxHcm91cElkOiBJZCwgbGFiZWxEYXRhOiB7IG5hbWU6IHN0cmluZzsgY29sb3I6IHN0cmluZyB9KSB7XG5cdFx0YXdhaXQgdGhpcy5tYWlsRmFjYWRlLmNyZWF0ZUxhYmVsKG1haWxHcm91cElkLCBsYWJlbERhdGEpXG5cdH1cblxuXHRhc3luYyB1cGRhdGVMYWJlbChsYWJlbDogTWFpbEZvbGRlciwgbmV3RGF0YTogeyBuYW1lOiBzdHJpbmc7IGNvbG9yOiBzdHJpbmcgfSkge1xuXHRcdGF3YWl0IHRoaXMubWFpbEZhY2FkZS51cGRhdGVMYWJlbChsYWJlbCwgbmV3RGF0YS5uYW1lLCBuZXdEYXRhLmNvbG9yKVxuXHR9XG5cblx0YXN5bmMgZGVsZXRlTGFiZWwobGFiZWw6IE1haWxGb2xkZXIpIHtcblx0XHRhd2FpdCB0aGlzLm1haWxGYWNhZGUuZGVsZXRlTGFiZWwobGFiZWwpXG5cdH1cblxuXHRhc3luYyBnZXRNYWlsU2V0QnlJZChmb2xkZXJFbGVtZW50SWQ6IElkKTogUHJvbWlzZTxNYWlsRm9sZGVyIHwgbnVsbD4ge1xuXHRcdGNvbnN0IGZvbGRlclN0cnVjdHVyZXMgPSBhd2FpdCB0aGlzLmxvYWRNYWlsU2V0cygpXG5cdFx0Zm9yIChjb25zdCBmb2xkZXJzIG9mIGZvbGRlclN0cnVjdHVyZXMudmFsdWVzKCkpIHtcblx0XHRcdGNvbnN0IGZvbGRlciA9IGZvbGRlcnMuZm9sZGVycy5nZXRGb2xkZXJCeUlkKGZvbGRlckVsZW1lbnRJZClcblx0XHRcdGlmIChmb2xkZXIpIHtcblx0XHRcdFx0cmV0dXJuIGZvbGRlclxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBsYWJlbCA9IGZvbGRlcnMubGFiZWxzLmdldChmb2xkZXJFbGVtZW50SWQpXG5cdFx0XHRpZiAobGFiZWwpIHtcblx0XHRcdFx0cmV0dXJuIGxhYmVsXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBudWxsXG5cdH1cblxuXHRnZXRJbXBvcnRlZE1haWxTZXRzKCk6IEFycmF5PE1haWxGb2xkZXI+IHtcblx0XHRyZXR1cm4gWy4uLnRoaXMubWFpbFNldHMudmFsdWVzKCldLmZpbHRlcigoZikgPT4gZi5mb2xkZXJzLmltcG9ydGVkTWFpbFNldCkubWFwKChmKSA9PiBmLmZvbGRlcnMuaW1wb3J0ZWRNYWlsU2V0ISlcblx0fVxufVxuIiwiaW1wb3J0IHsgSVByb2dyZXNzTW9uaXRvciwgUHJvZ3Jlc3NMaXN0ZW5lciB9IGZyb20gXCIuL1Byb2dyZXNzTW9uaXRvclwiXG5pbXBvcnQgeyBmaXJzdCwgbGFzdCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuXG5jb25zdCBERUZBVUxUX1JBVEVfUEVSX1NFQ09ORCA9IDAuNVxuY29uc3QgREVGQVVMVF9QUk9HUkVTU19FU1RJTUFUSU9OX1JFRlJFU0hfTVM6IG51bWJlciA9IDEwMDBcbmNvbnN0IE1JTklNVU1fSElTVE9SWV9MRU5HVEhfRk9SX0VTVElNQVRJT04gPSAzXG5jb25zdCBSQVRFX1BFUl9TRUNPTkRfTUFYSU1VTV9TQ0FMSU5HX1JBVElPOiBudW1iZXIgPSAwLjc1XG5cbmNvbnN0IFdPUktfTUFYX1BFUkNFTlRBR0UgPSAxMDBcbmNvbnN0IFdPUktfQ09NUExFVEVEX01JTiA9IDBcblxuLyoqXG4gKiBDbGFzcyB0byBjYWxjdWxhdGUgcGVyY2VudGFnZSBvZiB0b3RhbCB3b3JrIGFuZCByZXBvcnQgaXQgYmFjay5cbiAqIENhbGwge0Bjb2RlIHdvcmtEb25lKCkgb3IgQGNvZGUgdG90YWxXb3JrRG9uZX0gZm9yIGVhY2ggd29yayBzdGVwIGFuZFxuICoge0Bjb2RlIGNvbXBsZXRlZCgpfSB3aGVuIHlvdSBhcmUgZG9uZS5cbiAqIEVzdGltYXRpbmdQcm9ncmVzc01vbml0b3Igd29ya3MgdGhlIHNhbWUgYXMgdGhlIHtAbGluayBQcm9ncmVzc01vbml0b3J9LCBidXRcbiAqIGFkZGl0aW9uYWxseSAqKmVzdGltYXRlcyoqIHByb2dyZXNzIGludGVybmFsbHkgb24gdGhlIGdvLlxuICovXG5leHBvcnQgY2xhc3MgRXN0aW1hdGluZ1Byb2dyZXNzTW9uaXRvciBpbXBsZW1lbnRzIElQcm9ncmVzc01vbml0b3Ige1xuXHR3b3JrQ29tcGxldGVkOiBudW1iZXJcblx0cmF0ZVBlclNlY29uZEhpc3Rvcnk6IEFycmF5PFJlYWRvbmx5PFtudW1iZXIsIG51bWJlcl0+PiA9IEFycmF5Lm9mKFtEYXRlLm5vdygpLCBERUZBVUxUX1JBVEVfUEVSX1NFQ09ORF0pIC8vIGVudHJpZXM6IHRpbWVzdGFtcCwgcmF0ZSBwZXIgc2Vjb25kXG5cdHRvdGFsV29yazogbnVtYmVyXG5cdHByb2dyZXNzRXN0aW1hdGlvbjogVGltZW91dElEXG5cblx0Y29uc3RydWN0b3IodG90YWxXb3JrOiBudW1iZXIsIHByaXZhdGUgcmVhZG9ubHkgdXBkYXRlcjogUHJvZ3Jlc3NMaXN0ZW5lcikge1xuXHRcdHRoaXMud29ya0NvbXBsZXRlZCA9IFdPUktfQ09NUExFVEVEX01JTlxuXHRcdHRoaXMudG90YWxXb3JrID0gdG90YWxXb3JrXG5cdH1cblxuXHRwdWJsaWMgdXBkYXRlVG90YWxXb3JrKHZhbHVlOiBudW1iZXIpIHtcblx0XHR0aGlzLnRvdGFsV29yayA9IHZhbHVlXG5cdH1cblxuXHRwdWJsaWMgY29udGludWVFc3RpbWF0aW9uKCkge1xuXHRcdGNsZWFySW50ZXJ2YWwodGhpcy5wcm9ncmVzc0VzdGltYXRpb24pXG5cdFx0dGhpcy5wcm9ncmVzc0VzdGltYXRpb24gPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5yYXRlUGVyU2Vjb25kSGlzdG9yeS5sZW5ndGggPCBNSU5JTVVNX0hJU1RPUllfTEVOR1RIX0ZPUl9FU1RJTUFUSU9OKSB7XG5cdFx0XHRcdHRoaXMud29ya0VzdGltYXRlKERFRkFVTFRfUkFURV9QRVJfU0VDT05EKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgcHJldmlvdXNSYXRlRW50cnkgPSB0aGlzLnJhdGVQZXJTZWNvbmRIaXN0b3J5W3RoaXMucmF0ZVBlclNlY29uZEhpc3RvcnkubGVuZ3RoIC0gMl1cblx0XHRcdFx0Y29uc3QgcHJldmlvdXNSYXRlRW50cnlUaW1lc3RhbXAgPSBmaXJzdChwcmV2aW91c1JhdGVFbnRyeSkhXG5cblx0XHRcdFx0Y29uc3QgbGFzdFJhdGVFbnRyeSA9IGxhc3QodGhpcy5yYXRlUGVyU2Vjb25kSGlzdG9yeSkhXG5cdFx0XHRcdGNvbnN0IGxhc3RSYXRlRW50cnlUaW1lc3RhbXAgPSBmaXJzdChsYXN0UmF0ZUVudHJ5KSFcblx0XHRcdFx0Y29uc3QgbGFzdFJhdGVQZXJTZWNvbmQgPSBsYXN0KGxhc3RSYXRlRW50cnkpIVxuXG5cdFx0XHRcdGxldCBsYXN0RHVyYXRpb25CZXR3ZWVuUmF0ZVBlclNlY29uZFVwZGF0ZXNNcyA9IGxhc3RSYXRlRW50cnlUaW1lc3RhbXAgLSBwcmV2aW91c1JhdGVFbnRyeVRpbWVzdGFtcFxuXHRcdFx0XHRsZXQgY3VycmVudER1cmF0aW9uTXMgPSBEYXRlLm5vdygpIC0gbGFzdFJhdGVFbnRyeVRpbWVzdGFtcFxuXHRcdFx0XHRsZXQgcmF0ZVBlclNlY29uZFNjYWxpbmdSYXRpbzogbnVtYmVyID0gTWF0aC5taW4oXG5cdFx0XHRcdFx0UkFURV9QRVJfU0VDT05EX01BWElNVU1fU0NBTElOR19SQVRJTyxcblx0XHRcdFx0XHRsYXN0RHVyYXRpb25CZXR3ZWVuUmF0ZVBlclNlY29uZFVwZGF0ZXNNcyAvIGN1cnJlbnREdXJhdGlvbk1zLFxuXHRcdFx0XHQpXG5cblx0XHRcdFx0bGV0IG5ld1JhdGVQZXJTZWNvbmRFc3RpbWF0ZSA9IGxhc3RSYXRlUGVyU2Vjb25kICogcmF0ZVBlclNlY29uZFNjYWxpbmdSYXRpb1xuXHRcdFx0XHRsZXQgd29ya0RvbmVFc3RpbWF0aW9uID0gTWF0aC5tYXgoREVGQVVMVF9SQVRFX1BFUl9TRUNPTkQsIG5ld1JhdGVQZXJTZWNvbmRFc3RpbWF0ZSlcblxuXHRcdFx0XHQvLyBvbmx5IHVwZGF0ZSBlc3RpbWF0aW9uIGlmIHdlIGRpZCBub3QgZXhjZWVkIHRoZSBhY3R1YWwgdG90YWxXb3JrIHlldFxuXHRcdFx0XHRpZiAodGhpcy53b3JrQ29tcGxldGVkICsgd29ya0RvbmVFc3RpbWF0aW9uIDwgdGhpcy50b3RhbFdvcmspIHtcblx0XHRcdFx0XHR0aGlzLndvcmtFc3RpbWF0ZSh3b3JrRG9uZUVzdGltYXRpb24pXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LCBERUZBVUxUX1BST0dSRVNTX0VTVElNQVRJT05fUkVGUkVTSF9NUylcblx0fVxuXG5cdHB1YmxpYyBwYXVzZUVzdGltYXRpb24oKSB7XG5cdFx0Y2xlYXJJbnRlcnZhbCh0aGlzLnByb2dyZXNzRXN0aW1hdGlvbilcblx0XHR0aGlzLnJhdGVQZXJTZWNvbmRIaXN0b3J5ID0gQXJyYXkub2YoW0RhdGUubm93KCksIERFRkFVTFRfUkFURV9QRVJfU0VDT05EXSlcblx0fVxuXG5cdHByaXZhdGUgdXBkYXRlUmF0ZVBlclNlY29uZChuZXdXb3JrQW1vdW50OiBudW1iZXIpIHtcblx0XHRsZXQgbGFzdFJhdGVFbnRyeSA9IGxhc3QodGhpcy5yYXRlUGVyU2Vjb25kSGlzdG9yeSkhXG5cdFx0bGV0IGxhc3RUaW1lc3RhbXAgPSBmaXJzdChsYXN0UmF0ZUVudHJ5KSFcblx0XHRsZXQgbm93ID0gRGF0ZS5ub3coKVxuXHRcdGxldCBkdXJhdGlvblNpbmNlTGFzdFJhdGVFbnRyeVNlY29uZHMgPSAobm93IC0gbGFzdFRpbWVzdGFtcCkgLyAxMDAwXG5cdFx0bGV0IHJhdGVQZXJTZWNvbmQgPSBuZXdXb3JrQW1vdW50IC8gZHVyYXRpb25TaW5jZUxhc3RSYXRlRW50cnlTZWNvbmRzXG5cdFx0bGV0IG5ld1JhdGVFbnRyeTogUmVhZG9ubHk8W251bWJlciwgbnVtYmVyXT4gPSBbbm93LCByYXRlUGVyU2Vjb25kXVxuXHRcdHRoaXMucmF0ZVBlclNlY29uZEhpc3RvcnkucHVzaChuZXdSYXRlRW50cnkpXG5cdH1cblxuXHRwcml2YXRlIHdvcmtFc3RpbWF0ZShlc3RpbWF0ZTogbnVtYmVyKSB7XG5cdFx0dGhpcy53b3JrQ29tcGxldGVkICs9IGVzdGltYXRlXG5cdFx0dGhpcy51cGRhdGVyKHRoaXMucGVyY2VudGFnZSgpKVxuXHR9XG5cblx0cHVibGljIHdvcmtEb25lKGFtb3VudDogbnVtYmVyKSB7XG5cdFx0dGhpcy51cGRhdGVSYXRlUGVyU2Vjb25kKGFtb3VudClcblx0XHR0aGlzLndvcmtDb21wbGV0ZWQgKz0gYW1vdW50XG5cdFx0dGhpcy51cGRhdGVyKHRoaXMucGVyY2VudGFnZSgpKVxuXHR9XG5cblx0cHVibGljIHRvdGFsV29ya0RvbmUodG90YWxBbW91bnQ6IG51bWJlcikge1xuXHRcdGxldCB3b3JrRGlmZmVyZW5jZSA9IHRvdGFsQW1vdW50IC0gdGhpcy53b3JrQ29tcGxldGVkXG5cdFx0dGhpcy51cGRhdGVSYXRlUGVyU2Vjb25kKHdvcmtEaWZmZXJlbmNlKVxuXHRcdHRoaXMud29ya0NvbXBsZXRlZCA9IHRvdGFsQW1vdW50XG5cdFx0dGhpcy51cGRhdGVyKHRoaXMucGVyY2VudGFnZSgpKVxuXHR9XG5cblx0cHVibGljIHBlcmNlbnRhZ2UoKTogbnVtYmVyIHtcblx0XHRjb25zdCByZXN1bHQgPSAoV09SS19NQVhfUEVSQ0VOVEFHRSAqIHRoaXMud29ya0NvbXBsZXRlZCkgLyB0aGlzLnRvdGFsV29ya1xuXHRcdHJldHVybiBNYXRoLm1pbihXT1JLX01BWF9QRVJDRU5UQUdFLCByZXN1bHQpXG5cdH1cblxuXHRwdWJsaWMgY29tcGxldGVkKCkge1xuXHRcdHRoaXMud29ya0NvbXBsZXRlZCA9IHRoaXMudG90YWxXb3JrXG5cdFx0dGhpcy51cGRhdGVyKFdPUktfTUFYX1BFUkNFTlRBR0UpXG5cdH1cbn1cbiIsImltcG9ydCB7IGdldEFwaUJhc2VVcmwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IEltcG9ydE1haWxTdGF0ZSwgSW1wb3J0TWFpbFN0YXRlVHlwZVJlZiwgTWFpbEJveCwgTWFpbEZvbGRlciwgTWFpbEZvbGRlclR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsLCBmaXJzdCwgaXNFbXB0eSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgTmF0aXZlTWFpbEltcG9ydEZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTmF0aXZlTWFpbEltcG9ydEZhY2FkZVwiXG5pbXBvcnQgeyBDcmVkZW50aWFsc1Byb3ZpZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL2NyZWRlbnRpYWxzL0NyZWRlbnRpYWxzUHJvdmlkZXJcIlxuaW1wb3J0IHsgRG9tYWluQ29uZmlnUHJvdmlkZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRG9tYWluQ29uZmlnUHJvdmlkZXJcIlxuaW1wb3J0IHsgTG9naW5Db250cm9sbGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Mb2dpbkNvbnRyb2xsZXJcIlxuaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgZWxlbWVudElkUGFydCwgR0VORVJBVEVEX01JTl9JRCwgaXNTYW1lSWQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgTWFpbGJveE1vZGVsIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9NYWlsYm94TW9kZWwuanNcIlxuaW1wb3J0IHsgRW50aXR5Q2xpZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudGl0eUNsaWVudC5qc1wiXG5pbXBvcnQgeyBFc3RpbWF0aW5nUHJvZ3Jlc3NNb25pdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VzdGltYXRpbmdQcm9ncmVzc01vbml0b3IuanNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9Qcm9ncmFtbWluZ0Vycm9yLmpzXCJcbmltcG9ydCB7IEVudGl0eVVwZGF0ZURhdGEsIGlzVXBkYXRlRm9yVHlwZVJlZiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVcGRhdGVVdGlsc1wiXG5pbXBvcnQgeyBFdmVudENvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL0V2ZW50Q29udHJvbGxlclwiXG5pbXBvcnQgeyBJbXBvcnRFcnJvckNhdGVnb3JpZXMsIE1haWxJbXBvcnRFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9NYWlsSW1wb3J0RXJyb3IuanNcIlxuaW1wb3J0IHsgc2hvd1NuYWNrQmFyLCBTbmFja0JhckJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9TbmFja0Jhci5qc1wiXG5pbXBvcnQgeyBPcGVuU2V0dGluZ3NIYW5kbGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9uYXRpdmUvbWFpbi9PcGVuU2V0dGluZ3NIYW5kbGVyLmpzXCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB7IEltcG9ydFN0YXR1cywgTWFpbFNldEtpbmQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgRm9sZGVyU3lzdGVtIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL21haWwvRm9sZGVyU3lzdGVtXCJcbmltcG9ydCB7IG1haWxMb2NhdG9yIH0gZnJvbSBcIi4uLy4uL21haWxMb2NhdG9yXCJcblxuLy8ga2VlcCBpbiBzeW5jIHdpdGggbmFwaSBiaW5kaW5nLmQuY3RzXG5leHBvcnQgY29uc3QgZW51bSBJbXBvcnRQcm9ncmVzc0FjdGlvbiB7XG5cdENvbnRpbnVlID0gMCxcblx0UGF1c2UgPSAxLFxuXHRTdG9wID0gMixcbn1cblxuY29uc3QgREVGQVVMVF9UT1RBTF9XT1JLOiBudW1iZXIgPSAxMDAwMFxudHlwZSBBY3RpdmVJbXBvcnQgPSB7XG5cdHJlbW90ZVN0YXRlSWQ6IElkVHVwbGVcblx0dWlTdGF0dXM6IFVpSW1wb3J0U3RhdHVzXG5cdHByb2dyZXNzTW9uaXRvcjogRXN0aW1hdGluZ1Byb2dyZXNzTW9uaXRvclxufVxuXG5leHBvcnQgY2xhc3MgTWFpbEltcG9ydGVyIHtcblx0cHJpdmF0ZSBmaW5hbGlzZWRJbXBvcnRTdGF0ZXM6IE1hcDxJZCwgSW1wb3J0TWFpbFN0YXRlPiA9IG5ldyBNYXAoKVxuXHRwcml2YXRlIGFjdGl2ZUltcG9ydDogQWN0aXZlSW1wb3J0IHwgbnVsbCA9IG51bGxcblx0cHVibGljIGZvbGRlcnNGb3JNYWlsYm94OiBGb2xkZXJTeXN0ZW0gfCB1bmRlZmluZWRcblx0cHVibGljIHNlbGVjdGVkVGFyZ2V0Rm9sZGVyOiBNYWlsRm9sZGVyIHwgbnVsbCA9IG51bGxcblxuXHRjb25zdHJ1Y3Rvcihcblx0XHRwcml2YXRlIHJlYWRvbmx5IGRvbWFpbkNvbmZpZ1Byb3ZpZGVyOiBEb21haW5Db25maWdQcm92aWRlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGxvZ2luQ29udHJvbGxlcjogTG9naW5Db250cm9sbGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWwsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCxcblx0XHRldmVudENvbnRyb2xsZXI6IEV2ZW50Q29udHJvbGxlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNyZWRlbnRpYWxzUHJvdmlkZXI6IENyZWRlbnRpYWxzUHJvdmlkZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBuYXRpdmVNYWlsSW1wb3J0RmFjYWRlOiBOYXRpdmVNYWlsSW1wb3J0RmFjYWRlLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgb3BlblNldHRpbmdzSGFuZGxlcjogT3BlblNldHRpbmdzSGFuZGxlcixcblx0KSB7XG5cdFx0ZXZlbnRDb250cm9sbGVyLmFkZEVudGl0eUxpc3RlbmVyKCh1cGRhdGVzKSA9PiB0aGlzLmVudGl0eUV2ZW50c1JlY2VpdmVkKHVwZGF0ZXMpKVxuXHR9XG5cblx0YXN5bmMgZ2V0TWFpbGJveCgpOiBQcm9taXNlPE1haWxCb3g+IHtcblx0XHRyZXR1cm4gYXNzZXJ0Tm90TnVsbChmaXJzdChhd2FpdCB0aGlzLm1haWxib3hNb2RlbC5nZXRNYWlsYm94RGV0YWlscygpKSkubWFpbGJveFxuXHR9XG5cblx0YXN5bmMgaW5pdEltcG9ydE1haWxTdGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0YXdhaXQgdGhpcy5jaGVja0ZvclJlc3VtYWJsZUltcG9ydCgpXG5cblx0XHRjb25zdCBpbXBvcnRNYWlsU3RhdGVzQ29sbGVjdGlvbiA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWRBbGwoSW1wb3J0TWFpbFN0YXRlVHlwZVJlZiwgKGF3YWl0IHRoaXMuZ2V0TWFpbGJveCgpKS5tYWlsSW1wb3J0U3RhdGVzKVxuXHRcdGZvciAoY29uc3QgaW1wb3J0TWFpbFN0YXRlIG9mIGltcG9ydE1haWxTdGF0ZXNDb2xsZWN0aW9uKSB7XG5cdFx0XHRpZiAodGhpcy5pc0ZpbmFsaXNlZEltcG9ydChpbXBvcnRNYWlsU3RhdGUpKSB7XG5cdFx0XHRcdHRoaXMudXBkYXRlRmluYWxpc2VkSW1wb3J0KGVsZW1lbnRJZFBhcnQoaW1wb3J0TWFpbFN0YXRlLl9pZCksIGltcG9ydE1haWxTdGF0ZSlcblx0XHRcdH1cblx0XHR9XG5cdFx0bS5yZWRyYXcoKVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBjaGVja0ZvclJlc3VtYWJsZUltcG9ydCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBpbXBvcnRGYWNhZGUgPSBhc3NlcnROb3ROdWxsKHRoaXMubmF0aXZlTWFpbEltcG9ydEZhY2FkZSlcblx0XHRjb25zdCBtYWlsYm94ID0gYXdhaXQgdGhpcy5nZXRNYWlsYm94KClcblx0XHR0aGlzLmZvbGRlcnNGb3JNYWlsYm94ID0gdGhpcy5nZXRGb2xkZXJzRm9yTWFpbEdyb3VwKGFzc2VydE5vdE51bGwobWFpbGJveC5fb3duZXJHcm91cCkpXG5cdFx0dGhpcy5zZWxlY3RlZFRhcmdldEZvbGRlciA9IHRoaXMuZm9sZGVyc0Zvck1haWxib3guZ2V0U3lzdGVtRm9sZGVyQnlUeXBlKE1haWxTZXRLaW5kLklOQk9YKVxuXG5cdFx0bGV0IGFjdGl2ZUltcG9ydElkOiBJZFR1cGxlIHwgbnVsbCA9IG51bGxcblx0XHRpZiAodGhpcy5hY3RpdmVJbXBvcnQgPT09IG51bGwpIHtcblx0XHRcdGNvbnN0IG1haWxPd25lckdyb3VwSWQgPSBhc3NlcnROb3ROdWxsKG1haWxib3guX293bmVyR3JvdXApXG5cdFx0XHRjb25zdCB1c2VySWQgPSB0aGlzLmxvZ2luQ29udHJvbGxlci5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJJZFxuXHRcdFx0Y29uc3QgdW5lbmNyeXB0ZWRDcmVkZW50aWFscyA9IGFzc2VydE5vdE51bGwoYXdhaXQgdGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyPy5nZXREZWNyeXB0ZWRDcmVkZW50aWFsc0J5VXNlcklkKHVzZXJJZCkpXG5cdFx0XHRjb25zdCBhcGlVcmwgPSBnZXRBcGlCYXNlVXJsKHRoaXMuZG9tYWluQ29uZmlnUHJvdmlkZXIuZ2V0Q3VycmVudERvbWFpbkNvbmZpZygpKVxuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhY3RpdmVJbXBvcnRJZCA9IGF3YWl0IGltcG9ydEZhY2FkZS5nZXRSZXN1bWFibGVJbXBvcnQobWFpbGJveC5faWQsIG1haWxPd25lckdyb3VwSWQsIHVuZW5jcnlwdGVkQ3JlZGVudGlhbHMsIGFwaVVybClcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBNYWlsSW1wb3J0RXJyb3IpIHRoaXMuaGFuZGxlRXJyb3IoZSkuY2F0Y2goKVxuXHRcdFx0XHRlbHNlIHRocm93IGVcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5saXN0ZW5Gb3JFcnJvcihpbXBvcnRGYWNhZGUsIG1haWxib3guX2lkKS50aGVuKClcblx0XHR9XG5cblx0XHRpZiAoYWN0aXZlSW1wb3J0SWQpIHtcblx0XHRcdC8vIHdlIGNhbid0IHVzZSB0aGUgcmVzdWx0IG9mIGxvYWRBbGwgKHNlZSBiZWxvdykgYXMgdGhhdCBtaWdodCBvbmx5IHJlYWQgZnJvbSBvZmZsaW5lIGNhY2hlIGFuZFxuXHRcdFx0Ly8gbm90IGluY2x1ZGUgYSBuZXcgSW1wb3J0TWFpbFN0YXRlIHRoYXQgd2FzIGNyZWF0ZWQgd2l0aG91dCBzZW5kaW5nIGFuIGVudGl0eSBldmVudFxuXHRcdFx0Y29uc3QgaW1wb3J0TWFpbFN0YXRlID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChJbXBvcnRNYWlsU3RhdGVUeXBlUmVmLCBhY3RpdmVJbXBvcnRJZClcblx0XHRcdGNvbnN0IHJlbW90ZVN0YXR1cyA9IHBhcnNlSW50KGltcG9ydE1haWxTdGF0ZS5zdGF0dXMpIGFzIEltcG9ydFN0YXR1c1xuXG5cdFx0XHRzd2l0Y2ggKHJlbW90ZVN0YXR1cykge1xuXHRcdFx0XHRjYXNlIEltcG9ydFN0YXR1cy5DYW5jZWxlZDpcblx0XHRcdFx0Y2FzZSBJbXBvcnRTdGF0dXMuRmluaXNoZWQ6XG5cdFx0XHRcdFx0YWN0aXZlSW1wb3J0SWQgPSBudWxsXG5cdFx0XHRcdFx0dGhpcy5hY3RpdmVJbXBvcnQgPSBudWxsXG5cdFx0XHRcdFx0dGhpcy5zZWxlY3RlZFRhcmdldEZvbGRlciA9IHRoaXMuZm9sZGVyc0Zvck1haWxib3guZ2V0U3lzdGVtRm9sZGVyQnlUeXBlKE1haWxTZXRLaW5kLklOQk9YKVxuXHRcdFx0XHRcdGJyZWFrXG5cblx0XHRcdFx0Y2FzZSBJbXBvcnRTdGF0dXMuUGF1c2VkOlxuXHRcdFx0XHRjYXNlIEltcG9ydFN0YXR1cy5SdW5uaW5nOiB7XG5cdFx0XHRcdFx0bGV0IHByb2dyZXNzTW9uaXRvciA9IHRoaXMuYWN0aXZlSW1wb3J0Py5wcm9ncmVzc01vbml0b3IgPz8gbnVsbFxuXHRcdFx0XHRcdGlmICghcHJvZ3Jlc3NNb25pdG9yKSB7XG5cdFx0XHRcdFx0XHRjb25zdCB0b3RhbENvdW50ID0gcGFyc2VJbnQoaW1wb3J0TWFpbFN0YXRlLnRvdGFsTWFpbHMpXG5cdFx0XHRcdFx0XHRjb25zdCBkb25lQ291bnQgPSBwYXJzZUludChpbXBvcnRNYWlsU3RhdGUuZmFpbGVkTWFpbHMpICsgcGFyc2VJbnQoaW1wb3J0TWFpbFN0YXRlLnN1Y2Nlc3NmdWxNYWlscylcblx0XHRcdFx0XHRcdHByb2dyZXNzTW9uaXRvciA9IHRoaXMuY3JlYXRlRXN0aW1hdGluZ1Byb2dyZXNzTW9uaXRvcih0b3RhbENvdW50KVxuXHRcdFx0XHRcdFx0cHJvZ3Jlc3NNb25pdG9yLnRvdGFsV29ya0RvbmUoZG9uZUNvdW50KVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHRoaXMuYWN0aXZlSW1wb3J0ID0ge1xuXHRcdFx0XHRcdFx0cmVtb3RlU3RhdGVJZDogYWN0aXZlSW1wb3J0SWQsXG5cdFx0XHRcdFx0XHR1aVN0YXR1czogVWlJbXBvcnRTdGF0dXMuUGF1c2VkLFxuXHRcdFx0XHRcdFx0cHJvZ3Jlc3NNb25pdG9yLFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLnNlbGVjdGVkVGFyZ2V0Rm9sZGVyID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChNYWlsRm9sZGVyVHlwZVJlZiwgaW1wb3J0TWFpbFN0YXRlLnRhcmdldEZvbGRlcilcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGVudGl0eUV2ZW50c1JlY2VpdmVkKHVwZGF0ZXM6IFJlYWRvbmx5QXJyYXk8RW50aXR5VXBkYXRlRGF0YT4pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRmb3IgKGNvbnN0IHVwZGF0ZSBvZiB1cGRhdGVzKSB7XG5cdFx0XHRpZiAoaXNVcGRhdGVGb3JUeXBlUmVmKEltcG9ydE1haWxTdGF0ZVR5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdFx0Y29uc3QgdXBkYXRlZFN0YXRlID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZChJbXBvcnRNYWlsU3RhdGVUeXBlUmVmLCBbdXBkYXRlLmluc3RhbmNlTGlzdElkLCB1cGRhdGUuaW5zdGFuY2VJZF0pXG5cdFx0XHRcdGF3YWl0IHRoaXMubmV3SW1wb3J0U3RhdGVGcm9tU2VydmVyKHVwZGF0ZWRTdGF0ZSlcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRhc3luYyBuZXdJbXBvcnRTdGF0ZUZyb21TZXJ2ZXIoc2VydmVyU3RhdGU6IEltcG9ydE1haWxTdGF0ZSkge1xuXHRcdGNvbnN0IHJlbW90ZVN0YXR1cyA9IHBhcnNlSW50KHNlcnZlclN0YXRlLnN0YXR1cykgYXMgSW1wb3J0U3RhdHVzXG5cblx0XHRjb25zdCB3YXNVcGRhdGVkRm9yVGhpc0ltcG9ydCA9IHRoaXMuYWN0aXZlSW1wb3J0ICE9PSBudWxsICYmIGlzU2FtZUlkKHRoaXMuYWN0aXZlSW1wb3J0LnJlbW90ZVN0YXRlSWQsIHNlcnZlclN0YXRlLl9pZClcblx0XHRpZiAod2FzVXBkYXRlZEZvclRoaXNJbXBvcnQpIHtcblx0XHRcdGlmIChpc0ZpbmFsaXNlZEltcG9ydChyZW1vdGVTdGF0dXMpKSB7XG5cdFx0XHRcdHRoaXMucmVzZXRTdGF0dXMoKVxuXHRcdFx0XHR0aGlzLnVwZGF0ZUZpbmFsaXNlZEltcG9ydChlbGVtZW50SWRQYXJ0KHNlcnZlclN0YXRlLl9pZCksIHNlcnZlclN0YXRlKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgYWN0aXZlSW1wb3J0ID0gYXNzZXJ0Tm90TnVsbCh0aGlzLmFjdGl2ZUltcG9ydClcblx0XHRcdFx0YWN0aXZlSW1wb3J0LnVpU3RhdHVzID0gaW1wb3J0U3RhdHVzVG9VaUltcG9ydFN0YXR1cyhyZW1vdGVTdGF0dXMpXG5cdFx0XHRcdGNvbnN0IG5ld1RvdGFsV29yayA9IHBhcnNlSW50KHNlcnZlclN0YXRlLnRvdGFsTWFpbHMpXG5cdFx0XHRcdGNvbnN0IG5ld0RvbmVXb3JrID0gcGFyc2VJbnQoc2VydmVyU3RhdGUuc3VjY2Vzc2Z1bE1haWxzKSArIHBhcnNlSW50KHNlcnZlclN0YXRlLmZhaWxlZE1haWxzKVxuXHRcdFx0XHRhY3RpdmVJbXBvcnQucHJvZ3Jlc3NNb25pdG9yLnVwZGF0ZVRvdGFsV29yayhuZXdUb3RhbFdvcmspXG5cdFx0XHRcdGFjdGl2ZUltcG9ydC5wcm9ncmVzc01vbml0b3IudG90YWxXb3JrRG9uZShuZXdEb25lV29yaylcblx0XHRcdFx0aWYgKHJlbW90ZVN0YXR1cyA9PT0gSW1wb3J0U3RhdHVzLlBhdXNlZCkge1xuXHRcdFx0XHRcdGFjdGl2ZUltcG9ydC5wcm9ncmVzc01vbml0b3IucGF1c2VFc3RpbWF0aW9uKClcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRhY3RpdmVJbXBvcnQucHJvZ3Jlc3NNb25pdG9yLmNvbnRpbnVlRXN0aW1hdGlvbigpXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy51cGRhdGVGaW5hbGlzZWRJbXBvcnQoZWxlbWVudElkUGFydChzZXJ2ZXJTdGF0ZS5faWQpLCBzZXJ2ZXJTdGF0ZSlcblx0XHR9XG5cblx0XHRtLnJlZHJhdygpXG5cdH1cblxuXHRwcml2YXRlIGNyZWF0ZUVzdGltYXRpbmdQcm9ncmVzc01vbml0b3IodG90YWxXb3JrOiBudW1iZXIgPSBERUZBVUxUX1RPVEFMX1dPUkspIHtcblx0XHRyZXR1cm4gbmV3IEVzdGltYXRpbmdQcm9ncmVzc01vbml0b3IodG90YWxXb3JrLCAoXykgPT4ge1xuXHRcdFx0bS5yZWRyYXcoKVxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGlzRmluYWxpc2VkSW1wb3J0KGltcG9ydE1haWxTdGF0ZTogSW1wb3J0TWFpbFN0YXRlKSB7XG5cdFx0cmV0dXJuIHBhcnNlSW50KGltcG9ydE1haWxTdGF0ZS5zdGF0dXMpID09IEltcG9ydFN0YXR1cy5GaW5pc2hlZCB8fCBwYXJzZUludChpbXBvcnRNYWlsU3RhdGUuc3RhdHVzKSA9PSBJbXBvcnRTdGF0dXMuQ2FuY2VsZWRcblx0fVxuXG5cdHByaXZhdGUgZ2V0Rm9sZGVyc0Zvck1haWxHcm91cChtYWlsR3JvdXBJZDogSWQpOiBGb2xkZXJTeXN0ZW0ge1xuXHRcdGlmIChtYWlsR3JvdXBJZCkge1xuXHRcdFx0Y29uc3QgZm9sZGVyU3lzdGVtID0gbWFpbExvY2F0b3IubWFpbE1vZGVsLmdldEZvbGRlclN5c3RlbUJ5R3JvdXBJZChtYWlsR3JvdXBJZClcblx0XHRcdGlmIChmb2xkZXJTeXN0ZW0pIHtcblx0XHRcdFx0cmV0dXJuIGZvbGRlclN5c3RlbVxuXHRcdFx0fVxuXHRcdH1cblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJjb3VsZCBub3QgbG9hZCBmb2xkZXIgbGlzdFwiKVxuXHR9XG5cblx0Ly8vIHN0YXJ0IGEgbG9vcCB0aGF0IGxpc3RlbnMgdG8gYW4gYXJiaXRyYXJ5IGFtb3VudCBvZiBlcnJvcnMgdGhhdCBjYW4gaGFwcGVuIGR1cmluZyB0aGUgaW1wb3J0IHByb2Nlc3MuXG5cdHByaXZhdGUgYXN5bmMgbGlzdGVuRm9yRXJyb3IoaW1wb3J0RmFjYWRlOiBOYXRpdmVNYWlsSW1wb3J0RmFjYWRlLCBtYWlsYm94SWQ6IHN0cmluZykge1xuXHRcdHdoaWxlICh0cnVlKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhd2FpdCBpbXBvcnRGYWNhZGUuc2V0QXN5bmNFcnJvckhvb2sobWFpbGJveElkKVxuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIE1haWxJbXBvcnRFcnJvcikge1xuXHRcdFx0XHRcdHRoaXMuaGFuZGxlRXJyb3IoZSkuY2F0Y2goKVxuXHRcdFx0XHRcdGNvbnRpbnVlXG5cdFx0XHRcdH1cblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJzZXRBc3luY0Vycm9ySG9vayBzaG91bGQgbmV2ZXIgY29tcGxldGUgbm9ybWFsbHkhXCIpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBoYW5kbGVFcnJvcihlcnI6IE1haWxJbXBvcnRFcnJvcikge1xuXHRcdGlmIChlcnIuZGF0YS5jYXRlZ29yeSA9PSBJbXBvcnRFcnJvckNhdGVnb3JpZXMuSW1wb3J0RmVhdHVyZURpc2FibGVkKSB7XG5cdFx0XHRpZiAodGhpcy5hY3RpdmVJbXBvcnQpIHtcblx0XHRcdFx0dGhpcy5hY3RpdmVJbXBvcnQudWlTdGF0dXMgPSBVaUltcG9ydFN0YXR1cy5QYXVzZWRcblx0XHRcdH1cblx0XHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFwibWFpbEltcG9ydEVycm9yU2VydmljZVVuYXZhaWxhYmxlX21zZ1wiKVxuXHRcdH0gZWxzZSBpZiAoZXJyLmRhdGEuY2F0ZWdvcnkgPT0gSW1wb3J0RXJyb3JDYXRlZ29yaWVzLkNvbmN1cnJlbnRJbXBvcnQpIHtcblx0XHRcdGNvbnNvbGUubG9nKFwiVHJpZWQgdG8gc3RhcnQgY29uY3VycmVudCBpbXBvcnRcIilcblx0XHRcdHNob3dTbmFja0Jhcih7XG5cdFx0XHRcdG1lc3NhZ2U6IFwicGxlYXNlV2FpdF9tc2dcIixcblx0XHRcdFx0YnV0dG9uOiB7XG5cdFx0XHRcdFx0bGFiZWw6IFwib2tfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHt9LFxuXHRcdFx0XHR9LFxuXHRcdFx0fSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc29sZS5sb2coYEVycm9yIHdoaWxlIGltcG9ydGluZyBtYWlscywgY2F0ZWdvcnk6ICR7ZXJyLmRhdGEuY2F0ZWdvcnl9LCBzb3VyY2U6ICR7ZXJyLmRhdGEuc291cmNlfWApXG5cdFx0XHRjb25zdCBuYXZpZ2F0ZVRvSW1wb3J0U2V0dGluZ3M6IFNuYWNrQmFyQnV0dG9uQXR0cnMgPSB7XG5cdFx0XHRcdGxhYmVsOiBcInNob3dfYWN0aW9uXCIsXG5cdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLm9wZW5TZXR0aW5nc0hhbmRsZXIub3BlblNldHRpbmdzKFwibWFpbEltcG9ydFwiKSxcblx0XHRcdH1cblx0XHRcdHNob3dTbmFja0Jhcih7IG1lc3NhZ2U6IFwic29tZU1haWxGYWlsZWRJbXBvcnRfbXNnXCIsIGJ1dHRvbjogbmF2aWdhdGVUb0ltcG9ydFNldHRpbmdzIH0pXG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIENhbGwgdG8gdGhlIG5hdGl2ZU1haWxJbXBvcnRGYWNhZGUgaW4gd29ya2VyIHRvIHN0YXJ0IGEgbWFpbCBpbXBvcnQgZnJvbSAuZW1sIG9yIC5tYm94IGZpbGVzLlxuXHQgKiBAcGFyYW0gZmlsZVBhdGhzIHRvIHRoZSAuZW1sLy5tYm94IGZpbGVzIHRvIGltcG9ydCBtYWlscyBmcm9tXG5cdCAqL1xuXHRhc3luYyBvblN0YXJ0QnRuQ2xpY2soZmlsZVBhdGhzOiBBcnJheTxzdHJpbmc+KSB7XG5cdFx0aWYgKGlzRW1wdHkoZmlsZVBhdGhzKSkgcmV0dXJuXG5cdFx0aWYgKCF0aGlzLnNob3VsZFJlbmRlclN0YXJ0QnV0dG9uKCkpIHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwiY2FuJ3QgY2hhbmdlIHN0YXRlIHRvIHN0YXJ0aW5nXCIpXG5cblx0XHRjb25zdCBhcGlVcmwgPSBnZXRBcGlCYXNlVXJsKHRoaXMuZG9tYWluQ29uZmlnUHJvdmlkZXIuZ2V0Q3VycmVudERvbWFpbkNvbmZpZygpKVxuXHRcdGNvbnN0IG1haWxib3ggPSBhd2FpdCB0aGlzLmdldE1haWxib3goKVxuXHRcdGNvbnN0IG1haWxib3hJZCA9IG1haWxib3guX2lkXG5cdFx0Y29uc3QgbWFpbE93bmVyR3JvdXBJZCA9IGFzc2VydE5vdE51bGwobWFpbGJveC5fb3duZXJHcm91cClcblx0XHRjb25zdCB1c2VySWQgPSB0aGlzLmxvZ2luQ29udHJvbGxlci5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJJZFxuXHRcdGNvbnN0IGltcG9ydEZhY2FkZSA9IGFzc2VydE5vdE51bGwodGhpcy5uYXRpdmVNYWlsSW1wb3J0RmFjYWRlKVxuXHRcdGNvbnN0IHNlbGVjdGVkVGFyZ2V0Rm9sZGVyID0gYXNzZXJ0Tm90TnVsbCh0aGlzLnNlbGVjdGVkVGFyZ2V0Rm9sZGVyKVxuXHRcdGNvbnN0IHVuZW5jcnlwdGVkQ3JlZGVudGlhbHMgPSBhc3NlcnROb3ROdWxsKGF3YWl0IHRoaXMuY3JlZGVudGlhbHNQcm92aWRlcj8uZ2V0RGVjcnlwdGVkQ3JlZGVudGlhbHNCeVVzZXJJZCh1c2VySWQpKVxuXG5cdFx0dGhpcy5yZXNldFN0YXR1cygpXG5cdFx0bGV0IHByb2dyZXNzTW9uaXRvciA9IHRoaXMuY3JlYXRlRXN0aW1hdGluZ1Byb2dyZXNzTW9uaXRvcigpXG5cdFx0dGhpcy5hY3RpdmVJbXBvcnQgPSB7XG5cdFx0XHRyZW1vdGVTdGF0ZUlkOiBbR0VORVJBVEVEX01JTl9JRCwgR0VORVJBVEVEX01JTl9JRF0sXG5cdFx0XHR1aVN0YXR1czogVWlJbXBvcnRTdGF0dXMuU3RhcnRpbmcsXG5cdFx0XHRwcm9ncmVzc01vbml0b3IsXG5cdFx0fVxuXHRcdHRoaXMuYWN0aXZlSW1wb3J0Py5wcm9ncmVzc01vbml0b3I/LmNvbnRpbnVlRXN0aW1hdGlvbigpXG5cdFx0bS5yZWRyYXcoKVxuXG5cdFx0dHJ5IHtcblx0XHRcdHRoaXMuYWN0aXZlSW1wb3J0LnJlbW90ZVN0YXRlSWQgPSBhd2FpdCBpbXBvcnRGYWNhZGUucHJlcGFyZU5ld0ltcG9ydChcblx0XHRcdFx0bWFpbGJveElkLFxuXHRcdFx0XHRtYWlsT3duZXJHcm91cElkLFxuXHRcdFx0XHRzZWxlY3RlZFRhcmdldEZvbGRlci5faWQsXG5cdFx0XHRcdGZpbGVQYXRocyxcblx0XHRcdFx0dW5lbmNyeXB0ZWRDcmVkZW50aWFscyxcblx0XHRcdFx0YXBpVXJsLFxuXHRcdFx0KVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlIGluc3RhbmNlb2YgTWFpbEltcG9ydEVycm9yKSB7XG5cdFx0XHRcdHRoaXMuaGFuZGxlRXJyb3IoZSkuY2F0Y2goKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH1cblx0XHRhd2FpdCBpbXBvcnRGYWNhZGUuc2V0UHJvZ3Jlc3NBY3Rpb24obWFpbGJveElkLCBJbXBvcnRQcm9ncmVzc0FjdGlvbi5Db250aW51ZSlcblx0fVxuXG5cdGFzeW5jIG9uUGF1c2VCdG5DbGljaygpIHtcblx0XHRsZXQgYWN0aXZlSW1wb3J0ID0gYXNzZXJ0Tm90TnVsbCh0aGlzLmFjdGl2ZUltcG9ydClcblxuXHRcdGlmIChhY3RpdmVJbXBvcnQudWlTdGF0dXMgIT09IFVpSW1wb3J0U3RhdHVzLlJ1bm5pbmcpIHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwiY2FuJ3QgY2hhbmdlIHN0YXRlIHRvIHBhdXNpbmdcIilcblxuXHRcdGFjdGl2ZUltcG9ydC51aVN0YXR1cyA9IFVpSW1wb3J0U3RhdHVzLlBhdXNpbmdcblx0XHRhY3RpdmVJbXBvcnQucHJvZ3Jlc3NNb25pdG9yLnBhdXNlRXN0aW1hdGlvbigpXG5cdFx0bS5yZWRyYXcoKVxuXG5cdFx0Y29uc3QgbWFpbGJveElkID0gKGF3YWl0IHRoaXMuZ2V0TWFpbGJveCgpKS5faWRcblx0XHRjb25zdCBuYXRpdmVJbXBvcnRGYWNhZGUgPSBhc3NlcnROb3ROdWxsKHRoaXMubmF0aXZlTWFpbEltcG9ydEZhY2FkZSlcblx0XHRhd2FpdCBuYXRpdmVJbXBvcnRGYWNhZGUuc2V0UHJvZ3Jlc3NBY3Rpb24obWFpbGJveElkLCBJbXBvcnRQcm9ncmVzc0FjdGlvbi5QYXVzZSlcblx0fVxuXG5cdGFzeW5jIG9uUmVzdW1lQnRuQ2xpY2soKSB7XG5cdFx0aWYgKCF0aGlzLnNob3VsZFJlbmRlclJlc3VtZUJ1dHRvbigpKSB0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcImNhbid0IGNoYW5nZSBzdGF0ZSB0byByZXN1bWluZ1wiKVxuXG5cdFx0bGV0IGFjdGl2ZUltcG9ydCA9IGFzc2VydE5vdE51bGwodGhpcy5hY3RpdmVJbXBvcnQpXG5cdFx0YWN0aXZlSW1wb3J0LnVpU3RhdHVzID0gVWlJbXBvcnRTdGF0dXMuUmVzdW1pbmdcblxuXHRcdGFjdGl2ZUltcG9ydC5wcm9ncmVzc01vbml0b3IuY29udGludWVFc3RpbWF0aW9uKClcblx0XHRtLnJlZHJhdygpXG5cblx0XHRjb25zdCBtYWlsYm94SWQgPSAoYXdhaXQgdGhpcy5nZXRNYWlsYm94KCkpLl9pZFxuXHRcdGNvbnN0IG5hdGl2ZUltcG9ydEZhY2FkZSA9IGFzc2VydE5vdE51bGwodGhpcy5uYXRpdmVNYWlsSW1wb3J0RmFjYWRlKVxuXHRcdGF3YWl0IG5hdGl2ZUltcG9ydEZhY2FkZS5zZXRQcm9ncmVzc0FjdGlvbihtYWlsYm94SWQsIEltcG9ydFByb2dyZXNzQWN0aW9uLkNvbnRpbnVlKVxuXHR9XG5cblx0YXN5bmMgb25DYW5jZWxCdG5DbGljaygpIHtcblx0XHRpZiAoIXRoaXMuc2hvdWxkUmVuZGVyQ2FuY2VsQnV0dG9uKCkpIHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwiY2FuJ3QgY2hhbmdlIHN0YXRlIHRvIGNhbmNlbGxpbmdcIilcblxuXHRcdGxldCBhY3RpdmVJbXBvcnQgPSBhc3NlcnROb3ROdWxsKHRoaXMuYWN0aXZlSW1wb3J0KVxuXHRcdGFjdGl2ZUltcG9ydC51aVN0YXR1cyA9IFVpSW1wb3J0U3RhdHVzLkNhbmNlbGxpbmdcblxuXHRcdGFjdGl2ZUltcG9ydC5wcm9ncmVzc01vbml0b3IucGF1c2VFc3RpbWF0aW9uKClcblx0XHRtLnJlZHJhdygpXG5cblx0XHRjb25zdCBtYWlsYm94SWQgPSAoYXdhaXQgdGhpcy5nZXRNYWlsYm94KCkpLl9pZFxuXHRcdGNvbnN0IG5hdGl2ZUltcG9ydEZhY2FkZSA9IGFzc2VydE5vdE51bGwodGhpcy5uYXRpdmVNYWlsSW1wb3J0RmFjYWRlKVxuXHRcdGF3YWl0IG5hdGl2ZUltcG9ydEZhY2FkZS5zZXRQcm9ncmVzc0FjdGlvbihtYWlsYm94SWQsIEltcG9ydFByb2dyZXNzQWN0aW9uLlN0b3ApXG5cdH1cblxuXHRzaG91bGRSZW5kZXJTdGFydEJ1dHRvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5hY3RpdmVJbXBvcnQgPT09IG51bGxcblx0fVxuXG5cdHNob3VsZFJlbmRlckltcG9ydFN0YXR1cygpOiBib29sZWFuIHtcblx0XHRjb25zdCBhY3RpdmVJbXBvcnRTdGF0dXMgPSB0aGlzLmdldFVpU3RhdHVzKClcblx0XHRpZiAoYWN0aXZlSW1wb3J0U3RhdHVzID09PSBudWxsKSByZXR1cm4gZmFsc2VcblxuXHRcdHJldHVybiAoXG5cdFx0XHRhY3RpdmVJbXBvcnRTdGF0dXMgPT09IFVpSW1wb3J0U3RhdHVzLlN0YXJ0aW5nIHx8XG5cdFx0XHRhY3RpdmVJbXBvcnRTdGF0dXMgPT09IFVpSW1wb3J0U3RhdHVzLlJ1bm5pbmcgfHxcblx0XHRcdGFjdGl2ZUltcG9ydFN0YXR1cyA9PT0gVWlJbXBvcnRTdGF0dXMuUGF1c2luZyB8fFxuXHRcdFx0YWN0aXZlSW1wb3J0U3RhdHVzID09PSBVaUltcG9ydFN0YXR1cy5QYXVzZWQgfHxcblx0XHRcdGFjdGl2ZUltcG9ydFN0YXR1cyA9PT0gVWlJbXBvcnRTdGF0dXMuQ2FuY2VsbGluZyB8fFxuXHRcdFx0YWN0aXZlSW1wb3J0U3RhdHVzID09PSBVaUltcG9ydFN0YXR1cy5SZXN1bWluZ1xuXHRcdClcblx0fVxuXG5cdHNob3VsZFJlbmRlclBhdXNlQnV0dG9uKCk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IGFjdGl2ZUltcG9ydFN0YXR1cyA9IHRoaXMuZ2V0VWlTdGF0dXMoKVxuXHRcdGlmIChhY3RpdmVJbXBvcnRTdGF0dXMgPT09IG51bGwpIHJldHVybiBmYWxzZVxuXG5cdFx0cmV0dXJuIGFjdGl2ZUltcG9ydFN0YXR1cyA9PT0gVWlJbXBvcnRTdGF0dXMuUnVubmluZyB8fCBhY3RpdmVJbXBvcnRTdGF0dXMgPT09IFVpSW1wb3J0U3RhdHVzLlN0YXJ0aW5nIHx8IGFjdGl2ZUltcG9ydFN0YXR1cyA9PT0gVWlJbXBvcnRTdGF0dXMuUGF1c2luZ1xuXHR9XG5cblx0c2hvdWxkRGlzYWJsZVBhdXNlQnV0dG9uKCk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IGFjdGl2ZUltcG9ydFN0YXR1cyA9IHRoaXMuZ2V0VWlTdGF0dXMoKVxuXHRcdGlmIChhY3RpdmVJbXBvcnRTdGF0dXMgPT09IG51bGwpIHJldHVybiBmYWxzZVxuXG5cdFx0cmV0dXJuIGFjdGl2ZUltcG9ydFN0YXR1cyA9PT0gVWlJbXBvcnRTdGF0dXMuUGF1c2luZyB8fCBhY3RpdmVJbXBvcnRTdGF0dXMgPT09IFVpSW1wb3J0U3RhdHVzLlN0YXJ0aW5nXG5cdH1cblxuXHRzaG91bGRSZW5kZXJSZXN1bWVCdXR0b24oKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgYWN0aXZlSW1wb3J0U3RhdHVzID0gdGhpcy5nZXRVaVN0YXR1cygpXG5cdFx0aWYgKGFjdGl2ZUltcG9ydFN0YXR1cyA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlXG5cblx0XHRyZXR1cm4gYWN0aXZlSW1wb3J0U3RhdHVzID09PSBVaUltcG9ydFN0YXR1cy5QYXVzZWQgfHwgYWN0aXZlSW1wb3J0U3RhdHVzID09PSBVaUltcG9ydFN0YXR1cy5SZXN1bWluZ1xuXHR9XG5cblx0c2hvdWxkRGlzYWJsZVJlc3VtZUJ1dHRvbigpOiBib29sZWFuIHtcblx0XHRjb25zdCBhY3RpdmVJbXBvcnRTdGF0dXMgPSB0aGlzLmdldFVpU3RhdHVzKClcblx0XHRpZiAoYWN0aXZlSW1wb3J0U3RhdHVzID09PSBudWxsKSByZXR1cm4gZmFsc2VcblxuXHRcdHJldHVybiBhY3RpdmVJbXBvcnRTdGF0dXMgPT09IFVpSW1wb3J0U3RhdHVzLlJlc3VtaW5nIHx8IGFjdGl2ZUltcG9ydFN0YXR1cyA9PT0gVWlJbXBvcnRTdGF0dXMuU3RhcnRpbmdcblx0fVxuXG5cdHNob3VsZFJlbmRlckNhbmNlbEJ1dHRvbigpOiBib29sZWFuIHtcblx0XHRjb25zdCBhY3RpdmVJbXBvcnRTdGF0dXMgPSB0aGlzLmdldFVpU3RhdHVzKClcblx0XHRpZiAoYWN0aXZlSW1wb3J0U3RhdHVzID09PSBudWxsKSByZXR1cm4gZmFsc2VcblxuXHRcdHJldHVybiAoXG5cdFx0XHRhY3RpdmVJbXBvcnRTdGF0dXMgPT09IFVpSW1wb3J0U3RhdHVzLlBhdXNlZCB8fFxuXHRcdFx0YWN0aXZlSW1wb3J0U3RhdHVzID09PSBVaUltcG9ydFN0YXR1cy5SdW5uaW5nIHx8XG5cdFx0XHRhY3RpdmVJbXBvcnRTdGF0dXMgPT09IFVpSW1wb3J0U3RhdHVzLlBhdXNpbmcgfHxcblx0XHRcdGFjdGl2ZUltcG9ydFN0YXR1cyA9PT0gVWlJbXBvcnRTdGF0dXMuQ2FuY2VsbGluZ1xuXHRcdClcblx0fVxuXG5cdHNob3VsZERpc2FibGVDYW5jZWxCdXR0b24oKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgYWN0aXZlSW1wb3J0U3RhdHVzID0gdGhpcy5nZXRVaVN0YXR1cygpXG5cdFx0cmV0dXJuIChcblx0XHRcdGFjdGl2ZUltcG9ydFN0YXR1cyA9PT0gVWlJbXBvcnRTdGF0dXMuQ2FuY2VsbGluZyB8fCBhY3RpdmVJbXBvcnRTdGF0dXMgPT09IFVpSW1wb3J0U3RhdHVzLlBhdXNpbmcgfHwgYWN0aXZlSW1wb3J0U3RhdHVzID09PSBVaUltcG9ydFN0YXR1cy5TdGFydGluZ1xuXHRcdClcblx0fVxuXG5cdHNob3VsZFJlbmRlclByb2Nlc3NlZE1haWxzKCk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IGFjdGl2ZUltcG9ydFN0YXR1cyA9IHRoaXMuZ2V0VWlTdGF0dXMoKVxuXHRcdHJldHVybiAoXG5cdFx0XHR0aGlzLmFjdGl2ZUltcG9ydD8ucHJvZ3Jlc3NNb25pdG9yPy50b3RhbFdvcmsgIT0gREVGQVVMVF9UT1RBTF9XT1JLICYmXG5cdFx0XHQoYWN0aXZlSW1wb3J0U3RhdHVzID09PSBVaUltcG9ydFN0YXR1cy5SdW5uaW5nIHx8XG5cdFx0XHRcdGFjdGl2ZUltcG9ydFN0YXR1cyA9PT0gVWlJbXBvcnRTdGF0dXMuUmVzdW1pbmcgfHxcblx0XHRcdFx0YWN0aXZlSW1wb3J0U3RhdHVzID09PSBVaUltcG9ydFN0YXR1cy5QYXVzaW5nIHx8XG5cdFx0XHRcdGFjdGl2ZUltcG9ydFN0YXR1cyA9PT0gVWlJbXBvcnRTdGF0dXMuUGF1c2VkKVxuXHRcdClcblx0fVxuXG5cdGdldFRvdGFsTWFpbHNDb3VudCgpIHtcblx0XHRyZXR1cm4gYXNzZXJ0Tm90TnVsbCh0aGlzLmFjdGl2ZUltcG9ydCkucHJvZ3Jlc3NNb25pdG9yLnRvdGFsV29ya1xuXHR9XG5cblx0Z2V0UHJvY2Vzc2VkTWFpbHNDb3VudCgpIHtcblx0XHRjb25zdCBwcm9ncmVzc01vbml0b3IgPSBhc3NlcnROb3ROdWxsKHRoaXMuYWN0aXZlSW1wb3J0KS5wcm9ncmVzc01vbml0b3Jcblx0XHRyZXR1cm4gTWF0aC5taW4oTWF0aC5yb3VuZChwcm9ncmVzc01vbml0b3Iud29ya0NvbXBsZXRlZCksIHByb2dyZXNzTW9uaXRvci50b3RhbFdvcmspXG5cdH1cblxuXHRnZXRQcm9ncmVzcygpIHtcblx0XHRjb25zdCBwcm9ncmVzc01vbml0b3IgPSBhc3NlcnROb3ROdWxsKHRoaXMuYWN0aXZlSW1wb3J0KS5wcm9ncmVzc01vbml0b3Jcblx0XHRyZXR1cm4gTWF0aC5jZWlsKHByb2dyZXNzTW9uaXRvci5wZXJjZW50YWdlKCkpXG5cdH1cblxuXHRnZXRGaW5hbGlzZWRJbXBvcnRzKCk6IEFycmF5PEltcG9ydE1haWxTdGF0ZT4ge1xuXHRcdHJldHVybiBBcnJheS5mcm9tKHRoaXMuZmluYWxpc2VkSW1wb3J0U3RhdGVzLnZhbHVlcygpKVxuXHR9XG5cblx0dXBkYXRlRmluYWxpc2VkSW1wb3J0KGltcG9ydE1haWxTdGF0ZUVsZW1lbnRJZDogSWQsIGltcG9ydE1haWxTdGF0ZTogSW1wb3J0TWFpbFN0YXRlKSB7XG5cdFx0dGhpcy5maW5hbGlzZWRJbXBvcnRTdGF0ZXMuc2V0KGltcG9ydE1haWxTdGF0ZUVsZW1lbnRJZCwgaW1wb3J0TWFpbFN0YXRlKVxuXHR9XG5cblx0cHJpdmF0ZSByZXNldFN0YXR1cygpIHtcblx0XHR0aGlzLmFjdGl2ZUltcG9ydCA9IG51bGxcblx0fVxuXG5cdGdldFVpU3RhdHVzKCkge1xuXHRcdHJldHVybiB0aGlzLmFjdGl2ZUltcG9ydD8udWlTdGF0dXMgPz8gbnVsbFxuXHR9XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIFVpSW1wb3J0U3RhdHVzIHtcblx0U3RhcnRpbmcsXG5cdFJlc3VtaW5nLFxuXHRSdW5uaW5nLFxuXHRQYXVzaW5nLFxuXHRQYXVzZWQsXG5cdENhbmNlbGxpbmcsXG59XG5cbmZ1bmN0aW9uIGltcG9ydFN0YXR1c1RvVWlJbXBvcnRTdGF0dXMoaW1wb3J0U3RhdHVzOiBJbXBvcnRTdGF0dXMpIHtcblx0Ly8gV2UgZG8gbm90IHJlbmRlciBJbXBvcnRTdGF0dXMuRmluaXNoZWQgYW5kIEltcG9ydFN0YXR1cy5DYW5jZWxlZFxuXHQvLyBpbiB0aGUgVUksIGFuZCB0aGVyZWZvcmUgcmV0dXJuIHRoZSBjb3JyZXNwb25kaW5nIHByZXZpb3VzIHN0YXRlcy5cblx0c3dpdGNoIChpbXBvcnRTdGF0dXMpIHtcblx0XHRjYXNlIEltcG9ydFN0YXR1cy5GaW5pc2hlZDpcblx0XHRcdHJldHVybiBVaUltcG9ydFN0YXR1cy5SdW5uaW5nXG5cdFx0Y2FzZSBJbXBvcnRTdGF0dXMuQ2FuY2VsZWQ6XG5cdFx0XHRyZXR1cm4gVWlJbXBvcnRTdGF0dXMuQ2FuY2VsbGluZ1xuXHRcdGNhc2UgSW1wb3J0U3RhdHVzLlBhdXNlZDpcblx0XHRcdHJldHVybiBVaUltcG9ydFN0YXR1cy5QYXVzZWRcblx0XHRjYXNlIEltcG9ydFN0YXR1cy5SdW5uaW5nOlxuXHRcdFx0cmV0dXJuIFVpSW1wb3J0U3RhdHVzLlJ1bm5pbmdcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNGaW5hbGlzZWRJbXBvcnQocmVtb3RlSW1wb3J0U3RhdHVzOiBJbXBvcnRTdGF0dXMpOiBib29sZWFuIHtcblx0cmV0dXJuIHJlbW90ZUltcG9ydFN0YXR1cyA9PSBJbXBvcnRTdGF0dXMuQ2FuY2VsZWQgfHwgcmVtb3RlSW1wb3J0U3RhdHVzID09IEltcG9ydFN0YXR1cy5GaW5pc2hlZFxufVxuIiwiaW1wb3J0IHsgYXNzZXJ0TWFpbk9yTm9kZSwgaXNBbmRyb2lkQXBwLCBpc0FwcCwgaXNCcm93c2VyLCBpc0Rlc2t0b3AsIGlzRWxlY3Ryb25DbGllbnQsIGlzSU9TQXBwLCBpc1Rlc3QgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IEV2ZW50Q29udHJvbGxlciB9IGZyb20gXCIuLi9jb21tb24vYXBpL21haW4vRXZlbnRDb250cm9sbGVyLmpzXCJcbmltcG9ydCB7IFNlYXJjaE1vZGVsIH0gZnJvbSBcIi4vc2VhcmNoL21vZGVsL1NlYXJjaE1vZGVsLmpzXCJcbmltcG9ydCB7IHR5cGUgTWFpbGJveERldGFpbCwgTWFpbGJveE1vZGVsIH0gZnJvbSBcIi4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9NYWlsYm94TW9kZWwuanNcIlxuaW1wb3J0IHsgTWluaW1pemVkTWFpbEVkaXRvclZpZXdNb2RlbCB9IGZyb20gXCIuL21haWwvbW9kZWwvTWluaW1pemVkTWFpbEVkaXRvclZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBDb250YWN0TW9kZWwgfSBmcm9tIFwiLi4vY29tbW9uL2NvbnRhY3RzRnVuY3Rpb25hbGl0eS9Db250YWN0TW9kZWwuanNcIlxuaW1wb3J0IHsgRW50aXR5Q2xpZW50IH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvY29tbW9uL0VudGl0eUNsaWVudC5qc1wiXG5pbXBvcnQgeyBQcm9ncmVzc1RyYWNrZXIgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9tYWluL1Byb2dyZXNzVHJhY2tlci5qc1wiXG5pbXBvcnQgeyBDcmVkZW50aWFsc1Byb3ZpZGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9taXNjL2NyZWRlbnRpYWxzL0NyZWRlbnRpYWxzUHJvdmlkZXIuanNcIlxuaW1wb3J0IHsgYm9vdHN0cmFwV29ya2VyLCBXb3JrZXJDbGllbnQgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9tYWluL1dvcmtlckNsaWVudC5qc1wiXG5pbXBvcnQgeyBDQUxFTkRBUl9NSU1FX1RZUEUsIEZpbGVDb250cm9sbGVyLCBndWlEb3dubG9hZCwgTUFJTF9NSU1FX1RZUEVTLCBWQ0FSRF9NSU1FX1RZUEVTIH0gZnJvbSBcIi4uL2NvbW1vbi9maWxlL0ZpbGVDb250cm9sbGVyLmpzXCJcbmltcG9ydCB7IFNlY29uZEZhY3RvckhhbmRsZXIgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvMmZhL1NlY29uZEZhY3RvckhhbmRsZXIuanNcIlxuaW1wb3J0IHsgV2ViYXV0aG5DbGllbnQgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvMmZhL3dlYmF1dGhuL1dlYmF1dGhuQ2xpZW50LmpzXCJcbmltcG9ydCB7IExvZ2luRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvTG9naW5GYWNhZGUuanNcIlxuaW1wb3J0IHsgTG9naW5Db250cm9sbGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvbWFpbi9Mb2dpbkNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgQXBwSGVhZGVyQXR0cnMsIEhlYWRlciB9IGZyb20gXCIuLi9jb21tb24vZ3VpL0hlYWRlci5qc1wiXG5pbXBvcnQgeyBDdXN0b21lckZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ3VzdG9tZXJGYWNhZGUuanNcIlxuaW1wb3J0IHsgR2lmdENhcmRGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0dpZnRDYXJkRmFjYWRlLmpzXCJcbmltcG9ydCB7IEdyb3VwTWFuYWdlbWVudEZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvR3JvdXBNYW5hZ2VtZW50RmFjYWRlLmpzXCJcbmltcG9ydCB7IENvbmZpZ3VyYXRpb25EYXRhYmFzZSB9IGZyb20gXCIuLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ29uZmlndXJhdGlvbkRhdGFiYXNlLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9DYWxlbmRhckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBNYWlsRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9NYWlsRmFjYWRlLmpzXCJcbmltcG9ydCB7IFNoYXJlRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9TaGFyZUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBDb3VudGVyRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9Db3VudGVyRmFjYWRlLmpzXCJcbmltcG9ydCB7IEluZGV4ZXIgfSBmcm9tIFwiLi93b3JrZXJVdGlscy9pbmRleC9JbmRleGVyLmpzXCJcbmltcG9ydCB7IFNlYXJjaEZhY2FkZSB9IGZyb20gXCIuL3dvcmtlclV0aWxzL2luZGV4L1NlYXJjaEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBCb29raW5nRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9Cb29raW5nRmFjYWRlLmpzXCJcbmltcG9ydCB7IE1haWxBZGRyZXNzRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9NYWlsQWRkcmVzc0ZhY2FkZS5qc1wiXG5pbXBvcnQgeyBCbG9iRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9CbG9iRmFjYWRlLmpzXCJcbmltcG9ydCB7IFVzZXJNYW5hZ2VtZW50RmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9Vc2VyTWFuYWdlbWVudEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBSZWNvdmVyQ29kZUZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvUmVjb3ZlckNvZGVGYWNhZGUuanNcIlxuaW1wb3J0IHsgQ29udGFjdEZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ29udGFjdEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBVc2FnZVRlc3RDb250cm9sbGVyIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11c2FnZXRlc3RzXCJcbmltcG9ydCB7IEVwaGVtZXJhbFVzYWdlVGVzdFN0b3JhZ2UsIFN0b3JhZ2VCZWhhdmlvciwgVXNhZ2VUZXN0TW9kZWwgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvVXNhZ2VUZXN0TW9kZWwuanNcIlxuaW1wb3J0IHsgTmV3c01vZGVsIH0gZnJvbSBcIi4uL2NvbW1vbi9taXNjL25ld3MvTmV3c01vZGVsLmpzXCJcbmltcG9ydCB7IElTZXJ2aWNlRXhlY3V0b3IgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9jb21tb24vU2VydmljZVJlcXVlc3QuanNcIlxuaW1wb3J0IHsgQ3J5cHRvRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2NyeXB0by9DcnlwdG9GYWNhZGUuanNcIlxuaW1wb3J0IHsgU2VhcmNoVGV4dEluQXBwRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9TZWFyY2hUZXh0SW5BcHBGYWNhZGUuanNcIlxuaW1wb3J0IHsgU2V0dGluZ3NGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1NldHRpbmdzRmFjYWRlLmpzXCJcbmltcG9ydCB7IERlc2t0b3BTeXN0ZW1GYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0Rlc2t0b3BTeXN0ZW1GYWNhZGUuanNcIlxuaW1wb3J0IHsgV2ViTW9iaWxlRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9uYXRpdmUvbWFpbi9XZWJNb2JpbGVGYWNhZGUuanNcIlxuaW1wb3J0IHsgU3lzdGVtUGVybWlzc2lvbkhhbmRsZXIgfSBmcm9tIFwiLi4vY29tbW9uL25hdGl2ZS9tYWluL1N5c3RlbVBlcm1pc3Npb25IYW5kbGVyLmpzXCJcbmltcG9ydCB7IEludGVyV2luZG93RXZlbnRGYWNhZGVTZW5kRGlzcGF0Y2hlciB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvSW50ZXJXaW5kb3dFdmVudEZhY2FkZVNlbmREaXNwYXRjaGVyLmpzXCJcbmltcG9ydCB7IEV4cG9zZWRDYWNoZVN0b3JhZ2UgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS93b3JrZXIvcmVzdC9EZWZhdWx0RW50aXR5UmVzdENhY2hlLmpzXCJcbmltcG9ydCB7IFdvcmtlckZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL1dvcmtlckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBQYWdlQ29udGV4dExvZ2luTGlzdGVuZXIgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9tYWluL1BhZ2VDb250ZXh0TG9naW5MaXN0ZW5lci5qc1wiXG5pbXBvcnQgeyBXZWJzb2NrZXRDb25uZWN0aXZpdHlNb2RlbCB9IGZyb20gXCIuLi9jb21tb24vbWlzYy9XZWJzb2NrZXRDb25uZWN0aXZpdHlNb2RlbC5qc1wiXG5pbXBvcnQgeyBPcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXIgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9tYWluL09wZXJhdGlvblByb2dyZXNzVHJhY2tlci5qc1wiXG5pbXBvcnQgeyBJbmZvTWVzc2FnZUhhbmRsZXIgfSBmcm9tIFwiLi4vY29tbW9uL2d1aS9JbmZvTWVzc2FnZUhhbmRsZXIuanNcIlxuaW1wb3J0IHsgTmF0aXZlSW50ZXJmYWNlcyB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL21haW4vTmF0aXZlSW50ZXJmYWNlRmFjdG9yeS5qc1wiXG5pbXBvcnQgeyBFbnRyb3B5RmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvRW50cm9weUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBTcWxDaXBoZXJGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1NxbENpcGhlckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBhc3NlcnQsIGFzc2VydE5vdE51bGwsIGRlZmVyLCBEZWZlcnJlZE9iamVjdCwgbGF6eSwgbGF6eUFzeW5jLCBMYXp5TG9hZGVkLCBsYXp5TWVtb2l6ZWQsIG5vT3AgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IFJlY2lwaWVudHNNb2RlbCB9IGZyb20gXCIuLi9jb21tb24vYXBpL21haW4vUmVjaXBpZW50c01vZGVsLmpzXCJcbmltcG9ydCB7IE5vWm9uZURhdGVQcm92aWRlciB9IGZyb20gXCIuLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9Ob1pvbmVEYXRlUHJvdmlkZXIuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudCwgQ2FsZW5kYXJFdmVudEF0dGVuZGVlLCBDb250YWN0LCBNYWlsLCBNYWlsYm94UHJvcGVydGllcyB9IGZyb20gXCIuLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IFNlbmRNYWlsTW9kZWwgfSBmcm9tIFwiLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L1NlbmRNYWlsTW9kZWwuanNcIlxuaW1wb3J0IHsgT2ZmbGluZUluZGljYXRvclZpZXdNb2RlbCB9IGZyb20gXCIuLi9jb21tb24vZ3VpL2Jhc2UvT2ZmbGluZUluZGljYXRvclZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBSb3V0ZXIsIFNjb3BlZFJvdXRlciwgVGhyb3R0bGVkUm91dGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9ndWkvU2NvcGVkUm91dGVyLmpzXCJcbmltcG9ydCB7IERldmljZUNvbmZpZywgZGV2aWNlQ29uZmlnIH0gZnJvbSBcIi4uL2NvbW1vbi9taXNjL0RldmljZUNvbmZpZy5qc1wiXG5pbXBvcnQgeyBJbmJveFJ1bGVIYW5kbGVyIH0gZnJvbSBcIi4vbWFpbC9tb2RlbC9JbmJveFJ1bGVIYW5kbGVyLmpzXCJcbmltcG9ydCB7IFNlYXJjaFZpZXdNb2RlbCB9IGZyb20gXCIuL3NlYXJjaC92aWV3L1NlYXJjaFZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBTZWFyY2hSb3V0ZXIgfSBmcm9tIFwiLi4vY29tbW9uL3NlYXJjaC92aWV3L1NlYXJjaFJvdXRlci5qc1wiXG5pbXBvcnQgeyBNYWlsT3BlbmVkTGlzdGVuZXIgfSBmcm9tIFwiLi9tYWlsL3ZpZXcvTWFpbFZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBnZXRFbmFibGVkTWFpbEFkZHJlc3Nlc1dpdGhVc2VyIH0gZnJvbSBcIi4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9TaGFyZWRNYWlsVXRpbHMuanNcIlxuaW1wb3J0IHsgQ0xJRU5UX09OTFlfQ0FMRU5EQVJTLCBDb25zdCwgREVGQVVMVF9DTElFTlRfT05MWV9DQUxFTkRBUl9DT0xPUlMsIEZlYXR1cmVUeXBlLCBHcm91cFR5cGUgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgU2hhcmVhYmxlR3JvdXBUeXBlIH0gZnJvbSBcIi4uL2NvbW1vbi9zaGFyaW5nL0dyb3VwVXRpbHMuanNcIlxuaW1wb3J0IHsgUmVjZWl2ZWRHcm91cEludml0YXRpb25zTW9kZWwgfSBmcm9tIFwiLi4vY29tbW9uL3NoYXJpbmcvbW9kZWwvUmVjZWl2ZWRHcm91cEludml0YXRpb25zTW9kZWwuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJWaWV3TW9kZWwgfSBmcm9tIFwiLi4vY2FsZW5kYXItYXBwL2NhbGVuZGFyL3ZpZXcvQ2FsZW5kYXJWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudE1vZGVsLCBDYWxlbmRhck9wZXJhdGlvbiB9IGZyb20gXCIuLi9jYWxlbmRhci1hcHAvY2FsZW5kYXIvZ3VpL2V2ZW50ZWRpdG9yLW1vZGVsL0NhbGVuZGFyRXZlbnRNb2RlbC5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50c1JlcG9zaXRvcnkgfSBmcm9tIFwiLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJFdmVudHNSZXBvc2l0b3J5LmpzXCJcbmltcG9ydCB7IHNob3dQcm9ncmVzc0RpYWxvZyB9IGZyb20gXCIuLi9jb21tb24vZ3VpL2RpYWxvZ3MvUHJvZ3Jlc3NEaWFsb2cuanNcIlxuaW1wb3J0IHsgQ29udGFjdFN1Z2dlc3Rpb25Qcm92aWRlciwgUmVjaXBpZW50c1NlYXJjaE1vZGVsIH0gZnJvbSBcIi4uL2NvbW1vbi9taXNjL1JlY2lwaWVudHNTZWFyY2hNb2RlbC5qc1wiXG5pbXBvcnQgeyBDb252ZXJzYXRpb25WaWV3TW9kZWwsIENvbnZlcnNhdGlvblZpZXdNb2RlbEZhY3RvcnkgfSBmcm9tIFwiLi9tYWlsL3ZpZXcvQ29udmVyc2F0aW9uVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IENyZWF0ZU1haWxWaWV3ZXJPcHRpb25zIH0gZnJvbSBcIi4vbWFpbC92aWV3L01haWxWaWV3ZXIuanNcIlxuaW1wb3J0IHsgTWFpbFZpZXdlclZpZXdNb2RlbCB9IGZyb20gXCIuL21haWwvdmlldy9NYWlsVmlld2VyVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IEV4dGVybmFsTG9naW5WaWV3TW9kZWwgfSBmcm9tIFwiLi9tYWlsL3ZpZXcvRXh0ZXJuYWxMb2dpblZpZXcuanNcIlxuaW1wb3J0IHsgTmF0aXZlSW50ZXJmYWNlTWFpbiB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL21haW4vTmF0aXZlSW50ZXJmYWNlTWFpbi5qc1wiXG5pbXBvcnQgeyBOYXRpdmVGaWxlQXBwIH0gZnJvbSBcIi4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL0ZpbGVBcHAuanNcIlxuaW1wb3J0IHR5cGUgeyBOYXRpdmVQdXNoU2VydmljZUFwcCB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL21haW4vTmF0aXZlUHVzaFNlcnZpY2VBcHAuanNcIlxuaW1wb3J0IHsgQ29tbW9uU3lzdGVtRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9Db21tb25TeXN0ZW1GYWNhZGUuanNcIlxuaW1wb3J0IHsgVGhlbWVGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1RoZW1lRmFjYWRlLmpzXCJcbmltcG9ydCB7IE1vYmlsZVN5c3RlbUZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTW9iaWxlU3lzdGVtRmFjYWRlLmpzXCJcbmltcG9ydCB7IE1vYmlsZUNvbnRhY3RzRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9Nb2JpbGVDb250YWN0c0ZhY2FkZS5qc1wiXG5pbXBvcnQgeyBOYXRpdmVDcmVkZW50aWFsc0ZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTmF0aXZlQ3JlZGVudGlhbHNGYWNhZGUuanNcIlxuaW1wb3J0IHsgTWFpbEFkZHJlc3NOYW1lQ2hhbmdlciwgTWFpbEFkZHJlc3NUYWJsZU1vZGVsIH0gZnJvbSBcIi4uL2NvbW1vbi9zZXR0aW5ncy9tYWlsYWRkcmVzcy9NYWlsQWRkcmVzc1RhYmxlTW9kZWwuanNcIlxuaW1wb3J0IHsgR3JvdXBJbmZvIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IERyYXdlck1lbnVBdHRycyB9IGZyb20gXCIuLi9jb21tb24vZ3VpL25hdi9EcmF3ZXJNZW51LmpzXCJcbmltcG9ydCB7IERvbWFpbkNvbmZpZ1Byb3ZpZGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvY29tbW9uL0RvbWFpbkNvbmZpZ1Byb3ZpZGVyLmpzXCJcbmltcG9ydCB7IENyZWRlbnRpYWxSZW1vdmFsSGFuZGxlciB9IGZyb20gXCIuLi9jb21tb24vbG9naW4vQ3JlZGVudGlhbFJlbW92YWxIYW5kbGVyLmpzXCJcbmltcG9ydCB7IExvZ2luVmlld01vZGVsIH0gZnJvbSBcIi4uL2NvbW1vbi9sb2dpbi9Mb2dpblZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IHsgRW50cm9weUNvbGxlY3RvciB9IGZyb20gXCIuLi9jb21tb24vYXBpL21haW4vRW50cm9weUNvbGxlY3Rvci5qc1wiXG5pbXBvcnQgeyBub3RpZmljYXRpb25zIH0gZnJvbSBcIi4uL2NvbW1vbi9ndWkvTm90aWZpY2F0aW9ucy5qc1wiXG5pbXBvcnQgeyB3aW5kb3dGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvV2luZG93RmFjYWRlLmpzXCJcbmltcG9ydCB7IEJyb3dzZXJXZWJhdXRobiB9IGZyb20gXCIuLi9jb21tb24vbWlzYy8yZmEvd2ViYXV0aG4vQnJvd3NlcldlYmF1dGhuLmpzXCJcbmltcG9ydCB7IEZpbGVDb250cm9sbGVyQnJvd3NlciB9IGZyb20gXCIuLi9jb21tb24vZmlsZS9GaWxlQ29udHJvbGxlckJyb3dzZXIuanNcIlxuaW1wb3J0IHsgRmlsZUNvbnRyb2xsZXJOYXRpdmUgfSBmcm9tIFwiLi4vY29tbW9uL2ZpbGUvRmlsZUNvbnRyb2xsZXJOYXRpdmUuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJJbmZvLCBDYWxlbmRhck1vZGVsIH0gZnJvbSBcIi4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9tb2RlbC9DYWxlbmRhck1vZGVsLmpzXCJcbmltcG9ydCB7IENhbGVuZGFySW52aXRlSGFuZGxlciB9IGZyb20gXCIuLi9jYWxlbmRhci1hcHAvY2FsZW5kYXIvdmlldy9DYWxlbmRhckludml0ZXMuanNcIlxuaW1wb3J0IHsgQWxhcm1TY2hlZHVsZXIgfSBmcm9tIFwiLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQWxhcm1TY2hlZHVsZXIuanNcIlxuaW1wb3J0IHsgU2NoZWR1bGVySW1wbCB9IGZyb20gXCIuLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9TY2hlZHVsZXIuanNcIlxuaW1wb3J0IHR5cGUgeyBDYWxlbmRhckV2ZW50UHJldmlld1ZpZXdNb2RlbCB9IGZyb20gXCIuLi9jYWxlbmRhci1hcHAvY2FsZW5kYXIvZ3VpL2V2ZW50cG9wdXAvQ2FsZW5kYXJFdmVudFByZXZpZXdWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgaXNDdXN0b21pemF0aW9uRW5hYmxlZEZvckN1c3RvbWVyIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0N1c3RvbWVyVXRpbHMuanNcIlxuaW1wb3J0IHsgTmF0aXZlQ29udGFjdHNTeW5jTWFuYWdlciB9IGZyb20gXCIuL2NvbnRhY3RzL21vZGVsL05hdGl2ZUNvbnRhY3RzU3luY01hbmFnZXIuanNcIlxuaW1wb3J0IHsgUG9zdExvZ2luQWN0aW9ucyB9IGZyb20gXCIuLi9jb21tb24vbG9naW4vUG9zdExvZ2luQWN0aW9ucy5qc1wiXG5pbXBvcnQgeyBDcmVkZW50aWFsRm9ybWF0TWlncmF0b3IgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvY3JlZGVudGlhbHMvQ3JlZGVudGlhbEZvcm1hdE1pZ3JhdG9yLmpzXCJcbmltcG9ydCB7IEFkZE5vdGlmaWNhdGlvbkVtYWlsRGlhbG9nIH0gZnJvbSBcIi4vc2V0dGluZ3MvQWRkTm90aWZpY2F0aW9uRW1haWxEaWFsb2cuanNcIlxuaW1wb3J0IHsgTmF0aXZlVGhlbWVGYWNhZGUsIFRoZW1lQ29udHJvbGxlciwgV2ViVGhlbWVGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2d1aS9UaGVtZUNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgSHRtbFNhbml0aXplciB9IGZyb20gXCIuLi9jb21tb24vbWlzYy9IdG1sU2FuaXRpemVyLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uL2NvbW1vbi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgU2VhcmNoSW5kZXhTdGF0ZUluZm8gfSBmcm9tIFwiLi4vY29tbW9uL2FwaS93b3JrZXIvc2VhcmNoL1NlYXJjaFR5cGVzLmpzXCJcbmltcG9ydCB7IE1vYmlsZVBheW1lbnRzRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9Nb2JpbGVQYXltZW50c0ZhY2FkZS5qc1wiXG5pbXBvcnQgeyBNQUlMX1BSRUZJWCB9IGZyb20gXCIuLi9jb21tb24vbWlzYy9Sb3V0ZUNoYW5nZS5qc1wiXG5pbXBvcnQgeyBnZXREaXNwbGF5ZWRTZW5kZXIgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9jb21tb24vQ29tbW9uTWFpbFV0aWxzLmpzXCJcbmltcG9ydCB7IE1haWxNb2RlbCB9IGZyb20gXCIuL21haWwvbW9kZWwvTWFpbE1vZGVsLmpzXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3IuanNcIlxuaW1wb3J0IHsgc2hvd1NuYWNrQmFyIH0gZnJvbSBcIi4uL2NvbW1vbi9ndWkvYmFzZS9TbmFja0Jhci5qc1wiXG5pbXBvcnQgeyBXb3JrZXJSYW5kb21pemVyIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL3dvcmtlckludGVyZmFjZXMuanNcIlxuaW1wb3J0IHsgU2VhcmNoQ2F0ZWdvcnlUeXBlcyB9IGZyb20gXCIuL3NlYXJjaC9tb2RlbC9TZWFyY2hVdGlscy5qc1wiXG5pbXBvcnQgeyBXb3JrZXJJbnRlcmZhY2UgfSBmcm9tIFwiLi93b3JrZXJVdGlscy93b3JrZXIvV29ya2VySW1wbC5qc1wiXG5pbXBvcnQgeyBpc01haWxJblNwYW1PclRyYXNoIH0gZnJvbSBcIi4vbWFpbC9tb2RlbC9NYWlsQ2hlY2tzLmpzXCJcbmltcG9ydCB0eXBlIHsgQ29udGFjdEltcG9ydGVyIH0gZnJvbSBcIi4vY29udGFjdHMvQ29udGFjdEltcG9ydGVyLmpzXCJcbmltcG9ydCB7IEV4dGVybmFsQ2FsZW5kYXJGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0V4dGVybmFsQ2FsZW5kYXJGYWNhZGUuanNcIlxuaW1wb3J0IHsgQXBwVHlwZSB9IGZyb20gXCIuLi9jb21tb24vbWlzYy9DbGllbnRDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgUGFyc2VkRXZlbnQgfSBmcm9tIFwiLi4vY29tbW9uL2NhbGVuZGFyL2ltcG9ydC9DYWxlbmRhckltcG9ydGVyLmpzXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHR5cGUgeyBDYWxlbmRhckNvbnRhY3RQcmV2aWV3Vmlld01vZGVsIH0gZnJvbSBcIi4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9ndWkvZXZlbnRwb3B1cC9DYWxlbmRhckNvbnRhY3RQcmV2aWV3Vmlld01vZGVsLmpzXCJcbmltcG9ydCB7IEtleUxvYWRlckZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL0tleUxvYWRlckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBDb250YWN0U3VnZ2VzdGlvbiB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvQ29udGFjdFN1Z2dlc3Rpb25cIlxuaW1wb3J0IHsgTWFpbEltcG9ydGVyIH0gZnJvbSBcIi4vbWFpbC9pbXBvcnQvTWFpbEltcG9ydGVyLmpzXCJcbmltcG9ydCB0eXBlIHsgTWFpbEV4cG9ydENvbnRyb2xsZXIgfSBmcm9tIFwiLi9uYXRpdmUvbWFpbi9NYWlsRXhwb3J0Q29udHJvbGxlci5qc1wiXG5pbXBvcnQgeyBFeHBvcnRGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL0V4cG9ydEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBCdWxrTWFpbExvYWRlciB9IGZyb20gXCIuL3dvcmtlclV0aWxzL2luZGV4L0J1bGtNYWlsTG9hZGVyLmpzXCJcbmltcG9ydCB7IE1haWxFeHBvcnRGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L01haWxFeHBvcnRGYWNhZGUuanNcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcblxuY2xhc3MgTWFpbExvY2F0b3Ige1xuXHRldmVudENvbnRyb2xsZXIhOiBFdmVudENvbnRyb2xsZXJcblx0c2VhcmNoITogU2VhcmNoTW9kZWxcblx0bWFpbGJveE1vZGVsITogTWFpbGJveE1vZGVsXG5cdG1haWxNb2RlbCE6IE1haWxNb2RlbFxuXHRtaW5pbWl6ZWRNYWlsTW9kZWwhOiBNaW5pbWl6ZWRNYWlsRWRpdG9yVmlld01vZGVsXG5cdGNvbnRhY3RNb2RlbCE6IENvbnRhY3RNb2RlbFxuXHRlbnRpdHlDbGllbnQhOiBFbnRpdHlDbGllbnRcblx0cHJvZ3Jlc3NUcmFja2VyITogUHJvZ3Jlc3NUcmFja2VyXG5cdGNyZWRlbnRpYWxzUHJvdmlkZXIhOiBDcmVkZW50aWFsc1Byb3ZpZGVyXG5cdHdvcmtlciE6IFdvcmtlckNsaWVudFxuXHRmaWxlQ29udHJvbGxlciE6IEZpbGVDb250cm9sbGVyXG5cdHNlY29uZEZhY3RvckhhbmRsZXIhOiBTZWNvbmRGYWN0b3JIYW5kbGVyXG5cdHdlYkF1dGhuITogV2ViYXV0aG5DbGllbnRcblx0bG9naW5GYWNhZGUhOiBMb2dpbkZhY2FkZVxuXHRsb2dpbnMhOiBMb2dpbkNvbnRyb2xsZXJcblx0aGVhZGVyITogSGVhZGVyXG5cdGN1c3RvbWVyRmFjYWRlITogQ3VzdG9tZXJGYWNhZGVcblx0a2V5TG9hZGVyRmFjYWRlITogS2V5TG9hZGVyRmFjYWRlXG5cdGdpZnRDYXJkRmFjYWRlITogR2lmdENhcmRGYWNhZGVcblx0Z3JvdXBNYW5hZ2VtZW50RmFjYWRlITogR3JvdXBNYW5hZ2VtZW50RmFjYWRlXG5cdGNvbmZpZ0ZhY2FkZSE6IENvbmZpZ3VyYXRpb25EYXRhYmFzZVxuXHRjYWxlbmRhckZhY2FkZSE6IENhbGVuZGFyRmFjYWRlXG5cdG1haWxGYWNhZGUhOiBNYWlsRmFjYWRlXG5cdHNoYXJlRmFjYWRlITogU2hhcmVGYWNhZGVcblx0Y291bnRlckZhY2FkZSE6IENvdW50ZXJGYWNhZGVcblx0aW5kZXhlckZhY2FkZSE6IEluZGV4ZXJcblx0c2VhcmNoRmFjYWRlITogU2VhcmNoRmFjYWRlXG5cdGJvb2tpbmdGYWNhZGUhOiBCb29raW5nRmFjYWRlXG5cdG1haWxBZGRyZXNzRmFjYWRlITogTWFpbEFkZHJlc3NGYWNhZGVcblx0YmxvYkZhY2FkZSE6IEJsb2JGYWNhZGVcblx0dXNlck1hbmFnZW1lbnRGYWNhZGUhOiBVc2VyTWFuYWdlbWVudEZhY2FkZVxuXHRyZWNvdmVyQ29kZUZhY2FkZSE6IFJlY292ZXJDb2RlRmFjYWRlXG5cdGNvbnRhY3RGYWNhZGUhOiBDb250YWN0RmFjYWRlXG5cdHVzYWdlVGVzdENvbnRyb2xsZXIhOiBVc2FnZVRlc3RDb250cm9sbGVyXG5cdHVzYWdlVGVzdE1vZGVsITogVXNhZ2VUZXN0TW9kZWxcblx0bmV3c01vZGVsITogTmV3c01vZGVsXG5cdHNlcnZpY2VFeGVjdXRvciE6IElTZXJ2aWNlRXhlY3V0b3Jcblx0Y3J5cHRvRmFjYWRlITogQ3J5cHRvRmFjYWRlXG5cdHNlYXJjaFRleHRGYWNhZGUhOiBTZWFyY2hUZXh0SW5BcHBGYWNhZGVcblx0ZGVza3RvcFNldHRpbmdzRmFjYWRlITogU2V0dGluZ3NGYWNhZGVcblx0ZGVza3RvcFN5c3RlbUZhY2FkZSE6IERlc2t0b3BTeXN0ZW1GYWNhZGVcblx0ZXhwb3J0RmFjYWRlITogRXhwb3J0RmFjYWRlXG5cdHdlYk1vYmlsZUZhY2FkZSE6IFdlYk1vYmlsZUZhY2FkZVxuXHRzeXN0ZW1QZXJtaXNzaW9uSGFuZGxlciE6IFN5c3RlbVBlcm1pc3Npb25IYW5kbGVyXG5cdGludGVyV2luZG93RXZlbnRTZW5kZXIhOiBJbnRlcldpbmRvd0V2ZW50RmFjYWRlU2VuZERpc3BhdGNoZXJcblx0Y2FjaGVTdG9yYWdlITogRXhwb3NlZENhY2hlU3RvcmFnZVxuXHR3b3JrZXJGYWNhZGUhOiBXb3JrZXJGYWNhZGVcblx0bG9naW5MaXN0ZW5lciE6IFBhZ2VDb250ZXh0TG9naW5MaXN0ZW5lclxuXHRyYW5kb20hOiBXb3JrZXJSYW5kb21pemVyXG5cdGNvbm5lY3Rpdml0eU1vZGVsITogV2Vic29ja2V0Q29ubmVjdGl2aXR5TW9kZWxcblx0b3BlcmF0aW9uUHJvZ3Jlc3NUcmFja2VyITogT3BlcmF0aW9uUHJvZ3Jlc3NUcmFja2VyXG5cdGluZm9NZXNzYWdlSGFuZGxlciE6IEluZm9NZXNzYWdlSGFuZGxlclxuXHR0aGVtZUNvbnRyb2xsZXIhOiBUaGVtZUNvbnRyb2xsZXJcblx0Q29uc3QhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG5cdGJ1bGtNYWlsTG9hZGVyITogQnVsa01haWxMb2FkZXJcblx0bWFpbEV4cG9ydEZhY2FkZSE6IE1haWxFeHBvcnRGYWNhZGVcblxuXHRwcml2YXRlIG5hdGl2ZUludGVyZmFjZXM6IE5hdGl2ZUludGVyZmFjZXMgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIG1haWxJbXBvcnRlcjogTWFpbEltcG9ydGVyIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBlbnRyb3B5RmFjYWRlITogRW50cm9weUZhY2FkZVxuXHRwcml2YXRlIHNxbENpcGhlckZhY2FkZSE6IFNxbENpcGhlckZhY2FkZVxuXG5cdHJlYWRvbmx5IHJlY2lwaWVudHNNb2RlbDogbGF6eUFzeW5jPFJlY2lwaWVudHNNb2RlbD4gPSBsYXp5TWVtb2l6ZWQoYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgUmVjaXBpZW50c01vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vYXBpL21haW4vUmVjaXBpZW50c01vZGVsLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBSZWNpcGllbnRzTW9kZWwodGhpcy5jb250YWN0TW9kZWwsIHRoaXMubG9naW5zLCB0aGlzLm1haWxGYWNhZGUsIHRoaXMuZW50aXR5Q2xpZW50KVxuXHR9KVxuXG5cdGFzeW5jIG5vWm9uZURhdGVQcm92aWRlcigpOiBQcm9taXNlPE5vWm9uZURhdGVQcm92aWRlcj4ge1xuXHRcdHJldHVybiBuZXcgTm9ab25lRGF0ZVByb3ZpZGVyKClcblx0fVxuXG5cdGFzeW5jIHNlbmRNYWlsTW9kZWwobWFpbGJveERldGFpbHM6IE1haWxib3hEZXRhaWwsIG1haWxib3hQcm9wZXJ0aWVzOiBNYWlsYm94UHJvcGVydGllcyk6IFByb21pc2U8U2VuZE1haWxNb2RlbD4ge1xuXHRcdGNvbnN0IGZhY3RvcnkgPSBhd2FpdCB0aGlzLnNlbmRNYWlsTW9kZWxTeW5jRmFjdG9yeShtYWlsYm94RGV0YWlscywgbWFpbGJveFByb3BlcnRpZXMpXG5cdFx0cmV0dXJuIGZhY3RvcnkoKVxuXHR9XG5cblx0cHJpdmF0ZSByZWFkb25seSByZWRyYXc6IGxhenlBc3luYzwoKSA9PiB1bmtub3duPiA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgbSA9IGF3YWl0IGltcG9ydChcIm1pdGhyaWxcIilcblx0XHRyZXR1cm4gbS5yZWRyYXdcblx0fSlcblxuXHRyZWFkb25seSBvZmZsaW5lSW5kaWNhdG9yVmlld01vZGVsID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRyZXR1cm4gbmV3IE9mZmxpbmVJbmRpY2F0b3JWaWV3TW9kZWwoXG5cdFx0XHR0aGlzLmNhY2hlU3RvcmFnZSxcblx0XHRcdHRoaXMubG9naW5MaXN0ZW5lcixcblx0XHRcdHRoaXMuY29ubmVjdGl2aXR5TW9kZWwsXG5cdFx0XHR0aGlzLmxvZ2lucyxcblx0XHRcdHRoaXMucHJvZ3Jlc3NUcmFja2VyLFxuXHRcdFx0YXdhaXQgdGhpcy5yZWRyYXcoKSxcblx0XHQpXG5cdH0pXG5cblx0YXN5bmMgYXBwSGVhZGVyQXR0cnMoKTogUHJvbWlzZTxBcHBIZWFkZXJBdHRycz4ge1xuXHRcdHJldHVybiB7XG5cdFx0XHRvZmZsaW5lSW5kaWNhdG9yTW9kZWw6IGF3YWl0IHRoaXMub2ZmbGluZUluZGljYXRvclZpZXdNb2RlbCgpLFxuXHRcdFx0bmV3c01vZGVsOiB0aGlzLm5ld3NNb2RlbCxcblx0XHR9XG5cdH1cblxuXHRyZWFkb25seSBtYWlsVmlld01vZGVsID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IE1haWxWaWV3TW9kZWwgfSA9IGF3YWl0IGltcG9ydChcIi4uL21haWwtYXBwL21haWwvdmlldy9NYWlsVmlld01vZGVsLmpzXCIpXG5cdFx0Y29uc3QgY29udmVyc2F0aW9uVmlld01vZGVsRmFjdG9yeSA9IGF3YWl0IHRoaXMuY29udmVyc2F0aW9uVmlld01vZGVsRmFjdG9yeSgpXG5cdFx0Y29uc3Qgcm91dGVyID0gbmV3IFNjb3BlZFJvdXRlcih0aGlzLnRocm90dGxlZFJvdXRlcigpLCBcIi9tYWlsXCIpXG5cdFx0cmV0dXJuIG5ldyBNYWlsVmlld01vZGVsKFxuXHRcdFx0dGhpcy5tYWlsYm94TW9kZWwsXG5cdFx0XHR0aGlzLm1haWxNb2RlbCxcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0dGhpcy5ldmVudENvbnRyb2xsZXIsXG5cdFx0XHR0aGlzLmNvbm5lY3Rpdml0eU1vZGVsLFxuXHRcdFx0dGhpcy5jYWNoZVN0b3JhZ2UsXG5cdFx0XHRjb252ZXJzYXRpb25WaWV3TW9kZWxGYWN0b3J5LFxuXHRcdFx0dGhpcy5tYWlsT3BlbmVkTGlzdGVuZXIsXG5cdFx0XHRkZXZpY2VDb25maWcsXG5cdFx0XHR0aGlzLmluYm94UnVsZUhhbmxkZXIoKSxcblx0XHRcdHJvdXRlcixcblx0XHRcdGF3YWl0IHRoaXMucmVkcmF3KCksXG5cdFx0KVxuXHR9KVxuXG5cdHJlYWRvbmx5IGFmZmlsaWF0ZVZpZXdNb2RlbCA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBBZmZpbGlhdGVWaWV3TW9kZWwgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9zZXR0aW5ncy9BZmZpbGlhdGVWaWV3TW9kZWwuanNcIilcblx0XHRyZXR1cm4gbmV3IEFmZmlsaWF0ZVZpZXdNb2RlbCgpXG5cdH0pXG5cblx0aW5ib3hSdWxlSGFubGRlcigpOiBJbmJveFJ1bGVIYW5kbGVyIHtcblx0XHRyZXR1cm4gbmV3IEluYm94UnVsZUhhbmRsZXIodGhpcy5tYWlsRmFjYWRlLCB0aGlzLmxvZ2lucylcblx0fVxuXG5cdGFzeW5jIHNlYXJjaFZpZXdNb2RlbEZhY3RvcnkoKTogUHJvbWlzZTwoKSA9PiBTZWFyY2hWaWV3TW9kZWw+IHtcblx0XHRjb25zdCB7IFNlYXJjaFZpZXdNb2RlbCB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vbWFpbC1hcHAvc2VhcmNoL3ZpZXcvU2VhcmNoVmlld01vZGVsLmpzXCIpXG5cdFx0Y29uc3QgY29udmVyc2F0aW9uVmlld01vZGVsRmFjdG9yeSA9IGF3YWl0IHRoaXMuY29udmVyc2F0aW9uVmlld01vZGVsRmFjdG9yeSgpXG5cdFx0Y29uc3QgcmVkcmF3ID0gYXdhaXQgdGhpcy5yZWRyYXcoKVxuXHRcdGNvbnN0IHNlYXJjaFJvdXRlciA9IGF3YWl0IHRoaXMuc2NvcGVkU2VhcmNoUm91dGVyKClcblx0XHRjb25zdCBjYWxlbmRhckV2ZW50c1JlcG9zaXRvcnkgPSBhd2FpdCB0aGlzLmNhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeSgpXG5cdFx0cmV0dXJuICgpID0+IHtcblx0XHRcdHJldHVybiBuZXcgU2VhcmNoVmlld01vZGVsKFxuXHRcdFx0XHRzZWFyY2hSb3V0ZXIsXG5cdFx0XHRcdHRoaXMuc2VhcmNoLFxuXHRcdFx0XHR0aGlzLnNlYXJjaEZhY2FkZSxcblx0XHRcdFx0dGhpcy5tYWlsYm94TW9kZWwsXG5cdFx0XHRcdHRoaXMubG9naW5zLFxuXHRcdFx0XHR0aGlzLmluZGV4ZXJGYWNhZGUsXG5cdFx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0XHR0aGlzLmV2ZW50Q29udHJvbGxlcixcblx0XHRcdFx0dGhpcy5tYWlsT3BlbmVkTGlzdGVuZXIsXG5cdFx0XHRcdHRoaXMuY2FsZW5kYXJGYWNhZGUsXG5cdFx0XHRcdHRoaXMucHJvZ3Jlc3NUcmFja2VyLFxuXHRcdFx0XHRjb252ZXJzYXRpb25WaWV3TW9kZWxGYWN0b3J5LFxuXHRcdFx0XHRjYWxlbmRhckV2ZW50c1JlcG9zaXRvcnksXG5cdFx0XHRcdHJlZHJhdyxcblx0XHRcdFx0ZGV2aWNlQ29uZmlnLmdldE1haWxBdXRvU2VsZWN0QmVoYXZpb3IoKSxcblx0XHRcdFx0ZGV2aWNlQ29uZmlnLmdldENsaWVudE9ubHlDYWxlbmRhcnMoKSxcblx0XHRcdClcblx0XHR9XG5cdH1cblxuXHRyZWFkb25seSB0aHJvdHRsZWRSb3V0ZXI6IGxhenk8Um91dGVyPiA9IGxhenlNZW1vaXplZCgoKSA9PiBuZXcgVGhyb3R0bGVkUm91dGVyKCkpXG5cblx0cmVhZG9ubHkgc2NvcGVkU2VhcmNoUm91dGVyOiBsYXp5QXN5bmM8U2VhcmNoUm91dGVyPiA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBTZWFyY2hSb3V0ZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9zZWFyY2gvdmlldy9TZWFyY2hSb3V0ZXIuanNcIilcblx0XHRyZXR1cm4gbmV3IFNlYXJjaFJvdXRlcihuZXcgU2NvcGVkUm91dGVyKHRoaXMudGhyb3R0bGVkUm91dGVyKCksIFwiL3NlYXJjaFwiKSlcblx0fSlcblxuXHRyZWFkb25seSB1bnNjb3BlZFNlYXJjaFJvdXRlcjogbGF6eUFzeW5jPFNlYXJjaFJvdXRlcj4gPSBsYXp5TWVtb2l6ZWQoYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgU2VhcmNoUm91dGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vc2VhcmNoL3ZpZXcvU2VhcmNoUm91dGVyLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBTZWFyY2hSb3V0ZXIodGhpcy50aHJvdHRsZWRSb3V0ZXIoKSlcblx0fSlcblxuXHRyZWFkb25seSBtYWlsT3BlbmVkTGlzdGVuZXI6IE1haWxPcGVuZWRMaXN0ZW5lciA9IHtcblx0XHRvbkVtYWlsT3BlbmVkOiBpc0Rlc2t0b3AoKVxuXHRcdFx0PyAobWFpbCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuZGVza3RvcFN5c3RlbUZhY2FkZS5zZW5kU29ja2V0TWVzc2FnZShnZXREaXNwbGF5ZWRTZW5kZXIobWFpbCkuYWRkcmVzcylcblx0XHRcdCAgfVxuXHRcdFx0OiBub09wLFxuXHR9XG5cblx0cmVhZG9ubHkgY29udGFjdFZpZXdNb2RlbCA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBDb250YWN0Vmlld01vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9tYWlsLWFwcC9jb250YWN0cy92aWV3L0NvbnRhY3RWaWV3TW9kZWwuanNcIilcblx0XHRjb25zdCByb3V0ZXIgPSBuZXcgU2NvcGVkUm91dGVyKHRoaXMudGhyb3R0bGVkUm91dGVyKCksIFwiL2NvbnRhY3RcIilcblx0XHRyZXR1cm4gbmV3IENvbnRhY3RWaWV3TW9kZWwodGhpcy5jb250YWN0TW9kZWwsIHRoaXMuZW50aXR5Q2xpZW50LCB0aGlzLmV2ZW50Q29udHJvbGxlciwgcm91dGVyLCBhd2FpdCB0aGlzLnJlZHJhdygpKVxuXHR9KVxuXG5cdHJlYWRvbmx5IGNvbnRhY3RMaXN0Vmlld01vZGVsID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IENvbnRhY3RMaXN0Vmlld01vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9tYWlsLWFwcC9jb250YWN0cy92aWV3L0NvbnRhY3RMaXN0Vmlld01vZGVsLmpzXCIpXG5cdFx0Y29uc3Qgcm91dGVyID0gbmV3IFNjb3BlZFJvdXRlcih0aGlzLnRocm90dGxlZFJvdXRlcigpLCBcIi9jb250YWN0bGlzdFwiKVxuXHRcdHJldHVybiBuZXcgQ29udGFjdExpc3RWaWV3TW9kZWwoXG5cdFx0XHR0aGlzLmVudGl0eUNsaWVudCxcblx0XHRcdHRoaXMuZ3JvdXBNYW5hZ2VtZW50RmFjYWRlLFxuXHRcdFx0dGhpcy5sb2dpbnMsXG5cdFx0XHR0aGlzLmV2ZW50Q29udHJvbGxlcixcblx0XHRcdHRoaXMuY29udGFjdE1vZGVsLFxuXHRcdFx0YXdhaXQgdGhpcy5yZWNlaXZlZEdyb3VwSW52aXRhdGlvbnNNb2RlbChHcm91cFR5cGUuQ29udGFjdExpc3QpLFxuXHRcdFx0cm91dGVyLFxuXHRcdFx0YXdhaXQgdGhpcy5yZWRyYXcoKSxcblx0XHQpXG5cdH0pXG5cblx0YXN5bmMgcmVjZWl2ZWRHcm91cEludml0YXRpb25zTW9kZWw8VHlwZU9mR3JvdXAgZXh0ZW5kcyBTaGFyZWFibGVHcm91cFR5cGU+KGdyb3VwVHlwZTogVHlwZU9mR3JvdXApOiBQcm9taXNlPFJlY2VpdmVkR3JvdXBJbnZpdGF0aW9uc01vZGVsPFR5cGVPZkdyb3VwPj4ge1xuXHRcdGNvbnN0IHsgUmVjZWl2ZWRHcm91cEludml0YXRpb25zTW9kZWwgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9zaGFyaW5nL21vZGVsL1JlY2VpdmVkR3JvdXBJbnZpdGF0aW9uc01vZGVsLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBSZWNlaXZlZEdyb3VwSW52aXRhdGlvbnNNb2RlbDxUeXBlT2ZHcm91cD4oZ3JvdXBUeXBlLCB0aGlzLmV2ZW50Q29udHJvbGxlciwgdGhpcy5lbnRpdHlDbGllbnQsIHRoaXMubG9naW5zKVxuXHR9XG5cblx0cmVhZG9ubHkgY2FsZW5kYXJWaWV3TW9kZWwgPSBsYXp5TWVtb2l6ZWQ8UHJvbWlzZTxDYWxlbmRhclZpZXdNb2RlbD4+KGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IENhbGVuZGFyVmlld01vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jYWxlbmRhci1hcHAvY2FsZW5kYXIvdmlldy9DYWxlbmRhclZpZXdNb2RlbC5qc1wiKVxuXHRcdGNvbnN0IHsgRGVmYXVsdERhdGVQcm92aWRlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlsc1wiKVxuXHRcdGNvbnN0IHRpbWVab25lID0gbmV3IERlZmF1bHREYXRlUHJvdmlkZXIoKS50aW1lWm9uZSgpXG5cdFx0cmV0dXJuIG5ldyBDYWxlbmRhclZpZXdNb2RlbChcblx0XHRcdHRoaXMubG9naW5zLFxuXHRcdFx0YXN5bmMgKG1vZGU6IENhbGVuZGFyT3BlcmF0aW9uLCBldmVudDogQ2FsZW5kYXJFdmVudCkgPT4ge1xuXHRcdFx0XHRjb25zdCBtYWlsYm94RGV0YWlsID0gYXdhaXQgdGhpcy5tYWlsYm94TW9kZWwuZ2V0VXNlck1haWxib3hEZXRhaWxzKClcblx0XHRcdFx0Y29uc3QgbWFpbGJveFByb3BlcnRpZXMgPSBhd2FpdCB0aGlzLm1haWxib3hNb2RlbC5nZXRNYWlsYm94UHJvcGVydGllcyhtYWlsYm94RGV0YWlsLm1haWxib3hHcm91cFJvb3QpXG5cdFx0XHRcdHJldHVybiBhd2FpdCB0aGlzLmNhbGVuZGFyRXZlbnRNb2RlbChtb2RlLCBldmVudCwgbWFpbGJveERldGFpbCwgbWFpbGJveFByb3BlcnRpZXMsIG51bGwpXG5cdFx0XHR9LFxuXHRcdFx0KC4uLmFyZ3MpID0+IHRoaXMuY2FsZW5kYXJFdmVudFByZXZpZXdNb2RlbCguLi5hcmdzKSxcblx0XHRcdCguLi5hcmdzKSA9PiB0aGlzLmNhbGVuZGFyQ29udGFjdFByZXZpZXdNb2RlbCguLi5hcmdzKSxcblx0XHRcdGF3YWl0IHRoaXMuY2FsZW5kYXJNb2RlbCgpLFxuXHRcdFx0YXdhaXQgdGhpcy5jYWxlbmRhckV2ZW50c1JlcG9zaXRvcnkoKSxcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0dGhpcy5ldmVudENvbnRyb2xsZXIsXG5cdFx0XHR0aGlzLnByb2dyZXNzVHJhY2tlcixcblx0XHRcdGRldmljZUNvbmZpZyxcblx0XHRcdGF3YWl0IHRoaXMucmVjZWl2ZWRHcm91cEludml0YXRpb25zTW9kZWwoR3JvdXBUeXBlLkNhbGVuZGFyKSxcblx0XHRcdHRpbWVab25lLFxuXHRcdFx0dGhpcy5tYWlsYm94TW9kZWwsXG5cdFx0XHR0aGlzLmNvbnRhY3RNb2RlbCxcblx0XHQpXG5cdH0pXG5cblx0cmVhZG9ubHkgY2FsZW5kYXJFdmVudHNSZXBvc2l0b3J5OiBsYXp5QXN5bmM8Q2FsZW5kYXJFdmVudHNSZXBvc2l0b3J5PiA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBDYWxlbmRhckV2ZW50c1JlcG9zaXRvcnkgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeS5qc1wiKVxuXHRcdGNvbnN0IHsgRGVmYXVsdERhdGVQcm92aWRlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlsc1wiKVxuXHRcdGNvbnN0IHRpbWVab25lID0gbmV3IERlZmF1bHREYXRlUHJvdmlkZXIoKS50aW1lWm9uZSgpXG5cdFx0cmV0dXJuIG5ldyBDYWxlbmRhckV2ZW50c1JlcG9zaXRvcnkoXG5cdFx0XHRhd2FpdCB0aGlzLmNhbGVuZGFyTW9kZWwoKSxcblx0XHRcdHRoaXMuY2FsZW5kYXJGYWNhZGUsXG5cdFx0XHR0aW1lWm9uZSxcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0dGhpcy5ldmVudENvbnRyb2xsZXIsXG5cdFx0XHR0aGlzLmNvbnRhY3RNb2RlbCxcblx0XHRcdHRoaXMubG9naW5zLFxuXHRcdClcblx0fSlcblxuXHQvKiogVGhpcyB1Z2x5IGJpdCBleGlzdHMgYmVjYXVzZSBDYWxlbmRhckV2ZW50V2hvTW9kZWwgd2FudHMgYSBzeW5jIGZhY3RvcnkuICovXG5cdHByaXZhdGUgYXN5bmMgc2VuZE1haWxNb2RlbFN5bmNGYWN0b3J5KG1haWxib3hEZXRhaWxzOiBNYWlsYm94RGV0YWlsLCBtYWlsYm94UHJvcGVydGllczogTWFpbGJveFByb3BlcnRpZXMpOiBQcm9taXNlPCgpID0+IFNlbmRNYWlsTW9kZWw+IHtcblx0XHRjb25zdCB7IFNlbmRNYWlsTW9kZWwgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9tYWlsRnVuY3Rpb25hbGl0eS9TZW5kTWFpbE1vZGVsLmpzXCIpXG5cdFx0Y29uc3QgcmVjaXBpZW50c01vZGVsID0gYXdhaXQgdGhpcy5yZWNpcGllbnRzTW9kZWwoKVxuXHRcdGNvbnN0IGRhdGVQcm92aWRlciA9IGF3YWl0IHRoaXMubm9ab25lRGF0ZVByb3ZpZGVyKClcblx0XHRyZXR1cm4gKCkgPT5cblx0XHRcdG5ldyBTZW5kTWFpbE1vZGVsKFxuXHRcdFx0XHR0aGlzLm1haWxGYWNhZGUsXG5cdFx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0XHR0aGlzLmxvZ2lucyxcblx0XHRcdFx0dGhpcy5tYWlsYm94TW9kZWwsXG5cdFx0XHRcdHRoaXMuY29udGFjdE1vZGVsLFxuXHRcdFx0XHR0aGlzLmV2ZW50Q29udHJvbGxlcixcblx0XHRcdFx0bWFpbGJveERldGFpbHMsXG5cdFx0XHRcdHJlY2lwaWVudHNNb2RlbCxcblx0XHRcdFx0ZGF0ZVByb3ZpZGVyLFxuXHRcdFx0XHRtYWlsYm94UHJvcGVydGllcyxcblx0XHRcdFx0YXN5bmMgKG1haWw6IE1haWwpID0+IHtcblx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgaXNNYWlsSW5TcGFtT3JUcmFzaChtYWlsLCBtYWlsTG9jYXRvci5tYWlsTW9kZWwpXG5cdFx0XHRcdH0sXG5cdFx0XHQpXG5cdH1cblxuXHRhc3luYyBjYWxlbmRhckV2ZW50TW9kZWwoXG5cdFx0ZWRpdE1vZGU6IENhbGVuZGFyT3BlcmF0aW9uLFxuXHRcdGV2ZW50OiBQYXJ0aWFsPENhbGVuZGFyRXZlbnQ+LFxuXHRcdG1haWxib3hEZXRhaWw6IE1haWxib3hEZXRhaWwsXG5cdFx0bWFpbGJveFByb3BlcnRpZXM6IE1haWxib3hQcm9wZXJ0aWVzLFxuXHRcdHJlc3BvbnNlVG86IE1haWwgfCBudWxsLFxuXHQpOiBQcm9taXNlPENhbGVuZGFyRXZlbnRNb2RlbCB8IG51bGw+IHtcblx0XHRjb25zdCBbeyBtYWtlQ2FsZW5kYXJFdmVudE1vZGVsIH0sIHsgZ2V0VGltZVpvbmUgfSwgeyBjYWxlbmRhck5vdGlmaWNhdGlvblNlbmRlciB9XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcblx0XHRcdGltcG9ydChcIi4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9ndWkvZXZlbnRlZGl0b3ItbW9kZWwvQ2FsZW5kYXJFdmVudE1vZGVsLmpzXCIpLFxuXHRcdFx0aW1wb3J0KFwiLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlscy5qc1wiKSxcblx0XHRcdGltcG9ydChcIi4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci92aWV3L0NhbGVuZGFyTm90aWZpY2F0aW9uU2VuZGVyLmpzXCIpLFxuXHRcdF0pXG5cdFx0Y29uc3Qgc2VuZE1haWxNb2RlbEZhY3RvcnkgPSBhd2FpdCB0aGlzLnNlbmRNYWlsTW9kZWxTeW5jRmFjdG9yeShtYWlsYm94RGV0YWlsLCBtYWlsYm94UHJvcGVydGllcylcblx0XHRjb25zdCBzaG93UHJvZ3Jlc3MgPSA8VD4ocDogUHJvbWlzZTxUPikgPT4gc2hvd1Byb2dyZXNzRGlhbG9nKFwicGxlYXNlV2FpdF9tc2dcIiwgcClcblxuXHRcdHJldHVybiBhd2FpdCBtYWtlQ2FsZW5kYXJFdmVudE1vZGVsKFxuXHRcdFx0ZWRpdE1vZGUsXG5cdFx0XHRldmVudCxcblx0XHRcdGF3YWl0IHRoaXMucmVjaXBpZW50c01vZGVsKCksXG5cdFx0XHRhd2FpdCB0aGlzLmNhbGVuZGFyTW9kZWwoKSxcblx0XHRcdHRoaXMubG9naW5zLFxuXHRcdFx0bWFpbGJveERldGFpbCxcblx0XHRcdG1haWxib3hQcm9wZXJ0aWVzLFxuXHRcdFx0c2VuZE1haWxNb2RlbEZhY3RvcnksXG5cdFx0XHRjYWxlbmRhck5vdGlmaWNhdGlvblNlbmRlcixcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0cmVzcG9uc2VUbyxcblx0XHRcdGdldFRpbWVab25lKCksXG5cdFx0XHRzaG93UHJvZ3Jlc3MsXG5cdFx0KVxuXHR9XG5cblx0YXN5bmMgcmVjaXBpZW50c1NlYXJjaE1vZGVsKCk6IFByb21pc2U8UmVjaXBpZW50c1NlYXJjaE1vZGVsPiB7XG5cdFx0Y29uc3QgeyBSZWNpcGllbnRzU2VhcmNoTW9kZWwgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9taXNjL1JlY2lwaWVudHNTZWFyY2hNb2RlbC5qc1wiKVxuXHRcdGNvbnN0IHN1Z2dlc3Rpb25zUHJvdmlkZXIgPSBhd2FpdCB0aGlzLmNvbnRhY3RTdWdnZXN0aW9uUHJvdmlkZXIoKVxuXHRcdHJldHVybiBuZXcgUmVjaXBpZW50c1NlYXJjaE1vZGVsKGF3YWl0IHRoaXMucmVjaXBpZW50c01vZGVsKCksIHRoaXMuY29udGFjdE1vZGVsLCBzdWdnZXN0aW9uc1Byb3ZpZGVyLCB0aGlzLmVudGl0eUNsaWVudClcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgY29udGFjdFN1Z2dlc3Rpb25Qcm92aWRlcigpOiBQcm9taXNlPENvbnRhY3RTdWdnZXN0aW9uUHJvdmlkZXI+IHtcblx0XHRpZiAoaXNBcHAoKSkge1xuXHRcdFx0Y29uc3QgeyBNb2JpbGVDb250YWN0U3VnZ2VzdGlvblByb3ZpZGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL21haW4vTW9iaWxlQ29udGFjdFN1Z2dlc3Rpb25Qcm92aWRlci5qc1wiKVxuXHRcdFx0cmV0dXJuIG5ldyBNb2JpbGVDb250YWN0U3VnZ2VzdGlvblByb3ZpZGVyKHRoaXMubW9iaWxlQ29udGFjdHNGYWNhZGUpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGFzeW5jIGdldENvbnRhY3RTdWdnZXN0aW9ucyhfcXVlcnk6IHN0cmluZyk6IFByb21pc2U8cmVhZG9ubHkgQ29udGFjdFN1Z2dlc3Rpb25bXT4ge1xuXHRcdFx0XHRcdHJldHVybiBbXVxuXHRcdFx0XHR9LFxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJlYWRvbmx5IGNvbnZlcnNhdGlvblZpZXdNb2RlbEZhY3Rvcnk6IGxhenlBc3luYzxDb252ZXJzYXRpb25WaWV3TW9kZWxGYWN0b3J5PiA9IGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IENvbnZlcnNhdGlvblZpZXdNb2RlbCB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vbWFpbC1hcHAvbWFpbC92aWV3L0NvbnZlcnNhdGlvblZpZXdNb2RlbC5qc1wiKVxuXHRcdGNvbnN0IGZhY3RvcnkgPSBhd2FpdCB0aGlzLm1haWxWaWV3ZXJWaWV3TW9kZWxGYWN0b3J5KClcblx0XHRjb25zdCBtID0gYXdhaXQgaW1wb3J0KFwibWl0aHJpbFwiKVxuXHRcdHJldHVybiAob3B0aW9uczogQ3JlYXRlTWFpbFZpZXdlck9wdGlvbnMpID0+IHtcblx0XHRcdHJldHVybiBuZXcgQ29udmVyc2F0aW9uVmlld01vZGVsKFxuXHRcdFx0XHRvcHRpb25zLFxuXHRcdFx0XHQob3B0aW9ucykgPT4gZmFjdG9yeShvcHRpb25zKSxcblx0XHRcdFx0dGhpcy5lbnRpdHlDbGllbnQsXG5cdFx0XHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLFxuXHRcdFx0XHRkZXZpY2VDb25maWcsXG5cdFx0XHRcdHRoaXMubWFpbE1vZGVsLFxuXHRcdFx0XHRtLnJlZHJhdyxcblx0XHRcdClcblx0XHR9XG5cdH1cblxuXHRhc3luYyBjb252ZXJzYXRpb25WaWV3TW9kZWwob3B0aW9uczogQ3JlYXRlTWFpbFZpZXdlck9wdGlvbnMpOiBQcm9taXNlPENvbnZlcnNhdGlvblZpZXdNb2RlbD4ge1xuXHRcdGNvbnN0IGZhY3RvcnkgPSBhd2FpdCB0aGlzLmNvbnZlcnNhdGlvblZpZXdNb2RlbEZhY3RvcnkoKVxuXHRcdHJldHVybiBmYWN0b3J5KG9wdGlvbnMpXG5cdH1cblxuXHRjb250YWN0SW1wb3J0ZXIgPSBhc3luYyAoKTogUHJvbWlzZTxDb250YWN0SW1wb3J0ZXI+ID0+IHtcblx0XHRjb25zdCB7IENvbnRhY3RJbXBvcnRlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vbWFpbC1hcHAvY29udGFjdHMvQ29udGFjdEltcG9ydGVyLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBDb250YWN0SW1wb3J0ZXIoXG5cdFx0XHR0aGlzLmNvbnRhY3RGYWNhZGUsXG5cdFx0XHR0aGlzLnN5c3RlbVBlcm1pc3Npb25IYW5kbGVyLFxuXHRcdFx0aXNBcHAoKSA/IHRoaXMubW9iaWxlQ29udGFjdHNGYWNhZGUgOiBudWxsLFxuXHRcdFx0aXNBcHAoKSA/IHRoaXMubmF0aXZlQ29udGFjdHNTeW5jTWFuYWdlcigpIDogbnVsbCxcblx0XHQpXG5cdH1cblxuXHRhc3luYyBtYWlsVmlld2VyVmlld01vZGVsRmFjdG9yeSgpOiBQcm9taXNlPChvcHRpb25zOiBDcmVhdGVNYWlsVmlld2VyT3B0aW9ucykgPT4gTWFpbFZpZXdlclZpZXdNb2RlbD4ge1xuXHRcdGNvbnN0IHsgTWFpbFZpZXdlclZpZXdNb2RlbCB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vbWFpbC1hcHAvbWFpbC92aWV3L01haWxWaWV3ZXJWaWV3TW9kZWwuanNcIilcblx0XHRyZXR1cm4gKHsgbWFpbCwgc2hvd0ZvbGRlciB9KSA9PlxuXHRcdFx0bmV3IE1haWxWaWV3ZXJWaWV3TW9kZWwoXG5cdFx0XHRcdG1haWwsXG5cdFx0XHRcdHNob3dGb2xkZXIsXG5cdFx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0XHR0aGlzLm1haWxib3hNb2RlbCxcblx0XHRcdFx0dGhpcy5tYWlsTW9kZWwsXG5cdFx0XHRcdHRoaXMuY29udGFjdE1vZGVsLFxuXHRcdFx0XHR0aGlzLmNvbmZpZ0ZhY2FkZSxcblx0XHRcdFx0dGhpcy5maWxlQ29udHJvbGxlcixcblx0XHRcdFx0dGhpcy5sb2dpbnMsXG5cdFx0XHRcdGFzeW5jIChtYWlsYm94RGV0YWlscykgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IG1haWxib3hQcm9wZXJ0aWVzID0gYXdhaXQgdGhpcy5tYWlsYm94TW9kZWwuZ2V0TWFpbGJveFByb3BlcnRpZXMobWFpbGJveERldGFpbHMubWFpbGJveEdyb3VwUm9vdClcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5zZW5kTWFpbE1vZGVsKG1haWxib3hEZXRhaWxzLCBtYWlsYm94UHJvcGVydGllcylcblx0XHRcdFx0fSxcblx0XHRcdFx0dGhpcy5ldmVudENvbnRyb2xsZXIsXG5cdFx0XHRcdHRoaXMud29ya2VyRmFjYWRlLFxuXHRcdFx0XHR0aGlzLnNlYXJjaCxcblx0XHRcdFx0dGhpcy5tYWlsRmFjYWRlLFxuXHRcdFx0XHR0aGlzLmNyeXB0b0ZhY2FkZSxcblx0XHRcdFx0KCkgPT4gdGhpcy5jb250YWN0SW1wb3J0ZXIoKSxcblx0XHRcdClcblx0fVxuXG5cdGFzeW5jIGV4dGVybmFsTG9naW5WaWV3TW9kZWxGYWN0b3J5KCk6IFByb21pc2U8KCkgPT4gRXh0ZXJuYWxMb2dpblZpZXdNb2RlbD4ge1xuXHRcdGNvbnN0IHsgRXh0ZXJuYWxMb2dpblZpZXdNb2RlbCB9ID0gYXdhaXQgaW1wb3J0KFwiLi9tYWlsL3ZpZXcvRXh0ZXJuYWxMb2dpblZpZXcuanNcIilcblx0XHRyZXR1cm4gKCkgPT4gbmV3IEV4dGVybmFsTG9naW5WaWV3TW9kZWwodGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyKVxuXHR9XG5cblx0Z2V0IGRldmljZUNvbmZpZygpOiBEZXZpY2VDb25maWcge1xuXHRcdHJldHVybiBkZXZpY2VDb25maWdcblx0fVxuXG5cdGdldCBuYXRpdmUoKTogTmF0aXZlSW50ZXJmYWNlTWFpbiB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0TmF0aXZlSW50ZXJmYWNlKFwibmF0aXZlXCIpXG5cdH1cblxuXHRnZXQgZmlsZUFwcCgpOiBOYXRpdmVGaWxlQXBwIHtcblx0XHRyZXR1cm4gdGhpcy5nZXROYXRpdmVJbnRlcmZhY2UoXCJmaWxlQXBwXCIpXG5cdH1cblxuXHRnZXQgcHVzaFNlcnZpY2UoKTogTmF0aXZlUHVzaFNlcnZpY2VBcHAge1xuXHRcdHJldHVybiB0aGlzLmdldE5hdGl2ZUludGVyZmFjZShcInB1c2hTZXJ2aWNlXCIpXG5cdH1cblxuXHRnZXQgY29tbW9uU3lzdGVtRmFjYWRlKCk6IENvbW1vblN5c3RlbUZhY2FkZSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0TmF0aXZlSW50ZXJmYWNlKFwiY29tbW9uU3lzdGVtRmFjYWRlXCIpXG5cdH1cblxuXHRnZXQgdGhlbWVGYWNhZGUoKTogVGhlbWVGYWNhZGUge1xuXHRcdHJldHVybiB0aGlzLmdldE5hdGl2ZUludGVyZmFjZShcInRoZW1lRmFjYWRlXCIpXG5cdH1cblxuXHRnZXQgZXh0ZXJuYWxDYWxlbmRhckZhY2FkZSgpOiBFeHRlcm5hbENhbGVuZGFyRmFjYWRlIHtcblx0XHRyZXR1cm4gdGhpcy5nZXROYXRpdmVJbnRlcmZhY2UoXCJleHRlcm5hbENhbGVuZGFyRmFjYWRlXCIpXG5cdH1cblxuXHRnZXQgc3lzdGVtRmFjYWRlKCk6IE1vYmlsZVN5c3RlbUZhY2FkZSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0TmF0aXZlSW50ZXJmYWNlKFwibW9iaWxlU3lzdGVtRmFjYWRlXCIpXG5cdH1cblxuXHRnZXQgbW9iaWxlQ29udGFjdHNGYWNhZGUoKTogTW9iaWxlQ29udGFjdHNGYWNhZGUge1xuXHRcdHJldHVybiB0aGlzLmdldE5hdGl2ZUludGVyZmFjZShcIm1vYmlsZUNvbnRhY3RzRmFjYWRlXCIpXG5cdH1cblxuXHRnZXQgbmF0aXZlQ3JlZGVudGlhbHNGYWNhZGUoKTogTmF0aXZlQ3JlZGVudGlhbHNGYWNhZGUge1xuXHRcdHJldHVybiB0aGlzLmdldE5hdGl2ZUludGVyZmFjZShcIm5hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlXCIpXG5cdH1cblxuXHRnZXQgbW9iaWxlUGF5bWVudHNGYWNhZGUoKTogTW9iaWxlUGF5bWVudHNGYWNhZGUge1xuXHRcdHJldHVybiB0aGlzLmdldE5hdGl2ZUludGVyZmFjZShcIm1vYmlsZVBheW1lbnRzRmFjYWRlXCIpXG5cdH1cblxuXHRhc3luYyBtYWlsQWRkcmVzc1RhYmxlTW9kZWxGb3JPd25NYWlsYm94KCk6IFByb21pc2U8TWFpbEFkZHJlc3NUYWJsZU1vZGVsPiB7XG5cdFx0Y29uc3QgeyBNYWlsQWRkcmVzc1RhYmxlTW9kZWwgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9zZXR0aW5ncy9tYWlsYWRkcmVzcy9NYWlsQWRkcmVzc1RhYmxlTW9kZWwuanNcIilcblx0XHRjb25zdCBuYW1lQ2hhbmdlciA9IGF3YWl0IHRoaXMub3duTWFpbEFkZHJlc3NOYW1lQ2hhbmdlcigpXG5cdFx0cmV0dXJuIG5ldyBNYWlsQWRkcmVzc1RhYmxlTW9kZWwoXG5cdFx0XHR0aGlzLmVudGl0eUNsaWVudCxcblx0XHRcdHRoaXMuc2VydmljZUV4ZWN1dG9yLFxuXHRcdFx0dGhpcy5tYWlsQWRkcmVzc0ZhY2FkZSxcblx0XHRcdHRoaXMubG9naW5zLFxuXHRcdFx0dGhpcy5ldmVudENvbnRyb2xsZXIsXG5cdFx0XHR0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJHcm91cEluZm8sXG5cdFx0XHRuYW1lQ2hhbmdlcixcblx0XHRcdGF3YWl0IHRoaXMucmVkcmF3KCksXG5cdFx0KVxuXHR9XG5cblx0YXN5bmMgbWFpbEFkZHJlc3NUYWJsZU1vZGVsRm9yQWRtaW4obWFpbEdyb3VwSWQ6IElkLCB1c2VySWQ6IElkLCB1c2VyR3JvdXBJbmZvOiBHcm91cEluZm8pOiBQcm9taXNlPE1haWxBZGRyZXNzVGFibGVNb2RlbD4ge1xuXHRcdGNvbnN0IHsgTWFpbEFkZHJlc3NUYWJsZU1vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vc2V0dGluZ3MvbWFpbGFkZHJlc3MvTWFpbEFkZHJlc3NUYWJsZU1vZGVsLmpzXCIpXG5cdFx0Y29uc3QgbmFtZUNoYW5nZXIgPSBhd2FpdCB0aGlzLmFkbWluTmFtZUNoYW5nZXIobWFpbEdyb3VwSWQsIHVzZXJJZClcblx0XHRyZXR1cm4gbmV3IE1haWxBZGRyZXNzVGFibGVNb2RlbChcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0dGhpcy5zZXJ2aWNlRXhlY3V0b3IsXG5cdFx0XHR0aGlzLm1haWxBZGRyZXNzRmFjYWRlLFxuXHRcdFx0dGhpcy5sb2dpbnMsXG5cdFx0XHR0aGlzLmV2ZW50Q29udHJvbGxlcixcblx0XHRcdHVzZXJHcm91cEluZm8sXG5cdFx0XHRuYW1lQ2hhbmdlcixcblx0XHRcdGF3YWl0IHRoaXMucmVkcmF3KCksXG5cdFx0KVxuXHR9XG5cblx0YXN5bmMgb3duTWFpbEFkZHJlc3NOYW1lQ2hhbmdlcigpOiBQcm9taXNlPE1haWxBZGRyZXNzTmFtZUNoYW5nZXI+IHtcblx0XHRjb25zdCB7IE93bk1haWxBZGRyZXNzTmFtZUNoYW5nZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9zZXR0aW5ncy9tYWlsYWRkcmVzcy9Pd25NYWlsQWRkcmVzc05hbWVDaGFuZ2VyLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBPd25NYWlsQWRkcmVzc05hbWVDaGFuZ2VyKHRoaXMubWFpbGJveE1vZGVsLCB0aGlzLmVudGl0eUNsaWVudClcblx0fVxuXG5cdGFzeW5jIGFkbWluTmFtZUNoYW5nZXIobWFpbEdyb3VwSWQ6IElkLCB1c2VySWQ6IElkKTogUHJvbWlzZTxNYWlsQWRkcmVzc05hbWVDaGFuZ2VyPiB7XG5cdFx0Y29uc3QgeyBBbm90aGVyVXNlck1haWxBZGRyZXNzTmFtZUNoYW5nZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9zZXR0aW5ncy9tYWlsYWRkcmVzcy9Bbm90aGVyVXNlck1haWxBZGRyZXNzTmFtZUNoYW5nZXIuanNcIilcblx0XHRyZXR1cm4gbmV3IEFub3RoZXJVc2VyTWFpbEFkZHJlc3NOYW1lQ2hhbmdlcih0aGlzLm1haWxBZGRyZXNzRmFjYWRlLCBtYWlsR3JvdXBJZCwgdXNlcklkKVxuXHR9XG5cblx0YXN5bmMgZHJhd2VyQXR0cnNGYWN0b3J5KCk6IFByb21pc2U8KCkgPT4gRHJhd2VyTWVudUF0dHJzPiB7XG5cdFx0cmV0dXJuICgpID0+ICh7XG5cdFx0XHRsb2dpbnM6IHRoaXMubG9naW5zLFxuXHRcdFx0bmV3c01vZGVsOiB0aGlzLm5ld3NNb2RlbCxcblx0XHRcdGRlc2t0b3BTeXN0ZW1GYWNhZGU6IHRoaXMuZGVza3RvcFN5c3RlbUZhY2FkZSxcblx0XHR9KVxuXHR9XG5cblx0ZG9tYWluQ29uZmlnUHJvdmlkZXIoKTogRG9tYWluQ29uZmlnUHJvdmlkZXIge1xuXHRcdHJldHVybiBuZXcgRG9tYWluQ29uZmlnUHJvdmlkZXIoKVxuXHR9XG5cblx0YXN5bmMgY3JlZGVudGlhbHNSZW1vdmFsSGFuZGxlcigpOiBQcm9taXNlPENyZWRlbnRpYWxSZW1vdmFsSGFuZGxlcj4ge1xuXHRcdGNvbnN0IHsgTm9vcENyZWRlbnRpYWxSZW1vdmFsSGFuZGxlciwgQXBwc0NyZWRlbnRpYWxSZW1vdmFsSGFuZGxlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2xvZ2luL0NyZWRlbnRpYWxSZW1vdmFsSGFuZGxlci5qc1wiKVxuXHRcdHJldHVybiBpc0Jyb3dzZXIoKVxuXHRcdFx0PyBuZXcgTm9vcENyZWRlbnRpYWxSZW1vdmFsSGFuZGxlcigpXG5cdFx0XHQ6IG5ldyBBcHBzQ3JlZGVudGlhbFJlbW92YWxIYW5kbGVyKHRoaXMucHVzaFNlcnZpY2UsIHRoaXMuY29uZmlnRmFjYWRlLCBhc3luYyAobG9naW4sIHVzZXJJZCkgPT4ge1xuXHRcdFx0XHRcdGlmIChpc0FwcCgpKSB7XG5cdFx0XHRcdFx0XHRhd2FpdCBtYWlsTG9jYXRvci5uYXRpdmVDb250YWN0c1N5bmNNYW5hZ2VyKCkuZGlzYWJsZVN5bmModXNlcklkLCBsb2dpbilcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YXdhaXQgbWFpbExvY2F0b3IuaW5kZXhlckZhY2FkZS5kZWxldGVJbmRleCh1c2VySWQpXG5cdFx0XHRcdFx0aWYgKGlzRGVza3RvcCgpKSB7XG5cdFx0XHRcdFx0XHRhd2FpdCBtYWlsTG9jYXRvci5leHBvcnRGYWNhZGUuY2xlYXJFeHBvcnRTdGF0ZSh1c2VySWQpXG5cdFx0XHRcdFx0fVxuXHRcdFx0ICB9KVxuXHR9XG5cblx0YXN5bmMgbG9naW5WaWV3TW9kZWxGYWN0b3J5KCk6IFByb21pc2U8bGF6eTxMb2dpblZpZXdNb2RlbD4+IHtcblx0XHRjb25zdCB7IExvZ2luVmlld01vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbG9naW4vTG9naW5WaWV3TW9kZWwuanNcIilcblx0XHRjb25zdCBjcmVkZW50aWFsc1JlbW92YWxIYW5kbGVyID0gYXdhaXQgbWFpbExvY2F0b3IuY3JlZGVudGlhbHNSZW1vdmFsSGFuZGxlcigpXG5cdFx0Y29uc3QgeyBNb2JpbGVBcHBMb2NrLCBOb09wQXBwTG9jayB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2xvZ2luL0FwcExvY2suanNcIilcblx0XHRjb25zdCBhcHBMb2NrID0gaXNBcHAoKVxuXHRcdFx0PyBuZXcgTW9iaWxlQXBwTG9jayhhc3NlcnROb3ROdWxsKHRoaXMubmF0aXZlSW50ZXJmYWNlcykubW9iaWxlU3lzdGVtRmFjYWRlLCBhc3NlcnROb3ROdWxsKHRoaXMubmF0aXZlSW50ZXJmYWNlcykubmF0aXZlQ3JlZGVudGlhbHNGYWNhZGUpXG5cdFx0XHQ6IG5ldyBOb09wQXBwTG9jaygpXG5cdFx0cmV0dXJuICgpID0+IHtcblx0XHRcdGNvbnN0IGRvbWFpbkNvbmZpZyA9IGlzQnJvd3NlcigpXG5cdFx0XHRcdD8gbWFpbExvY2F0b3IuZG9tYWluQ29uZmlnUHJvdmlkZXIoKS5nZXREb21haW5Db25maWdGb3JIb3N0bmFtZShsb2NhdGlvbi5ob3N0bmFtZSwgbG9jYXRpb24ucHJvdG9jb2wsIGxvY2F0aW9uLnBvcnQpXG5cdFx0XHRcdDogLy8gaW4gdGhpcyBjYXNlLCB3ZSBrbm93IHRoYXQgd2UgaGF2ZSBhIHN0YXRpY1VybCBzZXQgdGhhdCB3ZSBuZWVkIHRvIHVzZVxuXHRcdFx0XHQgIG1haWxMb2NhdG9yLmRvbWFpbkNvbmZpZ1Byb3ZpZGVyKCkuZ2V0Q3VycmVudERvbWFpbkNvbmZpZygpXG5cblx0XHRcdHJldHVybiBuZXcgTG9naW5WaWV3TW9kZWwoXG5cdFx0XHRcdG1haWxMb2NhdG9yLmxvZ2lucyxcblx0XHRcdFx0bWFpbExvY2F0b3IuY3JlZGVudGlhbHNQcm92aWRlcixcblx0XHRcdFx0bWFpbExvY2F0b3Iuc2Vjb25kRmFjdG9ySGFuZGxlcixcblx0XHRcdFx0ZGV2aWNlQ29uZmlnLFxuXHRcdFx0XHRkb21haW5Db25maWcsXG5cdFx0XHRcdGNyZWRlbnRpYWxzUmVtb3ZhbEhhbmRsZXIsXG5cdFx0XHRcdGlzQnJvd3NlcigpID8gbnVsbCA6IHRoaXMucHVzaFNlcnZpY2UsXG5cdFx0XHRcdGFwcExvY2ssXG5cdFx0XHQpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBnZXROYXRpdmVJbnRlcmZhY2U8VCBleHRlbmRzIGtleW9mIE5hdGl2ZUludGVyZmFjZXM+KG5hbWU6IFQpOiBOYXRpdmVJbnRlcmZhY2VzW1RdIHtcblx0XHRpZiAoIXRoaXMubmF0aXZlSW50ZXJmYWNlcykge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoYFRyaWVkIHRvIHVzZSAke25hbWV9IGluIHdlYmApXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMubmF0aXZlSW50ZXJmYWNlc1tuYW1lXVxuXHR9XG5cblx0cHVibGljIGdldE1haWxJbXBvcnRlcigpOiBNYWlsSW1wb3J0ZXIge1xuXHRcdGlmICh0aGlzLm1haWxJbXBvcnRlciA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihgVHJpZWQgdG8gdXNlIG1haWwgaW1wb3J0ZXIgaW4gd2ViIG9yIG1vYmlsZWApXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMubWFpbEltcG9ydGVyXG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IF93b3JrZXJEZWZlcnJlZDogRGVmZXJyZWRPYmplY3Q8V29ya2VyQ2xpZW50PlxuXHRwcml2YXRlIF9lbnRyb3B5Q29sbGVjdG9yITogRW50cm9weUNvbGxlY3RvclxuXHRwcml2YXRlIF9kZWZlcnJlZEluaXRpYWxpemVkOiBEZWZlcnJlZE9iamVjdDx2b2lkPiA9IGRlZmVyKClcblxuXHRnZXQgaW5pdGlhbGl6ZWQoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMuX2RlZmVycmVkSW5pdGlhbGl6ZWQucHJvbWlzZVxuXHR9XG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5fd29ya2VyRGVmZXJyZWQgPSBkZWZlcigpXG5cdH1cblxuXHRhc3luYyBpbml0KCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdC8vIFNwbGl0IGluaXQgaW4gdHdvIHNlcGFyYXRlIHBhcnRzOiBjcmVhdGluZyBtb2R1bGVzIGFuZCBjYXVzaW5nIHNpZGUgZWZmZWN0cy5cblx0XHQvLyBXZSB3b3VsZCBsaWtlIHRvIGRvIGJvdGggb24gbm9ybWFsIGluaXQgYnV0IG9uIEhNUiB3ZSBqdXN0IHdhbnQgdG8gcmVwbGFjZSBtb2R1bGVzIHdpdGhvdXQgYSBuZXcgd29ya2VyLiBJZiB3ZSBjcmVhdGUgYSBuZXdcblx0XHQvLyB3b3JrZXIgd2UgZW5kIHVwIGxvc2luZyBzdGF0ZSBvbiB0aGUgd29ya2VyIHNpZGUgKGluY2x1ZGluZyBvdXIgc2Vzc2lvbikuXG5cdFx0dGhpcy53b3JrZXIgPSBib290c3RyYXBXb3JrZXIodGhpcylcblx0XHRhd2FpdCB0aGlzLl9jcmVhdGVJbnN0YW5jZXMoKVxuXHRcdHRoaXMuX2VudHJvcHlDb2xsZWN0b3IgPSBuZXcgRW50cm9weUNvbGxlY3Rvcih0aGlzLmVudHJvcHlGYWNhZGUsIGF3YWl0IHRoaXMuc2NoZWR1bGVyKCksIHdpbmRvdylcblxuXHRcdHRoaXMuX2VudHJvcHlDb2xsZWN0b3Iuc3RhcnQoKVxuXG5cdFx0dGhpcy5fZGVmZXJyZWRJbml0aWFsaXplZC5yZXNvbHZlKClcblx0fVxuXG5cdGFzeW5jIF9jcmVhdGVJbnN0YW5jZXMoKSB7XG5cdFx0Y29uc3Qge1xuXHRcdFx0bG9naW5GYWNhZGUsXG5cdFx0XHRjdXN0b21lckZhY2FkZSxcblx0XHRcdGdpZnRDYXJkRmFjYWRlLFxuXHRcdFx0Z3JvdXBNYW5hZ2VtZW50RmFjYWRlLFxuXHRcdFx0Y29uZmlnRmFjYWRlLFxuXHRcdFx0Y2FsZW5kYXJGYWNhZGUsXG5cdFx0XHRtYWlsRmFjYWRlLFxuXHRcdFx0c2hhcmVGYWNhZGUsXG5cdFx0XHRjb3VudGVyRmFjYWRlLFxuXHRcdFx0aW5kZXhlckZhY2FkZSxcblx0XHRcdHNlYXJjaEZhY2FkZSxcblx0XHRcdGJvb2tpbmdGYWNhZGUsXG5cdFx0XHRtYWlsQWRkcmVzc0ZhY2FkZSxcblx0XHRcdGJsb2JGYWNhZGUsXG5cdFx0XHR1c2VyTWFuYWdlbWVudEZhY2FkZSxcblx0XHRcdHJlY292ZXJDb2RlRmFjYWRlLFxuXHRcdFx0cmVzdEludGVyZmFjZSxcblx0XHRcdHNlcnZpY2VFeGVjdXRvcixcblx0XHRcdGNyeXB0b0ZhY2FkZSxcblx0XHRcdGNhY2hlU3RvcmFnZSxcblx0XHRcdHJhbmRvbSxcblx0XHRcdGV2ZW50QnVzLFxuXHRcdFx0ZW50cm9weUZhY2FkZSxcblx0XHRcdHdvcmtlckZhY2FkZSxcblx0XHRcdHNxbENpcGhlckZhY2FkZSxcblx0XHRcdGNvbnRhY3RGYWNhZGUsXG5cdFx0XHRidWxrTWFpbExvYWRlcixcblx0XHRcdG1haWxFeHBvcnRGYWNhZGUsXG5cdFx0fSA9IHRoaXMud29ya2VyLmdldFdvcmtlckludGVyZmFjZSgpIGFzIFdvcmtlckludGVyZmFjZVxuXHRcdHRoaXMubG9naW5GYWNhZGUgPSBsb2dpbkZhY2FkZVxuXHRcdHRoaXMuY3VzdG9tZXJGYWNhZGUgPSBjdXN0b21lckZhY2FkZVxuXHRcdHRoaXMuZ2lmdENhcmRGYWNhZGUgPSBnaWZ0Q2FyZEZhY2FkZVxuXHRcdHRoaXMuZ3JvdXBNYW5hZ2VtZW50RmFjYWRlID0gZ3JvdXBNYW5hZ2VtZW50RmFjYWRlXG5cdFx0dGhpcy5jb25maWdGYWNhZGUgPSBjb25maWdGYWNhZGVcblx0XHR0aGlzLmNhbGVuZGFyRmFjYWRlID0gY2FsZW5kYXJGYWNhZGVcblx0XHR0aGlzLm1haWxGYWNhZGUgPSBtYWlsRmFjYWRlXG5cdFx0dGhpcy5zaGFyZUZhY2FkZSA9IHNoYXJlRmFjYWRlXG5cdFx0dGhpcy5jb3VudGVyRmFjYWRlID0gY291bnRlckZhY2FkZVxuXHRcdHRoaXMuaW5kZXhlckZhY2FkZSA9IGluZGV4ZXJGYWNhZGVcblx0XHR0aGlzLnNlYXJjaEZhY2FkZSA9IHNlYXJjaEZhY2FkZVxuXHRcdHRoaXMuYm9va2luZ0ZhY2FkZSA9IGJvb2tpbmdGYWNhZGVcblx0XHR0aGlzLm1haWxBZGRyZXNzRmFjYWRlID0gbWFpbEFkZHJlc3NGYWNhZGVcblx0XHR0aGlzLmJsb2JGYWNhZGUgPSBibG9iRmFjYWRlXG5cdFx0dGhpcy51c2VyTWFuYWdlbWVudEZhY2FkZSA9IHVzZXJNYW5hZ2VtZW50RmFjYWRlXG5cdFx0dGhpcy5yZWNvdmVyQ29kZUZhY2FkZSA9IHJlY292ZXJDb2RlRmFjYWRlXG5cdFx0dGhpcy5jb250YWN0RmFjYWRlID0gY29udGFjdEZhY2FkZVxuXHRcdHRoaXMuc2VydmljZUV4ZWN1dG9yID0gc2VydmljZUV4ZWN1dG9yXG5cdFx0dGhpcy5zcWxDaXBoZXJGYWNhZGUgPSBzcWxDaXBoZXJGYWNhZGVcblx0XHR0aGlzLmxvZ2lucyA9IG5ldyBMb2dpbkNvbnRyb2xsZXIoXG5cdFx0XHR0aGlzLmxvZ2luRmFjYWRlLFxuXHRcdFx0YXN5bmMgKCkgPT4gdGhpcy5sb2dpbkxpc3RlbmVyLFxuXHRcdFx0KCkgPT4gdGhpcy53b3JrZXIucmVzZXQoKSxcblx0XHQpXG5cdFx0Ly8gU2hvdWxkIGJlIGNhbGxlZCBlbHNld2hlcmUgbGF0ZXIgZS5nLiBpbiBDb21tb25Mb2NhdG9yXG5cdFx0dGhpcy5sb2dpbnMuaW5pdCgpXG5cdFx0dGhpcy5ldmVudENvbnRyb2xsZXIgPSBuZXcgRXZlbnRDb250cm9sbGVyKG1haWxMb2NhdG9yLmxvZ2lucylcblx0XHR0aGlzLnByb2dyZXNzVHJhY2tlciA9IG5ldyBQcm9ncmVzc1RyYWNrZXIoKVxuXHRcdHRoaXMuc2VhcmNoID0gbmV3IFNlYXJjaE1vZGVsKHRoaXMuc2VhcmNoRmFjYWRlLCAoKSA9PiB0aGlzLmNhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeSgpKVxuXHRcdHRoaXMuZW50aXR5Q2xpZW50ID0gbmV3IEVudGl0eUNsaWVudChyZXN0SW50ZXJmYWNlKVxuXHRcdHRoaXMuY3J5cHRvRmFjYWRlID0gY3J5cHRvRmFjYWRlXG5cdFx0dGhpcy5jYWNoZVN0b3JhZ2UgPSBjYWNoZVN0b3JhZ2Vcblx0XHR0aGlzLmVudHJvcHlGYWNhZGUgPSBlbnRyb3B5RmFjYWRlXG5cdFx0dGhpcy53b3JrZXJGYWNhZGUgPSB3b3JrZXJGYWNhZGVcblx0XHR0aGlzLmJ1bGtNYWlsTG9hZGVyID0gYnVsa01haWxMb2FkZXJcblx0XHR0aGlzLm1haWxFeHBvcnRGYWNhZGUgPSBtYWlsRXhwb3J0RmFjYWRlXG5cdFx0dGhpcy5jb25uZWN0aXZpdHlNb2RlbCA9IG5ldyBXZWJzb2NrZXRDb25uZWN0aXZpdHlNb2RlbChldmVudEJ1cylcblx0XHR0aGlzLm1haWxib3hNb2RlbCA9IG5ldyBNYWlsYm94TW9kZWwodGhpcy5ldmVudENvbnRyb2xsZXIsIHRoaXMuZW50aXR5Q2xpZW50LCB0aGlzLmxvZ2lucylcblx0XHR0aGlzLm1haWxNb2RlbCA9IG5ldyBNYWlsTW9kZWwoXG5cdFx0XHRub3RpZmljYXRpb25zLFxuXHRcdFx0dGhpcy5tYWlsYm94TW9kZWwsXG5cdFx0XHR0aGlzLmV2ZW50Q29udHJvbGxlcixcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0dGhpcy5sb2dpbnMsXG5cdFx0XHR0aGlzLm1haWxGYWNhZGUsXG5cdFx0XHR0aGlzLmNvbm5lY3Rpdml0eU1vZGVsLFxuXHRcdFx0dGhpcy5pbmJveFJ1bGVIYW5sZGVyKCksXG5cdFx0KVxuXHRcdHRoaXMub3BlcmF0aW9uUHJvZ3Jlc3NUcmFja2VyID0gbmV3IE9wZXJhdGlvblByb2dyZXNzVHJhY2tlcigpXG5cdFx0dGhpcy5pbmZvTWVzc2FnZUhhbmRsZXIgPSBuZXcgSW5mb01lc3NhZ2VIYW5kbGVyKChzdGF0ZTogU2VhcmNoSW5kZXhTdGF0ZUluZm8pID0+IHtcblx0XHRcdG1haWxMb2NhdG9yLnNlYXJjaC5pbmRleFN0YXRlKHN0YXRlKVxuXHRcdH0pXG5cblx0XHR0aGlzLnVzYWdlVGVzdE1vZGVsID0gbmV3IFVzYWdlVGVzdE1vZGVsKFxuXHRcdFx0e1xuXHRcdFx0XHRbU3RvcmFnZUJlaGF2aW9yLlBlcnNpc3RdOiBkZXZpY2VDb25maWcsXG5cdFx0XHRcdFtTdG9yYWdlQmVoYXZpb3IuRXBoZW1lcmFsXTogbmV3IEVwaGVtZXJhbFVzYWdlVGVzdFN0b3JhZ2UoKSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdG5vdygpOiBudW1iZXIge1xuXHRcdFx0XHRcdHJldHVybiBEYXRlLm5vdygpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRpbWVab25lKCk6IHN0cmluZyB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkIGJ5IHRoaXMgcHJvdmlkZXJcIilcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR0aGlzLnNlcnZpY2VFeGVjdXRvcixcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0dGhpcy5sb2dpbnMsXG5cdFx0XHR0aGlzLmV2ZW50Q29udHJvbGxlcixcblx0XHRcdCgpID0+IHRoaXMudXNhZ2VUZXN0Q29udHJvbGxlcixcblx0XHQpXG5cdFx0dGhpcy51c2FnZVRlc3RDb250cm9sbGVyID0gbmV3IFVzYWdlVGVzdENvbnRyb2xsZXIodGhpcy51c2FnZVRlc3RNb2RlbClcblxuXHRcdHRoaXMuQ29uc3QgPSBDb25zdFxuXHRcdGlmICghaXNCcm93c2VyKCkpIHtcblx0XHRcdGNvbnN0IHsgV2ViRGVza3RvcEZhY2FkZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL25hdGl2ZS9tYWluL1dlYkRlc2t0b3BGYWNhZGVcIilcblx0XHRcdGNvbnN0IHsgV2ViTW9iaWxlRmFjYWRlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL21haW4vV2ViTW9iaWxlRmFjYWRlLmpzXCIpXG5cdFx0XHRjb25zdCB7IFdlYkNvbW1vbk5hdGl2ZUZhY2FkZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL25hdGl2ZS9tYWluL1dlYkNvbW1vbk5hdGl2ZUZhY2FkZS5qc1wiKVxuXHRcdFx0Y29uc3QgeyBXZWJJbnRlcldpbmRvd0V2ZW50RmFjYWRlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL21haW4vV2ViSW50ZXJXaW5kb3dFdmVudEZhY2FkZS5qc1wiKVxuXHRcdFx0Y29uc3QgeyBXZWJBdXRobkZhY2FkZVNlbmREaXNwYXRjaGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvV2ViQXV0aG5GYWNhZGVTZW5kRGlzcGF0Y2hlci5qc1wiKVxuXHRcdFx0Y29uc3QgeyBPcGVuTWFpbGJveEhhbmRsZXIgfSA9IGF3YWl0IGltcG9ydChcIi4vbmF0aXZlL21haW4vT3Blbk1haWxib3hIYW5kbGVyLmpzXCIpXG5cdFx0XHRjb25zdCB7IGNyZWF0ZU5hdGl2ZUludGVyZmFjZXMsIGNyZWF0ZURlc2t0b3BJbnRlcmZhY2VzIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL21haW4vTmF0aXZlSW50ZXJmYWNlRmFjdG9yeS5qc1wiKVxuXHRcdFx0Y29uc3Qgb3Blbk1haWxib3hIYW5kbGVyID0gbmV3IE9wZW5NYWlsYm94SGFuZGxlcih0aGlzLmxvZ2lucywgdGhpcy5tYWlsTW9kZWwsIHRoaXMubWFpbGJveE1vZGVsKVxuXHRcdFx0Y29uc3QgeyBPcGVuQ2FsZW5kYXJIYW5kbGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL21haW4vT3BlbkNhbGVuZGFySGFuZGxlci5qc1wiKVxuXHRcdFx0Y29uc3Qgb3BlbkNhbGVuZGFySGFuZGxlciA9IG5ldyBPcGVuQ2FsZW5kYXJIYW5kbGVyKHRoaXMubG9naW5zKVxuXHRcdFx0Y29uc3QgeyBPcGVuU2V0dGluZ3NIYW5kbGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL21haW4vT3BlblNldHRpbmdzSGFuZGxlci5qc1wiKVxuXHRcdFx0Y29uc3Qgb3BlblNldHRpbmdzSGFuZGxlciA9IG5ldyBPcGVuU2V0dGluZ3NIYW5kbGVyKHRoaXMubG9naW5zKVxuXG5cdFx0XHR0aGlzLndlYk1vYmlsZUZhY2FkZSA9IG5ldyBXZWJNb2JpbGVGYWNhZGUodGhpcy5jb25uZWN0aXZpdHlNb2RlbCwgTUFJTF9QUkVGSVgpXG5cblx0XHRcdHRoaXMubmF0aXZlSW50ZXJmYWNlcyA9IGNyZWF0ZU5hdGl2ZUludGVyZmFjZXMoXG5cdFx0XHRcdHRoaXMud2ViTW9iaWxlRmFjYWRlLFxuXHRcdFx0XHRuZXcgV2ViRGVza3RvcEZhY2FkZSh0aGlzLmxvZ2lucywgYXN5bmMgKCkgPT4gdGhpcy5uYXRpdmUpLFxuXHRcdFx0XHRuZXcgV2ViSW50ZXJXaW5kb3dFdmVudEZhY2FkZSh0aGlzLmxvZ2lucywgd2luZG93RmFjYWRlLCBkZXZpY2VDb25maWcpLFxuXHRcdFx0XHRuZXcgV2ViQ29tbW9uTmF0aXZlRmFjYWRlKFxuXHRcdFx0XHRcdHRoaXMubG9naW5zLFxuXHRcdFx0XHRcdHRoaXMubWFpbGJveE1vZGVsLFxuXHRcdFx0XHRcdHRoaXMudXNhZ2VUZXN0Q29udHJvbGxlcixcblx0XHRcdFx0XHRhc3luYyAoKSA9PiB0aGlzLmZpbGVBcHAsXG5cdFx0XHRcdFx0YXN5bmMgKCkgPT4gdGhpcy5wdXNoU2VydmljZSxcblx0XHRcdFx0XHR0aGlzLmhhbmRsZUZpbGVJbXBvcnQuYmluZCh0aGlzKSxcblx0XHRcdFx0XHQodXNlcklkLCBhZGRyZXNzLCByZXF1ZXN0ZWRQYXRoKSA9PiBvcGVuTWFpbGJveEhhbmRsZXIub3Blbk1haWxib3godXNlcklkLCBhZGRyZXNzLCByZXF1ZXN0ZWRQYXRoKSxcblx0XHRcdFx0XHQodXNlcklkKSA9PiBvcGVuQ2FsZW5kYXJIYW5kbGVyLm9wZW5DYWxlbmRhcih1c2VySWQpLFxuXHRcdFx0XHRcdEFwcFR5cGUuSW50ZWdyYXRlZCxcblx0XHRcdFx0XHQocGF0aCkgPT4gb3BlblNldHRpbmdzSGFuZGxlci5vcGVuU2V0dGluZ3MocGF0aCksXG5cdFx0XHRcdCksXG5cdFx0XHRcdGNyeXB0b0ZhY2FkZSxcblx0XHRcdFx0Y2FsZW5kYXJGYWNhZGUsXG5cdFx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0XHR0aGlzLmxvZ2lucyxcblx0XHRcdFx0QXBwVHlwZS5JbnRlZ3JhdGVkLFxuXHRcdFx0KVxuXG5cdFx0XHR0aGlzLmNyZWRlbnRpYWxzUHJvdmlkZXIgPSBhd2FpdCB0aGlzLmNyZWF0ZUNyZWRlbnRpYWxzUHJvdmlkZXIoKVxuXHRcdFx0aWYgKGlzRWxlY3Ryb25DbGllbnQoKSkge1xuXHRcdFx0XHRjb25zdCBkZXNrdG9wSW50ZXJmYWNlcyA9IGNyZWF0ZURlc2t0b3BJbnRlcmZhY2VzKHRoaXMubmF0aXZlKVxuXHRcdFx0XHR0aGlzLnNlYXJjaFRleHRGYWNhZGUgPSBkZXNrdG9wSW50ZXJmYWNlcy5zZWFyY2hUZXh0RmFjYWRlXG5cdFx0XHRcdHRoaXMuaW50ZXJXaW5kb3dFdmVudFNlbmRlciA9IGRlc2t0b3BJbnRlcmZhY2VzLmludGVyV2luZG93RXZlbnRTZW5kZXJcblx0XHRcdFx0dGhpcy53ZWJBdXRobiA9IG5ldyBXZWJhdXRobkNsaWVudChuZXcgV2ViQXV0aG5GYWNhZGVTZW5kRGlzcGF0Y2hlcih0aGlzLm5hdGl2ZSksIHRoaXMuZG9tYWluQ29uZmlnUHJvdmlkZXIoKSwgaXNBcHAoKSlcblx0XHRcdFx0aWYgKGlzRGVza3RvcCgpKSB7XG5cdFx0XHRcdFx0dGhpcy5kZXNrdG9wU2V0dGluZ3NGYWNhZGUgPSBkZXNrdG9wSW50ZXJmYWNlcy5kZXNrdG9wU2V0dGluZ3NGYWNhZGVcblx0XHRcdFx0XHR0aGlzLmRlc2t0b3BTeXN0ZW1GYWNhZGUgPSBkZXNrdG9wSW50ZXJmYWNlcy5kZXNrdG9wU3lzdGVtRmFjYWRlXG5cdFx0XHRcdFx0dGhpcy5tYWlsSW1wb3J0ZXIgPSBuZXcgTWFpbEltcG9ydGVyKFxuXHRcdFx0XHRcdFx0dGhpcy5kb21haW5Db25maWdQcm92aWRlcigpLFxuXHRcdFx0XHRcdFx0dGhpcy5sb2dpbnMsXG5cdFx0XHRcdFx0XHR0aGlzLm1haWxib3hNb2RlbCxcblx0XHRcdFx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0XHRcdFx0dGhpcy5ldmVudENvbnRyb2xsZXIsXG5cdFx0XHRcdFx0XHR0aGlzLmNyZWRlbnRpYWxzUHJvdmlkZXIsXG5cdFx0XHRcdFx0XHRkZXNrdG9wSW50ZXJmYWNlcy5uYXRpdmVNYWlsSW1wb3J0RmFjYWRlLFxuXHRcdFx0XHRcdFx0b3BlblNldHRpbmdzSGFuZGxlcixcblx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0dGhpcy5leHBvcnRGYWNhZGUgPSBkZXNrdG9wSW50ZXJmYWNlcy5leHBvcnRGYWNhZGVcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChpc0FuZHJvaWRBcHAoKSB8fCBpc0lPU0FwcCgpKSB7XG5cdFx0XHRcdGNvbnN0IHsgU3lzdGVtUGVybWlzc2lvbkhhbmRsZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9uYXRpdmUvbWFpbi9TeXN0ZW1QZXJtaXNzaW9uSGFuZGxlci5qc1wiKVxuXHRcdFx0XHR0aGlzLnN5c3RlbVBlcm1pc3Npb25IYW5kbGVyID0gbmV3IFN5c3RlbVBlcm1pc3Npb25IYW5kbGVyKHRoaXMuc3lzdGVtRmFjYWRlKVxuXHRcdFx0XHR0aGlzLndlYkF1dGhuID0gbmV3IFdlYmF1dGhuQ2xpZW50KG5ldyBXZWJBdXRobkZhY2FkZVNlbmREaXNwYXRjaGVyKHRoaXMubmF0aXZlKSwgdGhpcy5kb21haW5Db25maWdQcm92aWRlcigpLCBpc0FwcCgpKVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmNyZWRlbnRpYWxzUHJvdmlkZXIgPSBhd2FpdCB0aGlzLmNyZWF0ZUNyZWRlbnRpYWxzUHJvdmlkZXIoKVxuXHRcdH1cblxuXHRcdGlmICh0aGlzLndlYkF1dGhuID09IG51bGwpIHtcblx0XHRcdHRoaXMud2ViQXV0aG4gPSBuZXcgV2ViYXV0aG5DbGllbnQoXG5cdFx0XHRcdG5ldyBCcm93c2VyV2ViYXV0aG4obmF2aWdhdG9yLmNyZWRlbnRpYWxzLCB0aGlzLmRvbWFpbkNvbmZpZ1Byb3ZpZGVyKCkuZ2V0Q3VycmVudERvbWFpbkNvbmZpZygpKSxcblx0XHRcdFx0dGhpcy5kb21haW5Db25maWdQcm92aWRlcigpLFxuXHRcdFx0XHRpc0FwcCgpLFxuXHRcdFx0KVxuXHRcdH1cblx0XHR0aGlzLnNlY29uZEZhY3RvckhhbmRsZXIgPSBuZXcgU2Vjb25kRmFjdG9ySGFuZGxlcihcblx0XHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLFxuXHRcdFx0dGhpcy5lbnRpdHlDbGllbnQsXG5cdFx0XHR0aGlzLndlYkF1dGhuLFxuXHRcdFx0dGhpcy5sb2dpbkZhY2FkZSxcblx0XHRcdHRoaXMuZG9tYWluQ29uZmlnUHJvdmlkZXIoKSxcblx0XHQpXG5cblx0XHR0aGlzLmxvZ2luTGlzdGVuZXIgPSBuZXcgUGFnZUNvbnRleHRMb2dpbkxpc3RlbmVyKHRoaXMuc2Vjb25kRmFjdG9ySGFuZGxlciwgdGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyKVxuXHRcdHRoaXMucmFuZG9tID0gcmFuZG9tXG5cblx0XHR0aGlzLm5ld3NNb2RlbCA9IG5ldyBOZXdzTW9kZWwodGhpcy5zZXJ2aWNlRXhlY3V0b3IsIGRldmljZUNvbmZpZywgYXN5bmMgKG5hbWU6IHN0cmluZykgPT4ge1xuXHRcdFx0c3dpdGNoIChuYW1lKSB7XG5cdFx0XHRcdGNhc2UgXCJ1c2FnZU9wdEluXCI6IHtcblx0XHRcdFx0XHRjb25zdCB7IFVzYWdlT3B0SW5OZXdzIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbWlzYy9uZXdzL2l0ZW1zL1VzYWdlT3B0SW5OZXdzLmpzXCIpXG5cdFx0XHRcdFx0cmV0dXJuIG5ldyBVc2FnZU9wdEluTmV3cyh0aGlzLm5ld3NNb2RlbCwgdGhpcy51c2FnZVRlc3RNb2RlbClcblx0XHRcdFx0fVxuXHRcdFx0XHRjYXNlIFwicmVjb3ZlcnlDb2RlXCI6IHtcblx0XHRcdFx0XHRjb25zdCB7IFJlY292ZXJ5Q29kZU5ld3MgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9taXNjL25ld3MvaXRlbXMvUmVjb3ZlcnlDb2RlTmV3cy5qc1wiKVxuXHRcdFx0XHRcdHJldHVybiBuZXcgUmVjb3ZlcnlDb2RlTmV3cyh0aGlzLm5ld3NNb2RlbCwgdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKSwgdGhpcy5yZWNvdmVyQ29kZUZhY2FkZSlcblx0XHRcdFx0fVxuXHRcdFx0XHRjYXNlIFwicGluQmlvbWV0cmljc1wiOiB7XG5cdFx0XHRcdFx0Y29uc3QgeyBQaW5CaW9tZXRyaWNzTmV3cyB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL21pc2MvbmV3cy9pdGVtcy9QaW5CaW9tZXRyaWNzTmV3cy5qc1wiKVxuXHRcdFx0XHRcdHJldHVybiBuZXcgUGluQmlvbWV0cmljc05ld3ModGhpcy5uZXdzTW9kZWwsIHRoaXMuY3JlZGVudGlhbHNQcm92aWRlciwgdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VySWQpXG5cdFx0XHRcdH1cblx0XHRcdFx0Y2FzZSBcInJlZmVycmFsTGlua1wiOiB7XG5cdFx0XHRcdFx0Y29uc3QgeyBSZWZlcnJhbExpbmtOZXdzIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbWlzYy9uZXdzL2l0ZW1zL1JlZmVycmFsTGlua05ld3MuanNcIilcblx0XHRcdFx0XHRjb25zdCBkYXRlUHJvdmlkZXIgPSBhd2FpdCB0aGlzLm5vWm9uZURhdGVQcm92aWRlcigpXG5cdFx0XHRcdFx0cmV0dXJuIG5ldyBSZWZlcnJhbExpbmtOZXdzKHRoaXMubmV3c01vZGVsLCBkYXRlUHJvdmlkZXIsIHRoaXMubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkpXG5cdFx0XHRcdH1cblx0XHRcdFx0Y2FzZSBcInJpY2hOb3RpZmljYXRpb25zXCI6IHtcblx0XHRcdFx0XHRjb25zdCB7IFJpY2hOb3RpZmljYXRpb25zTmV3cyB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL21pc2MvbmV3cy9pdGVtcy9SaWNoTm90aWZpY2F0aW9uc05ld3MuanNcIilcblx0XHRcdFx0XHRyZXR1cm4gbmV3IFJpY2hOb3RpZmljYXRpb25zTmV3cyh0aGlzLm5ld3NNb2RlbCwgaXNBcHAoKSB8fCBpc0Rlc2t0b3AoKSA/IHRoaXMucHVzaFNlcnZpY2UgOiBudWxsKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYE5vIGltcGxlbWVudGF0aW9uIGZvciBuZXdzIG5hbWVkICcke25hbWV9J2ApXG5cdFx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdH1cblx0XHR9KVxuXG5cdFx0dGhpcy5maWxlQ29udHJvbGxlciA9XG5cdFx0XHR0aGlzLm5hdGl2ZUludGVyZmFjZXMgPT0gbnVsbFxuXHRcdFx0XHQ/IG5ldyBGaWxlQ29udHJvbGxlckJyb3dzZXIoYmxvYkZhY2FkZSwgZ3VpRG93bmxvYWQpXG5cdFx0XHRcdDogbmV3IEZpbGVDb250cm9sbGVyTmF0aXZlKGJsb2JGYWNhZGUsIGd1aURvd25sb2FkLCB0aGlzLm5hdGl2ZUludGVyZmFjZXMuZmlsZUFwcClcblxuXHRcdGNvbnN0IHsgQ29udGFjdE1vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vY29udGFjdHNGdW5jdGlvbmFsaXR5L0NvbnRhY3RNb2RlbC5qc1wiKVxuXHRcdHRoaXMuY29udGFjdE1vZGVsID0gbmV3IENvbnRhY3RNb2RlbChcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0dGhpcy5sb2dpbnMsXG5cdFx0XHR0aGlzLmV2ZW50Q29udHJvbGxlcixcblx0XHRcdGFzeW5jIChxdWVyeTogc3RyaW5nLCBmaWVsZDogc3RyaW5nLCBtaW5TdWdnZXN0aW9uQ291bnQ6IG51bWJlciwgbWF4UmVzdWx0cz86IG51bWJlcikgPT4ge1xuXHRcdFx0XHRjb25zdCB7IGNyZWF0ZVJlc3RyaWN0aW9uIH0gPSBhd2FpdCBpbXBvcnQoXCIuL3NlYXJjaC9tb2RlbC9TZWFyY2hVdGlscy5qc1wiKVxuXHRcdFx0XHRyZXR1cm4gbWFpbExvY2F0b3Iuc2VhcmNoRmFjYWRlLnNlYXJjaChcblx0XHRcdFx0XHRxdWVyeSxcblx0XHRcdFx0XHRjcmVhdGVSZXN0cmljdGlvbihTZWFyY2hDYXRlZ29yeVR5cGVzLmNvbnRhY3QsIG51bGwsIG51bGwsIGZpZWxkLCBbXSwgbnVsbCksXG5cdFx0XHRcdFx0bWluU3VnZ2VzdGlvbkNvdW50LFxuXHRcdFx0XHRcdG1heFJlc3VsdHMsXG5cdFx0XHRcdClcblx0XHRcdH0sXG5cdFx0KVxuXHRcdHRoaXMubWluaW1pemVkTWFpbE1vZGVsID0gbmV3IE1pbmltaXplZE1haWxFZGl0b3JWaWV3TW9kZWwoKVxuXG5cdFx0Ly8gVEhFTUVcblx0XHQvLyBXZSBuZWVkIGl0IGJlY2F1c2Ugd2Ugd2FudCB0byBydW4gdGVzdHMgaW4gbm9kZSBhbmQgcmVhbCBIVE1MU2FuaXRpemVyIGRvZXMgbm90IHdvcmsgdGhlcmUuXG5cdFx0Y29uc3Qgc2FuaXRpemVyU3R1YjogUGFydGlhbDxIdG1sU2FuaXRpemVyPiA9IHtcblx0XHRcdHNhbml0aXplSFRNTDogKCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGh0bWw6IFwiXCIsXG5cdFx0XHRcdFx0YmxvY2tlZEV4dGVybmFsQ29udGVudDogMCxcblx0XHRcdFx0XHRpbmxpbmVJbWFnZUNpZHM6IFtdLFxuXHRcdFx0XHRcdGxpbmtzOiBbXSxcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHNhbml0aXplU1ZHKHN2ZywgY29uZmlnRXh0cmE/KSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcInN0dWIhXCIpXG5cdFx0XHR9LFxuXHRcdFx0c2FuaXRpemVGcmFnbWVudChodG1sLCBjb25maWdFeHRyYT8pIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwic3R1YiFcIilcblx0XHRcdH0sXG5cdFx0fVxuXHRcdGNvbnN0IHNlbGVjdGVkVGhlbWVGYWNhZGUgPVxuXHRcdFx0aXNBcHAoKSB8fCBpc0Rlc2t0b3AoKSA/IG5ldyBOYXRpdmVUaGVtZUZhY2FkZShuZXcgTGF6eUxvYWRlZDxUaGVtZUZhY2FkZT4oYXN5bmMgKCkgPT4gbWFpbExvY2F0b3IudGhlbWVGYWNhZGUpKSA6IG5ldyBXZWJUaGVtZUZhY2FkZShkZXZpY2VDb25maWcpXG5cdFx0Y29uc3QgbGF6eVNhbml0aXplciA9IGlzVGVzdCgpXG5cdFx0XHQ/ICgpID0+IFByb21pc2UucmVzb2x2ZShzYW5pdGl6ZXJTdHViIGFzIEh0bWxTYW5pdGl6ZXIpXG5cdFx0XHQ6ICgpID0+IGltcG9ydChcIi4uL2NvbW1vbi9taXNjL0h0bWxTYW5pdGl6ZXJcIikudGhlbigoeyBodG1sU2FuaXRpemVyIH0pID0+IGh0bWxTYW5pdGl6ZXIpXG5cblx0XHR0aGlzLnRoZW1lQ29udHJvbGxlciA9IG5ldyBUaGVtZUNvbnRyb2xsZXIodGhlbWUsIHNlbGVjdGVkVGhlbWVGYWNhZGUsIGxhenlTYW5pdGl6ZXIsIEFwcFR5cGUuTWFpbClcblxuXHRcdC8vIEZvciBuYXRpdmUgdGFyZ2V0cyBXZWJDb21tb25OYXRpdmVGYWNhZGUgbm90aWZpZXMgdGhlbWVDb250cm9sbGVyIGJlY2F1c2UgQW5kcm9pZCBhbmQgRGVza3RvcCBkbyBub3Qgc2VlbSB0byB3b3JrIHJlbGlhYmx5IHZpYSBtZWRpYSBxdWVyaWVzXG5cdFx0aWYgKHNlbGVjdGVkVGhlbWVGYWNhZGUgaW5zdGFuY2VvZiBXZWJUaGVtZUZhY2FkZSkge1xuXHRcdFx0c2VsZWN0ZWRUaGVtZUZhY2FkZS5hZGREYXJrTGlzdGVuZXIoKCkgPT4gbWFpbExvY2F0b3IudGhlbWVDb250cm9sbGVyLnJlbG9hZFRoZW1lKCkpXG5cdFx0fVxuXHR9XG5cblx0cmVhZG9ubHkgY2FsZW5kYXJNb2RlbDogKCkgPT4gUHJvbWlzZTxDYWxlbmRhck1vZGVsPiA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBEZWZhdWx0RGF0ZVByb3ZpZGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhclV0aWxzXCIpXG5cdFx0Y29uc3QgeyBDYWxlbmRhck1vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jYWxlbmRhci1hcHAvY2FsZW5kYXIvbW9kZWwvQ2FsZW5kYXJNb2RlbFwiKVxuXHRcdGNvbnN0IHRpbWVab25lID0gbmV3IERlZmF1bHREYXRlUHJvdmlkZXIoKS50aW1lWm9uZSgpXG5cdFx0cmV0dXJuIG5ldyBDYWxlbmRhck1vZGVsKFxuXHRcdFx0bm90aWZpY2F0aW9ucyxcblx0XHRcdHRoaXMuYWxhcm1TY2hlZHVsZXIsXG5cdFx0XHR0aGlzLmV2ZW50Q29udHJvbGxlcixcblx0XHRcdHRoaXMuc2VydmljZUV4ZWN1dG9yLFxuXHRcdFx0dGhpcy5sb2dpbnMsXG5cdFx0XHR0aGlzLnByb2dyZXNzVHJhY2tlcixcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0dGhpcy5tYWlsYm94TW9kZWwsXG5cdFx0XHR0aGlzLmNhbGVuZGFyRmFjYWRlLFxuXHRcdFx0dGhpcy5maWxlQ29udHJvbGxlcixcblx0XHRcdHRpbWVab25lLFxuXHRcdFx0IWlzQnJvd3NlcigpID8gdGhpcy5leHRlcm5hbENhbGVuZGFyRmFjYWRlIDogbnVsbCxcblx0XHRcdGRldmljZUNvbmZpZyxcblx0XHRcdCFpc0Jyb3dzZXIoKSA/IHRoaXMucHVzaFNlcnZpY2UgOiBudWxsLFxuXHRcdClcblx0fSlcblxuXHRyZWFkb25seSBjYWxlbmRhckludml0ZUhhbmRsZXI6ICgpID0+IFByb21pc2U8Q2FsZW5kYXJJbnZpdGVIYW5kbGVyPiA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBDYWxlbmRhckludml0ZUhhbmRsZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci92aWV3L0NhbGVuZGFySW52aXRlcy5qc1wiKVxuXHRcdGNvbnN0IHsgY2FsZW5kYXJOb3RpZmljYXRpb25TZW5kZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci92aWV3L0NhbGVuZGFyTm90aWZpY2F0aW9uU2VuZGVyLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBDYWxlbmRhckludml0ZUhhbmRsZXIodGhpcy5tYWlsYm94TW9kZWwsIGF3YWl0IHRoaXMuY2FsZW5kYXJNb2RlbCgpLCB0aGlzLmxvZ2lucywgY2FsZW5kYXJOb3RpZmljYXRpb25TZW5kZXIsICguLi5hcmcpID0+XG5cdFx0XHR0aGlzLnNlbmRNYWlsTW9kZWwoLi4uYXJnKSxcblx0XHQpXG5cdH0pXG5cblx0cHJpdmF0ZSBhc3luYyBoYW5kbGVGaWxlSW1wb3J0KGZpbGVzVXJpczogUmVhZG9ubHlBcnJheTxzdHJpbmc+KSB7XG5cdFx0Y29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLmZpbGVBcHAuZ2V0RmlsZXNNZXRhRGF0YShmaWxlc1VyaXMpXG5cdFx0Y29uc3QgYXJlQWxsRmlsZXNWQ2FyZCA9IGZpbGVzLmV2ZXJ5KChmaWxlKSA9PiBmaWxlLm1pbWVUeXBlID09PSBWQ0FSRF9NSU1FX1RZUEVTLlhfVkNBUkQgfHwgZmlsZS5taW1lVHlwZSA9PT0gVkNBUkRfTUlNRV9UWVBFUy5WQ0FSRClcblx0XHRjb25zdCBhcmVBbGxGaWxlc0lDUyA9IGZpbGVzLmV2ZXJ5KChmaWxlKSA9PiBmaWxlLm1pbWVUeXBlID09PSBDQUxFTkRBUl9NSU1FX1RZUEUpXG5cdFx0Y29uc3QgYXJlQWxsRmlsZXNNYWlsID0gZmlsZXMuZXZlcnkoKGZpbGUpID0+IGZpbGUubWltZVR5cGUgPT09IE1BSUxfTUlNRV9UWVBFUy5FTUwgfHwgZmlsZS5taW1lVHlwZSA9PT0gTUFJTF9NSU1FX1RZUEVTLk1CT1gpXG5cblx0XHRpZiAoYXJlQWxsRmlsZXNWQ2FyZCkge1xuXHRcdFx0Y29uc3QgaW1wb3J0ZXIgPSBhd2FpdCB0aGlzLmNvbnRhY3RJbXBvcnRlcigpXG5cdFx0XHRjb25zdCB7IHBhcnNlQ29udGFjdHMgfSA9IGF3YWl0IGltcG9ydChcIi4uL21haWwtYXBwL2NvbnRhY3RzL0NvbnRhY3RJbXBvcnRlci5qc1wiKVxuXHRcdFx0Ly8gRm9yIG5vdywgd2UganVzdCBoYW5kbGUgLnZjZiBmaWxlcywgc28gd2UgZG9uJ3QgbmVlZCB0byBjYXJlIGFib3V0IHRoZSBmaWxlIHR5cGVcblx0XHRcdGNvbnN0IGNvbnRhY3RzID0gYXdhaXQgcGFyc2VDb250YWN0cyhmaWxlcywgdGhpcy5maWxlQXBwKVxuXHRcdFx0Y29uc3QgdkNhcmREYXRhID0gY29udGFjdHMuam9pbihcIlxcblwiKVxuXHRcdFx0Y29uc3QgY29udGFjdExpc3RJZCA9IGFzc2VydE5vdE51bGwoYXdhaXQgdGhpcy5jb250YWN0TW9kZWwuZ2V0Q29udGFjdExpc3RJZCgpKVxuXG5cdFx0XHRhd2FpdCBpbXBvcnRlci5pbXBvcnRDb250YWN0c0Zyb21GaWxlKHZDYXJkRGF0YSwgY29udGFjdExpc3RJZClcblx0XHR9IGVsc2UgaWYgKGFyZUFsbEZpbGVzSUNTKSB7XG5cdFx0XHRjb25zdCBjYWxlbmRhck1vZGVsID0gYXdhaXQgdGhpcy5jYWxlbmRhck1vZGVsKClcblx0XHRcdGNvbnN0IGdyb3VwU2V0dGluZ3MgPSB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJTZXR0aW5nc0dyb3VwUm9vdC5ncm91cFNldHRpbmdzXG5cdFx0XHRjb25zdCBjYWxlbmRhckluZm9zID0gYXdhaXQgY2FsZW5kYXJNb2RlbC5nZXRDYWxlbmRhckluZm9zKClcblx0XHRcdGNvbnN0IGdyb3VwQ29sb3JzOiBNYXA8SWQsIHN0cmluZz4gPSBncm91cFNldHRpbmdzLnJlZHVjZSgoYWNjLCBnYykgPT4ge1xuXHRcdFx0XHRhY2Muc2V0KGdjLmdyb3VwLCBnYy5jb2xvcilcblx0XHRcdFx0cmV0dXJuIGFjY1xuXHRcdFx0fSwgbmV3IE1hcCgpKVxuXG5cdFx0XHRjb25zdCB7IGNhbGVuZGFyU2VsZWN0aW9uRGlhbG9nLCBwYXJzZUNhbGVuZGFyRmlsZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2NhbGVuZGFyL2ltcG9ydC9DYWxlbmRhckltcG9ydGVyLmpzXCIpXG5cdFx0XHRjb25zdCB7IGhhbmRsZUNhbGVuZGFySW1wb3J0IH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vY2FsZW5kYXIvaW1wb3J0L0NhbGVuZGFySW1wb3J0ZXJEaWFsb2cuanNcIilcblxuXHRcdFx0bGV0IHBhcnNlZEV2ZW50czogUGFyc2VkRXZlbnRbXSA9IFtdXG5cblx0XHRcdGZvciAoY29uc3QgZmlsZVJlZiBvZiBmaWxlcykge1xuXHRcdFx0XHRjb25zdCBkYXRhRmlsZSA9IGF3YWl0IHRoaXMuZmlsZUFwcC5yZWFkRGF0YUZpbGUoZmlsZVJlZi5sb2NhdGlvbilcblx0XHRcdFx0aWYgKGRhdGFGaWxlID09IG51bGwpIGNvbnRpbnVlXG5cblx0XHRcdFx0Y29uc3QgZGF0YSA9IHBhcnNlQ2FsZW5kYXJGaWxlKGRhdGFGaWxlKVxuXHRcdFx0XHRwYXJzZWRFdmVudHMucHVzaCguLi5kYXRhLmNvbnRlbnRzKVxuXHRcdFx0fVxuXG5cdFx0XHRjYWxlbmRhclNlbGVjdGlvbkRpYWxvZyhBcnJheS5mcm9tKGNhbGVuZGFySW5mb3MudmFsdWVzKCkpLCB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLCBncm91cENvbG9ycywgKGRpYWxvZywgc2VsZWN0ZWRDYWxlbmRhcikgPT4ge1xuXHRcdFx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdFx0XHRoYW5kbGVDYWxlbmRhckltcG9ydChzZWxlY3RlZENhbGVuZGFyLmdyb3VwUm9vdCwgcGFyc2VkRXZlbnRzKVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFsYXJtU2NoZWR1bGVyOiAoKSA9PiBQcm9taXNlPEFsYXJtU2NoZWR1bGVyPiA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBBbGFybVNjaGVkdWxlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQWxhcm1TY2hlZHVsZXJcIilcblx0XHRjb25zdCB7IERlZmF1bHREYXRlUHJvdmlkZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyVXRpbHNcIilcblx0XHRjb25zdCBkYXRlUHJvdmlkZXIgPSBuZXcgRGVmYXVsdERhdGVQcm92aWRlcigpXG5cdFx0cmV0dXJuIG5ldyBBbGFybVNjaGVkdWxlcihkYXRlUHJvdmlkZXIsIGF3YWl0IHRoaXMuc2NoZWR1bGVyKCkpXG5cdH0pXG5cblx0cHJpdmF0ZSBhc3luYyBzY2hlZHVsZXIoKTogUHJvbWlzZTxTY2hlZHVsZXJJbXBsPiB7XG5cdFx0Y29uc3QgZGF0ZVByb3ZpZGVyID0gYXdhaXQgdGhpcy5ub1pvbmVEYXRlUHJvdmlkZXIoKVxuXHRcdHJldHVybiBuZXcgU2NoZWR1bGVySW1wbChkYXRlUHJvdmlkZXIsIHdpbmRvdywgd2luZG93KVxuXHR9XG5cblx0YXN5bmMgY2FsZW5kYXJFdmVudFByZXZpZXdNb2RlbChzZWxlY3RlZEV2ZW50OiBDYWxlbmRhckV2ZW50LCBjYWxlbmRhcnM6IFJlYWRvbmx5TWFwPHN0cmluZywgQ2FsZW5kYXJJbmZvPik6IFByb21pc2U8Q2FsZW5kYXJFdmVudFByZXZpZXdWaWV3TW9kZWw+IHtcblx0XHRjb25zdCB7IGZpbmRBdHRlbmRlZUluQWRkcmVzc2VzIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9Db21tb25DYWxlbmRhclV0aWxzLmpzXCIpXG5cdFx0Y29uc3QgeyBnZXRFdmVudFR5cGUgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9ndWkvQ2FsZW5kYXJHdWlVdGlscy5qc1wiKVxuXHRcdGNvbnN0IHsgQ2FsZW5kYXJFdmVudFByZXZpZXdWaWV3TW9kZWwgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9ndWkvZXZlbnRwb3B1cC9DYWxlbmRhckV2ZW50UHJldmlld1ZpZXdNb2RlbC5qc1wiKVxuXG5cdFx0Y29uc3QgbWFpbGJveERldGFpbHMgPSBhd2FpdCB0aGlzLm1haWxib3hNb2RlbC5nZXRVc2VyTWFpbGJveERldGFpbHMoKVxuXG5cdFx0Y29uc3QgbWFpbGJveFByb3BlcnRpZXMgPSBhd2FpdCB0aGlzLm1haWxib3hNb2RlbC5nZXRNYWlsYm94UHJvcGVydGllcyhtYWlsYm94RGV0YWlscy5tYWlsYm94R3JvdXBSb290KVxuXG5cdFx0Y29uc3QgdXNlckNvbnRyb2xsZXIgPSB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpXG5cdFx0Y29uc3QgY3VzdG9tZXIgPSBhd2FpdCB1c2VyQ29udHJvbGxlci5sb2FkQ3VzdG9tZXIoKVxuXHRcdGNvbnN0IG93bk1haWxBZGRyZXNzZXMgPSBnZXRFbmFibGVkTWFpbEFkZHJlc3Nlc1dpdGhVc2VyKG1haWxib3hEZXRhaWxzLCB1c2VyQ29udHJvbGxlci51c2VyR3JvdXBJbmZvKVxuXHRcdGNvbnN0IG93bkF0dGVuZGVlOiBDYWxlbmRhckV2ZW50QXR0ZW5kZWUgfCBudWxsID0gZmluZEF0dGVuZGVlSW5BZGRyZXNzZXMoc2VsZWN0ZWRFdmVudC5hdHRlbmRlZXMsIG93bk1haWxBZGRyZXNzZXMpXG5cdFx0Y29uc3QgZXZlbnRUeXBlID0gZ2V0RXZlbnRUeXBlKHNlbGVjdGVkRXZlbnQsIGNhbGVuZGFycywgb3duTWFpbEFkZHJlc3NlcywgdXNlckNvbnRyb2xsZXIpXG5cdFx0Y29uc3QgaGFzQnVzaW5lc3NGZWF0dXJlID0gaXNDdXN0b21pemF0aW9uRW5hYmxlZEZvckN1c3RvbWVyKGN1c3RvbWVyLCBGZWF0dXJlVHlwZS5CdXNpbmVzc0ZlYXR1cmVFbmFibGVkKSB8fCAoYXdhaXQgdXNlckNvbnRyb2xsZXIuaXNOZXdQYWlkUGxhbigpKVxuXHRcdGNvbnN0IGxhenlJbmRleEVudHJ5ID0gYXN5bmMgKCkgPT4gKHNlbGVjdGVkRXZlbnQudWlkICE9IG51bGwgPyB0aGlzLmNhbGVuZGFyRmFjYWRlLmdldEV2ZW50c0J5VWlkKHNlbGVjdGVkRXZlbnQudWlkKSA6IG51bGwpXG5cdFx0Y29uc3QgcG9wdXBNb2RlbCA9IG5ldyBDYWxlbmRhckV2ZW50UHJldmlld1ZpZXdNb2RlbChcblx0XHRcdHNlbGVjdGVkRXZlbnQsXG5cdFx0XHRhd2FpdCB0aGlzLmNhbGVuZGFyTW9kZWwoKSxcblx0XHRcdGV2ZW50VHlwZSxcblx0XHRcdGhhc0J1c2luZXNzRmVhdHVyZSxcblx0XHRcdG93bkF0dGVuZGVlLFxuXHRcdFx0bGF6eUluZGV4RW50cnksXG5cdFx0XHRhc3luYyAobW9kZTogQ2FsZW5kYXJPcGVyYXRpb24pID0+IHRoaXMuY2FsZW5kYXJFdmVudE1vZGVsKG1vZGUsIHNlbGVjdGVkRXZlbnQsIG1haWxib3hEZXRhaWxzLCBtYWlsYm94UHJvcGVydGllcywgbnVsbCksXG5cdFx0KVxuXG5cdFx0Ly8gSWYgd2UgaGF2ZSBhIHByZXZpZXcgbW9kZWwgd2Ugd2FudCB0byBkaXNwbGF5IHRoZSBkZXNjcmlwdGlvblxuXHRcdC8vIHNvIG1ha2VzIHNlbnNlIHRvIGFscmVhZHkgc2FuaXRpemUgaXQgYWZ0ZXIgYnVpbGRpbmcgdGhlIGV2ZW50XG5cdFx0YXdhaXQgcG9wdXBNb2RlbC5zYW5pdGl6ZURlc2NyaXB0aW9uKClcblxuXHRcdHJldHVybiBwb3B1cE1vZGVsXG5cdH1cblxuXHRhc3luYyBjYWxlbmRhckNvbnRhY3RQcmV2aWV3TW9kZWwoZXZlbnQ6IENhbGVuZGFyRXZlbnQsIGNvbnRhY3Q6IENvbnRhY3QsIGNhbkVkaXQ6IGJvb2xlYW4pOiBQcm9taXNlPENhbGVuZGFyQ29udGFjdFByZXZpZXdWaWV3TW9kZWw+IHtcblx0XHRjb25zdCB7IENhbGVuZGFyQ29udGFjdFByZXZpZXdWaWV3TW9kZWwgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9ndWkvZXZlbnRwb3B1cC9DYWxlbmRhckNvbnRhY3RQcmV2aWV3Vmlld01vZGVsLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBDYWxlbmRhckNvbnRhY3RQcmV2aWV3Vmlld01vZGVsKGV2ZW50LCBjb250YWN0LCBjYW5FZGl0KVxuXHR9XG5cblx0cmVhZG9ubHkgbmF0aXZlQ29udGFjdHNTeW5jTWFuYWdlcjogKCkgPT4gTmF0aXZlQ29udGFjdHNTeW5jTWFuYWdlciA9IGxhenlNZW1vaXplZCgoKSA9PiB7XG5cdFx0YXNzZXJ0KGlzQXBwKCksIFwiaXNBcHBcIilcblx0XHRyZXR1cm4gbmV3IE5hdGl2ZUNvbnRhY3RzU3luY01hbmFnZXIodGhpcy5sb2dpbnMsIHRoaXMubW9iaWxlQ29udGFjdHNGYWNhZGUsIHRoaXMuZW50aXR5Q2xpZW50LCB0aGlzLmV2ZW50Q29udHJvbGxlciwgdGhpcy5jb250YWN0TW9kZWwsIGRldmljZUNvbmZpZylcblx0fSlcblxuXHRwb3N0TG9naW5BY3Rpb25zOiAoKSA9PiBQcm9taXNlPFBvc3RMb2dpbkFjdGlvbnM+ID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IFBvc3RMb2dpbkFjdGlvbnMgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9sb2dpbi9Qb3N0TG9naW5BY3Rpb25zXCIpXG5cdFx0cmV0dXJuIG5ldyBQb3N0TG9naW5BY3Rpb25zKFxuXHRcdFx0dGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyLFxuXHRcdFx0dGhpcy5zZWNvbmRGYWN0b3JIYW5kbGVyLFxuXHRcdFx0dGhpcy5jb25uZWN0aXZpdHlNb2RlbCxcblx0XHRcdHRoaXMubG9naW5zLFxuXHRcdFx0YXdhaXQgdGhpcy5ub1pvbmVEYXRlUHJvdmlkZXIoKSxcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0dGhpcy51c2VyTWFuYWdlbWVudEZhY2FkZSxcblx0XHRcdHRoaXMuY3VzdG9tZXJGYWNhZGUsXG5cdFx0XHR0aGlzLnRoZW1lQ29udHJvbGxlcixcblx0XHRcdCgpID0+IHRoaXMuc2hvd1NldHVwV2l6YXJkKCksXG5cdFx0XHQoKSA9PiB0aGlzLmhhbmRsZUV4dGVybmFsU3luYygpLFxuXHRcdFx0KCkgPT4gdGhpcy5zZXRVcENsaWVudE9ubHlDYWxlbmRhcnMoKSxcblx0XHQpXG5cdH0pXG5cblx0c2hvd1NldHVwV2l6YXJkID0gYXN5bmMgKCkgPT4ge1xuXHRcdGlmIChpc0FwcCgpKSB7XG5cdFx0XHRjb25zdCB7IHNob3dTZXR1cFdpemFyZCB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL25hdGl2ZS9tYWluL3dpemFyZC9TZXR1cFdpemFyZC5qc1wiKVxuXHRcdFx0cmV0dXJuIHNob3dTZXR1cFdpemFyZChcblx0XHRcdFx0dGhpcy5zeXN0ZW1QZXJtaXNzaW9uSGFuZGxlcixcblx0XHRcdFx0dGhpcy53ZWJNb2JpbGVGYWNhZGUsXG5cdFx0XHRcdGF3YWl0IHRoaXMuY29udGFjdEltcG9ydGVyKCksXG5cdFx0XHRcdHRoaXMuc3lzdGVtRmFjYWRlLFxuXHRcdFx0XHR0aGlzLmNyZWRlbnRpYWxzUHJvdmlkZXIsXG5cdFx0XHRcdGF3YWl0IHRoaXMubmF0aXZlQ29udGFjdHNTeW5jTWFuYWdlcigpLFxuXHRcdFx0XHRkZXZpY2VDb25maWcsXG5cdFx0XHRcdHRydWUsXG5cdFx0XHQpXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgaGFuZGxlRXh0ZXJuYWxTeW5jKCkge1xuXHRcdGNvbnN0IGNhbGVuZGFyTW9kZWwgPSBhd2FpdCBsb2NhdG9yLmNhbGVuZGFyTW9kZWwoKVxuXG5cdFx0aWYgKGlzQXBwKCkgfHwgaXNEZXNrdG9wKCkpIHtcblx0XHRcdGNhbGVuZGFyTW9kZWwuc3luY0V4dGVybmFsQ2FsZW5kYXJzKCkuY2F0Y2goYXN5bmMgKGUpID0+IHtcblx0XHRcdFx0c2hvd1NuYWNrQmFyKHtcblx0XHRcdFx0XHRtZXNzYWdlOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcImV4Y2VwdGlvbl9tc2dcIiwgZS5tZXNzYWdlKSxcblx0XHRcdFx0XHRidXR0b246IHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcIm9rX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6IG5vT3AsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR3YWl0aW5nVGltZTogMTAwMCxcblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0XHRjYWxlbmRhck1vZGVsLnNjaGVkdWxlRXh0ZXJuYWxDYWxlbmRhclN5bmMoKVxuXHRcdH1cblx0fVxuXG5cdHNldFVwQ2xpZW50T25seUNhbGVuZGFycygpIHtcblx0XHRsZXQgY29uZmlncyA9IGRldmljZUNvbmZpZy5nZXRDbGllbnRPbmx5Q2FsZW5kYXJzKClcblxuXHRcdGZvciAoY29uc3QgW2lkLCBuYW1lXSBvZiBDTElFTlRfT05MWV9DQUxFTkRBUlMuZW50cmllcygpKSB7XG5cdFx0XHRjb25zdCBjYWxlbmRhcklkID0gYCR7dGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VySWR9IyR7aWR9YFxuXHRcdFx0Y29uc3QgY29uZmlnID0gY29uZmlncy5nZXQoY2FsZW5kYXJJZClcblx0XHRcdGlmICghY29uZmlnKVxuXHRcdFx0XHRkZXZpY2VDb25maWcudXBkYXRlQ2xpZW50T25seUNhbGVuZGFycyhjYWxlbmRhcklkLCB7XG5cdFx0XHRcdFx0bmFtZTogbGFuZy5nZXQobmFtZSksXG5cdFx0XHRcdFx0Y29sb3I6IERFRkFVTFRfQ0xJRU5UX09OTFlfQ0FMRU5EQVJfQ09MT1JTLmdldChpZCkhLFxuXHRcdFx0XHR9KVxuXHRcdH1cblx0fVxuXG5cdHJlYWRvbmx5IGNyZWRlbnRpYWxGb3JtYXRNaWdyYXRvcjogKCkgPT4gUHJvbWlzZTxDcmVkZW50aWFsRm9ybWF0TWlncmF0b3I+ID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IENyZWRlbnRpYWxGb3JtYXRNaWdyYXRvciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL21pc2MvY3JlZGVudGlhbHMvQ3JlZGVudGlhbEZvcm1hdE1pZ3JhdG9yLmpzXCIpXG5cdFx0aWYgKGlzRGVza3RvcCgpKSB7XG5cdFx0XHRyZXR1cm4gbmV3IENyZWRlbnRpYWxGb3JtYXRNaWdyYXRvcihkZXZpY2VDb25maWcsIHRoaXMubmF0aXZlQ3JlZGVudGlhbHNGYWNhZGUsIG51bGwpXG5cdFx0fSBlbHNlIGlmIChpc0FwcCgpKSB7XG5cdFx0XHRyZXR1cm4gbmV3IENyZWRlbnRpYWxGb3JtYXRNaWdyYXRvcihkZXZpY2VDb25maWcsIHRoaXMubmF0aXZlQ3JlZGVudGlhbHNGYWNhZGUsIHRoaXMuc3lzdGVtRmFjYWRlKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbmV3IENyZWRlbnRpYWxGb3JtYXRNaWdyYXRvcihkZXZpY2VDb25maWcsIG51bGwsIG51bGwpXG5cdFx0fVxuXHR9KVxuXG5cdGFzeW5jIGFkZE5vdGlmaWNhdGlvbkVtYWlsRGlhbG9nKCk6IFByb21pc2U8QWRkTm90aWZpY2F0aW9uRW1haWxEaWFsb2c+IHtcblx0XHRjb25zdCB7IEFkZE5vdGlmaWNhdGlvbkVtYWlsRGlhbG9nIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9tYWlsLWFwcC9zZXR0aW5ncy9BZGROb3RpZmljYXRpb25FbWFpbERpYWxvZy5qc1wiKVxuXHRcdHJldHVybiBuZXcgQWRkTm90aWZpY2F0aW9uRW1haWxEaWFsb2codGhpcy5sb2dpbnMsIHRoaXMuZW50aXR5Q2xpZW50KVxuXHR9XG5cblx0cmVhZG9ubHkgbWFpbEV4cG9ydENvbnRyb2xsZXI6ICgpID0+IFByb21pc2U8TWFpbEV4cG9ydENvbnRyb2xsZXI+ID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IGh0bWxTYW5pdGl6ZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9taXNjL0h0bWxTYW5pdGl6ZXJcIilcblx0XHRjb25zdCB7IE1haWxFeHBvcnRDb250cm9sbGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuL25hdGl2ZS9tYWluL01haWxFeHBvcnRDb250cm9sbGVyLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBNYWlsRXhwb3J0Q29udHJvbGxlcih0aGlzLm1haWxFeHBvcnRGYWNhZGUsIGh0bWxTYW5pdGl6ZXIsIHRoaXMuZXhwb3J0RmFjYWRlLCB0aGlzLmxvZ2lucywgdGhpcy5tYWlsYm94TW9kZWwsIGF3YWl0IHRoaXMuc2NoZWR1bGVyKCkpXG5cdH0pXG5cblx0LyoqXG5cdCAqIEZhY3RvcnkgbWV0aG9kIGZvciBjcmVkZW50aWFscyBwcm92aWRlciB0aGF0IHdpbGwgcmV0dXJuIGFuIGluc3RhbmNlIGluamVjdGVkIHdpdGggdGhlIGltcGxlbWVudGF0aW9ucyBhcHByb3ByaWF0ZSBmb3IgdGhlIHBsYXRmb3JtLlxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBjcmVhdGVDcmVkZW50aWFsc1Byb3ZpZGVyKCk6IFByb21pc2U8Q3JlZGVudGlhbHNQcm92aWRlcj4ge1xuXHRcdGNvbnN0IHsgQ3JlZGVudGlhbHNQcm92aWRlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL21pc2MvY3JlZGVudGlhbHMvQ3JlZGVudGlhbHNQcm92aWRlci5qc1wiKVxuXHRcdGlmIChpc0Rlc2t0b3AoKSB8fCBpc0FwcCgpKSB7XG5cdFx0XHRyZXR1cm4gbmV3IENyZWRlbnRpYWxzUHJvdmlkZXIodGhpcy5uYXRpdmVDcmVkZW50aWFsc0ZhY2FkZSwgdGhpcy5zcWxDaXBoZXJGYWNhZGUsIGlzRGVza3RvcCgpID8gdGhpcy5pbnRlcldpbmRvd0V2ZW50U2VuZGVyIDogbnVsbClcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgeyBXZWJDcmVkZW50aWFsc0ZhY2FkZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL21pc2MvY3JlZGVudGlhbHMvV2ViQ3JlZGVudGlhbHNGYWNhZGUuanNcIilcblx0XHRcdHJldHVybiBuZXcgQ3JlZGVudGlhbHNQcm92aWRlcihuZXcgV2ViQ3JlZGVudGlhbHNGYWNhZGUoZGV2aWNlQ29uZmlnKSwgbnVsbCwgbnVsbClcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IHR5cGUgSU1haWxMb2NhdG9yID0gUmVhZG9ubHk8TWFpbExvY2F0b3I+XG5cbmV4cG9ydCBjb25zdCBtYWlsTG9jYXRvcjogSU1haWxMb2NhdG9yID0gbmV3IE1haWxMb2NhdG9yKClcblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcblx0d2luZG93LnR1dGFvLmxvY2F0b3IgPSBtYWlsTG9jYXRvclxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBSWtCLDBEQUFYO0FBQ047QUFDQTtBQUNBO0FBQ0E7O0FBQ0E7Ozs7OztBQWFELFNBQVMsZ0JBQWdCQSxNQUF1QztDQUMvRCxNQUFNLEVBQUUsT0FBTyxHQUFHO0FBQ2xCLFNBQVEsT0FBUjtBQUNDLE9BQUssc0JBQXNCO0FBQzNCLE9BQUssc0JBQXNCLGNBQzFCLFFBQU8sZ0JBQUUsUUFBUSxLQUFLLElBQUksZUFBZSxDQUFDO0FBQzNDLE9BQUssc0JBQXNCLFFBQzFCLFFBQU8sZ0JBQUUsUUFBUSxDQUFDLEtBQUssSUFBSSxnQkFBZ0IsRUFBRSxnQkFBRSxrQ0FBa0MsS0FBSyxJQUFJLG1CQUFtQixDQUFDLEFBQUMsRUFBQztBQUNqSCxPQUFLLHNCQUFzQixXQUMxQixRQUFPLGdCQUFFLFFBQVEsS0FBSyxJQUFJLGdCQUFnQixDQUFDO0NBQzVDO0FBQ0Q7Ozs7O0FBTUQsU0FBUyxpQkFBaUJDLEdBQW9DO0FBQzdELFNBQVEsRUFBRSxPQUFWO0FBQ0MsT0FBSyxzQkFBc0IsT0FDMUIsUUFBTyxnQkFBRSxRQUFRLEtBQUssSUFBSSxpQkFBaUIsQ0FBQztBQUM3QyxPQUFLLHNCQUFzQixRQUMxQixLQUFJLEVBQUUsV0FDTCxRQUFPLGdCQUFFLFFBQVEsS0FBSyxJQUFJLGtCQUFrQixFQUFFLFVBQVUsV0FBVyxFQUFFLFdBQVcsQ0FBRSxFQUFDLENBQUM7SUFHcEYsUUFBTztBQUVULE9BQUssc0JBQXNCLGNBQzFCLFFBQU8sZ0JBQUUsUUFBUSxLQUFLLElBQUksdUJBQXVCLEVBQUUsY0FBYyxpQkFBaUIsRUFBRSxTQUFTLENBQUUsRUFBQyxDQUFDO0FBQ2xHLE9BQUssc0JBQXNCLFdB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