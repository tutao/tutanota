import { serviceRequest, serviceRequestVoid } from "../ServiceRequestWorker";

export interface ServiceRestInterface {
	serviceRequest: typeof serviceRequest,
	serviceRequestVoid: typeof serviceRequestVoid
}