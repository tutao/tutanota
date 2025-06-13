// read from the offline db according to the list and element id on the entityUpdate
// decrypt encrypted fields using the OwnerEncSessionKey on the entry from the offline db
// apply patch operations using a similar logic from the server
// update the instance in the offline db

import {
	EncryptedParsedAssociation,
	EncryptedParsedValue,
	Entity,
	ParsedAssociation,
	ParsedValue,
	ServerModelParsedInstance,
	ServerTypeModel,
	TypeModel,
} from "../../common/EntityTypes"
import { Patch } from "../../entities/sys/TypeRefs"
import { assertNotNull, deepEqual, promiseMap, TypeRef } from "@tutao/tutanota-utils"
import { AttributeModel } from "../../common/AttributeModel"
import { CacheStorage } from "../rest/DefaultEntityRestCache"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { PatchOperationError } from "../../common/error/PatchOperationError"
import { AssociationType } from "../../common/EntityConstants"
import { PatchOperationType, ServerTypeModelResolver } from "../../common/EntityFunctions"
import { InstancePipeline } from "../crypto/InstancePipeline"

export class PatchMerger {
	constructor(
		private readonly cacheStorage: CacheStorage,
		private readonly instancePipeline: InstancePipeline,
		private readonly serverTypeResolver: ServerTypeModelResolver,
	) {}

	public async getPatchedInstance<T extends Entity>(
		instanceType: TypeRef<T>,
		listId: Nullable<Id>,
		elementId: Id,
		patches: Array<Patch>,
	): Promise<Nullable<T>> {
		const instanceParsed = await this.getPatchedInstanceParsed(instanceType, listId, elementId, patches)
		if (instanceParsed != null) {
			return await this.instancePipeline.modelMapper.mapToInstance<T>(instanceType, instanceParsed)
		}
		return null
	}

	public async getPatchedInstanceParsed(
		instanceType: TypeRef<Entity>,
		listId: Nullable<Id>,
		elementId: Id,
		patches: Array<Patch>,
	): Promise<ServerModelParsedInstance | null> {
		const parsedInstance = await this.cacheStorage.getParsed(instanceType, listId, elementId)
		if (parsedInstance != null) {
			const typeModel = await this.serverTypeResolver.resolveServerTypeReference(instanceType)
			await promiseMap(patches, async (patch) => this.applySinglePatch(parsedInstance, typeModel, patch))
			return parsedInstance
		}
		return null
	}

	public async storePatchedInstance(instanceType: TypeRef<Entity>, listId: Nullable<Id>, elementId: Id, patches: Array<Patch>): Promise<void> {
		const patchAppliedInstance = await this.getPatchedInstanceParsed(instanceType, listId, elementId, patches)
		await this.cacheStorage.put(instanceType, patchAppliedInstance)
	}

	private async applySinglePatch(parsedInstance: ServerModelParsedInstance, typeModel: ServerTypeModel, patch: Patch) {
		const pathList = patch.attributePath.split("/")
		const pathResult: PathResult = this.traversePath(parsedInstance, typeModel, pathList)
		// get the AggregateTypeModel instead of the typeModel of the root entity and use that from this point on
		const encryptedParsedValue: EncryptedParsedValue | EncryptedParsedAssociation = this.parseValueOnPatch(pathResult, typeModel, patch.value)
		const value: ParsedValue | ParsedAssociation = this.decryptValueOnPatchIfNeeded(pathResult, typeModel, encryptedParsedValue)

		switch (patch.patchOperation) {
			case PatchOperationType.ADD_ITEM: {
				const associationArray = pathResult.instanceToChange[pathResult.attributeId] as Array<any>
				const valuesToAdd = value as ParsedAssociation
				associationArray.push(valuesToAdd)
				break
			}
			case PatchOperationType.REMOVE_ITEM: {
				const associationArray = pathResult.instanceToChange[pathResult.attributeId] as Array<any>
				const valuesToRemove = value as ParsedAssociation
				const difference = associationArray.filter(
					(element) =>
						!valuesToRemove.some((item) => {
							deepEqual(element, item)
						}),
				)
				pathResult.instanceToChange[pathResult.attributeId] = difference
				break
			}
			case PatchOperationType.REPLACE: {
				const valueToReplace = value as ParsedValue
				pathResult.instanceToChange[pathResult.attributeId] = valueToReplace
				break
			}
		}
	}

	// the typeModel here probably should be the typeModel corresponding to pathResult.instanceToChange (potentially aggregate)
	private parseValueOnPatch(pathResult: PathResult, typeModel: ServerTypeModel, value: string | null): EncryptedParsedValue | EncryptedParsedAssociation {
		// convert value which is a string to one of: Values<typeof ValueType>, [ParsedEntity], [IdTuple], [Id] depending on the pathResult and the typeModel
		// use TypeMapper methods most likely
		return null
	}

	// the typeModel here probably should be the typeModel corresponding to pathResult.instanceToChange (potentially aggregate)
	private decryptValueOnPatchIfNeeded(
		pathResult: PathResult,
		typeModel: ServerTypeModel,
		value: EncryptedParsedValue | EncryptedParsedAssociation,
	): ParsedValue | ParsedAssociation {
		const _ownerEncSessionKeyAttributeId = AttributeModel.getAttributeId(typeModel, "_ownerEncSessionKey")
		const isValue = typeModel.values[pathResult.attributeId] !== undefined
		const isAggregation =
			typeModel.associations[pathResult.attributeId] !== undefined && typeModel.associations[pathResult.attributeId].type === AssociationType.Aggregation
		if (isValue) {
			if (_ownerEncSessionKeyAttributeId) {
				const ownerEncSessionKey = assertNotNull(pathResult.instanceToChange[_ownerEncSessionKeyAttributeId], "session key null on instance?")
				// cryptoMapper#decryptValue
				return null
			} else {
				// the attribute is not encrypted
				return value
			}
		} else if (isAggregation) {
			if (_ownerEncSessionKeyAttributeId) {
				const ownerEncSessionKey = assertNotNull(pathResult.instanceToChange[_ownerEncSessionKeyAttributeId], "session key null on instance?")
				// cryptoMapper#decryptAggregateAssociation
				return null
			} else {
				// the attribute is not encrypted
				return value
			}
		} else {
			return value // id and idTuple associations are never encrypted
		}
	}

	private traversePath(parsedInstance: ServerModelParsedInstance, typeModel: TypeModel, path: Array<string>): PathResult {
		if (path.length == 0) {
			throw new PatchOperationError("Invalid attributePath, expected non-empty attributePath")
		}
		// das: Here I`m unsure of which version to use, since Typescript complains about shift even though the length is checked
		// we can do path.shift()! or <string>path.shift() or path.shift as string. Which to choose?
		const attributePathItem: string = path.shift()!
		try {
			let attributeId: number
			if (env.networkDebugging) {
				attributeId = parseInt(attributePathItem.split(":")[0])
			} else {
				attributeId = parseInt(attributePathItem)
			}

			if (path.length === 0) {
				//values or associations but not aggregations
				return this.parseValueOnPatch()
			}

			const isAggregation = Object.entries(typeModel.associations).find((entry) => {
				return parseInt(entry[0]) === attributeId && entry[1].type === AssociationType.Aggregation
			})
			if (!isAggregation) {
				throw new PatchOperationError(", expected non-empty attributePath")
			}
			//const isAggregation = parsedInstance
		} catch (e) {}

		return null
	}

	// =========== testing area
	public readonly traversePathForTest = this.traversePath
}

export type PathResult = {
	instanceToChange: ServerModelParsedInstance
	attributeId: number
}
