import {
	base64ToUint8Array,
	downcast,
	isSameTypeRef,
	isSameTypeRefByAttr,
	neverNull,
	noOp,
	ofClass,
	stringToUtf8Uint8Array,
	TypeRef,
	uint8ArrayToBase64,
	uint8ArrayToHex,
} from "@tutao/tutanota-utils"
import {BucketPermissionType, GroupType, PermissionType} from "../../common/TutanotaConstants"
import {serviceRequest, serviceRequestVoid} from "../ServiceRequestWorker"
import {TutanotaService} from "../../entities/tutanota/Services"
import {HttpMethod, resolveTypeReference} from "../../common/EntityFunctions"
import {GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import {TutanotaPropertiesTypeRef} from "../../entities/tutanota/TutanotaProperties"
import {createEncryptTutanotaPropertiesData} from "../../entities/tutanota/EncryptTutanotaPropertiesData"
import type {BucketPermission} from "../../entities/sys/BucketPermission"
import {BucketPermissionTypeRef} from "../../entities/sys/BucketPermission"
import type {Group} from "../../entities/sys/Group"
import {GroupTypeRef} from "../../entities/sys/Group"
import type {Permission} from "../../entities/sys/Permission"
import {PermissionTypeRef} from "../../entities/sys/Permission"
import {typeRefToPath} from "../rest/EntityRestClient"
import {createUpdatePermissionKeyData} from "../../entities/sys/UpdatePermissionKeyData"
import {SysService} from "../../entities/sys/Services"
import {LockedError, NotFoundError, PayloadTooLargeError, TooManyRequestsError} from "../../common/error/RestError"
import {SessionKeyNotFoundError} from "../../common/error/SessionKeyNotFoundError" // importing with {} from CJS modules is not supported for dist-builds currently (must be a systemjs builder bug)
import {MailBodyTypeRef} from "../../entities/tutanota/MailBody"
import {MailTypeRef} from "../../entities/tutanota/Mail"
import {CryptoError} from "../../common/error/CryptoError"
import {PushIdentifierTypeRef} from "../../entities/sys/PushIdentifier"
import type {Contact} from "../../entities/tutanota/Contact"
import {ContactTypeRef} from "../../entities/tutanota/Contact"
import {birthdayToIsoDate, oldBirthdayToBirthday} from "../../common/utils/BirthdayUtils"
import type {GroupMembership} from "../../entities/sys/GroupMembership"
import type {Entity, TypeModel} from "../../common/EntityTypes"
import {assertWorkerOrNode} from "../../common/Env"
import type {LoginFacadeImpl} from "../facades/LoginFacade"
import type {EntityClient} from "../../common/EntityClient"
import {RestClient} from "../rest/RestClient"
import {
	aes128Encrypt,
	aes128RandomKey,
	bitArrayToUint8Array,
	decryptKey,
	decryptRsaKey,
	ENABLE_MAC,
	encryptKey,
	hexToPublicKey,
	IV_BYTE_LENGTH,
	random,
	uint8ArrayToBitArray,
} from "@tutao/tutanota-crypto"
import type {InternalRecipientKeyData} from "../../entities/tutanota/InternalRecipientKeyData"
import {createInternalRecipientKeyData} from "../../entities/tutanota/InternalRecipientKeyData"
import {createPublicKeyData} from "../../entities/sys/PublicKeyData"
import {PublicKeyReturnTypeRef} from "../../entities/sys/PublicKeyReturn"
import {RecipientNotResolvedError} from "../../common/error/RecipientNotResolvedError"
import type {RsaImplementation} from "./RsaImplementation"
import {locator} from "../WorkerLocator"

assertWorkerOrNode()

export function encryptBytes(sk: Aes128Key, value: Uint8Array): Uint8Array {
	return aes128Encrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)
}

export function encryptString(sk: Aes128Key, value: string): Uint8Array {
	return aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)
}

interface ResolveSessionKeyLoaders {
	loadPermissions(listId: Id): Promise<Permission[]>

	loadBucketPermissions(listId: Id): Promise<BucketPermission[]>

	loadGroup(groupId: Id): Promise<Group>
}

export interface CryptoFacade {
	applyMigrations<T>(typeRef: TypeRef<T>, data: any): Promise<T>

	applyMigrationsForInstance<T>(decryptedInstance: T): Promise<T>

	setNewOwnerEncSessionKey(model: TypeModel, entity: Record<string, any>): Aes128Key | null

	resolveServiceSessionKey(typeModel: TypeModel, instance: Record<string, any>): Promise<Aes128Key | null>

	encryptBucketKeyForInternalRecipient(
			bucketKey: Aes128Key,
			recipientMailAddress: string,
			notFoundRecipients: Array<string>,
	): Promise<InternalRecipientKeyData | void>

	resolveSessionKey(typeModel: TypeModel, instance: Record<string, any>): Promise<Aes128Key | null>
}

export class CryptoFacadeImpl implements CryptoFacade {
	readonly logins: LoginFacadeImpl
	readonly entityClient: EntityClient
	readonly restClient: RestClient
	readonly rsa: RsaImplementation
	// stores a mapping from mail body id to mail body session key. the mail body of a mail is encrypted with the same session key as the mail.
	// so when resolving the session key of a mail we cache it for the mail's body to avoid that the body's permission (+ bucket permission) have to be loaded.
	// this especially improves the performance when indexing mail bodies
	readonly _mailBodySessionKeyCache: Record<string, Aes128Key> = {}

	/**
	 *
	 * @param logins
	 * @param entityClient
	 * @param restClient
	 * @param rsa
	 */
	constructor(logins: LoginFacadeImpl, entityClient: EntityClient, restClient: RestClient, rsa: RsaImplementation) {
		this.logins = logins
		this.entityClient = entityClient
		this.restClient = restClient
		this.rsa = rsa
	}

	async applyMigrations<T>(typeRef: TypeRef<T>, data: any): Promise<T> {
		if (isSameTypeRef(typeRef, GroupInfoTypeRef) && data._ownerGroup == null) {
			//FIXME: do we still need this?
			let customerGroupMembership = this.logins.getLoggedInUser().memberships.find((g: GroupMembership) => g.groupType === GroupType.Customer) as any
			let customerGroupKey = this.logins.getGroupKey(customerGroupMembership.group)
			return this.entityClient.loadAll(PermissionTypeRef, data._id[0]).then((listPermissions: Permission[]) => {
				let customerGroupPermission = listPermissions.find(p => p.group === customerGroupMembership.group)
				if (!customerGroupPermission) throw new SessionKeyNotFoundError("Permission not found, could not apply OwnerGroup migration")
				let listKey = decryptKey(customerGroupKey, (customerGroupPermission as any).symEncSessionKey)
				let groupInfoSk = decryptKey(listKey, base64ToUint8Array(data._listEncSessionKey))
				data._ownerGroup = customerGroupMembership.getGroup()
				data._ownerEncSessionKey = uint8ArrayToBase64(encryptKey(customerGroupKey, groupInfoSk))
				return data
			})
		} else if (isSameTypeRef(typeRef, TutanotaPropertiesTypeRef) && data._ownerEncSessionKey == null) {
			// EncryptTutanotaPropertiesService could be removed and replaced with an Migration that writes the key
			let migrationData = createEncryptTutanotaPropertiesData()
			data._ownerGroup = this.logins.getUserGroupId()
			let groupEncSessionKey = encryptKey(this.logins.getUserGroupKey(), aes128RandomKey())
			data._ownerEncSessionKey = uint8ArrayToBase64(groupEncSessionKey)
			migrationData.properties = data._id
			migrationData.symEncSessionKey = groupEncSessionKey
			return serviceRequestVoid(TutanotaService.EncryptTutanotaPropertiesService, HttpMethod.POST, migrationData).then(() => data as any)
		} else if (isSameTypeRef(typeRef, PushIdentifierTypeRef) && data._ownerEncSessionKey == null) {
			// set sessionKey for allowing encryption when old instance (< v43) is updated
			return resolveTypeReference(typeRef)
					.then(typeModel => this._updateOwnerEncSessionKey(typeModel, data, this.logins.getUserGroupKey(), aes128RandomKey()))
					.then(() => data)
		}

		return data
	}

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

	/**
	 * Returns the session key for the provided type/instance:
	 * * null, if the instance is unencrypted
	 * * the decrypted _ownerEncSessionKey, if it is available
	 * * the public decrypted session key, otherwise
	 *
	 * @param typeModel: the type model of the instance
	 * @param instance The unencrypted (client-side) or encrypted (server-side) instance
	 */
	resolveSessionKey(typeModel: TypeModel, instance: Record<string, any>): Promise<Aes128Key | null> {
		return Promise.resolve()
				.then(() => {
					if (!typeModel.encrypted) {
						return Promise.resolve(null)
					} else if (isSameTypeRefByAttr(MailBodyTypeRef, typeModel.app, typeModel.name) && this._mailBodySessionKeyCache[instance._id]) {
						let sessionKey = this._mailBodySessionKeyCache[instance._id]
						// the mail body instance is cached, so the session key is not needed any more
						delete this._mailBodySessionKeyCache[instance._id]
						return sessionKey
					} else if (instance._ownerEncSessionKey && this.logins.isLoggedIn() && this.logins.hasGroup(instance._ownerGroup)) {
						let gk = this.logins.getGroupKey(instance._ownerGroup)
						let key = instance._ownerEncSessionKey

						if (typeof key === "string") {
							key = base64ToUint8Array(instance._ownerEncSessionKey)
						}

						return Promise.resolve(decryptKey(gk, key))
					} else if (instance.ownerEncSessionKey) {
						// TODO this is a service instance: Rename all ownerEncSessionKey attributes to _ownerEncSessionKey and add _ownerGroupId (set ownerEncSessionKey here automatically after resolving the group)
						// add to payment data service
						let gk = this.logins.getGroupKey(this.logins.getGroupId(GroupType.Mail))
						let key = instance.ownerEncSessionKey

						if (typeof key === "string") {
							key = base64ToUint8Array(instance.ownerEncSessionKey)
						}

						return Promise.resolve(decryptKey(gk, key))
					} else {
						return this.entityClient.loadAll(PermissionTypeRef, instance._permissions).then((listPermissions: Permission[]) => {
							let userGroupIds = this.logins.getAllGroupIds()
							let p: Permission | null = listPermissions.find(
									p =>
											(p.type === PermissionType.Public_Symmetric || p.type === PermissionType.Symmetric) &&
											p._ownerGroup &&
											userGroupIds.indexOf(p._ownerGroup) !== -1,
							)

							if (p) {
								let gk = this.logins.getGroupKey(p._ownerGroup as any)
								return Promise.resolve(decryptKey(gk, p._ownerEncSessionKey as any))
							}

							p = listPermissions.find(p => p.type === PermissionType.Public || p.type === PermissionType.External) as any

							if (p == null) {
								throw new SessionKeyNotFoundError("could not find permission")
							}

							let permission = neverNull(p)
							return this.entityClient
									.loadAll(BucketPermissionTypeRef, (permission.bucket as any).bucketPermissions)
									.then((bucketPermissions: BucketPermission[]) => {
										let bp = bucketPermissions.find(
												bp =>
														(bp.type === BucketPermissionType.Public || bp.type === BucketPermissionType.External) &&
														permission._ownerGroup === bp._ownerGroup,
										)

										// find the bucket permission with the same group as the permission and public type
										if (bp == null) {
											throw new SessionKeyNotFoundError("no corresponding bucket permission found")
										}

										let bucketPermission = bp

										if (bp.type === BucketPermissionType.External) {
											let bucketKey

											if (bp.ownerEncBucketKey != null) {
												bucketKey = decryptKey(this.logins.getGroupKey(neverNull(bp._ownerGroup)), neverNull(bp.ownerEncBucketKey))
											} else if (bp.symEncBucketKey) {
												bucketKey = decryptKey(this.logins.getUserGroupKey(), neverNull(bp.symEncBucketKey))
											} else {
												throw new SessionKeyNotFoundError(
														`BucketEncSessionKey is not defined for Permission ${permission._id.toString()} (Instance: ${JSON.stringify(
																instance,
														)})`,
												)
											}

											return decryptKey(bucketKey, neverNull(permission.bucketEncSessionKey))
										} else {
											return this.entityClient.load(GroupTypeRef, bp.group).then(group => {
												let keypair = group.keys[0]
												let privKey

												try {
													privKey = decryptRsaKey(this.logins.getGroupKey(group._id), keypair.symEncPrivKey)
												} catch (e) {
													console.log("failed to decrypt rsa key for group with id " + group._id)
													throw e
												}

												let pubEncBucketKey = bucketPermission.pubEncBucketKey

												if (pubEncBucketKey == null) {
													throw new SessionKeyNotFoundError(
															`PubEncBucketKey is not defined for BucketPermission ${bucketPermission._id.toString()} (Instance: ${JSON.stringify(
																	instance,
															)})`,
													)
												}

												return this.rsa.decrypt(privKey, pubEncBucketKey).then(decryptedBytes => {
													let bucketKey = uint8ArrayToBitArray(decryptedBytes)
													let bucketEncSessionKey = permission.bucketEncSessionKey

													if (bucketEncSessionKey == null) {
														throw new SessionKeyNotFoundError(
																`BucketEncSessionKey is not defined for Permission ${permission._id.toString()} (Instance: ${JSON.stringify(
																		instance,
																)})`,
														)
													}

													let sk = decryptKey(bucketKey, bucketEncSessionKey)

													if (bucketPermission._ownerGroup) {
														// is not defined for some old AccountingInfos
														let bucketPermissionOwnerGroupKey = this.logins.getGroupKey(neverNull(bucketPermission._ownerGroup))
														let bucketPermissionGroupKey = this.logins.getGroupKey(bucketPermission.group)
														return this._updateWithSymPermissionKey(
																typeModel,
																instance,
																permission,
																bucketPermission,
																bucketPermissionOwnerGroupKey,
																bucketPermissionGroupKey,
																sk,
														)
																.catch(
																		ofClass(NotFoundError, e => {
																			console.log("w> could not find instance to update permission")
																		}),
																)
																.then(() => sk)
													} else {
														return sk
													}
												})
											})
										}
									})
						})
					}
				})
				.then(sessionKey => {
					// store the mail session key for the mail body because it is the same
					if (sessionKey && isSameTypeRefByAttr(MailTypeRef, typeModel.app, typeModel.name)) {
						this._mailBodySessionKeyCache[instance.body] = sessionKey
					}

					return sessionKey
				})
				.catch(
						ofClass(CryptoError, e => {
							console.log("failed to resolve session key", e)
							throw new SessionKeyNotFoundError("Crypto error while resolving session key for instance " + instance._id)
						}),
				)
	}

	/**
	 * Returns the session key for the provided service response:
	 * * null, if the instance is unencrypted
	 * * the decrypted _ownerPublicEncSessionKey, if it is available
	 * @param typeModel
	 * @param instance The unencrypted (client-side) or encrypted (server-side) instance
	 *
	 */
	resolveServiceSessionKey(typeModel: TypeModel, instance: Record<string, any>): Promise<Aes128Key | null> {
		if (instance._ownerPublicEncSessionKey) {
			return this.entityClient.load(GroupTypeRef, instance._ownerGroup).then(group => {
				let keypair = group.keys[0]
				let gk = this.logins.getGroupKey(instance._ownerGroup)
				let privKey

				try {
					privKey = decryptRsaKey(gk, keypair.symEncPrivKey)
				} catch (e) {
					console.log("failed to decrypt rsa key for group with id " + group._id)
					throw e
				}

				return this.rsa
						.decrypt(privKey, base64ToUint8Array(instance._ownerPublicEncSessionKey))
						.then(decryptedBytes => uint8ArrayToBitArray(decryptedBytes))
			})
		}

		return Promise.resolve(null)
	}

	/**
	 * Creates a new _ownerEncSessionKey and assigns it to the provided entity
	 * the entity must already have an _ownerGroup
	 * @returns the generated key
	 */
	setNewOwnerEncSessionKey(model: TypeModel, entity: Record<string, any>): Aes128Key | null {
		if (!entity._ownerGroup) {
			throw new Error(`no owner group set  ${JSON.stringify(entity)}`)
		}

		if (model.encrypted) {
			if (entity._ownerEncSessionKey) {
				throw new Error(`ownerEncSessionKey already set ${JSON.stringify(entity)}`)
			}

			let sessionKey = aes128RandomKey()
			entity._ownerEncSessionKey = encryptKey(this.logins.getGroupKey(entity._ownerGroup), sessionKey)
			return sessionKey
		} else {
			return null
		}
	}

	encryptBucketKeyForInternalRecipient(
			bucketKey: Aes128Key,
			recipientMailAddress: string,
			notFoundRecipients: Array<string>,
	): Promise<InternalRecipientKeyData | void> {
		let keyData = createPublicKeyData()
		keyData.mailAddress = recipientMailAddress
		return serviceRequest(SysService.PublicKeyService, HttpMethod.GET, keyData, PublicKeyReturnTypeRef)
				.then(publicKeyData => {
					let publicKey = hexToPublicKey(uint8ArrayToHex(publicKeyData.pubKey))
					let uint8ArrayBucketKey = bitArrayToUint8Array(bucketKey)

					if (notFoundRecipients.length === 0) {
						return this.rsa.encrypt(publicKey, uint8ArrayBucketKey).then(encrypted => {
							let data = createInternalRecipientKeyData()
							data.mailAddress = recipientMailAddress
							data.pubEncBucketKey = encrypted
							data.pubKeyVersion = publicKeyData.pubKeyVersion
							return data
						})
					}
				})
				.catch(
						ofClass(NotFoundError, e => {
							notFoundRecipients.push(recipientMailAddress)
						}),
				)
				.catch(
						ofClass(TooManyRequestsError, e => {
							throw new RecipientNotResolvedError("")
						}),
				)
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
	_updateWithSymPermissionKey(
			typeModel: TypeModel,
			instance: Record<string, any>,
			permission: Permission,
			bucketPermission: BucketPermission,
			permissionOwnerGroupKey: Aes128Key,
			permissionGroupKey: Aes128Key,
			sessionKey: Aes128Key,
	): Promise<void> {
		if (typeof instance._type !== "undefined" || !this.logins.isLeader()) {
			// do not update the session key in case of an unencrypted (client-side) instance
			// or in case we are not the leader client
			return Promise.resolve()
		}

		if (!instance._ownerEncSessionKey && permission._ownerGroup === instance._ownerGroup) {
			return this._updateOwnerEncSessionKey(typeModel, instance, permissionOwnerGroupKey, sessionKey)
		} else {
			// instances shared via permissions (e.g. body)
			let updateService = createUpdatePermissionKeyData()
			updateService.permission = permission._id
			updateService.bucketPermission = bucketPermission._id
			updateService.ownerEncSessionKey = encryptKey(permissionOwnerGroupKey, sessionKey)
			updateService.symEncSessionKey = encryptKey(permissionGroupKey, sessionKey) // legacy can be removed

			return serviceRequestVoid(SysService.UpdatePermissionKeyService, HttpMethod.POST, updateService)
		}
	}

	_updateOwnerEncSessionKey(typeModel: TypeModel, instance: Record<string, any>, ownerGroupKey: Aes128Key, sessionKey: Aes128Key): Promise<void> {
		instance._ownerEncSessionKey = uint8ArrayToBase64(encryptKey(ownerGroupKey, sessionKey))
		// we have to call the rest client directly because instance is still the encrypted server-side version
		const path = typeRefToPath(new TypeRef(typeModel.app, typeModel.name)) + "/" + (instance._id instanceof Array ? instance._id.join("/") : instance._id)
		const headers = this.logins.createAuthHeaders()
		headers.v = typeModel.version
		return this.restClient
				.request(
						path,
						HttpMethod.PUT,
						{
							updateOwnerEncSessionKey: "true",
						},
						headers,
						JSON.stringify(instance),
				)
				.catch(
						ofClass(PayloadTooLargeError, e => {
							console.log("Could not update owner enc session key - PayloadTooLargeError", e)
						}),
				)
	}
}

/**
 * Convenience wrapper for calling resolveSessionKey on the global CryptoFacade
 */
export async function resolveSessionKey(typeModel: TypeModel, instance: Record<string, any>): Promise<Aes128Key | null> {
	const {locator} = await import("../../worker/WorkerLocator")
	return locator.crypto.resolveSessionKey(typeModel, instance)
}

if (!("toJSON" in Error.prototype)) {
	Object.defineProperty(Error.prototype as any, "toJSON", {
		value: function () {
			const alt = {}
			for (let key of Object.getOwnPropertyNames(this)) {
				alt[key] = this[key]
			}
			return alt
		},
		configurable: true,
		writable: true,
	})
}