// @flow
import {assertWorkerOrNode} from "../../Env"
import {restClient} from "../rest/RestClient"
import {HttpMethod, resolveTypeReference} from "../../common/EntityFunctions"
import {typeRefToPath} from "../rest/EntityRestClient"
import {ContactFormTypeRef} from "../../entities/tutanota/ContactForm"
import {decryptAndMapToInstance} from "../crypto/CryptoFacade"

assertWorkerOrNode()

export function loadContactForm(formId: string): Promise<ContactForm> {
	return resolveTypeReference(ContactFormTypeRef).then(model => {
		let path = typeRefToPath(ContactFormTypeRef)
		return restClient.request(path + "/" + formId, HttpMethod.GET, {}, {v: model.version}, null, "application/json", null).then(json => {
			let data = JSON.parse((json:string))
			return decryptAndMapToInstance(model, data)
		})
	})
}