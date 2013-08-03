Deezer-Server
=============

Want to play tracks with Deezer in the open-space but everyone want to control the music ?    
This is a NodeJs server to play and control Deezer with multiple remotes.

Installation
============

Your Deezer Application
---------------

First of all you need to log into the [Deezer developpers plateform](http://developers.deezer.com/) and create your application.   
Complete the fields "Application domain" with the IP or the domaine name of the NodeJS server (like 192.168.0.10 or raspberrypi.local)   
Remember your Application ID.    

Edit remote.js and player.js
----------------------------

Edit remote.js and player.js with your Application ID (line 20).

Start the NodeJS server
-----------------------
Start the server with `node server.js`.

Enjoy
-----
In a browser load the player page (ex: 192.168.0.10/player).   
You can load remotes with 192.168.0.10/.
