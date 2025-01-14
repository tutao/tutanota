#!/bin/env bash

set -x;

echo "Building latest de.tutao.tutanota"
VERCODE=$(grep CurrentVersionCode metadata/de.tutao.tutanota.yml |  awk '{print $2}')
echo "Version: $VERCODE"

# get all those good env vars that we need (like $fdroidserver and $home_vagrant)
source /etc/profile.d/bsenv.sh;

# PYTHONPATH is needed to find the plugins, we need fetchsrclibs.
export fdroid="sudo --preserve-env --user vagrant
    env PATH=$fdroidserver:$PATH
    env PYTHONPATH=$fdroidserver:$fdroidserver/examples
    env PYTHONUNBUFFERED=true
    env TERM=$TERM
    env HOME=$home_vagrant
    fdroid";

# We move the data we need into vagrant home. There are some guards against just running in the data repo.
ln -s $PWD/srclibs/ $home_vagrant/srclibs;
mkdir $home_vagrant/metadata;
cp metadata/de.tutao.tutanota.yml $home_vagrant/metadata/;

# Start the build in home dir.
cd $home_vagrant;
# This will fetch rustup for us but not actually install anything.
$fdroid fetchsrclibs de.tutao.tutanota:$VERCODE --verbose;
# Run the actual build.
$fdroid build --verbose --test --on-server --no-tarball de.tutao.tutanota:$VERCODE;