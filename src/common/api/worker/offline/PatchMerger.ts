// read from the offline db according to the list and element id on the entityUpdate
// decrypt encrypted fields using the OwnerEncSessionKey on the entry from the offline db
// apply patch operations using a similar logic from the server
// update the instance in the offline db

import {
	EncryptedParsedAssociation,
	EncryptedParsedValue,
	Entity,
	ModelValue,
	ParsedAssociation,
	ParsedInstance,
	ParsedValue,
	ServerModelEncryptedParsedInstance,
	ServerModelParsedInstance,
	ServerModelUntypedInstance,
	ServerTypeModel,
} from "../../common/EntityTypes"
import { Patch } from "../../entities/sys/TypeRefs"
import { assertNotNull, Base64, deepEqual, isEmpty, lazy, Nullable, promiseMap, TypeRef } from "@tutao/tutanota-utils"
import { AttributeModel } from "../../common/AttributeModel"
import { CacheStorage } from "../rest/DefaultEntityRestCache"
import { PatchOperationError } from "../../common/error/PatchOperationError"
import { AssociationType } from "../../common/EntityConstants"
import { PatchOperationType, TypeModelResolver } from "../../common/EntityFunctions"
import { InstancePipeline } from "../crypto/InstancePipeline"
import { isSameId, removeTechnicalFields } from "../../common/utils/EntityUtils"
import { convertDbToJsType } from "../crypto/ModelMapper"
import { decryptValue } from "../crypto/CryptoMapper"
import { AesKey, extractIvFromCipherText } from "@tutao/tutanota-crypto"
import { CryptoFacade } from "../crypto/CryptoFacade"
import { EntityUpdateData } from "../../common/utils/EntityUpdateUtils"
import { hasError } from "../../common/utils/ErrorUtils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"

export class PatchMerger {
	constructor(
		private readonly cacheStorage: CacheStorage,
		public readonly instancePipeline: InstancePipeline,
		private readonly typeModelResolver: TypeModelResolver,
		private readonly cryptoFacade: lazy<CryptoFacade>,
	) {}

	// visible for testing
	public async getPatchedInstanceParsed(
		instanceType: TypeRef<Entity>,
		listId: Nullable<Id>,
		elementId: Id,
		patches: Array<Patch>,
	): Promise<ServerModelParsedInstance | null> {
		const parsedInstance = await this.cacheStorage.getParsed(instanceType, listId, elementId)
		if (parsedInstance != null) {
			const typeModel = await this.typeModelResolver.resolveServerTypeReference(instanceType)

			const instance = await this.instancePipeline.modelMapper.mapToInstance(instanceType, parsedInstance)
			const sk = await this.cryptoFacade().resolveSessionKey(instance)
			// We need to preserve the order of patches, so no promiseMap here
			for (const patch of patches) {
				const appliedSuccessfully = await this.applySinglePatch(parsedInstance, typeModel, patch, sk)
				if (!appliedSuccessfully) {
					return null
				}
			}
			return parsedInstance
		}
		return null
	}

	public async patchAndStoreInstance(entityUpdate: EntityUpdateData): Promise<Nullable<ServerModelParsedInstance>> {
		const { typeRef, instanceListId, instanceId, patches } = entityUpdate

		try {
			const patchAppliedInstance = await this.getPatchedInstanceParsed(typeRef, instanceListId, instanceId, assertNotNull(patches))
			if (patchAppliedInstance == null || hasError(patchAppliedInstance)) {
				return null
			}
			await this.cacheStorage.put(typeRef, patchAppliedInstance)
			return patchAppliedInstance
		} catch (e) {
			// returning null leads to reloading from the server, this fixes the broken entity in the offline storage
			return null
		}
	}

	private async applySinglePatch(
		parsedInstance: ServerModelParsedInstance,
		typeModel: ServerTypeModel,
		patch: Patch,
		sk: Nullable<AesKey>,
	): Promise<boolean> {
		try {
			const pathList: Array<string> = patch.attributePath.split("/")
			const pathResult: PathResult | null = await this.traversePath(parsedInstance, typeModel, pathList)
			if (pathResult == null) {
				return false
			}
			const attributeId = pathResult.attributeId

			const pathResultTypeModel = pathResult.typeModel
			// We need to map and decrypt for REPLACE and ADDITEM as the payloads are encrypted, REMOVEITEM only has either aggregate ids, generated ids, or id tuples
			if (patch.patchOperation !== PatchOperationType.REMOVE_ITEM) {
				const encryptedParsedValue: Nullable<EncryptedParsedValue | EncryptedParsedAssociation> = await this.parseValueOnPatch(pathResult, patch.value)

				const isAggregation = pathResultTypeModel.associations[attributeId]?.type === AssociationType.Aggregation
				const isEncryptedValue = pathResultTypeModel.values[attributeId]?.encrypted
				const needsDecryption = ((isAggregation && typeModel.encrypted) || isEncryptedValue) && sk != null
				const value = needsDecryption ? await this.decryptValueOnPatch(pathResult, encryptedParsedValue, sk) : encryptedParsedValue
				await this.applyPatchOperation(patch.patchOperation, pathResult, value)
			} else {
				let idArray = JSON.parse(patch.value!) as Array<any>
				await this.applyPatchOperation(patch.patchOperation, pathResult, idArray)
			}
			return true
		} catch (e) {
			throw new PatchOperationError(e)
		}
	}

	private async applyPatchOperation(
		patchOperation: Values<PatchOperationType>,
		pathResult: PathResult,
		value: Nullable<ParsedValue | ParsedAssociation> | Array<Id | IdTuple>,
	) {
		const { attributeId, instanceToChange, typeModel } = pathResult
		const isValue = typeModel.values[attributeId] !== undefined
		const isAssociation = typeModel.associations[attributeId] !== undefined
		const isAggregationAssociation = isAssociation && typeModel.associations[attributeId].type === AssociationType.Aggregation
		switch (patchOperation) {
			case PatchOperationType.ADD_ITEM: {
				if (isValue) {
					throw new PatchOperationError(
						"AddItem operation is supported for associations only, but the operation was called on value with id " + attributeId,
					)
				}
				let associationArray = instanceToChange[attributeId] as ParsedAssociation
				const valuesToAdd = value as ParsedAssociation
				const commonAssociationItems = associationArray.filter((association) => valuesToAdd.some((item) => deepEqual(item, association)))
				if (!isEmpty(commonAssociationItems)) {
					console.log(
						`PatchMerger attempted to add an already existing item to an association. Common items: ${JSON.stringify(commonAssociationItems)}`,
					)
				}
				if (isAggregationAssociation) {
					const modelAssociation = typeModel.associations[attributeId]
					const appName = modelAssociation.dependency ?? typeModel.app
					const aggregationTypeModel = await this.typeModelResolver.resolveServerTypeReference(new TypeRef(appName, modelAssociation.refTypeId))
					const aggregationsWithCommonIdsButDifferentValues = associationArray.filter((aggregate: ParsedInstance) =>
						valuesToAdd.some((item: ParsedInstance) => {
							const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregationTypeModel, "_id"))
							return aggregate[aggregateIdAttributeId] === item[aggregateIdAttributeId] && !deepEqual(item, aggregate)
						}),
					)
					if (!isEmpty(aggregationsWithCommonIdsButDifferentValues)) {
						throw new PatchOperationError(
							`PatchMerger attempted to add an existing aggregate with different values.  
							existing items: ${JSON.stringify(associationArray)}, 
							values attempted to be added: ${JSON.stringify(valuesToAdd)}`,
						)
					}
				}
				const newAssociationValue = associationArray.concat(valuesToAdd)
				instanceToChange[attributeId] = distinctAssociations(newAssociationValue)
				break
			}
			case PatchOperationType.REMOVE_ITEM: {
				if (isValue) {
					throw new PatchOperationError(
						"AddItem operation is supported for associations only, but the operation was called on value with id " + attributeId,
					)
				}
				if (!isAggregationAssociation) {
					const associationArray = instanceToChange[attributeId] as Array<Id | IdTuple>
					const idsToRemove = value as Array<Id | IdTuple>
					const remainingAssociations = associationArray.filter(
						(element) =>
							!idsToRemove.some((item) => {
								return isSameId(element, item) // use is same id on the ids instead
							}),
					)
					instanceToChange[attributeId] = distinctAssociations(remainingAssociations)
				} else {
					const modelAssociation = typeModel.associations[attributeId]
					const appName = modelAssociation.dependency ?? typeModel.app
					const aggregationTypeModel = await this.typeModelResolver.resolveServerTypeReference(new TypeRef(appName, modelAssociation.refTypeId))
					const aggregationArray = instanceToChange[attributeId] as Array<ParsedInstance>
					const idsToRemove = value as Array<Id>
					const remainingAggregations = aggregationArray.filter(
						(element) =>
							!idsToRemove.some((item) => {
								const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregationTypeModel, "_id"))
								return isSameId(item as Id, element[aggregateIdAttributeId] as Id)
							}),
					)
					instanceToChange[attributeId] = distinctAssociations(remainingAggregations)
				}
				break
			}
			case PatchOperationType.REPLACE: {
				if (isValue) {
					instanceToChange[attributeId] = value as ParsedValue
				} else if (isAssociation) {
					instanceToChange[attributeId] = value as ParsedAssociation
				}
				break
			}
		}
	}

	private async parseValueOnPatch(
		pathResult: PathResult,
		value: string | null,
	): Promise<Nullable<EncryptedParsedValue> | Nullable<EncryptedParsedAssociation>> {
		const { typeModel, attributeId } = pathResult
		const isValue = typeModel.values[attributeId] !== undefined
		const isAssociation = typeModel.associations[attributeId] !== undefined
		const isAggregation = isAssociation && typeModel.associations[attributeId].type === AssociationType.Aggregation
		const isNonAggregateAssociation = isAssociation && !isAggregation
		if (isValue) {
			const valueInfo = typeModel.values[attributeId]
			const valueType = valueInfo.type
			if (value == null || value === "" || valueInfo.encrypted) {
				return value
			} else {
				return convertDbToJsType(valueType, value)
			}
		} else if (isAssociation) {
			if (isNonAggregateAssociation) {
				return JSON.parse(value!)
			} else {
				const aggregatedEntities = JSON.parse(value!) as Array<ServerModelUntypedInstance>
				aggregatedEntities.map(AttributeModel.removeNetworkDebuggingInfoIfNeeded)
				const modelAssociation = typeModel.associations[attributeId]
				const appName = modelAssociation.dependency ?? typeModel.app
				const aggregationTypeModel = await this.typeModelResolver.resolveServerTypeReference(new TypeRef(appName, modelAssociation.refTypeId))
				return await promiseMap(
					aggregatedEntities,
					async (entity: ServerModelUntypedInstance) => await this.instancePipeline.typeMapper.applyJsTypes(aggregationTypeModel, entity),
				)
			}
		}

		return null
	}

	private async decryptValueOnPatch(
		pathResult: PathResult,
		value: Nullable<EncryptedParsedValue | EncryptedParsedAssociation>,
		sk: AesKey,
	): Promise<Nullable<ParsedValue> | Nullable<ParsedAssociation>> {
		const { typeModel, attributeId } = pathResult
		const isValue = typeModel.values[attributeId] !== undefined
		const isAggregation = typeModel.associations[attributeId] !== undefined && typeModel.associations[attributeId].type === AssociationType.Aggregation
		if (isValue) {
			const encryptedValueInfo = typeModel.values[attributeId] as ModelValue & { encrypted: true }
			return decryptValue(encryptedValueInfo, value as Base64, sk)
		} else if (isAggregation) {
			const encryptedAggregatedEntities = value as Array<ServerModelEncryptedParsedInstance>
			const modelAssociation = typeModel.associations[attributeId]
			const appName = modelAssociation.dependency ?? typeModel.app
			const aggregationTypeModel = await this.typeModelResolver.resolveServerTypeReference(new TypeRef(appName, modelAssociation.refTypeId))
			const decryptedAggregates = await this.instancePipeline.cryptoMapper.decryptAggregateAssociation(
				aggregationTypeModel,
				encryptedAggregatedEntities,
				sk,
			)
			if (this.instancePipeline.cryptoMapper.containErrors(decryptedAggregates)) {
				// we do not want to apply a patch that failed decryption
				throw new CryptoError("Failed to decrypt aggregate on patch")
			}
			return decryptedAggregates
		} else {
			return value
		}
	}

	private async traversePath(parsedInstance: ServerModelParsedInstance, serverTypeModel: ServerTypeModel, path: Array<string>): Promise<PathResult | null> {
		if (path.length === 0) {
			throw new PatchOperationError("Invalid attributePath, expected non-empty attributePath")
		}
		const pathItem = path.shift()!
		try {
			let attributeId: number
			const attributeIdsInServerTypeModel = Object.keys(serverTypeModel.values).concat(Object.keys(serverTypeModel.associations))
			if (env.networkDebugging) {
				attributeId = parseInt(pathItem.split(":")[0])
			} else {
				attributeId = parseInt(pathItem)
			}
			if (!attributeIdsInServerTypeModel.some((attribute) => attribute === attributeId.toString())) {
				// this would mean server sent an attribute id not in the current activated server schema
				// this should not happen, and returning null would trigger a reload from the server
				return null
			}

			if (path.length === 0) {
				return {
					attributeId: attributeId,
					instanceToChange: parsedInstance,
					typeModel: serverTypeModel,
				} as PathResult
			}

			const isAggregation = serverTypeModel.associations[attributeId].type === AssociationType.Aggregation
			if (!isAggregation) {
				throw new PatchOperationError("Expected the attribute id " + attributeId + " to be an aggregate on the type: " + serverTypeModel.name)
			}

			const modelAssociation = serverTypeModel.associations[attributeId]
			const appName = modelAssociation.dependency ?? serverTypeModel.app
			const aggregationTypeModel = await this.typeModelResolver.resolveServerTypeReference(new TypeRef(appName, modelAssociation.refTypeId))

			const maybeAggregateIdPathItem = path.shift()!
			const aggregateArray = parsedInstance[attributeId] as Array<ServerModelParsedInstance>
			const aggregatedEntity = assertNotNull(
				aggregateArray.find((entity) => {
					const aggregateIdAttributeId = assertNotNull(AttributeModel.getAttributeId(aggregationTypeModel, "_id"))
					return isSameId(maybeAggregateIdPathItem, entity[aggregateIdAttributeId] as Id)
				}),
			)
			return this.traversePath(aggregatedEntity, aggregationTypeModel, path)
		} catch (e) {
			throw new PatchOperationError("An error occurred while traversing path " + path + e.message)
		}
	}
}

export function distinctAssociations(associationArray: ParsedAssociation) {
	return associationArray.reduce((acc: Array<any>, current) => {
		if (!acc.some((item) => deepEqual(item, current))) {
			if (current != null) {
				acc.push(current)
			}
		}
		return acc
	}, [])
}

export type PathResult = {
	instanceToChange: ServerModelParsedInstance
	attributeId: number
	typeModel: ServerTypeModel
}
