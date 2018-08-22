//
//  TUTFontIconFactory.h
//  tutanota
//
//  Created by Tutao GmbH on 22.08.18.
//  Copyright © 2018 Tutao GmbH. All rights reserved.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface TUTFontIconFactory : NSObject
+ (UIImage *) createFontImageForIconId:(NSString*) identifier fontName:(NSString*)fontName size:(CGFloat) fontSize;
@end

NS_ASSUME_NONNULL_END
