/* generated file, don't edit. */

import { FileFacade } from "./FileFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class FileFacadeSendDispatcher implements FileFacade {
	constructor(private readonly transport: NativeInterface) {}
	async open(...args: Parameters<FileFacade["open"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "open", ...args])
	}
	async openFileChooser(...args: Parameters<FileFacade["openFileChooser"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "openFileChooser", ...args])
	}
	async openFolderChooser(...args: Parameters<FileFacade["openFolderChooser"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "openFolderChooser", ...args])
	}
	async deleteFile(...args: Parameters<FileFacade["deleteFile"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "deleteFile", ...args])
	}
	async getName(...args: Parameters<FileFacade["getName"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "getName", ...args])
	}
	async getMimeType(...args: Parameters<FileFacade["getMimeType"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "getMimeType", ...args])
	}
	async getSize(...args: Parameters<FileFacade["getSize"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "getSize", ...args])
	}
	async putFileIntoDownloadsFolder(...args: Parameters<FileFacade["putFileIntoDownloadsFolder"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "putFileIntoDownloadsFolder", ...args])
	}
	async upload(...args: Parameters<FileFacade["upload"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "upload", ...args])
	}
	async download(...args: Parameters<FileFacade["download"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "download", ...args])
	}
	async hashFile(...args: Parameters<FileFacade["hashFile"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "hashFile", ...args])
	}
	async clearFileData(...args: Parameters<FileFacade["clearFileData"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "clearFileData", ...args])
	}
	async joinFiles(...args: Parameters<FileFacade["joinFiles"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "joinFiles", ...args])
	}
	async splitFile(...args: Parameters<FileFacade["splitFile"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "splitFile", ...args])
	}
	async writeDataFile(...args: Parameters<FileFacade["writeDataFile"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "writeDataFile", ...args])
	}
	async readDataFile(...args: Parameters<FileFacade["readDataFile"]>) {
		return this.transport.invokeNative("ipc", ["FileFacade", "readDataFile", ...args])
	}
}
