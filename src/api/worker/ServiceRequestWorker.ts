import type {HttpMethod} from "../common/EntityFunctions"
import {_service} from "./rest/ServiceRestClient"
import {TypeRef} from "@tutao/tutanota-utils"
import {assertWorkerOrNode} from "../common/Env"
import type {TutanotaService} from "../entities/tutanota/Services";
import type {SysService} from "../entities/sys/Services";
import type {AccountingService} from "../entities/accounting/Services";
import type {MonitorService} from "../entities/monitor/Services";
import type {StorageService} from "../entities/storage/Services";
import type {Entity} from "../common/EntityTypes"

assertWorkerOrNode()

export function serviceRequest<T extends Entity>(
	service: SysService | TutanotaService | MonitorService | StorageService,
	method: HttpMethod,
	requestEntity: Entity | null | undefined,
	responseTypeRef?: TypeRef<T>,
	queryParams?: Dict,
	sk?: Aes128Key,
	extraHeaders?: Dict,
): Promise<T> {
	return _service(service, method, requestEntity, responseTypeRef, queryParams, sk, extraHeaders)
}

export function serviceRequestVoid<T extends Entity>(
	service: SysService | TutanotaService | MonitorService | AccountingService,
	method: HttpMethod,
	requestEntity: T,
	queryParams?: Dict,
	sk?: Aes128Key,
	extraHeaders?: Dict,
): Promise<void> {
	return _service(service, method, requestEntity, undefined, queryParams, sk, extraHeaders)
}