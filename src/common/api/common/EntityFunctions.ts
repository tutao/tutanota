import { assertNotNull, TypeRef } from "@tutao/tutanota-utils"
import type { AttributeId, ClientTypeModel, ModelAssociation, ModelValue, ServerTypeModel } from "./EntityTypes"
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
import { ProgrammingError } from "./error/ProgrammingError"
import { AssociationType, Cardinality, Type, ValueType } from "./EntityConstants"

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

export type ApplicationTypesHash = string
export type ApplicationVersionSum = number
export type ApplicationVersion = number
export type ServerTypeReferenceResolver = (typeref: TypeRef<any>) => Promise<ServerTypeModel>
export type ClientTypeReferenceResolver = (typeref: TypeRef<any>) => Promise<ClientTypeModel>

export type ModelInfos = {
	[knownApps in AppName]: { version: ApplicationVersion }
}
export type ServerModels = {
	[knownApps in AppName]: { name: AppName; version: ApplicationVersion; types: Record<string, ServerTypeModel> }
}
export type ClientModels = {
	[knownApps in AppName]: Record<string, ClientTypeModel>
}

export class ClientModelInfo {
	/**
	 * Model maps are needed for static analysis and dead-code elimination.
	 * We access most types through the TypeRef but also sometimes we include them completely dynamically (e.g. encryption of aggregates).
	 * This means that we need to tell our bundler which ones do exist so that they are included.
	 */
	public typeModels: ClientModels = Object.freeze({
		base: baseTypeModels,
		sys: sysTypeModels,
		tutanota: tutanotaTypeModels,
		monitor: monitorTypeModels,
		accounting: accountingTypeModels,
		gossip: gossipTypeModels,
		storage: storageTypeModels,
		usage: usageTypeModels,
	} as const)

	public readonly modelInfos: ModelInfos = Object.freeze({
		base: baseModelInfo,
		sys: sysModelInfo,
		tutanota: tutanotaModelInfo,
		monitor: monitorModelInfo,
		accounting: accountingModelInfo,
		gossip: gossipModelInfo,
		storage: storageModelInfo,
		usage: usageModelInfo,
	} as const)

	public applicationVersionSum(): ApplicationVersionSum {
		return Object.values(this.modelInfos).reduce((sum, i) => sum + i.version, 0)
	}

	/**
	 * Convert a {@link TypeRef} to a {@link ClientTypeModel} that it refers to.
	 *
	 * This function is async so that we can possibly load typeModels on demand instead of bundling them with the JS files.
	 *
	 * @param typeRef the typeRef for which we will return the typeModel.
	 */
	public async resolveTypeReference(typeRef: TypeRef<any>): Promise<ClientTypeModel> {
		const typeModel = this.typeModels[typeRef.app][typeRef.typeId]
		if (typeModel == null) {
			throw new Error("Cannot find TypeRef: " + JSON.stringify(typeRef))
		} else {
			return typeModel
		}
	}

	/**
	 * To be removed 45 days after attrIds server release
	 * @param app
	 * @param typeName
	 */
	public resolveTypeRefFromAppAndTypeNameLegacy(app: AppName, typeName: string): TypeRef<any> {
		const typeModels = this.typeModels[app]
		for (const [typeModelId, typeModel] of Object.entries(typeModels)) {
			if (typeModel.name == typeName) {
				return new TypeRef(app, parseInt(typeModelId))
			}
		}
		throw new Error("Cannot find type with name " + typeName + " in app " + app)
	}
}

export class ServerModelInfo {
	private applicationTypesHash: ApplicationTypesHash | null = null
	public typeModels: ServerModels | null = null

	constructor(private readonly clientModelInfo: ClientModelInfo) {}

	public getApplicationTypesHash(): ApplicationTypesHash | null {
		return this.applicationTypesHash
	}

	public init(newApplicationTypesHash: ApplicationTypesHash, parsedApplicationTypesJson: Record<string, any>) {
		let newTypeModels = {} as ServerModels
		for (const appName of Object.values(AppNameEnum)) {
			let { version, types } = this.parseAllTypesForModel(assertNotNull(parsedApplicationTypesJson[appName]))
			newTypeModels[appName] = { version, types, name: appName }
		}

		this.typeModels = newTypeModels
		this.applicationTypesHash = newApplicationTypesHash
	}

	private parseAllTypesForModel(modelInfo: Record<string, unknown>): {
		types: Record<string, ServerTypeModel>
		version: number
	} {
		const appName = this.ensureVariantOf(AppNameEnum, String(modelInfo.name))
		const version: ApplicationVersion = this.asNumber(modelInfo.version)
		const modelTypeInfoRecord = assertNotNull(modelInfo.types) as Record<string, unknown>

		let types: Record<string, ServerTypeModel> = {}
		for (const typeInfo of Object.values(modelTypeInfoRecord)) {
			const typeModel = this.parseSingleTypeModel(appName, version, typeInfo)
			types[typeModel.id] = typeModel
		}
		return {
			types,
			version,
		}
	}

	private parseSingleTypeModel(app: AppName, appVersion: number, typeInfo: unknown): ServerTypeModel {
		const typeInfoRecord = typeInfo as Record<string, any>
		const valuesRecord = typeInfoRecord.values as Record<string, unknown>
		const associationsRecord = typeInfoRecord.associations as Record<string, unknown>

		const typeId = this.asNumber(typeInfoRecord.id)
		return {
			app,
			version: appVersion,
			id: typeId,
			since: this.asNumber(typeInfoRecord.since),
			name: this.asString(typeInfoRecord.name),
			type: this.ensureVariantOf(Type, String(typeInfoRecord.type)),
			versioned: this.asBoolean(typeInfoRecord.versioned),
			encrypted: this.asBoolean(typeInfoRecord.encrypted),
			isPublic: this.asBoolean(typeInfoRecord.isPublic),
			rootId: this.asString(typeInfoRecord.rootId),
			values: this.parseModelValues(valuesRecord, this.getClientModelType(app, String(typeId))),
			associations: this.parseModelAssociations(associationsRecord),
		} as ServerTypeModel
	}

	private parseModelValues(valuesRecord: Record<number, unknown>, clientModelType: ClientTypeModel | null): Record<AttributeId, ModelValue> {
		let values = {}

		for (const modelValueInfo of Object.values(valuesRecord)) {
			const modelValueInfoRecord = modelValueInfo as Record<string, unknown>
			const attrId = this.asNumber(modelValueInfoRecord.id)
			const serverEncrypted = this.asBoolean(modelValueInfoRecord.encrypted)
			const clientModelValue = clientModelType?.values[attrId]
			if (clientModelValue) {
				const isEncrypted = this.asBoolean(clientModelValue.encrypted)
				if (isEncrypted && !serverEncrypted) {
					throw new ProgrammingError(
						`Trying to parse encrypted value as unencrypted for: ${clientModelType?.app}:${clientModelType.id}:${clientModelValue.id}`,
					)
				}
			}
			const modelValue: ModelValue = {
				id: attrId,
				name: this.asString(modelValueInfoRecord.name),
				final: this.asBoolean(modelValueInfoRecord.final),
				type: this.ensureVariantOf(ValueType, String(modelValueInfoRecord.type)),
				encrypted: serverEncrypted,
				cardinality: this.ensureVariantOf(Cardinality, String(modelValueInfoRecord.cardinality)),
			}

			Object.assign(values, { [modelValue.id]: modelValue })
		}

		return values
	}

	private parseModelAssociations(modelAssociations: Record<number, unknown>): Record<AttributeId, ModelAssociation> {
		let associations = {}

		for (const associationInfo of Object.values(modelAssociations)) {
			const associationInfoRecord = associationInfo as Record<string, unknown>
			const modelAssociation: ModelAssociation = {
				id: this.asNumber(associationInfoRecord.id),
				name: this.asString(associationInfoRecord.name),
				final: this.asBoolean(associationInfoRecord.final),
				type: this.ensureVariantOf(AssociationType, String(associationInfoRecord.type)),
				cardinality: this.ensureVariantOf(Cardinality, String(associationInfoRecord.cardinality)),
				refTypeId: this.asNumber(associationInfoRecord.refTypeId),
			}

			// dependency can be null, so assign it after above `verifyNoNullValueInRecord` check. and check here instead
			Object.assign(modelAssociation, {
				dependency: typeof associationInfoRecord.dependency === "string" ? this.ensureVariantOf(AppNameEnum, associationInfoRecord.dependency) : null,
			})

			Object.assign(associations, { [modelAssociation.id]: modelAssociation })
		}

		return associations
	}

	private ensureVariantOf<T extends string>(obj: Record<any, T>, inputStr: string): Values<typeof obj> {
		const knownVariants = Object.values(obj)
		return assertNotNull(
			knownVariants.find((a) => a === inputStr),
			`Unknown value ${inputStr}. Could be one of: ${knownVariants}`,
		)
	}

	private asString(value: any): string {
		if (value != null && typeof value !== "object") return value.toString()
		else throw new Error(`value ${value} is not string compatible`)
	}

	private asNumber(value: any): number {
		if (value != null && (typeof value === "string" || typeof value === "number")) return parseInt(value.toString())
		else throw new Error(`value ${value} is not number compatible`)
	}

	private asBoolean(value: any): boolean {
		if (typeof value === "boolean") return value
		else if (typeof value === "string") return value === "true"
		else throw new Error(`value: ${value} is not boolean compatible`)
	}

	public async resolveTypeReference(typeRef: TypeRef<any>): Promise<ServerTypeModel> {
		if (this.typeModels == null) {
			throw new ProgrammingError("Tried to resolve server type ref before initialization. Call ensure_latest_server_model first?")
		}
		const typeModel = this.typeModels[typeRef.app].types[typeRef.typeId]
		if (typeModel == null) {
			throw new Error("Cannot find TypeRef: " + JSON.stringify(typeRef))
		} else {
			return typeModel
		}
	}

	private getClientModelType(appName: AppName, typeId: string): ClientTypeModel | null {
		const clientApp = this.clientModelInfo.typeModels[appName]
		if (clientApp) {
			const clientType = clientApp[typeId]
			if (clientType) {
				return clientType
			}
		}
		return null
	}
}

export function _verifyType(typeModel: ClientTypeModel) {
	if (typeModel.type !== Type.Element && typeModel.type !== Type.ListElement && typeModel.type !== Type.BlobElement) {
		throw new Error("only Element, ListElement and BlobElement types are permitted, was: " + typeModel.type)
	}
}

// @singleton global client and server model info to always use the same and up-to-date typeModels
export const globalClientModelInfo = new ClientModelInfo()
export const globalServerModelInfo = new ServerModelInfo(globalClientModelInfo)

export const resolveClientTypeReference = (typeRef: TypeRef<any>) => globalClientModelInfo.resolveTypeReference(typeRef)
export const resolveServerTypeReference = (typeRef: TypeRef<any>) => globalServerModelInfo.resolveTypeReference(typeRef)

export const resolveTypeRefFromAppAndTypeNameLegacy = (app: AppName, typeName: string): TypeRef<any> => {
	return globalClientModelInfo.resolveTypeRefFromAppAndTypeNameLegacy(app, typeName)
}
