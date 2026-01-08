import { PublicKeyIdentifierType } from "../../common/TutanotaConstants.js"
import { assertNotNull, KeyVersion, lazyAsync } from "@tutao/tutanota-utils"
import { Group, PubEncKeyData, UserTypeRef } from "../../entities/sys/TypeRefs.js"
import { EntityClient } from "../../common/EntityClient.js"
import { assertWorkerOrNode } from "../../common/Env.js"
import { UserFacade } from "./UserFacade.js"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"
import { KeyLoaderFacade, parseKeyVersion } from "./KeyLoaderFacade.js"
import { CacheManagementFacade } from "./lazy/CacheManagementFacade.js"
import { CryptoWrapper, VersionedEncryptedKey, VersionedKey } from "../crypto/CryptoWrapper.js"
import { AsymmetricCryptoFacade } from "../crypto/AsymmetricCryptoFacade.js"
import { AesKey } from "@tutao/tutanota-crypto"
import { brandKeyMac, KeyAuthenticationFacade } from "./KeyAuthenticationFacade.js"
import { TutanotaError } from "@tutao/tutanota-error"

assertWorkerOrNode()

export class AdminKeyLoaderFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly cacheManagementFacade: lazyAsync<CacheManagementFacade>,
		private readonly asymmetricCryptoFacade: AsymmetricCryptoFacade,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly keyAuthenticationFacade: KeyAuthenticationFacade,
	) {}

	async getGroupKeyViaUser(groupId: Id, version: KeyVersion, viaUser: Id): Promise<AesKey> {
		const currentGroupKey = await this.getCurrentGroupKeyViaUser(groupId, viaUser)
		return this.keyLoaderFacade.loadSymGroupKey(groupId, version, currentGroupKey)
	}

	/**
	 * Get a group key for any group we are admin and know some member of.
	 *
	 * Unlike {@link getCurrentGroupKeyViaAdminEncGKey} this should work for any group because we will actually go a "long" route of decrypting userGroupKey of the
	 * member and decrypting group key with that.
	 */
	async getCurrentGroupKeyViaUser(groupId: Id, viaUser: Id): Promise<VersionedKey> {
		const user = await this.entityClient.load(UserTypeRef, viaUser)
		const membership = user.memberships.find((m) => m.group === groupId)
		if (membership == null) {
			throw new Error(`User doesn't have this group membership! User: ${viaUser} groupId: ${groupId}`)
		}
		const requiredUserGroupKeyVersion = membership.symKeyVersion
		const requiredUserGroupKey = await this.getGroupKeyViaAdminEncGKey(user.userGroup.group, parseKeyVersion(requiredUserGroupKeyVersion))

		const key = this.cryptoWrapper.decryptKey(requiredUserGroupKey, membership.symEncGKey)
		const version = parseKeyVersion(membership.groupKeyVersion)

		return { object: key, version }
	}

	async getGroupKeyViaAdminEncGKey(groupId: Id, version: KeyVersion): Promise<AesKey> {
		if (this.userFacade.hasGroup(groupId)) {
			// e.g. I am a global admin and want to add another user to the global admin group
			return this.keyLoaderFacade.loadSymGroupKey(groupId, version)
		} else {
			const currentGroupKey = await this.getCurrentGroupKeyViaAdminEncGKey(groupId)
			return this.keyLoaderFacade.loadSymGroupKey(groupId, version, currentGroupKey)
		}
	}

	/**
	 * @returns true if the group currently has an adminEncGKey. This may be an asymmetrically encrypted one.
	 */
	hasAdminEncGKey(group: Group) {
		return (group.adminGroupEncGKey != null && group.adminGroupEncGKey.length !== 0) || group.pubAdminGroupEncGKey != null
	}

	/**
	 * Get a group key for certain group types.
	 *
	 * Some groups (e.g. user groups or shared mailboxes) have adminGroupEncGKey set on creation. For those groups we can fairly easily get a group key without
	 * decrypting userGroupKey of some member of that group.
	 */
	async getCurrentGroupKeyViaAdminEncGKey(groupId: Id): Promise<VersionedKey> {
		if (this.userFacade.hasGroup(groupId)) {
			// e.g. I am a global admin and want to add another user to the global admin group
			// or I am an admin and I am a member of the target group (eg: shared mailboxes)
			return this.keyLoaderFacade.getCurrentSymGroupKey(groupId)
		} else {
			const group = await (await this.cacheManagementFacade()).reloadGroup(groupId)
			if (!this.hasAdminEncGKey(group)) {
				throw new ProgrammingError("Group doesn't have adminGroupEncGKey, you can't get group key this way")
			}
			if (!(group.admin && this.userFacade.hasGroup(group.admin))) {
				throw new Error(`The user is not a member of the admin group ${group.admin} when trying to get the group key for group ${groupId}`)
			}

			// e.g. I am a member of the group that administrates group G and want to add a new member to G
			const requiredAdminKeyVersion = parseKeyVersion(group.adminGroupKeyVersion ?? "0")
			if (group.adminGroupEncGKey != null) {
				return await this.decryptViaSymmetricAdminGKey(
					group,
					{
						key: group.adminGroupEncGKey,
						encryptingKeyVersion: requiredAdminKeyVersion,
					},
					parseKeyVersion(group.groupKeyVersion),
				)
			} else {
				// assume that the group is a userGroup. otherwise pubAdminGroupEncGKey cannot be set
				return await this.decryptViaAsymmetricAdminGKey(group, assertNotNull(group.pubAdminGroupEncGKey))
			}
		}
	}

	private async decryptViaSymmetricAdminGKey(group: Group, encryptedGroupKey: VersionedEncryptedKey, encryptedKeyVersion: KeyVersion): Promise<VersionedKey> {
		const requiredAdminGroupKey = await this.keyLoaderFacade.loadSymGroupKey(assertNotNull(group.admin), encryptedGroupKey.encryptingKeyVersion)
		const decryptedKey = this.cryptoWrapper.decryptKey(requiredAdminGroupKey, encryptedGroupKey.key)
		return { object: decryptedKey, version: encryptedKeyVersion }
	}

	/**
	 * @param userGroup the group for which we are trying to get the key
	 * @param pubAdminEncUserKeyData some version of the group key encrypted with some version of the public admin group key. This can be the current one from the group or one of the former group keys.
	 * @private
	 */
	private async decryptViaAsymmetricAdminGKey(userGroup: Group, pubAdminEncUserKeyData: PubEncKeyData): Promise<VersionedKey> {
		const requiredAdminGroupKeyPair = await this.keyLoaderFacade.loadKeypair(
			assertNotNull(userGroup.admin),
			parseKeyVersion(pubAdminEncUserKeyData.recipientKeyVersion),
		)
		const decryptedUserGroupKey = (
			await this.asymmetricCryptoFacade.decryptSymKeyWithKeyPairAndAuthenticate(requiredAdminGroupKeyPair, pubAdminEncUserKeyData, {
				identifier: userGroup._id,
				identifierType: PublicKeyIdentifierType.GROUP_ID,
			})
		).decryptedAesKey

		// this function is called recursively. therefore we must not return the group key version from the group but from the pubAdminEncUserKeyData
		const versionedDecryptedUserGroupKey = {
			object: decryptedUserGroupKey,
			version: parseKeyVersion(assertNotNull(pubAdminEncUserKeyData.symKeyMac).taggedKeyVersion),
		}

		await this.verifyUserGroupKeyMac(pubAdminEncUserKeyData, userGroup, versionedDecryptedUserGroupKey)

		return versionedDecryptedUserGroupKey
	}

	private async verifyUserGroupKeyMac(pubEncKeyData: PubEncKeyData, userGroup: Group, receivedUserGroupKey: VersionedKey) {
		const givenUserGroupKeyMac = brandKeyMac(assertNotNull(pubEncKeyData.symKeyMac))

		// The given mac is authenticated by the previous user group key, so we can get the version from there.
		const previousUserGroupKeyVersion = parseKeyVersion(givenUserGroupKeyMac.taggingKeyVersion)
		const recipientAdminGroupKeyVersion = parseKeyVersion(pubEncKeyData.recipientKeyVersion)

		// get previous user group key: ag1 -> ag0 -> ug0
		const formerGroupKey = await this.keyLoaderFacade.loadFormerGroupKeyInstance(userGroup, previousUserGroupKeyVersion)
		let previousUserGroupKey: VersionedKey
		if (formerGroupKey.adminGroupEncGKey != null) {
			previousUserGroupKey = await this.decryptViaSymmetricAdminGKey(
				userGroup,
				{
					key: formerGroupKey.adminGroupEncGKey,
					encryptingKeyVersion: parseKeyVersion(assertNotNull(formerGroupKey.adminGroupKeyVersion)),
				},
				previousUserGroupKeyVersion,
			)
		} else if (formerGroupKey.pubAdminGroupEncGKey != null) {
			const userGroupKeyMac = assertNotNull(formerGroupKey.pubAdminGroupEncGKey.symKeyMac)
			// recurse, but expect to hit the end _before_ version 0, which should always be symmetrically encrypted
			if (userGroupKeyMac.taggedKeyVersion === "0") {
				throw new TutanotaError("UserGroupKeyNotTrustedError", "cannot establish trust on the user group key")
			}
			previousUserGroupKey = await this.decryptViaAsymmetricAdminGKey(userGroup, formerGroupKey.pubAdminGroupEncGKey)
		} else {
			throw new TutanotaError("MissingAdminEncGroupKeyError", "cannot verify user group key")
		}

		this.keyAuthenticationFacade.verifyTag(
			{
				tagType: "USER_GROUP_KEY_TAG",
				sourceOfTrust: { currentUserGroupKey: previousUserGroupKey.object },
				untrustedKey: { newUserGroupKey: receivedUserGroupKey.object },
				bindingData: {
					userGroupId: userGroup._id,
					adminGroupId: assertNotNull(userGroup.admin),
					currentUserGroupKeyVersion: previousUserGroupKey.version,
					newUserGroupKeyVersion: receivedUserGroupKey.version,
					newAdminGroupKeyVersion: recipientAdminGroupKeyVersion,
				},
			},
			givenUserGroupKeyMac.tag,
		)
	}
}
