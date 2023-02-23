import { downcast, identity, isSameTypeRefByAttr, noOp, remove, TypeRef } from "@tutao/tutanota-utils"
import type { LoginController } from "./LoginController"
import type { OperationType } from "../common/TutanotaConstants"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { assertMainOrNode } from "../common/Env"
import { EntityUpdate, WebsocketCounterData } from "../entities/sys/TypeRefs"
import { SomeEntity } from "../common/EntityTypes.js"
import { isSameId } from "../common/utils/EntityUtils.js"

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
export function isUpdateFor<T extends SomeEntity>(entity: T, update: EntityUpdateData): boolean {
	const typeRef = entity._type as TypeRef<T>
	return (
		isUpdateForTypeRef(typeRef, update) &&
		(update.instanceListId === "" ? isSameId(update.instanceId, entity._id) : isSameId([update.instanceListId, update.instanceId], entity._id))
	)
}

export type ExposedEventController = Pick<EventController, "onEntityUpdateReceived" | "onCountersUpdateReceived">

const TAG = "[EventController]"

export class EventController {
	private countersStream: Stream<WebsocketCounterData> = stream()
	private entityListeners: Set<EntityEventsListener> = new Set()

	constructor(private readonly logins: LoginController) {}

	addEntityListener(listener: EntityEventsListener) {
		if (this.entityListeners.has(listener)) {
			console.warn(TAG, "Adding the same listener twice!")
		} else {
			this.entityListeners.add(listener)
		}
	}

	removeEntityListener(listener: EntityEventsListener) {
		const wasRemoved = this.entityListeners.delete(listener)
		if (!wasRemoved) {
			console.warn(TAG, "Could not remove listener, possible leak?", listener)
		}
	}

	getCountersStream(): Stream<WebsocketCounterData> {
		// Create copy so it's never ended
		return this.countersStream.map(identity)
	}

	async onEntityUpdateReceived(entityUpdates: ReadonlyArray<EntityUpdate>, eventOwnerGroupId: Id): Promise<void> {
		let loginsUpdates = Promise.resolve()

		if (this.logins.isUserLoggedIn()) {
			// the UserController must be notified first as other event receivers depend on it to be up-to-date
			loginsUpdates = this.logins.getUserController().entityEventsReceived(entityUpdates as ReadonlyArray<EntityUpdateData>, eventOwnerGroupId)
		}

		return loginsUpdates
			.then(async () => {
				// sequentially to prevent parallel loading of instances
				for (const listener of this.entityListeners) {
					let entityUpdatesData: Array<EntityUpdateData> = downcast(entityUpdates)
					await listener(entityUpdatesData, eventOwnerGroupId)
				}
			})
			.then(noOp)
	}

	async onCountersUpdateReceived(update: WebsocketCounterData): Promise<void> {
		this.countersStream(update)
	}
}
