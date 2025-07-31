import { createIdentityKeyGetIn, GroupTypeRef } from "../../entities/sys/TypeRefs.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { IdentityKeyService } from "../../entities/sys/Services.js"
import { KeyLoaderFacade, parseKeyVersion } from "./KeyLoaderFacade.js"
import { Versioned } from "@tutao/tutanota-utils"
import { IdentityKeySourceOfTrust, PublicKeyIdentifierType } from "../../common/TutanotaConstants.js"
import { NotFoundError } from "../../common/error/RestError.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { bytesToEd25519PublicKey } from "@tutao/tutanota-crypto"
import { SigningKeyPairType, SigningPublicKey } from "./Ed25519Facade"
import { EntityClient } from "../../common/EntityClient"
import { brandKeyMac, KeyAuthenticationFacade } from "./KeyAuthenticationFacade"
import type { PublicKeyIdentifier } from "./PublicEncryptionKeyProvider"
import { IdentityKeyTrustDatabase, TrustDBEntry } from "./IdentityKeyTrustDatabase"

type IdentityKeyRawData = {
	identityKeyVersion: NumberString
	publicIdentityKey: Uint8Array
}

/**
 * Load public identity keys.
 *
 * If a trust database is available:
 * This class implements TOFU and parts of(manual key verification) by fetching identity keys from the database.
 * If a key is not in the database it is fetched from the server and added to the database (TOFU).
 * Thus, an identity key should only be fetched from the server once and then remain stored locally.
 *
 * If no trust database is available keys are just fetched from the server.
 */
export class PublicIdentityKeyProvider {
	constructor(
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly keyAuthenticationFacade: KeyAuthenticationFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly identityKeyTrustDatabase: IdentityKeyTrustDatabase,
	) {}

	/**
	 * Loads the public identity key from the given group id and authenticates the public data
	 * using a symmetric group key. This function should be used whenever we use/display our own
	 * public identity key (user group or shared mail group) and not the identity key of a recipient.
	 *
	 * @param groupId The group to load the identity key for, must be a user group or a shared mail group.
	 * @throws CryptoError in case the MAC tag of the public key cannot be verified.
	 * @return the requested identity key, or null if it is not available.
	 */
	async loadPublicIdentityKeyFromGroup(groupId: Id): Promise<Versioned<SigningPublicKey> | null> {
		const group = await this.entityClient.load(GroupTypeRef, groupId)
		const groupIdentityKeyPair = group.identityKeyPair

		if (!groupIdentityKeyPair) {
			return null
		}

		const publicIdentityKeyMac = brandKeyMac(groupIdentityKeyPair.publicKeyMac)
		const taggingGroupKeyVersion = parseKeyVersion(publicIdentityKeyMac.taggingKeyVersion)

		const identityKey = this.convertFromIdentityKeyRawData({
			publicIdentityKey: groupIdentityKeyPair.publicEd25519Key,
			identityKeyVersion: groupIdentityKeyPair.identityKeyVersion,
		})

		const taggingGroupKey = await this.keyLoaderFacade.loadSymGroupKey(publicIdentityKeyMac.taggingGroup, taggingGroupKeyVersion)

		this.keyAuthenticationFacade.verifyTag(
			{
				tagType: "IDENTITY_PUB_KEY_TAG",
				sourceOfTrust: {
					symmetricGroupKey: taggingGroupKey,
				},
				untrustedKey: { identityPubKey: identityKey.object.key },
				bindingData: {
					publicIdentityKeyVersion: identityKey.version,
					groupKeyVersion: taggingGroupKeyVersion,
					groupId,
				},
			},
			publicIdentityKeyMac.tag,
		)

		return identityKey
	}

	/**
	 *  Loads the public identity key of the mail address from the trust database (if available) or the IdentityKeyService.
	 * @param pubKeyIdentifier a mail address
	 */
	async loadPublicIdentityKey(pubKeyIdentifier: PublicKeyIdentifier): Promise<TrustDBEntry | null> {
		if (pubKeyIdentifier.identifierType !== PublicKeyIdentifierType.MAIL_ADDRESS) {
			// users should load their own identity keys by loading the group not by using the identityKeyService
			// see this.loadPublicIdentityKeyFromGroup
			throw new Error("currently identity keys must be loaded via mail address")
		}
		if (await this.identityKeyTrustDatabase.isIdentityKeyTrustDatabaseSupported()) {
			const trustedIdentity = await this.identityKeyTrustDatabase.getTrustedEntry(pubKeyIdentifier.identifier)
			if (trustedIdentity != null) {
				return trustedIdentity
			}
		}

		const requestData = createIdentityKeyGetIn({
			version: null,
			identifier: pubKeyIdentifier.identifier,
			identifierType: pubKeyIdentifier.identifierType,
		})

		try {
			const identityKeyGetOut = await this.serviceExecutor.get(IdentityKeyService, requestData)
			const identityKeyFromServer = this.convertFromIdentityKeyRawData({
				publicIdentityKey: identityKeyGetOut.publicIdentityKey,
				identityKeyVersion: identityKeyGetOut.publicIdentityKeyVersion,
			})
			if (await this.identityKeyTrustDatabase.isIdentityKeyTrustDatabaseSupported()) {
				return this.identityKeyTrustDatabase.trust(pubKeyIdentifier.identifier, identityKeyFromServer, IdentityKeySourceOfTrust.TOFU)
			} else {
				return {
					publicIdentityKey: identityKeyFromServer,
					sourceOfTrust: IdentityKeySourceOfTrust.Not_Supported,
				}
			}
		} catch (e) {
			if (e instanceof NotFoundError) {
				return null
			} else {
				throw e
			}
		}
	}

	private convertFromIdentityKeyRawData(identityKeyRawData: IdentityKeyRawData): Versioned<SigningPublicKey> {
		const publicIdentityKey = bytesToEd25519PublicKey(identityKeyRawData.publicIdentityKey)
		const identityKeyVersion = parseKeyVersion(identityKeyRawData.identityKeyVersion)
		return {
			version: identityKeyVersion,
			object: {
				type: SigningKeyPairType.Ed25519,
				key: publicIdentityKey,
			},
		}
	}
}
