import { identity, Nullable } from "@tutao/tutanota-utils"
import type { LoginController } from "./LoginController"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { assertMainOrNode } from "../common/Env"
import { OperationStatusUpdate, WebsocketCounterData } from "../entities/sys/TypeRefs"
import { EntityUpdateData } from "../common/utils/EntityUpdateUtils.js"
import { ProgressMonitorId } from "../common/utils/ProgressMonitor"

assertMainOrNode()

export type ExposedEventController = Pick<EventController, "onEntityUpdateReceived" | "onCountersUpdateReceived" | "onOperationStatusUpdate">

const TAG = "[EventController]"

export type EntityEventsListener = (
	updates: ReadonlyArray<EntityUpdateData>,
	eventOwnerGroupId: Id,
	eventQueueProgressMonitorId: Nullable<ProgressMonitorId>,
) => Promise<unknown>

export type OperationStatusUpdateListener = (update: OperationStatusUpdate) => Promise<unknown>

export class EventController {
	private countersStream: Stream<WebsocketCounterData> = stream()
	private entityListeners: Set<EntityEventsListener> = new Set()
	private readonly operationListeners: Set<OperationStatusUpdateListener> = new Set()

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

	async onEntityUpdateReceived(
		entityUpdates: readonly EntityUpdateData[],
		eventOwnerGroupId: Id,
		eventQueueProgressMonitorId?: ProgressMonitorId,
	): Promise<void> {
		if (this.logins.isUserLoggedIn()) {
			// the UserController must be notified first as other event receivers depend on it to be up-to-date
			await this.logins.getUserController().entityEventsReceived(entityUpdates, eventOwnerGroupId)

			for (const listener of this.entityListeners) {
				await listener(entityUpdates, eventOwnerGroupId, eventQueueProgressMonitorId ?? null)
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
