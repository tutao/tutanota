//@flow
import {utf8Uint8ArrayToString, stringToUtf8Uint8Array} from "../../common/utils/Encoding"
import {aes256Decrypt, aes256Encrypt, IV_BYTE_LENGTH} from "../crypto/Aes"
import {concat} from "../../common/utils/ArrayUtils"
import {random} from "../crypto/Randomizer"
import type {SearchIndexEntry, EncryptedSearchIndexEntry} from "./SearchTypes"
import {fixedIv} from "../crypto/CryptoFacade"

export function encryptIndexKey(key: Aes256Key, indexKey: string): Uint8Array {
	return aes256Encrypt(key, stringToUtf8Uint8Array(indexKey), fixedIv, true, false).slice(fixedIv.length)
}

export function encryptSearchIndexEntry(key: Aes256Key, entry: SearchIndexEntry, encryptedInstanceId: Uint8Array): EncryptedSearchIndexEntry {
	let data = JSON.stringify([entry.app, entry.type, entry.attribute, entry.positions])
	return [
		encryptedInstanceId,
		aes256Encrypt(key, stringToUtf8Uint8Array(data), random.generateRandomData(IV_BYTE_LENGTH), true, false)
	]
}

export function decryptSearchIndexEntry(key: Aes256Key, entry: EncryptedSearchIndexEntry): SearchIndexEntry {
	let id = utf8Uint8ArrayToString(aes256Decrypt(key, concat(fixedIv, entry[0]), true))
	let data = JSON.parse(utf8Uint8ArrayToString(aes256Decrypt(key, entry[1], true)))
	return {
		id: id,
		encId: entry[0],
		app: data[0],
		type: data[1],
		attribute: data[2],
		positions: data[3],
	}
}