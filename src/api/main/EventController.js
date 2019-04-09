// @flow
import {remove} from "../common/utils/ArrayUtils"
import {assertMainOrNode} from "../Env"
import type {LoginController} from "./LoginController"
import type {OperationTypeEnum} from "../common/TutanotaConstants"
import {isSameTypeRefByAttr} from "../common/EntityFunctions"
import stream from "mithril/stream/stream.js"
import {downcast, identity} from "../common/utils/Utils"

assertMainOrNode()

export type EntityUpdateData = {
	application: string,
	type: string,
	instanceListId: string,
	instanceId: string,
	operation: OperationTypeEnum
}

export type EntityEventsListener = ($ReadOnlyArray<EntityUpdateData>) => mixed;

export const isUpdateForTypeRef = <T>(typeRef: TypeRef<T>, update: EntityUpdateData): boolean => isSameTypeRefByAttr(typeRef, update.application, update.type)

export class EventController {
	_countersStream: Stream<WebsocketCounterData>;
	_entityListeners: Array<EntityEventsListener>;
	_logins: LoginController;

	constructor(logins: LoginController) {
		this._countersStream = stream()
		this._entityListeners = []
		this._logins = logins
	}

	addEntityListener(listener: EntityEventsListener) {
		this._entityListeners.push(listener)
	}

	removeEntityListener(listener: EntityEventsListener) {
		remove(this._entityListeners, listener)
	}

	countersStream(): Stream<WebsocketCounterData> {
		// Create copy so it's never ended
		return this._countersStream.map(identity)
	}

	notificationReceived(entityUpdates: $ReadOnlyArray<EntityUpdate>) {
		let loginsUpdates = Promise.resolve()
		if (this._logins.isUserLoggedIn()) {
			// the UserController must be notified first as other event receivers depend on it to be up-to-date
			loginsUpdates = this._logins.getUserController().entityEventsReceived(entityUpdates)
		}

		loginsUpdates.then(() => {
			this._entityListeners.forEach(listener => {
				let entityUpdatesData: Array<EntityUpdateData> = downcast(entityUpdates)
				listener(entityUpdatesData)
			})
		})
	}

	counterUpdateReceived(update: WebsocketCounterData) {
		this._countersStream(update)
	}
}
