import { daysToMillis } from "@tutao/app-env"

const REVOCATION_OPTION_MAX_AGE_DAYS = 16

export function shouldOfferSubscriptionRevocation(businessUse: boolean, activationTime: Date | null, now: Date = new Date()): boolean {
	return !businessUse && activationTime != null && activationTime.getTime() > now.getTime() - daysToMillis(REVOCATION_OPTION_MAX_AGE_DAYS)
}
