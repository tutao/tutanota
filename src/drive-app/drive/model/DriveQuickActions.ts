import { Router } from "../../../common/gui/ScopedRouter"
import { QuickAction } from "../../../common/misc/quickactions/QuickActionsModel"
import { DRIVE_PREFIX } from "../../../common/misc/RouteChange"
import { showNewFileDialog, showNewFolderDialog } from "../view/DriveGuiUtils"
import { DriveViewModel } from "../view/DriveViewModel"
import { lang } from "../../../common/misc/LanguageViewModel"

export async function quickDriveActions(router: Router, driveViewModel: DriveViewModel): Promise<readonly QuickAction[]> {
	const driveTabAction: QuickAction = {
		description: lang.getTranslationText("driveView_action"),
		exec: () => router.routeTo(DRIVE_PREFIX, {}),
	}

	const inDrive = router.getFullPath().startsWith(DRIVE_PREFIX)

	let driveActions: readonly QuickAction[] = []
	if (inDrive) {
		driveActions = [
			{
				description: `${lang.getTranslationText("driveView_action")}: ${lang.getTranslationText("createFolder_action")}`,
				exec: () =>
					showNewFolderDialog(
						(folderName) => driveViewModel.createNewFolder(folderName),
						() => driveViewModel.updateUi,
					),
			},
			{
				description: `${lang.getTranslationText("driveView_action")}: ${lang.getTranslationText("uploadFile_action")}`,
				exec: () => showNewFileDialog((files) => driveViewModel.uploadFiles(files)),
			},
		]
	}

	return [driveTabAction, ...driveActions]
}
