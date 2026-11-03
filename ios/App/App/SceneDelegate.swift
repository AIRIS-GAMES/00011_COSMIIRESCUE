import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CosmiiBridgeViewController()
        window?.makeKeyAndVisible()
        if let response = connectionOptions.notificationResponse { CosmiiReminders.shared.didReceive(response: response) }

        if !connectionOptions.urlContexts.isEmpty { self.scene(scene, openURLContexts: connectionOptions.urlContexts) }
        for activity in connectionOptions.userActivities { self.scene(scene, continue: activity) }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: [
                .sourceApplication: context.options.sourceApplication as Any,
                .openInPlace: context.options.openInPlace
            ])
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }
}
