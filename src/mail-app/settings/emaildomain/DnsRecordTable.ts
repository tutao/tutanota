import { DnsRecordType } from "../../../common/api/common/TutanotaConstants.js"
import { DnsRecord } from "../../../common/api/entities/sys/TypeRefs.js"
import m, { Children } from "mithril"
import { ColumnWidth, Table } from "../../../common/gui/base/Table.js"

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
		columnHeading: ["type_label", "dnsRecordHostOrName_label", "dnsRecordValueOrPointsTo_label"],
		columnWidths: [ColumnWidth.Small, ColumnWidth.Small, ColumnWidth.Largest],
		showActionButtonColumn: false,
		lines: records.map((r) => ({
			cells: [DnsRecordTable[r.type as DnsRecordType], r.subdomain ? r.subdomain : "@", r.value],
		})),
	})
}
