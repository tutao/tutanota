import stream from "mithril/stream"
import Stream from "mithril/stream"
import {logins} from "../../api/main/LoginController"
import type {CustomerInfo} from "../../api/entities/sys/TypeRefs.js"
import type {DnsRecord} from "../../api/entities/sys/TypeRefs.js"
import {createDnsRecord} from "../../api/entities/sys/TypeRefs.js"
import {DnsRecordType} from "../../api/common/TutanotaConstants"
import m, {Children} from "mithril"
import {ColumnWidth, TableN} from "../../gui/base/TableN"
import type {EditAliasesFormAttrs} from "../EditAliasesFormN"
import {createEditAliasFormAttrs} from "../EditAliasesFormN"
import {AddEmailAddressesPage, AddEmailAddressesPageAttrs} from "./AddEmailAddressesPage"
import {DomainDnsStatus} from "../DomainDnsStatus"
import {VerifyOwnershipPage, VerifyOwnershipPageAttrs} from "./VerifyOwnershipPage"
import {VerifyDnsRecordsPage, VerifyDnsRecordsPageAttrs} from "./VerifyDnsRecordsPage"
import {EnterDomainPage, EnterDomainPageAttrs} from "./EnterDomainPage"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {createWizardDialog, wizardPageWrapper} from "../../gui/base/WizardDialogN"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()
export type AddDomainData = {
	domain: Stream<string>
	customerInfo: CustomerInfo
	expectedVerificationRecord: DnsRecord
	editAliasFormAttrs: EditAliasesFormAttrs
	domainStatus: DomainDnsStatus
}

export function showAddDomainWizard(domain: string, customerInfo: CustomerInfo): Promise<void> {
	const domainData: AddDomainData = {
		domain: stream(domain),
		customerInfo: customerInfo,
		expectedVerificationRecord: createDnsRecord(),
		editAliasFormAttrs: createEditAliasFormAttrs(logins.getUserController().userGroupInfo),
		domainStatus: new DomainDnsStatus(domain),
	}
	domainData.expectedVerificationRecord.type = DnsRecordType.DNS_RECORD_TYPE_TXT_SPF // not actually spf, but the type TXT only matters here

	domainData.expectedVerificationRecord.subdomain = null
	domainData.expectedVerificationRecord.value = "" // will be filled oncreate by the page

	const wizardPages = [
		wizardPageWrapper(EnterDomainPage, new EnterDomainPageAttrs(domainData)),
		wizardPageWrapper(VerifyOwnershipPage, new VerifyOwnershipPageAttrs(domainData)),
		wizardPageWrapper(AddEmailAddressesPage, new AddEmailAddressesPageAttrs(domainData)),
		wizardPageWrapper(VerifyDnsRecordsPage, new VerifyDnsRecordsPageAttrs(domainData)),
	]
	return new Promise(resolve => {
		const wizardBuilder = createWizardDialog(domainData, wizardPages, () => {
			resolve()
			return Promise.resolve()
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
				wizardAttrs.currentPage.attrs.nextAction(false).then(ready => {
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

const enum ActualDnsRecordType {
	MX = "MX",
	TXT = "TXT",
	CNAME = "CNAME",
}

export const DnsRecordTypeToDnsType: Record<DnsRecordType, ActualDnsRecordType> = Object.freeze({
	[DnsRecordType.DNS_RECORD_TYPE_MX]: ActualDnsRecordType.MX,
	[DnsRecordType.DNS_RECORD_TYPE_TXT_SPF]: ActualDnsRecordType.TXT,
	[DnsRecordType.DNS_RECORD_TYPE_CNAME_DKIM]: ActualDnsRecordType.CNAME,
	[DnsRecordType.DNS_RECORD_TYPE_TXT_DMARC]: ActualDnsRecordType.TXT,
	[DnsRecordType.DNS_RECORD_TYPE_CNAME_MTA_STS]: ActualDnsRecordType.CNAME,
	[DnsRecordType.DNS_RECORD_TYPE_TXT_VERIFY]: ActualDnsRecordType.TXT,
})

export function createDnsRecordTableN(records: ValidatedDnSRecord[], refreshButtonAttrs: ButtonAttrs | null): Children {
	return m(TableN, {
		columnHeading: ["type_label", "dnsRecordHostOrName_label", "dnsRecordValueOrPointsTo_label"],
		addButtonAttrs: refreshButtonAttrs,
		columnWidths: [ColumnWidth.Small, ColumnWidth.Small, ColumnWidth.Largest],
		showActionButtonColumn: true,
		lines: records.map(r => {
			return {
				cells: () => [
					{
						main: DnsRecordTypeToDnsType[r.record.type as DnsRecordType],
					},
					{
						main: r.record.subdomain ? r.record.subdomain : "@",
					},
					{
						main: r.record.value,
						info: r.helpInfo,
					},
				],
			}
		}),
	})
}

export function createDnsRecordTable(records: DnsRecord[]): Children {
	return m(TableN, {
		columnHeading: ["type_label", "dnsRecordHostOrName_label", "dnsRecordValueOrPointsTo_label"],
		columnWidths: [ColumnWidth.Small, ColumnWidth.Small, ColumnWidth.Largest],
		showActionButtonColumn: false,
		lines: records.map(r => ({
			cells: [DnsRecordTypeToDnsType[r.type as DnsRecordType], r.subdomain ? r.subdomain : "@", r.value],
		})),
	})
}