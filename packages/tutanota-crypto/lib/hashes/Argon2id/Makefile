# Makefile for building argon2.wasm

# If you run out of memory (ARGON2_MEMORY_ALLOCATION_ERROR) and it's not being caused by a memory leak, try increasing this.
TOTAL_MEMORY=48MB

CC=emcc
WASM=argon2.wasm

all: ${WASM}
clean:
	rm -f ${WASM}
phc-winner-argon2:
	git clone https://github.com/tutao/phc-winner-argon2 phc-winner-argon2
${WASM}: phc-winner-argon2
	git -C phc-winner-argon2 pull
	${CC} \
    	phc-winner-argon2/src/argon2.c \
    	phc-winner-argon2/src/core.c \
    	phc-winner-argon2/src/ref.c \
    	phc-winner-argon2/src/blake2/blake2b.c \
    	-I phc-winner-argon2/include \
    	-DARGON2_NO_THREADS \
    	-flto \
    	-O3 \
    	--no-entry \
    	-s TOTAL_MEMORY=${TOTAL_MEMORY} \
    	-s EXPORTED_FUNCTIONS="['_argon2id_hash_raw', '_malloc', '_free']" \
    	-o ${WASM}
