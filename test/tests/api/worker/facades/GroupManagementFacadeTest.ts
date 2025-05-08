import o from "../../../../../packages/otest/dist/otest.js"
import { GroupManagementFacade } from "../../../../../src/common/api/worker/facades/lazy/GroupManagementFacade.js"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { CounterFacade } from "../../../../../src/common/api/worker/facades/lazy/CounterFacade.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest.js"
import { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade.js"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { CacheManagementFacade } from "../../../../../src/common/api/worker/facades/lazy/CacheManagementFacade.js"
import { matchers, object, verify, when } from "testdouble"
import { CustomerTypeRef, GroupInfo, GroupInfoTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { CryptoWrapper } from "../../../../../src/common/api/worker/crypto/CryptoWrapper.js"
import { AdminKeyLoaderFacade } from "../../../../../src/common/api/worker/facades/AdminKeyLoaderFacade"
import { IdentityKeyCreator } from "../../../../../src/common/api/worker/facades/lazy/IdentityKeyCreator"
import { freshVersioned } from "@tutao/tutanota-utils"
import { GroupType } from "../../../../../src/common/api/common/TutanotaConstants"
import { AesKey, KeyPairType, PQKeyPairs } from "@tutao/tutanota-crypto"

const { anything } = matchers

o.spec("GroupManagementFacadeTest", function () {
	let userFacade: UserFacade
	let counters: CounterFacade
	let entityClient: EntityClient
	let serviceExecutor: IServiceExecutor
	let pqFacade: PQFacade
	let keyLoaderFacade: KeyLoaderFacade
	let cacheManagementFacade: CacheManagementFacade
	let cryptoWrapper: CryptoWrapper
	let identityKeyCreator: IdentityKeyCreator
	let adminKeyLoaderFacade: AdminKeyLoaderFacade

	let groupManagementFacade: GroupManagementFacade

	const adminGroupId = "adminGroupId"

	o.beforeEach(function () {
		userFacade = object()
		counters = object()
		entityClient = object()
		serviceExecutor = object()
		pqFacade = object()
		keyLoaderFacade = object()
		cacheManagementFacade = object()
		cryptoWrapper = object()
		identityKeyCreator = object()
		adminKeyLoaderFacade = object()

		groupManagementFacade = new GroupManagementFacade(
			userFacade,
			counters,
			entityClient,
			serviceExecutor,
			pqFacade,
			keyLoaderFacade,
			adminKeyLoaderFacade,
			cacheManagementFacade,
			cryptoWrapper,
			identityKeyCreator,
		)
	})

	o("success admin creates shared mailbox", async function () {
		when(userFacade.getGroupIds(GroupType.Admin)).thenReturn([adminGroupId])
		const adminGroupKey = freshVersioned(object<AesKey>())
		when(keyLoaderFacade.getCurrentSymGroupKey(adminGroupId)).thenResolve(adminGroupKey)

		const newMailGroupKeyPair: PQKeyPairs = {
			x25519KeyPair: object(),
			kyberKeyPair: object(),
			keyPairType: KeyPairType.TUTA_CRYPT,
		}
		when(pqFacade.generateKeyPairs()).thenResolve(newMailGroupKeyPair)
		when(cryptoWrapper.encryptKeyWithVersionedKey(anything(), anything())).thenReturn(object())
		let mailGroupId = "sharedMailGroupId"
		when(serviceExecutor.post(anything(), anything())).thenResolve({ mailGroup: mailGroupId })

		await groupManagementFacade.createSharedMailGroup("some group", "example@tuta.com")

		verify(
			identityKeyCreator.createIdentityKeyPair(
				mailGroupId,
				{
					object: newMailGroupKeyPair,
					version: 0,
				},
				[],
				adminGroupKey,
			),
		)
	})

	o("loadTeamGroupIds - success", async function () {
		when(userFacade.getUser()).thenReturn(object())
		when(entityClient.load(CustomerTypeRef, anything())).thenResolve(object())
		const teamGroupIds = ["teamGroup1", "teamGroup2"]
		when(entityClient.loadAll(GroupInfoTypeRef, anything())).thenResolve(teamGroupIds.map((group) => ({ group })) as GroupInfo[])

		const result = await groupManagementFacade.loadTeamGroupIds()

		o(result).deepEquals(teamGroupIds)
	})
})
