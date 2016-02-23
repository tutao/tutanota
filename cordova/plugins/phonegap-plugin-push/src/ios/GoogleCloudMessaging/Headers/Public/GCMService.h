@class GCMConfig;

/**
 *  The completion handler invoked once the data connection with GCM is
 *  established.  The data connection is used to send a continous stream of
 *  data and all the GCM data notifications arrive through this connection.
 *  Once the connection is established we invoke the callback with `nil` error.
 *  Correspondingly if we get an error while trying to establish a connection
 *  we invoke the handler with an appropriate error object and do an
 *  exponential backoff to try and connect again unless successful.

 *
 *  @param error The error object if any describing why the data connection
 *               to GCM failed.
 */
typedef void(^GCMServiceConnectCompletion)(NSError *error);


/**
 *  @enum GCMServiceErrorCode
 *  Description of error codes
 */
typedef NS_ENUM(NSUInteger, GCMServiceErrorCode) {
  /**
   *  HTTP errors.
   */

  // InvalidRequest -- Some parameters of the request were invalid.
  kGCMServiceErrorCodeInvalidRequest = 0,

  // Auth Error -- GCM couldn't validate request from this client.
  kGCMServiceErrorCodeAuthentication = 1,

  // NoAccess -- InstanceID service cannot be accessed.
  kGCMServiceErrorCodeNoAccess = 2,

  // Timeout -- Request to InstanceID backend timed out.
  kGCMServiceErrorCodeTimeout = 3,

  // Network -- No network available to reach the servers.
  kGCMServiceErrorCodeNetwork = 4,

  // OperationInProgress -- Another similar operation in progress,
  // bailing this one.
  kGCMServiceErrorCodeOperationInProgress = 5,

  // Unknown error.
  kGCMServiceErrorCodeUnknown = 7,

  /**
   *  Generic errors.
   */

  // Device seems to be missing a valid deviceID. Cannot authenticate
  // device requests.
  kGCMServiceErrorMissingDeviceID = 501,

  /**
   *  Upstream Send errors
   */

  // Upstream send not available (e.g. network issues)
  kGCMServiceErrorCodeUpstreamServiceNotAvailable = 1001,

  // Invalid send parameters.
  kGCMServiceErrorCodeInvalidParameters = 1002,

  // Invalid missing to.
  kGCMServiceErrorCodeMissingTo = 1003,

  // GCM could not cache the message for sending.
  kGCMServiceErrorSave = 1004,

  // Message size exceeded (size > 4KB).
  kGCMServiceErrorSizeExceeded = 1005,

  /**
   *  GCM Connect errors.
   */

  // GCM already connected with the client.
  kGCMServiceErrorCodeAlreadyConnected = 2001,

  /**
   *  PubSub errors.
   */

  // Topic already subscribed to.
  kGCMServiceErrorCodePubSubAlreadySubscribed = 3001,

  // Topic already unsubscribed from.
  kGCMServiceErrorCodePubSubAlreadyUnsubscribed = 3002,

  // Invalid topic name, does not match the topic regex "/topics/[a-zA-Z0-9-_.~%]+"
  kGCMServiceErrorCodePubSubInvalidTopic = 3003,
};

/**
 * GoogleCloudMessaging (GCM) enables apps to communicate with their app servers
 *  using simple messages.
 *
 *  To send or receive messages, the app must get a
 *  registration token from GGLInstanceID, which authorizes an
 *  app server to send messages to an app instance. Pass your sender ID and
 *  `kGGLInstanceIDScopeGCM` as parameters to the method.
 *
 *  A sender ID is a project number created when you configure your API project.
 *  It is labeled "Project Number" in the Google Developers Console.
 *
 *  In order to receive GCM messages, declare application:didReceiveRemoteNotification:
 *
 *  Client apps can send upstream messages back to the app server using the XMPP-based
 *  <a href="http://developers.google.com/cloud-messaging/ccs.html">Cloud Connection Server</a>,
 *
 */
@interface GCMService : NSObject

/**
 *  GCMService
 *
 *  @return A shared instance of GCMService.
 */
+ (instancetype)sharedInstance;

/**
 *  Start the `GCMService` with config. This starts the `GCMService` and
 *  allocates the required resources.
 *
 *  @see GCMConfig
 *
 *  @param config The `GCMConfig` used to build the service.
 */
- (void)startWithConfig:(GCMConfig *)config;

/**
 *  Teardown the GCM connection and free all the resources owned by GCM.
 *
 *  Call this when you don't need the GCM connection or to cancel all
 *  subscribe/unsubscribe requests. If GCM connection is alive before
 *  calling this, it would implicitly disconnect the connection.
 *
 *  Calling `disconect` before invoking this method is useful but not required.
 *  Once you call this you won't be able to use `GCMService` for this session
 *  of your app. Therefore call this only when the app is going to exit.
 *  In case of background you should rather use `disconnect` and then
 *  if the app comes to the foreground again you can call `connect` again to
 *  establish a new connection.
 */
- (void)teardown;

#pragma mark - Messages

/**
 *  Call this to let GCM know that the app received a downstream message. Used
 *  to track message delivery for messages with different routes.
 *
 *  @param message The downstream message received by the app.
 *
 *  @return Only sync messages i.e. with `content-available : true` are sent
 *          both via APNS and GCM. For normal APNS messages this always returns
 *          YES. For sync messages return YES if the message was never delivered
 *          before else NO if the message was delivered before via MCS.
 */
- (BOOL)appDidReceiveMessage:(NSDictionary *)message;

  #pragma mark - Connect

/**
 *  Create a GCM data connection which will be used to send the data notifications
 *  send by your server. It will also be used to send ACKS and other messages based
 *  on the GCM ACKS and other messages based  on the GCM protocol.
 *
 *  Use the `disconnect` method to disconnect the connection.
 *
 *  @see GCMService disconnect
 *
 *  @param handler  The handler to be invoked once the connection is established.
 *                  If the connection fails we invoke the handler with an
 *                  appropriate error code letting you know why it failed. At
 *                  the same time, GCM performs exponential backoff to retry
 *                  establishing a connection and invoke the handler when successful.
 */
- (void)connectWithHandler:(GCMServiceConnectCompletion)handler;

/**
 *  Disconnect the current GCM data connection. This stops any attempts to
 *  connect to GCM. Calling this on an already disconnected client is a no-op.
 *
 *  Call this before `teardown` when your app is going to the background.
 *  Since the GCM connection won't be allowed to live when in background it is
 *  prudent to close the connection.
 *
 *  @see GCMService teardown
 */
- (void)disconnect;

#pragma mark - Send

/**
 *  Send an upstream ("device to cloud") message.
 *
 *  The message will be queued if we don't have an active connection for the max
 *  interval.
 *
 *  @param message    Key/Value pairs to be sent. Values must be String, any other
 *                    type will be ignored.
 *  @param to         String identifying the receiver of the message. For GCM
 *                    project IDs the value is `SENDER_ID@gcm.googleapis.com`.
 *  @param msgId      A unique ID of the message. This is generated by the
 *                    application. It must be unique for each message. This allows
 *                    error callbacks and debugging.
 */
- (void)sendMessage:(NSDictionary *)message
                 to:(NSString *)to
             withId:(NSString *)msgId;

/**
 *  Send an upstream ("device to cloud") message.
 *
 *  The message will be queued if we don't have an active connection for the max
 *  interval. You can only use the upstream feature if your GCM implementation
 *  uses the XMPP-based Cloud Connection Server.
 *
 *  @param message    Key/Value pairs to be sent. Values must be String, any
 *                    other type will be ignored.
 *  @param to         A string identifying the receiver of the message. For GCM
 *                    project IDs the value is `SENDER_ID@gcm.googleapis.com`.
 *  @param ttl        The Time to live for the message. In case we aren't able to
 *                    send the message before the ttl expires we will send you a
 *                    callback. If 0, we'll attempt to send immediately and return
 *                    an error if we're not connected.  Otherwise, the message will
 *                    be queued.As for server-side messages, we don't return an error
 *                    if the message has been dropped because of TTL; this can happen
 *                    on the server side, and it would require extra communication.
 *  @param msgId      The ID of the message. This is generated by the application. It
 *                    must be unique for each message. It allows error callbacks and
 *                    debugging, to uniquely identify each message.
 */
- (void)sendMessage:(NSDictionary *)message
                 to:(NSString *)to
         timeToLive:(int64_t)ttl
             withId:(NSString *)msgId;

@end
