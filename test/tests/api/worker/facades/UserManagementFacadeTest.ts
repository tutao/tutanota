import o from "ospec"
import {UserManagementFacade} from "../../../../../src/api/worker/facades/UserManagementFacade.js"
import {WorkerImpl} from "../../../../../src/api/worker/WorkerImpl.js"
import {UserFacade} from "../../../../../src/api/worker/facades/UserFacade.js"
import {GroupManagementFacade} from "../../../../../src/api/worker/facades/GroupManagementFacade.js"
import {CounterFacade} from "../../../../../src/api/worker/facades/CounterFacade.js"
import {RsaImplementation} from "../../../../../src/api/worker/crypto/RsaImplementation.js"
import {EntityClient} from "../../../../../src/api/common/EntityClient.js"
import {ServiceExecutor} from "../../../../../src/api/worker/rest/ServiceExecutor.js"
import {matchers, object, when} from "testdouble"
import {EntityRestClientMock} from "../rest/EntityRestClientMock.js"
import {
	createMailAddressProperties,
	createMailboxGroupRoot,
	createMailboxProperties,
	MailboxGroupRootTypeRef,
	MailboxPropertiesTypeRef
} from "../../../../../src/api/entities/tutanota/TypeRefs.js"
import {mapToObject} from "@tutao/tutanota-test-utils"

o.spec("UserManagementFacadeTest", function () {
	let worker: WorkerImpl
	let userFacade: UserFacade
	let groupManagementFacade: GroupManagementFacade
	let countersFacade: CounterFacade
	let rsa: RsaImplementation
	let entityClient: EntityClient
	let serviceExecutor: ServiceExecutor
	let nonCachingEntityClient: EntityClient

	let restClientMock = new EntityRestClientMock()

	let facade: UserManagementFacade

	o.beforeEach(function () {
		worker = object()
		userFacade = object()
		groupManagementFacade = object()
		countersFacade = object()
		rsa = object()
		entityClient = object()
		serviceExecutor = object()
		nonCachingEntityClient = object()

		facade = new UserManagementFacade(
			worker,
			userFacade,
			groupManagementFacade,
			countersFacade,
			rsa,
			entityClient,
			serviceExecutor,
			nonCachingEntityClient
		)
	})

	o.spec("getSenderNames", function () {
		o("when there is existing MailboxProperties it returns the names", async function () {
			const mailGroupId = "mailGroupId"
			const viaUser = "viaUser"
			const mailboxPropertiesId = "mailboxProeprtiesId"
			const mailboxGroupRoot = createMailboxGroupRoot({
				_ownerGroup: mailGroupId,
				mailboxProperties: mailboxPropertiesId,
			})
			const mailGroupKey = [1, 2, 3]
			const mailboxProperties = createMailboxProperties({
				mailAddressProperties: [
					createMailAddressProperties({
						mailAddress: "a@a.com",
						senderName: "a",
					}),
					createMailAddressProperties({
						mailAddress: "b@b.com",
						senderName: "b",
					})
				]
			})

			when(groupManagementFacade.getGroupKeyViaUser(mailGroupId, viaUser)).thenResolve(mailGroupKey)
			when(nonCachingEntityClient.load(MailboxGroupRootTypeRef, mailGroupId)).thenResolve(mailboxGroupRoot)
			when(nonCachingEntityClient.load(MailboxPropertiesTypeRef, mailboxPropertiesId, undefined, undefined, mailGroupKey)).thenResolve(mailboxProperties)

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
			const mailboxGroupRoot = createMailboxGroupRoot({
				_ownerGroup: mailGroupId,
				mailboxProperties: null,
			})
			const mailGroupKey = [1, 2, 3]
			const mailboxProperties = createMailboxProperties({
				_id: mailboxPropertiesId,
				reportMovedMails: "",
				mailAddressProperties: []
			})
			const expectedCreatedProperties = createMailboxProperties({
				_ownerGroup: mailGroupId,
				reportMovedMails: "",
				mailAddressProperties: [],
			})

			when(groupManagementFacade.getGroupKeyViaUser(mailGroupId, viaUser)).thenResolve(mailGroupKey)
			when(nonCachingEntityClient.load(MailboxGroupRootTypeRef, mailGroupId)).thenResolve(mailboxGroupRoot)
			when(nonCachingEntityClient.setup(null, matchers.anything(), undefined, {ownerKey: mailGroupKey})).thenResolve(mailboxPropertiesId)
			when(nonCachingEntityClient.load(MailboxPropertiesTypeRef, mailboxPropertiesId, undefined, undefined, mailGroupKey)).thenResolve(mailboxProperties)

			const result = await facade.getSenderNames(mailGroupId, viaUser)

			o(mapToObject(result)).deepEquals({})
		})
	})
})