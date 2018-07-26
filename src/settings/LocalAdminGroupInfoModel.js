//@flow
import m from "mithril"
import {loadAll, load} from "../api/main/Entity"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {logins} from "../api/main/LoginController"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {GroupType} from "../api/common/TutanotaConstants"
import {locator} from "../api/main/MainLocator"
import {module as replaced} from "@hot"
import {AdministratedGroupTypeRef} from "../api/entities/sys/AdministratedGroup"
import {GroupTypeRef} from "../api/entities/sys/Group"

class LocalAdminGroupInfoModel {
	_initialization: ?Promise<GroupInfo[]>;
	groupInfos: GroupInfo[];

	constructor() {
		locator.entityEvent.addListener((typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum) => this.entityEventReceived(typeRef, listId, elementId, operation))
		this._initialization = null
		this.groupInfos = []
	}

	init(): Promise<GroupInfo[]> {
		if (this._initialization) {
			return this._initialization
		}

		this._initialization = logins.getUserController().loadCustomer().then(customer => {
			return loadAll(GroupInfoTypeRef, customer.teamGroups).filter(gi => gi.groupType === GroupType.LocalAdmin).then(groupInfos => {
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

