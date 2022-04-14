import {remove} from "@tutao/tutanota-utils"
import type {LoginController} from "./LoginController"
import type {OperationType} from "../common/TutanotaConstants"
import stream from "mithril/stream"
import {downcast, identity, noOp} from "@tutao/tutanota-utils"
import {isSameTypeRefByAttr, TypeRef} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../common/Env"
import Stream from "mithril/stream";
import {EntityUpdate, WebsocketCounterData} from "../entities/sys/TypeRefs"

assertMainOrNode()
export type EntityUpdateData = {
	application: string
	type: string
	instanceListId: string
	instanceId: string
	operation: OperationType
}
export type EntityEventsListener = (updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id) => Promise<any>
export const isUpdateForTypeRef = <T>(typeRef: TypeRef<T>, update: EntityUpdateData): boolean => isSameTypeRefByAttr(typeRef, update.application, update.type)

export class EventController {
	_countersStream: Stream<WebsocketCounterData>
	_entityListeners: Array<EntityEventsListener>
	_logins: LoginController

	constructor(logins: LoginController) {
		this._logins = logins
		this._countersStream = stream()
		this._entityListeners = []
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

	notificationReceived(entityUpdates: ReadonlyArray<EntityUpdate>, eventOwnerGroupId: Id): Promise<void> {
		let loginsUpdates = Promise.resolve()

		if (this._logins.isUserLoggedIn()) {
			// the UserController must be notified first as other event receivers depend on it to be up-to-date
			loginsUpdates = this._logins.getUserController().entityEventsReceived(entityUpdates as ReadonlyArray<EntityUpdateData>, eventOwnerGroupId)
		}

		return loginsUpdates
			.then(async () => {
				// sequentially to prevent parallel loading of instances
				for (const listener of this._entityListeners) {
					let entityUpdatesData: Array<EntityUpdateData> = downcast(entityUpdates)
					await listener(entityUpdatesData, eventOwnerGroupId)
				}
			})
			.then(noOp)
	}

	counterUpdateReceived(update: WebsocketCounterData) {
		this._countersStream(update)
	}
}