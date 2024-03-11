#import "TUTBigNum.h"
#import <openssl/bn.h>

@implementation TUTBigNum
+ (void)toBIGNUM:(const BIGNUM *) number fromB64:(NSString*)value{
  NSData *valueData =  [[NSData alloc] initWithBase64EncodedString:value options: 0];
  BN_bin2bn((unsigned char *) [valueData bytes], (int) [valueData length], number);
}

+ (NSString *)toB64:(const BIGNUM *)number{
  int numBytes = BN_num_bytes(number);
  NSMutableData *nsData = [NSMutableData dataWithLength:numBytes];
  BN_bn2bin(number, [nsData mutableBytes]);
  return [nsData base64EncodedStringWithOptions:0];
}
@end
