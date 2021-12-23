// @flow
import {AssociationType, Cardinality, Type, ValueType} from "./EntityConstants"
import {TypeRef} from "@tutao/tutanota-utils"
import type {Element, ListElement} from "./utils/EntityUtils"

export type TypeEnum = $Values<typeof Type>;
export type AssociationTypeEnum = $Values<typeof AssociationType>;
export type CardinalityEnum = $Values<typeof Cardinality>;
export type ValueTypeEnum = $Values<typeof ValueType>;

export type TypeModel = {
	id: number,
	app: string,
	version: string,
	name: string,
	type: TypeEnum,
	versioned: boolean,
	encrypted: boolean,
	rootId: string,
	values: {[key: string]: ModelValue},
	associations: {[key: string]: ModelAssociation}
}

export type ModelValue = {
	id: number,
	type: ValueTypeEnum,
	cardinality: CardinalityEnum,
	final: boolean,
	encrypted: boolean
}

/**
 * Metamodel Representation of the association (reference/aggregate).
 */
export type ModelAssociation = {
	id: number,
	type: AssociationTypeEnum,
	cardinality: CardinalityEnum,
	refType: string,
	/**
	 * From which model we import this association from. Currently the field only exists for aggregates because they are only ones
	 * which can be imported across models.
	 */
	dependency?: ?string,
}

export interface Entity {
	/* Should be TypeRef<self> but Flow doesn't allow it. */
	_type: TypeRef<*>
	// Should be included but cannot be unified with types without this property.
	// _ownerEncSessionKey?: ?Uint8Array,
}

export interface ElementEntity extends Entity, Element {
}

export interface ListElementEntity extends Entity, ListElement {
}

export type SomeEntity = ElementEntity | ListElementEntity