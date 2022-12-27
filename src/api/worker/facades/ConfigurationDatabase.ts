import type { ObjectStoreName } from "../search/DbFacade"
import { b64UserIdHash, DbFacade } from "../search/DbFacade"
import { LoginFacade } from "./LoginFacade"
import { stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { Metadata } from "../search/Indexer"
import { LazyLoaded } from "@tutao/tutanota-utils"
import type { User } from "../../entities/sys/TypeRefs.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { ExternalImageRule } from "../../common/TutanotaConstants"
import { aes256Decrypt, aes256Encrypt, aes256RandomKey, decrypt256Key, encrypt256Key, IV_BYTE_LENGTH, random } from "@tutao/tutanota-crypto"
import { UserFacade } from "./UserFacade"

const VERSION: number = 1
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
export async function encryptItem(item: string, key: Aes128Key, iv: Uint8Array): Promise<Uint8Array> {
	return aes256Encrypt(key, stringToUtf8Uint8Array(item), iv, true, false).slice(iv.length)
}

/**
 * A local configuration database that can be used as an alternative to DeviceConfig:
 * Ideal for cases where the configuration values should be stored encrypted,
 * Or when the configuration is a growing list or object, which would be unsuitable for localStorage
 * Or when the configuration is only required in the Worker
 */
export class ConfigurationDatabase {
	readonly db: LazyLoaded<ConfigDb>

	constructor(userFacade: UserFacade, dbLoadFn: (arg0: User, arg1: Aes128Key) => Promise<ConfigDb> = loadConfigDb) {
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
		return this._addAddressToImageList(encryptedAddress, rule)
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
				await this._addAddressToImageList(encryptedAddress, ExternalImageRule.Allow)
				rule = ExternalImageRule.Allow
			}
		}

		return rule
	}

	async _addAddressToImageList(encryptedAddress: Uint8Array, rule: ExternalImageRule): Promise<void> {
		const { db } = await this.db.getAsync()
		const transaction = await db.createTransaction(false, [ExternalImageListOS])
		return transaction.put(ExternalImageListOS, null, {
			address: encryptedAddress,
			rule: rule,
		})
	}
}

async function loadConfigDb(user: User, userGroupKey: Aes128Key): Promise<ConfigDb> {
	const id = `${DB_KEY_PREFIX}_${b64UserIdHash(user)}`
	const db = new DbFacade(VERSION, (event, db) => {
		db.createObjectStore(MetaDataOS)
		db.createObjectStore(ExternalImageListOS, {
			keyPath: "address",
		})
	})
	const metaData = (await loadEncryptionMetadata(db, id, userGroupKey)) || (await initializeDb(db, id, userGroupKey))
	return {
		db,
		metaData,
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

	const key = decrypt256Key(userGroupKey, encDbKey)
	const iv = aes256Decrypt(key, encDbIv, true, false)
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
	await db.deleteDatabase().then(() => db.open(id))
	const key = aes256RandomKey()
	const iv = random.generateRandomData(IV_BYTE_LENGTH)
	const transaction = await db.createTransaction(false, [MetaDataOS, ExternalImageListOS])
	await transaction.put(MetaDataOS, Metadata.userEncDbKey, encrypt256Key(userGroupKey, key))
	await transaction.put(MetaDataOS, Metadata.encDbIv, aes256Encrypt(key, iv, random.generateRandomData(IV_BYTE_LENGTH), true, false))
	return {
		key,
		iv,
	}
}
