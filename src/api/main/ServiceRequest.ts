import type {HttpMethod} from "../common/EntityFunctions"
import {TypeRef} from "@tutao/tutanota-utils"
import {locator} from "./MainLocator"
import {assertMainOrNode} from "../common/Env"
import {SysService} from "../entities/sys/Services";
import {TutanotaService} from "../entities/tutanota/Services";
import {MonitorService} from "../entities/monitor/Services";
import {AccountingService} from "../entities/accounting/Services";

assertMainOrNode()

type Service = SysService | TutanotaService | MonitorService | AccountingService

export function serviceRequest<T>(
	service: Service,
	method: HttpMethod,
	requestEntity?: any,
	responseTypeRef?: TypeRef<T>,
	queryParams?: Dict,
	sk?: Aes128Key,
	extraHeaders?: Dict,
): Promise<T> {
	return locator.worker.serviceRequest(service, method, requestEntity, responseTypeRef, queryParams, sk, extraHeaders)
}

export function serviceRequestVoid<T>(
	service: Service,
	method: HttpMethod,
	requestEntity?: any,
	queryParams?: Dict,
	sk?: Aes128Key,
	extraHeaders?: Dict,
): Promise<void> {
	return locator.worker.serviceRequest(service, method, requestEntity, undefined, queryParams, sk, extraHeaders)
}