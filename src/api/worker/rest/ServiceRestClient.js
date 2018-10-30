//@flow
import {restClient} from "./RestClient"
import {locator} from "../WorkerLocator"
import {decryptAndMapToInstance, encryptAndMapToLiteral} from "../crypto/CryptoFacade"
import type {HttpMethodEnum} from "../../common/EntityFunctions"
import {MediaType, resolveTypeReference, TypeRef} from "../../common/EntityFunctions"
import {assertWorkerOrNode} from "../../Env"
import {neverNull} from "../../common/utils/Utils"

assertWorkerOrNode()

export function _service<T>(service: SysServiceEnum | TutanotaServiceEnum | MonitorServiceEnum, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: ?TypeRef<T>, queryParameter: ?Params, sk: ?Aes128Key, headers: ?Params): Promise<any> {
	return resolveTypeReference((requestEntity) ? requestEntity._type : (responseTypeRef: any))
		.then(modelForAppAndVersion => {
			let path = `/rest/${modelForAppAndVersion.app.toLowerCase()}/${service}`
			let queryParams = queryParameter != null ? queryParameter : {}
			if (!headers) {
				headers = locator.login.createAuthHeaders()
			}
			headers['v'] = modelForAppAndVersion.version

			let p: ?Promise<?Object> = null;
			if (requestEntity != null) {
				p = resolveTypeReference(requestEntity._type).then(requestTypeModel => {
					if (requestTypeModel.encrypted && sk == null) {
						return Promise.reject(new Error("must provide a session key for an encrypted data transfer type!: "
							+ service))
					}
					return encryptAndMapToLiteral(requestTypeModel, requestEntity, sk)
				})
			} else {
				p = Promise.resolve(null)
			}
			return p.then(encryptedEntity => {
				return restClient.request(path, method, queryParams, neverNull(headers), encryptedEntity ? JSON.stringify(encryptedEntity) : null, MediaType.Json)
				                 .then(data => {
					                 if (responseTypeRef) {
						                 return resolveTypeReference(responseTypeRef).then(responseTypeModel => {
							                 return decryptAndMapToInstance(responseTypeModel, JSON.parse(((data: any): string)), sk)
						                 })
					                 }
				                 })
			})
		})
}
