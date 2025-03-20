import { AssociationType, Cardinality, Type, ValueType } from "./EntityConstants.js"
import { TypeRef } from "@tutao/tutanota-utils"
import type { BlobElement, Element, ListElement } from "./utils/EntityUtils.js"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { AppName } from "@tutao/tutanota-utils/dist/TypeRef"

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
	dependency?: AppName | null
}

export interface Instance extends Entity {
	_ownerEncSessionKey: null | Uint8Array
	_ownerKeyVersion: null | NumberString
	_ownerGroup: null | Id
	_id: Id | IdTuple
}

export interface Entity {
	_type: TypeRef<this>
}

export interface ElementEntity extends Entity, Element {
	_ownerEncSessionKey?: null | Uint8Array
	_ownerKeyVersion?: null | NumberString
	_ownerGroup: null | Id
}

export interface ListElementEntity extends Entity, ListElement {
	_ownerEncSessionKey?: null | Uint8Array
	_ownerKeyVersion?: null | NumberString
	_ownerGroup: null | Id
}

export interface BlobElementEntity extends Entity, BlobElement {
	_ownerEncSessionKey?: null | Uint8Array
	_ownerKeyVersion?: null | NumberString
	_ownerGroup: null | Id
}

export type SomeEntity = ElementEntity | ListElementEntity | BlobElementEntity

// at this stage, all values are strings or not present.
export type UntypedValue = Nullable<string>
// server sends associations as arrays, cardinality is checked later.
export type UntypedAssociation = Array<Id> | Array<IdTuple> | Array<UntypedInstance>
export type UntypedInstance = Record<string, UntypedValue | UntypedAssociation>

export type EncryptedParsedValue =
	| Id // element association or list association or _id
	| IdTuple // list element association
	| boolean // unencrypted
	| Date // unencrypted
	| number // unencrypted
	| string // unencrypted
	| Uint8Array // Either Bytes or encrypted value fixme: is this rather Base64

export type EncryptedParsedAssociation =
	| Array<Id> // element references / list references
	| Array<IdTuple> // list element ref, card any
	| Array<EncryptedParsedInstance> // aggregate

// this contains JS values except in encrypted fields, those are kept as a base64 string.
export type EncryptedParsedInstance = Record<number, Nullable<EncryptedParsedValue> | EncryptedParsedAssociation>

export type ParsedValue = EncryptedParsedValue // Only for doc purpose, structure is the same
export type ParsedAssociation = EncryptedParsedAssociation // Only for doc purpose, structure is the same

export type ParsedInstance = Record<number, Nullable<ParsedValue> | ParsedAssociation> & {
	_errors?: Record<number, string>
	_finalIvs: Record<number, Nullable<Uint8Array>>
}
