import { AssociationType, Cardinality, Type, ValueType } from "./EntityConstants.js"
import { assert, assertNotNull, TypeRef } from "@tutao/tutanota-utils"
import type { AttributeId, ModelAssociation, ModelValue, TypeModel } from "./EntityTypes"
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

	// given json string,
	// compute the typeModels in typeSafe manner, i.e validate the json contains all required information
	public static init(applicationVersionSum: number, parsedJson: Record<string, unknown>): void {
		assert(applicationVersionSum > 0, "invalid version number")

		let newTypeModels = {} as ServerModels
		for (const appName of Object.values(AppNameEnum)) {
			const appModels = parsedJson[appName]
			assertNotNull(appModels, `app models for ${appModels} not found`)
			newTypeModels[appName] = ServerModelInfo.parseAllTypesForModel(appModels)
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

	private static parseAllTypesForModel(modelTypeInfo: unknown) {
		const modelInfo = modelTypeInfo as Record<string, unknown>
		const appName = ServerModelInfo.ensureVariantOf(AppNameEnum, String(modelInfo.name))
		const version = parseInt(String(modelInfo.version))
		const modelTypeInfoRecord = modelInfo.types as Record<string, unknown>

		let types: Record<string, TypeModel> = {}
		for (const typeInfo of Object.values(modelTypeInfoRecord)) {
			const typeModel = ServerModelInfo.parseSingleTypeModel(appName, version, typeInfo)
			types[typeModel.id] = typeModel
		}
		return {
			types,
			version,
		}
	}

	private static parseSingleTypeModel(app: AppName, appVersion: number, typeInfo: unknown): TypeModel {
		const typeInfoRecord = typeInfo as Record<string, any>
		const valuesRecord = typeInfoRecord.values as Record<string, unknown>
		const associationsRecord = typeInfoRecord.associations as Record<string, unknown>

		const typeModel: TypeModel = {
			app,
			version: appVersion.toString(),
			id: parseInt(typeInfoRecord.id),
			since: parseInt(typeInfoRecord.since),
			name: String(typeInfoRecord.name),
			type: ServerModelInfo.ensureVariantOf(Type, String(typeInfoRecord.type)),
			versioned: Boolean(typeInfoRecord.versioned),
			encrypted: typeInfoRecord.encrypted.toString() === "true",
			rootId: String(typeInfoRecord.rootId),
			values: ServerModelInfo.parseModelValues(valuesRecord),
			associations: ServerModelInfo.parseModelAssociations(associationsRecord),
		}

		ServerModelInfo.verifyNoNullValueInRecord(typeModel)
		return typeModel
	}

	private static parseModelValues(valuesRecord: Record<number, unknown>): Record<AttributeId, ModelValue> {
		let values = {}

		for (const modelValueInfo of Object.values(valuesRecord)) {
			const modelValueInfoRecord = modelValueInfo as Record<string, unknown>
			const modelValue: ModelValue = {
				id: parseInt(String(modelValueInfoRecord.id)),
				name: String(modelValueInfoRecord.name),
				final: Boolean(modelValueInfoRecord.final),
				type: ServerModelInfo.ensureVariantOf(ValueType, String(modelValueInfoRecord.type)),
				encrypted: Boolean(modelValueInfoRecord.encrypted),
				cardinality: ServerModelInfo.ensureVariantOf(Cardinality, String(modelValueInfoRecord.cardinality)),
			}

			ServerModelInfo.verifyNoNullValueInRecord(modelValue)
			Object.assign(values, { [modelValue.id]: modelValue })
		}

		return values
	}

	private static parseModelAssociations(modelAssociations: Record<number, unknown>): Record<AttributeId, ModelAssociation> {
		let associations = {}

		for (const associationInfo of Object.values(modelAssociations)) {
			const associationInfoRecord = associationInfo as Record<string, unknown>
			const modelAssociation: ModelAssociation = {
				id: parseInt(String(associationInfoRecord.id)),
				name: String(associationInfoRecord.name),
				final: Boolean(associationInfoRecord.final),
				type: ServerModelInfo.ensureVariantOf(AssociationType, String(associationInfoRecord.type)),
				cardinality: ServerModelInfo.ensureVariantOf(Cardinality, String(associationInfoRecord.cardinality)),
				refTypeId: parseInt(String(associationInfoRecord.refTypeId)),
			}

			ServerModelInfo.verifyNoNullValueInRecord(modelAssociation)

			// dependency can be null, so assign it after above `verifyNoNullValueInRecord` check. and check here instead
			Object.assign(modelAssociation, {
				dependency:
					typeof associationInfoRecord.dependency === "string"
						? ServerModelInfo.ensureVariantOf(AppNameEnum, associationInfoRecord.dependency)
						: null,
			})

			Object.assign(associations, { [modelAssociation.id]: modelAssociation })
		}

		return associations
	}

	private static computeApplicationVersionSum(models: ServerModels): number {
		return Object.values(models).reduce((sum, model) => sum + model.version, 0)
	}

	private static ensureVariantOf<T extends string>(obj: Record<any, T>, inputStr: string): Values<typeof obj> {
		const knownVariants = Object.values(obj)
		return assertNotNull(
			knownVariants.find((a) => a === inputStr),
			`Unknown value ${inputStr}. Could be one of: ${knownVariants}`,
		)
	}

	private static verifyNoNullValueInRecord(record: Record<any, any>) {
		for (const [keyname, keyValue] of Object.entries(record)) {
			assertNotNull(keyValue, `null value for typeModel key: ${keyname}`)
		}
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
