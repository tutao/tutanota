//@flow
import {FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../common/TutanotaConstants"
import {EntityWorker} from "../EntityWorker"
import {NotFoundError} from "../../common/error/RestError"
import {_TypeModel as GroupInfoModel, GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import {neverNull} from "../../common/utils/Utils"
import type {GroupData, Db, SearchIndexEntry, IndexUpdate} from "./SearchTypes"
import {_createNewIndexUpdate, userIsAdmin} from "./IndexUtils"
import {CustomerTypeRef} from "../../entities/sys/Customer"
import {GroupDataOS} from "./DbFacade"
import {IndexerCore} from "./IndexerCore"

export class GroupInfoIndexer {
	_core: IndexerCore;
	_db: Db;
	_entity: EntityWorker;

	constructor(core: IndexerCore, db: Db, entity: EntityWorker) {
		this._core = core
		this._db = db
		this._entity = entity
	}

	createGroupInfoIndexEntries(groupInfo: GroupInfo): Map<string, SearchIndexEntry[]> {
		return this._core.createIndexEntriesForAttributes(GroupInfoModel, groupInfo, [
			{
				attribute: GroupInfoModel.values["name"],
				value: () => groupInfo.name
			}, {
				attribute: GroupInfoModel.values["mailAddress"],
				value: () => groupInfo.mailAddress,
			}, {
				attribute: GroupInfoModel.associations["mailAddressAliases"],
				value: () => groupInfo.mailAddressAliases.map(maa => maa.mailAddress).join(","),
			}])
	}

	processNewGroupInfo(event: EntityUpdate): Promise<?{groupInfo: GroupInfo, keyToIndexEntries: Map<string, SearchIndexEntry[]>}> {
		return this._entity.load(GroupInfoTypeRef, [event.instanceListId, event.instanceId]).then(groupInfo => {
			return {groupInfo, keyToIndexEntries: this.createGroupInfoIndexEntries(groupInfo)}
		}).catch(NotFoundError, () => {
			console.log("tried to index non existing group info")
			return null
		})
	}

	indexAllUserAndTeamGroupInfosForAdmin(user: User): Promise<void> {
		if (userIsAdmin(user)) {
			return this._entity.load(CustomerTypeRef, neverNull(user.customer)).then(customer => {
				let t = this._db.dbFacade.createTransaction(true, [GroupDataOS])
				return t.get(GroupDataOS, customer.customerGroup).then((groupData: GroupData) => {
					if (groupData.indexTimestamp == NOTHING_INDEXED_TIMESTAMP) {
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
							return this._core.writeIndexUpdate(indexUpdate)
						})
					}
				})
			})
		} else {
			return Promise.resolve()
		}
	}

	processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id, indexUpdate: IndexUpdate, user: User): Promise<void> {
		return Promise.each(events, (event, index) => {
			if (userIsAdmin(user)) {
				if (event.operation == OperationType.CREATE) {
					return this.processNewGroupInfo(event).then(result => {
						if (result) this._core.encryptSearchIndexEntries(result.groupInfo._id, neverNull(result.groupInfo._ownerGroup), result.keyToIndexEntries, indexUpdate)
					})
				} else if (event.operation == OperationType.UPDATE) {
					return Promise.all([
						this._core._processDeleted(event, indexUpdate),
						this.processNewGroupInfo(event).then(result => {
							if (result) this._core.encryptSearchIndexEntries(result.groupInfo._id, neverNull(result.groupInfo._ownerGroup), result.keyToIndexEntries, indexUpdate)
						})
					])
				} else if (event.operation == OperationType.DELETE) {
					return this._core._processDeleted(event, indexUpdate)
				}
			}
		}).return()
	}
}