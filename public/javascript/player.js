/**
 * player.js
 *
 * A player is also a remote.
 * 
 * Init the player :
 * 1- download deezer sdk
 * 2- login the user to deezer
 * 3- connect the page to the nodeJS server via socketIO and identify himself as a player
 * 4- start to listen for user actions
 * 5- start to wait to track to play
 */




$(document).ready(function(){

	//Init Deezer Player
	window.dzAsyncInit = function() {
		DZ.init({
			appId  : '112611', //Your app id
			channelUrl : 'http://'+window.location.host,
			player : {
				onload: deezerReady
			}
		});
	  };
	(function() {
		var e = document.createElement('script');
		e.src = 'http://cdn-files.deezer.com/js/min/dz.js';
		e.async = true;
		document.getElementById('dz-root').appendChild(e);
	}());

	
	/**
	 * deezerReady method
	 *
	 * Deezer is loaded, time to log and open a socketIO connection
	 * 
	 * @return void
	 */
	function deezerReady () {

		DZ.login(function(response)  //Will prompt a new widnow asking the user to connect with his deezer account
		{
		    if (response.authResponse) //User connected
		    {
				flash('Connected', 'green'); //Cool

				//Update Deezer status
				$('div.infosbox li.deezer li span').text('Connected');
				$('div.infosbox li.deezer li span').removeClass('label-important').addClass('label-success');


				//Connect to the server
				socket = io.connect('http://'+window.location.host);

				var self = 0;

				//When connected
				socket.on('connected', function(data, identification){

					self = data.clientId;

					//Update informations
					$('div.infosbox li.connection li:first-child span').text(self); //my id
					$('div.infosbox li.connection li:nth-child(2) span').text(data.msg);
					if(data.msg == 'Connected')
						$('div.infosbox li.connection li:nth-child(2) span').removeClass('label-important').addClass('label-success');

					//Identification as a remote
					identification('player');
				});



				//@see main.js
				app(); 


				//@see below
				player();


		    } else { // User cancelled login or did not fully authorize
				flash("You have to be connected to Deezer to use the app. Please reload the page.", "red")
		    }
		}, 
		{
			//All the perms
			perms: ['basic_access','email','offline_access','manage_library','manage_community','delete_library','listening_history'] 
		});

	}




	/**
	 * player method
	 *
	 * Listen the server and control the Deezer player
	 * 
	 * @return void
	 */
	function player() {

		var currentTrack = {
				id : "" //current track if
			},
			lastPosition = 0, //last position of the trcak
			musicMode = "track",
			musicStatus = "stop";


		//What to play ?

		//Play a track
		socket.on('track', function(track){
			DZ.player.playTracks([track], 0, function(response){
				//console.log(response);
			});
			musicMode = "track";
		});

		//Play a smartRadio
		socket.on('smartRadio', function(artist){
			DZ.player.playSmartRadio(artist, function(response){
				//console.log("track list", response.tracks);
			});
			musicMode = "radio";
		});

		//Play a radio
		socket.on('radio', function(radio){
			DZ.player.playRadio(radio, 20, function(response){
				//console.log("track list", response.tracks);
			});
			musicMode = "radio";
		});


		//What is the current track
		socket.on('isCurrent', function(){
			if(currentTrack.id != "") {
				socket.emit('current', {
					current     : track.track.id,
					musicStatus : musicStatus
				});
			} else {
				socket.emit('current', {
					current     : false,
					musicStatus : musicStatus
				});
			}
		});

		
		//Basic Commands

		//Play
		socket.on('play', function(track){
			DZ.player.play();

			//If no track loaded, play the first in the queue
			if(currentTrack.id == "") {
				DZ.player.playTracks(queue[0], 0, function(response){
					//console.log(response);
				});
			}
		});
		//Pause
		socket.on('pause', function(track){
			DZ.player.pause();
			socket.emit('musicStatus', 'pause');
		});	

		//Prev
		socket.on('prev', function(track){
			DZ.player.prev();
		});
		//Next
		socket.on('next', function(track){
			DZ.player.next();
		});

		//Volume
		socket.on('volume', function(vol){
			DZ.player.setVolume(vol); 
		});

		//Seek
		socket.on('seek', function(position){
			DZ.player.seek(position);
		});

		
		//Listen for player's events
		
		///Playing, player_position change, we use it to determine if the track is ended 
		DZ.Event.subscribe('player_position', function(time){
			/**
			 * time = [currentTime, totalTime];
			 */
			
			socket.emit('musicPosition', time[0]/time[1]*100); //From 0 to 100

			if(time[0] < lastPosition) { //return to position 0
				//if musicMode == "track", the server will return the next track to play
				socket.emit('end', currentTrack.id); 
				socket.emit('musicStatus', 'stop');
				musicStatus = "stop";
			}

			lastPosition = time[0];
		});		

		DZ.Event.subscribe('player_play', function(){
			socket.emit('musicStatus', 'playing');
			musicStatus = "playing";
		});		

		DZ.Event.subscribe('player_pause', function(){
			socket.emit('musicStatus', 'pause');
			musicStatus = "pause";
		});

		//Fired when a new track starts
		DZ.Event.subscribe('current_track', function(track){
			socket.emit('current', {
				current     : track.track.id,
				musicStatus : musicStatus
			});
			currentTrack = track.track;
		});


	}

});