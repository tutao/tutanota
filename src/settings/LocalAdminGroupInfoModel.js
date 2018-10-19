//@flow
import m from "mithril"
import {loadAll} from "../api/main/Entity"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {logins} from "../api/main/LoginController"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import type {OperationTypeEnum} from "../api/common/TutanotaConstants"
import {GroupType} from "../api/common/TutanotaConstants"
import {locator} from "../api/main/MainLocator"
import {module as replaced} from "@hot"

class LocalAdminGroupInfoModel {
	_initialization: ?Promise<GroupInfo[]>;
	groupInfos: GroupInfo[];

	constructor() {
		locator.entityEvent.addListener(updates => {
			for (let update of updates) {
				this.entityEventReceived(new TypeRef(update.application, update.type), update.instanceListId, update.instanceId, update.operation)
			}
		})
		this._initialization = null
		this.groupInfos = []
	}

	init(): Promise<GroupInfo[]> {
		if (this._initialization) {
			return this._initialization
		}

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

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, GroupInfoTypeRef)) {
			this._initialization = null
			this.init().then(() => m.redraw())
		}
	}
}

export const localAdminGroupInfoModel = new LocalAdminGroupInfoModel()

if (replaced) {
	Object.assign(localAdminGroupInfoModel, replaced.localAdminGroupInfoModel)
}

