import { DataTransferEntity, Entity, isSameTypeRef, NON_EXISTENT_DATA_TRANSFER_ENTITY, ServiceDefinition, TypeRef } from "@tutao/meta"
import { RestClient } from "@tutao/rest-client"
import { HttpMethod, MediaType, RestTextBody, validateHttpMethod } from "@tutao/rest-client/types"
import { IServiceExecutor } from "./ServiceRequest.js"
import { assert, assertNotNull, downcast, isNotNull, lazy, Nullable } from "@tutao/utils"
import { assertWorkerOrNode, ProgrammingError } from "@tutao/app-env"
import { EntityAdapter, InstancePipeline, LoggedInUserProvider, SessionKeyResolver, TypeModelResolver } from "@tutao/instance-pipeline"
import { LoginIncompleteError } from "@tutao/rest-client/error"
import { DEFAULT_REST_CLIENT_OPTIONS, ExtraServiceParams } from "../instance-pipeline/RestClientOptions"
import { IncomingServerJson, OutgoingServerJson } from "../instance-pipeline/TypeMapper"
import { isNull } from "../utils/Utils"

assertWorkerOrNode()

export class ServiceExecutor implements IServiceExecutor {
	constructor(
		private readonly restClient: RestClient,
		private readonly authDataProvider: LoggedInUserProvider,
		private readonly instancePipeline: InstancePipeline,
		private readonly sessionKeyResolver: lazy<SessionKeyResolver>,
		private readonly typeModelResolver: TypeModelResolver,
	) {}

	public async execute<In extends DataTransferEntity, Out extends DataTransferEntity>(
		service: ServiceDefinition<In, Out>,
		requestEntity: In,
		params: Nullable<ExtraServiceParams>,
	): Promise<Out> {
		const method = validateHttpMethod(service.httpMethod)
		assert(method !== HttpMethod.PATCH, "Patch method for services are not yet implemented!")
		const requestTypeRef = service.requestTypeRef
		const returnTypeRef = service.returnTypeRef

		if (
			isNotNull(returnTypeRef) &&
			isNull(params?.sessionKey ?? null) &&
			(await this.typeModelResolver.resolveClientTypeReference(returnTypeRef)).encrypted &&
			!this.authDataProvider.isFullyLoggedIn()
		) {
			// Short-circuit before we do an actual request which we can't decrypt
			// If we have a session key passed it doesn't mean that it is for the return type, but it is likely
			// so we allow the request.
			throw new LoginIncompleteError(
				`Tried to make service request with encrypted return type but is not fully logged in yet, service: ${service.fullServiceName}`,
			)
		}

		// This is some kind of hack because we don't generate data for the whole model anywhere (unfortunately).
		let modelVersionOpt: Nullable<number> = null
		if (isNotNull(returnTypeRef)) {
			modelVersionOpt = (await this.typeModelResolver.resolveClientTypeReference(returnTypeRef)).version
		} else if (isNotNull(requestTypeRef)) {
			modelVersionOpt = (await this.typeModelResolver.resolveClientTypeReference(requestTypeRef)).version
		}

		const modelVersion = assertNotNull(modelVersionOpt)
		const headers = { ...this.authDataProvider.createAuthHeaders(), ...params?.extraHeaders, v: String(modelVersion) }
		const encryptedEntity = await this.encryptDataIfNeeded(requestEntity, service, params ?? null)
		const data: Nullable<string> = await this.restClient.request(service.serviceRestPath, method, {
			...DEFAULT_REST_CLIENT_OPTIONS,
			queryParams: params?.queryParams ?? null,
			headers,
			responseType: MediaType.Json,
			body: isNotNull(encryptedEntity) ? new RestTextBody(encryptedEntity.getJsonRepresentation()) : null,
			suspensionBehavior: params?.suspensionBehavior ?? DEFAULT_REST_CLIENT_OPTIONS.suspensionBehavior,
			baseUrl: params?.baseUrl ?? null,
		})

		if (isNull(returnTypeRef)) {
			if (data != null) {
				// FIXME: should this be an assertNull() instead?
				// what happens when we have a model change that adds a return type,
				// will server also return it for older client?
				console.error(`Server return some data when calling ${service.fullServiceName}. But this this service does not expect any return data`)
			}
			return downcast<Out>(NON_EXISTENT_DATA_TRANSFER_ENTITY)
		}
		const returnData = assertNotNull(
			data,
			`Expected service ${service.fullServiceName} to return data of type: ${returnTypeRef.toString()}. But got no response`,
		)
		return await this.decryptResponse<Out>(returnTypeRef, returnData, params)
	}

	private async encryptDataIfNeeded<In extends DataTransferEntity, Out extends DataTransferEntity>(
		requestEntity: Entity | null,
		service: ServiceDefinition<In, Out>,
		params: ExtraServiceParams | null,
	): Promise<Nullable<OutgoingServerJson>> {
		const requestTypeRef = service.requestTypeRef
		if (isNotNull(requestTypeRef)) {
			if (requestEntity == null || !isSameTypeRef(requestTypeRef, requestEntity._type)) {
				throw new ProgrammingError(`Invalid service data! ${service.fullServiceName}`)
			}

			const requestTypeModel = await this.typeModelResolver.resolveClientTypeReference(requestTypeRef)
			if (requestTypeModel.encrypted && params?.sessionKey == null) {
				throw new ProgrammingError(`Must provide a session key for an encrypted data transfer type!: ${service.fullServiceName}`)
			}

			return await this.instancePipeline.mapAndEncrypt(requestEntity._type, requestEntity, params?.sessionKey ?? null)
		} else {
			return null
		}
	}

	private async decryptResponse<T extends Entity>(typeRef: TypeRef<T>, data: string, params: Nullable<ExtraServiceParams> = null): Promise<T> {
		const typeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		const incomingJson = IncomingServerJson.expectSingleInstance(data, typeModel)
		const encryptedParsedInstance = await this.instancePipeline.typeMapper.parseServerJson(incomingJson)
		const entityAdapter = await EntityAdapter.fromEncryptedParsedInstance(
			encryptedParsedInstance,
			this.instancePipeline.modelMapper,
			this.instancePipeline.cryptoMapper,
		)
		const sessionKey = (await this.sessionKeyResolver().resolveServiceSessionKey(entityAdapter)) ?? params?.sessionKey ?? null

		return await this.instancePipeline.decryptAndMap(incomingJson, sessionKey)
	}
}
