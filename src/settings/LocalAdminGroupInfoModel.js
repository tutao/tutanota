//@flow
import m from "mithril"
import {loadAll} from "../api/main/Entity"
import {logins} from "../api/main/LoginController"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {GroupType} from "../api/common/TutanotaConstants"
import {locator} from "../api/main/MainLocator"
import {module as replaced} from "@hot"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"

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
			return Promise.each(updates, update => {
				return this.entityEventReceived(update)
			}).return()
		})
		return this._init()
	}

	_init(): Promise<GroupInfo[]> {
		this._initialization = logins.getUserController().loadCustomer().then(customer => {
			return loadAll(GroupInfoTypeRef, customer.teamGroups)
				.filter(gi => gi.groupType === GroupType.LocalAdmin)
				.then(groupInfos => {
					this.groupInfos = groupInfos
					return groupInfos
				})
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

if (replaced) {
	Object.assign(localAdminGroupInfoModel, replaced.localAdminGroupInfoModel)
}

