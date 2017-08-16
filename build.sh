#Change Directory
BASEDIR=$(dirname "$0")
cd $BASEDIR

#Install modules
cd ./web
npm install

#Build
gulp dist

#Copy electron files
cp ../electron/main.js ./build/main.js
cp ../electron/package.json ./build/package.json

#Install electron modules
cd ./build
npm install
