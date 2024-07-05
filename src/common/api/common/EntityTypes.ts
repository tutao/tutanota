import { AssociationType, Cardinality, Type, ValueType } from "./EntityConstants.js"
import { TypeRef } from "@tutao/tutanota-utils"
import type { BlobElement, Element, ListElement } from "./utils/EntityUtils.js"

export type TypeModel = {
	id: number
	since: number
	app: string
	version: string
	name: string
	type: Values<typeof Type>
	versioned: boolean
	encrypted: boolean
	rootId: Id
	values: Record<string, ModelValue>
	associations: Record<string, ModelAssociation>
}

export type ModelValue = {
	id: number
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
	type: Values<typeof AssociationType>
	cardinality: Values<typeof Cardinality>
	refType: string
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
