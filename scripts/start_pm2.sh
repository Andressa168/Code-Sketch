#!/bin/bash

cd /home/ubuntu/nodelab

sudo pm2 stop server.js
sudo pm2 delete 0
sudo pm2 start server.js -o public/output.log -e public/error.log
sudo pm2 save