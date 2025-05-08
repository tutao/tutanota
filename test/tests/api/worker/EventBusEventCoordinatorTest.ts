import o from "@tutao/otest"
import { EventBusEventCoordinator } from "../../../../src/common/api/worker/EventBusEventCoordinator.js"
import { func, matchers, object, verify, when } from "testdouble"
import {
	EntityUpdate,
	EntityUpdateTypeRef,
	Group,
	GroupKeyUpdateTypeRef,
	GroupMembershipTypeRef,
	GroupTypeRef,
	User,
	UserGroupKeyDistributionTypeRef,
	UserTypeRef,
	WebsocketLeaderStatusTypeRef,
} from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { createTestEntity } from "../../TestUtils.js"
import { AccountType, OperationType, RolloutType } from "../../../../src/common/api/common/TutanotaConstants.js"
import { UserFacade } from "../../../../src/common/api/worker/facades/UserFacade.js"
import { EntityClient } from "../../../../src/common/api/common/EntityClient.js"
import { lazyAsync, lazyMemoized } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { EventController } from "../../../../src/common/api/main/EventController.js"
import { KeyRotationFacade } from "../../../../src/common/api/worker/facades/KeyRotationFacade.js"
import { CacheManagementFacade } from "../../../../src/common/api/worker/facades/lazy/CacheManagementFacade.js"
import { QueuedBatch } from "../../../../src/common/api/worker/EventQueue.js"
import { RolloutFacade } from "../../../../src/common/api/worker/facades/RolloutFacade"
import { GroupManagementFacade } from "../../../../src/common/api/worker/facades/lazy/GroupManagementFacade"
import { SyncTracker } from "../../../../src/common/api/main/SyncTracker"
import { IdentityKeyCreator } from "../../../../src/common/api/worker/facades/lazy/IdentityKeyCreator"

o.spec("EventBusEventCoordinatorTest", () => {
	let eventBusEventCoordinator: EventBusEventCoordinator
	let userId = "userId"
	let userGroupId = "userGroupId"
	let userGroupKeyVersion = "1"
	let user: User
	let userGroupKeyDistribution
	let userFacade: UserFacade
	let entityClient: EntityClient
	let mailFacade: MailFacade
	let eventController: EventController
	let keyRotationFacadeMock: KeyRotationFacade
	let cacheManagementFacade: CacheManagementFacade
	let rolloutFacadeMock: RolloutFacade
	let groupManagementFacade: GroupManagementFacade
	let syncTrackerMock: SyncTracker
	let identityKeyCreator: IdentityKeyCreator
	let teamGroupIds: Id[]

	o.beforeEach(function () {
		user = createTestEntity(UserTypeRef, {
			userGroup: createTestEntity(GroupMembershipTypeRef, { group: userGroupId }),
			_id: userId,
		})
		userFacade = object()
		when(userFacade.getUser()).thenReturn(user)
		when(userFacade.getUserGroupId()).thenReturn(userGroupId)
		entityClient = object()
		const userGroup: Group = object()
		userGroup.currentKeys = object()
		userGroup.groupKeyVersion = userGroupKeyVersion
		when(entityClient.load(GroupTypeRef, userGroupId)).thenResolve(userGroup)
		when(entityClient.load(UserTypeRef, userId)).thenResolve(user)
		userGroupKeyDistribution = createTestEntity(UserGroupKeyDistributionTypeRef, { _id: userGroupId })
		when(entityClient.load(UserGroupKeyDistributionTypeRef, userGroupId)).thenResolve(userGroupKeyDistribution)
		mailFacade = object()
		let lazyMailFacade: lazyAsync<MailFacade> = lazyMemoized(async () => mailFacade)
		eventController = object()
		keyRotationFacadeMock = object()
		cacheManagementFacade = object()
		rolloutFacadeMock = object()
		groupManagementFacade = object()
		syncTrackerMock = object()
		identityKeyCreator = object()
		teamGroupIds = ["team"]
		when(groupManagementFacade.loadTeamGroupIds()).thenResolve(teamGroupIds)
		eventBusEventCoordinator = new EventBusEventCoordinator(
			object(),
			lazyMailFacade,
			userFacade,
			entityClient,
			eventController,
			object(),
			keyRotationFacadeMock,
			async () => cacheManagementFacade,
			async (error: Error) => {},
			(queuedBatch: QueuedBatch[]) => {},
			rolloutFacadeMock,
			async () => groupManagementFacade,
			async () => identityKeyCreator,
			syncTrackerMock,
		)
	})

	o.spec("onSyncDone", function () {
		o("sends signal to main thread", async function () {
			await eventBusEventCoordinator.onSyncDone()

			verify(syncTrackerMock.markSyncAsDone())
		})

		o("executes UserIdentityKeyCreation rollout", async function () {
			when(userFacade.isLeader()).thenReturn(true)

			await eventBusEventCoordinator.onSyncDone()

			const captor = matchers.captor()
			verify(rolloutFacadeMock.processRollout(RolloutType.UserIdentityKeyCreation, captor.capture()))
			o(captor.values?.length).equals(1)

			// execute callback
			await captor.values![0]()
			verify(identityKeyCreator.createIdentityKeyPairForExistingUsers())
		})

		o("does not stop if UserIdentityKeyCreation rollout throws", async function () {
			when(userFacade.isLeader()).thenReturn(true)

			const error = object<Error>()
			when(identityKeyCreator.createIdentityKeyPairForExistingUsers()).thenReject(error)

			await eventBusEventCoordinator.onSyncDone()
			const captor = matchers.captor()
			verify(rolloutFacadeMock.processRollout(RolloutType.UserIdentityKeyCreation, captor.capture()))

			o(captor.values?.length).equals(1)
			// @ts-ignore

			eventBusEventCoordinator.sendError = func<(error: Error) => void>()
			// execute callback
			await captor.values![0]()

			// @ts-ignore
			verify(eventBusEventCoordinator.sendError(error))
		})

		o("does not stop if SharedMailboxIdentityKeyCreation rollout throws", async function () {
			when(userFacade.isLeader()).thenReturn(true)

			await eventBusEventCoordinator.onSyncDone()

			const captor = matchers.captor()
			verify(rolloutFacadeMock.processRollout(RolloutType.SharedMailboxIdentityKeyCreation, captor.capture()))
			o(captor.values?.length).equals(1)

			// @ts-ignore
			eventBusEventCoordinator.sendError = func<(error: Error) => void>()

			// execute callback
			const error = object<Error>()
			when(identityKeyCreator.createIdentityKeyPairForExistingTeamGroups(teamGroupIds)).thenReject(error)
			await captor.values![0]()

			// @ts-ignore
			verify(eventBusEventCoordinator.sendError(error))
		})

		o("executes SharedMailboxIdentityKeyCreation rollout", async function () {
			when(userFacade.isLeader()).thenReturn(true)

			await eventBusEventCoordinator.onSyncDone()

			const captor = matchers.captor()
			verify(rolloutFacadeMock.processRollout(RolloutType.SharedMailboxIdentityKeyCreation, captor.capture()))
			o(captor.values?.length).equals(1)

			// execute callback
			await captor.values![0]()
			verify(identityKeyCreator.createIdentityKeyPairForExistingTeamGroups(teamGroupIds))
		})

		o("does not execute rollouts if it is not the leader client", async function () {
			when(userFacade.isLeader()).thenReturn(false)

			await eventBusEventCoordinator.onSyncDone()

			verify(rolloutFacadeMock.processRollout(matchers.anything(), matchers.anything), { times: 0 })
		})
	})

	o("updateUser and UserGroupKeyDistribution", async function () {
		const updates: Array<EntityUpdate> = [
			createTestEntity(EntityUpdateTypeRef, {
				application: UserTypeRef.app,
				typeId: UserTypeRef.typeId.toString(),
				instanceId: userId,
				operation: OperationType.UPDATE,
			}),
			createTestEntity(EntityUpdateTypeRef, {
				application: UserGroupKeyDistributionTypeRef.app,
				typeId: UserGroupKeyDistributionTypeRef.typeId.toString(),
				instanceId: userGroupId,
				operation: OperationType.CREATE,
			}),
		]

		await eventBusEventCoordinator.onEntityEventsReceived(updates, "batchId", "groupId")

		verify(userFacade.updateUser(user))
		verify(cacheManagementFacade.tryUpdatingUserGroupKey())
		verify(eventController.onEntityUpdateReceived(updates, "groupId"))
		verify(mailFacade.entityEventsReceived(updates))
	})

	o("updatUser only user update", async function () {
		const updates: Array<EntityUpdate> = [
			createTestEntity(EntityUpdateTypeRef, {
				application: UserTypeRef.app,
				typeId: UserTypeRef.typeId.toString(),
				instanceId: userId,
				operation: OperationType.UPDATE,
			}),
		]

		await eventBusEventCoordinator.onEntityEventsReceived(updates, "batchId", "groupId")

		verify(userFacade.updateUser(user))
		verify(cacheManagementFacade.tryUpdatingUserGroupKey(), { times: 0 })
		verify(eventController.onEntityUpdateReceived(updates, "groupId"))
		verify(mailFacade.entityEventsReceived(updates))
	})

	o("groupKeyUpdate", async function () {
		const instanceListId = "updateListId"
		const instanceId = "updateElementId"
		const updates: Array<EntityUpdate> = [
			createTestEntity(EntityUpdateTypeRef, {
				application: GroupKeyUpdateTypeRef.app,
				typeId: GroupKeyUpdateTypeRef.typeId.toString(),
				instanceListId,
				instanceId,
				operation: OperationType.CREATE,
			}),
		]

		await eventBusEventCoordinator.onEntityEventsReceived(updates, "batchId", "groupId")

		verify(keyRotationFacadeMock.updateGroupMemberships([[instanceListId, instanceId]]))
		verify(userFacade.updateUser(user), { times: 0 })
		verify(cacheManagementFacade.tryUpdatingUserGroupKey(), { times: 0 })
		verify(eventController.onEntityUpdateReceived(updates, "groupId"))
		verify(mailFacade.entityEventsReceived(updates))
	})

	o.spec("onLeaderStatusChanged", function () {
		o("If we are not the leader client, delete the passphrase key", function () {
			env.mode = "Desktop"
			const leaderStatus = createTestEntity(WebsocketLeaderStatusTypeRef, { leaderStatus: false })

			eventBusEventCoordinator.onLeaderStatusChanged(leaderStatus)

			verify(keyRotationFacadeMock.reset())
			verify(keyRotationFacadeMock.processPendingKeyRotationsAndUpdates(matchers.anything()), { times: 0 })
		})

		o("If we are the leader client of an internal user, execute key rotations", function () {
			env.mode = "Desktop"
			const leaderStatus = createTestEntity(WebsocketLeaderStatusTypeRef, { leaderStatus: true })

			eventBusEventCoordinator.onLeaderStatusChanged(leaderStatus)

			verify(keyRotationFacadeMock.processPendingKeyRotationsAndUpdates(user))
		})

		o("If we are the leader client of an external user, delete the passphrase key", function () {
			env.mode = "Desktop"
			const leaderStatus = createTestEntity(WebsocketLeaderStatusTypeRef, { leaderStatus: true })
			user.accountType = AccountType.EXTERNAL

			eventBusEventCoordinator.onLeaderStatusChanged(leaderStatus)

			verify(keyRotationFacadeMock.reset())
			verify(keyRotationFacadeMock.processPendingKeyRotationsAndUpdates(matchers.anything()), { times: 0 })
		})
	})
})
