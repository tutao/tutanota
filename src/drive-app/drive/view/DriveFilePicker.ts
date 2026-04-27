import { FileReference, WebFile } from "../../../common/api/common/utils/FileUtils"
import { showStandardsFileChooser } from "../../../common/file/FileController"
import { NativeFileApp } from "@tutao/native-bridge/common"
import { isApp, isDesktop, ProgrammingError } from "@tutao/app-env"
import { PosRect } from "@tutao/native-bridge/shared"

/**
 * Wrapper for a browser or app file picker.
 */
export interface DriveFilePicker {
	pickFiles(rect: PosRect): Promise<FileReference[] | WebFile[]>
}

export class WebFilePicker implements DriveFilePicker {
	pickFiles(_rect: PosRect): Promise<WebFile[]> {
		return showStandardsFileChooser(true)
	}
}

export class AppFilePicker implements DriveFilePicker {
	constructor(private readonly fileApp: NativeFileApp) {
		if (!isApp() && !isDesktop()) {
			throw new ProgrammingError("Trying to use AppFilePicker in browser")
		}
	}

	pickFiles(rect: PosRect): Promise<FileReference[]> {
		return this.fileApp.openFileChooser(rect)
	}
}
