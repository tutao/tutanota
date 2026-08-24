import o, { assertThrows } from "@tutao/otest"
import { KeyLoaderFacade } from "../../../../../src/platform-kit/base/base-crypto/KeyLoaderFacade.js"
import { matchers, object, verify, when } from "testdouble"
import { InstanceKeyFacade } from "../../../../../src/platform-kit/base/base-crypto/InstanceKeyFacade"
import {
	AccountingInfoTypeRef,
	createFormerInstanceKeyData,
	FormerInstanceKeyData,
	Group,
	GroupInfoTypeRef,
	GroupTypeRef,
	InstanceKeyInstanceData,
	Permission,
	PermissionTypeRef,
	PubEncKeyData,
	UpdateKdfNoncePostOutTypeRef,
} from "@tutao/entities/sys"
import { createTestEntity } from "../../../TestUtils"
import { idToElementId, PersistentEntity, stringifyId } from "../../../../../src/platform-kit/meta"
import {
	Aes256Key,
	AesKey,
	CryptoWrapper,
	generateKdfNonce,
	KdfNonce,
	PublicKeyIdentifierType,
	VersionedAes256Key,
	VersionedEncryptedKey,
	VersionedKey,
} from "../../../../../src/platform-kit/crypto"
import { TypeModelResolver } from "../../../../../src/platform-kit/instance-pipeline"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { CryptoFacade, RecipientKeyData } from "../../../../../src/platform-kit/base/base-crypto/CryptoFacade"
import { UserFacade } from "../../../../../src/platform-kit/base/facades/UserFacade"
import { ProgrammingError } from "../../../../../src/platform-kit/app-env"
import { assertNotNull, KeyVersion, Nullable } from "../../../../../src/platform-kit/utils"
import { GroupType } from "../../../../../src/entities/sys/Utils"
import { AdminKeyLoaderFacade } from "../../../../../src/platform-kit/base/base-crypto/AdminKeyLoaderFacade"
import { IServiceExecutor } from "../../../../../src/platform-kit/network/ServiceRequest"

const { anything, argThat, captor } = matchers

o.spec("InstanceKeyFacadeTest", function () {
	let adminKeyLoaderFacade: AdminKeyLoaderFacade
	let keyLoaderFacade: KeyLoaderFacade
	let cryptoFacade: CryptoFacade
	let typeModelResolver: TypeModelResolver
	let entityClient: EntityClient
	let cryptoWrapper: CryptoWrapper
	let serviceExecutor: IServiceExecutor

	let instanceKeyFacade: InstanceKeyFacade

	let instanceGroupId: Id
	let instanceGroup: Group
	let instance: PersistentEntity
	let currentInstanceGroupKey: VersionedKey
	let derivedInstanceKey: VersionedAes256Key
	let olderVersionDerivedInstanceKey: Aes256Key
	let instancePermissionsId: Id

	let deriveInstanceKeyMethod: (groupKey: VersionedKey, kdfNonce: KdfNonce) => VersionedAes256Key

	o.beforeEach(function () {
		keyLoaderFacade = object()
		cryptoFacade = object()
		typeModelResolver = object()
		entityClient = object()
		cryptoWrapper = object()
		serviceExecutor = object()
		adminKeyLoaderFacade = object()
		instanceKeyFacade = new InstanceKeyFacade(
			adminKeyLoaderFacade,
			keyLoaderFacade,
			cryptoFacade,
			typeModelResolver,
			entityClient,
			cryptoWrapper,
			serviceExecutor,
		)
		instanceGroupId = "instanceGroupId"
		instancePermissionsId = "instancePermissionsId"
		currentInstanceGroupKey = { object: object(), version: 0 }
		instance = createTestEntity(GroupInfoTypeRef, { _kdfNonce: generateKdfNonce(), _ownerGroup: instanceGroupId, _permissions: instancePermissionsId })
		derivedInstanceKey = { object: object(), version: 0 }
		olderVersionDerivedInstanceKey = object()
		when(adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(instanceGroupId)).thenResolve(currentInstanceGroupKey)

		deriveInstanceKeyMethod = instanceKeyFacade.deriveInstanceKey
		instanceKeyFacade.deriveInstanceKey = (groupKey: VersionedKey, kdfNonce: KdfNonce) => {
			if (groupKey.version === currentInstanceGroupKey.version) {
				return derivedInstanceKey
			} else {
				return { version: groupKey.version, object: olderVersionDerivedInstanceKey }
			}
		}
	})
	o.afterEach(function () {
		instanceKeyFacade.deriveInstanceKey = deriveInstanceKeyMethod
	})

	o.spec("getCurrentInstanceKey", function () {
		o.test("success", async function () {
			const instanceKey = await instanceKeyFacade.getCurrentInstanceKey(instance)
			o.check(instanceKey).deepEquals(derivedInstanceKey)
			verify(adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(assertNotNull(instance._ownerGroup)))
		})

		o.test("success - kdfNonce must be created", async function () {
			instance._kdfNonce = null
			when(cryptoFacade.postUpdateKdfNonceService(anything())).thenResolve(
				createTestEntity(UpdateKdfNoncePostOutTypeRef, { kdfNonce: generateKdfNonce() }),
			)
			const instanceKey = await instanceKeyFacade.getCurrentInstanceKey(instance)
			o.check(instanceKey).deepEquals(derivedInstanceKey)
			verify(cryptoFacade.postUpdateKdfNonceService(anything()), { times: 1 })
		})
	})

	o.spec("getInstanceKey with version", function () {
		o.test("success", async function () {
			currentInstanceGroupKey.version = 1
			const version = 0
			const instanceKey = await instanceKeyFacade.getInstanceKey(instance, version)
			o.check(instanceKey).deepEquals({ version, object: olderVersionDerivedInstanceKey })
			verify(adminKeyLoaderFacade.getGroupKeyViaAdminEncGKey(assertNotNull(instance._ownerGroup), version))
		})
	})

	o.spec("prepareInstanceKeysForSharedInstance", function () {
		let instancePermissions: Permission[]
		let sessionKey: AesKey

		o.beforeEach(function () {
			instancePermissions = []
			instanceGroup = createTestEntity(GroupTypeRef, { groupKeyVersion: currentInstanceGroupKey.version.toString() })
			when(entityClient.load(GroupTypeRef, idToElementId(instanceGroupId))).thenResolve(instanceGroup)
			when(entityClient.loadAll(PermissionTypeRef, assertNotNull(instance._permissions))).thenResolve(instancePermissions)
			sessionKey = object()
			when(cryptoFacade.resolveSessionKey(instance)).thenResolve(sessionKey)
		})

		o.test("fails if owner group is missing", async function () {
			instance._ownerGroup = null
			const e = await assertThrows(ProgrammingError, async () => await instanceKeyFacade.prepareInstanceKeysForSharedInstance(instance))
			o.check(e.message).equals("owner group missing for instance.")
		})

		o.test("fails if permission is missing", async function () {
			instance._permissions = null
			const e = await assertThrows(ProgrammingError, async () => await instanceKeyFacade.prepareInstanceKeysForSharedInstance(instance))
			o.check(e.message).equals("permissions missing for instance.")
		})

		o.spec("symmetric group key", function () {
			o.spec("share internal", function () {
				o.test("success", async function () {
					let permissionOwnerGroup = createTestEntity(GroupTypeRef)
					const { currentPermissionOwnerGroupKey, symEncSessionKey, symEncInstanceKey } = prepareMocks(permissionOwnerGroup, derivedInstanceKey)
					when(adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(stringifyId(permissionOwnerGroup._id))).thenResolve(
						currentPermissionOwnerGroupKey,
					)

					const instanceKeyInstanceData = await instanceKeyFacade.prepareInstanceKeysForSharedInstance(instance)
					checkInstanceKeyData(
						instanceKeyInstanceData,
						symEncSessionKey,
						symEncInstanceKey.key,
						symEncInstanceKey.encryptingKeyVersion,
						derivedInstanceKey.version,
					)
				})

				o.test("success former instance keys", async function () {
					const formerInstanceGroupKey: AesKey = object()
					const instanceGroupKey: VersionedKey = { object: object(), version: 1 }
					instanceGroup.groupKeyVersion = instanceGroupKey.version.toString()
					const formerInstanceKey: VersionedAes256Key = { object: object(), version: 0 }
					const instanceKey: VersionedAes256Key = { object: object(), version: instanceGroupKey.version }
					const successorEncInstanceKey: VersionedEncryptedKey = { key: object(), encryptingKeyVersion: instanceKey.version }
					when(cryptoWrapper.encryptKeyWithVersionedKey(instanceKey, anything())).thenReturn(successorEncInstanceKey)
					when(adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(instanceGroupId)).thenResolve(instanceGroupKey)
					when(adminKeyLoaderFacade.getGroupKeyViaAdminEncGKey(assertNotNull(instance._ownerGroup), 0)).thenResolve(formerInstanceGroupKey)
					deriveInstanceKeyMethod = instanceKeyFacade.deriveInstanceKey
					instanceKeyFacade.deriveInstanceKey = (groupKey: VersionedKey) => {
						if (groupKey.version === 1) {
							return instanceKey
						} else {
							return formerInstanceKey
						}
					}
					let permissionOwnerGroup = createTestEntity(GroupTypeRef)
					const { currentPermissionOwnerGroupKey, symEncSessionKey, symEncInstanceKey } = prepareMocks(permissionOwnerGroup, instanceKey)
					when(adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(stringifyId(permissionOwnerGroup._id))).thenResolve(
						currentPermissionOwnerGroupKey,
					)

					const instanceKeyInstanceData = await instanceKeyFacade.prepareInstanceKeysForSharedInstance(instance)

					const expectedFormerInstanceKeys = [
						createFormerInstanceKeyData({
							instanceKeyVersion: String(formerInstanceKey.version),
							symEncInstanceKey: successorEncInstanceKey.key,
							symKeyVersion: String(successorEncInstanceKey.encryptingKeyVersion),
						}),
					]
					checkInstanceKeyData(
						instanceKeyInstanceData,
						symEncSessionKey,
						symEncInstanceKey.key,
						symEncInstanceKey.encryptingKeyVersion,
						instanceKey.version,
						expectedFormerInstanceKeys,
					)

					instanceKeyFacade.deriveInstanceKey = deriveInstanceKeyMethod
				})
			})

			o.spec("share external", function () {
				o.test("success external user group", async function () {
					let externalUserGroup = createTestEntity(GroupTypeRef)
					externalUserGroup.external = true
					externalUserGroup.type = GroupType.User
					when(adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(stringifyId(externalUserGroup._id))).thenReject(new Error("ERROR"))
					const { currentPermissionOwnerGroupKey, symEncSessionKey, symEncInstanceKey } = prepareMocks(externalUserGroup, derivedInstanceKey)
					when(keyLoaderFacade.getCurrentExternalUserGroupKey(stringifyId(externalUserGroup._id))).thenResolve(currentPermissionOwnerGroupKey)

					const instanceKeyInstanceData = await instanceKeyFacade.prepareInstanceKeysForSharedInstance(instance)
					checkInstanceKeyData(
						instanceKeyInstanceData,
						symEncSessionKey,
						symEncInstanceKey.key,
						symEncInstanceKey.encryptingKeyVersion,
						derivedInstanceKey.version,
					)
				})

				o.test("success external mail group", async function () {
					let externalMailGroup = createTestEntity(GroupTypeRef)
					externalMailGroup.external = true
					externalMailGroup.type = GroupType.Mail
					const adminId = "adminId"
					externalMailGroup.admin = adminId

					when(adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(stringifyId(externalMailGroup._id))).thenReject(new Error("ERROR"))
					const { currentPermissionOwnerGroupKey, symEncSessionKey, symEncInstanceKey } = prepareMocks(externalMailGroup, derivedInstanceKey)
					when(keyLoaderFacade.getCurrentExternalGroupKeys(stringifyId(externalMailGroup._id), adminId)).thenResolve({
						currentExternalUserGroupKey: object(),
						currentExternalMailGroupKey: currentPermissionOwnerGroupKey,
					})

					const instanceKeyInstanceData = await instanceKeyFacade.prepareInstanceKeysForSharedInstance(instance)
					checkInstanceKeyData(
						instanceKeyInstanceData,
						symEncSessionKey,
						symEncInstanceKey.key,
						symEncInstanceKey.encryptingKeyVersion,
						derivedInstanceKey.version,
					)
				})
			})

			function prepareMocks(permissionOwnerGroup: Group, instanceKey: VersionedAes256Key) {
				const permission = createTestEntity(PermissionTypeRef, { _id: [instancePermissionsId, stringifyId(permissionOwnerGroup._id)] })
				instancePermissions.push(permission)

				const currentPermissionOwnerGroupKey: VersionedKey = { object: object(), version: 3 }
				const symEncSessionKey: Uint8Array<ArrayBuffer> = object()
				const symEncInstanceKey: VersionedEncryptedKey = {
					key: object(),
					encryptingKeyVersion: currentPermissionOwnerGroupKey.version,
				}
				when(entityClient.load(GroupTypeRef, permissionOwnerGroup._id)).thenResolve(permissionOwnerGroup)
				when(cryptoWrapper.encryptKeyWithVersionedKey(currentPermissionOwnerGroupKey, instanceKey.object)).thenReturn(symEncInstanceKey)
				when(cryptoWrapper.encryptKey(currentPermissionOwnerGroupKey.object, sessionKey)).thenReturn(symEncSessionKey)
				return { currentPermissionOwnerGroupKey, symEncSessionKey, symEncInstanceKey }
			}
		})

		o.spec("asymmetricEncryption", function () {
			let permissionOwnerGroup: Group
			const bucketEncInstanceKey: Uint8Array<ArrayBuffer> = object()
			const pubEncRecipientKeyData: PubEncKeyData = object()

			o.beforeEach(function () {
				instance = createTestEntity(AccountingInfoTypeRef, {
					_kdfNonce: generateKdfNonce(),
					_ownerGroup: instanceGroupId,
					_permissions: instancePermissionsId,
				})
				const permissionOwnerGroupId = "permissionOwnerGroupId"
				permissionOwnerGroup = createTestEntity(GroupTypeRef, { _id: idToElementId(permissionOwnerGroupId) })
				const permission = createTestEntity(PermissionTypeRef, {
					_id: [instancePermissionsId, permissionOwnerGroupId],
					_ownerGroup: permissionOwnerGroupId,
				})
				instancePermissions.push(permission)

				when(adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(permissionOwnerGroupId)).thenReject(new Error("should not be called"))
				when(cryptoWrapper.encryptKey(anything(), derivedInstanceKey.object)).thenReturn(bucketEncInstanceKey)
				when(
					cryptoFacade.encryptBucketKeyForInternalRecipient(
						assertNotNull(instance._ownerGroup),
						anything(),
						{ identifier: permissionOwnerGroupId, identifierType: PublicKeyIdentifierType.GROUP_ID },
						[],
						[],
					),
				).thenResolve(new RecipientKeyData(pubEncRecipientKeyData, null))
			})

			o.test("accountingInfo success", async function () {
				const instanceKeyInstanceData = await instanceKeyFacade.prepareInstanceKeysForSharedInstance(instance)
				checkInstanceKeyData(instanceKeyInstanceData, null, bucketEncInstanceKey, null, derivedInstanceKey.version, [], pubEncRecipientKeyData)
				verify(entityClient.load(GroupTypeRef, permissionOwnerGroup._id), { times: 0 })
			})
		})

		function checkInstanceKeyData(
			instanceKeyInstanceData: InstanceKeyInstanceData,
			expectedSymEncSessionKey: Nullable<Uint8Array<ArrayBuffer>>,
			expectedSymEncInstanceKey: Uint8Array<ArrayBuffer>,
			expectedSymKeyVersion: Nullable<KeyVersion>,
			expectedInstanceKeyVersion: KeyVersion,
			expectedFormerInstanceKeys: FormerInstanceKeyData[] = [],
			expectedPubEncKeyData: Nullable<PubEncKeyData> = null,
		) {
			o.check(instanceKeyInstanceData.sharedInstanceElementId).equals(instance._id[1])
			o.check(instanceKeyInstanceData.sharedInstanceListId).equals(instance._id[0])
			o.check(instanceKeyInstanceData.formerInstanceKeys.length).equals(expectedFormerInstanceKeys.length)
			o.check(instanceKeyInstanceData.formerInstanceKeys).deepEquals(expectedFormerInstanceKeys)
			o.check(instanceKeyInstanceData.typeInfo.application).equals(instance._type.app)
			o.check(instanceKeyInstanceData.typeInfo.typeId).equals(instance._type.typeId.toString())
			const permissionDataList = instanceKeyInstanceData.permissionData
			o.check(permissionDataList.length).equals(1)
			const permissionData = permissionDataList[0]
			o.check(permissionData.symEncSessionKey).deepEquals(expectedSymEncSessionKey)
			o.check(permissionData.symEncInstanceKey).deepEquals(expectedSymEncInstanceKey)
			o.check(permissionData.symKeyVersion).equals(expectedSymKeyVersion != null ? expectedSymKeyVersion.toString() : null)
			o.check(permissionData.instanceKeyVersion).equals(expectedInstanceKeyVersion.toString())
			o.check(permissionData.pubEncKeyData).deepEquals(expectedPubEncKeyData)
		}
	})
})
