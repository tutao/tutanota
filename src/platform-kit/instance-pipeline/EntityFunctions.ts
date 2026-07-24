import { assertNotNull, downcast, isNotNull, lazyAsync } from "@tutao/utils"
import {
	type AppName,
	AppNameEnum,
	AssociationType,
	AttributeId,
	Cardinality,
	ClientTypeModel,
	ModelAssociation,
	ModelValue,
	ServerTypeModel,
	Type,
	TypeRef,
	ValueType,
	ValueTypeEnum,
} from "@tutao/meta"
import { InvalidModelError, isTest, ProgrammingError } from "@tutao/app-env"
import { ApplicationTypesGetOut } from "./ApplicationTypesFacade"

export type ApplicationTypesHash = string
export type ApplicationVersionSum = number
export type ApplicationVersion = number
export type ServerTypeReferenceResolver = (typeref: TypeRef<any>) => Promise<ServerTypeModel>
export type ClientTypeReferenceResolver = (typeref: TypeRef<any>) => Promise<ClientTypeModel>
export type ServerTypeFetcher = (expectedHash: string | null) => Promise<ApplicationTypesGetOut>
export type NamedClientModel = { app: AppName; clientModel: Record<string, ClientTypeModel>; modelInfo: ModelInfo }

export type ModelInfo = { version: ApplicationVersion }
export type ModelInfos = {
	[knownApps in AppName]: ModelInfo
}
export type ServerModels = Record<
	AppName,
	{
		name: AppName
		version: ApplicationVersion
		types: Record<string, ServerTypeModel>
	}
>
export type ClientModels = Record<AppName, Record<string, ClientTypeModel>>

export class ClientModelInfo {
	/**
	 * Model maps are needed for static analysis and dead-code elimination.
	 * We access most types through the TypeRef but also sometimes we include them completely dynamically (e.g. encryption of aggregates).
	 * This means that we need to tell our bundler which ones do exist so that they are included.
	 */
	public readonly typeModels: ClientModels = {}

	public readonly modelInfos: ModelInfos = {}

	constructor() {}

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

	public registerApp(namedClientModel: NamedClientModel): void {
		const { app, clientModel, modelInfo } = namedClientModel
		this.typeModels[app] = clientModel
		this.modelInfos[app] = modelInfo
	}

	public getApps(): Array<NamedClientModel> {
		const apps: Array<NamedClientModel> = []
		for (const appName of Object.keys(this.typeModels)) {
			apps.push({ app: appName, clientModel: this.typeModels[appName], modelInfo: this.modelInfos[appName] })
		}
		return apps
	}

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
			throw new Error("Cannot find TypeRef: " + typeRef.toString())
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
	private static instance: ServerModelInfo | null
	public typeModels: ServerModels | null = null
	private applicationTypesHash: ApplicationTypesHash | null = null

	private constructor(
		private readonly clientModelInfo: ClientModelInfo,
		private readonly fetcher: ServerTypeFetcher,
	) {}

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
		const serverModelInfo = new ServerModelInfo(clientModelInfo, fetcher)
		serverModelInfo.applicationTypesHash = "hash"
		return serverModelInfo
	}

	public setCurrentHash(newHash: string) {
		if (this.applicationTypesHash === newHash) {
			return
		}
		this.typeModels = null
		this.applicationTypesHash = newHash
	}

	public getApplicationTypesHash(): ApplicationTypesHash | null {
		return this.applicationTypesHash
	}

	public async resolveServerTypeReference(typeRef: TypeRef<any>): Promise<ServerTypeModel> {
		if (this.typeModels == null || Object.keys(this.typeModels).length === 0) {
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

	private init({ applicationTypesHash, applicationTypesJson }: ApplicationTypesGetOut) {
		const parsedApplicationTypesJson = JSON.parse(applicationTypesJson)
		let newTypeModels = {} as ServerModels
		for (const appName of this.getAppNames()) {
			let { version, types } = this.parseAllTypesForModel(assertNotNull(parsedApplicationTypesJson[appName]))
			newTypeModels[appName] = { version, types, name: appName }
		}

		this.typeModels = newTypeModels
		this.applicationTypesHash = applicationTypesHash
	}

	private parseAllTypesForModel(modelInfo: Record<string, unknown>): {
		types: Record<string, ServerTypeModel>
		version: number
	} {
		const appName = this.ensureVariantOfList(this.getAppNames(), String(modelInfo.name))
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
			associations: this.parseModelAssociations(associationsRecord, this.getClientModelType(app, String(typeId))),
		} as ServerTypeModel
	}

	private parseModelValues(valuesRecord: Record<number, unknown>, clientModelType: ClientTypeModel | null): Record<AttributeId, ModelValue> {
		let values = {}

		for (const modelValueInfo of Object.values(valuesRecord)) {
			const modelValueInfoRecord = modelValueInfo as Record<string, unknown>
			const attrId = this.asNumber(modelValueInfoRecord.id)
			const serverEncrypted = this.asBoolean(modelValueInfoRecord.encrypted)
			const serverValueType = this.ensureVariantOf(ValueType, String(modelValueInfoRecord.type)) as ValueTypeEnum
			const serverName = this.asString(modelValueInfoRecord.name)
			const serverFinal = this.asBoolean(modelValueInfoRecord.final)
			const serverCardinality = this.ensureVariantOf(Cardinality, String(modelValueInfoRecord.cardinality))

			const clientModelValue = clientModelType?.values[attrId]

			if (clientModelValue) {
				const isEncrypted = this.asBoolean(clientModelValue.encrypted)
				if (isEncrypted && !serverEncrypted) {
					throw new InvalidModelError(
						`Trying to parse encrypted value as unencrypted for: ${clientModelType?.app}:${clientModelType.id}:${clientModelValue.id}`,
					)
				}

				const clientValueType = clientModelValue.type
				const isValidValueTypeChange =
					clientValueType === serverValueType || // value type is same
					(serverValueType === ValueTypeEnum.Number && clientValueType === ValueTypeEnum.Boolean) || // Boolean -> Number is allowed
					(serverValueType === ValueTypeEnum.String && clientValueType === ValueTypeEnum.Number) // Number -> String is allowed

				if (!isValidValueTypeChange) {
					/*
					 * check that the types on the server model and client model are compatible. if this doesn't pass for a pair of
					 * type models, it's likely that the old client version needs to be disabled to roll out that change. We need to
					 * have different functions for different directions of transformations such as BooleanToNumber or NumberToString.
					 */
					throw new InvalidModelError(
						`Cannot map from server to client type: types of field ${attrId} on type ${serverName} are incompatible. This client is not compatible with the current server model.`,
					)
				}
			}
			const modelValue: ModelValue = {
				id: attrId,
				name: serverName,
				final: serverFinal,
				type: serverValueType,
				encrypted: serverEncrypted,
				cardinality: serverCardinality,
			}

			Object.assign(values, { [modelValue.id]: modelValue })
		}

		return values
	}

	private parseModelAssociations(
		modelAssociations: Record<number, unknown>,
		clientModelAssociation: ClientTypeModel | null,
	): Record<AttributeId, ModelAssociation> {
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

		if (isNotNull(clientModelAssociation)) {
			for (const clientAssociation of Object.values(clientModelAssociation.associations)) {
				const isRemovedByServer = !Object.keys(associations).some((serverAssocId) => clientAssociation.id.toString() === serverAssocId)

				if (isRemovedByServer && clientAssociation.cardinality === Cardinality.One) {
					// INFRA-NOTE:
					// we should do more of these verification here. example: ( Adding an association with cardinality one )
					// so when we fetch a new server model json, we can already show a client too old error.
					throw new InvalidModelError(
						`Server has removed an association: "${clientAssociation.name}" with a cardinality of One. The client version is probably too old.`,
					)
				}
			}
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

	private ensureVariantOfList(knownVariants: string[], inputStr: string): string {
		return assertNotNull(
			knownVariants.find((a) => a === inputStr),
			`Unknown value ${inputStr}. Could be one of: ${knownVariants}`,
		)
	}

	private getAppNames(): string[] {
		return Object.keys(this.clientModelInfo.typeModels)
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

	private getClientModelType(appName: AppName, typeId: string): ClientTypeModel | null {
		const clientApp = this.clientModelInfo.typeModels[appName] ?? null
		if (isNotNull(clientApp)) {
			const clientType = clientApp[typeId] ?? null
			if (isNotNull(clientType)) {
				return clientType
			}
		}
		return null
	}
}

export function ensureIsPersistentType(typeModel: ClientTypeModel) {
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

export class ClientOnlyTypeModelResolver extends TypeModelResolver {
	constructor(clientModelInfo: ClientModelInfo) {
		const throwingFetcher: ServerTypeFetcher = () => {
			throw new ProgrammingError("Not implemented for ClientOnlyTypeModelResolver")
		}
		super(clientModelInfo, ServerModelInfo.getPossiblyUninitializedInstance(clientModelInfo, throwingFetcher))
	}

	async resolveServerTypeReference(typeRef: TypeRef<any>): Promise<ServerTypeModel> {
		const clientTypeModel = await this.resolveClientTypeReference(typeRef)
		return downcast<ServerTypeModel>(clientTypeModel)
	}
}
