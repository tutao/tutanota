import {FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP, OperationType} from "../../common/TutanotaConstants"
import {NotFoundError} from "../../common/error/RestError"
import type {GroupInfo} from "../../entities/sys/TypeRefs.js"
import {GroupInfoTypeRef} from "../../entities/sys/TypeRefs.js"
import {typeModels} from "../../entities/sys/TypeModels.js"
import {neverNull, noOp} from "@tutao/tutanota-utils"
import type {Db, GroupData, IndexUpdate, SearchIndexEntry} from "./SearchTypes"
import {_createNewIndexUpdate, typeRefToTypeInfo, userIsLocalOrGlobalAdmin} from "./IndexUtils"
import {CustomerTypeRef} from "../../entities/sys/TypeRefs.js"
import {GroupDataOS} from "./Indexer"
import {IndexerCore} from "./IndexerCore"
import {SuggestionFacade} from "./SuggestionFacade"
import {tokenize} from "./Tokenizer"
import type {EntityUpdate} from "../../entities/sys/TypeRefs.js"
import type {User} from "../../entities/sys/TypeRefs.js"
import {EntityClient} from "../../common/EntityClient"
import {ofClass, promiseMap} from "@tutao/tutanota-utils"

export class GroupInfoIndexer {
	_core: IndexerCore
	_db: Db
	_entity: EntityClient
	suggestionFacade: SuggestionFacade<GroupInfo>

	constructor(core: IndexerCore, db: Db, entity: EntityClient, suggestionFacade: SuggestionFacade<GroupInfo>) {
		this._core = core
		this._db = db
		this._entity = entity
		this.suggestionFacade = suggestionFacade
	}

	createGroupInfoIndexEntries(groupInfo: GroupInfo): Map<string, SearchIndexEntry[]> {
		this.suggestionFacade.addSuggestions(this._getSuggestionWords(groupInfo))
		const GroupInfoModel = typeModels.GroupInfo
		return this._core.createIndexEntriesForAttributes(groupInfo, [
			{
				attribute: GroupInfoModel.values["name"],
				value: () => groupInfo.name,
			},
			{
				attribute: GroupInfoModel.values["mailAddress"],
				value: () => (groupInfo.mailAddress ? groupInfo.mailAddress : ""),
			},
			{
				attribute: GroupInfoModel.associations["mailAddressAliases"],
				value: () => groupInfo.mailAddressAliases.map(maa => maa.mailAddress).join(","),
			},
		])
	}

	_getSuggestionWords(groupInfo: GroupInfo): string[] {
		return tokenize(
			groupInfo.name +
			" " +
			(groupInfo.mailAddress ? groupInfo.mailAddress : "") +
			" " +
			groupInfo.mailAddressAliases.map(alias => alias.mailAddress).join(" "),
		)
	}

	processNewGroupInfo(
		event: EntityUpdate,
	): Promise<| {
		groupInfo: GroupInfo
		keyToIndexEntries: Map<string, SearchIndexEntry[]>
	}
		| null
		| undefined> {
		return this._entity
				   .load(GroupInfoTypeRef, [event.instanceListId, event.instanceId])
				   .then(groupInfo => {
					   let keyToIndexEntries = this.createGroupInfoIndexEntries(groupInfo)
					   return this.suggestionFacade.store().then(() => {
						   return {
							   groupInfo,
							   keyToIndexEntries,
						   }
					   })
				   })
				   .catch(
					   ofClass(NotFoundError, () => {
						   console.log("tried to index non existing group info")
						   return null
					   }),
				   )
	}

	/**
	 * Indexes the group infos if they are not yet indexed.
	 */
	async indexAllUserAndTeamGroupInfosForAdmin(user: User): Promise<any> {
		if (userIsLocalOrGlobalAdmin(user)) {
			const customer = await this._entity.load(CustomerTypeRef, neverNull(user.customer))
			const t = await this._db.dbFacade.createTransaction(true, [GroupDataOS])
			const groupData: GroupData | null = await t.get(GroupDataOS, customer.customerGroup)

			if (groupData && groupData.indexTimestamp === NOTHING_INDEXED_TIMESTAMP) {
				const [allUserGroupInfos, allTeamGroupInfos] = await Promise.all([
					this._entity.loadAll(GroupInfoTypeRef, customer.userGroups),
					this._entity.loadAll(GroupInfoTypeRef, customer.teamGroups),
				])

				let indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(GroupInfoTypeRef))

				allUserGroupInfos.concat(allTeamGroupInfos).forEach(groupInfo => {
					let keyToIndexEntries = this.createGroupInfoIndexEntries(groupInfo)

					this._core.encryptSearchIndexEntries(groupInfo._id, neverNull(groupInfo._ownerGroup), keyToIndexEntries, indexUpdate)
				})
				return Promise.all([
					this._core.writeIndexUpdate(
						[
							{
								groupId: customer.customerGroup,
								indexTimestamp: FULL_INDEXED_TIMESTAMP,
							},
						],
						indexUpdate,
					),
					this.suggestionFacade.store(),
				])
			}
		} else {
			return Promise.resolve()
		}
	}

	processEntityEvents(events: EntityUpdate[], groupId: Id, batchId: Id, indexUpdate: IndexUpdate, user: User): Promise<void> {
		return promiseMap(events, async event => {
			if (userIsLocalOrGlobalAdmin(user)) {
				if (event.operation === OperationType.CREATE) {
					await this.processNewGroupInfo(event).then(result => {
						if (result) {
							this._core.encryptSearchIndexEntries(
								result.groupInfo._id,
								neverNull(result.groupInfo._ownerGroup),
								result.keyToIndexEntries,
								indexUpdate,
							)
						}
					})
				} else if (event.operation === OperationType.UPDATE) {
					await Promise.all([
						this._core._processDeleted(event, indexUpdate),
						this.processNewGroupInfo(event).then(result => {
							if (result) {
								this._core.encryptSearchIndexEntries(
									result.groupInfo._id,
									neverNull(result.groupInfo._ownerGroup),
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