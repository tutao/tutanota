//
//  TUTAlarmInfo.h
//  tutanota
//
//  Created by Tutao GmbH on 17.06.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface TUTAlarmInfo : NSObject
@property (nonnull, readonly) NSString *alarmIdentifier;
@property (nonnull, readonly) NSString *trigger;

-(NSString *)getTriggerDec:(NSData *)sessionkey error:(NSError **)error;
-(NSString *)getAlarmIdentifierDec:(NSData *)sessionkey error:(NSError **)error;

+(TUTAlarmInfo *)fromJSON:(NSDictionary *)jsonDict;


@end

NS_ASSUME_NONNULL_END
