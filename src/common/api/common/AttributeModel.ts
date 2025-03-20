import { AppName } from "@tutao/tutanota-utils/dist/TypeRef"
import { AttributeId, AttributeName, TypeId } from "../worker/crypto/ModelMapper"
import type { EncryptedParsedInstance, ParsedInstance, TypeModel, UntypedInstance } from "./EntityTypes"
import { ProgrammingError } from "./error/ProgrammingError"
import { assertNotNull, downcast } from "@tutao/tutanota-utils"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"

// Record<appName, Map<typeId, Map<attrName, attrId>>>
let typeIdToAttributeNameMap: Record<string, Map<number, Map<string, number>>> = {
	// Map<typeId, Map<attrName, attrId>>
	base: new Map(),
	sys: new Map(),
	tutanota: new Map(),
	monitor: new Map<number, Map<string, number>>(),
	accounting: new Map<number, Map<string, number>>(),
	gossip: new Map<number, Map<string, number>>(),
	storage: new Map<number, Map<string, number>>(),
	usage: new Map<number, Map<string, number>>(),
}

export class AttributeModel {
	private static readonly typeIdToAttributeNameMap: Record<AppName, Map<TypeId, Map<AttributeName, AttributeId>>> = {
		base: new Map(),
		tutanota: new Map(),
		gossip: new Map(),
		monitor: new Map(),
		usage: new Map(),
		accounting: new Map(),
		sys: new Map(),
		storage: new Map(),
	}

	static getAttributeorNull<T>(instance: EncryptedParsedInstance | ParsedInstance, attrName: string, typeModel: TypeModel): Nullable<T> {
		const attrId = AttributeModel.getAttributeId(typeModel, attrName)
		if (attrId) {
			const value = instance[attrId]
			return downcast<T>(value)
		} else {
			return null
		}
	}

	// FIXME remove after migrating EncryptedParsedInstance | ParsedInstance to string keys
	static getAttributeorNullOfUntyped<T>(instance: UntypedInstance, attrName: string, typeModel: TypeModel): Nullable<T> {
		const attrId = AttributeModel.getAttributeId(typeModel, attrName)
		if (attrId) {
			const value = instance[attrId.toString()]
			return downcast<T>(value)
		} else {
			return null
		}
	}

	private static getResolvedAttributeId(typeModel: TypeModel, attrName: string): number | null {
		const typeIdMap = typeIdToAttributeNameMap[typeModel.app].get(typeModel.id)
		if (typeIdMap == null) {
			throw new ProgrammingError(`Unknown type: ${typeModel.app}/${typeModel.name}`)
		}

		return typeIdMap.get(attrName) ?? null
	}

	private static computeAttributeIdsForTypeIfNotExists(typeModel: TypeModel) {
		if (!AttributeModel.typeIdToAttributeNameMap[typeModel.app].has(typeModel.id)) {
			AttributeModel.computeAttributeIdsForType(typeModel)
		}
	}

	private static computeAttributeIdsForType(typeModel: TypeModel) {
		let attributeNameToAttributeId: Map<string, number> = new Map()
		for (const [valueId, value] of Object.entries(typeModel.values)) {
			attributeNameToAttributeId.set(value.name, parseInt(valueId))
		}
		for (const [associationId, association] of Object.entries(typeModel.associations)) {
			attributeNameToAttributeId.set(association.name, parseInt(associationId))
		}

		typeIdToAttributeNameMap[typeModel.app].set(typeModel.id, attributeNameToAttributeId)
	}

	public static isKnownAttribute(typeModel: TypeModel, attributeName: string): boolean {
		AttributeModel.computeAttributeIdsForTypeIfNotExists(typeModel)
		return AttributeModel.typeIdToAttributeNameMap[typeModel.app].get(typeModel.id)?.has(attributeName) ?? false
	}

	public static getAttributeId(typeModel: TypeModel, attributeName: string): number | null {
		if (AttributeModel.isKnownAttribute(typeModel, attributeName)) {
			AttributeModel.computeAttributeIdsForTypeIfNotExists(typeModel)
			return assertNotNull(AttributeModel.getResolvedAttributeId(typeModel, attributeName))
		}

		return null
	}
}
