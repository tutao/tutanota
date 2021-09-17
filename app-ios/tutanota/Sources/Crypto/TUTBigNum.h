//
//  TUTBigNum.h
//  tutanota
//
//  Created by Tutao GmbH on 9/10/21.
//  Copyright © 2021 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <openssl/ossl_typ.h>

NS_ASSUME_NONNULL_BEGIN

@interface TUTBigNum : NSObject
+ (NSString * )toB64:(BIGNUM *)number;
+ (void)toBIGNUM:(BIGNUM *)number fromB64:(NSString *)value;
@end

NS_ASSUME_NONNULL_END
