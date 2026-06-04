import { FileReference } from "../../../../entities/tutanota/Utils"
import { NativeFileApp } from "../../../../app-kit/native-bridge/common/FileApp"
import { isDesktop, ProgrammingError } from "@tutao/app-env"

export class WebFileResolver {
	constructor(
		private readonly nativeApp: NativeApp,
		private readonly fileApp: NativeFileApp,
	) {
		if (!isDesktop()) {
			throw new ProgrammingError("WebFileResolver is for Desktop only!")
		}
	}

	async resolveWebFile(file: File): Promise<FileReference> {
		const path = this.nativeApp.getPathForFile(file)
		const [fileRef] = await this.fileApp.getFilesMetaData([path])
		return fileRef
	}
}
