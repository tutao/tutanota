import o from "@tutao/otest"
import { EventBusEventCoordinator } from "../../../../src/common/api/worker/EventBusEventCoordinator.js"
import { matchers, object, verify, when, func } from "testdouble"
import {
	EntityUpdateTypeRef,
	GroupKeyUpdateTypeRef,
	GroupMembershipTypeRef,
	User,
	UserGroupKeyDistributionTypeRef,
	UserTypeRef,
	WebsocketLeaderStatusTypeRef,
} from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { createTestEntity, withOverriddenEnv } from "../../TestUtils.js"
import { AccountType, OperationType, RolloutType } from "../../../../src/common/api/common/TutanotaConstants.js"
import { UserFacade } from "../../../../src/common/api/worker/facades/UserFacade.js"
import { EntityClient } from "../../../../src/common/api/common/EntityClient.js"
import { lazyAsync, lazyMemoized } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { EventController } from "../../../../src/common/api/main/EventController.js"
import { KeyRotationFacade } from "../../../../src/common/api/worker/facades/KeyRotationFacade.js"
import { CacheManagementFacade } from "../../../../src/common/api/worker/facades/lazy/CacheManagementFacade.js"
import { EntityUpdateData } from "../../../../src/common/api/common/utils/EntityUpdateUtils"
import { Mode } from "../../../../src/common/api/common/Env"
import { QueuedBatch } from "../../../../src/common/api/worker/EventQueue.js"
import { RolloutFacade } from "../../../../src/common/api/worker/facades/RolloutFacade"
import { GroupManagementFacade } from "../../../../src/common/api/worker/facades/lazy/GroupManagementFacade"
import { SyncTracker } from "../../../../src/common/api/main/SyncTracker"

o.spec("EventBusEventCoordinatorTest", () => {
	let eventBusEventCoordinator: EventBusEventCoordinator
	let userId = "userId"
	let userGroupId = "userGroupId"
	let user: User
	let userGroupKeyDistribution
	let userFacade: UserFacade
	let entityClient: EntityClient
	let mailFacade: MailFacade
	let eventController: EventController
	let keyRotationFacadeMock: KeyRotationFacade
	let cacheManagementFacade: CacheManagementFacade
	let rolloutFacadeMock: RolloutFacade
	let groupManagementFacadeMock: lazyAsync<GroupManagementFacade>
	let syncTrackerMock: SyncTracker

	o.beforeEach(function () {
		user = createTestEntity(UserTypeRef, {
			userGroup: createTestEntity(GroupMembershipTypeRef, { group: userGroupId }),
			_id: userId,
		})
		userFacade = object()
		when(userFacade.getUser()).thenReturn(user)
		entityClient = object()
		when(entityClient.load(UserTypeRef, userId)).thenResolve(user)
		userGroupKeyDistribution = createTestEntity(UserGroupKeyDistributionTypeRef, { _id: userGroupId })
		when(entityClient.load(UserGroupKeyDistributionTypeRef, userGroupId)).thenResolve(userGroupKeyDistribution)
		mailFacade = object()
		let lazyMailFacade: lazyAsync<MailFacade> = lazyMemoized(async () => mailFacade)
		eventController = object()
		keyRotationFacadeMock = object()
		cacheManagementFacade = object()
		rolloutFacadeMock = object()
		groupManagementFacadeMock = func<lazyAsync<GroupManagementFacade>>()
		syncTrackerMock = object()
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
			(_) => {},
			rolloutFacadeMock,
			groupManagementFacadeMock,
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

			const gfm: GroupManagementFacade = object()
			when(groupManagementFacadeMock()).thenResolve(gfm)

			// execute callback
			await captor.values![0]()
			verify(gfm.createIdentityKeyPair(matchers.anything()))
		})

		o("does not execute rollouts if it is not the leader client", async function () {
			when(userFacade.isLeader()).thenReturn(false)

			await eventBusEventCoordinator.onSyncDone()

			verify(rolloutFacadeMock.processRollout(matchers.anything(), matchers.anything), { times: 0 })
		})
	})

	o("updateUser and UserGroupKeyDistribution", async function () {
		const updates: Array<EntityUpdateData> = [
			{
				typeRef: UserTypeRef,
				instanceId: userId,
				instanceListId: "",
				operation: OperationType.UPDATE,
			},
			{
				typeRef: UserGroupKeyDistributionTypeRef,
				instanceId: userGroupId,
				instanceListId: "",
				operation: OperationType.CREATE,
			},
		]

		await eventBusEventCoordinator.onEntityEventsReceived(updates, "batchId", "groupId")

		verify(userFacade.updateUser(user))
		verify(cacheManagementFacade.tryUpdatingUserGroupKey())
		verify(eventController.onEntityUpdateReceived(updates, "groupId"))
		verify(mailFacade.entityEventsReceived(updates))
	})

	o("updateUser only user update", async function () {
		const updates: Array<EntityUpdateData> = [
			{
				typeRef: UserTypeRef,
				instanceId: userId,
				instanceListId: "",
				operation: OperationType.UPDATE,
			},
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
		const updates: Array<EntityUpdateData> = [
			{
				typeRef: GroupKeyUpdateTypeRef,
				instanceListId,
				instanceId,
				operation: OperationType.CREATE,
			},
		]

		await eventBusEventCoordinator.onEntityEventsReceived(updates, "batchId", "groupId")

		verify(keyRotationFacadeMock.updateGroupMemberships([[instanceListId, instanceId]]))
		verify(userFacade.updateUser(user), { times: 0 })
		verify(cacheManagementFacade.tryUpdatingUserGroupKey(), { times: 0 })
		verify(eventController.onEntityUpdateReceived(updates, "groupId"))
		verify(mailFacade.entityEventsReceived(updates))
	})

	o.spec("onLeaderStatusChanged", function () {
		o("If we are not the leader client, delete the passphrase key", async function () {
			const leaderStatus = createTestEntity(WebsocketLeaderStatusTypeRef, { leaderStatus: false })
			await withOverriddenEnv({ mode: Mode.Desktop }, () => {
				eventBusEventCoordinator.onLeaderStatusChanged(leaderStatus)
			})

			verify(keyRotationFacadeMock.reset())
			verify(keyRotationFacadeMock.processPendingKeyRotationsAndUpdates(matchers.anything()), { times: 0 })
		})

		o("If we are the leader client of an internal user, execute key rotations", async function () {
			const leaderStatus = createTestEntity(WebsocketLeaderStatusTypeRef, { leaderStatus: true })

			await withOverriddenEnv({ mode: Mode.Desktop }, () => {
				eventBusEventCoordinator.onLeaderStatusChanged(leaderStatus)
			})

			verify(keyRotationFacadeMock.processPendingKeyRotationsAndUpdates(user))
		})

		o("If we are the leader client of an external user, delete the passphrase key", async function () {
			const leaderStatus = createTestEntity(WebsocketLeaderStatusTypeRef, { leaderStatus: true })
			user.accountType = AccountType.EXTERNAL

			await withOverriddenEnv({ mode: Mode.Desktop }, () => {
				eventBusEventCoordinator.onLeaderStatusChanged(leaderStatus)
			})

			verify(keyRotationFacadeMock.reset())
			verify(keyRotationFacadeMock.processPendingKeyRotationsAndUpdates(matchers.anything()), { times: 0 })
		})
	})
})
