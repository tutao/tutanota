import Contacts
import TutanotaSharedFramework
import Foundation

class IosMobileSystemFacade: MobileSystemFacade {
	private let viewController: ViewController

	init(viewController: ViewController) { self.viewController = viewController }

	func goToSettings() async throws {
		DispatchQueue.main.async {
			let url = URL(string: UIApplication.openSettingsURLString)!
			UIApplication.shared.open(url)
		}
	}

	@MainActor func openLink(_ uri: String) async throws -> Bool {
		await withCheckedContinuation({ continuation in
			UIApplication.shared.open(URL(string: uri)!, options: [:]) { success in continuation.resume(returning: success) }
		})
	}

	@MainActor func shareText(_ text: String, _ title: String) async throws -> Bool {
		// code from here: https://stackoverflow.com/a/35931947
		let activityViewController = UIActivityViewController(activityItems: [text], applicationActivities: nil)
		activityViewController.popoverPresentationController?.sourceView = self.viewController.view  // so that iPads won't crash

		self.viewController.present(activityViewController, animated: true, completion: nil)
		return true
	}
	func hasPermission(_ permission: PermissionType) async throws -> Bool {
		switch permission {
		case PermissionType.contacts:
			let status = CNContactStore.authorizationStatus(for: .contacts)
			return status == .authorized
		case PermissionType.ignore_battery_optimization:
			// This permission does not exist in iOS, only on Android
			return true
		case PermissionType.notification:
			let settings = await UNUserNotificationCenter.current().notificationSettings()
			return settings.authorizationStatus == .authorized
		}
	}

	func requestPermission(_ permission: PermissionType) async throws {
		switch permission {
		case PermissionType.contacts: try await acquireContactsPermission()
		case PermissionType.ignore_battery_optimization:
			// This permission does not exist in iOS, only on Android
			return
		case PermissionType.notification:
			let isPermissionGranted = try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])
			if !isPermissionGranted { throw PermissionError(message: "Notification Permission was not granted.") }
		}
	}
}
