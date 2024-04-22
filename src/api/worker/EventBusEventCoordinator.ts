import { EventBusListener } from "./EventBusClient.js"
import { WsConnectionState } from "../main/WorkerClient.js"
import { EntityUpdate, UserGroupKeyDistributionTypeRef, UserTypeRef, WebsocketCounterData, WebsocketLeaderStatus } from "../entities/sys/TypeRefs.js"
import { ReportedMailFieldMarker } from "../entities/tutanota/TypeRefs.js"
import { WebsocketConnectivityListener } from "../../misc/WebsocketConnectivityModel.js"
import { WorkerImpl } from "./WorkerImpl.js"
import { isAdminClient, isTest } from "../common/Env.js"
import { MailFacade } from "./facades/lazy/MailFacade.js"
import type { Indexer } from "./search/Indexer.js"
import { UserFacade } from "./facades/UserFacade.js"
import { EntityClient } from "../common/EntityClient.js"
import { OperationType } from "../common/TutanotaConstants.js"
import { isSameTypeRefByAttr, lazyAsync } from "@tutao/tutanota-utils"
import { isSameId } from "../common/utils/EntityUtils.js"
import { ExposedEventController } from "../main/EventController.js"
import { ConfigurationDatabase } from "./facades/lazy/ConfigurationDatabase.js"

/** A bit of glue to distribute event bus events across the app. */
export class EventBusEventCoordinator implements EventBusListener {
	constructor(
		private readonly worker: WorkerImpl,
		private readonly connectivityListener: WebsocketConnectivityListener,
		private readonly mailFacade: lazyAsync<MailFacade>,
		private readonly indexer: lazyAsync<Indexer>,
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly eventController: ExposedEventController,
		private readonly configurationDatabase: lazyAsync<ConfigurationDatabase>,
	) {}

	onWebsocketStateChanged(state: WsConnectionState) {
		this.connectivityListener.updateWebSocketState(state)
	}

	async onEntityEventsReceived(events: EntityUpdate[], batchId: Id, groupId: Id): Promise<void> {
		await this.entityEventsReceived(events)
		await (await this.mailFacade()).entityEventsReceived(events)
		await this.eventController.onEntityUpdateReceived(events, groupId)
		// Call the indexer in this last step because now the processed event is stored and the indexer has a separate event queue that
		// shall not receive the event twice.
		if (!isTest() && !isAdminClient()) {
			const queuedBatch = { groupId, batchId, events }
			const configurationDatabase = await this.configurationDatabase()
			await configurationDatabase.onEntityEventsReceived(queuedBatch)
			const indexer = await this.indexer()
			indexer.addBatchesToQueue([queuedBatch])
			indexer.startProcessing()
		}
	}

	/**
	 * @param markers only phishing (not spam) marker will be sent as websocket updates
	 */
	async onPhishingMarkersReceived(markers: ReportedMailFieldMarker[]) {
		;(await this.mailFacade()).phishingMarkersUpdateReceived(markers)
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
				await this.userFacade.updateUser(await this.entityClient.load(UserTypeRef, user._id))
			} else if (
				user != null &&
				(update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) &&
				isSameTypeRefByAttr(UserGroupKeyDistributionTypeRef, update.application, update.type) &&
				isSameId(user.userGroup.group, update.instanceId)
			) {
				// this handles updates of the user group key which is also stored on the user as a membership
				// we might not have access to the password to decrypt it, though. therefore we handle it here
				try {
					const userGroupKeyDistribution = await this.entityClient.load(UserGroupKeyDistributionTypeRef, update.instanceId)
					this.userFacade.updateUserGroupKey(userGroupKeyDistribution)
				} catch (e) {
					// we do not want to fail here, as this update might be outdated in case we only process updates after a longer period of being offline
					// in such case we should have set the correct user group key already during the regular login
					console.log("Could not update user group key after entity update", e)
				}
			}
		}
	}
}
