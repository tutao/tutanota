import { createCustomDomainCheckGetIn } from "../../common/api/entities/sys/TypeRefs.js"
import type { CustomDomainCheckGetOut } from "../../common/api/entities/sys/TypeRefs.js"
import { CustomDomainCheckResult, DnsRecordType, DnsRecordValidation } from "../../common/api/common/TutanotaConstants"
import { LazyLoaded, noOp } from "@tutao/tutanota-utils"
import { lang } from "../../common/misc/LanguageViewModel"
import { assertMainOrNode } from "../../common/api/common/Env"
import { locator } from "../../common/api/main/CommonLocator"
import { CustomDomainCheckService } from "../../common/api/entities/sys/Services"

assertMainOrNode()

export class DomainDnsStatus {
	status: LazyLoaded<CustomDomainCheckGetOut>
	domain: string

	constructor(cleanDomainName: string, customerId?: Id) {
		this.domain = cleanDomainName
		this.status = new LazyLoaded(() => {
			let data = createCustomDomainCheckGetIn({
				domain: cleanDomainName,
				customer: customerId ?? null,
			})
			return locator.serviceExecutor.get(CustomDomainCheckService, data)
		})
	}

	getLoadedCustomDomainCheckGetOut(): CustomDomainCheckGetOut {
		return this.status.getLoaded()
	}

	/**
	 * Only checks for the required records (MX and spf) to be fine.
	 * We have this less strict check because one can already use the custom domain (with limitations) even if certain records like dmarc are not yet set properly.
	 * We want to allow finishing the dialogs succesfully even if just these basic check pass.
	 * @returns {boolean} true if records are fine.
	 */
	areRecordsFine(): boolean {
		if (!this.status.isLoaded() || this.status.getLoaded().checkResult !== CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_OK) {
			return false
		}

		const requiredMissingRecords = this.status
			.getLoaded()
			.missingRecords.filter((r) => r.type === DnsRecordType.DNS_RECORD_TYPE_MX || r.type === DnsRecordType.DNS_RECORD_TYPE_TXT_SPF)
		return !requiredMissingRecords.length
	}

	/**
	 * Checks that ALL records are fine. Even the ones that are only recommended.
	 * We need this check on top of areRecordsFine() because we want to display if some records are not yet set correctly even if the domain can already be used.
	 * @returns {boolean} true if all records are fine.
	 */
	areAllRecordsFine(): boolean {
		return (
			this.status.isLoaded() &&
			this.status.getLoaded().checkResult === CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_OK &&
			this.status.getLoaded().missingRecords.length === 0 &&
			this.status.getLoaded().invalidRecords.length === 0
		)
	}

	getDnsStatusInfo(): string {
		if (this.status.isLoaded()) {
			let result = this.status.getLoaded()

			if (result.checkResult === CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_OK) {
				let mxOk =
					!result.missingRecords.some((r) => r.type === DnsRecordType.DNS_RECORD_TYPE_MX) &&
					!result.invalidRecords.some((r) => r.type === DnsRecordType.DNS_RECORD_TYPE_MX)
				let spfOk =
					!result.missingRecords.some((r) => r.type === DnsRecordType.DNS_RECORD_TYPE_TXT_SPF) &&
					!result.invalidRecords.some((r) => r.type === DnsRecordType.DNS_RECORD_TYPE_TXT_SPF)
				let dkimOk =
					!result.missingRecords.some((r) => r.type === DnsRecordType.DNS_RECORD_TYPE_CNAME_DKIM) &&
					!result.invalidRecords.some((r) => r.type === DnsRecordType.DNS_RECORD_TYPE_CNAME_DKIM)
				let mtaStsOk =
					!result.missingRecords.some((r) => r.type === DnsRecordType.DNS_RECORD_TYPE_CNAME_MTA_STS) &&
					!result.invalidRecords.some((r) => r.type === DnsRecordType.DNS_RECORD_TYPE_CNAME_MTA_STS)
				let dmarcWarn = result.missingRecords.find((r) => r.type === DnsRecordType.DNS_RECORD_TYPE_TXT_DMARC)
				let dmarcBad = result.invalidRecords.find((r) => r.type === DnsRecordType.DNS_RECORD_TYPE_TXT_DMARC)
				return (
					"MX " +
					(mxOk ? DnsRecordValidation.OK : DnsRecordValidation.BAD) +
					", SPF " +
					(spfOk ? DnsRecordValidation.OK : DnsRecordValidation.BAD) +
					", MTA-STS " +
					(mtaStsOk ? DnsRecordValidation.OK : DnsRecordValidation.BAD) +
					", DKIM " +
					(dkimOk ? DnsRecordValidation.OK : DnsRecordValidation.BAD) +
					", DMARC " +
					(dmarcBad || dmarcWarn ? DnsRecordValidation.BAD : DnsRecordValidation.OK)
				)
			} else {
				return "DNS " + DnsRecordValidation.BAD
			}
		} else {
			return lang.get("loading_msg")
		}
	}

	loadCurrentStatus(): Promise<void> {
		if (this.status.isLoaded()) {
			// keep the old status as long as checking again
			return this.status.reload().then(noOp)
		} else {
			return this.status.getAsync().then(noOp)
		}
	}
}
