import {
	arrayEquals,
	assertNotNull,
	base64ToUint8Array,
	downcast,
	isSameTypeRef,
	isSameTypeRefByAttr,
	neverNull,
	noOp,
	ofClass,
	promiseMap,
	stringToUtf8Uint8Array,
	TypeRef,
	uint8ArrayToBase64,
	uint8ArrayToHex,
} from "@tutao/tutanota-utils"
import {
	AccountType,
	assertEnumValue,
	BucketPermissionType,
	CryptoProtocolVersion,
	EncryptionAuthStatus,
	GroupType,
	PermissionType,
	SYSTEM_GROUP_MAIL_ADDRESS,
} from "../../common/TutanotaConstants"
import { HttpMethod, resolveTypeReference } from "../../common/EntityFunctions"
import type { BucketKey, BucketPermission, GroupMembership, InstanceSessionKey, Permission, PublicKeyGetOut } from "../../entities/sys/TypeRefs.js"
import {
	BucketKeyTypeRef,
	BucketPermissionTypeRef,
	createInstanceSessionKey,
	createPublicKeyGetIn,
	createPublicKeyPutIn,
	createUpdatePermissionKeyData,
	GroupInfoTypeRef,
	GroupTypeRef,
	PermissionTypeRef,
	PushIdentifierTypeRef,
} from "../../entities/sys/TypeRefs.js"
import type { Contact, InternalRecipientKeyData, Mail, SymEncInternalRecipientKeyData } from "../../entities/tutanota/TypeRefs.js"
import {
	ContactTypeRef,
	createEncryptTutanotaPropertiesData,
	createInternalRecipientKeyData,
	createSymEncInternalRecipientKeyData,
	MailTypeRef,
	TutanotaPropertiesTypeRef,
} from "../../entities/tutanota/TypeRefs.js"
import { typeRefToPath } from "../rest/EntityRestClient"
import { LockedError, NotFoundError, PayloadTooLargeError, TooManyRequestsError } from "../../common/error/RestError"
import { SessionKeyNotFoundError } from "../../common/error/SessionKeyNotFoundError" // importing with {} from CJS modules is not supported for dist-builds currently (must be a systemjs builder bug) // importing with {} from CJS modules is not supported for dist-builds currently (must be a systemjs builder bug)
import { birthdayToIsoDate, oldBirthdayToBirthday } from "../../common/utils/BirthdayUtils"
import type { Entity, SomeEntity, TypeModel } from "../../common/EntityTypes"
import { assertWorkerOrNode } from "../../common/Env"
import type { EntityClient } from "../../common/EntityClient"
import { RestClient } from "../rest/RestClient"
import {
	Aes128Key,
	Aes256Key,
	aes256RandomKey,
	aesEncrypt,
	AsymmetricKeyPair,
	AsymmetricPublicKey,
	bitArrayToUint8Array,
	bytesToKyberPublicKey,
	decryptKey,
	decryptKeyPair,
	EccKeyPair,
	EccPublicKey,
	ENABLE_MAC,
	encryptEccKey,
	encryptKey,
	generateEccKeyPair,
	hexToRsaPublicKey,
	isPqKeyPairs,
	isPqPublicKey,
	isRsaEccKeyPair,
	isRsaOrRsaEccKeyPair,
	isRsaPublicKey,
	IV_BYTE_LENGTH,
	KeyPairType,
	random,
	RsaPrivateKey,
	sha256Hash,
	uint8ArrayToBitArray,
} from "@tutao/tutanota-crypto"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { RecipientNotResolvedError } from "../../common/error/RecipientNotResolvedError"
import type { RsaImplementation } from "./RsaImplementation"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { EncryptTutanotaPropertiesService } from "../../entities/tutanota/Services"
import { PublicKeyService, UpdatePermissionKeyService } from "../../entities/sys/Services"
import { UserFacade } from "../facades/UserFacade"
import { elementIdPart } from "../../common/utils/EntityUtils.js"
import { InstanceMapper } from "./InstanceMapper.js"
import { OwnerEncSessionKeysUpdateQueue } from "./OwnerEncSessionKeysUpdateQueue.js"
import { PQFacade } from "../facades/PQFacade.js"
import { decodePQMessage, encodePQMessage } from "../facades/PQMessage.js"

assertWorkerOrNode()

export function encryptBytes(sk: Aes128Key, value: Uint8Array): Uint8Array {
	return aesEncrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)
}

export function encryptString(sk: Aes128Key, value: string): Uint8Array {
	return aesEncrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)
}

export type PubEncSymKey = {
	pubEncSymKey: Uint8Array
	cryptoProtocolVersion: CryptoProtocolVersion
}

export type PublicKeys = {
	pubRsaKey: null | Uint8Array
	pubEccKey: null | Uint8Array
	pubKyberKey: null | Uint8Array
}

type ResolvedSessionKeys = {
	resolvedSessionKeyForInstance: Aes128Key | Aes256Key
	instanceSessionKeys: Array<InstanceSessionKey>
}

export class CryptoFacade {
	async applyMigrations<T>(typeRef: TypeRef<T>, data: any): Promise<T> {
		if (isSameTypeRef(typeRef, GroupInfoTypeRef) && data._ownerGroup == null) {
			let customerGroupMembership = this.userFacade.getLoggedInUser().memberships.find((g: GroupMembership) => g.groupType === GroupType.Customer) as any
			let customerGroupKey = this.userFacade.getGroupKey(customerGroupMembership.group)
			return this.entityClient.loadAll(PermissionTypeRef, data._id[0]).then((listPermissions: Permission[]) => {
				let customerGroupPermission = listPermissions.find((p) => p.group === customerGroupMembership.group)
				if (!customerGroupPermission) throw new SessionKeyNotFoundError("Permission not found, could not apply OwnerGroup migration")
				let listKey = decryptKey(customerGroupKey, (customerGroupPermission as any).symEncSessionKey)
				let groupInfoSk = decryptKey(listKey, base64ToUint8Array(data._listEncSessionKey))
				data._ownerGroup = customerGroupMembership.getGroup()
				data._ownerEncSessionKey = uint8ArrayToBase64(encryptKey(customerGroupKey, groupInfoSk))
				return data
			})
		} else if (isSameTypeRef(typeRef, TutanotaPropertiesTypeRef) && data._ownerEncSessionKey == null) {
			// EncryptTutanotaPropertiesService could be removed and replaced with an Migration that writes the key
			data._ownerGroup = this.userFacade.getUserGroupId()
			let groupEncSessionKey = encryptKey(this.userFacade.getUserGroupKey(), aes256RandomKey())
			data._ownerEncSessionKey = uint8ArrayToBase64(groupEncSessionKey)
			let migrationData = createEncryptTutanotaPropertiesData({
				properties: data._id,
				symEncSessionKey: groupEncSessionKey,
			})
			const result = await this.serviceExecutor.post(EncryptTutanotaPropertiesService, migrationData)
			return data
		} else if (isSameTypeRef(typeRef, PushIdentifierTypeRef) && data._ownerEncSessionKey == null) {
			// set sessionKey for allowing encryption when old instance (< v43) is updated
			return resolveTypeReference(typeRef)
				.then((typeModel) => this.updateOwnerEncSessionKey(typeModel, data, this.userFacade.getUserGroupKey(), aes256RandomKey()))
				.then(() => data)
		}

		return data
	}

	constructor(
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly restClient: RestClient,
		private readonly rsa: RsaImplementation,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly instanceMapper: InstanceMapper,
		private readonly ownerEncSessionKeysUpdateQueue: OwnerEncSessionKeysUpdateQueue,
		private readonly pq: PQFacade,
	) {}

	applyMigrationsForInstance<T>(decryptedInstance: T): Promise<T> {
		const instanceType = downcast<Entity>(decryptedInstance)._type

		if (isSameTypeRef(instanceType, ContactTypeRef)) {
			const contact: Contact = downcast(decryptedInstance)

			if (!contact.birthdayIso && contact.oldBirthdayAggregate) {
				contact.birthdayIso = birthdayToIsoDate(contact.oldBirthdayAggregate)
				contact.oldBirthdayAggregate = null
				contact.oldBirthdayDate = null
				return this.entityClient
					.update(contact)
					.catch(ofClass(LockedError, noOp))
					.then(() => decryptedInstance)
			} else if (!contact.birthdayIso && contact.oldBirthdayDate) {
				contact.birthdayIso = birthdayToIsoDate(oldBirthdayToBirthday(contact.oldBirthdayDate))
				contact.oldBirthdayDate = null
				return this.entityClient
					.update(contact)
					.catch(ofClass(LockedError, noOp))
					.then(() => decryptedInstance)
			} else if (contact.birthdayIso && (contact.oldBirthdayAggregate || contact.oldBirthdayDate)) {
				contact.oldBirthdayAggregate = null
				contact.oldBirthdayDate = null
				return this.entityClient
					.update(contact)
					.catch(ofClass(LockedError, noOp))
					.then(() => decryptedInstance)
			}
		}

		return Promise.resolve(decryptedInstance)
	}

	async resolveSessionKeyForInstance(instance: SomeEntity): Promise<Aes128Key | null> {
		const typeModel = await resolveTypeReference(instance._type)
		return this.resolveSessionKey(typeModel, instance)
	}

	/** Helper for the rare cases when we needed it on the client side. */
	async resolveSessionKeyForInstanceBinary(instance: SomeEntity): Promise<Uint8Array | null> {
		const key = await this.resolveSessionKeyForInstance(instance)
		return key == null ? null : bitArrayToUint8Array(key)
	}

	/** Resolve a session key an {@param instance} using an already known {@param ownerKey}. */
	resolveSessionKeyWithOwnerKey(instance: Record<string, any>, ownerKey: Aes128Key): Aes128Key {
		let key = instance._ownerEncSessionKey
		if (typeof key === "string") {
			key = base64ToUint8Array(instance._ownerEncSessionKey)
		}

		return decryptKey(ownerKey, key)
	}

	decryptSessionKey(instance: Record<string, any>, ownerEncSessionKey: Uint8Array): Aes128Key | Aes256Key {
		const gk = this.userFacade.getGroupKey(instance._ownerGroup)
		return decryptKey(gk, ownerEncSessionKey)
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
	async resolveSessionKey(typeModel: TypeModel, instance: Record<string, any>): Promise<Aes128Key | null> {
		try {
			if (!typeModel.encrypted) {
				return null
			}
			if (instance.bucketKey) {
				// if we have a bucket key, then we need to cache the session keys stored in the bucket key for details, files, etc.
				// we need to do this BEFORE we check the owner enc session key
				const bucketKey = await this.convertBucketKeyToInstanceIfNecessary(instance.bucketKey)
				const resolvedSessionKeys = await this.resolveWithBucketKey(bucketKey, instance, typeModel)
				return resolvedSessionKeys.resolvedSessionKeyForInstance
			} else if (instance._ownerEncSessionKey && this.userFacade.isFullyLoggedIn() && this.userFacade.hasGroup(instance._ownerGroup)) {
				const gk = this.userFacade.getGroupKey(instance._ownerGroup)
				return this.resolveSessionKeyWithOwnerKey(instance, gk)
			} else if (instance.ownerEncSessionKey) {
				// this is a service instance
				const gk = this.userFacade.getGroupKey(this.userFacade.getGroupId(GroupType.Mail))
				return this.resolveSessionKeyWithOwnerKey(instance, gk)
			} else {
				// See PermissionType jsdoc for more info on permissions
				const permissions = await this.entityClient.loadAll(PermissionTypeRef, instance._permissions)
				return this.trySymmetricPermission(permissions) ?? (await this.resolveWithPublicOrExternalPermission(permissions, instance, typeModel))
			}
		} catch (e) {
			if (e instanceof CryptoError) {
				console.log("failed to resolve session key due to crypto error", e)
				throw new SessionKeyNotFoundError("Crypto error while resolving session key for instance " + instance._id)
			}
			throw e
		}
	}

	/**
	 * In case the given bucketKey is a literal the literal will be converted to an instance and return. In case the BucketKey is already an instance the instance is returned.
	 * @param bucketKeyInstanceOrLiteral The bucket key as literal or instance
	 */
	async convertBucketKeyToInstanceIfNecessary(bucketKeyInstanceOrLiteral: Record<string, any>): Promise<BucketKey> {
		if (!this.isLiteralInstance(bucketKeyInstanceOrLiteral)) {
			// bucket key was already decoded from base 64
			return bucketKeyInstanceOrLiteral as BucketKey
		} else {
			// decryptAndMapToInstance is misleading here, but we want to map the BucketKey aggregate and its session key from a literal to an instance
			// to have the encrypted keys in binary format and not as base 64. There is actually no decryption ongoing, just mapToInstance.
			const bucketKeyTypeModel = await resolveTypeReference(BucketKeyTypeRef)
			return (await this.instanceMapper.decryptAndMapToInstance(bucketKeyTypeModel, bucketKeyInstanceOrLiteral, null)) as BucketKey
		}
	}

	private isLiteralInstance(elementOrLiteral: Record<string, any>): boolean {
		return typeof elementOrLiteral._type === "undefined"
	}

	private trySymmetricPermission(listPermissions: Permission[]) {
		const symmetricPermission: Permission | null =
			listPermissions.find(
				(p) =>
					(p.type === PermissionType.Public_Symmetric || p.type === PermissionType.Symmetric) &&
					p._ownerGroup &&
					this.userFacade.hasGroup(p._ownerGroup),
			) ?? null

		if (symmetricPermission) {
			const gk = this.userFacade.getGroupKey(assertNotNull(symmetricPermission._ownerGroup))
			return decryptKey(gk, assertNotNull(symmetricPermission._ownerEncSessionKey))
		}
	}

	public async resolveWithBucketKey(bucketKey: BucketKey, instance: Record<string, any>, typeModel: TypeModel): Promise<ResolvedSessionKeys> {
		const instanceElementId = this.getElementIdFromInstance(instance)
		let decBucketKey: Aes128Key
		let unencryptedSenderAuthStatus: EncryptionAuthStatus | null = null
		let pqMessageSenderKey: EccPublicKey | null = null
		if (bucketKey.keyGroup && bucketKey.pubEncBucketKey) {
			// bucket key is encrypted with public key for internal recipient
			const { decryptedBucketKey, pqMessageSenderIdentityPubKey } = await this.decryptBucketKeyWithKeyPairOfGroupAndPrepareAuthentication(
				bucketKey.keyGroup,
				bucketKey.pubEncBucketKey,
			)
			decBucketKey = decryptedBucketKey
			pqMessageSenderKey = pqMessageSenderIdentityPubKey
		} else if (bucketKey.groupEncBucketKey) {
			// received as secure external recipient or reply from secure external sender
			let keyGroup
			if (bucketKey.keyGroup) {
				// 1. Uses when receiving confidential replies from external users.
				// 2. legacy code path for old external clients that used to encrypt bucket keys with user group keys.
				keyGroup = bucketKey.keyGroup
			} else {
				// by default, we try to decrypt the bucket key with the ownerGroupKey (e.g. secure external recipient)
				keyGroup = neverNull(instance._ownerGroup)
			}

			decBucketKey = await this.resolveWithGroupReference(keyGroup, bucketKey.groupEncBucketKey)
			unencryptedSenderAuthStatus = EncryptionAuthStatus.AES_NO_AUTHENTICATION
		} else {
			throw new SessionKeyNotFoundError(`encrypted bucket key not set on instance ${typeModel.name}`)
		}
		const resolvedSessionKeys = await this.collectAllInstanceSessionKeysAndAuthenticate(
			bucketKey,
			decBucketKey,
			instanceElementId,
			instance,
			typeModel,
			unencryptedSenderAuthStatus,
			pqMessageSenderKey,
		)

		this.ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(resolvedSessionKeys.instanceSessionKeys)

		// for symmetrically encrypted instances _ownerEncSessionKey is sent from the server.
		// in this case it is not yet and we need to set it because the rest of the app expects it.
		instance._ownerEncSessionKey = uint8ArrayToBase64(
			encryptKey(this.userFacade.getGroupKey(instance._ownerGroup), resolvedSessionKeys.resolvedSessionKeyForInstance),
		)
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
	 * @param groupEncBucketKey The group key encrypted bucket key.
	 */
	private async resolveWithGroupReference(keyGroup: Id, groupEncBucketKey: Uint8Array): Promise<Aes128Key | Aes256Key> {
		if (this.userFacade.hasGroup(keyGroup)) {
			// the logged-in user (most likely external) is a member of that group. Then we have the group key from the memberships
			return decryptKey(this.userFacade.getGroupKey(keyGroup), groupEncBucketKey)
		} else {
			// internal user receiving a mail from secure external:
			// internal user group key -> external user group key -> external mail group key -> bucket key
			const keyGroupInstance = await this.entityClient.load(GroupTypeRef, keyGroup)
			if (keyGroupInstance.admin) {
				const adminGroup = await this.entityClient.load(GroupTypeRef, keyGroupInstance.admin) // admin of the external mailbox is the external user group.
				if (adminGroup.admin && this.userFacade.hasGroup(adminGroup.admin)) {
					const adminGroupKey = decryptKey(this.userFacade.getGroupKey(adminGroup.admin), assertNotNull(adminGroup.adminGroupEncGKey))
					const groupKey = decryptKey(adminGroupKey, assertNotNull(keyGroupInstance.adminGroupEncGKey))
					return decryptKey(groupKey, groupEncBucketKey)
				} else {
					throw new SessionKeyNotFoundError("no admin group or no membership of admin group: " + adminGroup.admin)
				}
			} else {
				throw new SessionKeyNotFoundError("no admin group on key group: " + keyGroup)
			}
		}
	}

	/**
	 * Resolves the session key for the provided instance and collects all other instances'
	 * session keys in order to update them.
	 */
	private async collectAllInstanceSessionKeysAndAuthenticate(
		bucketKey: BucketKey,
		decBucketKey: number[],
		instanceElementId: string,
		instance: Record<string, any>,
		typeModel: TypeModel,
		encryptionAuthStatus: EncryptionAuthStatus | null,
		pqMessageSenderKey: EccPublicKey | null,
	): Promise<ResolvedSessionKeys> {
		let resolvedSessionKeyForInstance: Aes128Key | Aes256Key | undefined = undefined
		const instanceSessionKeys = await promiseMap(bucketKey.bucketEncSessionKeys, async (instanceSessionKey) => {
			const decryptedSessionKey = decryptKey(decBucketKey, instanceSessionKey.symEncSessionKey)
			const ownerEncSessionKey = encryptKey(this.userFacade.getGroupKey(instance._ownerGroup), decryptedSessionKey)
			const instanceSessionKeyWithOwnerEncSessionKey = createInstanceSessionKey(instanceSessionKey)
			if (instanceElementId == instanceSessionKey.instanceId) {
				resolvedSessionKeyForInstance = decryptedSessionKey
				// we can only authenticate once we have the session key
				// because we need to check if the confidential flag is set, which is encrypted still
				// we need to do it here at the latest because we must write the flag when updating the session key on the instance
				await this.authenticateMainInstance(
					typeModel,
					encryptionAuthStatus,
					pqMessageSenderKey,
					instance,
					resolvedSessionKeyForInstance,
					instanceSessionKeyWithOwnerEncSessionKey,
					decryptedSessionKey,
				)
			}
			instanceSessionKeyWithOwnerEncSessionKey.symEncSessionKey = ownerEncSessionKey
			return instanceSessionKeyWithOwnerEncSessionKey
		})

		if (resolvedSessionKeyForInstance) {
			return { resolvedSessionKeyForInstance, instanceSessionKeys }
		} else {
			throw new SessionKeyNotFoundError("no session key for instance " + instance._id)
		}
	}

	private async authenticateMainInstance(
		typeModel: TypeModel,
		encryptionAuthStatus:
			| EncryptionAuthStatus
			| null
			| EncryptionAuthStatus.RSA_NO_AUTHENTICATION
			| EncryptionAuthStatus.PQ_AUTHENTICATION_SUCCEEDED
			| EncryptionAuthStatus.PQ_AUTHENTICATION_FAILED
			| EncryptionAuthStatus.AES_NO_AUTHENTICATION,
		pqMessageSenderKey: Uint8Array | null,
		instance: Record<string, any>,
		resolvedSessionKeyForInstance: number[],
		instanceSessionKeyWithOwnerEncSessionKey: InstanceSessionKey,
		decryptedSessionKey: number[],
	) {
		// we only authenticate mail instances
		const isMailInstance = isSameTypeRefByAttr(MailTypeRef, typeModel.app, typeModel.name)
		if (isMailInstance) {
			if (!encryptionAuthStatus) {
				if (!pqMessageSenderKey) {
					encryptionAuthStatus = EncryptionAuthStatus.RSA_NO_AUTHENTICATION
				} else {
					const mail = (await this.instanceMapper.decryptAndMapToInstance(typeModel, instance, resolvedSessionKeyForInstance)) as Mail
					const senderMailAddress = mail.confidential ? mail.sender.address : SYSTEM_GROUP_MAIL_ADDRESS
					encryptionAuthStatus = await this.authenticateSender(senderMailAddress, pqMessageSenderKey)
				}
			}
			instanceSessionKeyWithOwnerEncSessionKey.encryptionAuthStatus = aesEncrypt(decryptedSessionKey, stringToUtf8Uint8Array(encryptionAuthStatus))
		}
	}

	private async resolveWithPublicOrExternalPermission(
		listPermissions: Permission[],
		instance: Record<string, any>,
		typeModel: TypeModel,
	): Promise<Aes128Key> {
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
			return this.decryptWithPublicBucket(bucketPermission, instance, pubOrExtPermission, typeModel)
		}
	}

	private decryptWithExternalBucket(bucketPermission: BucketPermission, pubOrExtPermission: Permission, instance: Record<string, any>) {
		let bucketKey

		if (bucketPermission.ownerEncBucketKey != null) {
			bucketKey = decryptKey(this.userFacade.getGroupKey(neverNull(bucketPermission._ownerGroup)), bucketPermission.ownerEncBucketKey)
		} else if (bucketPermission.symEncBucketKey) {
			// legacy case: for very old email sent to external user we used symEncBucketKey on the bucket permission.
			// The bucket key is encrypted with the user group key of the external user.
			// We maintain this code as we still have some old BucketKeys in some external mailboxes.
			// Can be removed if we finished mail details migration or when we do cleanup of external mailboxes.
			bucketKey = decryptKey(this.userFacade.getUserGroupKey(), bucketPermission.symEncBucketKey)
		} else {
			throw new SessionKeyNotFoundError(
				`BucketEncSessionKey is not defined for Permission ${pubOrExtPermission._id.toString()} (Instance: ${JSON.stringify(instance)})`,
			)
		}

		return decryptKey(bucketKey, neverNull(pubOrExtPermission.bucketEncSessionKey))
	}

	async loadKeypair(keyPairGroupId: Id): Promise<AsymmetricKeyPair> {
		const group = await this.entityClient.load(GroupTypeRef, keyPairGroupId)
		try {
			return decryptKeyPair(this.userFacade.getGroupKey(group._id), group.keys[0])
		} catch (e) {
			console.log("failed to decrypt keypair for group with id " + group._id)
			throw e
		}
	}

	private async decryptBucketKeyWithKeyPairOfGroupAndPrepareAuthentication(
		keyPairGroupId: Id,
		pubEncBucketKey: Uint8Array,
	): Promise<{
		decryptedBucketKey: Aes128Key | Aes256Key
		pqMessageSenderIdentityPubKey: EccPublicKey | null
	}> {
		const keyPair: AsymmetricKeyPair = await this.loadKeypair(keyPairGroupId)
		const algo = keyPair.keyPairType
		if (isPqKeyPairs(keyPair)) {
			const pqMessage = decodePQMessage(pubEncBucketKey)
			const decryptedBucketKey = await this.pq.decapsulate(pqMessage, keyPair)
			return { decryptedBucketKey: uint8ArrayToBitArray(decryptedBucketKey), pqMessageSenderIdentityPubKey: pqMessage.senderIdentityPubKey }
		} else if (isRsaOrRsaEccKeyPair(keyPair)) {
			const privateKey: RsaPrivateKey = keyPair.privateKey
			const decryptedBucketKey = await this.rsa.decrypt(privateKey, pubEncBucketKey)
			return { decryptedBucketKey: uint8ArrayToBitArray(decryptedBucketKey), pqMessageSenderIdentityPubKey: null }
		} else {
			throw new CryptoError("unknown key pair type: " + algo)
		}
	}

	private async decryptWithPublicBucket(
		bucketPermission: BucketPermission,
		instance: Record<string, any>,
		pubOrExtPermission: Permission,
		typeModel: TypeModel,
	): Promise<Aes128Key> {
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

		const { decryptedBucketKey } = await this.decryptBucketKeyWithKeyPairOfGroupAndPrepareAuthentication(bucketPermission.group, pubEncBucketKey)

		const sk = decryptKey(decryptedBucketKey, bucketEncSessionKey)

		if (bucketPermission._ownerGroup) {
			// is not defined for some old AccountingInfos
			let bucketPermissionOwnerGroupKey = this.userFacade.getGroupKey(neverNull(bucketPermission._ownerGroup))
			let bucketPermissionGroupKey = this.userFacade.getGroupKey(bucketPermission.group)
			await this.updateWithSymPermissionKey(
				typeModel,
				instance,
				pubOrExtPermission,
				bucketPermission,
				bucketPermissionOwnerGroupKey,
				bucketPermissionGroupKey,
				sk,
			).catch(
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
	 * @param typeModel
	 * @param instance The unencrypted (client-side) or encrypted (server-side) instance
	 *
	 */
	async resolveServiceSessionKey(typeModel: TypeModel, instance: Record<string, any>): Promise<Aes128Key | Aes256Key | null> {
		if (instance._ownerPublicEncSessionKey) {
			const keyPair = await this.loadKeypair(instance._ownerGroup)
			return this.decryptPubEncSymKey(
				base64ToUint8Array(instance._ownerPublicEncSessionKey),
				assertEnumValue(CryptoProtocolVersion, instance._publicCryptoProtocolVersion),
				keyPair,
			)
		}
		return Promise.resolve(null)
	}

	async encryptPubSymKey(symKey: Aes128Key | Aes256Key, recipientPublicKeys: PublicKeys, senderGroupId: Id): Promise<PubEncSymKey> {
		let pubEncSymKey, cryptoProtocolVersion
		const recipientPublicKey = this.getRecipientPublicKey(recipientPublicKeys)
		const algo = recipientPublicKey.keyPairType
		if (isPqPublicKey(recipientPublicKey)) {
			const senderKeyPair = await this.loadKeypair(senderGroupId)
			const senderEccKeyPair = await this.getOrMakeSenderIdentityKeyPair(senderKeyPair, senderGroupId)
			const ephemeralKeyPair = generateEccKeyPair()
			pubEncSymKey = encodePQMessage(await this.pq.encapsulate(senderEccKeyPair, ephemeralKeyPair, recipientPublicKey, bitArrayToUint8Array(symKey)))
			cryptoProtocolVersion = CryptoProtocolVersion.TUTA_CRYPT
		} else if (isRsaPublicKey(recipientPublicKey)) {
			pubEncSymKey = await this.rsa.encrypt(recipientPublicKey, bitArrayToUint8Array(symKey))
			cryptoProtocolVersion = CryptoProtocolVersion.RSA
		} else {
			throw new CryptoError("unknown public key type: " + algo)
		}
		return { pubEncSymKey, cryptoProtocolVersion }
	}

	async decryptPubEncSymKey(
		pubEncSymKey: Uint8Array,
		cryptoProtocolVersion: CryptoProtocolVersion,
		keyPair: AsymmetricKeyPair,
	): Promise<Aes128Key | Aes256Key> {
		let decryptedBytes: Uint8Array
		switch (cryptoProtocolVersion) {
			case CryptoProtocolVersion.RSA: {
				if (!isRsaOrRsaEccKeyPair(keyPair)) {
					throw new CryptoError("wrong key type. expecte rsa. got " + keyPair.keyPairType)
				}
				decryptedBytes = await this.rsa.decrypt(keyPair.privateKey, pubEncSymKey)
				break
			}
			case CryptoProtocolVersion.TUTA_CRYPT: {
				if (!isPqKeyPairs(keyPair)) {
					throw new CryptoError("wrong key type. expected tuta-crypt. got " + keyPair.keyPairType)
				}
				decryptedBytes = await this.pq.decapsulate(decodePQMessage(pubEncSymKey), keyPair)
				break
			}
			default:
				throw new CryptoError("invalid cryptoProtocolVersion: " + cryptoProtocolVersion)
		}
		return uint8ArrayToBitArray(decryptedBytes)
	}

	/**
	 * Creates a new _ownerEncSessionKey and assigns it to the provided entity
	 * the entity must already have an _ownerGroup
	 * @returns the generated key
	 */
	setNewOwnerEncSessionKey(model: TypeModel, entity: Record<string, any>, keyToEncryptSessionKey?: Aes128Key): Aes128Key | null {
		if (!entity._ownerGroup) {
			throw new Error(`no owner group set  ${JSON.stringify(entity)}`)
		}

		if (model.encrypted) {
			if (entity._ownerEncSessionKey) {
				throw new Error(`ownerEncSessionKey already set ${JSON.stringify(entity)}`)
			}

			const sessionKey = aes256RandomKey()
			const effectiveKeyToEncryptSessionKey = keyToEncryptSessionKey ?? this.userFacade.getGroupKey(entity._ownerGroup)
			entity._ownerEncSessionKey = encryptKey(effectiveKeyToEncryptSessionKey, sessionKey)
			return sessionKey
		} else {
			return null
		}
	}

	async encryptBucketKeyForInternalRecipient(
		senderUserGroupId: Id,
		bucketKey: Aes128Key | Aes256Key,
		recipientMailAddress: string,
		notFoundRecipients: Array<string>,
	): Promise<InternalRecipientKeyData | SymEncInternalRecipientKeyData | null> {
		let keyData = createPublicKeyGetIn({
			mailAddress: recipientMailAddress,
		})
		try {
			const publicKeyGetOut = await this.serviceExecutor.get(PublicKeyService, keyData)
			// We do not create any key data in case there is one not found recipient, but we want to
			// collect ALL not found recipients when iterating a recipient list.
			if (notFoundRecipients.length !== 0) {
				return null
			}
			const isExternalSender = this.userFacade.getUser()?.accountType === AccountType.EXTERNAL
			// we only encrypt symmetric as external sender if the recipient supports tuta-crypt.
			// Clients need to support symmetric decryption from external users. We can always encrypt symmetricly when old clients are deactivated that don't support tuta-crypt.
			if (publicKeyGetOut.pubKyberKey && isExternalSender) {
				return this.createSymEncInternalRecipientKeyData(recipientMailAddress, bucketKey)
			} else {
				return this.createPubEncInternalRecipientKeyData(bucketKey, recipientMailAddress, publicKeyGetOut, senderUserGroupId)
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
		bucketKey: Aes128Key | Aes256Key,
		recipientMailAddress: string,
		publicKeyGetOut: PublicKeyGetOut,
		senderGroupId: Id,
	) {
		const pubKeys: PublicKeys = {
			pubRsaKey: publicKeyGetOut.pubRsaKey,
			pubKyberKey: publicKeyGetOut.pubKyberKey,
			pubEccKey: publicKeyGetOut.pubEccKey,
		}
		const pubEncBucketKey = await this.encryptPubSymKey(bucketKey, pubKeys, senderGroupId)
		return createInternalRecipientKeyData({
			mailAddress: recipientMailAddress,
			pubEncBucketKey: pubEncBucketKey.pubEncSymKey,
			pubKeyVersion: publicKeyGetOut.pubKeyVersion,
			protocolVersion: pubEncBucketKey.cryptoProtocolVersion,
		})
	}

	private createSymEncInternalRecipientKeyData(recipientMailAddress: string, bucketKey: Aes128Key | Aes256Key) {
		const keyGroup = this.userFacade.getGroupId(GroupType.Mail)
		const externalMailGroupKey = this.userFacade.getGroupKey(keyGroup)
		return createSymEncInternalRecipientKeyData({
			mailAddress: recipientMailAddress,
			symEncBucketKey: encryptKey(externalMailGroupKey, bucketKey),
			keyGroup,
		})
	}

	/**
	 * Returns the SenderIdentityKeyPair that is either already on the KeyPair that is being passed in,
	 * or creates a new one and writes it to the respective Group.
	 * @param senderKeyPair
	 * @param keyGroupId Id for the Group that Public Key Service might write a new IdentityKeyPair for.
	 * 						This is necessary as a User might send an E-Mail from a shared mailbox,
	 * 						for which the KeyPair should be created.
	 */
	async getOrMakeSenderIdentityKeyPair(senderKeyPair: AsymmetricKeyPair, keyGroupId: Id): Promise<EccKeyPair> {
		const algo = senderKeyPair.keyPairType
		if (isPqKeyPairs(senderKeyPair)) {
			return senderKeyPair.eccKeyPair
		} else if (isRsaEccKeyPair(senderKeyPair)) {
			return { publicKey: senderKeyPair.publicEccKey, privateKey: senderKeyPair.privateEccKey }
		} else if (isRsaOrRsaEccKeyPair(senderKeyPair)) {
			let userGroupKey = keyGroupId ? this.userFacade.getGroupKey(keyGroupId) : this.userFacade.getUserGroupKey()
			const newIdentityKeyPair = generateEccKeyPair()
			const symEncPrivEccKey = encryptEccKey(userGroupKey, newIdentityKeyPair.privateKey)
			const data = createPublicKeyPutIn({ pubEccKey: newIdentityKeyPair.publicKey, symEncPrivEccKey, keyGroup: keyGroupId })
			await this.serviceExecutor.put(PublicKeyService, data)
			return newIdentityKeyPair
		} else {
			throw new CryptoError("unknow key pair type: " + algo)
		}
	}

	async authenticateSender(mailSenderAddress: string, senderIdentityPubKey: Uint8Array): Promise<EncryptionAuthStatus> {
		let keyData = createPublicKeyGetIn({
			mailAddress: mailSenderAddress,
		})
		try {
			const publicKeyGetOut = await this.serviceExecutor.get(PublicKeyService, keyData)
			return publicKeyGetOut.pubEccKey != null && arrayEquals(publicKeyGetOut.pubEccKey, senderIdentityPubKey)
				? EncryptionAuthStatus.PQ_AUTHENTICATION_SUCCEEDED
				: EncryptionAuthStatus.PQ_AUTHENTICATION_FAILED
		} catch (e) {
			console.error("Could not authenticate sender", e)
			return EncryptionAuthStatus.PQ_AUTHENTICATION_FAILED
		}
	}

	/**
	 * Updates the given public permission with the given symmetric key for faster access if the client is the leader and otherwise does nothing.
	 * @param typeModel: the type model of the instance
	 * @param instance The unencrypted (client-side) or encrypted (server-side) instance
	 * @param permission The permission.
	 * @param bucketPermission The bucket permission.
	 * @param permissionOwnerGroupKey The symmetric group key for the owner group on the permission.
	 * @param permissionGroupKey The symmetric group key of the group in the permission.
	 * @param sessionKey The symmetric session key.
	 */
	private updateWithSymPermissionKey(
		typeModel: TypeModel,
		instance: Record<string, any>,
		permission: Permission,
		bucketPermission: BucketPermission,
		permissionOwnerGroupKey: Aes128Key,
		permissionGroupKey: Aes128Key,
		sessionKey: Aes128Key,
	): Promise<void> {
		if (!this.isLiteralInstance(instance) || !this.userFacade.isLeader()) {
			// do not update the session key in case of an unencrypted (client-side) instance
			// or in case we are not the leader client
			return Promise.resolve()
		}

		if (!instance._ownerEncSessionKey && permission._ownerGroup === instance._ownerGroup) {
			return this.updateOwnerEncSessionKey(typeModel, instance, permissionOwnerGroupKey, sessionKey)
		} else {
			// instances shared via permissions (e.g. body)
			let updateService = createUpdatePermissionKeyData({
				permission: permission._id,
				bucketPermission: bucketPermission._id,
				ownerEncSessionKey: encryptKey(permissionOwnerGroupKey, sessionKey),
				symEncSessionKey: encryptKey(permissionGroupKey, sessionKey), // legacy can be removed
			})
			return this.serviceExecutor.post(UpdatePermissionKeyService, updateService).then(noOp)
		}
	}

	private updateOwnerEncSessionKey(typeModel: TypeModel, instance: Record<string, any>, ownerGroupKey: Aes128Key, sessionKey: Aes128Key): Promise<void> {
		instance._ownerEncSessionKey = uint8ArrayToBase64(encryptKey(ownerGroupKey, sessionKey))
		// we have to call the rest client directly because instance is still the encrypted server-side version
		const path = typeRefToPath(new TypeRef(typeModel.app, typeModel.name)) + "/" + (instance._id instanceof Array ? instance._id.join("/") : instance._id)
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

	private getElementIdFromInstance(instance: Record<string, any>): Id {
		if (typeof instance._id === "string") {
			return instance._id
		} else {
			const idTuple = instance._id as IdTuple
			return elementIdPart(idTuple)
		}
	}

	private getRecipientPublicKey(publicKeys: PublicKeys): AsymmetricPublicKey {
		if (publicKeys.pubRsaKey) {
			// we ignore ecc keys as this is only used for the recipient keys
			return hexToRsaPublicKey(uint8ArrayToHex(publicKeys.pubRsaKey))
		} else if (publicKeys.pubKyberKey && publicKeys.pubEccKey) {
			var eccPublicKey = publicKeys.pubEccKey
			var kyberPublicKey = bytesToKyberPublicKey(publicKeys.pubKyberKey)
			return { keyPairType: KeyPairType.TUTA_CRYPT, eccPublicKey, kyberPublicKey }
		} else {
			throw new Error("Inconsistent Keypair")
		}
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
