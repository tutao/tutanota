// read from the offline db according to the list and element id on the entityUpdate
// decrypt encrypted fields using the OwnerEncSessionKey on the entry from the offline db
// apply patch operations using a similar logic from the server
// update the instance in the offline db

import { AssociationReprType, getAssociationRepresentationType, isSameSingleId, isSameTypeRef, TypeRef } from "../meta"
import { ParsedValue } from "./ParsedValue"
import { assertNotNull, deepEqual, isEmpty, isNotNull, KeyVersion, lazy, Nullable } from "@tutao/utils"
import {
	DecryptedParsedInstance,
	DecryptedParsedValue,
	EncryptedParsedValue,
	EntityAdapter,
	InstancePipeline,
	PatchOperationError,
} from "@tutao/instance-pipeline"
import { AesKey, InstanceDecryptor, InstanceTypeId, SymmetricCipherFacade, validateKdfNonceLength, VersionedEncryptedKey } from "@tutao/crypto"
import { CryptoError } from "@tutao/crypto/error"
import { Entity, ServerTypeModel } from "@tutao/meta"
import { PatchOperationType } from "./PatchGenerator.js"
import { TypeModelResolver } from "./EntityFunctions"
import { Patch, UserTypeRef } from "@tutao/entities/sys"
import { EntityUpdateData } from "./utils/EntityUpdateUtils"
import { IncomingServerJson } from "./TypeMapper"
import { ClientDetector } from "../app-env/boot/ClientDetector"

export interface OwnerKeyProvider {
	(ownerKeyVersion: KeyVersion): Promise<AesKey>
}
export interface OwnerEncSessionKeyProvider {
	(instanceElementId: Id, entity: Entity): Promise<VersionedEncryptedKey>
}

export interface SessionKeyResolver {
	/**
	 * Returns the session key for the provided type/instance:
	 * * null, if the instance is unencrypted
	 * * the decrypted _ownerEncSessionKey, if it is available
	 * * the public decrypted session key, otherwise
	 *
	 * @param instance The unencrypted (client-side) instance or encrypted (server-side) object literal
	 */
	resolveSessionKey(instance: Entity): Promise<Nullable<AesKey>>

	resolveSessionKeyWithOwnerKey(ownerKeyProvider: AesKey | null, migratedEntity: Entity): Promise<Nullable<AesKey>>

	resolveSessionKeyWithOwnerKeyProvider(ownerKeyProvider: OwnerKeyProvider | null, migratedEntity: Entity): Promise<Nullable<AesKey>>

	/**
	 * Returns the session key for the provided service response:
	 * * null, if the instance is unencrypted
	 * * the decrypted _ownerPublicEncSessionKey, if it is available
	 * @param instance The unencrypted (client-side) or encrypted (server-side) instance
	 *
	 */
	resolveServiceSessionKey(instance: EntityAdapter): Promise<AesKey | null>
}
/*
 * Note:
 * This is a subset of interface `CacheStorage`.
 *
 * In the next iteration:
 * we should extract the cacheStorage and/or offlineStorage into a separate package and reuse the ` CacheStorage ` interface
 */
export interface GetOrPutInstance {
	getParsed(typeRef: TypeRef<unknown>, listId: Id | null, id: Id): Promise<DecryptedParsedInstance | null>

	put(typeRef: TypeRef<unknown>, instance: DecryptedParsedInstance): Promise<void>
}

type PathResult = {
	instanceToChange: DecryptedParsedInstance
	attributeId: number
	typeModel: ServerTypeModel
}

export class PatchMerger {
	constructor(
		private readonly cacheStorage: GetOrPutInstance,
		public readonly instancePipeline: InstancePipeline,
		private readonly typeModelResolver: TypeModelResolver,
		private readonly sessionKeyResolver: lazy<SessionKeyResolver>,
		private readonly symmetricCipherFacade: SymmetricCipherFacade,
	) {}

	// visible for testing
	public async getPatchedInstanceParsed(
		instanceType: TypeRef<Entity>,
		listId: Nullable<Id>,
		elementId: Id,
		patches: Array<Patch>,
	): Promise<DecryptedParsedInstance | null> {
		const parsedInstance = await this.cacheStorage.getParsed(instanceType, listId, elementId)
		if (parsedInstance != null) {
			const typeModel = await this.typeModelResolver.resolveServerTypeReference(instanceType)

			const instance = await this.instancePipeline.modelMapper.mapToInstance(parsedInstance)
			const sk = await this.sessionKeyResolver().resolveSessionKey(instance)
			const ownerGroup = instance._ownerGroup ?? null
			const kdfNonce = validateKdfNonceLength(instance._kdfNonce ?? null)
			const instanceTypeId: InstanceTypeId = {
				app: instanceType.app,
				id: instanceType.typeId,
				name: instanceType.typeId.toString(),
			}
			const instanceDecryptor = this.symmetricCipherFacade.getInstanceDecryptor(sk, kdfNonce, instanceTypeId)
			// We need to preserve the order of patches, so no promiseMap here
			for (const patch of patches) {
				const appliedSuccessfully = await this.applySinglePatch(parsedInstance, typeModel, patch, ownerGroup, instanceDecryptor)
				if (!appliedSuccessfully) {
					return null
				}
			}
			return parsedInstance
		}
		return null
	}

	public async patchAndStoreInstance(entityUpdate: EntityUpdateData): Promise<Nullable<DecryptedParsedInstance>> {
		const { typeRef, instanceListId, instanceId, patches } = entityUpdate

		try {
			const patchAppliedInstance = await this.getPatchedInstanceParsed(typeRef, instanceListId, instanceId, assertNotNull(patches))
			if (patchAppliedInstance == null || patchAppliedInstance.hasError()) {
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
		parsedInstance: DecryptedParsedInstance,
		typeModel: ServerTypeModel,
		patch: Patch,
		ownerGroup: Nullable<Id>,
		instanceDecryptor: InstanceDecryptor,
	): Promise<boolean> {
		try {
			const pathList: Array<string> = patch.attributePath.split("/")
			const pathResult: PathResult | null = await this.traversePath(parsedInstance, typeModel, pathList)
			if (pathResult == null) {
				return false
			}

			switch (patch.patchOperation) {
				// REMOVE_ITEM is only allowed in associations. Patch value will always be Array<Id> or Array<IdTuple> which will not need decryption
				case PatchOperationType.REMOVE_ITEM: {
					const association = assertNotNull(pathResult.typeModel.associations[pathResult.attributeId], "Remove Item is only allowed in associations")
					switch (getAssociationRepresentationType(association.type)) {
						case AssociationReprType.IdTuple: {
							await this.applyPatchOperation(
								patch.patchOperation,
								pathResult,
								ParsedValue.fromIdTupleList(JSON.parse(assertNotNull(patch.value))),
							)
							break
						}
						case AssociationReprType.SingleId:
						case AssociationReprType.Aggregation: {
							await this.applyPatchOperation(patch.patchOperation, pathResult, ParsedValue.fromIdList(JSON.parse(assertNotNull(patch.value))))
						}
					}

					break
				}

				// In ADD_ITEM and REPLACE patch value can be anything and might need decryption
				case PatchOperationType.REPLACE:
				case PatchOperationType.ADD_ITEM: {
					const encryptedParsedValue = await this.parseValueOnPatch(pathResult, patch.value)
					const fieldPath: string = this.removeNetworkDebuggingSymbolsIfNeeded(patch.attributePath)
					const value = await this.decryptValueOnPatch(pathResult, encryptedParsedValue, ownerGroup, instanceDecryptor, fieldPath)
					await this.applyPatchOperation(patch.patchOperation, pathResult, value)
					break
				}
			}
			return true
		} catch (e) {
			throw new PatchOperationError(e)
		}
	}

	private removeNetworkDebuggingSymbolsIfNeeded(fieldPath: string): string {
		if (!ClientDetector.get().env.networkDebugging) {
			return fieldPath
		}
		return fieldPath
			.split("/")
			.map((pathItem) => pathItem.split(":")[0])
			.join("/")
	}

	private async applyPatchOperation(patchOperation: Values<PatchOperationType>, pathResult: PathResult, valueInPatchPayload: DecryptedParsedValue) {
		const { attributeId, instanceToChange, typeModel } = pathResult
		const isValue = isNotNull(typeModel.values[attributeId])
		const isAssociation = isNotNull(typeModel.associations[attributeId])
		const associationReprType = isAssociation ? getAssociationRepresentationType(typeModel.associations[attributeId].type) : null

		switch (patchOperation) {
			case PatchOperationType.ADD_ITEM: {
				if (isValue) {
					throw new PatchOperationError(
						"AddItem operation is supported for associations only, but the operation was called on value with id " + attributeId,
					)
				}
				const associationArray = instanceToChange.getAttributeById(attributeId).asArray()
				const valuesToAdd = valueInPatchPayload.asArray()
				const commonAssociationItems = instanceToChange
					.getAttributeById(attributeId)
					.asArray()
					.filter((association) => {
						return valuesToAdd.some((patchItem) => PatchMerger.isSameDecryptedParsedValue(association, patchItem))
					})

				// We fetch the latest state of the user immediately in LoginFacade#initSession, but we still receive
				// patches from the server for the group memberships of the user. This is fine, so we don't want to log it
				if (!isEmpty(commonAssociationItems) && !isSameTypeRef(UserTypeRef, new TypeRef(typeModel.app, typeModel.id))) {
					console.log(
						`PatchMerger attempted to add an already existing item to an association. Common items: ${JSON.stringify(commonAssociationItems)}`,
					)
				}
				const newAssociationValue = associationArray.concat(valuesToAdd)
				const distinctAggregates = this.distinctAssociations(newAssociationValue)
				if (associationReprType === AssociationReprType.Aggregation) {
					const hasAggregationsWithCommonIdsButDifferentValues = associationArray.some((aggregate) => {
						const aggregateId = aggregate.asNestedObj().getAttributeByName("_id").asId()
						return valuesToAdd.some((addedIem) => {
							const addedItemId = addedIem.asNestedObj().getAttributeByName("_id").asId()
							return isSameSingleId(aggregateId, addedItemId) && !PatchMerger.isSameDecryptedParsedValue(addedIem, aggregate)
						})
					})
					if (hasAggregationsWithCommonIdsButDifferentValues) {
						throw new PatchOperationError(
							`PatchMerger attempted to add an existing aggregate with different values. \
							existing items: ${JSON.stringify(associationArray)}, \
							values attempted to be added: ${JSON.stringify(valuesToAdd)}`,
						)
					}

					instanceToChange.addAttributeById(attributeId, ParsedValue.fromNestedItems(distinctAggregates.map((assoc) => assoc.asNestedObj())))
				} else if (associationReprType === AssociationReprType.IdTuple) {
					instanceToChange.addAttributeById(attributeId, ParsedValue.fromIdTupleList(distinctAggregates.map((assoc) => assoc.asIdTuple())))
				} else if (associationReprType === AssociationReprType.SingleId) {
					instanceToChange.addAttributeById(attributeId, ParsedValue.fromIdList(distinctAggregates.map((assoc) => assoc.asId())))
				}
				break
			}
			case PatchOperationType.REMOVE_ITEM: {
				if (isValue) {
					throw new PatchOperationError(
						"AddItem operation is supported for associations only, but the operation was called on value with id " + attributeId,
					)
				}
				const associationArray = instanceToChange.getAttributeById(attributeId).asArray()
				const idsToRemove = valueInPatchPayload.asArray()
				const remainingAggregations = associationArray.filter((currentAggregation) => {
					return !idsToRemove.some((removingAggregationId) => PatchMerger.isSameDecryptedParsedValue(currentAggregation, removingAggregationId))
				})
				const uniqueAssociations = this.distinctAssociations(remainingAggregations)

				if (associationReprType === AssociationReprType.Aggregation) {
					instanceToChange.addAttributeById(attributeId, ParsedValue.fromNestedItems(uniqueAssociations.map((item) => item.asNestedObj())))
				} else if (associationReprType === AssociationReprType.IdTuple) {
					instanceToChange.addAttributeById(attributeId, ParsedValue.fromIdTupleList(uniqueAssociations.map((item) => item.asIdTuple())))
				} else if (associationReprType === AssociationReprType.SingleId) {
					instanceToChange.addAttributeById(attributeId, ParsedValue.fromIdList(uniqueAssociations.map((item) => item.asId())))
				}
				break
			}
			case PatchOperationType.REPLACE: {
				if (isValue) {
					const newValue: DecryptedParsedValue = valueInPatchPayload.isNull()
						? ParsedValue.fromNull()
						: ParsedValue.fromString(valueInPatchPayload.asString())
					instanceToChange.addAttributeById(attributeId, newValue)
				} else if (associationReprType === AssociationReprType.Aggregation) {
					instanceToChange.addAttributeById(attributeId, ParsedValue.fromNestedItems(valueInPatchPayload.asNestedObjList()))
				} else if (associationReprType === AssociationReprType.IdTuple) {
					instanceToChange.addAttributeById(attributeId, ParsedValue.fromIdTupleList(valueInPatchPayload.asIdTupleList()))
				} else if (associationReprType === AssociationReprType.SingleId) {
					instanceToChange.addAttributeById(attributeId, ParsedValue.fromIdList(valueInPatchPayload.asIdList()))
				}
				break
			}
		}
	}

	private async parseValueOnPatch(pathResult: PathResult, value: string | null): Promise<EncryptedParsedValue> {
		const { typeModel, attributeId } = pathResult

		const isValue = isNotNull(typeModel.values[attributeId])
		if (isValue) {
			return isNotNull(value) ? ParsedValue.fromString(value) : ParsedValue.fromNull()
		}

		const associationValue = assertNotNull(value, "Patch for association will not be null")
		switch (getAssociationRepresentationType(typeModel.associations[attributeId].type)) {
			case AssociationReprType.Aggregation: {
				const assocModel = typeModel.associations[attributeId]
				const aggregateTypeRef = new TypeRef<any>(assocModel.dependency ?? typeModel.app, assocModel.refTypeId)
				const aggregatedModel = await this.typeModelResolver.resolveServerTypeReference(aggregateTypeRef)
				const encryptedAggregates = IncomingServerJson.expectMultipleInstance(associationValue, aggregatedModel).map((incomingJson) =>
					this.instancePipeline.typeMapper.parseServerJson(incomingJson),
				)
				return ParsedValue.fromNestedItems(await Promise.all(encryptedAggregates))
			}
			case AssociationReprType.IdTuple: {
				const idTupleList = JSON.parse(associationValue) as Array<IdTuple>
				return ParsedValue.fromIdTupleList(idTupleList)
			}
			case AssociationReprType.SingleId: {
				const idList = JSON.parse(associationValue) as Array<Id>
				return ParsedValue.fromIdList(idList)
			}
		}
	}

	private async decryptValueOnPatch(
		pathResult: PathResult,
		valueInPatchPayload: EncryptedParsedValue,
		ownerGroup: Nullable<Id>,
		instanceDecryptor: InstanceDecryptor,
		fieldPath: string,
	): Promise<DecryptedParsedValue> {
		const { typeModel, attributeId } = pathResult
		const isValue = isNotNull(typeModel.values[attributeId])

		if (isValue) {
			const encryptedValueInfo = typeModel.values[attributeId]
			return this.instancePipeline.cryptoMapper.decryptValue(
				encryptedValueInfo,
				valueInPatchPayload,
				instanceDecryptor,
				this.instancePipeline.cryptoMapper.makeOwnerKeyProvider(ownerGroup),
				fieldPath,
			)
		}

		const associationReprType = getAssociationRepresentationType(typeModel.associations[attributeId].type)
		switch (associationReprType) {
			case AssociationReprType.Aggregation: {
				const decryptedAggregates = await this.instancePipeline.cryptoMapper.decryptAggregateAssociation(
					valueInPatchPayload.asNestedObjList(),
					instanceDecryptor,
					this.instancePipeline.cryptoMapper.makeOwnerKeyProvider(ownerGroup),
					`${fieldPath}/`,
				)
				if (this.instancePipeline.cryptoMapper.containErrors(decryptedAggregates)) {
					// we do not want to apply a patch that failed decryption
					throw new CryptoError("Failed to decrypt aggregate on patch")
				}
				return ParsedValue.fromNestedItems(decryptedAggregates)
			}
			case AssociationReprType.IdTuple:
				return ParsedValue.fromIdTupleList(valueInPatchPayload.asIdTupleList())
			case AssociationReprType.SingleId:
				return ParsedValue.fromIdList(valueInPatchPayload.asIdList())
		}
	}

	private distinctAssociations(associationArray: Array<DecryptedParsedValue>): Array<DecryptedParsedValue> {
		return associationArray.reduce((acc: Array<DecryptedParsedValue>, current) => {
			const isAlreadyEncountered = acc.some((item) => PatchMerger.isSameDecryptedParsedValue(item, current))
			if (!isAlreadyEncountered) acc.push(current)
			return acc
		}, [])
	}

	private async traversePath(parsedInstance: DecryptedParsedInstance, serverTypeModel: ServerTypeModel, path: Array<string>): Promise<PathResult | null> {
		if (path.length === 0) {
			throw new PatchOperationError("Invalid attributePath, expected non-empty attributePath")
		}
		const pathItem = path.shift()!
		try {
			let attributeId: number
			const attributeIdsInServerTypeModel = Object.keys(serverTypeModel.values).concat(Object.keys(serverTypeModel.associations))
			if (ClientDetector.get().env.networkDebugging) {
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

			const modelAssociation = serverTypeModel.associations[attributeId]
			const associationReprTime = getAssociationRepresentationType(modelAssociation.type)
			if (associationReprTime !== AssociationReprType.Aggregation) {
				throw new PatchOperationError("Expected the attribute id " + attributeId + " to be an aggregate on the type: " + serverTypeModel.name)
			}

			const appName = modelAssociation.dependency ?? serverTypeModel.app
			const aggregationTypeModel = await this.typeModelResolver.resolveServerTypeReference(new TypeRef(appName, modelAssociation.refTypeId))

			const maybeAggregateIdPathItem = path.shift() ?? null
			const aggregateArray = parsedInstance.getAttributeById(attributeId).asNestedObjList()
			const aggregatedEntity = assertNotNull(
				aggregateArray.find((entity) => {
					return isSameSingleId(maybeAggregateIdPathItem, entity.getAttributeByName("_id").asId())
				}),
			)
			return this.traversePath(aggregatedEntity, aggregationTypeModel, path)
		} catch (e) {
			throw new PatchOperationError("An error occurred while traversing path " + path + e.message)
		}
	}

	private static isSameDecryptedParsedValue(first: DecryptedParsedValue, second: DecryptedParsedValue): boolean {
		return deepEqual(first, second)
	}
}
