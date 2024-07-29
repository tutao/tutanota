import stream from "mithril/stream"
import Stream from "mithril/stream"
import type { CustomerInfo, DnsRecord } from "../../../common/api/entities/sys/TypeRefs.js"
import { createDnsRecord } from "../../../common/api/entities/sys/TypeRefs.js"
import { DnsRecordType } from "../../../common/api/common/TutanotaConstants"
import type { MailAddressTableAttrs } from "../../../common/settings/mailaddress/MailAddressTable.js"
import { AddEmailAddressesPage, AddEmailAddressesPageAttrs } from "./AddEmailAddressesPage"
import { DomainDnsStatus } from "../DomainDnsStatus"
import { VerifyOwnershipPage, VerifyOwnershipPageAttrs } from "./VerifyOwnershipPage"
import { VerifyDnsRecordsPage, VerifyDnsRecordsPageAttrs } from "./VerifyDnsRecordsPage"
import { EnterDomainPage, EnterDomainPageAttrs } from "./EnterDomainPage"
import { createWizardDialog, wizardPageWrapper } from "../../../common/gui/base/WizardDialog.js"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { MailAddressTableModel } from "../../../common/settings/mailaddress/MailAddressTableModel.js"
import { DialogType } from "../../../common/gui/base/Dialog.js"

assertMainOrNode()
export type AddDomainData = {
	domain: Stream<string>
	customerInfo: CustomerInfo
	expectedVerificationRecord: DnsRecord
	editAliasFormAttrs: MailAddressTableAttrs
	domainStatus: DomainDnsStatus
}

/** Shows a wizard for adding a custom email domain. */
export function showAddDomainWizard(domain: string, customerInfo: CustomerInfo, mailAddressTableModel: MailAddressTableModel): Promise<void> {
	let mailAddressTableExpanded: boolean = false

	const domainData: AddDomainData = {
		domain: stream(domain),
		customerInfo: customerInfo,
		// will be filled oncreate by the page
		// not actually spf, but the type TXT only matters here
		expectedVerificationRecord: createDnsRecord({ subdomain: null, type: DnsRecordType.DNS_RECORD_TYPE_TXT_SPF, value: "" }),
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
	return new Promise((resolve) => {
		const wizardBuilder = createWizardDialog(
			domainData,
			wizardPages,
			() => {
				mailAddressTableModel.dispose()
				resolve()
				return Promise.resolve()
			},
			DialogType.EditLarge,
		)
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
	record: DnsRecord
	helpInfo: string[]
}
