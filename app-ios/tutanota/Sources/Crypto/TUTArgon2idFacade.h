NS_ASSUME_NONNULL_BEGIN

@interface TUTArgon2idFacade: NSObject

/**
 Generate an Argon2id hash with the given parameters

 @param password text to hash
 @param length length of hash to generate in bytes
 @param salt salt to use to generate the hash
 @param iterations number of iterations
 @param parallelism degrees of parallelism
 @param memoryCostInKibibytes memory cost in KiB (1024 bytes = 1 KiB)
 */
+ (nonnull NSData *)generateHashOfPassword:(nonnull NSData *)password
                              ofHashLength:(size_t)length
                                  withSalt:(nonnull NSData *)salt
                            withIterations:(uint32_t)iterations
                           withParallelism:(uint32_t)parallelism
                            withMemoryCost:(uint32_t)memoryCostInKibibytes;

@end

NS_ASSUME_NONNULL_END
