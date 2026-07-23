import { AssociationType, Cardinality, Type } from "./EntityConstants.js"
import { AppName, TypeRef } from "./TypeRef.js"
import { Nullable } from "@tutao/utils"

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

/** simple separator to distinguish between client model types and server model types */
export type ClientModelTypeSeparator = "ClientModel"
/** simple separator to distinguish between server model types and client model types */
export type ServerModelTypeSeparator = "ServerModel"

export type Distinct<T, ModelTypeSeparator> = T & { __MODEL_TYPE_SEPARATOR__: ModelTypeSeparator }
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

export type EntityId<L, E> = readonly [L, E]
export type AnyEntityId = EntityId<Nullable<Id>, Id>
export type ListElementId = EntityId<Id, Id>
export type BlobElementId = EntityId<Id, Id>
export type ElementId = EntityId<Nullable<never>, Id>

export interface Entity {
	/** the address of the TypeModel this entity conforms to. */
	_type: TypeRef<this>
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
export interface ElementEntity extends PersistentEntity {
	_id: ElementId
}

/**
 * Entity types with instances that are part of a list
 */
export interface ListElementEntity extends PersistentEntity {
	_id: ListElementId
}
/**
 * Entity types that are stored in an immutable blob storage
 */
export interface BlobElementEntity extends PersistentEntity {
	_id: BlobElementId
}

export interface PersistentEntity extends Entity {
	_id: AnyEntityId
}

export interface AggregatedEntity extends Entity {
	_id: Id
}

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

/// How association are actually represented in metamodel
export const enum AssociationReprType {
	SingleId,
	IdTuple,
	Aggregation,
}

export const enum IdType {
	SingleId,
	IdTuple,
}

export function getIdType(typeModel: TypeModel) {
	switch (typeModel.type) {
		case Type.Element:
		case Type.Aggregated:
		case Type.DataTransfer:
			return IdType.SingleId
		case Type.BlobElement:
		case Type.ListElement:
			return IdType.IdTuple
	}
}

export function getAssociationRepresentationType(associationType: Values<typeof AssociationType>) {
	switch (associationType) {
		case AssociationType.Aggregation:
			return AssociationReprType.Aggregation

		case AssociationType.BlobElementAssociation:
		case AssociationType.ListElementAssociationCustom:
		case AssociationType.ListElementAssociationGenerated:
			return AssociationReprType.IdTuple

		case AssociationType.ListAssociation:
		case AssociationType.ElementAssociation:
			return AssociationReprType.SingleId
	}
}
