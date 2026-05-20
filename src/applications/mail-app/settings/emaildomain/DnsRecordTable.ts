import { DnsRecordType } from "../../../../platform-kit/app-env"
import m, { Children } from "mithril"
import { ColumnWidth, Table } from "../../../../ui/base/Table.js"
import { DnsRecord } from "@tutao/entities/sys"

const enum ActualDnsRecordType {
	MX = "MX",
	TXT = "TXT",
	CNAME = "CNAME",
}

export const DnsRecordTable: Record<DnsRecordType, ActualDnsRecordType> = Object.freeze({
	[DnsRecordType.DNS_RECORD_TYPE_MX]: ActualDnsRecordType.MX,
	[DnsRecordType.DNS_RECORD_TYPE_TXT_SPF]: ActualDnsRecordType.TXT,
	[DnsRecordType.DNS_RECORD_TYPE_CNAME_DKIM]: ActualDnsRecordType.CNAME,
	[DnsRecordType.DNS_RECORD_TYPE_TXT_DMARC]: ActualDnsRecordType.TXT,
	[DnsRecordType.DNS_RECORD_TYPE_CNAME_MTA_STS]: ActualDnsRecordType.CNAME,
	[DnsRecordType.DNS_RECORD_TYPE_TXT_VERIFY]: ActualDnsRecordType.TXT,
})

export function createDnsRecordTable(records: DnsRecord[]): Children {
	return m(Table, {
		columnHeading: ["type_label", "dnsRecordHostOrName_label"],
		columnWidths: [ColumnWidth.Small, ColumnWidth.Largest],
		showActionButtonColumn: false,
		lines: records.map((r) => ({
			cells: () => [{ main: DnsRecordTable[r.type as DnsRecordType] }, { main: r.subdomain ? r.subdomain : "@", info: [r.value] }],
		})),
	})
}
