#import <Foundation/Foundation.h>

/**
 * This class provides configuration fields of Google APIs.
 */
@interface GGLConfiguration : NSObject

/**
 * A secret iOS API key used for authenticating requests from your app, e.g.
 * @"AIzaSyDdVgKwhZl0sTTTLZ7iTmt1r3N2cJLnaDk", used to identify your app to Google servers.
 */
@property(nonatomic, readonly, copy) NSString *apiKey;

/**
 * The OAuth2 client ID for iOS application used to authenticate Google users, for example
 * @"12345.apps.googleusercontent.com", used for signing in with Google.
 */
@property(nonatomic, readonly, copy) NSString *clientID;

/**
 * The tracking ID for Google Analytics, e.g. @"UA-12345678-1", used to configure Google Analytics.
 */
@property(nonatomic, readonly, copy) NSString *trackingID;

/**
 * Mobile Ads' Ad Unit ID for a banner view, for example @"ca-app-pub-1234567890", used for
 * displaying ads view.
 */
@property(nonatomic, readonly, copy) NSString *bannerAdUnitID;

/**
 * Mobile Ads' Ad Unit ID for an interstitial view, for example @"ca-app-pub-1234567890", used for
 * displaying ads view.
 */
@property(nonatomic, readonly, copy) NSString *interstitialAdUnitID;

/**
 * The Project Number from the Google Developer's console, for example @"012345678901", used to
 * configure Google Cloud Messaging.
 */
@property(nonatomic, readonly, copy) NSString *gcmSenderID;

/**
 * The Android client ID used in Google AppInvite when an iOS app has its Android version, for
 * example @"12345.apps.googleusercontent.com".
 */
@property(nonatomic, readonly, copy) NSString *androidClientID;

/**
 * The Google App ID that is used to uniquely identify an instance of an app.
 */
@property(nonatomic, readonly, copy) NSString *googleAppID;

/**
 * Whether or not Ads was enabled in the developer console.
 */
@property(nonatomic, readonly) BOOL isAdsEnabled;

/**
 * Whether or not Analytics was enabled in the developer console.
 */
@property(nonatomic, readonly) BOOL isAnalyticsEnabled;

/**
 * Whether or not AppInvite was enabled in the developer console.
 */
@property(nonatomic, readonly) BOOL isAppInviteEnabled;

/**
 * Whether or not GCM was enabled in the developer console.
 */
@property(nonatomic, readonly) BOOL isGCMEnabled;

/**
 * Whether or not Measurement was enabled. Measurement is enabled unless explicitly disabled in
 * GoogleService-Info.plist.
 */
@property(nonatomic, readonly) BOOL isMeasurementEnabled;

/**
 * Whether or not SignIn was enabled in the developer console.
 */
@property(nonatomic, readonly) BOOL isSignInEnabled;

/**
 * The version ID of the client library, e.g. @"1100000".
 */
@property(nonatomic, readonly, copy) NSString *libraryVersionID;

@end
