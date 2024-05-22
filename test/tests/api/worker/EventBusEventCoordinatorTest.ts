import o from "@tutao/otest"
import { EventBusEventCoordinator } from "../../../../src/api/worker/EventBusEventCoordinator.js"
import { object, verify, when } from "testdouble"
import {
	EntityUpdate,
	EntityUpdateTypeRef,
	GroupMembershipTypeRef,
	User,
	UserGroupKeyDistributionTypeRef,
	UserTypeRef,
} from "../../../../src/api/entities/sys/TypeRefs.js"
import { createTestEntity } from "../../TestUtils.js"
import { OperationType } from "../../../../src/api/common/TutanotaConstants.js"

import { UserFacade } from "../../../../src/api/worker/facades/UserFacade.js"
import { EntityClient } from "../../../../src/api/common/EntityClient.js"
import { lazyAsync, lazyMemoized } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../../src/api/worker/facades/lazy/MailFacade.js"
import { EventController } from "../../../../src/api/main/EventController.js"

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

	o.beforeEach(function () {
		user = createTestEntity(UserTypeRef, { userGroup: createTestEntity(GroupMembershipTypeRef, { group: userGroupId }), _id: userId })
		userFacade = object()
		when(userFacade.getUser()).thenReturn(user)
		entityClient = object()
		when(entityClient.load(UserTypeRef, userId)).thenResolve(user)
		userGroupKeyDistribution = createTestEntity(UserGroupKeyDistributionTypeRef, { _id: userGroupId })
		when(entityClient.load(UserGroupKeyDistributionTypeRef, userGroupId)).thenResolve(userGroupKeyDistribution)
		mailFacade = object()
		let lazyMailFacade: lazyAsync<MailFacade> = lazyMemoized(async () => mailFacade)
		eventController = object()
		eventBusEventCoordinator = new EventBusEventCoordinator(
			object(),
			object(),
			lazyMailFacade,
			object(),
			userFacade,
			entityClient,
			eventController,
			object(),
		)
	})

	o("updateUser and UserGroupKeyDistribution", async function () {
		const updates: Array<EntityUpdate> = [
			createTestEntity(EntityUpdateTypeRef, {
				application: UserTypeRef.app,
				type: UserTypeRef.type,
				instanceId: userId,
				operation: OperationType.UPDATE,
			}),
			createTestEntity(EntityUpdateTypeRef, {
				application: UserGroupKeyDistributionTypeRef.app,
				type: UserGroupKeyDistributionTypeRef.type,
				instanceId: userGroupId,
				operation: OperationType.CREATE,
			}),
		]

		await eventBusEventCoordinator.onEntityEventsReceived(updates, "batchId", "groupId")

		verify(userFacade.updateUser(user))
		verify(userFacade.updateUserGroupKey(userGroupKeyDistribution))
		verify(eventController.onEntityUpdateReceived(updates, "groupId"))
		verify(mailFacade.entityEventsReceived(updates))
	})

	o("updatUser only user update", async function () {
		const updates: Array<EntityUpdate> = [
			createTestEntity(EntityUpdateTypeRef, {
				application: UserTypeRef.app,
				type: UserTypeRef.type,
				instanceId: userId,
				operation: OperationType.UPDATE,
			}),
		]

		await eventBusEventCoordinator.onEntityEventsReceived(updates, "batchId", "groupId")

		verify(userFacade.updateUser(user))
		verify(userFacade.updateUserGroupKey(userGroupKeyDistribution), { times: 0 })
		verify(eventController.onEntityUpdateReceived(updates, "groupId"))
		verify(mailFacade.entityEventsReceived(updates))
	})
})
