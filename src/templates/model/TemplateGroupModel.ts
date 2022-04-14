import m from "mithril"
import type {GroupInfo} from "../../api/entities/sys/TypeRefs.js"
import type {TemplateGroupRoot} from "../../api/entities/tutanota/TypeRefs.js"
import type {EntityUpdateData} from "../../api/main/EventController"
import {EventController, isUpdateForTypeRef} from "../../api/main/EventController"
import type {LoginController} from "../../api/main/LoginController"
import {logins} from "../../api/main/LoginController"
import {EntityClient} from "../../api/common/EntityClient"
import {LazyLoaded} from "@tutao/tutanota-utils"
import type {GroupMembership} from "../../api/entities/sys/TypeRefs.js"
import {neverNull} from "@tutao/tutanota-utils"
import {UserTypeRef} from "../../api/entities/sys/TypeRefs.js"
import {isSameId} from "../../api/common/utils/EntityUtils"
import type {Group} from "../../api/entities/sys/TypeRefs.js"
import {loadTemplateGroupInstances} from "./TemplatePopupModel"
import {locator} from "../../api/main/MainLocator"
import {promiseMap} from "@tutao/tutanota-utils"

export type TemplateGroupInstance = {
	group: Group
	groupInfo: GroupInfo
	groupRoot: TemplateGroupRoot
	groupMembership: GroupMembership
}

export class TemplateGroupModel {
	readonly _eventController: EventController
	readonly _logins: LoginController
	readonly _entityClient: EntityClient
	_groupInstances: LazyLoaded<Array<TemplateGroupInstance>>

	constructor(eventController: EventController, logins: LoginController, entityClient: EntityClient) {
		this._eventController = eventController
		this._logins = logins
		this._entityClient = entityClient
		this._groupInstances = new LazyLoaded(() => {
			const templateMemberships = logins.getUserController().getTemplateMemberships()
			return loadTemplateGroupInstances(templateMemberships, locator.entityClient)
		}, [])

		this._eventController.addEntityListener(updates => {
			return this._entityEventsReceived(updates)
		})
	}

	getGroupInstances(): Array<TemplateGroupInstance> {
		return neverNull(this._groupInstances.getSync())
	}

	_entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<any> {
		// const userController = logins.getUserController()
		return promiseMap(updates, update => {
			if (isUpdateForTypeRef(UserTypeRef, update) && isSameId(update.instanceId, logins.getUserController().user._id)) {
				if (this._groupInstances.isLoaded()) {
					const existingInstances = this.getGroupInstances().map(groupInstances => groupInstances.groupRoot._id)
					const newMemberships = logins
						.getUserController()
						.getTemplateMemberships()
						.map(membership => membership.group)

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