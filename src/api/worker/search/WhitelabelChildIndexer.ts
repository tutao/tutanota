import {FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../common/TutanotaConstants"
import {NotFoundError} from "../../common/error/RestError"
import type {WhitelabelChild} from "../../entities/sys/TypeRefs.js"
import {WhitelabelChildTypeRef} from "../../entities/sys/TypeRefs.js"
import {neverNull, noOp} from "@tutao/tutanota-utils"
import type {Db, GroupData, IndexUpdate, SearchIndexEntry} from "./SearchTypes"
import {_createNewIndexUpdate, typeRefToTypeInfo, userIsGlobalAdmin} from "./IndexUtils"
import {CustomerTypeRef} from "../../entities/sys/TypeRefs.js"
import {GroupDataOS} from "./Indexer"
import {IndexerCore} from "./IndexerCore"
import {SuggestionFacade} from "./SuggestionFacade"
import {tokenize} from "./Tokenizer"
import type {EntityUpdate} from "../../entities/sys/TypeRefs.js"
import type {User} from "../../entities/sys/TypeRefs.js"
import {EntityClient} from "../../common/EntityClient"
import {ofClass, promiseMap} from "@tutao/tutanota-utils"
import {typeModels} from "../../entities/sys/TypeModels"

export class WhitelabelChildIndexer {
	_core: IndexerCore
	_db: Db
	_entity: EntityClient
	suggestionFacade: SuggestionFacade<WhitelabelChild>

	constructor(core: IndexerCore, db: Db, entity: EntityClient, suggestionFacade: SuggestionFacade<WhitelabelChild>) {
		this._core = core
		this._db = db
		this._entity = entity
		this.suggestionFacade = suggestionFacade
	}

	createWhitelabelChildIndexEntries(whitelabelChild: WhitelabelChild): Map<string, SearchIndexEntry[]> {
		this.suggestionFacade.addSuggestions(this._getSuggestionWords(whitelabelChild))
		const WhitelabelChildModel = typeModels.WhitelabelChild
		return this._core.createIndexEntriesForAttributes(whitelabelChild, [
			{
				attribute: WhitelabelChildModel.values["mailAddress"],
				value: () => whitelabelChild.mailAddress,
			},
			{
				attribute: WhitelabelChildModel.values["comment"],
				value: () => whitelabelChild.comment,
			},
		])
	}

	_getSuggestionWords(whitelabelChild: WhitelabelChild): string[] {
		return tokenize(whitelabelChild.mailAddress)
	}

	processNewWhitelabelChild(
		event: EntityUpdate,
	): Promise<| {
		whitelabelChild: WhitelabelChild
		keyToIndexEntries: Map<string, SearchIndexEntry[]>
	}
		| null
		| undefined> {
		return this._entity
				   .load(WhitelabelChildTypeRef, [event.instanceListId, event.instanceId])
				   .then(whitelabelChild => {
					   let keyToIndexEntries = this.createWhitelabelChildIndexEntries(whitelabelChild)
					   return this.suggestionFacade.store().then(() => {
						   return {
							   whitelabelChild,
							   keyToIndexEntries,
						   }
					   })
				   })
				   .catch(
					   ofClass(NotFoundError, () => {
						   console.log("tried to index non existing whitelabel child")
						   return null
					   }),
				   )
	}

	/**
	 * Indexes the whitelabel children if they are not yet indexed.
	 */
	indexAllWhitelabelChildrenForAdmin(user: User): Promise<void> {
		if (userIsGlobalAdmin(user)) {
			return this._entity.load(CustomerTypeRef, neverNull(user.customer)).then(customer => {
				return this._db.dbFacade.createTransaction(true, [GroupDataOS]).then(t => {
					return t.get(GroupDataOS, customer.adminGroup).then((groupData: GroupData | null) => {
						if (groupData && groupData.indexTimestamp === NOTHING_INDEXED_TIMESTAMP) {
							let children: Promise<WhitelabelChild[]> = Promise.resolve([])

							if (customer.whitelabelChildren) {
								children = this._entity.loadAll(WhitelabelChildTypeRef, customer.whitelabelChildren.items)
							}

							return children.then(allChildren => {
								let indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(WhitelabelChildTypeRef))

								allChildren.forEach(child => {
									let keyToIndexEntries = this.createWhitelabelChildIndexEntries(child)

									this._core.encryptSearchIndexEntries(child._id, neverNull(child._ownerGroup), keyToIndexEntries, indexUpdate)
								})
								return Promise.all([
									this._core.writeIndexUpdate(
										[
											{
												groupId: customer.adminGroup,
												indexTimestamp: FULL_INDEXED_TIMESTAMP,
											},
										],
										indexUpdate,
									),
									this.suggestionFacade.store(),
								]).then(noOp)
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
		return promiseMap(events, async (event) => {
			if (userIsGlobalAdmin(user)) {
				if (event.operation === OperationType.CREATE) {
					await this.processNewWhitelabelChild(event).then(result => {
						if (result) {
							this._core.encryptSearchIndexEntries(
								result.whitelabelChild._id,
								neverNull(result.whitelabelChild._ownerGroup),
								result.keyToIndexEntries,
								indexUpdate,
							)
						}
					})
				} else if (event.operation === OperationType.UPDATE) {
					await Promise.all([
						this._core._processDeleted(event, indexUpdate),
						this.processNewWhitelabelChild(event).then(result => {
							if (result) {
								this._core.encryptSearchIndexEntries(
									result.whitelabelChild._id,
									neverNull(result.whitelabelChild._ownerGroup),
									result.keyToIndexEntries,
									indexUpdate,
								)
							}
						}),
					])
				} else if (event.operation === OperationType.DELETE) {
					await this._core._processDeleted(event, indexUpdate)
				}
			}
		}).then(noOp)
	}
}