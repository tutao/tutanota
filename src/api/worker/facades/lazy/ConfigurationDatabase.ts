import { b64UserIdHash, DbFacade } from "../../search/DbFacade.js"
import { assertNotNull, concat, downcast, LazyLoaded, stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import type { User } from "../../../entities/sys/TypeRefs.js"
import { ExternalImageRule } from "../../../common/TutanotaConstants.js"
import { aes256RandomKey, aesDecrypt, aesEncrypt, decryptKey, encryptKey, IV_BYTE_LENGTH, random } from "@tutao/tutanota-crypto"
import { UserFacade } from "../UserFacade.js"
import { Metadata, ObjectStoreName } from "../../search/IndexTables.js"
import { DbError } from "../../../common/error/DbError.js"

const VERSION: number = 2
const DB_KEY_PREFIX: string = "ConfigStorage"
const ExternalImageListOS: ObjectStoreName = "ExternalAllowListOS"
const MetaDataOS: ObjectStoreName = "MetaDataOS"
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
	return utf8Uint8ArrayToString(aesDecrypt(key, concat(iv, encryptedAddress)))
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
		userFacade: UserFacade,
		dbLoadFn: (arg0: User, arg1: Aes128Key) => Promise<ConfigDb> = (user: User, userGroupKey: Aes128Key) => this.loadConfigDb(user, userGroupKey),
	) {
		this.db = new LazyLoaded(() => {
			const user = assertNotNull(userFacade.getLoggedInUser())
			const userGroupKey = userFacade.getUserGroupKey()
			return dbLoadFn(user, userGroupKey)
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

	async loadConfigDb(user: User, userGroupKey: Aes128Key): Promise<ConfigDb> {
		const id = this.getDbId(user._id)
		const db = new DbFacade(VERSION, async (event, db, dbFacade) => {
			if (event.oldVersion === 0) {
				db.createObjectStore(MetaDataOS)
				db.createObjectStore(ExternalImageListOS, {
					keyPath: "address",
				})
			}
			const metaData = (await loadEncryptionMetadata(dbFacade, id, userGroupKey)) || (await initializeDb(dbFacade, id, userGroupKey))

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
		const metaData = (await loadEncryptionMetadata(db, id, userGroupKey)) || (await initializeDb(db, id, userGroupKey))
		return {
			db,
			metaData,
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

/**
 * Load the encryption key and iv from the db
 * @return { key, iv } or null if one or both don't exist
 */
async function loadEncryptionMetadata(db: DbFacade, id: string, userGroupKey: Aes128Key): Promise<EncryptionMetadata | null> {
	await db.open(id)
	const transaction = await db.createTransaction(true, [MetaDataOS])
	const encDbKey = await transaction.get(MetaDataOS, Metadata.userEncDbKey)
	const encDbIv = await transaction.get(MetaDataOS, Metadata.encDbIv)

	if (encDbKey == null || encDbIv == null) {
		return null
	}

	const key = decryptKey(userGroupKey, encDbKey)
	const iv = aesDecrypt(key, encDbIv)
	return {
		key,
		iv,
	}
}

/**
 * @caution This will clear any existing data in the database, because they key and IV will be regenerated
 * @return the newly generated key and iv for the database contents
 */
async function initializeDb(db: DbFacade, id: string, userGroupKey: Aes128Key): Promise<EncryptionMetadata> {
	await db.deleteDatabase(id).then(() => db.open(id))
	const key = aes256RandomKey()
	const iv = random.generateRandomData(IV_BYTE_LENGTH)
	const transaction = await db.createTransaction(false, [MetaDataOS, ExternalImageListOS])
	await transaction.put(MetaDataOS, Metadata.userEncDbKey, encryptKey(userGroupKey, key))
	await transaction.put(MetaDataOS, Metadata.encDbIv, aesEncrypt(key, iv))
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
