#import <Foundation/Foundation.h>
#import "TUTArgon2idFacade.h"

#include "argon2.h"

@implementation TUTArgon2idFacade

+ (nonnull NSData *)generateHashOfPassword:(nonnull NSData *)password
                              ofHashLength:(size_t)length
                                  withSalt:(nonnull NSData *)salt
                            withIterations:(uint32_t)iterations
                           withParallelism:(uint32_t)parallelism
                            withMemoryCost:(uint32_t)memoryCostInKibibytes {
  NSMutableData *hashOutput = [NSMutableData dataWithLength:length];
  argon2id_hash_raw(iterations, memoryCostInKibibytes, parallelism, [password bytes], [password length], [salt bytes], [salt length], [hashOutput mutableBytes], [hashOutput length]);
  return hashOutput;
}

@end

