//@flow
import type {Request} from "../../api/common/Queue"

export interface NativeInterface {
	invokeNative(msg: Request): Promise<any>
}