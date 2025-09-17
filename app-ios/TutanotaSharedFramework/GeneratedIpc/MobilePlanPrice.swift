/* generated file, don't edit. */


public struct MobilePlanPrice : Codable {
	public init(
		name: String,
		rawMonthlyPerMonth: Int,
		rawYearlyPerYear: Int,
		rawOfferYearlyPerYear: Int?,
		displayMonthlyPerMonth: String,
		displayYearlyPerYear: String,
		displayOfferYearlyPerYear: String?,
		isEligibleForIntroOffer: Bool
	) {
		self.name = name
		self.rawMonthlyPerMonth = rawMonthlyPerMonth
		self.rawYearlyPerYear = rawYearlyPerYear
		self.rawOfferYearlyPerYear = rawOfferYearlyPerYear
		self.displayMonthlyPerMonth = displayMonthlyPerMonth
		self.displayYearlyPerYear = displayYearlyPerYear
		self.displayOfferYearlyPerYear = displayOfferYearlyPerYear
		self.isEligibleForIntroOffer = isEligibleForIntroOffer
	}
	public let name: String
	public let rawMonthlyPerMonth: Int
	public let rawYearlyPerYear: Int
	public let rawOfferYearlyPerYear: Int?
	public let displayMonthlyPerMonth: String
	public let displayYearlyPerYear: String
	public let displayOfferYearlyPerYear: String?
	public let isEligibleForIntroOffer: Bool
}
