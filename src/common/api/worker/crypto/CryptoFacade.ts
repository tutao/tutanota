import {
	assertNotNull,
	downcast,
	isSameTypeRef,
	lazy,
	lazyAsync,
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
	KeyVerificationState,
	PermissionType,
	PublicKeyIdentifierType,
	SYSTEM_GROUP_MAIL_ADDRESS,
} from "../../common/TutanotaConstants"
import { HttpMethod, resolveClientTypeReference } from "../../common/EntityFunctions"
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
import type { ClientModelEncryptedParsedInstance, Entity, ServerModelEncryptedParsedInstance, SomeEntity, TypeModel } from "../../common/EntityTypes"
import { assertWorkerOrNode } from "../../common/Env"
import type { EntityClient } from "../../common/EntityClient"
import { RestClient } from "../rest/RestClient"
import {
	Aes256Key,
	aes256RandomKey,
	aesEncrypt,
	AesKey,
	bitArrayToUint8Array,
	decryptKey,
	encryptKey,
	isPqKeyPairs,
	isVersionedPqPublicKey,
	PublicKey,
	sha256Hash,
	X25519PublicKey,
} from "@tutao/tutanota-crypto"
import { RecipientNotResolvedError } from "../../common/error/RecipientNotResolvedError"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { EncryptTutanotaPropertiesService } from "../../entities/tutanota/Services"
import { UpdatePermissionKeyService } from "../../entities/sys/Services"
import { UserFacade } from "../facades/UserFacade"
import { elementIdPart, getElementId, getListId } from "../../common/utils/EntityUtils.js"
import { OwnerEncSessionKeysUpdateQueue } from "./OwnerEncSessionKeysUpdateQueue.js"
import { DefaultEntityRestCache } from "../rest/DefaultEntityRestCache.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { KeyLoaderFacade, parseKeyVersion } from "../facades/KeyLoaderFacade.js"
import { encryptKeyWithVersionedKey, VersionedEncryptedKey, VersionedKey } from "./CryptoWrapper.js"
import { AsymmetricCryptoFacade } from "./AsymmetricCryptoFacade.js"
import type { KeyVerificationFacade } from "../facades/lazy/KeyVerificationFacade"
import { PublicKeyProvider } from "../facades/PublicKeyProvider.js"
import { KeyVersion, Nullable } from "@tutao/tutanota-utils/dist/Utils.js"
import { KeyRotationFacade } from "../facades/KeyRotationFacade.js"
import { typeRefToRestPath } from "../rest/EntityRestClient"
import { InstancePipeline } from "./InstancePipeline"
import { EntityAdapter } from "./EntityAdapter"
import Id from "../../../../mail-app/translations/id"

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
		private readonly lazyKeyVerificationFacade: lazyAsync<KeyVerificationFacade>,
		private readonly publicKeyProvider: PublicKeyProvider,
		private readonly keyRotationFacade: lazy<KeyRotationFacade>,
	) {}

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

	/** Resolve a session key an {@param instance} using an already known {@param ownerKey}. */
	decryptSessionKeyWithOwnerKey(ownerEncSessionKey: Uint8Array, ownerKey: AesKey): AesKey {
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
	async resolveSessionKey(instance: Entity): Promise<Nullable<AesKey>> {
		const typeModel = await resolveClientTypeReference(instance._type)
		if (!typeModel.encrypted) {
			return null
		}

		try {
			if (instance.bucketKey) {
				// if we have a bucket key, then we need to cache the session keys stored in the bucket key for details, files, etc.
				// we need to do this BEFORE we check the owner enc session key
				const resolvedSessionKeys = await this.resolveWithBucketKey(instance)
				return resolvedSessionKeys.resolvedSessionKeyForInstance
			} else if (instance._ownerEncSessionKey && this.userFacade.isFullyLoggedIn() && this.userFacade.hasGroup(assertNotNull(instance._ownerGroup))) {
				const gk = await this.keyLoaderFacade.loadSymGroupKey(assertNotNull(instance._ownerGroup), parseKeyVersion(instance._ownerKeyVersion ?? "0"))
				return this.decryptSessionKeyWithOwnerKey(instance._ownerEncSessionKey, gk)
			} else {
				// See PermissionType jsdoc for more info on permissions
				const permissions = await this.entityClient.loadAll(PermissionTypeRef, assertNotNull(instance._permissions))
				return (await this.trySymmetricPermission(permissions)) ?? (await this.resolveWithPublicOrExternalPermission(permissions, instance, typeModel))
			}
		} catch (e) {
			if (e instanceof CryptoError) {
				console.log("failed to resolve session key", e)
				throw new SessionKeyNotFoundError("Crypto error while resolving session key for instance " + downcast<SomeEntity>(instance)._id)
			} else {
				throw e
			}
		}
	}

	/** Helper for the rare cases when we needed it on the client side. */
	async resolveSessionKeyForInstanceBinary(instance: Entity): Promise<Uint8Array | null> {
		const key = await this.resolveSessionKey(instance)
		return key == null ? null : bitArrayToUint8Array(key)
	}

	/**
	 * Takes a freshly JSON-parsed, unmapped object and apply migrations as necessary
	 * @param typeRef
	 * @param data
	 * @return the unmapped and still encrypted instance
	 */
	async applyMigrations(typeModel: TypeModel, typeRef: TypeRef<Entity>, data: EntityAdapter): Promise<EntityAdapter> {
		if (isSameTypeRef(typeRef, GroupInfoTypeRef) && data._ownerGroup == null) {
			return this.applyCustomerGroupOwnershipToGroupInfo(data)
		} else if (isSameTypeRef(typeRef, TutanotaPropertiesTypeRef) && data._ownerEncSessionKey == null) {
			return this.encryptTutanotaProperties(data)
		} else if (isSameTypeRef(typeRef, PushIdentifierTypeRef) && data._ownerEncSessionKey == null) {
			return this.addSessionKeyToPushIdentifier(typeModel, data)
		} else {
			return data
		}
	}

	public async resolveWithBucketKey(instance: Entity): Promise<ResolvedSessionKeys> {
		const typeModel = await resolveClientTypeReference(instance._type)
		const bucketKey = assertNotNull(instance.bucketKey)

		let decryptedBucketKey: AesKey
		let unencryptedSenderAuthStatus: EncryptionAuthStatus | null = null
		let pqMessageSenderKey: X25519PublicKey | null = null
		if (bucketKey.keyGroup && bucketKey.pubEncBucketKey) {
			// bucket key is encrypted with public key for internal recipient
			const { decryptedAesKey, senderIdentityPubKey } = await this.asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(
				bucketKey.keyGroup,
				parseKeyVersion(bucketKey.recipientKeyVersion),
				asCryptoProtoocolVersion(bucketKey.protocolVersion),
				bucketKey.pubEncBucketKey,
				typeModel.name,
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
				keyGroup = assertNotNull(instance._ownerGroup)
			}

			decryptedBucketKey = await this.resolveWithGroupReference(keyGroup, groupKeyVersion, bucketKey.groupEncBucketKey)
			unencryptedSenderAuthStatus = EncryptionAuthStatus.AES_NO_AUTHENTICATION
		} else {
			throw new SessionKeyNotFoundError(`encrypted bucket key not set on instance ${instance._type} with id: ${downcast(instance)._id}`)
		}
		const resolvedSessionKeys = await this.collectAllInstanceSessionKeysAndAuthenticate(
			instance,
			decryptedBucketKey,
			unencryptedSenderAuthStatus,
			pqMessageSenderKey,
		)

		await this.ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(resolvedSessionKeys.instanceSessionKeys, typeModel)

		// for symmetrically encrypted instances _ownerEncSessionKey is sent from the server.
		// in this case it is not yet and we need to set it because the rest of the app expects it.
		const groupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(assertNotNull(instance._ownerGroup)) // get current key for encrypting
		const ownerEncSessionKey = encryptKeyWithVersionedKey(groupKey, resolvedSessionKeys.resolvedSessionKeyForInstance)
		this.setOwnerEncSessionKey(instance, ownerEncSessionKey)
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

	private async addSessionKeyToPushIdentifier(typeModel: TypeModel, instance: EntityAdapter): Promise<EntityAdapter> {
		const userGroupKey = this.userFacade.getCurrentUserGroupKey()

		// set sessionKey for allowing encryption when old instance (< v43) is updated
		await this.updateOwnerEncSessionKey(typeModel, instance, userGroupKey, aes256RandomKey())
		return instance
	}

	private async encryptTutanotaProperties(instance: EntityAdapter): Promise<EntityAdapter> {
		const userGroupKey = this.userFacade.getCurrentUserGroupKey()

		// EncryptTutanotaPropertiesService could be removed and replaced with a Migration that writes the key
		const groupEncSessionKey = encryptKeyWithVersionedKey(userGroupKey, aes256RandomKey())
		this.setOwnerEncSessionKey(instance, groupEncSessionKey, this.userFacade.getUserGroupId())
		const migrationData = createEncryptTutanotaPropertiesData({
			properties: elementIdPart(downcast<IdTuple>(instance._id)),
			symKeyVersion: String(groupEncSessionKey.encryptingKeyVersion),
			symEncSessionKey: groupEncSessionKey.key,
		})
		await this.serviceExecutor.post(EncryptTutanotaPropertiesService, migrationData)
		return instance
	}

	private async applyCustomerGroupOwnershipToGroupInfo(data: EntityAdapter): Promise<EntityAdapter> {
		const customerGroupMembership = assertNotNull(
			this.userFacade.getLoggedInUser().memberships.find((g: GroupMembership) => g.groupType === GroupType.Customer),
		)
		const listPermissions = await this.entityClient.loadAll(PermissionTypeRef, data._id[0])
		const customerGroupPermission = listPermissions.find((p) => p.group === customerGroupMembership.group)

		if (!customerGroupPermission) throw new SessionKeyNotFoundError("Permission not found, could not apply OwnerGroup migration")
		const customerGroupKeyVersion = parseKeyVersion(customerGroupPermission.symKeyVersion ?? "0")
		const customerGroupKey = await this.keyLoaderFacade.loadSymGroupKey(customerGroupMembership.group, customerGroupKeyVersion)
		const versionedCustomerGroupKey = { object: customerGroupKey, version: customerGroupKeyVersion }
		const listKey = decryptKey(customerGroupKey, assertNotNull(customerGroupPermission.symEncSessionKey))
		const groupInfoSk = decryptKey(listKey, assertNotNull(data._listEncSessionKey))

		this.setOwnerEncSessionKey(data, encryptKeyWithVersionedKey(versionedCustomerGroupKey, groupInfoSk), customerGroupMembership.group)
		return data
	}

	public setOwnerEncSessionKey(instance: Entity, ownerEncSessionKey: VersionedEncryptedKey, ownerGroup?: Id) {
		instance._ownerEncSessionKey = ownerEncSessionKey.key
		instance._ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()
		if (ownerGroup) {
			instance._ownerGroup = ownerGroup
		}
	}

	private async trySymmetricPermission(listPermissions: Permission[]): Promise<AesKey | null> {
		const symmetricPermission: Permission | null =
			listPermissions.find(
				(p) =>
					(p.type === PermissionType.Public_Symmetric || p.type === PermissionType.Symmetric) &&
					p._ownerGroup &&
					this.userFacade.hasGroup(p._ownerGroup),
			) ?? null

		if (symmetricPermission) {
			const gk = await this.keyLoaderFacade.loadSymGroupKey(
				assertNotNull(symmetricPermission._ownerGroup),
				parseKeyVersion(symmetricPermission._ownerKeyVersion ?? "0"),
			)
			return decryptKey(gk, assertNotNull(symmetricPermission._ownerEncSessionKey))
		} else {
			return null
		}
	}

	/**
	 * Resolves the session key for the provided instance and collects all other instances'
	 * session keys in order to update them.
	 */
	private async collectAllInstanceSessionKeysAndAuthenticate(
		instance: Entity,
		decBucketKey: number[],
		encryptionAuthStatus: EncryptionAuthStatus | null,
		pqMessageSenderKey: X25519PublicKey | null,
	): Promise<ResolvedSessionKeys> {
		const bucketKey = assertNotNull(instance.bucketKey)

		const id = downcast<SomeEntity>(instance)._id
		const elementId: Id = typeof id == "string" ? id : elementIdPart(id)

		let resolvedSessionKeyForInstance: AesKey | undefined = undefined
		const instanceSessionKeys = await promiseMap(bucketKey.bucketEncSessionKeys, async (instanceSessionKey) => {
			const decryptedSessionKey = decryptKey(decBucketKey, instanceSessionKey.symEncSessionKey)
			const groupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(assertNotNull(instance._ownerGroup))
			const ownerEncSessionKey = encryptKeyWithVersionedKey(groupKey, decryptedSessionKey)
			const instanceSessionKeyWithOwnerEncSessionKey = createInstanceSessionKey(instanceSessionKey)
			if (elementId == instanceSessionKey.instanceId) {
				resolvedSessionKeyForInstance = decryptedSessionKey
				const pqSenderKeyVersion =
					bucketKey.protocolVersion === CryptoProtocolVersion.TUTA_CRYPT ? parseKeyVersion(bucketKey.senderKeyVersion ?? "0") : null

				// we can only authenticate once we have the session key
				// because we need to check if the confidential flag is set, which is encrypted still
				// we need to do it here at the latest because we must write the flag when updating the session key on the instance
				await this.authenticateMainInstance(
					encryptionAuthStatus,
					pqMessageSenderKey,
					pqSenderKeyVersion,
					instance,
					resolvedSessionKeyForInstance,
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
			throw new SessionKeyNotFoundError("no session key for instance " + downcast<SomeEntity>(instance)._id)
		}
	}

	private async authenticateMainInstance(
		encryptionAuthStatus: EncryptionAuthStatus | null,
		pqMessageSenderKey: Uint8Array | null,
		pqMessageSenderKeyVersion: KeyVersion | null,
		instance: Entity,
		resolvedSessionKeyForInstance: AesKey,
		instanceSessionKeyWithOwnerEncSessionKey: InstanceSessionKey,
		decryptedSessionKey: AesKey,
		keyGroup: Id | null,
	) {
		// we only authenticate mail instances
		const isMailInstance = isSameTypeRef(MailTypeRef, instance._type)
		if (isMailInstance) {
			let mail: Mail = await this.getDecryptedMailFromAdapter(instance, resolvedSessionKeyForInstance)

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

	private async getDecryptedMailFromAdapter(instance: Entity, resolvedSessionKeyForInstance: AesKey): Promise<Mail> {
		let decryptedInstance: Entity = instance
		if (decryptedInstance.isAdapter) {
			const entityAdapter = downcast<EntityAdapter>(instance)
			const parsedInstance = await this.instancePipeline.cryptoMapper.decryptParsedInstance(
				await resolveClientTypeReference(instance._type),
				entityAdapter.encryptedParsedInstance as ServerModelEncryptedParsedInstance,
				resolvedSessionKeyForInstance,
			)
			decryptedInstance = await this.instancePipeline.modelMapper.mapToInstance(instance._type, parsedInstance)
		}
		return downcast<Mail>(decryptedInstance)
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

	private async resolveWithPublicOrExternalPermission(listPermissions: Permission[], instance: Entity, typeModel: TypeModel): Promise<AesKey> {
		const pubOrExtPermission = listPermissions.find((p) => p.type === PermissionType.Public || p.type === PermissionType.External) ?? null

		if (pubOrExtPermission == null) {
			const typeName = `${typeModel.app}/${typeModel.name}`
			throw new SessionKeyNotFoundError(`could not find permission for instance of type ${typeName} with id ${this.getElementIdFromInstance(instance)}`)
		}

		const bucketPermissions = await this.entityClient.loadAll(BucketPermissionTypeRef, assertNotNull(pubOrExtPermission.bucket).bucketPermissions)
		const bucketPermission = bucketPermissions.find(
			(bp) => (bp.type === BucketPermissionType.Public || bp.type === BucketPermissionType.External) && pubOrExtPermission._ownerGroup === bp._ownerGroup,
		)

		// find the bucket permission with the same group as the permission and public type
		if (bucketPermission == null) {
			throw new SessionKeyNotFoundError("no corresponding bucket permission found")
		}

		if (bucketPermission.type === BucketPermissionType.External) {
			return this.decryptWithExternalBucket(bucketPermission, pubOrExtPermission, instance)
		} else {
			return this.decryptWithPublicBucketWithoutAuthentication(bucketPermission, pubOrExtPermission, instance, typeModel)
		}
	}

	private async decryptWithExternalBucket(bucketPermission: BucketPermission, pubOrExtPermission: Permission, instance: Entity): Promise<AesKey> {
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
				`BucketEncSessionKey is not defined for Permission ${pubOrExtPermission._id} (Instance: ${JSON.stringify(instance)})`,
			)
		}

		return decryptKey(bucketKey, neverNull(pubOrExtPermission.bucketEncSessionKey))
	}

	private async decryptWithPublicBucketWithoutAuthentication(
		bucketPermission: BucketPermission,
		pubOrExtPermission: Permission,
		instance: Entity,
		typeModel: TypeModel,
	): Promise<AesKey> {
		const pubEncBucketKey = bucketPermission.pubEncBucketKey
		if (pubEncBucketKey == null) {
			throw new SessionKeyNotFoundError(
				`PubEncBucketKey is not defined for BucketPermission ${bucketPermission._id.toString()} (Instance: ${JSON.stringify(instance)})`,
			)
		}
		const bucketEncSessionKey = pubOrExtPermission.bucketEncSessionKey
		if (bucketEncSessionKey == null) {
			throw new SessionKeyNotFoundError(
				`BucketEncSessionKey is not defined for Permission ${pubOrExtPermission._id.toString()} (Instance: ${JSON.stringify(instance)})`,
			)
		}

		const { decryptedAesKey } = await this.asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(
			bucketPermission.group,
			parseKeyVersion(bucketPermission.pubKeyVersion ?? "0"),
			asCryptoProtoocolVersion(bucketPermission.protocolVersion),
			pubEncBucketKey,
			typeModel.name,
		)

		const sk = decryptKey(decryptedAesKey, bucketEncSessionKey)

		if (bucketPermission._ownerGroup) {
			// is not defined for some old AccountingInfos
			let bucketPermissionOwnerGroupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(neverNull(bucketPermission._ownerGroup)) // get current key for encrypting
			await this.updateWithSymPermissionKey(typeModel, instance, pubOrExtPermission, bucketPermission, bucketPermissionOwnerGroupKey, sk).catch(
				ofClass(NotFoundError, () => {
					console.log("w> could not find instance to update permission")
				}),
			)
		}
		return sk
	}

	/**
	 * Returns the session key for the provided service response:
	 * * null, if the instance is unencrypted
	 * * the decrypted _ownerPublicEncSessionKey, if it is available
	 * @param instance The unencrypted (client-side) or encrypted (server-side) instance
	 *
	 */
	async resolveServiceSessionKey(instance: EntityAdapter): Promise<Aes256Key | null> {
		if (instance._ownerPublicEncSessionKey) {
			// we assume the server uses the current key pair of the recipient
			const keypair = await this.keyLoaderFacade.loadCurrentKeyPair(assertNotNull(instance._ownerGroup))
			// we do not authenticate as we could remove data transfer type encryption altogether and only rely on tls
			return (
				await this.asymmetricCryptoFacade.decryptSymKeyWithKeyPair(
					keypair.object,
					assertEnumValue(CryptoProtocolVersion, assertNotNull(instance._publicCryptoProtocolVersion)),
					assertNotNull(instance._ownerPublicEncSessionKey),
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
	async setNewOwnerEncSessionKey(model: TypeModel, instance: Entity, keyToEncryptSessionKey?: VersionedKey): Promise<AesKey | null> {
		if (!instance._ownerGroup) {
			throw new Error(`no owner group set  ${JSON.stringify(instance)}`)
		}

		if (model.encrypted) {
			if (instance._ownerEncSessionKey) {
				throw new Error(`ownerEncSessionKey already set ${JSON.stringify(instance)}`)
			}
			const sessionKey = aes256RandomKey()
			const effectiveKeyToEncryptSessionKey = keyToEncryptSessionKey ?? (await this.keyLoaderFacade.getCurrentSymGroupKey(instance._ownerGroup))
			const encryptedSessionKey = encryptKeyWithVersionedKey(effectiveKeyToEncryptSessionKey, sessionKey)

			this.setOwnerEncSessionKey(instance, encryptedSessionKey)
			return sessionKey
		}
		return null
	}

	async encryptBucketKeyForInternalRecipient(
		senderUserGroupId: Id,
		bucketKey: AesKey,
		recipientMailAddress: string,
		notFoundRecipients: Array<string>,
		keyVerificationMismatchRecipients: Array<string>,
	): Promise<InternalRecipientKeyData | SymEncInternalRecipientKeyData | null> {
		try {
			const publicKey = await this.publicKeyProvider.loadCurrentPubKey({
				identifier: recipientMailAddress,
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
			})

			// Check if recipient is still verified for recipientMailAddress
			const keyVerificationFacade = await this.lazyKeyVerificationFacade()
			if ((await keyVerificationFacade.resolveVerificationState(recipientMailAddress, publicKey)) == KeyVerificationState.MISMATCH) {
				keyVerificationMismatchRecipients.push(recipientMailAddress)
			}

			// We do not create any key data in case there is one not found recipient or not verified, but we want to
			// collect ALL failed recipients when iterating a recipient list.
			if (notFoundRecipients.length !== 0 || keyVerificationMismatchRecipients.length !== 0) {
				return null
			}

			const isExternalSender = this.userFacade.getUser()?.accountType === AccountType.EXTERNAL
			// we only encrypt symmetric as external sender if the recipient supports tuta-crypt.
			// Clients need to support symmetric decryption from external users. We can always encrypt symmetricly when old clients are deactivated that don't support tuta-crypt.
			if (isVersionedPqPublicKey(publicKey) && isExternalSender) {
				return this.createSymEncInternalRecipientKeyData(recipientMailAddress, bucketKey)
			} else {
				return this.createPubEncInternalRecipientKeyData(bucketKey, recipientMailAddress, publicKey, senderUserGroupId)
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
		recipientPublicKeys: Versioned<PublicKey>,
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
	private async updateWithSymPermissionKey(
		typeModel: TypeModel,
		instance: Entity,
		permission: Permission,
		bucketPermission: BucketPermission,
		permissionOwnerGroupKey: VersionedKey,
		sessionKey: AesKey,
	): Promise<void> {
		if (instance.isAdapter !== true || !this.userFacade.isLeader()) {
			// do not update the session key in case of an unencrypted client side instance
			// or in case we are not the leader client
			return
		}

		if (!instance._ownerEncSessionKey && permission._ownerGroup === instance._ownerGroup) {
			return this.updateOwnerEncSessionKey(typeModel, downcast<EntityAdapter>(instance), permissionOwnerGroupKey, sessionKey)
		} else {
			// instances shared via permissions (e.g. body)
			const encryptedKey = encryptKeyWithVersionedKey(permissionOwnerGroupKey, sessionKey)
			let updateService = createUpdatePermissionKeyData({
				ownerKeyVersion: String(encryptedKey.encryptingKeyVersion),
				ownerEncSessionKey: encryptedKey.key,
				permission: permission._id,
				bucketPermission: bucketPermission._id,
			})
			await this.serviceExecutor.post(UpdatePermissionKeyService, updateService)
		}
	}

	/**
	 * Resolves the ownerEncSessionKey of a mail. This might be needed if it wasn't updated yet
	 * by the OwnerEncSessionKeysUpdateQueue but the file is already downloaded.
	 * @param mainInstance the instance that has the bucketKey
	 * @param childInstances the files that belong to the mainInstance
	 */
	async enforceSessionKeyUpdateIfNeeded(instance: SomeEntity, childInstances: readonly File[]): Promise<File[]> {
		if (!childInstances.some((f) => f._ownerEncSessionKey == null)) {
			return childInstances.slice()
		}
		const outOfSyncInstances = childInstances.filter((f) => f._ownerEncSessionKey == null)
		if (instance.bucketKey) {
			// invoke updateSessionKeys service in case a bucket key is still available
			const resolvedSessionKeys = await this.resolveWithBucketKey(instance)
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

	private async updateOwnerEncSessionKey(typeModel: TypeModel, instance: EntityAdapter, ownerGroupKey: VersionedKey, resolvedSessionKey: AesKey) {
		const newOwnerEncSessuionKey = encryptKeyWithVersionedKey(ownerGroupKey, resolvedSessionKey)
		this.setOwnerEncSessionKey(instance, newOwnerEncSessuionKey)

		const id = instance._id
		const path = (await typeRefToRestPath(instance._type)) + "/" + (id instanceof Array ? id.join("/") : id)
		const headers = this.userFacade.createAuthHeaders()
		headers.v = typeModel.version

		const untypedInstance = await this.instancePipeline.typeMapper.applyDbTypes(
			instance.typeModel,
			instance.encryptedParsedInstance as ClientModelEncryptedParsedInstance,
		)

		await this.restClient
			.request(path, HttpMethod.PUT, {
				headers,
				body: JSON.stringify(untypedInstance),
				queryParams: { updateOwnerEncSessionKey: "true" },
			})
			.catch(
				ofClass(PayloadTooLargeError, (e) => {
					console.log("Could not update owner enc session key - PayloadTooLargeError", e)
				}),
			)
	}

	private getElementIdFromInstance(instance: Record<string, any>): Id {
		if (typeof instance._id === "string") {
			return instance._id
		} else {
			const idTuple = instance._id as IdTuple
			return elementIdPart(idTuple)
		}
	}

	/*************************** Migrations **********************************/
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
