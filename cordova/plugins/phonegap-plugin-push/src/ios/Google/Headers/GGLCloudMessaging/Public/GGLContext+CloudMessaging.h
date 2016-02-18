#import "GGLContext.h"

#import "GGLInstanceIDHeaders.h"
#import "GoogleCloudMessaging.h"

@class GCMConfig;

/**
 * This category extends |GGLContext| with Google Cloud Messaging. To integrate
 * Google Cloud Messaging import import GGLContext+CloudMessaging.h.
 *
 * |[GGLContext sharedInstance].gcmSenderID| should be ready to use after calling
 * -[[GGLContext sharedInstance] configureWithError:]. Functions
 * -[fetchInstanceIDTokenWithAPNSToken:handler:], -[connectToGCMWithHandler:] and
 * -[disconnectFromGCM] can be then used.
 *
 * @see GGLContext
 */
@interface GGLContext (CloudMessaging)

/**
 * The Project Number used to configure Google Cloud Messaging.
 * It will be ready to use once -[[GGLContext sharedInstance] configureWithError:] is called.
 *
 * @see GGLContext configure
 */
@property(nonatomic, readonly, strong) NSString *gcmSenderID;

/**
 * Provides a token identifying this instance of the app, which can be used by a remote server to
 * push messages to this client. It will only be ready to use after
 * -[[GGLContext sharedInstance] configureWithError:] has been called and
 * -[fetchInstanceIDTokenWithAPNSToken:handler:]'s completion handler has been invoked.
 *
 * @see GGLContext configure
 */
@property(nonatomic, readonly, strong) NSString *registrationToken;

/**
 * Gets an InstanceID token scoped for GCM using the gcmSenderID. This allows the app to receive
 * push notifications using Apple Push Notification Service (APNS).
 *
 * This method should be called on app launch after
 * -[[GGLContext sharedInstance] configureWithError:] has completed.
 *
 * @param apnsToken The APNS token returned from UIApplication's
 *                  didRegisterForRemoteNotificationsWithDeviceToken method.
 * @param handler   The handler to be invoked once the InstanceID token has been successfully
 *                  fetched.
 */
- (void)fetchInstanceIDTokenWithAPNSToken:(NSData *)apnsToken
                                  handler:(GGLInstanceIDTokenHandler)handler;

/**
 * Start the Google Cloud Messaging service after setting the appropriate properties.
 * Call this only once during the lifetime of the app before you start using Google
 * Cloud Messaging.
 *
 * Uses the default config to start the service. The log level is set to DEBUG and
 * it does not provide an implementation for `GCMReceiverDelegate`.
 */
- (void)startGCMService;

/**
 * Start the Google Cloud Messaging service with the given config.
 * Call this only once during the lifetime of the app before you start using Google
 * Cloud Messaging.
 *
 * @param config The GCMConfig used to start the service.
 */
- (void)startGCMServiceWithConfig:(GCMConfig *)config;

/**
 * Stop the Google Cloud Messaging service. Stop all the operations associated with it
 * and clear any objects or data associated with it. Call this only once during the
 * lifetime of your app when you don't want to use Google Cloud Messaging anymore.
 */
- (void)stopGCMService;

/**
 * Creates a connection to Google Cloud Messaging, which will be used to receive push and topic
 * notifications when the app is in the foreground, and to send upstream messages.
 * It will also be used to send ACKS and other messages based on the GCM protocol.
 *
 * This method should be called on app launch after
 * -[[GGLContext sharedInstance] configureWithError:], in
 * -[fetchInstanceIDTokenWithAPNSToken:handler:]'s completion handler. As well as each time the
 * app enters the foreground.
 *
 * @param handler The handler to be invoked once the GCM connection has been established.
 *                If a connection cannot be established, this will be invoked with an
 *                error and the process will retry using an exponential backoff.
 */
- (void)connectToGCMWithHandler:(GCMServiceConnectCompletion)handler;

/**
 * Closes an existing connection to GCM, if present. Disables connection retries if the connection
 * has not yet been established.
 *
 * This method should be called each time the app enters the background or terminates.
 */
- (void)disconnectFromGCM;

/**
 * Subscribe to a GCM pubsub topic. The topic name should match the regex
 * "/topics/[a-zA-Z0-9-_.~%]{1,900}".
 *
 * @param topic   The topic to subscribe to.
 * @param handler The completion handler to invoke when the subscription request finishes.
 */
- (void)subscribeToTopic:(NSString *)topic withHandler:(GCMPubSubCompletion)handler;

/**
 * Unsubscribe the client from a GCM pubsub topic. The topic name should match the regex
 * "/topics/[a-zA-Z0-9-_.~%]{1,900}".
 *
 *  @param topic   The topic to unsubscribe from.
 *  @param handler The completion handler to invoke when the unsubsribe request finishes.
 */
- (void)unsubscribeFromTopic:(NSString *)topic withHandler:(GCMPubSubCompletion)handler;

@end
