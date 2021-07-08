//@flow
import type {RestClient} from "./RestClient"
import {
	applyMigrations,
	applyMigrationsForInstance,
	decryptAndMapToInstance,
	encryptAndMapToLiteral,
	resolveSessionKey,
	setNewOwnerEncSessionKey
} from "../crypto/CryptoFacade"
import type {HttpMethodEnum} from "../../common/EntityFunctions"
import {HttpMethod, MediaType, resolveTypeReference} from "../../common/EntityFunctions"
import {assertWorkerOrNode} from "../../common/Env"
import {SessionKeyNotFoundError} from "../../common/error/SessionKeyNotFoundError"
import {PushIdentifierTypeRef} from "../../entities/sys/PushIdentifier"
import {NotAuthenticatedError} from "../../common/error/RestError"
import type {EntityUpdate} from "../../entities/sys/EntityUpdate"
import {isSameTypeRef, TypeRef} from "../../common/utils/TypeRef";

assertWorkerOrNode()

export function typeRefToPath(typeRef: TypeRef<any>): string {
	return `/rest/${typeRef.app}/${typeRef.type.toLowerCase()}`
}

export type AuthHeadersProvider = () => Params

/**
 * The EntityRestInterface provides a convenient interface for invoking server side REST services.
 */
export interface EntityRestInterface {

	/**
	 * Creates, reads, updates or deletes (CRUD) data on/from the server. Provided entities are encrypted before they are
	 * sent to the server and decrypted before they are returned.
	 * @param typeRef
	 * @param method
	 * @param id
	 * @param entity
	 * @param queryParams
	 * @return Resolves the entity / list of Entities delivered by the server or the elementId of the created entity.
	 */
	entityRequest<T>(typeRef: TypeRef<T>, method: HttpMethodEnum, listId: ?Id, id: ?Id, entity: ?T, queryParameter: ?Params, extraHeaders?: Params): Promise<?T | T[] | Id>;

	/**
	 * Must be called when entity events are received.
	 * @param batch The entity events that were received.
	 * @return Similar to the events in the data parementer, but reduced by the events which are obsolete.
	 */
	entityEventsReceived(batch: Array<EntityUpdate>): Promise<Array<EntityUpdate>>;
}

/**
 * Retrieves the instances from the backend (db) and converts them to entities.
 *
 * Part of this process is
 * * the decryption for the returned instances (GET) and the encryption of all instances before they are sent (POST, PUT)
 * * the injection of aggregate instances for the returned instances (GET)
 * * caching for retrieved instances (GET)
 *
 */
export class EntityRestClient implements EntityRestInterface {
	_authHeadersProvider: AuthHeadersProvider;
	_restClient: RestClient;

	constructor(authHeadersProvider: AuthHeadersProvider, restClient: RestClient) {
		this._authHeadersProvider = authHeadersProvider
		this._restClient = restClient
	}


	entityRequest<T>(typeRef: TypeRef<T>, method: HttpMethodEnum, listId: ?Id, id: ?Id, entity: ?T, queryParameter: ?Params, extraHeaders?: Params): Promise<any> {
		return resolveTypeReference(typeRef).then(model => {
			let path = typeRefToPath(typeRef)
			if (listId) {
				path += '/' + listId
			}
			if (id) {
				path += '/' + id
			}
			let queryParams = queryParameter == null ? {} : queryParameter
			const authHeaders = this._authHeadersProvider()
			const headers = Object.assign(authHeaders, extraHeaders)
			if (Object.keys(headers).length === 0) {
				throw new NotAuthenticatedError("user must be authenticated for entity requests")
			}
			headers['v'] = model.version
			if (method === HttpMethod.POST) {
				let sk = setNewOwnerEncSessionKey(model, (entity: any))
				return encryptAndMapToLiteral(model, entity, sk).then(encryptedEntity => {
					// we do not make use of the PersistencePostReturn anymore but receive all updates via PUSH only
					return this._restClient.request(path, method, queryParams, headers, JSON.stringify(encryptedEntity), MediaType.Json)
					           .then(persistencePostReturn => {
						           return JSON.parse(persistencePostReturn).generatedId
					           })
				})
			} else if (method === HttpMethod.PUT) {
				return resolveSessionKey(model, (entity: any))
					.then(sk => encryptAndMapToLiteral(model, entity, sk))
					.then(encryptedEntity => this._restClient.request(path, method, (queryParams: any), headers, JSON.stringify(encryptedEntity), MediaType.Json))
			} else if (method === HttpMethod.GET) {
				return this._restClient.request(path, method, queryParams, headers, null, MediaType.Json).then(json => {
					let data = JSON.parse((json: string))
					if (data instanceof Array) {
						let p = Promise.resolve()
						// PushIdentifier was changed in the system model v43 to encrypt the name.
						// We check here to check the type only once per array and not for each element.
						if (isSameTypeRef(typeRef, PushIdentifierTypeRef)) {
							p = Promise.map(data, instance => applyMigrations(typeRef, instance))
						}
						return p.then(() => {
							return Promise.map(data, instance =>
									resolveSessionKey(model, instance)
										.catch(SessionKeyNotFoundError, e => {
											console.log("could not resolve session key", e)
											return null // will result in _errors being set on the instance
										})
										.then(sk => decryptAndMapToInstance(model, instance, sk))
										.then(decryptedInstance => applyMigrationsForInstance(decryptedInstance)),
								{concurrency: 5})
						})
					} else {
						return applyMigrations(typeRef, data).then(data => {
							return resolveSessionKey(model, data).catch(SessionKeyNotFoundError, e => {
								console.log("could not resolve session key", e)
								return null // will result in _errors being set on the instance
							}).then(sk => {
								return decryptAndMapToInstance(model, data, sk)
							}).then(instance => {
								return applyMigrationsForInstance(instance)
							})
						})
					}
				})
			} else if (method === HttpMethod.DELETE) {
				return this._restClient.request(path, method, queryParams, headers)
			} else {
				return Promise.reject("Illegal method: " + method)
			}
		})
	}

	/**
	 * for the admin area (no cache available)
	 */
	entityEventsReceived(batch: Array<EntityUpdate>): Promise<Array<EntityUpdate>> {
		return Promise.resolve(batch)
	}

	getRestClient(): RestClient {
		return this._restClient
	}
}
