import { assertNotNull, TypeRef, uint8ArrayToBase64, uint8ArrayToString } from "@tutao/tutanota-utils"
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
import { ProgrammingError } from "./error/ProgrammingError"
import { AssociationType, Cardinality, Type, ValueType } from "./EntityConstants"
import { sha256Hash } from "@tutao/tutanota-crypto"

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
export type TypeReferenceResolver = (typeref: TypeRef<any>) => Promise<TypeModel>

export type ModelInfos = {
	[knownApps in AppName]: { version: ApplicationVersion }
}
export type ServerModels = {
	[knownApps in AppName]: { version: ApplicationVersion; types: Record<string, any> }
}
export type ClientModels = {
	[knownApps in AppName]: Record<string, TypeModel>
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
	 * Convert a {@link TypeRef} to a {@link TypeModel} that it refers to.
	 *
	 * This function is async so that we can possibly load typeModels on demand instead of bundling them with the JS files.
	 *
	 * @param typeRef the typeRef for which we will return the typeModel.
	 */
	public async resolveTypeReference(typeRef: TypeRef<any>): Promise<TypeModel> {
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
	// by default, the serverModel is the same as clientModel
	private applicationVersionSum: ApplicationVersionSum
	private applicationTypesHash: ApplicationTypesHash | null = null
	public typeModels: ServerModels

	constructor(private readonly clientModelInfo: ClientModelInfo) {
		this.applicationVersionSum = this.clientModelInfo.applicationVersionSum()
		this.typeModels = this.clientModelAsServerModel()
	}

	public getApplicationVersionSum(): ApplicationVersionSum {
		return this.applicationVersionSum
	}

	// visibleForTesting
	_setApplicationVersionSum(newApplicationVersionSum: ApplicationVersionSum) {
		this.applicationVersionSum = newApplicationVersionSum
	}

	public getApplicationTypesHash(): ApplicationTypesHash | null {
		return this.applicationTypesHash
	}

	// visibleForTesting
	_setApplicationTypesHash(newApplicationTypesHash: ApplicationTypesHash) {
		this.applicationTypesHash = newApplicationTypesHash
	}

	public init(applicationVersionSum: ApplicationVersionSum, applicationTypesHash: ApplicationTypesHash, parsedApplicationTypesJson: Record<string, any>) {
		let newTypeModels = {} as ServerModels
		for (const appName of Object.values(AppNameEnum)) {
			newTypeModels[appName] = this.parseAllTypesForModel(assertNotNull(parsedApplicationTypesJson[appName]))
		}

		const computedApplicationVersionSum = this.computeApplicationVersionSum(newTypeModels)
		if (computedApplicationVersionSum !== applicationVersionSum) {
			throw new ProgrammingError(`Computed version ${computedApplicationVersionSum} does not match expected version: ${applicationVersionSum}`)
		}

		// only override in-memory server typeModel is everything is valid
		this.typeModels = newTypeModels
		this.applicationVersionSum = applicationVersionSum
		this.applicationTypesHash = applicationTypesHash
	}

	public initFromJsonUint8Array(applicationTypesJsonData: Uint8Array) {
		console.log("initializing server model from json data")

		const applicationTypesHashTruncatedBase64 = this.computeApplicationTypesHash(applicationTypesJsonData)
		console.log(applicationTypesHashTruncatedBase64)

		const applicationTypesJsonString = uint8ArrayToString("utf-8", applicationTypesJsonData)
		const parsedJsonData = assertNotNull(JSON.parse(applicationTypesJsonString))

		let applicationVersionSum = 0
		Object.entries(parsedJsonData).map(([_, { version }]: [string, any]) => {
			applicationVersionSum += this.asNumber(version)
		})

		this.init(applicationVersionSum, applicationTypesHashTruncatedBase64, parsedJsonData)
	}

	private parseAllTypesForModel(modelInfo: Record<string, unknown>): {
		types: Record<string, TypeModel>
		version: number
	} {
		const appName = this.ensureVariantOf(AppNameEnum, String(modelInfo.name))
		const version: ApplicationVersion = this.asNumber(modelInfo.version)
		const modelTypeInfoRecord = assertNotNull(modelInfo.types) as Record<string, unknown>

		let types: Record<string, TypeModel> = {}
		for (const typeInfo of Object.values(modelTypeInfoRecord)) {
			const typeModel = this.parseSingleTypeModel(appName, version, typeInfo)
			types[typeModel.id] = typeModel
		}
		return {
			types,
			version,
		}
	}

	private parseSingleTypeModel(app: AppName, appVersion: number, typeInfo: unknown): TypeModel {
		const typeInfoRecord = typeInfo as Record<string, any>
		const valuesRecord = typeInfoRecord.values as Record<string, unknown>
		const associationsRecord = typeInfoRecord.associations as Record<string, unknown>

		const typeId = this.asNumber(typeInfoRecord.id)
		return {
			app,
			version: appVersion.toString(),
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
		}
	}

	private parseModelValues(valuesRecord: Record<number, unknown>, clienModelType: TypeModel | null): Record<AttributeId, ModelValue> {
		let values = {}

		for (const modelValueInfo of Object.values(valuesRecord)) {
			const modelValueInfoRecord = modelValueInfo as Record<string, unknown>
			const attrId = this.asNumber(modelValueInfoRecord.id)
			const serverEncrypted = this.asBoolean(modelValueInfoRecord.encrypted)
			const clientModelValue = clienModelType?.values[attrId]
			if (clientModelValue) {
				const isEncrypted = this.asBoolean(clientModelValue.encrypted)
				if (isEncrypted && !serverEncrypted) {
					throw new ProgrammingError("Trying to parse encrypted value as unencrypted!")
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

	public computeApplicationVersionSum(models: ServerModels): number {
		return Object.values(models).reduce((sum, model) => sum + parseInt(model.version.toString()), 0)
	}

	public computeApplicationTypesHash(applicationTypesJsonData: Uint8Array): string {
		const applicationTypesHash = sha256Hash(applicationTypesJsonData)
		return uint8ArrayToBase64(applicationTypesHash.slice(0, 5))
	}

	// Client Model is storing typeModels and Version info into seperate object
	// ( see ClientModelInfo.typeModels & ClientModelInfo.modelInfos )
	// when we use clientModel as server we have to adhere to same format the server response is going to be:
	// as in: { appName: { name: string, types: TypeModel, version: number } }
	// This method takes ClientModelInfo and return a object compatible to ServerModelInfo
	private clientModelAsServerModel(): ServerModels {
		return Object.values(AppNameEnum).reduce((obj, app) => {
			const types = {
				name: app,
				version: this.clientModelInfo.modelInfos[app].version,
				types: this.clientModelInfo.typeModels[app],
				isPublic: this.clientModelInfo.typeModels[app].isPublic,
			}
			Object.assign(obj, { [app]: types })

			return obj
		}, {}) as ServerModels
	}

	public async resolveTypeReference(typeRef: TypeRef<any>): Promise<TypeModel> {
		const typeModel = this.typeModels[typeRef.app].types[typeRef.typeId]
		if (typeModel == null) {
			throw new Error("Cannot find TypeRef: " + JSON.stringify(typeRef))
		} else {
			return typeModel
		}
	}

	private getClientModelType(appName: AppName, typeId: string): TypeModel | null {
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

export function _verifyType(typeModel: TypeModel) {
	if (typeModel.type !== Type.Element && typeModel.type !== Type.ListElement && typeModel.type !== Type.BlobElement) {
		throw new Error("only Element, ListElement and BlobElement types are permitted, was: " + typeModel.type)
	}
}

const clientModelInfo = new ClientModelInfo()

const serverModelInfo = new ServerModelInfo(clientModelInfo)
export const resolveClientTypeReference = (typeRef: TypeRef<any>) => clientModelInfo.resolveTypeReference(typeRef)

export const resolveServerTypeReference = (typeRef: TypeRef<any>) => serverModelInfo.resolveTypeReference(typeRef)

export const resolveTypeRefFromAppAndTypeNameLegacy = (app: AppName, typeName: string): TypeRef<any> => {
	return clientModelInfo.resolveTypeRefFromAppAndTypeNameLegacy(app, typeName)
}
export const modelInfos = clientModelInfo.modelInfos
