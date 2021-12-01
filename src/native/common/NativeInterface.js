//@flow
import type {Request} from "../../api/common/RemoteMessageDispatcher"

export interface NativeInterface {
	invokeNative(msg: Request<NativeRequestType>): Promise<any>
}