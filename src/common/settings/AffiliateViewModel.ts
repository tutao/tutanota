import { IServiceExecutor } from "../api/common/ServiceRequest.js"
import { locator } from "../api/main/CommonLocator.js"
import { sysServices } from "@tutao/typeRefs"
import { sysTypeRefs } from "@tutao/typeRefs"

/**
 * Class containing state of the affiliate model.
 */
export class AffiliateViewModel {
	constructor() {}

	get isLoading(): boolean {
		return this._isLoading
	}

	get data(): sysTypeRefs.AffiliatePartnerKpiServiceGetOut | null {
		return this._data
	}

	private readonly serviceExecutor: IServiceExecutor = locator.serviceExecutor

	private _data: sysTypeRefs.AffiliatePartnerKpiServiceGetOut | null = null
	private _isLoading: boolean = true

	public async load() {
		try {
			this._data = await this.serviceExecutor.get(sysServices.AffiliatePartnerKpiService, null)
		} finally {
			this._isLoading = false
		}
	}
}
