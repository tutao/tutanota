// @flow
import {remove} from "../common/utils/ArrayUtils"
import {assertMainOrNode} from "../Env"
import type {LoginController} from "./LoginController"
import type {OperationTypeEnum} from "../common/TutanotaConstants"
import {equalsTypeRef} from "../common/EntityFunctions"

assertMainOrNode()

export type EntityUpdateData = {
	application: string,
	type: string,
	instanceListId: string,
	instanceId: string,
	operation: OperationTypeEnum
}

export type EntityEventsListener = ($ReadOnlyArray<EntityUpdateData>) => mixed;

export const isUpdateForTypeRef = <T>(typeRef: TypeRef<T>, update: EntityUpdateData): boolean => equalsTypeRef(typeRef, update.application, update.type)

export class EntityEventController {

	_listeners: Array<EntityEventsListener>;
	_logins: LoginController;

	constructor(logins: LoginController) {
		this._listeners = []
		this._logins = logins
	}

	addListener(listener: EntityEventsListener) {
		this._listeners.push(listener)
	}

	removeListener(listener: EntityEventsListener) {
		remove(this._listeners, listener)
	}

	notificationReceived(entityUpdates: $ReadOnlyArray<EntityUpdate>) {
		let promise = Promise.resolve()
		if (this._logins.isUserLoggedIn()) {
			// the UserController must be notified first as other event receivers depend on it to be up-to-date
			promise = this._logins.getUserController()
			              .entityEventsReceived(entityUpdates)
		}

		this._listeners.forEach(listener => {
			listener(entityUpdates)
		})
	}
}