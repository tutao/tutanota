# Containers for the build

you can build and run this container locally with podman.
You're going to have to do this as root unless you have rootless containers set up:

* building the image:
  ``` podman build -t linux-build:latest --network=host -f linux-build.dockerfile --format docker --squash```
* run a bash shell in the container:
  ```podman run -ti --name=linux-build linux-build:latest /bin/bash```
* remove the container:
  ```podman rm linux-build```
* remove the image:
  ```podman image rm linux-build:latest```