// @flow
import {assertWorkerOrNode} from "../../common/Env"
import {HttpMethod, resolveTypeReference} from "../../common/EntityFunctions"
import {typeRefToPath} from "../rest/EntityRestClient"
import type {ContactForm} from "../../entities/tutanota/ContactForm"
import {ContactFormTypeRef} from "../../entities/tutanota/ContactForm"
import {decryptAndMapToInstance} from "../crypto/CryptoFacade"
import {locator} from "../WorkerLocator"

assertWorkerOrNode()

export function loadContactForm(formId: string): Promise<ContactForm> {
	return resolveTypeReference(ContactFormTypeRef).then(model => {
		let path = typeRefToPath(ContactFormTypeRef)
		return locator.restClient.request(path + "/" + formId, HttpMethod.GET, {}, {v: model.version}, null,
			"application/json", null).then(json => {
			let data = JSON.parse((json: string))
			return decryptAndMapToInstance(model, data)
		})
	})
}