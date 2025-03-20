import {
	assertNotNull,
	Base64,
	base64ToUint8Array,
	downcast,
	isSameTypeRef,
	lazy,
	neverNull,
	ofClass,
	promiseMap,
	stringToUtf8Uint8Array,
	TypeRef,
	uint8ArrayToBase64,
	Versioned,
} from "@tutao/tutanota-utils"
import {
	AccountType,
	asCryptoProtoocolVersion,
	assertEnumValue,
	BucketPermissionType,
	CryptoProtocolVersion,
	EncryptionAuthStatus,
	GroupType,
	PublicKeyIdentifierType,
	SYSTEM_GROUP_MAIL_ADDRESS,
} from "../../common/TutanotaConstants"
import { HttpMethod, resolveTypeReference } from "../../common/EntityFunctions"
import type { BucketPermission, GroupMembership, InstanceSessionKey, Permission } from "../../entities/sys/TypeRefs.js"
import {
	BucketPermissionTypeRef,
	createInstanceSessionKey,
	createUpdatePermissionKeyData,
	GroupInfoTypeRef,
	GroupTypeRef,
	PermissionTypeRef,
	PushIdentifierTypeRef,
} from "../../entities/sys/TypeRefs.js"
import {
	Contact,
	ContactTypeRef,
	createEncryptTutanotaPropertiesData,
	createInternalRecipientKeyData,
	createSymEncInternalRecipientKeyData,
	File,
	FileTypeRef,
	InternalRecipientKeyData,
	Mail,
	MailTypeRef,
	SymEncInternalRecipientKeyData,
	TutanotaPropertiesTypeRef,
} from "../../entities/tutanota/TypeRefs.js"
import { LockedError, NotFoundError, PayloadTooLargeError, TooManyRequestsError } from "../../common/error/RestError"
import { SessionKeyNotFoundError } from "../../common/error/SessionKeyNotFoundError"
import { birthdayToIsoDate, oldBirthdayToBirthday } from "../../common/utils/BirthdayUtils"
import type { EncryptedParsedInstance, Entity, ParsedInstance, SomeEntity, TypeModel } from "../../common/EntityTypes"
import { assertWorkerOrNode } from "../../common/Env"
import type { EntityClient } from "../../common/EntityClient"
import { RestClient } from "../rest/RestClient"
import { Aes256Key, aes256RandomKey, aesEncrypt, AesKey, decryptKey, EccPublicKey, encryptKey, isPqKeyPairs, sha256Hash } from "@tutao/tutanota-crypto"
import { RecipientNotResolvedError } from "../../common/error/RecipientNotResolvedError"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { EncryptTutanotaPropertiesService } from "../../entities/tutanota/Services"
import { UpdatePermissionKeyService } from "../../entities/sys/Services"
import { UserFacade } from "../facades/UserFacade"
import { elementIdPart, getElementId, getListId, isSameId } from "../../common/utils/EntityUtils.js"
import { OwnerEncSessionKeysUpdateQueue } from "./OwnerEncSessionKeysUpdateQueue.js"
import { DefaultEntityRestCache } from "../rest/DefaultEntityRestCache.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { KeyLoaderFacade, parseKeyVersion } from "../facades/KeyLoaderFacade.js"
import { encryptKeyWithVersionedKey, VersionedEncryptedKey, VersionedKey } from "./CryptoWrapper.js"
import { AsymmetricCryptoFacade } from "./AsymmetricCryptoFacade.js"
import { PublicKeyProvider, PublicKeys } from "../facades/PublicKeyProvider.js"
import { KeyVersion, Nullable } from "@tutao/tutanota-utils/dist/Utils.js"
import { KeyRotationFacade } from "../facades/KeyRotationFacade.js"
import { InstanceWrapper } from "./InstanceWrapper"
import { AttributeModel } from "../../common/AttributeModel"
import { typeRefToRestPath } from "../rest/EntityRestClient"
import { InstancePipeline } from "./InstancePipeline"

assertWorkerOrNode()

type ResolvedSessionKeys = {
	resolvedSessionKeyForInstance: AesKey
	instanceSessionKeys: Array<InstanceSessionKey>
}

export class CryptoFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly restClient: RestClient,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly instancePipeline: InstancePipeline,
		private readonly ownerEncSessionKeysUpdateQueue: OwnerEncSessionKeysUpdateQueue,
		private readonly cache: DefaultEntityRestCache | null,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly asymmetricCryptoFacade: AsymmetricCryptoFacade,
		private readonly publicKeyProvider: PublicKeyProvider,
		private readonly keyRotationFacade: lazy<KeyRotationFacade>,
	) {}

	async resolveSessionKeyForInstance(instance: SomeEntity): Promise<AesKey | null> {
		const typeModel = await resolveTypeReference(instance._type)
		if (!typeModel.encrypted) {
			return null
		}
		const parsedInstance = await this.instancePipeline.modelMapper.applyServerModel(instance._type, instance)
		const instanceWrapper = await InstanceWrapper.fromParsedInstance(this.instancePipeline, typeModel, parsedInstance)
		return this.resolveSessionKey(instanceWrapper)
	}

	/** Resolve a session key an {@param instance} using an already known {@param ownerKey}. */
	resolveSessionKeyWithOwnerKey(ownerEncSessionKey: Uint8Array, ownerKey: AesKey): AesKey {
		return decryptKey(ownerKey, ownerEncSessionKey)
	}

	async decryptSessionKey(ownerGroup: Id, ownerEncSessionKey: VersionedEncryptedKey): Promise<AesKey> {
		const gk = await this.keyLoaderFacade.loadSymGroupKey(ownerGroup, ownerEncSessionKey.encryptingKeyVersion)
		return decryptKey(gk, ownerEncSessionKey.key)
	}

	/**
	 * Returns the session key for the provided type/instance:
	 * * null, if the instance is unencrypted
	 * * the decrypted _ownerEncSessionKey, if it is available
	 * * the public decrypted session key, otherwise
	 *
	 * @param typeModel the type model of the instance
	 * @param instance The unencrypted (client-side) instance or encrypted (server-side) object literal
	 */
	async resolveSessionKey(instanceWrapper: InstanceWrapper): Promise<Nullable<AesKey>> {
		if (!instanceWrapper.typeModel.encrypted) {
			return null
		}

		let permissionUpdateData: Nullable<{
			bucketPermission: BucketPermission
		}> = null

		try {
			if (instanceWrapper.bucketKey) {
				// if we have a bucket key, then we need to cache the session keys stored in the bucket key for details, files, etc.
				// we need to do this BEFORE we check the owner enc session key
				const resolvedSessionKeys = await this.resolveWithBucketKey(instanceWrapper)
				instanceWrapper.setResolvedSessionKey(resolvedSessionKeys.resolvedSessionKeyForInstance)
			} else if (
				instanceWrapper._ownerEncSessionKey &&
				this.userFacade.isFullyLoggedIn() &&
				this.userFacade.hasGroup(assertNotNull(instanceWrapper._ownerGroup))
			) {
				const gk = await this.keyLoaderFacade.loadSymGroupKey(
					assertNotNull(instanceWrapper._ownerGroup),
					instanceWrapper._ownerEncSessionKey.encryptingKeyVersion,
				)
				instanceWrapper.setResolvedSessionKey(this.resolveSessionKeyWithOwnerKey(instanceWrapper._ownerEncSessionKey.key, gk))
			} else if (instanceWrapper.ownerEncSessionKey) {
				// Likely a DataTransferType, so this is a service.
				const gk = await this.keyLoaderFacade.loadSymGroupKey(
					this.userFacade.getGroupId(GroupType.Mail),
					instanceWrapper.ownerEncSessionKey.encryptingKeyVersion,
				)
				instanceWrapper.setResolvedSessionKey(this.resolveSessionKeyWithOwnerKey(assertNotNull(instanceWrapper._ownerEncSessionKey).key, gk))
			} else {
				// See PermissionType jsdoc for more info on permissions
				const permissionId = assertNotNull(instanceWrapper.permissionId)
				const loadedPermissions = await this.entityClient.loadAll(PermissionTypeRef, permissionId)
				instanceWrapper.updatePermission(loadedPermissions)

				if (instanceWrapper.symmetricOrPublicSymmetricPermission) {
					instanceWrapper.setResolvedSessionKey(await this.trySymmetricPermission(instanceWrapper.symmetricOrPublicSymmetricPermission))
				} else {
					if (instanceWrapper.publicOrExternalPermission == null) {
						throw new SessionKeyNotFoundError(
							`could not find permission for instance of type ${instanceWrapper.typeRef} with id ${instanceWrapper.id}`,
						)
					}

					const bucketPermission = await this.loadPublicOrExternalBucketPermission(instanceWrapper.publicOrExternalPermission)
					instanceWrapper.setResolvedSessionKey(await this.resolveWithPublicOrExternalPermission(instanceWrapper, bucketPermission))

					if (instanceWrapper.isLocalInstance() && this.userFacade.isLeader()) {
						permissionUpdateData = { bucketPermission }
					}
				}
			}
		} catch (e) {
			if (e instanceof CryptoError) {
				console.log("failed to resolve session key", e)
				throw new SessionKeyNotFoundError("Crypto error while resolving session key for instance " + instanceWrapper.id)
			} else {
				throw e
			}
		}
		if (instanceWrapper.resolvedSessionKey == null) {
			throw new Error(`Could not resolve session key for type: ${instanceWrapper.typeRef} with id: ${instanceWrapper.id}`)
		}

		if (permissionUpdateData != null) {
			const bucketPermission = permissionUpdateData.bucketPermission
			await this.updateWithSymPermissionKey(instanceWrapper, bucketPermission).catch(
				ofClass(NotFoundError, () => {
					console.log("w> could not find instance to update permission")
				}),
			)
		}

		return instanceWrapper.resolvedSessionKey
	}

	async resolveWithBucketKeyForInstance(instance: SomeEntity): Promise<ResolvedSessionKeys> {
		const typeModel = await resolveTypeReference(instance._type)
		const parsedInstance = await this.instancePipeline.modelMapper.applyServerModel(instance._type, instance)
		let instanceWrapper = await InstanceWrapper.fromParsedInstance(this.instancePipeline, typeModel, parsedInstance)
		assertNotNull(instanceWrapper.bucketKey)
		return this.resolveWithBucketKey(instanceWrapper)
	}

	public async resolveWithBucketKey(instanceWrapper: InstanceWrapper): Promise<ResolvedSessionKeys> {
		const bucketKey = assertNotNull(instanceWrapper.bucketKey)

		let decryptedBucketKey: AesKey
		let unencryptedSenderAuthStatus: EncryptionAuthStatus | null = null
		let pqMessageSenderKey: EccPublicKey | null = null
		if (bucketKey.keyGroup && bucketKey.pubEncBucketKey) {
			// bucket key is encrypted with public key for internal recipient
			const { decryptedAesKey, senderIdentityPubKey } = await this.asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(
				bucketKey.keyGroup,
				parseKeyVersion(bucketKey.recipientKeyVersion),
				asCryptoProtoocolVersion(bucketKey.protocolVersion),
				bucketKey.pubEncBucketKey,
			)
			decryptedBucketKey = decryptedAesKey
			pqMessageSenderKey = senderIdentityPubKey
		} else if (bucketKey.groupEncBucketKey) {
			// received as secure external recipient or reply from secure external sender
			let keyGroup
			const groupKeyVersion = parseKeyVersion(bucketKey.recipientKeyVersion)
			if (bucketKey.keyGroup) {
				// 1. Uses when receiving confidential replies from external users.
				// 2. legacy code path for old external clients that used to encrypt bucket keys with user group keys.
				keyGroup = bucketKey.keyGroup
			} else {
				// by default, we try to decrypt the bucket key with the ownerGroupKey (e.g. secure external recipient)
				keyGroup = assertNotNull(instanceWrapper._ownerGroup)
			}

			decryptedBucketKey = await this.resolveWithGroupReference(keyGroup, groupKeyVersion, bucketKey.groupEncBucketKey)
			unencryptedSenderAuthStatus = EncryptionAuthStatus.AES_NO_AUTHENTICATION
		} else {
			throw new SessionKeyNotFoundError(`encrypted bucket key not set on instance ${instanceWrapper.typeRef} with id: ${instanceWrapper.id}`)
		}
		const resolvedSessionKeys = await this.collectAllInstanceSessionKeysAndAuthenticate(
			instanceWrapper,
			decryptedBucketKey,
			unencryptedSenderAuthStatus,
			pqMessageSenderKey,
		)

		await this.ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(resolvedSessionKeys.instanceSessionKeys, instanceWrapper.typeModel)

		// for symmetrically encrypted instances _ownerEncSessionKey is sent from the server.
		// in this case it is not yet and we need to set it because the rest of the app expects it.
		const groupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(assertNotNull(instanceWrapper._ownerGroup)) // get current key for encrypting
		const ownerEncSessionKey = encryptKeyWithVersionedKey(groupKey, resolvedSessionKeys.resolvedSessionKeyForInstance)
		this.setOwnerEncSessionKey(instanceWrapper, ownerEncSessionKey)
		return resolvedSessionKeys
	}

	/**
	 * Calculates the SHA-256 checksum of a string value as UTF-8 bytes and returns it as a base64-encoded string
	 */
	public async sha256(value: string): Promise<string> {
		return uint8ArrayToBase64(sha256Hash(stringToUtf8Uint8Array(value)))
	}

	/**
	 * Decrypts the given encrypted bucket key with the group key of the given group. In case the current user is not
	 * member of the key group the function tries to resolve the group key using the adminEncGroupKey.
	 * This is necessary for resolving the BucketKey when receiving a reply from an external Mailbox.
	 * @param keyGroup The group that holds the encryption key.
	 * @param groupKeyVersion the version of the key from the keyGroup
	 * @param groupEncBucketKey The group key encrypted bucket key.
	 */
	private async resolveWithGroupReference(keyGroup: Id, groupKeyVersion: KeyVersion, groupEncBucketKey: Uint8Array): Promise<AesKey> {
		if (this.userFacade.hasGroup(keyGroup)) {
			// the logged-in user (most likely external) is a member of that group. Then we have the group key from the memberships
			const groupKey = await this.keyLoaderFacade.loadSymGroupKey(keyGroup, groupKeyVersion)
			return decryptKey(groupKey, groupEncBucketKey)
		} else {
			// internal user receiving a mail from secure external:
			// internal user group key -> external user group key -> external mail group key -> bucket key
			const externalMailGroupId = keyGroup
			const externalMailGroupKeyVersion = groupKeyVersion
			const externalMailGroup = await this.entityClient.load(GroupTypeRef, externalMailGroupId)

			const externalUserGroupdId = externalMailGroup.admin
			if (!externalUserGroupdId) {
				throw new SessionKeyNotFoundError("no admin group on key group: " + externalMailGroupId)
			}
			const externalUserGroupKeyVersion = parseKeyVersion(externalMailGroup.adminGroupKeyVersion ?? "0")
			const externalUserGroup = await this.entityClient.load(GroupTypeRef, externalUserGroupdId)

			const internalUserGroupId = externalUserGroup.admin
			const internalUserGroupKeyVersion = parseKeyVersion(externalUserGroup.adminGroupKeyVersion ?? "0")
			if (!(internalUserGroupId && this.userFacade.hasGroup(internalUserGroupId))) {
				throw new SessionKeyNotFoundError("no admin group or no membership of admin group: " + internalUserGroupId)
			}

			const internalUserGroupKey = await this.keyLoaderFacade.loadSymGroupKey(internalUserGroupId, internalUserGroupKeyVersion)

			const currentExternalUserGroupKey = decryptKey(internalUserGroupKey, assertNotNull(externalUserGroup.adminGroupEncGKey))
			const externalUserGroupKey = await this.keyLoaderFacade.loadSymGroupKey(externalUserGroupdId, externalUserGroupKeyVersion, {
				object: currentExternalUserGroupKey,
				version: parseKeyVersion(externalUserGroup.groupKeyVersion),
			})

			const currentExternalMailGroupKey = decryptKey(externalUserGroupKey, assertNotNull(externalMailGroup.adminGroupEncGKey))
			const externalMailGroupKey = await this.keyLoaderFacade.loadSymGroupKey(externalMailGroupId, externalMailGroupKeyVersion, {
				object: currentExternalMailGroupKey,
				version: parseKeyVersion(externalMailGroup.groupKeyVersion),
			})

			return decryptKey(externalMailGroupKey, groupEncBucketKey)
		}
	}

	/**
	 * @return Whether the {@param elementOrLiteral} is a unmapped type, as used in JSON for transport or if it's a runtime representation of a type.
	 */
	// todo: remove this metod
	private isLiteralInstance(elementOrLiteral: Record<string, any>): boolean {
		return typeof elementOrLiteral._type === "undefined"
	}

	private async trySymmetricPermission(symmetricPermission: Permission): Promise<AesKey> {
		const gk = await this.keyLoaderFacade.loadSymGroupKey(
			assertNotNull(symmetricPermission._ownerGroup),
			parseKeyVersion(symmetricPermission._ownerKeyVersion ?? "0"),
		)
		return decryptKey(gk, assertNotNull(symmetricPermission._ownerEncSessionKey))
	}

	/**
	 * Resolves the session key for the provided instance and collects all other instances'
	 * session keys in order to update them.
	 */
	private async collectAllInstanceSessionKeysAndAuthenticate(
		instanceWrapper: InstanceWrapper,
		decBucketKey: number[],
		encryptionAuthStatus: EncryptionAuthStatus | null,
		pqMessageSenderKey: EccPublicKey | null,
	): Promise<ResolvedSessionKeys> {
		const bucketKey = assertNotNull(instanceWrapper.bucketKey)

		let resolvedSessionKeyForInstance: AesKey | undefined = undefined
		const instanceSessionKeys = await promiseMap(bucketKey.bucketEncSessionKeys, async (instanceSessionKey) => {
			const _ownerGroup = assertNotNull(instanceWrapper._ownerGroup)

			const decryptedSessionKey = decryptKey(decBucketKey, instanceSessionKey.symEncSessionKey)
			const groupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(_ownerGroup)
			const ownerEncSessionKey = encryptKeyWithVersionedKey(groupKey, decryptedSessionKey)
			const instanceSessionKeyWithOwnerEncSessionKey = createInstanceSessionKey(instanceSessionKey)
			if (instanceWrapper.elementId == instanceSessionKey.instanceId) {
				resolvedSessionKeyForInstance = decryptedSessionKey
				const pqSenderKeyVersion =
					bucketKey.protocolVersion === CryptoProtocolVersion.TUTA_CRYPT ? parseKeyVersion(bucketKey.senderKeyVersion ?? "0") : null
				instanceWrapper.setResolvedSessionKey(resolvedSessionKeyForInstance)
				const decryptedInstance = await instanceWrapper.provideDecryptedInstance()

				// we can only authenticate once we have the session key
				// because we need to check if the confidential flag is set, which is encrypted still
				// we need to do it here at the latest because we must write the flag when updating the session key on the instance
				await this.authenticateMainInstance(
					encryptionAuthStatus,
					pqMessageSenderKey,
					pqSenderKeyVersion,
					decryptedInstance,
					instanceSessionKeyWithOwnerEncSessionKey,
					decryptedSessionKey,
					bucketKey.keyGroup,
				)
			}
			instanceSessionKeyWithOwnerEncSessionKey.symEncSessionKey = ownerEncSessionKey.key
			instanceSessionKeyWithOwnerEncSessionKey.symKeyVersion = String(ownerEncSessionKey.encryptingKeyVersion)
			return instanceSessionKeyWithOwnerEncSessionKey
		})

		if (resolvedSessionKeyForInstance) {
			return { resolvedSessionKeyForInstance, instanceSessionKeys }
		} else {
			throw new SessionKeyNotFoundError("no session key for instance " + instanceWrapper.id)
		}
	}

	private async authenticateMainInstance(
		encryptionAuthStatus: EncryptionAuthStatus | null,
		pqMessageSenderKey: Uint8Array | null,
		pqMessageSenderKeyVersion: KeyVersion | null,
		instance: SomeEntity,
		instanceSessionKeyWithOwnerEncSessionKey: InstanceSessionKey,
		decryptedSessionKey: number[],
		keyGroup: Id | null,
	) {
		// we only authenticate mail instances
		const isMailInstance = isSameTypeRef(MailTypeRef, instance._type)
		if (isMailInstance) {
			const mail = instance as Mail

			if (!encryptionAuthStatus) {
				if (!pqMessageSenderKey) {
					// This message was encrypted with RSA. We check if TutaCrypt could have been used instead.
					const recipientGroup = assertNotNull(
						keyGroup,
						"trying to authenticate an asymmetrically encrypted message, but we can't determine the recipient's group ID",
					)
					const currentKeyPair = await this.keyLoaderFacade.loadCurrentKeyPair(recipientGroup)
					encryptionAuthStatus = EncryptionAuthStatus.RSA_NO_AUTHENTICATION
					if (isPqKeyPairs(currentKeyPair.object)) {
						const keyRotationFacade = this.keyRotationFacade()
						const rotatedGroups = await keyRotationFacade.getGroupIdsThatPerformedKeyRotations()
						if (!rotatedGroups.includes(recipientGroup)) {
							encryptionAuthStatus = EncryptionAuthStatus.RSA_DESPITE_TUTACRYPT
						}
					}
				} else {
					const senderMailAddress = mail.confidential ? mail.sender.address : SYSTEM_GROUP_MAIL_ADDRESS
					encryptionAuthStatus = await this.tryAuthenticateSenderOfMainInstance(
						senderMailAddress,
						pqMessageSenderKey,
						// must not be null if this is a TutaCrypt message with a pqMessageSenderKey
						assertNotNull(pqMessageSenderKeyVersion),
					)
				}
			}
			instanceSessionKeyWithOwnerEncSessionKey.encryptionAuthStatus = aesEncrypt(decryptedSessionKey, stringToUtf8Uint8Array(encryptionAuthStatus))
		}
	}

	private async tryAuthenticateSenderOfMainInstance(senderMailAddress: string, pqMessageSenderKey: Uint8Array, pqMessageSenderKeyVersion: KeyVersion) {
		try {
			return await this.asymmetricCryptoFacade.authenticateSender(
				{
					identifier: senderMailAddress,
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				},
				pqMessageSenderKey,
				pqMessageSenderKeyVersion,
			)
		} catch (e) {
			// we do not want to fail mail decryption here, e.g. in case an alias was removed we would get a permanent NotFoundError.
			// in those cases we will just show a warning banner but still want to display the mail
			console.error("Could not authenticate sender", e)
			return EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED
		}
	}

	async loadPublicOrExternalBucketPermission(pubOrExtPermission: Permission): Promise<BucketPermission> {
		const bucketPermissions = await this.entityClient.loadAll(BucketPermissionTypeRef, assertNotNull(pubOrExtPermission.bucket).bucketPermissions)
		const bucketPermission = bucketPermissions.find(
			(bp) =>
				(bp.type === BucketPermissionType.Public || bp.type === BucketPermissionType.External) &&
				isSameId(pubOrExtPermission._ownerGroup, bp._ownerGroup),
		)

		// find the bucket permission with the same group as the permission and public type
		if (bucketPermission == null) {
			throw new SessionKeyNotFoundError("no corresponding bucket permission found")
		}

		return bucketPermission
	}

	private async resolveWithPublicOrExternalPermission(instanceWrapper: InstanceWrapper, bucketPermission: BucketPermission): Promise<AesKey> {
		const pubOrExtPermission = assertNotNull(instanceWrapper.publicOrExternalPermission)
		if (bucketPermission.type === BucketPermissionType.External) {
			return this.decryptWithExternalBucket(bucketPermission, pubOrExtPermission, instanceWrapper.errorPrintableInstance)
		} else {
			return await this.decryptWithPublicBucketWithoutAuthentication(bucketPermission, pubOrExtPermission, instanceWrapper.errorPrintableInstance)
		}
	}

	private async decryptWithExternalBucket(
		bucketPermission: BucketPermission,
		pubOrExtPermission: Permission,
		onErrorInstanceStringify: () => string,
	): Promise<AesKey> {
		let bucketKey

		if (bucketPermission.ownerEncBucketKey != null) {
			const ownerGroupKey = await this.keyLoaderFacade.loadSymGroupKey(
				neverNull(bucketPermission._ownerGroup),
				parseKeyVersion(bucketPermission.ownerKeyVersion ?? "0"),
			)
			bucketKey = decryptKey(ownerGroupKey, bucketPermission.ownerEncBucketKey)
		} else if (bucketPermission.symEncBucketKey) {
			// legacy case: for very old email sent to external user we used symEncBucketKey on the bucket permission.
			// The bucket key is encrypted with the user group key of the external user.
			// We maintain this code as we still have some old BucketKeys in some external mailboxes.
			// Can be removed if we finished mail details migration or when we do cleanup of external mailboxes.
			const userGroupKey = await this.keyLoaderFacade.loadSymUserGroupKey(parseKeyVersion(bucketPermission.symKeyVersion ?? "0"))
			bucketKey = decryptKey(userGroupKey, bucketPermission.symEncBucketKey)
		} else {
			throw new SessionKeyNotFoundError(
				`BucketEncSessionKey is not defined for Permission ${pubOrExtPermission._id} (Instance: ${onErrorInstanceStringify()})`,
			)
		}

		return decryptKey(bucketKey, neverNull(pubOrExtPermission.bucketEncSessionKey))
	}

	private async decryptWithPublicBucketWithoutAuthentication(
		bucketPermission: BucketPermission,
		pubOrExtPermission: Permission,
		onErrorInstanceStringify: () => string,
	): Promise<AesKey> {
		const pubEncBucketKey = bucketPermission.pubEncBucketKey
		if (pubEncBucketKey == null) {
			throw new SessionKeyNotFoundError(
				`PubEncBucketKey is not defined for BucketPermission ${bucketPermission._id.toString()} (Instance: ${onErrorInstanceStringify()})`,
			)
		}
		const bucketEncSessionKey = pubOrExtPermission.bucketEncSessionKey
		if (bucketEncSessionKey == null) {
			throw new SessionKeyNotFoundError(
				`BucketEncSessionKey is not defined for Permission ${pubOrExtPermission._id.toString()} (Instance: ${onErrorInstanceStringify()})`,
			)
		}

		const { decryptedAesKey } = await this.asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(
			bucketPermission.group,
			parseKeyVersion(bucketPermission.pubKeyVersion ?? "0"),
			asCryptoProtoocolVersion(bucketPermission.protocolVersion),
			pubEncBucketKey,
		)

		return decryptKey(decryptedAesKey, bucketEncSessionKey)
	}

	/**
	 * Returns the session key for the provided service response:
	 * * null, if the instance is unencrypted
	 * * the decrypted _ownerPublicEncSessionKey, if it is available
	 * @param instance The unencrypted (client-side) or encrypted (server-side) instance
	 *
	 */
	async resolveServiceSessionKey(instance: Record<string, any>): Promise<Aes256Key | null> {
		if (instance._ownerPublicEncSessionKey) {
			// we assume the server uses the current key pair of the recipient
			const keypair = await this.keyLoaderFacade.loadCurrentKeyPair(instance._ownerGroup)
			// we do not authenticate as we could remove data transfer type encryption altogether and only rely on tls
			return (
				await this.asymmetricCryptoFacade.decryptSymKeyWithKeyPair(
					keypair.object,
					assertEnumValue(CryptoProtocolVersion, instance._publicCryptoProtocolVersion),
					base64ToUint8Array(instance._ownerPublicEncSessionKey),
				)
			).decryptedAesKey
		}
		return null
	}

	/**
	 * Creates a new _ownerEncSessionKey and assigns it to the provided entity
	 * the entity must already have an _ownerGroup
	 * @returns the generated key
	 */
	async setNewOwnerEncSessionKey(instanceWrapper: InstanceWrapper, keyToEncryptSessionKey?: VersionedKey): Promise<void> {
		if (instanceWrapper._ownerGroup == null) {
			throw new Error(`no owner group set  for type ${instanceWrapper.typeRef} with id: ${instanceWrapper.id}`)
		}

		if (instanceWrapper.typeModel.encrypted) {
			const newSessionKey = aes256RandomKey()
			instanceWrapper.setResolvedSessionKey(newSessionKey)

			const effectiveKeyToEncryptSessionKey = keyToEncryptSessionKey ?? (await this.keyLoaderFacade.getCurrentSymGroupKey(instanceWrapper._ownerGroup))
			const encryptedSessionKey = encryptKeyWithVersionedKey(effectiveKeyToEncryptSessionKey, newSessionKey)

			this.setOwnerEncSessionKey(instanceWrapper, encryptedSessionKey, instanceWrapper._ownerGroup)
		}
	}

	async encryptBucketKeyForInternalRecipient(
		senderUserGroupId: Id,
		bucketKey: AesKey,
		recipientMailAddress: string,
		notFoundRecipients: Array<string>,
	): Promise<InternalRecipientKeyData | SymEncInternalRecipientKeyData | null> {
		try {
			const pubKeys = await this.publicKeyProvider.loadCurrentPubKey({
				identifier: recipientMailAddress,
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
			})
			// We do not create any key data in case there is one not found recipient, but we want to
			// collect ALL not found recipients when iterating a recipient list.
			if (notFoundRecipients.length !== 0) {
				return null
			}
			const isExternalSender = this.userFacade.getUser()?.accountType === AccountType.EXTERNAL
			// we only encrypt symmetric as external sender if the recipient supports tuta-crypt.
			// Clients need to support symmetric decryption from external users. We can always encrypt symmetricly when old clients are deactivated that don't support tuta-crypt.
			if (pubKeys.object.pubKyberKey && isExternalSender) {
				return this.createSymEncInternalRecipientKeyData(recipientMailAddress, bucketKey)
			} else {
				return this.createPubEncInternalRecipientKeyData(bucketKey, recipientMailAddress, pubKeys, senderUserGroupId)
			}
		} catch (e) {
			if (e instanceof NotFoundError) {
				notFoundRecipients.push(recipientMailAddress)
				return null
			} else if (e instanceof TooManyRequestsError) {
				throw new RecipientNotResolvedError("")
			} else {
				throw e
			}
		}
	}

	private async createPubEncInternalRecipientKeyData(
		bucketKey: AesKey,
		recipientMailAddress: string,
		recipientPublicKeys: Versioned<PublicKeys>,
		senderGroupId: Id,
	) {
		const pubEncBucketKey = await this.asymmetricCryptoFacade.asymEncryptSymKey(bucketKey, recipientPublicKeys, senderGroupId)
		return createInternalRecipientKeyData({
			mailAddress: recipientMailAddress,
			pubEncBucketKey: pubEncBucketKey.pubEncSymKeyBytes,
			recipientKeyVersion: pubEncBucketKey.recipientKeyVersion.toString(),
			senderKeyVersion: pubEncBucketKey.senderKeyVersion != null ? pubEncBucketKey.senderKeyVersion.toString() : null,
			protocolVersion: pubEncBucketKey.cryptoProtocolVersion,
		})
	}

	private async createSymEncInternalRecipientKeyData(recipientMailAddress: string, bucketKey: AesKey) {
		const keyGroup = this.userFacade.getGroupId(GroupType.Mail)
		const externalMailGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(keyGroup)
		return createSymEncInternalRecipientKeyData({
			mailAddress: recipientMailAddress,
			symEncBucketKey: encryptKey(externalMailGroupKey.object, bucketKey),
			keyGroup,
			symKeyVersion: String(externalMailGroupKey.version),
		})
	}

	/**
	 * Updates the given public permission with the given symmetric key for faster access if the client is the leader and otherwise does nothing.
	 * @param typeModel The type model of the instance
	 * @param instance The unencrypted (client-side) or encrypted (server-side) instance
	 * @param permission The permission.
	 * @param bucketPermission The bucket permission.
	 * @param permissionOwnerGroupKey The symmetric group key for the owner group on the permission.
	 * @param sessionKey The symmetric session key.
	 */
	private async updateWithSymPermissionKey(instanceWrapper: InstanceWrapper, bucketPermission: BucketPermission): Promise<void> {
		// get current key for encrypting
		const bucketPermissionOwnerGroup = assertNotNull(bucketPermission._ownerGroup)
		const permissionOwnerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(bucketPermissionOwnerGroup)

		if (!instanceWrapper._ownerEncSessionKey && instanceWrapper.publicOrExternalPermission?._ownerGroup === instanceWrapper._ownerGroup) {
			return this.updateOwnerEncSessionKey(instanceWrapper, permissionOwnerGroupKey)
		} else {
			// instances shared via permissions (e.g. body)
			const encryptedKey = encryptKeyWithVersionedKey(permissionOwnerGroupKey, assertNotNull(instanceWrapper.resolvedSessionKey))
			let updateService = createUpdatePermissionKeyData({
				ownerKeyVersion: String(encryptedKey.encryptingKeyVersion),
				ownerEncSessionKey: encryptedKey.key,
				permission: assertNotNull(instanceWrapper.publicOrExternalPermission)._id,
				bucketPermission: bucketPermission._id,
			})
			await this.serviceExecutor.post(UpdatePermissionKeyService, updateService)
		}
	}

	async enforceSessionKeyUpdateIfNeededForInstance(instance: SomeEntity, childInstances: readonly File[]): Promise<File[]> {
		const parsedInstance: ParsedInstance = await this.instancePipeline.modelMapper.applyServerModel(instance._type, instance)
		const typeModel = await resolveTypeReference(instance._type)
		const instanceWrapper = await InstanceWrapper.fromParsedInstance(this.instancePipeline, typeModel, parsedInstance)
		return this.enforceSessionKeyUpdateIfNeeded(instanceWrapper, childInstances)
	}

	/**
	 * Resolves the ownerEncSessionKey of a mail. This might be needed if it wasn't updated yet
	 * by the OwnerEncSessionKeysUpdateQueue but the file is already downloaded.
	 * @param mainInstance the instance that has the bucketKey
	 * @param childInstances the files that belong to the mainInstance
	 */
	async enforceSessionKeyUpdateIfNeeded(instanceWrapper: InstanceWrapper, childInstances: readonly File[]): Promise<File[]> {
		if (!childInstances.some((f) => f._ownerEncSessionKey == null)) {
			return childInstances.slice()
		}
		const outOfSyncInstances = childInstances.filter((f) => f._ownerEncSessionKey == null)
		if (instanceWrapper.bucketKey) {
			// invoke updateSessionKeys service in case a bucket key is still available
			const resolvedSessionKeys = await this.resolveWithBucketKey(instanceWrapper)
			await this.ownerEncSessionKeysUpdateQueue.postUpdateSessionKeysService(resolvedSessionKeys.instanceSessionKeys)
		} else if (outOfSyncInstances.length > 0) {
			console.warn("files are out of sync refreshing", outOfSyncInstances.map((f) => f._id).join(", "))
		}
		for (const childInstance of outOfSyncInstances) {
			await this.cache?.deleteFromCacheIfExists(FileTypeRef, getListId(childInstance), getElementId(childInstance))
		}
		// we have a caching entity client, so this re-inserts the deleted instances
		return await this.entityClient.loadMultiple(
			FileTypeRef,
			getListId(childInstances[0]),
			childInstances.map((childInstance) => getElementId(childInstance)),
		)
	}

	private async updateOwnerEncSessionKeyForEncryptedParsedInstance(
		typeModel: TypeModel,
		encryptedParsedInstance: EncryptedParsedInstance,
		ownerGroupKey: VersionedKey,
		sessionKey: AesKey,
	) {
		const new_ownerEncSessionKey = encryptKeyWithVersionedKey(ownerGroupKey, assertNotNull(sessionKey))
		this.setOwnerEncSessionKeyForEncryptedParsedInstance(typeModel, encryptedParsedInstance, new_ownerEncSessionKey)
		const id = assertNotNull(AttributeModel.getAttributeorNull<Id | IdTuple>(encryptedParsedInstance, "_id", typeModel))

		// we have to call the rest client directly because instance is still the encrypted server-side version
		const path = typeRefToRestPath(new TypeRef(typeModel.app, typeModel.id)) + "/" + (id instanceof Array ? id.join("/") : id)

		const headers = this.userFacade.createAuthHeaders()
		headers.v = typeModel.version
		await this.restClient
			.request(path, HttpMethod.PUT, {
				headers,
				body: JSON.stringify(await this.instancePipeline.typeMapper.applyDbTypes(typeModel, encryptedParsedInstance)),
				queryParams: { updateOwnerEncSessionKey: "true" },
			})
			.catch(
				ofClass(PayloadTooLargeError, (e) => {
					console.log("Could not update owner enc session key - PayloadTooLargeError", e)
				}),
			)
	}

	private async updateOwnerEncSessionKey(instanceWrapper: InstanceWrapper, ownerGroupKey: VersionedKey) {
		const new_ownerEncSessionKey = encryptKeyWithVersionedKey(ownerGroupKey, assertNotNull(instanceWrapper.resolvedSessionKey))
		this.setOwnerEncSessionKey(instanceWrapper, new_ownerEncSessionKey)

		const headers = this.userFacade.createAuthHeaders()
		headers.v = instanceWrapper.typeModel.version
		const updateUrl = await instanceWrapper.getInstanceUpdateServerPath()
		await this.restClient
			.request(updateUrl, HttpMethod.PUT, {
				headers,
				body: await instanceWrapper.toWireFormat(),
				queryParams: { updateOwnerEncSessionKey: "true" },
			})
			.catch(
				ofClass(PayloadTooLargeError, (e) => {
					console.log("Could not update owner enc session key - PayloadTooLargeError", e)
				}),
			)
	}

	public setOwnerEncSessionKeyForEncryptedParsedInstance(
		typeModel: TypeModel,
		encryptedParsedInstance: EncryptedParsedInstance,
		ownerEncSessionKey: VersionedEncryptedKey,
		ownerGroup?: Id,
	) {
		if (AttributeModel.getAttributeorNull(encryptedParsedInstance, "_ownerGroup", typeModel) == null) {
			const id = AttributeModel.getAttributeorNull(encryptedParsedInstance, "_id", typeModel)
			throw new Error(`no owner group set  for type ${typeModel.app}/${typeModel.name} with id: ${id}`)
		}

		if (typeModel.encrypted) {
			const ownerEncSessionKey = AttributeModel.getAttributeorNull(encryptedParsedInstance, "_ownerEncSessionKey", typeModel)
			const id = AttributeModel.getAttributeorNull(encryptedParsedInstance, "_id", typeModel)
			if (ownerEncSessionKey) {
				throw new Error(`no owner group set  for type ${typeModel.app}/${typeModel.name} with id: ${id}`)
			}
		}

		const _ownerEncSessionKeyFieldId = assertNotNull(AttributeModel.getAttributeId(typeModel, "_ownerEncSessionKey"))
		const _ownerEncSessionKeyVersionFieldId = assertNotNull(AttributeModel.getAttributeId(typeModel, "_ownerEncSessionKeyVersion"))
		encryptedParsedInstance[_ownerEncSessionKeyFieldId] = ownerEncSessionKey.key
		encryptedParsedInstance[_ownerEncSessionKeyVersionFieldId] = ownerEncSessionKey.encryptingKeyVersion.toString()
	}

	public setOwnerEncSessionKey(instanceWrapper: InstanceWrapper, ownerEncSessionKey: VersionedEncryptedKey, ownerGroup?: Id) {
		if (instanceWrapper._ownerGroup == null) {
			throw new Error(`no owner group set  for type ${instanceWrapper.typeRef} with id: ${instanceWrapper.id}`)
		}

		if (instanceWrapper.typeModel.encrypted) {
			if (instanceWrapper._ownerEncSessionKey) {
				throw new Error(`ownerEncSessionKey already set for type ${instanceWrapper.typeRef} with id: ${instanceWrapper.id}`)
			}
		}

		instanceWrapper.set_ownerEncSessionKey(ownerEncSessionKey)
		if (ownerGroup) {
			instanceWrapper.set_ownerGroup(ownerGroup)
		}
	}

	/*************************** Migrations **********************************/

	async applyMigrationsForInstance<T>(decryptedInstance: T): Promise<T> {
		const instanceType = downcast<Entity>(decryptedInstance)._type

		if (isSameTypeRef(instanceType, ContactTypeRef)) {
			const contact = downcast<Contact>(decryptedInstance)

			try {
				if (!contact.birthdayIso && contact.oldBirthdayAggregate) {
					contact.birthdayIso = birthdayToIsoDate(contact.oldBirthdayAggregate)
					contact.oldBirthdayAggregate = null
					contact.oldBirthdayDate = null
					await this.entityClient.update(contact)
				} else if (!contact.birthdayIso && contact.oldBirthdayDate) {
					contact.birthdayIso = birthdayToIsoDate(oldBirthdayToBirthday(contact.oldBirthdayDate))
					contact.oldBirthdayDate = null
					await this.entityClient.update(contact)
				} else if (contact.birthdayIso && (contact.oldBirthdayAggregate || contact.oldBirthdayDate)) {
					contact.oldBirthdayAggregate = null
					contact.oldBirthdayDate = null
					await this.entityClient.update(contact)
				}
			} catch (e) {
				if (!(e instanceof LockedError)) {
					throw e
				}
			}
		}

		return decryptedInstance
	}

	/**
	 * Takes a freshly JSON-parsed, unmapped object and apply migrations as necessary
	 * @param typeRef
	 * @param data
	 * @return the unmapped and still encrypted instance
	 */
	async applyMigrations(typeModel: TypeModel, typeRef: TypeRef<Entity>, encryptedParsedInstance: EncryptedParsedInstance) {
		const ownerEncSessionKey = AttributeModel.getAttributeorNull(encryptedParsedInstance, "_ownerGroup", typeModel)
		if (isSameTypeRef(typeRef, GroupInfoTypeRef)) {
			const _ownerGroup = AttributeModel.getAttributeorNull(encryptedParsedInstance, "_ownerGroup", typeModel)
			if (_ownerGroup == null) {
				await this.applyCustomerGroupOwnershipToGroupInfo(typeModel, encryptedParsedInstance)
			}
		} else if (isSameTypeRef(typeRef, TutanotaPropertiesTypeRef)) {
			const _ownerEncSessionKey = AttributeModel.getAttributeorNull(encryptedParsedInstance, "_ownerEncSessionKey", typeModel)
			if (_ownerEncSessionKey == null) {
				await this.encryptTutanotaProperties(typeModel, encryptedParsedInstance)
			}
		} else if (isSameTypeRef(typeRef, PushIdentifierTypeRef)) {
			const _ownerEncSessionKey = AttributeModel.getAttributeorNull(encryptedParsedInstance, "_ownerEncSessionKey", typeModel)
			if (_ownerEncSessionKey == null) {
				await this.addSessionKeyToPushIdentifier(typeModel, encryptedParsedInstance)
			}
		}
	}

	private async applyCustomerGroupOwnershipToGroupInfo(typeModel: TypeModel, encryptedParsedInstance: EncryptedParsedInstance) {
		const customerGroupMembership = assertNotNull(
			this.userFacade.getLoggedInUser().memberships.find((g: GroupMembership) => g.groupType === GroupType.Customer),
		)
		const permission = assertNotNull(AttributeModel.getAttributeorNull<Id>(encryptedParsedInstance, "_permissions", typeModel))
		const listPermissions = await this.entityClient.loadAll(PermissionTypeRef, assertNotNull(permission))
		const customerGroupPermission = listPermissions.find((p) => p.group === customerGroupMembership.group)

		if (!customerGroupPermission) throw new SessionKeyNotFoundError("Permission not found, could not apply OwnerGroup migration")
		const customerGroupKeyVersion = parseKeyVersion(customerGroupPermission.symKeyVersion ?? "0")
		const customerGroupKey = await this.keyLoaderFacade.loadSymGroupKey(customerGroupMembership.group, customerGroupKeyVersion)
		const versionedCustomerGroupKey = { object: customerGroupKey, version: customerGroupKeyVersion }
		const listKey = decryptKey(customerGroupKey, assertNotNull(customerGroupPermission.symEncSessionKey))
		const listEncSessionKey = assertNotNull(AttributeModel.getAttributeorNull<Base64>(encryptedParsedInstance, "_listEncSessionKey", typeModel))
		const groupInfoSk = decryptKey(listKey, base64ToUint8Array(listEncSessionKey))

		this.setOwnerEncSessionKeyForEncryptedParsedInstance(
			typeModel,
			encryptedParsedInstance,
			encryptKeyWithVersionedKey(versionedCustomerGroupKey, groupInfoSk),
			customerGroupMembership.group,
		)
	}

	private async addSessionKeyToPushIdentifier(typeModel: TypeModel, encryptedParsedInstance: EncryptedParsedInstance) {
		const userGroupKey = this.userFacade.getCurrentUserGroupKey()

		// set sessionKey for allowing encryption when old instance (< v43) is updated
		await this.updateOwnerEncSessionKeyForEncryptedParsedInstance(typeModel, encryptedParsedInstance, userGroupKey, aes256RandomKey())
	}

	private async encryptTutanotaProperties(typeModel: TypeModel, encryptedParsedInstance: EncryptedParsedInstance) {
		const userGroupKey = this.userFacade.getCurrentUserGroupKey()

		// EncryptTutanotaPropertiesService could be removed and replaced with a Migration that writes the key
		const groupEncSessionKey = encryptKeyWithVersionedKey(userGroupKey, aes256RandomKey())
		this.setOwnerEncSessionKeyForEncryptedParsedInstance(typeModel, encryptedParsedInstance, groupEncSessionKey, this.userFacade.getUserGroupId())
		const migrationData = createEncryptTutanotaPropertiesData({
			properties: elementIdPart(assertNotNull(AttributeModel.getAttributeorNull(encryptedParsedInstance, "_id", typeModel))),
			symKeyVersion: String(groupEncSessionKey.encryptingKeyVersion),
			symEncSessionKey: groupEncSessionKey.key,
		})
		await this.serviceExecutor.post(EncryptTutanotaPropertiesService, migrationData)
	}
}

if (!("toJSON" in Error.prototype)) {
	Object.defineProperty(Error.prototype as any, "toJSON", {
		value: function () {
			const alt: Record<string, any> = {}
			for (let key of Object.getOwnPropertyNames(this)) {
				alt[key] = this[key]
			}
			return alt
		},
		configurable: true,
		writable: true,
	})
}
