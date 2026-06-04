import { showBrowserFolderChooser, showStandardsFileChooser } from "../../../common/file/FileController"
import { NativeFileApp } from "../../../../app-kit/native-bridge/common/FileApp.js"
import { CancelledError, isApp, isDesktop, ProgrammingError } from "@tutao/app-env"
import { PosRect } from "../../../../ui/utils/PosRect.js"
import { FileReference, WebFile } from "../../../../entities/tutanota/Utils"
import { DiskFolder, walkTree } from "./DriveUtils"
import { promiseMap } from "@tutao/utils"

/**
 * Wrapper for a browser or app file picker.
 */
export interface DriveFilePicker {
	pickFiles(rect: PosRect): Promise<FileReference[] | WebFile[]>

	pickFolders(rect: PosRect): Promise<DiskFolder<FileReference>[] | DiskFolder<WebFile>[]>
}

export class WebFilePicker implements DriveFilePicker {
	pickFiles(_rect: PosRect): Promise<WebFile[]> {
		return showStandardsFileChooser(true)
	}
	pickFolders(_rect: PosRect): Promise<DiskFolder<WebFile>[]> {
		return showBrowserFolderChooser(true)
	}
}

export class AppFilePicker implements DriveFilePicker {
	constructor(private readonly fileApp: NativeFileApp) {
		if (!isApp() && !isDesktop()) {
			throw new ProgrammingError("Trying to use AppFilePicker in browser")
		}
	}

	pickFiles(rect: PosRect): Promise<FileReference[]> {
		return this.fileApp.openFileChooser(rect, undefined, true)
	}

	async pickFolders(_rect: PosRect): Promise<DiskFolder<FileReference>[]> {
		const dirPath = await this.fileApp.openFolderChooser()
		if (dirPath == null) throw new CancelledError("Folder chooser is CANCELED")
		const dir = await this.fileApp.readDirectory(dirPath)

		type DiskFolderWithPath = { folder: DiskFolder<FileReference>; path: string }
		const rootDiskFolder: DiskFolder<FileReference> = {
			name: dir.name,
			files: [],
			folders: [],
		}
		await walkTree({ path: dirPath, folder: rootDiskFolder }, async ({ path, folder: currentFolder }) => {
			const currentFolderChildren = await this.fileApp.readDirectory(path)
			const currentFolderFileRefs = await this.fileApp.getFilesMetaData(currentFolderChildren.files)
			const currentFolderFolderContents = await promiseMap(currentFolderChildren.folders, (f) => this.fileApp.readDirectory(f))
			const currentFolderDiskFolders: DiskFolderWithPath[] = currentFolderFolderContents.map((fc) => {
				return {
					path: fc.path,
					folder: {
						name: fc.name,
						files: [],
						folders: [],
					},
				}
			})
			currentFolder.files.push(...currentFolderFileRefs)
			currentFolder.folders.push(...currentFolderDiskFolders.map((f) => f.folder))

			return currentFolderDiskFolders
		})
		return [rootDiskFolder]
	}
}
