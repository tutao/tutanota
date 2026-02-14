# A Makefile to build, test, tag and publish the Emscripten SDK Docker container.

# Emscripten version to build: Should match the version that has been already released.
# i.e.:  1.39.18
version =
tag =

image_name ?= emscripten/emsdk

.TEST:
ifndef version
	$(error argument 'version' is not set. Please call `make version=SOME_VERSION ...`)
endif

build: Dockerfile .TEST
	cd .. && docker build --progress=plain --network host --build-arg=EMSCRIPTEN_VERSION=${version} -t ${image_name}:${version} -f docker/$< .

test: test_dockerimage.sh .TEST
	# test as non-root
	# test fallback env variables by overriding the entrypoint
	docker run --rm -u `id -u`:`id -g` -w /emsdk/docker --net=host --entrypoint /bin/bash ${image_name}:${version} $<

push: .TEST
ifdef tag
	docker tag ${image_name}:${version} ${image_name}:${tag}
	docker push ${image_name}:${tag}
endif

push-multiplatform: .TEST
ifdef tag
	docker manifest create ${image_name}:${tag} $(foreach platform,x64 arm64,--amend ${image_name}:${version}-$(platform))
	docker manifest push ${image_name}:${tag}
endif
