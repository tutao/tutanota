import o from "@tutao/otest"
import { GroupManagementFacade } from "../../../../../src/base/facades/lazy/GroupManagementFacade.js"
import { UserFacade } from "../../../../../src/base/facades/UserFacade.js"
import { CounterFacade } from "../../../../../src/network/CounterFacade.js"
import { EntityClient } from "../../../../../src/network/EntityClient.js"
import { IServiceExecutor } from "../../../../../src/network/ServiceRequest.js"
import { PQFacade } from "../../../../../src/base/crypto/PQFacade.js"
import { KeyLoaderFacade } from "../../../../../src/base/crypto/KeyLoaderFacade.js"
import { CacheManagementFacade } from "../../../../../src/common/api/worker/facades/lazy/CacheManagementFacade.js"
import { matchers, object, verify, when } from "testdouble"

import { AdminKeyLoaderFacade } from "../../../../../src/base/crypto/AdminKeyLoaderFacade"
import { IdentityKeyCreator } from "../../../../../src/base/crypto/IdentityKeyCreator"
import { freshVersioned } from "@tutao/utils"
import { AesKey, CryptoWrapper, KeyPairType, PQKeyPairs } from "@tutao/crypto"

import { CustomerTypeRef, GroupInfo, GroupInfoTypeRef, GroupType } from "@tutao/entities/sys"
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
