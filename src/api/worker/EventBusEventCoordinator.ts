import { EventBusListener } from "./EventBusClient.js"
import { WsConnectionState } from "../main/WorkerClient.js"
import { EntityUpdate, UserTypeRef, WebsocketCounterData, WebsocketLeaderStatus } from "../entities/sys/TypeRefs.js"
import { PhishingMarker } from "../entities/tutanota/TypeRefs.js"
import { WebsocketConnectivityListener } from "../../misc/WebsocketConnectivityModel.js"
import { WorkerImpl } from "./WorkerImpl.js"
import { isAdminClient, isTest } from "../common/Env.js"
import { MailFacade } from "./facades/MailFacade.js"
import type { Indexer } from "./search/Indexer.js"
import { UserFacade } from "./facades/UserFacade.js"
import { EntityClient } from "../common/EntityClient.js"
import { OperationType } from "../common/TutanotaConstants.js"
import { isSameTypeRefByAttr } from "@tutao/tutanota-utils"
import { isSameId } from "../common/utils/EntityUtils.js"
import { ExposedEventController } from "../main/EventController.js"

/** A bit of glue to distribute event bus events across the app. */
export class EventBusEventCoordinator implements EventBusListener {
	constructor(
		private readonly worker: WorkerImpl,
		private readonly connectivityListener: WebsocketConnectivityListener,
		private readonly mailFacade: MailFacade,
		private readonly indexer: () => Promise<Indexer>,
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly eventController: ExposedEventController,
	) {}

	onWebsocketStateChanged(state: WsConnectionState) {
		this.connectivityListener.updateWebSocketState(state)
	}

	async onEntityEventsReceived(events: EntityUpdate[], batchId: Id, groupId: Id): Promise<void> {
		await this.entityEventsReceived(events)
		await this.mailFacade.entityEventsReceived(events)
		await this.eventController.onEntityUpdateReceived(events, groupId)
		// Call the indexer in this last step because now the processed event is stored and the indexer has a separate event queue that
		// shall not receive the event twice.
		if (!isTest() && !isAdminClient()) {
			const queuedBatch = { groupId, batchId, events }
			const indexer = await this.indexer()
			indexer.addBatchesToQueue([queuedBatch])
			indexer.startProcessing()
		}
	}

	onPhishingMarkersReceived(markers: PhishingMarker[]) {
		this.mailFacade.phishingMarkersUpdateReceived(markers)
	}

	onError(tutanotaError: Error) {
		this.worker.sendError(tutanotaError)
	}

	onLeaderStatusChanged(leaderStatus: WebsocketLeaderStatus) {
		this.connectivityListener.onLeaderStatusChanged(leaderStatus)
	}

	onCounterChanged(counter: WebsocketCounterData) {
		this.eventController.onCountersUpdateReceived(counter)
	}

	private async entityEventsReceived(data: EntityUpdate[]): Promise<void> {
		// This is a compromise to not add entityClient to UserFacade which would introduce a circular dep.
		for (const update of data) {
			const user = this.userFacade.getUser()
			if (
				user != null &&
				update.operation === OperationType.UPDATE &&
				isSameTypeRefByAttr(UserTypeRef, update.application, update.type) &&
				isSameId(user._id, update.instanceId)
			) {
				this.userFacade.updateUser(await this.entityClient.load(UserTypeRef, user._id))
			}
		}
	}
}
