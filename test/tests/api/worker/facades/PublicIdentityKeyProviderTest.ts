import o from "@tutao/otest"
import { Group, GroupTypeRef, IdentityKeyGetIn, IdentityKeyGetOut, IdentityKeyPair, KeyMacTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { matchers, object, verify, when } from "testdouble"
import { brandKeyMac, IdentityPubKeyAuthenticationParams, KeyAuthenticationFacade } from "../../../../../src/common/api/worker/facades/KeyAuthenticationFacade"
import { createTestEntity } from "../../../TestUtils"
import { Aes256Key, bytesToEd25519PublicKey, Ed25519PublicKey } from "@tutao/tutanota-crypto"
import { SigningKeyPairType } from "../../../../../src/common/api/worker/facades/Ed25519Facade"
import { arrayEquals, hexToUint8Array } from "@tutao/tutanota-utils"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { IdentityKeyService } from "../../../../../src/common/api/entities/sys/Services"
import { PublicKeyIdentifier } from "../../../../../src/common/api/worker/facades/PublicEncryptionKeyProvider"
import { IdentityKeySourceOfTrust, PublicKeyIdentifierType } from "../../../../../src/common/api/common/TutanotaConstants"
import { NotFoundError } from "../../../../../src/common/api/common/error/RestError"
import testData from "../crypto/CompatibilityTestData.json"
import { PublicIdentityKeyProvider } from "../../../../../src/common/api/worker/facades/PublicIdentityKeyProvider"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade"
import { IdentityKeyTrustDatabase, TrustDBEntry } from "../../../../../src/common/api/worker/facades/IdentityKeyTrustDatabase"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"

o.spec("PublicIdentityKeyProviderTest", function () {
	let serviceExecutor: ServiceExecutor
	let entityClient: EntityClient
	let keyAuthenticationFacade: KeyAuthenticationFacade
	let keyLoaderFacade: KeyLoaderFacade
	let identityKeyTrustDatabase: IdentityKeyTrustDatabase

	let publicIdentityKeyProvider: PublicIdentityKeyProvider

	let rawEd25519PublicKey: Uint8Array
	let ed25519PublicKey: Ed25519PublicKey

	o.beforeEach(function () {
		serviceExecutor = object()
		entityClient = object()
		keyAuthenticationFacade = object()
		keyLoaderFacade = object()
		identityKeyTrustDatabase = object()
		publicIdentityKeyProvider = new PublicIdentityKeyProvider(
			serviceExecutor,
			entityClient,
			keyAuthenticationFacade,
			keyLoaderFacade,
			identityKeyTrustDatabase,
		)

		rawEd25519PublicKey = hexToUint8Array(testData.ed25519Tests[0].alicePublicKeyHex)
		ed25519PublicKey = bytesToEd25519PublicKey(rawEd25519PublicKey)
		when(identityKeyTrustDatabase.isSupported()).thenResolve(true)
	})

	o.spec("loadPublicIdentityKeyFromGroup", function () {
		o("success", async function () {
			const userGroup: Group = object()
			userGroup._id = "userGroup"
			const identityKeyPair: IdentityKeyPair = object()
			identityKeyPair.publicEd25519Key = rawEd25519PublicKey
			identityKeyPair.identityKeyVersion = "0"
			const identityPublicKeyMac = brandKeyMac(
				createTestEntity(KeyMacTypeRef, {
					taggedKeyVersion: "0",
					taggingKeyVersion: "1",
					taggingGroup: userGroup._id,
					tag: object(),
				}),
			)

			const userGroupKey: Aes256Key = object()

			identityKeyPair.publicKeyMac = identityPublicKeyMac
			userGroup.identityKeyPair = identityKeyPair

			when(entityClient.load(GroupTypeRef, matchers.anything())).thenResolve(userGroup)
			when(keyLoaderFacade.loadSymGroupKey(matchers.anything(), matchers.anything())).thenResolve(userGroupKey)

			const actualPublicIdentityKey = await publicIdentityKeyProvider.loadPublicIdentityKeyFromGroup(userGroup._id)

			o(actualPublicIdentityKey?.object).deepEquals({ key: ed25519PublicKey, type: SigningKeyPairType.Ed25519 })
			verify(
				keyAuthenticationFacade.verifyTag(
					matchers.argThat((params: IdentityPubKeyAuthenticationParams) => {
						return (
							params.tagType == "IDENTITY_PUB_KEY_TAG" &&
							arrayEquals(params.untrustedKey.identityPubKey, ed25519PublicKey) &&
							params.sourceOfTrust.symmetricGroupKey == userGroupKey &&
							params.bindingData.groupId == userGroup._id &&
							String(params.bindingData.groupKeyVersion) == identityPublicKeyMac.taggingKeyVersion &&
							String(params.bindingData.publicIdentityKeyVersion) == identityPublicKeyMac.taggedKeyVersion
						)
					}),
					identityPublicKeyMac.tag,
				),
			)
		})

		o("if the tag does not match, an error is thrown", async function () {
			const userGroup: Group = object()
			userGroup._id = "userGroup"
			const identityKeyPair: IdentityKeyPair = object()
			identityKeyPair.publicEd25519Key = rawEd25519PublicKey
			identityKeyPair.identityKeyVersion = "0"
			const identityPublicKeyMac = brandKeyMac(
				createTestEntity(KeyMacTypeRef, {
					taggedKeyVersion: "0",
					taggingKeyVersion: "1",
					taggingGroup: userGroup._id,
					tag: object(),
				}),
			)

			const userGroupKey: Aes256Key = object()

			identityKeyPair.publicKeyMac = identityPublicKeyMac
			userGroup.identityKeyPair = identityKeyPair

			when(entityClient.load(GroupTypeRef, matchers.anything())).thenResolve(userGroup)
			when(keyLoaderFacade.loadSymGroupKey(matchers.anything(), matchers.anything())).thenResolve(userGroupKey)

			when(keyAuthenticationFacade.verifyTag(matchers.anything(), matchers.anything())).thenThrow(new CryptoError("invalid mac"))

			await assertThrows(CryptoError, async () => publicIdentityKeyProvider.loadPublicIdentityKeyFromGroup(userGroup._id))
		})

		o("if the user has no identity key, the method returns null", async function () {
			const userGroup: Group = object()
			userGroup._id = "userGroup"
			userGroup.identityKeyPair = null

			when(entityClient.load(GroupTypeRef, matchers.anything())).thenResolve(userGroup)

			const pk = await publicIdentityKeyProvider.loadPublicIdentityKeyFromGroup(userGroup._id)
			o(pk).equals(null)
		})
	})

	o.spec("loadPublicIdentityKey", function () {
		o("success loaded from identity key service", async function () {
			const identityKeyGetOut: IdentityKeyGetOut = object()
			identityKeyGetOut.publicIdentityKey = rawEd25519PublicKey
			identityKeyGetOut.publicIdentityKeyVersion = "5"

			const identifier: PublicKeyIdentifier = {
				identifier: "alice@tuta.com",
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
			}
			when(identityKeyTrustDatabase.getTrustedEntry(identifier.identifier)).thenResolve(null)
			when(
				serviceExecutor.get(
					IdentityKeyService,
					matchers.argThat((data: IdentityKeyGetIn) => {
						return data.identifier === identifier.identifier && identifier.identifierType === data.identifierType && data.version === null
					}),
				),
			).thenResolve(identityKeyGetOut)

			const trustDBEntry: TrustDBEntry = {
				publicIdentityKey: {
					version: 5,
					object: {
						key: ed25519PublicKey,
						type: SigningKeyPairType.Ed25519,
					},
				},
				sourceOfTrust: IdentityKeySourceOfTrust.TOFU,
			}

			when(identityKeyTrustDatabase.trust(identifier.identifier, trustDBEntry.publicIdentityKey, IdentityKeySourceOfTrust.TOFU)).thenResolve(trustDBEntry)

			const identityKey = await publicIdentityKeyProvider.loadPublicIdentityKey(identifier)

			o(identityKey).deepEquals(trustDBEntry)
		})

		o("success loaded from trust db", async function () {
			const identityKeyGetOut: IdentityKeyGetOut = object()
			identityKeyGetOut.publicIdentityKey = rawEd25519PublicKey
			identityKeyGetOut.publicIdentityKeyVersion = "5"

			const identifier: PublicKeyIdentifier = {
				identifier: "alice@tuta.com",
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
			}

			const trustDBEntry: TrustDBEntry = {
				publicIdentityKey: {
					version: 5,
					object: {
						key: ed25519PublicKey,
						type: SigningKeyPairType.Ed25519,
					},
				},
				sourceOfTrust: IdentityKeySourceOfTrust.TOFU,
			}
			when(identityKeyTrustDatabase.getTrustedEntry(identifier.identifier)).thenResolve(trustDBEntry)

			const identityKey = await publicIdentityKeyProvider.loadPublicIdentityKey(identifier)

			verify(serviceExecutor.get(IdentityKeyService, matchers.anything()), { times: 0 })
			verify(identityKeyTrustDatabase.trust(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })

			o(identityKey).deepEquals(trustDBEntry)
		})

		o(
			"When key verification is not supported the identity key ist loaded from the server and the source of trust is set to Not_Supported",
			async function () {
				const identityKeyGetOut: IdentityKeyGetOut = object()
				identityKeyGetOut.publicIdentityKey = rawEd25519PublicKey
				identityKeyGetOut.publicIdentityKeyVersion = "5"

				const identifier: PublicKeyIdentifier = {
					identifier: "alice@tuta.com",
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				}
				when(identityKeyTrustDatabase.isSupported()).thenReturn(false)
				when(
					serviceExecutor.get(
						IdentityKeyService,
						matchers.argThat((data: IdentityKeyGetIn) => {
							return data.identifier === identifier.identifier && identifier.identifierType === data.identifierType && data.version === null
						}),
					),
				).thenResolve(identityKeyGetOut)

				const trustDBEntry: TrustDBEntry = {
					publicIdentityKey: {
						version: 5,
						object: {
							key: ed25519PublicKey,
							type: SigningKeyPairType.Ed25519,
						},
					},
					sourceOfTrust: IdentityKeySourceOfTrust.Not_Supported,
				}

				const identityKey = await publicIdentityKeyProvider.loadPublicIdentityKey(identifier)

				verify(identityKeyTrustDatabase.getTrustedEntry(matchers.anything()), { times: 0 })
				verify(identityKeyTrustDatabase.trust(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })

				o(identityKey).deepEquals(trustDBEntry)
			},
		)
		o("when identifier is not mail address an error is thrown", async function () {
			const identifier: PublicKeyIdentifier = {
				identifier: "id",
				identifierType: PublicKeyIdentifierType.GROUP_ID,
			}
			await assertThrows(Error, async () => await publicIdentityKeyProvider.loadPublicIdentityKey(identifier))
		})

		o("not found handled gracefully", async function () {
			const identityKeyGetOut: IdentityKeyGetOut = object()
			identityKeyGetOut.publicIdentityKey = rawEd25519PublicKey
			identityKeyGetOut.publicIdentityKeyVersion = "5"
			when(serviceExecutor.get(IdentityKeyService, matchers.anything())).thenReject(new NotFoundError("not found"))
			when(identityKeyTrustDatabase.isSupported()).thenReturn(false)

			const identifier: PublicKeyIdentifier = {
				identifier: "alice@tuta.com",
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
			}
			const identityKey = await publicIdentityKeyProvider.loadPublicIdentityKey(identifier)

			o(identityKey).equals(null)
		})
	})
})
