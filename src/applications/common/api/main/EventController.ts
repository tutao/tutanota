import { identity } from "@tutao/utils"
import type { LoginController } from "./LoginController"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { assertMainOrNode } from "@tutao/app-env"
import { EntityUpdatesListener, EntityUpdateData } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { OperationStatusUpdate, WebsocketCounterData } from "@tutao/entities/sys"

assertMainOrNode()

export type ExposedEventController = Pick<EventController, "onEntityUpdateReceived" | "onCountersUpdateReceived" | "onOperationStatusUpdate">

const TAG = "[EventController]"

export type OperationStatusUpdateListener = (update: OperationStatusUpdate) => Promise<unknown>

export class EventController {
	private countersStream: Stream<WebsocketCounterData> = stream()
	private entityUpdatesListeners: Set<EntityUpdatesListener> = new Set()
	private readonly operationListeners: Set<OperationStatusUpdateListener> = new Set()

	constructor(private readonly logins: LoginController) {}

	addEntityUpdatesListener(listener: EntityUpdatesListener) {
		if (!this.entityUpdatesListeners.has(listener)) {
			this.entityUpdatesListeners.add(listener)
		}
	}

	removeEntityUpdatesListener(listener: EntityUpdatesListener) {
		const wasRemoved = this.entityUpdatesListeners.delete(listener)
		if (!wasRemoved) {
			console.log(TAG, `Could not remove entityListener with id ${listener.id}, possible leak?`)
		}
	}

	addOperationStatusUpdateListener(listener: OperationStatusUpdateListener) {
		this.operationListeners.add(listener)
	}

	removeOperationStatusUpdateListener(listener: OperationStatusUpdateListener) {
		this.operationListeners.delete(listener)
	}

	getCountersStream(): Stream<WebsocketCounterData> {
		// Create copy so it's never ended
		return this.countersStream.map(identity)
	}

	async onEntityUpdateReceived(entityUpdates: readonly EntityUpdateData[], eventOwnerGroupId: Id, isInitialSyncDone: boolean): Promise<void> {
		if (this.logins.isUserLoggedIn()) {
			// the UserController must be notified first as other event receivers depend on it to be up-to-date
			await this.logins.getUserController().entityEventsReceived(entityUpdates, eventOwnerGroupId)

			const listenersByPriorities = Array.from(this.entityUpdatesListeners.values()).sort(
				(listenerA, listenerB) => listenerB.priority.valueOf() - listenerA.priority.valueOf(),
			)

			for (const listener of listenersByPriorities) {
				await listener.onEntityUpdatesReceived(entityUpdates, eventOwnerGroupId, isInitialSyncDone)
			}
		}
	}

	async onCountersUpdateReceived(update: WebsocketCounterData): Promise<void> {
		this.countersStream(update)
	}

	async onOperationStatusUpdate(update: OperationStatusUpdate): Promise<void> {
		for (const listener of this.operationListeners) {
			await listener(update)
		}
	}
}
