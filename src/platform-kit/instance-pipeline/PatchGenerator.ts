import { AttributeId, isSameIdTuple, ParsedInstance, ParsedValue, ServerIncomingData, TypeModel, UntypedInstance, ValueTypeEnum } from "@tutao/meta"
import { createPatch, createPatchList, Patch, PatchList } from "../../entities/sys/TypeRefs.js"
import { TypeRef } from "../meta/TypeRef.js"
import { arrayEquals, arrayEqualsWithPredicate, assertNotNull, deepEqual, isEmpty, isNotEmpty, isNotNull, Nullable } from "@tutao/utils"
import { ProgrammingError } from "@tutao/app-env"
import { IDENTITY_FIELDS, isSameId } from "../meta/EntityUtils.js"
import { AssociationType, Cardinality, ValueType } from "../meta/EntityConstants.js"
import { ClientTypeReferenceResolver } from "./EntityFunctions.js"
import { AttributeModel } from "../meta/AttributeModel.js"

export const enum PatchOperationType {
	ADD_ITEM = "0",
	REMOVE_ITEM = "1",
	REPLACE = "2",
}

// visible for testing
export function areValuesDifferent(valueType: ValueTypeEnum, originalParsedValue: ParsedValue, currentParsedValue: ParsedValue): boolean {
	const wasNullAndStayedNull = originalParsedValue.isNull() && currentParsedValue.isNull()
	const valueChangedToNull = !originalParsedValue.isNull() && currentParsedValue.isNull()
	const valueChangedFromNull = originalParsedValue.isNull() && !currentParsedValue.isNull()
	if (wasNullAndStayedNull) {
		return false
	} else if (valueChangedFromNull || valueChangedToNull) {
		return true
	}

	switch (valueType) {
		case ValueType.Bytes:
			return !arrayEquals(originalParsedValue.getByteArray(), currentParsedValue.getByteArray())
		case ValueType.Date:
			return originalParsedValue.getDate().valueOf() !== currentParsedValue.getDate().valueOf()
		case ValueType.Number:
		case ValueType.String:
		case ValueType.Boolean:
		case ValueType.CompressedString:
			return originalParsedValue.getString() !== currentParsedValue.getString()
		case ValueType.CustomId:
		case ValueType.GeneratedId: {
			if (isNotNull(originalParsedValue.idValue)) {
				return !isSameId(originalParsedValue.getId(), currentParsedValue.getId())
			} else if (isNotNull(originalParsedValue.idTuple)) {
				return !isSameId(originalParsedValue.getidTuple(), currentParsedValue.getidTuple())
			} else {
				throw new ProgrammingError("Expected eitherId or IdTuple. Found none")
			}
		}
	}

	return false
}

export async function computePatchPayload(
	originalInstance: Record<AttributeId, ParsedValue>,
	currentInstance: Record<AttributeId, ParsedValue>,
	currentUntypedInstance: UntypedInstance,
	typeModel: TypeModel,
	typeReferenceResolver: ClientTypeReferenceResolver,
	isNetworkDebuggingEnabled: boolean,
): Promise<PatchList> {
	const patches = await computePatches(originalInstance, currentInstance, currentUntypedInstance, typeModel, typeReferenceResolver, isNetworkDebuggingEnabled)
	return createPatchList({ patches: patches })
}

// visible for testing
export async function computePatches(
	originalInstance: Record<AttributeId, ParsedValue>,
	modifiedInstance: Record<AttributeId, ParsedValue>,
	modifiedUntypedInstance: Record<string, ServerIncomingData>,
	typeModel: TypeModel,
	typeReferenceResolver: ClientTypeReferenceResolver,
	isNetworkDebuggingEnabled: boolean,
): Promise<Patch[]> {
	let patches: Patch[] = []
	for (const [valueIdStr, modelValue] of Object.entries(typeModel.values)) {
		if (IDENTITY_FIELDS.includes(modelValue.name) || modelValue.final) {
			continue
		}
		const attributeId = parseInt(valueIdStr)
		let attributeIdStr = valueIdStr
		if (env.networkDebugging) {
			// keys are in the format attributeId:attributeName when networkDebugging is enabled
			attributeIdStr += ":" + modelValue.name
		}
		let originalParsedValue = originalInstance[attributeId]
		let modifiedParsedValue = modifiedInstance[attributeId]
		let modifiedUntypedValue = modifiedUntypedInstance[attributeIdStr]

		if (areValuesDifferent(modelValue.type, originalParsedValue, modifiedParsedValue)) {
			let value: string | null = null
			if (modifiedUntypedValue !== null) {
				value = typeof modifiedUntypedValue === "object" ? JSON.stringify(modifiedUntypedValue) : modifiedUntypedValue
			}
			patches.push(
				createPatch({
					attributePath: attributeIdStr,
					value: value,
					patchOperation: PatchOperationType.REPLACE,
				}),
			)
		}
	}

	for (const [associationIdStr, modelAssociation] of Object.entries(typeModel.associations)) {
		if (modelAssociation.final) {
			continue
		}
		const attributeId = parseInt(associationIdStr)
		let attributeIdStr = associationIdStr
		if (env.networkDebugging) {
			// keys are in the format attributeId:attributeName when networkDebugging is enabled
			attributeIdStr += ":" + modelAssociation.name
		}

		if (modelAssociation.type === AssociationType.Aggregation) {
			const appName = modelAssociation.dependency ?? typeModel.app
			const typeId = modelAssociation.refTypeId
			const aggregateTypeModel = await typeReferenceResolver(new TypeRef(appName, typeId))
			const originalAggregatedEntities =
				originalInstance[attributeId]
					.getNullWhenNull()
					?.getArray()
					.map((a) => a.getAggregate()) ?? []
			const modifiedAggregatedEntities =
				originalInstance[attributeId]
					.getNullWhenNull()
					?.getArray()
					.map((a) => a.getAggregate()) ?? []

			const modifiedAggregatedUntypedEntities = modifiedUntypedInstance[attributeIdStr].asArray().map((a) => a.asNestedObj())

			const modifiedAggregateIds = modifiedAggregatedEntities.map((instance) =>
				instance[assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))].getId(),
			)
			if (!isDistinctAggregateIds(modifiedAggregateIds)) {
				const modifiedInstanceId = AttributeModel.getAttributeOnClientInstance(modifiedInstance, "_id", typeModel)
				throw new ProgrammingError(
					`Duplicate aggregate ids of aggregate ${appName}/${typeId} in modified instance ${typeModel.app}/${typeModel.id} :  ${modifiedInstanceId}`,
				)
			}
			const addedItems = modifiedAggregatedUntypedEntities.filter(
				(element) =>
					!originalAggregatedEntities.some((item) => {
						const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))
						let aggregateIdAttributeIdStr = aggregateIdAttributeId.toString()
						if (env.networkDebugging) {
							// keys are in the format attributeId:attributeName when networkDebugging is enabled
							aggregateIdAttributeIdStr += ":" + "_id"
						}
						return isSameId(item[aggregateIdAttributeId].getId(), element[aggregateIdAttributeIdStr].asString())
					}),
			)

			const removedItems = originalAggregatedEntities.filter(
				(element) =>
					!modifiedAggregatedEntities.some((item) => {
						const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))
						return isSameId(item[aggregateIdAttributeId].getId(), element[aggregateIdAttributeId].getId())
					}),
			)

			const commonItems = originalAggregatedEntities.filter(
				(element) =>
					!removedItems.some((item) => {
						const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))
						return isSameId(item[aggregateIdAttributeId].getId(), element[aggregateIdAttributeId].getId())
					}),
			)

			if (
				(modelAssociation.cardinality !== Cardinality.Any && isEmpty(originalAggregatedEntities) !== isEmpty(modifiedAggregatedEntities)) ||
				(!isEmpty(originalAggregatedEntities) && !isEmpty(modifiedAggregatedEntities) && isEmpty(commonItems))
			) {
				patches.push(
					createPatch({
						attributePath: attributeIdStr,
						value: JSON.stringify(modifiedAggregatedUntypedEntities),
						patchOperation: PatchOperationType.REPLACE,
					}),
				)
				continue
			}

			const commonAggregateIds = commonItems.map((instance) => instance[assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))].getId())
			for (let commonAggregateId of commonAggregateIds) {
				const commonItemOriginal = assertNotNull(
					originalAggregatedEntities.find((instance) => {
						const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))
						return isSameId(instance[aggregateIdAttributeId].getId(), commonAggregateId)
					}),
				)
				const commonItemModified: ParsedInstance = assertNotNull(
					modifiedAggregatedEntities.find((instance) => {
						const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))
						return isSameId(instance[aggregateIdAttributeId].getId(), commonAggregateId)
					}),
				)
				const commonItemModifiedUntyped: Record<string, ServerIncomingData> = assertNotNull(
					modifiedAggregatedUntypedEntities.find((instance) => {
						const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))
						let aggregateIdAttributeIdStr = aggregateIdAttributeId.toString()
						if (env.networkDebugging) {
							// keys are in the format attributeId:attributeName when networkDebugging is enabled
							aggregateIdAttributeIdStr += ":" + "_id"
						}
						return isSameId(instance[aggregateIdAttributeIdStr].asString(), commonAggregateId)
					}),
				)
				const fullPath = `${attributeIdStr}/${commonAggregateId}/`
				const items = await computePatches(
					commonItemOriginal,
					commonItemModified,
					commonItemModifiedUntyped,
					aggregateTypeModel,
					typeReferenceResolver,
					isNetworkDebuggingEnabled,
				)
				items.map((item) => {
					item.attributePath = fullPath + item.attributePath
				})
				patches = patches.concat(items)
			}
			if (removedItems.length > 0) {
				const removedAggregateIds = removedItems.map((instance) =>
					instance[assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))].getId(),
				)
				patches.push(
					createPatch({
						attributePath: attributeIdStr,
						value: JSON.stringify(removedAggregateIds),
						patchOperation: PatchOperationType.REMOVE_ITEM,
					}),
				)
			}
			if (addedItems.length > 0) {
				patches.push(
					createPatch({
						attributePath: attributeIdStr,
						value: JSON.stringify(addedItems),
						patchOperation: PatchOperationType.ADD_ITEM,
					}),
				)
			}
			const areItemsIdentical = originalAggregatedEntities.every((item) => modifiedAggregatedEntities.some((element) => deepEqual(element, item)))
			if (
				isEmpty(addedItems) &&
				isEmpty(removedItems) &&
				areItemsIdentical &&
				!arrayEqualsWithPredicate(originalAggregatedEntities, modifiedAggregatedEntities, deepEqual)
			) {
				patches.push(
					createPatch({
						attributePath: attributeIdStr,
						value: JSON.stringify(modifiedAggregatedUntypedEntities),
						patchOperation: PatchOperationType.REPLACE,
					}),
				)
			}
		} else {
			// non aggregation associations

			const originalAssociationValue = originalInstance[attributeId].getNullWhenNull()?.getArray() ?? []
			const modifiedAssociationValue = modifiedInstance[attributeId].getNullWhenNull()?.getArray() ?? []
			let removedItemsPatch: Nullable<string> = null
			let addedItemsPatch: Nullable<string> = null

			if (modelAssociation.type === AssociationType.ListAssociation || modelAssociation.type === AssociationType.ElementAssociation) {
				const originalIds = originalAssociationValue.map((a) => a.getId())
				const modifiedIds = modifiedAssociationValue.map((a) => a.getId())
				const addedItems = modifiedIds.filter((element) => !originalIds.some((item) => isSameId(item, element)))
				const removedItems = originalIds.filter((element) => !modifiedIds.some((item) => isSameId(item, element)))
				removedItemsPatch = isNotEmpty(removedItems) ? JSON.stringify(removedItems) : null
				addedItemsPatch = isNotEmpty(addedItems) ? JSON.stringify(addedItems) : null
			} else if (
				modelAssociation.type === AssociationType.BlobElementAssociation ||
				modelAssociation.type === AssociationType.ListElementAssociationGenerated ||
				modelAssociation.type === AssociationType.ListElementAssociationCustom
			) {
				const originalIds = originalAssociationValue.map((a) => a.getidTuple())
				const modifiedIds = modifiedAssociationValue.map((a) => a.getidTuple())
				const addedItems = modifiedIds.filter((element) => !originalIds.some((item) => isSameIdTuple(item, element)))
				const removedItems = originalIds.filter((element) => !modifiedIds.some((item) => isSameIdTuple(item, element)))
				removedItemsPatch = isNotEmpty(removedItems) ? JSON.stringify(removedItems) : null
				addedItemsPatch = isNotEmpty(addedItems) ? JSON.stringify(addedItems) : null
			} else {
				throw new ProgrammingError("Unknown modelAssociation type: " + modelAssociation.type)
			}

			// Only Any associations support ADD_ITEM and REMOVE_ITEM operations
			// All cardinalities support REPLACE operation
			if (modelAssociation.cardinality === Cardinality.Any) {
				if (isNotNull(removedItemsPatch)) {
					patches.push(
						createPatch({
							attributePath: attributeIdStr,
							value: removedItemsPatch,
							patchOperation: PatchOperationType.REMOVE_ITEM,
						}),
					)
				}
				if (isNotNull(addedItemsPatch)) {
					patches.push(
						createPatch({
							attributePath: attributeIdStr,
							value: addedItemsPatch,
							patchOperation: PatchOperationType.ADD_ITEM,
						}),
					)
				}
			} else if (!deepEqual(originalAssociationValue, modifiedAssociationValue)) {
				patches.push(
					createPatch({
						attributePath: attributeIdStr,
						value: JSON.stringify(modifiedAssociationValue),
						patchOperation: PatchOperationType.REPLACE,
					}),
				)
			}
		}
	}

	return patches
}

function isDistinctAggregateIds(array: Array<Id>) {
	const checkSet = new Set(array)
	return checkSet.size === array.length
}
