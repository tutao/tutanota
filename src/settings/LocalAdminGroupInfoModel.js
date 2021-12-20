//@flow
import m from "mithril"
import {logins} from "../api/main/LoginController"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {GroupType} from "../api/common/TutanotaConstants"
import {locator} from "../api/main/MainLocator"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {noOp} from "@tutao/tutanota-utils"
import {promiseMap} from "@tutao/tutanota-utils"

class LocalAdminGroupInfoModel {
	_initialization: ?Promise<GroupInfo[]>;
	groupInfos: GroupInfo[];

	constructor() {
		this._initialization = null
		this.groupInfos = []
	}

	init(): Promise<GroupInfo[]> {
		if (this._initialization) {
			return this._initialization
		}
		locator.eventController.addEntityListener(updates => {
			return promiseMap(updates, update => {
				return this.entityEventReceived(update)
			}).then(noOp)
		})
		return this._init()
	}

	_init(): Promise<GroupInfo[]> {
		this._initialization = logins
			.getUserController()
			.loadCustomer()
			.then(async customer => {
				const groupInfos: Array<GroupInfo> = await locator.entityClient.loadAll(GroupInfoTypeRef, customer.teamGroups)
				this.groupInfos = groupInfos.filter(gi => gi.groupType === GroupType.LocalAdmin)
				return this.groupInfos
			})
		return this._initialization
	}

	entityEventReceived<T>(update: EntityUpdateData): Promise<void> {
		if (isUpdateForTypeRef(GroupInfoTypeRef, update)) {
			return this._init().then(() => m.redraw())
		} else {
			return Promise.resolve()
		}
	}
}

export const localAdminGroupInfoModel: LocalAdminGroupInfoModel = new LocalAdminGroupInfoModel()