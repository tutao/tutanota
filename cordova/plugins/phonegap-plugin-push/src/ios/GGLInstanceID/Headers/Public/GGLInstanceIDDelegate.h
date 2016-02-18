@protocol GGLInstanceIDDelegate <NSObject>

/**
 *  Called when the system determines that tokens need to be refreshed.
 *  This method is also called if Instance ID has been reset in which
 *  case, tokens and `GcmPubSub` subscriptions also need to be refreshed.
 *
 *  Instance ID service will throttle the refresh event across all devices
 *  to control the rate of token updates on application servers.
 */
- (void)onTokenRefresh;

@end
