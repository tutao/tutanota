import { PosRect } from "../../../common/gui/base/Dropdown"
import { FileReference, WebFile } from "../../../common/api/common/utils/FileUtils"
import { showStandardsFileChooser } from "../../../common/file/FileController"
import { isApp, isDesktop } from "../../../common/api/common/Env"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"
import { NativeFileApp } from "../../../common/native/common/FileApp"

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
