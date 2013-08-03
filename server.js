/**
 * serveur.js
 *
 * The NodeJS server
 */

/**
 * Content :
 *
 * 1- Init
 * 2- SocketIO connection
 */



var express = require('express'),
	app     = express(), 
	server  = require('http').createServer(app), 
	io      = require('socket.io').listen(server),
	hbs     = require('hbs');

/**
 * Init Express
 */

app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', hbs.__express);

app.use(express.static('public'));




//A remote
app.get('/', function(req, res) {
   res.render('index', {title:"Home"});
});

//A player
app.get('/player', function(req, res) {
   res.render('player', {title:"Player"});
});



server.listen(4000);



//Init
var allClients = 0,  //number of client
	clientId   = 1,  //client_id, will be incremented
	remotes    = [], //list of remotes connected
	players    = []; //list of players connected

var volume        = parseInt(50), //default to 50%
	musicStatus   = "stop",
	musicPosition = 0,
	musicMode     = "tracks" // "Tracks" or "Radio"
	queue         = [], //Tracks to play
	history       = []; //Tracks already played




/**
 * A new connection
 */
io.sockets.on('connection', function (client) {

	//The client
	var my_client = { 
		"id": clientId,
		"obj": client ,
		"statut" : null
	};

	//Upload the stats
	clientId += 1;
	allClients += 1;

	//Debug
	console.log("Cliend " + my_client.id + " connected.");


	//Return "connected" to the client
	client.emit(
		'connected', 
		//the client id and status
  		{
  			clientId : my_client.id, 
  			msg: 'Connected' 
  		},
  		//The client will identificate himself
  		//Player or command ?
  		function(status) {
			if(status == 'player')
			{ 
				client.join("players"); //Join the room of the players
				my_client.status = "player";
				players.push(my_client.id); //Update the list
			} 
			else 
			{
				my_client.status = "remote";
				remotes.push(my_client.id); //Update the list
			}

			my_client.statut = status;



			//debug
			console.log("Client " + my_client.id + " identified as " + status + ".");


			//Ask players if there is a current track
			if(players.length > 0) {
				io.sockets.in('players').emit('isCurrent'); 
			}


			//Broadcast current informations to everyone
			infos();
  		}
  	);


	/**
	 * Broadcast current informations to everyone
	 * @return void
	 */
  	function infos() {
  		io.sockets.emit('infos', 
  			{
	  			remotes       : remotes,
	  			players       : players,
	  			musicPosition : musicPosition,
	  			musicStatus   : musicStatus,
	  			musicMode     : musicMode,
	  			history       : history,
	  			queue         : queue
	  		}
	  	);
  	}


  	/**
  	 * Listen for something to play
  	 */

	//News tracks to play immediately
	client.on('tracks', function(tracks){

		//We udpate the history
		if(queue[0]) {
			history.push(queue[0]);
			queue.splice(0, 1);
		}

		//We push the new tracks a the beggining of the queue
		queue = tracks.concat(queue);

		//We send the first track
		io.sockets.in('players').emit('track', queue[0]); 

		//Broadcast changes to everyone
		infos();

		musicMode = "tracks";

		console.log("Tracks");
		console.log("History", history);
		console.log("Queue", queue);
	});

	//New tracks to add to queue
	client.on('queue', function(tracks){

		//We push the new tracks a the end of the queue
		queue = queue.concat(tracks);

		//If players are "stop", we ask them to play
		if(musicStatus == "stop")
			io.sockets.in('players').emit('track', queue[0]);

		//Broadcast changes to everyone
		infos();

		musicMode = "tracks";

		console.log("Queue");
		console.log("History", history);
		console.log("Queue", queue);
	});

	//Track to remove from queue
	client.on('removeQueue', function(track){

		queue.splice(queue.indexOf(track), 1);

		//Broadcast changes to everyone
		infos();
	});

	//Current track ended, we update the history and the queue and we return the new track
	client.on('end', function(track) {
		if(musicMode == "tracks") {
			//Update history with the current track
			history.push(track);
			
			//Remove the current track from queue
			queue.splice(queue.indexOf(track), 1); 

			//Send the next track
			io.sockets.in('players').emit('track', queue[0]);

			//Broadcast changes to everyone
			infos();
		} 
		//else players go ahead by themself
		
		console.log("End");
		console.log("History", history);
		console.log("Queue", queue);
	});


  	//Play a Radio
	client.on('radio', function (data) {
		queue = []; //Delete the queue
	    	io.sockets.in("players").emit('radio', data);
	    	musicMode = "radio";
	});	

	//Play a SmartRadio
	client.on('smartRadio', function (data) {
		queue = []; //Delete the queue
	    	io.sockets.in("players").emit('smartRadio', data);
	    	musicMode = "radio";
	});	


	//Players return the current track_id
	client.on('current', function(data) {
		if(data.current) {
			queue[0] = data.current; //Current track
			musicStatus = data.musicStatus;
		} else {
			queue = [];
		}
		//Broadcast changes to everyone
		infos();

		console.log("Current");
		console.log("History", history);
		console.log("Queue", queue);
	});


	//Players return status (play, pause, stop ?)
	client.on('musicStatus', function(status) {
		musicStatus = status;
		//Broadcast changes to everyone
		infos();
	});


	//Players return music position
	client.on('musicPosition', function(position) {
		musicPosition = position;
		//Return to everyone
		io.sockets.emit('musicPosition', position);
	});


	//Client wants history & queue
	client.on('updateQueue', function(fn) {
		fn({
			history : history,
			queue   : queue
		});
	})





	/**
	 * Basic command
	 */

	//Play
	client.on('play', function () {
    		io.sockets.in("players").emit('play');

    		//Update Volume
		io.sockets.in("players").emit('volume', volume);
		console.log(queue);
	});

	//Pause
	client.on('pause', function () {
    		io.sockets.in("players").emit('pause');
	});

	//Prev
	client.on('prevTrack', function () {
    	//If radio, players have next/prev tracks
    		if(musicMode != "radio" && history.length > 0) {
			queue.unshift(history[history.length-1]);
			io.sockets.in('players').emit('track', queue[0]);
    		}

    		console.log("Prev");
		console.log("History", history);
		console.log("Queue", queue);
	});

	//Next
	client.on('nextTrack', function () {
    		//If radio, players have next/prev tracks
    		if(musicMode != "radio" && queue.length > 0) {
    			io.sockets.in('players').emit('track', queue[0]);
    		}

    		console.log("Next");
		console.log("History", history);
		console.log("Queue", queue);
	});

	//Seek
	client.on('seek', function (seek) {
    		io.sockets.in("players").emit('seek', seek);
	});


	//Volume
	client.on('volume', function (vol) {

		//Update vol if we stay between 0 and 100
		volume = (volume + parseInt(vol) < 0 || volume + parseInt(vol) >100) ? volume : volume + (parseInt(vol));

		//Update Player
		io.sockets.in("players").emit('volume', volume);

	});


	//Disconnect
	client.on('disconnect', function() {
		console.log("Cliend " + my_client.id + " disconnected.");
		allClients -= 1;

		if(my_client.status == 'player') {
			players.splice(players.indexOf(my_client.id), 1); 
		} else {
			remotes.splice(remotes.indexOf(my_client.id), 1); 
		}
	});


});
