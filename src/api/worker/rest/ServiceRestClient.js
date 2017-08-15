//@flow
import {restClient, MediaType} from "./RestClient"
import {loginFacade} from "../facades/LoginFacade"
import {decryptAndMapToInstance, encryptAndMapToLiteral} from "../crypto/CryptoFacade"
import {resolveTypeReference, TypeRef} from "../../common/EntityFunctions"
import {assertWorkerOrNode} from "../../Env"

assertWorkerOrNode()

export function _service<T>(service: SysServiceEnum|TutanotaServiceEnum|MonitorServiceEnum, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: ?TypeRef<T>, queryParameter: ?Params, sk: ?Aes128Key): Promise<any> {
	return resolveTypeReference((requestEntity) ? requestEntity._type : (responseTypeRef:any)).then(modelForAppAndVersion => {
		let path = `/rest/${modelForAppAndVersion.app.toLowerCase()}/${service}`
		let queryParams = queryParameter != null ? queryParameter : {}
		let headers = loginFacade.createAuthHeaders()
		headers['v'] = modelForAppAndVersion.version

		let p: ?Promise<?Object> = null;
		if (requestEntity != null) {
			p = resolveTypeReference(requestEntity._type).then(requestTypeModel => {
				if (requestTypeModel.encrypted && sk == null) {
					return Promise.reject(new Error("must provide a session key for an encrypted data transfer type!: " + service))
				}
				return encryptAndMapToLiteral(requestTypeModel, requestEntity, sk)
			})
		} else {
			p = Promise.resolve(null)
		}
		return p.then(encryptedEntity => {
			return restClient.request(path, method, queryParams, headers, encryptedEntity ? JSON.stringify(encryptedEntity) : null, MediaType.Json).then(data => {
				if (responseTypeRef) {
					return resolveTypeReference(responseTypeRef).then(responseTypeModel => {
						return decryptAndMapToInstance(responseTypeModel, JSON.parse(((data:any):string)))
					})
				}
			})
		})
	})
}
