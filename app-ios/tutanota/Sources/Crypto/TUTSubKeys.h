//
//  TUTSubKeys.h
//  tutanota
//
//  Created by Tutao GmbH on 28.08.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>



@interface TUTSubKeys : NSObject

@property NSData *cKey;
@property NSData *mKey;

- initWithCKey: (NSData *)cKey  mKey: (NSData  * _Nullable) mKey;

@end
