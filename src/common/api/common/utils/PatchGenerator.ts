import { ClientModelEncryptedParsedInstance, ClientModelParsedInstance, ClientModelUntypedInstance, ParsedValue, TypeModel, UntypedValue } from "../EntityTypes"
import { ClientTypeReferenceResolver, PatchOperationType } from "../EntityFunctions"
import { createPatch, createPatchList, Patch, PatchList } from "../../entities/sys/TypeRefs"
import { AssociationType, Cardinality, ValueType } from "../EntityConstants"
import { assertNotNull, deepEqual, Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { arrayEquals, arrayEqualsWithPredicate, isEmpty, TypeRef } from "@tutao/tutanota-utils"
import { AttributeModel } from "../AttributeModel"
import { ProgrammingError } from "../error/ProgrammingError"
import { IDENTITY_FIELDS, isSameId } from "./EntityUtils"

// visible for testing
export function areValuesDifferent(
	valueType: Values<typeof ValueType>,
	originalParsedValue: Nullable<ParsedValue>,
	currentParsedValue: Nullable<ParsedValue>,
): boolean {
	if (originalParsedValue === null && currentParsedValue === null) {
		return false
	}
	const valueChangedToOrFromNull =
		(originalParsedValue === null && currentParsedValue !== null) || (currentParsedValue === null && originalParsedValue !== null)
	if (valueChangedToOrFromNull) {
		return true
	}

	switch (valueType) {
		case ValueType.Bytes:
			return !arrayEquals(originalParsedValue as Uint8Array, currentParsedValue as Uint8Array)
		case ValueType.Date:
			return originalParsedValue?.valueOf() !== currentParsedValue?.valueOf()
		case ValueType.Number:
		case ValueType.String:
		case ValueType.Boolean:
		case ValueType.CompressedString:
			return originalParsedValue !== currentParsedValue
		case ValueType.CustomId:
		case ValueType.GeneratedId:
			if (typeof originalParsedValue === "string") {
				return !isSameId(originalParsedValue as Id, currentParsedValue as Id)
			} else if (typeof originalParsedValue === "object") {
				return !isSameId(originalParsedValue as IdTuple, currentParsedValue as IdTuple)
			}
	}

	return false
}

export async function computePatchPayload(
	originalInstance: ClientModelParsedInstance | ClientModelEncryptedParsedInstance,
	currentInstance: ClientModelParsedInstance | ClientModelEncryptedParsedInstance,
	currentUntypedInstance: ClientModelUntypedInstance,
	typeModel: TypeModel,
	typeReferenceResolver: ClientTypeReferenceResolver,
	isNetworkDebuggingEnabled: boolean,
): Promise<PatchList> {
	const patches = await computePatches(originalInstance, currentInstance, currentUntypedInstance, typeModel, typeReferenceResolver, isNetworkDebuggingEnabled)
	return createPatchList({ patches: patches })
}

// visible for testing
export async function computePatches(
	originalInstance: ClientModelParsedInstance | ClientModelEncryptedParsedInstance,
	modifiedInstance: ClientModelParsedInstance | ClientModelEncryptedParsedInstance,
	modifiedUntypedInstance: ClientModelUntypedInstance,
	typeModel: TypeModel,
	typeReferenceResolver: ClientTypeReferenceResolver,
	isNetworkDebuggingEnabled: boolean,
): Promise<Patch[]> {
	let patches: Patch[] = []
	for (const [valueIdStr, modelValue] of Object.entries(typeModel.values)) {
		if (IDENTITY_FIELDS.includes(modelValue.name)) {
			continue
		}
		const attributeId = parseInt(valueIdStr)
		let attributeIdStr = valueIdStr
		if (env.networkDebugging) {
			// keys are in the format attributeId:attributeName when networkDebugging is enabled
			attributeIdStr += ":" + modelValue.name
		}
		let originalParsedValue = originalInstance[attributeId] as Nullable<ParsedValue>
		let modifiedParsedValue = modifiedInstance[attributeId] as Nullable<ParsedValue>
		let modifiedUntypedValue = modifiedUntypedInstance[attributeIdStr] as UntypedValue
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

		if (modelAssociation.type == AssociationType.Aggregation) {
			const appName = modelAssociation.dependency ?? typeModel.app
			const typeId = modelAssociation.refTypeId
			const aggregateTypeModel = await typeReferenceResolver(new TypeRef(appName, typeId))
			const originalAggregatedEntities = (originalInstance[attributeId] ?? []) as Array<ClientModelParsedInstance>
			const modifiedAggregatedEntities = (modifiedInstance[attributeId] ?? []) as Array<ClientModelParsedInstance>
			const modifiedAggregatedUntypedEntities = (modifiedUntypedInstance[attributeIdStr] ?? []) as Array<ClientModelUntypedInstance>

			const modifiedAggregateIds = modifiedAggregatedEntities.map(
				(instance) => instance[assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))] as Id,
			)
			if (!isDistinctAggregateIds(modifiedAggregateIds)) {
				throw new ProgrammingError(
					"Duplicate aggregate ids in the modified instance: " + AttributeModel.getAttribute(modifiedInstance, "_id", typeModel),
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
						return isSameId(item[aggregateIdAttributeId] as Id, element[aggregateIdAttributeIdStr] as Id)
					}),
			)

			const removedItems = originalAggregatedEntities.filter(
				(element) =>
					!modifiedAggregatedEntities.some((item) => {
						const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))
						return isSameId(item[aggregateIdAttributeId] as Id, element[aggregateIdAttributeId] as Id)
					}),
			)

			const commonItems = originalAggregatedEntities.filter(
				(element) =>
					!removedItems.some((item) => {
						const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))
						return isSameId(item[aggregateIdAttributeId] as Id, element[aggregateIdAttributeId] as Id)
					}),
			)

			const commonAggregateIds = commonItems.map((instance) => instance[assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))] as Id)
			for (let commonAggregateId of commonAggregateIds) {
				const commonItemOriginal = assertNotNull(
					originalAggregatedEntities.find((instance) => {
						const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))
						return isSameId(instance[aggregateIdAttributeId] as Id, commonAggregateId)
					}),
				)
				const commonItemModified = assertNotNull(
					modifiedAggregatedEntities.find((instance) => {
						const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))
						return isSameId(instance[aggregateIdAttributeId] as Id, commonAggregateId)
					}),
				)
				const commonItemModifiedUntyped = assertNotNull(
					modifiedAggregatedUntypedEntities.find((instance) => {
						const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))
						let aggregateIdAttributeIdStr = aggregateIdAttributeId.toString()
						if (env.networkDebugging) {
							// keys are in the format attributeId:attributeName when networkDebugging is enabled
							aggregateIdAttributeIdStr += ":" + "_id"
						}
						return isSameId(instance[aggregateIdAttributeIdStr] as Id, commonAggregateId)
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
				const removedAggregateIds = removedItems.map(
					(instance) => instance[assertNotNull(AttributeModel.getAttributeId(aggregateTypeModel, "_id"))] as Id,
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
			const originalAssociationValue = (originalInstance[attributeId] ?? []) as Array<Id | IdTuple>
			const modifiedAssociationValue = (modifiedInstance[attributeId] ?? []) as Array<Id | IdTuple>
			const addedItems = modifiedAssociationValue.filter((element) => !originalAssociationValue.some((item) => isSameId(item, element)))
			const removedItems = originalAssociationValue.filter((element) => !modifiedAssociationValue.some((item) => isSameId(item, element)))

			// Only Any associations support ADD_ITEM and REMOVE_ITEM operations
			// All cardinalities support REPLACE operation
			if (modelAssociation.cardinality == Cardinality.Any) {
				if (removedItems.length > 0) {
					patches.push(
						createPatch({
							attributePath: attributeIdStr,
							value: JSON.stringify(removedItems),
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
