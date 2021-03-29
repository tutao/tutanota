// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/common/Env"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {DomainDnsStatus} from "./DomainDnsStatus"
import {renderCheckResult} from "./emaildomain/VerifyDnsRecordsPage"

assertMainOrNode()

/**
 * @pre domainStatus.status.isLoaded() == true
 */
export function showDnsCheckDialog(domainStatus: DomainDnsStatus) {
	let dialog = Dialog.showActionDialog({
		type: DialogType.EditLarger,
		title: () => lang.get("checkDnsRecords_action"),
		okActionTextId: "checkAgain_action",
		cancelActionTextId: "close_alt",
		child: () => renderCheckResult(domainStatus),
		okAction: () => {
			domainStatus.loadCurrentStatus().then(() => {
				if (domainStatus.areRecordsFine()) {
					dialog.close()
				} else {
					m.redraw()
				}
			})
		},
	}).setCloseHandler(() => {
		dialog.close()
	})
}
