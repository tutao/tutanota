import { assertNotNull, lazyAsync, TypeRef } from "@tutao/tutanota-utils"
import type { AttributeId, ClientTypeModel, ModelAssociation, ModelValue, ServerTypeModel } from "./EntityTypes"
import { typeModels as baseTypeModels } from "../entities/base/TypeModels.js"
import { typeModels as sysTypeModels } from "../entities/sys/TypeModels.js"
import { typeModels as tutanotaTypeModels } from "../entities/tutanota/TypeModels.js"
import { typeModels as monitorTypeModels } from "../entities/monitor/TypeModels.js"
import { typeModels as accountingTypeModels } from "../entities/accounting/TypeModels.js"
import { typeModels as gossipTypeModels } from "../entities/gossip/TypeModels.js"
import { typeModels as storageTypeModels } from "../entities/storage/TypeModels.js"
import { typeModels as usageTypeModels } from "../entities/usage/TypeModels.js"
import { typeModels as driveTypeModels } from "../entities/drive/TypeModels"
import sysModelInfo from "../entities/sys/ModelInfo.js"
import baseModelInfo from "../entities/base/ModelInfo.js"
import tutanotaModelInfo from "../entities/tutanota/ModelInfo.js"
import monitorModelInfo from "../entities/monitor/ModelInfo.js"
import accountingModelInfo from "../entities/accounting/ModelInfo.js"
import gossipModelInfo from "../entities/gossip/ModelInfo.js"
import storageModelInfo from "../entities/storage/ModelInfo.js"
import usageModelInfo from "../entities/usage/ModelInfo.js"
import driveModelInfo from "../entities/drive/ModelInfo.js"
import { AppName, AppNameEnum } from "@tutao/tutanota-utils"
import { ProgrammingError } from "./error/ProgrammingError"
import { AssociationType, Cardinality, Type, ValueType } from "./EntityConstants"
import { ApplicationTypesGetOut } from "../worker/facades/ApplicationTypesFacade"
import { isTest } from "./Env"

export const enum HttpMethod {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	PATCH = "PATCH",
	DELETE = "DELETE",
}

export const enum PatchOperationType {
	ADD_ITEM = "0",
	REMOVE_ITEM = "1",
	REPLACE = "2",
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
export type ServerTypeFetcher = (expectedHash: string | null) => Promise<ApplicationTypesGetOut>

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
	private static instance: ClientModelInfo = new ClientModelInfo()

	/**
	 * Get an instance. AVOID using it, you should inject this instead.
	 */
	public static getInstance(): ClientModelInfo {
		return ClientModelInfo.instance
	}

	/**
	 * Get a fresh instance for tests. Will fail outside of tests. Reusing the same instance in tests leads to
	 * corrupted state so better be safe and use a fresh one.
	 */
	public static getNewInstanceForTestsOnly(): ClientModelInfo {
		if (!isTest()) {
			throw new ProgrammingError()
		}
		return new ClientModelInfo()
	}

	private constructor() {}

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
		drive: driveTypeModels,
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
		drive: driveModelInfo,
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
	public async resolveClientTypeReference(typeRef: TypeRef<any>): Promise<ClientTypeModel> {
		const typeModel = this.typeModels[typeRef.app][typeRef.typeId]
		if (typeModel == null) {
			throw new Error("Cannot find TypeRef: " + JSON.stringify(typeRef))
		} else {
			for (const association of Object.values(typeModel.associations)) {
				if (association.dependency != null) {
					typeModel.dependsOnVersion = this.resolveDependsOnVersion(association.dependency)
					return typeModel
				}
			}
			return typeModel
		}
	}

	public async isKnownClientTypeReference(application: string, typeId: number): Promise<boolean> {
		if (this.typeModels[application as AppName] == null) {
			return false
		}
		return this.typeModels[application as AppName][typeId] != null
	}

	private resolveDependsOnVersion(dependency: AppName) {
		return this.modelInfos[dependency].version
	}
}

export class ServerModelInfo {
	private applicationTypesHash: ApplicationTypesHash | null = null
	public typeModels: ServerModels | null = null

	private static instance: ServerModelInfo | null

	public setCurrentHash(newHash: string) {
		if (this.applicationTypesHash === newHash) {
			return
		}
		this.typeModels = null
		this.applicationTypesHash = newHash
	}

	/**
	 *  Get an instance. Might or might not be initialized.
	 *  AVOID using it, you should inject this instead.
	 */
	public static getPossiblyUninitializedInstance(clientModelInfo: ClientModelInfo, fetcher: ServerTypeFetcher): ServerModelInfo {
		if (ServerModelInfo.instance == null) {
			ServerModelInfo.instance = new ServerModelInfo(clientModelInfo, fetcher)
		}
		return ServerModelInfo.instance
	}

	/**
	 * Get a fresh, uninitialized instance, for tests only.
	 * @param clientModelInfo
	 * @param fetcher
	 */
	public static getUninitializedInstanceForTestsOnly(
		clientModelInfo: ClientModelInfo,
		fetcher: lazyAsync<ApplicationTypesGetOut> = () =>
			Promise.resolve({
				applicationTypesHash: "hash",
				applicationTypesJson: JSON.stringify(clientModelInfo.typeModels),
			}),
	): ServerModelInfo {
		if (!isTest()) {
			throw new ProgrammingError()
		}
		return new ServerModelInfo(clientModelInfo, fetcher)
	}

	private constructor(
		private readonly clientModelInfo: ClientModelInfo,
		private readonly fetcher: ServerTypeFetcher,
	) {}

	private init({ applicationTypesHash, applicationTypesJson }: ApplicationTypesGetOut) {
		const parsedApplicationTypesJson = JSON.parse(applicationTypesJson)
		let newTypeModels = {} as ServerModels
		for (const appName of Object.values(AppNameEnum)) {
			let { version, types } = this.parseAllTypesForModel(assertNotNull(parsedApplicationTypesJson[appName]))
			newTypeModels[appName] = { version, types, name: appName }
		}

		this.typeModels = newTypeModels
		this.applicationTypesHash = applicationTypesHash
	}

	public getApplicationTypesHash(): ApplicationTypesHash | null {
		return this.applicationTypesHash
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

	public async resolveServerTypeReference(typeRef: TypeRef<any>): Promise<ServerTypeModel> {
		if (this.typeModels == null) {
			const getOut = await this.fetcher(this.applicationTypesHash)
			this.init(getOut)
		}
		const typeModel = assertNotNull(this.typeModels)[typeRef.app].types[typeRef.typeId]
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

export interface ClientTypeModelResolver {
	resolveClientTypeReference(typeRef: TypeRef<any>): Promise<ClientTypeModel>
}

export interface ServerTypeModelResolver {
	resolveServerTypeReference(typeRef: TypeRef<any>): Promise<ServerTypeModel>

	getServerApplicationTypesModelHash(): ApplicationTypesHash | null

	setServerApplicationTypesModelHash(hash: ApplicationTypesHash): void
}

export class TypeModelResolver implements ClientTypeModelResolver, ServerTypeModelResolver {
	constructor(
		private readonly clientModelInfo: ClientModelInfo,
		private readonly serverModelInfo: ServerModelInfo,
	) {}

	resolveClientTypeReference(typeRef: TypeRef<any>): Promise<ClientTypeModel> {
		return this.clientModelInfo.resolveClientTypeReference(typeRef)
	}

	isKnownClientTypeReference(application: string, typeId: number): Promise<boolean> {
		return this.clientModelInfo.isKnownClientTypeReference(application, typeId)
	}

	resolveServerTypeReference(typeRef: TypeRef<any>): Promise<ServerTypeModel> {
		return this.serverModelInfo.resolveServerTypeReference(typeRef)
	}

	getServerApplicationTypesModelHash(): ApplicationTypesHash | null {
		return this.serverModelInfo.getApplicationTypesHash()
	}

	setServerApplicationTypesModelHash(hash: string): void {
		this.serverModelInfo.setCurrentHash(hash)
	}
}
