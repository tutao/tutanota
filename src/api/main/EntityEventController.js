// @flow
import {remove} from "../common/utils/ArrayUtils"
import {TypeRef} from "../common/EntityFunctions"
import {assertMainOrNode} from "../Env"

assertMainOrNode()

export class EntityEventController {

	_listeners: Array<EntityEventReceived>;

	constructor() {
		this._listeners = []
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