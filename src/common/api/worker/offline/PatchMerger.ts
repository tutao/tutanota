// read from the offline db according to the list and element id on the entityUpdate
// decrypt encrypted fields using the OwnerEncSessionKey on the entry from the offline db
// apply patch operations using a similar logic from the server
// update the instance in the offline db

import {
	type ClientModelParsedInstance,
	type ClientTypeModel,
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
import { assertNotNull, Base64, deepEqual, getTypeString, isEmpty, isSameTypeRef, lazy, promiseMap, TypeRef } from "@tutao/tutanota-utils"
import { AttributeModel } from "../../common/AttributeModel"
import { CacheStorage } from "../rest/DefaultEntityRestCache"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { PatchOperationError } from "../../common/error/PatchOperationError"
import { AssociationType } from "../../common/EntityConstants"
import { PatchOperationType, TypeModelResolver } from "../../common/EntityFunctions"
import { InstancePipeline } from "../crypto/InstancePipeline"
import { isSameId, removeTechnicalFields } from "../../common/utils/EntityUtils"
import { convertDbToJsType } from "../crypto/ModelMapper"
import { decryptValue } from "../crypto/CryptoMapper"
import { AesKey, BitArray, extractIvFromCipherText } from "@tutao/tutanota-crypto"
import { CryptoFacade } from "../crypto/CryptoFacade"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { EntityUpdateData, getLogStringForPatches } from "../../common/utils/EntityUpdateUtils"
import { hasError } from "../../common/utils/ErrorUtils"
import { computePatches } from "../../common/utils/PatchGenerator"
import { FileTypeRef, MailTypeRef } from "../../entities/tutanota/TypeRefs"

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
			// We need to preserve the order of patches, so no promiseMap here
			for (const patch of patches) {
				const appliedSuccessfully = await this.applySinglePatch(parsedInstance, typeModel, patch)
				if (!appliedSuccessfully) {
					return null
				}
			}
			return parsedInstance
		}
		return null
	}

	public async patchAndStoreInstance(entityUpdate: EntityUpdateData): Promise<Nullable<ServerModelParsedInstance>> {
		const { typeRef, instanceListId, instanceId, patches, instance } = entityUpdate

		try {
			const patchAppliedInstance = await this.getPatchedInstanceParsed(typeRef, instanceListId, instanceId, assertNotNull(patches))
			if (patchAppliedInstance == null) {
				return null
			}
			if (entityUpdate !== null && instance !== null) {
				const isPatchAndAppliedInstanceMatch = await this.isInstanceOnUpdateIsSameAsPatched(entityUpdate, patchAppliedInstance)
				if (!isPatchAndAppliedInstanceMatch) {
					if (!hasError(instance)) {
						// we do not want to put the instance in the offline storage if there are _errors (when decrypting)
						await this.cacheStorage.put(typeRef, instance)
					}
					// There are concurrency issues with the File and Mail types due to bucketKey and UpdateSessionKeyService
					if (!isSameTypeRef(FileTypeRef, entityUpdate.typeRef) && !isSameTypeRef(MailTypeRef, entityUpdate.typeRef)) {
						throw new ProgrammingError(
							"instance with id [" + instanceListId + ", " + instanceId + `] has not been successfully patched. Type: ${getTypeString(typeRef)}`,
						)
					}
				} else {
					await this.cacheStorage.put(typeRef, patchAppliedInstance)
				}
			} else {
				await this.cacheStorage.put(typeRef, patchAppliedInstance)
			}
			return patchAppliedInstance
		} catch (e) {
			if (e instanceof PatchOperationError) {
				// returning null leads to reloading from the server, this fixes the broken entity in the offline storage with _errors
				return null
			}
			throw e
		}
	}

	private async applySinglePatch(parsedInstance: ServerModelParsedInstance, typeModel: ServerTypeModel, patch: Patch) {
		try {
			const pathList: Array<string> = patch.attributePath.split("/") //== /$mailId/$attrIdRecipient/${aggregateIdRecipient}/${attrIdName}
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
				let value: Nullable<ParsedValue | ParsedAssociation>
				if ((isAggregation && typeModel.encrypted) || isEncryptedValue) {
					const typeRef = new TypeRef(typeModel.app, typeModel.id)
					const instance = await this.instancePipeline.modelMapper.mapToInstance(typeRef, parsedInstance)
					const sk = await this.cryptoFacade().resolveSessionKey(instance)
					value = await this.decryptValueOnPatchIfNeeded(pathResult, encryptedParsedValue, sk)
				} else {
					value = await this.decryptValueOnPatchIfNeeded(pathResult, encryptedParsedValue, null)
				}
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
							const itemWithoutFinalIvs = removeTechnicalFields(structuredClone(item))
							const aggregateWithoutFinalIvs = removeTechnicalFields(structuredClone(aggregate))
							return (
								aggregate[aggregateIdAttributeId] === item[aggregateIdAttributeId] && !deepEqual(itemWithoutFinalIvs, aggregateWithoutFinalIvs)
							)
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

	private async decryptValueOnPatchIfNeeded(
		pathResult: PathResult,
		value: Nullable<EncryptedParsedValue | EncryptedParsedAssociation>,
		sk: Nullable<AesKey>,
	): Promise<Nullable<ParsedValue> | Nullable<ParsedAssociation>> {
		const { typeModel, attributeId } = pathResult
		const isValue = typeModel.values[attributeId] !== undefined
		const isAggregation = typeModel.associations[attributeId] !== undefined && typeModel.associations[attributeId].type === AssociationType.Aggregation
		if (isValue) {
			if (sk !== null) {
				const encryptedValueInfo = typeModel.values[attributeId] as ModelValue & { encrypted: true }
				const encryptedValue = value
				if (encryptedValue == null) {
					delete pathResult.instanceToChange._finalIvs[attributeId]
				} else if (encryptedValue === "") {
					// the encrypted value is "" if the decrypted value is the default value
					// storing this marker lets us restore that empty string when we re-encrypt the instance.
					// check out encrypt in CryptoMapper to see the other side of this.
					pathResult.instanceToChange._finalIvs[attributeId] = null
				} else if (encryptedValueInfo.final && encryptedValue) {
					// the server needs to be able to check if an encrypted final field changed.
					// that's only possible if we re-encrypt using a deterministic IV, because the ciphertext changes if
					// the IV or the value changes.
					// storing the IV we used for the initial encryption lets us reuse it later.
					pathResult.instanceToChange._finalIvs[attributeId] = extractIvFromCipherText(encryptedValue as Base64)
				}
				return decryptValue(encryptedValueInfo, encryptedValue as Base64, sk)
			}
			return value
		} else if (isAggregation) {
			const encryptedAggregatedEntities = value as Array<ServerModelEncryptedParsedInstance>
			const modelAssociation = typeModel.associations[attributeId]
			const appName = modelAssociation.dependency ?? typeModel.app
			const aggregationTypeModel = await this.typeModelResolver.resolveServerTypeReference(new TypeRef(appName, modelAssociation.refTypeId))
			return await this.instancePipeline.cryptoMapper.decryptAggregateAssociation(aggregationTypeModel, encryptedAggregatedEntities, sk)
		}

		return value // id and idTuple associations are never encrypted
	}

	private async traversePath(parsedInstance: ServerModelParsedInstance, serverTypeModel: ServerTypeModel, path: Array<string>): Promise<PathResult | null> {
		if (path.length === 0) {
			throw new PatchOperationError("Invalid attributePath, expected non-empty attributePath")
		}
		const pathItem = path.shift()!
		try {
			let attributeId: number
			if (env.networkDebugging) {
				attributeId = parseInt(pathItem.split(":")[0])
			} else {
				attributeId = parseInt(pathItem)
			}
			if (!Object.keys(parsedInstance).some((attribute) => attribute === attributeId.toString())) {
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

	private async isInstanceOnUpdateIsSameAsPatched(entityUpdate: EntityUpdateData, patchAppliedInstance: Nullable<ServerModelParsedInstance>) {
		if (!deepEqual(entityUpdate.instance, patchAppliedInstance)) {
			const instancePipeline = this.instancePipeline
			const typeModel = await this.typeModelResolver.resolveServerTypeReference(entityUpdate.typeRef)
			const typeReferenceResolver = this.typeModelResolver.resolveClientTypeReference.bind(this.typeModelResolver)
			let sk: Nullable<BitArray> = null
			if (typeModel.encrypted) {
				const instance = await this.instancePipeline.modelMapper.mapToInstance(
					new TypeRef(typeModel.app, typeModel.id),
					assertNotNull(patchAppliedInstance),
				)
				sk = await this.cryptoFacade().resolveSessionKey(instance)
			}
			const patchedEncryptedParsedInstance = await instancePipeline.cryptoMapper.encryptParsedInstance(
				typeModel as unknown as ClientTypeModel,
				assertNotNull(patchAppliedInstance) as unknown as ClientModelParsedInstance,
				sk,
			)
			const patchedUntypedInstance = await instancePipeline.typeMapper.applyDbTypes(
				typeModel as unknown as ClientTypeModel,
				patchedEncryptedParsedInstance,
			)
			const patchDiff = await computePatches(
				entityUpdate.instance as unknown as ClientModelParsedInstance,
				assertNotNull(patchAppliedInstance) as unknown as ClientModelParsedInstance,
				patchedUntypedInstance,
				typeModel,
				typeReferenceResolver,
				true,
			)
			const isPatchAndFullInstanceMatch = isEmpty(patchDiff)
			if (!isPatchAndFullInstanceMatch) {
				console.log("patches on the entityUpdate: ", getLogStringForPatches(assertNotNull(entityUpdate.patches)))
				console.error(
					"instance with id [" +
						entityUpdate.instanceListId +
						", " +
						entityUpdate.instanceId +
						"]" +
						`has not been successfully patched. Type: ${getTypeString(entityUpdate.typeRef)}, computePatches: ${getLogStringForPatches(patchDiff)}`,
				)
			}
			return isPatchAndFullInstanceMatch
		}
		return true
	}
}

export function distinctAssociations(associationArray: ParsedAssociation) {
	return associationArray.reduce((acc: Array<any>, current) => {
		if (
			!acc.some((item) => {
				if (item._finalIvs !== undefined) {
					const itemWithoutFinalIvs = removeTechnicalFields(structuredClone(item) as ParsedInstance)
					const currentWithoutFinalIvs = removeTechnicalFields(structuredClone(current) as ParsedInstance)
					return deepEqual(itemWithoutFinalIvs, currentWithoutFinalIvs)
				}
				return deepEqual(item, current)
			})
		) {
			acc.push(current)
		}
		return acc
	}, [])
}

export type PathResult = {
	instanceToChange: ServerModelParsedInstance
	attributeId: number
	typeModel: ServerTypeModel
}
