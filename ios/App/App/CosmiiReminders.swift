import UIKit
import UserNotifications
import Capacitor

// Fixed, one-shot reminders. No APNs token or server is needed.
final class CosmiiReminders: NSObject, NotificationHandlerProtocol {
    static let shared = CosmiiReminders()
    private let center = UNUserNotificationCenter.current()
    private let defaults = UserDefaults.standard
    private let enabledKey = "cosmii.reminders.enabled.v1"
    private let playedKey = "cosmii.reminders.lastPlayed.v1"
    private let tapsKey = "cosmii.reminders.taps.v1"
    private let langKey = "cosmii.reminders.lang.v1"
    private let ids = ["cosmii.return.d1", "cosmii.return.d7"]
    private var revision = 0
    var playing = false
    var enabled: Bool { defaults.bool(forKey: enabledKey) }

    override init() {
        super.init()
        NotificationCenter.default.addObserver(self, selector: #selector(background), name: UIApplication.didEnterBackgroundNotification, object: nil)
    }
    @objc private func background() { if playing { played(active: false) } }
    func played(active: Bool, lang: String? = nil) {
        playing = active
        if let lang = lang, lang == "ja" || lang == "en" { defaults.set(lang, forKey: langKey) }
        defaults.set(Date().timeIntervalSince1970, forKey: playedKey)
        center.removeDeliveredNotifications(withIdentifiers: ids)
        schedule()
    }
    func setLanguage(_ lang: String?) {
        guard let lang = lang, lang == "ja" || lang == "en", defaults.string(forKey: langKey) != lang else { return }
        defaults.set(lang, forKey: langKey)
        schedule()
    }
    func setEnabled(_ value: Bool) {
        defaults.set(value, forKey: enabledKey)
        schedule()
    }
    func schedule() {
        revision += 1
        let version = revision
        center.removePendingNotificationRequests(withIdentifiers: ids)
        if !enabled { center.removeDeliveredNotifications(withIdentifiers: ids); return }
        let playedAt = defaults.double(forKey: playedKey)
        guard playedAt > 0 else { return }
        center.getNotificationSettings { settings in
            DispatchQueue.main.async {
                guard version == self.revision, self.enabled,
                      settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional else { return }
                var delays: [TimeInterval] = [86400, 604800]
                #if DEBUG
                if ProcessInfo.processInfo.arguments.contains("-CosmiiReminderTesting") { delays = [60, 180] }
                #endif
                for (index, delay) in delays.enumerated() {
                    let remaining = playedAt + delay - Date().timeIntervalSince1970
                    // Never deliver an overdue reminder immediately when permission is enabled later.
                    guard remaining > 0 else { continue }
                    let content = UNMutableNotificationContent()
                    // D1 announces the daily missions; D7 stays a gentle comeback note.
                    // Same language as the game (chosen in Settings and sent with each `played` call).
                    if self.defaults.string(forKey: self.langKey) == "en" {
                        content.title = index == 0 ? "Today's missions are here!" : "The Cosmii miss you"
                        content.body = index == 0 ? "Clear all 3 to earn snacks and furniture!" : "Long time no see! Come visit the Cosmii."
                    } else {
                        content.title = index == 0 ? "今日のミッションが届いたよ" : "コスミーが待ってるよ"
                        content.body = index == 0 ? "3つクリアして、おやつや家具をもらおう！" : "ひさしぶり！コスミーたちに会いにきてね。"
                    }
                    content.sound = .default
                    content.threadIdentifier = "cosmii-reminders"
                    content.userInfo = ["cosmiiReminder": index == 0 ? "d1" : "d7"]
                    let request = UNNotificationRequest(identifier: self.ids[index], content: content,
                        trigger: UNTimeIntervalNotificationTrigger(timeInterval: max(1, remaining), repeats: false))
                    self.center.add(request) { error in
                        if error != nil { NSLog("COSMII reminder scheduling failed") }
                    }
                }
            }
        }
    }
    func willPresent(notification: UNNotification) -> UNNotificationPresentationOptions { return [] }
    func didReceive(response: UNNotificationResponse) {
        if !Thread.isMainThread { DispatchQueue.main.async { self.didReceive(response: response) }; return }
        guard response.actionIdentifier == UNNotificationDefaultActionIdentifier,
              let kind = response.notification.request.content.userInfo["cosmiiReminder"] as? String,
              ["d1", "d7"].contains(kind) else { return }
        // Cold launch and the notification router may both report the same tap.
        let key = response.notification.request.identifier + ":" + String(response.notification.date.timeIntervalSince1970)
        var taps = defaults.array(forKey: tapsKey) as? [[String: String]] ?? []
        guard defaults.string(forKey: "cosmii.reminders.lastTap") != key else { return }
        defaults.set(key, forKey: "cosmii.reminders.lastTap")
        taps.append(["kind": kind]); defaults.set(Array(taps.suffix(8)), forKey: tapsKey)
        NotificationCenter.default.post(name: Notification.Name("CosmiiReminderOpened"), object: nil)
    }
    func consumeTaps() -> [[String: String]] {
        let taps = defaults.array(forKey: tapsKey) as? [[String: String]] ?? []
        defaults.removeObject(forKey: tapsKey); return taps
    }
}

@objc(CosmiiRemindersPlugin)
public class CosmiiRemindersPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CosmiiRemindersPlugin"
    public let jsName = "CosmiiReminders"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "enable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "played", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "consumeTaps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "language", returnType: CAPPluginReturnPromise)
    ]
    public override func load() {
        bridge?.notificationRouter.localNotificationHandler = CosmiiReminders.shared
        NotificationCenter.default.addObserver(self, selector: #selector(opened), name: Notification.Name("CosmiiReminderOpened"), object: nil)
    }
    deinit { NotificationCenter.default.removeObserver(self) }
    @objc private func opened() { bridge?.triggerJSEvent(eventName: "cosmiiReminderOpened", target: "document") }
    @objc func status(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            DispatchQueue.main.async {
                let status: String
                switch settings.authorizationStatus {
                case .authorized, .provisional: status = "granted"
                case .denied: status = "denied"
                default: status = "prompt"
                }
                call.resolve(["enabled": CosmiiReminders.shared.enabled, "permission": status])
            }
        }
    }
    @objc func enable(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { granted, error in
                DispatchQueue.main.async {
                    if error != nil { call.reject("Notification permission failed"); return }
                    CosmiiReminders.shared.setEnabled(granted)
                    call.resolve(["granted": granted])
                }
            }
        }
    }
    @objc func disable(_ call: CAPPluginCall) { DispatchQueue.main.async { CosmiiReminders.shared.setEnabled(false); call.resolve() } }
    // Called at every launch so already-scheduled reminders follow a language switch made in Settings.
    @objc func language(_ call: CAPPluginCall) { DispatchQueue.main.async { CosmiiReminders.shared.setLanguage(call.getString("lang")); call.resolve() } }
    @objc func played(_ call: CAPPluginCall) { DispatchQueue.main.async { CosmiiReminders.shared.played(active: call.getBool("active") ?? false, lang: call.getString("lang")); call.resolve() } }
    @objc func consumeTaps(_ call: CAPPluginCall) { DispatchQueue.main.async { call.resolve(["taps": CosmiiReminders.shared.consumeTaps()]) } }
    @objc func openSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: UIApplication.openSettingsURLString) else { call.reject("Settings unavailable"); return }
            UIApplication.shared.open(url, options: [:]) { success in call.resolve(["opened": success]) }
        }
    }
}
