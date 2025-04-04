import { AssociationType, Cardinality, Type, ValueType } from "./EntityConstants.js"
import { assertNotNull, TypeRef } from "@tutao/tutanota-utils"
import type { AttributeId, ModelAssociation, ModelValue, TypeId, TypeModel } from "./EntityTypes"
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

export type TypeModels = {
	base: Map<TypeId, TypeModel>
	sys: Map<TypeId, TypeModel>
	tutanota: Map<TypeId, TypeModel>
	monitor: Map<TypeId, TypeModel>
	accounting: Map<TypeId, TypeModel>
	gossip: Map<TypeId, TypeModel>
	storage: Map<TypeId, TypeModel>
	usage: Map<TypeId, TypeModel>
}

export const EmptyTypeModels = {
	base: new Map(),
	sys: new Map(),
	tutanota: new Map(),
	monitor: new Map(),
	accounting: new Map(),
	gossip: new Map(),
	storage: new Map(),
	usage: new Map(),
}

export class ServerModelInfo {
	public static typeModels: TypeModels = EmptyTypeModels
	private static computedVersion: number = 0

	public static getCurrentVersion(): number {
		return ServerModelInfo.computedVersion
	}

	// given json string,
	// compute the typeModels in typeSafe manner, i.e validate the json contains all required information
	public static init(version: number, unparsedJsonString: string): void {
		const parsedJson = JSON.parse(unparsedJsonString) as Record<string, unknown>

		let newTypeModels = EmptyTypeModels
		for (const appName of Object.values(AppNameEnum)) {
			newTypeModels[appName] = ServerModelInfo.parseAllTypesForModel(parsedJson[appName])
		}

		// only update if everything is ok
		ServerModelInfo.typeModels = newTypeModels
		ServerModelInfo.computedVersion = version
	}

	private static parseAllTypesForModel(modelTypeInfo: unknown): Map<TypeId, TypeModel> {
		const modelInfo = modelTypeInfo as Record<string, unknown>
		const appName = ServerModelInfo.parseAppName(String(modelInfo.name))
		const modelTypeInfoRecord = modelInfo.types as Record<string, unknown>
		const version = parseInt(String(modelInfo.version))

		let typeMaps = new Map<TypeId, TypeModel>()
		for (const typeInfo of Object.values(modelTypeInfoRecord)) {
			const typeModel = ServerModelInfo.parseSingleTypeModel(appName, version, typeInfo)
			typeMaps.set(typeModel.id, typeModel)
		}
		return typeMaps
	}

	private static parseSingleTypeModel(app: AppName, appVersion: number, typeInfo: unknown): TypeModel {
		const typeInfoRecord = typeInfo as Record<string, any>

		const id = parseInt(typeInfoRecord.id)
		const since = parseInt(typeInfoRecord.since)
		const name = String(typeInfoRecord.name)
		const version = appVersion.toString()
		const rootId = String(typeInfoRecord.rootId)
		const versioned = Boolean(typeInfoRecord.versioned)
		const encrypted = typeInfoRecord.encrypted.toString() === "true"

		const type = ServerModelInfo.parseEntityType(String(typeInfoRecord.type))

		const valuesRecord = typeInfoRecord.values as Record<string, unknown>
		const associationsRecord = typeInfoRecord.associations as Record<string, unknown>
		const values = ServerModelInfo.parseModelValues(valuesRecord)
		const associations = ServerModelInfo.parseModelAssociations(associationsRecord)

		const typeModel = {
			id,
			since,
			app,
			version,
			name,
			type,
			versioned,
			encrypted,
			rootId,
			values,
			associations,
		} satisfies TypeModel

		ServerModelInfo.verifyNoNullValueInRecord(typeModel)
		return typeModel
	}

	private static parseModelValues(valuesRecord: Record<number, unknown>): Record<AttributeId, ModelValue> {
		let values = {}

		for (const modelValueInfo of Object.values(valuesRecord)) {
			const modelValueInfoRecord = modelValueInfo as Record<string, unknown>

			const final = Boolean(modelValueInfoRecord.final)
			const name = String(modelValueInfoRecord.name)
			const id = Number(modelValueInfoRecord.id)
			const type = ServerModelInfo.parseValueType(String(modelValueInfoRecord.type))
			const cardinality = ServerModelInfo.parseCardinality(String(modelValueInfoRecord.cardinality))
			const encrypted = Boolean(modelValueInfoRecord.encrypted)

			const modelValue = {
				id,
				name,
				final,
				type,
				encrypted,
				cardinality,
			} satisfies ModelValue

			ServerModelInfo.verifyNoNullValueInRecord(modelValue)
			Object.assign(values, { [modelValue.id]: modelValue })
		}

		return values
	}

	private static parseModelAssociations(modelAssociations: Record<number, unknown>): Record<AttributeId, ModelAssociation> {
		let associations = {}

		for (const associationInfo of Object.values(modelAssociations)) {
			const associationInfoRecord = associationInfo as Record<string, unknown>

			const final = Boolean(associationInfoRecord.final)
			const name = String(associationInfoRecord.name)
			const id = Number(associationInfoRecord.id)
			const type = ServerModelInfo.parseAssociationType(String(associationInfoRecord.type))
			const cardinality = ServerModelInfo.parseCardinality(String(associationInfoRecord.cardinality))
			const refTypeId = Number(associationInfoRecord.refTypeId)

			const modelAssociation = {
				id,
				name,
				final,
				type,
				cardinality,
				refTypeId,
			} satisfies ModelAssociation

			ServerModelInfo.verifyNoNullValueInRecord(modelAssociation)

			// dependency can be null, so assign it after above `verifyNoNullValueInRecord` check. and check here instead
			Object.assign(modelAssociation, {
				dependency: typeof associationInfoRecord.dependency === "string" ? ServerModelInfo.parseAppName(associationInfoRecord.dependency) : null,
			})

			Object.assign(associations, { [modelAssociation.id]: modelAssociation })
		}

		return associations
	}

	private static parseAppName(appnameStr: string): AppName {
		return assertNotNull(
			Object.values(AppNameEnum).find((app) => app.toString() === appnameStr),
			`Invalid app name in server model. Found: ${appnameStr}`,
		)
	}

	private static parseEntityType(typeStr: string): Values<typeof Type> {
		return assertNotNull(
			Object.values(Type).find((elType) => elType.toString() === typeStr),
			"Invalid entity type in server model",
		)
	}

	private static parseValueType(typeStr: string): Values<typeof ValueType> {
		return assertNotNull(
			Object.values(ValueType).find((vType) => vType.toString() === typeStr),
			"Invalid value type in server model",
		)
	}

	private static parseAssociationType(typeStr: string): Values<typeof AssociationType> {
		return assertNotNull(
			Object.values(AssociationType).find((aType) => aType.toString() === typeStr),
			"Invalid association type in server model",
		)
	}

	private static parseCardinality(cardinalityStr: string): Values<typeof Cardinality> {
		return assertNotNull(
			Object.values(Cardinality).find((cardinality) => cardinality.toString() === cardinalityStr),
			`Invalid cardinality type in server model. found: ${cardinalityStr}`,
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

	const typeModel = modelMap.get(typeRef.typeId)
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
