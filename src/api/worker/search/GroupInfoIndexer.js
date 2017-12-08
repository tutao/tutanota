//@flow
import {FULL_INDEXED_TIMESTAMP} from "../../common/TutanotaConstants"
import {load, loadAll} from "../EntityWorker"
import {NotFoundError} from "../../common/error/RestError"
import {_TypeModel as GroupInfoModel, GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import {neverNull} from "../../common/utils/Utils"
import type {IndexUpdate} from "./SearchTypes"
import {_createNewIndexUpdate} from "./SearchTypes"
import {CustomerTypeRef} from "../../entities/sys/Customer"

export class GroupInfoIndexer {

	_userIsAdmin(): boolean {
		return this._initParams.user.memberships.find(m => m.admin) != null
	}

	indexAllUserAndTeamGroupInfosForAdmin(): Promise<void> {
		if (this._userIsAdmin()) {
			return load(CustomerTypeRef, neverNull(this._initParams.user.customer)).then(customer => {
				return loadAll(GroupInfoTypeRef, customer.userGroups).then(allUserGroupInfos => {
					return loadAll(GroupInfoTypeRef, customer.teamGroups).then(allTeamGroupInfos => {
						let indexUpdate = _createNewIndexUpdate(customer.customerGroup)
						allUserGroupInfos.concat(allTeamGroupInfos).forEach(groupInfo => this._createGroupInfoIndexEntries(groupInfo, indexUpdate))
						indexUpdate.indexTimestamp = FULL_INDEXED_TIMESTAMP
						return this._writeIndexUpdate(indexUpdate)
					})
				})
			})
		} else {
			return Promise.resolve()
		}
	}

	_createGroupInfoIndexEntries(groupInfo: GroupInfo, indexUpdate: IndexUpdate): void {
		let keyToIndexEntries = this.createIndexEntriesForAttributes(GroupInfoModel, groupInfo, [
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
		this.encryptSearchIndexEntries(groupInfo._id, neverNull(groupInfo._ownerGroup), keyToIndexEntries, indexUpdate)
	}

	_processNewGroupInfo(event: EntityUpdate, indexUpdate: IndexUpdate) {
		return load(GroupInfoTypeRef, [event.instanceListId, event.instanceId]).then(groupInfo => {
			this._createGroupInfoIndexEntries(groupInfo, indexUpdate)
		}).catch(NotFoundError, () => {
			console.log("tried to index non existing group info")
		})
	}
}