//@flow
import {FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../common/TutanotaConstants"
import {EntityWorker} from "../EntityWorker"
import {NotFoundError} from "../../common/error/RestError"
import {_TypeModel as GroupInfoModel, GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import {neverNull} from "../../common/utils/Utils"
import type {GroupData, Db, SearchIndexEntry, IndexUpdate} from "./SearchTypes"
import {_createNewIndexUpdate, userIsLocalOrGlobalAdmin} from "./IndexUtils"
import {CustomerTypeRef} from "../../entities/sys/Customer"
import {GroupDataOS} from "./DbFacade"
import {IndexerCore} from "./IndexerCore"
import {SuggestionFacade} from "./SuggestionFacade"
import {tokenize} from "./Tokenizer"

export class GroupInfoIndexer {
	_core: IndexerCore;
	_db: Db;
	_entity: EntityWorker;
	suggestionFacade: SuggestionFacade<GroupInfo>

	constructor(core: IndexerCore, db: Db, entity: EntityWorker, suggestionFacade: SuggestionFacade<GroupInfo>) {
		this._core = core
		this._db = db
		this._entity = entity
		this.suggestionFacade = suggestionFacade
	}

	createGroupInfoIndexEntries(groupInfo: GroupInfo): Map<string, SearchIndexEntry[]> {
		this.suggestionFacade.addSuggestions(this._getSuggestionWords(groupInfo))
		return this._core.createIndexEntriesForAttributes(GroupInfoModel, groupInfo, [
			{
				attribute: GroupInfoModel.values["name"],
				value: () => groupInfo.name
			}, {
				attribute: GroupInfoModel.values["mailAddress"],
				value: () => (groupInfo.mailAddress) ? groupInfo.mailAddress : "",
			}, {
				attribute: GroupInfoModel.associations["mailAddressAliases"],
				value: () => groupInfo.mailAddressAliases.map(maa => maa.mailAddress).join(","),
			}])
	}

	_getSuggestionWords(groupInfo: GroupInfo): string[] {
		return tokenize(groupInfo.name + " " + (groupInfo.mailAddress ? groupInfo.mailAddress : "") + " " + groupInfo.mailAddressAliases.map(alias => alias.mailAddress).join(" "))
	}


	processNewGroupInfo(event: EntityUpdate): Promise<?{groupInfo: GroupInfo, keyToIndexEntries: Map<string, SearchIndexEntry[]>}> {
		return this._entity.load(GroupInfoTypeRef, [event.instanceListId, event.instanceId]).then(groupInfo => {
			let keyToIndexEntries = this.createGroupInfoIndexEntries(groupInfo)
			return this.suggestionFacade.store().then(() => {
				return {groupInfo, keyToIndexEntries}
			})
		}).catch(NotFoundError, () => {
			console.log("tried to index non existing group info")
			return null
		})
	}

	/**
	 * Indexes the group infos if they are not yet indexed.
	 */
	indexAllUserAndTeamGroupInfosForAdmin(user: User): Promise<void> {
		if (userIsLocalOrGlobalAdmin(user)) {
			return this._entity.load(CustomerTypeRef, neverNull(user.customer)).then(customer => {
				return this._db.dbFacade.createTransaction(true, [GroupDataOS]).then(t => {
					return t.get(GroupDataOS, customer.customerGroup).then((groupData: GroupData) => {
						if (groupData.indexTimestamp === NOTHING_INDEXED_TIMESTAMP) {
							return Promise.all([
								this._entity.loadAll(GroupInfoTypeRef, customer.userGroups),
								this._entity.loadAll(GroupInfoTypeRef, customer.teamGroups)
							]).spread((allUserGroupInfos, allTeamGroupInfos) => {
								let indexUpdate = _createNewIndexUpdate(customer.customerGroup)
								allUserGroupInfos.concat(allTeamGroupInfos).forEach(groupInfo => {
									let keyToIndexEntries = this.createGroupInfoIndexEntries(groupInfo)
									this._core.encryptSearchIndexEntries(groupInfo._id, neverNull(groupInfo._ownerGroup), keyToIndexEntries, indexUpdate)
								})
								indexUpdate.indexTimestamp = FULL_INDEXED_TIMESTAMP
								return Promise.all([this._core.writeIndexUpdate(indexUpdate), this.suggestionFacade.store()])
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
			if (userIsLocalOrGlobalAdmin(user)) {
				if (event.operation === OperationType.CREATE) {
					return this.processNewGroupInfo(event).then(result => {
						if (result) this._core.encryptSearchIndexEntries(result.groupInfo._id, neverNull(result.groupInfo._ownerGroup), result.keyToIndexEntries, indexUpdate)
					})
				} else if (event.operation === OperationType.UPDATE) {
					return Promise.all([
						this._core._processDeleted(event, indexUpdate),
						this.processNewGroupInfo(event).then(result => {
							if (result) this._core.encryptSearchIndexEntries(result.groupInfo._id, neverNull(result.groupInfo._ownerGroup), result.keyToIndexEntries, indexUpdate)
						})
					])
				} else if (event.operation === OperationType.DELETE) {
					return this._core._processDeleted(event, indexUpdate)
				}
			}
		}).return()
	}
}