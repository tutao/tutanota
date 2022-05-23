import {Type} from "./EntityConstants"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "./EntityTypes"
import {typeModels as baseTypeModels} from "../entities/base/TypeModels.js"
import {typeModels as sysTypeModels} from "../entities/sys/TypeModels.js"
import {typeModels as tutanotaTypeModels} from "../entities/tutanota/TypeModels.js"
import {typeModels as monitorTypeModels} from "../entities/monitor/TypeModels.js"
import {typeModels as accountingTypeModels} from "../entities/accounting/TypeModels.js"
import {typeModels as gossipTypeModels} from "../entities/gossip/TypeModels.js"
import {typeModels as storageTypeModels} from "../entities/storage/TypeModels.js"
import sysModelInfo from "../entities/sys/ModelInfo.js"
import baseModelInfo from "../entities/base/ModelInfo.js"
import tutanotaModelInfo from "../entities/tutanota/ModelInfo.js"
import monitorModelInfo from "../entities/monitor/ModelInfo.js"
import accountingModelInfo from "../entities/accounting/ModelInfo.js"
import gossipModelInfo from "../entities/gossip/ModelInfo.js"
import storageModelInfo from "../entities/storage/ModelInfo.js"

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
const typeModels = {
	base: baseTypeModels,
	sys: sysTypeModels,
	tutanota: tutanotaTypeModels,
	monitor: monitorTypeModels,
	accounting: accountingTypeModels,
	gossip: gossipTypeModels,
	storage: storageTypeModels,
} as const

export const modelInfos = {
	base: baseModelInfo,
	sys: sysModelInfo,
	tutanota: tutanotaModelInfo,
	monitor: monitorModelInfo,
	accounting: accountingModelInfo,
	gossip: gossipModelInfo,
	storage: storageModelInfo,
} as const
export type ModelInfos = typeof modelInfos

export async function resolveTypeReference(typeRef: TypeRef<any>): Promise<TypeModel> {
	// @ts-ignore
	const modelMap = typeModels[typeRef.app]

	const typeModel = modelMap[typeRef.type]
	if (typeModel == null) {
		throw new Error("Cannot find TypeRef: " + JSON.stringify(typeRef))
	} else {
		return typeModel
	}
}

export function _verifyType(typeModel: TypeModel) {
	if (typeModel.type !== Type.Element && typeModel.type !== Type.ListElement) {
		throw new Error("only Element and ListElement types are permitted, was: " + typeModel.type)
	}
}