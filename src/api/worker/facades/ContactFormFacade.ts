import {HttpMethod, resolveTypeReference} from "../../common/EntityFunctions"
import {typeRefToPath} from "../rest/EntityRestClient"
import type {ContactForm} from "../../entities/tutanota/ContactForm"
import {ContactFormTypeRef} from "../../entities/tutanota/ContactForm"
import {RestClient} from "../rest/RestClient"
import {assertWorkerOrNode} from "../../common/Env"
import {locator} from "../WorkerLocator"
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
                    {},
                    {
                        v: model.version,
                    },
                    null,
                    "application/json",
                    null,
                )
                .then(json => {
                    let data = JSON.parse(json as string)
                    return this._instanceMapper.decryptAndMapToInstance(model, data)
                })
        })
    }
}