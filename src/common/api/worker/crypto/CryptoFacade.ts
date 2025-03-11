import {
	assertNotNull,
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
	PermissionType,
	PublicKeyIdentifierType,
	SYSTEM_GROUP_MAIL_ADDRESS,
} from "../../common/TutanotaConstants"
import { getAttributeId, HttpMethod, resolveTypeReference } from "../../common/EntityFunctions"
import type { BucketKey, BucketPermission, GroupMembership, InstanceSessionKey, Permission } from "../../entities/sys/TypeRefs.js"
import {
	BucketKeyTypeRef,
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
	MailAddress,
	MailAddressTypeRef,
	MailTypeRef,
	SymEncInternalRecipientKeyData,
	TutanotaPropertiesTypeRef,
} from "../../entities/tutanota/TypeRefs.js"
import { typeRefToRestPath } from "../rest/EntityRestClient"
import { LockedError, NotFoundError, PayloadTooLargeError, TooManyRequestsError } from "../../common/error/RestError"
import { SessionKeyNotFoundError } from "../../common/error/SessionKeyNotFoundError"
import { birthdayToIsoDate, oldBirthdayToBirthday } from "../../common/utils/BirthdayUtils"
import type { Entity, Instance, SomeEntity, TypeModel } from "../../common/EntityTypes"
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
	EccPublicKey,
	encryptKey,
	isPqKeyPairs,
	sha256Hash,
} from "@tutao/tutanota-crypto"
import { RecipientNotResolvedError } from "../../common/error/RecipientNotResolvedError"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { EncryptTutanotaPropertiesService } from "../../entities/tutanota/Services"
import { UpdatePermissionKeyService } from "../../entities/sys/Services"
import { UserFacade } from "../facades/UserFacade"
import { elementIdPart, getElementId, getListId, isSameId, listIdPart } from "../../common/utils/EntityUtils.js"
import { InstanceMapper } from "./InstanceMapper.js"
import { OwnerEncSessionKeysUpdateQueue } from "./OwnerEncSessionKeysUpdateQueue.js"
import { DefaultEntityRestCache } from "../rest/DefaultEntityRestCache.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { KeyLoaderFacade, parseKeyVersion } from "../facades/KeyLoaderFacade.js"
import { encryptKeyWithVersionedKey, VersionedEncryptedKey, VersionedKey } from "./CryptoWrapper.js"
import { AsymmetricCryptoFacade } from "./AsymmetricCryptoFacade.js"
import { PublicKeyProvider, PublicKeys } from "../facades/PublicKeyProvider.js"
import { KeyVersion } from "@tutao/tutanota-utils/dist/Utils.js"
import { KeyRotationFacade } from "../facades/KeyRotationFacade.js"

assertWorkerOrNode()

// Unmapped encrypted owner group instance
type UnmappedOwnerGroupInstance = {
	_ownerEncSessionKey: string
	_ownerKeyVersion: NumberString
	_ownerGroup: Id
}

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
		private readonly instanceMapper: InstanceMapper,
		private readonly ownerEncSessionKeysUpdateQueue: OwnerEncSessionKeysUpdateQueue,
		private readonly cache: DefaultEntityRestCache | null,
		private readonly keyLoaderFacade: KeyLoaderFacade,
		private readonly asymmetricCryptoFacade: AsymmetricCryptoFacade,
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

	async resolveSessionKeyForInstance(instance: SomeEntity): Promise<AesKey | null> {
		const typeModel = await resolveTypeReference(instance._type)
		const mappedInstance = await this.instanceMapper.mapToLiteral(instance)
		return this.resolveSessionKey(typeModel, mappedInstance)
	}

	/** Helper for the rare cases when we needed it on the client side. */
	async resolveSessionKeyForInstanceBinary(instance: SomeEntity): Promise<Uint8Array | null> {
		const key = await this.resolveSessionKeyForInstance(instance)
		return key == null ? null : bitArrayToUint8Array(key)
	}

	/** Resolve a session key an {@param instance} using an already known {@param ownerKey}. */
	resolveSessionKeyWithOwnerKey(ownerEncSessionKey: Uint8Array | string, ownerKey: AesKey): AesKey {
		const key = typeof ownerEncSessionKey === "string" ? base64ToUint8Array(ownerEncSessionKey) : ownerEncSessionKey
		return decryptKey(ownerKey, key)
	}

	async decryptSessionKey(underScoredOwnerGroup: Id, ownerEncSessionKey: VersionedEncryptedKey): Promise<AesKey> {
		const gk = await this.keyLoaderFacade.loadSymGroupKey(underScoredOwnerGroup, ownerEncSessionKey.encryptingKeyVersion)
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
	async resolveSessionKey(typeModel: TypeModel, instance: Record<number, any>): Promise<AesKey | null> {
		const typeRef: TypeRef<SomeEntity> = new TypeRef(typeModel.app, typeModel.id)

		try {
			if (!typeModel.encrypted) {
				return null
			}

			const bucketKeyAttrId = await getAttributeId(typeRef, "bucketKey")
			const instanceBucketKey = bucketKeyAttrId ? instance[bucketKeyAttrId] : null

			const underscoredOwnerEncSessionKeyAttrId = await getAttributeId(typeRef, "_ownerEncSessionKey")
			const instanceUnderscoredOwnerEncSessionKey = underscoredOwnerEncSessionKeyAttrId ? instance[underscoredOwnerEncSessionKeyAttrId] : null

			const ownerEncSessionKeyAttrId = await getAttributeId(typeRef, "ownerEncSessionKey")
			const instanceOwnerEncSessionKey = ownerEncSessionKeyAttrId ? instance[ownerEncSessionKeyAttrId] : null

			const underscoredOwnerGroupAttrId = await getAttributeId(typeRef, "_ownerGroup")
			const underscoredOwnerGroup = underscoredOwnerGroupAttrId ? instance[underscoredOwnerGroupAttrId] : null

			if (instanceBucketKey) {
				// await this.instanceMapper.mapFromLiteral()
				// if we have a bucket key, then we need to cache the session keys stored in the bucket key for details, files, etc.
				// we need to do this BEFORE we check the owner enc session key
				const bucketKeyNamedLiteral: Record<string, any> = await this.instanceMapper.mapFromLiteral(
					instanceBucketKey,
					await resolveTypeReference(BucketKeyTypeRef),
				)
				const bucketKey = bucketKeyNamedLiteral as BucketKey
				const resolvedSessionKeys = await this.resolveWithBucketKey(bucketKey, instance, typeModel)
				return resolvedSessionKeys.resolvedSessionKeyForInstance
			} else if (
				instanceUnderscoredOwnerEncSessionKey &&
				this.userFacade.isFullyLoggedIn() &&
				this.userFacade.hasGroup(assertNotNull(underscoredOwnerGroup))
			) {
				// fixme: should evereyting here not have keyVersion?
				const instanceUnderscoredOwnerKeyVersionAttrId = await getAttributeId(typeRef, "_ownerKeyVersion")
				const instanceUnderscoredOwnerKeyVersion = instanceUnderscoredOwnerKeyVersionAttrId ? instance[instanceUnderscoredOwnerKeyVersionAttrId] : "0"

				const gk = await this.keyLoaderFacade.loadSymGroupKey(underscoredOwnerGroup, parseKeyVersion(instanceUnderscoredOwnerKeyVersion))
				return this.resolveSessionKeyWithOwnerKey(instanceUnderscoredOwnerEncSessionKey, gk)
			} else if (instanceOwnerEncSessionKey) {
				// fixme: should evereyting here not have keyVersion?
				const instanceOwnerKeyVersionAttrId = await getAttributeId(typeRef, "ownerKeyVersion")
				const instanceOwnerKeyVersion = instanceOwnerKeyVersionAttrId ? instance[instanceOwnerKeyVersionAttrId] : "0"

				// Likely a DataTransferType, so this is a service.
				const gk = await this.keyLoaderFacade.loadSymGroupKey(this.userFacade.getGroupId(GroupType.Mail), parseKeyVersion(instanceOwnerKeyVersion))
				return this.resolveSessionKeyWithOwnerKey(instanceUnderscoredOwnerEncSessionKey, gk)
			} else {
				// See PermissionType jsdoc for more info on permissions
				const instancePermission = instance[assertNotNull(await getAttributeId(typeRef, "_permissions"))]
				const permissions = await this.entityClient.loadAll(PermissionTypeRef, instancePermission)
				return (await this.trySymmetricPermission(permissions)) ?? (await this.resolveWithPublicOrExternalPermission(permissions, instance, typeModel))
			}
		} catch (e) {
			const instanceId = instance[assertNotNull(await getAttributeId(typeRef, "_id"))]

			if (e instanceof CryptoError) {
				console.log("failed to resolve session key", e)
				throw new SessionKeyNotFoundError("Crypto error while resolving session key for instance " + instanceId)
			} else {
				throw e
			}
		}
	}

	/**
	 * Takes a freshly JSON-parsed, unmapped object and apply migrations as necessary
	 * @param typeRef
	 * @param data
	 * @return the unmapped and still encrypted instance
	 */
	async applyMigrations<T extends SomeEntity>(typeRef: TypeRef<T>, data: Record<number, any>): Promise<Record<number, any>> {
		// FIXME: TEST NOTE:
		// test if migration work when changing field & type from encrypted -> non encrypted and vice versa
		const noUnderscoredOwnerGroup = (await getAttributeId(typeRef, "_ownerGroup")) == null
		const noUnderscoredOwnerEncSessionKey = (await getAttributeId(typeRef, "_ownerGroup")) == null
		if (isSameTypeRef(typeRef, GroupInfoTypeRef) && noUnderscoredOwnerGroup) {
			return this.applyCustomerGroupOwnershipToGroupInfo(data)
		} else if (isSameTypeRef(typeRef, TutanotaPropertiesTypeRef) && noUnderscoredOwnerEncSessionKey) {
			return this.encryptTutanotaProperties(data)
		} else if (isSameTypeRef(typeRef, PushIdentifierTypeRef) && noUnderscoredOwnerEncSessionKey) {
			return this.addSessionKeyToPushIdentifier(data)
		} else {
			return data
		}
	}

	private async decryptBucketKey(bucketKey: BucketKey, ownerGroup: Id): Promise<BucketKeyDecryptionResult | null> {
		if (bucketKey.keyGroup && bucketKey.pubEncBucketKey) {
			// bucket key is encrypted with public key for internal recipient
			const { decryptedAesKey, senderIdentityPubKey } = await this.asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(
				bucketKey.keyGroup,
				parseKeyVersion(bucketKey.recipientKeyVersion),
				asCryptoProtoocolVersion(bucketKey.protocolVersion),
				bucketKey.pubEncBucketKey,
			)
			return {
				pqMessageSenderKey: senderIdentityPubKey,
				decryptedBucketKey: decryptedAesKey,
				unencryptedSenderAuthStatus: null,
			}
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
				keyGroup = neverNull(ownerGroup)
			}

			const decryptedBucketKey = await this.resolveWithGroupReference(keyGroup, groupKeyVersion, bucketKey.groupEncBucketKey)
			const unencryptedSenderAuthStatus = EncryptionAuthStatus.AES_NO_AUTHENTICATION
			return {
				decryptedBucketKey,
				unencryptedSenderAuthStatus,
				pqMessageSenderKey: null,
			}
		}

		return null
	}

	public async resolveWithBucketKeyForMail(bucketKey: BucketKey, mail: Mail) {
		const senderAdress = mail.confidential ? mail.sender.address : SYSTEM_GROUP_MAIL_ADDRESS
		const ownerGroup = assertNotNull(mail._ownerGroup)

		const { decryptedBucketKey, unencryptedSenderAuthStatus, pqMessageSenderKey } = await this.decryptBucketKey(bucketKey, ownerGroup).then((r) => {
			if (r === null) throw new SessionKeyNotFoundError(`encrypted bucket key not set on instance Mail}`)
			return r
		})

		return await this.collectAllInstanceSessionKeysAndAuthenticate(
			bucketKey,
			decryptedBucketKey,
			mail._id,
			senderAdress,
			ownerGroup,
			await resolveTypeReference(MailTypeRef),
			unencryptedSenderAuthStatus,
			pqMessageSenderKey,
		)
	}

	public async resolveWithBucketKey(bucketKey: BucketKey, instance: Record<number, any>, typeModel: TypeModel): Promise<ResolvedSessionKeys> {
		const typeRef: TypeRef<SomeEntity> = new TypeRef(typeModel.app, typeModel.id)
		const underscoredOwnerGroup = instance[assertNotNull(await getAttributeId(typeRef, "_ownerGroup"))]
		const underscoredOwnerKeyVersion = instance[assertNotNull(await getAttributeId(typeRef, "_ownerKeyVersion"))]
		const underscoredOwnerEncSessionKey = instance[assertNotNull(await getAttributeId(typeRef, "_ownerEncSessionKey"))]
		const instanceId = instance[assertNotNull(await getAttributeId(typeRef, "_id"))]

		let senderAdress = SYSTEM_GROUP_MAIL_ADDRESS
		if (isSameTypeRef(typeRef, MailTypeRef)) {
			const isConfidential = instance[assertNotNull(await getAttributeId(MailTypeRef, "confidential"))] == "1"
			if (isConfidential) {
				const senderLiteral = instance[assertNotNull(await getAttributeId(MailTypeRef, "sender"))]
				const sender = (await this.instanceMapper.mapFromLiteral(senderLiteral, await resolveTypeReference(MailAddressTypeRef))) as MailAddress
				senderAdress = assertNotNull(sender).address
			}
		}

		const { decryptedBucketKey, unencryptedSenderAuthStatus, pqMessageSenderKey } = await this.decryptBucketKey(bucketKey, underscoredOwnerGroup).then(
			(r) => {
				if (r === null) throw new SessionKeyNotFoundError(`encrypted bucket key not set on instance ${typeModel.name}`)
				return r
			},
		)

		const resolvedSessionKeys = await this.collectAllInstanceSessionKeysAndAuthenticate(
			bucketKey,
			decryptedBucketKey,
			instanceId,
			senderAdress,
			underscoredOwnerGroup,
			typeModel,
			unencryptedSenderAuthStatus,
			pqMessageSenderKey,
		)

		await this.ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(resolvedSessionKeys.instanceSessionKeys, typeModel)

		// for symmetrically encrypted instances _ownerEncSessionKey is sent from the server.
		// in this case it is not yet and we need to set it because the rest of the app expects it.
		const groupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(underscoredOwnerGroup) // get current key for encrypting
		await this.setOwnerEncSessionKeyUnmapped(instance, typeRef, encryptKeyWithVersionedKey(groupKey, resolvedSessionKeys.resolvedSessionKeyForInstance))

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

	private async addSessionKeyToPushIdentifier(data: Record<number, any>): Promise<Record<number, any>> {
		const userGroupKey = this.userFacade.getCurrentUserGroupKey()

		// set sessionKey for allowing encryption when old instance (< v43) is updated
		const typeModel = await resolveTypeReference(PushIdentifierTypeRef)
		await this.updateOwnerEncSessionKey(typeModel, data, userGroupKey, aes256RandomKey())
		return data
	}

	private async encryptTutanotaProperties(data: Record<number, any>): Promise<Record<number, any>> {
		const userGroupKey = this.userFacade.getCurrentUserGroupKey()
		const underscoredId = data[assertNotNull(await getAttributeId(TutanotaPropertiesTypeRef, "_id"))]

		// EncryptTutanotaPropertiesService could be removed and replaced with a Migration that writes the key
		const groupEncSessionKey = encryptKeyWithVersionedKey(userGroupKey, aes256RandomKey())
		await this.setOwnerEncSessionKeyUnmapped(data, TutanotaPropertiesTypeRef, groupEncSessionKey, this.userFacade.getUserGroupId())
		const migrationData = createEncryptTutanotaPropertiesData({
			properties: underscoredId,
			symKeyVersion: String(groupEncSessionKey.encryptingKeyVersion),
			symEncSessionKey: groupEncSessionKey.key,
		})
		await this.serviceExecutor.post(EncryptTutanotaPropertiesService, migrationData)
		return data
	}

	private async applyCustomerGroupOwnershipToGroupInfo(data: Record<number, any>): Promise<Record<number, any>> {
		const underscoredId = data[assertNotNull(await getAttributeId(GroupInfoTypeRef, "_id"))]
		const underscoredListEncSessionKey = data[assertNotNull(await getAttributeId(GroupInfoTypeRef, "_listEncSessionKey"))]

		const customerGroupMembership = assertNotNull(
			this.userFacade.getLoggedInUser().memberships.find((g: GroupMembership) => g.groupType === GroupType.Customer),
		)
		const listPermissions = await this.entityClient.loadAll(PermissionTypeRef, listIdPart(underscoredId))
		const customerGroupPermission = listPermissions.find((p) => p.group === customerGroupMembership.group)

		if (!customerGroupPermission) throw new SessionKeyNotFoundError("Permission not found, could not apply OwnerGroup migration")
		const customerGroupKeyVersion = parseKeyVersion(customerGroupPermission.symKeyVersion ?? "0")
		const customerGroupKey = await this.keyLoaderFacade.loadSymGroupKey(customerGroupMembership.group, customerGroupKeyVersion)
		const versionedCustomerGroupKey = { object: customerGroupKey, version: customerGroupKeyVersion }
		const listKey = decryptKey(customerGroupKey, assertNotNull(customerGroupPermission.symEncSessionKey))
		const groupInfoSk = decryptKey(listKey, base64ToUint8Array(underscoredListEncSessionKey))

		await this.setOwnerEncSessionKeyUnmapped(
			data,
			GroupInfoTypeRef,
			encryptKeyWithVersionedKey(versionedCustomerGroupKey, groupInfoSk),
			customerGroupMembership.group,
		)
		return data
	}

	private async setOwnerEncSessionKeyUnmapped(
		unmappedInstance: Record<number, any>,
		typeRef: TypeRef<SomeEntity>,
		key: VersionedEncryptedKey,
		ownerGroup?: Id,
	) {
		unmappedInstance[assertNotNull(await getAttributeId(typeRef, "_ownerEncSessionKey"))] = uint8ArrayToBase64(key.key)
		unmappedInstance[assertNotNull(await getAttributeId(typeRef, "_ownerKeyVersion"))] = key.encryptingKeyVersion.toString()

		if (ownerGroup) {
			unmappedInstance[assertNotNull(await getAttributeId(typeRef, "_ownerGroup"))] = ownerGroup
		}
	}

	private setOwnerEncSessionKey(instance: Instance, key: VersionedEncryptedKey) {
		instance._ownerEncSessionKey = key.key
		instance._ownerKeyVersion = key.encryptingKeyVersion.toString()
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
		bucketKey: BucketKey,
		decBucketKey: number[],
		instanceId: Id | IdTuple,
		senderAddress: string,
		ownerGroup: Id,
		typeModel: TypeModel,
		encryptionAuthStatus: EncryptionAuthStatus | null,
		pqMessageSenderKey: EccPublicKey | null,
	): Promise<ResolvedSessionKeys> {
		const instanceElementId = typeof instanceId === "string" ? instanceId : elementIdPart(instanceId)
		const typeRef: TypeRef<SomeEntity> = new TypeRef(typeModel.app, typeModel.id)
		const isMailInstance = isSameTypeRef(MailTypeRef, typeRef)

		let resolvedSessionKeyForInstance: AesKey | undefined = undefined
		const instanceSessionKeys = await promiseMap(bucketKey.bucketEncSessionKeys, async (instanceSessionKey) => {
			const decryptedSessionKey = decryptKey(decBucketKey, instanceSessionKey.symEncSessionKey)
			const groupKey = await this.keyLoaderFacade.getCurrentSymGroupKey(ownerGroup)
			const ownerEncSessionKey = encryptKeyWithVersionedKey(groupKey, decryptedSessionKey)
			const instanceSessionKeyWithOwnerEncSessionKey = createInstanceSessionKey(instanceSessionKey)
			if (isMailInstance && isSameId(instanceElementId, instanceSessionKey.instanceId)) {
				resolvedSessionKeyForInstance = decryptedSessionKey
				// we can only authenticate once we have the session key
				// because we need to check if the confidential flag is set, which is encrypted still
				// we need to do it here at the latest because we must write the flag when updating the session key on the instance
				await this.authenticateMailInstance(
					encryptionAuthStatus,
					pqMessageSenderKey,
					bucketKey.protocolVersion === CryptoProtocolVersion.TUTA_CRYPT ? parseKeyVersion(bucketKey.senderKeyVersion ?? "0") : null,
					senderAddress,
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
			// FIXME: is it ok to log only element Id?
			throw new SessionKeyNotFoundError("no session key for instance " + instanceId)
		}
	}

	private async authenticateMailInstance(
		encryptionAuthStatus: EncryptionAuthStatus | null,
		pqMessageSenderKey: Uint8Array | null,
		pqMessageSenderKeyVersion: KeyVersion | null,
		senderMailAddress: string,
		instanceSessionKeyWithOwnerEncSessionKey: InstanceSessionKey,
		decryptedSessionKey: number[],
		keyGroup: Id | null,
	) {
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

	private async resolveWithPublicOrExternalPermission(listPermissions: Permission[], instance: Record<number, any>, typeModel: TypeModel): Promise<AesKey> {
		const pubOrExtPermission = listPermissions.find((p) => p.type === PermissionType.Public || p.type === PermissionType.External) ?? null

		if (pubOrExtPermission == null) {
			const typeName = `${typeModel.app}/${typeModel.name}`
			const id = await this.getElementIdFromInstance(typeModel, instance)
			throw new SessionKeyNotFoundError(`could not find permission for instance of type ${typeName} with id ${id}`)
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
			return this.decryptWithPublicBucketWithoutAuthentication(bucketPermission, instance, pubOrExtPermission, typeModel)
		}
	}

	private async decryptWithExternalBucket(
		bucketPermission: BucketPermission,
		pubOrExtPermission: Permission,
		instance: Record<string, any>,
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
				`BucketEncSessionKey is not defined for Permission ${pubOrExtPermission._id.toString()} (Instance: ${JSON.stringify(instance)})`,
			)
		}

		return decryptKey(bucketKey, neverNull(pubOrExtPermission.bucketEncSessionKey))
	}

	private async decryptWithPublicBucketWithoutAuthentication(
		bucketPermission: BucketPermission,
		instance: Record<number, any>,
		pubOrExtPermission: Permission,
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
	async setNewOwnerEncSessionKey(model: TypeModel, entity: Record<string, any>, keyToEncryptSessionKey?: VersionedKey): Promise<AesKey | null> {
		if (!entity._ownerGroup) {
			throw new Error(`no owner group set  ${JSON.stringify(entity)}`)
		}

		if (model.encrypted) {
			if (entity._ownerEncSessionKey) {
				throw new Error(`ownerEncSessionKey already set ${JSON.stringify(entity)}`)
			}

			const sessionKey = aes256RandomKey()
			const effectiveKeyToEncryptSessionKey = keyToEncryptSessionKey ?? (await this.keyLoaderFacade.getCurrentSymGroupKey(entity._ownerGroup))
			const encryptedSessionKey = encryptKeyWithVersionedKey(effectiveKeyToEncryptSessionKey, sessionKey)
			this.setOwnerEncSessionKey(entity as Instance, encryptedSessionKey)
			return sessionKey
		} else {
			return null
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
	private async updateWithSymPermissionKey(
		typeModel: TypeModel,
		instance: Record<number, any>,
		permission: Permission,
		bucketPermission: BucketPermission,
		permissionOwnerGroupKey: VersionedKey,
		sessionKey: AesKey,
	): Promise<void> {
		if (!this.userFacade.isLeader()) {
			// do not update the session key in case we are not the leader client
			return
		}
		const noUnderscoredOwnerEncSessionKey =
			instance[assertNotNull(await getAttributeId(new TypeRef(typeModel.app, typeModel.id), "_ownerEncSessionKey"))] == null
		const instanceOwnerGroup = instance[assertNotNull(await getAttributeId(new TypeRef(typeModel.app, typeModel.id), "_ownerGroup"))]

		if (noUnderscoredOwnerEncSessionKey && permission._ownerGroup === instanceOwnerGroup) {
			return this.updateOwnerEncSessionKey(typeModel, instance, permissionOwnerGroupKey, sessionKey)
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
	async enforceSessionKeyUpdateIfNeeded(mainInstance: Mail, childInstances: readonly File[]): Promise<File[]> {
		if (!childInstances.some((f) => f._ownerEncSessionKey == null)) {
			return childInstances.slice()
		}
		const typeModel = await resolveTypeReference(mainInstance._type)
		const outOfSyncInstances = childInstances.filter((f) => f._ownerEncSessionKey == null)
		if (mainInstance.bucketKey) {
			// invoke updateSessionKeys service in case a bucket key is still available
			const resolvedSessionKeys = await this.resolveWithBucketKey(mainInstance.bucketKey, mainInstance, typeModel)
			await this.ownerEncSessionKeysUpdateQueue.postUpdateSessionKeysService(resolvedSessionKeys.instanceSessionKeys)
		} else {
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

	private async updateOwnerEncSessionKey(
		typeModel: TypeModel,
		instance: Record<number, any>,
		ownerGroupKey: VersionedKey,
		sessionKey: AesKey,
	): Promise<void> {
		const typeRef: TypeRef<SomeEntity> = new TypeRef(typeModel.app, typeModel.id)
		const underscoredId = instance[assertNotNull(await getAttributeId(typeRef, "_id"))]
		// we have to call the rest client directly because instance is still the encrypted server-side version
		const typePath = await typeRefToRestPath(typeRef)

		await this.setOwnerEncSessionKeyUnmapped(instance, typeRef, encryptKeyWithVersionedKey(ownerGroupKey, sessionKey))
		const path = typePath + "/" + (underscoredId instanceof Array ? underscoredId.join("/") : underscoredId)
		const headers = this.userFacade.createAuthHeaders()
		headers.v = typeModel.version
		return this.restClient
			.request(path, HttpMethod.PUT, {
				headers,
				body: JSON.stringify(instance),
				queryParams: { updateOwnerEncSessionKey: "true" },
			})
			.catch(
				ofClass(PayloadTooLargeError, (e) => {
					console.log("Could not update owner enc session key - PayloadTooLargeError", e)
				}),
			)
	}

	private async getElementIdFromInstance(typeModel: TypeModel, instance: Record<number, any>): Promise<Id> {
		const instanceId = instance[assertNotNull(await getAttributeId(new TypeRef(typeModel.app, typeModel.id), "_id"))]
		return typeof instanceId === "string" ? instanceId : elementIdPart(instanceId)
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

type BucketKeyDecryptionResult = {
	pqMessageSenderKey: EccPublicKey | null
	decryptedBucketKey: AesKey
	unencryptedSenderAuthStatus: EncryptionAuthStatus | null
}
