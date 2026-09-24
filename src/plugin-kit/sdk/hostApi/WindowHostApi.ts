import { Nullable } from "@tutao/utils"

type WindowId = number
export interface WindowHostApi {
	openWindow(url: string): Promise<Nullable<WindowId>>
	closeWindow(windowId: WindowId): Promise<void>
	isWindowOpen(windowId: WindowId): Promise<boolean>
	getHost(): Promise<string>
}
