import { aes256EncryptSearchIndexEntry, Aes256Key, unauthenticatedAesDecrypt } from "@tutao/tutanota-crypto"
import { Base64, concat, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import type {
	DecryptedSearchIndexEntry,
	EncryptedSearchIndexEntry,
	SearchIndexEntry,
	SearchIndexMetaDataDbRow,
	SearchIndexMetadataEntry,
	SearchIndexMetaDataRow,
} from "./SearchTypes"
import { calculateNeededSpaceForNumber, calculateNeededSpaceForNumbers, decodeNumberBlock, decodeNumbers, encodeNumbers } from "./SearchIndexEncoding"
import { getIdFromEncSearchIndexEntry } from "../../common/utils/IndexUtils"

export function encryptIndexKeyBase64(key: Aes256Key, indexKey: string, dbIv: Uint8Array): Base64 {
	return uint8ArrayToBase64(encryptIndexKeyUint8Array(key, indexKey, dbIv))
}

export function encryptIndexKeyUint8Array(key: Aes256Key, indexKey: string, dbIv: Uint8Array): Uint8Array {
	return aes256EncryptSearchIndexEntry(key, stringToUtf8Uint8Array(indexKey), dbIv, true).slice(dbIv.length)
}

export function decryptIndexKey(key: Aes256Key, encIndexKey: Uint8Array, dbIv: Uint8Array): string {
	return utf8Uint8ArrayToString(unauthenticatedAesDecrypt(key, concat(dbIv, encIndexKey), true))
}

export function encryptSearchIndexEntry(key: Aes256Key, entry: SearchIndexEntry, encryptedInstanceId: Uint8Array): EncryptedSearchIndexEntry {
	let searchIndexEntryNumberValues = [entry.attribute].concat(entry.positions)
	const neededSpace = calculateNeededSpaceForNumbers(searchIndexEntryNumberValues)
	const block = new Uint8Array(neededSpace)
	encodeNumbers(searchIndexEntryNumberValues, block, 0)
	const encData = aes256EncryptSearchIndexEntry(key, block)
	const resultArray = new Uint8Array(encryptedInstanceId.length + encData.length)
	resultArray.set(encryptedInstanceId)
	resultArray.set(encData, 16)
	return resultArray
}

export function decryptSearchIndexEntry(key: Aes256Key, entry: EncryptedSearchIndexEntry, dbIv: Uint8Array): DecryptedSearchIndexEntry {
	const encId = getIdFromEncSearchIndexEntry(entry)
	let id = decryptIndexKey(key, encId, dbIv)
	const data = unauthenticatedAesDecrypt(key, entry.subarray(16), true)
	let offset = 0
	const attribute = decodeNumberBlock(data, offset)
	offset += calculateNeededSpaceForNumber(attribute)
	const positions = decodeNumbers(data, offset)
	return {
		id: id,
		encId,
		attribute,
		positions,
	}
}

const metaEntryFieldsNumber = 5

export function encryptMetaData(key: Aes256Key, metaData: SearchIndexMetaDataRow): SearchIndexMetaDataDbRow {
	const numbers = new Array(metaData.rows.length * metaEntryFieldsNumber)

	for (let i = 0; i < metaData.rows.length; i++) {
		const entry = metaData.rows[i]
		const offset = i * metaEntryFieldsNumber
		numbers[offset] = entry.app
		numbers[offset + 1] = entry.type
		numbers[offset + 2] = entry.key
		numbers[offset + 3] = entry.size
		numbers[offset + 4] = entry.oldestElementTimestamp
	}

	const numberBlock = new Uint8Array(calculateNeededSpaceForNumbers(numbers))
	encodeNumbers(numbers, numberBlock)
	const encryptedRows = aes256EncryptSearchIndexEntry(key, numberBlock)
	return {
		id: metaData.id,
		word: metaData.word,
		rows: encryptedRows,
	}
}

export function decryptMetaData(key: Aes256Key, encryptedMeta: SearchIndexMetaDataDbRow): SearchIndexMetaDataRow {
	// Initially we write empty data block there. In this case we can't get IV from it and decrypt it
	if (encryptedMeta.rows.length === 0) {
		return {
			id: encryptedMeta.id,
			word: encryptedMeta.word,
			rows: [],
		}
	}

	const numbersBlock = unauthenticatedAesDecrypt(key, encryptedMeta.rows, true)
	const numbers = decodeNumbers(numbersBlock)
	const rows: SearchIndexMetadataEntry[] = []

	for (let i = 0; i < numbers.length; i += metaEntryFieldsNumber) {
		rows.push({
			app: numbers[i],
			type: numbers[i + 1],
			key: numbers[i + 2],
			size: numbers[i + 3],
			oldestElementTimestamp: numbers[i + 4],
		})
	}

	return {
		id: encryptedMeta.id,
		word: encryptedMeta.word,
		rows,
	}
}
