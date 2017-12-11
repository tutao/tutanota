//@flow
import {FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP} from "../../common/TutanotaConstants"
import {load, loadAll, EntityWorker} from "../EntityWorker"
import {NotFoundError} from "../../common/error/RestError"
import {_TypeModel as GroupInfoModel, GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import {neverNull} from "../../common/utils/Utils"
import type {GroupData, Db, SearchIndexEntry} from "./SearchTypes"
import {_createNewIndexUpdate} from "./SearchTypes"
import {CustomerTypeRef} from "../../entities/sys/Customer"
import {userIsAdmin} from "./IndexUtils"
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

	indexAllUserAndTeamGroupInfosForAdmin(user: User): Promise<void> {
		if (userIsAdmin(user)) {
			return load(CustomerTypeRef, neverNull(user.customer)).then(customer => {
				let t = this._db.dbFacade.createTransaction(true, [GroupDataOS])
				return t.get(GroupDataOS, customer.customerGroup).then((groupData: GroupData) => {
					if (groupData.indexTimestamp == NOTHING_INDEXED_TIMESTAMP) {
						return loadAll(GroupInfoTypeRef, customer.userGroups).then(allUserGroupInfos => {
							return loadAll(GroupInfoTypeRef, customer.teamGroups).then(allTeamGroupInfos => {
								let indexUpdate = _createNewIndexUpdate(customer.customerGroup)
								allUserGroupInfos.concat(allTeamGroupInfos).forEach(groupInfo => {
									let keyToIndexEntries = this.createGroupInfoIndexEntries(groupInfo)
									this._core.encryptSearchIndexEntries(groupInfo._id, neverNull(groupInfo._ownerGroup), keyToIndexEntries, indexUpdate)
								})
								indexUpdate.indexTimestamp = FULL_INDEXED_TIMESTAMP
								return this._core.writeIndexUpdate(indexUpdate)
							})
						})
					}
				})
			})
		} else {
			return Promise.resolve()
		}
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
}