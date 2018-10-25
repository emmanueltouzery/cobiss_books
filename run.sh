# cd in the folder of the shell script so that the app finds the config file at startup
script="$0"
basename="$(dirname $script)"
cd "$basename/dist"
node src/index.js
