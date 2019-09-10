// @flow
import {base64ToUint8Array, hexToUint8Array, uint8ArrayToBase64, uint8ArrayToHex} from "../../common/utils/Encoding"
import {concat} from "../../common/utils/ArrayUtils"
import {aes128Decrypt, aes128Encrypt, aes128RandomKey, aes256Decrypt, aes256Encrypt, IV_BYTE_LENGTH} from "./Aes"
import {ProgrammingError} from "../../common/error/ProgrammingError"
import {BucketPermissionType, GroupType, PermissionType} from "../../common/TutanotaConstants"
import {load, loadAll, serviceRequestVoid} from "../EntityWorker"
import {TutanotaService} from "../../entities/tutanota/Services"
import {hexToPrivateKey, privateKeyToHex, rsaDecrypt} from "./Rsa"
import {random} from "./Randomizer"
import {HttpMethod, isSameTypeRef, isSameTypeRefByAttr, resolveTypeReference, TypeRef} from "../../common/EntityFunctions"
import {GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import {TutanotaPropertiesTypeRef} from "../../entities/tutanota/TutanotaProperties"
import {createEncryptTutanotaPropertiesData} from "../../entities/tutanota/EncryptTutanotaPropertiesData"
import {BucketPermissionTypeRef} from "../../entities/sys/BucketPermission"
import {GroupTypeRef} from "../../entities/sys/Group"
import {PermissionTypeRef} from "../../entities/sys/Permission"
import {assertWorkerOrNode} from "../../Env"
import {neverNull} from "../../common/utils/Utils"
import {typeRefToPath} from "../rest/EntityRestClient"
import {restClient} from "../rest/RestClient"
import {createUpdatePermissionKeyData} from "../../entities/sys/UpdatePermissionKeyData"
import {SysService} from "../../entities/sys/Services"
import {bitArrayToUint8Array, uint8ArrayToBitArray} from "./CryptoUtils"
import {NotFoundError} from "../../common/error/RestError"
import {SessionKeyNotFoundError} from "../../common/error/SessionKeyNotFoundError" // importing with {} from CJS modules is not supported for dist-builds currently (must be a systemjs builder bug)
import {locator} from "../WorkerLocator"
import {MailBodyTypeRef} from "../../entities/tutanota/MailBody"
import {MailTypeRef} from "../../entities/tutanota/Mail"
import EC from "../../common/EntityConstants" // importing with {} from CJS modules is not supported for dist-builds currently (must be a systemjs builder bug)
import {CryptoError} from "../../common/error/CryptoError"
import {PushIdentifierTypeRef} from "../../entities/sys/PushIdentifier"
import {uncompress} from "../lz4"
import {decryptAndMapToInstance, decryptValue, encryptAndMapToLiteral, encryptBytes, encryptString, encryptValue} from "./InstanceMapper.js"

const Type = EC.Type
const ValueType = EC.ValueType
const Cardinality = EC.Cardinality
const AssociationType = EC.AssociationType

assertWorkerOrNode()

export {decryptAndMapToInstance, encryptAndMapToLiteral, encryptValue, decryptValue, encryptBytes, encryptString}

// stores a mapping from mail body id to mail body session key. the mail body of a mail is encrypted with the same session key as the mail.
// so when resolving the session key of a mail we cache it for the mail's body to avoid that the body's permission (+ bucket permission) have to be loaded.
// this especially improves the performance when indexing mail bodys
let mailBodySessionKeyCache: {[key: string]: Aes128Key} = {};

export function valueToDefault(type: ValueTypeEnum) {
	switch (type) {
		case ValueType.String:
			return ""
		case ValueType.Number:
			return "0"
		case ValueType.Bytes:
			return new Uint8Array(0)
		case ValueType.Date:
			return new Date()
		case ValueType.Boolean:
			return false
		case ValueType.CompressedString:
			return ""
		default:
			throw new ProgrammingError(`${type} is not a valid value type`)
	}
}

export const fixedIv = hexToUint8Array('88888888888888888888888888888888')

export function encryptKey(encryptionKey: Aes128Key, key: Aes128Key): Uint8Array {
	return aes128Encrypt(encryptionKey, bitArrayToUint8Array(key), fixedIv, false, false).slice(fixedIv.length)
}

export function decryptKey(encryptionKey: Aes128Key, key: Uint8Array): Aes128Key | Aes256Key {
	return uint8ArrayToBitArray(aes128Decrypt(encryptionKey, concat(fixedIv, key), false))
}

export function encrypt256Key(encryptionKey: Aes128Key, key: Aes256Key): Uint8Array {
	return aes128Encrypt(encryptionKey, bitArrayToUint8Array(key), fixedIv, false, false).slice(fixedIv.length)
}

export function aes256EncryptKey(encryptionKey: Aes256Key, key: Aes128Key): Uint8Array {
	return aes256Encrypt(encryptionKey, bitArrayToUint8Array(key), fixedIv, false, false).slice(fixedIv.length)
}

export function aes256DecryptKey(encryptionKey: Aes256Key, key: Uint8Array): Aes128Key {
	return uint8ArrayToBitArray(aes256Decrypt(encryptionKey, concat(fixedIv, key), false, false))
}

export function decrypt256Key(encryptionKey: Aes128Key, key: Uint8Array): Aes256Key {
	return uint8ArrayToBitArray(aes128Decrypt(encryptionKey, concat(fixedIv, key), false))
}

export function encryptRsaKey(encryptionKey: Aes128Key, privateKey: PrivateKey, iv: ?Uint8Array): Uint8Array {
	return aes128Encrypt(encryptionKey, hexToUint8Array(privateKeyToHex(privateKey)), iv ? iv : random.generateRandomData(IV_BYTE_LENGTH), true, false)
}

export function decryptRsaKey(encryptionKey: Aes128Key, encryptedPrivateKey: Uint8Array): PrivateKey {
	return hexToPrivateKey(uint8ArrayToHex(aes128Decrypt(encryptionKey, encryptedPrivateKey, true)))
}

export function applyMigrations<T>(typeRef: TypeRef<T>, data: Object): Promise<Object> {
	if (isSameTypeRef(typeRef, GroupInfoTypeRef) && data._ownerGroup == null) {
		//FIXME: do we still need this?
		let customerGroupMembership = (locator.login.getLoggedInUser()
		                                      .memberships
		                                      .find((g: GroupMembership) => g.groupType === GroupType.Customer): any)
		let customerGroupKey = locator.login.getGroupKey(customerGroupMembership.group)
		return loadAll(PermissionTypeRef, data._id[0]).then((listPermissions: Permission[]) => {
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

interface ResolveSessionKeyLoaders {
	loadPermissions(listId: Id): Promise<Permission[]>;

	loadBucketPermissions(listId: Id): Promise<BucketPermission[]>;

	loadGroup(groupId: Id): Promise<Group>;
}

const resolveSessionKeyLoaders: ResolveSessionKeyLoaders = {
	loadPermissions: function (listId: Id): Promise<Permission[]> {
		return loadAll(PermissionTypeRef, listId)
	},
	loadBucketPermissions: function (listId: Id): Promise<BucketPermission[]> {
		return loadAll(BucketPermissionTypeRef, listId)
	},
	loadGroup: function (groupId: Id): Promise<Group> {
		return load(GroupTypeRef, groupId)
	}
}

/**
 * Returns the session key for the provided type/instance:
 * * null, if the instance is unencrypted
 * * the decrypted _ownerEncSessionKey, if it is available
 * * the public decrypted session key, otherwise
 *
 * @param instance The unencrypted (client-side) or encrypted (server-side) instance
 *
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
 * Updates the given public permission with the given symmetric key for faster access.
 * @param permission The permission.
 * @param instance The unencrypted (client-side) or encrypted (server-side) instance
 * @param bucketPermission The bucket permission.
 * @param permissionOwnerGroupKey The symmetric group key for the owner group on the permission.
 * @param permissionGroupKey The symmetric group key of the group in the permission.
 * @param sessionKey The symmetric session key.
 */
function _updateWithSymPermissionKey(typeModel: TypeModel, instance: Object, permission: Permission, bucketPermission: BucketPermission, permissionOwnerGroupKey: Aes128Key, permissionGroupKey: Aes128Key, sessionKey: Aes128Key): Promise<void> {
	if (typeof instance._type !== 'undefined') {
		// do not update the session key in case of an unencrypted (client-side) instance
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
	return restClient.request(path, HttpMethod.PUT, {updateOwnerEncSessionKey: "true"}, headers, JSON.stringify(instance))
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
