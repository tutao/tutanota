//
//  TUTContactsSource.h
//  tutanota
//
//  Created by Tutao GmbH on 25.07.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface TUTContactsSource : NSObject

-(void)searchForContactsUsingQuery:(NSString *)query
						completion:(void(^) (NSArray<NSDictionary *> * _Nullable contacts, NSError * _Nullable error))completion;
@end

NS_ASSUME_NONNULL_END
