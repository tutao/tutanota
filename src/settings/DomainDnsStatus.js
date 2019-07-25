// @flow
import {createCustomDomainCheckData} from "../api/entities/sys/CustomDomainCheckData"
import {serviceRequest} from "../api/main/Entity"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {CustomDomainCheckReturnTypeRef} from "../api/entities/sys/CustomDomainCheckReturn"
import {CustomDomainCheckResult, DnsRecordType} from "../api/common/TutanotaConstants"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"

assertMainOrNode()

export class DomainDnsStatus {

	status: LazyLoaded<CustomDomainCheckReturn>;
	domain: string;

	constructor(cleanDomainName: string) {
		this.domain = cleanDomainName
		this.status = new LazyLoaded(() => {
			let data = createCustomDomainCheckData()
			data.domain = cleanDomainName
			return serviceRequest(SysService.CustomDomainCheckService, HttpMethod.GET, data, CustomDomainCheckReturnTypeRef)
		}, null)
	}

	getLoadedCustomDomainCheckReturn(): CustomDomainCheckReturn {
		return this.status.getLoaded()
	}

	areAllRecordsFine(): boolean {
		return this.status.isLoaded()
			&& this.status.getLoaded().checkResult === CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_OK
			&& this.status.getLoaded().missingRecords.length === 0
			&& this.status.getLoaded().invalidRecords.length === 0
	}

	getDnsStatusInfo(): string {
		if (this.status.isLoaded()) {
			let ok = "✓"
			let bad = "✗"
			let warn = "⚠"
			let result = this.status.getLoaded()
			if (result.checkResult === CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_OK) {
				let mxOk = !result.missingRecords.find(r => r.type === DnsRecordType.DNS_RECORD_TYPE_MX)
					&& !result.invalidRecords.find(r => r.type === DnsRecordType.DNS_RECORD_TYPE_MX)
				let spfOk = !result.missingRecords.find(r => r.type === DnsRecordType.DNS_RECORD_TYPE_TXT_SPF)
					&& !result.invalidRecords.find(r => r.type === DnsRecordType.DNS_RECORD_TYPE_TXT_SPF)
				let dkimOk = !result.missingRecords.find(r => r.type === DnsRecordType.DNS_RECORD_TYPE_CNAME_DKIM)
					&& !result.invalidRecords.find(r => r.type === DnsRecordType.DNS_RECORD_TYPE_CNAME_DKIM)
				let dmarcWarn = result.missingRecords.find(r => r.type === DnsRecordType.DNS_RECORD_TYPE_TXT_DMARC)
				let dmarcBad = result.invalidRecords.find(r => r.type === DnsRecordType.DNS_RECORD_TYPE_TXT_DMARC)
				return "MX " + (mxOk ? ok : bad)
					+ ", SPF " + (spfOk ? ok : bad)
					+ ", DKIM " + (dkimOk ? ok : bad)
					+ ", DMARC " + (dmarcBad ? bad : (dmarcWarn ? warn : ok));
			} else if (result.checkResult === CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_DNS_LOOKUP_FAILED) {
				return "DNS " + warn
			} else {
				return "DNS " + bad
			}
		} else {
			return lang.get("loading_msg")
		}
	}

	loadCurrentStatus(): Promise<void> {
		if (this.status.isLoaded()) {
			// keep the old status as long as checking again
			return this.status.reload().return()
		} else {
			return this.status.getAsync().return()
		}
	}
}
