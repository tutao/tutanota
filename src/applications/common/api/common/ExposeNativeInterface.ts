import { exposeRemote } from "./WorkerProxy.js"
import type { ExposedNativeInterface, NativeInterface } from "../../../../app-kits/native-bridge/common/NativeInterface.js"

export function exposeNativeInterface(native: NativeInterface): ExposedNativeInterface {
	return exposeRemote((request) => native.invokeNative(request.requestType, request.args))
}
