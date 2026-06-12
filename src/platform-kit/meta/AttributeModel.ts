import { assertNotNull, isNotNull } from "@tutao/utils"
import { AttributeId, AttributeName, ModelAssociation, ModelValue, ParsedValue, ServerIncomingData, TypeId, TypeModel, UntypedInstance } from "./EntityTypes"
import { ProgrammingError } from "@tutao/app-env"
import { AppName } from "./TypeRef.js"

import { deepMapKeys } from "./MetaCompatibility"

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

	static removeNetworkDebuggingInfoIfNeededFromServerResponse(untypedInstance: object): UntypedInstance {
		return deepMapKeys(
			untypedInstance,

			// convert all keys to number after removing name followed by `:`
			(key: string) => {
				const idStr = key.split(":")[0]
				return parseInt(idStr).toString()
			},

			// convert all value to ServerIncomingData
			(value) => {
				if (value == null) {
					return ServerIncomingData.fromNull()
				} else if (typeof value === "string") {
					return ServerIncomingData.fromString(value)
				} else if (typeof value === "object") {
					return ServerIncomingData.fromAggregatedItems(value)
				} else {
					throw new ProgrammingError("All of our values are string, array or nested object")
				}
			},
		)
	}

	static getAttributeOnClientInstance(instance: Record<AttributeId, ParsedValue>, attrName: string, typeModel: TypeModel): ParsedValue {
		const attrId = assertNotNull(AttributeModel.getAttributeId(typeModel, attrName), `expected attribute ${attrName} in ${typeModel.app}/${typeModel.name}`)
		const value = instance[attrId]
		return assertNotNull(value, attrName)
	}

	static getAttributeOrNullOnClientInstance(instance: Record<AttributeId, ParsedValue>, attrName: string, typeModel: TypeModel): ParsedValue {
		const attrId = AttributeModel.getAttributeId(typeModel, attrName)
		return isNotNull(attrId) ? instance[attrId] : ParsedValue.fromNull()
	}

	static getAttributeOnServerInstance(instance: UntypedInstance, attrName: string, typeModel: TypeModel): ServerIncomingData {
		const attrId = assertNotNull(AttributeModel.getAttributeId(typeModel, attrName), `expected attribute ${attrName} in ${typeModel.app}/${typeModel.name}`)
		const value = instance[attrId]
		return assertNotNull(value, attrName)
	}

	static getAttributeOrNullOnServerInstance(instance: UntypedInstance, attrName: string, typeModel: TypeModel): ServerIncomingData {
		const attrId = AttributeModel.getAttributeId(typeModel, attrName)
		return isNotNull(attrId) ? instance[attrId] : ServerIncomingData.fromNull()
	}

	private static getResolvedAttributeId(typeModel: TypeModel, attrName: string): number | null {
		const typeIdMap = assertNotNull(
			AttributeModel.typeIdToAttributeNameMap[typeModel.app].get(typeModel.id),
			`Unknown type: ${typeModel.app}/${typeModel.name}`,
		)
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

	public static isKnownAttribute(typeModel: TypeModel, attributeName: string): boolean {
		AttributeModel.computeAttributeIdsForTypeIfNotExists(typeModel)
		return AttributeModel.typeIdToAttributeNameMap[typeModel.app].get(typeModel.id)?.has(attributeName) ?? false
	}

	public static getAttributeId(typeModel: TypeModel, attributeName: string): AttributeId | null {
		if (AttributeModel.isKnownAttribute(typeModel, attributeName)) {
			AttributeModel.computeAttributeIdsForTypeIfNotExists(typeModel)
			return assertNotNull(AttributeModel.getResolvedAttributeId(typeModel, attributeName))
		}

		return null
	}

	public static getModelValue(typeModel: TypeModel, attributeName: string): ModelValue {
		const filedId = assertNotNull(AttributeModel.getAttributeId(typeModel, attributeName))
		return typeModel.values[filedId]
	}

	public static getModelAssociation(typeModel: TypeModel, attributeName: string): ModelAssociation {
		const filedId = assertNotNull(AttributeModel.getAttributeId(typeModel, attributeName))
		return typeModel.associations[filedId]
	}
}
