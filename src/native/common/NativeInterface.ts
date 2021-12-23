import type {Request} from "../../api/common/MessageDispatcher"
export interface NativeInterface {
    invokeNative(msg: Request<NativeRequestType>): Promise<any>
}