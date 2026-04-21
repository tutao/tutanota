import {
	assertNotNull,
	base64ExtToBase64,
	base64ToBase64Ext,
	base64ToBase64Url,
	base64ToUint8Array,
	base64UrlToBase64,
	clone,
	compare,
	downcast,
	Hex,
	hexToBase64,
	isSameTypeRef,
	pad,
	repeat,
	TypeRef,
	uint8ArrayToBase64,
	uint8arrayToCustomId,
} from "@tutao/utils"
import { ElementEntity, Entity, ModelValue, ParsedInstance, SomeEntity, TypeModel } from "./EntityTypes.js"
import { Cardinality, ValueType } from "./EntityConstants.js"
import { ProgrammingError } from "@tutao/app-env"

/**
 * the maximum ID for elements stored on the server (number with the length of 10 bytes) => 2^80 - 1
 */
export const GENERATED_MAX_ID = "zzzzzzzzzzzz"

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
export const DELETE_MULTIPLE_LIMIT = 100

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
	| "_kdfNonce"
	| "_ownerKeyVersion"
	| "ownerGroup"
	| "ownerEncSessionKey"
	| "ownerKeyVersion"
	| "_permissions"
	| "_errors"
	| "_format"
	| "_type"
	| "_original"
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
			| "_kdfNonce"
			| "ownerGroup"
			| "ownerEncSessionKey"
			| "ownerKeyVersion"
			| "_permissions"
			| "_errors"
			| "_format"
			| "_type"
			| "_area"
			| "_owner"
			| "_original"
	  >
	| OptionalEntity<T>

export const enum EntityIdEncoding {
	Base64Ext = "Base64Ext",
	Base64URL = "Base64URL",
}

/**
 * Tests if one id is bigger than another.
 * base64ext is sortable, and it's how generated IDs are stored on the server.
 * base64url is not sortable, and it's how custom IDs are stored on the server.
 * Important: using this for base64url encoded custom IDs works only with custom IDs which are derived from strings.
 *
 * @param firstId The element id that is tested if it is bigger.
 * @param secondId The element id that is tested against.
 * @param encoding The encoding of the elements ids to be tested
 * @return True if firstId is bigger than secondId, false otherwise.
 */
export function firstBiggerThanSecond(firstId: Id, secondId: Id, encoding: EntityIdEncoding): boolean {
	if (encoding === EntityIdEncoding.Base64URL) {
		return firstBiggerThanSecondCustomId(firstId, secondId)
	} else if (encoding === EntityIdEncoding.Base64Ext) {
		return firstBiggerThanSecondBase64Ext(firstId, secondId)
	} else {
		throw new ProgrammingError(`unknown id type: ${encoding}`)
	}
}

export function firstBiggerThanSecondCustomId(firstId: Id, secondId: Id): boolean {
	return compare(customIdToUint8array(firstId), customIdToUint8array(secondId)) === 1
}

export function firstBiggerThanSecondBase64Ext(firstId: Id, secondId: Id): boolean {
	// if the number of digits is bigger, then the id is bigger, otherwise we can use the lexicographical comparison
	if (firstId.length > secondId.length) {
		return true
	} else if (secondId.length > firstId.length) {
		return false
	} else {
		return firstId > secondId
	}
}

export function get_IdValue(typeModel?: TypeModel): ModelValue | undefined {
	if (typeModel) {
		return Object.values(typeModel.values).find((valueType) => valueType.name === "_id")
	}
}

export function customIdToUint8array(id: Id): Uint8Array {
	if (id === "") {
		return new Uint8Array()
	}
	return base64ToUint8Array(base64UrlToBase64(id))
}

export function compareNewestFirst(id1: Id | IdTuple, id2: Id | IdTuple, encoding: EntityIdEncoding): number {
	let firstId = id1 instanceof Array ? id1[1] : id1
	let secondId = id2 instanceof Array ? id2[1] : id2

	if (firstId === secondId) {
		return 0
	} else {
		return firstBiggerThanSecond(firstId, secondId, encoding) ? -1 : 1
	}
}

export function compareOldestFirst(id1: Id | IdTuple, id2: Id | IdTuple, encoding: EntityIdEncoding): number {
	let firstId = id1 instanceof Array ? id1[1] : id1
	let secondId = id2 instanceof Array ? id2[1] : id2

	if (firstId === secondId) {
		return 0
	} else {
		return firstBiggerThanSecond(firstId, secondId, encoding) ? 1 : -1
	}
}

export function sortCompareByReverseId<T extends ListElement>(entity1: T, entity2: T, encoding: EntityIdEncoding): number {
	return compareNewestFirst(getElementId(entity1), getElementId(entity2), encoding)
}

export function sortCompareById<T extends ListElement>(entity1: T, entity2: T, encoding: EntityIdEncoding): number {
	return compareOldestFirst(getElementId(entity1), getElementId(entity2), encoding)
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

export function getElementId<T extends ListElement>(entity: T): Id {
	return elementIdPart(getLetId(entity))
}

export function getListId<T extends ListElement>(entity: T): Id {
	return listIdPart(getLetId(entity))
}

export function listIdPart(id: IdTuple): Id {
	return id[0]
}

export function elementIdPart(id: IdTuple): Id {
	return id[1]
}

/**
 * Takes an iterator of list element entities and returns their ids in an array.
 * @param entities
 */
export function getIds<T extends SomeEntity>(entities: Iterable<T>): Array<T["_id"]> {
	const ids: Array<T["_id"]> = []
	for (const entity of entities) {
		ids.push(entity._id)
	}
	return ids
}

export function create<T>(typeModel: TypeModel, typeRef: TypeRef<T>, createDefaultValue: (name: string, value: ModelValue) => any = _getDefaultValue): T {
	let i: Record<string, any> = {
		_type: typeRef,
	}

	for (const [valueIdStr, value] of Object.entries(typeModel.values)) {
		i[value.name] = createDefaultValue(value.name, value)
	}

	for (const [associationIdStr, association] of Object.entries(typeModel.associations)) {
		if (association.cardinality === Cardinality.Any) {
			i[association.name] = []
		} else {
			// set to null even if the cardinality is One. we could think about calling create recursively,
			// but that would require us to resolve type refs (async) and recursively merge the result with
			// the provided values
			i[association.name] = null
		}
	}

	return i as T
}

function _getDefaultValue(valueName: string, value: ModelValue): any {
	if (valueName === "_format") {
		return "0"
	} else if (valueName === "_id") {
		return null // aggregate ids are set in the worker, list ids must be set explicitly and element ids are created on the server
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
	// we want to restrict outer function to entity types, but internally we also want to handle aggregates
	function _removeTechnicalFields(erased: Record<string, any>) {
		for (const key of Object.keys(erased)) {
			if (TECHNICAL_FIELDS.includes(key)) {
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
	return entity
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
	function _removeIdentityFields(erased: Record<string, any>) {
		for (const key of Object.keys(erased)) {
			if (IDENTITY_FIELDS.includes(key)) {
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

/**
 * Construct a MailSetEntry Id for a given mail. see MailFolderHelper.java
 *
 * Note: this precision is only preserved up to 1024ms.
 */
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

export const SUBJECT_ID = 105
export const SENDER_ID = 111
export const ATTACHMENTS_ID = 115

export const IDENTITY_FIELDS = ["_id", "_ownerGroup", "_ownerEncSessionKey", "_ownerKeyVersion", "_kdfNonce", "_permissions"]
export const TECHNICAL_FIELDS = ["_original", "_errors"]

export function isCustomIdType(typeModel: TypeModel): boolean {
	const _idValue = get_IdValue(typeModel)
	return _idValue !== undefined && _idValue.type === ValueType.CustomId
}

/**
 * customIds are stored as base64url on the server and that's how we get them, but we store them locally as base64ext to make them sortable.
 * generatedIds are stored as base64ext both on the server and locally.
 */
export function getServerIdEncodingForType(typeModel: TypeModel): EntityIdEncoding {
	const _idValueType = assertNotNull(get_IdValue(typeModel), `no _id found for typeModel: ${typeModel.app}/${typeModel.id} `).type
	if (_idValueType === ValueType.CustomId) {
		return EntityIdEncoding.Base64URL
	} else if (_idValueType === ValueType.GeneratedId) {
		return EntityIdEncoding.Base64Ext
	} else {
		throw new ProgrammingError(`unknown _id type for entity: ${typeModel.app}/${typeModel.id}`)
	}
}

/**
 * customIds are stored as base64url on the server and that's how we get them, but we store them locally as base64ext to make them sortable.
 * generatedIds are stored as base64ext both on the server and locally.
 *
 * BEWARE: Calling this with a customId typeModel and a base64ext encoded customId will lead to unfun consequences.
 *
 * @param typeModel The type model for the element.
 * @param elementId The element id as it is stored on the server (base64ext for generatedIds, base64url for customIds).
 * @return base64ext encoded id
 */
export function ensureBase64Ext(typeModel: TypeModel, elementId: Id): Id {
	if (isCustomIdType(typeModel)) {
		return base64ToBase64Ext(base64UrlToBase64(elementId))
	}
	return elementId
}

/**
 * customIds are stored as base64url on the server and that's how we get them, but we store them locally as base64ext to make them sortable.
 * generatedIds are stored as base64ext both on the server and locally.
 *
 * @param typeModel The type model for the element.
 * @param elementId The element id as it is stored locally (must be encoded as base64ext).
 * @return base64url encoded id for element with customId, base64ext encoded id otherwise.
 */
export function customIdToBase64Url(typeModel: TypeModel, elementId: Id): Id {
	if (isCustomIdType(typeModel)) {
		return base64ToBase64Url(base64ExtToBase64(elementId))
	}
	return elementId
}

/**
 * Checks if the given instance (Entity or ParsedInstance) has an error in the _errors property which is usually written
 * if decryption fails for some reason in InstanceMapper.
 * @param instance the instance to check for errors.
 * @param key only returns true if there is an error for this key. Other errors will be ignored if the key is defined.
 * @returns {boolean} true if error was found (for the given key).
 */
export function hasError<K>(instance: Entity | ParsedInstance, key?: K): boolean {
	const downCastedInstance = downcast(instance)
	if (!instance) {
		return true
	} else {
		const hasNonEmptyErrorObject = !!downCastedInstance._errors && !isErrorObjectEmpty(downCastedInstance._errors)

		return hasNonEmptyErrorObject && (!key || !!downCastedInstance._errors.key)
	}
}

function isErrorObjectEmpty(obj: Record<string, unknown>): boolean {
	return Object.keys(obj).length === 0
}
