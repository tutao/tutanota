import o, { assertThrows } from "@tutao/otest"

import { matchers, object, verify, when } from "testdouble"
import {
	Aes256Key,
	bytesToEd25519PublicKey,
	Ed25519PublicKey,
	PublicKeyIdentifier,
	PublicKeyIdentifierType,
	SigningKeyPairType,
} from "../../../../../src/platform-kit/crypto"
import { createTestEntity } from "../../../TestUtils"
import { arrayEquals, hexToUint8Array } from "../../../../../src/platform-kit/utils"
import { IdentityKeySourceOfTrust } from "../../../../../src/platform-kit/app-env"
import * as restError from "../../../../../src/platform-kit/rest-client/error"
import testData from "../../../api/worker/crypto/CompatibilityTestData.json"
import { PublicIdentityKeyProvider } from "../../../../../src/platform-kit/base/base-crypto/PublicIdentityKeyProvider"
import { brandKeyMac, IdentityPubKeyAuthenticationParams, KeyAuthenticationFacade } from "../../../../../src/platform-kit/network/KeyAuthenticationFacade"
import { ServiceExecutor } from "../../../../../src/platform-kit/network/ServiceExecutor.js"

import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { KeyLoaderFacade } from "../../../../../src/platform-kit/base/base-crypto/KeyLoaderFacade"
import { LocalIdentityKeyTrustDatabase } from "../../../../../src/app-kit/local-store/LocalIdentityKeyTrustDatabase"
import { CryptoError } from "../../../../../src/platform-kit/crypto/error"
import { Group, GroupTypeRef, IdentityKeyGetIn, IdentityKeyGetOut, IdentityKeyPair, IdentityKeyService, KeyMacTypeRef } from "@tutao/entities/sys"
import { SYSTEM_GROUP_MAIL_ADDRESS } from "../../../../../src/entities/sys/Utils"
import { TrustDBEntry } from "../../../../../src/platform-kit/base/base-crypto/persistence/IdentityKeyTrustDatabase"
import { elementIdToId, idToElementId, isSameId } from "../../../../../src/platform-kit/meta"

o.spec("PublicIdentityKeyProviderTest", function () {
	let serviceExecutor: ServiceExecutor
	let entityClient: EntityClient
	let keyAuthenticationFacade: KeyAuthenticationFacade
	let keyLoaderFacade: KeyLoaderFacade
	let identityKeyTrustDatabase: LocalIdentityKeyTrustDatabase

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
		when(identityKeyTrustDatabase.isIdentityKeyTrustDatabaseSupported()).thenResolve(true)
	})

	o.spec("loadPublicIdentityKeyFromGroup", function () {
		o("success", async function () {
			const userGroup: Group = object()
			userGroup._id = idToElementId("userGroup")
			const identityKeyPair: IdentityKeyPair = object()
			identityKeyPair.publicEd25519Key = rawEd25519PublicKey
			identityKeyPair.identityKeyVersion = "0"
			const identityPublicKeyMac = brandKeyMac(
				createTestEntity(KeyMacTypeRef, {
					taggedKeyVersion: "0",
					taggingKeyVersion: "1",
					taggingGroup: elementIdToId(userGroup._id),
					tag: object(),
				}),
			)

			const userGroupKey: Aes256Key = object()

			identityKeyPair.publicKeyMac = identityPublicKeyMac
			userGroup.identityKeyPair = identityKeyPair

			when(entityClient.load(GroupTypeRef, matchers.anything())).thenResolve(userGroup)
			when(keyLoaderFacade.loadSymGroupKey(matchers.anything(), matchers.anything())).thenResolve(userGroupKey)

			const actualPublicIdentityKey = await publicIdentityKeyProvider.loadPublicIdentityKeyFromGroup(elementIdToId(userGroup._id))

			o(actualPublicIdentityKey?.object).deepEquals({ key: ed25519PublicKey, type: SigningKeyPairType.Ed25519 })
			verify(
				keyAuthenticationFacade.verifyTag(
					matchers.argThat((params: IdentityPubKeyAuthenticationParams) => {
						return (
							params.tagType === "IDENTITY_PUB_KEY_TAG" &&
							arrayEquals(params.untrustedKey.identityPubKey, ed25519PublicKey) &&
							params.sourceOfTrust.symmetricGroupKey === userGroupKey &&
							isSameId(idToElementId(params.bindingData.groupId), userGroup._id) &&
							String(params.bindingData.groupKeyVersion) === identityPublicKeyMac.taggingKeyVersion &&
							String(params.bindingData.publicIdentityKeyVersion) === identityPublicKeyMac.taggedKeyVersion
						)
					}),
					identityPublicKeyMac.tag,
				),
			)
		})

		o("if the tag does not match, an error is thrown", async function () {
			const userGroup: Group = object()
			userGroup._id = idToElementId("userGroup")
			const identityKeyPair: IdentityKeyPair = object()
			identityKeyPair.publicEd25519Key = rawEd25519PublicKey
			identityKeyPair.identityKeyVersion = "0"
			const identityPublicKeyMac = brandKeyMac(
				createTestEntity(KeyMacTypeRef, {
					taggedKeyVersion: "0",
					taggingKeyVersion: "1",
					taggingGroup: elementIdToId(userGroup._id),
					tag: object(),
				}),
			)

			const userGroupKey: Aes256Key = object()

			identityKeyPair.publicKeyMac = identityPublicKeyMac
			userGroup.identityKeyPair = identityKeyPair

			when(entityClient.load(GroupTypeRef, matchers.anything())).thenResolve(userGroup)
			when(keyLoaderFacade.loadSymGroupKey(matchers.anything(), matchers.anything())).thenResolve(userGroupKey)

			when(keyAuthenticationFacade.verifyTag(matchers.anything(), matchers.anything())).thenThrow(new CryptoError("invalid mac"))

			await assertThrows(CryptoError, async () => publicIdentityKeyProvider.loadPublicIdentityKeyFromGroup(elementIdToId(userGroup._id)))
		})

		o("if the user has no identity key, the method returns null", async function () {
			const userGroup: Group = object()
			userGroup._id = idToElementId("userGroup")
			userGroup.identityKeyPair = null

			when(entityClient.load(GroupTypeRef, matchers.anything())).thenResolve(userGroup)

			const pk = await publicIdentityKeyProvider.loadPublicIdentityKeyFromGroup(elementIdToId(userGroup._id))
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
					null,
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

			verify(serviceExecutor.get(IdentityKeyService, matchers.anything(), null), { times: 0 })
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
				when(identityKeyTrustDatabase.isIdentityKeyTrustDatabaseSupported()).thenResolve(false)
				when(
					serviceExecutor.get(
						IdentityKeyService,
						matchers.argThat((data: IdentityKeyGetIn) => {
							return data.identifier === identifier.identifier && identifier.identifierType === data.identifierType && data.version === null
						}),
						null,
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

		o("return null when identifier is system group mail address", async function () {
			const identifier: PublicKeyIdentifier = {
				identifier: SYSTEM_GROUP_MAIL_ADDRESS,
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
			}
			o(await publicIdentityKeyProvider.loadPublicIdentityKey(identifier)).equals(null)
			verify(identityKeyTrustDatabase.isIdentityKeyTrustDatabaseSupported(), { times: 0 })
			verify(identityKeyTrustDatabase.getTrustedEntry(matchers.anything()), { times: 0 })
			verify(serviceExecutor.get(IdentityKeyService, matchers.anything(), null), { times: 0 })
		})

		o("not found handled gracefully", async function () {
			const identityKeyGetOut: IdentityKeyGetOut = object()
			identityKeyGetOut.publicIdentityKey = rawEd25519PublicKey
			identityKeyGetOut.publicIdentityKeyVersion = "5"
			when(serviceExecutor.get(IdentityKeyService, matchers.anything(), null)).thenReject(new restError.NotFoundError("not found"))
			when(identityKeyTrustDatabase.isIdentityKeyTrustDatabaseSupported()).thenResolve(false)

			const identifier: PublicKeyIdentifier = {
				identifier: "alice@tuta.com",
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
			}
			const identityKey = await publicIdentityKeyProvider.loadPublicIdentityKey(identifier)

			o(identityKey).equals(null)
		})
	})
})
