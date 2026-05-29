import {
	AssociationReprType,
	Cardinality,
	getAssociationReprType,
	IDENTITY_FIELDS,
	isSameId,
	isSameIdTuple,
	isSameTypeRef,
	ValueType,
	ValueTypeEnum,
} from "@tutao/meta"
import { ParsedValue } from "./ParsedValue"
import { createPatch, createPatchList, Patch, PatchList } from "@tutao/entities/sys"
import { arrayEquals, arrayEqualsWithPredicate, assert, assertNotNull, deepEqual, isEmpty, isNotEmpty, isNotNull, Nullable } from "@tutao/utils"
import { ProgrammingError } from "@tutao/app-env"
import { InstancePipeline } from "./InstancePipeline"
import { OutgoingServerJson } from "./TypeMapper"
import { DecryptedParsedInstance, DecryptedParsedValue, EncryptedParsedInstance } from "./CryptoMapper"

export const enum PatchOperationType {
	ADD_ITEM = "0",
	REMOVE_ITEM = "1",
	REPLACE = "2",
}

export class PatchGenerator {
	constructor(private readonly instancePipeline: InstancePipeline) {}

	// visible for testing
	public areValuesDifferent(valueType: ValueTypeEnum, originalParsedValue: DecryptedParsedValue, currentParsedValue: DecryptedParsedValue): boolean {
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
				return !arrayEquals(originalParsedValue.asByteArray(), currentParsedValue.asByteArray())
			case ValueType.Date:
				return originalParsedValue.asDate().valueOf() !== currentParsedValue.asDate().valueOf()
			case ValueType.Number:
			case ValueType.String:
			case ValueType.Boolean:
			case ValueType.CompressedString:
				return originalParsedValue.asString() !== currentParsedValue.asString()
			case ValueType.CustomId:
			case ValueType.GeneratedId:
				if (originalParsedValue.isString()) {
					return !isSameId(originalParsedValue.asId(), currentParsedValue.asId())
				} else if (typeof originalParsedValue === "object") {
					// FIXME: can value be an IdTuple?
					throw new ProgrammingError("// ")
				}
		}

		return false
	}

	public async computePatchPayload(
		originalInstance: DecryptedParsedInstance,
		currentInstance: DecryptedParsedInstance,
		currentInstanceEncrypted: EncryptedParsedInstance,
	): Promise<PatchList> {
		const patches = await this.computePatches(originalInstance, currentInstance, currentInstanceEncrypted)
		return createPatchList({ patches: patches })
	}

	/**
	 * visible for testing
	 * @param originalInstance Decrypted, used for comparison
	 * @param modifiedInstance Decrypted, used for comparison
	 * @param modifiedEncryptedInstance Encrypted, used as source for ciphertexts
	 */
	public async computePatches(
		originalInstance: DecryptedParsedInstance,
		modifiedInstance: DecryptedParsedInstance,
		modifiedEncryptedInstance: EncryptedParsedInstance,
	): Promise<Patch[]> {
		assert(
			isSameTypeRef(originalInstance.getTypeRef(), modifiedInstance.getTypeRef()) &&
				isSameTypeRef(modifiedInstance.getTypeRef(), modifiedEncryptedInstance.getTypeRef()),
			"Cannot compute patches of two  instance of different TypeRef",
		)

		const clientTypeModel = modifiedInstance.ensureOutgoing()
		let patches: Patch[] = []
		for (const modelValue of Object.values(clientTypeModel.values)) {
			const attributeId = modelValue.id
			if (IDENTITY_FIELDS.includes(modelValue.name) || modelValue.final) {
				continue
			}

			let originalParsedValue = originalInstance.getAttributeByIdOrNull(attributeId) ?? ParsedValue.fromNull()
			let modifiedParsedValue = modifiedInstance.getAttributeByIdOrNull(attributeId) ?? ParsedValue.fromNull()
			const encryptedParsedValue = modifiedEncryptedInstance.getAttributeByIdOrNull(attributeId) ?? ParsedValue.fromNull()

			if (this.areValuesDifferent(modelValue.type, originalParsedValue, modifiedParsedValue)) {
				assert(modifiedParsedValue.isNull() || modifiedParsedValue.isString(), "All values are either string or null")
				const value = encryptedParsedValue.getNullWhenNull()?.asString() ?? null
				patches.push(
					createPatch({
						attributePath: OutgoingServerJson.networkDebuggedKey(attributeId, clientTypeModel),
						patchOperation: PatchOperationType.REPLACE,
						value,
					}),
				)
			}
		}

		for (const modelAssociation of Object.values(clientTypeModel.associations)) {
			if (modelAssociation.final) {
				continue
			}
			const attributeId = modelAssociation.id
			const networkDebuggedAttributeId = OutgoingServerJson.networkDebuggedKey(attributeId, clientTypeModel)
			const associationReprType = getAssociationReprType(modelAssociation.type)

			if (associationReprType === AssociationReprType.Aggregation) {
				const originalAggregatedEntities = originalInstance.getAttributeByIdOrNull(attributeId)?.asNestedObjList() ?? []
				const modifiedAggregatedEntities = modifiedInstance.getAttributeByIdOrNull(attributeId)?.asNestedObjList() ?? []
				const modifiedAggregatedEncryptedEntities = modifiedEncryptedInstance.getAttributeByIdOrNull(attributeId)?.asNestedObjList() ?? []

				const modifiedAggregateIds = modifiedAggregatedEntities.map((instance) => instance.getAttributeByName("_id").asId())
				if (!this.isDistinctAggregateIds(modifiedAggregateIds)) {
					const modifiedInstanceId = modifiedInstance.getAttributeByName("_id").asId()
					throw new ProgrammingError(
						`Duplicate aggregate ids for association ${modelAssociation.name} in modified instance ${clientTypeModel.app}/${clientTypeModel.name} :  ${modifiedInstanceId}`,
					)
				}
				const { addedItems, removedItems, commonItems } = this.segregateAggregates(modifiedAggregatedEncryptedEntities, originalAggregatedEntities)

				if (
					(modelAssociation.cardinality !== Cardinality.Any && isEmpty(originalAggregatedEntities) !== isEmpty(modifiedAggregatedEntities)) ||
					(!isEmpty(originalAggregatedEntities) && !isEmpty(modifiedAggregatedEntities) && isEmpty(commonItems))
				) {
					const aggregatesAsJson = modifiedAggregatedEncryptedEntities.map((agg) => this.instancePipeline.typeMapper.makeServerJson(agg))
					patches.push(
						createPatch({
							attributePath: networkDebuggedAttributeId,
							value: OutgoingServerJson.getJsonRepresentationOfMultiple(await Promise.all(aggregatesAsJson)),
							patchOperation: PatchOperationType.REPLACE,
						}),
					)
					continue
				}

				const commonAggregateIds = commonItems.map((instance) => instance.getAttributeByName("_id").asId())
				for (const commonAggregateId of commonAggregateIds) {
					const commonItemOriginal =
						originalAggregatedEntities.find((instance) => isSameId(instance.getAttributeByName("_id").asId(), commonAggregateId)) ?? null
					const commonItemModified =
						modifiedAggregatedEntities.find((instance) => isSameId(instance.getAttributeByName("_id").asId(), commonAggregateId)) ?? null

					const commonItemModifiedEncrypted =
						modifiedAggregatedEncryptedEntities.find((instance) => isSameId(instance.getAttributeByName("_id").asId(), commonAggregateId)) ?? null
					const fullPath = `${attributeId.toString()}/${commonAggregateId}/`
					const items = (
						await this.computePatches(
							assertNotNull(commonItemOriginal),
							assertNotNull(commonItemModified),
							assertNotNull(commonItemModifiedEncrypted),
						)
					).map((item) => {
						return { ...item, attributePath: fullPath + item.attributePath } satisfies Patch
					})
					patches = patches.concat(items)
				}
				if (isNotEmpty(removedItems)) {
					const removedAggregateIds = removedItems.map((instance) => instance.getAttributeByName("_id").asId())
					patches.push(
						createPatch({
							attributePath: networkDebuggedAttributeId,
							value: OutgoingServerJson.stringifyIdList(removedAggregateIds),
							patchOperation: PatchOperationType.REMOVE_ITEM,
						}),
					)
				}
				if (isNotEmpty(addedItems)) {
					const addedItemsAsJson = addedItems.map((agg) => this.instancePipeline.typeMapper.makeServerJson(agg))
					patches.push(
						createPatch({
							attributePath: networkDebuggedAttributeId,
							value: OutgoingServerJson.getJsonRepresentationOfMultiple(await Promise.all(addedItemsAsJson)),
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
					const modifiedAggregatesJson = modifiedAggregatedEncryptedEntities.map((agg) => this.instancePipeline.typeMapper.makeServerJson(agg))
					patches.push(
						createPatch({
							attributePath: networkDebuggedAttributeId,
							value: OutgoingServerJson.getJsonRepresentationOfMultiple(await Promise.all(modifiedAggregatesJson)),
							patchOperation: PatchOperationType.REPLACE,
						}),
					)
				}
			} else {
				let addedItemsJson: Nullable<string> = null
				let removedItemsJson: Nullable<string> = null
				let modifiedIdsJson: Nullable<string> = null

				if (associationReprType === AssociationReprType.SingleId) {
					const modifiedIds = modifiedInstance.getAttributeByIdOrNull(attributeId)?.asIdList() ?? []
					const originalIds = originalInstance.getAttributeByIdOrNull(attributeId)?.asIdList() ?? []
					const addedItems = modifiedIds.filter((modifiedId) => !originalIds.some((originalId) => isSameId(originalId, modifiedId)))
					const removedItems = originalIds.filter((originalId) => !modifiedIds.some((modifiedId) => isSameId(originalId, modifiedId)))

					if (modelAssociation.cardinality === Cardinality.Any) {
						addedItemsJson = isNotEmpty(addedItems) ? OutgoingServerJson.stringifyIdList(addedItems) : null
						removedItemsJson = isNotEmpty(removedItems) ? OutgoingServerJson.stringifyIdList(removedItems) : null
					} else {
						modifiedIdsJson = isNotEmpty(addedItems) || isNotEmpty(removedItems) ? OutgoingServerJson.stringifyIdList(modifiedIds) : null
					}
				} else if (associationReprType === AssociationReprType.IdTuple) {
					const modifiedIdTuples = modifiedInstance.getAttributeByIdOrNull(attributeId)?.asIdTupleList() ?? []
					const originalIdTuples = originalInstance.getAttributeByIdOrNull(attributeId)?.asIdTupleList() ?? []
					const addedItems = modifiedIdTuples.filter((modifiedId) => !originalIdTuples.some((originalId) => isSameIdTuple(originalId, modifiedId)))
					const removedItems = originalIdTuples.filter((originalId) => !modifiedIdTuples.some((modifiedId) => isSameIdTuple(originalId, modifiedId)))

					if (modelAssociation.cardinality === Cardinality.Any) {
						addedItemsJson = isNotEmpty(addedItems) ? OutgoingServerJson.stringifyIdTupleList(addedItems) : null
						removedItemsJson = isNotEmpty(removedItems) ? OutgoingServerJson.stringifyIdTupleList(removedItems) : null
					} else {
						modifiedIdsJson = isNotEmpty(addedItems) || isNotEmpty(removedItems) ? OutgoingServerJson.stringifyIdTupleList(modifiedIdTuples) : null
					}
				}

				if (isNotNull(addedItemsJson)) {
					assert(modelAssociation.cardinality === Cardinality.Any, "Only ANY cardinality association supports ADD_ITEM patch operation")
					patches.push(createPatch({ attributePath: networkDebuggedAttributeId, value: addedItemsJson, patchOperation: PatchOperationType.ADD_ITEM }))
				}
				if (isNotNull(removedItemsJson)) {
					assert(modelAssociation.cardinality === Cardinality.Any, "Only ANY cardinality association supports REMOVE_ITEM patch operation")
					patches.push(
						createPatch({ attributePath: networkDebuggedAttributeId, value: removedItemsJson, patchOperation: PatchOperationType.REMOVE_ITEM }),
					)
				}
				if (isNotNull(modifiedIdsJson)) {
					patches.push(
						createPatch({ attributePath: networkDebuggedAttributeId, value: modifiedIdsJson, patchOperation: PatchOperationType.REMOVE_ITEM }),
					)
				}
			}
		}

		return patches
	}

	private segregateAggregates(modifiedEncryptedAggregates: Array<EncryptedParsedInstance>, originalAggregates: Array<DecryptedParsedInstance>) {
		const addedItems = modifiedEncryptedAggregates.filter((modifiedAggregatedEntity) => {
			const modifiedAggregatedId = modifiedAggregatedEntity.getAttributeByName("_id").asId()
			const existedInOriginalAggregate = originalAggregates.some((originalAggregatedEntity) => {
				const originalAggregatedId = originalAggregatedEntity.getAttributeByName("_id").asId()
				return isSameId(modifiedAggregatedId, originalAggregatedId)
			})
			return !existedInOriginalAggregate
		})

		const removedItems = originalAggregates.filter((originalAggregatedEntity) => {
			const originalAggregatedId = originalAggregatedEntity.getAttributeByName("_id").asId()
			const existsInModifiedAggregate = modifiedEncryptedAggregates.some((modifiedAggregatedEntity) => {
				const modifiedAggregatedId = modifiedAggregatedEntity.getAttributeByName("_id").asId()
				return isSameId(modifiedAggregatedId, originalAggregatedId)
			})
			return !existsInModifiedAggregate
		})

		const commonItems = originalAggregates.filter((originalAggregate) => {
			const originalAggregatedId = originalAggregate.getAttributeByName("_id").asId()
			const aggregateWasRemoved = removedItems.some((removedAggregate) => {
				const removeAggregateId = removedAggregate.getAttributeByName("_id").asId()
				return isSameId(removeAggregateId, originalAggregatedId)
			})
			return !aggregateWasRemoved
		})

		return { addedItems, removedItems, commonItems }
	}

	private isDistinctAggregateIds(array: Array<Id>) {
		const checkSet = new Set(array)
		return checkSet.size === array.length
	}
}
