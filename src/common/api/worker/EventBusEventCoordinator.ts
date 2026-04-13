import { EventBusListener } from "./EventBusClient.js"
import { entityUpdateUtils, isSameId, sysTypeRefs, tutanotaTypeRefs } from "@tutao/typeRefs"
import { MailFacade } from "./facades/lazy/MailFacade.js"
import { UserFacade } from "./facades/UserFacade.js"
import { EntityClient } from "../common/EntityClient.js"
import { RolloutType } from "@tutao/appEnv"
import { assertNotNull, lazyAsync, Nullable } from "@tutao/utils"
import { ExposedEventController } from "../main/EventController.js"
import { ConfigurationDatabase } from "./facades/lazy/ConfigurationDatabase.js"
import { KeyRotationFacade } from "./facades/KeyRotationFacade.js"
import { CacheManagementFacade } from "./facades/lazy/CacheManagementFacade.js"
import { RolloutFacade } from "./facades/RolloutFacade"
import { GroupManagementFacade } from "./facades/lazy/GroupManagementFacade"
import { SyncTracker } from "../main/SyncTracker"
import { IdentityKeyCreator } from "./facades/lazy/IdentityKeyCreator"
import { ProgressMonitorId } from "../common/utils/ProgressMonitor"
import { Mode, OperationType } from "@tutao/appEnv"

/** A bit of glue to distribute event bus events across the app. */
export class EventBusEventCoordinator implements EventBusListener {
	constructor(
		private readonly mailFacade: lazyAsync<MailFacade>,
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly eventController: ExposedEventController,
		private readonly configurationDatabase: lazyAsync<ConfigurationDatabase>,
		private readonly keyRotationFacade: KeyRotationFacade,
		private readonly cacheManagementFacade: lazyAsync<CacheManagementFacade>,
		private readonly sendError: (error: Error) => Promise<void>,
		private readonly appSpecificBatchHandling: (events: readonly entityUpdateUtils.EntityUpdateData[], batchId: Id, groupId: Id) => void,
		private readonly rolloutFacade: RolloutFacade,
		private readonly groupManagementFacade: lazyAsync<GroupManagementFacade>,
		private readonly identityKeyCreator: lazyAsync<IdentityKeyCreator>,
		private readonly syncTracker: SyncTracker,
	) {}

	async onEntityEventsReceived(
		events: readonly entityUpdateUtils.EntityUpdateData[],
		batchId: Id,
		groupId: Id,
		progressMonitorId: Nullable<ProgressMonitorId>,
		isInitialSyncDone: boolean,
	): Promise<void> {
		await this.entityEventsReceived(events)
		await (await this.mailFacade()).entityEventsReceived(events)
		await this.eventController.onEntityUpdateReceived(events, groupId, progressMonitorId, isInitialSyncDone)
		// Call the indexer in this last step because now the processed event is stored and the indexer has a separate event queue that
		// shall not receive the event twice.
		if (!(env.mode === Mode.Test) && !(env.mode === Mode.Admin)) {
			const configurationDatabase = await this.configurationDatabase()
			await configurationDatabase.onEntityEventsReceived(events, batchId, groupId)
			this.appSpecificBatchHandling(events, batchId, groupId)
		}
	}

	/**
	 * @param markers only phishing (not spam) marker will be sent as websocket updates
	 */
	async onPhishingMarkersReceived(markers: tutanotaTypeRefs.ReportedMailFieldMarker[]) {
		;(await this.mailFacade()).phishingMarkersUpdateReceived(markers)
	}

	onError(tutanotaError: Error) {
		this.sendError(tutanotaError)
	}

	onCounterChanged(counter: sysTypeRefs.WebsocketCounterData) {
		this.eventController.onCountersUpdateReceived(counter)
	}

	async onSyncDone(): Promise<void> {
		this.syncTracker.markSyncAsDone()

		if (this.userFacade.isLeader() && !(env.mode === Mode.Admin)) {
			const userIdentityKeyCreationAction = {
				execute: async () => {
					const identityKeyCreator = await this.identityKeyCreator()

					try {
						await identityKeyCreator.createIdentityKeyPairForExistingUsers()
					} catch (error) {
						console.log("error when creating user identity key pair", error)
						this.sendError(error)
					}
				},
			}
			await this.rolloutFacade.configureRollout(RolloutType.UserIdentityKeyCreation, userIdentityKeyCreationAction)

			const sharedMailboxIdentityKeyCreationAction = {
				execute: async () => {
					const identityKeyCreator = await this.identityKeyCreator()
					const groupManagementFacade = await this.groupManagementFacade()
					try {
						const teamGroups = await groupManagementFacade.loadTeamGroupIds()
						await identityKeyCreator.createIdentityKeyPairForExistingTeamGroups(teamGroups)
					} catch (error) {
						console.log(`error when creating shared mailbox identity key pairs`, error)
						this.sendError(error)
					}
				},
			}
			await this.rolloutFacade.configureRollout(RolloutType.SharedMailboxIdentityKeyCreation, sharedMailboxIdentityKeyCreationAction)

			const processGroupKeyUpdates = {
				execute: async () => {
					try {
						const userGroupRoot = await this.entityClient.load(sysTypeRefs.UserGroupRootTypeRef, this.userFacade.getUserGroupId())
						const groupKeyUpdates = await this.entityClient.loadAll(
							sysTypeRefs.GroupKeyUpdateTypeRef,
							assertNotNull(userGroupRoot.groupKeyUpdates).list,
						)
						await this.keyRotationFacade.updateGroupMemberships(groupKeyUpdates)
					} catch (error) {
						console.log("error when processing a pending group key update", error)
						this.sendError(error)
					}
				},
			}
			await this.rolloutFacade.configureRollout(RolloutType.GroupKeyUpdatePending, processGroupKeyUpdates)

			await this.rolloutFacade.processRollout(RolloutType.GroupKeyUpdatePending)
			await this.rolloutFacade.processRollout(RolloutType.UserIdentityKeyCreation)
			await this.rolloutFacade.processRollout(RolloutType.SharedMailboxIdentityKeyCreation)
			await this.rolloutFacade.processRollout(RolloutType.AdminOrUserGroupKeyRotation)
			await this.rolloutFacade.processRollout(RolloutType.OtherGroupKeyRotation)
		}
	}

	onOperationStatusUpdate(update: sysTypeRefs.OperationStatusUpdate) {
		this.eventController.onOperationStatusUpdate(update)
	}

	private async entityEventsReceived(data: readonly entityUpdateUtils.EntityUpdateData[]): Promise<void> {
		// This is a compromise to not add entityClient to UserFacade which would introduce a circular dep.
		const groupKeyUpdates: IdTuple[] = [] // GroupKeyUpdates all in the same list
		const user = this.userFacade.getUser()
		if (user == null) return
		for (const update of data) {
			if (
				update.operation === OperationType.UPDATE &&
				entityUpdateUtils.isUpdateForTypeRef(sysTypeRefs.UserTypeRef, update) &&
				isSameId(user._id, update.instanceId)
			) {
				await this.userFacade.updateUser(await this.entityClient.load(sysTypeRefs.UserTypeRef, user._id))
			} else if (
				(update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) &&
				entityUpdateUtils.isUpdateForTypeRef(sysTypeRefs.UserGroupKeyDistributionTypeRef, update) &&
				isSameId(user.userGroup.group, update.instanceId)
			) {
				await (await this.cacheManagementFacade()).tryUpdatingUserGroupKey()
			} else if (update.operation === OperationType.CREATE && entityUpdateUtils.isUpdateForTypeRef(sysTypeRefs.GroupKeyUpdateTypeRef, update)) {
				groupKeyUpdates.push([update.instanceListId, update.instanceId])
			}
		}
		await this.keyRotationFacade.updateGroupMembershipsInOneList(groupKeyUpdates)
	}
}
