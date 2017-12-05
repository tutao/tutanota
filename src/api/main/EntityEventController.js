// @flow
import {remove} from "../common/utils/ArrayUtils"
import {TypeRef} from "../common/EntityFunctions"
import {assertMainOrNode} from "../Env"
import type {OperationTypeEnum} from "../common/TutanotaConstants"
import type {LoginController} from "./LoginController"

assertMainOrNode()

export class EntityEventController {

	_listeners: Array<EntityEventReceived>;

	constructor(logins: LoginController) {
		// the UserController must be notified first as other event receivers depend on it to be up-to-date
		this._listeners = [(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum) => {
			if (logins.isUserLoggedIn()) {
				logins.getUserController().entityEventReceived(typeRef, listId, elementId, operation)
			}
		}]
	}

	addListener(listener: EntityEventReceived) {
		this._listeners.push(listener)
	}

	removeListener(listener: EntityEventReceived) {
		remove(this._listeners, listener)
	}

	notificationReceived(entityUpdate: EntityUpdate) {
		let typeRef = new TypeRef(entityUpdate.application, entityUpdate.type)
		this._listeners.forEach(listener => {
			listener(typeRef, entityUpdate.instanceListId, entityUpdate.instanceId, entityUpdate.operation);
		})
	}
}