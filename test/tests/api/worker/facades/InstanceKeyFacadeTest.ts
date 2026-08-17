import o from "@tutao/otest"
import { KeyLoaderFacade } from "../../../../../src/platform-kit/base/base-crypto/KeyLoaderFacade.js"
import { matchers, object, verify, when } from "testdouble"
import { CryptoNetworkHelper } from "../../../../../src/platform-kit/network/CryptoNetworkHelper"
import { InstanceKeyFacade } from "../../../../../src/platform-kit/base/base-crypto/InstanceKeyFacade"
import { GroupInfoTypeRef, UpdateKdfNoncePostOutTypeRef } from "@tutao/entities/sys"
import { createTestEntity } from "../../../TestUtils"
import { PersistentEntity } from "../../../../../src/platform-kit/meta"
import { generateKdfNonce, KdfNonce, VersionedAes256Key, VersionedKey } from "../../../../../src/platform-kit/crypto"
import { TypeModelResolver } from "../../../../../src/platform-kit/instance-pipeline"

const { anything, argThat, captor } = matchers

o.spec("InstanceKeyFacadeTest", function () {
	let keyLoaderFacade: KeyLoaderFacade
	let cryptoNetworkHelper: CryptoNetworkHelper
	let typeModelResolver: TypeModelResolver

	let instanceKeyFacade: InstanceKeyFacade

	let instanceGroupId: Id
	let instance: PersistentEntity
	let currentInstanceGroupKey: VersionedKey
	let derivedInstanceKey: VersionedAes256Key

	o.beforeEach(function () {
		keyLoaderFacade = object()
		cryptoNetworkHelper = object()
		typeModelResolver = object()

		instanceKeyFacade = new InstanceKeyFacade(keyLoaderFacade, cryptoNetworkHelper, typeModelResolver)

		instanceGroupId = "instanceGroupId"
		instance = createTestEntity(GroupInfoTypeRef, { _kdfNonce: generateKdfNonce(), _ownerGroup: instanceGroupId })
		currentInstanceGroupKey = object()
		derivedInstanceKey = object()
		when(keyLoaderFacade.getCurrentSymGroupKey(instanceGroupId)).thenResolve(currentInstanceGroupKey)
	})

	o.spec("getCurrentInstanceKey", function () {
		let deriveInstanceKeyMethod: (groupKey: VersionedKey, kdfNonce: KdfNonce) => VersionedAes256Key
		o.beforeEach(function () {
			deriveInstanceKeyMethod = instanceKeyFacade.deriveInstanceKey
			instanceKeyFacade.deriveInstanceKey = () => derivedInstanceKey
		})

		o.afterEach(function () {
			instanceKeyFacade.deriveInstanceKey = deriveInstanceKeyMethod
		})

		o.test("success", async function () {
			const instanceKey = await instanceKeyFacade.getCurrentInstanceKey(instance)
			o.check(instanceKey).deepEquals(derivedInstanceKey)
		})

		o.test("success - kdfNonce must be created", async function () {
			instance._kdfNonce = null
			when(cryptoNetworkHelper.postUpdateKdfNonceService(anything())).thenResolve(
				createTestEntity(UpdateKdfNoncePostOutTypeRef, { kdfNonce: generateKdfNonce() }),
			)
			const instanceKey = await instanceKeyFacade.getCurrentInstanceKey(instance)
			o.check(instanceKey).deepEquals(derivedInstanceKey)
			verify(cryptoNetworkHelper.postUpdateKdfNonceService(anything()), { times: 1 })
		})
	})
})
