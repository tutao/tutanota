// @flow
import {AssociationType, Cardinality, Type, ValueType} from "./EntityConstants"

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