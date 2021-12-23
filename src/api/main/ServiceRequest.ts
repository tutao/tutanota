import type {HttpMethod} from "../common/EntityFunctions"
import {TypeRef} from "@tutao/tutanota-utils"
import {locator} from "./MainLocator"
import {assertMainOrNode} from "../common/Env"
assertMainOrNode()
type Service = SysService TutanotaService MonitorService AccountingService
export function serviceRequest<T>(
    service: Service,
    method: HttpMethod,
    requestEntity: any | null,
    responseTypeRef: TypeRef<T>,
    queryParams: Params | null,
    sk: Aes128Key | null,
    extraHeaders?: Params,
): Promise<T> {
    return locator.worker.serviceRequest(service, method, requestEntity, responseTypeRef, queryParams, sk, extraHeaders)
}
export function serviceRequestVoid<T>(
    service: Service,
    method: HttpMethod,
    requestEntity: any | null,
    queryParams: Params | null,
    sk: Aes128Key | null,
    extraHeaders?: Params,
): Promise<void> {
    return locator.worker.serviceRequest(service, method, requestEntity, null, queryParams, sk, extraHeaders)
}