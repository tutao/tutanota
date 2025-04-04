import { Type } from "./EntityConstants.js"
import { assert, downcast, TypeRef } from "@tutao/tutanota-utils"
import type { TypeModel } from "./EntityTypes"
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
import { AppName, AppNameEnum } from "@tutao/tutanota-utils/dist/TypeRef"

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

export type TypeReferenceResolver = typeof resolveTypeReference

// Type model of each application with it's version
export type ServerModels = {
	[knownApps in AppName]: { version: number; types: typeof baseTypeModels }
}

export class ServerModelInfo {
	public static typeModels: ServerModels = {} as ServerModels
	private static applicationVersionSum: number = NaN

	public static getCurrentVersion(): number {
		assert(ServerModelInfo.applicationVersionSum > 0, "ServerModelInfo is not yet populated")
		return ServerModelInfo.applicationVersionSum
	}

	public static init(applicationVersionSum: number, parsedJson: Record<string, any>): void {
		assert(applicationVersionSum > 0, "invalid version number")

		let newTypeModels = {} as ServerModels
		for (const appName of Object.values(AppNameEnum)) {
			newTypeModels[appName] = ServerModelInfo.parseAllTypesForModel(parsedJson[appName])
		}

		const computedVersionSum = ServerModelInfo.computeApplicationVersionSum(newTypeModels)
		assert(applicationVersionSum === computedVersionSum, `version sum mismatch. expected: ${applicationVersionSum}. Got: ${computedVersionSum}`)

		// only update if everything is ok
		ServerModelInfo.typeModels = newTypeModels
		ServerModelInfo.applicationVersionSum = applicationVersionSum
	}

	public static initFromWrittenFile(fileContent: string) {
		const parsedJson: ServerModels = JSON.parse(fileContent)
		let versionSum = 0
		let jsonInServerFormat: Record<string, any> = {}

		Object.entries(parsedJson).map(([appName, { version, types }]) => {
			versionSum += version
			jsonInServerFormat[appName] = { name: appName, version, types }
		})

		ServerModelInfo.init(versionSum, jsonInServerFormat)
	}

	public static getStringRepresentationToWrite(): string {
		assert(ServerModelInfo.applicationVersionSum > 0, "invalid version number")
		return JSON.stringify(ServerModelInfo.typeModels)
	}

	private static parseAllTypesForModel(modelInfo: Record<string, any>) {
		const version = parseInt(modelInfo.version)
		const modelTypeInfoRecord = modelInfo.types as Record<string, any>

		let types: Record<string, TypeModel> = {}
		for (const [typeIdStr, typeInfo] of Object.entries(modelTypeInfoRecord)) {
			const typeId = parseInt(typeIdStr)
			types[String(typeId)] = Object.assign(downcast(typeInfo), {
				app: modelInfo.name,
				version: version.toString(),
				encrypted: typeInfo.encrypted.toString() === "true",
			})
		}
		return {
			types,
			version,
		}
	}

	private static computeApplicationVersionSum(models: ServerModels): number {
		return Object.values(models).reduce((sum, model) => sum + parseInt(model.version.toString()), 0)
	}
}

/**
 * Convert a {@link TypeRef} to a {@link TypeModel} that it refers to.
 *
 * This function is async so that we can possibly load typeModels on demand instead of bundling them with the JS files.
 *
 * @param typeRef the typeRef for which we will return the typeModel.
 */
export async function resolveTypeReference(typeRef: TypeRef<any>): Promise<TypeModel> {
	const modelMap = typeModels[typeRef.app]

	const typeModel = modelMap[typeRef.typeId]
	if (typeModel == null) {
		throw new Error("Cannot find TypeRef: " + JSON.stringify(typeRef))
	} else {
		return typeModel
	}
}

export async function resolveServerTypeReference(typeRef: TypeRef<any>): Promise<TypeModel> {
	const modelMap = ServerModelInfo.typeModels[typeRef.app]

	const typeModel = modelMap.types[typeRef.typeId]
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
