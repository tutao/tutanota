import type {Request} from "../../api/common/MessageDispatcher"
import type {OfflineDbFacade} from "../../desktop/db/OfflineDbFacade"

export interface NativeInterface {
	invokeNative(msg: Request<NativeRequestType>): Promise<any>
}

export interface ExposedNativeInterface {
	offlineDbFacade: OfflineDbFacade
}