import { assertNotNull } from "@tutao/utils"
import { AttributeId, AttributeName, ModelValue, TypeId, TypeModel } from "./EntityTypes"
import { AppName } from "./TypeRef.js"
import { ProgrammingError } from "@tutao/app-env"

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
		drive: new Map(),
	}

	private static getResolvedAttributeId(typeModel: TypeModel, attrName: AttributeName): AttributeId | null {
		const typeIdMap = AttributeModel.typeIdToAttributeNameMap[typeModel.app].get(typeModel.id)
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

		AttributeModel.typeIdToAttributeNameMap[typeModel.app].set(typeModel.id, attributeNameToAttributeId)
	}

	public static isKnownAttribute(typeModel: TypeModel, attributeName: AttributeName): boolean {
		AttributeModel.computeAttributeIdsForTypeIfNotExists(typeModel)
		return AttributeModel.typeIdToAttributeNameMap[typeModel.app].get(typeModel.id)?.has(attributeName) ?? false
	}

	public static getAttributeId(typeModel: TypeModel, attributeName: AttributeName): AttributeId | null {
		if (AttributeModel.isKnownAttribute(typeModel, attributeName)) {
			return assertNotNull(AttributeModel.getResolvedAttributeId(typeModel, attributeName))
		}

		return null
	}

	public static getAttributeName(typeModel: TypeModel, attributeId: AttributeId): AttributeName {
		return assertNotNull(
			typeModel.values[attributeId]?.name ?? typeModel.associations[attributeId]?.name,
			`AttributeId does not exists in typeModel: ${typeModel.app}/${typeModel.name}`,
		)
	}

	public static getModelValue(typeModel: TypeModel, attributeName: AttributeName): ModelValue {
		const filedId = assertNotNull(AttributeModel.getAttributeId(typeModel, attributeName))
		return assertNotNull(typeModel.values[filedId], `value with attribute: ${attributeName} does not exists in ${typeModel.app}/${typeModel.id}`)
	}
}

type KeyOfRecord = string | number
export function deepMapKeys<K extends KeyOfRecord>(obj: Record<KeyOfRecord, any>, keyMapper: (rawKey: string) => K): Record<K, any> {
	const mappedObject = {} as Record<K, any>

	for (const [unmappedKey, value] of Object.entries(obj)) {
		const mappedKey = keyMapper(unmappedKey)

		if (value == null) {
			mappedObject[mappedKey] = null
		} else if (Array.isArray(value)) {
			mappedObject[mappedKey] = value.map((item) => {
				if (typeof item === "string") {
					return item
				} else {
					return deepMapKeys(item, keyMapper)
				}
			})
		} else if (typeof value === "object") {
			mappedObject[mappedKey] = deepMapKeys(value, keyMapper)
		} else {
			mappedObject[mappedKey] = value
		}
	}

	return mappedObject
}
