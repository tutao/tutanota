import { assertNotNull, first, groupBy, isEmpty, isNotNull, neverNull, noOp, ofClass, pMap } from "./dist2-chunk.js";
import { FULL_INDEXED_TIMESTAMP, ImportStatus, MailSetKind, MailState, NOTHING_INDEXED_TIMESTAMP, OperationType } from "./TutanotaConstants-chunk.js";
import { LEGACY_BCC_RECIPIENTS_ID, LEGACY_BODY_ID, LEGACY_CC_RECIPIENTS_ID, LEGACY_TO_RECIPIENTS_ID, deconstructMailSetEntryId, elementIdPart, isSameId, listIdPart } from "./EntityUtils-chunk.js";
import { typeModels } from "./TypeModels-chunk.js";
import { ImportMailStateTypeRef, ImportedMailTypeRef, MailBoxTypeRef, MailDetailsBlobTypeRef, MailDetailsDraftTypeRef, MailFolderTypeRef, MailSetEntryTypeRef, MailTypeRef, MailboxGroupRootTypeRef } from "./TypeRefs-chunk.js";
import { hasError } from "./ErrorUtils-chunk.js";
import { ConnectionError, NotAuthorizedError, NotFoundError } from "./RestError-chunk.js";
import { CancelledError } from "./CancelledError-chunk.js";
import { DbError } from "./DbError-chunk.js";
import { containsEventOfType } from "./EntityUpdateUtils-chunk.js";
import { isDraft } from "./MailChecks-chunk.js";
import { ProgressMonitor } from "./ProgressMonitor-chunk.js";
import { getDisplayedSender, getMailBodyText } from "./CommonMailUtils-chunk.js";
import { ElementDataOS, GroupDataOS, MetaDataOS, Metadata, b64UserIdHash } from "./IndexTables-chunk.js";
import { _createNewIndexUpdate, encryptIndexKeyBase64, filterMailMemberships, getPerformanceTimestamp, htmlToText, typeRefToTypeInfo } from "./IndexUtils-chunk.js";
import { IndexingErrorReason } from "./SearchTypes-chunk.js";

//#region src/mail-app/workerUtils/index/MailIndexer.ts
const INITIAL_MAIL_INDEX_INTERVAL_DAYS = 28;
const MAIL_INDEX_BATCH_INTERVAL = 864e5;
var MailIndexer = class {
	currentIndexTimestamp;
	mailIndexingEnabled;
	mailboxIndexingPromise;
	isIndexing = false;
	_indexingCancelled;
	_core;
	_db;
	_dateProvider;
	constructor(core, db, infoMessageHandler, bulkLoaderFactory, entityClient, dateProvider, mailFacade) {
		this.infoMessageHandler = infoMessageHandler;
		this.bulkLoaderFactory = bulkLoaderFactory;
		this.entityClient = entityClient;
		this.mailFacade = mailFacade;
		this._core = core;
		this._db = db;
		this.currentIndexTimestamp = NOTHING_INDEXED_TIMESTAMP;
		this.mailIndexingEnabled = false;
		this.mailboxIndexingPromise = Promise.resolve();
		this._indexingCancelled = false;
		this._dateProvider = dateProvider;
	}
	createMailIndexEntries(mail, mailDetails, files) {
		let startTimeIndex = getPerformanceTimestamp();
		let senderToIndex;
		const hasSender = mail.sender != null;
		if (hasSender) senderToIndex = getDisplayedSender(mail);
		const MailModel = typeModels.Mail;
		const MailDetailsModel = typeModels.MailDetails;
		const RecipientModel = typeModels.Recipients;
		let keyToIndexEntries = this._core.createIndexEntriesForAttributes(mail, [
			{
				attribute: MailModel.values["subject"],
				value: () => mail.subject
			},
			{
				attribute: Object.assign({}, RecipientModel.associations["toRecipients"], { id: LEGACY_TO_RECIPIENTS_ID }),
				value: () => mailDetails.recipients.toRecipients.map((r) => r.name + " <" + r.address + ">").join(",")
			},
			{
				attribute: Object.assign({}, RecipientModel.associations["ccRecipients"], { id: LEGACY_CC_RECIPIENTS_ID }),
				value: () => mailDetails.recipients.ccRecipients.map((r) => r.name + " <" + r.address + ">").join(",")
			},
			{
				attribute: Object.assign({}, RecipientModel.associations["bccRecipients"], { id: LEGACY_BCC_RECIPIENTS_ID }),
				value: () => mailDetails.recipients.bccRecipients.map((r) => r.name + " <" + r.address + ">").join(",")
			},
			{
				attribute: MailModel.associations["sender"],
				value: () => hasSender ? senderToIndex.name + " <" + senderToIndex.address + ">" : ""
			},
			{
				attribute: Object.assign({}, MailDetailsModel.associations["body"], { id: LEGACY_BODY_ID }),
				value: () => htmlToText(getMailBodyText(mailDetails.body))
			},
			{
				attribute: MailModel.associations["attachments"],
				value: () => files.map((file) => file.name).join(" ")
			}
		]);
		this._core._stats.indexingTime += getPerformanceTimestamp() - startTimeIndex;
		return keyToIndexEntries;
	}
	processNewMail(mailId) {
		return this.entityClient.load(MailTypeRef, mailId).then(async (mail) => {
			let mailDetails;
			if (isDraft(mail)) {
				const mailOwnerEncSessionKey = assertNotNull(mail._ownerEncSessionKey);
				const mailDetailsDraftId = assertNotNull(mail.mailDetailsDraft);
				mailDetails = await this.entityClient.loadMultiple(MailDetailsDraftTypeRef, listIdPart(mailDetailsDraftId), [elementIdPart(mailDetailsDraftId)], async () => ({
					key: mailOwnerEncSessionKey,
					encryptingKeyVersion: Number(mail._ownerKeyVersion ?? 0)
				})).then((d) => {
					const draft = first(d);
					if (draft == null) throw new NotFoundError(`MailDetailsDraft ${mailDetailsDraftId}`);
					return draft.details;
				});
			} else {
				const mailOwnerEncSessionKey = assertNotNull(mail._ownerEncSessionKey);
				const mailDetailsBlobId = neverNull(mail.mailDetails);
				mailDetails = await this.entityClient.loadMultiple(MailDetailsBlobTypeRef, listIdPart(mailDetailsBlobId), [elementIdPart(mailDetailsBlobId)], async () => ({
					key: mailOwnerEncSessionKey,
					encryptingKeyVersion: Number(mail._ownerKeyVersion ?? 0)
				})).then((d) => {
					const blob = first(d);
					if (blob == null) throw new NotFoundError(`MailDetailsBlob ${mailDetailsBlobId}`);
					return blob.details;
				});
			}
			const files = await this.mailFacade.loadAttachments(mail);
			let keyToIndexEntries = this.createMailIndexEntries(mail, mailDetails, files);
			return {
				mail,
				keyToIndexEntries
			};
		}).catch(ofClass(NotFoundError, () => {
			console.log("tried to index non existing mail");
			return null;
		})).catch(ofClass(NotAuthorizedError, () => {
			console.log("tried to index contact without permission");
			return null;
		}));
	}
	processMovedMail(event, indexUpdate) {
		let encInstanceId = encryptIndexKeyBase64(this._db.key, event.instanceId, this._db.iv);
		return this._db.dbFacade.createTransaction(true, [ElementDataOS]).then((transaction) => {
			return transaction.get(ElementDataOS, encInstanceId).then((elementData) => {
				if (elementData) indexUpdate.move.push({
					encInstanceId,
					newListId: event.instanceListId
				});
else return this.processNewMail([event.instanceListId, event.instanceId]).then((result) => {
					if (result) this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries, indexUpdate);
				});
			});
		});
	}
	async enableMailIndexing(user) {
		const t = await this._db.dbFacade.createTransaction(true, [MetaDataOS]);
		const enabled = await t.get(MetaDataOS, Metadata.mailIndexingEnabled);
		if (!enabled) {
			this.mailIndexingEnabled = true;
			const t2 = await this._db.dbFacade.createTransaction(false, [MetaDataOS]);
			t2.put(MetaDataOS, Metadata.mailIndexingEnabled, true);
			t2.put(MetaDataOS, Metadata.excludedListIds, []);
			const oldestTimestamp = this._dateProvider.getStartOfDayShiftedBy(-INITIAL_MAIL_INDEX_INTERVAL_DAYS).getTime();
			this.indexMailboxes(user, oldestTimestamp).catch(ofClass(CancelledError, (e) => {
				console.log("cancelled initial indexing", e);
			}));
			return t2.wait();
		} else return t.get(MetaDataOS, Metadata.excludedListIds).then((excludedListIds) => {
			this.mailIndexingEnabled = true;
		});
	}
	disableMailIndexing(userId) {
		this.mailIndexingEnabled = false;
		this._indexingCancelled = true;
		return this._db.dbFacade.deleteDatabase(b64UserIdHash(userId));
	}
	cancelMailIndexing() {
		this._indexingCancelled = true;
		return Promise.resolve();
	}
	/**
	* Extend mail index if not indexed this range yet.
	* newOldestTimestamp should be aligned to the start of the day up until which you want to index, we don't do rounding inside here.
	*/
	async extendIndexIfNeeded(user, newOldestTimestamp) {
		if (this.currentIndexTimestamp > FULL_INDEXED_TIMESTAMP && this.currentIndexTimestamp > newOldestTimestamp) {
			this.mailboxIndexingPromise = this.mailboxIndexingPromise.then(() => this.indexMailboxes(user, newOldestTimestamp)).catch(ofClass(CancelledError, (e) => {
				console.log("extend mail index has been cancelled", e);
			}));
			return this.mailboxIndexingPromise;
		}
	}
	/**
	* Indexes all mailboxes of the given user up to the endIndexTimestamp if mail indexing is enabled.
	* If the mailboxes are already fully indexed, they are not indexed again.
	*/
	async indexMailboxes(user, oldestTimestamp) {
		if (!this.mailIndexingEnabled) return Promise.resolve();
		this.isIndexing = true;
		this._indexingCancelled = false;
		this._core.resetStats();
		await this.infoMessageHandler.onSearchIndexStateUpdate({
			initializing: false,
			mailIndexEnabled: this.mailIndexingEnabled,
			progress: 1,
			currentMailIndexTimestamp: this.currentIndexTimestamp,
			aimedMailIndexTimestamp: oldestTimestamp,
			indexedMailCount: 0,
			failedIndexingUpTo: null
		});
		let memberships = filterMailMemberships(user);
		this._core.queue.pause();
		try {
			const mailBoxes = [];
			for (let mailGroupMembership of memberships) {
				let mailGroupId = mailGroupMembership.group;
				const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId);
				const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox);
				const transaction = await this._db.dbFacade.createTransaction(true, [GroupDataOS]);
				const groupData = await transaction.get(GroupDataOS, mailGroupId);
				if (groupData) {
					const newestTimestamp = groupData.indexTimestamp === NOTHING_INDEXED_TIMESTAMP ? this._dateProvider.getStartOfDayShiftedBy(1).getTime() : groupData.indexTimestamp;
					if (newestTimestamp > oldestTimestamp) mailBoxes.push({
						mbox: mailbox,
						newestTimestamp
					});
				}
			}
			if (mailBoxes.length > 0) await this._indexMailLists(mailBoxes, oldestTimestamp);
			this._core.printStatus();
			await this.updateCurrentIndexTimestamp(user);
			await this.infoMessageHandler.onSearchIndexStateUpdate({
				initializing: false,
				mailIndexEnabled: this.mailIndexingEnabled,
				progress: 0,
				currentMailIndexTimestamp: this.currentIndexTimestamp,
				aimedMailIndexTimestamp: oldestTimestamp,
				indexedMailCount: this._core._stats.mailcount,
				failedIndexingUpTo: null
			});
		} catch (e) {
			console.warn("Mail indexing failed: ", e);
			this.mailboxIndexingPromise = Promise.resolve();
			await this.updateCurrentIndexTimestamp(user);
			const success = this._core.isStoppedProcessing() || e instanceof CancelledError;
			const failedIndexingUpTo = success ? null : oldestTimestamp;
			const error = success ? null : e instanceof ConnectionError ? IndexingErrorReason.ConnectionLost : IndexingErrorReason.Unknown;
			await this.infoMessageHandler.onSearchIndexStateUpdate({
				initializing: false,
				mailIndexEnabled: this.mailIndexingEnabled,
				progress: 0,
				currentMailIndexTimestamp: this.currentIndexTimestamp,
				aimedMailIndexTimestamp: oldestTimestamp,
				indexedMailCount: this._core._stats.mailcount,
				failedIndexingUpTo,
				error
			});
		} finally {
			this._core.queue.resume();
			this.isIndexing = false;
		}
	}
	_indexMailLists(mailBoxes, oldestTimestamp) {
		const newestTimestamp = mailBoxes.reduce((acc, data) => Math.max(acc, data.newestTimestamp), 0);
		const progress = new ProgressMonitor(newestTimestamp - oldestTimestamp, (progress$1) => {
			this.infoMessageHandler.onSearchIndexStateUpdate({
				initializing: false,
				mailIndexEnabled: this.mailIndexingEnabled,
				progress: progress$1,
				currentMailIndexTimestamp: this.currentIndexTimestamp,
				aimedMailIndexTimestamp: oldestTimestamp,
				indexedMailCount: this._core._stats.mailcount,
				failedIndexingUpTo: null
			});
		});
		const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef));
		const indexLoader = this.bulkLoaderFactory();
		return pMap(mailBoxes, (mBoxData) => {
			return this._loadMailListIds(mBoxData.mbox).then((mailListIds) => {
				return {
					mailListIds,
					newestTimestamp: mBoxData.newestTimestamp,
					ownerGroup: neverNull(mBoxData.mbox._ownerGroup)
				};
			});
		}).then((mailboxData) => this._indexMailListsInTimeBatches(mailboxData, [newestTimestamp, oldestTimestamp], indexUpdate, progress, indexLoader));
	}
	_processedEnough(indexUpdate) {
		return indexUpdate.create.encInstanceIdToElementData.size > 500;
	}
	_indexMailListsInTimeBatches(dataPerMailbox, timeRange, indexUpdate, progress, indexLoader) {
		const [rangeStart, rangeEnd] = timeRange;
		let batchEnd = rangeStart - MAIL_INDEX_BATCH_INTERVAL;
		if (batchEnd < rangeEnd) batchEnd = rangeEnd;
		const mailboxesToWrite = dataPerMailbox.filter((mboxData) => batchEnd < mboxData.newestTimestamp);
		const batchRange = [rangeStart, batchEnd];
		if (rangeStart <= rangeEnd) {
			const indexTimestampPerGroup = mailboxesToWrite.map((data) => ({
				groupId: data.ownerGroup,
				indexTimestamp: data.mailListIds.length === 0 ? FULL_INDEXED_TIMESTAMP : rangeStart
			}));
			return this._writeIndexUpdate(indexTimestampPerGroup, indexUpdate).then(() => {
				progress.workDone(rangeStart - batchEnd);
			});
		}
		return this._prepareMailDataForTimeBatch(mailboxesToWrite, batchRange, indexUpdate, indexLoader).then(() => {
			const nextRange = [batchEnd, rangeEnd];
			if (this._processedEnough(indexUpdate)) {
				const indexTimestampPerGroup = mailboxesToWrite.map((data) => ({
					groupId: data.ownerGroup,
					indexTimestamp: data.mailListIds.length === 0 ? FULL_INDEXED_TIMESTAMP : batchEnd
				}));
				return this._writeIndexUpdate(indexTimestampPerGroup, indexUpdate).then(() => {
					progress.workDone(rangeStart - batchEnd);
					const newIndexUpdate = _createNewIndexUpdate(indexUpdate.typeInfo);
					return this._indexMailListsInTimeBatches(dataPerMailbox, nextRange, newIndexUpdate, progress, indexLoader);
				});
			} else {
				progress.workDone(rangeStart - batchEnd);
				return this._indexMailListsInTimeBatches(dataPerMailbox, nextRange, indexUpdate, progress, indexLoader);
			}
		});
	}
	/**
	* @return Number of processed emails?
	* @private
	*/
	async _prepareMailDataForTimeBatch(mboxDataList, timeRange, indexUpdate, indexLoader) {
		const startTimeLoad = getPerformanceTimestamp();
		return pMap(mboxDataList, (mboxData) => {
			return pMap(mboxData.mailListIds.slice(), async (listId) => {
				const { elements: mails, loadedCompletely } = await indexLoader.loadMailsInRangeWithCache(listId, timeRange);
				if (loadedCompletely) mboxData.mailListIds.splice(mboxData.mailListIds.indexOf(listId), 1);
				this._core._stats.mailcount += mails.length;
				await Promise.all(mails.map((m) => indexLoader.removeFromCache(m._id)));
				return this._processIndexMails(mails, indexUpdate, indexLoader);
			}, { concurrency: 2 });
		}, { concurrency: 5 }).then(() => {
			this._core._stats.preparingTime += getPerformanceTimestamp() - startTimeLoad;
		});
	}
	async _processIndexMails(mails, indexUpdate, indexLoader) {
		if (this._indexingCancelled) throw new CancelledError("cancelled indexing in processing index mails");
		let mailsWithoutErros = mails.filter((m) => !hasError(m));
		const mailsWithMailDetails = await indexLoader.loadMailDetails(mailsWithoutErros);
		const files = await indexLoader.loadAttachments(mailsWithoutErros);
		const mailsWithMailDetailsAndFiles = mailsWithMailDetails.map((mailTuples) => {
			return {
				mail: mailTuples.mail,
				mailDetails: mailTuples.mailDetails,
				files: files.filter((file) => mailTuples.mail.attachments.find((a) => isSameId(a, file._id)))
			};
		}).filter(isNotNull);
		for (const element of mailsWithMailDetailsAndFiles) {
			let keyToIndexEntries = this.createMailIndexEntries(element.mail, element.mailDetails, element.files);
			this._core.encryptSearchIndexEntries(element.mail._id, neverNull(element.mail._ownerGroup), keyToIndexEntries, indexUpdate);
		}
		return mailsWithMailDetailsAndFiles.length;
	}
	_writeIndexUpdate(dataPerGroup, indexUpdate) {
		return this._core.writeIndexUpdate(dataPerGroup, indexUpdate);
	}
	updateCurrentIndexTimestamp(user) {
		return this._db.dbFacade.createTransaction(true, [GroupDataOS]).then((t) => {
			return Promise.all(filterMailMemberships(user).map((mailGroupMembership) => {
				return t.get(GroupDataOS, mailGroupMembership.group).then((groupData) => {
					if (!groupData) return NOTHING_INDEXED_TIMESTAMP;
else return groupData.indexTimestamp;
				});
			})).then((groupIndexTimestamps) => {
				this.currentIndexTimestamp = _getCurrentIndexTimestamp(groupIndexTimestamps);
			});
		}).catch((err) => {
			if (err instanceof DbError && this._core.isStoppedProcessing()) console.log("The database was closed, do not write currentIndexTimestamp");
		});
	}
	/**
	* Provides all mail list ids of the given mailbox
	*/
	async _loadMailListIds(mailbox) {
		const isMailsetMigrated = mailbox.currentMailBag != null;
		if (isMailsetMigrated) return [mailbox.currentMailBag, ...mailbox.archivedMailBags].map((mailbag) => mailbag.mails);
else {
			const folders = await this.entityClient.loadAll(MailFolderTypeRef, neverNull(mailbox.folders).folders);
			return folders.map((f) => f.mails);
		}
	}
	_getSpamFolder(mailGroup) {
		return this.entityClient.load(MailboxGroupRootTypeRef, mailGroup.group).then((mailGroupRoot) => this.entityClient.load(MailBoxTypeRef, mailGroupRoot.mailbox)).then((mbox) => {
			return this.entityClient.loadAll(MailFolderTypeRef, neverNull(mbox.folders).folders).then((folders) => neverNull(folders.find((folder) => folder.folderType === MailSetKind.SPAM)));
		});
	}
	async processImportStateEntityEvents(events, groupId, batchId, indexUpdate) {
		if (!this.mailIndexingEnabled) return Promise.resolve();
		await pMap(events, async (event) => {
			if (event.operation === OperationType.CREATE || event.operation === OperationType.UPDATE) {
				let mailIds = await this.loadImportedMailIdsInIndexDateRange([event.instanceListId, event.instanceId]);
				await this.preloadMails(mailIds);
				return await pMap(mailIds, (mailId) => this.processNewMail(mailId).then((result) => {
					if (result) this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries, indexUpdate);
				}));
			}
		});
	}
	/**
	* We preload all mails and mail details into the cache in order to prevent loading mails one by one
	* after importing lots of mails...
	*/
	async preloadMails(mailIds) {
		const mailsByList = groupBy(mailIds, (m) => listIdPart(m));
		let mails = [];
		for (const [listId, mailIds$1] of mailsByList.entries()) {
			const mailElementIds = mailIds$1.map((m) => elementIdPart(m));
			mails = mails.concat(await this.entityClient.loadMultiple(MailTypeRef, listId, mailElementIds));
		}
		const indexLoader = this.bulkLoaderFactory();
		await indexLoader.loadMailDetails(mails);
		await indexLoader.loadAttachments(mails);
	}
	async loadImportedMailIdsInIndexDateRange(importStateId) {
		const importMailState = await this.entityClient.load(ImportMailStateTypeRef, importStateId);
		let status = parseInt(importMailState.status);
		if (status !== ImportStatus.Finished && status !== ImportStatus.Canceled) return Promise.resolve([]);
		let importedMailEntries = await this.entityClient.loadAll(ImportedMailTypeRef, importMailState.importedMails);
		if (isEmpty(importedMailEntries)) return Promise.resolve([]);
		let importedMailSetEntryListId = listIdPart(importedMailEntries[0].mailSetEntry);
		let dateRangeFilteredMailSetEntryIds = importedMailEntries.map((importedMail) => elementIdPart(importedMail.mailSetEntry)).filter((importedEntry) => deconstructMailSetEntryId(importedEntry).receiveDate.getTime() >= this.currentIndexTimestamp);
		return this.entityClient.loadMultiple(MailSetEntryTypeRef, importedMailSetEntryListId, dateRangeFilteredMailSetEntryIds).then((entries) => entries.map((entry) => entry.mail));
	}
	/**
	* Prepare IndexUpdate in response to the new entity events.
	* {@see MailIndexerTest.js}
	* @param events Events from one batch
	* @param groupId
	* @param batchId
	* @param indexUpdate which will be populated with operations
	* @returns {Promise<*>} Indication that we're done.
	*/
	processEntityEvents(events, groupId, batchId, indexUpdate) {
		if (!this.mailIndexingEnabled) return Promise.resolve();
		return pMap(events, (event) => {
			const mailId = [event.instanceListId, event.instanceId];
			if (event.operation === OperationType.CREATE) if (containsEventOfType(events, OperationType.DELETE, event.instanceId)) return this.processMovedMail(event, indexUpdate);
else return this.processNewMail(mailId).then((result) => {
				if (result) this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries, indexUpdate);
			});
else if (event.operation === OperationType.UPDATE) return this.entityClient.load(MailTypeRef, [event.instanceListId, event.instanceId]).then((mail) => {
				if (mail.state === MailState.DRAFT) return Promise.all([this._core._processDeleted(event, indexUpdate), this.processNewMail(mailId).then((result) => {
					if (result) this._core.encryptSearchIndexEntries(result.mail._id, neverNull(result.mail._ownerGroup), result.keyToIndexEntries, indexUpdate);
				})]);
			}).catch(ofClass(NotFoundError, () => console.log("tried to index update event for non existing mail")));
else if (event.operation === OperationType.DELETE) {
				if (!containsEventOfType(events, OperationType.CREATE, event.instanceId)) return this._core._processDeleted(event, indexUpdate);
			}
		}).then(noOp);
	}
};
function _getCurrentIndexTimestamp(groupIndexTimestamps) {
	let currentIndexTimestamp = NOTHING_INDEXED_TIMESTAMP;
	for (const [index, t] of groupIndexTimestamps.entries()) if (index === 0) currentIndexTimestamp = t;
else if (t === NOTHING_INDEXED_TIMESTAMP) {} else if (t === FULL_INDEXED_TIMESTAMP && currentIndexTimestamp !== FULL_INDEXED_TIMESTAMP && currentIndexTimestamp !== NOTHING_INDEXED_TIMESTAMP) {} else if (currentIndexTimestamp === FULL_INDEXED_TIMESTAMP && t !== currentIndexTimestamp) currentIndexTimestamp = t;
else if (t < currentIndexTimestamp) currentIndexTimestamp = t;
	return currentIndexTimestamp;
}

//#endregion
export { INITIAL_MAIL_INDEX_INTERVAL_DAYS, MailIndexer, _getCurrentIndexTimestamp };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbEluZGV4ZXItY2h1bmsuanMiLCJuYW1lcyI6WyJjb3JlOiBJbmRleGVyQ29yZSIsImRiOiBEYiIsImluZm9NZXNzYWdlSGFuZGxlcjogSW5mb01lc3NhZ2VIYW5kbGVyIiwiYnVsa0xvYWRlckZhY3Rvcnk6ICgpID0+IEJ1bGtNYWlsTG9hZGVyIiwiZW50aXR5Q2xpZW50OiBFbnRpdHlDbGllbnQiLCJkYXRlUHJvdmlkZXI6IERhdGVQcm92aWRlciIsIm1haWxGYWNhZGU6IE1haWxGYWNhZGUiLCJtYWlsOiBNYWlsIiwibWFpbERldGFpbHM6IE1haWxEZXRhaWxzIiwiZmlsZXM6IFR1dGFub3RhRmlsZVtdIiwic2VuZGVyVG9JbmRleDogTWFpbEFkZHJlc3NBbmROYW1lIiwibWFpbElkOiBJZFR1cGxlIiwiZXZlbnQ6IEVudGl0eVVwZGF0ZSIsImluZGV4VXBkYXRlOiBJbmRleFVwZGF0ZSIsInVzZXI6IFVzZXIiLCJ1c2VySWQ6IElkIiwibmV3T2xkZXN0VGltZXN0YW1wOiBudW1iZXIiLCJvbGRlc3RUaW1lc3RhbXA6IG51bWJlciIsIm1haWxCb3hlczogQXJyYXk8eyBtYm94OiBNYWlsQm94OyBuZXdlc3RUaW1lc3RhbXA6IG51bWJlciB9PiIsIm1haWxCb3hlczogQXJyYXk8e1xuXHRcdFx0bWJveDogTWFpbEJveFxuXHRcdFx0bmV3ZXN0VGltZXN0YW1wOiBudW1iZXJcblx0XHR9PiIsInByb2dyZXNzIiwiZGF0YVBlck1haWxib3g6IEFycmF5PE1ib3hJbmRleERhdGE+IiwidGltZVJhbmdlOiBUaW1lUmFuZ2UiLCJwcm9ncmVzczogUHJvZ3Jlc3NNb25pdG9yIiwiaW5kZXhMb2FkZXI6IEJ1bGtNYWlsTG9hZGVyIiwibWJveERhdGFMaXN0OiBBcnJheTxNYm94SW5kZXhEYXRhPiIsIm1haWxzOiBBcnJheTxNYWlsPiIsImRhdGFQZXJHcm91cDogQXJyYXk8e1xuXHRcdFx0Z3JvdXBJZDogSWRcblx0XHRcdGluZGV4VGltZXN0YW1wOiBudW1iZXJcblx0XHR9PiIsImdyb3VwRGF0YTogR3JvdXBEYXRhIHwgbnVsbCIsIm1haWxib3g6IE1haWxCb3giLCJtYWlsR3JvdXA6IEdyb3VwTWVtYmVyc2hpcCIsImV2ZW50czogRW50aXR5VXBkYXRlW10iLCJncm91cElkOiBJZCIsImJhdGNoSWQ6IElkIiwibWFpbElkczogSWRUdXBsZVtdIiwibWFpbElkcyIsImltcG9ydFN0YXRlSWQ6IElkVHVwbGUiLCJncm91cEluZGV4VGltZXN0YW1wczogbnVtYmVyW10iXSwic291cmNlcyI6WyIuLi9zcmMvbWFpbC1hcHAvd29ya2VyVXRpbHMvaW5kZXgvTWFpbEluZGV4ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcblx0RlVMTF9JTkRFWEVEX1RJTUVTVEFNUCxcblx0SW1wb3J0U3RhdHVzLFxuXHRNYWlsU2V0S2luZCxcblx0TWFpbFN0YXRlLFxuXHROT1RISU5HX0lOREVYRURfVElNRVNUQU1QLFxuXHRPcGVyYXRpb25UeXBlLFxufSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHtcblx0RmlsZSBhcyBUdXRhbm90YUZpbGUsXG5cdEltcG9ydGVkTWFpbFR5cGVSZWYsXG5cdEltcG9ydE1haWxTdGF0ZVR5cGVSZWYsXG5cdE1haWwsXG5cdE1haWxCb3gsXG5cdE1haWxib3hHcm91cFJvb3RUeXBlUmVmLFxuXHRNYWlsQm94VHlwZVJlZixcblx0TWFpbERldGFpbHMsXG5cdE1haWxEZXRhaWxzQmxvYlR5cGVSZWYsXG5cdE1haWxEZXRhaWxzRHJhZnRUeXBlUmVmLFxuXHRNYWlsRm9sZGVyLFxuXHRNYWlsRm9sZGVyVHlwZVJlZixcblx0TWFpbFNldEVudHJ5VHlwZVJlZixcblx0TWFpbFR5cGVSZWYsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IENvbm5lY3Rpb25FcnJvciwgTm90QXV0aG9yaXplZEVycm9yLCBOb3RGb3VuZEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Jlc3RFcnJvci5qc1wiXG5pbXBvcnQgeyB0eXBlTW9kZWxzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZU1vZGVscy5qc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsLCBmaXJzdCwgZ3JvdXBCeSwgaXNFbXB0eSwgaXNOb3ROdWxsLCBuZXZlck51bGwsIG5vT3AsIG9mQ2xhc3MsIHByb21pc2VNYXAgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7XG5cdGRlY29uc3RydWN0TWFpbFNldEVudHJ5SWQsXG5cdGVsZW1lbnRJZFBhcnQsXG5cdGlzU2FtZUlkLFxuXHRMRUdBQ1lfQkNDX1JFQ0lQSUVOVFNfSUQsXG5cdExFR0FDWV9CT0RZX0lELFxuXHRMRUdBQ1lfQ0NfUkVDSVBJRU5UU19JRCxcblx0TEVHQUNZX1RPX1JFQ0lQSUVOVFNfSUQsXG5cdGxpc3RJZFBhcnQsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5pbXBvcnQge1xuXHRfY3JlYXRlTmV3SW5kZXhVcGRhdGUsXG5cdGVuY3J5cHRJbmRleEtleUJhc2U2NCxcblx0ZmlsdGVyTWFpbE1lbWJlcnNoaXBzLFxuXHRnZXRQZXJmb3JtYW5jZVRpbWVzdGFtcCxcblx0aHRtbFRvVGV4dCxcblx0dHlwZVJlZlRvVHlwZUluZm8sXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9zZWFyY2gvSW5kZXhVdGlscy5qc1wiXG5pbXBvcnQgeyBEYiwgR3JvdXBEYXRhLCBJbmRleGluZ0Vycm9yUmVhc29uLCBJbmRleFVwZGF0ZSwgU2VhcmNoSW5kZXhFbnRyeSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL3dvcmtlci9zZWFyY2gvU2VhcmNoVHlwZXMuanNcIlxuaW1wb3J0IHsgQ2FuY2VsbGVkRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvQ2FuY2VsbGVkRXJyb3IuanNcIlxuaW1wb3J0IHsgSW5kZXhlckNvcmUgfSBmcm9tIFwiLi9JbmRleGVyQ29yZS5qc1wiXG5pbXBvcnQgeyBEYkVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL0RiRXJyb3IuanNcIlxuaW1wb3J0IHR5cGUgeyBEYXRlUHJvdmlkZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvRGF0ZVByb3ZpZGVyLmpzXCJcbmltcG9ydCB0eXBlIHsgRW50aXR5VXBkYXRlLCBHcm91cE1lbWJlcnNoaXAsIFVzZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgRW50aXR5Q2xpZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudGl0eUNsaWVudC5qc1wiXG5pbXBvcnQgeyBQcm9ncmVzc01vbml0b3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvUHJvZ3Jlc3NNb25pdG9yLmpzXCJcbmltcG9ydCB7IEluZm9NZXNzYWdlSGFuZGxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0luZm9NZXNzYWdlSGFuZGxlci5qc1wiXG5pbXBvcnQgeyBFbGVtZW50RGF0YU9TLCBHcm91cERhdGFPUywgTWV0YWRhdGEsIE1ldGFEYXRhT1MgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvc2VhcmNoL0luZGV4VGFibGVzLmpzXCJcbmltcG9ydCB7IE1haWxGYWNhZGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L01haWxGYWNhZGUuanNcIlxuaW1wb3J0IHsgY29udGFpbnNFdmVudE9mVHlwZSwgRW50aXR5VXBkYXRlRGF0YSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVcGRhdGVVdGlscy5qc1wiXG5pbXBvcnQgeyBiNjRVc2VySWRIYXNoIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL3NlYXJjaC9EYkZhY2FkZS5qc1wiXG5pbXBvcnQgeyBoYXNFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FcnJvclV0aWxzLmpzXCJcbmltcG9ydCB7IGdldERpc3BsYXllZFNlbmRlciwgZ2V0TWFpbEJvZHlUZXh0LCBNYWlsQWRkcmVzc0FuZE5hbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vQ29tbW9uTWFpbFV0aWxzLmpzXCJcbmltcG9ydCB7IGlzRHJhZnQgfSBmcm9tIFwiLi4vLi4vbWFpbC9tb2RlbC9NYWlsQ2hlY2tzLmpzXCJcbmltcG9ydCB7IEJ1bGtNYWlsTG9hZGVyIH0gZnJvbSBcIi4vQnVsa01haWxMb2FkZXIuanNcIlxuXG5leHBvcnQgY29uc3QgSU5JVElBTF9NQUlMX0lOREVYX0lOVEVSVkFMX0RBWVMgPSAyOFxuY29uc3QgTUFJTF9JTkRFWF9CQVRDSF9JTlRFUlZBTCA9IDEwMDAgKiA2MCAqIDYwICogMjQgLy8gb25lIGRheVxuXG5leHBvcnQgY2xhc3MgTWFpbEluZGV4ZXIge1xuXHQvLyB7QGxpbmsgY3VycmVudEluZGV4VGltZXN0YW1wfTogdGhlICoqb2xkZXN0KiogdGltZXN0YW1wIHRoYXQgaGFzIGJlZW4gaW5kZXhlZCBmb3IgYWxsIG1haWwgbGlzdHNcblx0Ly8gVGhlcmUgYXJlIHR3byBzY2VuYXJpb3MgaW4gd2hpY2ggbmV3IG1haWxzIGFyZSBpbmRleGVkOlxuXHQvLyBhKSBhIG5ldyBtYWlsIChpbnRlcm5hbC9leHRlcm5hbCkgaXMgcmVjZWl2ZWQgZnJvbSBvdXIgbWFpbCBzZXJ2ZXJcblx0Ly8gXHQgICogbWFpbCB0aW1lc3RhbXAgaXMgZ3VhcmFudGVlZCB0byBiZSBuZXdlciB0aGFuIHRoZSBjdXJyZW50SW5kZXhUaW1lc3RhbXBcblx0Ly8gICAgXHQ9PiBtYWlsIHdpbGwgYmUgaW5kZXhlZFxuXHQvLyBiKSBhbiBvbGQgbWFpbCBpcyBpbXBvcnRlZCB0byBvdXIgdHV0YWRiIHNlcnZlclxuXHQvLyBcdCAgKiBtYWlsIHRpbWVzdGFtcCBpcyBuZXdlciB0aGFuIGN1cnJlbnRJbmRleFRpbWVzdGFtcFxuXHQvLyAgICBcdD0+IG1haWwgd2lsbCBiZSBpbmRleGVkXG5cdC8vICAgICogbWFpbCB0aW1lc3RhbXAgaXMgb2xkZXIgdGhhbiBjdXJyZW50SW5kZXhUaW1lc3RhbXBcblx0Ly8gICAgXHQ9PiBtYWlsIHdpbGwgbm90IGJlIGluZGV4ZWRcblx0Y3VycmVudEluZGV4VGltZXN0YW1wOiBudW1iZXJcblxuXHRtYWlsSW5kZXhpbmdFbmFibGVkOiBib29sZWFuXG5cdG1haWxib3hJbmRleGluZ1Byb21pc2U6IFByb21pc2U8dm9pZD5cblx0aXNJbmRleGluZzogYm9vbGVhbiA9IGZhbHNlXG5cdF9pbmRleGluZ0NhbmNlbGxlZDogYm9vbGVhblxuXHRfY29yZTogSW5kZXhlckNvcmVcblx0X2RiOiBEYlxuXHRfZGF0ZVByb3ZpZGVyOiBEYXRlUHJvdmlkZXJcblxuXHRjb25zdHJ1Y3Rvcihcblx0XHRjb3JlOiBJbmRleGVyQ29yZSxcblx0XHRkYjogRGIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBpbmZvTWVzc2FnZUhhbmRsZXI6IEluZm9NZXNzYWdlSGFuZGxlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGJ1bGtMb2FkZXJGYWN0b3J5OiAoKSA9PiBCdWxrTWFpbExvYWRlcixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGVudGl0eUNsaWVudDogRW50aXR5Q2xpZW50LFxuXHRcdGRhdGVQcm92aWRlcjogRGF0ZVByb3ZpZGVyLFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbWFpbEZhY2FkZTogTWFpbEZhY2FkZSxcblx0KSB7XG5cdFx0dGhpcy5fY29yZSA9IGNvcmVcblx0XHR0aGlzLl9kYiA9IGRiXG5cdFx0dGhpcy5jdXJyZW50SW5kZXhUaW1lc3RhbXAgPSBOT1RISU5HX0lOREVYRURfVElNRVNUQU1QXG5cdFx0dGhpcy5tYWlsSW5kZXhpbmdFbmFibGVkID0gZmFsc2Vcblx0XHR0aGlzLm1haWxib3hJbmRleGluZ1Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKVxuXHRcdHRoaXMuX2luZGV4aW5nQ2FuY2VsbGVkID0gZmFsc2Vcblx0XHR0aGlzLl9kYXRlUHJvdmlkZXIgPSBkYXRlUHJvdmlkZXJcblx0fVxuXG5cdGNyZWF0ZU1haWxJbmRleEVudHJpZXMobWFpbDogTWFpbCwgbWFpbERldGFpbHM6IE1haWxEZXRhaWxzLCBmaWxlczogVHV0YW5vdGFGaWxlW10pOiBNYXA8c3RyaW5nLCBTZWFyY2hJbmRleEVudHJ5W10+IHtcblx0XHRsZXQgc3RhcnRUaW1lSW5kZXggPSBnZXRQZXJmb3JtYW5jZVRpbWVzdGFtcCgpXG5cblx0XHQvLyBhdm9pZCBjYWNoaW5nIHN5c3RlbUB0dXRhbm90YS5kZSBzaW5jZSB0aGUgdXNlciB3b3VsZG4ndCBiZSBzZWFyY2hpbmcgZm9yIHRoaXNcblx0XHRsZXQgc2VuZGVyVG9JbmRleDogTWFpbEFkZHJlc3NBbmROYW1lXG5cblx0XHRjb25zdCBoYXNTZW5kZXIgPSBtYWlsLnNlbmRlciAhPSBudWxsXG5cdFx0aWYgKGhhc1NlbmRlcikgc2VuZGVyVG9JbmRleCA9IGdldERpc3BsYXllZFNlbmRlcihtYWlsKVxuXG5cdFx0Y29uc3QgTWFpbE1vZGVsID0gdHlwZU1vZGVscy5NYWlsXG5cdFx0Y29uc3QgTWFpbERldGFpbHNNb2RlbCA9IHR5cGVNb2RlbHMuTWFpbERldGFpbHNcblx0XHRjb25zdCBSZWNpcGllbnRNb2RlbCA9IHR5cGVNb2RlbHMuUmVjaXBpZW50c1xuXHRcdGxldCBrZXlUb0luZGV4RW50cmllcyA9IHRoaXMuX2NvcmUuY3JlYXRlSW5kZXhFbnRyaWVzRm9yQXR0cmlidXRlcyhtYWlsLCBbXG5cdFx0XHR7XG5cdFx0XHRcdGF0dHJpYnV0ZTogTWFpbE1vZGVsLnZhbHVlc1tcInN1YmplY3RcIl0sXG5cdFx0XHRcdHZhbHVlOiAoKSA9PiBtYWlsLnN1YmplY3QsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHQvLyBhbGxvd3Mgb2xkIGluZGV4IGVudHJpZXMgKHByZS1tYWlsZGV0YWlscykgdG8gYmUgdXNlZCB3aXRoIG5ldyBjbGllbnRzLlxuXHRcdFx0XHRhdHRyaWJ1dGU6IE9iamVjdC5hc3NpZ24oe30sIFJlY2lwaWVudE1vZGVsLmFzc29jaWF0aW9uc1tcInRvUmVjaXBpZW50c1wiXSwgeyBpZDogTEVHQUNZX1RPX1JFQ0lQSUVOVFNfSUQgfSksXG5cdFx0XHRcdHZhbHVlOiAoKSA9PiBtYWlsRGV0YWlscy5yZWNpcGllbnRzLnRvUmVjaXBpZW50cy5tYXAoKHIpID0+IHIubmFtZSArIFwiIDxcIiArIHIuYWRkcmVzcyArIFwiPlwiKS5qb2luKFwiLFwiKSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdC8vIGFsbG93cyBvbGQgaW5kZXggZW50cmllcyAocHJlLW1haWxkZXRhaWxzKSB0byBiZSB1c2VkIHdpdGggbmV3IGNsaWVudHMuXG5cdFx0XHRcdGF0dHJpYnV0ZTogT2JqZWN0LmFzc2lnbih7fSwgUmVjaXBpZW50TW9kZWwuYXNzb2NpYXRpb25zW1wiY2NSZWNpcGllbnRzXCJdLCB7IGlkOiBMRUdBQ1lfQ0NfUkVDSVBJRU5UU19JRCB9KSxcblx0XHRcdFx0dmFsdWU6ICgpID0+IG1haWxEZXRhaWxzLnJlY2lwaWVudHMuY2NSZWNpcGllbnRzLm1hcCgocikgPT4gci5uYW1lICsgXCIgPFwiICsgci5hZGRyZXNzICsgXCI+XCIpLmpvaW4oXCIsXCIpLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0Ly8gYWxsb3dzIG9sZCBpbmRleCBlbnRyaWVzIChwcmUtbWFpbGRldGFpbHMpIHRvIGJlIHVzZWQgd2l0aCBuZXcgY2xpZW50cy5cblx0XHRcdFx0YXR0cmlidXRlOiBPYmplY3QuYXNzaWduKHt9LCBSZWNpcGllbnRNb2RlbC5hc3NvY2lhdGlvbnNbXCJiY2NSZWNpcGllbnRzXCJdLCB7IGlkOiBMRUdBQ1lfQkNDX1JFQ0lQSUVOVFNfSUQgfSksXG5cdFx0XHRcdHZhbHVlOiAoKSA9PiBtYWlsRGV0YWlscy5yZWNpcGllbnRzLmJjY1JlY2lwaWVudHMubWFwKChyKSA9PiByLm5hbWUgKyBcIiA8XCIgKyByLmFkZHJlc3MgKyBcIj5cIikuam9pbihcIixcIiksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRhdHRyaWJ1dGU6IE1haWxNb2RlbC5hc3NvY2lhdGlvbnNbXCJzZW5kZXJcIl0sXG5cdFx0XHRcdHZhbHVlOiAoKSA9PiAoaGFzU2VuZGVyID8gc2VuZGVyVG9JbmRleC5uYW1lICsgXCIgPFwiICsgc2VuZGVyVG9JbmRleC5hZGRyZXNzICsgXCI+XCIgOiBcIlwiKSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdC8vIGFsbG93cyBvbGQgaW5kZXggZW50cmllcyAocHJlLW1haWxkZXRhaWxzKSB0byBiZSB1c2VkIHdpdGggbmV3IGNsaWVudHMuXG5cdFx0XHRcdGF0dHJpYnV0ZTogT2JqZWN0LmFzc2lnbih7fSwgTWFpbERldGFpbHNNb2RlbC5hc3NvY2lhdGlvbnNbXCJib2R5XCJdLCB7IGlkOiBMRUdBQ1lfQk9EWV9JRCB9KSxcblx0XHRcdFx0dmFsdWU6ICgpID0+IGh0bWxUb1RleHQoZ2V0TWFpbEJvZHlUZXh0KG1haWxEZXRhaWxzLmJvZHkpKSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGF0dHJpYnV0ZTogTWFpbE1vZGVsLmFzc29jaWF0aW9uc1tcImF0dGFjaG1lbnRzXCJdLFxuXHRcdFx0XHR2YWx1ZTogKCkgPT4gZmlsZXMubWFwKChmaWxlKSA9PiBmaWxlLm5hbWUpLmpvaW4oXCIgXCIpLFxuXHRcdFx0fSxcblx0XHRdKVxuXG5cdFx0dGhpcy5fY29yZS5fc3RhdHMuaW5kZXhpbmdUaW1lICs9IGdldFBlcmZvcm1hbmNlVGltZXN0YW1wKCkgLSBzdGFydFRpbWVJbmRleFxuXHRcdHJldHVybiBrZXlUb0luZGV4RW50cmllc1xuXHR9XG5cblx0cHJvY2Vzc05ld01haWwobWFpbElkOiBJZFR1cGxlKTogUHJvbWlzZTx7XG5cdFx0bWFpbDogTWFpbFxuXHRcdGtleVRvSW5kZXhFbnRyaWVzOiBNYXA8c3RyaW5nLCBTZWFyY2hJbmRleEVudHJ5W10+XG5cdH0gfCBudWxsPiB7XG5cdFx0cmV0dXJuIHRoaXMuZW50aXR5Q2xpZW50XG5cdFx0XHQubG9hZChNYWlsVHlwZVJlZiwgbWFpbElkKVxuXHRcdFx0LnRoZW4oYXN5bmMgKG1haWwpID0+IHtcblx0XHRcdFx0bGV0IG1haWxEZXRhaWxzOiBNYWlsRGV0YWlsc1xuXHRcdFx0XHRpZiAoaXNEcmFmdChtYWlsKSkge1xuXHRcdFx0XHRcdC8vIFdpbGwgYmUgYWx3YXlzIHRoZXJlLCBpZiBpdCB3YXMgbm90IHVwZGF0ZWQgeWV0LCBpdCB3aWxsIHN0aWxsIGJlIHNldCBieSBDcnlwdG9GYWNhZGVcblx0XHRcdFx0XHRjb25zdCBtYWlsT3duZXJFbmNTZXNzaW9uS2V5ID0gYXNzZXJ0Tm90TnVsbChtYWlsLl9vd25lckVuY1Nlc3Npb25LZXkpXG5cdFx0XHRcdFx0Y29uc3QgbWFpbERldGFpbHNEcmFmdElkID0gYXNzZXJ0Tm90TnVsbChtYWlsLm1haWxEZXRhaWxzRHJhZnQpXG5cdFx0XHRcdFx0bWFpbERldGFpbHMgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudFxuXHRcdFx0XHRcdFx0LmxvYWRNdWx0aXBsZShNYWlsRGV0YWlsc0RyYWZ0VHlwZVJlZiwgbGlzdElkUGFydChtYWlsRGV0YWlsc0RyYWZ0SWQpLCBbZWxlbWVudElkUGFydChtYWlsRGV0YWlsc0RyYWZ0SWQpXSwgYXN5bmMgKCkgPT4gKHtcblx0XHRcdFx0XHRcdFx0a2V5OiBtYWlsT3duZXJFbmNTZXNzaW9uS2V5LFxuXHRcdFx0XHRcdFx0XHRlbmNyeXB0aW5nS2V5VmVyc2lvbjogTnVtYmVyKG1haWwuX293bmVyS2V5VmVyc2lvbiA/PyAwKSxcblx0XHRcdFx0XHRcdH0pKVxuXHRcdFx0XHRcdFx0LnRoZW4oKGQpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgZHJhZnQgPSBmaXJzdChkKVxuXHRcdFx0XHRcdFx0XHRpZiAoZHJhZnQgPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRcdHRocm93IG5ldyBOb3RGb3VuZEVycm9yKGBNYWlsRGV0YWlsc0RyYWZ0ICR7bWFpbERldGFpbHNEcmFmdElkfWApXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGRyYWZ0LmRldGFpbHNcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gV2lsbCBiZSBhbHdheXMgdGhlcmUsIGlmIGl0IHdhcyBub3QgdXBkYXRlZCB5ZXQgaXQgd2lsbCBzdGlsbCBiZSBzZXQgYnkgQ3J5cHRvRmFjYWRlXG5cdFx0XHRcdFx0Y29uc3QgbWFpbE93bmVyRW5jU2Vzc2lvbktleSA9IGFzc2VydE5vdE51bGwobWFpbC5fb3duZXJFbmNTZXNzaW9uS2V5KVxuXHRcdFx0XHRcdGNvbnN0IG1haWxEZXRhaWxzQmxvYklkID0gbmV2ZXJOdWxsKG1haWwubWFpbERldGFpbHMpXG5cdFx0XHRcdFx0bWFpbERldGFpbHMgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudFxuXHRcdFx0XHRcdFx0LmxvYWRNdWx0aXBsZShNYWlsRGV0YWlsc0Jsb2JUeXBlUmVmLCBsaXN0SWRQYXJ0KG1haWxEZXRhaWxzQmxvYklkKSwgW2VsZW1lbnRJZFBhcnQobWFpbERldGFpbHNCbG9iSWQpXSwgYXN5bmMgKCkgPT4gKHtcblx0XHRcdFx0XHRcdFx0a2V5OiBtYWlsT3duZXJFbmNTZXNzaW9uS2V5LFxuXHRcdFx0XHRcdFx0XHRlbmNyeXB0aW5nS2V5VmVyc2lvbjogTnVtYmVyKG1haWwuX293bmVyS2V5VmVyc2lvbiA/PyAwKSxcblx0XHRcdFx0XHRcdH0pKVxuXHRcdFx0XHRcdFx0LnRoZW4oKGQpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgYmxvYiA9IGZpcnN0KGQpXG5cdFx0XHRcdFx0XHRcdGlmIChibG9iID09IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgTm90Rm91bmRFcnJvcihgTWFpbERldGFpbHNCbG9iICR7bWFpbERldGFpbHNCbG9iSWR9YClcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gYmxvYi5kZXRhaWxzXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5tYWlsRmFjYWRlLmxvYWRBdHRhY2htZW50cyhtYWlsKVxuXHRcdFx0XHRsZXQga2V5VG9JbmRleEVudHJpZXMgPSB0aGlzLmNyZWF0ZU1haWxJbmRleEVudHJpZXMobWFpbCwgbWFpbERldGFpbHMsIGZpbGVzKVxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdG1haWwsXG5cdFx0XHRcdFx0a2V5VG9JbmRleEVudHJpZXMsXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2goXG5cdFx0XHRcdG9mQ2xhc3MoTm90Rm91bmRFcnJvciwgKCkgPT4ge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwidHJpZWQgdG8gaW5kZXggbm9uIGV4aXN0aW5nIG1haWxcIilcblx0XHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHRcdC5jYXRjaChcblx0XHRcdFx0b2ZDbGFzcyhOb3RBdXRob3JpemVkRXJyb3IsICgpID0+IHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcInRyaWVkIHRvIGluZGV4IGNvbnRhY3Qgd2l0aG91dCBwZXJtaXNzaW9uXCIpXG5cdFx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdH1cblxuXHRwcm9jZXNzTW92ZWRNYWlsKGV2ZW50OiBFbnRpdHlVcGRhdGUsIGluZGV4VXBkYXRlOiBJbmRleFVwZGF0ZSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGxldCBlbmNJbnN0YW5jZUlkID0gZW5jcnlwdEluZGV4S2V5QmFzZTY0KHRoaXMuX2RiLmtleSwgZXZlbnQuaW5zdGFuY2VJZCwgdGhpcy5fZGIuaXYpXG5cdFx0cmV0dXJuIHRoaXMuX2RiLmRiRmFjYWRlLmNyZWF0ZVRyYW5zYWN0aW9uKHRydWUsIFtFbGVtZW50RGF0YU9TXSkudGhlbigodHJhbnNhY3Rpb24pID0+IHtcblx0XHRcdHJldHVybiB0cmFuc2FjdGlvbi5nZXQoRWxlbWVudERhdGFPUywgZW5jSW5zdGFuY2VJZCkudGhlbigoZWxlbWVudERhdGEpID0+IHtcblx0XHRcdFx0aWYgKGVsZW1lbnREYXRhKSB7XG5cdFx0XHRcdFx0aW5kZXhVcGRhdGUubW92ZS5wdXNoKHtcblx0XHRcdFx0XHRcdGVuY0luc3RhbmNlSWQsXG5cdFx0XHRcdFx0XHRuZXdMaXN0SWQ6IGV2ZW50Lmluc3RhbmNlTGlzdElkLFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gaW5zdGFuY2UgaXMgbW92ZWQgYnV0IG5vdCB5ZXQgaW5kZXhlZDogaGFuZGxlIGFzIG5ldyBmb3IgZXhhbXBsZSBtb3ZpbmcgYSBtYWlsIGZyb20gbm9uIGluZGV4ZWQgZm9sZGVyIGxpa2Ugc3BhbSB0byBpbmRleGVkIGZvbGRlclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnByb2Nlc3NOZXdNYWlsKFtldmVudC5pbnN0YW5jZUxpc3RJZCwgZXZlbnQuaW5zdGFuY2VJZF0pLnRoZW4oKHJlc3VsdCkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKHJlc3VsdCkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLl9jb3JlLmVuY3J5cHRTZWFyY2hJbmRleEVudHJpZXMocmVzdWx0Lm1haWwuX2lkLCBuZXZlck51bGwocmVzdWx0Lm1haWwuX293bmVyR3JvdXApLCByZXN1bHQua2V5VG9JbmRleEVudHJpZXMsIGluZGV4VXBkYXRlKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fSlcblx0fVxuXG5cdGFzeW5jIGVuYWJsZU1haWxJbmRleGluZyh1c2VyOiBVc2VyKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgdCA9IGF3YWl0IHRoaXMuX2RiLmRiRmFjYWRlLmNyZWF0ZVRyYW5zYWN0aW9uKHRydWUsIFtNZXRhRGF0YU9TXSlcblx0XHRjb25zdCBlbmFibGVkID0gYXdhaXQgdC5nZXQoTWV0YURhdGFPUywgTWV0YWRhdGEubWFpbEluZGV4aW5nRW5hYmxlZClcblx0XHRpZiAoIWVuYWJsZWQpIHtcblx0XHRcdHRoaXMubWFpbEluZGV4aW5nRW5hYmxlZCA9IHRydWVcblx0XHRcdGNvbnN0IHQyID0gYXdhaXQgdGhpcy5fZGIuZGJGYWNhZGUuY3JlYXRlVHJhbnNhY3Rpb24oZmFsc2UsIFtNZXRhRGF0YU9TXSlcblx0XHRcdHQyLnB1dChNZXRhRGF0YU9TLCBNZXRhZGF0YS5tYWlsSW5kZXhpbmdFbmFibGVkLCB0cnVlKVxuXHRcdFx0dDIucHV0KE1ldGFEYXRhT1MsIE1ldGFkYXRhLmV4Y2x1ZGVkTGlzdElkcywgW10pXG5cblx0XHRcdC8vIGNyZWF0ZSBpbmRleCBpbiBiYWNrZ3JvdW5kLCB0ZXJtaW5hdGlvbiBpcyBoYW5kbGVkIGluIEluZGV4ZXIuZW5hYmxlTWFpbEluZGV4aW5nXG5cdFx0XHRjb25zdCBvbGRlc3RUaW1lc3RhbXAgPSB0aGlzLl9kYXRlUHJvdmlkZXIuZ2V0U3RhcnRPZkRheVNoaWZ0ZWRCeSgtSU5JVElBTF9NQUlMX0lOREVYX0lOVEVSVkFMX0RBWVMpLmdldFRpbWUoKVxuXG5cdFx0XHR0aGlzLmluZGV4TWFpbGJveGVzKHVzZXIsIG9sZGVzdFRpbWVzdGFtcCkuY2F0Y2goXG5cdFx0XHRcdG9mQ2xhc3MoQ2FuY2VsbGVkRXJyb3IsIChlKSA9PiB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJjYW5jZWxsZWQgaW5pdGlhbCBpbmRleGluZ1wiLCBlKVxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHRcdHJldHVybiB0Mi53YWl0KClcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHQuZ2V0KE1ldGFEYXRhT1MsIE1ldGFkYXRhLmV4Y2x1ZGVkTGlzdElkcykudGhlbigoZXhjbHVkZWRMaXN0SWRzKSA9PiB7XG5cdFx0XHRcdHRoaXMubWFpbEluZGV4aW5nRW5hYmxlZCA9IHRydWVcblx0XHRcdH0pXG5cdFx0fVxuXHR9XG5cblx0ZGlzYWJsZU1haWxJbmRleGluZyh1c2VySWQ6IElkKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5tYWlsSW5kZXhpbmdFbmFibGVkID0gZmFsc2Vcblx0XHR0aGlzLl9pbmRleGluZ0NhbmNlbGxlZCA9IHRydWVcblx0XHRyZXR1cm4gdGhpcy5fZGIuZGJGYWNhZGUuZGVsZXRlRGF0YWJhc2UoYjY0VXNlcklkSGFzaCh1c2VySWQpKVxuXHR9XG5cblx0Y2FuY2VsTWFpbEluZGV4aW5nKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMuX2luZGV4aW5nQ2FuY2VsbGVkID0gdHJ1ZVxuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHR9XG5cblx0LyoqXG5cdCAqIEV4dGVuZCBtYWlsIGluZGV4IGlmIG5vdCBpbmRleGVkIHRoaXMgcmFuZ2UgeWV0LlxuXHQgKiBuZXdPbGRlc3RUaW1lc3RhbXAgc2hvdWxkIGJlIGFsaWduZWQgdG8gdGhlIHN0YXJ0IG9mIHRoZSBkYXkgdXAgdW50aWwgd2hpY2ggeW91IHdhbnQgdG8gaW5kZXgsIHdlIGRvbid0IGRvIHJvdW5kaW5nIGluc2lkZSBoZXJlLlxuXHQgKi9cblx0YXN5bmMgZXh0ZW5kSW5kZXhJZk5lZWRlZCh1c2VyOiBVc2VyLCBuZXdPbGRlc3RUaW1lc3RhbXA6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICh0aGlzLmN1cnJlbnRJbmRleFRpbWVzdGFtcCA+IEZVTExfSU5ERVhFRF9USU1FU1RBTVAgJiYgdGhpcy5jdXJyZW50SW5kZXhUaW1lc3RhbXAgPiBuZXdPbGRlc3RUaW1lc3RhbXApIHtcblx0XHRcdHRoaXMubWFpbGJveEluZGV4aW5nUHJvbWlzZSA9IHRoaXMubWFpbGJveEluZGV4aW5nUHJvbWlzZVxuXHRcdFx0XHQudGhlbigoKSA9PiB0aGlzLmluZGV4TWFpbGJveGVzKHVzZXIsIG5ld09sZGVzdFRpbWVzdGFtcCkpXG5cdFx0XHRcdC5jYXRjaChcblx0XHRcdFx0XHRvZkNsYXNzKENhbmNlbGxlZEVycm9yLCAoZSkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXCJleHRlbmQgbWFpbCBpbmRleCBoYXMgYmVlbiBjYW5jZWxsZWRcIiwgZSlcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0KVxuXHRcdFx0cmV0dXJuIHRoaXMubWFpbGJveEluZGV4aW5nUHJvbWlzZVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBJbmRleGVzIGFsbCBtYWlsYm94ZXMgb2YgdGhlIGdpdmVuIHVzZXIgdXAgdG8gdGhlIGVuZEluZGV4VGltZXN0YW1wIGlmIG1haWwgaW5kZXhpbmcgaXMgZW5hYmxlZC5cblx0ICogSWYgdGhlIG1haWxib3hlcyBhcmUgYWxyZWFkeSBmdWxseSBpbmRleGVkLCB0aGV5IGFyZSBub3QgaW5kZXhlZCBhZ2Fpbi5cblx0ICovXG5cdGFzeW5jIGluZGV4TWFpbGJveGVzKHVzZXI6IFVzZXIsIG9sZGVzdFRpbWVzdGFtcDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKCF0aGlzLm1haWxJbmRleGluZ0VuYWJsZWQpIHtcblx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHRcdH1cblxuXHRcdHRoaXMuaXNJbmRleGluZyA9IHRydWVcblx0XHR0aGlzLl9pbmRleGluZ0NhbmNlbGxlZCA9IGZhbHNlXG5cblx0XHR0aGlzLl9jb3JlLnJlc2V0U3RhdHMoKVxuXG5cdFx0YXdhaXQgdGhpcy5pbmZvTWVzc2FnZUhhbmRsZXIub25TZWFyY2hJbmRleFN0YXRlVXBkYXRlKHtcblx0XHRcdGluaXRpYWxpemluZzogZmFsc2UsXG5cdFx0XHRtYWlsSW5kZXhFbmFibGVkOiB0aGlzLm1haWxJbmRleGluZ0VuYWJsZWQsXG5cdFx0XHRwcm9ncmVzczogMSxcblx0XHRcdGN1cnJlbnRNYWlsSW5kZXhUaW1lc3RhbXA6IHRoaXMuY3VycmVudEluZGV4VGltZXN0YW1wLFxuXHRcdFx0YWltZWRNYWlsSW5kZXhUaW1lc3RhbXA6IG9sZGVzdFRpbWVzdGFtcCxcblx0XHRcdGluZGV4ZWRNYWlsQ291bnQ6IDAsXG5cdFx0XHRmYWlsZWRJbmRleGluZ1VwVG86IG51bGwsXG5cdFx0fSlcblxuXHRcdGxldCBtZW1iZXJzaGlwcyA9IGZpbHRlck1haWxNZW1iZXJzaGlwcyh1c2VyKVxuXG5cdFx0dGhpcy5fY29yZS5xdWV1ZS5wYXVzZSgpXG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgbWFpbEJveGVzOiBBcnJheTx7IG1ib3g6IE1haWxCb3g7IG5ld2VzdFRpbWVzdGFtcDogbnVtYmVyIH0+ID0gW11cblxuXHRcdFx0Zm9yIChsZXQgbWFpbEdyb3VwTWVtYmVyc2hpcCBvZiBtZW1iZXJzaGlwcykge1xuXHRcdFx0XHRsZXQgbWFpbEdyb3VwSWQgPSBtYWlsR3JvdXBNZW1iZXJzaGlwLmdyb3VwXG5cdFx0XHRcdGNvbnN0IG1haWxib3hHcm91cFJvb3QgPSBhd2FpdCB0aGlzLmVudGl0eUNsaWVudC5sb2FkKE1haWxib3hHcm91cFJvb3RUeXBlUmVmLCBtYWlsR3JvdXBJZClcblx0XHRcdFx0Y29uc3QgbWFpbGJveCA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoTWFpbEJveFR5cGVSZWYsIG1haWxib3hHcm91cFJvb3QubWFpbGJveClcblxuXHRcdFx0XHRjb25zdCB0cmFuc2FjdGlvbiA9IGF3YWl0IHRoaXMuX2RiLmRiRmFjYWRlLmNyZWF0ZVRyYW5zYWN0aW9uKHRydWUsIFtHcm91cERhdGFPU10pXG5cdFx0XHRcdGNvbnN0IGdyb3VwRGF0YSA9IGF3YWl0IHRyYW5zYWN0aW9uLmdldChHcm91cERhdGFPUywgbWFpbEdyb3VwSWQpXG5cblx0XHRcdFx0Ly8gZ3JvdXAgZGF0YSBpcyBub3QgYXZhaWxhYmxlIGlmIGdyb3VwIGhhcyBiZWVuIGFkZGVkLiBncm91cCB3aWxsIGJlIGluZGV4ZWQgYWZ0ZXIgbG9naW4uXG5cdFx0XHRcdGlmIChncm91cERhdGEpIHtcblx0XHRcdFx0XHRjb25zdCBuZXdlc3RUaW1lc3RhbXAgPVxuXHRcdFx0XHRcdFx0Z3JvdXBEYXRhLmluZGV4VGltZXN0YW1wID09PSBOT1RISU5HX0lOREVYRURfVElNRVNUQU1QXG5cdFx0XHRcdFx0XHRcdD8gdGhpcy5fZGF0ZVByb3ZpZGVyLmdldFN0YXJ0T2ZEYXlTaGlmdGVkQnkoMSkuZ2V0VGltZSgpXG5cdFx0XHRcdFx0XHRcdDogZ3JvdXBEYXRhLmluZGV4VGltZXN0YW1wXG5cblx0XHRcdFx0XHRpZiAobmV3ZXN0VGltZXN0YW1wID4gb2xkZXN0VGltZXN0YW1wKSB7XG5cdFx0XHRcdFx0XHRtYWlsQm94ZXMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdG1ib3g6IG1haWxib3gsXG5cdFx0XHRcdFx0XHRcdG5ld2VzdFRpbWVzdGFtcCxcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChtYWlsQm94ZXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRhd2FpdCB0aGlzLl9pbmRleE1haWxMaXN0cyhtYWlsQm94ZXMsIG9sZGVzdFRpbWVzdGFtcClcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5fY29yZS5wcmludFN0YXR1cygpXG5cblx0XHRcdGF3YWl0IHRoaXMudXBkYXRlQ3VycmVudEluZGV4VGltZXN0YW1wKHVzZXIpXG5cblx0XHRcdGF3YWl0IHRoaXMuaW5mb01lc3NhZ2VIYW5kbGVyLm9uU2VhcmNoSW5kZXhTdGF0ZVVwZGF0ZSh7XG5cdFx0XHRcdGluaXRpYWxpemluZzogZmFsc2UsXG5cdFx0XHRcdG1haWxJbmRleEVuYWJsZWQ6IHRoaXMubWFpbEluZGV4aW5nRW5hYmxlZCxcblx0XHRcdFx0cHJvZ3Jlc3M6IDAsXG5cdFx0XHRcdGN1cnJlbnRNYWlsSW5kZXhUaW1lc3RhbXA6IHRoaXMuY3VycmVudEluZGV4VGltZXN0YW1wLFxuXHRcdFx0XHRhaW1lZE1haWxJbmRleFRpbWVzdGFtcDogb2xkZXN0VGltZXN0YW1wLFxuXHRcdFx0XHRpbmRleGVkTWFpbENvdW50OiB0aGlzLl9jb3JlLl9zdGF0cy5tYWlsY291bnQsXG5cdFx0XHRcdGZhaWxlZEluZGV4aW5nVXBUbzogbnVsbCxcblx0XHRcdH0pXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y29uc29sZS53YXJuKFwiTWFpbCBpbmRleGluZyBmYWlsZWQ6IFwiLCBlKVxuXHRcdFx0Ly8gYXZvaWQgdGhhdCBhIHJlamVjdGVkIHByb21pc2UgaXMgc3RvcmVkXG5cdFx0XHR0aGlzLm1haWxib3hJbmRleGluZ1Byb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKVxuXHRcdFx0YXdhaXQgdGhpcy51cGRhdGVDdXJyZW50SW5kZXhUaW1lc3RhbXAodXNlcilcblxuXHRcdFx0Y29uc3Qgc3VjY2VzcyA9IHRoaXMuX2NvcmUuaXNTdG9wcGVkUHJvY2Vzc2luZygpIHx8IGUgaW5zdGFuY2VvZiBDYW5jZWxsZWRFcnJvclxuXG5cdFx0XHRjb25zdCBmYWlsZWRJbmRleGluZ1VwVG8gPSBzdWNjZXNzID8gbnVsbCA6IG9sZGVzdFRpbWVzdGFtcFxuXG5cdFx0XHRjb25zdCBlcnJvciA9IHN1Y2Nlc3MgPyBudWxsIDogZSBpbnN0YW5jZW9mIENvbm5lY3Rpb25FcnJvciA/IEluZGV4aW5nRXJyb3JSZWFzb24uQ29ubmVjdGlvbkxvc3QgOiBJbmRleGluZ0Vycm9yUmVhc29uLlVua25vd25cblxuXHRcdFx0YXdhaXQgdGhpcy5pbmZvTWVzc2FnZUhhbmRsZXIub25TZWFyY2hJbmRleFN0YXRlVXBkYXRlKHtcblx0XHRcdFx0aW5pdGlhbGl6aW5nOiBmYWxzZSxcblx0XHRcdFx0bWFpbEluZGV4RW5hYmxlZDogdGhpcy5tYWlsSW5kZXhpbmdFbmFibGVkLFxuXHRcdFx0XHRwcm9ncmVzczogMCxcblx0XHRcdFx0Y3VycmVudE1haWxJbmRleFRpbWVzdGFtcDogdGhpcy5jdXJyZW50SW5kZXhUaW1lc3RhbXAsXG5cdFx0XHRcdGFpbWVkTWFpbEluZGV4VGltZXN0YW1wOiBvbGRlc3RUaW1lc3RhbXAsXG5cdFx0XHRcdGluZGV4ZWRNYWlsQ291bnQ6IHRoaXMuX2NvcmUuX3N0YXRzLm1haWxjb3VudCxcblx0XHRcdFx0ZmFpbGVkSW5kZXhpbmdVcFRvLFxuXHRcdFx0XHRlcnJvcixcblx0XHRcdH0pXG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHRoaXMuX2NvcmUucXVldWUucmVzdW1lKClcblx0XHRcdHRoaXMuaXNJbmRleGluZyA9IGZhbHNlXG5cdFx0fVxuXHR9XG5cblx0X2luZGV4TWFpbExpc3RzKFxuXHRcdG1haWxCb3hlczogQXJyYXk8e1xuXHRcdFx0bWJveDogTWFpbEJveFxuXHRcdFx0bmV3ZXN0VGltZXN0YW1wOiBudW1iZXJcblx0XHR9Pixcblx0XHRvbGRlc3RUaW1lc3RhbXA6IG51bWJlcixcblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgbmV3ZXN0VGltZXN0YW1wID0gbWFpbEJveGVzLnJlZHVjZSgoYWNjLCBkYXRhKSA9PiBNYXRoLm1heChhY2MsIGRhdGEubmV3ZXN0VGltZXN0YW1wKSwgMClcblx0XHRjb25zdCBwcm9ncmVzcyA9IG5ldyBQcm9ncmVzc01vbml0b3IobmV3ZXN0VGltZXN0YW1wIC0gb2xkZXN0VGltZXN0YW1wLCAocHJvZ3Jlc3MpID0+IHtcblx0XHRcdHRoaXMuaW5mb01lc3NhZ2VIYW5kbGVyLm9uU2VhcmNoSW5kZXhTdGF0ZVVwZGF0ZSh7XG5cdFx0XHRcdGluaXRpYWxpemluZzogZmFsc2UsXG5cdFx0XHRcdG1haWxJbmRleEVuYWJsZWQ6IHRoaXMubWFpbEluZGV4aW5nRW5hYmxlZCxcblx0XHRcdFx0cHJvZ3Jlc3MsXG5cdFx0XHRcdGN1cnJlbnRNYWlsSW5kZXhUaW1lc3RhbXA6IHRoaXMuY3VycmVudEluZGV4VGltZXN0YW1wLFxuXHRcdFx0XHRhaW1lZE1haWxJbmRleFRpbWVzdGFtcDogb2xkZXN0VGltZXN0YW1wLFxuXHRcdFx0XHRpbmRleGVkTWFpbENvdW50OiB0aGlzLl9jb3JlLl9zdGF0cy5tYWlsY291bnQsXG5cdFx0XHRcdGZhaWxlZEluZGV4aW5nVXBUbzogbnVsbCxcblx0XHRcdH0pXG5cdFx0fSlcblxuXHRcdGNvbnN0IGluZGV4VXBkYXRlID0gX2NyZWF0ZU5ld0luZGV4VXBkYXRlKHR5cGVSZWZUb1R5cGVJbmZvKE1haWxUeXBlUmVmKSlcblxuXHRcdGNvbnN0IGluZGV4TG9hZGVyID0gdGhpcy5idWxrTG9hZGVyRmFjdG9yeSgpXG5cblx0XHRyZXR1cm4gcHJvbWlzZU1hcChtYWlsQm94ZXMsIChtQm94RGF0YSkgPT4ge1xuXHRcdFx0cmV0dXJuIHRoaXMuX2xvYWRNYWlsTGlzdElkcyhtQm94RGF0YS5tYm94KS50aGVuKChtYWlsTGlzdElkcykgPT4ge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdG1haWxMaXN0SWRzLFxuXHRcdFx0XHRcdG5ld2VzdFRpbWVzdGFtcDogbUJveERhdGEubmV3ZXN0VGltZXN0YW1wLFxuXHRcdFx0XHRcdG93bmVyR3JvdXA6IG5ldmVyTnVsbChtQm94RGF0YS5tYm94Ll9vd25lckdyb3VwKSxcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9KS50aGVuKChtYWlsYm94RGF0YSkgPT4gdGhpcy5faW5kZXhNYWlsTGlzdHNJblRpbWVCYXRjaGVzKG1haWxib3hEYXRhLCBbbmV3ZXN0VGltZXN0YW1wLCBvbGRlc3RUaW1lc3RhbXBdLCBpbmRleFVwZGF0ZSwgcHJvZ3Jlc3MsIGluZGV4TG9hZGVyKSlcblx0fVxuXG5cdF9wcm9jZXNzZWRFbm91Z2goaW5kZXhVcGRhdGU6IEluZGV4VXBkYXRlKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIGluZGV4VXBkYXRlLmNyZWF0ZS5lbmNJbnN0YW5jZUlkVG9FbGVtZW50RGF0YS5zaXplID4gNTAwXG5cdH1cblxuXHRfaW5kZXhNYWlsTGlzdHNJblRpbWVCYXRjaGVzKFxuXHRcdGRhdGFQZXJNYWlsYm94OiBBcnJheTxNYm94SW5kZXhEYXRhPixcblx0XHR0aW1lUmFuZ2U6IFRpbWVSYW5nZSxcblx0XHRpbmRleFVwZGF0ZTogSW5kZXhVcGRhdGUsXG5cdFx0cHJvZ3Jlc3M6IFByb2dyZXNzTW9uaXRvcixcblx0XHRpbmRleExvYWRlcjogQnVsa01haWxMb2FkZXIsXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IFtyYW5nZVN0YXJ0LCByYW5nZUVuZF0gPSB0aW1lUmFuZ2Vcblx0XHRsZXQgYmF0Y2hFbmQgPSByYW5nZVN0YXJ0IC0gTUFJTF9JTkRFWF9CQVRDSF9JTlRFUlZBTFxuXG5cdFx0Ly8gTWFrZSBzdXJlIHRoYXQgd2UgaW5kZXggdXAgdW50aWwgYWxpZ25lZCBkYXRlIGFuZCBub3QgbW9yZSwgb3RoZXJ3aXNlIGl0IHN0YXlzIG1pc2FsaWduZWQgZm9yIHVzZXIgYWZ0ZXIgY2hhbmdpbmcgdGhlIHRpbWUgem9uZSBvbmNlXG5cdFx0aWYgKGJhdGNoRW5kIDwgcmFuZ2VFbmQpIHtcblx0XHRcdGJhdGNoRW5kID0gcmFuZ2VFbmRcblx0XHR9XG5cblx0XHRjb25zdCBtYWlsYm94ZXNUb1dyaXRlID0gZGF0YVBlck1haWxib3guZmlsdGVyKChtYm94RGF0YSkgPT4gYmF0Y2hFbmQgPCBtYm94RGF0YS5uZXdlc3RUaW1lc3RhbXApXG5cdFx0Y29uc3QgYmF0Y2hSYW5nZSA9IFtyYW5nZVN0YXJ0LCBiYXRjaEVuZF0gYXMgVGltZVJhbmdlXG5cblx0XHQvLyByYW5nZVN0YXJ0IGlzIHdoYXQgd2UgaGF2ZSBpbmRleGVkIGF0IHRoZSBwcmV2aW91cyBzdGVwLiBJZiBpdCdzIGVxdWFscyB0byByYW5nZUVuZCB0aGVuIHdlJ3JlIGRvbmUuXG5cdFx0Ly8gSWYgaXQncyBsZXNzIHRoZW4gd2Ugb3ZlcmRpZCBhIGxpdHRsZSBiaXQgYnV0IHdlJ3ZlIGNvdmVyZWQgdGhlIHJhbmdlIGFuZCB3ZSB3aWxsIHdyaXRlIGRvd24gcmFuZ2VTdGFydCBzb1xuXHRcdC8vIHdlIHdpbGwgY29udGludWUgZnJvbSBpdCBuZXh0IHRpbWUuXG5cdFx0aWYgKHJhbmdlU3RhcnQgPD0gcmFuZ2VFbmQpIHtcblx0XHRcdC8vIGFsbCByYW5nZXMgaGF2ZSBiZWVuIHByb2Nlc3NlZFxuXHRcdFx0Y29uc3QgaW5kZXhUaW1lc3RhbXBQZXJHcm91cCA9IG1haWxib3hlc1RvV3JpdGUubWFwKChkYXRhKSA9PiAoe1xuXHRcdFx0XHRncm91cElkOiBkYXRhLm93bmVyR3JvdXAsXG5cdFx0XHRcdGluZGV4VGltZXN0YW1wOiBkYXRhLm1haWxMaXN0SWRzLmxlbmd0aCA9PT0gMCA/IEZVTExfSU5ERVhFRF9USU1FU1RBTVAgOiByYW5nZVN0YXJ0LFxuXHRcdFx0fSkpXG5cdFx0XHRyZXR1cm4gdGhpcy5fd3JpdGVJbmRleFVwZGF0ZShpbmRleFRpbWVzdGFtcFBlckdyb3VwLCBpbmRleFVwZGF0ZSkudGhlbigoKSA9PiB7XG5cdFx0XHRcdHByb2dyZXNzLndvcmtEb25lKHJhbmdlU3RhcnQgLSBiYXRjaEVuZClcblx0XHRcdH0pXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuX3ByZXBhcmVNYWlsRGF0YUZvclRpbWVCYXRjaChtYWlsYm94ZXNUb1dyaXRlLCBiYXRjaFJhbmdlLCBpbmRleFVwZGF0ZSwgaW5kZXhMb2FkZXIpLnRoZW4oKCkgPT4ge1xuXHRcdFx0Y29uc3QgbmV4dFJhbmdlID0gW2JhdGNoRW5kLCByYW5nZUVuZF0gYXMgVGltZVJhbmdlXG5cblx0XHRcdGlmICh0aGlzLl9wcm9jZXNzZWRFbm91Z2goaW5kZXhVcGRhdGUpKSB7XG5cdFx0XHRcdC8vIG9ubHkgd3JpdGUgdG8gZGF0YWJhc2UgaWYgd2UgaGF2ZSBjb2xsZWN0ZWQgZW5vdWdoIGVudGl0aWVzXG5cdFx0XHRcdGNvbnN0IGluZGV4VGltZXN0YW1wUGVyR3JvdXAgPSBtYWlsYm94ZXNUb1dyaXRlLm1hcCgoZGF0YSkgPT4gKHtcblx0XHRcdFx0XHRncm91cElkOiBkYXRhLm93bmVyR3JvdXAsXG5cdFx0XHRcdFx0aW5kZXhUaW1lc3RhbXA6IGRhdGEubWFpbExpc3RJZHMubGVuZ3RoID09PSAwID8gRlVMTF9JTkRFWEVEX1RJTUVTVEFNUCA6IGJhdGNoRW5kLFxuXHRcdFx0XHR9KSlcblx0XHRcdFx0cmV0dXJuIHRoaXMuX3dyaXRlSW5kZXhVcGRhdGUoaW5kZXhUaW1lc3RhbXBQZXJHcm91cCwgaW5kZXhVcGRhdGUpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdHByb2dyZXNzLndvcmtEb25lKHJhbmdlU3RhcnQgLSBiYXRjaEVuZClcblxuXHRcdFx0XHRcdGNvbnN0IG5ld0luZGV4VXBkYXRlID0gX2NyZWF0ZU5ld0luZGV4VXBkYXRlKGluZGV4VXBkYXRlLnR5cGVJbmZvKVxuXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuX2luZGV4TWFpbExpc3RzSW5UaW1lQmF0Y2hlcyhkYXRhUGVyTWFpbGJveCwgbmV4dFJhbmdlLCBuZXdJbmRleFVwZGF0ZSwgcHJvZ3Jlc3MsIGluZGV4TG9hZGVyKVxuXHRcdFx0XHR9KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cHJvZ3Jlc3Mud29ya0RvbmUocmFuZ2VTdGFydCAtIGJhdGNoRW5kKVxuXHRcdFx0XHRyZXR1cm4gdGhpcy5faW5kZXhNYWlsTGlzdHNJblRpbWVCYXRjaGVzKGRhdGFQZXJNYWlsYm94LCBuZXh0UmFuZ2UsIGluZGV4VXBkYXRlLCBwcm9ncmVzcywgaW5kZXhMb2FkZXIpXG5cdFx0XHR9XG5cdFx0fSlcblx0fVxuXG5cdC8qKlxuXHQgKiBAcmV0dXJuIE51bWJlciBvZiBwcm9jZXNzZWQgZW1haWxzP1xuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0YXN5bmMgX3ByZXBhcmVNYWlsRGF0YUZvclRpbWVCYXRjaChcblx0XHRtYm94RGF0YUxpc3Q6IEFycmF5PE1ib3hJbmRleERhdGE+LFxuXHRcdHRpbWVSYW5nZTogVGltZVJhbmdlLFxuXHRcdGluZGV4VXBkYXRlOiBJbmRleFVwZGF0ZSxcblx0XHRpbmRleExvYWRlcjogQnVsa01haWxMb2FkZXIsXG5cdCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IHN0YXJ0VGltZUxvYWQgPSBnZXRQZXJmb3JtYW5jZVRpbWVzdGFtcCgpXG5cdFx0cmV0dXJuIHByb21pc2VNYXAoXG5cdFx0XHRtYm94RGF0YUxpc3QsXG5cdFx0XHQobWJveERhdGEpID0+IHtcblx0XHRcdFx0cmV0dXJuIHByb21pc2VNYXAoXG5cdFx0XHRcdFx0bWJveERhdGEubWFpbExpc3RJZHMuc2xpY2UoKSxcblx0XHRcdFx0XHRhc3luYyAobGlzdElkKSA9PiB7XG5cdFx0XHRcdFx0XHQvLyBXZSB1c2UgY2FjaGluZyBoZXJlIGJlY2F1c2Ugd2UgbWF5IGxvYWQgc2FtZSBlbWFpbHMgdHdpY2Vcblx0XHRcdFx0XHRcdGNvbnN0IHsgZWxlbWVudHM6IG1haWxzLCBsb2FkZWRDb21wbGV0ZWx5IH0gPSBhd2FpdCBpbmRleExvYWRlci5sb2FkTWFpbHNJblJhbmdlV2l0aENhY2hlKGxpc3RJZCwgdGltZVJhbmdlKVxuXHRcdFx0XHRcdFx0Ly8gSWYgd2UgbG9hZGVkIG1haWwgbGlzdCBjb21wbGV0ZWx5LCBkb24ndCB0cnkgdG8gbG9hZCBmcm9tIGl0IGFueW1vcmVcblx0XHRcdFx0XHRcdGlmIChsb2FkZWRDb21wbGV0ZWx5KSB7XG5cdFx0XHRcdFx0XHRcdG1ib3hEYXRhLm1haWxMaXN0SWRzLnNwbGljZShtYm94RGF0YS5tYWlsTGlzdElkcy5pbmRleE9mKGxpc3RJZCksIDEpXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRoaXMuX2NvcmUuX3N0YXRzLm1haWxjb3VudCArPSBtYWlscy5sZW5ndGhcblx0XHRcdFx0XHRcdC8vIFJlbW92ZSBhbGwgcHJvY2Vzc2VkIGVudGl0aWVzIGZyb20gY2FjaGVcblx0XHRcdFx0XHRcdGF3YWl0IFByb21pc2UuYWxsKG1haWxzLm1hcCgobSkgPT4gaW5kZXhMb2FkZXIucmVtb3ZlRnJvbUNhY2hlKG0uX2lkKSkpXG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5fcHJvY2Vzc0luZGV4TWFpbHMobWFpbHMsIGluZGV4VXBkYXRlLCBpbmRleExvYWRlcilcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbmN1cnJlbmN5OiAyLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdClcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGNvbmN1cnJlbmN5OiA1LFxuXHRcdFx0fSxcblx0XHQpLnRoZW4oKCkgPT4ge1xuXHRcdFx0dGhpcy5fY29yZS5fc3RhdHMucHJlcGFyaW5nVGltZSArPSBnZXRQZXJmb3JtYW5jZVRpbWVzdGFtcCgpIC0gc3RhcnRUaW1lTG9hZFxuXHRcdH0pXG5cdH1cblxuXHRhc3luYyBfcHJvY2Vzc0luZGV4TWFpbHMobWFpbHM6IEFycmF5PE1haWw+LCBpbmRleFVwZGF0ZTogSW5kZXhVcGRhdGUsIGluZGV4TG9hZGVyOiBCdWxrTWFpbExvYWRlcik6IFByb21pc2U8bnVtYmVyPiB7XG5cdFx0aWYgKHRoaXMuX2luZGV4aW5nQ2FuY2VsbGVkKSB0aHJvdyBuZXcgQ2FuY2VsbGVkRXJyb3IoXCJjYW5jZWxsZWQgaW5kZXhpbmcgaW4gcHJvY2Vzc2luZyBpbmRleCBtYWlsc1wiKVxuXHRcdGxldCBtYWlsc1dpdGhvdXRFcnJvcyA9IG1haWxzLmZpbHRlcigobSkgPT4gIWhhc0Vycm9yKG0pKVxuXHRcdGNvbnN0IG1haWxzV2l0aE1haWxEZXRhaWxzID0gYXdhaXQgaW5kZXhMb2FkZXIubG9hZE1haWxEZXRhaWxzKG1haWxzV2l0aG91dEVycm9zKVxuXHRcdGNvbnN0IGZpbGVzID0gYXdhaXQgaW5kZXhMb2FkZXIubG9hZEF0dGFjaG1lbnRzKG1haWxzV2l0aG91dEVycm9zKVxuXHRcdGNvbnN0IG1haWxzV2l0aE1haWxEZXRhaWxzQW5kRmlsZXMgPSBtYWlsc1dpdGhNYWlsRGV0YWlsc1xuXHRcdFx0Lm1hcCgobWFpbFR1cGxlcykgPT4ge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdG1haWw6IG1haWxUdXBsZXMubWFpbCxcblx0XHRcdFx0XHRtYWlsRGV0YWlsczogbWFpbFR1cGxlcy5tYWlsRGV0YWlscyxcblx0XHRcdFx0XHRmaWxlczogZmlsZXMuZmlsdGVyKChmaWxlKSA9PiBtYWlsVHVwbGVzLm1haWwuYXR0YWNobWVudHMuZmluZCgoYSkgPT4gaXNTYW1lSWQoYSwgZmlsZS5faWQpKSksXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQuZmlsdGVyKGlzTm90TnVsbClcblx0XHRmb3IgKGNvbnN0IGVsZW1lbnQgb2YgbWFpbHNXaXRoTWFpbERldGFpbHNBbmRGaWxlcykge1xuXHRcdFx0bGV0IGtleVRvSW5kZXhFbnRyaWVzID0gdGhpcy5jcmVhdGVNYWlsSW5kZXhFbnRyaWVzKGVsZW1lbnQubWFpbCwgZWxlbWVudC5tYWlsRGV0YWlscywgZWxlbWVudC5maWxlcylcblxuXHRcdFx0dGhpcy5fY29yZS5lbmNyeXB0U2VhcmNoSW5kZXhFbnRyaWVzKGVsZW1lbnQubWFpbC5faWQsIG5ldmVyTnVsbChlbGVtZW50Lm1haWwuX293bmVyR3JvdXApLCBrZXlUb0luZGV4RW50cmllcywgaW5kZXhVcGRhdGUpXG5cdFx0fVxuXHRcdHJldHVybiBtYWlsc1dpdGhNYWlsRGV0YWlsc0FuZEZpbGVzLmxlbmd0aFxuXHR9XG5cblx0X3dyaXRlSW5kZXhVcGRhdGUoXG5cdFx0ZGF0YVBlckdyb3VwOiBBcnJheTx7XG5cdFx0XHRncm91cElkOiBJZFxuXHRcdFx0aW5kZXhUaW1lc3RhbXA6IG51bWJlclxuXHRcdH0+LFxuXHRcdGluZGV4VXBkYXRlOiBJbmRleFVwZGF0ZSxcblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIHRoaXMuX2NvcmUud3JpdGVJbmRleFVwZGF0ZShkYXRhUGVyR3JvdXAsIGluZGV4VXBkYXRlKVxuXHR9XG5cblx0dXBkYXRlQ3VycmVudEluZGV4VGltZXN0YW1wKHVzZXI6IFVzZXIpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gdGhpcy5fZGIuZGJGYWNhZGVcblx0XHRcdC5jcmVhdGVUcmFuc2FjdGlvbih0cnVlLCBbR3JvdXBEYXRhT1NdKVxuXHRcdFx0LnRoZW4oKHQpID0+IHtcblx0XHRcdFx0cmV0dXJuIFByb21pc2UuYWxsKFxuXHRcdFx0XHRcdGZpbHRlck1haWxNZW1iZXJzaGlwcyh1c2VyKS5tYXAoKG1haWxHcm91cE1lbWJlcnNoaXApID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiB0LmdldChHcm91cERhdGFPUywgbWFpbEdyb3VwTWVtYmVyc2hpcC5ncm91cCkudGhlbigoZ3JvdXBEYXRhOiBHcm91cERhdGEgfCBudWxsKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGlmICghZ3JvdXBEYXRhKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIE5PVEhJTkdfSU5ERVhFRF9USU1FU1RBTVBcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZ3JvdXBEYXRhLmluZGV4VGltZXN0YW1wXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdCkudGhlbigoZ3JvdXBJbmRleFRpbWVzdGFtcHMpID0+IHtcblx0XHRcdFx0XHR0aGlzLmN1cnJlbnRJbmRleFRpbWVzdGFtcCA9IF9nZXRDdXJyZW50SW5kZXhUaW1lc3RhbXAoZ3JvdXBJbmRleFRpbWVzdGFtcHMpXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0aWYgKGVyciBpbnN0YW5jZW9mIERiRXJyb3IgJiYgdGhpcy5fY29yZS5pc1N0b3BwZWRQcm9jZXNzaW5nKCkpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIlRoZSBkYXRhYmFzZSB3YXMgY2xvc2VkLCBkbyBub3Qgd3JpdGUgY3VycmVudEluZGV4VGltZXN0YW1wXCIpXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdH1cblxuXHQvKipcblx0ICogUHJvdmlkZXMgYWxsIG1haWwgbGlzdCBpZHMgb2YgdGhlIGdpdmVuIG1haWxib3hcblx0ICovXG5cdGFzeW5jIF9sb2FkTWFpbExpc3RJZHMobWFpbGJveDogTWFpbEJveCk6IFByb21pc2U8SWRbXT4ge1xuXHRcdGNvbnN0IGlzTWFpbHNldE1pZ3JhdGVkID0gbWFpbGJveC5jdXJyZW50TWFpbEJhZyAhPSBudWxsXG5cdFx0aWYgKGlzTWFpbHNldE1pZ3JhdGVkKSB7XG5cdFx0XHRyZXR1cm4gW21haWxib3guY3VycmVudE1haWxCYWchLCAuLi5tYWlsYm94LmFyY2hpdmVkTWFpbEJhZ3NdLm1hcCgobWFpbGJhZykgPT4gbWFpbGJhZy5tYWlscylcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgZm9sZGVycyA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWRBbGwoTWFpbEZvbGRlclR5cGVSZWYsIG5ldmVyTnVsbChtYWlsYm94LmZvbGRlcnMpLmZvbGRlcnMpXG5cdFx0XHRyZXR1cm4gZm9sZGVycy5tYXAoKGYpID0+IGYubWFpbHMpXG5cdFx0fVxuXHR9XG5cblx0X2dldFNwYW1Gb2xkZXIobWFpbEdyb3VwOiBHcm91cE1lbWJlcnNoaXApOiBQcm9taXNlPE1haWxGb2xkZXI+IHtcblx0XHRyZXR1cm4gdGhpcy5lbnRpdHlDbGllbnRcblx0XHRcdC5sb2FkKE1haWxib3hHcm91cFJvb3RUeXBlUmVmLCBtYWlsR3JvdXAuZ3JvdXApXG5cdFx0XHQudGhlbigobWFpbEdyb3VwUm9vdCkgPT4gdGhpcy5lbnRpdHlDbGllbnQubG9hZChNYWlsQm94VHlwZVJlZiwgbWFpbEdyb3VwUm9vdC5tYWlsYm94KSlcblx0XHRcdC50aGVuKChtYm94KSA9PiB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmVudGl0eUNsaWVudFxuXHRcdFx0XHRcdC5sb2FkQWxsKE1haWxGb2xkZXJUeXBlUmVmLCBuZXZlck51bGwobWJveC5mb2xkZXJzKS5mb2xkZXJzKVxuXHRcdFx0XHRcdC50aGVuKChmb2xkZXJzKSA9PiBuZXZlck51bGwoZm9sZGVycy5maW5kKChmb2xkZXIpID0+IGZvbGRlci5mb2xkZXJUeXBlID09PSBNYWlsU2V0S2luZC5TUEFNKSkpXG5cdFx0XHR9KVxuXHR9XG5cblx0YXN5bmMgcHJvY2Vzc0ltcG9ydFN0YXRlRW50aXR5RXZlbnRzKGV2ZW50czogRW50aXR5VXBkYXRlW10sIGdyb3VwSWQ6IElkLCBiYXRjaElkOiBJZCwgaW5kZXhVcGRhdGU6IEluZGV4VXBkYXRlKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKCF0aGlzLm1haWxJbmRleGluZ0VuYWJsZWQpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHRcdGF3YWl0IHByb21pc2VNYXAoZXZlbnRzLCBhc3luYyAoZXZlbnQpID0+IHtcblx0XHRcdC8vIHdlIGNhbiBvbmx5IHByb2Nlc3MgY3JlYXRlIGFuZCB1cGRhdGUgZXZlbnRzIChjcmVhdGUgaXMgYmVjYXVzZSBvZiBFbnRpdHlFdmVudCBvcHRpbWl6YXRpb25cblx0XHRcdC8vIChDUkVBVEUgKyBVUERBVEUgPSBDUkVBVEUpIHdoaWNoIHJlcXVpcmVzIHVzIHRvIHByb2Nlc3MgQ1JFQVRFIGV2ZW50cyB3aXRoIGltcG9ydGVkIG1haWxzKVxuXHRcdFx0aWYgKGV2ZW50Lm9wZXJhdGlvbiA9PT0gT3BlcmF0aW9uVHlwZS5DUkVBVEUgfHwgZXZlbnQub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLlVQREFURSkge1xuXHRcdFx0XHRsZXQgbWFpbElkczogSWRUdXBsZVtdID0gYXdhaXQgdGhpcy5sb2FkSW1wb3J0ZWRNYWlsSWRzSW5JbmRleERhdGVSYW5nZShbZXZlbnQuaW5zdGFuY2VMaXN0SWQsIGV2ZW50Lmluc3RhbmNlSWRdKVxuXG5cdFx0XHRcdGF3YWl0IHRoaXMucHJlbG9hZE1haWxzKG1haWxJZHMpXG5cblx0XHRcdFx0cmV0dXJuIGF3YWl0IHByb21pc2VNYXAobWFpbElkcywgKG1haWxJZCkgPT5cblx0XHRcdFx0XHR0aGlzLnByb2Nlc3NOZXdNYWlsKG1haWxJZCkudGhlbigocmVzdWx0KSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAocmVzdWx0KSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuX2NvcmUuZW5jcnlwdFNlYXJjaEluZGV4RW50cmllcyhyZXN1bHQubWFpbC5faWQsIG5ldmVyTnVsbChyZXN1bHQubWFpbC5fb3duZXJHcm91cCksIHJlc3VsdC5rZXlUb0luZGV4RW50cmllcywgaW5kZXhVcGRhdGUpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdClcblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0LyoqXG5cdCAqIFdlIHByZWxvYWQgYWxsIG1haWxzIGFuZCBtYWlsIGRldGFpbHMgaW50byB0aGUgY2FjaGUgaW4gb3JkZXIgdG8gcHJldmVudCBsb2FkaW5nIG1haWxzIG9uZSBieSBvbmVcblx0ICogYWZ0ZXIgaW1wb3J0aW5nIGxvdHMgb2YgbWFpbHMuLi5cblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcHJlbG9hZE1haWxzKG1haWxJZHM6IElkVHVwbGVbXSkge1xuXHRcdGNvbnN0IG1haWxzQnlMaXN0ID0gZ3JvdXBCeShtYWlsSWRzLCAobSkgPT4gbGlzdElkUGFydChtKSlcblx0XHRsZXQgbWFpbHM6IEFycmF5PE1haWw+ID0gW11cblx0XHRmb3IgKGNvbnN0IFtsaXN0SWQsIG1haWxJZHNdIG9mIG1haWxzQnlMaXN0LmVudHJpZXMoKSkge1xuXHRcdFx0Y29uc3QgbWFpbEVsZW1lbnRJZHMgPSBtYWlsSWRzLm1hcCgobSkgPT4gZWxlbWVudElkUGFydChtKSlcblx0XHRcdG1haWxzID0gbWFpbHMuY29uY2F0KGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWRNdWx0aXBsZShNYWlsVHlwZVJlZiwgbGlzdElkLCBtYWlsRWxlbWVudElkcykpXG5cdFx0fVxuXHRcdGNvbnN0IGluZGV4TG9hZGVyID0gdGhpcy5idWxrTG9hZGVyRmFjdG9yeSgpXG5cdFx0YXdhaXQgaW5kZXhMb2FkZXIubG9hZE1haWxEZXRhaWxzKG1haWxzKVxuXHRcdGF3YWl0IGluZGV4TG9hZGVyLmxvYWRBdHRhY2htZW50cyhtYWlscylcblx0fVxuXG5cdGFzeW5jIGxvYWRJbXBvcnRlZE1haWxJZHNJbkluZGV4RGF0ZVJhbmdlKGltcG9ydFN0YXRlSWQ6IElkVHVwbGUpOiBQcm9taXNlPElkVHVwbGVbXT4ge1xuXHRcdGNvbnN0IGltcG9ydE1haWxTdGF0ZSA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWQoSW1wb3J0TWFpbFN0YXRlVHlwZVJlZiwgaW1wb3J0U3RhdGVJZClcblx0XHRsZXQgc3RhdHVzID0gcGFyc2VJbnQoaW1wb3J0TWFpbFN0YXRlLnN0YXR1cykgYXMgSW1wb3J0U3RhdHVzXG5cdFx0aWYgKHN0YXR1cyAhPT0gSW1wb3J0U3RhdHVzLkZpbmlzaGVkICYmIHN0YXR1cyAhPT0gSW1wb3J0U3RhdHVzLkNhbmNlbGVkKSB7XG5cdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKVxuXHRcdH1cblx0XHRsZXQgaW1wb3J0ZWRNYWlsRW50cmllcyA9IGF3YWl0IHRoaXMuZW50aXR5Q2xpZW50LmxvYWRBbGwoSW1wb3J0ZWRNYWlsVHlwZVJlZiwgaW1wb3J0TWFpbFN0YXRlLmltcG9ydGVkTWFpbHMpXG5cblx0XHRpZiAoaXNFbXB0eShpbXBvcnRlZE1haWxFbnRyaWVzKSkge1xuXHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSlcblx0XHR9XG5cblx0XHRsZXQgaW1wb3J0ZWRNYWlsU2V0RW50cnlMaXN0SWQgPSBsaXN0SWRQYXJ0KGltcG9ydGVkTWFpbEVudHJpZXNbMF0ubWFpbFNldEVudHJ5KVxuXHRcdC8vIHdlIG9ubHkgd2FudCB0byBpbmRleCBtYWlscyB3aXRoIGEgcmVjZWl2ZWREYXRlIG5ld2VyIHRoYW4gdGhlIGN1cnJlbnRJbmRleFRpbWVzdGFtcFxuXHRcdGxldCBkYXRlUmFuZ2VGaWx0ZXJlZE1haWxTZXRFbnRyeUlkcyA9IGltcG9ydGVkTWFpbEVudHJpZXNcblx0XHRcdC5tYXAoKGltcG9ydGVkTWFpbCkgPT4gZWxlbWVudElkUGFydChpbXBvcnRlZE1haWwubWFpbFNldEVudHJ5KSlcblx0XHRcdC5maWx0ZXIoKGltcG9ydGVkRW50cnkpID0+IGRlY29uc3RydWN0TWFpbFNldEVudHJ5SWQoaW1wb3J0ZWRFbnRyeSkucmVjZWl2ZURhdGUuZ2V0VGltZSgpID49IHRoaXMuY3VycmVudEluZGV4VGltZXN0YW1wKVxuXHRcdHJldHVybiB0aGlzLmVudGl0eUNsaWVudFxuXHRcdFx0LmxvYWRNdWx0aXBsZShNYWlsU2V0RW50cnlUeXBlUmVmLCBpbXBvcnRlZE1haWxTZXRFbnRyeUxpc3RJZCwgZGF0ZVJhbmdlRmlsdGVyZWRNYWlsU2V0RW50cnlJZHMpXG5cdFx0XHQudGhlbigoZW50cmllcykgPT4gZW50cmllcy5tYXAoKGVudHJ5KSA9PiBlbnRyeS5tYWlsKSlcblx0fVxuXG5cdC8qKlxuXHQgKiBQcmVwYXJlIEluZGV4VXBkYXRlIGluIHJlc3BvbnNlIHRvIHRoZSBuZXcgZW50aXR5IGV2ZW50cy5cblx0ICoge0BzZWUgTWFpbEluZGV4ZXJUZXN0LmpzfVxuXHQgKiBAcGFyYW0gZXZlbnRzIEV2ZW50cyBmcm9tIG9uZSBiYXRjaFxuXHQgKiBAcGFyYW0gZ3JvdXBJZFxuXHQgKiBAcGFyYW0gYmF0Y2hJZFxuXHQgKiBAcGFyYW0gaW5kZXhVcGRhdGUgd2hpY2ggd2lsbCBiZSBwb3B1bGF0ZWQgd2l0aCBvcGVyYXRpb25zXG5cdCAqIEByZXR1cm5zIHtQcm9taXNlPCo+fSBJbmRpY2F0aW9uIHRoYXQgd2UncmUgZG9uZS5cblx0ICovXG5cdHByb2Nlc3NFbnRpdHlFdmVudHMoZXZlbnRzOiBFbnRpdHlVcGRhdGVbXSwgZ3JvdXBJZDogSWQsIGJhdGNoSWQ6IElkLCBpbmRleFVwZGF0ZTogSW5kZXhVcGRhdGUpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAoIXRoaXMubWFpbEluZGV4aW5nRW5hYmxlZCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG5cdFx0cmV0dXJuIHByb21pc2VNYXAoZXZlbnRzLCAoZXZlbnQpID0+IHtcblx0XHRcdGNvbnN0IG1haWxJZDogSWRUdXBsZSA9IFtldmVudC5pbnN0YW5jZUxpc3RJZCwgZXZlbnQuaW5zdGFuY2VJZF1cblx0XHRcdGlmIChldmVudC5vcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuQ1JFQVRFKSB7XG5cdFx0XHRcdGlmIChjb250YWluc0V2ZW50T2ZUeXBlKGV2ZW50cyBhcyByZWFkb25seSBFbnRpdHlVcGRhdGVEYXRhW10sIE9wZXJhdGlvblR5cGUuREVMRVRFLCBldmVudC5pbnN0YW5jZUlkKSkge1xuXHRcdFx0XHRcdC8vIGRvIG5vdCBleGVjdXRlIG1vdmUgb3BlcmF0aW9uIGlmIHRoZXJlIGlzIGEgZGVsZXRlIGV2ZW50IG9yIGFub3RoZXIgbW92ZSBldmVudC5cblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5wcm9jZXNzTW92ZWRNYWlsKGV2ZW50LCBpbmRleFVwZGF0ZSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5wcm9jZXNzTmV3TWFpbChtYWlsSWQpLnRoZW4oKHJlc3VsdCkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKHJlc3VsdCkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLl9jb3JlLmVuY3J5cHRTZWFyY2hJbmRleEVudHJpZXMocmVzdWx0Lm1haWwuX2lkLCBuZXZlck51bGwocmVzdWx0Lm1haWwuX293bmVyR3JvdXApLCByZXN1bHQua2V5VG9JbmRleEVudHJpZXMsIGluZGV4VXBkYXRlKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoZXZlbnQub3BlcmF0aW9uID09PSBPcGVyYXRpb25UeXBlLlVQREFURSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5lbnRpdHlDbGllbnRcblx0XHRcdFx0XHQubG9hZChNYWlsVHlwZVJlZiwgW2V2ZW50Lmluc3RhbmNlTGlzdElkLCBldmVudC5pbnN0YW5jZUlkXSlcblx0XHRcdFx0XHQudGhlbigobWFpbCkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKG1haWwuc3RhdGUgPT09IE1haWxTdGF0ZS5EUkFGVCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5hbGwoW1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuX2NvcmUuX3Byb2Nlc3NEZWxldGVkKGV2ZW50LCBpbmRleFVwZGF0ZSksXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5wcm9jZXNzTmV3TWFpbChtYWlsSWQpLnRoZW4oKHJlc3VsdCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKHJlc3VsdCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLl9jb3JlLmVuY3J5cHRTZWFyY2hJbmRleEVudHJpZXMoXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmVzdWx0Lm1haWwuX2lkLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG5ldmVyTnVsbChyZXN1bHQubWFpbC5fb3duZXJHcm91cCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmVzdWx0LmtleVRvSW5kZXhFbnRyaWVzLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGluZGV4VXBkYXRlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdF0pXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuY2F0Y2gob2ZDbGFzcyhOb3RGb3VuZEVycm9yLCAoKSA9PiBjb25zb2xlLmxvZyhcInRyaWVkIHRvIGluZGV4IHVwZGF0ZSBldmVudCBmb3Igbm9uIGV4aXN0aW5nIG1haWxcIikpKVxuXHRcdFx0fSBlbHNlIGlmIChldmVudC5vcGVyYXRpb24gPT09IE9wZXJhdGlvblR5cGUuREVMRVRFKSB7XG5cdFx0XHRcdGlmICghY29udGFpbnNFdmVudE9mVHlwZShldmVudHMgYXMgcmVhZG9ubHkgRW50aXR5VXBkYXRlRGF0YVtdLCBPcGVyYXRpb25UeXBlLkNSRUFURSwgZXZlbnQuaW5zdGFuY2VJZCkpIHtcblx0XHRcdFx0XHQvLyBDaGVjayB0aGF0IHRoaXMgaXMgKm5vdCogYSBtb3ZlIGV2ZW50LiBNb3ZlIGV2ZW50cyBhcmUgaGFuZGxlZCBzZXBhcmF0ZWx5LlxuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9jb3JlLl9wcm9jZXNzRGVsZXRlZChldmVudCwgaW5kZXhVcGRhdGUpXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KS50aGVuKG5vT3ApXG5cdH1cbn1cblxuLy8gZXhwb3J0IGp1c3QgZm9yIHRlc3RpbmdcbmV4cG9ydCBmdW5jdGlvbiBfZ2V0Q3VycmVudEluZGV4VGltZXN0YW1wKGdyb3VwSW5kZXhUaW1lc3RhbXBzOiBudW1iZXJbXSk6IG51bWJlciB7XG5cdGxldCBjdXJyZW50SW5kZXhUaW1lc3RhbXAgPSBOT1RISU5HX0lOREVYRURfVElNRVNUQU1QXG5cdGZvciAoY29uc3QgW2luZGV4LCB0XSBvZiBncm91cEluZGV4VGltZXN0YW1wcy5lbnRyaWVzKCkpIHtcblx0XHRpZiAoaW5kZXggPT09IDApIHtcblx0XHRcdGN1cnJlbnRJbmRleFRpbWVzdGFtcCA9IHRcblx0XHR9IGVsc2UgaWYgKHQgPT09IE5PVEhJTkdfSU5ERVhFRF9USU1FU1RBTVApIHtcblx0XHRcdC8vIHNraXAgbmV3IGdyb3VwIG1lbWJlcnNoaXBzXG5cdFx0fSBlbHNlIGlmICh0ID09PSBGVUxMX0lOREVYRURfVElNRVNUQU1QICYmIGN1cnJlbnRJbmRleFRpbWVzdGFtcCAhPT0gRlVMTF9JTkRFWEVEX1RJTUVTVEFNUCAmJiBjdXJyZW50SW5kZXhUaW1lc3RhbXAgIT09IE5PVEhJTkdfSU5ERVhFRF9USU1FU1RBTVApIHtcblx0XHRcdC8vIHNraXAgZnVsbCBpbmRleCB0aW1lc3RhbXAgaWYgdGhpcyBpcyBub3QgdGhlIGZpcnN0IG1haWwgZ3JvdXBcblx0XHR9IGVsc2UgaWYgKGN1cnJlbnRJbmRleFRpbWVzdGFtcCA9PT0gRlVMTF9JTkRFWEVEX1RJTUVTVEFNUCAmJiB0ICE9PSBjdXJyZW50SW5kZXhUaW1lc3RhbXApIHtcblx0XHRcdC8vIGZpbmQgdGhlIG9sZGVzdCB0aW1lc3RhbXBcblx0XHRcdC8vIG1haWwgaW5kZXggaXN0IG5vdCBmdWxseSBpbmRleGVkIGlmIG9uZSBvZiB0aGUgbWFpbGJveGVzIGlzIG5vdCBmdWxseSBpbmRleGVkXG5cdFx0XHRjdXJyZW50SW5kZXhUaW1lc3RhbXAgPSB0XG5cdFx0fSBlbHNlIGlmICh0IDwgY3VycmVudEluZGV4VGltZXN0YW1wKSB7XG5cdFx0XHQvLyBzZXQgdGhlIG9sZGVzdCBpbmRleCB0aW1lc3RhbXAgYXMgY3VycmVudCB0aW1lc3RhbXAgc28gYWxsIG1haWxib3hlcyBjYW4gaW5kZXggdG8gdGhpcyB0aW1lc3RhbXAgZHVyaW5nIGxvZyBpbi5cblx0XHRcdGN1cnJlbnRJbmRleFRpbWVzdGFtcCA9IHRcblx0XHR9XG5cdH1cblx0cmV0dXJuIGN1cnJlbnRJbmRleFRpbWVzdGFtcFxufVxuXG50eXBlIFRpbWVSYW5nZSA9IFtudW1iZXIsIG51bWJlcl1cbnR5cGUgTWJveEluZGV4RGF0YSA9IHtcblx0bWFpbExpc3RJZHM6IEFycmF5PElkPlxuXHRuZXdlc3RUaW1lc3RhbXA6IG51bWJlclxuXHRvd25lckdyb3VwOiBJZFxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7TUErRGEsbUNBQW1DO0FBQ2hELE1BQU0sNEJBQTRCO0lBRXJCLGNBQU4sTUFBa0I7Q0FXeEI7Q0FFQTtDQUNBO0NBQ0EsYUFBc0I7Q0FDdEI7Q0FDQTtDQUNBO0NBQ0E7Q0FFQSxZQUNDQSxNQUNBQyxJQUNpQkMsb0JBQ0FDLG1CQUNBQyxjQUNqQkMsY0FDaUJDLFlBQ2hCO0VBZ3BCRixLQXJwQmtCO0VBcXBCakIsS0FwcEJpQjtFQW9wQmhCLEtBbnBCZ0I7RUFtcEJmLEtBanBCZTtBQUVqQixPQUFLLFFBQVE7QUFDYixPQUFLLE1BQU07QUFDWCxPQUFLLHdCQUF3QjtBQUM3QixPQUFLLHNCQUFzQjtBQUMzQixPQUFLLHlCQUF5QixRQUFRLFNBQVM7QUFDL0MsT0FBSyxxQkFBcUI7QUFDMUIsT0FBSyxnQkFBZ0I7Q0FDckI7Q0FFRCx1QkFBdUJDLE1BQVlDLGFBQTBCQyxPQUF3RDtFQUNwSCxJQUFJLGlCQUFpQix5QkFB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