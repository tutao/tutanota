// @flow
import {remove} from "../common/utils/ArrayUtils"
import {assertMainOrNode} from "../common/Env"
import type {LoginController} from "./LoginController"
import type {OperationTypeEnum} from "../common/TutanotaConstants"
import stream from "mithril/stream/stream.js"
import {downcast, identity, noOp} from "../common/utils/Utils"
import type {WebsocketCounterData} from "../entities/sys/WebsocketCounterData"
import type {EntityUpdate} from "../entities/sys/EntityUpdate"
import {isSameTypeRefByAttr, TypeRef} from "../common/utils/TypeRef";

assertMainOrNode()

export type EntityUpdateData = {
	application: string,
	type: string,
	instanceListId: string,
	instanceId: string,
	operation: OperationTypeEnum
}

export type EntityEventsListener = (updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id) => Promise<*>;

export const isUpdateForTypeRef = <T>(typeRef: TypeRef<T>, update: EntityUpdateData): boolean => isSameTypeRefByAttr(typeRef, update.application, update.type)

export class EventController {
	_countersStream: Stream<WebsocketCounterData>;
	_entityListeners: Array<EntityEventsListener>;
	_logins: LoginController;

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

	notificationReceived(entityUpdates: $ReadOnlyArray<EntityUpdate>, eventOwnerGroupId: Id): Promise<void> {
		let loginsUpdates = Promise.resolve()
		if (this._logins.isUserLoggedIn()) {
			// the UserController must be notified first as other event receivers depend on it to be up-to-date
			loginsUpdates = this._logins.getUserController().entityEventsReceived(entityUpdates, eventOwnerGroupId)
		}

		return loginsUpdates.then(async () => {
			// sequentially to prevent parallel loading of instances
			for (const listener of this._entityListeners) {
				let entityUpdatesData: Array<EntityUpdateData> = downcast(entityUpdates)
				await listener(entityUpdatesData, eventOwnerGroupId)
			}
		}).then(noOp)
	}

	counterUpdateReceived(update: WebsocketCounterData) {
		this._countersStream(update)
	}
}
