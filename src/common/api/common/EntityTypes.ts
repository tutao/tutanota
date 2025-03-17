import { AssociationType, Cardinality, Type, ValueType } from "./EntityConstants.js"
import { TypeRef } from "@tutao/tutanota-utils"
import type { BlobElement, Element, ListElement } from "./utils/EntityUtils.js"
import { AppName } from "../worker/crypto/InstanceMapper"
import type { BucketKey } from "../entities/sys/TypeRefs"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"

export type TypeModel = {
	id: number
	since: number
	app: AppName
	version: string
	name: string
	type: Values<typeof Type>
	versioned: boolean
	encrypted: boolean
	rootId: Id
	values: Record<number, ModelValue>
	associations: Record<number, ModelAssociation>
}

export type ModelValue = {
	id: number
	name: string
	type: Values<typeof ValueType>
	cardinality: Values<typeof Cardinality>
	final: boolean
	encrypted: boolean
}

/**
 * Metamodel Representation of the association (reference/aggregate).
 */
export type ModelAssociation = {
	id: number
	name: string
	type: Values<typeof AssociationType>
	cardinality: Values<typeof Cardinality>
	refTypeId: number
	final: boolean
	/**
	 * From which model we import this association from. Currently, the field only exists for aggregates because they are only ones
	 * which can be imported across models.
	 */
	dependency?: string | null
}

export interface Instance extends Entity {
	_ownerEncSessionKey: null | Uint8Array
	_ownerKeyVersion: null | NumberString
	_ownerGroup: null | Id
	_id: Id | IdTuple
}

export interface Entity {
	_type: TypeRef<this>

	_ownerEncSessionKey?: null | Uint8Array
	_ownerKeyVersion?: null | NumberString
	_ownerGroup?: null | Id
}

export interface ElementEntity extends Entity, Element {}

export interface ListElementEntity extends Entity, ListElement {}

export interface BlobElementEntity extends Entity, BlobElement {}

export type SomeEntity = ElementEntity | ListElementEntity | BlobElementEntity

export type UntypedInstance = Record<string, string | Uint8Array | any> // any is UntypedInstance again

export type EncryptedParsedValue =
	| Id // element association or list association or _id
	| IdTuple // list element association
	| boolean // unencrypted
	| Date // unencrypted
	| number // unencrypted
	| string // unencrypted
	| Uint8Array // Either Bytes or encrypted value

export type EncryptedParsedAssociation =
	| null
	| Id
	| Array<Id>
	| IdTuple
	| Array<IdTuple>
	// should have been reference to EncryptedParsedInstance
	| Record<string, any>
	| Array<Record<string, any>>

export type EncryptedParsedInstance = Record<number, Nullable<EncryptedParsedValue | EncryptedParsedAssociation>>

export type ParsedValue = EncryptedParsedValue // Only for doc purpose, structure is the same
export type ParsedAssociation = EncryptedParsedAssociation // Only for doc purpose, structure is the same

export type ParsedInstance = Record<number, Nullable<ParsedValue | ParsedAssociation>>
