import { Dialog, DialogType } from "../../common/gui/base/Dialog"
import { DomainDnsStatus } from "./DomainDnsStatus"
import { renderCheckResult } from "./emaildomain/VerifyDnsRecordsPage"
import { assertMainOrNode } from "../../common/api/common/Env"
import { showProgressDialog } from "../../common/gui/dialogs/ProgressDialog"

assertMainOrNode()

/**
 * @pre domainStatus.status.isLoaded() == true
 */
export function showDnsCheckDialog(domainStatus: DomainDnsStatus) {
	const dialog = Dialog.showActionDialog({
		type: DialogType.EditLarger,
		title: "checkDnsRecords_action",
		okActionTextId: "checkAgain_action",
		cancelActionTextId: "close_alt",
		child: () => renderCheckResult(domainStatus, true),
		okAction: async () => {
			// Close the dialog, since once loadCurrentStatus is called, domainStatus will be invalidated until it's
			// finished loading
			dialog.close()

			await showProgressDialog("loadingDNSRecords_msg", domainStatus.loadCurrentStatus())

			if (!domainStatus.areRecordsFine()) {
				dialog.show()
			}
		},
	})
}
