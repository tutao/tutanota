import {HttpMethod, MediaType, resolveTypeReference} from "../../common/EntityFunctions"
import {typeRefToPath} from "../rest/EntityRestClient"
import type {ContactForm} from "../../entities/tutanota/TypeRefs.js"
import {ContactFormTypeRef} from "../../entities/tutanota/TypeRefs.js"
import {RestClient} from "../rest/RestClient"
import {assertWorkerOrNode} from "../../common/Env"
import {InstanceMapper} from "../crypto/InstanceMapper"

assertWorkerOrNode()

export interface ContactFormFacade {
	loadContactForm(formId: string): Promise<ContactForm>
}

export class ContactFormFacadeImpl implements ContactFormFacade {
	readonly _restClient: RestClient
	_instanceMapper: InstanceMapper

	constructor(restClient: RestClient, instanceMapper: InstanceMapper) {
		this._restClient = restClient
		this._instanceMapper = instanceMapper
	}

	loadContactForm(formId: string): Promise<ContactForm> {
		return resolveTypeReference(ContactFormTypeRef).then(model => {
			let path = typeRefToPath(ContactFormTypeRef)
			return this._restClient
					   .request(
						   path + "/" + formId,
						   HttpMethod.GET,
						   {
							   headers: {
								   v: model.version,
							   },
							   responseType: MediaType.Json,
						   },
					   )
					   .then(json => {
						   let data = JSON.parse(json as string)
						   return this._instanceMapper.decryptAndMapToInstance(model, data, null)
					   })
		})
	}
}