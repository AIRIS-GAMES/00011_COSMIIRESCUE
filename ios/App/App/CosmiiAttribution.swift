import UIKit
import Capacitor
import AppsFlyerLib
import AppTrackingTransparency
import AdServices
import AdSupport

// Registered explicitly because this is an app-local Capacitor 7 plugin.
@objc(CosmiiBridgeViewController)
class CosmiiBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(CosmiiAttributionPlugin())
        bridge?.registerPluginInstance(CosmiiRemindersPlugin())
    }
}

@objc(CosmiiAttributionPlugin)
public class CosmiiAttributionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CosmiiAttributionPlugin"
    public let jsName = "CosmiiAttribution"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "track", returnType: CAPPluginReturnPromise)
    ]
    private var configured = false
    private var enabled = false
    private var requestingATT = false
    private var startedThisActivation = false
    private var pending: [CAPPluginCall] = []
    private let allowedEvents: Set<String> = [
        "af_tutorial_completion", "cosmii_first_return", "cosmii_play", "cosmii_retry",
        "cosmii_room_open", "cosmii_first_interaction", "cosmii_trust_gain"
    ]

    public override func load() {
        NotificationCenter.default.addObserver(self, selector: #selector(becameActive), name: UIApplication.didBecomeActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(becameInactive), name: UIApplication.willResignActiveNotification, object: nil)
    }
    deinit { NotificationCenter.default.removeObserver(self) }

    @objc func initialize(_ call: CAPPluginCall) {
        DispatchQueue.main.async { self.initializeOnMain(call) }
    }
    private func initializeOnMain(_ call: CAPPluginCall) {
        if configured {
            if enabled && (!startedThisActivation || requestingATT) { pending.append(call); becameActive() }
            else { call.resolve(["enabled": enabled]) }
            return
        }
        configured = true
        let args = ProcessInfo.processInfo.arguments
        // Xcode launches do not send synthetic installs unless the tester opts in.
        #if DEBUG
        guard args.contains("-CosmiiAttributionTesting") else { call.resolve(["enabled": false]); return }
        #endif
        guard !args.contains("-CosmiiAttributionOff") else { call.resolve(["enabled": false]); return }
        guard Bundle.main.bundleIdentifier == "com.airisgames.cosmiirescue",
              let key = Bundle.main.object(forInfoDictionaryKey: "AppsFlyerDevKey") as? String,
              !key.isEmpty else { call.reject("Attribution configuration is missing"); return }
        let sdk = AppsFlyerLib.shared()
        sdk.appsFlyerDevKey = key
        sdk.appleAppID = "6811575619"
        sdk.isDebug = false
        sdk.currencyCode = "JPY"
        sdk.disableSKAdNetwork = false
        sdk.disableAppleAdsAttribution = false
        // No IDFA access or partner sharing while the consent prompt is pending.
        sdk.disableAdvertisingIdentifier = true
        sdk.setSharingFilterForPartners(["all"])
        enabled = true
        pending.append(call)
        becameActive()
    }

    @objc private func becameInactive() { startedThisActivation = false }
    @objc private func becameActive() {
        guard enabled, UIApplication.shared.applicationState == .active, !requestingATT else { return }
        if ATTrackingManager.trackingAuthorizationStatus == .notDetermined {
            requestingATT = true
            ATTrackingManager.requestTrackingAuthorization { _ in
                DispatchQueue.main.async {
                    self.requestingATT = false
                    // If iOS could not show a prompt, retry on a later activation.
                    if ATTrackingManager.trackingAuthorizationStatus != .notDetermined { self.startForCurrentConsent() }
                }
            }
        } else { startForCurrentConsent() }
    }
    private func startForCurrentConsent() {
        guard enabled, UIApplication.shared.applicationState == .active else { return }
        let allowed = ATTrackingManager.trackingAuthorizationStatus == .authorized
        let sdk = AppsFlyerLib.shared()
        sdk.disableAdvertisingIdentifier = !allowed
        sdk.setSharingFilterForPartners(allowed ? nil : ["all"])
        if !startedThisActivation {
            startedThisActivation = true
            sdk.start()
        }
        let calls = pending; pending.removeAll()
        calls.forEach { $0.resolve(["enabled": true]) }
    }

    @objc func track(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.enabled, self.startedThisActivation, !self.requestingATT,
                  ATTrackingManager.trackingAuthorizationStatus != .notDetermined else {
                call.resolve(["accepted": false]); return
            }
            guard let name = call.getString("name"), self.allowedEvents.contains(name) else {
                call.reject("Unsupported attribution event"); return
            }
            // Native allowlist prevents arbitrary JS values or personal identifiers reaching the SDK.
            let raw = call.getObject("values") ?? [:]
            var values: [String: Any] = [:]
            for (key, choices) in [
                "mode": ["normal", "hard"], "attempt": ["first", "retry", "legacy"],
                "source": ["onboarding", "optional"], "visit": ["first", "revisit"],
                "color": ["green", "pink", "blue", "red", "purple"]
            ] {
                if let value = raw[key] as? String, choices.contains(value) { values[key] = value }
            }
            if name == "af_tutorial_completion" { values["af_success"] = true }
            if let seconds = raw["seconds"] as? Double, seconds.isFinite {
                values["seconds"] = max(0, min(86400, seconds))
            }
            if let amount = raw["amount"] as? Double, amount.isFinite {
                values["amount"] = max(0, min(10, amount))
            }
            let once = ["cosmii_first_return", "cosmii_first_interaction"].contains(name)
            let onceKey = "cosmii.appsflyer.sent.\(name).v1"
            if once && UserDefaults.standard.bool(forKey: onceKey) { call.resolve(["accepted": false]); return }
            // Mark once on SDK enqueue; the SDK handles offline delivery. Never duplicate on UI re-entry.
            if once { UserDefaults.standard.set(true, forKey: onceKey) }
            AppsFlyerLib.shared().logEvent(name: name, values: values)
            call.resolve(["accepted": true])
        }
    }
}
