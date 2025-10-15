import o from "@tutao/otest"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest.js"
import { checkKeyVersionConstraints, KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { CacheManagementFacade } from "../../../../../src/common/api/worker/facades/lazy/CacheManagementFacade.js"
import { AsymmetricCryptoFacade } from "../../../../../src/common/api/worker/crypto/AsymmetricCryptoFacade.js"
import { matchers, object, verify, when } from "testdouble"
import { AsymmetricKeyPair, Ed25519KeyPair, KeyPairType, MacTag } from "@tutao/tutanota-crypto"
import { createTestEntity } from "../../../TestUtils.js"
import {
	Group,
	GroupMembershipTypeRef,
	GroupTypeRef,
	IdentityKeyPostIn,
	PublicKeySignature,
	User,
	UserTypeRef,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { CryptoWrapper, VersionedEncryptedKey, VersionedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { GroupType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { KeyAuthenticationFacade } from "../../../../../src/common/api/worker/facades/KeyAuthenticationFacade.js"
import { Ed25519Facade } from "../../../../../src/common/api/worker/facades/Ed25519Facade"
import { IdentityKeyService } from "../../../../../src/common/api/entities/sys/Services"
import { PublicKeySignatureFacade } from "../../../../../src/common/api/worker/facades/PublicKeySignatureFacade"
import { IdentityKeyCreator } from "../../../../../src/common/api/worker/facades/lazy/IdentityKeyCreator"
import { AdminKeyLoaderFacade } from "../../../../../src/common/api/worker/facades/AdminKeyLoaderFacade"
import { Versioned } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"

const { anything, argThat, captor } = matchers

o.spec("IdentityKeyCreatorTest", function () {
	let userFacade: UserFacade
	let adminKeyLoaderFacade: AdminKeyLoaderFacade
	let entityClient: EntityClient
	let serviceExecutor: IServiceExecutor
	let keyLoaderFacade: KeyLoaderFacade
	let cacheManagementFacade: CacheManagementFacade
	let asymmetricCryptoFacade: AsymmetricCryptoFacade
	let cryptoWrapper: CryptoWrapper
	let keyAuthenticationFacade: KeyAuthenticationFacade
	let ed25519Facade: Ed25519Facade
	let publicKeySignatureFacade: PublicKeySignatureFacade

	let identityKeyCreator: IdentityKeyCreator

	o.beforeEach(function () {
		userFacade = object()
		adminKeyLoaderFacade = object()
		entityClient = object()
		serviceExecutor = object()
		keyLoaderFacade = object()
		cacheManagementFacade = object()
		asymmetricCryptoFacade = object()
		cryptoWrapper = object()
		keyAuthenticationFacade = object()
		ed25519Facade = object()
		publicKeySignatureFacade = object()

		identityKeyCreator = new IdentityKeyCreator(
			userFacade,
			entityClient,
			serviceExecutor,
			keyLoaderFacade,
			adminKeyLoaderFacade,
			cacheManagementFacade,
			asymmetricCryptoFacade,
			cryptoWrapper,
			keyAuthenticationFacade,
			ed25519Facade,
			publicKeySignatureFacade,
		)
	})

	o.spec("Create identity key pair", function () {
		const userGroupId = "userGroupId"
		const currentUserGroupKeyVersion = 1
		const userGroupKey: VersionedKey = { version: currentUserGroupKeyVersion, object: object() }
		const identityKeyPair: Ed25519KeyPair = { public_key: object(), private_key: object() }
		const encodedPubIdentityKey: Uint8Array = object()
		const encryptedPrivateIdentityKey: VersionedEncryptedKey = {
			encryptingKeyVersion: userGroupKey.version,
			key: object(),
		}
		let userGroupKeyPair: Versioned<AsymmetricKeyPair>
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

		const userGroup: Group = object()
		userGroup.currentKeys = object()
		userGroup.groupKeyVersion = "1"
		const publicKeySignature: PublicKeySignature = object()

		o.beforeEach(function () {
			userGroupKeyPair = object()
			when(cryptoWrapper.ed25519PublicKeyToBytes(identityKeyPair.public_key)).thenReturn(encodedPubIdentityKey)
			when(ed25519Facade.generateKeypair()).thenResolve(identityKeyPair)

			when(cryptoWrapper.encryptEd25519Key(userGroupKey, identityKeyPair.private_key)).thenReturn(encryptedPrivateIdentityKey)
			when(keyLoaderFacade.getCurrentSymGroupKey(adminGroupId)).thenResolve(adminGroupKey)
			when(adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(userGroupId)).thenResolve(userGroupKey)

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

			when(entityClient.load(GroupTypeRef, userGroupId)).thenResolve(userGroup)
			when(
				publicKeySignatureFacade.signPublicKey(userGroupKeyPair, {
					object: identityKeyPair.private_key,
					version: identityKeyVersion,
				}),
			).thenResolve(publicKeySignature)
		})

		o("success internal user", async function () {
			await identityKeyCreator.createIdentityKeyPair(userGroupId, userGroupKeyPair, [])

			verify(
				serviceExecutor.post(
					IdentityKeyService,
					argThat((data: IdentityKeyPostIn) => {
						const identityKeyPairFromRequest = data.identityKeyPair
						const keyMacFromRequest = identityKeyPairFromRequest.publicKeyMac
						const signaturesFromRequest = data.signatures
						o(identityKeyPairFromRequest.identityKeyVersion).equals(identityKeyVersion.toString())
						o(identityKeyPairFromRequest.encryptingKeyVersion).equals(encryptedPrivateIdentityKey.encryptingKeyVersion.toString())
						o(identityKeyPairFromRequest.privateEd25519Key).equals(encryptedPrivateIdentityKey.key)
						o(identityKeyPairFromRequest.publicEd25519Key).equals(encodedPubIdentityKey)
						o(keyMacFromRequest.tag).equals(tag)
						o(keyMacFromRequest.taggedKeyVersion).equals(identityKeyVersion.toString())
						o(keyMacFromRequest.taggingKeyVersion).equals(userGroupKey.version.toString())
						o(keyMacFromRequest.taggingGroup).equals(userGroupId)
						o(signaturesFromRequest.length).equals(1)
						o(signaturesFromRequest[0]).equals(publicKeySignature)

						return true
					}),
				),
			)
		})

		o("current group key RSA fails", async function () {
			userGroupKeyPair.object.keyPairType = KeyPairType.RSA
			await assertThrows(ProgrammingError, async () => identityKeyCreator.createIdentityKeyPair(userGroupId, userGroupKeyPair, []))
		})

		o("success admin creates new user", async function () {
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
			await identityKeyCreator.createIdentityKeyPair(userGroupId, userGroupKeyPair, [])

			verify(
				serviceExecutor.post(
					IdentityKeyService,
					argThat((data: IdentityKeyPostIn) => {
						const identityKeyPairFromRequest = data.identityKeyPair
						const keyMacFromRequest = identityKeyPairFromRequest.publicKeyMac
						const signaturesFromRequest = data.signatures
						o(identityKeyPairFromRequest.identityKeyVersion).equals(identityKeyVersion.toString())
						o(identityKeyPairFromRequest.encryptingKeyVersion).equals(encryptedPrivateIdentityKey.encryptingKeyVersion.toString())
						o(identityKeyPairFromRequest.privateEd25519Key).equals(encryptedPrivateIdentityKey.key)
						o(identityKeyPairFromRequest.publicEd25519Key).equals(encodedPubIdentityKey)
						o(keyMacFromRequest.tag).equals(tag)
						o(keyMacFromRequest.taggedKeyVersion).equals(identityKeyVersion.toString())
						o(keyMacFromRequest.taggingKeyVersion).equals(userGroupKey.version.toString())
						o(keyMacFromRequest.taggingGroup).equals(userGroupId)
						o(signaturesFromRequest.length).equals(1)
						o(signaturesFromRequest[0]).equals(publicKeySignature)

						return true
					}),
				),
			)
		})

		o("success admin creates new user - encrypting key is passed", async function () {
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
			await identityKeyCreator.createIdentityKeyPair(userGroupId, userGroupKeyPair, [], adminGroupKey)

			verify(
				serviceExecutor.post(
					IdentityKeyService,
					argThat((data: IdentityKeyPostIn) => {
						const identityKeyPairFromRequest = data.identityKeyPair
						const keyMacFromRequest = identityKeyPairFromRequest.publicKeyMac
						const signaturesFromRequest = data.signatures
						o(identityKeyPairFromRequest.identityKeyVersion).equals(identityKeyVersion.toString())
						o(identityKeyPairFromRequest.encryptingKeyVersion).equals(adminEncPrivateKey.encryptingKeyVersion.toString())
						o(identityKeyPairFromRequest.privateEd25519Key).equals(adminEncPrivateKey.key)
						o(identityKeyPairFromRequest.publicEd25519Key).equals(encodedPubIdentityKey)
						o(keyMacFromRequest.tag).equals(tag)
						o(keyMacFromRequest.taggedKeyVersion).equals(identityKeyVersion.toString())
						o(keyMacFromRequest.taggingKeyVersion).equals(userGroupKey.version.toString())
						o(keyMacFromRequest.taggingGroup).equals(userGroupId)
						o(signaturesFromRequest.length).equals(1)
						o(signaturesFromRequest[0]).equals(publicKeySignature)
						return true
					}),
				),
			)
		})

		o.spec("createIdentityKeyPairForExistingUser", function () {
			const currentUserGroupKeyPair: Versioned<AsymmetricKeyPair> = {
				object: object(),
				version: currentUserGroupKeyVersion,
			}
			o.beforeEach(function () {
				when(userFacade.getUserGroupId()).thenReturn(userGroupId)
				when(keyLoaderFacade.loadCurrentKeyPair(userGroupId)).thenResolve(currentUserGroupKeyPair)
				when(cacheManagementFacade.reloadGroup(userGroupId)).thenResolve(userGroup)
			})

			o("success no former group keys", async function () {
				when(keyLoaderFacade.loadAllFormerKeyPairs(userGroup)).thenResolve([])
				await identityKeyCreator.createIdentityKeyPairForExistingUsers()
				verify(asymmetricCryptoFacade.getOrMakeSenderX25519KeyPair(currentUserGroupKeyPair.object, userGroupId))
			})
			o("success former group keys", async function () {
				const formerGroupKeyPair: Versioned<AsymmetricKeyPair> = {
					object: object(),
					version: checkKeyVersionConstraints(currentUserGroupKeyVersion - 1),
				}
				const formerGroupKeyPairSignature: PublicKeySignature = object()
				when(
					publicKeySignatureFacade.signPublicKey(formerGroupKeyPair, {
						object: identityKeyPair.private_key,
						version: identityKeyVersion,
					}),
				).thenResolve(formerGroupKeyPairSignature)
				when(keyLoaderFacade.loadAllFormerKeyPairs(userGroup)).thenResolve([formerGroupKeyPair])
				await identityKeyCreator.createIdentityKeyPairForExistingUsers()
				verify(asymmetricCryptoFacade.getOrMakeSenderX25519KeyPair(currentUserGroupKeyPair.object, userGroupId))
				verify(
					serviceExecutor.post(
						IdentityKeyService,
						argThat((data: IdentityKeyPostIn) => {
							o(data.signatures.length).equals(2)
							o(data.signatures[1]).equals(formerGroupKeyPairSignature)
							return true
						}),
					),
				)
			})
		})

		o.spec("createIdentityKeyPairForExistingTeamGroups", function () {
			const teamGroupId1 = "teamGroupId1"
			const teamGroupId2 = "teamGroupId2"
			const groupIds = [teamGroupId1, teamGroupId2]
			let teamGroupData: {
				group: Group
				signature: PublicKeySignature
				encPrivIdentityKey: VersionedEncryptedKey
			}[]
			let user: User
			let currentKeyPair: AsymmetricKeyPair

			o.beforeEach(function () {
				user = createTestEntity(UserTypeRef, {
					memberships: [
						createTestEntity(GroupMembershipTypeRef, {
							group: adminGroupId,
							groupType: GroupType.Admin,
						}),
					],
				})

				teamGroupData = []
				for (const groupId of groupIds) {
					const group = createTestEntity(GroupTypeRef, { identityKeyPair: null, _id: groupId })
					group.currentKeys = object()
					when(entityClient.load(GroupTypeRef, groupId)).thenResolve(group)
					when(cacheManagementFacade.reloadGroup(groupId)).thenResolve(group)
					const currentGroupKey: VersionedKey = object()
					when(keyLoaderFacade.loadAllFormerKeyPairs(group, currentGroupKey)).thenResolve([])
					when(adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)).thenResolve(currentGroupKey)
					currentKeyPair = object()

					const versionedCurrentKeyPair: Versioned<AsymmetricKeyPair> = {
						object: currentKeyPair,
						version: 0,
					}
					when(keyLoaderFacade.loadCurrentKeyPair(groupId, currentGroupKey)).thenResolve(versionedCurrentKeyPair)
					const signature = object<PublicKeySignature>()
					when(publicKeySignatureFacade.signPublicKey(versionedCurrentKeyPair, anything())).thenResolve(signature)
					const encPrivIdentityKey: VersionedEncryptedKey = {
						key: object(),
						encryptingKeyVersion: 0,
					}
					teamGroupData.push({ group, signature, encPrivIdentityKey })
				}
				when(cryptoWrapper.encryptEd25519Key(anything(), anything())).thenReturn(
					teamGroupData[0].encPrivIdentityKey,
					// ...teamGroupData.slice(1).map((tgd) => tgd.encPrivIdentityKey),
					teamGroupData[1].encPrivIdentityKey,
				)

				when(userFacade.getUser()).thenReturn(user)
			})

			o("admin migrates existing shared mailboxes", async function () {
				await identityKeyCreator.createIdentityKeyPairForExistingTeamGroups(groupIds)

				const captor = matchers.captor()
				verify(serviceExecutor.post(IdentityKeyService, captor.capture()))
				for (const { group, signature, encPrivIdentityKey } of teamGroupData) {
					verify(asymmetricCryptoFacade.getOrMakeSenderX25519KeyPair(anything(), group._id))
					o(captor.values?.length).equals(teamGroupData.length)
					const expectedCalls = captor.values?.filter((requestData: IdentityKeyPostIn) => {
						const identityKeyPairFromRequest = requestData.identityKeyPair
						const signaturesFromRequest = requestData.signatures
						o(signaturesFromRequest.length).equals(1)
						return identityKeyPairFromRequest.privateEd25519Key === encPrivIdentityKey.key && signaturesFromRequest[0] === signature
					})
					o(expectedCalls!.length).equals(1)
				}
			})

			o("non-admin does not migrate existing shared mailboxes", async function () {
				user.memberships = []

				await assertThrows(Error, async () => identityKeyCreator.createIdentityKeyPairForExistingTeamGroups(groupIds))
			})

			o("skips shared mailboxes that already have identity key", async function () {
				const group1 = createTestEntity(GroupTypeRef, { identityKeyPair: object(), _id: teamGroupId1 })
				when(entityClient.load(GroupTypeRef, group1._id)).thenResolve(group1)

				await identityKeyCreator.createIdentityKeyPairForExistingTeamGroups([group1._id])

				verify(serviceExecutor.post(IdentityKeyService, anything()), { times: 0 })
			})

			o("errors bubble up", async function () {
				const error = new Error("test") // cannot be an `object()`, otherwise `instanceof` wouldn't match
				when(publicKeySignatureFacade.signPublicKey(matchers.anything(), matchers.anything())).thenReject(error)

				const thrown = await assertThrows(Error, async () => await identityKeyCreator.createIdentityKeyPairForExistingTeamGroups(groupIds))
				o(thrown).equals(error)
			})
		})
	})
})
