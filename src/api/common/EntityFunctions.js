// @flow
import {
	base64ToBase64Url,
	base64ToUint8Array,
	base64UrlToBase64,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString
} from "./utils/Encoding"
import EC from "./EntityConstants"
import {asyncImport} from "./utils/Utils" // importing with {} from CJS modules is not supported for dist-builds currently (must be a systemjs builder bug)
const Type = EC.Type
const ValueType = EC.ValueType
const Cardinality = EC.Cardinality

export const HttpMethod = {
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
	DELETE: 'DELETE'
}
export type HttpMethodEnum = $Values<typeof HttpMethod>;

export const MediaType = {
	Json: 'application/json',
	Binary: 'application/octet-stream',
}
export type MediaTypeEnum = $Values<typeof MediaType>;

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
 * The minimum ID for elements with custom id stored on the server
 */
export const CUSTOM_MIN_ID = ""

export const RANGE_ITEM_LIMIT = 1000

/**
 * Attention: TypeRef must be defined as class and not as Flow type. Flow does not respect flow types with generics when checking return values of the generic class. See https://github.com/facebook/flow/issues/3348
 */
export class TypeRef<T> {

	app: string;
	type: string;

	constructor(app: string, type: string) {
		this.app = app;
		this.type = type;
	}
}

export function isSameTypeRef(typeRef1: TypeRef<any>, typeRef2: TypeRef<any>): boolean {
	return typeRef1.app === typeRef2.app && typeRef1.type === typeRef2.type
}

export function resolveTypeReference(typeRef: TypeRef<any>): Promise<TypeModel> {
	let pathPrefix = env.rootPathPrefix
	if (env.adminTypes.indexOf(typeRef.app + "/" + typeRef.type) !== -1) {
		pathPrefix = "admin/"
	}

	return asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
		`${pathPrefix}src/api/entities/${typeRef.app}/${typeRef.type}.js`)
		.then(module => {
			return module._TypeModel
		})
}

export function create(typeModel: TypeModel): any {
	let i = {
		_type: new TypeRef(typeModel.app, typeModel.name)
	}
	if (typeModel.type === Type.Element || typeModel.type === Type.ListElement) {
		(i: any)._errors = {}
	}
	for (let valueName of Object.keys(typeModel.values)) {
		let value = typeModel.values[valueName]
		i[valueName] = _getDefaultValue(value)
	}
	for (let associationName of Object.keys(typeModel.associations)) {
		let association = typeModel.associations[associationName]
		if (association.cardinality === Cardinality.Any) {
			i[associationName] = []
		} else {
			i[associationName] = null // set to null even if the cardinality is One
		}
	}
	return i;
}

function _getDefaultValue(value: ModelValue): any {
	if (value.name === "_format") {
		return "0"
	} else if (value.name === "_id") {
		return null // aggregate ids are set in the worker, list ids must be set explicitely and element ids are created on the server
	} else if (value.name === "_permissions") {
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

export function _setupEntity<T>(listId: ?Id, instance: T, target: EntityRestInterface): Promise<Id> {
	return resolveTypeReference((instance: any)._type).then(typeModel => {
		_verifyType(typeModel)
		if (typeModel.type === Type.ListElement) {
			if (!listId) throw new Error("List id must be defined for LETs")
		} else {
			if (listId) throw new Error("List id must not be defined for ETs")
		}
		return target.entityRequest((instance: any)._type, HttpMethod.POST, listId, null, instance).then(val => {
			return ((val: any): Id)
		})
	})
}

export function _updateEntity<T>(instance: T, target: EntityRestInterface): Promise<void> {
	return resolveTypeReference((instance: any)._type).then(typeModel => {
		_verifyType(typeModel)
		if (!(instance: any)._id) throw new Error("Id must be defined")
		var ids = _getIds(instance, typeModel)
		return target.entityRequest((instance: any)._type, HttpMethod.PUT, ids.listId, ids.id, instance).return()
	})
}

export function _eraseEntity<T>(instance: T, target: EntityRestInterface): Promise<void> {
	return resolveTypeReference((instance: any)._type).then(typeModel => {
		_verifyType(typeModel)
		var ids = _getIds(instance, typeModel)
		return target.entityRequest((instance: any)._type, HttpMethod.DELETE, ids.listId, ids.id).return()
	})
}

export function _loadEntity<T>(typeRef: TypeRef<T>, id: Id | IdTuple, queryParams: ?Params, target: EntityRestInterface): Promise<T> {
	return resolveTypeReference(typeRef).then(typeModel => {
		_verifyType(typeModel)
		let listId = null
		let elementId = null
		if (typeModel.type === Type.ListElement) {
			if ((!(id instanceof Array) || id.length !== 2)) {
				throw new Error("Illegal IdTuple for LET: " + (id: any))
			}
			listId = id[0]
			elementId = id[1]
		} else if (typeof id === "string") {
			elementId = id
		} else {
			throw new Error("Illegal Id for ET: " + (id: any))
		}
		return target.entityRequest(typeRef, HttpMethod.GET, listId, elementId, null, queryParams).then((val) => {
			return ((val: any): T)
		})
	})
}


export function _loadMultipleEntities<T>(typeRef: TypeRef<T>, listId: ?Id, elementIds: Id[], target: EntityRestInterface): Promise<T[]> {
	return resolveTypeReference(typeRef).then(typeModel => {
		_verifyType(typeModel)
		let queryParams = {
			ids: elementIds.join(",")
		}
		return (target.entityRequest(typeRef, HttpMethod.GET, listId, null, null, queryParams): any)
	})
}

export function _loadEntityRange<T>(typeRef: TypeRef<T>, listId: Id, start: Id, count: number, reverse: boolean, target: EntityRestInterface): Promise<T[]> {
	return resolveTypeReference(typeRef).then(typeModel => {
		if (typeModel.type !== Type.ListElement) throw new Error("only ListElement types are permitted")
		let queryParams = {
			start: start + "",
			count: count + "",
			reverse: reverse.toString()
		}
		return (target.entityRequest(typeRef, HttpMethod.GET, listId, null, null, queryParams): any)
	})
}

export function _loadReverseRangeBetween<T: ListElement>(typeRef: TypeRef<T>, listId: Id, start: Id, end: Id, target: EntityRestInterface): Promise<T[]> {
	return resolveTypeReference(typeRef).then(typeModel => {
		if (typeModel.type !== Type.ListElement) throw new Error("only ListElement types are permitted")
		return _loadEntityRange(typeRef, listId, start, RANGE_ITEM_LIMIT, true, target)
			.filter(entity => firstBiggerThanSecond(getLetId(entity)[1], end))
			.then(entities => {
				if (entities.length === RANGE_ITEM_LIMIT) {
					return _loadReverseRangeBetween(typeRef, listId, getLetId(entities[entities.length
					- 1])[1], end, target).then(remainingEntities => {
						return entities.concat(remainingEntities)
					})
				} else {
					return entities
				}
			})
	})
}

export function _verifyType(typeModel: TypeModel) {
	if (typeModel.type !== Type.Element && typeModel.type
		!== Type.ListElement) {
		throw new Error("only Element and ListElement types are permitted, was: "
			+ typeModel.type)
	}
}

function _getIds(instance: any, typeModel) {
	if (!instance._id) throw new Error("Id must be defined")
	let listId = null
	let id = null
	if (typeModel.type === Type.ListElement) {
		listId = instance._id[0]
		id = instance._id[1]
	} else {
		id = instance._id
	}
	return {listId: listId, id: id};
}


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
 * @param entity1
 * @param entity2
 * @returns True if the ids are the same, false otherwise
 */
export function isSameId(id1: Id | IdTuple, id2: Id | IdTuple) {
	if (id1 instanceof Array && id2 instanceof Array) {
		return id1[0] === id2[0] && id1[1] === id2[1]
	} else {
		return (id1: any) === (id2: any)
	}
}

export function containsId(ids: Array<Id | IdTuple>, id: Id | IdTuple) {
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
export function stringToCustomId(string: string) {
	return base64ToBase64Url(uint8ArrayToBase64(stringToUtf8Uint8Array(string)))
}

/**
 * Converts a custom id to a string. Attention: the custom id must be intended to be derived from a string.
 */
export function customIdToString(customId: string) {
	return utf8Uint8ArrayToString(base64ToUint8Array(base64UrlToBase64(customId)));
}

