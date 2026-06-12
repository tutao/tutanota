import { AssociationType, Cardinality, Type } from "./EntityConstants.js"
import { AppName, TypeRef } from "./TypeRef.js"
import { assert, assertNotNull, isNotNull, Nullable } from "@tutao/utils"
import { BlobElement, Element, elementIdPart, ListElement, listIdPart } from "./EntityUtils.js"
import { ProgrammingError } from "@tutao/app-env"

/**
 * Tuta Metamodel Entity Types
 *
 * this file contains some types that are used to define the communication between the server and the client and the
 * general structure of the objects a tuta application uses to represent user data.
 * Objects defined using the meta-model are compiled to the application model - the result corresponds to the types that
 * appear in the business logic and the communication between server and client.
 *
 * Since an app is expected to change over time, the meta-model includes the concept of a model version.
 * Data in one version of the model can be migrated to conform to the model in an older or newer version of the same
 * model.
 *
 * * each meta-model object has a [name:string / id:number] pair
 * * each object defined using the meta-model can be thought of having an address of the form
 *   * app-name for apps. (Apps also have a model version as explained above)
 *   * app-name/type-id for compound types (this is what is known as a TypeRef)
 *   * app-name/type-id/attribute-id for fields on a type. this is where the actual data lives.
 * * the ids are there to ensure it's possible to address the objects in case the human-friendly name changes.
 *
 *
 * during communication with the server, the instances go through the instance pipeline
 * which encrypts and serializes or decrypts and deserializes them.
 * the model information is gradually stripped until just the relatively unstructured wire format is left.
 * the wire format is not self-documenting, so to be used, received data has to be
 * combined with the type model describing its structure - most importantly type, cardinality and confidentiality of the
 * fields.
 */

// // //
//
// Metamodel Types - used to define the actual Model Types detailed below.
//
// // //

export type AttributeId = number
export type TypeId = number
export type AttributeName = string

/**
 * scalar fields on types in the model
 * these are currently never of Cardinality.Any
 */
export type ModelValue = {
	/* unique Id of the field in the model */
	id: AttributeId
	/* human-readable name */
	name: AttributeName
	/* the basic data type contained in the field*/
	type: ValueTypeEnum
	/* how many values can be assigned to the field */
	cardinality: Values<typeof Cardinality>
	/* whether the client is allowed to update the field */
	final: boolean
	/* whether the field should be encrypted with the containing types session key before being sent to the server. */
	encrypted: boolean
}

/**
 * encrypted scalar fields on types in the model
 */
export type EncryptedModelValue = ModelValue & { encrypted: true }

/**
 * metamodel representation of an association between types in the model.
 *
 * these are also fields on types in the model like ModelValue, but
 * * they can be of any cardinality
 * * they always reference another compound type defined in the model, so they're never just a basic type like a Date.
 */
export type ModelAssociation = {
	/* unique Id of the association in the model */
	id: AttributeId
	/* human-readable name */
	name: AttributeName
	/** if this is a reference or an aggregate. this determines the runtime representation of the containing type. */
	type: Values<typeof AssociationType>
	/** how many values can be assigned to the field */
	cardinality: Values<typeof Cardinality>
	/* the ID of the type of the values that this field contains */
	refTypeId: number
	/* whether the client is allowed to update the field */
	final: boolean
	/**
	 * From which model we import this association from. Currently,
	 * the field only exists for aggregates because they are only ones
	 * which can be imported across models.
	 */
	dependency?: AppName | null
}

export type ClientTypeModel = Distinct<TypeModel, ClientModelTypeSeparator>
export type ServerTypeModel = Distinct<TypeModel, ServerModelTypeSeparator>

/**
 * this type models how the main entity types in the model are defined.
 */
export type TypeModel = {
	/* unique Id of the type in the model */
	id: TypeId
	/** model version of the app the type first appeared in */
	since: number
	/**
	 * the top-level container for related types this type belongs in.
	 * it's mostly there to bundle related types and to
	 * make it harder to use types across applications.
	 */
	app: AppName
	/**
	 * the model version this type is defined in.
	 */
	version: number
	/**
	 * the version of another typeModel this type (and its corresponding application) depends on, if applicable.
	 */
	dependsOnVersion?: number
	/** human-readable name. */
	name: string
	/** the type of entity. this defines how (and if) the type is persisted. */
	type: Values<typeof Type>
	/** unused legacy field */
	versioned: boolean
	/** whether the type contains encrypted values */
	encrypted: boolean
	/**
	 * this is used to directly load certain instances that are indirectly referenced by their predictable Id,
	 * e.g. when going from the Calendar group to the instance that contains the calendar list. All groups need to
	 * have the same structure, so this associated data has to go in another type.
	 **/
	rootId: Id
	/** a map of scalar fields. the record keys are the ModelValue.id field of the record values */
	values: Record<AttributeId, ModelValue>
	/** a map of scalar fields. the record keys are the ModelAssociation.id field of the record values */
	associations: Record<AttributeId, ModelAssociation>
	/** true in case the type is public and exposed to the clients */
	isPublic: boolean
}

/**
 * Compound values. The keys are AttributeIds.
 */
export type UntypedInstance = Record<string, ParsedValue>

// this contains JS values except in encrypted fields, those are kept as a base64 string.
export type EncryptedParsedInstance = Record<AttributeId, ParsedValue>

export type ParsedInstance = Record<AttributeId, ParsedValue>

/** a parsed instance after/before going through decryption/encryption */
export type ParsedInstanceWithCryptoError = ParsedInstance & {
	/** crypto errors that happened during deserialization/serialization */
	_errors?: Record<AttributeId, string>
}

/** simple separator to distinguish between client model types and server model types */
export type ClientModelTypeSeparator = "ClientModel"

/** simple separator to distinguish between server model types and client model types */
export type ServerModelTypeSeparator = "ServerModel"

export type Distinct<T, ModelTypeSeparator> = T & { __MODEL_TYPE_SEPARATOR__: ModelTypeSeparator }

export type ClientModelParsedInstance = Distinct<ParsedInstanceWithCryptoError, ClientModelTypeSeparator>
export type ServerModelParsedInstance = Distinct<ParsedInstanceWithCryptoError, ServerModelTypeSeparator>

export type ClientModelEncryptedParsedInstance = Distinct<EncryptedParsedInstance, ClientModelTypeSeparator>
export type ServerModelEncryptedParsedInstance = Distinct<EncryptedParsedInstance, ServerModelTypeSeparator>

export type ClientModelUntypedInstance = Distinct<UntypedInstance, ClientModelTypeSeparator>
export type ServerModelUntypedInstance = Distinct<UntypedInstance, ServerModelTypeSeparator>

// // //
//
// Model Types
//
// // //

// decouples from sys entities
export interface IBucketKey {
	bucketEncSessionKeys: IInstanceSessionsKey[]
	keyGroup: Id | null
	pubEncBucketKey: null | Uint8Array
	groupEncBucketKey: null | Uint8Array
	protocolVersion: NumberString
	recipientKeyVersion: NumberString
	senderKeyVersion: null | NumberString
}
export interface IInstanceSessionsKey {
	instanceList: Id
	instanceId: Id
	symEncSessionKey: Uint8Array
	encryptionAuthStatus: null | Uint8Array
	symKeyVersion: NumberString
	keyVerificationState: null | Uint8Array
	typeInfo: ITypeInfo
}

export interface ITypeInfo {
	_type: TypeRef<ITypeInfo>
	_original?: ITypeInfo

	_id: Id
	application: string
	typeId: NumberString
}
//	pubEncBucketKey: null | Uint8Array
// 	groupEncBucketKey: null | Uint8Array
// 	protocolVersion: NumberString
// 	recipientKeyVersion: NumberString
// 	senderKeyVersion: null | NumberString
//
// 	keyGroup: null | Id
// 	bucketEncSessionKeys: InstanceSessionKey[]

/**
 * representation of an instance of a type defined in the model.
 * this interface is the bare minimum, actual entities need more fields in order to be useful.
 * these are added by defining ModelValues and ModelAssociations on the TypeModel.
 */
export interface Entity {
	/** the address of the TypeModel this entity conforms to. */
	_type: TypeRef<this>
	_id?: Id | IdTuple
	_original?: this
	bucketKey?: null | IBucketKey
	_ownerGroup?: null | Id
	_ownerEncSessionKey?: null | Uint8Array
	_ownerKeyVersion?: null | NumberString
	_kdfNonce?: null | Uint8Array
	ownerEncSessionKey?: null | Uint8Array
	ownerEncSessionKeyVersion?: null | NumberString
	_permissions?: null | Id
	isAdapter?: boolean
}

/**
 * Entity types with instances that stand on their own, not being part of a list
 */
export type ElementEntity = Entity & Element

/**
 * Entity types with instances that are part of a list
 */
export type ListElementEntity = Entity & ListElement

/**
 * Entity types that are stored in an immutable blob storage
 */
export type BlobElementEntity = Entity & BlobElement

export type SomeEntity = ElementEntity | ListElementEntity | BlobElementEntity
export const enum OperationType {
	CREATE = "0",
	UPDATE = "1",
	DELETE = "2",
}

export const enum ValueTypeEnum {
	String = "String",
	Number = "Number",
	Bytes = "Bytes",
	Date = "Date",
	Boolean = "Boolean",
	GeneratedId = "GeneratedId",
	CustomId = "CustomId",
	CompressedString = "CompressedString",
}

export class ParsedValue {
	private constructor(
		private readonly stringValue: Nullable<string>,
		private readonly arrayValue: Nullable<Array<ParsedValue>>,
		private readonly nestedObj: Nullable<UntypedInstance>,
	) {}

	public isString(): boolean {
		return isNotNull(this.stringValue)
	}

	public isNull() {
		return this.stringValue == null && this.arrayValue == null && this.nestedObj == null
	}

	public asString(): string {
		assert(this.nestedObj == null && this.arrayValue == null, "Expected a string")
		return assertNotNull(this.stringValue, "Expected string")
	}

	public asId(): Id {
		return this.asString()
	}
	validateNumberValue() {
		if (isNaN(parseInt(this.asString()))) {
			throw new ProgrammingError("string sent by the server cannot be converted to a number")
		}
	}

	public asArray(): Array<ParsedValue> {
		assert(this.nestedObj == null && this.stringValue == null, "Expected a array")
		return assertNotNull(this.arrayValue, "Expected array")
	}

	public asNestedObj(): UntypedInstance {
		assert(this.arrayValue == null && this.stringValue == null, "Expected Object")
		return assertNotNull(this.nestedObj, "Expected  Object")
	}

	public static fromNull() {
		return new ParsedValue(null, null, null)
	}

	static fromString(value: string): ParsedValue {
		return new ParsedValue(value, null, null)
	}

	static fromAggregate(value: UntypedInstance): ParsedValue {
		return new ParsedValue(null, null, value)
	}

	static fromAggregatedItems(value: Array<UntypedInstance>): ParsedValue {
		const items = value.map((a) => ParsedValue.fromAggregate(a))
		return new ParsedValue(null, items, null)
	}

	static fromIdList(value: Array<Id>): ParsedValue {
		const items = value.map((a) => ParsedValue.fromString(a))
		return new ParsedValue(null, items, null)
	}

	static fromIdTuple(idTuple: IdTuple): ParsedValue {
		const listId = ParsedValue.fromString(listIdPart(idTuple))
		const elId = ParsedValue.fromString(elementIdPart(idTuple))
		return new ParsedValue(null, [listId, elId], null)
	}

	static fromIdTupleList(value: Array<IdTuple>): ParsedValue {
		const items = value.map((idTuple) => ParsedValue.fromIdTuple(idTuple))
		return new ParsedValue(null, items, null)
	}

	static fromBoolean(value: boolean): ParsedValue {
		const stringValue = value ? "1" : "0"
		return new ParsedValue(stringValue, null, null)
	}

	asBoolean(): boolean {
		return this.stringValue !== "0"
	}
	asByteArray(): Uint8Array {
		return new Uint8Array(0)
	}

	asIdTuple(): IdTuple {
		const [lid, eid, ...rest] = this.asArray()
		const idTuple: IdTuple = [lid.asString(), eid.asString()]
		assert(rest.length === 0, "Expected an idTuple which should have 2 ids. Found more")
		return idTuple
	}

	static fromId(id: Id): ParsedValue {
		return ParsedValue.fromString(id)
	}
}
