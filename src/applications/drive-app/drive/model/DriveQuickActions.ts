import { Router } from "../../../../ui/ScopedThrottledRouter"
import { QuickAction } from "../../../common/misc/quickactions/QuickActionsModel"
import { DRIVE_PREFIX } from "../../../../ui/utils/RouteChange"
import { DriveViewModel } from "../view/DriveViewModel"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { getDetachedDropdownBounds } from "../../../../ui/base/GuiUtils"
import { DriveFilePicker } from "../view/DriveFilePicker"
import { showDuplicateFilesChoiceDialog, showNewFolderDialog } from "../view/DriveGuiUtils"

export async function quickDriveActions(router: Router, driveViewModel: DriveViewModel, driveFilePicker: DriveFilePicker): Promise<readonly QuickAction[]> {
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
				exec: () =>
					driveFilePicker.pickFiles(getDetachedDropdownBounds()).then((files) => driveViewModel.uploadFiles(files, showDuplicateFilesChoiceDialog)),
			},
		]
	}

	return [driveTabAction, ...driveActions]
}
