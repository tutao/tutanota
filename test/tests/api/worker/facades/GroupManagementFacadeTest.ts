import o from "../../../../../packages/otest/dist/otest.js"
import { GroupManagementFacade } from "../../../../../src/common/api/worker/facades/lazy/GroupManagementFacade.js"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { CounterFacade } from "../../../../../src/common/api/worker/facades/lazy/CounterFacade.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest.js"
import { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade.js"
import { checkKeyVersionConstraints, KeyLoaderFacade, parseKeyVersion } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { CacheManagementFacade } from "../../../../../src/common/api/worker/facades/lazy/CacheManagementFacade.js"
import { AsymmetricCryptoFacade } from "../../../../../src/common/api/worker/crypto/AsymmetricCryptoFacade.js"
import { func, matchers, object, verify, when } from "testdouble"
import { AesKey, Ed25519KeyPair, MacTag, PQKeyPairs, X25519PublicKey } from "@tutao/tutanota-crypto"
import { createTestEntity } from "../../../TestUtils.js"
import {
	CustomerTypeRef,
	Group,
	GroupInfo,
	GroupInfoTypeRef,
	GroupKey,
	GroupKeysRefTypeRef,
	GroupKeyTypeRef,
	GroupMembershipTypeRef,
	GroupTypeRef,
	IdentityKeyPostIn,
	KeyMac,
	KeyMacTypeRef,
	PubEncKeyDataTypeRef,
	User,
	UserTypeRef,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { CryptoWrapper, VersionedEncryptedKey, VersionedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper.js"
import { assertThrows, spy } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError.js"
import { CryptoProtocolVersion, GroupType, PublicKeyIdentifierType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { brandKeyMac, KeyAuthenticationFacade, UserGroupKeyAuthenticationParams } from "../../../../../src/common/api/worker/facades/KeyAuthenticationFacade.js"
import { TutanotaError } from "@tutao/tutanota-error"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { Ed25519Facade } from "../../../../../src/common/api/worker/facades/Ed25519Facade"
import { IdentityKeyService } from "../../../../../src/common/api/entities/sys/Services"
import { freshVersioned, noOp } from "@tutao/tutanota-utils"

const { anything, argThat, captor } = matchers

o.spec("GroupManagementFacadeTest", function () {
	let userFacade: UserFacade
	let counters: CounterFacade
	let entityClient: EntityClient
	let serviceExecutor: IServiceExecutor
	let pqFacade: PQFacade
	let keyLoaderFacade: KeyLoaderFacade
	let cacheManagementFacade: CacheManagementFacade
	let asymmetricCryptoFacade: AsymmetricCryptoFacade
	let cryptoWrapper: CryptoWrapper
	let keyAuthenticationFacade: KeyAuthenticationFacade
	let ed25519Facade: Ed25519Facade

	let groupManagementFacade: GroupManagementFacade

	const adminGroupId = "adminGroupId"
	const groupId = "myGroupId"
	let group: Group

	o.beforeEach(function () {
		userFacade = object()
		counters = object()
		entityClient = object()
		serviceExecutor = object()
		pqFacade = object()
		keyLoaderFacade = object()
		cacheManagementFacade = object()
		asymmetricCryptoFacade = object()
		cryptoWrapper = object()
		keyAuthenticationFacade = object()
		ed25519Facade = object()

		groupManagementFacade = new GroupManagementFacade(
			userFacade,
			counters,
			entityClient,
			serviceExecutor,
			pqFacade,
			keyLoaderFacade,
			cacheManagementFacade,
			asymmetricCryptoFacade,
			cryptoWrapper,
			keyAuthenticationFacade,
			ed25519Facade,
		)
	})

	o.spec("getCurrentGroupKeyViaAdminEncGKey", function () {
		const adminGroupKeyVersion = 2
		const previousAdminGroupKeyVersion = 1
		const adminGroupKeyBytes = object<AesKey>()
		const adminGroupKeyPair = object<PQKeyPairs>()

		const groupKeyVersion = 2

		const pubUserGroupEccKey = object<X25519PublicKey>()
		const groupKeyBytes = object<AesKey>()
		const adminGroupEncGKey = object<Uint8Array>()
		const pubAdminGroupEncSymKey = object<Uint8Array>()
		const pubAdminGroupEncGKey = createTestEntity(PubEncKeyDataTypeRef, {
			pubEncSymKey: pubAdminGroupEncSymKey,
			protocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
			recipientIdentifier: adminGroupId,
			recipientIdentifierType: PublicKeyIdentifierType.GROUP_ID,
			recipientKeyVersion: adminGroupKeyVersion.toString(),
			senderKeyVersion: groupKeyVersion.toString(),
			symKeyMac: createTestEntity(KeyMacTypeRef, {
				taggedKeyVersion: "2",
				tag: object<Uint8Array>(),
				taggingKeyVersion: "1",
			}),
		})

		o.beforeEach(function () {
			group = createTestEntity(GroupTypeRef, {
				_id: groupId,
				groupKeyVersion: groupKeyVersion.toString(),
				adminGroupKeyVersion: adminGroupKeyVersion.toString(),
				adminGroupEncGKey: null,
				pubAdminGroupEncGKey: null,
				admin: adminGroupId,
				type: GroupType.User,
			})
			when(userFacade.hasGroup(groupId)).thenReturn(false)
			when(userFacade.hasGroup(adminGroupId)).thenReturn(true)
			when(cacheManagementFacade.reloadGroup(groupId)).thenResolve(group)
			when(keyLoaderFacade.loadSymGroupKey(adminGroupId, adminGroupKeyVersion)).thenResolve(adminGroupKeyBytes)
			when(cryptoWrapper.decryptKey(adminGroupKeyBytes, adminGroupEncGKey)).thenReturn(groupKeyBytes)
			when(keyLoaderFacade.loadKeypair(adminGroupId, adminGroupKeyVersion)).thenResolve(adminGroupKeyPair)
			when(
				asymmetricCryptoFacade.decryptSymKeyWithKeyPairAndAuthenticate(adminGroupKeyPair, pubAdminGroupEncGKey, {
					identifier: groupId,
					identifierType: PublicKeyIdentifierType.GROUP_ID,
				}),
			).thenResolve({
				decryptedAesKey: groupKeyBytes,
				senderIdentityPubKey: pubUserGroupEccKey,
			})
		})

		o("gets a non-cached group instance", async function () {
			group.adminGroupEncGKey = adminGroupEncGKey

			await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)

			verify(cacheManagementFacade.reloadGroup(groupId))
		})

		o("symmetric decryption", async function () {
			group.adminGroupEncGKey = adminGroupEncGKey

			const groupKey = await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)

			o(groupKey.version).equals(groupKeyVersion)
			o(groupKey.object).deepEquals(groupKeyBytes)
			verify(keyLoaderFacade.loadSymGroupKey(adminGroupId, adminGroupKeyVersion))
			verify(asymmetricCryptoFacade.decryptSymKeyWithKeyPairAndAuthenticate(anything(), anything(), anything()), { times: 0 })
		})

		o.spec("asymmetric decryption", function () {
			const formerGroupKeyListId = "formerGroupKeysList"

			o("user group key - successful - former group key is symmetrically encrypted for the admin", async function () {
				/*
                    Scenario:
                    Current group key version is 2, and it is asymmetrically encrypted for the admin with admin group key version 2.
                    Group key version 1 is symmetrically encrypted for the admin with admin group key version 1.
                 */

				group.pubAdminGroupEncGKey = pubAdminGroupEncGKey

				const taggingKeyVersion = "1"
				group.formerGroupKeys = createTestEntity(GroupKeysRefTypeRef, { list: formerGroupKeyListId })

				const formerGroupKeysV1 = createTestEntity(GroupKeyTypeRef, {
					adminGroupEncGKey: object<Uint8Array>(),
					adminGroupKeyVersion: "1",
				})
				const formerGroupSymKeyV1 = object<AesKey>()
				when(cryptoWrapper.decryptKey(anything(), formerGroupKeysV1.adminGroupEncGKey!)).thenReturn(formerGroupSymKeyV1)

				when(keyLoaderFacade.loadFormerGroupKeyInstance(group, parseKeyVersion(taggingKeyVersion))).thenResolve(formerGroupKeysV1)

				const groupKey = await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)

				o(groupKey.object).equals(groupKeyBytes)
				o(groupKey.version).equals(groupKeyVersion)

				const formerUserGroupKey: VersionedKey = {
					object: formerGroupSymKeyV1,
					version: checkKeyVersionConstraints(groupKeyVersion - 1),
				}
				// noinspection JSVoidFunctionReturnValueUsed
				verify(
					keyAuthenticationFacade.verifyTag(
						{
							tagType: "USER_GROUP_KEY_TAG",
							sourceOfTrust: { currentUserGroupKey: formerUserGroupKey.object },
							untrustedKey: { newUserGroupKey: groupKeyBytes },
							bindingData: {
								adminGroupId,
								userGroupId: groupId,
								currentUserGroupKeyVersion: formerUserGroupKey.version,
								newAdminGroupKeyVersion: adminGroupKeyVersion,
								newUserGroupKeyVersion: groupKeyVersion,
							},
						},
						brandKeyMac(pubAdminGroupEncGKey.symKeyMac!).tag,
					),
				)
			})

			o.spec("former group key is asymmetrically encrypted for the admin", function () {
				/*
                    The setup for this case should be as follows:
                    The admin wants to use userGroupKeyV2.
                    The userGroupKeyV2 is asymmetrically encrypted for the admin with adminGroupPubKeyV2, therefore it must be authenticated after decryption.
                    It is authenticated using userGroupKeyV1.
                    The userGroupKeyV1 itself is asymmetrically encrypted for the admin with adminGroupPubKeyV1, therefore it must be authenticated after decryption too.
                    It is authenticated using userGroupKeyV0.
                    The userGroupKeyV0 is symmetrically encrypted for/by the admin with adminGroupSymKeyV0, therefore it is already trusted.
                 */
				let userGroupSymKeyV0: AesKey
				let groupKeysV0: GroupKey
				let groupKeysV1: GroupKey
				let userGroupSymKeyV1: AesKey

				o.beforeEach(async function () {
					group.formerGroupKeys = createTestEntity(GroupKeysRefTypeRef, { list: formerGroupKeyListId })

					// Prepare V2
					pubAdminGroupEncGKey.symKeyMac = createTestEntity(KeyMacTypeRef, {
						tag: object<Uint8Array>(),
						taggingKeyVersion: "1",
						taggedKeyVersion: "2",
					})
					group.pubAdminGroupEncGKey = pubAdminGroupEncGKey

					// Prepare V1
					groupKeysV1 = createTestEntity(GroupKeyTypeRef, {
						pubAdminGroupEncGKey: createTestEntity(PubEncKeyDataTypeRef, {
							symKeyMac: createTestEntity(KeyMacTypeRef, {
								tag: new Uint8Array([1, 1, 1]),
								taggedKeyVersion: "1",
								taggingKeyVersion: "0",
							}),
							pubEncSymKey: object<Uint8Array>(),
							recipientKeyVersion: "1",
							recipientIdentifier: adminGroupId,
						}),
						adminGroupKeyVersion: "1",
					})
					userGroupSymKeyV1 = object<AesKey>()
					const adminKeyPairV1 = object<PQKeyPairs>()
					when(keyLoaderFacade.loadKeypair(adminGroupId, 1)).thenResolve(adminKeyPairV1)
					when(
						asymmetricCryptoFacade.decryptSymKeyWithKeyPairAndAuthenticate(adminKeyPairV1, groupKeysV1.pubAdminGroupEncGKey!, {
							identifier: group._id,
							identifierType: PublicKeyIdentifierType.GROUP_ID,
						}),
					).thenResolve({
						decryptedAesKey: userGroupSymKeyV1,
						senderIdentityPubKey: object(),
					})
					when(keyLoaderFacade.loadFormerGroupKeyInstance(group, 1)).thenResolve(groupKeysV1)

					// Prepare V0
					groupKeysV0 = createTestEntity(GroupKeyTypeRef, {
						adminGroupEncGKey: object<Uint8Array>(),
						adminGroupKeyVersion: "0",
					})
					const adminSymKeyV0 = object<AesKey>()
					when(keyLoaderFacade.loadSymGroupKey(adminGroupId, 0)).thenResolve(adminSymKeyV0)
					userGroupSymKeyV0 = object<AesKey>()
					when(cryptoWrapper.decryptKey(adminSymKeyV0, anything())).thenReturn(userGroupSymKeyV0)
				})

				o("successful asym decryption", async function () {
					// Prepare V0
					when(keyLoaderFacade.loadFormerGroupKeyInstance(group, 0)).thenResolve(groupKeysV0)

					const returnedGroupKey = await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)

					o(returnedGroupKey.object).equals(groupKeyBytes)
					o(returnedGroupKey.version).equals(groupKeyVersion)

					let paramsCaptor = captor()
					let paramsTagCaptor = captor()
					// noinspection JSVoidFunctionReturnValueUsed
					verify(keyAuthenticationFacade.verifyTag(paramsCaptor.capture(), paramsTagCaptor.capture()))
					o(paramsCaptor.values?.length).equals(2)

					// check v1
					let params: UserGroupKeyAuthenticationParams = paramsCaptor.values![0]
					o(params).deepEquals({
						tagType: "USER_GROUP_KEY_TAG",
						sourceOfTrust: { currentUserGroupKey: userGroupSymKeyV0 },
						untrustedKey: { newUserGroupKey: userGroupSymKeyV1 },
						bindingData: {
							adminGroupId,
							userGroupId: groupId,
							newAdminGroupKeyVersion: previousAdminGroupKeyVersion,
							currentUserGroupKeyVersion: 0,
							newUserGroupKeyVersion: 1,
						},
					})
					let tagParam = paramsTagCaptor.values![0]
					o(tagParam).equals(brandKeyMac(groupKeysV1.pubAdminGroupEncGKey!.symKeyMac!).tag)

					// verify v2
					params = paramsCaptor.values![1]
					o(params).deepEquals({
						tagType: "USER_GROUP_KEY_TAG",
						untrustedKey: {
							newUserGroupKey: groupKeyBytes,
						},
						sourceOfTrust: {
							currentUserGroupKey: userGroupSymKeyV1,
						},
						bindingData: {
							adminGroupId,
							userGroupId: groupId,
							newAdminGroupKeyVersion: adminGroupKeyVersion,
							newUserGroupKeyVersion: 2,
							currentUserGroupKeyVersion: 1,
						},
					})
					tagParam = paramsTagCaptor.values![1]
					o(tagParam).equals(brandKeyMac(pubAdminGroupEncGKey.symKeyMac as KeyMac).tag)
				})

				o("user group key mac is invalid", async function () {
					// Prepare V1
					// noinspection JSVoidFunctionReturnValueUsed
					when(keyAuthenticationFacade.verifyTag(anything(), pubAdminGroupEncGKey.symKeyMac!.tag as MacTag)).thenThrow(new CryptoError("invalid mac"))

					// Prepare V0
					when(keyLoaderFacade.loadFormerGroupKeyInstance(group, 0)).thenResolve(groupKeysV0)

					await assertThrows(CryptoError, () => groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
				})

				o("user group key - no symmetrically encrypted former group key", async function () {
					// Prepare V0
					groupKeysV0 = createTestEntity(GroupKeyTypeRef, {
						adminGroupEncGKey: null,
						pubAdminGroupEncGKey: createTestEntity(PubEncKeyDataTypeRef, {
							symKeyMac: createTestEntity(KeyMacTypeRef, {
								taggedKeyVersion: "0",
							}),
						}),
						adminGroupKeyVersion: "0",
					})
					when(keyLoaderFacade.loadFormerGroupKeyInstance(group, 0)).thenResolve(groupKeysV0)

					const error = await assertThrows(TutanotaError, () => groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
					o(error.name).equals("UserGroupKeyNotTrustedError")
				})
			})

			o("user group key mac is invalid - former group key is symmetrically encrypted for the admin", async function () {
				group.pubAdminGroupEncGKey = pubAdminGroupEncGKey

				pubAdminGroupEncGKey.symKeyMac = createTestEntity(KeyMacTypeRef, {
					tag: object(),
					taggingKeyVersion: "1",
					taggedKeyVersion: "1",
					taggingGroup: adminGroupId,
				})
				group.formerGroupKeys = createTestEntity(GroupKeysRefTypeRef, { list: formerGroupKeyListId })

				const formerGroupKeysV1 = createTestEntity(GroupKeyTypeRef, {
					adminGroupEncGKey: object(),
					adminGroupKeyVersion: "1",
				})
				when(cryptoWrapper.decryptKey(anything(), formerGroupKeysV1.adminGroupEncGKey!)).thenReturn(object())

				when(keyLoaderFacade.loadFormerGroupKeyInstance(group, 1)).thenResolve(formerGroupKeysV1)
				// noinspection JSVoidFunctionReturnValueUsed
				when(keyAuthenticationFacade.verifyTag(anything(), brandKeyMac(pubAdminGroupEncGKey.symKeyMac!).tag)).thenThrow(new CryptoError("invalid mac"))
				await assertThrows(CryptoError, async () => await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
			})
		})

		o("decrypt with the group membership key if the admin happens to be a member of the target group", async function () {
			// check that the user is from the admin group
			when(userFacade.hasGroup(groupId)).thenReturn(true)

			await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)
			verify(keyLoaderFacade.getCurrentSymGroupKey(groupId))
		})

		o("throws when the group doesn't have any admin encrypted group key", async function () {
			group.adminGroupEncGKey = null
			group.pubAdminGroupEncGKey = null
			await assertThrows(ProgrammingError, async () => await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
		})

		o("throws when the group only has a dummy(!) admin encrypted group key", async function () {
			group.adminGroupEncGKey = new Uint8Array(0)
			group.pubAdminGroupEncGKey = null
			await assertThrows(ProgrammingError, async () => await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
		})

		o("throws when the user is not an admin and tries to decrypt with the admin group key", async function () {
			when(userFacade.hasGroup(adminGroupId)).thenReturn(false)
			await assertThrows(Error, async () => await groupManagementFacade.getCurrentGroupKeyViaAdminEncGKey(groupId))
		})
	})
	o.spec("Create identity key pair", function () {
		const userGroupId = "userGroupId"
		const userGroupKey: VersionedKey = { version: 1, object: object() }
		const identityKeyPair: Ed25519KeyPair = { public_key: object(), private_key: object() }
		const encodedPubIdentityKey: Uint8Array = object()
		const encryptedPrivateIdentityKey: VersionedEncryptedKey = {
			encryptingKeyVersion: userGroupKey.version,
			key: object(),
		}
		const identityKeyVersion = 0
		const tag: MacTag = object()

		const adminGroupId = "adminGroupId"
		const adminKeyVersion = 2
		const adminGroupEncGKey: Uint8Array = new Uint8Array([1])
		const adminGroupKey: VersionedKey = {
			version: adminKeyVersion,
			object: object(),
		}
		const adminEncPrivateKey: VersionedEncryptedKey = { encryptingKeyVersion: adminKeyVersion, key: object() }

		o.beforeEach(function () {
			when(cryptoWrapper.ed25519PublicKeyToBytes(identityKeyPair.public_key)).thenReturn(encodedPubIdentityKey)
			when(ed25519Facade.generateKeypair()).thenResolve(identityKeyPair)
			when(userFacade.hasGroup(userGroupId)).thenReturn(true)

			when(keyLoaderFacade.getCurrentSymGroupKey(userGroupId)).thenResolve(userGroupKey)

			when(cryptoWrapper.encryptEd25519Key(userGroupKey, identityKeyPair.private_key)).thenReturn(encryptedPrivateIdentityKey)

			when(
				keyAuthenticationFacade.computeTag({
					tagType: "IDENTITY_PUB_KEY_TAG",
					sourceOfTrust: { symmetricGroupKey: userGroupKey.object },
					untrustedKey: { identityPubKey: identityKeyPair.public_key },
					bindingData: {
						publicIdentityKeyVersion: identityKeyVersion,
						groupKeyVersion: userGroupKey.version,
						groupId: userGroupId,
					},
				}),
			).thenReturn(tag)
		})

		o("success internal user", async function () {
			await groupManagementFacade.createIdentityKeyPair(userGroupId)

			verify(
				serviceExecutor.post(
					IdentityKeyService,
					argThat((data: IdentityKeyPostIn) => {
						const identityKeyPairFromRequest = data.identityKeyPair
						const keyMacFromRequest = identityKeyPairFromRequest.publicKeyMac
						o(identityKeyPairFromRequest.identityKeyVersion).equals(identityKeyVersion.toString())
						o(identityKeyPairFromRequest.encryptingKeyVersion).equals(encryptedPrivateIdentityKey.encryptingKeyVersion.toString())
						o(identityKeyPairFromRequest.privateEd25519Key).equals(encryptedPrivateIdentityKey.key)
						o(identityKeyPairFromRequest.publicEd25519Key).equals(encodedPubIdentityKey)
						o(keyMacFromRequest.tag).equals(tag)
						o(keyMacFromRequest.taggedKeyVersion).equals(identityKeyVersion.toString())
						o(keyMacFromRequest.taggingKeyVersion).equals(userGroupKey.version.toString())
						o(keyMacFromRequest.taggingGroup).equals(userGroupId)

						return true
					}),
				),
			)
		})

		o("success admin creates new user", async function () {
			when(userFacade.hasGroup(userGroupId)).thenReturn(false)
			when(userFacade.hasGroup(adminGroupId)).thenReturn(true)
			when(keyLoaderFacade.getCurrentSymGroupKey(userGroupId)).thenResolve(object())
			when(keyLoaderFacade.loadSymGroupKey(adminGroupId, adminKeyVersion)).thenResolve(adminGroupKey.object)
			when(cryptoWrapper.decryptKey(adminGroupKey.object, adminGroupEncGKey)).thenReturn(userGroupKey.object)
			when(cacheManagementFacade.reloadGroup(userGroupId)).thenResolve(
				createTestEntity(GroupTypeRef, {
					_id: userGroupId,
					groupKeyVersion: userGroupKey.version.toString(),
					adminGroupKeyVersion: adminKeyVersion.toString(),
					adminGroupEncGKey: adminGroupEncGKey,
					admin: adminGroupId,
				}),
			)

			await groupManagementFacade.createIdentityKeyPair(userGroupId)

			verify(
				serviceExecutor.post(
					IdentityKeyService,
					argThat((data: IdentityKeyPostIn) => {
						const identityKeyPairFromRequest = data.identityKeyPair
						const keyMacFromRequest = identityKeyPairFromRequest.publicKeyMac
						o(identityKeyPairFromRequest.identityKeyVersion).equals(identityKeyVersion.toString())
						o(identityKeyPairFromRequest.encryptingKeyVersion).equals(encryptedPrivateIdentityKey.encryptingKeyVersion.toString())
						o(identityKeyPairFromRequest.privateEd25519Key).equals(encryptedPrivateIdentityKey.key)
						o(identityKeyPairFromRequest.publicEd25519Key).equals(encodedPubIdentityKey)
						o(keyMacFromRequest.tag).equals(tag)
						o(keyMacFromRequest.taggedKeyVersion).equals(identityKeyVersion.toString())
						o(keyMacFromRequest.taggingKeyVersion).equals(userGroupKey.version.toString())
						o(keyMacFromRequest.taggingGroup).equals(userGroupId)

						return true
					}),
				),
			)
		})

		o("success admin creates new user - encrypting key is passed", async function () {
			when(userFacade.hasGroup(userGroupId)).thenReturn(false)
			when(userFacade.hasGroup(adminGroupId)).thenReturn(true)
			when(keyLoaderFacade.getCurrentSymGroupKey(userGroupId)).thenResolve(object())
			when(keyLoaderFacade.loadSymGroupKey(adminGroupId, adminKeyVersion)).thenResolve(adminGroupKey.object)
			when(cryptoWrapper.decryptKey(adminGroupKey.object, adminGroupEncGKey)).thenReturn(userGroupKey.object)
			when(cryptoWrapper.encryptEd25519Key(userGroupKey, identityKeyPair.private_key)).thenThrow(new Error("should not happen"))
			when(cryptoWrapper.encryptEd25519Key(adminGroupKey, identityKeyPair.private_key)).thenReturn(adminEncPrivateKey)
			when(cacheManagementFacade.reloadGroup(userGroupId)).thenResolve(
				createTestEntity(GroupTypeRef, {
					_id: userGroupId,
					groupKeyVersion: userGroupKey.version.toString(),
					adminGroupKeyVersion: adminKeyVersion.toString(),
					adminGroupEncGKey: adminGroupEncGKey,
					admin: adminGroupId,
				}),
			)

			await groupManagementFacade.createIdentityKeyPair(userGroupId, adminGroupKey)

			verify(
				serviceExecutor.post(
					IdentityKeyService,
					argThat((data: IdentityKeyPostIn) => {
						const identityKeyPairFromRequest = data.identityKeyPair
						const keyMacFromRequest = identityKeyPairFromRequest.publicKeyMac
						o(identityKeyPairFromRequest.identityKeyVersion).equals(identityKeyVersion.toString())
						o(identityKeyPairFromRequest.encryptingKeyVersion).equals(adminEncPrivateKey.encryptingKeyVersion.toString())
						o(identityKeyPairFromRequest.privateEd25519Key).equals(adminEncPrivateKey.key)
						o(identityKeyPairFromRequest.publicEd25519Key).equals(encodedPubIdentityKey)
						o(keyMacFromRequest.tag).equals(tag)
						o(keyMacFromRequest.taggedKeyVersion).equals(identityKeyVersion.toString())
						o(keyMacFromRequest.taggingKeyVersion).equals(userGroupKey.version.toString())
						o(keyMacFromRequest.taggingGroup).equals(userGroupId)
						return true
					}),
				),
			)
		})

		o("success admin creates shared mailbox", async function () {
			// we want to make sure that it is called, but we don't need to test it here; it has its own tests
			groupManagementFacade.createIdentityKeyPair = spy(noOp)

			when(userFacade.getGroupIds(GroupType.Admin)).thenReturn([adminGroupId])
			const adminGroupKey = freshVersioned(object<AesKey>())
			when(keyLoaderFacade.getCurrentSymGroupKey(adminGroupId)).thenResolve(adminGroupKey)

			when(pqFacade.generateKeyPairs()).thenResolve({ x25519KeyPair: object(), kyberKeyPair: object() })
			when(cryptoWrapper.encryptKeyWithVersionedKey(anything(), anything())).thenReturn(object())
			let mailGroup = "sharedMailGroupId"
			when(serviceExecutor.post(anything(), anything())).thenResolve({ mailGroup: mailGroup })

			await groupManagementFacade.createSharedMailGroup("some group", "example@tuta.com")

			o(groupManagementFacade.createIdentityKeyPair.invocations.length).equals(1)
			o(groupManagementFacade.createIdentityKeyPair.args[0]).equals(mailGroup)
			o(groupManagementFacade.createIdentityKeyPair.args[1]).deepEquals(adminGroupKey)
		})

		o.spec("createIdentityKeyPairForExistingTeamGroups", function () {
			const adminGroupKey = object<VersionedKey>()
			const teamGroupId1 = "teamGroupId1"
			const teamGroupId2 = "teamGroupId2"
			const groupIds = [teamGroupId1, teamGroupId2]
			let teamGroups: Group[]
			let user: User

			o.beforeEach(function () {
				user = createTestEntity(UserTypeRef, {
					memberships: [
						createTestEntity(GroupMembershipTypeRef, {
							group: adminGroupId,
							groupType: GroupType.Admin,
						}),
					],
				})

				teamGroups = []
				for (const groupId of groupIds) {
					const group = createTestEntity(GroupTypeRef, { identityKeyPair: null })
					teamGroups.push(group)
					when(entityClient.load(GroupTypeRef, groupId)).thenResolve(group)
				}

				// we want to make sure that it is called, but we don't need to test it here; it has its own tests
				groupManagementFacade.createIdentityKeyPair = func<typeof groupManagementFacade.createIdentityKeyPair>()

				when(keyLoaderFacade.getCurrentSymGroupKey(adminGroupId)).thenResolve(adminGroupKey)
				when(userFacade.getUser()).thenReturn(user)
				groupManagementFacade.loadTeamGroupIds = func<() => Promise<Id[]>>()
				when(groupManagementFacade.loadTeamGroupIds()).thenResolve(groupIds)
			})

			o("admin migrates existing shared mailboxes", async function () {
				await groupManagementFacade.createIdentityKeyPairForExistingTeamGroups()

				for (const groupId of groupIds) {
					verify(groupManagementFacade.createIdentityKeyPair(groupId, adminGroupKey))
				}
			})

			o("non-admin does not migrate existing shared mailboxes", async function () {
				user.memberships = []

				await assertThrows(Error, groupManagementFacade.createIdentityKeyPairForExistingTeamGroups)
			})

			o("skips shared mailboxes that already have identity key", async function () {
				const group1 = createTestEntity(GroupTypeRef, { identityKeyPair: object() })
				when(entityClient.load(GroupTypeRef, teamGroupId1)).thenResolve(group1)

				await groupManagementFacade.createIdentityKeyPairForExistingTeamGroups()

				verify(groupManagementFacade.createIdentityKeyPair(teamGroupId1, adminGroupKey), { times: 0 })
				verify(groupManagementFacade.createIdentityKeyPair(teamGroupId2, adminGroupKey))
			})

			o("errors bubble up", async function () {
				const error = new Error("test") // cannot be an `object()`, otherwise `instanceof` wouldn't match
				when(groupManagementFacade.createIdentityKeyPair(matchers.anything(), matchers.anything())).thenReject(error)

				const thrown = await assertThrows(Error, async () => await groupManagementFacade.createIdentityKeyPairForExistingTeamGroups())
				o(thrown).equals(error)
			})
		})
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
