// @flow

import type {ObjectStoreName} from "../search/DbFacade"
import {b64UserIdHash, DbFacade} from "../search/DbFacade"
import {LoginFacade} from "./LoginFacade"
import {aes256Decrypt, aes256Encrypt, aes256RandomKey, IV_BYTE_LENGTH} from "../crypto/Aes"
import {stringToUtf8Uint8Array} from "../../common/utils/Encoding"
import {Metadata} from "../search/Indexer"
import {decrypt256Key, encrypt256Key} from "../crypto/CryptoFacade"
import {random} from "../crypto/Randomizer"
import {LazyLoaded} from "../../common/utils/LazyLoaded"
import type {User} from "../../entities/sys/User"
import {assertNotNull} from "../../common/utils/Utils"

const VERSION: number = 1
const DB_KEY_PREFIX: string = "ConfigStorage"
const ExternalAllowListOS: ObjectStoreName = "ExternalAllowListOS"
const MetaDataOS: ObjectStoreName = "MetaDataOS"

type EncryptionMetadata = {
	+key: Aes128Key,
	+iv: Uint8Array
}

type ConfigDb = {
	+db: DbFacade,
	+metaData: EncryptionMetadata
}

/**
 * A local configuration database that can be used as an alternative to DeviceConfig:
 * Ideal for cases where the configuration values should be stored encrypted,
 * Or when the configuration is a growing list or object, which would be unsuitable for localStorage
 * Or when the configuration is only required in the Worker
 */
export class ConfigurationDatabase {

	+db: LazyLoaded<ConfigDb>

	constructor(loginFacade: LoginFacade) {
		this.db = new LazyLoaded(() => {
			const user = assertNotNull(loginFacade.getLoggedInUser())
			const userGroupKey = loginFacade.getUserGroupKey()
			return loadConfigDb(user, userGroupKey)
		})
	}

	async addAllowedExternalSender(address: string): Promise<void> {
		const {db} = await this.db.getAsync()
		const encryptedAddress = await this._encryptItem(address)
		const transaction = await db.createTransaction(false, [ExternalAllowListOS])
		return transaction.put(ExternalAllowListOS, null, {address: encryptedAddress})
	}

	async removeAllowedExternalSender(address: string): Promise<void> {
		const {db} = await this.db.getAsync()
		const encryptedAddress = await this._encryptItem(address)
		const transaction = await db.createTransaction(false, [ExternalAllowListOS])
		return transaction.delete(ExternalAllowListOS, encryptedAddress)
	}

	async isAllowedExternalSender(address: string): Promise<boolean> {
		const {db} = await this.db.getAsync()
		const encryptedAddress = await this._encryptItem(address)
		const transaction = await db.createTransaction(true, [ExternalAllowListOS])
		return await transaction.get(ExternalAllowListOS, encryptedAddress) != null
	}

	async _encryptItem(item: string): Promise<Uint8Array> {
		const db = await this.db.getAsync()
		const {key, iv} = db.metaData
		return aes256Encrypt(key, stringToUtf8Uint8Array(item), iv, true, false).slice(iv.length)
	}
}

async function loadConfigDb(user: User, userGroupKey: Aes128Key): Promise<ConfigDb> {
	const id = `${DB_KEY_PREFIX}_${b64UserIdHash(user)}`
	const db = new DbFacade(VERSION, (event, db) => {
		db.createObjectStore(MetaDataOS)
		db.createObjectStore(ExternalAllowListOS, {keyPath: "address"})
	})
	const metaData = await loadEncryptionMetadata(db, id, userGroupKey) || await initializeDb(db, id, userGroupKey)
	return {
		db,
		metaData
	}
}

/**
 * Load the encryption key and iv from the db
 * @return { key, iv } or null if one or both don't exist
 */
async function loadEncryptionMetadata(db: DbFacade, id: string, userGroupKey: Aes128Key): Promise<?EncryptionMetadata> {
	await db.open(id)
	const transaction = await db.createTransaction(true, [MetaDataOS])

	const encDbKey = await transaction.get(MetaDataOS, Metadata.userEncDbKey)
	const encDbIv = await transaction.get(MetaDataOS, Metadata.encDbIv)

	if (encDbKey == null || encDbIv == null) {
		return null
	}

	const key = decrypt256Key(userGroupKey, encDbKey)
	const iv = aes256Decrypt(key, encDbIv, true, false)
	return {key, iv}
}

/**
 * @caution This will clear any existing data in the database, because they key and IV will be regenerated
 * @return the newly generated key and iv for the database contents
 */
async function initializeDb(db: DbFacade, id: string, userGroupKey: Aes128Key): Promise<EncryptionMetadata> {
	await db.deleteDatabase().then(() => db.open(id))
	const key = aes256RandomKey()
	const iv = random.generateRandomData(IV_BYTE_LENGTH)

	const transaction = await db.createTransaction(false, [MetaDataOS, ExternalAllowListOS])
	await transaction.put(MetaDataOS, Metadata.userEncDbKey, encrypt256Key(userGroupKey, key))
	await transaction.put(MetaDataOS, Metadata.encDbIv, aes256Encrypt(key, iv, random.generateRandomData(IV_BYTE_LENGTH), true, false))

	return {key, iv}
}
