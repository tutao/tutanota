import { Type } from "./EntityConstants.js"
import { TypeRef } from "@tutao/tutanota-utils"
import type { Entity, TypeModel } from "./EntityTypes"
import { typeModels as baseTypeModels } from "../entities/base/TypeModels.js"
import { typeModels as sysTypeModels } from "../entities/sys/TypeModels.js"
import { typeModels as tutanotaTypeModels } from "../entities/tutanota/TypeModels.js"
import { typeModels as monitorTypeModels } from "../entities/monitor/TypeModels.js"
import { typeModels as accountingTypeModels } from "../entities/accounting/TypeModels.js"
import { typeModels as gossipTypeModels } from "../entities/gossip/TypeModels.js"
import { typeModels as storageTypeModels } from "../entities/storage/TypeModels.js"
import { typeModels as usageTypeModels } from "../entities/usage/TypeModels.js"
import sysModelInfo from "../entities/sys/ModelInfo.js"
import baseModelInfo from "../entities/base/ModelInfo.js"
import tutanotaModelInfo from "../entities/tutanota/ModelInfo.js"
import monitorModelInfo from "../entities/monitor/ModelInfo.js"
import accountingModelInfo from "../entities/accounting/ModelInfo.js"
import gossipModelInfo from "../entities/gossip/ModelInfo.js"
import storageModelInfo from "../entities/storage/ModelInfo.js"
import usageModelInfo from "../entities/usage/ModelInfo.js"
import { when } from "testdouble"

export const enum HttpMethod {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	DELETE = "DELETE",
}

export const enum MediaType {
	Json = "application/json",
	Binary = "application/octet-stream",
	Text = "text/plain",
}

/**
 * Model maps are needed for static analysis and dead-code elimination.
 * We access most types through the TypeRef but also sometimes we include them completely dynamically (e.g. encryption of aggregates).
 * This means that we need to tell our bundler which ones do exist so that they are included.
 */
export const typeModels = Object.freeze({
	base: baseTypeModels,
	sys: sysTypeModels,
	tutanota: tutanotaTypeModels,
	monitor: monitorTypeModels,
	accounting: accountingTypeModels,
	gossip: gossipTypeModels,
	storage: storageTypeModels,
	usage: usageTypeModels,
} as const)

// Record<appName, Map<typeId, Map<attrName, attrId>>>
let typeIdToAttributeNameMap: Record<string, Map<number, Map<string, number>>> = {
	// Map<typeId, Map<attrName, attrId>>
	base: new Map(),
	sys: new Map(),
	tutanota: new Map(),
	monitor: new Map<number, Map<string, number>>(),
	accounting: new Map<number, Map<string, number>>(),
	gossip: new Map<number, Map<string, number>>(),
	storage: new Map<number, Map<string, number>>(),
	usage: new Map<number, Map<string, number>>(),
}

export async function getAttributeId(typeRef: TypeRef<Entity>, attributeName: string): Promise<number | null> {
	const typeIdMap = typeIdToAttributeNameMap[typeRef.app].get(typeRef.typeId) ?? null
	if (typeIdMap) {
		return typeIdMap.get(attributeName) ?? null
	} else {
		const typeModel = await resolveTypeReference(typeRef)

		let attributeNameToAttributeId: Map<string, number> = new Map()
		for (const [valueId, value] of Object.entries(typeModel.values)) {
			attributeNameToAttributeId.set(value.name, parseInt(valueId))
		}
		for (const [associationId, association] of Object.entries(typeModel.associations)) {
			attributeNameToAttributeId.set(association.name, parseInt(associationId))
		}

		typeIdToAttributeNameMap[typeRef.app].set(typeRef.typeId, attributeNameToAttributeId)
		return await getAttributeId(typeRef, attributeName)
	}
}

export const modelInfos = {
	base: baseModelInfo,
	sys: sysModelInfo,
	tutanota: tutanotaModelInfo,
	monitor: monitorModelInfo,
	accounting: accountingModelInfo,
	gossip: gossipModelInfo,
	storage: storageModelInfo,
	usage: usageModelInfo,
} as const
export type ModelInfos = typeof modelInfos

/**
 * Convert a {@link TypeRef} to a {@link TypeModel} that it refers to.
 *
 * This function is async so that we can possibly load typeModels on demand instead of bundling them with the JS files.
 *
 * @param typeRef the typeRef for which we will return the typeModel.
 */
export async function resolveTypeReference(typeRef: TypeRef<any>): Promise<TypeModel> {
	// @ts-ignore
	const modelMap = typeModels[typeRef.app]

	const typeModel = modelMap[typeRef.typeId]
	if (typeModel == null) {
		throw new Error("Cannot find TypeRef: " + JSON.stringify(typeRef))
	} else {
		return typeModel
	}
}

export function _verifyType(typeModel: TypeModel) {
	if (typeModel.type !== Type.Element && typeModel.type !== Type.ListElement && typeModel.type !== Type.BlobElement) {
		throw new Error("only Element, ListElement and BlobElement types are permitted, was: " + typeModel.type)
	}
}
