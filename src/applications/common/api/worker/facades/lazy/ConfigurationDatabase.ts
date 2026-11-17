import { ExternalImageRule, NewsletterBannerRule } from "../../../../../../entities/tutanota/Utils"

export interface ConfigurationDatabase {
	addExternalImageRule(address: string, rule: ExternalImageRule): Promise<void>
	getExternalImageRule(address: string): Promise<ExternalImageRule>
	addNewsletterBannerRule(address: string, rule: NewsletterBannerRule): Promise<void>
	getNewsletterBannerRule(address: string): Promise<NewsletterBannerRule>
}
