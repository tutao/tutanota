import { showStandardsFileChooser } from "../../../common/file/FileController"
import { NativeFileApp } from "../../../../app-kits/native-bridge/common/FileApp.js"
import { isApp, isDesktop, ProgrammingError } from "../../../../platform-kits/app-env"
import { PosRect } from "../../../../ui/utils/PosRect.js"
import { FileReference, WebFile } from "../../../../entities/tutanota/Utils"

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
