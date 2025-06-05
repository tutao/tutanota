import { createIdentityKeyGetIn, GroupTypeRef } from "../../entities/sys/TypeRefs.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { IdentityKeyService } from "../../entities/sys/Services.js"
import { KeyLoaderFacade, parseKeyVersion } from "./KeyLoaderFacade.js"
import { lazyAsync, Versioned } from "@tutao/tutanota-utils"
import { PublicKeyIdentifierType } from "../../common/TutanotaConstants.js"
import { NotFoundError } from "../../common/error/RestError.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { bytesToEd25519PublicKey } from "@tutao/tutanota-crypto"
import { SigningKeyPairType, SigningPublicKey } from "./Ed25519Facade"
import { EntityClient } from "../../common/EntityClient"
import { brandKeyMac, KeyAuthenticationFacade } from "./KeyAuthenticationFacade"
import { KeyVerificationFacade } from "./lazy/KeyVerificationFacade"
import type { PublicKeyIdentifier } from "./PublicEncryptionKeyProvider"
import { SqlCipherFacade } from "../../../native/common/generatedipc/SqlCipherFacade"

type IdentityKeyRawData = {
	identityKeyVersion: NumberString
	publicIdentityKey: Uint8Array
}

/**
 * Load public identity keys.
 * Handle key versioning.
 */
export class PublicIdentityKeyProvider {
	constructor(
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly keyAuthenticationFacade: KeyAuthenticationFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly sqlCipherFacade: SqlCipherFacade,
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
	 *  Loads the public identity key of
	 * @param pubKeyIdentifier
	 */
	async loadPublicIdentityKey(pubKeyIdentifier: PublicKeyIdentifier): Promise<Versioned<SigningPublicKey> | null> {
		// if (pubKeyIdentifier.identifierType !== PublicKeyIdentifierType.MAIL_ADDRESS) {
		// 	// users should load their own identity keys by loading the group not by using the identityKeyService
		// 	// see this.loadPublicIdentityKeyFromGroup
		// 	throw new Error("currently identity keys must be loaded via mail address")
		// }
		// const keyVerificationFacade = await this.lazyKeyVerificationFacade()
		// if (await keyVerificationFacade.isSupported()) {
		// 	const trustedIdentity = await keyVerificationFacade.getTrustedIdentity(pubKeyIdentifier.identifier)
		// 	if (trustedIdentity != null) {
		// 		return trustedIdentity.publicIdentityKey
		// 	}
		// }

		const requestData = createIdentityKeyGetIn({
			version: null,
			identifier: pubKeyIdentifier.identifier,
			identifierType: pubKeyIdentifier.identifierType,
		})

		try {
			const identityKeyGetOut = await this.serviceExecutor.get(IdentityKeyService, requestData)
			return this.convertFromIdentityKeyRawData({
				publicIdentityKey: identityKeyGetOut.publicIdentityKey,
				identityKeyVersion: identityKeyGetOut.publicIdentityKeyVersion,
			})
		} catch (e) {
			if (e instanceof NotFoundError) {
				return null
			} else {
				throw e
			}
		}
	}

	convertFromIdentityKeyRawData(identityKeyRawData: IdentityKeyRawData): Versioned<SigningPublicKey> {
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
