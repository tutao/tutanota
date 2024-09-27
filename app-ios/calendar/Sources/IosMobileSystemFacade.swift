import Contacts
import Foundation
import TutanotaSharedFramework

private let APP_LOCK_METHOD = "AppLockMethod"

class IosMobileSystemFacade: MobileSystemFacade {
	private let viewController: ViewController
	private let userPreferencesProvider: UserPreferencesProvider
	private let appLockHandler: AppLockHandler

	init(viewController: ViewController, userPreferencesProvider: UserPreferencesProvider, appLockHandler: AppLockHandler) {
		self.viewController = viewController
		self.userPreferencesProvider = userPreferencesProvider
		self.appLockHandler = appLockHandler
	}

	func getAppLockMethod() async throws -> TutanotaSharedFramework.AppLockMethod {
		self.userPreferencesProvider.getObject(forKey: APP_LOCK_METHOD).map { method in AppLockMethod(rawValue: method as! String)! } ?? .none
	}

	func setAppLockMethod(_ method: TutanotaSharedFramework.AppLockMethod) async throws {
		self.userPreferencesProvider.setValue(method.rawValue, forKey: APP_LOCK_METHOD)
	}

	func enforceAppLock(_ method: TutanotaSharedFramework.AppLockMethod) async throws { try await self.appLockHandler.showAppLockPrompt(method) }

	func getSupportedAppLockMethods() async throws -> [TutanotaSharedFramework.AppLockMethod] {
		var supportedMethods = [AppLockMethod.none]

		if self.appLockHandler.isSystemPasswordSupported() { supportedMethods.append(.system_pass_or_biometrics) }
		if self.appLockHandler.isBiometricsSupported() { supportedMethods.append(.biometrics) }

		return supportedMethods
	}

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
			if !isPermissionGranted { throw TutanotaSharedFramework.PermissionError(message: "Notification Permission was not granted.") }
		}
	}
}
