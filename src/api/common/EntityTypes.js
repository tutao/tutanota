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

export type ModelAssociation = {
	id: number,
	type: AssociationTypeEnum,
	cardinality: CardinalityEnum,
	refType: string
}

