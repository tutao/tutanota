import type {HttpMethod} from "../common/EntityFunctions"
import {TypeRef} from "@tutao/tutanota-utils"
import {locator} from "./MainLocator"
import {assertMainOrNode} from "../common/Env"
import {SysService} from "../entities/sys/Services";
import {TutanotaService} from "../entities/tutanota/Services";
import {MonitorService} from "../entities/monitor/Services";
import {AccountingService} from "../entities/accounting/Services";
import type {Entity} from "../common/EntityTypes"

assertMainOrNode()

type Service = SysService | TutanotaService | MonitorService | AccountingService

export function serviceRequest<T>(
	service: Service,
	method: HttpMethod,
	requestEntity?: Entity | undefined | null,
	responseTypeRef?: T extends Entity ? TypeRef<T> : never,
	queryParams?: Dict,
	sk?: Aes128Key,
	extraHeaders?: Dict,
): Promise<T> {
	return locator.worker.serviceRequest(service, method, requestEntity, responseTypeRef, queryParams, sk, extraHeaders)
}

export function serviceRequestVoid(
	service: Service,
	method: HttpMethod,
	requestEntity?: Entity | undefined | null,
	queryParams?: Dict,
	sk?: Aes128Key,
	extraHeaders?: Dict,
): Promise<void> {
	return locator.worker.serviceRequest(service, method, requestEntity, undefined, queryParams, sk, extraHeaders)
}