import { b64UserIdHash, DbFacade } from "../../search/DbFacade.js"
import { assertNotNull, concat, downcast, LazyLoaded, Nullable, stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { User, UserTypeRef } from "../../../entities/sys/TypeRefs.js"
import { ExternalImageRule, NewsletterBannerRule, OperationType } from "../../../common/TutanotaConstants.js"
import {
	Aes128Key,
	Aes256Key,
	aes256RandomKey,
	aesDecrypt,
	aesEncrypt,
	AesKey,
	decryptKey,
	IV_BYTE_LENGTH,
	random,
	unauthenticatedAesDecrypt,
} from "@tutao/tutanota-crypto"
import { UserFacade } from "../UserFacade.js"
import {
	EncryptedDbKeyBaseMetaData,
	EncryptedIndexerMetaData,
	LocalDraftDataOS,
	Metadata,
	ObjectStoreName,
	SpamClassificationModelOS,
} from "../../search/IndexTables.js"
import { DbError } from "../../../common/error/DbError.js"
import { checkKeyVersionConstraints, KeyLoaderFacade } from "../KeyLoaderFacade.js"
import { _encryptKeyWithVersionedKey, VersionedKey } from "../../crypto/CryptoWrapper.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/utils/EntityUpdateUtils"
import { AutosaveFacade, decodeLocalAutosavedDraftData, encodeLocalAutosavedDraftData, LOCAL_DRAFT_KEY, LocalAutosavedDraftData } from "./AutosaveFacade"
import { decodeSpamClassificationModel, encodeSpamClassificationModel, SpamClassifierStorageFacade } from "./SpamClassifierStorageFacade"
import { SpamClassificationModel } from "../../../../../mail-app/workerUtils/spamClassification/SpamClassifier.js"

const VERSION: number = 5
const DB_KEY_PREFIX: string = "ConfigStorage"
const ExternalImageListOS: ObjectStoreName = "ExternalAllowListOS"
const NewsletterBannerListOS: ObjectStoreName = "NewsletterBannerListOS"

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
 *
 * Also handles maintaining and encrypting autosaved draft data as well as the SpamClassificationModel
 */
export class ConfigurationDatabase implements AutosaveFacade, SpamClassifierStorageFacade {
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

	/**
	 * Save the draft data to the database, overwriting one if there is one there.
	 * @param draftData data to write
	 */
	async setAutosavedDraftData(draftData: LocalAutosavedDraftData): Promise<void> {
		const { db, metaData } = await this.db.getAsync()
		if (!db.indexingSupported) return

		try {
			const transaction = await db.createTransaction(false, [LocalDraftDataOS])
			const encoded = encodeLocalAutosavedDraftData(draftData)
			const encryptedData = aesEncrypt(metaData.key, encoded, metaData.iv)
			await transaction.put(LocalDraftDataOS, LOCAL_DRAFT_KEY, encryptedData)
		} catch (e) {
			if (e instanceof DbError) {
				console.error("failed to save draft:", e.message)
				return
			}
			throw e
		}
	}

	/**
	 * @return the locally stored draft data, if any, or null
	 */
	async getAutosavedDraftData(): Promise<LocalAutosavedDraftData | null> {
		const { db, metaData } = await this.db.getAsync()
		if (!db.indexingSupported) {
			return null
		}

		try {
			const transaction = await db.createTransaction(false, [LocalDraftDataOS])
			const data = await transaction.get<Uint8Array>(LocalDraftDataOS, LOCAL_DRAFT_KEY)
			if (data == null) {
				return null
			}

			const decryptedData = aesDecrypt(metaData.key, data)
			return decodeLocalAutosavedDraftData(decryptedData)
		} catch (e) {
			if (e instanceof DbError) {
				console.error("failed to load draft:", e.message)
				return null
			}
			throw e
		}
	}

	/**
	 * Deletes any locally saved draft data, if any
	 */
	async clearAutosavedDraftData(): Promise<void> {
		const { db } = await this.db.getAsync()
		if (!db.indexingSupported) return

		try {
			const transaction = await db.createTransaction(false, [LocalDraftDataOS])
			await transaction.delete(LocalDraftDataOS, LOCAL_DRAFT_KEY)
		} catch (e) {
			if (e instanceof DbError) {
				console.error("failed to clear draft:", e.message)
				return
			}
			throw e
		}
	}

	/**
	 * Save the SpamClassificationModel for an ownerGroup to the database, overwriting one if there is one there.
	 * @param model to write
	 */
	async setSpamClassificationModel(model: SpamClassificationModel): Promise<void> {
		const { db, metaData } = await this.db.getAsync()
		if (!db.indexingSupported) return

		try {
			const transaction = await db.createTransaction(false, [SpamClassificationModelOS])
			const encoded = encodeSpamClassificationModel(model)
			const encryptedModel = aesEncrypt(metaData.key, encoded, metaData.iv)
			await transaction.put(SpamClassificationModelOS, model.ownerGroup, encryptedModel)
		} catch (e) {
			if (e instanceof DbError) {
				console.error(`failed to save spamClassificationModel for mailbox ${model.ownerGroup}:`, e.message)
				return
			}
			throw e
		}
	}

	/**
	 * @return the locally stored SpamClassificationModel for an ownerGroup, if any, or null
	 */
	async getSpamClassificationModel(ownerGroup: Id): Promise<Nullable<SpamClassificationModel>> {
		const { db, metaData } = await this.db.getAsync()
		if (!db.indexingSupported) {
			return null
		}

		try {
			const transaction = await db.createTransaction(false, [SpamClassificationModelOS])
			const encryptedModel = await transaction.get<Uint8Array>(SpamClassificationModelOS, ownerGroup)
			if (encryptedModel == null) {
				return null
			}

			const decryptedModel = aesDecrypt(metaData.key, encryptedModel)
			return decodeSpamClassificationModel(decryptedModel)
		} catch (e) {
			if (e instanceof DbError) {
				console.error(`failed to load SpamClassificationModel for mailbox ${ownerGroup}:`, e.message)
				return null
			}
			throw e
		}
	}

	/**
	 * Deletes a SpamClassificationModel for an ownerGroup, if any
	 */
	async deleteSpamClassificationModel(ownerGroup: Id): Promise<void> {
		const { db } = await this.db.getAsync()
		if (!db.indexingSupported) return

		try {
			const transaction = await db.createTransaction(false, [SpamClassificationModelOS])
			await transaction.delete(SpamClassificationModelOS, ownerGroup)
		} catch (e) {
			if (e instanceof DbError) {
				console.error(`failed to delete SpamClassificationModel for mailbox ${ownerGroup}:`, e.message)
				return
			}
			throw e
		}
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

	async addNewsletterBannerRule(address: string, rule: NewsletterBannerRule): Promise<void> {
		const { db, metaData } = await this.db.getAsync()
		if (!db.indexingSupported) return
		const encryptedAddress = await encryptItem(address, metaData.key, metaData.iv)
		return addAddressToNewsletterBannerList(db, encryptedAddress, rule)
	}

	async getNewsletterBannerRule(address: string): Promise<NewsletterBannerRule> {
		const { db, metaData } = await this.db.getAsync()
		if (!db.indexingSupported) return NewsletterBannerRule.Allow
		const encryptedAddress = await encryptItem(address, metaData.key, metaData.iv)
		const transaction = await db.createTransaction(true, [NewsletterBannerListOS])
		const entry = await transaction.get(NewsletterBannerListOS, encryptedAddress)
		let rule = NewsletterBannerRule.Allow

		if (entry != null) {
			if (entry.rule != null) {
				rule = entry.rule
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

			if (event.oldVersion < 3) {
				db.createObjectStore(LocalDraftDataOS)
			}

			if (event.oldVersion < 4) {
				db.createObjectStore(SpamClassificationModelOS)
			}

			if (event.oldVersion < 5) {
				db.createObjectStore(NewsletterBannerListOS, {
					keyPath: "address",
				})
			}

			// put all createObjectStore calls above this line because the version change transaction is not async

			const metaData = await loadEncryptionMetadata(dbFacade, id, keyLoaderFacade, ConfigurationMetaDataOS)

			if (event.oldVersion === 1 && metaData) {
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

	async onEntityEventsReceived(events: readonly EntityUpdateData[], _batchId: Id, _groupId: Id): Promise<any> {
		for (const event of events) {
			if (!(event.operation === OperationType.UPDATE && isUpdateForTypeRef(UserTypeRef, event))) {
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
	const userGroupKeyVersion = checkKeyVersionConstraints((await transaction.get<number>(objectStoreName, Metadata.userGroupKeyVersion)) ?? 0) // was not written for old dbs
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
	const userGroupKeyVersion = checkKeyVersionConstraints((await transaction.get<number>(objectStoreName, Metadata.userGroupKeyVersion)) ?? 0) // was not written for old dbs
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
	const groupEncSessionKey = _encryptKeyWithVersionedKey(userGroupKey, dbKey)
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

async function addAddressToNewsletterBannerList(db: DbFacade, encryptedAddress: Uint8Array, rule: NewsletterBannerRule): Promise<void> {
	try {
		const transaction = await db.createTransaction(false, [NewsletterBannerListOS])
		await transaction.put(NewsletterBannerListOS, null, {
			address: encryptedAddress,
			rule: rule,
		})
	} catch (e) {
		if (e instanceof DbError) {
			console.error("failed to add address to newsletter banner list:", e.message)
			return
		}
		throw e
	}
}
