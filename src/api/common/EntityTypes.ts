import {AssociationType, Cardinality, Type, ValueType} from "./EntityConstants"
import {TypeRef} from "@tutao/tutanota-utils"
import type {Element, ListElement} from "./utils/EntityUtils"

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
     * From which model we import this association from. Currently the field only exists for aggregates because they are only ones
     * which can be imported across models.
     */
    dependency?: string | null
}

export interface Entity {
    /* Should be TypeRef<self> but Flow doesn't allow it. */
    _type: TypeRef<any> // Should be included but cannot be unified with types without this property.
    // _ownerEncSessionKey?: ?Uint8Array,
}

export interface ElementEntity extends Entity, Element {}
export interface ListElementEntity extends Entity, ListElement {}
export type SomeEntity = ElementEntity | ListElementEntity