import { GroupType } from "../../../common/TutanotaConstants.js"
import { assertNotNull, Versioned } from "@tutao/tutanota-utils"
import { createIdentityKeyPair, createIdentityKeyPostIn, createKeyMac, GroupTypeRef } from "../../../entities/sys/TypeRefs.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { IdentityKeyService } from "../../../entities/sys/Services.js"
import { UserFacade } from "../UserFacade.js"
import { KeyLoaderFacade } from "../KeyLoaderFacade.js"
import { CacheManagementFacade } from "./CacheManagementFacade.js"
import { CryptoWrapper, VersionedKey } from "../../crypto/CryptoWrapper.js"
import { AsymmetricCryptoFacade } from "../../crypto/AsymmetricCryptoFacade.js"
import { AsymmetricKeyPair, KeyPairType } from "@tutao/tutanota-crypto"
import { KeyAuthenticationFacade } from "../KeyAuthenticationFacade.js"
import { Ed25519Facade } from "../Ed25519Facade"
import { PublicKeySignatureFacade } from "../PublicKeySignatureFacade"
import { AdminKeyLoaderFacade } from "../AdminKeyLoaderFacade"
import { ProgrammingError } from "../../../common/error/ProgrammingError"

assertWorkerOrNode()

export class IdentityKeyCreator {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly adminKeyLoaderFacade: AdminKeyLoaderFacade,
		private readonly cacheManagementFacade: CacheManagementFacade,
		private readonly asymmetricCryptoFacade: AsymmetricCryptoFacade,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly keyAuthenticationFacade: KeyAuthenticationFacade,
		private readonly ed25519Facade: Ed25519Facade,
		private readonly publicKeySignatureFacade: PublicKeySignatureFacade,
	) {}

	/**
	 * Creates an identity key pair for the given group.
	 * Encrypts the private key with the passed encryptingKey or the group key and tags the public key with the group key.
	 * @param currentKeyPairToBeSigned MUST be an RSA+ECC or TutaCrypt key pair
	 * @param formerKeyPairsToBeSigned the former key pairs may include RSA key pairs
	 * @param groupId the caller is responsible to make sure the group is updated in the cache
	 * @param encryptingKey the key to encrypt the private key. by default the current group key is used.
	 *        this is useful in case group members must not have access to the private key.
	 */
	async createIdentityKeyPair(
		groupId: Id,
		currentKeyPairToBeSigned: Versioned<AsymmetricKeyPair>,
		formerKeyPairsToBeSigned: Versioned<AsymmetricKeyPair>[],
		encryptingKey: VersionedKey | undefined = undefined,
	): Promise<void> {
		if (currentKeyPairToBeSigned.object.keyPairType === KeyPairType.RSA) {
			throw new ProgrammingError("Must convert a current RSA key pair into an RSA_ECC key pair before signing")
		}
		const newEd25519IdentityKeyPair = await this.ed25519Facade.generateKeypair()
		const currentGroupKey = await this.adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)
		if (encryptingKey == null) {
			// by default, we encrypt the private identity key with the group key.
			encryptingKey = currentGroupKey
		}
		const encPrivateIdentityKey = this.cryptoWrapper.encryptEd25519Key(encryptingKey, newEd25519IdentityKeyPair.private_key)
		const identityKeyVersion = 0

		let tag = this.keyAuthenticationFacade.computeTag({
			tagType: "IDENTITY_PUB_KEY_TAG",
			sourceOfTrust: { symmetricGroupKey: currentGroupKey.object },
			untrustedKey: { identityPubKey: newEd25519IdentityKeyPair.public_key },
			bindingData: {
				publicIdentityKeyVersion: identityKeyVersion,
				groupKeyVersion: currentGroupKey.version,
				groupId,
			},
		})
		const identityKeyPair = createIdentityKeyPair({
			identityKeyVersion: identityKeyVersion.toString(),
			encryptingKeyVersion: encPrivateIdentityKey.encryptingKeyVersion.toString(),
			privateEd25519Key: encPrivateIdentityKey.key,
			publicEd25519Key: this.cryptoWrapper.ed25519PublicKeyToBytes(newEd25519IdentityKeyPair.public_key),
			publicKeyMac: createKeyMac({
				taggedKeyVersion: identityKeyVersion.toString(),
				taggingKeyVersion: currentGroupKey.version.toString(),
				taggingGroup: groupId,
				tag,
			}),
		})

		//sign the public encryption keys (current and former group keys) and store the signature in the signature field
		const signatures = [
			await this.publicKeySignatureFacade.signPublicKey(currentKeyPairToBeSigned, {
				object: newEd25519IdentityKeyPair.private_key,
				version: identityKeyVersion,
			}),
		]
		for (const formerKeyPair of formerKeyPairsToBeSigned) {
			signatures.push(
				await this.publicKeySignatureFacade.signPublicKey(formerKeyPair, {
					object: newEd25519IdentityKeyPair.private_key,
					version: identityKeyVersion,
				}),
			)
		}
		// Do not try to re-create the key pair in case it already exists
		// We check down here to make race conditions less likely.
		const group = await this.entityClient.load(GroupTypeRef, groupId)
		if (group.identityKeyPair != null) {
			console.log(`Identity key pair already exists. Did not create it again for group: ${groupId}`)
			return
		}
		await this.serviceExecutor.post(
			IdentityKeyService,
			createIdentityKeyPostIn({
				identityKeyPair,
				signatures,
			}),
		)
	}

	async createIdentityKeyPairForExistingUsers(): Promise<void> {
		const userGroupId = this.userFacade.getUserGroupId()

		let currentKeyPairs = await this.keyLoaderFacade.loadCurrentKeyPair(userGroupId)
		await this.asymmetricCryptoFacade.getOrMakeSenderX25519KeyPair(currentKeyPairs.object, userGroupId)
		const userGroup = await this.cacheManagementFacade.reloadGroup(userGroupId)
		currentKeyPairs = await this.keyLoaderFacade.loadCurrentKeyPair(userGroupId)

		//we do not need to pass a group key because the user is member of the group
		const formerKeyPairs = await this.keyLoaderFacade.loadAllFormerKeyPairs(userGroup)

		await this.createIdentityKeyPair(userGroupId, currentKeyPairs, formerKeyPairs)
	}

	/**
	 * Creates identity key pairs for each team group of the customer. Private keys are encrypted with the admin group key.
	 *
	 * NOTE: does nothing if the user is not an admin.
	 */
	async createIdentityKeyPairForExistingTeamGroups(teamGroupIds: Id[]) {
		const user = assertNotNull(this.userFacade.getUser(), "User not available when trying to create identity keys for existing shared mailboxes")

		const adminGroupMembership = assertNotNull(
			user.memberships.find((m) => m.groupType === GroupType.Admin),
			"Only admin users can create identity keys for team groups",
		)

		const adminGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(adminGroupMembership.group)

		for (const groupId of teamGroupIds) {
			try {
				// it can be the case that some groups already have an identity key, so we check first
				let group = await this.entityClient.load(GroupTypeRef, groupId)
				if (group.identityKeyPair) continue

				// shared mailbox group members don't need access to identity keys, that's the responsibility of the admins
				//if we have an RSA only keypair we generate the ecc key now so we do not have to sign again
				const currentGroupKey = await this.adminKeyLoaderFacade.getCurrentGroupKeyViaAdminEncGKey(groupId)

				let currentKeyPair = await this.keyLoaderFacade.loadCurrentKeyPair(groupId, currentGroupKey)
				await this.asymmetricCryptoFacade.getOrMakeSenderX25519KeyPair(currentKeyPair.object, groupId)
				group = await this.cacheManagementFacade.reloadGroup(groupId)
				currentKeyPair = await this.keyLoaderFacade.loadCurrentKeyPair(groupId, currentGroupKey)

				const formerKeyPairs = await this.keyLoaderFacade.loadAllFormerKeyPairs(group, currentGroupKey)
				await this.createIdentityKeyPair(groupId, currentKeyPair, formerKeyPairs, adminGroupKey)
			} catch (error) {
				console.log(`error when creating shared mailbox identity key pair for group ${groupId}`, error)
				throw error
			}
		}
	}
}
