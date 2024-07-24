import Contacts

public func acquireContactsPermission() async throws {
	let hasPermission = await requestContactsPermission()
	if !hasPermission { throw PermissionError(message: "Missing permission to handle contacts") }
}

private func requestContactsPermission() async -> Bool {
	let status = CNContactStore.authorizationStatus(for: .contacts)
	switch status {
	case .authorized: return true
	case .denied, .restricted: return false
	case .notDetermined:
		do {
			// Yes it does throw and return a boolean. No, we don't get to know which one is when.
			return try await CNContactStore().requestAccess(for: .contacts)
		} catch {
			TUTSLog("Error while requesting contact access \(error)")
			return false
		}
	@unknown default:
		TUTSLog("Unknown auth status: \(status)")
		return false
	}
}
