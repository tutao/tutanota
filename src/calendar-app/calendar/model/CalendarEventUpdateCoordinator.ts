import { WebsocketConnectivityModel } from "../../../common/misc/WebsocketConnectivityModel"
import { CalendarModel, NoOwnerEncSessionKeyForCalendarEventError } from "./CalendarModel"
import { EventController } from "../../../common/api/main/EventController"

import { elementIdPart, entityUpdateUtils, tutanotaTypeRefs } from "@tutao/typeRefs"
import { restError } from "@tutao/restClient"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import { SyncTracker } from "../../../common/api/main/SyncTracker"
import { OperationType } from "@tutao/appEnv"

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
	private readonly fileIdToSkippedCalendarEventUpdates: Map<Id, tutanotaTypeRefs.CalendarEventUpdate> = new Map()

	// create reference to the listener so it can be deleted from the event controller when the client stops being leader.
	private readonly entityEventListener: entityUpdateUtils.EntityEventsListener = {
		onEntityUpdatesReceived: (updates, eventOwnerGroupId) => {
			return this.entityEventsReceived(updates, eventOwnerGroupId)
		},
		priority: entityUpdateUtils.OnEntityUpdateReceivedPriority.NORMAL,
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
		await this.syncTracker.waitSync() // await conclusion of global sync process

		// Subscribe to leaders status changes so we can process calendar event updates when the client becomes leader
		this.wsConnectivityModel.addLeaderStatusListener((newLeaderStatus) => {
			return this.onLeaderStatusChanged(newLeaderStatus)
		})

		// initialize the model depending on leader status state.
		await this.onLeaderStatusChanged(this.wsConnectivityModel.isLeader())
	}
	public async onLeaderStatusChanged(isLeader: boolean) {
		if (isLeader) {
			// Note that the order is important here. The initial loading of calendarEventUpdates must happen
			// before registering event listener to prevent possible concurrency issues.
			await this.loadAndProcessCalendarEventInvitesUpdates()
			this.eventController.addEntityListener(this.entityEventListener)
		} else {
			this.eventController.removeEntityListener(this.entityEventListener)
		}
	}

	public async entityEventsReceived(updates: ReadonlyArray<entityUpdateUtils.EntityUpdateData>, eventOwnerGroupId: Id) {
		for (const entityEventData of updates) {
			if (
				entityUpdateUtils.isUpdateForTypeRef(tutanotaTypeRefs.CalendarEventUpdateTypeRef, entityEventData) &&
				entityEventData.operation === OperationType.CREATE
			) {
				try {
					const calendarEventUpdate = await this.entityClient.load(tutanotaTypeRefs.CalendarEventUpdateTypeRef, [
						entityEventData.instanceListId,
						entityEventData.instanceId,
					])
					await this.handleCalendarEventUpdateAndHandleErrors(calendarEventUpdate)
				} catch (e) {
					if (e instanceof restError.NotFoundError) {
						console.log(TAG, "invite not found", [entityEventData.instanceListId, entityEventData.instanceId])
					} else {
						throw e
					}
				}
			} else if (entityUpdateUtils.isUpdateForTypeRef(tutanotaTypeRefs.FileTypeRef, entityEventData)) {
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
	private async handleCalendarEventUpdateAndHandleErrors(calendarEventUpdate: tutanotaTypeRefs.CalendarEventUpdate) {
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
		const invites = await this.entityClient.loadAll(tutanotaTypeRefs.CalendarEventUpdateTypeRef, calendarEventUpdates.list)
		for (const invite of invites) {
			await this.handleCalendarEventUpdateAndHandleErrors(invite)
		}
	}

	// VisibleForTesting
	getFileIdToSkippedCalendarEventUpdates(): Map<Id, tutanotaTypeRefs.CalendarEventUpdate> {
		return this.fileIdToSkippedCalendarEventUpdates
	}
}
