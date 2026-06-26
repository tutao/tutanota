import { FileReference } from "../../../../entities/tutanota/Utils"
import { NativeFileApp } from "../../../../app-kit/native-bridge/common/FileApp"
import { isDesktop, ProgrammingError } from "@tutao/app-env"
import { DesktopSystemFacade } from "@tutao/native-bridge/generatedIpc/types"

export class WebFileResolver {
	constructor(
		private readonly nativeApp: NativeApp,
		private readonly fileApp: NativeFileApp,
		private readonly desktopSystemFacade: DesktopSystemFacade,
	) {
		if (!isDesktop()) {
			throw new ProgrammingError("WebFileResolver is for Desktop only!")
		}
	}

	async resolveWebFile(file: File): Promise<FileReference> {
		const path = this.nativeApp.getPathForFile(file)
		const fileUrl = await this.desktopSystemFacade.pathToFileUrl(path)
		const [fileRef] = await this.fileApp.getFilesMetaData([fileUrl])
		return fileRef
	}
}
