import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
	var window: UIWindow?

	private var appDelegate: AppDelegate { UIApplication.shared.delegate as! AppDelegate }

	func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
		guard let windowScene = scene as? UIWindowScene else { return }
		let window = UIWindow(windowScene: windowScene)
		// appdelegate.viewController is nil in unit tests because they skip some setup stuff
		window.rootViewController = appDelegate.viewController ?? UIViewController()
		self.window = window
		window.makeKeyAndVisible()
		self.scene(scene, openURLContexts: connectionOptions.urlContexts)
	}

	func sceneDidBecomeActive(_ scene: UIScene) { appDelegate.sceneDidBecomeActive() }

	func sceneDidEnterBackground(_ scene: UIScene) { appDelegate.sceneDidEnterBackground() }

	func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
		for context in URLContexts { appDelegate.openURL(context.url, sourceApplication: context.options.sourceApplication) }
	}
}
