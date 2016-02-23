@protocol GGLInstanceIDDelegate;

typedef NS_ENUM(int8_t, GGLInstanceIDLogLevel) {
  kGGLInstanceIDLogLevelDebug,
  kGGLInstanceIDLogLevelInfo,
  kGGLInstanceIDLogLevelError,
  kGGLInstanceIDLogLevelAssert,
};

/**
 *  The config used to configure different options in GGLInstanceID library.
 */
@interface GGLInstanceIDConfig : NSObject

/**
 *  Set the GGLInstanceIDDelegate to receive callbacks.
 *
 *  @see GGLInstanceIDDelegate
 */
@property(nonatomic, readwrite, weak) id<GGLInstanceIDDelegate> delegate;

// the log level for the GGLInstanceID library.
@property(nonatomic, readwrite, assign) GGLInstanceIDLogLevel logLevel;

/**
 *  Initialize a default config with logLevel set to `kGGLInstanceIDLogLevelError`.
 *
 *  @return A default config for GGLInstanceID.
 */
+ (instancetype)defaultConfig;

@end
