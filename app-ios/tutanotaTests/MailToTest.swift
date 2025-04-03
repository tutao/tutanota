import Testing

@testable import tutanota

struct MailToTest {
	@Test func withEmptyUrl() {
		let url = URL(string: "mailto:")!
		let result = MailtoData(url: url)
		#expect(result == MailtoData(subject: nil, toRecipients: [], ccRecipients: [], bccRecipients: [], body: nil))
	}
	@Test func onlyToRecipients() {
		let url = URL(string: "mailto:someone@example.com")!
		let result = MailtoData(url: url)
		#expect(result == MailtoData(subject: nil, toRecipients: ["someone@example.com"], ccRecipients: [], bccRecipients: [], body: nil))
	}
	@Test func withMultipleToRecipients() {
		let url = URL(string: "mailto:someone@example.com,someoneelse@example.com")!
		let result = MailtoData(url: url)
		#expect(
			result
				== MailtoData(subject: nil, toRecipients: ["someone@example.com", "someoneelse@example.com"], ccRecipients: [], bccRecipients: [], body: nil)
		)
	}
	@Test func withToRecipientsAndBody() {
		let url = URL(string: "mailto:someone@example.com?body=This%20is%20the%20body")!
		let result = MailtoData(url: url)
		#expect(result == MailtoData(subject: nil, toRecipients: ["someone@example.com"], ccRecipients: [], bccRecipients: [], body: "This is the body"))
	}
	@Test func withToRecipientsSubjectAndBody() {
		let url = URL(string: "mailto:someone@example.com?subject=This%20is%20the%20subject&body=This%20is%20the%20body")!
		let result = MailtoData(url: url)
		#expect(
			result
				== MailtoData(
					subject: "This is the subject",
					toRecipients: ["someone@example.com"],
					ccRecipients: [],
					bccRecipients: [],
					body: "This is the body"
				)
		)
	}

}
