import { Router } from "../../../common/gui/ScopedRouter"
import { QuickAction } from "../../../common/misc/quickactions/QuickActionsModel"
import { DRIVE_PREFIX } from "../../../common/misc/RouteChange"
import { showNewFileDialog, showNewFolderDialog } from "../view/DriveGuiUtils"
import { DriveViewModel } from "../view/DriveViewModel"

export async function quickDriveActions(router: Router, driveViewModel: DriveViewModel): Promise<readonly QuickAction[]> {
	const driveTabAction: QuickAction = {
		description: "Go to Drive", // FIXME
		exec: () => router.routeTo(DRIVE_PREFIX, {}),
	}

	// FIXME: there's probably a better way to do this.
	const inDrive = router.getFullPath().startsWith(DRIVE_PREFIX)

	let driveActions: readonly QuickAction[] = []
	if (inDrive) {
		driveActions = [
			{
				description: "Drive: Create new folder", // FIXME: translate
				exec: () =>
					showNewFolderDialog(
						(folderName) => driveViewModel.createNewFolder(folderName),
						() => driveViewModel.updateUi,
					),
			},
			{
				description: "Drive: Upload files", // FIXME: translate
				exec: () => showNewFileDialog((files) => driveViewModel.uploadFiles(files)),
			},
		]
	}

	return [driveTabAction, ...driveActions]
}
