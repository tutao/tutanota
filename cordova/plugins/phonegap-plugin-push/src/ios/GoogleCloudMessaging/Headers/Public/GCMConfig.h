@protocol GCMReceiverDelegate;

typedef NS_ENUM(int8_t, GCMLogLevel) {
  kGCMLogLevelDebug,
  kGCMLogLevelInfo,
  kGCMLogLevelError,
  kGCMLogLevelAssert,
};

/**
 *  Config used to set different options in Google Cloud Messaging.
 */
@interface GCMConfig : NSObject

/**
 *  Set the `GCMReceiverDelegate` to receive callbacks on upstream messages.
 *
 *  @see GCMReceiverDelegate
 */
@property(nonatomic, readwrite, weak) id<GCMReceiverDelegate> receiverDelegate;

/**
 * The log level for the GCM library. Valid values are `kGCMLogLevelDebug`,
 *   `kGCMLogLevelInfo`, `kGCMLogLevelError`, and `kGCMLogLevelAssert`.
 */
@property(nonatomic, readwrite, assign) GCMLogLevel logLevel;

/**
 *  Specify which remote notification callback to invoke when a GCM message is
 *  received.
 *
 *  If set to "YES" GCM uses the new remote notification callback i.e.
 *  application:didReceiveRemoteNotification:fetchCompletionHandler:.
 *  If set to "NO" GCM invokes application:didReceiveRemoteNotification: callback.
 *
 *  Defaults to "NO".
 */
@property(nonatomic, readwrite, assign) BOOL useNewRemoteNotificationCallback;

/**
 *  Get default configuration for GCM. The default config has logLevel set to
 *  `kGCMLogLevelError` and `receiverDelegate` is set to nil.
 *
 *  @return GCMConfig sharedInstance.
 */
+ (instancetype)defaultConfig;

@end

