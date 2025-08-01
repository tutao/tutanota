import { HttpMethod, MediaType, TypeModelResolver } from "../../common/EntityFunctions"
import {
	DeleteService,
	ExtraServiceParams,
	GetService,
	IServiceExecutor,
	MethodDefinition,
	ParamTypeFromRef,
	PostService,
	PutService,
	ReturnTypeFromRef,
	ServiceDefinition,
} from "../../common/ServiceRequest.js"
import { Entity, ServerModelUntypedInstance } from "../../common/EntityTypes"
import { isSameTypeRef, lazy, TypeRef } from "@tutao/tutanota-utils"
import { RestClient } from "./RestClient"
import { CryptoFacade } from "../crypto/CryptoFacade"
import { assertWorkerOrNode } from "../../common/Env"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { AuthDataProvider } from "../facades/UserFacade"
import { LoginIncompleteError } from "../../common/error/LoginIncompleteError.js"
import { InstancePipeline } from "../crypto/InstancePipeline"
import { EntityAdapter } from "../crypto/EntityAdapter"
import { AttributeModel } from "../../common/AttributeModel"

assertWorkerOrNode()

type AnyService = GetService | PostService | PutService | DeleteService

export class ServiceExecutor implements IServiceExecutor {
	constructor(
		private readonly restClient: RestClient,
		private readonly authDataProvider: AuthDataProvider,
		private readonly instancePipeline: InstancePipeline,
		private readonly cryptoFacade: lazy<CryptoFacade>,
		private readonly typeModelResolver: TypeModelResolver,
	) {}

	get<S extends GetService>(
		service: S,
		data: ParamTypeFromRef<S["get"]["data"]>,
		params?: ExtraServiceParams,
	): Promise<ReturnTypeFromRef<S["get"]["return"]>> {
		return this.executeServiceRequest(service, HttpMethod.GET, data, params)
	}

	post<S extends PostService>(
		service: S,
		data: ParamTypeFromRef<S["post"]["data"]>,
		params?: ExtraServiceParams,
	): Promise<ReturnTypeFromRef<S["post"]["return"]>> {
		return this.executeServiceRequest(service, HttpMethod.POST, data, params)
	}

	put<S extends PutService>(
		service: S,
		data: ParamTypeFromRef<S["put"]["data"]>,
		params?: ExtraServiceParams,
	): Promise<ReturnTypeFromRef<S["put"]["return"]>> {
		return this.executeServiceRequest(service, HttpMethod.PUT, data, params)
	}

	delete<S extends DeleteService>(
		service: S,
		data: ParamTypeFromRef<S["delete"]["data"]>,
		params?: ExtraServiceParams,
	): Promise<ReturnTypeFromRef<S["delete"]["return"]>> {
		return this.executeServiceRequest(service, HttpMethod.DELETE, data, params)
	}

	private async executeServiceRequest(
		service: AnyService,
		method: HttpMethod,
		requestEntity: Entity | null,
		params: ExtraServiceParams | undefined,
	): Promise<any> {
		const methodDefinition = this.getMethodDefinition(service, method)
		if (
			methodDefinition.return &&
			params?.sessionKey == null &&
			(await this.typeModelResolver.resolveClientTypeReference(methodDefinition.return)).encrypted &&
			!this.authDataProvider.isFullyLoggedIn()
		) {
			// Short-circuit before we do an actual request which we can't decrypt
			// If we have a session key passed it doesn't mean that it is for the return type, but it is likely
			// so we allow the request.
			throw new LoginIncompleteError(`Tried to make service request with encrypted return type but is not fully logged in yet, service: ${service.name}`)
		}

		const modelVersion = await this.getModelVersion(methodDefinition)

		const path = getServiceRestPath(service)
		const headers = { ...this.authDataProvider.createAuthHeaders(), ...params?.extraHeaders, v: String(modelVersion) }

		const encryptedEntity = await this.encryptDataIfNeeded(methodDefinition, requestEntity, service, method, params ?? null)

		const data: string | undefined = await this.restClient.request(path, method, {
			queryParams: params?.queryParams,
			headers,
			responseType: MediaType.Json,
			body: encryptedEntity ?? undefined,
			suspensionBehavior: params?.suspensionBehavior,
			baseUrl: params?.baseUrl,
		})

		if (methodDefinition.return) {
			return await this.decryptResponse(methodDefinition.return, data as string, params)
		}
	}

	private getMethodDefinition(service: AnyService, method: HttpMethod): MethodDefinition {
		switch (method) {
			case HttpMethod.GET:
				return (service as GetService)["get"]
			case HttpMethod.POST:
				return (service as PostService)["post"]
			case HttpMethod.PUT:
				return (service as PutService)["put"]
			case HttpMethod.DELETE:
				return (service as DeleteService)["delete"]
			case HttpMethod.PATCH:
				throw new ProgrammingError("Services do not implement PATCH for now")
		}
	}

	private async getModelVersion(methodDefinition: MethodDefinition): Promise<number> {
		// This is some kind of hack because we don't generate data for the whole model anywhere (unfortunately).
		const someTypeRef = methodDefinition.data ?? methodDefinition.return
		if (someTypeRef == null) {
			throw new ProgrammingError("Need either data or return for the service method!")
		}
		const model = await this.typeModelResolver.resolveClientTypeReference(someTypeRef)
		return model.version
	}

	private async encryptDataIfNeeded(
		methodDefinition: MethodDefinition,
		requestEntity: Entity | null,
		service: AnyService,
		method: HttpMethod,
		params: ExtraServiceParams | null,
	): Promise<string | null> {
		if (methodDefinition.data != null) {
			if (requestEntity == null || !isSameTypeRef(methodDefinition.data, requestEntity._type)) {
				throw new ProgrammingError(`Invalid service data! ${service.name} ${method}`)
			}

			const requestTypeModel = await this.typeModelResolver.resolveClientTypeReference(methodDefinition.data)
			if (requestTypeModel.encrypted && params?.sessionKey == null) {
				throw new ProgrammingError("Must provide a session key for an encrypted data transfer type!: " + service)
			}

			const encryptedUntypedInstance = await this.instancePipeline.mapAndEncrypt(requestEntity._type, requestEntity, params?.sessionKey ?? null)

			return JSON.stringify(encryptedUntypedInstance)
		} else {
			return null
		}
	}

	private async decryptResponse<T extends Entity>(typeRef: TypeRef<T>, data: string, params: ExtraServiceParams | undefined): Promise<T> {
		// Filter out __proto__ to avoid prototype pollution.
		const instance: ServerModelUntypedInstance = JSON.parse(data, (k, v) => (k === "__proto__" ? undefined : v))
		const serverTypeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		const cleanInstance = AttributeModel.removeNetworkDebuggingInfoIfNeeded<ServerModelUntypedInstance>(instance)
		const encryptedParsedInstance = await this.instancePipeline.typeMapper.applyJsTypes(serverTypeModel, cleanInstance)
		const entityAdapter = await EntityAdapter.from(serverTypeModel, encryptedParsedInstance, this.instancePipeline)
		const sessionKey = (await this.cryptoFacade().resolveServiceSessionKey(entityAdapter)) ?? params?.sessionKey ?? null

		return await this.instancePipeline.decryptAndMap(typeRef, cleanInstance, sessionKey)
	}
}

export function getServiceRestPath(service: ServiceDefinition) {
	return `/rest/${service.app.toLowerCase()}/${service.name.toLowerCase()}`
}
