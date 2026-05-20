import { IServiceExecutor } from "../../../platform-kit/network/ServiceRequest.js"
import { locator } from "../api/main/CommonLocator.js"
import { AffiliatePartnerKpiService, AffiliatePartnerKpiServiceGetOut } from "@tutao/entities/sys"

/**
 * Class containing state of the affiliate model.
 */
export class AffiliateViewModel {
	constructor() {}

	get isLoading(): boolean {
		return this._isLoading
	}

	get data(): AffiliatePartnerKpiServiceGetOut | null {
		return this._data
	}

	private readonly serviceExecutor: IServiceExecutor = locator.serviceExecutor

	private _data: AffiliatePartnerKpiServiceGetOut | null = null
	private _isLoading: boolean = true

	public async load() {
		try {
			this._data = await this.serviceExecutor.get(AffiliatePartnerKpiService, null)
		} finally {
			this._isLoading = false
		}
	}
}
