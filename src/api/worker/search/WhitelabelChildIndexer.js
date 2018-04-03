//@flow
import {FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../common/TutanotaConstants"
import {EntityWorker} from "../EntityWorker"
import {NotFoundError} from "../../common/error/RestError"
import {_TypeModel as WhitelabelChildModel, WhitelabelChildTypeRef} from "../../entities/sys/WhitelabelChild"
import {neverNull} from "../../common/utils/Utils"
import type {GroupData, Db, SearchIndexEntry, IndexUpdate} from "./SearchTypes"
import {_createNewIndexUpdate, userIsGlobalAdmin} from "./IndexUtils"
import {CustomerTypeRef} from "../../entities/sys/Customer"
import {GroupDataOS} from "./DbFacade"
import {IndexerCore} from "./IndexerCore"
import {SuggestionFacade} from "./SuggestionFacade"
import {tokenize} from "./Tokenizer"

export class WhitelabelChildIndexer {
	_core: IndexerCore;
	_db: Db;
	_entity: EntityWorker;
	suggestionFacade: SuggestionFacade<WhitelabelChild>

	constructor(core: IndexerCore, db: Db, entity: EntityWorker, suggestionFacade: SuggestionFacade<WhitelabelChild>) {
		this._core = core
		this._db = db
		this._entity = entity
		this.suggestionFacade = suggestionFacade
	}

	createWhitelabelChildIndexEntries(whitelabelChild: WhitelabelChild): Map<string, SearchIndexEntry[]> {
		this.suggestionFacade.addSuggestions(this._getSuggestionWords(whitelabelChild))
		return this._core.createIndexEntriesForAttributes(WhitelabelChildModel, whitelabelChild, [
			{
				attribute: WhitelabelChildModel.values["mailAddress"],
				value: () => whitelabelChild.mailAddress,
			},
			{
				attribute: WhitelabelChildModel.values["comment"],
				value: () => whitelabelChild.comment,
			}])
	}

	_getSuggestionWords(whitelabelChild: WhitelabelChild): string[] {
		return tokenize(whitelabelChild.mailAddress)
	}


	processNewWhitelabelChild(event: EntityUpdate): Promise<?{whitelabelChild: WhitelabelChild, keyToIndexEntries: Map<string, SearchIndexEntry[]>}> {
		return this._entity.load(WhitelabelChildTypeRef, [event.instanceListId, event.instanceId]).then(whitelabelChild => {
			let keyToIndexEntries = this.createWhitelabelChildIndexEntries(whitelabelChild)
			return this.suggestionFacade.store().then(() => {
				return {whitelabelChild, keyToIndexEntries}
			})
		}).catch(NotFoundError, () => {
			console.log("tried to index non existing whitelabel child")
			return null
		})
	}

	/**
	 * Indexes the whitelabel children if they are not yet indexed.
	 */
	indexAllWhitelabelChildrenForAdmin(user: User): Promise<void> {
		if (userIsGlobalAdmin(user)) {
			return this._entity.load(CustomerTypeRef, neverNull(user.customer)).then(customer => {
				return this._db.dbFacade.createTransaction(true, [GroupDataOS]).then(t => {
					return t.get(GroupDataOS, customer.adminGroup).then((groupData: GroupData) => {
						if (groupData.indexTimestamp == NOTHING_INDEXED_TIMESTAMP) {
							let children: Promise<WhitelabelChild[]> = Promise.resolve([])
							if (customer.whitelabelChildren) {
								children = this._entity.loadAll(WhitelabelChildTypeRef, customer.whitelabelChildren.items)
							}
							return children.then(allChildren => {
								let indexUpdate = _createNewIndexUpdate(customer.adminGroup)
								allChildren.forEach(child => {
									let keyToIndexEntries = this.createWhitelabelChildIndexEntries(child)
									this._core.encryptSearchIndexEntries(child._id, neverNull(child._ownerGroup), keyToIndexEntries, indexUpdate)
								})
								indexUpdate.indexTimestamp = FULL_INDEXED_TIMESTAMP
								return Promise.all([this._core.writeIndexUpdate(indexUpdate), this.suggestionFacade.store()]).return()
							})
						}
					})
				})
			})
		} else {
			return Promise.resolve()
		}
	}

	processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id, indexUpdate: IndexUpdate, user: User): Promise<void> {
		return Promise.each(events, (event, index) => {
			if (userIsGlobalAdmin(user)) {
				if (event.operation == OperationType.CREATE) {
					return this.processNewWhitelabelChild(event).then(result => {
						if (result) this._core.encryptSearchIndexEntries(result.whitelabelChild._id, neverNull(result.whitelabelChild._ownerGroup), result.keyToIndexEntries, indexUpdate)
					})
				} else if (event.operation == OperationType.UPDATE) {
					return Promise.all([
						this._core._processDeleted(event, indexUpdate),
						this.processNewWhitelabelChild(event).then(result => {
							if (result) this._core.encryptSearchIndexEntries(result.whitelabelChild._id, neverNull(result.whitelabelChild._ownerGroup), result.keyToIndexEntries, indexUpdate)
						})
					])
				} else if (event.operation == OperationType.DELETE) {
					return this._core._processDeleted(event, indexUpdate)
				}
			}
		}).return()
	}
}