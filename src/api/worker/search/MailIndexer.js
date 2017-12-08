//@flow
import {NOTHING_INDEXED_TIMESTAMP, FULL_INDEXED_TIMESTAMP} from "../../common/TutanotaConstants"
import {load, loadAll, loadReverseRangeBetween} from "../EntityWorker"
import {MailBodyTypeRef} from "../../entities/tutanota/MailBody"
import {NotFoundError} from "../../common/error/RestError"
import {MailboxGroupRootTypeRef} from "../../entities/tutanota/MailboxGroupRoot"
import {MailBoxTypeRef} from "../../entities/tutanota/MailBox"
import {MailFolderTypeRef} from "../../entities/tutanota/MailFolder"
import {MailTypeRef, _TypeModel as MailModel} from "../../entities/tutanota/Mail"
import {ElementDataOS, GroupDataOS} from "./DbFacade"
import {GENERATED_MAX_ID, _loadEntityRange, _loadEntity, firstBiggerThanSecond} from "../../common/EntityFunctions"
import {neverNull} from "../../common/utils/Utils"
import {timestampToGeneratedId} from "../../common/utils/Encoding"
import {encryptIndexKey, htmlToText} from "./IndexUtils"
import type {IndexUpdate, GroupData} from "./SearchTypes"
import {_createNewIndexUpdate} from "./SearchTypes"
import {FileTypeRef} from "../../entities/tutanota/File"
import {CancelledError} from "../../common/error/CancelledError"

export class MailIndexer {


	_createMailIndexEntries(mail: Mail, mailBody: MailBody, files: TutanotaFile[], indexUpdate: IndexUpdate): void {
		let startTimeIndex = performance.now()
		let keyToIndexEntries = this.createIndexEntriesForAttributes(MailModel, mail, [
			{
				attribute: MailModel.values["subject"],
				value: () => mail.subject
			}, {
				attribute: MailModel.associations["toRecipients"],
				value: () => mail.toRecipients.map(r => r.name + " <" + r.address + ">").join(","),
			}, {
				attribute: MailModel.associations["ccRecipients"],
				value: () => mail.ccRecipients.map(r => r.name + " <" + r.address + ">").join(","),
			}, {
				attribute: MailModel.associations["bccRecipients"],
				value: () => mail.bccRecipients.map(r => r.name + " <" + r.address + ">").join(","),
			}, {
				attribute: MailModel.associations["sender"],
				value: () => mail.sender ? (mail.sender.name + " <" + mail.sender.address + ">") : "",
			}, {
				attribute: MailModel.associations["body"],
				value: () => htmlToText(mailBody.text)
			}, {
				attribute: MailModel.associations["attachments"],
				value: () => files.map(file => file.name).join(" ")
			}])
		this._indexingTime += (performance.now() - startTimeIndex)

		this.encryptSearchIndexEntries(mail._id, neverNull(mail._ownerGroup), keyToIndexEntries, indexUpdate)
	}

	/**@return returns true if the mail list has been fully indexed. */
	_indexMailList(mailGroupId: Id, mailListId: Id, startId: Id, endId: Id): Promise <boolean> {
		let startTimeLoad = performance.now()
		// load all attachments first so they are available from cache for each mail
		return load(MailboxGroupRootTypeRef, mailGroupId).then(mailGroupRoot => load(MailBoxTypeRef, mailGroupRoot.mailbox)).then(mailbox => {
			if (this._indexingCancelled) throw new CancelledError("cancelled indexing")
			return Promise.all([
				loadReverseRangeBetween(FileTypeRef, mailbox.sentAttachments, startId, endId),
				loadReverseRangeBetween(FileTypeRef, mailbox.receivedAttachments, startId, endId)
			]).then(() => {
				if (this._indexingCancelled) throw new CancelledError("cancelled indexing")
				return _loadEntityRange(MailTypeRef, mailListId, startId, 500, true, this._entityRestClient).then(mails => {
					if (this._indexingCancelled) throw new CancelledError("cancelled indexing")
					let filteredMails = mails.filter(m => firstBiggerThanSecond(m._id[1], endId))
					return Promise.map(filteredMails, mail => {
						if (this._indexingCancelled) throw new CancelledError("cancelled indexing")
						return Promise.all([
							Promise.map(mail.attachments, attachmentId => load(FileTypeRef, attachmentId)),
							_loadEntity(MailBodyTypeRef, mail.body, null, this._entityRestClient)
						]).spread((files, body) => {
							return {mail, body, files}
						})
					}, {concurrency: 5}).then((mailWithBodyAndFiles: {mail:Mail, body:MailBody, files:TutanotaFile[]}[]) => {
						let indexUpdate = _createNewIndexUpdate(mailGroupId)
						this._downloadingTime += (performance.now() - startTimeLoad)
						this._mailcount += mailWithBodyAndFiles.length
						return Promise.each(mailWithBodyAndFiles, element => {
							this._createMailIndexEntries(element.mail, element.body, element.files, indexUpdate)
						}).then(() => this._writeIndexUpdate(indexUpdate))
					}).return(mails).then((mails) => {
						if (filteredMails.length === 500) { // not filtered and more emails are available
							console.log("completed indexing range from", startId, "to", endId, "of mail list id", mailListId)
							this._printStatus()
							return this._indexMailList(mailGroupId, mailListId, mails[mails.length - 1]._id[1], endId)
						} else {
							console.log("completed indexing of mail list id", mailListId)
							this._printStatus()
							return filteredMails.length == mails.length
						}
					})
				})
			})
		})
	}

	_loadMailListIds(folderListId: Id): Promise<Id[]> {
		let mailListIds = []
		return loadAll(MailFolderTypeRef, folderListId).map(folder => {
			mailListIds.push(folder.mails)
			return loadAll(MailFolderTypeRef, folder.subFolders).map(folder => {
				mailListIds.push(folder.mails)
			})
		}).then(() => mailListIds)
	}

	_processMovedMail(event: EntityUpdate, indexUpdate: IndexUpdate) {
		let encInstanceId = encryptIndexKey(this.db.key, event.instanceId)
		let transaction = this.db.dbFacade.createTransaction(true, [ElementDataOS])
		return transaction.get(ElementDataOS, encInstanceId).then(elementData => {
			if (elementData) {
				if (this._isExcluded(event)) {
					return this._processDeleted(event, indexUpdate) // move to spam folder
				} else {
					indexUpdate.move.push({
						encInstanceId,
						newListId: event.instanceListId
					})
				}
			} else {
				// instance is moved but not yet indexed: handle as new
				return this._processNewMail(event, indexUpdate)
			}
		})
	}

	_processNewMail(event: EntityUpdate, indexUpdate: IndexUpdate): Promise<void> {
		if (this._isExcluded(event)) {
			return Promise.resolve()
		}
		return load(MailTypeRef, [event.instanceListId, event.instanceId]).then(mail => {
			return Promise.all([
				Promise.map(mail.attachments, attachmentId => load(FileTypeRef, attachmentId)),
				load(MailBodyTypeRef, mail.body)
			]).spread((files, body) => {
				this._createMailIndexEntries(mail, body, files, indexUpdate)
			})
		}).catch(NotFoundError, () => {
			console.log("tried to index non existing mail")
		})
	}


	indexMailbox(endIndexTimstamp: number): Promise<void> {
		this._indexingTime = 0
		this._storageTime = 0
		this._downloadingTime = 0
		this._mailcount = 0
		this._storedBytes = 0
		this._encryptionTime = 0
		this._writeRequests = 0
		this._largestColumn = 0
		this._words = 0
		this._indexedBytes = 0
		this._indexingCancelled = false

		this._worker.sendIndexState({
			mailIndexEnabled: this._mailIndexingEnabled,
			progress: 1,
			currentIndexTimestamp: this.currentIndexTimestamp
		})
		this.mailboxIndexingPromise = Promise.each(this._initParams.mailGroupIds, (mailGroupId) => {
			return load(MailboxGroupRootTypeRef, mailGroupId).then(mailGroupRoot => load(MailBoxTypeRef, mailGroupRoot.mailbox)).then(mbox => {
				let t = this.db.dbFacade.createTransaction(true, [GroupDataOS])
				return t.get(GroupDataOS, mailGroupId).then((groupData: GroupData) => {
					let progressCount = 1
					return this._loadMailListIds(neverNull(mbox.systemFolders).folders).map((mailListId, i, count) => {
						let startId = groupData.indexTimestamp == NOTHING_INDEXED_TIMESTAMP ? GENERATED_MAX_ID : timestampToGeneratedId(groupData.indexTimestamp)
						return this._indexMailList(mailGroupId, mailListId, startId, timestampToGeneratedId(endIndexTimstamp)).then((finishedMailList) => {

							this._worker.sendIndexState({
								mailIndexEnabled: this._mailIndexingEnabled,
								progress: Math.round(100 * (progressCount++) / count),
								currentIndexTimestamp: this.currentIndexTimestamp
							})
							return finishedMailList
						})
					}, {concurrency: 1}).then((finishedIndexing: boolean[]) => {
						let t2 = this.db.dbFacade.createTransaction(false, [GroupDataOS])
						return t2.get(GroupDataOS, mailGroupId).then((groupData: GroupData) => {
							groupData.indexTimestamp = finishedIndexing.find(finishedListIndexing => finishedListIndexing == false) == null ? FULL_INDEXED_TIMESTAMP : endIndexTimstamp
							t2.put(GroupDataOS, mailGroupId, groupData)
							return t2.await()
						})
					})
				})
			})
		}).then(() => {
			this._printStatus()
			console.log("finished indexing")
		}).catch(CancelledError, (e) => {
			console.log("indexing cancelled")
		}).finally(() => {
			this.updateCurrentIndexTimestamp().then(() => {
				this._worker.sendIndexState({
					mailIndexEnabled: this._mailIndexingEnabled,
					progress: 0,
					currentIndexTimestamp: this.currentIndexTimestamp
				})
			})
		})
		return this.mailboxIndexingPromise.return()
	}
}