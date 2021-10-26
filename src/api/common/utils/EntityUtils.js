//@flow
import {
	base64ToBase64Url,
	base64ToUint8Array,
	base64UrlToBase64,
	stringToUtf8Uint8Array,
	TypeRef,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString
} from "@tutao/tutanota-utils"
import {Cardinality, Type, ValueType} from "../EntityConstants"
import type {SomeEntity} from "../../main/Entity"
import type {ModelValue, TypeModel} from "../EntityTypes"
import {pad} from "@tutao/tutanota-utils/lib"
import {base64ExtToBase64, base64ToBase64Ext, hexToBase64} from "@tutao/tutanota-utils/lib/Encoding"
import type {Hex} from "@tutao/tutanota-utils/"

/**
 * the maximum ID for elements stored on the server (number with the length of 10 bytes) => 2^80 - 1
 */
export const GENERATED_MAX_ID = "zzzzzzzzzzzz"/**
 *
 */
/**
 * The minimum ID for elements with generated id stored on the server
 */
export const GENERATED_MIN_ID = "------------"
/**
 * The byte length of a generated id
 */
export const GENERATED_ID_BYTES_LENGTH = 9
/**
 * The minimum ID for elements with custom id stored on the server
 */
export const CUSTOM_MIN_ID = ""
export const RANGE_ITEM_LIMIT = 1000
export const LOAD_MULTIPLE_LIMIT = 100
export const READ_ONLY_HEADER = "read-only"

/**
 * Tests if one id is bigger than another.
 * @param firstId The element id that is tested if it is bigger.
 * @param secondId The element id that is tested against.
 * @return True if firstId is bigger than secondId, false otherwise.
 */
export function firstBiggerThanSecond(firstId: Id, secondId: Id): boolean {
	// if the number of digits is bigger, then the id is bigger, otherwise we can use the lexicographical comparison
	if (firstId.length > secondId.length) {
		return true;
	} else if (secondId.length > firstId.length) {
		return false;
	} else {
		return firstId > secondId;
	}
}

export function compareNewestFirst(id1: Id | IdTuple, id2: Id | IdTuple): number {
	let firstId = (id1 instanceof Array) ? id1[1] : id1
	let secondId = (id2 instanceof Array) ? id2[1] : id2
	if (firstId === secondId) {
		return 0
	} else {
		return firstBiggerThanSecond(firstId, secondId) ? -1 : 1
	}
}

export function compareOldestFirst(id1: Id | IdTuple, id2: Id | IdTuple): number {
	let firstId = (id1 instanceof Array) ? id1[1] : id1
	let secondId = (id2 instanceof Array) ? id2[1] : id2
	if (firstId === secondId) {
		return 0
	} else {
		return firstBiggerThanSecond(firstId, secondId) ? 1 : -1
	}
}

export function sortCompareByReverseId<T: ListElement>(entity1: T, entity2: T): number {
	return compareNewestFirst(getElementId(entity1), getElementId(entity2))
}

export function sortCompareById<T: ListElement>(entity1: T, entity2: T): number {
	return compareOldestFirst(getElementId(entity1), getElementId(entity2))
}

/**
 * Compares the ids of two elements.
 * @pre Both entities are either ElementTypes or ListElementTypes
 * @param id1
 * @param id2
 * @returns True if the ids are the same, false otherwise
 */
export function isSameId(id1: ?(Id | IdTuple), id2: ?(Id | IdTuple)): boolean {
	if (id1 === null || id2 === null) {
		return false
	} else if (id1 instanceof Array && id2 instanceof Array) {
		return id1[0] === id2[0] && id1[1] === id2[1]
	} else {
		return (id1: any) === (id2: any)
	}
}

export function haveSameId(entity1: SomeEntity, entity2: SomeEntity): boolean {
	return isSameId(entity1._id, entity2._id)
}

export function containsId(ids: $ReadOnlyArray<Id | IdTuple>, id: Id | IdTuple): boolean {
	return ids.find(idInArray => isSameId(idInArray, id)) != null
}

export type Element = {
	_id: Id
}
export type ListElement = {
	_id: IdTuple
}

export function getEtId(entity: Element): Id {
	return entity._id
}

export function getLetId(entity: ListElement): IdTuple {
	if (typeof entity._id === "undefined") {
		throw new Error("listId is not defined for " + (typeof (entity: any)._type
		=== 'undefined'
			? JSON.stringify(entity)
			: (entity: any)))
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
	return utf8Uint8ArrayToString(base64ToUint8Array(base64UrlToBase64(customId)));
}

export function readOnlyHeaders(): Params {
	return {[READ_ONLY_HEADER]: "true"}
}

export function create<T>(typeModel: TypeModel, typeRef: TypeRef<T>): T {
	let i = {
		_type: typeRef
	}
	if (typeModel.type === Type.Element || typeModel.type === Type.ListElement) {
		(i: any)._errors = {}
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
			i[associationName] = null // set to null even if the cardinality is One
		}
	}
	return (i: any);
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
				return null // we have to use null although the value must be set to something different
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
	let hex = parseInt(id).toString(16) + "00000" + pad(serverBytes, 2) // add one zero for the missing 4 bits plus 4 more (2 bytes) plus 2 more for the server id to get 9 bytes
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

// We can't import EntityUtils here, otherwise we should say GENERATED_MAX_ID.length or something like it
const base64extEncodedIdLength = 12
const base64extAlphabet = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz"

export function isValidGeneratedId(id: Id | IdTuple): boolean {

	const test = id => id.length === base64extEncodedIdLength && Array.from(id).every(char => base64extAlphabet.includes(char))

	return typeof id === "string"
		? test(id)
		: id.every(test)
}