import o from "@tutao/otest"
import { WorkerImpl } from "../../../../../src/mail-app/workerUtils/worker/WorkerImpl.js"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { GroupManagementFacade } from "../../../../../src/common/api/worker/facades/lazy/GroupManagementFacade.js"
import { CounterFacade } from "../../../../../src/common/api/worker/facades/lazy/CounterFacade.js"
import { RsaImplementation } from "../../../../../src/common/api/worker/crypto/RsaImplementation.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor.js"
import { matchers, object, when } from "testdouble"
import { MailAddressPropertiesTypeRef, MailboxGroupRootTypeRef, MailboxPropertiesTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { mapToObject } from "@tutao/tutanota-test-utils"
import { GroupInfoTypeRef, GroupMembershipTypeRef, MailAddressAliasTypeRef, UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { MailAddressFacade } from "../../../../../src/common/api/worker/facades/lazy/MailAddressFacade.js"
import { createTestEntity } from "../../../TestUtils.js"
import { arrayEquals, freshVersioned } from "@tutao/tutanota-utils"
import { EntityRestClientLoadOptions } from "../../../../../src/common/api/worker/rest/EntityRestClient.js"

o.spec("MailAddressFacadeTest", function () {
	let worker: WorkerImpl
	let userFacade: UserFacade
	let groupManagementFacade: GroupManagementFacade
	let countersFacade: CounterFacade
	let rsa: RsaImplementation
	let entityClient: EntityClient
	let serviceExecutor: ServiceExecutor
	let nonCachingEntityClient: EntityClient

	let facade: MailAddressFacade

	o.beforeEach(function () {
		userFacade = object()
		groupManagementFacade = object()
		serviceExecutor = object()
		nonCachingEntityClient = object()

		facade = new MailAddressFacade(userFacade, groupManagementFacade, serviceExecutor, nonCachingEntityClient)
	})

	o.spec("getSenderNames", function () {
		o("when there is existing MailboxProperties it returns the names", async function () {
			const mailGroupId = "mailGroupId"
			const viaUser = "viaUser"
			const mailboxPropertiesId = "mailboxPropertiesId"
			const mailboxGroupRoot = createTestEntity(MailboxGroupRootTypeRef, {
				_ownerGroup: mailGroupId,
				mailboxProperties: mailboxPropertiesId,
			})
			const mailGroupKey = freshVersioned([1, 2, 3])
			const mailboxProperties = createTestEntity(MailboxPropertiesTypeRef, {
				mailAddressProperties: [
					createTestEntity(MailAddressPropertiesTypeRef, {
						mailAddress: "a@a.com",
						senderName: "a",
					}),
					createTestEntity(MailAddressPropertiesTypeRef, {
						mailAddress: "b@b.com",
						senderName: "b",
					}),
				],
			})

			when(groupManagementFacade.getCurrentGroupKeyViaUser(mailGroupId, viaUser)).thenResolve(mailGroupKey)
			when(nonCachingEntityClient.load(MailboxGroupRootTypeRef, mailGroupId)).thenResolve(mailboxGroupRoot)
			when(
				nonCachingEntityClient.load(
					MailboxPropertiesTypeRef,
					mailboxPropertiesId,
					matchers.argThat(async (opts: EntityRestClientLoadOptions) => {
						const providedMailGroupKey = await opts.ownerKeyProvider!(mailGroupKey.version)
						return arrayEquals(mailGroupKey.object, providedMailGroupKey)
					}),
				),
			).thenResolve(mailboxProperties)

			const result = await facade.getSenderNames(mailGroupId, viaUser)
			o(mapToObject(result)).deepEquals({
				"a@a.com": "a",
				"b@b.com": "b",
			})
		})

		o("when there's no existing MailboxProperties it creates and returns one", async function () {
			const mailGroupId = "mailGroupId"
			const viaUser = "viaUser"
			const mailboxPropertiesId = "mailboxProeprtiesId"
			const mailboxGroupRoot = createTestEntity(MailboxGroupRootTypeRef, {
				_ownerGroup: mailGroupId,
				mailboxProperties: null,
			})
			const mailGroupKey = freshVersioned([1, 2, 3])
			const mailboxProperties = createTestEntity(MailboxPropertiesTypeRef, {
				_id: mailboxPropertiesId,
				_ownerGroup: mailGroupId,
				reportMovedMails: "",
				mailAddressProperties: [],
			})
			const userGroupInfoId: IdTuple = ["groupInfoListId", "groupInfoId"]
			const user = createTestEntity(UserTypeRef, {
				_id: viaUser,
				userGroup: createTestEntity(GroupMembershipTypeRef, {
					groupInfo: userGroupInfoId,
				}),
			})
			const userGroupInfo = createTestEntity(GroupInfoTypeRef, {
				_id: userGroupInfoId,
				name: "User name",
				mailAddress: "primary@example.com",
				mailAddressAliases: [
					createTestEntity(MailAddressAliasTypeRef, {
						mailAddress: "a@a.com",
						enabled: true,
					}),
				],
			})

			when(nonCachingEntityClient.load(UserTypeRef, viaUser)).thenResolve(user)
			when(nonCachingEntityClient.load(GroupInfoTypeRef, userGroupInfoId)).thenResolve(userGroupInfo)
			when(groupManagementFacade.getCurrentGroupKeyViaUser(mailGroupId, viaUser)).thenResolve(mailGroupKey)
			when(nonCachingEntityClient.load(MailboxGroupRootTypeRef, mailGroupId)).thenResolve(mailboxGroupRoot)
			when(nonCachingEntityClient.setup(null, matchers.anything(), undefined, { ownerKey: mailGroupKey })).thenResolve(mailboxPropertiesId)
			when(
				nonCachingEntityClient.load(
					MailboxPropertiesTypeRef,
					mailboxPropertiesId,
					matchers.argThat(async (opts: EntityRestClientLoadOptions) => {
						const providedMailGroupKey = await opts.ownerKeyProvider!(mailGroupKey.version)
						return arrayEquals(mailGroupKey.object, providedMailGroupKey)
					}),
				),
			).thenResolve(mailboxProperties)

			const result = await facade.getSenderNames(mailGroupId, viaUser)

			o(mapToObject(result)).deepEquals({
				"primary@example.com": "User name",
				"a@a.com": "User name",
			})
		})
	})
})
