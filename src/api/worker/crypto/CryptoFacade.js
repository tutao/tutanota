// @flow
import {
	base64ToUint8Array,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString,
	stringToUtf8Uint8Array,
	hexToUint8Array,
	uint8ArrayToHex,
	base64ToBase64Url
} from "../../common/utils/Encoding"
import {concat} from "../../common/utils/ArrayUtils"
import {aes128Encrypt, aes128Decrypt, aes128RandomKey, IV_BYTE_LENGTH, ENABLE_MAC} from "./Aes"
import {ProgrammingError} from "../../common/error/ProgrammingError"
import {GroupType, PermissionType, BucketPermissionType} from "../../common/TutanotaConstants"
import {loadAll, load, serviceRequestVoid} from "../EntityWorker"
import {TutanotaService} from "../../entities/tutanota/Services"
import {rsaDecrypt, privateKeyToHex, hexToPrivateKey} from "./Rsa"
import {random} from "./Randomizer"
import {resolveTypeReference, TypeRef, isSameTypeRef, HttpMethod} from "../../common/EntityFunctions"
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
import {uint8ArrayToBitArray, bitArrayToUint8Array} from "./CryptoUtils"
import {NotFoundError} from "../../common/error/RestError"
import {SessionKeyNotFoundError} from "../../common/error/SessionKeyNotFoundError" // importing with {} from CJS modules is not supported for dist-builds currently (must be a systemjs builder bug)
import {locator} from "../WorkerLocator"
import {MailBodyTypeRef} from "../../entities/tutanota/MailBody"
import {MailTypeRef} from "../../entities/tutanota/Mail"
import EC from "../../common/EntityConstants" // importing with {} from CJS modules is not supported for dist-builds currently (must be a systemjs builder bug)
import {CryptoError} from "../../common/error/CryptoError"
const Type = EC.Type
const ValueType = EC.ValueType
const Cardinality = EC.Cardinality
const AssociationType = EC.AssociationType

assertWorkerOrNode()

// stores a mapping from mail body id to mail body session key. the mail body of a mail is encrypted with the same session key as the mail.
// so when resolving the session key of a mail we cache it for the mail's body to avoid that the body's permission (+ bucket permission) have to be loaded.
// this especially improves the performance when indexing mail bodys
let mailBodySessionKeyCache: {[key: string] : Aes128Key} = {};

export function valueToDefault(type: ValueTypeEnum) {
	if (type === ValueType.String) return ""
	else if (type === ValueType.Number) return "0"
	else if (type === ValueType.Bytes) return new Uint8Array(0)
	else if (type === ValueType.Date) return new Date()
	else if (type === ValueType.Boolean) return false
	else throw new ProgrammingError(`${type} is not a valid value type`)
}

export const fixedIv = hexToUint8Array('88888888888888888888888888888888')

export function encryptKey(encryptionKey: Aes128Key, key: Aes128Key): Uint8Array {
	return aes128Encrypt(encryptionKey, bitArrayToUint8Array(key), fixedIv, false, false).slice(fixedIv.length)
}

export function decryptKey(encryptionKey: Aes128Key, key: Uint8Array): Aes128Key|Aes256Key {
	return uint8ArrayToBitArray(aes128Decrypt(encryptionKey, concat(fixedIv, key), false))
}

export function encrypt256Key(encryptionKey: Aes128Key, key: Aes256Key): Uint8Array {
	return aes128Encrypt(encryptionKey, bitArrayToUint8Array(key), fixedIv, false, false).slice(fixedIv.length)
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
		let customerGroupMembership = (locator.login.getLoggedInUser().memberships.find((g: GroupMembership) => g.groupType === GroupType.Customer):any)
		let customerGroupKey = locator.login.getGroupKey(customerGroupMembership.group)
		return loadAll(PermissionTypeRef, data._id[0]).then((listPermissions: Permission[]) => {
			let customerGroupPermission = listPermissions.find(p => p.group === customerGroupMembership.group)
			if (!customerGroupPermission) throw new SessionKeyNotFoundError("Permission not found, could not apply OwnerGroup migration")
			let listKey = decryptKey(customerGroupKey, (customerGroupPermission:any).symEncSessionKey)
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
		return serviceRequestVoid(TutanotaService.EncryptTutanotaPropertiesService, HttpMethod.POST, migrationData).then(() => (data:any))
	}
	return Promise.resolve(data)
}

interface ResolveSessionKeyLoaders {
	loadPermissions(listId: Id):Promise<Permission[]>;
	loadBucketPermissions(listId: Id):Promise<BucketPermission[]>;
	loadGroup(groupId: Id):Promise<Group>;
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
		} else if (isSameTypeRef(new TypeRef(typeModel.app, typeModel.name), MailBodyTypeRef) && mailBodySessionKeyCache[instance._id]) {
			let sessionKey = mailBodySessionKeyCache[instance._id]
			// the mail body instance is cached, so the session key is not needed any more
			delete mailBodySessionKeyCache[instance._id]
			return sessionKey
		} else if (instance._ownerEncSessionKey && locator.login.isLoggedIn() && locator.login.hasGroup(instance._ownerGroup)) {
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
				let p: ?Permission = listPermissions.find(p => (p.type === PermissionType.Public_Symmetric || p.type === PermissionType.Symmetric) && p._ownerGroup && userGroupIds.indexOf(p._ownerGroup) !== -1)
				if (p) {
					try {
						let gk = locator.login.getGroupKey((p._ownerGroup:any))
						return Promise.resolve(decryptKey(gk, (p._ownerEncSessionKey:any)))
					} catch (e) {
						console.log("could not find group key for ownerGroup ", p._ownerGroup)
					}
				}
				p = (listPermissions.find(p => p.type === PermissionType.Public || p.type === PermissionType.External):any)
				if (p == null) {
					throw new SessionKeyNotFoundError("could not find permission")
				}
				let permission = neverNull(p)
				return loaders.loadBucketPermissions((permission.bucket:any).bucketPermissions).then((bucketPermissions: BucketPermission[]) => {
					let bp = bucketPermissions.find(bp => (bp.type === BucketPermissionType.Public || bp.type === BucketPermissionType.External) && permission._ownerGroup === bp._ownerGroup) // find the bucket permission with the same group as the permission and public type
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

								let bucketPermissionOwnerGroupKey = locator.login.getGroupKey(neverNull(bucketPermission._ownerGroup))
								let bucketPermissionGroupKey = locator.login.getGroupKey(bucketPermission.group)
								return _updateWithSymPermissionKey(typeModel, instance, permission, bucketPermission, bucketPermissionOwnerGroupKey, bucketPermissionGroupKey, sk)
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
		if (sessionKey && isSameTypeRef(new TypeRef(typeModel.app, typeModel.name), MailTypeRef)) {
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
		instance._ownerEncSessionKey = uint8ArrayToBase64(encryptKey(permissionOwnerGroupKey, sessionKey))
		// we have to call the rest client directly because instance is still the encrypted server-side version
		let path = typeRefToPath(new TypeRef(typeModel.app, typeModel.name)) + '/' + (instance._id instanceof Array ? instance._id.join("/") : instance._id)

		let headers = locator.login.createAuthHeaders()
		headers["v"] = typeModel.version
		return restClient.request(path, HttpMethod.PUT, {updateOwnerEncSessionKey: "true"}, headers, JSON.stringify(instance))
	} else { // instances shared via permissions (e.g. body)
		let updateService = createUpdatePermissionKeyData()
		updateService.permission = permission._id
		updateService.bucketPermission = bucketPermission._id
		updateService.ownerEncSessionKey = encryptKey(permissionOwnerGroupKey, sessionKey)
		updateService.symEncSessionKey = encryptKey(permissionGroupKey, sessionKey) // legacy can be removed
		return serviceRequestVoid(SysService.UpdatePermissionKeyService, HttpMethod.POST, updateService)
	}
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

if (!('toJSON' in Error.prototype))
	Object.defineProperty((Error.prototype:any), 'toJSON', {
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


/**
 * Decrypts an object literal as received from the DB and maps it to an entity class (e.g. Mail)
 * @param Type The class of the instance
 * @param instance The object literal as received from the DB
 * @param sk The session key, must be provided for encrypted instances
 * @returns The decrypted and mapped instance
 */
export function decryptAndMapToInstance<T>(model: TypeModel, instance: Object, sk: ?Aes128Key): Promise<T> {
	let decrypted: any = {
		_type: new TypeRef(model.app, model.name)
	}
	for (let key of Object.keys(model.values)) {
		let valueType = model.values[key]
		let value = instance[valueType.name]
		try {
			decrypted[valueType.name] = decryptValue(valueType, value, sk)
			if (valueType.encrypted) {
				if (valueType.final) {
					// we have to store the encrypted value to be able to restore it when updating the instance. this is not needed for data transfer types, but it does not hurt
					decrypted["_finalEncrypted_" + valueType.name] = value
				} else if (value == "") {
					// we have to store the default value to make sure that updates do not cause more storage use
					decrypted["_defaultEncrypted_" + valueType.name] = decrypted[valueType.name]
				}
			}
		} catch (e) {
			if (decrypted._errors == null) {
				decrypted._errors = {}
			}
			decrypted._errors[valueType.name] = JSON.stringify(e)
		}
	}
	return Promise.map(Object.keys(model.associations), (associationName) => {
		if (model.associations[associationName].type === AssociationType.Aggregation) {
			return resolveTypeReference(new TypeRef(model.app, model.associations[associationName].refType)).then((aggregateTypeModel) => {
				let aggregation = model.associations[associationName]
				if (aggregation.cardinality === Cardinality.ZeroOrOne && instance[associationName] == null) {
					decrypted[associationName] = null
				} else if (instance[associationName] == null) {
					throw new ProgrammingError(`Undefined aggregation ${model.name}:${associationName}`)
				} else if (aggregation.cardinality === Cardinality.Any) {
					return Promise.map(instance[associationName], (aggregate) => {
						return decryptAndMapToInstance(aggregateTypeModel, aggregate, sk)
					}).then((decryptedAggregates) => {
						decrypted[associationName] = decryptedAggregates
					})
				} else {
					return decryptAndMapToInstance(aggregateTypeModel, instance[associationName], sk).then((decryptedAggregate) => {
						decrypted[associationName] = decryptedAggregate
					})
				}
			})
		} else {
			decrypted[associationName] = instance[associationName]
		}
	}).then(() => {
		return decrypted
	})
}

export function encryptAndMapToLiteral<T>(model: TypeModel, instance: T, sk: ?Aes128Key): Object {
	let encrypted = {}
	let i = (instance:any)

	for (let key of Object.keys(model.values)) {
		let valueType = model.values[key]
		let value = i[valueType.name]
		// restore the original encrypted value if it exists. it does not exist if this is a data transfer type or a newly created entity. check against null explicitely because "" is allowed
		if (valueType.encrypted && valueType.final && i["_finalEncrypted_" + valueType.name] != null) {
			encrypted[valueType.name] = i["_finalEncrypted_" + valueType.name]
		} else if (valueType.encrypted && i["_defaultEncrypted_" + valueType.name] === value) {
			// restore the default encrypted value because it has not changed
			encrypted[valueType.name] = ""
		} else {
			encrypted[valueType.name] = encryptValue(valueType, value, sk)
		}
	}
	if (model.type == Type.Aggregated && !encrypted._id) {
		encrypted._id = base64ToBase64Url(uint8ArrayToBase64(random.generateRandomData(4)))
	}
	return Promise.map(Object.keys(model.associations), (associationName) => {
		if (model.associations[associationName].type === AssociationType.Aggregation) {
			return resolveTypeReference(new TypeRef(model.app, model.associations[associationName].refType)).then((aggregateTypeModel) => {
				let aggregation = model.associations[associationName]
				if (aggregation.cardinality === Cardinality.ZeroOrOne && i[associationName] == null) {
					encrypted[associationName] = null
				} else if (i[associationName] == null) {
					throw new ProgrammingError(`Undefined attribute ${model.name}:${associationName}`)
				} else if (aggregation.cardinality === Cardinality.Any) {
					return Promise.map(i[associationName], (aggregate) => {
						return encryptAndMapToLiteral(aggregateTypeModel, aggregate, sk)
					}).then((encryptedAggregates) => {
						encrypted[associationName] = encryptedAggregates
					})
				} else {
					return encryptAndMapToLiteral(aggregateTypeModel, i[associationName], sk).then((encryptedAggregate) => {
						encrypted[associationName] = encryptedAggregate
					})
				}
			})
		} else {
			encrypted[associationName] = i[associationName]
		}
	}).then(() => {
		return encrypted
	})

}

export function encryptValue(valueType: ModelValue, value: any, sk: ?Aes128Key): any {
	if (value == null && valueType.name !== '_id' && valueType.name !== '_permissions') {
		if (valueType.cardinality === Cardinality.ZeroOrOne) {
			return null
		} else {
			throw new ProgrammingError(`Value ${valueType.name} with cardinality ONE can not be null`)
		}
	} else if (valueType.encrypted) {
		let bytes = value
		if (valueType.type !== ValueType.Bytes) {
			bytes = stringToUtf8Uint8Array(convertJsToDbType(valueType.type, value))
		}
		return uint8ArrayToBase64(aes128Encrypt((sk:any), bytes, random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC))
	} else {
		return convertJsToDbType(valueType.type, value)
	}
}

export function decryptValue(valueType: ModelValue, value: ?Base64|String, sk: ?Aes128Key): any {
	if (value == null) {
		if (valueType.cardinality === Cardinality.ZeroOrOne) {
			return null
		} else {
			throw new ProgrammingError(`Value ${valueType.name} with cardinality ONE can not be null`)
		}
	} else if (valueType.cardinality === Cardinality.One && value === "") {
		return valueToDefault(valueType.type) // Migration for values added after the Type has been defined initially
	} else if (valueType.encrypted) {
		let decryptedBytes = aes128Decrypt((sk:any), base64ToUint8Array((value:any)))
		if (valueType.type === ValueType.Bytes) {
			return decryptedBytes
		} else {
			return convertDbToJsType(valueType.type, utf8Uint8ArrayToString(decryptedBytes))
		}
	} else {
		return convertDbToJsType(valueType.type, (value:any))
	}
}

function convertDbToJsType(type: ValueType, value: string): any {
	if (type === ValueType.Bytes && value != null && !(value instanceof Uint8Array)) {
		return base64ToUint8Array((value:any))
	} else if (type === ValueType.Boolean) {
		return value !== '0'
	} else if (type === ValueType.Date) {
		return new Date(parseInt(value))
	} else {
		return value
	}
}

function convertJsToDbType(type: ValueType, value: any): Base64|string {
	if (type === ValueType.Bytes && value != null) {
		return uint8ArrayToBase64((value:any))
	} else if (type === ValueType.Boolean) {
		return value ? '1' : '0'
	} else if (type === ValueType.Date) {
		return value.getTime().toString()
	} else {
		return value
	}
}

export function encryptBytes(sk: Aes128Key, value: Uint8Array): Uint8Array {
	return aes128Encrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)
}

export function encryptString(sk: Aes128Key, value: string): Uint8Array {
	return aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)
}