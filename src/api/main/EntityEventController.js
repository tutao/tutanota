// @flow
import {remove} from "../common/utils/ArrayUtils"
import {TypeRef} from "../common/EntityFunctions"
import {assertMainOrNode} from "../Env"
import type {LoginController} from "./LoginController"

assertMainOrNode()

export class EntityEventController {

	_listeners: Array<EntityEventReceived>;
	_logins: LoginController;

	constructor(logins: LoginController) {
		this._listeners = []
		this._logins = logins
	}

	addListener(listener: EntityEventReceived) {
		this._listeners.push(listener)
	}

	removeListener(listener: EntityEventReceived) {
		remove(this._listeners, listener)
	}

	notificationReceived(entityUpdate: EntityUpdate) {
		let typeRef = new TypeRef(entityUpdate.application, entityUpdate.type)
		let promise = Promise.resolve()
		if (this._logins.isUserLoggedIn()) {
			// the UserController must be notified first as other event receivers depend on it to be up-to-date
			promise = this._logins.getUserController().entityEventReceived(typeRef, entityUpdate.instanceListId, entityUpdate.instanceId, entityUpdate.operation)
		}
		promise.then(() => {
			this._listeners.forEach(listener => {
				listener(typeRef, entityUpdate.instanceListId, entityUpdate.instanceId, entityUpdate.operation);
			})
		})
	}
}