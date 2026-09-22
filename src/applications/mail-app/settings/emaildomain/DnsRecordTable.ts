import { DnsRecordType } from "../../../../platform-kit/app-env"
import m, { Children } from "mithril"
import { DnsRecord } from "@tutao/entities/sys"
import { Card } from "../../../../ui/base/Card.js"
import { MenuTitle } from "../../../../ui/titles/MenuTitle.js"
import { TextField } from "../../../../ui/base/TextField.js"
import { IconButton, IconButtonAttrs } from "../../../../ui/base/IconButton.js"
import { Icons } from "../../../../ui/base/icons/Icons"
import { copyToClipboard } from "../../../../ui/utils/ClipboardUtils.js"
import { showInfoSnackbar } from "../../../../ui/base/SnackBar.js"

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

export type DnsRecordRow = { record: DnsRecord; helpInfo?: string[] }

function renderCopyButton(value: string): Children {
	return m(IconButton, {
		label: "copyToClipboard_action",
		icon: Icons.CopyOutline,
		click: async () => {
			await copyToClipboard(value)
			showInfoSnackbar("copied_msg")
		},
	})
}

function renderDnsRecordRow(row: DnsRecordRow): Children {
	return m(".flex.gap-8.items-start.mt-16", [
		m(TextField, {
			label: "type_label",
			value: DnsRecordTable[row.record.type as DnsRecordType],
			isReadOnly: true,
			class: "surface-background",
			style: { maxWidth: "110px" },
		}),
		m(TextField, {
			label: "dnsRecordHostOrName_label",
			value: row.record.subdomain ? row.record.subdomain : "@",
			isReadOnly: true,
			class: "surface-background",
		}),
		m(TextField, {
			label: "dnsRecordValueOrPointsTo_label",
			value: row.record.value,
			isReadOnly: true,
			class: "surface-background flex-grow",
			helpLabel: row.helpInfo && row.helpInfo.length ? () => row.helpInfo!.map((line) => m(".text-break", line)) : undefined,
			injectionsRight: () => renderCopyButton(row.record.value),
		}),
	])
}

export function renderDnsRecordsCard(records: DnsRecordRow[], opts?: { titleText?: string; refreshButtonAttrs?: IconButtonAttrs | null }): Children {
	return m(Card, { classes: ["mt-16"] }, [
		opts?.titleText || opts?.refreshButtonAttrs
			? m(".flex.justify-between.items-center", [
					opts?.titleText ? m(MenuTitle, { content: opts.titleText }) : m(""),
					opts?.refreshButtonAttrs ? m(IconButton, opts.refreshButtonAttrs) : null,
				])
			: null,
		records.map(renderDnsRecordRow),
	])
}

export function createDnsRecordTable(records: DnsRecord[]): Children {
	return renderDnsRecordsCard(records.map((record) => ({ record })))
}
