import { AppName } from "@tutao/tutanota-utils/dist/TypeRef"
import {
	AttributeId,
	AttributeName,
	ClientModelUntypedInstance,
	EncryptedParsedInstance,
	ModelAssociation,
	ModelValue,
	ServerModelParsedInstance,
	ServerModelUntypedInstance,
	TypeId,
	TypeModel,
} from "./EntityTypes"
import { ProgrammingError } from "./error/ProgrammingError"
import { assertNotNull, downcast } from "@tutao/tutanota-utils"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { deepMapKeys } from "./utils/EntityUtils"

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

	static removeNetworkDebuggingInfoIfNeeded<T extends ClientModelUntypedInstance | ServerModelUntypedInstance>(untypedInstance: T): T {
		if (env.networkDebugging) {
			return deepMapKeys(untypedInstance, (key: string) => key.split(":")[0])
		}
		return untypedInstance
	}

	static getAttribute<T>(instance: EncryptedParsedInstance | ServerModelParsedInstance, attrName: string, typeModel: TypeModel): T {
		const attrId = AttributeModel.getAttributeId(typeModel, attrName)
		if (attrId) {
			const value = instance[attrId]
			return assertNotNull(downcast<T>(value), attrName)
		} else {
			throw new ProgrammingError("null not allowed")
		}
	}

	static getAttributeorNull<T>(instance: EncryptedParsedInstance | ServerModelParsedInstance, attrName: string, typeModel: TypeModel): Nullable<T> {
		const attrId = AttributeModel.getAttributeId(typeModel, attrName)
		if (attrId) {
			const value = instance[attrId]
			return downcast<T>(value)
		} else {
			return null
		}
	}

	private static getResolvedAttributeId(typeModel: TypeModel, attrName: string): number | null {
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

	public static getModelValue(typeModel: TypeModel, attributeName: string): ModelValue {
		const filedId = assertNotNull(AttributeModel.getAttributeId(typeModel, attributeName))
		return typeModel.values[filedId]
	}

	public static getModelAssociation(typeModel: TypeModel, attributeName: string): ModelAssociation {
		const filedId = assertNotNull(AttributeModel.getAttributeId(typeModel, attributeName))
		return typeModel.associations[filedId]
	}
}
