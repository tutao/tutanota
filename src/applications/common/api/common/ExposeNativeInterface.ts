import { exposeRemote } from "./WorkerProxy.js"
import type { ExposedNativeInterface, NativeInterface } from "../../../../app-kit/native-bridge/common/NativeInterface.js"

export function exposeNativeInterface(native: NativeInterface): ExposedNativeInterface {
	return exposeRemote((request) => native.invokeNative(request.requestType, request.args))
}
