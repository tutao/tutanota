//
//  TUTNotificationSessionKey.m
//  tutanota
//
//  Created by Tutao GmbH on 17.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTNotificationSessionKey.h"

@implementation TUTNotificationSessionKey

- (TUTNotificationSessionKey *)initWithPushIdentifier:(TUTIdTuple *)pushIdentifier pushIdentifierSessionEncSessionKey:(NSString *)pushIdentifierSessionEncSessionKey {
    self = [super init];
    _pushIdentifier = pushIdentifier;
    _pushIdentifierSessionEncSessionKey = pushIdentifierSessionEncSessionKey;
    return self;
}


+(TUTNotificationSessionKey *)fromJSON:(NSDictionary *)jsonDict {
    return [[TUTNotificationSessionKey alloc] initWithPushIdentifier:[TUTIdTuple fromJSON:jsonDict[@"pushIdentifier"]]
                                  pushIdentifierSessionEncSessionKey:jsonDict[@"pushIdentifierSessionEncSessionKey"]];
    
}

@end
