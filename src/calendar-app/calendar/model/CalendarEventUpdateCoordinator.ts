import { WebsocketConnectivityModel } from "../../../common/misc/WebsocketConnectivityModel"
import { CalendarModel, NoOwnerEncSessionKeyForCalendarEventError } from "./CalendarModel"
import { EntityEventsListener, EventController } from "../../../common/api/main/EventController"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"
import { CalendarEventUpdate, CalendarEventUpdateTypeRef, FileTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { OperationType } from "../../../common/api/common/TutanotaConstants"
import { NotFoundError } from "../../../common/api/common/error/RestError"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { elementIdPart } from "../../../common/api/common/utils/EntityUtils"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import { SyncTracker } from "../../../common/api/main/SyncTracker"

const TAG = "[CalendarEventUpdateCoordinator]"

/**
 * Coordinates the processing of CalendarEventUpdates which contain ics files that where received via email.
 * This class ensures that only one client is responsible for processing CalendarEventUpdates,
 * to prevent duplicate event creation when multiple clients are open.
 *
 * Separated from CalendarModel because of special logic around leader client vs follower client.
 *
 */
export class CalendarEventUpdateCoordinator {
	private readonly fileIdToSkippedCalendarEventUpdates: Map<Id, CalendarEventUpdate> = new Map()

	// create reference to the listener so it can be deleted from the event controller when the client stops being leader.
	private readonly entityEventListener: EntityEventsListener = (updates, eventOwnerGroupId) => {
		return this.entityEventsReceived(updates, eventOwnerGroupId)
	}
	constructor(
		private readonly wsConnectivityModel: WebsocketConnectivityModel,
		private readonly calendarModel: CalendarModel,
		private readonly eventController: EventController,
		private readonly entityClient: EntityClient,
		private readonly mailboxModel: MailboxModel,
		private readonly syncTracker: SyncTracker,
	) {}

	/**
	 * Initialize the coordinator.  Designed to wait for the global sync process to complete before proceeding, to prevent concurrency issues.
	 */
	public async init() {
		console.log(TAG, "init - isLeader", this.wsConnectivityModel.isLeader())
		await this.syncTracker.waitSync() // await conclusion of global sync process

		// initial setup for leader status (because subscription to leader stream doesn't immediately React upon subscribing)
		if (this.wsConnectivityModel.isLeader()) {
			await this.initAsLeader()
		}

		// subscribe to leader status stream to receive changes to the leader status change.
		this.wsConnectivityModel.getLeaderStatusStream().map((newLeaderStatus) => {
			// when we become leader client we want to process all existing calendar event updates that have not been processed yet.
			console.log("LEADER STATUS STREAM REACTION:", newLeaderStatus)
			this.onLeaderStatusChanged(newLeaderStatus)
		})
	}

	public async onLeaderStatusChanged(isLeader: boolean) {
		console.log(TAG, "onLeaderStatusChanged - isLeader", isLeader)
		if (isLeader) {
			await this.initAsLeader()
		} else {
			this.eventController.removeEntityListener(this.entityEventListener)
		}
	}

	/**
	 * Contains steps to take whenever the current client becomes the leader client.
	 * Note that order is important. Initial loading of calendarEventUpdates must happen
	 * before registering event listener to prevent possible concurrency issues.
	 * @private
	 */
	private async initAsLeader() {
		await this.loadAndProcessCalendarEventInvitesUpdates()
		this.eventController.addEntityListener(this.entityEventListener)
	}

	public async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id) {
		console.log("THIS value:", this)
		for (const entityEventData of updates) {
			if (isUpdateForTypeRef(CalendarEventUpdateTypeRef, entityEventData) && entityEventData.operation === OperationType.CREATE) {
				console.log("CalendarEventUpdateCoordinator listener called")
				try {
					const calendarEventUpdate = await this.entityClient.load(CalendarEventUpdateTypeRef, [
						entityEventData.instanceListId,
						entityEventData.instanceId,
					])
					await this.handleCalendarEventUpdateAndHandleErrors(calendarEventUpdate)
				} catch (e) {
					if (e instanceof NotFoundError) {
						console.log(TAG, "invite not found", [entityEventData.instanceListId, entityEventData.instanceId], e)
					} else {
						throw e
					}
				}
			} else if (isUpdateForTypeRef(FileTypeRef, entityEventData)) {
				// with a file update, the owner enc session key should be present now so we can try to process any skipped calendar event updates
				// (see NoOwnerEncSessionKeyForCalendarEventError's comment)
				const skippedCalendarEventUpdate = this.fileIdToSkippedCalendarEventUpdates.get(entityEventData.instanceId)
				if (skippedCalendarEventUpdate) {
					try {
						await this.calendarModel.handleCalendarEventUpdate(skippedCalendarEventUpdate)
					} finally {
						this.fileIdToSkippedCalendarEventUpdates.delete(entityEventData.instanceId)
					}
				}
			}
		}
	}

	/**
	 * Tries to handle calendar event updates. Handle errors in cases the ownerEncSessionKey is not available.
	 */
	private async handleCalendarEventUpdateAndHandleErrors(calendarEventUpdate: CalendarEventUpdate) {
		try {
			await this.calendarModel.handleCalendarEventUpdate(calendarEventUpdate)
		} catch (e) {
			if (e instanceof NoOwnerEncSessionKeyForCalendarEventError) {
				// we will get an update with the mail and sk soon, then we'll be able to finish this.
				this.fileIdToSkippedCalendarEventUpdates.set(elementIdPart(calendarEventUpdate.file), calendarEventUpdate)
			} else {
				throw e
			}
		}
	}

	private async loadAndProcessCalendarEventInvitesUpdates(): Promise<void> {
		const { mailboxGroupRoot } = await this.mailboxModel.getUserMailboxDetails()
		const { calendarEventUpdates } = mailboxGroupRoot
		if (calendarEventUpdates == null) return
		const invites = await this.entityClient.loadAll(CalendarEventUpdateTypeRef, calendarEventUpdates.list)
		for (const invite of invites) {
			await this.handleCalendarEventUpdateAndHandleErrors(invite)
		}
	}

	// VisibleForTesting
	getFileIdToSkippedCalendarEventUpdates(): Map<Id, CalendarEventUpdate> {
		return this.fileIdToSkippedCalendarEventUpdates
	}
}
