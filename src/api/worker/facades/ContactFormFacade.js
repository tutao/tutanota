// @flow
import {HttpMethod, resolveTypeReference} from "../../common/EntityFunctions"
import {typeRefToPath} from "../rest/EntityRestClient"
import type {ContactForm} from "../../entities/tutanota/ContactForm"
import {ContactFormTypeRef} from "../../entities/tutanota/ContactForm"
import {decryptAndMapToInstance} from "../crypto/CryptoFacade"
import {RestClient} from "../rest/RestClient"
import {assertWorkerOrNode} from "../../common/Env"

assertWorkerOrNode()

export interface ContactFormFacade {
	loadContactForm(formId: string): Promise<ContactForm>;
}

export class ContactFormFacadeImpl implements ContactFormFacade {
	+_restClient: RestClient;

	constructor(restClient: RestClient) {
		this._restClient = restClient
	}

	loadContactForm(formId: string): Promise<ContactForm> {
		return resolveTypeReference(ContactFormTypeRef).then(model => {
			let path = typeRefToPath(ContactFormTypeRef)
			return this._restClient.request(path + "/" + formId, HttpMethod.GET, {}, {v: model.version}, null,
				"application/json", null).then(json => {
				let data = JSON.parse((json: string))
				return decryptAndMapToInstance(model, data)
			})
		})
	}
}