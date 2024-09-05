import { b64UserIdHash, DbFacade } from "../../search/DbFacade.js"
import { assertNotNull, concat, downcast, isSameTypeRefByAttr, LazyLoaded, stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { User, UserTypeRef } from "../../../entities/sys/TypeRefs.js"
import { ExternalImageRule, OperationType } from "../../../common/TutanotaConstants.js"
import {
	Aes128Key,
	Aes256Key,
	aes256RandomKey,
	aesEncrypt,
	AesKey,
	decryptKey,
	IV_BYTE_LENGTH,
	random,
	unauthenticatedAesDecrypt,
} from "@tutao/tutanota-crypto"
import { UserFacade } from "../UserFacade.js"
import { EncryptedDbKeyBaseMetaData, EncryptedIndexerMetaData, Metadata, ObjectStoreName } from "../../search/IndexTables.js"
import { DbError } from "../../../common/error/DbError.js"
import { KeyLoaderFacade } from "../KeyLoaderFacade.js"
import type { QueuedBatch } from "../../EventQueue.js"
import { encryptKeyWithVersionedKey, VersionedKey } from "../../crypto/CryptoWrapper.js"

const VERSION: number = 2
const DB_KEY_PREFIX: string = "ConfigStorage"
const ExternalImageListOS: ObjectStoreName = "ExternalAllowListOS"
export const ConfigurationMetaDataOS: ObjectStoreName = "MetaDataOS"
type EncryptionMetadata = {
	readonly key: Aes128Key
	readonly iv: Uint8Array
}
type ConfigDb = {
	readonly db: DbFacade
	readonly metaData: EncryptionMetadata
}

/** @PublicForTesting */
export async function encryptItem(item: string, key: Aes256Key, iv: Uint8Array): Promise<Uint8Array> {
	return aesEncrypt(key, stringToUtf8Uint8Array(item), iv, true)
}

export async function decryptLegacyItem(encryptedAddress: Uint8Array, key: Aes256Key, iv: Uint8Array): Promise<string> {
	return utf8Uint8ArrayToString(unauthenticatedAesDecrypt(key, concat(iv, encryptedAddress)))
}

/**
 * A local configuration database that can be used as an alternative to DeviceConfig:
 * Ideal for cases where the configuration values should be stored encrypted,
 * Or when the configuration is a growing list or object, which would be unsuitable for localStorage
 * Or when the configuration is only required in the Worker
 */
export class ConfigurationDatabase {
	// visible for testing
	readonly db: LazyLoaded<ConfigDb>

	constructor(
		private readonly keyLoaderFacade: KeyLoaderFacade,
		userFacade: UserFacade,
		dbLoadFn: (arg0: User, arg1: KeyLoaderFacade) => Promise<ConfigDb> = (user: User, keyLoaderFacade: KeyLoaderFacade) =>
			this.loadConfigDb(user, keyLoaderFacade),
	) {
		this.db = new LazyLoaded(() => {
			const user = assertNotNull(userFacade.getLoggedInUser())
			return dbLoadFn(user, keyLoaderFacade)
		})
	}

	async addExternalImageRule(address: string, rule: ExternalImageRule): Promise<void> {
		const { db, metaData } = await this.db.getAsync()
		if (!db.indexingSupported) return
		const encryptedAddress = await encryptItem(address, metaData.key, metaData.iv)
		return addAddressToImageList(db, encryptedAddress, rule)
	}

	async getExternalImageRule(address: string): Promise<ExternalImageRule> {
		const { db, metaData } = await this.db.getAsync()
		if (!db.indexingSupported) return ExternalImageRule.None
		const encryptedAddress = await encryptItem(address, metaData.key, metaData.iv)
		const transaction = await db.createTransaction(true, [ExternalImageListOS])
		const entry = await transaction.get(ExternalImageListOS, encryptedAddress)
		let rule = ExternalImageRule.None

		if (entry != null) {
			if (entry.rule != null) {
				rule = entry.rule
			} else {
				// No rule set from earlier version means Allow
				await addAddressToImageList(db, encryptedAddress, ExternalImageRule.Allow)
				rule = ExternalImageRule.Allow
			}
		}

		return rule
	}

	async loadConfigDb(user: User, keyLoaderFacade: KeyLoaderFacade): Promise<ConfigDb> {
		const id = this.getDbId(user._id)
		const db = new DbFacade(VERSION, async (event, db, dbFacade) => {
			if (event.oldVersion === 0) {
				db.createObjectStore(ConfigurationMetaDataOS)
				db.createObjectStore(ExternalImageListOS, {
					keyPath: "address",
				})
			}
			const metaData =
				(await loadEncryptionMetadata(dbFacade, id, keyLoaderFacade, ConfigurationMetaDataOS)) ||
				(await initializeDb(dbFacade, id, keyLoaderFacade, ConfigurationMetaDataOS))

			if (event.oldVersion === 1) {
				// migrate from plain, mac-and-static-iv aes256 to aes256 with mac
				const transaction = await dbFacade.createTransaction(true, [ExternalImageListOS])
				const entries = await transaction.getAll(ExternalImageListOS)
				const { key, iv } = metaData
				for (const entry of entries) {
					const address = await decryptLegacyItem(new Uint8Array(downcast(entry.key)), key, iv)
					await this.addExternalImageRule(address, entry.value.rule)
					const deleteTransaction = await dbFacade.createTransaction(false, [ExternalImageListOS])
					await deleteTransaction.delete(ExternalImageListOS, entry.key)
				}
			}
		})
		const metaData =
			(await loadEncryptionMetadata(db, id, keyLoaderFacade, ConfigurationMetaDataOS)) ||
			(await initializeDb(db, id, keyLoaderFacade, ConfigurationMetaDataOS))
		return {
			db,
			metaData,
		}
	}

	async onEntityEventsReceived(batch: QueuedBatch): Promise<any> {
		const { events, groupId, batchId } = batch
		for (const event of events) {
			if (!(event.operation === OperationType.UPDATE && isSameTypeRefByAttr(UserTypeRef, event.application, event.type))) {
				continue
			}
			const configDb = await this.db.getAsync()
			if (configDb.db.isSameDbId(this.getDbId(event.instanceId))) {
				return updateEncryptionMetadata(configDb.db, this.keyLoaderFacade, ConfigurationMetaDataOS)
			}
		}
	}

	async delete(userId: Id): Promise<void> {
		const dbId = this.getDbId(userId)
		if (this.db.isLoadedOrLoading()) {
			const { db } = await this.db.getAsync()
			await db.deleteDatabase(dbId)
		} else {
			await DbFacade.deleteDb(dbId)
		}
	}

	private getDbId(userId: Id): string {
		return `${DB_KEY_PREFIX}_${b64UserIdHash(userId)}`
	}
}

async function decryptMetaData(keyLoaderFacade: KeyLoaderFacade, metaData: EncryptedDbKeyBaseMetaData): Promise<EncryptionMetadata> {
	const userGroupKey = await keyLoaderFacade.loadSymUserGroupKey(metaData.userGroupKeyVersion)
	const key = decryptKey(userGroupKey, metaData.userEncDbKey)
	const iv = unauthenticatedAesDecrypt(key, metaData.encDbIv)
	return {
		key,
		iv,
	}
}

/**
 * Load the encryption key and iv from the db
 * @return { key, iv } or null if one or both don't exist
 * @VisibleForTesting
 */
export async function loadEncryptionMetadata(
	db: DbFacade,
	id: string,
	keyLoaderFacade: KeyLoaderFacade,
	objectStoreName: ObjectStoreName,
): Promise<EncryptionMetadata | null> {
	await db.open(id)
	const metaData = await getMetaData(db, objectStoreName)
	if (metaData != null) {
		return await decryptMetaData(keyLoaderFacade, metaData)
	} else {
		return null
	}
}

/**
 * Reencrypt the DB key and IV if there is a new userGroupKey
 * @VisibleForTesting
 */
export async function updateEncryptionMetadata(db: DbFacade, keyLoaderFacade: KeyLoaderFacade, objectStoreName: ObjectStoreName): Promise<void> {
	const metaData = await getMetaData(db, objectStoreName)
	const currentUserGroupKey = keyLoaderFacade.getCurrentSymUserGroupKey()

	if (metaData == null || currentUserGroupKey.version === metaData.userGroupKeyVersion) return

	const encryptionMetadata = await decryptMetaData(keyLoaderFacade, metaData)
	if (encryptionMetadata == null) return
	const { key, iv } = encryptionMetadata
	await encryptAndSaveDbKey(currentUserGroupKey, key, iv, db, objectStoreName)
}

/**
 * Helper function to get the group key version for the group key that was used to encrypt the db key. In case the version has not been written to the db we assume 0.
 * @param db the dbFacade corresponding to the object store
 * @param objectStoreName the objectStore to get the metadata from
 */
export async function getMetaData(db: DbFacade, objectStoreName: ObjectStoreName): Promise<EncryptedDbKeyBaseMetaData | null> {
	const transaction = await db.createTransaction(true, [objectStoreName])
	const userEncDbKey = (await transaction.get(objectStoreName, Metadata.userEncDbKey)) as Uint8Array
	const encDbIv = (await transaction.get(objectStoreName, Metadata.encDbIv)) as Uint8Array
	const userGroupKeyVersion = (await transaction.get<number>(objectStoreName, Metadata.userGroupKeyVersion)) ?? 0 // was not written for old dbs
	if (userEncDbKey == null || encDbIv == null) {
		return null
	} else {
		return {
			userEncDbKey,
			encDbIv,
			userGroupKeyVersion,
		}
	}
}

/**
 * Helper function to get the group key version for the group key that was used to encrypt the db key. In case the version has not been written to the db we assume 0.
 * @param db the dbFacade corresponding to the object store
 * @param objectStoreName the objectStore to get the metadata from
 */
export async function getIndexerMetaData(db: DbFacade, objectStoreName: ObjectStoreName): Promise<EncryptedIndexerMetaData | null> {
	const transaction = await db.createTransaction(true, [objectStoreName])
	const userEncDbKey = (await transaction.get(objectStoreName, Metadata.userEncDbKey)) as Uint8Array
	const encDbIv = (await transaction.get(objectStoreName, Metadata.encDbIv)) as Uint8Array
	const userGroupKeyVersion = (await transaction.get<number>(objectStoreName, Metadata.userGroupKeyVersion)) ?? 0 // was not written for old dbs
	const mailIndexingEnabled = (await transaction.get(objectStoreName, Metadata.mailIndexingEnabled)) as boolean
	const excludedListIds = (await transaction.get(objectStoreName, Metadata.excludedListIds)) as Id[]
	const lastEventIndexTimeMs = (await transaction.get(objectStoreName, Metadata.lastEventIndexTimeMs)) as number
	if (userEncDbKey == null || encDbIv == null) {
		return null
	} else {
		return {
			userEncDbKey,
			encDbIv,
			userGroupKeyVersion,
			mailIndexingEnabled,
			excludedListIds,
			lastEventIndexTimeMs,
		}
	}
}

async function encryptAndSaveDbKey(userGroupKey: VersionedKey, dbKey: AesKey, dbIv: Uint8Array, db: DbFacade, objectStoreName: string) {
	const transaction = await db.createTransaction(false, [objectStoreName]) // create a new transaction to avoid timeouts and for writing
	const groupEncSessionKey = encryptKeyWithVersionedKey(userGroupKey, dbKey)
	await transaction.put(objectStoreName, Metadata.userEncDbKey, groupEncSessionKey.key)
	await transaction.put(objectStoreName, Metadata.userGroupKeyVersion, groupEncSessionKey.encryptingKeyVersion)
	await transaction.put(objectStoreName, Metadata.encDbIv, aesEncrypt(dbKey, dbIv))
}

/**
 * @caution This will clear any existing data in the database, because they key and IV will be regenerated
 * @return the newly generated key and iv for the database contents
 * @VisibleForTesting
 *
 */
export async function initializeDb(db: DbFacade, id: string, keyLoaderFacade: KeyLoaderFacade, objectStoreName: ObjectStoreName): Promise<EncryptionMetadata> {
	await db.deleteDatabase(id).then(() => db.open(id))
	const key = aes256RandomKey()
	const iv = random.generateRandomData(IV_BYTE_LENGTH)
	const userGroupKey = keyLoaderFacade.getCurrentSymUserGroupKey()
	await encryptAndSaveDbKey(userGroupKey, key, iv, db, objectStoreName)
	return {
		key,
		iv,
	}
}

async function addAddressToImageList(db: DbFacade, encryptedAddress: Uint8Array, rule: ExternalImageRule): Promise<void> {
	try {
		const transaction = await db.createTransaction(false, [ExternalImageListOS])
		await transaction.put(ExternalImageListOS, null, {
			address: encryptedAddress,
			rule: rule,
		})
	} catch (e) {
		if (e instanceof DbError) {
			console.error("failed to add address to image list:", e.message)
			return
		}
		throw e
	}
}
