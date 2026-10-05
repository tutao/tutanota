import { InstanceKeyProviderMaker } from "../../../../../src/platform-kit/base/base-crypto/InstanceKeyProviderMaker"
import { UserFacade } from "../../../../../src/platform-kit/base/facades/UserFacade"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { SymmetricGroupKeyLoader, TypeModelResolver } from "../../../../../src/platform-kit/instance-pipeline"
import { convertKeyVersionToCustomId, FormerKeyResolver } from "../../../../../src/platform-kit/base/base-crypto/FormerKeyResolver"
import { matchers, object, verify, when } from "testdouble"
import { GroupInfo, GroupInfoTypeRef, InstanceKey, InstanceKeysRefTypeRef, InstanceKeyTypeRef, Permission, PermissionTypeRef } from "@tutao/entities/sys"
import { createTestEntity } from "../../../TestUtils"
import { assertNotNull, KeyVersion } from "../../../../../src/platform-kit/utils"
import { AssociationType, ModelAssociation } from "../../../../../src/platform-kit/meta"
import { AesKey, cryptoUtils, CryptoWrapper, VersionedAes256Key } from "../../../../../src/platform-kit/crypto"
import o, { assertThrows } from "@tutao/otest"
import { PermissionType } from "../../../../../src/entities/sys/Utils"

o.spec("InstanceKeyProviderMakerTest", function () {
	let providerMaker: InstanceKeyProviderMaker
	let userFacade: UserFacade
	let entityClient: EntityClient
	let symGroupKeyLoader: SymmetricGroupKeyLoader
	let typeModelResolver: TypeModelResolver
	let formerKeyResolver: FormerKeyResolver
	let instance: GroupInfo
	let permissionForInstance: Permission
	let instanceKey: InstanceKey
	let cryptoWrapper: CryptoWrapper

	let permissionOwnerGroupKeyVersion: KeyVersion
	let currentInstanceKeyVersion: KeyVersion
	let formerInstanceKeyVersion: KeyVersion
	let currentInstanceKeyFromPermission: VersionedAes256Key
	let formerInstanceKeyDecrypted: VersionedAes256Key

	const modelAssociation: ModelAssociation = {
		cardinality: "ZeroOrOne",
		dependency: undefined,
		final: false,
		id: 0,
		refTypeId: 0,
		transferredAttributeId: null,
		type: AssociationType.Aggregation,
		name: "_formerInstanceKeys",
	}

	o.beforeEach(function () {
		userFacade = object()
		entityClient = object()
		symGroupKeyLoader = object()
		typeModelResolver = object()
		formerKeyResolver = object()
		cryptoWrapper = object()
		providerMaker = new InstanceKeyProviderMaker(userFacade, entityClient, symGroupKeyLoader, typeModelResolver, formerKeyResolver, cryptoWrapper)

		permissionOwnerGroupKeyVersion = 79
		currentInstanceKeyVersion = 1
		formerInstanceKeyVersion = (currentInstanceKeyVersion - 1) as KeyVersion
		currentInstanceKeyFromPermission = { object: object(), version: currentInstanceKeyVersion }
		formerInstanceKeyDecrypted = { object: object(), version: formerInstanceKeyVersion }

		instanceKey = createTestEntity(InstanceKeyTypeRef, {
			symEncInstanceKey: object(),
			symKeyVersion: currentInstanceKeyVersion.toString(),
			_id: ["formerKeysListId", convertKeyVersionToCustomId(formerInstanceKeyVersion)],
		})
		permissionForInstance = createTestEntity(PermissionTypeRef, {
			_id: ["permissionListId", "permissionInstanceId"],
			_ownerGroup: "permissionOwnerGroupId",
			symEncInstanceKey: object(),
			symKeyVersion: permissionOwnerGroupKeyVersion.toString(),
			instanceKeyVersion: currentInstanceKeyVersion.toString(),
			type: PermissionType.Symmetric,
		})
		instance = createTestEntity(GroupInfoTypeRef, {
			_permissions: permissionForInstance._id[0],
			_ownerGroup: "instanceOwnerGroupId",
			_formerInstanceKeys: createTestEntity(InstanceKeysRefTypeRef, { list: instanceKey._id[0] }),
		})

		when(userFacade.hasGroup(assertNotNull(instance._ownerGroup))).thenReturn(false)
		when(userFacade.hasGroup(assertNotNull(permissionForInstance._ownerGroup))).thenReturn(true)
		when(typeModelResolver.resolveClientTypeReference(instance._type)).thenResolve({
			associations: { 12341: modelAssociation },
		})
		when(entityClient.loadAll(PermissionTypeRef, instance._permissions)).thenResolve([permissionForInstance])
		const permissionOwnerGroupKey: AesKey = object()
		when(
			symGroupKeyLoader.loadSymGroupKey(
				assertNotNull(permissionForInstance._ownerGroup),
				cryptoUtils.parseKeyVersion(assertNotNull(permissionForInstance.symKeyVersion)),
			),
		).thenResolve(permissionOwnerGroupKey)
		when(cryptoWrapper.decryptAes256Key(permissionOwnerGroupKey, assertNotNull(permissionForInstance.symEncInstanceKey))).thenReturn(
			currentInstanceKeyFromPermission.object,
		)
		when(
			formerKeyResolver.findFormerInstanceKey(
				assertNotNull(instance._formerInstanceKeys?.list),
				currentInstanceKeyFromPermission,
				formerInstanceKeyVersion,
			),
		).thenResolve(formerInstanceKeyDecrypted)
	})

	o.spec("makeInstanceKeyProvider", function () {
		o.test("success - current instance key on permission", async function () {
			const instanceKeyProvider = await providerMaker.makeInstanceKeyProvider(instance)
			o.check(instanceKeyProvider).notEquals(null)
			const providedInstanceKey = await assertNotNull(instanceKeyProvider)(currentInstanceKeyVersion)
			o.check(providedInstanceKey).deepEquals(currentInstanceKeyFromPermission)

			verify(formerKeyResolver.findFormerInstanceKey(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})

		o.test("success - via former instance key", async function () {
			const instanceKeyProvider = await providerMaker.makeInstanceKeyProvider(instance)
			o.check(instanceKeyProvider).notEquals(null)
			const providedInstanceKey = await assertNotNull(instanceKeyProvider)(formerInstanceKeyVersion)
			o.check(providedInstanceKey).deepEquals(formerInstanceKeyDecrypted)

			verify(
				formerKeyResolver.findFormerInstanceKey(
					assertNotNull(instance._formerInstanceKeys?.list),
					currentInstanceKeyFromPermission,
					formerInstanceKeyVersion,
				),
				{ times: 1 },
			)
		})

		o.test("null - member of instance owner group", async function () {
			when(userFacade.hasGroup(assertNotNull(instance._ownerGroup))).thenReturn(true)
			const instanceKeyProvider = await providerMaker.makeInstanceKeyProvider(instance)
			o.check(instanceKeyProvider).equals(null)
		})

		o.test("null - not a sharable type", async function () {
			const anotherModelAssociation: ModelAssociation = {
				cardinality: "ZeroOrOne",
				dependency: undefined,
				final: false,
				id: 0,
				refTypeId: 0,
				transferredAttributeId: null,
				type: AssociationType.Aggregation,
				name: "_NOTformerInstanceKeys",
			}
			when(typeModelResolver.resolveClientTypeReference(instance._type)).thenResolve({
				associations: { 12341: anotherModelAssociation },
			})
			const instanceKeyProvider = await providerMaker.makeInstanceKeyProvider(instance)
			o.check(instanceKeyProvider).equals(null)
		})

		o.test("null - sharable instance but not actually shared", async function () {
			instance._formerInstanceKeys = null
			const instanceKeyProvider = await providerMaker.makeInstanceKeyProvider(instance)
			o.check(instanceKeyProvider).equals(null)
		})

		o.test("null - no suitable permission found", async function () {
			permissionForInstance.type = PermissionType.Public
			const instanceKeyProvider = await providerMaker.makeInstanceKeyProvider(instance)
			o.check(instanceKeyProvider).equals(null)
		})

		o.test("error - requesting instance with higher version than on permission", async function () {
			const instanceKeyProvider = await providerMaker.makeInstanceKeyProvider(instance)
			o.check(instanceKeyProvider).notEquals(null)
			await assertThrows(Error, async () => await assertNotNull(instanceKeyProvider)((currentInstanceKeyVersion + 1) as KeyVersion))
			verify(formerKeyResolver.findFormerInstanceKey(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})
	})
})
