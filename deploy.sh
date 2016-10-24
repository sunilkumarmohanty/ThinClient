#!/bin/bash

# Please be sure, that 'adb' command from Android SDK is in your PATH variable

# exit if errors
set -e

# Some colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check permissions
if [ "$EUID" -ne 0 ]
  then echo "Please run as root. (e.g. sudo ./deploy.sh)"
  exit
fi

echo
echo "########################################"
echo "#   Mobile Cloud Computing Project 1   #"
echo "########################################"
echo

# Default: Manager instance static IP (104.196.153.237)
server_ip_default="104.196.153.237"

echo -e "The server IP will default to the Google Compute Engine 'manager' instance for Group 7 if no address is given. \
Please give an IP address that can be used in the demo configuration."
echo
read -p "Server address for the Android build [${server_ip_default}]: " server_ip
server_ip="${server_ip:-$server_ip_default}"

install_to_device=false
echo
read -p "Do you want the script to install the APK to the Android device? If yes, the device has to be attached now. (y/n): " choice
case "$choice" in
  y|Y ) install_to_device=true;;
  n|N ) install_to_device=false;;
  * ) echo "Please answer 'y' or 'n'. ";;
esac

# install nodejs
echo -e "${BLUE}[1/6] ${GREEN}APT-GET updating...${NC}"
sudo apt-get update
echo -e "${BLUE}[2/6] ${GREEN}Fetching nodejs...${NC}"
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
echo -e "${BLUE}[3/6] ${GREEN}Installing nodejs and build essentials...${NC}"
sudo apt-get install -y nodejs build-essential

# install project dependencies
echo -e "${BLUE}[4/6] ${GREEN}Installing project dependencies...${NC}"
sudo npm install

# build Android package
echo -e "${BLUE}[5/6] ${GREEN}Preparing Android package...${NC}"
cd android/ThinClient
sed -i -e "s|10.0.2.2|${server_ip}|g" app/src/main/res/values/strings.xml
chmod +x gradlew
./gradlew assembleDebug
echo -e "${NC}The APK file can be found at ./app/build/outputs/apk/app-debug.apk${NC}"

if ${install_to_device}
then
  echo -e "      ${NC}Installing to device...${NC}"
  adb -d install app/build/outputs/apk/app-debug.apk
  echo -e "      ${NC}Success! Open ThinClient application on your Android device.${NC}"
fi

# start server at :80 (http) and :443 (https)
echo -e "${BLUE}[6/6] ${GREEN}Starting backend server...${NC}"
echo -e "      ${GREEN}Stop the server with CTRL-C and start with 'sudo npm start'.${NC}"
cd ../..
sudo npm start