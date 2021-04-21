//@flow

import m from "mithril"
import type {GroupInfo} from "../../api/entities/sys/GroupInfo"
import type {TemplateGroupRoot} from "../../api/entities/tutanota/TemplateGroupRoot"
import type {EntityUpdateData} from "../../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../../api/main/EventController"
import type {LoginController} from "../../api/main/LoginController"
import {logins} from "../../api/main/LoginController"
import {EntityClient} from "../../api/common/EntityClient"
import {LazyLoaded} from "../../api/common/utils/LazyLoaded"
import type {GroupMembership} from "../../api/entities/sys/GroupMembership"
import {neverNull} from "../../api/common/utils/Utils"
import {UserTypeRef} from "../../api/entities/sys/User"
import {isSameId} from "../../api/common/utils/EntityUtils"
import type {Group} from "../../api/entities/sys/Group"
import {loadTemplateGroupInstances} from "./TemplatePopupModel"
import {locator} from "../../api/main/MainLocator"

export type TemplateGroupInstance = {
	group: Group,
	groupInfo: GroupInfo,
	groupRoot: TemplateGroupRoot,
	groupMembership: GroupMembership
}


export class TemplateGroupModel {
	+_eventController: EventController;
	+_logins: LoginController;
	+_entityClient: EntityClient;
	_groupInstances: LazyLoaded<Array<TemplateGroupInstance>>

	constructor(eventController: EventController, logins: LoginController, entityClient: EntityClient) {
		this._eventController = eventController
		this._logins = logins
		this._entityClient = entityClient
		this._groupInstances = new LazyLoaded(() => {
			const templateMemberships = logins.getUserController().getTemplateMemberships()
			return loadTemplateGroupInstances(templateMemberships, locator.entityClient)
		}, [])
		this._eventController.addEntityListener((updates) => {
			return this._entityEventsReceived(updates)
		})
	}

	getGroupInstances(): Array<TemplateGroupInstance> {
		return neverNull(this._groupInstances.getSync())
	}

	_entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<*> {
		// const userController = logins.getUserController()
		return Promise.each(updates, update => {
			if (isUpdateForTypeRef(UserTypeRef, update) && isSameId(update.instanceId, logins.getUserController().user._id)) {
				if (this._groupInstances.isLoaded()) {
					const existingInstances = this.getGroupInstances().map(groupInstances => groupInstances.groupRoot._id)
					const newMemberships = logins.getUserController().getTemplateMemberships().map(membership => membership.group)
					if (existingInstances.length !== newMemberships.length) {
						this._groupInstances.reset()
						this._groupInstances.getAsync()
						m.redraw()
					}
				}
			}
		})
	}
}

