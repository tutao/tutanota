import {
	base64ExtToBase64,
	base64ToBase64Ext,
	base64ToBase64Url,
	base64ToUint8Array,
	base64UrlToBase64,
	clone,
	compare,
	Hex,
	hexToBase64,
	isSameTypeRef,
	pad,
	repeat,
	stringToUtf8Uint8Array,
	TypeRef,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString,
} from "@tutao/tutanota-utils"
import { Cardinality, ValueType } from "../EntityConstants.js"
import type { ElementEntity, Entity, ModelValue, SomeEntity, TypeModel } from "../EntityTypes"

/**
 * the maximum ID for elements stored on the server (number with the length of 10 bytes) => 2^80 - 1
 */
export const GENERATED_MAX_ID = "zzzzzzzzzzzz"
/**
 * we support creation of customIds for mailset entries until around this date.
 *
 * this is intended to be after any reasonable real custom id we generate for mail set entries.
 *
 * current mailSetEntry maximum date is: 2019-05-15 -ish ( see MailFolderHelper.java: makeMailSetEntryCustomId )
 */
export const DEFAULT_MAILSET_ENTRY_CUSTOM_CUTOFF_TIMESTAMP = new Date("2109-05-16T15:00Z").getTime()

/**
 * The minimum ID for elements with generated id stored on the server
 */
export const GENERATED_MIN_ID = "------------"

/**
 * The byte length of a generated id
 */
export const GENERATED_ID_BYTES_LENGTH = 9

/**
 * The byte length of a custom Id used by mail set entries
 * 4 bytes timestamp (1024ms resolution)
 * 9 bytes mail element Id
 */
export const MAIL_SET_ENTRY_ID_BYTE_LENGTH = 13

/**
 * The minimum ID for elements with custom id stored on the server
 */
export const CUSTOM_MIN_ID = ""
/**
 * the maximum custom element id is enforced to be less than 256 bytes on the server. decoding this as Base64Url gives 255 bytes.
 *
 * NOTE: this is currently only used as a marker value when caching CalenderEvent and MailSetEntry.
 */
export const CUSTOM_MAX_ID = repeat("_", 340)
export const RANGE_ITEM_LIMIT = 1000
export const LOAD_MULTIPLE_LIMIT = 100
export const POST_MULTIPLE_LIMIT = 100

/**
 * an entity that only contains the actual user data and can not be used to refer to any existing entity.
 */
export type Stripped<T extends Partial<SomeEntity>> = Omit<
	T,
	| "_id"
	| "_area"
	| "_owner"
	| "_ownerGroup"
	| "_ownerEncSessionKey"
	| "_ownerKeyVersion"
	| "_permissions"
	| "_errors"
	| "_format"
	| "_type"
	| `_finalEncrypted${string}`
	| `_defaultEncrypted${string}`
>

type OptionalEntity<T extends Entity> = T & {
	_id?: Id | IdTuple
	_ownerGroup?: Id
}

export type StrippedEntity<T extends Entity> =
	| Omit<
			T,
			| "_id"
			| "_ownerGroup"
			| "_ownerEncSessionKey"
			| "_ownerKeyVersion"
			| "_permissions"
			| "_errors"
			| "_format"
			| "_type"
			| "_area"
			| "_owner"
			| `_finalEncrypted${string}`
			| `_defaultEncrypted${string}`
	  >
	| OptionalEntity<T>

/**
 * Tests if one id is bigger than another.
 * For generated IDs we use base64ext which is sortable.
 * For custom IDs we use base64url which is not sortable, so we convert them to string before comparing.
 * Important: using this for custom IDs works only with custom IDs which are derived from strings.
 *
 * @param firstId The element id that is tested if it is bigger.
 * @param secondId The element id that is tested against.
 * @param typeModel optional - the type the Ids belong to. this can be used to compare custom IDs.
 * @return True if firstId is bigger than secondId, false otherwise.
 */
export function firstBiggerThanSecond(firstId: Id, secondId: Id, typeModel?: TypeModel): boolean {
	if (typeModel?.values._id.type === ValueType.CustomId) {
		return firstBiggerThanSecondCustomId(firstId, secondId)
	} else {
		// if the number of digits is bigger, then the id is bigger, otherwise we can use the lexicographical comparison
		if (firstId.length > secondId.length) {
			return true
		} else if (secondId.length > firstId.length) {
			return false
		} else {
			return firstId > secondId
		}
	}
}

export function firstBiggerThanSecondCustomId(firstId: Id, secondId: Id): boolean {
	return compare(customIdToUint8array(firstId), customIdToUint8array(secondId)) === 1
}

export function customIdToUint8array(id: Id): Uint8Array {
	if (id === "") {
		return new Uint8Array()
	}
	return base64ToUint8Array(base64UrlToBase64(id))
}

export function compareNewestFirst(id1: Id | IdTuple, id2: Id | IdTuple): number {
	let firstId = id1 instanceof Array ? id1[1] : id1
	let secondId = id2 instanceof Array ? id2[1] : id2

	if (firstId === secondId) {
		return 0
	} else {
		return firstBiggerThanSecond(firstId, secondId) ? -1 : 1
	}
}

export function compareOldestFirst(id1: Id | IdTuple, id2: Id | IdTuple): number {
	let firstId = id1 instanceof Array ? id1[1] : id1
	let secondId = id2 instanceof Array ? id2[1] : id2

	if (firstId === secondId) {
		return 0
	} else {
		return firstBiggerThanSecond(firstId, secondId) ? 1 : -1
	}
}

export function sortCompareByReverseId<T extends ListElement>(entity1: T, entity2: T): number {
	return compareNewestFirst(getElementId(entity1), getElementId(entity2))
}

export function sortCompareById<T extends ListElement>(entity1: T, entity2: T): number {
	return compareOldestFirst(getElementId(entity1), getElementId(entity2))
}

/**
 * Compares the ids of two elements.
 * @pre Both entities are either ElementTypes or ListElementTypes
 * @param id1
 * @param id2
 * @returns True if the ids are the same, false otherwise
 */
export function isSameId(id1: (Id | IdTuple) | null, id2: (Id | IdTuple) | null): boolean {
	if (id1 === null || id2 === null) {
		return false
	} else if (id1 instanceof Array && id2 instanceof Array) {
		return id1[0] === id2[0] && id1[1] === id2[1]
	} else {
		return id1 === id2
	}
}

export function haveSameId(entity1: SomeEntity, entity2: SomeEntity): boolean {
	return isSameId(entity1._id, entity2._id)
}

export function containsId(ids: ReadonlyArray<Id | IdTuple>, id: Id | IdTuple): boolean {
	return ids.some((idInArray) => isSameId(idInArray, id))
}

export interface Element {
	_id: Id
}

export interface ListElement {
	_id: IdTuple
}

export interface BlobElement {
	_id: IdTuple
}

export function getEtId(entity: Element): Id {
	return entity._id
}

export function getLetId(entity: ListElement): IdTuple {
	if (typeof entity._id === "undefined") {
		throw new Error("listId is not defined for " + (typeof (entity as any)._type === "undefined" ? JSON.stringify(entity) : (entity as any)))
	}

	return entity._id
}

export function getElementId(entity: ListElement): Id {
	return elementIdPart(getLetId(entity))
}

export function getListId(entity: ListElement): Id {
	return listIdPart(getLetId(entity))
}

export function listIdPart(id: IdTuple): Id {
	return id[0]
}

export function elementIdPart(id: IdTuple): Id {
	return id[1]
}

/**
 * Converts a string to a custom id. Attention: the custom id must be intended to be derived from a string.
 */
export function stringToCustomId(string: string): string {
	return uint8arrayToCustomId(stringToUtf8Uint8Array(string))
}

export function uint8arrayToCustomId(array: Uint8Array): string {
	return base64ToBase64Url(uint8ArrayToBase64(array))
}

/**
 * Converts a custom id to a string. Attention: the custom id must be intended to be derived from a string.
 */
export function customIdToString(customId: string): string {
	return utf8Uint8ArrayToString(base64ToUint8Array(base64UrlToBase64(customId)))
}

export function create<T>(typeModel: TypeModel, typeRef: TypeRef<T>): T {
	let i: Record<string, any> = {
		_type: typeRef,
	}

	for (let valueName of Object.keys(typeModel.values)) {
		let value = typeModel.values[valueName]
		i[valueName] = _getDefaultValue(valueName, value)
	}

	for (let associationName of Object.keys(typeModel.associations)) {
		let association = typeModel.associations[associationName]

		if (association.cardinality === Cardinality.Any) {
			i[associationName] = []
		} else {
			// set to null even if the cardinality is One. we could think about calling create recursively,
			// but that would require us to resolve type refs (async) and recursively merge the result with
			// the provided values
			i[associationName] = null
		}
	}

	return i as any
}

function _getDefaultValue(valueName: string, value: ModelValue): any {
	if (valueName === "_format") {
		return "0"
	} else if (valueName === "_id") {
		return null // aggregate ids are set in the worker, list ids must be set explicitely and element ids are created on the server
	} else if (valueName === "_permissions") {
		return null
	} else if (value.cardinality === Cardinality.ZeroOrOne) {
		return null
	} else {
		switch (value.type) {
			case ValueType.Bytes:
				return new Uint8Array(0)

			case ValueType.Date:
				return new Date()

			case ValueType.Number:
				return "0"

			case ValueType.String:
				return ""

			case ValueType.Boolean:
				return false

			case ValueType.CustomId:
			case ValueType.GeneratedId:
				return null
			// we have to use null although the value must be set to something different
		}
	}

	throw new Error(`no default value for ${JSON.stringify(value)}`)
}

/**
 * Converts a timestamp number to a GeneratedId (the counter is set to zero) in hex format.
 *
 * @param timestamp The timestamp of the GeneratedId
 * @return The GeneratedId as hex string.
 */
export function timestampToHexGeneratedId(timestamp: number, serverBytes: number): Hex {
	let id = timestamp * 4 // shifted 2 bits left, so the value covers 44 bits overall (42 timestamp + 2 shifted)

	let hex = id.toString(16) + "00000" + pad(serverBytes, 2) // add one zero for the missing 4 bits plus 4 more (2 bytes) plus 2 more for the server id to get 9 bytes

	// add leading zeros to reach 9 bytes (GeneratedId length) = 18 hex
	for (let length = hex.length; length < 18; length++) {
		hex = "0" + hex
	}

	return hex
}

/**
 * Converts a timestamp number to a GeneratedId (the counter and server bits are set to zero).
 *
 * @param timestamp The timestamp of the GeneratedId
 * @return The GeneratedId.
 */
export function timestampToGeneratedId(timestamp: number, serverBytes: number = 0): Id {
	let hex = timestampToHexGeneratedId(timestamp, serverBytes)
	return base64ToBase64Ext(hexToBase64(hex))
}

/**
 * Extracts the timestamp from a GeneratedId
 * @param base64Ext The id as base64Ext
 * @returns The timestamp of the GeneratedId
 */
export function generatedIdToTimestamp(base64Ext: Id): number {
	const base64 = base64ExtToBase64(base64Ext)
	const decodedbB4 = atob(base64)
	let numberResult = 0

	// Timestamp is in the first 42 bits
	for (let i = 0; i < 5; i++) {
		// We "shift" each number by 8 bits to the left: numberResult << 8
		numberResult = numberResult * 256
		numberResult += decodedbB4.charCodeAt(i)
	}

	// We need to shift the whole number to the left by 2 bits (because 42 bits is encoded in 6 bytes)
	numberResult = numberResult * 4
	// We take only last two highest bits from the last byte
	numberResult += decodedbB4.charCodeAt(5) >>> 6
	return numberResult
}

const base64extEncodedIdLength = GENERATED_MAX_ID.length
const base64extAlphabet = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz"

export function isValidGeneratedId(id: Id | IdTuple): boolean {
	const test = (id: string) => id.length === base64extEncodedIdLength && Array.from(id).every((char) => base64extAlphabet.includes(char))

	return typeof id === "string" ? test(id) : id.every(test)
}

export function isElementEntity(e: SomeEntity): e is ElementEntity {
	return typeof e._id === "string"
}

export function assertIsEntity<T extends SomeEntity>(entity: SomeEntity, type: TypeRef<T>): entity is T {
	if (isSameTypeRef(entity._type, type)) {
		return true
	} else {
		return false
	}
}

export function assertIsEntity2<T extends SomeEntity>(type: TypeRef<T>): (entity: SomeEntity) => entity is T {
	return (e): e is T => assertIsEntity(e, type)
}

/**
 * Remove some hidden technical fields from the entity.
 *
 * Only use for new entities, the {@param entity} won't be usable for updates anymore after this.
 */
export function removeTechnicalFields<E extends Partial<SomeEntity>>(entity: E) {
	// we want to restrict outer function to entity types but internally we also want to handle aggregates
	function _removeTechnicalFields(erased: Record<string, any>) {
		for (const key of Object.keys(erased)) {
			if (key.startsWith("_finalEncrypted") || key.startsWith("_defaultEncrypted") || key.startsWith("_errors")) {
				delete erased[key]
			} else {
				const value = erased[key]
				if (value instanceof Object) {
					_removeTechnicalFields(value)
				}
			}
		}
	}

	_removeTechnicalFields(entity)
}

/**
 * get a clone of a (partial) entity that does not contain any fields that would indicate that it was ever persisted anywhere.
 * @param entity the entity to strip
 */
export function getStrippedClone<E extends SomeEntity>(entity: StrippedEntity<E>): StrippedEntity<E> {
	const cloned = clone(entity)
	removeTechnicalFields(cloned)
	removeIdentityFields(cloned)
	return cloned
}

/**
 * remove fields that do not contain user defined data but are related to finding/accessing the entity on the server
 */
function removeIdentityFields<E extends Partial<SomeEntity>>(entity: E) {
	const keysToDelete = ["_id", "_ownerGroup", "_ownerEncSessionKey", "_ownerKeyVersion", "_permissions"]

	function _removeIdentityFields(erased: Record<string, any>) {
		for (const key of Object.keys(erased)) {
			if (keysToDelete.includes(key)) {
				delete erased[key]
			} else {
				const value = erased[key]
				if (value instanceof Object) {
					_removeIdentityFields(value)
				}
			}
		}
	}

	_removeIdentityFields(entity)
}

/** construct a mail set entry Id for a given mail. see MailFolderHelper.java */
export function constructMailSetEntryId(receiveDate: Date, mailId: Id): Id {
	const buffer = new DataView(new ArrayBuffer(MAIL_SET_ENTRY_ID_BYTE_LENGTH))
	const mailIdBytes = base64ToUint8Array(base64ExtToBase64(mailId))

	// shifting the received timestamp by 10 bit reduces the resolution from 1ms to 1024ms.
	// truncating to 4 bytes leaves us with enough space for epoch + 4_294_967_295 not-quite-seconds
	// (until around 2109-05-15 15:00)
	const timestamp: bigint = BigInt(Math.trunc(receiveDate.getTime()))

	const truncatedReceiveDate = (timestamp >> 10n) & 0x00000000ffffffffn

	// we don't need the leading zeroes
	buffer.setBigUint64(0, truncatedReceiveDate << 32n)

	for (let i = 0; i < mailIdBytes.length; i++) {
		buffer.setUint8(i + 4, mailIdBytes[i])
	}

	return uint8arrayToCustomId(new Uint8Array(buffer.buffer))
}

export function deconstructMailSetEntryId(id: Id): { receiveDate: Date; mailId: Id } {
	const buffer = customIdToUint8array(id)
	const timestampBytes = buffer.slice(0, 4)
	const generatedIdBytes = buffer.slice(4)

	const timestamp1024 = (timestampBytes[0] << 24) | (timestampBytes[1] << 16) | (timestampBytes[2] << 8) | timestampBytes[3]
	const timestamp = timestamp1024 * 1024

	const mailId = base64ToBase64Ext(uint8ArrayToBase64(generatedIdBytes))

	return { receiveDate: new Date(timestamp), mailId }
}

export const LEGACY_TO_RECIPIENTS_ID = 112
export const LEGACY_CC_RECIPIENTS_ID = 113
export const LEGACY_BCC_RECIPIENTS_ID = 114
export const LEGACY_BODY_ID = 116
