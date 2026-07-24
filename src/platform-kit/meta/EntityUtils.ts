import {
	assertNotNull,
	base64ExtToBase64,
	base64ExtToBase64Url,
	base64ToBase64Ext,
	base64ToUint8Array,
	base64UrlToBase64,
	base64UrlToBase64Ext,
	compare,
	downcast,
	hexToBase64,
	isNotNull,
	Nullable,
	pad,
	repeat,
	uint8ArrayToBase64,
	uint8arrayToBase64UrlCustomId,
} from "@tutao/utils"
import {
	AggregatedEntity,
	AnyEntityId,
	BlobElementEntity,
	BlobElementId,
	ElementEntity,
	ElementId,
	isSameTypeRef,
	ListElementEntity,
	ListElementId,
	TypeRef,
	ValueTypeEnum,
} from "./index"
import { Entity, ModelValue, PersistentEntity, TypeModel } from "./EntityTypes.js"
import { Cardinality, ValueType } from "./EntityConstants.js"
import { ProgrammingError } from "@tutao/app-env"
import { assertNull } from "../utils/Utils"

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

type OptionalEntity<T extends Entity> = T & {
	_id?: T extends AggregatedEntity
		? Id
		: T extends ElementEntity
			? ElementId
			: T extends ListElementEntity
				? ListElementId
				: T extends BlobElementEntity
					? ListElementId
					: never
	_ownerGroup?: Id
}

export const enum EntityIdEncoding {
	Base64Ext,
	Base64URL,
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
		return firstBiggerThanSecondBase64Url(firstId, secondId)
	} else if (encoding === EntityIdEncoding.Base64Ext) {
		return firstBiggerThanSecondBase64Ext(firstId, secondId)
	} else {
		throw new ProgrammingError(`unknown id type: ${encoding}`)
	}
}

export function firstBiggerThanSecondBase64Url(firstId: Id, secondId: Id): boolean {
	return compare(base64UrlIdToUint8array(firstId), base64UrlIdToUint8array(secondId)) === 1
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

export function get_IdValue(typeModel?: TypeModel): ModelValue | null {
	if (typeModel) {
		return Object.values(typeModel.values).find((valueType) => valueType.name === "_id") ?? null
	}
	return null
}

export function base64UrlIdToUint8array(id: Id): Uint8Array {
	if (id === "") {
		return new Uint8Array()
	}
	return base64ToUint8Array(base64UrlToBase64(id))
}

export function compareNewestFirst(id1: Id, id2: Id, encoding: EntityIdEncoding): number {
	if (id1 === id2) {
		return 0
	} else {
		return firstBiggerThanSecond(id1, id2, encoding) ? -1 : 1
	}
}

export function compareOldestFirst(id1: Id, id2: Id, encoding: EntityIdEncoding): number {
	if (id1 === id2) {
		return 0
	} else {
		return firstBiggerThanSecond(id1, id2, encoding) ? 1 : -1
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
export function isSameId<I extends AnyEntityId>(id1: I | null, id2: I | null): boolean {
	if (id1 === null || id2 === null) {
		return false
	} else if (isNotNull(id1[0]) && isNotNull(id2[0])) {
		return isSameIdTuple([id1[0], id1[1]], [id2[0], id2[1]])
	} else {
		return isSameSingleId(id1[1], id2[1])
	}
}

export function isSameSingleId(id1: Id | null, id2: Id | null): boolean {
	if (id1 === null || id2 === null) return false
	return id1 === id2
}

export function isSameIdTuple(id1: IdTuple | null, id2: IdTuple | null) {
	if (id1 === null || id2 === null) return false
	else return id1[0] === id2[0] && id1[1] === id2[1]
}

export function haveSameId(entity1: PersistentEntity, entity2: PersistentEntity): boolean {
	return isSameId(entity1._id, entity2._id)
}

export function containsId(ids: ReadonlyArray<AnyEntityId>, id: AnyEntityId): boolean {
	return ids.some((idInArray) => isSameId(idInArray, id))
}

export interface Element {
	_id: ElementId
}

export interface ListElement {
	_id: ListElementId
}

export interface BlobElement {
	_id: BlobElementId
}

export function idToElementId(id: Id): ElementId {
	return [null, id]
}

export function stringifyId(id: AnyEntityId): string {
	return id.filter(isNotNull).join("/")
}

export function getEtId(entity: Element): Id {
	return elementIdToId(entity._id)
}

export function getLetId(entity: ListElement): IdTuple {
	if (typeof entity._id === "undefined" || entity._id === null) {
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

export function elementIdToId(id: AnyEntityId): Id {
	assertNull(id[0], `Expected to be ElementId but got: ${stringifyId(id)}`)
	return id[1]
}

/**
 * Takes an iterator of list element entities and returns their ids in an array.
 * @param entities
 */
export function getIds<T extends PersistentEntity>(entities: Iterable<T>): Array<T["_id"]> {
	const ids: Array<T["_id"]> = []
	for (const entity of entities) {
		ids.push(entity._id)
	}
	return ids
}

export function create<T>(
	typeModel: TypeModel,
	typeRef: TypeRef<T>,
	createDefaultValue: (name: string, value: ModelValue, typeModel: TypeModel) => any = _getDefaultValue,
): T {
	let i: Record<string, any> = {
		_type: typeRef,
	}

	for (const [valueIdStr, value] of Object.entries(typeModel.values)) {
		i[value.name] = createDefaultValue(value.name, value, typeModel)
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

function _getDefaultValue(valueName: string, value: ModelValue, typeModel: TypeModel): any {
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
			case ValueTypeEnum.Bytes:
				return new Uint8Array(0)

			case ValueTypeEnum.Date:
				return new Date()

			case ValueTypeEnum.Number:
				return "0"

			case ValueTypeEnum.String:
			case ValueType.CompressedString:
				return ""

			case ValueTypeEnum.Boolean:
				return false

			case ValueTypeEnum.CustomId:
			case ValueTypeEnum.GeneratedId:
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

export function assertIsEntity<T extends PersistentEntity>(entity: PersistentEntity, type: TypeRef<T>): entity is T {
	if (isSameTypeRef(entity._type, type)) {
		return true
	} else {
		return false
	}
}

export function assertIsEntity2<T extends PersistentEntity>(type: TypeRef<T>): (entity: PersistentEntity) => entity is T {
	return (e): e is T => assertIsEntity(e, type)
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

	return uint8arrayToBase64UrlCustomId(new Uint8Array(buffer.buffer))
}

export function deconstructMailSetEntryId(id: Id): { receiveDate: Date; mailId: Id } {
	const buffer = base64UrlIdToUint8array(id)
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
	return _idValue !== null && _idValue.type === ValueType.CustomId
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
 * BEWARE: Calling this with a customId typeModel and a base64ext encoded customId will return a different base64ext.
 *
 * @param typeModel The type model for the element.
 * @param elementId The element id as it is stored on the server (base64ext for generatedIds, base64url for customIds).
 * @return base64ext encoded id
 */
export function serverToLocalIdEncoding(typeModel: TypeModel, elementId: Id): Id {
	if (isCustomIdType(typeModel)) {
		return base64UrlToBase64Ext(elementId)
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
export function localToServerIdEncoding(typeModel: TypeModel, elementId: Id): Id {
	if (isCustomIdType(typeModel)) {
		return base64ExtToBase64Url(elementId)
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
export function hasError<K>(instance: Nullable<Entity>, key?: K): boolean {
	if (instance == null) {
		return true
	}
	const downCastedInstance = downcast(instance)
	const hasNonEmptyErrorObject = !!downCastedInstance._errors && !isErrorObjectEmpty(downCastedInstance._errors)

	return hasNonEmptyErrorObject && (!key || !!downCastedInstance._errors.key)
}

function isErrorObjectEmpty(obj: Record<string, unknown>): boolean {
	return Object.keys(obj).length === 0
}
