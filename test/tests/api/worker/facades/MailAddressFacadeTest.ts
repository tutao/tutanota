import o, { mapToObject, spy } from "@tutao/otest"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor.js"
import { matchers, object, when } from "testdouble"
import { MailAddressFacade, TokenBucket } from "../../../../../src/common/api/worker/facades/lazy/MailAddressFacade.js"
import { createTestEntity } from "../../../TestUtils.js"
import { arrayEquals, freshVersioned } from "@tutao/utils"
import { EntityRestClientLoadOptions } from "../../../../../src/common/api/worker/rest/EntityRestClient.js"
import { AdminKeyLoaderFacade } from "../../../../../src/common/api/worker/facades/AdminKeyLoaderFacade"
import { DateProvider } from "../../../../../src/common/api/common/DateProvider"
import { sysTypeRefs, tutanotaTypeRefs } from "@tutao/typeRefs"

o.spec("MailAddressFacadeTest", function () {
	let userFacade: UserFacade
	let adminKeyLoaderFacade: AdminKeyLoaderFacade
	let serviceExecutor: ServiceExecutor
	let nonCachingEntityClient: EntityClient
	let dateProvider: DateProvider

	let facade: MailAddressFacade

	o.beforeEach(function () {
		userFacade = object()
		adminKeyLoaderFacade = object()
		serviceExecutor = object()
		nonCachingEntityClient = object()
		dateProvider = object()

		facade = new MailAddressFacade(userFacade, adminKeyLoaderFacade, serviceExecutor, nonCachingEntityClient, dateProvider)
	})

	o.spec("getSenderNames", function () {
		o("when there is existing MailboxProperties it returns the names", async function () {
			const mailGroupId = "mailGroupId"
			const viaUser = "viaUser"
			const mailboxPropertiesId = "mailboxPropertiesId"
			const mailboxGroupRoot = createTestEntity(tutanotaTypeRefs.MailboxGroupRootTypeRef, {
				_ownerGroup: mailGroupId,
				mailboxProperties: mailboxPropertiesId,
			})
			const mailGroupKey = freshVersioned([1, 2, 3])
			const mailboxProperties = createTestEntity(tutanotaTypeRefs.MailboxPropertiesTypeRef, {
				mailAddressProperties: [
					createTestEntity(tutanotaTypeRefs.MailAddressPropertiesTypeRef, {
						mailAddress: "a@a.com",
						senderName: "a",
					}),
					createTestEntity(tutanotaTypeRefs.MailAddressPropertiesTypeRef, {
						mailAddress: "b@b.com",
						senderName: "b",
					}),
				],
			})

			when(adminKeyLoaderFacade.getCurrentGroupKeyViaUser(mailGroupId, viaUser)).thenResolve(mailGroupKey)
			when(nonCachingEntityClient.load(tutanotaTypeRefs.MailboxGroupRootTypeRef, mailGroupId)).thenResolve(mailboxGroupRoot)
			when(
				nonCachingEntityClient.load(
					tutanotaTypeRefs.MailboxPropertiesTypeRef,
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
			const mailboxGroupRoot = createTestEntity(tutanotaTypeRefs.MailboxGroupRootTypeRef, {
				_ownerGroup: mailGroupId,
				mailboxProperties: null,
			})
			const mailGroupKey = freshVersioned([1, 2, 3])
			const mailboxProperties = createTestEntity(tutanotaTypeRefs.MailboxPropertiesTypeRef, {
				_id: mailboxPropertiesId,
				_ownerGroup: mailGroupId,
				reportMovedMails: "",
				mailAddressProperties: [],
			})
			const userGroupInfoId: IdTuple = ["groupInfoListId", "groupInfoId"]
			const user = createTestEntity(sysTypeRefs.UserTypeRef, {
				_id: viaUser,
				userGroup: createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
					groupInfo: userGroupInfoId,
				}),
			})
			const userGroupInfo = createTestEntity(sysTypeRefs.GroupInfoTypeRef, {
				_id: userGroupInfoId,
				name: "User name",
				mailAddress: "primary@example.com",
				mailAddressAliases: [
					createTestEntity(sysTypeRefs.MailAddressAliasTypeRef, {
						mailAddress: "a@a.com",
						enabled: true,
					}),
				],
			})

			when(nonCachingEntityClient.load(sysTypeRefs.UserTypeRef, viaUser)).thenResolve(user)
			when(nonCachingEntityClient.load(sysTypeRefs.GroupInfoTypeRef, userGroupInfoId)).thenResolve(userGroupInfo)
			when(adminKeyLoaderFacade.getCurrentGroupKeyViaUser(mailGroupId, viaUser)).thenResolve(mailGroupKey)
			when(nonCachingEntityClient.load(tutanotaTypeRefs.MailboxGroupRootTypeRef, mailGroupId)).thenResolve(mailboxGroupRoot)
			when(nonCachingEntityClient.setup(null, matchers.anything(), undefined, { ownerKey: mailGroupKey })).thenResolve(mailboxPropertiesId)
			when(
				nonCachingEntityClient.load(
					tutanotaTypeRefs.MailboxPropertiesTypeRef,
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

o.spec("TokenBucket", function () {
	let delay: (ms: number) => Promise<void>
	let dateProvider: DateProvider

	o.beforeEach(function () {
		delay = spy(() => Promise.resolve())
		dateProvider = object()
	})

	o("burst limited to maxTokens, then waits for next token", async function () {
		when(dateProvider.now()).thenReturn(0, 10, 20, 30)
		const bucket = new TokenBucket(2, 2, 200, delay, dateProvider)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)
		await bucket.nextToken()
		o.check(delay.callCount).equals(1)
		o.check(delay.args).deepEquals([180])
	})

	o("long delay before first request also limits burst to maxTokens, then waits", async function () {
		when(dateProvider.now()).thenReturn(1000, 1010, 1020, 1030)
		const bucket = new TokenBucket(2, 2, 200, delay, dateProvider)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)
		await bucket.nextToken()
		o.check(delay.callCount).equals(1)
		o.check(delay.args).deepEquals([180])
	})

	o("burst, then long pause allows another burst of at most maxTokens", async function () {
		when(dateProvider.now()).thenReturn(0, 10, 20)
		const bucket = new TokenBucket(2, 2, 200, delay, dateProvider)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)

		when(dateProvider.now()).thenReturn(1000, 1010)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)

		when(dateProvider.now()).thenReturn(1050)
		await bucket.nextToken()
		o.check(delay.callCount).equals(1)
		o.check(delay.args).deepEquals([150])
	})

	o("after exhausting the bucket and waiting, a second burst is allowed", async function () {
		when(dateProvider.now()).thenReturn(0, 10, 20, 30)
		const bucket = new TokenBucket(2, 2, 200, delay, dateProvider)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)
		await bucket.nextToken()
		o.check(delay.callCount).equals(1)
		o.check(delay.args).deepEquals([180])

		when(dateProvider.now()).thenReturn(1000, 1010)
		await bucket.nextToken()
		o.check(delay.callCount).equals(1)
		await bucket.nextToken()
		o.check(delay.callCount).equals(1)

		when(dateProvider.now()).thenReturn(1050)
		await bucket.nextToken()
		o.check(delay.callCount).equals(2)
		o.check(delay.args).deepEquals([150])
	})

	o("if another request for a token comes in while waiting, it replaces the old one", async function () {
		when(dateProvider.now()).thenReturn(0, 10, 20, 30, 40)
		const bucket = new TokenBucket(2, 2, 200, delay, dateProvider)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)
		const p1 = bucket.nextToken()
		o.check(delay.callCount).equals(1)
		o.check(delay.args).deepEquals([180])
		const p2 = bucket.nextToken()
		o.check(delay.callCount).equals(2)
		o.check(delay.args).deepEquals([170])

		const [res1, res2] = await Promise.all([p1, p2])
		o.check(res1).equals(false)
		o.check(res2).equals(true)
	})

	o("if another request for a token comes in simultaneously, only one gets served", async function () {
		when(dateProvider.now()).thenReturn(0, 10, 20, 30, 30)
		const bucket = new TokenBucket(2, 2, 200, delay, dateProvider)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)
		await bucket.nextToken()
		o.check(delay.callCount).equals(0)
		const p1 = bucket.nextToken()
		o.check(delay.callCount).equals(1)
		o.check(delay.args).deepEquals([180])
		const p2 = bucket.nextToken()
		o.check(delay.callCount).equals(2)
		o.check(delay.args).deepEquals([180])

		const [res1, res2] = await Promise.all([p1, p2])
		o.check(res1).equals(false)
		o.check(res2).equals(true)
	})
})
