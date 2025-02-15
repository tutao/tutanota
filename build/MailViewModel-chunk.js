import "./dist-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNode } from "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import "./mithril-chunk.js";
import { assertNotNull, compare, count, debounce, first, groupBy, isNotEmpty, lastThrow, lazyMemoized, mapWith, mapWithout, memoized, ofClass, pMap, promiseFilter } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import { ImportStatus, MailSetKind, OperationType, getMailSetKind } from "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./luxon-chunk.js";
import { CUSTOM_MAX_ID, customIdToUint8array, deconstructMailSetEntryId, elementIdPart, firstBiggerThanSecond, getElementId, isSameId, listIdPart } from "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import { ImportMailStateTypeRef, ImportedMailTypeRef, MailFolderTypeRef, MailSetEntryTypeRef, MailTypeRef } from "./TypeRefs-chunk.js";
import "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import "./CalendarUtils-chunk.js";
import "./ImportExportUtils-chunk.js";
import "./FormatValidator-chunk.js";
import "./stream-chunk.js";
import "./DeviceConfig-chunk.js";
import "./Logger-chunk.js";
import "./ErrorHandler-chunk.js";
import "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import { isOfflineError } from "./ErrorUtils-chunk.js";
import { NotAuthorizedError, NotFoundError, PreconditionFailedError } from "./RestError-chunk.js";
import "./SetupMultipleError-chunk.js";
import "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
import "./EventQueue-chunk.js";
import { CacheMode, WsConnectionState } from "./EntityRestClient-chunk.js";
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
import "./MessageDispatcher-chunk.js";
import "./WorkerProxy-chunk.js";
import { isUpdateForTypeRef } from "./EntityUpdateUtils-chunk.js";
import "./SessionType-chunk.js";
import "./EntityClient-chunk.js";
import "./PageContextLoginListener-chunk.js";
import "./RestClient-chunk.js";
import "./BirthdayUtils-chunk.js";
import "./Services2-chunk.js";
import "./FolderSystem-chunk.js";
import "./GroupUtils-chunk.js";
import { isOfTypeOrSubfolderOf, isSpamOrTrashFolder, isSubfolderOfType } from "./MailChecks-chunk.js";
import "./Button-chunk.js";
import "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import "./Formatter-chunk.js";
import "./ProgressMonitor-chunk.js";
import "./Notifications-chunk.js";
import "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import "./MailAddressParser-chunk.js";
import "./BlobUtils-chunk.js";
import "./FileUtils-chunk.js";
import "./ProgressDialog-chunk.js";
import "./SharedMailUtils-chunk.js";
import "./PasswordUtils-chunk.js";
import "./Recipient-chunk.js";
import "./ContactUtils-chunk.js";
import "./SubscriptionDialogs-chunk.js";
import "./ExternalLink-chunk.js";
import "./ToggleButton-chunk.js";
import "./SnackBar-chunk.js";
import "./Credentials-chunk.js";
import "./NotificationOverlay-chunk.js";
import "./Checkbox-chunk.js";
import "./Expander-chunk.js";
import "./ClipboardUtils-chunk.js";
import "./Services4-chunk.js";
import "./BubbleButton-chunk.js";
import "./ErrorReporter-chunk.js";
import "./PasswordField-chunk.js";
import "./PasswordRequestDialog-chunk.js";
import "./ErrorHandlerImpl-chunk.js";
import "./List-chunk.js";
import "./RouteChange-chunk.js";
import { ListModel } from "./ListModel-chunk.js";
import "./CustomerUtils-chunk.js";
import "./mailLocator-chunk.js";
import "./LoginScreenHeader-chunk.js";
import "./LoginButton-chunk.js";
import "./LoginUtils-chunk.js";
import "./AttachmentBubble-chunk.js";
import "./MailGuiUtils-chunk.js";
import "./UsageTestModel-chunk.js";
import { assertSystemFolderOfType } from "./MailUtils-chunk.js";
import "./BrowserWebauthn-chunk.js";
import "./PermissionType-chunk.js";
import "./CommonMailUtils-chunk.js";
import "./SearchUtils-chunk.js";
import "./FontIcons-chunk.js";
import { MailFilterType, getMailFilterForType } from "./MailViewerViewModel-chunk.js";
import "./LoadingState-chunk.js";
import "./inlineImagesUtils-chunk.js";

//#region src/mail-app/mail/model/MailListModel.ts
assertMainOrNode();
var MailListModel = class {
	listModel;
	mailMap = new Map();
	constructor(mailSet, conversationPrefProvider, entityClient, mailModel, inboxRuleHandler, cacheStorage) {
		this.mailSet = mailSet;
		this.conversationPrefProvider = conversationPrefProvider;
		this.entityClient = entityClient;
		this.mailModel = mailModel;
		this.inboxRuleHandler = inboxRuleHandler;
		this.cacheStorage = cacheStorage;
		this.listModel = new ListModel({
			fetch: (lastFetchedItem, count$1) => {
				const lastFetchedId = lastFetchedItem?.mailSetEntry?._id ?? [mailSet.entries, CUSTOM_MAX_ID];
				return this.loadMails(lastFetchedId, count$1);
			},
			sortCompare: (item1, item2) => {
				const item1Id = getElementId(item1.mailSetEntry);
				const item2Id = getElementId(item2.mailSetEntry);
				return compare(customIdToUint8array(item2Id), customIdToUint8array(item1Id));
			},
			getItemId: (item) => getElementId(item.mailSetEntry),
			isSameId: (id1, id2) => id1 === id2,
			autoSelectBehavior: () => this.conversationPrefProvider.getMailAutoSelectBehavior()
		});
	}
	get items() {
		return this._loadedMails().map((mail) => mail.mail);
	}
	get loadingStatus() {
		return this.listModel.state.loadingStatus;
	}
	get stateStream() {
		return this.listModel.stateStream.map((state) => {
			const items = state.items.map((item) => item.mail);
			const selectedItems = new Set();
			for (const item of state.selectedItems) selectedItems.add(item.mail);
			const newState = {
				...state,
				items,
				selectedItems
			};
			return newState;
		});
	}
	isLoadingAll() {
		return this.listModel.state.loadingAll;
	}
	isItemSelected(mailId) {
		const loadedMail = this.mailMap.get(mailId);
		if (loadedMail == null) return false;
		return this.listModel.isItemSelected(getElementId(loadedMail.mailSetEntry));
	}
	getMail(mailElementId) {
		return this.getLoadedMailByMailId(mailElementId)?.mail ?? null;
	}
	getLabelsForMail(mail) {
		return this.getLoadedMailByMailInstance(mail)?.labels ?? [];
	}
	getMailSetEntry(mailSetEntryId) {
		return this.getLoadedMailByMailSetId(mailSetEntryId)?.mailSetEntry ?? null;
	}
	async loadAndSelect(mailId, shouldStop) {
		const mailFinder = (loadedMail) => isSameId(getElementId(loadedMail.mail), mailId);
		const mail = await this.listModel.loadAndSelect(mailFinder, shouldStop);
		return mail?.mail ?? null;
	}
	onSingleSelection(mail) {
		this.listModel.onSingleSelection(assertNotNull(this.getLoadedMailByMailInstance(mail)));
	}
	selectNone() {
		this.listModel.selectNone();
	}
	cancelLoadAll() {
		this.listModel.cancelLoadAll();
	}
	async loadInitial() {
		await this.listModel.loadInitial();
	}
	getSelectedAsArray() {
		return this.listModel.getSelectedAsArray().map(({ mail }) => mail);
	}
	async handleEntityUpdate(update) {
		if (isUpdateForTypeRef(MailFolderTypeRef, update)) {
			if (update.operation === OperationType.UPDATE) {
				const mailSetId = [update.instanceListId, update.instanceId];
				for (const loadedMail of this.mailMap.values()) {
					const hasMailSet = loadedMail.labels.some((label) => isSameId(mailSetId, label._id));
					if (!hasMailSet) continue;
					const labels = this.mailModel.getLabelsForMail(loadedMail.mail);
					const newMailEntry = {
						...loadedMail,
						labels
					};
					this._updateSingleMail(newMailEntry);
				}
			}
		} else if (isUpdateForTypeRef(MailSetEntryTypeRef, update) && isSameId(this.mailSet.entries, update.instanceListId)) {
			if (update.operation === OperationType.DELETE) {
				const mail = this.getLoadedMailByMailSetId(update.instanceId);
				if (mail) this.mailMap.delete(getElementId(mail.mail));
				await this.listModel.deleteLoadedItem(update.instanceId);
			} else if (update.operation === OperationType.CREATE) {
				const loadedMail = await this.loadSingleMail([update.instanceListId, update.instanceId]);
				await this.listModel.waitLoad(async () => {
					if (this.listModel.canInsertItem(loadedMail)) this.listModel.insertLoadedItem(loadedMail);
				});
			}
		} else if (isUpdateForTypeRef(MailTypeRef, update)) {
			const mailItem = this.mailMap.get(update.instanceId);
			if (mailItem != null && update.operation === OperationType.UPDATE) {
				const newMailData = await this.entityClient.load(MailTypeRef, [update.instanceListId, update.instanceId]);
				const labels = this.mailModel.getLabelsForMail(newMailData);
				const newMailItem = {
					...mailItem,
					labels,
					mail: newMailData
				};
				this._updateSingleMail(newMailItem);
			}
		}
	}
	areAllSelected() {
		return this.listModel.areAllSelected();
	}
	selectAll() {
		this.listModel.selectAll();
	}
	onSingleInclusiveSelection(mail, clearSelectionOnMultiSelectStart) {
		this.listModel.onSingleInclusiveSelection(assertNotNull(this.getLoadedMailByMailInstance(mail)), clearSelectionOnMultiSelectStart);
	}
	selectRangeTowards(mail) {
		this.listModel.selectRangeTowards(assertNotNull(this.getLoadedMailByMailInstance(mail)));
	}
	selectPrevious(multiselect) {
		this.listModel.selectPrevious(multiselect);
	}
	selectNext(multiselect) {
		this.listModel.selectNext(multiselect);
	}
	onSingleExclusiveSelection(mail) {
		this.listModel.onSingleExclusiveSelection(assertNotNull(this.getLoadedMailByMailInstance(mail)));
	}
	isInMultiselect() {
		return this.listModel.state.inMultiselect;
	}
	enterMultiselect() {
		this.listModel.enterMultiselect();
	}
	async loadAll() {
		await this.listModel.loadAll();
	}
	setFilter(filter) {
		this.listModel.setFilter(filter && ((loadedMail) => filter(loadedMail.mail)));
	}
	isEmptyAndDone() {
		return this.listModel.isEmptyAndDone();
	}
	async loadMore() {
		await this.listModel.loadMore();
	}
	async retryLoading() {
		await this.listModel.retryLoading();
	}
	stopLoading() {
		this.listModel.stopLoading();
	}
	getLoadedMailByMailId(mailId) {
		return this.mailMap.get(mailId) ?? null;
	}
	getLoadedMailByMailSetId(mailId) {
		return this.mailMap.get(deconstructMailSetEntryId(mailId).mailId) ?? null;
	}
	getLoadedMailByMailInstance(mail) {
		return this.getLoadedMailByMailId(getElementId(mail));
	}
	/**
	* Load mails, applying inbox rules as needed
	*/
	async loadMails(startingId, count$1) {
		let items = [];
		let complete = false;
		try {
			const mailSetEntries = await this.entityClient.loadRange(MailSetEntryTypeRef, listIdPart(startingId), elementIdPart(startingId), count$1, true);
			complete = mailSetEntries.length < count$1;
			if (mailSetEntries.length > 0) {
				items = await this.resolveMailSetEntries(mailSetEntries, this.defaultMailProvider);
				items = await this.applyInboxRulesToEntries(items);
			}
		} catch (e) {
			if (isOfflineError(e)) {
				if (items.length === 0) {
					complete = false;
					items = await this.loadMailsFromCache(startingId, count$1);
					if (items.length === 0) throw e;
				}
			} else throw e;
		}
		this.updateMailMap(items);
		return {
			items,
			complete
		};
	}
	/**
	* Load mails from the cache rather than remotely
	*/
	async loadMailsFromCache(startId, count$1) {
		const mailSetEntries = await this.cacheStorage.provideFromRange(MailSetEntryTypeRef, listIdPart(startId), elementIdPart(startId), count$1, true);
		return await this.resolveMailSetEntries(mailSetEntries, (list, elements) => this.cacheStorage.provideMultiple(MailTypeRef, list, elements));
	}
	/**
	* Apply inbox rules to an array of mails, returning all mails that were not moved
	*/
	async applyInboxRulesToEntries(entries) {
		if (this.mailSet.folderType !== MailSetKind.INBOX || entries.length === 0) return entries;
		const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(this.mailSet);
		if (!mailboxDetail) return entries;
		return await promiseFilter(entries, async (entry) => {
			const ruleApplied = await this.inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, entry.mail, true);
			return ruleApplied == null;
		});
	}
	async loadSingleMail(id) {
		const mailSetEntry = await this.entityClient.load(MailSetEntryTypeRef, id);
		const loadedMails = await this.resolveMailSetEntries([mailSetEntry], this.defaultMailProvider);
		this.updateMailMap(loadedMails);
		return assertNotNull(loadedMails[0]);
	}
	/**
	* Loads all Mail instances for each MailSetEntry, returning a tuple of each
	*/
	async resolveMailSetEntries(mailSetEntries, mailProvider) {
		const mailListMap = new Map();
		for (const entry of mailSetEntries) {
			const mailBag = listIdPart(entry.mail);
			const mailElementId = elementIdPart(entry.mail);
			let mailIds = mailListMap.get(mailBag);
			if (!mailIds) {
				mailIds = [];
				mailListMap.set(mailBag, mailIds);
			}
			mailIds.push(mailElementId);
		}
		const allMails = new Map();
		for (const [list, elements] of mailListMap) {
			const mails = await mailProvider(list, elements);
			for (const mail of mails) allMails.set(getElementId(mail), mail);
		}
		const loadedMails = [];
		for (const mailSetEntry of mailSetEntries) {
			const mail = allMails.get(elementIdPart(mailSetEntry.mail));
			if (!mail) continue;
			const labels = this.mailModel.getLabelsForMail(mail);
			loadedMails.push({
				mailSetEntry,
				mail,
				labels
			});
		}
		return loadedMails;
	}
	updateMailMap(mails) {
		for (const mail of mails) this.mailMap.set(getElementId(mail.mail), mail);
	}
	_updateSingleMail(mail) {
		this.updateMailMap([mail]);
		this.listModel.updateLoadedItem(mail);
	}
	_loadedMails() {
		return this.listModel.state.items;
	}
	defaultMailProvider = (listId, elements) => {
		return this.entityClient.loadMultiple(MailTypeRef, listId, elements);
	};
};

//#endregion
//#region src/mail-app/mail/view/MailViewModel.ts
const TAG = "MailVM";
var MailViewModel = class {
	_folder = null;
	/** id of the mail that was requested to be displayed, independent of the list state. */
	stickyMailId = null;
	/**
	* When the URL contains both folder id and mail id we will try to select that mail but we might need to load the list until we find it.
	* This is that mail id that we are loading.
	*/
	loadingTargetId = null;
	conversationViewModel = null;
	_filterType = null;
	/**
	* We remember the last URL used for each folder so if we switch between folders we can keep the selected mail.
	* There's a similar (but different) hacky mechanism where we store last URL but per each top-level view: navButtonRoutes. This one is per folder.
	*/
	mailFolderElementIdToSelectedMailId = new Map();
	listStreamSubscription = null;
	conversationPref = false;
	/** A slightly hacky marker to avoid concurrent URL updates. */
	currentShowTargetMarker = {};
	constructor(mailboxModel, mailModel, entityClient, eventController, connectivityModel, cacheStorage, conversationViewModelFactory, mailOpenedListener, conversationPrefProvider, inboxRuleHandler, router, updateUi) {
		this.mailboxModel = mailboxModel;
		this.mailModel = mailModel;
		this.entityClient = entityClient;
		this.eventController = eventController;
		this.connectivityModel = connectivityModel;
		this.cacheStorage = cacheStorage;
		this.conversationViewModelFactory = conversationViewModelFactory;
		this.mailOpenedListener = mailOpenedListener;
		this.conversationPrefProvider = conversationPrefProvider;
		this.inboxRuleHandler = inboxRuleHandler;
		this.router = router;
		this.updateUi = updateUi;
	}
	getSelectedMailSetKind() {
		return this._folder ? getMailSetKind(this._folder) : null;
	}
	get filterType() {
		return this._filterType;
	}
	setFilter(filter) {
		this._filterType = filter;
		this.listModel?.setFilter(getMailFilterForType(filter));
	}
	async showMailWithMailSetId(mailsetId, mailId) {
		const showMailMarker = {};
		this.currentShowTargetMarker = showMailMarker;
		if (mailsetId) {
			const mailset = await this.mailModel.getMailSetById(mailsetId);
			if (showMailMarker !== this.currentShowTargetMarker) return;
			if (mailset) return this.showMail(mailset, mailId);
		}
		return this.showMail(null, mailId);
	}
	async showStickyMail(fullMailId, onMissingExplicitMailTarget) {
		const [listId, elementId] = fullMailId;
		if (this.conversationViewModel && isSameId(this.conversationViewModel.primaryMail._id, elementId)) return;
		if (isSameId(this.stickyMailId, fullMailId)) return;
		console.log(TAG, "Loading sticky mail", listId, elementId);
		this.stickyMailId = fullMailId;
		await this.loadExplicitMailTarget(listId, elementId, onMissingExplicitMailTarget);
	}
	async resetOrInitializeList(stickyMailId) {
		if (this._folder != null) this.listModel?.selectNone();
else {
			const userInbox = await this.getFolderForUserInbox();
			if (this.didStickyMailChange(stickyMailId, "after loading user inbox ID")) return;
			this.setListId(userInbox);
		}
	}
	async showMail(folder, mailId) {
		if (folder != null && mailId != null && this.conversationViewModel && isSameId(elementIdPart(this.conversationViewModel.primaryMail._id), mailId)) return;
		if (folder != null && mailId != null && this._folder && this.loadingTargetId && isSameId(folder._id, this._folder._id) && isSameId(this.loadingTargetId, mailId)) return;
		console.log(TAG, "showMail", folder?._id, mailId);
		const loadingTargetId = mailId ?? null;
		this.loadingTargetId = loadingTargetId;
		this.stickyMailId = null;
		const folderToUse = await this.selectFolderToUse(folder ?? null);
		if (this.loadingTargetId !== loadingTargetId) return;
		this.setListId(folderToUse);
		if (loadingTargetId) {
			this.mailFolderElementIdToSelectedMailId = mapWith(this.mailFolderElementIdToSelectedMailId, getElementId(folderToUse), loadingTargetId);
			try {
				await this.loadAndSelectMail(folderToUse, loadingTargetId);
			} finally {
				this.loadingTargetId = null;
			}
		} else if (folder == null) this.updateUrl();
	}
	async selectFolderToUse(folderArgument) {
		if (folderArgument) {
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(folderArgument);
			if (mailboxDetail) return folderArgument;
else return await this.getFolderForUserInbox();
		} else return this._folder ?? await this.getFolderForUserInbox();
	}
	async loadExplicitMailTarget(listId, mailId, onMissingTargetEmail) {
		const expectedStickyMailId = [listId, mailId];
		const mailInList = this.listModel?.getMail(mailId);
		if (mailInList) {
			console.log(TAG, "opening mail from list", mailId);
			this.listModel?.onSingleSelection(mailInList);
			return;
		}
		const cached = await this.cacheStorage.get(MailTypeRef, listId, mailId);
		if (this.didStickyMailChange(expectedStickyMailId, "after loading cached")) return;
		if (cached) {
			console.log(TAG, "displaying cached mail", mailId);
			await this.displayExplicitMailTarget(cached);
		}
		let mail;
		try {
			mail = await this.entityClient.load(MailTypeRef, [listId, mailId], { cacheMode: CacheMode.WriteOnly });
		} catch (e) {
			if (isOfflineError(e)) return;
else if (e instanceof NotFoundError || e instanceof NotAuthorizedError) mail = null;
else throw e;
		}
		if (this.didStickyMailChange(expectedStickyMailId, "after loading from entity client")) return;
		let movedSetsSinceLastSync = false;
		if (mail != null && cached != null && cached.sets.length > 0) {
			const currentFolderId = elementIdPart(assertNotNull(this._folder, "cached was displayed earlier, thus folder would have been set")._id);
			const cachedMailInFolder = cached.sets.some((id) => elementIdPart(id) === currentFolderId);
			movedSetsSinceLastSync = cachedMailInFolder && !mail.sets.some((id) => elementIdPart(id) === currentFolderId);
		}
		if (!movedSetsSinceLastSync && mail != null) {
			console.log(TAG, "opening mail from entity client", mailId);
			await this.displayExplicitMailTarget(mail);
		} else {
			if (mail != null) console.log(TAG, "Explicit mail target moved sets", listId, mailId);
else console.log(TAG, "Explicit mail target not found", listId, mailId);
			onMissingTargetEmail();
			this.stickyMailId = null;
			this.updateUrl();
		}
	}
	async displayExplicitMailTarget(mail) {
		await this.resetOrInitializeList(mail._id);
		this.createConversationViewModel({
			mail,
			showFolder: false
		});
		this.updateUi();
	}
	didStickyMailChange(expectedId, message) {
		const changed = !isSameId(this.stickyMailId, expectedId);
		if (changed) console.log(TAG, "target mail id changed", message, expectedId, this.stickyMailId);
		return changed;
	}
	async loadAndSelectMail(folder, mailId) {
		const foundMail = await this.listModel?.loadAndSelect(mailId, () => this.getFolder() !== folder || !this.listModel || this.loadingTargetId !== mailId || this.listModel.items.length > 0 && firstBiggerThanSecond(mailId, getElementId(lastThrow(this.listModel.items))));
		if (foundMail == null) console.log("did not find mail", folder, mailId);
	}
	async getFolderForUserInbox() {
		const mailboxDetail = await this.mailboxModel.getUserMailboxDetails();
		const folders = await this.mailModel.getMailboxFoldersForId(assertNotNull(mailboxDetail.mailbox.folders)._id);
		return assertSystemFolderOfType(folders, MailSetKind.INBOX);
	}
	init() {
		this.singInit();
		const conversationEnabled = this.conversationPrefProvider.getConversationViewShowOnlySelectedMail();
		if (this.conversationViewModel && this.conversationPref !== conversationEnabled) {
			const mail = this.conversationViewModel.primaryMail;
			this.createConversationViewModel({
				mail,
				showFolder: false,
				delayBodyRenderingUntil: Promise.resolve()
			});
			this.mailOpenedListener.onEmailOpened(mail);
		}
		this.conversationPref = conversationEnabled;
	}
	singInit = lazyMemoized(() => {
		this.eventController.addEntityListener((updates) => this.entityEventsReceived(updates));
	});
	get listModel() {
		return this._folder ? this.listModelForFolder(getElementId(this._folder)) : null;
	}
	getMailFolderToSelectedMail() {
		return this.mailFolderElementIdToSelectedMailId;
	}
	getFolder() {
		return this._folder;
	}
	getLabelsForMail(mail) {
		return this.listModel?.getLabelsForMail(mail) ?? [];
	}
	setListId(folder) {
		if (folder === this._folder) return;
		this.listModel?.cancelLoadAll();
		this._filterType = null;
		this._folder = folder;
		this.listStreamSubscription?.end(true);
		this.listStreamSubscription = this.listModel.stateStream.map((state) => this.onListStateChange(state));
		this.listModel.loadInitial().then(() => {
			if (this.listModel != null && this._folder === folder) this.fixCounterIfNeeded(folder, this.listModel.items);
		});
	}
	getConversationViewModel() {
		return this.conversationViewModel;
	}
	listModelForFolder = memoized((_folderId) => {
		const folder = assertNotNull(this._folder);
		return new MailListModel(folder, this.conversationPrefProvider, this.entityClient, this.mailModel, this.inboxRuleHandler, this.cacheStorage);
	});
	fixCounterIfNeeded = debounce(2e3, async (folder, itemsWhenCalled) => {
		const ourFolder = this.getFolder();
		if (ourFolder == null || this._filterType != null && this.filterType !== MailFilterType.Unread) return;
		if (!isSameId(getElementId(ourFolder), getElementId(folder)) || this.connectivityModel.wsConnection()() !== WsConnectionState.connected) return;
		if (this.listModel?.items !== itemsWhenCalled) {
			console.log(`list changed, trying again later`);
			return this.fixCounterIfNeeded(folder, this.listModel?.items ?? []);
		}
		const unreadMailsCount = count(this.listModel.items, (e) => e.unread);
		const counterValue = await this.mailModel.getCounterValue(folder);
		if (counterValue != null && counterValue !== unreadMailsCount) {
			console.log(`fixing up counter for folder ${folder._id}`);
			await this.mailModel.fixupCounterForFolder(folder, unreadMailsCount);
		} else console.log(`same counter, no fixup on folder ${folder._id}`);
	});
	onListStateChange(newState) {
		const displayedMailId = this.conversationViewModel?.primaryViewModel()?.mail._id;
		if (!(displayedMailId && isSameId(displayedMailId, this.stickyMailId))) {
			const targetItem = this.stickyMailId ? newState.items.find((item) => isSameId(this.stickyMailId, item._id)) : !newState.inMultiselect && newState.selectedItems.size === 1 ? first(this.listModel.getSelectedAsArray()) : null;
			if (targetItem != null) {
				this.mailFolderElementIdToSelectedMailId = mapWith(this.mailFolderElementIdToSelectedMailId, getElementId(assertNotNull(this.getFolder())), getElementId(targetItem));
				if (!this.conversationViewModel || !isSameId(this.conversationViewModel?.primaryMail._id, targetItem._id)) {
					this.createConversationViewModel({
						mail: targetItem,
						showFolder: false
					});
					this.mailOpenedListener.onEmailOpened(targetItem);
				}
			} else {
				this.conversationViewModel?.dispose();
				this.conversationViewModel = null;
				this.mailFolderElementIdToSelectedMailId = mapWithout(this.mailFolderElementIdToSelectedMailId, getElementId(assertNotNull(this.getFolder())));
			}
		}
		this.updateUrl();
		this.updateUi();
	}
	updateUrl() {
		const folder = this._folder;
		const folderId = folder ? getElementId(folder) : null;
		const mailId = this.loadingTargetId ?? (folderId ? this.getMailFolderToSelectedMail().get(folderId) : null);
		const stickyMail = this.stickyMailId;
		if (mailId != null) this.router.routeTo("/mail/:folderId/:mailId", this.addStickyMailParam({
			folderId,
			mailId,
			mail: stickyMail
		}));
else this.router.routeTo("/mail/:folderId", this.addStickyMailParam({ folderId: folderId ?? "" }));
	}
	addStickyMailParam(params) {
		if (this.stickyMailId) params.mail = this.stickyMailId.join(",");
		return params;
	}
	createConversationViewModel(viewModelParams) {
		this.conversationViewModel?.dispose();
		this.conversationViewModel = this.conversationViewModelFactory(viewModelParams);
	}
	async entityEventsReceived(updates) {
		const folder = this._folder;
		const listModel = this.listModel;
		if (!folder || !listModel) return;
		let importMailStateUpdates = [];
		for (const update of updates) {
			if (isUpdateForTypeRef(MailSetEntryTypeRef, update) && isSameId(folder.entries, update.instanceListId)) {
				if (update.operation === OperationType.DELETE && this.stickyMailId != null) {
					const { mailId } = deconstructMailSetEntryId(update.instanceId);
					if (isSameId(mailId, elementIdPart(this.stickyMailId))) this.stickyMailId = null;
				}
			} else if (isUpdateForTypeRef(ImportMailStateTypeRef, update) && (update.operation == OperationType.CREATE || update.operation == OperationType.UPDATE)) importMailStateUpdates.push(update);
			await listModel.handleEntityUpdate(update);
			await pMap(importMailStateUpdates, (update$1) => this.processImportedMails(update$1));
		}
	}
	async processImportedMails(update) {
		const importMailState = await this.entityClient.load(ImportMailStateTypeRef, [update.instanceListId, update.instanceId]);
		const listModelOfImport = this.listModelForFolder(elementIdPart(importMailState.targetFolder));
		let status = parseInt(importMailState.status);
		if (status === ImportStatus.Finished || status === ImportStatus.Canceled) {
			let importedMailEntries = await this.entityClient.loadAll(ImportedMailTypeRef, importMailState.importedMails);
			if (importedMailEntries.length === 0) return Promise.resolve();
			let mailSetEntryIds = importedMailEntries.map((importedMail) => elementIdPart(importedMail.mailSetEntry));
			const mailSetEntryListId = listIdPart(importedMailEntries[0].mailSetEntry);
			const importedMailSetEntries = await this.entityClient.loadMultiple(MailSetEntryTypeRef, mailSetEntryListId, mailSetEntryIds);
			if (isNotEmpty(importedMailSetEntries)) {
				await this.preloadMails(importedMailSetEntries);
				await pMap(importedMailSetEntries, (importedMailSetEntry) => {
					return listModelOfImport.handleEntityUpdate({
						instanceListId: listIdPart(importedMailSetEntry._id),
						instanceId: elementIdPart(importedMailSetEntry._id),
						operation: OperationType.CREATE,
						type: MailSetEntryTypeRef.type,
						application: MailSetEntryTypeRef.app
					});
				});
			}
		}
	}
	async preloadMails(importedMailSetEntries) {
		const mailIds = importedMailSetEntries.map((mse) => mse.mail);
		const mailsByList = groupBy(mailIds, (m) => listIdPart(m));
		for (const [listId, mailIds$1] of mailsByList.entries()) {
			const mailElementIds = mailIds$1.map((m) => elementIdPart(m));
			await this.entityClient.loadMultiple(MailTypeRef, listId, mailElementIds);
		}
	}
	async switchToFolder(folderType) {
		const state = {};
		this.currentShowTargetMarker = state;
		const mailboxDetail = assertNotNull(await this.getMailboxDetails());
		if (this.currentShowTargetMarker !== state) return;
		if (mailboxDetail == null || mailboxDetail.mailbox.folders == null) return;
		const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id);
		if (this.currentShowTargetMarker !== state) return;
		const folder = assertSystemFolderOfType(folders, folderType);
		await this.showMail(folder, this.mailFolderElementIdToSelectedMailId.get(getElementId(folder)));
	}
	async getMailboxDetails() {
		const folder = this.getFolder();
		return await this.mailboxDetailForListWithFallback(folder);
	}
	async showingDraftsFolder() {
		if (!this._folder) return false;
		const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(this._folder);
		const selectedFolder = this.getFolder();
		if (selectedFolder && mailboxDetail && mailboxDetail.mailbox.folders) {
			const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id);
			return isOfTypeOrSubfolderOf(folders, selectedFolder, MailSetKind.DRAFT);
		} else return false;
	}
	async showingTrashOrSpamFolder() {
		const folder = this.getFolder();
		if (folder) {
			const mailboxDetail = await this.mailModel.getMailboxDetailsForMailFolder(folder);
			if (folder && mailboxDetail && mailboxDetail.mailbox.folders) {
				const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id);
				return isSpamOrTrashFolder(folders, folder);
			}
		}
		return false;
	}
	async mailboxDetailForListWithFallback(folder) {
		const mailboxDetailForListId = folder ? await this.mailModel.getMailboxDetailsForMailFolder(folder) : null;
		return mailboxDetailForListId ?? await this.mailboxModel.getUserMailboxDetails();
	}
	async finallyDeleteAllMailsInSelectedFolder(folder) {
		this.listModel?.selectNone();
		const mailboxDetail = await this.getMailboxDetails();
		if (folder.folderType === MailSetKind.TRASH || folder.folderType === MailSetKind.SPAM) return this.mailModel.clearFolder(folder).catch(ofClass(PreconditionFailedError, () => {
			throw new UserError("operationStillActive_msg");
		}));
else {
			const folders = await this.mailModel.getMailboxFoldersForId(assertNotNull(mailboxDetail.mailbox.folders)._id);
			if (isSubfolderOfType(folders, folder, MailSetKind.TRASH) || isSubfolderOfType(folders, folder, MailSetKind.SPAM)) return this.mailModel.finallyDeleteCustomMailFolder(folder).catch(ofClass(PreconditionFailedError, () => {
				throw new UserError("operationStillActive_msg");
			}));
else throw new ProgrammingError(`Cannot delete mails in folder ${String(folder._id)} with type ${folder.folderType}`);
		}
	}
	onSingleSelection(mail) {
		this.stickyMailId = null;
		this.loadingTargetId = null;
		this.listModel?.onSingleSelection(mail);
	}
	areAllSelected() {
		return this.listModel?.areAllSelected() ?? false;
	}
	selectNone() {
		this.stickyMailId = null;
		this.loadingTargetId = null;
		this.listModel?.selectNone();
	}
	selectAll() {
		this.stickyMailId = null;
		this.loadingTargetId = null;
		this.listModel?.selectAll();
	}
	onSingleInclusiveSelection(mail, clearSelectionOnMultiSelectStart) {
		this.stickyMailId = null;
		this.loadingTargetId = null;
		this.listModel?.onSingleInclusiveSelection(mail, clearSelectionOnMultiSelectStart);
	}
	onRangeSelectionTowards(mail) {
		this.stickyMailId = null;
		this.loadingTargetId = null;
		this.listModel?.selectRangeTowards(mail);
	}
	selectPrevious(multiselect) {
		this.stickyMailId = null;
		this.loadingTargetId = null;
		this.listModel?.selectPrevious(multiselect);
	}
	selectNext(multiselect) {
		this.stickyMailId = null;
		this.loadingTargetId = null;
		this.listModel?.selectNext(multiselect);
	}
	onSingleExclusiveSelection(mail) {
		this.stickyMailId = null;
		this.loadingTargetId = null;
		this.listModel?.onSingleExclusiveSelection(mail);
	}
	async createLabel(mailbox, labelData) {
		await this.mailModel.createLabel(assertNotNull(mailbox._ownerGroup), labelData);
	}
	async editLabel(label, newData) {
		await this.mailModel.updateLabel(label, newData);
	}
	async deleteLabel(label) {
		await this.mailModel.deleteLabel(label);
	}
};

//#endregion
export { MailViewModel };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbFZpZXdNb2RlbC1jaHVuay5qcyIsIm5hbWVzIjpbIm1haWxTZXQ6IE1haWxGb2xkZXIiLCJjb252ZXJzYXRpb25QcmVmUHJvdmlkZXI6IENvbnZlcnNhdGlvblByZWZQcm92aWRlciIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50IiwibWFpbE1vZGVsOiBNYWlsTW9kZWwiLCJpbmJveFJ1bGVIYW5kbGVyOiBJbmJveFJ1bGVIYW5kbGVyIiwiY2FjaGVTdG9yYWdlOiBFeHBvc2VkQ2FjaGVTdG9yYWdlIiwiY291bnQiLCJzZWxlY3RlZEl0ZW1zOiBTZXQ8TWFpbD4iLCJuZXdTdGF0ZTogTGlzdFN0YXRlPE1haWw+IiwibWFpbElkOiBJZCIsIm1haWxFbGVtZW50SWQ6IElkIiwibWFpbDogTWFpbCIsIm1haWxTZXRFbnRyeUlkOiBJZCIsInNob3VsZFN0b3A6ICgpID0+IGJvb2xlYW4iLCJsb2FkZWRNYWlsOiBMb2FkZWRNYWlsIiwidXBkYXRlOiBFbnRpdHlVcGRhdGVEYXRhIiwibWFpbFNldElkOiBJZFR1cGxlIiwiY2xlYXJTZWxlY3Rpb25Pbk11bHRpU2VsZWN0U3RhcnQ/OiBib29sZWFuIiwibXVsdGlzZWxlY3Q6IGJvb2xlYW4iLCJmaWx0ZXI6IExpc3RGaWx0ZXI8TWFpbD4gfCBudWxsIiwic3RhcnRpbmdJZDogSWRUdXBsZSIsImNvdW50OiBudW1iZXIiLCJpdGVtczogTG9hZGVkTWFpbFtdIiwic3RhcnRJZDogSWRUdXBsZSIsImVudHJpZXM6IExvYWRlZE1haWxbXSIsImlkOiBJZFR1cGxlIiwibWFpbFNldEVudHJpZXM6IE1haWxTZXRFbnRyeVtdIiwibWFpbFByb3ZpZGVyOiAobGlzdElkOiBJZCwgZWxlbWVudElkczogSWRbXSkgPT4gUHJvbWlzZTxNYWlsW10+IiwibWFpbExpc3RNYXA6IE1hcDxJZCwgSWRbXT4iLCJhbGxNYWlsczogTWFwPElkLCBNYWlsPiIsImxvYWRlZE1haWxzOiBMb2FkZWRNYWlsW10iLCJsYWJlbHM6IE1haWxGb2xkZXJbXSIsIm1haWxzOiBMb2FkZWRNYWlsW10iLCJtYWlsOiBMb2FkZWRNYWlsIiwibGlzdElkOiBJZCIsImVsZW1lbnRzOiBJZFtdIiwibWFpbGJveE1vZGVsOiBNYWlsYm94TW9kZWwiLCJtYWlsTW9kZWw6IE1haWxNb2RlbCIsImVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50IiwiZXZlbnRDb250cm9sbGVyOiBFdmVudENvbnRyb2xsZXIiLCJjb25uZWN0aXZpdHlNb2RlbDogV2Vic29ja2V0Q29ubmVjdGl2aXR5TW9kZWwiLCJjYWNoZVN0b3JhZ2U6IEV4cG9zZWRDYWNoZVN0b3JhZ2UiLCJjb252ZXJzYXRpb25WaWV3TW9kZWxGYWN0b3J5OiBDb252ZXJzYXRpb25WaWV3TW9kZWxGYWN0b3J5IiwibWFpbE9wZW5lZExpc3RlbmVyOiBNYWlsT3BlbmVkTGlzdGVuZXIiLCJjb252ZXJzYXRpb25QcmVmUHJvdmlkZXI6IENvbnZlcnNhdGlvblByZWZQcm92aWRlciIsImluYm94UnVsZUhhbmRsZXI6IEluYm94UnVsZUhhbmRsZXIiLCJyb3V0ZXI6IFJvdXRlciIsInVwZGF0ZVVpOiAoKSA9PiB1bmtub3duIiwiZmlsdGVyOiBNYWlsRmlsdGVyVHlwZSB8IG51bGwiLCJtYWlsc2V0SWQ/OiBJZCIsIm1haWxJZD86IElkIiwiZnVsbE1haWxJZDogSWRUdXBsZSIsIm9uTWlzc2luZ0V4cGxpY2l0TWFpbFRhcmdldDogKCkgPT4gdW5rbm93biIsInN0aWNreU1haWxJZDogSWRUdXBsZSIsImZvbGRlcj86IE1haWxGb2xkZXIgfCBudWxsIiwiZm9sZGVyQXJndW1lbnQ6IE1haWxGb2xkZXIgfCBudWxsIiwibGlzdElkOiBJZCIsIm1haWxJZDogSWQiLCJvbk1pc3NpbmdUYXJnZXRFbWFpbDogKCkgPT4gdW5rbm93biIsImV4cGVjdGVkU3RpY2t5TWFpbElkOiBJZFR1cGxlIiwibWFpbDogTWFpbCB8IG51bGwiLCJtYWlsOiBNYWlsIiwiZXhwZWN0ZWRJZDogSWRUdXBsZSIsIm1lc3NhZ2U6IHN0cmluZyIsImZvbGRlcjogTWFpbEZvbGRlciIsIl9mb2xkZXJJZDogSWQiLCJpdGVtc1doZW5DYWxsZWQ6IFJlYWRvbmx5QXJyYXk8TWFpbD4iLCJuZXdTdGF0ZTogTGlzdFN0YXRlPE1haWw+IiwicGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiIsInZpZXdNb2RlbFBhcmFtczogQ3JlYXRlTWFpbFZpZXdlck9wdGlvbnMiLCJ1cGRhdGVzOiBSZWFkb25seUFycmF5PEVudGl0eVVwZGF0ZURhdGE+IiwiaW1wb3J0TWFpbFN0YXRlVXBkYXRlczogQXJyYXk8RW50aXR5VXBkYXRlRGF0YT4iLCJ1cGRhdGUiLCJ1cGRhdGU6IEVudGl0eVVwZGF0ZURhdGEiLCJpbXBvcnRlZE1haWxTZXRFbnRyaWVzOiBNYWlsU2V0RW50cnlbXSIsIm1haWxJZHMiLCJmb2xkZXJUeXBlOiBPbWl0PE1haWxTZXRLaW5kLCBNYWlsU2V0S2luZC5DVVNUT00+IiwiY2xlYXJTZWxlY3Rpb25Pbk11bHRpU2VsZWN0U3RhcnQ/OiBib29sZWFuIiwibXVsdGlzZWxlY3Q6IGJvb2xlYW4iLCJtYWlsYm94OiBNYWlsQm94IiwibGFiZWxEYXRhOiB7IG5hbWU6IHN0cmluZzsgY29sb3I6IHN0cmluZyB9IiwibGFiZWw6IE1haWxGb2xkZXIiLCJuZXdEYXRhOiB7IG5hbWU6IHN0cmluZzsgY29sb3I6IHN0cmluZyB9Il0sInNvdXJjZXMiOlsiLi4vc3JjL21haWwtYXBwL21haWwvbW9kZWwvTWFpbExpc3RNb2RlbC50cyIsIi4uL3NyYy9tYWlsLWFwcC9tYWlsL3ZpZXcvTWFpbFZpZXdNb2RlbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMaXN0RmlsdGVyLCBMaXN0TW9kZWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGlzdE1vZGVsXCJcbmltcG9ydCB7IE1haWwsIE1haWxGb2xkZXIsIE1haWxGb2xkZXJUeXBlUmVmLCBNYWlsU2V0RW50cnksIE1haWxTZXRFbnRyeVR5cGVSZWYsIE1haWxUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnNcIlxuaW1wb3J0IHtcblx0Q1VTVE9NX01BWF9JRCxcblx0Y3VzdG9tSWRUb1VpbnQ4YXJyYXksXG5cdGRlY29uc3RydWN0TWFpbFNldEVudHJ5SWQsXG5cdGVsZW1lbnRJZFBhcnQsXG5cdGdldEVsZW1lbnRJZCxcblx0aXNTYW1lSWQsXG5cdGxpc3RJZFBhcnQsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlsc1wiXG5pbXBvcnQgeyBFbnRpdHlDbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50XCJcbmltcG9ydCB7IENvbnZlcnNhdGlvblByZWZQcm92aWRlciB9IGZyb20gXCIuLi92aWV3L0NvbnZlcnNhdGlvblZpZXdNb2RlbFwiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsLCBjb21wYXJlLCBwcm9taXNlRmlsdGVyIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBMaXN0TG9hZGluZ1N0YXRlLCBMaXN0U3RhdGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0xpc3RcIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgRW50aXR5VXBkYXRlRGF0YSwgaXNVcGRhdGVGb3JUeXBlUmVmIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVVwZGF0ZVV0aWxzXCJcbmltcG9ydCB7IE1haWxTZXRLaW5kLCBPcGVyYXRpb25UeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IEluYm94UnVsZUhhbmRsZXIgfSBmcm9tIFwiLi9JbmJveFJ1bGVIYW5kbGVyXCJcbmltcG9ydCB7IE1haWxNb2RlbCB9IGZyb20gXCIuL01haWxNb2RlbFwiXG5pbXBvcnQgeyBMaXN0RmV0Y2hSZXN1bHQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0xpc3RVdGlsc1wiXG5pbXBvcnQgeyBpc09mZmxpbmVFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FcnJvclV0aWxzXCJcbmltcG9ydCB7IEV4cG9zZWRDYWNoZVN0b3JhZ2UgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvcmVzdC9EZWZhdWx0RW50aXR5UmVzdENhY2hlXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5cbi8qKlxuICogSW50ZXJuYWwgcmVwcmVzZW50YXRpb24gb2YgYSBsb2FkZWQgbWFpbFxuICpcbiAqIEBWaXNpYmxlRm9yVGVzdGluZ1xuICovXG5leHBvcnQgaW50ZXJmYWNlIExvYWRlZE1haWwge1xuXHRyZWFkb25seSBtYWlsOiBNYWlsXG5cdHJlYWRvbmx5IG1haWxTZXRFbnRyeTogTWFpbFNldEVudHJ5XG5cdHJlYWRvbmx5IGxhYmVsczogUmVhZG9ubHlBcnJheTxNYWlsRm9sZGVyPlxufVxuXG4vKipcbiAqIEhhbmRsZXMgZmV0Y2hpbmcgYW5kIHJlc29sdmluZyBtYWlsIHNldCBlbnRyaWVzIGludG8gbWFpbHMgYXMgd2VsbCBhcyBoYW5kbGluZyBzb3J0aW5nLlxuICovXG5leHBvcnQgY2xhc3MgTWFpbExpc3RNb2RlbCB7XG5cdC8vIElkID0gTWFpbFNldEVudHJ5IGVsZW1lbnQgaWRcblx0cHJpdmF0ZSByZWFkb25seSBsaXN0TW9kZWw6IExpc3RNb2RlbDxMb2FkZWRNYWlsLCBJZD5cblxuXHQvLyBrZWVwIGEgcmV2ZXJzZSBtYXAgZm9yIGdvaW5nIGZyb20gTWFpbCBlbGVtZW50IGlkIC0+IExvYWRlZE1haWxcblx0cHJpdmF0ZSByZWFkb25seSBtYWlsTWFwOiBNYXA8SWQsIExvYWRlZE1haWw+ID0gbmV3IE1hcCgpXG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSBtYWlsU2V0OiBNYWlsRm9sZGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY29udmVyc2F0aW9uUHJlZlByb3ZpZGVyOiBDb252ZXJzYXRpb25QcmVmUHJvdmlkZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBlbnRpdHlDbGllbnQ6IEVudGl0eUNsaWVudCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IG1haWxNb2RlbDogTWFpbE1vZGVsLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgaW5ib3hSdWxlSGFuZGxlcjogSW5ib3hSdWxlSGFuZGxlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNhY2hlU3RvcmFnZTogRXhwb3NlZENhY2hlU3RvcmFnZSxcblx0KSB7XG5cdFx0dGhpcy5saXN0TW9kZWwgPSBuZXcgTGlzdE1vZGVsKHtcblx0XHRcdGZldGNoOiAobGFzdEZldGNoZWRJdGVtLCBjb3VudCkgPT4ge1xuXHRcdFx0XHRjb25zdCBsYXN0RmV0Y2hlZElkID0gbGFzdEZldGNoZWRJdGVtPy5tYWlsU2V0RW50cnk/Ll9pZCA/PyBbbWFpbFNldC5lbnRyaWVzLCBDVVNUT01fTUFYX0lEXVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5sb2FkTWFpbHMobGFzdEZldGNoZWRJZCwgY291bnQpXG5cdFx0XHR9LFxuXG5cdFx0XHRzb3J0Q29tcGFyZTogKGl0ZW0xLCBpdGVtMikgPT4ge1xuXHRcdFx0XHQvLyBNYWlsIHNldCBlbnRyeSBJRCBoYXMgdGhlIHRpbWVzdGFtcCBhbmQgbWFpbCBlbGVtZW50IElEXG5cdFx0XHRcdGNvbnN0IGl0ZW0xSWQgPSBnZXRFbGVtZW50SWQoaXRlbTEubWFpbFNldEVudHJ5KVxuXHRcdFx0XHRjb25zdCBpdGVtMklkID0gZ2V0RWxlbWVudElkKGl0ZW0yLm1haWxTZXRFbnRyeSlcblxuXHRcdFx0XHQvLyBTb3J0IGluIHJldmVyc2Ugb3JkZXIgdG8gZW5zdXJlIG5ld2VyIG1haWxzIGFyZSBmaXJzdFxuXHRcdFx0XHRyZXR1cm4gY29tcGFyZShjdXN0b21JZFRvVWludDhhcnJheShpdGVtMklkKSwgY3VzdG9tSWRUb1VpbnQ4YXJyYXkoaXRlbTFJZCkpXG5cdFx0XHR9LFxuXG5cdFx0XHRnZXRJdGVtSWQ6IChpdGVtKSA9PiBnZXRFbGVtZW50SWQoaXRlbS5tYWlsU2V0RW50cnkpLFxuXG5cdFx0XHRpc1NhbWVJZDogKGlkMSwgaWQyKSA9PiBpZDEgPT09IGlkMixcblxuXHRcdFx0YXV0b1NlbGVjdEJlaGF2aW9yOiAoKSA9PiB0aGlzLmNvbnZlcnNhdGlvblByZWZQcm92aWRlci5nZXRNYWlsQXV0b1NlbGVjdEJlaGF2aW9yKCksXG5cdFx0fSlcblx0fVxuXG5cdGdldCBpdGVtcygpOiBNYWlsW10ge1xuXHRcdHJldHVybiB0aGlzLl9sb2FkZWRNYWlscygpLm1hcCgobWFpbCkgPT4gbWFpbC5tYWlsKVxuXHR9XG5cblx0Z2V0IGxvYWRpbmdTdGF0dXMoKTogTGlzdExvYWRpbmdTdGF0ZSB7XG5cdFx0cmV0dXJuIHRoaXMubGlzdE1vZGVsLnN0YXRlLmxvYWRpbmdTdGF0dXNcblx0fVxuXG5cdGdldCBzdGF0ZVN0cmVhbSgpOiBTdHJlYW08TGlzdFN0YXRlPE1haWw+PiB7XG5cdFx0cmV0dXJuIHRoaXMubGlzdE1vZGVsLnN0YXRlU3RyZWFtLm1hcCgoc3RhdGUpID0+IHtcblx0XHRcdGNvbnN0IGl0ZW1zID0gc3RhdGUuaXRlbXMubWFwKChpdGVtKSA9PiBpdGVtLm1haWwpXG5cdFx0XHRjb25zdCBzZWxlY3RlZEl0ZW1zOiBTZXQ8TWFpbD4gPSBuZXcgU2V0KClcblx0XHRcdGZvciAoY29uc3QgaXRlbSBvZiBzdGF0ZS5zZWxlY3RlZEl0ZW1zKSB7XG5cdFx0XHRcdHNlbGVjdGVkSXRlbXMuYWRkKGl0ZW0ubWFpbClcblx0XHRcdH1cblx0XHRcdGNvbnN0IG5ld1N0YXRlOiBMaXN0U3RhdGU8TWFpbD4gPSB7XG5cdFx0XHRcdC4uLnN0YXRlLFxuXHRcdFx0XHRpdGVtcyxcblx0XHRcdFx0c2VsZWN0ZWRJdGVtcyxcblx0XHRcdH1cblx0XHRcdHJldHVybiBuZXdTdGF0ZVxuXHRcdH0pXG5cdH1cblxuXHRpc0xvYWRpbmdBbGwoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMubGlzdE1vZGVsLnN0YXRlLmxvYWRpbmdBbGxcblx0fVxuXG5cdGlzSXRlbVNlbGVjdGVkKG1haWxJZDogSWQpOiBib29sZWFuIHtcblx0XHRjb25zdCBsb2FkZWRNYWlsID0gdGhpcy5tYWlsTWFwLmdldChtYWlsSWQpXG5cdFx0aWYgKGxvYWRlZE1haWwgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLmxpc3RNb2RlbC5pc0l0ZW1TZWxlY3RlZChnZXRFbGVtZW50SWQobG9hZGVkTWFpbC5tYWlsU2V0RW50cnkpKVxuXHR9XG5cblx0Z2V0TWFpbChtYWlsRWxlbWVudElkOiBJZCk6IE1haWwgfCBudWxsIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRMb2FkZWRNYWlsQnlNYWlsSWQobWFpbEVsZW1lbnRJZCk/Lm1haWwgPz8gbnVsbFxuXHR9XG5cblx0Z2V0TGFiZWxzRm9yTWFpbChtYWlsOiBNYWlsKTogUmVhZG9ubHlBcnJheTxNYWlsRm9sZGVyPiB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0TG9hZGVkTWFpbEJ5TWFpbEluc3RhbmNlKG1haWwpPy5sYWJlbHMgPz8gW11cblx0fVxuXG5cdGdldE1haWxTZXRFbnRyeShtYWlsU2V0RW50cnlJZDogSWQpOiBNYWlsU2V0RW50cnkgfCBudWxsIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRMb2FkZWRNYWlsQnlNYWlsU2V0SWQobWFpbFNldEVudHJ5SWQpPy5tYWlsU2V0RW50cnkgPz8gbnVsbFxuXHR9XG5cblx0YXN5bmMgbG9hZEFuZFNlbGVjdChtYWlsSWQ6IElkLCBzaG91bGRTdG9wOiAoKSA9PiBib29sZWFuKTogUHJvbWlzZTxNYWlsIHwgbnVsbD4ge1xuXHRcdGNvbnN0IG1haWxGaW5kZXIgPSAobG9hZGVkTWFpbDogTG9hZGVkTWFpbCkgPT4gaXNTYW1lSWQoZ2V0RWxlbWVudElkKGxvYWRlZE1haWwubWFpbCksIG1haWxJZClcblx0XHRjb25zdCBtYWlsID0gYXdhaXQgdGhpcy5saXN0TW9kZWwubG9hZEFuZFNlbGVjdChtYWlsRmluZGVyLCBzaG91bGRTdG9wKVxuXHRcdHJldHVybiBtYWlsPy5tYWlsID8/IG51bGxcblx0fVxuXG5cdG9uU2luZ2xlU2VsZWN0aW9uKG1haWw6IE1haWwpIHtcblx0XHR0aGlzLmxpc3RNb2RlbC5vblNpbmdsZVNlbGVjdGlvbihhc3NlcnROb3ROdWxsKHRoaXMuZ2V0TG9hZGVkTWFpbEJ5TWFpbEluc3RhbmNlKG1haWwpKSlcblx0fVxuXG5cdHNlbGVjdE5vbmUoKSB7XG5cdFx0dGhpcy5saXN0TW9kZWwuc2VsZWN0Tm9uZSgpXG5cdH1cblxuXHRjYW5jZWxMb2FkQWxsKCkge1xuXHRcdHRoaXMubGlzdE1vZGVsLmNhbmNlbExvYWRBbGwoKVxuXHR9XG5cblx0YXN5bmMgbG9hZEluaXRpYWwoKSB7XG5cdFx0YXdhaXQgdGhpcy5saXN0TW9kZWwubG9hZEluaXRpYWwoKVxuXHR9XG5cblx0Z2V0U2VsZWN0ZWRBc0FycmF5KCk6IEFycmF5PE1haWw+IHtcblx0XHRyZXR1cm4gdGhpcy5saXN0TW9kZWwuZ2V0U2VsZWN0ZWRBc0FycmF5KCkubWFwKCh7IG1haWwgfSkgPT4gbWFpbClcblx0fVxuXG5cdGFzeW5jIGhhbmRsZUVudGl0eVVwZGF0ZSh1cGRhdGU6IEVudGl0eVVwZGF0ZURhdGEpIHtcblx0XHRpZiAoaXNVcGRhdGVGb3JUeXBlUmVmKE1haWxGb2xkZXJUeXBlUmVmLCB1cGRhdGUpKSB7XG5cdFx0XHQvLyBJZiBhIGxhYmVsIGlzIG1vZGlmaWVkLCB3ZSB3YW50IHRvIHVwZGF0ZSBhbGwgbWFpbHMgdGhhdCByZWZlcmVuY2UgaXQsIHdoaWNoIHJlcXVpcmVzIGxpbmVhcmx5IGl0ZXJhdGluZ1xuXHRcdFx0Ly8gdGhyb3VnaCBhbGwgbWFpbHMuIFRoZXJlIGFyZSBtb3JlIGVmZmljaWVudCB3YXlzIHdlIGNvdWxkIGRvIHRoaXMsIHN1Y2ggYXMgYnkga2VlcGluZyB0cmFjayBvZiBlYWNoIGxhYmVsXG5cdFx0XHQvLyB3ZSd2ZSByZXRyaWV2ZWQgZnJvbSB0aGUgZGF0YWJhc2UgYW5kIGp1c3QgdXBkYXRlIHRoYXQsIGJ1dCB3ZSB3YW50IHRvIGF2b2lkIGFkZGluZyBtb3JlIG1hcHMgdGhhdCB3ZVxuXHRcdFx0Ly8gaGF2ZSB0byBtYWludGFpbi5cblx0XHRcdGlmICh1cGRhdGUub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLlVQREFURSkge1xuXHRcdFx0XHRjb25zdCBtYWlsU2V0SWQ6IElkVHVwbGUgPSBbdXBkYXRlLmluc3RhbmNlTGlzdElkLCB1cGRhdGUuaW5zdGFuY2VJZF1cblx0XHRcdFx0Zm9yIChjb25zdCBsb2FkZWRNYWlsIG9mIHRoaXMubWFpbE1hcC52YWx1ZXMoKSkge1xuXHRcdFx0XHRcdGNvbnN0IGhhc01haWxTZXQgPSBsb2FkZWRNYWlsLmxhYmVscy5zb21lKChsYWJlbCkgPT4gaXNTYW1lSWQobWFpbFNldElkLCBsYWJlbC5faWQpKVxuXHRcdFx0XHRcdGlmICghaGFzTWFpbFNldCkge1xuXHRcdFx0XHRcdFx0Y29udGludWVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gTWFpbE1vZGVsJ3MgZW50aXR5IGV2ZW50IGxpc3RlbmVyIHNob3VsZCBoYXZlIGJlZW4gZmlyZWQgZmlyc3Rcblx0XHRcdFx0XHRjb25zdCBsYWJlbHMgPSB0aGlzLm1haWxNb2RlbC5nZXRMYWJlbHNGb3JNYWlsKGxvYWRlZE1haWwubWFpbClcblx0XHRcdFx0XHRjb25zdCBuZXdNYWlsRW50cnkgPSB7XG5cdFx0XHRcdFx0XHQuLi5sb2FkZWRNYWlsLFxuXHRcdFx0XHRcdFx0bGFiZWxzLFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLl91cGRhdGVTaW5nbGVNYWlsKG5ld01haWxFbnRyeSlcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoaXNVcGRhdGVGb3JUeXBlUmVmKE1haWxTZXRFbnRyeVR5cGVSZWYsIHVwZGF0ZSkgJiYgaXNTYW1lSWQodGhpcy5tYWlsU2V0LmVudHJpZXMsIHVwZGF0ZS5pbnN0YW5jZUxpc3RJZCkpIHtcblx0XHRcdC8vIEFkZGluZy9yZW1vdmluZyB0byB0aGlzIGxpc3QgKE1haWxTZXRFbnRyeSBkb2Vzbid0IGhhdmUgYW55IGZpZWxkcyB0byB1cGRhdGUsIHNvIHdlIGRvbid0IG5lZWQgdG8gaGFuZGxlIHRoaXMpXG5cdFx0XHRpZiAodXBkYXRlLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5ERUxFVEUpIHtcblx0XHRcdFx0Y29uc3QgbWFpbCA9IHRoaXMuZ2V0TG9hZGVkTWFpbEJ5TWFpbFNldElkKHVwZGF0ZS5pbnN0YW5jZUlkKVxuXHRcdFx0XHRpZiAobWFpbCkge1xuXHRcdFx0XHRcdHRoaXMubWFpbE1hcC5kZWxldGUoZ2V0RWxlbWVudElkKG1haWwubWFpbCkpXG5cdFx0XHRcdH1cblx0XHRcdFx0YXdhaXQgdGhpcy5saXN0TW9kZWwuZGVsZXRlTG9hZGVkSXRlbSh1cGRhdGUuaW5zdGFuY2VJZClcblx0XHRcdH0gZWxzZSBpZiAodXBkYXRlLm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5DUkVBVEUpIHtcblx0XHRcdFx0Y29uc3QgbG9hZGVkTWFpbCA9IGF3YWl0IHRoaXMubG9hZFNpbmdsZU1haWwoW3VwZGF0ZS5pbnN0YW5jZUxpc3RJZCwgdXBkYXRlLmluc3RhbmNlSWRdKVxuXHRcdFx0XHRhd2FpdCB0aGlzLmxpc3RNb2RlbC53YWl0TG9hZChhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHRoaXMubGlzdE1vZGVsLmNhbkluc2VydEl0ZW0obG9hZGVkTWFpbCkpIHtcblx0XHRcdFx0XHRcdHRoaXMubGlzdE1vZGVsLmluc2VydExvYWRlZEl0ZW0obG9hZGVkTWFpbClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChpc1VwZGF0ZUZvclR5cGVSZWYoTWFpbFR5cGVSZWYsIHVwZGF0ZSkpIHtcblx0XHRcdC8vIFdlIG9ubHkgbmVlZCB0byBoYW5kbGUgdXBkYXRlcyBmb3IgTWFpbC5cblx0XHRcdC8vIE1haWwgZGVsZXRpb24gd2lsbCBhbHNvIGJlIGhhbmRsZWQgaW4gTWFpbFNldEVudHJ5IGRlbGV0ZS9jcmVhdGUuXG5cdFx0XHRjb25zdCBtYWlsSXRlbSA9IHRoaXMubWFpbE1hcC5nZXQodXBkYXRlLmluc3RhbmNlSWQpXG5cdFx0XHRpZiAobWFpbEl0ZW0gIT0gbnVsbCAmJiB1cGRhdGUub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLlVQREFURSkge1xuXHRcdFx0XHRjb25zdCBuZXdNYWlsRGF0YSA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoTWFpbFR5cGVSZWYsIFt1cGRhdGUuaW5zdGFuY2VMaXN0SWQsIHVwZGF0ZS5pbnN0YW5jZUlkXSlcblx0XHRcdFx0Y29uc3QgbGFiZWxzID0gdGhpcy5tYWlsTW9kZWwuZ2V0TGFiZWxzRm9yTWFpbChuZXdNYWlsRGF0YSkgLy8gaW4gY2FzZSBsYWJlbHMgd2VyZSBhZGRlZC9yZW1vdmVkXG5cdFx0XHRcdGNvbnN0IG5ld01haWxJdGVtID0ge1xuXHRcdFx0XHRcdC4uLm1haWxJdGVtLFxuXHRcdFx0XHRcdGxhYmVscyxcblx0XHRcdFx0XHRtYWlsOiBuZXdNYWlsRGF0YSxcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLl91cGRhdGVTaW5nbGVNYWlsKG5ld01haWxJdGVtKVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGFyZUFsbFNlbGVjdGVkKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmxpc3RNb2RlbC5hcmVBbGxTZWxlY3RlZCgpXG5cdH1cblxuXHRzZWxlY3RBbGwoKSB7XG5cdFx0dGhpcy5saXN0TW9kZWwuc2VsZWN0QWxsKClcblx0fVxuXG5cdG9uU2luZ2xlSW5jbHVzaXZlU2VsZWN0aW9uKG1haWw6IE1haWwsIGNsZWFyU2VsZWN0aW9uT25NdWx0aVNlbGVjdFN0YXJ0PzogYm9vbGVhbikge1xuXHRcdHRoaXMubGlzdE1vZGVsLm9uU2luZ2xlSW5jbHVzaXZlU2VsZWN0aW9uKGFzc2VydE5vdE51bGwodGhpcy5nZXRMb2FkZWRNYWlsQnlNYWlsSW5zdGFuY2UobWFpbCkpLCBjbGVhclNlbGVjdGlvbk9uTXVsdGlTZWxlY3RTdGFydClcblx0fVxuXG5cdHNlbGVjdFJhbmdlVG93YXJkcyhtYWlsOiBNYWlsKSB7XG5cdFx0dGhpcy5saXN0TW9kZWwuc2VsZWN0UmFuZ2VUb3dhcmRzKGFzc2VydE5vdE51bGwodGhpcy5nZXRMb2FkZWRNYWlsQnlNYWlsSW5zdGFuY2UobWFpbCkpKVxuXHR9XG5cblx0c2VsZWN0UHJldmlvdXMobXVsdGlzZWxlY3Q6IGJvb2xlYW4pIHtcblx0XHR0aGlzLmxpc3RNb2RlbC5zZWxlY3RQcmV2aW91cyhtdWx0aXNlbGVjdClcblx0fVxuXG5cdHNlbGVjdE5leHQobXVsdGlzZWxlY3Q6IGJvb2xlYW4pIHtcblx0XHR0aGlzLmxpc3RNb2RlbC5zZWxlY3ROZXh0KG11bHRpc2VsZWN0KVxuXHR9XG5cblx0b25TaW5nbGVFeGNsdXNpdmVTZWxlY3Rpb24obWFpbDogTWFpbCkge1xuXHRcdHRoaXMubGlzdE1vZGVsLm9uU2luZ2xlRXhjbHVzaXZlU2VsZWN0aW9uKGFzc2VydE5vdE51bGwodGhpcy5nZXRMb2FkZWRNYWlsQnlNYWlsSW5zdGFuY2UobWFpbCkpKVxuXHR9XG5cblx0aXNJbk11bHRpc2VsZWN0KCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmxpc3RNb2RlbC5zdGF0ZS5pbk11bHRpc2VsZWN0XG5cdH1cblxuXHRlbnRlck11bHRpc2VsZWN0KCkge1xuXHRcdHRoaXMubGlzdE1vZGVsLmVudGVyTXVsdGlzZWxlY3QoKVxuXHR9XG5cblx0YXN5bmMgbG9hZEFsbCgpIHtcblx0XHRhd2FpdCB0aGlzLmxpc3RNb2RlbC5sb2FkQWxsKClcblx0fVxuXG5cdHNldEZpbHRlcihmaWx0ZXI6IExpc3RGaWx0ZXI8TWFpbD4gfCBudWxsKSB7XG5cdFx0dGhpcy5saXN0TW9kZWwuc2V0RmlsdGVyKGZpbHRlciAmJiAoKGxvYWRlZE1haWw6IExvYWRlZE1haWwpID0+IGZpbHRlcihsb2FkZWRNYWlsLm1haWwpKSlcblx0fVxuXG5cdGlzRW1wdHlBbmREb25lKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmxpc3RNb2RlbC5pc0VtcHR5QW5kRG9uZSgpXG5cdH1cblxuXHRhc3luYyBsb2FkTW9yZSgpIHtcblx0XHRhd2FpdCB0aGlzLmxpc3RNb2RlbC5sb2FkTW9yZSgpXG5cdH1cblxuXHRhc3luYyByZXRyeUxvYWRpbmcoKSB7XG5cdFx0YXdhaXQgdGhpcy5saXN0TW9kZWwucmV0cnlMb2FkaW5nKClcblx0fVxuXG5cdHN0b3BMb2FkaW5nKCkge1xuXHRcdHRoaXMubGlzdE1vZGVsLnN0b3BMb2FkaW5nKClcblx0fVxuXG5cdHByaXZhdGUgZ2V0TG9hZGVkTWFpbEJ5TWFpbElkKG1haWxJZDogSWQpOiBMb2FkZWRNYWlsIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMubWFpbE1hcC5nZXQobWFpbElkKSA/PyBudWxsXG5cdH1cblxuXHRwcml2YXRlIGdldExvYWRlZE1haWxCeU1haWxTZXRJZChtYWlsSWQ6IElkKTogTG9hZGVkTWFpbCB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLm1haWxNYXAuZ2V0KGRlY29uc3RydWN0TWFpbFNldEVudHJ5SWQobWFpbElkKS5tYWlsSWQpID8/IG51bGxcblx0fVxuXG5cdHByaXZhdGUgZ2V0TG9hZGVkTWFpbEJ5TWFpbEluc3RhbmNlKG1haWw6IE1haWwpOiBMb2FkZWRNYWlsIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0TG9hZGVkTWFpbEJ5TWFpbElkKGdldEVsZW1lbnRJZChtYWlsKSlcblx0fVxuXG5cdC8qKlxuXHQgKiBMb2FkIG1haWxzLCBhcHBseWluZyBpbmJveCBydWxlcyBhcyBuZWVkZWRcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgbG9hZE1haWxzKHN0YXJ0aW5nSWQ6IElkVHVwbGUsIGNvdW50OiBudW1iZXIpOiBQcm9taXNlPExpc3RGZXRjaFJlc3VsdDxMb2FkZWRNYWlsPj4ge1xuXHRcdGxldCBpdGVtczogTG9hZGVkTWFpbFtdID0gW11cblx0XHRsZXQgY29tcGxldGUgPSBmYWxzZVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IG1haWxTZXRFbnRyaWVzID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZFJhbmdlKE1haWxTZXRFbnRyeVR5cGVSZWYsIGxpc3RJZFBhcnQoc3RhcnRpbmdJZCksIGVsZW1lbnRJZFBhcnQoc3RhcnRpbmdJZCksIGNvdW50LCB0cnVlKVxuXG5cdFx0XHQvLyBDaGVjayBmb3IgY29tcGxldGVuZXNzIGJlZm9yZSBsb2FkaW5nL2ZpbHRlcmluZyBtYWlscywgYXMgd2UgbWF5IGVuZCB1cCB3aXRoIGV2ZW4gZmV3ZXIgbWFpbHMgdGhhbiByZXRyaWV2ZWQgaW4gZWl0aGVyIGNhc2Vcblx0XHRcdGNvbXBsZXRlID0gbWFpbFNldEVudHJpZXMubGVuZ3RoIDwgY291bnRcblx0XHRcdGlmIChtYWlsU2V0RW50cmllcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdGl0ZW1zID0gYXdhaXQgdGhpcy5yZXNvbHZlTWFpbFNldEVudHJpZXMobWFpbFNldEVudHJpZXMsIHRoaXMuZGVmYXVsdE1haWxQcm92aWRlcilcblx0XHRcdFx0aXRlbXMgPSBhd2FpdCB0aGlzLmFwcGx5SW5ib3hSdWxlc1RvRW50cmllcyhpdGVtcylcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoaXNPZmZsaW5lRXJyb3IoZSkpIHtcblx0XHRcdFx0Ly8gQXR0ZW1wdCBsb2FkaW5nIGZyb20gdGhlIGNhY2hlIGlmIHdlIGZhaWxlZCB0byBnZXQgbWFpbHMgYW5kL29yIG1haWxzZXQgZW50cmllc1xuXHRcdFx0XHQvLyBOb3RlIHRoYXQgd2UgbWF5IGhhdmUgaXRlbXMgaWYgaXQgd2FzIGp1c3QgaW5ib3ggcnVsZXMgdGhhdCBmYWlsZWRcblx0XHRcdFx0aWYgKGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdC8vIFNldCB0aGUgcmVxdWVzdCBhcyBpbmNvbXBsZXRlIHNvIHRoYXQgd2UgbWFrZSBhbm90aGVyIHJlcXVlc3QgbGF0ZXIgKHNlZSBgbG9hZE1haWxzRnJvbUNhY2hlYCBjb21tZW50KVxuXHRcdFx0XHRcdGNvbXBsZXRlID0gZmFsc2Vcblx0XHRcdFx0XHRpdGVtcyA9IGF3YWl0IHRoaXMubG9hZE1haWxzRnJvbUNhY2hlKHN0YXJ0aW5nSWQsIGNvdW50KVxuXHRcdFx0XHRcdGlmIChpdGVtcy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRcdHRocm93IGUgLy8gd2UgY291bGRuJ3QgZ2V0IGFueXRoaW5nIGZyb20gdGhlIGNhY2hlIVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMudXBkYXRlTWFpbE1hcChpdGVtcylcblx0XHRyZXR1cm4ge1xuXHRcdFx0aXRlbXMsXG5cdFx0XHRjb21wbGV0ZSxcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogTG9hZCBtYWlscyBmcm9tIHRoZSBjYWNoZSByYXRoZXIgdGhhbiByZW1vdGVseVxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBsb2FkTWFpbHNGcm9tQ2FjaGUoc3RhcnRJZDogSWRUdXBsZSwgY291bnQ6IG51bWJlcik6IFByb21pc2U8TG9hZGVkTWFpbFtdPiB7XG5cdFx0Ly8gVGhlIHdheSB0aGUgY2FjaGUgd29ya3MgaXMgdGhhdCBpdCB0cmllcyB0byBmdWxmaWxsIHRoZSBBUEkgY29udHJhY3Qgb2YgcmV0dXJuaW5nIGFzIG1hbnkgaXRlbXMgYXMgcmVxdWVzdGVkIGFzIGxvbmcgYXMgaXQgY2FuLlxuXHRcdC8vIFRoaXMgaXMgcHJvYmxlbWF0aWMgZm9yIG9mZmxpbmUgd2hlcmUgd2UgbWlnaHQgbm90IGhhdmUgdGhlIGZ1bGwgcGFnZSBvZiBlbWFpbHMgbG9hZGVkIChlLmcuIHdlIGRlbGV0ZSBwYXJ0IGFzIGl0J3MgdG9vIG9sZCwgb3Igd2UgbW92ZSBlbWFpbHNcblx0XHQvLyBhcm91bmQpLiBCZWNhdXNlIG9mIHRoYXQgY2FjaGUgd2lsbCB0cnkgdG8gbG9hZCBhZGRpdGlvbmFsIGl0ZW1zIGZyb20gdGhlIHNlcnZlciBpbiBvcmRlciB0byByZXR1cm4gYGNvdW50YCBpdGVtcy4gSWYgaXQgZmFpbHMgdG8gbG9hZCB0aGVtLFxuXHRcdC8vIGl0IHdpbGwgbm90IHJldHVybiBhbnl0aGluZyBhbmQgaW5zdGVhZCB3aWxsIHRocm93IGFuIGVycm9yLlxuXHRcdC8vIFRoaXMgaXMgZ2VuZXJhbGx5IGZpbmUgYnV0IGluIGNhc2Ugb2Ygb2ZmbGluZSB3ZSB3YW50IHRvIGRpc3BsYXkgZXZlcnl0aGluZyB0aGF0IHdlIGhhdmUgY2FjaGVkLiBGb3IgdGhhdCB3ZSBmZXRjaCBkaXJlY3RseSBmcm9tIHRoZSBjYWNoZSxcblx0XHQvLyBnaXZlIGl0IHRvIHRoZSBsaXN0IGFuZCBsZXQgbGlzdCBtYWtlIGFub3RoZXIgcmVxdWVzdCAoYW5kIGFsbW9zdCBjZXJ0YWlubHkgZmFpbCB0aGF0IHJlcXVlc3QpIHRvIHNob3cgYSByZXRyeSBidXR0b24uIFRoaXMgd2F5IHdlIGJvdGggc2hvd1xuXHRcdC8vIHRoZSBpdGVtcyB3ZSBoYXZlIGFuZCBhbHNvIHNob3cgdGhhdCB3ZSBjb3VsZG4ndCBsb2FkIGV2ZXJ5dGhpbmcuXG5cdFx0Y29uc3QgbWFpbFNldEVudHJpZXMgPSBhd2FpdCB0aGlzLmNhY2hlU3RvcmFnZS5wcm92aWRlRnJvbVJhbmdlKE1haWxTZXRFbnRyeVR5cGVSZWYsIGxpc3RJZFBhcnQoc3RhcnRJZCksIGVsZW1lbnRJZFBhcnQoc3RhcnRJZCksIGNvdW50LCB0cnVlKVxuXHRcdHJldHVybiBhd2FpdCB0aGlzLnJlc29sdmVNYWlsU2V0RW50cmllcyhtYWlsU2V0RW50cmllcywgKGxpc3QsIGVsZW1lbnRzKSA9PiB0aGlzLmNhY2hlU3RvcmFnZS5wcm92aWRlTXVsdGlwbGUoTWFpbFR5cGVSZWYsIGxpc3QsIGVsZW1lbnRzKSlcblx0fVxuXG5cdC8qKlxuXHQgKiBBcHBseSBpbmJveCBydWxlcyB0byBhbiBhcnJheSBvZiBtYWlscywgcmV0dXJuaW5nIGFsbCBtYWlscyB0aGF0IHdlcmUgbm90IG1vdmVkXG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGFwcGx5SW5ib3hSdWxlc1RvRW50cmllcyhlbnRyaWVzOiBMb2FkZWRNYWlsW10pOiBQcm9taXNlPExvYWRlZE1haWxbXT4ge1xuXHRcdGlmICh0aGlzLm1haWxTZXQuZm9sZGVyVHlwZSAhPT0gTWFpbFNldEtpbmQuSU5CT1ggfHwgZW50cmllcy5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybiBlbnRyaWVzXG5cdFx0fVxuXHRcdGNvbnN0IG1haWxib3hEZXRhaWwgPSBhd2FpdCB0aGlzLm1haWxNb2RlbC5nZXRNYWlsYm94RGV0YWlsc0Zvck1haWxGb2xkZXIodGhpcy5tYWlsU2V0KVxuXHRcdGlmICghbWFpbGJveERldGFpbCkge1xuXHRcdFx0cmV0dXJuIGVudHJpZXNcblx0XHR9XG5cdFx0cmV0dXJuIGF3YWl0IHByb21pc2VGaWx0ZXIoZW50cmllcywgYXN5bmMgKGVudHJ5KSA9PiB7XG5cdFx0XHRjb25zdCBydWxlQXBwbGllZCA9IGF3YWl0IHRoaXMuaW5ib3hSdWxlSGFuZGxlci5maW5kQW5kQXBwbHlNYXRjaGluZ1J1bGUobWFpbGJveERldGFpbCwgZW50cnkubWFpbCwgdHJ1ZSlcblx0XHRcdHJldHVybiBydWxlQXBwbGllZCA9PSBudWxsXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgbG9hZFNpbmdsZU1haWwoaWQ6IElkVHVwbGUpOiBQcm9taXNlPExvYWRlZE1haWw+IHtcblx0XHRjb25zdCBtYWlsU2V0RW50cnkgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKE1haWxTZXRFbnRyeVR5cGVSZWYsIGlkKVxuXHRcdGNvbnN0IGxvYWRlZE1haWxzID0gYXdhaXQgdGhpcy5yZXNvbHZlTWFpbFNldEVudHJpZXMoW21haWxTZXRFbnRyeV0sIHRoaXMuZGVmYXVsdE1haWxQcm92aWRlcilcblx0XHR0aGlzLnVwZGF0ZU1haWxNYXAobG9hZGVkTWFpbHMpXG5cdFx0cmV0dXJuIGFzc2VydE5vdE51bGwobG9hZGVkTWFpbHNbMF0pXG5cdH1cblxuXHQvKipcblx0ICogTG9hZHMgYWxsIE1haWwgaW5zdGFuY2VzIGZvciBlYWNoIE1haWxTZXRFbnRyeSwgcmV0dXJuaW5nIGEgdHVwbGUgb2YgZWFjaFxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyByZXNvbHZlTWFpbFNldEVudHJpZXMoXG5cdFx0bWFpbFNldEVudHJpZXM6IE1haWxTZXRFbnRyeVtdLFxuXHRcdG1haWxQcm92aWRlcjogKGxpc3RJZDogSWQsIGVsZW1lbnRJZHM6IElkW10pID0+IFByb21pc2U8TWFpbFtdPixcblx0KTogUHJvbWlzZTxMb2FkZWRNYWlsW10+IHtcblx0XHQvLyBTb3J0IGFsbCBtYWlscyBpbnRvIG1haWxiYWdzIHNvIHdlIGNhbiByZXRyaWV2ZSB0aGVtIHdpdGggbG9hZE11bHRpcGxlXG5cdFx0Y29uc3QgbWFpbExpc3RNYXA6IE1hcDxJZCwgSWRbXT4gPSBuZXcgTWFwKClcblx0XHRmb3IgKGNvbnN0IGVudHJ5IG9mIG1haWxTZXRFbnRyaWVzKSB7XG5cdFx0XHRjb25zdCBtYWlsQmFnID0gbGlzdElkUGFydChlbnRyeS5tYWlsKVxuXHRcdFx0Y29uc3QgbWFpbEVsZW1lbnRJZCA9IGVsZW1lbnRJZFBhcnQoZW50cnkubWFpbClcblx0XHRcdGxldCBtYWlsSWRzID0gbWFpbExpc3RNYXAuZ2V0KG1haWxCYWcpXG5cdFx0XHRpZiAoIW1haWxJZHMpIHtcblx0XHRcdFx0bWFpbElkcyA9IFtdXG5cdFx0XHRcdG1haWxMaXN0TWFwLnNldChtYWlsQmFnLCBtYWlsSWRzKVxuXHRcdFx0fVxuXHRcdFx0bWFpbElkcy5wdXNoKG1haWxFbGVtZW50SWQpXG5cdFx0fVxuXG5cdFx0Ly8gUmV0cmlldmUgYWxsIG1haWxzIGJ5IG1haWxiYWdcblx0XHRjb25zdCBhbGxNYWlsczogTWFwPElkLCBNYWlsPiA9IG5ldyBNYXAoKVxuXHRcdGZvciAoY29uc3QgW2xpc3QsIGVsZW1lbnRzXSBvZiBtYWlsTGlzdE1hcCkge1xuXHRcdFx0Y29uc3QgbWFpbHMgPSBhd2FpdCBtYWlsUHJvdmlkZXIobGlzdCwgZWxlbWVudHMpXG5cdFx0XHRmb3IgKGNvbnN0IG1haWwgb2YgbWFpbHMpIHtcblx0XHRcdFx0YWxsTWFpbHMuc2V0KGdldEVsZW1lbnRJZChtYWlsKSwgbWFpbClcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBCdWlsZCBvdXIgYXJyYXlcblx0XHRjb25zdCBsb2FkZWRNYWlsczogTG9hZGVkTWFpbFtdID0gW11cblx0XHRmb3IgKGNvbnN0IG1haWxTZXRFbnRyeSBvZiBtYWlsU2V0RW50cmllcykge1xuXHRcdFx0Y29uc3QgbWFpbCA9IGFsbE1haWxzLmdldChlbGVtZW50SWRQYXJ0KG1haWxTZXRFbnRyeS5tYWlsKSlcblxuXHRcdFx0Ly8gTWFpbCBtYXkgaGF2ZSBiZWVuIGRlbGV0ZWQgaW4gdGhlIG1lYW50aW1lXG5cdFx0XHRpZiAoIW1haWwpIHtcblx0XHRcdFx0Y29udGludWVcblx0XHRcdH1cblxuXHRcdFx0Ly8gUmVzb2x2ZSBsYWJlbHNcblx0XHRcdGNvbnN0IGxhYmVsczogTWFpbEZvbGRlcltdID0gdGhpcy5tYWlsTW9kZWwuZ2V0TGFiZWxzRm9yTWFpbChtYWlsKVxuXHRcdFx0bG9hZGVkTWFpbHMucHVzaCh7IG1haWxTZXRFbnRyeSwgbWFpbCwgbGFiZWxzIH0pXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGxvYWRlZE1haWxzXG5cdH1cblxuXHRwcml2YXRlIHVwZGF0ZU1haWxNYXAobWFpbHM6IExvYWRlZE1haWxbXSkge1xuXHRcdGZvciAoY29uc3QgbWFpbCBvZiBtYWlscykge1xuXHRcdFx0dGhpcy5tYWlsTWFwLnNldChnZXRFbGVtZW50SWQobWFpbC5tYWlsKSwgbWFpbClcblx0XHR9XG5cdH1cblxuXHQvLyBAVmlzaWJsZUZvclRlc3Rpbmdcblx0X3VwZGF0ZVNpbmdsZU1haWwobWFpbDogTG9hZGVkTWFpbCkge1xuXHRcdHRoaXMudXBkYXRlTWFpbE1hcChbbWFpbF0pXG5cdFx0dGhpcy5saXN0TW9kZWwudXBkYXRlTG9hZGVkSXRlbShtYWlsKVxuXHR9XG5cblx0Ly8gQFZpc2libGVGb3JUZXN0aW5nXG5cdF9sb2FkZWRNYWlscygpOiByZWFkb25seSBMb2FkZWRNYWlsW10ge1xuXHRcdHJldHVybiB0aGlzLmxpc3RNb2RlbC5zdGF0ZS5pdGVtc1xuXHR9XG5cblx0cHJpdmF0ZSByZWFkb25seSBkZWZhdWx0TWFpbFByb3ZpZGVyID0gKGxpc3RJZDogSWQsIGVsZW1lbnRzOiBJZFtdKTogUHJvbWlzZTxNYWlsW10+ID0+IHtcblx0XHRyZXR1cm4gdGhpcy5lbnRpdHlDbGllbnQubG9hZE11bHRpcGxlKE1haWxUeXBlUmVmLCBsaXN0SWQsIGVsZW1lbnRzKVxuXHR9XG59XG4iLCJpbXBvcnQgeyBNYWlsYm94RGV0YWlsLCBNYWlsYm94TW9kZWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L01haWxib3hNb2RlbC5qc1wiXG5pbXBvcnQgeyBFbnRpdHlDbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7XG5cdEltcG9ydGVkTWFpbFR5cGVSZWYsXG5cdEltcG9ydE1haWxTdGF0ZVR5cGVSZWYsXG5cdE1haWwsXG5cdE1haWxCb3gsXG5cdE1haWxGb2xkZXIsXG5cdE1haWxTZXRFbnRyeSxcblx0TWFpbFNldEVudHJ5VHlwZVJlZixcblx0TWFpbFR5cGVSZWYsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7XG5cdGRlY29uc3RydWN0TWFpbFNldEVudHJ5SWQsXG5cdGVsZW1lbnRJZFBhcnQsXG5cdGZpcnN0QmlnZ2VyVGhhblNlY29uZCxcblx0Z2V0RWxlbWVudElkLFxuXHRpc1NhbWVJZCxcblx0bGlzdElkUGFydCxcbn0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzLmpzXCJcbmltcG9ydCB7XG5cdGFzc2VydE5vdE51bGwsXG5cdGNvdW50LFxuXHRkZWJvdW5jZSxcblx0Zmlyc3QsXG5cdGdyb3VwQnksXG5cdGlzTm90RW1wdHksXG5cdGxhc3RUaHJvdyxcblx0bGF6eU1lbW9pemVkLFxuXHRtYXBXaXRoLFxuXHRtYXBXaXRob3V0LFxuXHRtZW1vaXplZCxcblx0b2ZDbGFzcyxcblx0cHJvbWlzZU1hcCxcbn0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBMaXN0U3RhdGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0xpc3QuanNcIlxuaW1wb3J0IHsgQ29udmVyc2F0aW9uUHJlZlByb3ZpZGVyLCBDb252ZXJzYXRpb25WaWV3TW9kZWwsIENvbnZlcnNhdGlvblZpZXdNb2RlbEZhY3RvcnkgfSBmcm9tIFwiLi9Db252ZXJzYXRpb25WaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgQ3JlYXRlTWFpbFZpZXdlck9wdGlvbnMgfSBmcm9tIFwiLi9NYWlsVmlld2VyLmpzXCJcbmltcG9ydCB7IGlzT2ZmbGluZUVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0Vycm9yVXRpbHMuanNcIlxuaW1wb3J0IHsgZ2V0TWFpbFNldEtpbmQsIEltcG9ydFN0YXR1cywgTWFpbFNldEtpbmQsIE9wZXJhdGlvblR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgV3NDb25uZWN0aW9uU3RhdGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL1dvcmtlckNsaWVudC5qc1wiXG5pbXBvcnQgeyBXZWJzb2NrZXRDb25uZWN0aXZpdHlNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9XZWJzb2NrZXRDb25uZWN0aXZpdHlNb2RlbC5qc1wiXG5pbXBvcnQgeyBFeHBvc2VkQ2FjaGVTdG9yYWdlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL3Jlc3QvRGVmYXVsdEVudGl0eVJlc3RDYWNoZS5qc1wiXG5pbXBvcnQgeyBOb3RBdXRob3JpemVkRXJyb3IsIE5vdEZvdW5kRXJyb3IsIFByZWNvbmRpdGlvbkZhaWxlZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvci5qc1wiXG5pbXBvcnQgeyBVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL1VzZXJFcnJvci5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IFN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsgSW5ib3hSdWxlSGFuZGxlciB9IGZyb20gXCIuLi9tb2RlbC9JbmJveFJ1bGVIYW5kbGVyLmpzXCJcbmltcG9ydCB7IFJvdXRlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL1Njb3BlZFJvdXRlci5qc1wiXG5pbXBvcnQgeyBFbnRpdHlVcGRhdGVEYXRhLCBpc1VwZGF0ZUZvclR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXBkYXRlVXRpbHMuanNcIlxuaW1wb3J0IHsgRXZlbnRDb250cm9sbGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9FdmVudENvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgTWFpbE1vZGVsIH0gZnJvbSBcIi4uL21vZGVsL01haWxNb2RlbC5qc1wiXG5pbXBvcnQgeyBhc3NlcnRTeXN0ZW1Gb2xkZXJPZlR5cGUgfSBmcm9tIFwiLi4vbW9kZWwvTWFpbFV0aWxzLmpzXCJcbmltcG9ydCB7IGdldE1haWxGaWx0ZXJGb3JUeXBlLCBNYWlsRmlsdGVyVHlwZSB9IGZyb20gXCIuL01haWxWaWV3ZXJVdGlscy5qc1wiXG5pbXBvcnQgeyBDYWNoZU1vZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvcmVzdC9FbnRpdHlSZXN0Q2xpZW50LmpzXCJcbmltcG9ydCB7IGlzT2ZUeXBlT3JTdWJmb2xkZXJPZiwgaXNTcGFtT3JUcmFzaEZvbGRlciwgaXNTdWJmb2xkZXJPZlR5cGUgfSBmcm9tIFwiLi4vbW9kZWwvTWFpbENoZWNrcy5qc1wiXG5pbXBvcnQgeyBNYWlsTGlzdE1vZGVsIH0gZnJvbSBcIi4uL21vZGVsL01haWxMaXN0TW9kZWxcIlxuXG5leHBvcnQgaW50ZXJmYWNlIE1haWxPcGVuZWRMaXN0ZW5lciB7XG5cdG9uRW1haWxPcGVuZWQobWFpbDogTWFpbCk6IHVua25vd25cbn1cblxuY29uc3QgVEFHID0gXCJNYWlsVk1cIlxuXG4vKiogVmlld01vZGVsIGZvciB0aGUgb3ZlcmFsbCBtYWlsIHZpZXcuICovXG5leHBvcnQgY2xhc3MgTWFpbFZpZXdNb2RlbCB7XG5cdHByaXZhdGUgX2ZvbGRlcjogTWFpbEZvbGRlciB8IG51bGwgPSBudWxsXG5cdC8qKiBpZCBvZiB0aGUgbWFpbCB0aGF0IHdhcyByZXF1ZXN0ZWQgdG8gYmUgZGlzcGxheWVkLCBpbmRlcGVuZGVudCBvZiB0aGUgbGlzdCBzdGF0ZS4gKi9cblx0cHJpdmF0ZSBzdGlja3lNYWlsSWQ6IElkVHVwbGUgfCBudWxsID0gbnVsbFxuXHQvKipcblx0ICogV2hlbiB0aGUgVVJMIGNvbnRhaW5zIGJvdGggZm9sZGVyIGlkIGFuZCBtYWlsIGlkIHdlIHdpbGwgdHJ5IHRvIHNlbGVjdCB0aGF0IG1haWwgYnV0IHdlIG1pZ2h0IG5lZWQgdG8gbG9hZCB0aGUgbGlzdCB1bnRpbCB3ZSBmaW5kIGl0LlxuXHQgKiBUaGlzIGlzIHRoYXQgbWFpbCBpZCB0aGF0IHdlIGFyZSBsb2FkaW5nLlxuXHQgKi9cblx0cHJpdmF0ZSBsb2FkaW5nVGFyZ2V0SWQ6IElkIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBjb252ZXJzYXRpb25WaWV3TW9kZWw6IENvbnZlcnNhdGlvblZpZXdNb2RlbCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgX2ZpbHRlclR5cGU6IE1haWxGaWx0ZXJUeXBlIHwgbnVsbCA9IG51bGxcblxuXHQvKipcblx0ICogV2UgcmVtZW1iZXIgdGhlIGxhc3QgVVJMIHVzZWQgZm9yIGVhY2ggZm9sZGVyIHNvIGlmIHdlIHN3aXRjaCBiZXR3ZWVuIGZvbGRlcnMgd2UgY2FuIGtlZXAgdGhlIHNlbGVjdGVkIG1haWwuXG5cdCAqIFRoZXJlJ3MgYSBzaW1pbGFyIChidXQgZGlmZmVyZW50KSBoYWNreSBtZWNoYW5pc20gd2hlcmUgd2Ugc3RvcmUgbGFzdCBVUkwgYnV0IHBlciBlYWNoIHRvcC1sZXZlbCB2aWV3OiBuYXZCdXR0b25Sb3V0ZXMuIFRoaXMgb25lIGlzIHBlciBmb2xkZXIuXG5cdCAqL1xuXHRwcml2YXRlIG1haWxGb2xkZXJFbGVtZW50SWRUb1NlbGVjdGVkTWFpbElkOiBSZWFkb25seU1hcDxJZCwgSWQ+ID0gbmV3IE1hcCgpXG5cdHByaXZhdGUgbGlzdFN0cmVhbVN1YnNjcmlwdGlvbjogU3RyZWFtPHVua25vd24+IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBjb252ZXJzYXRpb25QcmVmOiBib29sZWFuID0gZmFsc2Vcblx0LyoqIEEgc2xpZ2h0bHkgaGFja3kgbWFya2VyIHRvIGF2b2lkIGNvbmN1cnJlbnQgVVJMIHVwZGF0ZXMuICovXG5cdHByaXZhdGUgY3VycmVudFNob3dUYXJnZXRNYXJrZXI6IG9iamVjdCA9IHt9XG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSBtYWlsYm94TW9kZWw6IE1haWxib3hNb2RlbCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IG1haWxNb2RlbDogTWFpbE1vZGVsLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBldmVudENvbnRyb2xsZXI6IEV2ZW50Q29udHJvbGxlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNvbm5lY3Rpdml0eU1vZGVsOiBXZWJzb2NrZXRDb25uZWN0aXZpdHlNb2RlbCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNhY2hlU3RvcmFnZTogRXhwb3NlZENhY2hlU3RvcmFnZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNvbnZlcnNhdGlvblZpZXdNb2RlbEZhY3Rvcnk6IENvbnZlcnNhdGlvblZpZXdNb2RlbEZhY3RvcnksXG5cdFx0cHJpdmF0ZSByZWFkb25seSBtYWlsT3BlbmVkTGlzdGVuZXI6IE1haWxPcGVuZWRMaXN0ZW5lcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNvbnZlcnNhdGlvblByZWZQcm92aWRlcjogQ29udmVyc2F0aW9uUHJlZlByb3ZpZGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgaW5ib3hSdWxlSGFuZGxlcjogSW5ib3hSdWxlSGFuZGxlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IHJvdXRlcjogUm91dGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgdXBkYXRlVWk6ICgpID0+IHVua25vd24sXG5cdCkge31cblxuXHRnZXRTZWxlY3RlZE1haWxTZXRLaW5kKCk6IE1haWxTZXRLaW5kIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuX2ZvbGRlciA/IGdldE1haWxTZXRLaW5kKHRoaXMuX2ZvbGRlcikgOiBudWxsXG5cdH1cblxuXHRnZXQgZmlsdGVyVHlwZSgpOiBNYWlsRmlsdGVyVHlwZSB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLl9maWx0ZXJUeXBlXG5cdH1cblxuXHRzZXRGaWx0ZXIoZmlsdGVyOiBNYWlsRmlsdGVyVHlwZSB8IG51bGwpIHtcblx0XHR0aGlzLl9maWx0ZXJUeXBlID0gZmlsdGVyXG5cdFx0dGhpcy5saXN0TW9kZWw/LnNldEZpbHRlcihnZXRNYWlsRmlsdGVyRm9yVHlwZShmaWx0ZXIpKVxuXHR9XG5cblx0YXN5bmMgc2hvd01haWxXaXRoTWFpbFNldElkKG1haWxzZXRJZD86IElkLCBtYWlsSWQ/OiBJZCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHNob3dNYWlsTWFya2VyID0ge31cblx0XHR0aGlzLmN1cnJlbnRTaG93VGFyZ2V0TWFya2VyID0gc2hvd01haWxNYXJrZXJcblx0XHRpZiAobWFpbHNldElkKSB7XG5cdFx0XHRjb25zdCBtYWlsc2V0ID0gYXdhaXQgdGhpcy5tYWlsTW9kZWwuZ2V0TWFpbFNldEJ5SWQobWFpbHNldElkKVxuXHRcdFx0aWYgKHNob3dNYWlsTWFya2VyICE9PSB0aGlzLmN1cnJlbnRTaG93VGFyZ2V0TWFya2VyKSB7XG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXHRcdFx0aWYgKG1haWxzZXQpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuc2hvd01haWwobWFpbHNldCwgbWFpbElkKVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5zaG93TWFpbChudWxsLCBtYWlsSWQpXG5cdH1cblxuXHRhc3luYyBzaG93U3RpY2t5TWFpbChmdWxsTWFpbElkOiBJZFR1cGxlLCBvbk1pc3NpbmdFeHBsaWNpdE1haWxUYXJnZXQ6ICgpID0+IHVua25vd24pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBbbGlzdElkLCBlbGVtZW50SWRdID0gZnVsbE1haWxJZFxuXHRcdC8vIElmIHdlIGFyZSBhbHJlYWR5IGRpc3BsYXlpbmcgdGhlIHJlcXVlc3RlZCBlbWFpbCwgZG8gbm90aGluZ1xuXHRcdGlmICh0aGlzLmNvbnZlcnNhdGlvblZpZXdNb2RlbCAmJiBpc1NhbWVJZCh0aGlzLmNvbnZlcnNhdGlvblZpZXdNb2RlbC5wcmltYXJ5TWFpbC5faWQsIGVsZW1lbnRJZCkpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHRpZiAoaXNTYW1lSWQodGhpcy5zdGlja3lNYWlsSWQsIGZ1bGxNYWlsSWQpKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHRjb25zb2xlLmxvZyhUQUcsIFwiTG9hZGluZyBzdGlja3kgbWFpbFwiLCBsaXN0SWQsIGVsZW1lbnRJZClcblx0XHR0aGlzLnN0aWNreU1haWxJZCA9IGZ1bGxNYWlsSWRcblxuXHRcdC8vIFRoaXMgc2hvdWxkIGJlIHZlcnkgcXVpY2sgYXMgd2Ugb25seSB3YWl0IGZvciB0aGUgY2FjaGUsXG5cdFx0YXdhaXQgdGhpcy5sb2FkRXhwbGljaXRNYWlsVGFyZ2V0KGxpc3RJZCwgZWxlbWVudElkLCBvbk1pc3NpbmdFeHBsaWNpdE1haWxUYXJnZXQpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHJlc2V0T3JJbml0aWFsaXplTGlzdChzdGlja3lNYWlsSWQ6IElkVHVwbGUpIHtcblx0XHRpZiAodGhpcy5fZm9sZGVyICE9IG51bGwpIHtcblx0XHRcdC8vIElmIHdlIGFscmVhZHkgaGF2ZSBhIGZvbGRlciwgZGVzZWxlY3QuXG5cdFx0XHR0aGlzLmxpc3RNb2RlbD8uc2VsZWN0Tm9uZSgpXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIE90aGVyd2lzZSwgbG9hZCB0aGUgaW5ib3ggc28gdGhhdCBpdCB3b24ndCBiZSBlbXB0eSBvbiBtb2JpbGUgd2hlbiB5b3UgdHJ5IHRvIGdvIGJhY2suXG5cdFx0XHRjb25zdCB1c2VySW5ib3ggPSBhd2FpdCB0aGlzLmdldEZvbGRlckZvclVzZXJJbmJveCgpXG5cblx0XHRcdGlmICh0aGlzLmRpZFN0aWNreU1haWxDaGFuZ2Uoc3RpY2t5TWFpbElkLCBcImFmdGVyIGxvYWRpbmcgdXNlciBpbmJveCBJRFwiKSkge1xuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblxuXHRcdFx0dGhpcy5zZXRMaXN0SWQodXNlckluYm94KVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2hvd01haWwoZm9sZGVyPzogTWFpbEZvbGRlciB8IG51bGwsIG1haWxJZD86IElkKSB7XG5cdFx0Ly8gYW4gb3B0aW1pemF0aW9uIHRvIG5vdCBvcGVuIGFuIGVtYWlsIHRoYXQgd2UgYWxyZWFkeSBkaXNwbGF5XG5cdFx0aWYgKGZvbGRlciAhPSBudWxsICYmIG1haWxJZCAhPSBudWxsICYmIHRoaXMuY29udmVyc2F0aW9uVmlld01vZGVsICYmIGlzU2FtZUlkKGVsZW1lbnRJZFBhcnQodGhpcy5jb252ZXJzYXRpb25WaWV3TW9kZWwucHJpbWFyeU1haWwuX2lkKSwgbWFpbElkKSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdC8vIElmIHdlIGFyZSBhbHJlYWR5IGxvYWRpbmcgdG93YXJkcyB0aGUgZW1haWwgdGhhdCBpcyBwYXNzZWQgdG8gdXMgaW4gdGhlIFVSTCB0aGVuIHdlIGRvbid0IG5lZWQgdG8gZG8gYW55dGhpbmcuIFdlIGFscmVhZHkgdXBkYXRlZCBVUkwgb24gdGhlXG5cdFx0Ly8gcHJldmlvdXMgY2FsbC5cblx0XHRpZiAoXG5cdFx0XHRmb2xkZXIgIT0gbnVsbCAmJlxuXHRcdFx0bWFpbElkICE9IG51bGwgJiZcblx0XHRcdHRoaXMuX2ZvbGRlciAmJlxuXHRcdFx0dGhpcy5sb2FkaW5nVGFyZ2V0SWQgJiZcblx0XHRcdGlzU2FtZUlkKGZvbGRlci5faWQsIHRoaXMuX2ZvbGRlci5faWQpICYmXG5cdFx0XHRpc1NhbWVJZCh0aGlzLmxvYWRpbmdUYXJnZXRJZCwgbWFpbElkKVxuXHRcdCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Y29uc29sZS5sb2coVEFHLCBcInNob3dNYWlsXCIsIGZvbGRlcj8uX2lkLCBtYWlsSWQpXG5cblx0XHQvLyBpbXBvcnRhbnQ6IHRvIHNldCBpdCBlYXJseSBlbm91Z2ggYmVjYXVzZSBzZXR0aW5nIGxpc3RJZCB3aWxsIHRyaWdnZXIgVVJMIHVwZGF0ZS5cblx0XHQvLyBpZiB3ZSBkb24ndCBzZXQgdGhpcyBvbmUgYmVmb3JlIHNldExpc3RJZCwgdXJsIHVwZGF0ZSB3aWxsIGNhdXNlIHRoaXMgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIGFnYWluIGJ1dCB3aXRob3V0IHRhcmdldCBtYWlsLCBhbmQgd2Ugd2lsbCBsb3NlIHRoZVxuXHRcdC8vIHRhcmdldCBpZFxuXHRcdGNvbnN0IGxvYWRpbmdUYXJnZXRJZCA9IG1haWxJZCA/PyBudWxsXG5cdFx0dGhpcy5sb2FkaW5nVGFyZ2V0SWQgPSBsb2FkaW5nVGFyZ2V0SWRcblxuXHRcdC8vIGlmIHRoZSBVUkwgaGFzIGNoYW5nZWQgdGhlbiB3ZSBwcm9iYWJseSB3YW50IHRvIHJlc2V0IHRoZSBleHBsaWNpdGx5IHNob3duIGVtYWlsXG5cdFx0dGhpcy5zdGlja3lNYWlsSWQgPSBudWxsXG5cblx0XHRjb25zdCBmb2xkZXJUb1VzZSA9IGF3YWl0IHRoaXMuc2VsZWN0Rm9sZGVyVG9Vc2UoZm9sZGVyID8/IG51bGwpXG5cdFx0Ly8gU2VsZWN0aW5nIGZvbGRlciBpcyBhc3luYywgY2hlY2sgdGhhdCB0aGUgdGFyZ2V0IGhhc24ndCBjaGFuZ2VkIGluYmV0d2VlblxuXHRcdGlmICh0aGlzLmxvYWRpbmdUYXJnZXRJZCAhPT0gbG9hZGluZ1RhcmdldElkKSByZXR1cm5cblxuXHRcdC8vIFRoaXMgd2lsbCBjYXVzZSBhIFVSTCB1cGRhdGUgaW5kaXJlY3RseVxuXHRcdHRoaXMuc2V0TGlzdElkKGZvbGRlclRvVXNlKVxuXG5cdFx0Ly8gSWYgd2UgaGF2ZSBhIG1haWwgdGhhdCBzaG91bGQgYmUgc2VsZWN0ZWQgc3RhcnQgbG9hZGluZyB0b3dhcmRzIGl0LlxuXHRcdC8vIFdlIGFscmVhZHkgY2hlY2tlZCBpbiB0aGUgYmVnaW5uaW5nIHRoYXQgd2UgYXJlIG5vdCBsb2FkaW5nIHRvIHRoZSBzYW1lIHRhcmdldC4gV2Ugc2V0IHRoZSBsb2FkaW5nVGFyZ2V0IGVhcmx5IHNvIHRoZXJlIHNob3VsZCBiZSBubyByYWNlcy5cblx0XHRpZiAobG9hZGluZ1RhcmdldElkKSB7XG5cdFx0XHQvLyBSZWNvcmQgdGhlIHNlbGVjdGVkIG1haWwgZm9yIHRoZSBmb2xkZXJcblx0XHRcdHRoaXMubWFpbEZvbGRlckVsZW1lbnRJZFRvU2VsZWN0ZWRNYWlsSWQgPSBtYXBXaXRoKHRoaXMubWFpbEZvbGRlckVsZW1lbnRJZFRvU2VsZWN0ZWRNYWlsSWQsIGdldEVsZW1lbnRJZChmb2xkZXJUb1VzZSksIGxvYWRpbmdUYXJnZXRJZClcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMubG9hZEFuZFNlbGVjdE1haWwoZm9sZGVyVG9Vc2UsIGxvYWRpbmdUYXJnZXRJZClcblx0XHRcdH0gZmluYWxseSB7XG5cdFx0XHRcdC8vIFdlIGVpdGhlciBzZWxlY3RlZCB0aGUgbWFpbCBhbmQgd2UgZG9uJ3QgbmVlZCB0aGUgdGFyZ2V0IGFueW1vcmUgb3Igd2UgZGlkbid0IGZpbmQgaXQgYW5kIHdlIHNob3VsZCByZW1vdmUgdGhlIHRhcmdldFxuXHRcdFx0XHR0aGlzLmxvYWRpbmdUYXJnZXRJZCA9IG51bGxcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gdXBkYXRlIFVSTCBpZiB0aGUgdmlldyB3YXMganVzdCBvcGVuZWQgd2l0aG91dCBhbnkgdXJsIHBhcmFtc1xuXHRcdFx0Ly8gc2V0TGlzdElkIG1pZ2h0IG5vdCBoYXZlIGRvbmUgaXQgaWYgdGhlIGxpc3QgZGlkbid0IGNoYW5nZSBmb3IgdXMgaW50ZXJuYWxseSBidXQgaXMgY2hhbmdlZCBmb3IgdGhlIHZpZXdcblx0XHRcdGlmIChmb2xkZXIgPT0gbnVsbCkgdGhpcy51cGRhdGVVcmwoKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2VsZWN0Rm9sZGVyVG9Vc2UoZm9sZGVyQXJndW1lbnQ6IE1haWxGb2xkZXIgfCBudWxsKTogUHJvbWlzZTxNYWlsRm9sZGVyPiB7XG5cdFx0aWYgKGZvbGRlckFyZ3VtZW50KSB7XG5cdFx0XHRjb25zdCBtYWlsYm94RGV0YWlsID0gYXdhaXQgdGhpcy5tYWlsTW9kZWwuZ2V0TWFpbGJveERldGFpbHNGb3JNYWlsRm9sZGVyKGZvbGRlckFyZ3VtZW50KVxuXHRcdFx0aWYgKG1haWxib3hEZXRhaWwpIHtcblx0XHRcdFx0cmV0dXJuIGZvbGRlckFyZ3VtZW50XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gYXdhaXQgdGhpcy5nZXRGb2xkZXJGb3JVc2VySW5ib3goKVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fZm9sZGVyID8/IChhd2FpdCB0aGlzLmdldEZvbGRlckZvclVzZXJJbmJveCgpKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgbG9hZEV4cGxpY2l0TWFpbFRhcmdldChsaXN0SWQ6IElkLCBtYWlsSWQ6IElkLCBvbk1pc3NpbmdUYXJnZXRFbWFpbDogKCkgPT4gdW5rbm93bikge1xuXHRcdGNvbnN0IGV4cGVjdGVkU3RpY2t5TWFpbElkOiBJZFR1cGxlID0gW2xpc3RJZCwgbWFpbElkXVxuXG5cdFx0Ly8gRmlyc3QgdHJ5IGdldHRpbmcgdGhlIG1haWwgZnJvbSB0aGUgbGlzdC4gV2UgZG9uJ3QgbmVlZCB0byBkbyBhbnl0aGluZyBtb3JlIGlmIHdlIGNhbiBzaW1wbHkgc2VsZWN0IGl0LCBhc1xuXHRcdC8vIGdldHRpbmcgdGhlIG1haWwgaXMgY29tcGxldGVseSBzeW5jaHJvbm91cy5cblx0XHRjb25zdCBtYWlsSW5MaXN0ID0gdGhpcy5saXN0TW9kZWw/LmdldE1haWwobWFpbElkKVxuXHRcdGlmIChtYWlsSW5MaXN0KSB7XG5cdFx0XHRjb25zb2xlLmxvZyhUQUcsIFwib3BlbmluZyBtYWlsIGZyb20gbGlzdFwiLCBtYWlsSWQpXG5cdFx0XHR0aGlzLmxpc3RNb2RlbD8ub25TaW5nbGVTZWxlY3Rpb24obWFpbEluTGlzdClcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdC8vIExvYWQgdGhlIGNhY2hlZCBtYWlsIHRvIGRpc3BsYXkgaXQgc29vbmVyLlxuXHRcdC8vIFdlIHN0aWxsIHdhbnQgdG8gbG9hZCB0aGUgbWFpbCByZW1vdGVseSwgdGhvdWdoLCB0byBtYWtlIHN1cmUgdGhhdCBpdCB3b24ndCBkaXNhcHBlYXIgZHVlIHRvIGJlaW5nIG1vdmVkLlxuXHRcdGNvbnN0IGNhY2hlZCA9IGF3YWl0IHRoaXMuY2FjaGVTdG9yYWdlLmdldChNYWlsVHlwZVJlZiwgbGlzdElkLCBtYWlsSWQpXG5cdFx0aWYgKHRoaXMuZGlkU3RpY2t5TWFpbENoYW5nZShleHBlY3RlZFN0aWNreU1haWxJZCwgXCJhZnRlciBsb2FkaW5nIGNhY2hlZFwiKSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdGlmIChjYWNoZWQpIHtcblx0XHRcdGNvbnNvbGUubG9nKFRBRywgXCJkaXNwbGF5aW5nIGNhY2hlZCBtYWlsXCIsIG1haWxJZClcblx0XHRcdGF3YWl0IHRoaXMuZGlzcGxheUV4cGxpY2l0TWFpbFRhcmdldChjYWNoZWQpXG5cdFx0fVxuXG5cdFx0bGV0IG1haWw6IE1haWwgfCBudWxsXG5cdFx0dHJ5IHtcblx0XHRcdG1haWwgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKE1haWxUeXBlUmVmLCBbbGlzdElkLCBtYWlsSWRdLCB7IGNhY2hlTW9kZTogQ2FjaGVNb2RlLldyaXRlT25seSB9KVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChpc09mZmxpbmVFcnJvcihlKSkge1xuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IgfHwgZSBpbnN0YW5jZW9mIE5vdEF1dGhvcml6ZWRFcnJvcikge1xuXHRcdFx0XHRtYWlsID0gbnVsbFxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAodGhpcy5kaWRTdGlja3lNYWlsQ2hhbmdlKGV4cGVjdGVkU3RpY2t5TWFpbElkLCBcImFmdGVyIGxvYWRpbmcgZnJvbSBlbnRpdHkgY2xpZW50XCIpKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHQvLyBJZiB0aGUgdXNlciBoYXMgbWlncmF0ZWQgdG8gbWFpbHNldHMsIHNpbXBseSBjaGVja2luZyBpZiBNYWlsIGV4aXN0cyB3b24ndCBiZSBlbm91Z2guXG5cdFx0Ly8gSW5zdGVhZCwgd2UgY2hlY2sgYWdhaW5zdCB0aGUgc2V0cyBpbiB0aGUgTWFpbCBhbmQgc2VlIGlmIGl0J3MgbW92ZWQgZm9sZGVycyBzaW5jZSB0aGUgbGFzdCBzeW5jLlxuXHRcdC8vIFdlIGhhdmUgdG8gZG8gdGhpcyBiZWNhdXNlIGlmIHRoZSBtYWlsIGRpZCBtb3ZlIHNpbmNlIHRoZSBsYXN0IHN5bmMsIGl0IHdpbGwgc3RpbGwgZGlzYXBwZWFyIGZyb20gdmlldy5cblx0XHRsZXQgbW92ZWRTZXRzU2luY2VMYXN0U3luYyA9IGZhbHNlXG5cdFx0aWYgKG1haWwgIT0gbnVsbCAmJiBjYWNoZWQgIT0gbnVsbCAmJiBjYWNoZWQuc2V0cy5sZW5ndGggPiAwKSB7XG5cdFx0XHQvLyBUaGlzIHdpbGwgbW9zdCBsaWtlbHkgYmUgdGhlIGluYm94XG5cdFx0XHRjb25zdCBjdXJyZW50Rm9sZGVySWQgPSBlbGVtZW50SWRQYXJ0KGFzc2VydE5vdE51bGwodGhpcy5fZm9sZGVyLCBcImNhY2hlZCB3YXMgZGlzcGxheWVkIGVhcmxpZXIsIHRodXMgZm9sZGVyIHdvdWxkIGhhdmUgYmVlbiBzZXRcIikuX2lkKVxuXHRcdFx0Ly8gVGhpcyBjYW4gYmUgZmFsc2UgaWYgdGhlIG1haWwgd2FzIG1vdmVkIHdoaWxlIHRoZSB1c2VyIGlzIGxvZ2dlZCBpbiwgd2hpY2ggaXMgZmluZSwgYW5kIHdlIGRvbid0IG5lZWQgdG8gY2hlY2sgdGhlIGxvYWRlZCBtYWlsXG5cdFx0XHRjb25zdCBjYWNoZWRNYWlsSW5Gb2xkZXIgPSBjYWNoZWQuc2V0cy5zb21lKChpZCkgPT4gZWxlbWVudElkUGFydChpZCkgPT09IGN1cnJlbnRGb2xkZXJJZClcblx0XHRcdG1vdmVkU2V0c1NpbmNlTGFzdFN5bmMgPSBjYWNoZWRNYWlsSW5Gb2xkZXIgJiYgIW1haWwuc2V0cy5zb21lKChpZCkgPT4gZWxlbWVudElkUGFydChpZCkgPT09IGN1cnJlbnRGb2xkZXJJZClcblx0XHR9XG5cblx0XHRpZiAoIW1vdmVkU2V0c1NpbmNlTGFzdFN5bmMgJiYgbWFpbCAhPSBudWxsKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhUQUcsIFwib3BlbmluZyBtYWlsIGZyb20gZW50aXR5IGNsaWVudFwiLCBtYWlsSWQpXG5cdFx0XHRhd2FpdCB0aGlzLmRpc3BsYXlFeHBsaWNpdE1haWxUYXJnZXQobWFpbClcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKG1haWwgIT0gbnVsbCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhUQUcsIFwiRXhwbGljaXQgbWFpbCB0YXJnZXQgbW92ZWQgc2V0c1wiLCBsaXN0SWQsIG1haWxJZClcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFRBRywgXCJFeHBsaWNpdCBtYWlsIHRhcmdldCBub3QgZm91bmRcIiwgbGlzdElkLCBtYWlsSWQpXG5cdFx0XHR9XG5cdFx0XHRvbk1pc3NpbmdUYXJnZXRFbWFpbCgpXG5cdFx0XHQvLyBXZSBhbHJlYWR5IGtub3cgdGhhdCBlbWFpbCBpcyBub3QgdGhlcmUsIHdlIGNhbiByZXNldCB0aGUgdGFyZ2V0IGhlcmUgYW5kIGF2b2lkIGxpc3QgbG9hZGluZ1xuXHRcdFx0dGhpcy5zdGlja3lNYWlsSWQgPSBudWxsXG5cdFx0XHR0aGlzLnVwZGF0ZVVybCgpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBkaXNwbGF5RXhwbGljaXRNYWlsVGFyZ2V0KG1haWw6IE1haWwpIHtcblx0XHRhd2FpdCB0aGlzLnJlc2V0T3JJbml0aWFsaXplTGlzdChtYWlsLl9pZClcblx0XHR0aGlzLmNyZWF0ZUNvbnZlcnNhdGlvblZpZXdNb2RlbCh7IG1haWwsIHNob3dGb2xkZXI6IGZhbHNlIH0pXG5cdFx0dGhpcy51cGRhdGVVaSgpXG5cdH1cblxuXHRwcml2YXRlIGRpZFN0aWNreU1haWxDaGFuZ2UoZXhwZWN0ZWRJZDogSWRUdXBsZSwgbWVzc2FnZTogc3RyaW5nKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgY2hhbmdlZCA9ICFpc1NhbWVJZCh0aGlzLnN0aWNreU1haWxJZCwgZXhwZWN0ZWRJZClcblx0XHRpZiAoY2hhbmdlZCkge1xuXHRcdFx0Y29uc29sZS5sb2coVEFHLCBcInRhcmdldCBtYWlsIGlkIGNoYW5nZWRcIiwgbWVzc2FnZSwgZXhwZWN0ZWRJZCwgdGhpcy5zdGlja3lNYWlsSWQpXG5cdFx0fVxuXHRcdHJldHVybiBjaGFuZ2VkXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIGxvYWRBbmRTZWxlY3RNYWlsKGZvbGRlcjogTWFpbEZvbGRlciwgbWFpbElkOiBJZCkge1xuXHRcdGNvbnN0IGZvdW5kTWFpbCA9IGF3YWl0IHRoaXMubGlzdE1vZGVsPy5sb2FkQW5kU2VsZWN0KFxuXHRcdFx0bWFpbElkLFxuXHRcdFx0KCkgPT5cblx0XHRcdFx0Ly8gaWYgd2UgY2hhbmdlZCB0aGUgbGlzdCwgc3RvcFxuXHRcdFx0XHR0aGlzLmdldEZvbGRlcigpICE9PSBmb2xkZXIgfHxcblx0XHRcdFx0Ly8gaWYgbGlzdE1vZGVsIGlzIGdvbmUgZm9yIHNvbWUgcmVhc29uLCBzdG9wXG5cdFx0XHRcdCF0aGlzLmxpc3RNb2RlbCB8fFxuXHRcdFx0XHQvLyBpZiB0aGUgdGFyZ2V0IG1haWwgaGFzIGNoYW5nZWQsIHN0b3Bcblx0XHRcdFx0dGhpcy5sb2FkaW5nVGFyZ2V0SWQgIT09IG1haWxJZCB8fFxuXHRcdFx0XHQvLyBpZiB3ZSBsb2FkZWQgcGFzdCB0aGUgdGFyZ2V0IGl0ZW0gd2Ugd29uJ3QgZmluZCBpdCwgc3RvcFxuXHRcdFx0XHQodGhpcy5saXN0TW9kZWwuaXRlbXMubGVuZ3RoID4gMCAmJiBmaXJzdEJpZ2dlclRoYW5TZWNvbmQobWFpbElkLCBnZXRFbGVtZW50SWQobGFzdFRocm93KHRoaXMubGlzdE1vZGVsLml0ZW1zKSkpKSxcblx0XHQpXG5cdFx0aWYgKGZvdW5kTWFpbCA9PSBudWxsKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhcImRpZCBub3QgZmluZCBtYWlsXCIsIGZvbGRlciwgbWFpbElkKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZ2V0Rm9sZGVyRm9yVXNlckluYm94KCk6IFByb21pc2U8TWFpbEZvbGRlcj4ge1xuXHRcdGNvbnN0IG1haWxib3hEZXRhaWwgPSBhd2FpdCB0aGlzLm1haWxib3hNb2RlbC5nZXRVc2VyTWFpbGJveERldGFpbHMoKVxuXHRcdGNvbnN0IGZvbGRlcnMgPSBhd2FpdCB0aGlzLm1haWxNb2RlbC5nZXRNYWlsYm94Rm9sZGVyc0ZvcklkKGFzc2VydE5vdE51bGwobWFpbGJveERldGFpbC5tYWlsYm94LmZvbGRlcnMpLl9pZClcblx0XHRyZXR1cm4gYXNzZXJ0U3lzdGVtRm9sZGVyT2ZUeXBlKGZvbGRlcnMsIE1haWxTZXRLaW5kLklOQk9YKVxuXHR9XG5cblx0aW5pdCgpIHtcblx0XHR0aGlzLnNpbmdJbml0KClcblx0XHRjb25zdCBjb252ZXJzYXRpb25FbmFibGVkID0gdGhpcy5jb252ZXJzYXRpb25QcmVmUHJvdmlkZXIuZ2V0Q29udmVyc2F0aW9uVmlld1Nob3dPbmx5U2VsZWN0ZWRNYWlsKClcblx0XHRpZiAodGhpcy5jb252ZXJzYXRpb25WaWV3TW9kZWwgJiYgdGhpcy5jb252ZXJzYXRpb25QcmVmICE9PSBjb252ZXJzYXRpb25FbmFibGVkKSB7XG5cdFx0XHRjb25zdCBtYWlsID0gdGhpcy5jb252ZXJzYXRpb25WaWV3TW9kZWwucHJpbWFyeU1haWxcblx0XHRcdHRoaXMuY3JlYXRlQ29udmVyc2F0aW9uVmlld01vZGVsKHtcblx0XHRcdFx0bWFpbCxcblx0XHRcdFx0c2hvd0ZvbGRlcjogZmFsc2UsXG5cdFx0XHRcdGRlbGF5Qm9keVJlbmRlcmluZ1VudGlsOiBQcm9taXNlLnJlc29sdmUoKSxcblx0XHRcdH0pXG5cdFx0XHR0aGlzLm1haWxPcGVuZWRMaXN0ZW5lci5vbkVtYWlsT3BlbmVkKG1haWwpXG5cdFx0fVxuXHRcdHRoaXMuY29udmVyc2F0aW9uUHJlZiA9IGNvbnZlcnNhdGlvbkVuYWJsZWRcblx0fVxuXG5cdHByaXZhdGUgcmVhZG9ubHkgc2luZ0luaXQgPSBsYXp5TWVtb2l6ZWQoKCkgPT4ge1xuXHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLmFkZEVudGl0eUxpc3RlbmVyKCh1cGRhdGVzKSA9PiB0aGlzLmVudGl0eUV2ZW50c1JlY2VpdmVkKHVwZGF0ZXMpKVxuXHR9KVxuXG5cdGdldCBsaXN0TW9kZWwoKTogTWFpbExpc3RNb2RlbCB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLl9mb2xkZXIgPyB0aGlzLmxpc3RNb2RlbEZvckZvbGRlcihnZXRFbGVtZW50SWQodGhpcy5fZm9sZGVyKSkgOiBudWxsXG5cdH1cblxuXHRnZXRNYWlsRm9sZGVyVG9TZWxlY3RlZE1haWwoKTogUmVhZG9ubHlNYXA8SWQsIElkPiB7XG5cdFx0cmV0dXJuIHRoaXMubWFpbEZvbGRlckVsZW1lbnRJZFRvU2VsZWN0ZWRNYWlsSWRcblx0fVxuXG5cdGdldEZvbGRlcigpOiBNYWlsRm9sZGVyIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuX2ZvbGRlclxuXHR9XG5cblx0Z2V0TGFiZWxzRm9yTWFpbChtYWlsOiBNYWlsKTogUmVhZG9ubHlBcnJheTxNYWlsRm9sZGVyPiB7XG5cdFx0cmV0dXJuIHRoaXMubGlzdE1vZGVsPy5nZXRMYWJlbHNGb3JNYWlsKG1haWwpID8/IFtdXG5cdH1cblxuXHRwcml2YXRlIHNldExpc3RJZChmb2xkZXI6IE1haWxGb2xkZXIpIHtcblx0XHRpZiAoZm9sZGVyID09PSB0aGlzLl9mb2xkZXIpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHQvLyBDYW5jZWwgb2xkIGxvYWQgYWxsXG5cdFx0dGhpcy5saXN0TW9kZWw/LmNhbmNlbExvYWRBbGwoKVxuXHRcdHRoaXMuX2ZpbHRlclR5cGUgPSBudWxsXG5cblx0XHR0aGlzLl9mb2xkZXIgPSBmb2xkZXJcblx0XHR0aGlzLmxpc3RTdHJlYW1TdWJzY3JpcHRpb24/LmVuZCh0cnVlKVxuXHRcdHRoaXMubGlzdFN0cmVhbVN1YnNjcmlwdGlvbiA9IHRoaXMubGlzdE1vZGVsIS5zdGF0ZVN0cmVhbS5tYXAoKHN0YXRlKSA9PiB0aGlzLm9uTGlzdFN0YXRlQ2hhbmdlKHN0YXRlKSlcblx0XHR0aGlzLmxpc3RNb2RlbCEubG9hZEluaXRpYWwoKS50aGVuKCgpID0+IHtcblx0XHRcdGlmICh0aGlzLmxpc3RNb2RlbCAhPSBudWxsICYmIHRoaXMuX2ZvbGRlciA9PT0gZm9sZGVyKSB7XG5cdFx0XHRcdHRoaXMuZml4Q291bnRlcklmTmVlZGVkKGZvbGRlciwgdGhpcy5saXN0TW9kZWwuaXRlbXMpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdGdldENvbnZlcnNhdGlvblZpZXdNb2RlbCgpOiBDb252ZXJzYXRpb25WaWV3TW9kZWwgfCBudWxsIHtcblx0XHRyZXR1cm4gdGhpcy5jb252ZXJzYXRpb25WaWV3TW9kZWxcblx0fVxuXG5cdHByaXZhdGUgbGlzdE1vZGVsRm9yRm9sZGVyID0gbWVtb2l6ZWQoKF9mb2xkZXJJZDogSWQpID0+IHtcblx0XHQvLyBDYXB0dXJlIHN0YXRlIHRvIGF2b2lkIHJhY2UgY29uZGl0aW9ucy5cblx0XHQvLyBXZSBuZWVkIHRvIHBvcHVsYXRlIG1haWwgc2V0IGVudHJpZXMgY2FjaGUgd2hlbiBsb2FkaW5nIG1haWxzIHNvIHRoYXQgd2UgY2FuIHJlYWN0IHRvIHVwZGF0ZXMgbGF0ZXIuXG5cdFx0Y29uc3QgZm9sZGVyID0gYXNzZXJ0Tm90TnVsbCh0aGlzLl9mb2xkZXIpXG5cdFx0cmV0dXJuIG5ldyBNYWlsTGlzdE1vZGVsKGZvbGRlciwgdGhpcy5jb252ZXJzYXRpb25QcmVmUHJvdmlkZXIsIHRoaXMuZW50aXR5Q2xpZW50LCB0aGlzLm1haWxNb2RlbCwgdGhpcy5pbmJveFJ1bGVIYW5kbGVyLCB0aGlzLmNhY2hlU3RvcmFnZSlcblx0fSlcblxuXHRwcml2YXRlIGZpeENvdW50ZXJJZk5lZWRlZDogKGZvbGRlcjogTWFpbEZvbGRlciwgaXRlbXNXaGVuQ2FsbGVkOiBSZWFkb25seUFycmF5PE1haWw+KSA9PiB2b2lkID0gZGVib3VuY2UoXG5cdFx0MjAwMCxcblx0XHRhc3luYyAoZm9sZGVyOiBNYWlsRm9sZGVyLCBpdGVtc1doZW5DYWxsZWQ6IFJlYWRvbmx5QXJyYXk8TWFpbD4pID0+IHtcblx0XHRcdGNvbnN0IG91ckZvbGRlciA9IHRoaXMuZ2V0Rm9sZGVyKClcblx0XHRcdGlmIChvdXJGb2xkZXIgPT0gbnVsbCB8fCAodGhpcy5fZmlsdGVyVHlwZSAhPSBudWxsICYmIHRoaXMuZmlsdGVyVHlwZSAhPT0gTWFpbEZpbHRlclR5cGUuVW5yZWFkKSkge1xuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgZm9sZGVycyBhcmUgY2hhbmdlZCwgbGlzdCB3b24ndCBoYXZlIHRoZSBkYXRhIHdlIG5lZWQuXG5cdFx0XHQvLyBEbyBub3QgcmVseSBvbiBjb3VudGVycyBpZiB3ZSBhcmUgbm90IGNvbm5lY3RlZFxuXHRcdFx0aWYgKCFpc1NhbWVJZChnZXRFbGVtZW50SWQob3VyRm9sZGVyKSwgZ2V0RWxlbWVudElkKGZvbGRlcikpIHx8IHRoaXMuY29ubmVjdGl2aXR5TW9kZWwud3NDb25uZWN0aW9uKCkoKSAhPT0gV3NDb25uZWN0aW9uU3RhdGUuY29ubmVjdGVkKSB7XG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiBsaXN0IHdhcyBtb2RpZmllZCBpbiB0aGUgbWVhbnRpbWUsIHdlIGNhbm5vdCBiZSBzdXJlIHRoYXQgd2Ugd2lsbCBmaXggY291bnRlcnMgY29ycmVjdGx5IChlLmcuIGJlY2F1c2Ugb2YgdGhlIGluYm94IHJ1bGVzKVxuXHRcdFx0aWYgKHRoaXMubGlzdE1vZGVsPy5pdGVtcyAhPT0gaXRlbXNXaGVuQ2FsbGVkKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBsaXN0IGNoYW5nZWQsIHRyeWluZyBhZ2FpbiBsYXRlcmApXG5cdFx0XHRcdHJldHVybiB0aGlzLmZpeENvdW50ZXJJZk5lZWRlZChmb2xkZXIsIHRoaXMubGlzdE1vZGVsPy5pdGVtcyA/PyBbXSlcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgdW5yZWFkTWFpbHNDb3VudCA9IGNvdW50KHRoaXMubGlzdE1vZGVsLml0ZW1zLCAoZSkgPT4gZS51bnJlYWQpXG5cblx0XHRcdGNvbnN0IGNvdW50ZXJWYWx1ZSA9IGF3YWl0IHRoaXMubWFpbE1vZGVsLmdldENvdW50ZXJWYWx1ZShmb2xkZXIpXG5cdFx0XHRpZiAoY291bnRlclZhbHVlICE9IG51bGwgJiYgY291bnRlclZhbHVlICE9PSB1bnJlYWRNYWlsc0NvdW50KSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBmaXhpbmcgdXAgY291bnRlciBmb3IgZm9sZGVyICR7Zm9sZGVyLl9pZH1gKVxuXHRcdFx0XHRhd2FpdCB0aGlzLm1haWxNb2RlbC5maXh1cENvdW50ZXJGb3JGb2xkZXIoZm9sZGVyLCB1bnJlYWRNYWlsc0NvdW50KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc29sZS5sb2coYHNhbWUgY291bnRlciwgbm8gZml4dXAgb24gZm9sZGVyICR7Zm9sZGVyLl9pZH1gKVxuXHRcdFx0fVxuXHRcdH0sXG5cdClcblxuXHRwcml2YXRlIG9uTGlzdFN0YXRlQ2hhbmdlKG5ld1N0YXRlOiBMaXN0U3RhdGU8TWFpbD4pIHtcblx0XHQvLyBJZiB3ZSBhcmUgYWxyZWFkeSBkaXNwbGF5aW5nIHN0aWNreSBtYWlsIGp1c3QgbGVhdmUgaXQgYWxvbmUsIG5vIG1hdHRlciB3aGF0J3MgaGFwcGVuaW5nIHRvIHRoZSBsaXN0LlxuXHRcdC8vIFVzZXIgYWN0aW9ucyBhbmQgVVJMIHVwZGF0ZWQgZG8gcmVzZXQgc3RpY2t5IG1haWwgaWQuXG5cdFx0Y29uc3QgZGlzcGxheWVkTWFpbElkID0gdGhpcy5jb252ZXJzYXRpb25WaWV3TW9kZWw/LnByaW1hcnlWaWV3TW9kZWwoKT8ubWFpbC5faWRcblx0XHRpZiAoIShkaXNwbGF5ZWRNYWlsSWQgJiYgaXNTYW1lSWQoZGlzcGxheWVkTWFpbElkLCB0aGlzLnN0aWNreU1haWxJZCkpKSB7XG5cdFx0XHRjb25zdCB0YXJnZXRJdGVtID0gdGhpcy5zdGlja3lNYWlsSWRcblx0XHRcdFx0PyBuZXdTdGF0ZS5pdGVtcy5maW5kKChpdGVtKSA9PiBpc1NhbWVJZCh0aGlzLnN0aWNreU1haWxJZCwgaXRlbS5faWQpKVxuXHRcdFx0XHQ6ICFuZXdTdGF0ZS5pbk11bHRpc2VsZWN0ICYmIG5ld1N0YXRlLnNlbGVjdGVkSXRlbXMuc2l6ZSA9PT0gMVxuXHRcdFx0XHQ/IGZpcnN0KHRoaXMubGlzdE1vZGVsIS5nZXRTZWxlY3RlZEFzQXJyYXkoKSlcblx0XHRcdFx0OiBudWxsXG5cdFx0XHRpZiAodGFyZ2V0SXRlbSAhPSBudWxsKSB7XG5cdFx0XHRcdC8vIEFsd2F5cyB3cml0ZSB0aGUgdGFyZ2V0SXRlbSBpbiBjYXNlIGl0IHdhcyBub3Qgd3JpdHRlbiBiZWZvcmUgYnV0IGFscmVhZHkgYmVpbmcgZGlzcGxheWVkIChzdGlja3kgbWFpbClcblx0XHRcdFx0dGhpcy5tYWlsRm9sZGVyRWxlbWVudElkVG9TZWxlY3RlZE1haWxJZCA9IG1hcFdpdGgoXG5cdFx0XHRcdFx0dGhpcy5tYWlsRm9sZGVyRWxlbWVudElkVG9TZWxlY3RlZE1haWxJZCxcblx0XHRcdFx0XHRnZXRFbGVtZW50SWQoYXNzZXJ0Tm90TnVsbCh0aGlzLmdldEZvbGRlcigpKSksXG5cdFx0XHRcdFx0Z2V0RWxlbWVudElkKHRhcmdldEl0ZW0pLFxuXHRcdFx0XHQpXG5cdFx0XHRcdGlmICghdGhpcy5jb252ZXJzYXRpb25WaWV3TW9kZWwgfHwgIWlzU2FtZUlkKHRoaXMuY29udmVyc2F0aW9uVmlld01vZGVsPy5wcmltYXJ5TWFpbC5faWQsIHRhcmdldEl0ZW0uX2lkKSkge1xuXHRcdFx0XHRcdHRoaXMuY3JlYXRlQ29udmVyc2F0aW9uVmlld01vZGVsKHtcblx0XHRcdFx0XHRcdG1haWw6IHRhcmdldEl0ZW0sXG5cdFx0XHRcdFx0XHRzaG93Rm9sZGVyOiBmYWxzZSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdHRoaXMubWFpbE9wZW5lZExpc3RlbmVyLm9uRW1haWxPcGVuZWQodGFyZ2V0SXRlbSlcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5jb252ZXJzYXRpb25WaWV3TW9kZWw/LmRpc3Bvc2UoKVxuXHRcdFx0XHR0aGlzLmNvbnZlcnNhdGlvblZpZXdNb2RlbCA9IG51bGxcblx0XHRcdFx0dGhpcy5tYWlsRm9sZGVyRWxlbWVudElkVG9TZWxlY3RlZE1haWxJZCA9IG1hcFdpdGhvdXQodGhpcy5tYWlsRm9sZGVyRWxlbWVudElkVG9TZWxlY3RlZE1haWxJZCwgZ2V0RWxlbWVudElkKGFzc2VydE5vdE51bGwodGhpcy5nZXRGb2xkZXIoKSkpKVxuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLnVwZGF0ZVVybCgpXG5cdFx0dGhpcy51cGRhdGVVaSgpXG5cdH1cblxuXHRwcml2YXRlIHVwZGF0ZVVybCgpIHtcblx0XHRjb25zdCBmb2xkZXIgPSB0aGlzLl9mb2xkZXJcblx0XHRjb25zdCBmb2xkZXJJZCA9IGZvbGRlciA/IGdldEVsZW1lbnRJZChmb2xkZXIpIDogbnVsbFxuXHRcdC8vIElmIHdlIGFyZSBsb2FkaW5nIHRvd2FyZHMgYW4gZW1haWwgd2Ugd2FudCB0byBrZWVwIGl0IGluIHRoZSBVUkwsIG90aGVyd2lzZSB3ZSB3aWxsIHJlc2V0IGl0LlxuXHRcdC8vIE90aGVyd2lzZSwgaWYgd2UgaGF2ZSBhIHNpbmdsZSBzZWxlY3RlZCBlbWFpbCB0aGVuIHRoYXQgc2hvdWxkIGJlIGluIHRoZSBVUkwuXG5cdFx0Y29uc3QgbWFpbElkID0gdGhpcy5sb2FkaW5nVGFyZ2V0SWQgPz8gKGZvbGRlcklkID8gdGhpcy5nZXRNYWlsRm9sZGVyVG9TZWxlY3RlZE1haWwoKS5nZXQoZm9sZGVySWQpIDogbnVsbClcblx0XHRjb25zdCBzdGlja3lNYWlsID0gdGhpcy5zdGlja3lNYWlsSWRcblxuXHRcdGlmIChtYWlsSWQgIT0gbnVsbCkge1xuXHRcdFx0dGhpcy5yb3V0ZXIucm91dGVUbyhcblx0XHRcdFx0XCIvbWFpbC86Zm9sZGVySWQvOm1haWxJZFwiLFxuXHRcdFx0XHR0aGlzLmFkZFN0aWNreU1haWxQYXJhbSh7XG5cdFx0XHRcdFx0Zm9sZGVySWQsXG5cdFx0XHRcdFx0bWFpbElkLFxuXHRcdFx0XHRcdG1haWw6IHN0aWNreU1haWwsXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnJvdXRlci5yb3V0ZVRvKFwiL21haWwvOmZvbGRlcklkXCIsIHRoaXMuYWRkU3RpY2t5TWFpbFBhcmFtKHsgZm9sZGVySWQ6IGZvbGRlcklkID8/IFwiXCIgfSkpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhZGRTdGlja3lNYWlsUGFyYW0ocGFyYW1zOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IHR5cGVvZiBwYXJhbXMge1xuXHRcdGlmICh0aGlzLnN0aWNreU1haWxJZCkge1xuXHRcdFx0cGFyYW1zLm1haWwgPSB0aGlzLnN0aWNreU1haWxJZC5qb2luKFwiLFwiKVxuXHRcdH1cblx0XHRyZXR1cm4gcGFyYW1zXG5cdH1cblxuXHRwcml2YXRlIGNyZWF0ZUNvbnZlcnNhdGlvblZpZXdNb2RlbCh2aWV3TW9kZWxQYXJhbXM6IENyZWF0ZU1haWxWaWV3ZXJPcHRpb25zKSB7XG5cdFx0dGhpcy5jb252ZXJzYXRpb25WaWV3TW9kZWw/LmRpc3Bvc2UoKVxuXHRcdHRoaXMuY29udmVyc2F0aW9uVmlld01vZGVsID0gdGhpcy5jb252ZXJzYXRpb25WaWV3TW9kZWxGYWN0b3J5KHZpZXdNb2RlbFBhcmFtcylcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgZW50aXR5RXZlbnRzUmVjZWl2ZWQodXBkYXRlczogUmVhZG9ubHlBcnJheTxFbnRpdHlVcGRhdGVEYXRhPikge1xuXHRcdC8vIGNhcHR1cmluZyB0aGUgc3RhdGUgc28gdGhhdCBpZiB3ZSBzd2l0Y2ggZm9sZGVycyB3ZSB3b24ndCBydW4gaW50byByYWNlIGNvbmRpdGlvbnNcblx0XHRjb25zdCBmb2xkZXIgPSB0aGlzLl9mb2xkZXJcblx0XHRjb25zdCBsaXN0TW9kZWwgPSB0aGlzLmxpc3RNb2RlbFxuXG5cdFx0aWYgKCFmb2xkZXIgfHwgIWxpc3RNb2RlbCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0bGV0IGltcG9ydE1haWxTdGF0ZVVwZGF0ZXM6IEFycmF5PEVudGl0eVVwZGF0ZURhdGE+ID0gW11cblx0XHRmb3IgKGNvbnN0IHVwZGF0ZSBvZiB1cGRhdGVzKSB7XG5cdFx0XHRpZiAoaXNVcGRhdGVGb3JUeXBlUmVmKE1haWxTZXRFbnRyeVR5cGVSZWYsIHVwZGF0ZSkgJiYgaXNTYW1lSWQoZm9sZGVyLmVudHJpZXMsIHVwZGF0ZS5pbnN0YW5jZUxpc3RJZCkpIHtcblx0XHRcdFx0aWYgKHVwZGF0ZS5vcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuREVMRVRFICYmIHRoaXMuc3RpY2t5TWFpbElkICE9IG51bGwpIHtcblx0XHRcdFx0XHRjb25zdCB7IG1haWxJZCB9ID0gZGVjb25zdHJ1Y3RNYWlsU2V0RW50cnlJZCh1cGRhdGUuaW5zdGFuY2VJZClcblx0XHRcdFx0XHRpZiAoaXNTYW1lSWQobWFpbElkLCBlbGVtZW50SWRQYXJ0KHRoaXMuc3RpY2t5TWFpbElkKSkpIHtcblx0XHRcdFx0XHRcdC8vIFJlc2V0IHRhcmdldCBiZWZvcmUgd2UgZGlzcGF0Y2ggZXZlbnQgdG8gdGhlIGxpc3Qgc28gdGhhdCBvdXIgaGFuZGxlciBpbiBvbkxpc3RTdGF0ZUNoYW5nZSgpIGhhcyB1cC10by1kYXRlIHN0YXRlLlxuXHRcdFx0XHRcdFx0dGhpcy5zdGlja3lNYWlsSWQgPSBudWxsXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKFxuXHRcdFx0XHRpc1VwZGF0ZUZvclR5cGVSZWYoSW1wb3J0TWFpbFN0YXRlVHlwZVJlZiwgdXBkYXRlKSAmJlxuXHRcdFx0XHQodXBkYXRlLm9wZXJhdGlvbiA9PSBPcGVyYXRpb25UeXBlLkNSRUFURSB8fCB1cGRhdGUub3BlcmF0aW9uID09IE9wZXJhdGlvblR5cGUuVVBEQVRFKVxuXHRcdFx0KSB7XG5cdFx0XHRcdGltcG9ydE1haWxTdGF0ZVVwZGF0ZXMucHVzaCh1cGRhdGUpXG5cdFx0XHR9XG5cblx0XHRcdGF3YWl0IGxpc3RNb2RlbC5oYW5kbGVFbnRpdHlVcGRhdGUodXBkYXRlKVxuXHRcdFx0YXdhaXQgcHJvbWlzZU1hcChpbXBvcnRNYWlsU3RhdGVVcGRhdGVzLCAodXBkYXRlKSA9PiB0aGlzLnByb2Nlc3NJbXBvcnRlZE1haWxzKHVwZGF0ZSkpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBwcm9jZXNzSW1wb3J0ZWRNYWlscyh1cGRhdGU6IEVudGl0eVVwZGF0ZURhdGEpIHtcblx0XHRjb25zdCBpbXBvcnRNYWlsU3RhdGUgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKEltcG9ydE1haWxTdGF0ZVR5cGVSZWYsIFt1cGRhdGUuaW5zdGFuY2VMaXN0SWQsIHVwZGF0ZS5pbnN0YW5jZUlkXSlcblx0XHRjb25zdCBsaXN0TW9kZWxPZkltcG9ydCA9IHRoaXMubGlzdE1vZGVsRm9yRm9sZGVyKGVsZW1lbnRJZFBhcnQoaW1wb3J0TWFpbFN0YXRlLnRhcmdldEZvbGRlcikpXG5cblx0XHRsZXQgc3RhdHVzID0gcGFyc2VJbnQoaW1wb3J0TWFpbFN0YXRlLnN0YXR1cykgYXMgSW1wb3J0U3RhdHVzXG5cdFx0aWYgKHN0YXR1cyA9PT0gSW1wb3J0U3RhdHVzLkZpbmlzaGVkIHx8IHN0YXR1cyA9PT0gSW1wb3J0U3RhdHVzLkNhbmNlbGVkKSB7XG5cdFx0XHRsZXQgaW1wb3J0ZWRNYWlsRW50cmllcyA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWRBbGwoSW1wb3J0ZWRNYWlsVHlwZVJlZiwgaW1wb3J0TWFpbFN0YXRlLmltcG9ydGVkTWFpbHMpXG5cdFx0XHRpZiAoaW1wb3J0ZWRNYWlsRW50cmllcy5sZW5ndGggPT09IDApIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXG5cdFx0XHRsZXQgbWFpbFNldEVudHJ5SWRzID0gaW1wb3J0ZWRNYWlsRW50cmllcy5tYXAoKGltcG9ydGVkTWFpbCkgPT4gZWxlbWVudElkUGFydChpbXBvcnRlZE1haWwubWFpbFNldEVudHJ5KSlcblx0XHRcdGNvbnN0IG1haWxTZXRFbnRyeUxpc3RJZCA9IGxpc3RJZFBhcnQoaW1wb3J0ZWRNYWlsRW50cmllc1swXS5tYWlsU2V0RW50cnkpXG5cdFx0XHRjb25zdCBpbXBvcnRlZE1haWxTZXRFbnRyaWVzID0gYXdhaXQgdGhpcy5lbnRpdHlDbGllbnQubG9hZE11bHRpcGxlKE1haWxTZXRFbnRyeVR5cGVSZWYsIG1haWxTZXRFbnRyeUxpc3RJZCwgbWFpbFNldEVudHJ5SWRzKVxuXHRcdFx0aWYgKGlzTm90RW1wdHkoaW1wb3J0ZWRNYWlsU2V0RW50cmllcykpIHtcblx0XHRcdFx0Ly8gcHV0IG1haWxzIGludG8gY2FjaGUgYmVmb3JlIGxpc3QgbW9kZWwgd2lsbCBkb3dubG9hZCB0aGVtIG9uZSBieSBvbmVcblx0XHRcdFx0YXdhaXQgdGhpcy5wcmVsb2FkTWFpbHMoaW1wb3J0ZWRNYWlsU2V0RW50cmllcylcblxuXHRcdFx0XHRhd2FpdCBwcm9taXNlTWFwKGltcG9ydGVkTWFpbFNldEVudHJpZXMsIChpbXBvcnRlZE1haWxTZXRFbnRyeSkgPT4ge1xuXHRcdFx0XHRcdHJldHVybiBsaXN0TW9kZWxPZkltcG9ydC5oYW5kbGVFbnRpdHlVcGRhdGUoe1xuXHRcdFx0XHRcdFx0aW5zdGFuY2VMaXN0SWQ6IGxpc3RJZFBhcnQoaW1wb3J0ZWRNYWlsU2V0RW50cnkuX2lkKSxcblx0XHRcdFx0XHRcdGluc3RhbmNlSWQ6IGVsZW1lbnRJZFBhcnQoaW1wb3J0ZWRNYWlsU2V0RW50cnkuX2lkKSxcblx0XHRcdFx0XHRcdG9wZXJhdGlvbjogT3BlcmF0aW9uVHlwZS5DUkVBVEUsXG5cdFx0XHRcdFx0XHR0eXBlOiBNYWlsU2V0RW50cnlUeXBlUmVmLnR5cGUsXG5cdFx0XHRcdFx0XHRhcHBsaWNhdGlvbjogTWFpbFNldEVudHJ5VHlwZVJlZi5hcHAsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHByZWxvYWRNYWlscyhpbXBvcnRlZE1haWxTZXRFbnRyaWVzOiBNYWlsU2V0RW50cnlbXSkge1xuXHRcdGNvbnN0IG1haWxJZHMgPSBpbXBvcnRlZE1haWxTZXRFbnRyaWVzLm1hcCgobXNlKSA9PiBtc2UubWFpbClcblx0XHRjb25zdCBtYWlsc0J5TGlzdCA9IGdyb3VwQnkobWFpbElkcywgKG0pID0+IGxpc3RJZFBhcnQobSkpXG5cdFx0Zm9yIChjb25zdCBbbGlzdElkLCBtYWlsSWRzXSBvZiBtYWlsc0J5TGlzdC5lbnRyaWVzKCkpIHtcblx0XHRcdGNvbnN0IG1haWxFbGVtZW50SWRzID0gbWFpbElkcy5tYXAoKG0pID0+IGVsZW1lbnRJZFBhcnQobSkpXG5cdFx0XHRhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkTXVsdGlwbGUoTWFpbFR5cGVSZWYsIGxpc3RJZCwgbWFpbEVsZW1lbnRJZHMpXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgc3dpdGNoVG9Gb2xkZXIoZm9sZGVyVHlwZTogT21pdDxNYWlsU2V0S2luZCwgTWFpbFNldEtpbmQuQ1VTVE9NPik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHN0YXRlID0ge31cblx0XHR0aGlzLmN1cnJlbnRTaG93VGFyZ2V0TWFya2VyID0gc3RhdGVcblx0XHRjb25zdCBtYWlsYm94RGV0YWlsID0gYXNzZXJ0Tm90TnVsbChhd2FpdCB0aGlzLmdldE1haWxib3hEZXRhaWxzKCkpXG5cdFx0aWYgKHRoaXMuY3VycmVudFNob3dUYXJnZXRNYXJrZXIgIT09IHN0YXRlKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0aWYgKG1haWxib3hEZXRhaWwgPT0gbnVsbCB8fCBtYWlsYm94RGV0YWlsLm1haWxib3guZm9sZGVycyA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cdFx0Y29uc3QgZm9sZGVycyA9IGF3YWl0IHRoaXMubWFpbE1vZGVsLmdldE1haWxib3hGb2xkZXJzRm9ySWQobWFpbGJveERldGFpbC5tYWlsYm94LmZvbGRlcnMuX2lkKVxuXHRcdGlmICh0aGlzLmN1cnJlbnRTaG93VGFyZ2V0TWFya2VyICE9PSBzdGF0ZSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdGNvbnN0IGZvbGRlciA9IGFzc2VydFN5c3RlbUZvbGRlck9mVHlwZShmb2xkZXJzLCBmb2xkZXJUeXBlKVxuXHRcdGF3YWl0IHRoaXMuc2hvd01haWwoZm9sZGVyLCB0aGlzLm1haWxGb2xkZXJFbGVtZW50SWRUb1NlbGVjdGVkTWFpbElkLmdldChnZXRFbGVtZW50SWQoZm9sZGVyKSkpXG5cdH1cblxuXHRhc3luYyBnZXRNYWlsYm94RGV0YWlscygpOiBQcm9taXNlPE1haWxib3hEZXRhaWw+IHtcblx0XHRjb25zdCBmb2xkZXIgPSB0aGlzLmdldEZvbGRlcigpXG5cdFx0cmV0dXJuIGF3YWl0IHRoaXMubWFpbGJveERldGFpbEZvckxpc3RXaXRoRmFsbGJhY2soZm9sZGVyKVxuXHR9XG5cblx0YXN5bmMgc2hvd2luZ0RyYWZ0c0ZvbGRlcigpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRpZiAoIXRoaXMuX2ZvbGRlcikgcmV0dXJuIGZhbHNlXG5cdFx0Y29uc3QgbWFpbGJveERldGFpbCA9IGF3YWl0IHRoaXMubWFpbE1vZGVsLmdldE1haWxib3hEZXRhaWxzRm9yTWFpbEZvbGRlcih0aGlzLl9mb2xkZXIpXG5cdFx0Y29uc3Qgc2VsZWN0ZWRGb2xkZXIgPSB0aGlzLmdldEZvbGRlcigpXG5cdFx0aWYgKHNlbGVjdGVkRm9sZGVyICYmIG1haWxib3hEZXRhaWwgJiYgbWFpbGJveERldGFpbC5tYWlsYm94LmZvbGRlcnMpIHtcblx0XHRcdGNvbnN0IGZvbGRlcnMgPSBhd2FpdCB0aGlzLm1haWxNb2RlbC5nZXRNYWlsYm94Rm9sZGVyc0ZvcklkKG1haWxib3hEZXRhaWwubWFpbGJveC5mb2xkZXJzLl9pZClcblx0XHRcdHJldHVybiBpc09mVHlwZU9yU3ViZm9sZGVyT2YoZm9sZGVycywgc2VsZWN0ZWRGb2xkZXIsIE1haWxTZXRLaW5kLkRSQUZUKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cdH1cblxuXHRhc3luYyBzaG93aW5nVHJhc2hPclNwYW1Gb2xkZXIoKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Y29uc3QgZm9sZGVyID0gdGhpcy5nZXRGb2xkZXIoKVxuXHRcdGlmIChmb2xkZXIpIHtcblx0XHRcdGNvbnN0IG1haWxib3hEZXRhaWwgPSBhd2FpdCB0aGlzLm1haWxNb2RlbC5nZXRNYWlsYm94RGV0YWlsc0Zvck1haWxGb2xkZXIoZm9sZGVyKVxuXHRcdFx0aWYgKGZvbGRlciAmJiBtYWlsYm94RGV0YWlsICYmIG1haWxib3hEZXRhaWwubWFpbGJveC5mb2xkZXJzKSB7XG5cdFx0XHRcdGNvbnN0IGZvbGRlcnMgPSBhd2FpdCB0aGlzLm1haWxNb2RlbC5nZXRNYWlsYm94Rm9sZGVyc0ZvcklkKG1haWxib3hEZXRhaWwubWFpbGJveC5mb2xkZXJzLl9pZClcblx0XHRcdFx0cmV0dXJuIGlzU3BhbU9yVHJhc2hGb2xkZXIoZm9sZGVycywgZm9sZGVyKVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2Vcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgbWFpbGJveERldGFpbEZvckxpc3RXaXRoRmFsbGJhY2soZm9sZGVyPzogTWFpbEZvbGRlciB8IG51bGwpIHtcblx0XHRjb25zdCBtYWlsYm94RGV0YWlsRm9yTGlzdElkID0gZm9sZGVyID8gYXdhaXQgdGhpcy5tYWlsTW9kZWwuZ2V0TWFpbGJveERldGFpbHNGb3JNYWlsRm9sZGVyKGZvbGRlcikgOiBudWxsXG5cdFx0cmV0dXJuIG1haWxib3hEZXRhaWxGb3JMaXN0SWQgPz8gKGF3YWl0IHRoaXMubWFpbGJveE1vZGVsLmdldFVzZXJNYWlsYm94RGV0YWlscygpKVxuXHR9XG5cblx0YXN5bmMgZmluYWxseURlbGV0ZUFsbE1haWxzSW5TZWxlY3RlZEZvbGRlcihmb2xkZXI6IE1haWxGb2xkZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHQvLyByZW1vdmUgYW55IHNlbGVjdGlvbiB0byBhdm9pZCB0aGF0IHRoZSBuZXh0IG1haWwgaXMgbG9hZGVkIGFuZCBzZWxlY3RlZCBmb3IgZWFjaCBkZWxldGVkIG1haWwgZXZlbnRcblx0XHR0aGlzLmxpc3RNb2RlbD8uc2VsZWN0Tm9uZSgpXG5cblx0XHRjb25zdCBtYWlsYm94RGV0YWlsID0gYXdhaXQgdGhpcy5nZXRNYWlsYm94RGV0YWlscygpXG5cblx0XHQvLyB0aGUgcmVxdWVzdCBpcyBoYW5kbGVkIGEgbGl0dGxlIGRpZmZlcmVudGx5IGlmIGl0IGlzIHRoZSBzeXN0ZW0gZm9sZGVyIHZzIGEgc3ViZm9sZGVyXG5cdFx0aWYgKGZvbGRlci5mb2xkZXJUeXBlID09PSBNYWlsU2V0S2luZC5UUkFTSCB8fCBmb2xkZXIuZm9sZGVyVHlwZSA9PT0gTWFpbFNldEtpbmQuU1BBTSkge1xuXHRcdFx0cmV0dXJuIHRoaXMubWFpbE1vZGVsLmNsZWFyRm9sZGVyKGZvbGRlcikuY2F0Y2goXG5cdFx0XHRcdG9mQ2xhc3MoUHJlY29uZGl0aW9uRmFpbGVkRXJyb3IsICgpID0+IHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwib3BlcmF0aW9uU3RpbGxBY3RpdmVfbXNnXCIpXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBmb2xkZXJzID0gYXdhaXQgdGhpcy5tYWlsTW9kZWwuZ2V0TWFpbGJveEZvbGRlcnNGb3JJZChhc3NlcnROb3ROdWxsKG1haWxib3hEZXRhaWwubWFpbGJveC5mb2xkZXJzKS5faWQpXG5cdFx0XHRpZiAoaXNTdWJmb2xkZXJPZlR5cGUoZm9sZGVycywgZm9sZGVyLCBNYWlsU2V0S2luZC5UUkFTSCkgfHwgaXNTdWJmb2xkZXJPZlR5cGUoZm9sZGVycywgZm9sZGVyLCBNYWlsU2V0S2luZC5TUEFNKSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5tYWlsTW9kZWwuZmluYWxseURlbGV0ZUN1c3RvbU1haWxGb2xkZXIoZm9sZGVyKS5jYXRjaChcblx0XHRcdFx0XHRvZkNsYXNzKFByZWNvbmRpdGlvbkZhaWxlZEVycm9yLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgVXNlckVycm9yKFwib3BlcmF0aW9uU3RpbGxBY3RpdmVfbXNnXCIpXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdClcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKGBDYW5ub3QgZGVsZXRlIG1haWxzIGluIGZvbGRlciAke1N0cmluZyhmb2xkZXIuX2lkKX0gd2l0aCB0eXBlICR7Zm9sZGVyLmZvbGRlclR5cGV9YClcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRvblNpbmdsZVNlbGVjdGlvbihtYWlsOiBNYWlsKSB7XG5cdFx0dGhpcy5zdGlja3lNYWlsSWQgPSBudWxsXG5cdFx0dGhpcy5sb2FkaW5nVGFyZ2V0SWQgPSBudWxsXG5cdFx0dGhpcy5saXN0TW9kZWw/Lm9uU2luZ2xlU2VsZWN0aW9uKG1haWwpXG5cdH1cblxuXHRhcmVBbGxTZWxlY3RlZCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5saXN0TW9kZWw/LmFyZUFsbFNlbGVjdGVkKCkgPz8gZmFsc2Vcblx0fVxuXG5cdHNlbGVjdE5vbmUoKTogdm9pZCB7XG5cdFx0dGhpcy5zdGlja3lNYWlsSWQgPSBudWxsXG5cdFx0dGhpcy5sb2FkaW5nVGFyZ2V0SWQgPSBudWxsXG5cdFx0dGhpcy5saXN0TW9kZWw/LnNlbGVjdE5vbmUoKVxuXHR9XG5cblx0c2VsZWN0QWxsKCk6IHZvaWQge1xuXHRcdHRoaXMuc3RpY2t5TWFpbElkID0gbnVsbFxuXHRcdHRoaXMubG9hZGluZ1RhcmdldElkID0gbnVsbFxuXHRcdHRoaXMubGlzdE1vZGVsPy5zZWxlY3RBbGwoKVxuXHR9XG5cblx0b25TaW5nbGVJbmNsdXNpdmVTZWxlY3Rpb24obWFpbDogTWFpbCwgY2xlYXJTZWxlY3Rpb25Pbk11bHRpU2VsZWN0U3RhcnQ/OiBib29sZWFuKSB7XG5cdFx0dGhpcy5zdGlja3lNYWlsSWQgPSBudWxsXG5cdFx0dGhpcy5sb2FkaW5nVGFyZ2V0SWQgPSBudWxsXG5cdFx0dGhpcy5saXN0TW9kZWw/Lm9uU2luZ2xlSW5jbHVzaXZlU2VsZWN0aW9uKG1haWwsIGNsZWFyU2VsZWN0aW9uT25NdWx0aVNlbGVjdFN0YXJ0KVxuXHR9XG5cblx0b25SYW5nZVNlbGVjdGlvblRvd2FyZHMobWFpbDogTWFpbCkge1xuXHRcdHRoaXMuc3RpY2t5TWFpbElkID0gbnVsbFxuXHRcdHRoaXMubG9hZGluZ1RhcmdldElkID0gbnVsbFxuXHRcdHRoaXMubGlzdE1vZGVsPy5zZWxlY3RSYW5nZVRvd2FyZHMobWFpbClcblx0fVxuXG5cdHNlbGVjdFByZXZpb3VzKG11bHRpc2VsZWN0OiBib29sZWFuKSB7XG5cdFx0dGhpcy5zdGlja3lNYWlsSWQgPSBudWxsXG5cdFx0dGhpcy5sb2FkaW5nVGFyZ2V0SWQgPSBudWxsXG5cdFx0dGhpcy5saXN0TW9kZWw/LnNlbGVjdFByZXZpb3VzKG11bHRpc2VsZWN0KVxuXHR9XG5cblx0c2VsZWN0TmV4dChtdWx0aXNlbGVjdDogYm9vbGVhbikge1xuXHRcdHRoaXMuc3RpY2t5TWFpbElkID0gbnVsbFxuXHRcdHRoaXMubG9hZGluZ1RhcmdldElkID0gbnVsbFxuXHRcdHRoaXMubGlzdE1vZGVsPy5zZWxlY3ROZXh0KG11bHRpc2VsZWN0KVxuXHR9XG5cblx0b25TaW5nbGVFeGNsdXNpdmVTZWxlY3Rpb24obWFpbDogTWFpbCkge1xuXHRcdHRoaXMuc3RpY2t5TWFpbElkID0gbnVsbFxuXHRcdHRoaXMubG9hZGluZ1RhcmdldElkID0gbnVsbFxuXHRcdHRoaXMubGlzdE1vZGVsPy5vblNpbmdsZUV4Y2x1c2l2ZVNlbGVjdGlvbihtYWlsKVxuXHR9XG5cblx0YXN5bmMgY3JlYXRlTGFiZWwobWFpbGJveDogTWFpbEJveCwgbGFiZWxEYXRhOiB7IG5hbWU6IHN0cmluZzsgY29sb3I6IHN0cmluZyB9KSB7XG5cdFx0YXdhaXQgdGhpcy5tYWlsTW9kZWwuY3JlYXRlTGFiZWwoYXNzZXJ0Tm90TnVsbChtYWlsYm94Ll9vd25lckdyb3VwKSwgbGFiZWxEYXRhKVxuXHR9XG5cblx0YXN5bmMgZWRpdExhYmVsKGxhYmVsOiBNYWlsRm9sZGVyLCBuZXdEYXRhOiB7IG5hbWU6IHN0cmluZzsgY29sb3I6IHN0cmluZyB9KSB7XG5cdFx0YXdhaXQgdGhpcy5tYWlsTW9kZWwudXBkYXRlTGFiZWwobGFiZWwsIG5ld0RhdGEpXG5cdH1cblxuXHRhc3luYyBkZWxldGVMYWJlbChsYWJlbDogTWFpbEZvbGRlcikge1xuXHRcdGF3YWl0IHRoaXMubWFpbE1vZGVsLmRlbGV0ZUxhYmVsKGxhYmVsKVxuXHR9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUJBLGtCQUFrQjtJQWdCTCxnQkFBTixNQUFvQjtDQUUxQixBQUFpQjtDQUdqQixBQUFpQixVQUErQixJQUFJO0NBRXBELFlBQ2tCQSxTQUNBQywwQkFDQUMsY0FDQUMsV0FDQUMsa0JBQ0FDLGNBQ2hCO0VBb1hGLEtBMVhrQjtFQTBYakIsS0F6WGlCO0VBeVhoQixLQXhYZ0I7RUF3WGYsS0F2WGU7RUF1WGQsS0F0WGM7RUFzWGIsS0FyWGE7QUFFakIsT0FBSyxZQUFZLElBQUksVUFBVTtHQUM5QixPQUFPLENBQUMsaUJBQWlCQyxZQUFVO0lBQ2xDLE1BQU0sZ0JBQWdCLGlCQUFpQixjQUFjLE9BQU8sQ0FBQyxRQUFRLFNBQVMsYUFBYztBQUM1RixXQUFPLEtBQUssVUFBVSxlQUFlQSxRQUFNO0dBQzNDO0dBRUQsYUFBYSxDQUFDLE9BQU8sVUFBVTtJQUU5QixNQUFNLFVBQVUsYUFBYSxNQUFN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