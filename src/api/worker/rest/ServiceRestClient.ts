import type {HttpMethod} from "../../common/EntityFunctions"
import {MediaType, resolveTypeReference} from "../../common/EntityFunctions"
import {downcast, neverNull, TypeRef} from "@tutao/tutanota-utils"
import {assertWorkerOrNode} from "../../common/Env"
import type {TutanotaService} from "../../entities/tutanota/Services";
import type {SysService} from "../../entities/sys/Services";
import type {AccountingService} from "../../entities/accounting/Services";
import type {MonitorService} from "../../entities/monitor/Services";
import type {StorageService} from "../../entities/storage/Services";
import {locator} from "../WorkerLocator";
import type {Entity} from "../../common/EntityTypes"

assertWorkerOrNode()

export function _service<T extends Entity>(
	service: SysService | TutanotaService | MonitorService | AccountingService | StorageService,
	method: HttpMethod,
	requestEntity?: any,
	responseTypeRef?: TypeRef<T>,
	queryParameter?: Dict,
	sk?: Aes128Key,
	extraHeaders?: Dict,
): Promise<any> {
	return resolveTypeReference(requestEntity ? requestEntity._type : downcast(responseTypeRef)).then(modelForAppAndVersion => {
		let path = `/rest/${modelForAppAndVersion.app.toLowerCase()}/${service}`
		let queryParams = queryParameter != null ? queryParameter : {}
		const headers = Object.assign(locator.login.createAuthHeaders(), extraHeaders)
		headers["v"] = modelForAppAndVersion.version
		let p: Promise<Record<string, any> | null> | null = null

		if (requestEntity != null) {
			p = resolveTypeReference(requestEntity._type).then(requestTypeModel => {
				if (requestTypeModel.encrypted && sk == null) {
					return Promise.reject(new Error("must provide a session key for an encrypted data transfer type!: " + service))
				}

				return locator.instanceMapper.encryptAndMapToLiteral(requestTypeModel, requestEntity, sk ?? null)
			})
		} else {
			p = Promise.resolve(null)
		}

		return p.then(encryptedEntity => {
			return locator.restClient
						  .request(path, method, queryParams, neverNull(headers), encryptedEntity ? JSON.stringify(encryptedEntity) : undefined, MediaType.Json)
						  .then(data => {
							  if (responseTypeRef) {
								  return resolveTypeReference(responseTypeRef).then(responseTypeModel => {
									  let instance = JSON.parse(data)
									  return locator.crypto.resolveServiceSessionKey(responseTypeModel, instance).then(resolvedSessionKey => {
										  return locator.instanceMapper.decryptAndMapToInstance(responseTypeModel, instance, resolvedSessionKey ? resolvedSessionKey : sk ?? null)
									  })
								  })
							  }
						  })
		})
	})
}