//@flow
import {OperationType, MailState, GroupType} from "../../common/TutanotaConstants"
import {load} from "../EntityWorker"
import {NotFoundError} from "../../common/error/RestError"
import {MailTypeRef} from "../../entities/tutanota/Mail"
import {ContactTypeRef} from "../../entities/tutanota/Contact"
import {GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import {MetaDataOS, GroupDataOS, DbFacade} from "./DbFacade"
import {isSameTypeRef, TypeRef, isSameId} from "../../common/EntityFunctions"
import {neverNull} from "../../common/utils/Utils"
import {_createNewIndexUpdate} from "./SearchTypes"
import {UserTypeRef} from "../../entities/sys/User"
import {getDayShifted, getStartOfDay} from "../../common/utils/DateUtils"
import {ContactIndexer} from "./ContactIndexer"
import {GroupInfoIndexer} from "./GroupInfoIndexer"
import {MailIndexer} from "./MailIndexer"
import {aes256RandomKey} from "../crypto/Aes"
import {Metadata} from "./Indexer"

export class IndexFacade {
	_contact: ContactIndexer;
	_mail: MailIndexer;
	_groupInfo: GroupInfoIndexer;
	constructor() {
		_contact = new ContactIndexer()
		_mail = new MailIndexer()
		_groupInfo: new GroupInfoIndexer()
	}

	/**
	 * FIXME Write noop ENTITY_EVENT_BATCH on the server every twenty days (not once a month because of months with 31 days) to prevent
	 * OutOfSync errors one of the groups of a user has not received a single update (e.g. contacts not updated within last month).
	 * The noop ENTITY_EVENT_BATCH must be written for each area group.
	 */
	init(user: User, groupKey: Aes128Key, userGroupId: Id, mailGroupIds: Id[], contactGroupIds: Id[], customerGroupId: Id): Promise<void> {
		this._initParams = {
			user,
			groupKey,
			userGroupId,
			mailGroupIds,
			contactGroupIds,
			customerGroupId
		}
		return new DbFacade().open(uint8ArrayToBase64(hash(stringToUtf8Uint8Array(user._id)))).then(facade => {
			this.db.dbFacade = facade
			let dbInit = (): Promise<void> => {
				let t = this.db.dbFacade.createTransaction(true, [MetaDataOS])
				return t.get(MetaDataOS, Metadata.userEncDbKey).then(userEncDbKey => {
					if (!userEncDbKey) {
						return this._loadGroupData(mailGroupIds, contactGroupIds, customerGroupId).then((groupBatches: {groupId: Id, groupData: GroupData}[]) => {
							let t2 = this.db.dbFacade.createTransaction(false, [MetaDataOS, GroupDataOS])
							this.db.key = aes256RandomKey()
							t2.put(MetaDataOS, Metadata.userEncDbKey, encrypt256Key(groupKey, this.db.key))
							t2.put(MetaDataOS, Metadata.mailIndexingEnabled, this._mailIndexingEnabled)
							return this._initGroupData(groupBatches, t2)
								.then(() => this._contactIndexer.indexFullContactList(userGroupId))
								.then(() => this._groupInfo.indexAllUserAndTeamGroupInfosForAdmin())
						})
					} else {
						this.db.key = decrypt256Key(groupKey, userEncDbKey)
						return Promise.all([
							t.get(MetaDataOS, Metadata.mailIndexingEnabled).then(mailIndexingEnabled => {
								this._mailIndexingEnabled = mailIndexingEnabled
							}),
							t.get(MetaDataOS, Metadata.excludedListIds).then(mailIndexingEnabled => {
								this._excludedListIds = mailIndexingEnabled
							}),
							this._updateGroups(mailGroupIds, contactGroupIds, customerGroupId).then(() => this.updateCurrentIndexTimestamp()),
						]).return()
					}
				})
			}
			return dbInit().then(() => {
				this._worker.sendIndexState({
					mailIndexEnabled: this._mailIndexingEnabled,
					progress: 0,
					currentIndexTimestamp: this.currentIndexTimestamp
				})
				return this._loadNewEntities(mailGroupIds.concat(contactGroupIds))
			})
		})
	}

	enableMailIndexing(): Promise<void> {
		let t = this.db.dbFacade.createTransaction(true, [MetaDataOS])
		return t.get(MetaDataOS, Metadata.mailIndexingEnabled).then(enabled => {
			if (!enabled) {
				return Promise.map(this._initParams.mailGroupIds, (mailGroup) => getSpamFolder(mailGroup)).then(spamFolders => {
					this._excludedListIds = spamFolders.map(folder => folder.mails)
					this._mailIndexingEnabled = true
					let t2 = this.db.dbFacade.createTransaction(false, [MetaDataOS, GroupDataOS])
					t2.put(MetaDataOS, Metadata.mailIndexingEnabled, true)
					t2.put(MetaDataOS, Metadata.excludedListIds, this._excludedListIds)
					this.indexMailbox(getStartOfDay(getDayShifted(new Date(), -INITIAL_MAIL_INDEX_INTERVAL))) // create index in background
					return t2.await()
				})
			} else {
				return t.get(MetaDataOS, Metadata.excludedListIds).then(excludedListIds => {
					this._mailIndexingEnabled = true
					this._excludedListIds = excludedListIds
				})
			}
		})
	}

	disableMailIndexing(): Promise<void> {
		this._mailIndexingEnabled = false
		this._excludedListIds = []
		this.db.dbFacade.deleteDatabase()
		return this.init(this._initParams.user, this._initParams.groupKey, this._initParams.userGroupId, this._initParams.mailGroupIds, this._initParams.contactGroupIds, this._initParams.customerGroupId)
	}

	cancelMailIndexing(): Promise<void> {
		this._indexingCancelled = true
		return Promise.resolve()
	}


	processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id): Promise<void> {
		let indexUpdate = _createNewIndexUpdate(groupId)
		indexUpdate.batchId = [groupId, batchId]
		return Promise.each(events, (event, index) => {
			if (isSameTypeRef(new TypeRef(event.application, event.type), MailTypeRef) && this._mailIndexingEnabled) {
				if (event.operation == OperationType.CREATE) {
					if (containsEventOfType(events, OperationType.DELETE, event.instanceId)) {
						// move mail
						return this._processMovedMail(event, indexUpdate)
					} else {
						// new mail
						return this._processNewMail(event, indexUpdate)
					}
				} else if (event.operation == OperationType.UPDATE) {
					return load(MailTypeRef, [event.instanceListId, event.instanceId]).then(mail => {
						if (mail.state == MailState.DRAFT) {
							return Promise.all([
								this._processDeleted(event, indexUpdate),
								this._processNewMail(event, indexUpdate)
							])
						}
					}).catch(NotFoundError, () => console.log("tried to index update event for non existing mail"))
				} else if (event.operation == OperationType.DELETE) {
					if (!containsEventOfType(events, OperationType.CREATE, event.instanceId)) { // move events are handled separately
						return this._processDeleted(event, indexUpdate)
					}
				}
			} else if (isSameTypeRef(new TypeRef(event.application, event.type), ContactTypeRef)) {
				if (event.operation == OperationType.CREATE) {
					this._contactIndexer.processNewContact(event).then(result => {
						if (result) this.encryptSearchIndexEntries(result.contact._id, neverNull(result.contact._ownerGroup), result.keyToIndexEntries, indexUpdate)
					})
				} else if (event.operation == OperationType.UPDATE) {
					return Promise.all([
						this._processDeleted(event, indexUpdate),
						this._contactIndexer.processNewContact(event).then(result => {
							if (result) this.encryptSearchIndexEntries(result.contact._id, neverNull(result.contact._ownerGroup), result.keyToIndexEntries, indexUpdate)
						})
					])
				} else if (event.operation == OperationType.DELETE) {
					return this._processDeleted(event, indexUpdate)
				}
			} else if (isSameTypeRef(new TypeRef(event.application, event.type), GroupInfoTypeRef) && this._userIsAdmin()) {
				if (event.operation == OperationType.CREATE) {
					return this._processNewGroupInfo(event, indexUpdate)
				} else if (event.operation == OperationType.UPDATE) {
					return Promise.all([
						this._processDeleted(event, indexUpdate),
						this._processNewGroupInfo(event, indexUpdate)
					])
				} else if (event.operation == OperationType.DELETE) {
					return this._processDeleted(event, indexUpdate)
				}
			} else if (event.operation == OperationType.UPDATE && isSameTypeRef(new TypeRef(event.application, event.type), UserTypeRef) && isSameId(this._initParams.user._id, event.instanceId)) {
				return load(UserTypeRef, event.instanceId).then(updatedUser => {
					let updatedUserIsAdmin = updatedUser.memberships.find(m => m.admin) != null
					if (!this._userIsAdmin() && updatedUserIsAdmin) {
						this._initParams.user = updatedUser
						return this.indexAllUserAndTeamGroupInfosForAdmin()
					} else {
						this._initParams.user = updatedUser
					}
					let oldMailGroupIds = this._initParams.mailGroupIds
					this._initParams.mailGroupIds = updatedUser.memberships.filter(m => m.groupType === GroupType.Mail).map(m => m.group)
					this._initParams.contactGroupIds = updatedUser.memberships.filter(m => m.groupType === GroupType.Contact).map(m => m.group)
					if (oldMailGroupIds.length < this._initParams.mailGroupIds.length)
						return this._updateGroups(this._initParams.mailGroupIds, this._initParams.contactGroupIds, this._initParams.customerGroupId)
				})
			}
		}).then(() => {
			if (this._initParams.contactGroupIds.concat(this._initParams.mailGroupIds).concat(this._initParams.customerGroupId).indexOf(groupId) != -1) {
				return this._writeIndexUpdate(indexUpdate)
			} else {
				console.log("not indexed group", groupId)
			}
		})
	}
}