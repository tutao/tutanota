// @flow
import type {HttpMethodEnum} from "../common/EntityFunctions"

import {_service} from "./rest/ServiceRestClient"
import {locator} from "./WorkerLocator"
import {TypeRef} from "@tutao/tutanota-utils";
import {assertWorkerOrNode} from "../common/Env"

assertWorkerOrNode()

export function serviceRequest<T>(service: SysServiceEnum | TutanotaServiceEnum | MonitorServiceEnum | StorageServiceEnum, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: TypeRef<T>, queryParams: ?Params, sk: ?Aes128Key, extraHeaders?: Params): Promise<T> {
	return _service(service, method, requestEntity, responseTypeRef, queryParams, sk, extraHeaders)
}

export function serviceRequestVoid<T>(service: SysServiceEnum | TutanotaServiceEnum | MonitorServiceEnum | AccountingServiceEnum,
                                      method: HttpMethodEnum, requestEntity: ?any, queryParams: ?Params, sk: ?Aes128Key, extraHeaders?: Params): Promise<void> {
	return _service(service, method, requestEntity, null, queryParams, sk, extraHeaders)
}
