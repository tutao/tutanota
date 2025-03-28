import AVFoundation
import Contacts
import Foundation
import StoreKit
import TutanotaSharedFramework

private let APP_LOCK_METHOD = "AppLockMethod"

class IosMobileSystemFacade: MobileSystemFacade {
	func requestWidgetRefresh() async throws {}
	func storeServerRemoteOrigin(_ origin: String) async throws {}
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

	@MainActor func openLink(_ uri: String) async throws -> Bool { await UIApplication.shared.open(URL(string: uri)!, options: [:]) }

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
		case PermissionType.camera:
			let status = AVCaptureDevice.authorizationStatus(for: .video)
			return status == .authorized
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
		case PermissionType.camera:
			let status = AVCaptureDevice.authorizationStatus(for: .video)
			var granted = status == .authorized

			if status == .notDetermined { granted = await AVCaptureDevice.requestAccess(for: .video) }
			if !granted { throw PermissionError(message: "Camera access was not granted.") }
		}
	}

	func openMailApp(_ query: String) async throws { TUTSLog("Tried to open Mail App from Mail App") }
	func openCalendarApp(_ query: String) async throws {
		guard let decodedQuery = String(data: Data(base64Encoded: query)!, encoding: .utf8) else {
			throw TutanotaSharedFramework.TutanotaError(message: "Failed to decode query string during interop")
		}
		let url = "tutacalendar://interop?\(decodedQuery)"

		if let url = URL(string: url), await UIApplication.shared.canOpenURL(url) {
			DispatchQueue.main.async { UIApplication.shared.open(url) }
		} else {
			DispatchQueue.main.async { UIApplication.shared.open(URL(string: "https://itunes.apple.com/us/app/id6657977811")!) }
		}
	}
	func getInstallationDate() async throws -> String {
		let documentsURL = try FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: false)
		let creationDate = try FileManager.default.attributesOfItem(atPath: documentsURL.path)[FileAttributeKey.creationDate] as! Date
		let creationTimeInMilliseconds = Int(creationDate.timeIntervalSince1970 * 1000)
		return String(creationTimeInMilliseconds)
	}
	func requestInAppRating() async throws {
		// TODO: Replace `SKStoreReviewController.requestReview()` with StoreKit's/SwiftUI's `requestReview()`
		// as `SKStoreReviewController.requestReview()` will be removed in iOS 19 (release roughly September 2025)
		// This will require migrating from UIKit to Swift UI
		let windowScene = await UIApplication.shared.connectedScenes.first as! UIWindowScene
		await SKStoreReviewController.requestReview(in: windowScene)
	}
}
