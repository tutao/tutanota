import stream from "mithril/stream"
import Stream from "mithril/stream"
import { DnsRecordType } from "@tutao/app-env"
import type { MailAddressTableAttrs } from "../../../common/settings/mailaddress/MailAddressTable.js"
import { AddEmailAddressesPage, AddEmailAddressesPageAttrs } from "./AddEmailAddressesPage"
import { DomainDnsStatus } from "../DomainDnsStatus"
import { VerifyOwnershipPage, VerifyOwnershipPageAttrs } from "./VerifyOwnershipPage"
import { VerifyDnsRecordsPage, VerifyDnsRecordsPageAttrs } from "./VerifyDnsRecordsPage"
import { EnterDomainPage, EnterDomainPageAttrs } from "./EnterDomainPage"
import { createWizardDialog, wizardPageWrapper } from "../../../common/gui/base/WizardDialog.js"
import { assertMainOrNode } from "@tutao/app-env"
import { MailAddressTableModel } from "../../../common/settings/mailaddress/MailAddressTableModel.js"
import { DialogType } from "../../../common/gui/base/Dialog.js"

import { newPromise } from "@tutao/utils"
import { sysTypeRefs } from "@tutao/typerefs"

assertMainOrNode()
export type AddDomainData = {
	domain: Stream<string>
	customerInfo: sysTypeRefs.CustomerInfo
	expectedVerificationRecord: sysTypeRefs.DnsRecord
	editAliasFormAttrs: MailAddressTableAttrs
	domainStatus: DomainDnsStatus
}

/** Shows a wizard for adding a custom email domain. */
export function showAddDomainWizard(domain: string, customerInfo: sysTypeRefs.CustomerInfo, mailAddressTableModel: MailAddressTableModel): Promise<void> {
	let mailAddressTableExpanded: boolean = false

	const domainData: AddDomainData = {
		domain: stream(domain),
		customerInfo: customerInfo,
		// will be filled oncreate by the page
		// not actually spf, but the type TXT only matters here
		expectedVerificationRecord: sysTypeRefs.createDnsRecord({
			subdomain: null,
			type: DnsRecordType.DNS_RECORD_TYPE_TXT_SPF,
			value: "",
		}),
		editAliasFormAttrs: {
			model: mailAddressTableModel,
			expanded: mailAddressTableExpanded,
			onExpanded: (newExpanded) => (mailAddressTableExpanded = newExpanded),
		},
		domainStatus: new DomainDnsStatus(domain),
	}

	const wizardPages = [
		wizardPageWrapper(EnterDomainPage, new EnterDomainPageAttrs(domainData)),
		wizardPageWrapper(VerifyOwnershipPage, new VerifyOwnershipPageAttrs(domainData)),
		wizardPageWrapper(AddEmailAddressesPage, new AddEmailAddressesPageAttrs(domainData)),
		wizardPageWrapper(VerifyDnsRecordsPage, new VerifyDnsRecordsPageAttrs(domainData)),
	]
	return newPromise((resolve) => {
		const wizardBuilder = createWizardDialog({
			data: domainData,
			pages: wizardPages,
			closeAction: () => {
				mailAddressTableModel.dispose()
				resolve()
				return Promise.resolve()
			},
			dialogType: DialogType.EditLarge,
		})
		const wizard = wizardBuilder.dialog
		const wizardAttrs = wizardBuilder.attrs
		wizard.show()

		// we can skip the next two pages because we assume that the domain is already assigned if it was passed to the wizard
		if (domain.length) {
			wizardAttrs.goToNextPageOrCloseWizard()
			wizardAttrs.goToNextPageOrCloseWizard()

			if (wizardAttrs.currentPage) {
				// skip add email address page if an email address has been assigned
				wizardAttrs.currentPage.attrs.nextAction(false).then((ready) => {
					if (ready) wizardAttrs.goToNextPageOrCloseWizard()
				})
			}
		}
	})
}

export type ValidatedDnSRecord = {
	record: sysTypeRefs.DnsRecord
	helpInfo: string[]
}
