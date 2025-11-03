import { identity } from "@tutao/tutanota-utils"
import type { LoginController } from "./LoginController"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { assertMainOrNode } from "../common/Env"
import { WebsocketCounterData } from "../entities/sys/TypeRefs"
import { EntityUpdateData } from "../common/utils/EntityUpdateUtils.js"

assertMainOrNode()

export type ExposedEventController = Pick<EventController, "onEntityUpdateReceived" | "onCountersUpdateReceived">

const TAG = "[EventController]"

export type EntityEventsListener = (updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id) => Promise<unknown>

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

	async onEntityUpdateReceived(entityUpdates: readonly EntityUpdateData[], eventOwnerGroupId: Id): Promise<void> {
		if (this.logins.isUserLoggedIn()) {
			// the UserController must be notified first as other event receivers depend on it to be up-to-date
			await this.logins.getUserController().entityEventsReceived(entityUpdates, eventOwnerGroupId)
		}
		for (const listener of this.entityListeners) {
			// run listeners async to speed up processing
			// we ran it sequentially before to prevent parallel loading of instances
			// this should not be a problem anymore as we prefetch now

			// noinspection ES6MissingAwait
			listener(entityUpdates, eventOwnerGroupId)
		}
	}

	async onCountersUpdateReceived(update: WebsocketCounterData): Promise<void> {
		this.countersStream(update)
	}
}
