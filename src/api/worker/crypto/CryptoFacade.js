// @flow
import {base64ToUint8Array, uint8ArrayToBase64} from "../../common/utils/Encoding"
import {aes128RandomKey} from "./Aes"
import {BucketPermissionType, GroupType, PermissionType} from "../../common/TutanotaConstants"
import {serviceRequestVoid} from "../EntityWorker"
import {TutanotaService} from "../../entities/tutanota/Services"
import {rsaDecrypt} from "./Rsa"
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
import {assertWorkerOrNode} from "../../common/Env"
import {downcast, neverNull, noOp} from "../../common/utils/Utils"
import {typeRefToPath} from "../rest/EntityRestClient"
import {createUpdatePermissionKeyData} from "../../entities/sys/UpdatePermissionKeyData"
import {SysService} from "../../entities/sys/Services"
import {uint8ArrayToBitArray} from "./CryptoUtils"
import {LockedError, NotFoundError, PayloadTooLargeError} from "../../common/error/RestError"
import {SessionKeyNotFoundError} from "../../common/error/SessionKeyNotFoundError" // importing with {} from CJS modules is not supported for dist-builds currently (must be a systemjs builder bug)
import {locator} from "../WorkerLocator"
import {MailBodyTypeRef} from "../../entities/tutanota/MailBody"
import {MailTypeRef} from "../../entities/tutanota/Mail"
import {CryptoError} from "../../common/error/CryptoError"
import {PushIdentifierTypeRef} from "../../entities/sys/PushIdentifier"
import {decryptAndMapToInstance, decryptValue, encryptAndMapToLiteral, encryptBytes, encryptString, encryptValue} from "./InstanceMapper.js"
import {update} from "./../EntityWorker"
import {
	aes256DecryptKey,
	aes256EncryptKey,
	decrypt256Key,
	decryptKey,
	decryptRsaKey,
	encrypt256Key,
	encryptKey,
	encryptRsaKey
} from "./KeyCryptoUtils.js"
import type {Contact} from "../../entities/tutanota/Contact"
import {ContactTypeRef} from "../../entities/tutanota/Contact"
import {birthdayToIsoDate, oldBirthdayToBirthday} from "../../common/utils/BirthdayUtils"
import type {GroupMembership} from "../../entities/sys/GroupMembership"
import {isSameTypeRef, isSameTypeRefByAttr, TypeRef} from "../../common/utils/TypeRef";
import type {TypeModel} from "../../common/EntityTypes"

assertWorkerOrNode()

export {decryptAndMapToInstance, encryptAndMapToLiteral, encryptValue, decryptValue, encryptBytes, encryptString}
export {encryptKey, decryptKey, encrypt256Key, decrypt256Key, encryptRsaKey, decryptRsaKey, aes256EncryptKey, aes256DecryptKey}

// stores a mapping from mail body id to mail body session key. the mail body of a mail is encrypted with the same session key as the mail.
// so when resolving the session key of a mail we cache it for the mail's body to avoid that the body's permission (+ bucket permission) have to be loaded.
// this especially improves the performance when indexing mail bodies
let mailBodySessionKeyCache: {[key: string]: Aes128Key} = {};

export function applyMigrations<T>(typeRef: TypeRef<T>, data: Object): Promise<Object> {
	if (isSameTypeRef(typeRef, GroupInfoTypeRef) && data._ownerGroup == null) {
		//FIXME: do we still need this?
		let customerGroupMembership = (locator.login.getLoggedInUser()
		                                      .memberships
		                                      .find((g: GroupMembership) => g.groupType === GroupType.Customer): any)
		let customerGroupKey = locator.login.getGroupKey(customerGroupMembership.group)
		return locator.cachingEntityClient.loadAll(PermissionTypeRef, data._id[0]).then((listPermissions: Permission[]) => {
			let customerGroupPermission = listPermissions.find(p => p.group === customerGroupMembership.group)
			if (!customerGroupPermission) throw new SessionKeyNotFoundError("Permission not found, could not apply OwnerGroup migration")
			let listKey = decryptKey(customerGroupKey, (customerGroupPermission: any).symEncSessionKey)
			let groupInfoSk = decryptKey(listKey, base64ToUint8Array(data._listEncSessionKey))
			data._ownerGroup = customerGroupMembership.getGroup()
			data._ownerEncSessionKey = uint8ArrayToBase64(encryptKey(customerGroupKey, groupInfoSk))
			return data
		})
	} else if (isSameTypeRef(typeRef, TutanotaPropertiesTypeRef) && data._ownerEncSessionKey == null) {
		// TODO remove the EncryptTutanotaPropertiesService and replace with an Migration that writes the key
		let migrationData = createEncryptTutanotaPropertiesData()
		data._ownerGroup = locator.login.getUserGroupId()
		let groupEncSessionKey = encryptKey(locator.login.getUserGroupKey(), aes128RandomKey())
		data._ownerEncSessionKey = uint8ArrayToBase64(groupEncSessionKey)
		migrationData.properties = data._id
		migrationData.symEncSessionKey = groupEncSessionKey
		return serviceRequestVoid(TutanotaService.EncryptTutanotaPropertiesService, HttpMethod.POST, migrationData)
			.then(() => (data: any))
	} else if (isSameTypeRef(typeRef, PushIdentifierTypeRef) && data._ownerEncSessionKey == null) {
		// set sessionKey for allowing encryption when old instance (< v43) is updated
		return resolveTypeReference(typeRef)
			.then(typeModel => _updateOwnerEncSessionKey(typeModel, data, locator.login.getUserGroupKey(), aes128RandomKey()))
			.return(data)
	}
	return Promise.resolve(data)
}

export function applyMigrationsForInstance<T>(decryptedInstance: T): Promise<T> {
	const instanceType = downcast(decryptedInstance)._type
	if (isSameTypeRef(instanceType, ContactTypeRef)) {
		const contact: Contact = downcast(decryptedInstance)
		if (!contact.birthdayIso && contact.oldBirthdayAggregate) {
			contact.birthdayIso = birthdayToIsoDate(contact.oldBirthdayAggregate)
			contact.oldBirthdayAggregate = null
			contact.oldBirthdayDate = null
			return update(contact).catch(LockedError, noOp).return(decryptedInstance)
		} else if (!contact.birthdayIso && contact.oldBirthdayDate) {
			contact.birthdayIso = birthdayToIsoDate(oldBirthdayToBirthday(contact.oldBirthdayDate))
			contact.oldBirthdayDate = null
			return update(contact).catch(LockedError, noOp).return(decryptedInstance)
		} else if (contact.birthdayIso && (contact.oldBirthdayAggregate || contact.oldBirthdayDate)) {
			contact.oldBirthdayAggregate = null
			contact.oldBirthdayDate = null
			return update(contact).catch(LockedError, noOp).return(decryptedInstance)
		}
	}
	return Promise.resolve(decryptedInstance)
}

interface ResolveSessionKeyLoaders {
	loadPermissions(listId: Id): Promise<Permission[]>;

	loadBucketPermissions(listId: Id): Promise<BucketPermission[]>;

	loadGroup(groupId: Id): Promise<Group>;
}

const resolveSessionKeyLoaders: ResolveSessionKeyLoaders = {
	loadPermissions: function (listId: Id): Promise<Permission[]> {
		return locator.cachingEntityClient.loadAll(PermissionTypeRef, listId)
	},
	loadBucketPermissions: function (listId: Id): Promise<BucketPermission[]> {
		return locator.cachingEntityClient.loadAll(BucketPermissionTypeRef, listId)
	},
	loadGroup: function (groupId: Id): Promise<Group> {
		return locator.cachingEntityClient.load(GroupTypeRef, groupId)
	}
}

/**
 * Returns the session key for the provided type/instance:
 * * null, if the instance is unencrypted
 * * the decrypted _ownerEncSessionKey, if it is available
 * * the public decrypted session key, otherwise
 *
 * @param typeModel: the type model of the instance
 * @param instance The unencrypted (client-side) or encrypted (server-side) instance
 * @param sessionKeyLoaders sessionKeyLoader to resolve the key
 */
export function resolveSessionKey(typeModel: TypeModel, instance: Object, sessionKeyLoaders: ?ResolveSessionKeyLoaders): Promise<?Aes128Key> {
	return Promise.resolve().then(() => {
		let loaders = sessionKeyLoaders == null ? resolveSessionKeyLoaders : sessionKeyLoaders
		if (!typeModel.encrypted) {
			return Promise.resolve(null)
		} else if (isSameTypeRefByAttr(MailBodyTypeRef, typeModel.app, typeModel.name) && mailBodySessionKeyCache[instance._id]) {
			let sessionKey = mailBodySessionKeyCache[instance._id]
			// the mail body instance is cached, so the session key is not needed any more
			delete mailBodySessionKeyCache[instance._id]
			return sessionKey
		} else if (instance._ownerEncSessionKey && locator.login.isLoggedIn()
			&& locator.login.hasGroup(instance._ownerGroup)) {
			let gk = locator.login.getGroupKey(instance._ownerGroup)
			let key = instance._ownerEncSessionKey
			if (typeof key === "string") {
				key = base64ToUint8Array(instance._ownerEncSessionKey)
			}
			return Promise.resolve(decryptKey(gk, key))
		} else if (instance.ownerEncSessionKey) {
			// TODO this is a service instance: Rename all ownerEncSessionKey attributes to _ownerEncSessionKey and add _ownerGroupId (set ownerEncSessionKey here automatically after resolving the group)
			// add to payment data service
			let gk = locator.login.getGroupKey(locator.login.getGroupId(GroupType.Mail))
			let key = instance.ownerEncSessionKey
			if (typeof key === "string") {
				key = base64ToUint8Array(instance.ownerEncSessionKey)
			}
			return Promise.resolve(decryptKey(gk, key))
		} else {
			return loaders.loadPermissions(instance._permissions).then((listPermissions: Permission[]) => {
				let userGroupIds = locator.login.getAllGroupIds()
				let p: ?Permission = listPermissions.find(p => (p.type === PermissionType.Public_Symmetric || p.type
					=== PermissionType.Symmetric) && p._ownerGroup && userGroupIds.indexOf(p._ownerGroup) !== -1)
				if (p) {
					let gk = locator.login.getGroupKey((p._ownerGroup: any))
					return Promise.resolve(decryptKey(gk, (p._ownerEncSessionKey: any)))
				}
				p = (listPermissions.find(p => p.type === PermissionType.Public || p.type
					=== PermissionType.External): any)
				if (p == null) {
					throw new SessionKeyNotFoundError("could not find permission")
				}
				let permission = neverNull(p)
				return loaders.loadBucketPermissions((permission.bucket: any).bucketPermissions)
				              .then((bucketPermissions: BucketPermission[]) => {
					              let bp = bucketPermissions.find(bp => (bp.type === BucketPermissionType.Public
						              || bp.type === BucketPermissionType.External) && permission._ownerGroup
						              === bp._ownerGroup) // find the bucket permission with the same group as the permission and public type
					              if (bp == null) {
						              throw new SessionKeyNotFoundError("no corresponding bucket permission found");
					              }
					              let bucketPermission = bp;
					              if (bp.type === BucketPermissionType.External) {
						              let bucketKey
						              if (bp.ownerEncBucketKey != null) {
							              bucketKey = decryptKey(locator.login.getGroupKey(neverNull(bp._ownerGroup)), neverNull(bp.ownerEncBucketKey))
						              } else if (bp.symEncBucketKey) {
							              bucketKey = decryptKey(locator.login.getUserGroupKey(), neverNull(bp.symEncBucketKey))
						              } else {
							              throw new SessionKeyNotFoundError(`BucketEncSessionKey is not defined for Permission ${permission._id.toString()} (Instance: ${JSON.stringify(instance)})`)
						              }
						              return decryptKey(bucketKey, neverNull(permission.bucketEncSessionKey))
					              } else {
						              return loaders.loadGroup(bp.group).then(group => {
							              let keypair = group.keys[0]
							              let privKey
							              try {
								              privKey = decryptRsaKey(locator.login.getGroupKey(group._id), keypair.symEncPrivKey)
							              } catch (e) {
								              console.log("failed to decrypt rsa key for group with id " + group._id)
								              throw e
							              }
							              let pubEncBucketKey = bucketPermission.pubEncBucketKey
							              if (pubEncBucketKey == null) {
								              throw new SessionKeyNotFoundError(`PubEncBucketKey is not defined for BucketPermission ${bucketPermission._id.toString()} (Instance: ${JSON.stringify(instance)})`)
							              }
							              return rsaDecrypt(privKey, pubEncBucketKey).then(decryptedBytes => {
								              let bucketKey = uint8ArrayToBitArray(decryptedBytes)

								              let bucketEncSessionKey = permission.bucketEncSessionKey;
								              if (bucketEncSessionKey == null) {
									              throw new SessionKeyNotFoundError(`BucketEncSessionKey is not defined for Permission ${permission._id.toString()} (Instance: ${JSON.stringify(instance)})`)
								              }
								              let sk = decryptKey(bucketKey, bucketEncSessionKey)

								              if (bucketPermission._ownerGroup) { // is not defined for some old AccountingInfos
									              let bucketPermissionOwnerGroupKey = locator
										              .login.getGroupKey(neverNull(bucketPermission._ownerGroup))
									              let bucketPermissionGroupKey = locator.login.getGroupKey(bucketPermission.group)
									              return _updateWithSymPermissionKey(typeModel, instance, permission,
										              bucketPermission, bucketPermissionOwnerGroupKey,
										              bucketPermissionGroupKey, sk)
										              .catch(NotFoundError, e => {
											              console.log("w> could not find instance to update permission")
										              })
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
	}).then(sessionKey => {
		// store the mail session key for the mail body because it is the same
		if (sessionKey && isSameTypeRefByAttr(MailTypeRef, typeModel.app, typeModel.name)) {
			mailBodySessionKeyCache[instance.body] = sessionKey
		}
		return sessionKey
	}).catch(CryptoError, e => {
		console.log("failed to resolve session key", e)
		throw new SessionKeyNotFoundError("Crypto error while resolving session key for instance " + instance._id)
	})
}

/**
 * Returns the session key for the provided service response:
 * * null, if the instance is unencrypted
 * * the decrypted _ownerPublicEncSessionKey, if it is available
 *
 * @param instance The unencrypted (client-side) or encrypted (server-side) instance
 *
 */
export function resolveServiceSessionKey(typeModel: TypeModel, instance: Object): Promise<?Aes128Key> {
	if (instance._ownerPublicEncSessionKey) {
		return locator.cachingEntityClient.load(GroupTypeRef, instance._ownerGroup).then(group => {
			let keypair = group.keys[0]
			let gk = locator.login.getGroupKey(instance._ownerGroup)
			let privKey
			try {
				privKey = decryptRsaKey(gk, keypair.symEncPrivKey)
			} catch (e) {
				console.log("failed to decrypt rsa key for group with id " + group._id)
				throw e
			}
			return rsaDecrypt(privKey, base64ToUint8Array(instance._ownerPublicEncSessionKey))
				.then(decryptedBytes => uint8ArrayToBitArray(decryptedBytes))
		})
	}
	return Promise.resolve(null)
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
function _updateWithSymPermissionKey(typeModel: TypeModel, instance: Object, permission: Permission, bucketPermission: BucketPermission, permissionOwnerGroupKey: Aes128Key, permissionGroupKey: Aes128Key, sessionKey: Aes128Key): Promise<void> {
	if (typeof instance._type !== 'undefined' || !locator.login.isLeader()) {
		// do not update the session key in case of an unencrypted (client-side) instance
		// or in case we are not the leader client
		return Promise.resolve()
	}
	if (!instance._ownerEncSessionKey && permission._ownerGroup === instance._ownerGroup) {
		return _updateOwnerEncSessionKey(typeModel, instance, permissionOwnerGroupKey, sessionKey)
	} else { // instances shared via permissions (e.g. body)
		let updateService = createUpdatePermissionKeyData()
		updateService.permission = permission._id
		updateService.bucketPermission = bucketPermission._id
		updateService.ownerEncSessionKey = encryptKey(permissionOwnerGroupKey, sessionKey)
		updateService.symEncSessionKey = encryptKey(permissionGroupKey, sessionKey) // legacy can be removed
		return serviceRequestVoid(SysService.UpdatePermissionKeyService, HttpMethod.POST, updateService)
	}
}

function _updateOwnerEncSessionKey(typeModel: TypeModel, instance: Object, ownerGroupKey: Aes128Key, sessionKey: Aes128Key): Promise<void> {
	instance._ownerEncSessionKey = uint8ArrayToBase64(encryptKey(ownerGroupKey, sessionKey))
	// we have to call the rest client directly because instance is still the encrypted server-side version
	let path = typeRefToPath(new TypeRef(typeModel.app, typeModel.name)) + '/'
		+ (instance._id instanceof Array ? instance._id.join("/") : instance._id)

	let headers = locator.login.createAuthHeaders()
	headers["v"] = typeModel.version
	return locator.restClient.request(path, HttpMethod.PUT, {updateOwnerEncSessionKey: "true"}, headers, JSON.stringify(instance))
	              .catch(PayloadTooLargeError, (e) => {
		              console.log("Could not update owner enc session key - PayloadTooLargeError", e)
	              })
}

export function setNewOwnerEncSessionKey(model: TypeModel, entity: Object): ?Aes128Key {
	if (!entity._ownerGroup) {
		throw new Error(`no owner group set  ${JSON.stringify(entity)}`)
	}
	if (model.encrypted) {
		if (entity._ownerEncSessionKey) {
			throw new Error(`ownerEncSessionKey already set ${JSON.stringify(entity)}`)
		}
		let sessionKey = aes128RandomKey()
		entity._ownerEncSessionKey = encryptKey(locator.login.getGroupKey(entity._ownerGroup), sessionKey)
		return sessionKey
	} else {
		return null
	}
}

if (!('toJSON' in Error.prototype)) {
	Object.defineProperty((Error.prototype: any), 'toJSON', {
		value: function () {
			var alt = {};

			Object.getOwnPropertyNames(this).forEach(function (key) {
				alt[key] = this[key];
			}, this);

			return alt;
		},
		configurable: true,
		writable: true
	});
}
