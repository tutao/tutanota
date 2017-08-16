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
cp ../electron/update_checker.html ./build/update_checker.html

#Install electron modules
cd ./build
npm install
