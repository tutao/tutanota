struct MailtoData: Equatable {
	let subject: String?
	let toRecipients: [String]
	let ccRecipients: [String]
	let bccRecipients: [String]
	let body: String?
}

extension MailtoData {
	init?(url: URL) {
		guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return nil }
		self.subject = components.queryItems?.first { $0.name == "subject" }?.value
		self.toRecipients = components.path.split(separator: ",").map { String($0) }
		self.ccRecipients = components.queryItems?.first { $0.name == "cc" }?.value?.split(separator: ",").map { String($0) } ?? []
		self.bccRecipients = components.queryItems?.first { $0.name == "bcc" }?.value?.split(separator: ",").map { String($0) } ?? []
		self.body = components.queryItems?.first { $0.name == "body" }?.value
	}
}
