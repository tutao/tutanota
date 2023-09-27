#ifndef NISTSEEDEXPANDER_H
#define NISTSEEDEXPANDER_H

//
//  rng.h
//
//  Created by Bassham, Lawrence E (Fed) on 8/29/17.
//  Copyright © 2017 Bassham, Lawrence E (Fed). All rights reserved.
/*
NIST-developed software is provided by NIST as a public service. You may use, copy, and distribute copies of the software in any medium, provided that you keep intact this entire notice. You may improve, modify, and create derivative works of the software or any portion of the software, and you may copy and distribute such modifications or works. Modified works should carry a notice stating that you changed the software and should note the date and nature of any such change. Please explicitly acknowledge the National Institute of Standards and Technology as the source of the software.

NIST-developed software is expressly provided "AS IS." NIST MAKES NO WARRANTY OF ANY KIND, EXPRESS, IMPLIED, IN FACT, OR ARISING BY OPERATION OF LAW, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND DATA ACCURACY. NIST NEITHER REPRESENTS NOR WARRANTS THAT THE OPERATION OF THE SOFTWARE WILL BE UNINTERRUPTED OR ERROR-FREE, OR THAT ANY DEFECTS WILL BE CORRECTED. NIST DOES NOT WARRANT OR MAKE ANY REPRESENTATIONS REGARDING THE USE OF THE SOFTWARE OR THE RESULTS THEREOF, INCLUDING BUT NOT LIMITED TO THE CORRECTNESS, ACCURACY, RELIABILITY, OR USEFULNESS OF THE SOFTWARE.

You are solely responsible for determining the appropriateness of using and distributing the software and you assume all risks associated with its use, including but not limited to the risks and costs of program errors, compliance with applicable laws, damage to or loss of data, programs or equipment, and the unavailability or interruption of operation. This software is not intended to be used in any situation where a failure could cause risk of injury or damage to property. The software developed by NIST employees is not subject to copyright protection within the United States.
*/
//  SPDX-License-Identifier: Unknown
//  Modified for PQClean by Sebastian Verschoor
//

#include <stddef.h>
#include <stdint.h>

#define NISTSEEDEXPANDER_SEED_LEN 32

#define RNG_SUCCESS     ( 0)
#define RNG_BAD_MAXLEN  (-1)
#define RNG_BAD_OUTBUF  (-2)
#define RNG_BAD_REQ_LEN (-3)

typedef struct {
	uint8_t buffer[16];
	size_t  buffer_pos;
	size_t  length_remaining;
	uint8_t key[NISTSEEDEXPANDER_SEED_LEN];
	uint8_t ctr[16];
} AES_XOF_struct;

int
seedexpander_init(AES_XOF_struct *ctx,
                  const uint8_t *seed,
                  const uint8_t *diversifier,
                  size_t maxlen);

int
seedexpander(AES_XOF_struct *ctx, uint8_t *x, size_t xlen);

#endif /* NISTSEEDEXPANDER_H */
