/* generated file, don't edit. */


public struct MobilePlanPrice : Codable {
	public init(
		name: String,
		rawMonthlyPerMonth: String,
		rawYearlyPerYear: String,
		rawYearlyPerMonth: String,
		displayMonthlyPerMonth: String,
		displayYearlyPerYear: String,
		displayYearlyPerMonth: String
	) {
		self.name = name
		self.rawMonthlyPerMonth = rawMonthlyPerMonth
		self.rawYearlyPerYear = rawYearlyPerYear
		self.rawYearlyPerMonth = rawYearlyPerMonth
		self.displayMonthlyPerMonth = displayMonthlyPerMonth
		self.displayYearlyPerYear = displayYearlyPerYear
		self.displayYearlyPerMonth = displayYearlyPerMonth
	}
	public let name: String
	public let rawMonthlyPerMonth: String
	public let rawYearlyPerYear: String
	public let rawYearlyPerMonth: String
	public let displayMonthlyPerMonth: String
	public let displayYearlyPerYear: String
	public let displayYearlyPerMonth: String
}
