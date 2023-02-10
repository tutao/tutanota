import { HttpMethod, MediaType, resolveTypeReference } from "../../../common/EntityFunctions.js"
import { typeRefToPath } from "../../rest/EntityRestClient.js"
import type { ContactForm } from "../../../entities/tutanota/TypeRefs.js"
import { ContactFormTypeRef } from "../../../entities/tutanota/TypeRefs.js"
import { RestClient } from "../../rest/RestClient.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import { InstanceMapper } from "../../crypto/InstanceMapper.js"

assertWorkerOrNode()

export class ContactFormFacade {
	constructor(private readonly restClient: RestClient, private readonly instanceMapper: InstanceMapper) {}

	async loadContactForm(formId: string): Promise<ContactForm> {
		const model = await resolveTypeReference(ContactFormTypeRef)
		const path = typeRefToPath(ContactFormTypeRef)
		const json = await this.restClient.request(path + "/" + formId, HttpMethod.GET, { headers: { v: model.version }, responseType: MediaType.Json })
		const data = JSON.parse(json as string)
		return this.instanceMapper.decryptAndMapToInstance(model, data, null)
	}
}
