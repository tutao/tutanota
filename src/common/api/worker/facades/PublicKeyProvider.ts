import { createPublicKeyGetIn, GroupTypeRef, PubDistributionKey, PublicKeyGetOut, type SystemKeysReturn } from "../../entities/sys/TypeRefs.js"
import { IServiceExecutor } from "../../common/ServiceRequest.js"
import { PublicKeyService } from "../../entities/sys/Services.js"
import { KeyLoaderFacade, parseKeyVersion } from "./KeyLoaderFacade.js"
import { uint8ArrayToHex, Versioned } from "@tutao/tutanota-utils"
import { PublicKeyIdentifierType } from "../../common/TutanotaConstants.js"
import { KeyVersion } from "@tutao/tutanota-utils/dist/Utils.js"
import { InvalidDataError } from "../../common/error/RestError.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import {
	bytesToKyberPublicKey,
	EncryptedPqKeyPairs,
	hexToRsaPublicKey,
	isVersionedPqPublicKey,
	isVersionedRsaOrRsaX25519PublicKey,
	KeyPairType,
	PQPublicKeys,
	PublicKey,
	RsaX25519PublicKey,
} from "@tutao/tutanota-crypto"
import { SigningPublicKey } from "./Ed25519Facade"
import { EntityClient } from "../../common/EntityClient"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { brandKeyMac, KeyAuthenticationFacade } from "./KeyAuthenticationFacade"

export type PublicKeyIdentifier = {
	identifier: string
	identifierType: PublicKeyIdentifierType
}

type PublicKeyRawData = {
	pubKeyVersion: NumberString
	pubEccKey: null | Uint8Array
	pubKyberKey: null | Uint8Array
	pubRsaKey: null | Uint8Array
}

/**
 * Load public keys.
 * Handle key versioning.
 */
export class PublicKeyProvider {
	constructor(
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly keyAuthenticationFacade: KeyAuthenticationFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
	) {}

	/**
	 * Loads the public identity key from the given group and id assuming that there is an identity key.
	 * Authenticates the public data using the symmetric group key.
	 *
	 * @param groupId The group to load the identity key for, must be a user group or a shared mail group.

	 * @throws CryptoError in case the MAC tag of the public key cannot be verified.
	 * @return the requested identity key, or null if it is not available.
	 */
	async loadPublicIdentityKeyFromGroup(groupId: Id): Promise<SigningPublicKey | null> {
		const group = await this.entityClient.load(GroupTypeRef, groupId)

		if (!group.identityKeyPair) {
			return null
		}
		const publicIdentityKey = group.identityKeyPair.publicEd25519Key
		const publicIdentityKeyMac = brandKeyMac(group.identityKeyPair.publicKeyMac)
		const identityKeyVersion = parseKeyVersion(group.identityKeyPair.identityKeyVersion)
		const taggingGroupKeyVersion = parseKeyVersion(publicIdentityKeyMac.taggingKeyVersion)

		const taggingGroupKey = await this.keyLoaderFacade.loadSymGroupKey(publicIdentityKeyMac.taggingGroup, taggingGroupKeyVersion)

		this.keyAuthenticationFacade.verifyTag(
			{
				tagType: "IDENTITY_PUB_KEY_TAG",
				sourceOfTrust: {
					symmetricGroupKey: taggingGroupKey,
				},
				untrustedKey: { identityPubKey: publicIdentityKey },
				bindingData: {
					publicIdentityKeyVersion: identityKeyVersion,
					groupKeyVersion: taggingGroupKeyVersion,
					groupId,
				},
			},
			publicIdentityKeyMac.tag,
		)
		return publicIdentityKey
	}

	async loadCurrentPubKey(pubKeyIdentifier: PublicKeyIdentifier): Promise<Versioned<PublicKey>> {
		return this.loadPubKey(pubKeyIdentifier, null)
	}

	async loadPubKey(pubKeyIdentifier: PublicKeyIdentifier, version: KeyVersion | null): Promise<Versioned<PublicKey>> {
		const requestData = createPublicKeyGetIn({
			version: version ? String(version) : null,
			identifier: pubKeyIdentifier.identifier,
			identifierType: pubKeyIdentifier.identifierType,
		})
		const publicKeyGetOut = await this.serviceExecutor.get(PublicKeyService, requestData)
		const pubKeys = this.convertFromPublicKeyGetOut(publicKeyGetOut)
		this.enforceRsaKeyVersionConstraint(pubKeys)
		if (version != null && pubKeys.version !== version) {
			throw new InvalidDataError("the server returned a key version that was not requested")
		}
		return pubKeys
	}

	/**
	 * RSA keys were only created before introducing key versions, i.e. they always have version 0.
	 *
	 * Receiving a higher version would indicate a protocol downgrade/ MITM attack, and we reject such keys.
	 */
	private enforceRsaKeyVersionConstraint(pubKeys: Versioned<PublicKey>) {
		if (pubKeys.version !== 0 && isVersionedRsaOrRsaX25519PublicKey(pubKeys)) {
			throw new CryptoError("rsa key in a version that is not 0")
		}
	}

	/// Public key converter

	public convertFromPublicKeyGetOut(publicKeys: PublicKeyGetOut): Versioned<PublicKey> {
		return this.convertFromPublicKeyRawData({
			pubRsaKey: publicKeys.pubRsaKey,
			pubEccKey: publicKeys.pubEccKey,
			pubKyberKey: publicKeys.pubKyberKey,
			pubKeyVersion: publicKeys.pubKeyVersion,
		})
	}

	public convertFromSystemKeysReturn(publicKeys: SystemKeysReturn): Versioned<PublicKey> {
		return this.convertFromPublicKeyRawData({
			pubRsaKey: publicKeys.systemAdminPubRsaKey,
			pubEccKey: publicKeys.systemAdminPubEccKey,
			pubKyberKey: publicKeys.systemAdminPubKyberKey,
			pubKeyVersion: publicKeys.systemAdminPubKeyVersion,
		})
	}

	/**
	 * Converts some form of public PQ keys to the PQPublicKeys type. Assumes pubEccKey and pubKyberKey exist.
	 * @param kp
	 * @param pubKeyVersion
	 */
	public convertFromEncryptedPqKeyPairs(kp: EncryptedPqKeyPairs, pubKeyVersion: KeyVersion): Versioned<PQPublicKeys> {
		const publicKey = this.convertFromPublicKeyRawData({
			pubRsaKey: null,
			pubEccKey: kp.pubEccKey,
			pubKyberKey: kp.pubKyberKey,
			pubKeyVersion: pubKeyVersion.toString(),
		})
		if (isVersionedPqPublicKey(publicKey)) {
			return publicKey
		} else {
			throw new Error("Cannot convert EncryptedPqKeyPairs to PQPublicKeys")
		}
	}

	/**
	 * Converts some form of public PQ keys to the PQPublicKeys type. Assumes pubEccKey and pubKyberKey exist.
	 * @param kp
	 * @param pubKeyVersion
	 */
	public convertFromPubDistributionKey(pubDistributionKey: PubDistributionKey): Versioned<PQPublicKeys> {
		const publicKey = this.convertFromPublicKeyRawData({
			pubRsaKey: null,
			pubEccKey: pubDistributionKey.pubEccKey,
			pubKyberKey: pubDistributionKey.pubKyberKey,
			pubKeyVersion: "0", // for distribution keys the version is always 0 because they are only used for the rotation and never rotated.
		})
		if (isVersionedPqPublicKey(publicKey)) {
			return publicKey
		} else {
			throw new Error("Cannot convert PubDistributionKey to PQPublicKeys")
		}
	}

	private convertFromPublicKeyRawData(publicKeys: PublicKeyRawData): Versioned<PublicKey> {
		const version = parseKeyVersion(publicKeys.pubKeyVersion)
		// const version = Number(publicKeys.pubKeyVersion)
		if (publicKeys.pubRsaKey) {
			if (publicKeys.pubEccKey) {
				const eccPublicKey = publicKeys.pubEccKey
				const rsaPublicKey = hexToRsaPublicKey(uint8ArrayToHex(publicKeys.pubRsaKey))
				const rsaEccPublicKey: RsaX25519PublicKey = Object.assign(rsaPublicKey, {
					keyPairType: KeyPairType.RSA_AND_X25519,
					publicEccKey: eccPublicKey,
				})
				return {
					version,
					object: rsaEccPublicKey,
				}
			} else {
				return {
					version,
					object: hexToRsaPublicKey(uint8ArrayToHex(publicKeys.pubRsaKey)),
				}
			}
		} else if (publicKeys.pubKyberKey && publicKeys.pubEccKey) {
			const eccPublicKey = publicKeys.pubEccKey
			const kyberPublicKey = bytesToKyberPublicKey(publicKeys.pubKyberKey)
			const pqPublicKey: PQPublicKeys = {
				keyPairType: KeyPairType.TUTA_CRYPT,
				x25519PublicKey: eccPublicKey,
				kyberPublicKey,
			}
			return {
				version,
				object: pqPublicKey,
			}
		} else {
			throw new Error("Inconsistent public key")
		}
	}
}
