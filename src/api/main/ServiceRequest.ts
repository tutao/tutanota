// @flow
import type {HttpMethodEnum} from "../common/EntityFunctions"
import {TypeRef} from "@tutao/tutanota-utils";
import {locator} from "./MainLocator"
import {assertMainOrNode} from "../common/Env"

assertMainOrNode()

type Service = SysServiceEnum | TutanotaServiceEnum | MonitorServiceEnum | AccountingServiceEnum

export function serviceRequest<T>(service: Service, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: TypeRef<T>,
                                  queryParams: ?Params, sk: ?Aes128Key, extraHeaders?: Params): Promise<T> {
	return locator.worker.serviceRequest(service, method, requestEntity, responseTypeRef, queryParams, sk, extraHeaders)
}

export function serviceRequestVoid<T>(service: Service, method: HttpMethodEnum, requestEntity: ?any, queryParams: ?Params,
                                      sk: ?Aes128Key, extraHeaders?: Params): Promise<void> {
	return locator.worker.serviceRequest(service, method, requestEntity, null, queryParams, sk, extraHeaders)
}