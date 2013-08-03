/**
 * main.js
 *
 * Command the music and echo some information
 */




/**
 * Content :
 *
 * 1- Variables
 * 2- General
 * 3- Commands
 * 4- Flah
 */




/**
 * Some variables
 */
$(document).ready(function() {
	flasher = $('div.flash'); //Flash infos @see flash()
	
	history : []; //Tracks already played
	queue = []; //Tracks to play
});




/**
 * general method
 *
 * Listen to the server information and return it to the user :
 *
 *  - current track
 *  - history and queue
 *  - track position
 *  - music status (playing, pause, stop)
 *  - List of players
 *  - List of remotes
 * 
 * @return void
 */
function general() {

	//Update music position range
	function updatePosition(position){
		$('div.music li.position input').val(position);
	}

	//Update lists of played tracks and tracks to play
	function updateQueue (data) {

		$('div.queue ul.container li.history').remove();
		if(data.history.length > 0 && data.history[0] != null) {
			$.each(data.history, function() {
				if(this != null) {
					DZ.api('/track/'+this, function(response){
						$('div.queue ul.container').append(
							'<li class="block history">'+
								'<strong>'+response.title+' </strong>  ' + response.artist.name + ' - ' + response.album.title +
							
								'<div class="btn-group">'+
									'<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">'+
								    	'Actions <span class="caret"></span>'+
								   '</button>'+

									'<ul class="dropdown-menu">'+
								  		'<li>'+
								  			'<a href="#"><span class="command" data-type="track" data-obj="'+response.id+'">Play</span></a>'+
								  		'</li>'+
								  		'<li>'+
								  			'<a href="#"><span class="command" data-type="addQueue" data-obj="'+response.id+'">Add to Queue</span></a>'+
								  		'</li>'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="addFavorites" data-obj="'+response.id+'">Add to Favorites</span></a>'+
								  		'</li>'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="removeFavorites" data-obj="'+response.id+'">Remove from Favorites</span></a>'+
								  		'</li>'+
								  	'</ul>'+
							  	'</div>'+
							  	'<div class="clr"></div>'+

							'</li>'
						);
					});
				}
			});
		}

		$('div.queue ul.container li.queue').remove();
		if(data.queue.length > 0 && data.queue[0]!= null) {
			$.each(data.queue, function(q) {
				DZ.api('/track/'+this, function(response){
					$('div.queue ul.container').append(
						'<li class="block queue">'+
							'<strong>'+response.title+' </strong>  '+response.artist.name+' - '+response.album.title +

							'<div class="btn-group">'+
								'<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">'+
							    	'Actions <span class="caret"></span>'+
							   '</button>'+

								'<ul class="dropdown-menu">'+
							  		'<li>'+
							  			'<a href="#"><span class="command" data-type="removeQueue" data-obj="'+response.id+'">Remove from Queue</span></a>'+
							  		'</li>'+
							  		'<li>'+
							  			'<a href="#"><span class="deezer" data-type="addFavorites" data-obj="'+response.id+'">Add to Favorites</span></a>'+
							  		'</li>'+
							  		'<li>'+
							  			'<a href="#"><span class="deezer" data-type="removeFavorites" data-obj="'+response.id+'">Remove from Favorites</span></a>'+
							  		'</li>'+
							  	'</ul>'+
						  	'</div>'+
						  	'<div class="clr"></div>'+

						'</li>'
					);
				});
			});
		}

	}

	//Update some general informations
	function updateInfos(data) {

		//List of players
		$('div.infosbox li.players span').text('('+data.players.length+')');
		$('div.infosbox li.players ul').html('');
		$.each(data.players, function() {
			$('div.infosbox li.players ul').append('<li>'+this+'</li>');
		});

		//Remotes
		$('div.infosbox li.remotes span').text('('+data.remotes.length+')');
		$('div.infosbox li.remotes ul').html('');
		$.each(data.remotes, function() {
			$('div.infosbox li.remotes ul').append('<li>'+this+'</li>');
		});


		if(data.history != history || data.queue != queue) {
			$('div.queue').removeClass('open');
			$('div.queue i').removeClass('icon-chevron-up').addClass('icon-chevron-down');
		}

		history = data.history;
		queue   = data.queue;

		//Show current track
		if((data.musicStatus == "playing" || data.musicStatus == "pause") && data.queue[0]) {
			DZ.api('/track/'+data.queue[0], function(response)
			{
				$('div.music li.current').html('<strong>'+response.title+' </strong>  '+response.artist.name+' - '+response.album.title);
			});
		} else {
			$('div.music li.current').html("No track");
		}

		//Show music status
		if(data.musicStatus == "playing") {
			$('ul.nav li.commandes a.play').addClass("btn-primary");
			$('ul.nav li.commandes a.pause').removeClass("btn-primary");
		} else if(data.musicStatus == "pause") {
			$('ul.nav li.commandes a.pause').addClass("btn-primary");
			$('ul.nav li.commandes a.play').removeClass("btn-primary");
		} else {
			$('ul.nav li.commandes a.play').removeClass("btn-primary");
			$('ul.nav li.commandes a.pause').removeClass("btn-primary");
		}

		//Hide prev/next buttons if rmusicMode = radio
		if(data.musicMode == "radio") {
			$('ul.nav li.commandes a.prev, ul.nav li.commandes a.next').css('display', 'none');
		} else {
			$('ul.nav li.commandes a.prev, ul.nav li.commandes a.next').css('display', 'inline-block');
		}


		updatePosition(data.musicPosition);

	}


	//Open/close the queue
	$(document).on('click', 'div.queue div', function() {
		if($('div.queue').hasClass('open')) {
			$('div.queue').removeClass('open');
			$('div.queue i').removeClass('icon-chevron-up').addClass('icon-chevron-down');
		} else {
			socket.emit('updateQueue', function(data) {
				updateQueue(data);
			});
			$('div.queue').addClass('open');
			$('div.queue i').removeClass('icon-chevron-down').addClass('icon-chevron-up');
		}
	});




	//Listen to socketIO 

	socket.on('infos', function(data){
		updateInfos(data);
	});	

	socket.on('musicPosition', function(position){
		updatePosition(position)
	});

}




/**
 * commands method
 *
 * User commands :
 *
 * - for the player(s) :
 * 		- play/add to queue a track, a, album, a playlist, a radio, a smartradio
 * 		- remove a track from the queue
 * 		- prev/next
 * 		- play/pause
 * 		- volume up/down
 * 	
 * - for Deezer (api) :
 * 		- search for a track
 * 		- show an album, an artist, a playlist
 * 		- add/remove to favorites
 * 
 * @return void
 */
function commands() {

	//Change music position
	$(document).on('change', 'div.music li.position input', function(event) {
		event.preventDefault();

		socket.emit('seek', $(this).val());
	});




	/**
	 * Players commands
	 */
	$(document).on('click', 'button.command, span.command, a.command', function(event){

		event.preventDefault();

		var type = $(this).attr('data-type') ? $(this).attr('data-type') : false,
			obj = $(this).attr('data-obj') ? $(this).attr('data-obj') : false;

		var tracks = [];

		switch(type) {

			//Play album/playlist
			case 'album' :
			case 'playlist' :
				//We send the list of all the tracks of the album/playlist
				var tracks = [];
				DZ.api('/'+type+'/'+obj, function(response)
				{
					$.each(response.tracks.data, function(){
						tracks.push(this.id)
					});
					socket.emit('tracks', tracks);
				});

				break;

			//Play a track
			case 'track' :
				socket.emit('tracks', [obj]);
				break;

			//Add a track to queue
			case 'addQueue':
				socket.emit('queue', [obj]);
				break;

			//Add an album/ a playlist to queue
			//We send the list of all the tracks of the album/playlist
			case 'addQueueAlbum':
				var tracks = [];
				DZ.api('/album/'+obj, function(response)
				{
					$.each(response.tracks.data, function(){
						tracks.push(this.id)
					});
					socket.emit('queue', tracks);
				});
				break;
			case 'addQueuePlaylist':
				var tracks = [];
				DZ.api('/playlist/'+obj, function(response)
				{
					$.each(response.tracks.data, function(){
						tracks.push(this.id)
					});
					socket.emit('queue', tracks);
				});
				break;

			//Play a smartradio, a radio
			case 'smartRadio' :
			case 'radio' :
			//Remove a track from queue
			case 'removeQueue':
			default :

				if(obj)
					socket.emit(type, obj);
				else
					socket.emit(type);
				break;
		}
		
	});




	/**
	 * Deezer commands
	 */
	$(document).on('click', 'button.deezer, span.deezer, a.deezer', function(event){

		event.preventDefault();

		var type = $(this).attr('data-type') ? $(this).attr('data-type') : null,
			obj  = $(this).attr('data-obj') ? $(this).attr('data-obj') : null;

		switch(type) {

			//Add a track, an album, a playlist, an artist, a radio to favorites
			
			case 'addFavorites' : 
				DZ.api('/user/me/tracks/?track_id='+obj, 'POST', function(response)
				{
					if(response) flash("New Favorite !", 'green');
					else flash('Error', 'red');
				});
				break;

			case 'addFavoritesAlbum' : 
				DZ.api('/user/me/albums/?album_id='+obj, 'POST', function(response)
				{
					if(response) flash("New Favorite !", 'green');
					else flash('Error', 'red');
				});
				break;

			case 'addFavoritesArtist' : 
				DZ.api('/user/me/artists/?artist_id='+obj, 'POST', function(response)
				{
					if(response) flash("New Favorite !", 'green');
					else flash('Error', 'red');
				});
				break;
			case 'addFavoritesRadios' : 
				DZ.api('/user/me/radios/?radio_id='+obj, 'POST', function(response)
				{
					if(response) flash("New Favorite !", 'green');
					else flash('Error', 'red');
				});
				break;

			//Remove from favorites

			case 'removeFavorites' :
				DZ.api('/user/me/tracks/?track_id='+obj, 'DELETE', function(response)
				{
					if(response) flash("Favorite deleted", 'green');
					else flash('Error', 'red');
				});
				break;

			case 'removeFavoritesAlbum' : 
				DZ.api('/user/me/albums/?album_id='+obj, 'DELETE', function(response)
				{
					if(response) flash("Favorite deleted", 'green');
					else flash('Error', 'red');
				});
				break;

			case 'removeFavoritesArtist' : 
				DZ.api('/user/me/artists/?artist_id='+obj, 'DELETE', function(response)
				{
					if(response) flash("Favorite deleted", 'green');
					else flash('Error', 'red');
				});
				break;
			case 'removeFavoritesRadios' : 
				DZ.api('/user/me/radios/?radio_id='+obj, 'DELETE', function(response)
				{
					if(response) flash("Favorite deleted", 'green');
					else flash('Error', 'red');
				});
				break;

			//Show artist, album, playlist, radios, favorites
			//Search for a track

			case 'api' :
				api(obj, $(this).attr('href')); //Must be a click on a "<a href="my_id"></a>"
				break;

			default : break;
		}
		
	});




	//Search for a track
	$(document).on('submit', 'form.search', function(event){
		event.preventDefault();
		var val = $(this).find('input').val();

		api('search', val);
	});




	/**
	 *	API
	 *
	 * @params {string} action
	 * @params {string} val
	 */
	function api(action, val) {

		var url = ""; //to url to call

		switch(action) {

			//Show album, artist, playlist, radio
			case 'album'    :
			case 'artist'   :
			case 'playlist' : 
			case 'radio'    :
				url = '/'+action+'/'+val;
				break;

			//Favorites
			case 'user' :
				url = '/user/me/'+val;
				break;

			//Search
			default: 
				url = '/search/?q='+val;
				break;

		}




		DZ.api(url, function(response)
		{

			var next = false;

			$('div.content').html("");

			//Return all tracks after search
			function tracksResponse (data) {

				if(!next) {
					$('h1.title').html("Search : "+val);

					$('div.content').append(
						'<table class="table table-striped">'+
							'<thead>'+
								'<tr>'+
									'<th>Title</th>'+
									'<th>Artist</th>'+
									'<th>Album</th>'+
									'<th>Actions</th>'+
								'</tr>'+
							'</thead>'+
							'<tbody></tbody>'+
						'</table>');
				}

				$.each(data, function() {
					$('div.content tbody').append(
						'<tr>'+
							'<td>'+this.title+'</td>'+
							'<td><a class="deezer" data-type="api" data-obj="artist" href="'+this.artist.id+'" >'+this.artist.name+'</a></td>'+
							'<td><a class="deezer" data-type="api" data-obj="album" href="'+this.album.id+'" >'+this.album.title+'</a></td>'+
							'<td>'+
								'<button class="btn btn-primary command play" data-type="track" data-obj="'+this.id+'">Play</button>'+
								'<div class="btn-group">'+
									'<a class="btn btn-default dropdown-toggle deezer" data-toggle="dropdown" href="#">'+
								    	'Actions'+
										'<span class="caret"></span>'+
									'</a>'+
								  	'<ul class="dropdown-menu">'+
								  		'<li>'+
								  			'<a href="#"><span class="command" data-type="addQueue" data-obj="'+this.id+'">Add to Queue</span></a>'+
								  		'</li>'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="addFavorites" data-obj="'+this.id+'">Add to Favorites</span></a>'+
								  		'</li>'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="removeFavorites" data-obj="'+this.id+'">Remove from Favorites</span></a>'+
								  		'</li>'+
								  	'</ul>'+
								'</div>'+
							'</td>'+
						'</tr>');
				});
			}

			//Return tracks of an album
			function albumResponse (data) {

				if(!next) {
					$('h1.title').html(data.title+ ' <div class="btn-group">'+
					'<button class="btn btn-primary command" data-type="album" data-obj="'+data.id+'" >Play</button>'+
					'<button class="btn deezer" data-type="addFavoritesAlbum" data-obj="'+data.id+'" >Add to Favorites</button>'+
					'<button class="btn deezer" data-type="removeFavoritesAlbum" data-obj="'+data.id+'" >Remove from Favorites</button>'+
					'<button class="btn command" data-type="addQueueAlbum" data-obj="'+data.id+'">Add to Queue</button>'+
				'</div>');


				$('div.content').append(
					'<table class="table table-striped">'+
						'<thead>'+
							'<tr>'+
								'<th>Title</th>'+
								'<th>Artist</th>'+
								'<th>Actions</th>'+
							'</tr>'+
						'</thead>'+
						'<tbody></tbody>'+
					'</table>');
				}

				$.each(data.tracks.data, function() {
					$('div.content tbody').append(
						'<tr>'+
							'<td>'+this.title+'</td>'+
							'<td><a class="deezer" data-type="api" data-obj="artist" href="'+data.artist.id+'" >'+data.artist.name+'</a></td>'+
							'<td>'+
								'<button class="btn btn-primary command play" data-type="track" data-obj="'+this.id+'">Play</button>'+
								'<div class="btn-group">'+
									'<a class="btn btn-default dropdown-toggle deezer" data-toggle="dropdown" href="#">'+
								    	'Actions'+
										'<span class="caret"></span>'+
									'</a>'+
								  	'<ul class="dropdown-menu">'+
								  		'<li>'+
								  			'<a href="#"><span class="command" data-type="addQueue" data-obj="'+this.id+'">Add to Queue</span></a>'+
								  		'</li>'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="addFavorites" data-obj="'+this.id+'">Add to Favorites</span></a>'+
								  		'</li>'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="removeFavorites" data-obj="'+this.id+'">Remove from Favorites</span></a>'+
								  		'</li>'+
								  	'</ul>'+
								'</div>'+
							'</td>'+
						'</tr>');
				});
			}

			//Return tracks of a playlist
			function playlistResponse (data) {

				if(!next) {
					$('h1.title').html(data.title+ ' <div class="btn-group">'+
					'<button class="btn btn-primary command" data-type="playlist" data-obj="'+data.id+'" >Play</button>'+
					'<button class="btn deezer" data-type="addFavoritesPlaylist" data-obj="'+data.id+'" >Add to Favorites</button>'+
					'<button class="btn deezer" data-type="removeFavoritesPlaylist" data-obj="'+data.id+'" >Remove from Favorites</button>'+
					'<button class="btn command" data-type="addQueuePlaylist" data-obj="'+data.id+'">Add to Queue</button>'+
				'</div>');


				$('div.content').append(
					'<table class="table table-striped">'+
						'<thead>'+
							'<tr>'+
								'<th>Title</th>'+
								'<th>Artist</th>'+
								'<th>Album</th>'+
								'<th>Actions</th>'+
							'</tr>'+
						'</thead>'+
						'<tbody></tbody>'+
					'</table>');
				}

				$.each(data.tracks.data, function() {
					$('div.content tbody').append(
						'<tr>'+
							'<td>'+this.title+'</td>'+
							'<td><a class="deezer" data-type="api" data-obj="artist" href="'+this.artist.id+'" >'+this.artist.name+'</a></td>'+
							'<td><a class="deezer" data-type="api" data-obj="album" href="'+this.album.id+'" >'+this.album.title+'</a></td>'+
							'<td>'+
								'<button class="btn btn-primary command play" data-type="track" data-obj="'+this.id+'">Play</button>'+
								'<div class="btn-group">'+
									'<a class="btn btn-default dropdown-toggle deezer" data-toggle="dropdown" href="#">'+
								    	'Actions'+
										'<span class="caret"></span>'+
									'</a>'+
								  	'<ul class="dropdown-menu">'+
								  		'<li>'+
								  			'<a href="#"><span class="command" data-type="addQueue" data-obj="'+this.id+'">Add to Queue</span></a>'+
								  		'</li>'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="addFavorites" data-obj="'+this.id+'">Add to Favorites</span></a>'+
								  		'</li>'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="removeFavorites" data-obj="'+this.id+'">Remove from Favorites</span></a>'+
								  		'</li>'+
								  	'</ul>'+
								'</div>'+
							'</td>'+
						'</tr>');
				});
			}

			//Return albums of an album
			function artistResponse (artist) {

				if(!next) {
					$('h1.title').html(artist.name+ ' <div class="btn-group">'+
						'<button class="btn deezer" data-type="addFavoritesArtist" data-obj="'+artist.id+'" >Add to Favorites</button>'+
						'<button class="btn deezer" data-type="removeFavoritesArtist" data-obj="'+artist.id+'" >Remove from Favorites</button>'+
					'</div>');

					if(artist.radio)
						$('h1.title div').append('<button class="btn btn-primary command" data-type="smartRadio" data-obj="'+artist.id+'">SmartRadio</button>');
					
					$('div.content').append(
						'<h2>Albums</h2>'+
						'<table class="table table-striped">'+
							'<thead>'+
								'<tr>'+
									'<th>Title</th>'+
									'<th>Actions</th>'+
								'</tr>'+
							'</thead>'+
							'<tbody></tbody>'+
						'</table>');
				}

				DZ.api('/artist/'+artist.id+'/albums', function(response)
				{
					$.each(response.data, function() {

						$('div.content tbody').append(
							'<tr>'+
								'<td><a class="deezer" data-type="api" data-obj="album" href="'+this.id+'" > '+this.title+'</a></td>'+
								'<td>'+
									'<button class="btn btn-primary command play" data-type="album" data-obj="'+this.id+'">Play</button>'+
									'<div class="btn-group">'+
										'<a class="btn btn-default dropdown-toggle deezer" data-toggle="dropdown" href="#">'+
									    	'Actions'+
											'<span class="caret"></span>'+
										'</a>'+
									  	'<ul class="dropdown-menu">'+
									  		'<li>'+
									  			'<a href="#"><span class="deezer" data-type="addFavoritesAlbum" data-obj="'+this.id+'">Add to Favorites</span></a>'+
									  		'</li>'+
									  		'<li>'+
									  			'<a href="#"><span class="deezer" data-type="removeFavoritesAlbum" data-obj="'+this.id+'">Remove from Favorites</span></a>'+
									  		'</li>'+
									  	'</ul>'+
									'</div>'+
								'</td>'+
							'</tr>');
					});
				});
			}

			//Return radios (favorites)
			function radiosResponse(data) {

				if(!next) {
					$('h1.title').html("Radios");

					$('div.content').append(
						'<table class="table table-striped">'+
							'<thead>'+
								'<tr>'+
									'<th>Radio</th>'+
									'<th>Description</th>'+
									'<th>Actions</th>'+
								'</tr>'+
							'</thead>'+
							'<tbody></tbody>'+
						'</table>');
				}

				$.each(data, function() {

					$('div.content tbody').append(
						'<tr>'+
							'<td>'+this.title+'</td>'+
							'<td>'+this.description+'</td>'+
							'<td>'+
								'<button class="btn btn-primary command play" data-type="radio" data-obj="'+this.id+'">Play</button>'+
								'<div class="btn-group">'+
									'<a class="btn btn-default dropdown-toggle deezer" data-toggle="dropdown" href="#">'+
								    	'Actions'+
										'<span class="caret"></span>'+
									'</a>'+
								  	'<ul class="dropdown-menu">'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="addFavoritesRadio" data-obj="'+this.id+'">Add to Favorites</span></a>'+
								  		'</li>'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="removeFavoritesRadio" data-obj="'+this.id+'">Remove from Favorites</span></a>'+
								  		'</li>'+
								  	'</ul>'+
								'</div>'+
							'</td>'+
						'</tr>');
				});

			}

			//Return list of albums (favorites)
			function albumsResponse (data) {

				if(!next) {
					$('h1.title').html("Albums");

					
					$('div.content').append(
						'<table class="table table-striped">'+
							'<thead>'+
								'<tr>'+
									'<th>Title</th>'+
									'<th>Actions</th>'+
								'</tr>'+
							'</thead>'+
							'<tbody></tbody>'+
						'</table>');
				}

				$.each(data, function() {

					$('div.content tbody').append(
						'<tr>'+
							'<td><a class="deezer" data-type="api" data-obj="album" href="'+this.id+'" > '+this.title+'</a></td>'+
							'<td>'+
								'<button class="btn btn-primary command play" data-type="album" data-obj="'+this.id+'">Play</button>'+
								'<div class="btn-group">'+
									'<a class="btn btn-default dropdown-toggle deezer" data-toggle="dropdown" href="#">'+
								    	'Actions'+
										'<span class="caret"></span>'+
									'</a>'+
								  	'<ul class="dropdown-menu">'+
								  		'<li>'+
								  			'<a href="#"><span class="command" data-type="addQueueAlbum" data-obj="'+this.id+'">Add to Queue</span></a>'+
								  		'</li>'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="addFavoritesAlbum" data-obj="'+this.id+'">Add to Favorites</span></a>'+
								  		'</li>'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="removeFavoritesAlbum" data-obj="'+this.id+'">Remove from Favorites</span></a>'+
								  		'</li>'+
								  	'</ul>'+
								'</div>'+
							'</td>'+
						'</tr>');
				});
			}

			//Return playlists (favorites)
			function playlistsResponse(data) {

				if(!next) {
					$('h1.title').html("Playlists");

					$('div.content').append(
						'<table class="table table-striped">'+
							'<thead>'+
								'<tr>'+
									'<th>Playlists</th>'+
									'<th>Actions</th>'+
								'</tr>'+
							'</thead>'+
							'<tbody></tbody>'+
						'</table>');
				}

				$.each(data, function() {

					$('div.content tbody').append(
						'<tr>'+
							'<td><a class="deezer" href="'+this.id+'" data-type="api" data-obj="playlist" >'+this.title+'</a></td>'+
							'<td>'+
								'<button class="btn btn-primary command play" data-type="playlist" data-obj="'+this.id+'">Play</button>'+
								'<div class="btn-group">'+
									'<a class="btn btn-default dropdown-toggle deezer" data-toggle="dropdown" href="#">'+
								    	'Actions'+
										'<span class="caret"></span>'+
									'</a>'+
								  	'<ul class="dropdown-menu">'+
								  		'<li>'+
								  			'<a href="#"><span class="command" data-type="addQueuePlaylist" data-obj="'+this.id+'">Add to Queue</span></a>'+
								  		'</li>'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="removeFavoritesPlaylist" data-obj="'+this.id+'">Remove from Favorites</span></a>'+
								  		'</li>'+
								  	'</ul>'+
								'</div>'+
							'</td>'+
						'</tr>');
				});

			}

			//Return artists (favorites)
			function artistsResponse(data) {

				if(!next) {
					$('h1.title').html("Artists");

					$('div.content').append(
						'<table class="table table-striped">'+
							'<thead>'+
								'<tr>'+
									'<th>Artists</th>'+
									'<th>SmartRadio</th>'+
									'<th>Actions</th>'+
								'</tr>'+
							'</thead>'+
							'<tbody></tbody>'+
						'</table>');
				}

				$.each(data, function() {

					$('div.content tbody').append(
						'<tr>'+
							'<td><a class="deezer" href="'+this.id+'" data-type="api" data-obj="artist">'+this.name+'</a></td>'+
							'<td class="smartRadio"></td>'+
							'<td>'+
								'<div class="btn-group">'+
									'<a class="btn btn-default dropdown-toggle deezer" data-toggle="dropdown" href="#">'+
								    	'Actions'+
										'<span class="caret"></span>'+
									'</a>'+
								  	'<ul class="dropdown-menu">'+
								  		'<li>'+
								  			'<a href="#"><span class="deezer" data-type="removeFavoritesArtist" data-obj="'+this.id+'">Remove from Favorites</span></a>'+
								  		'</li>'+
								  	'</ul>'+
								'</div>'+
							'</td>'+
						'</tr>');

					if(this.radio)
						$('div.content tbody tr:last-child td.smartRadio').html('<button class="btn btn-primary command play" data-type="smartRadio" data-obj="'+this.id+'">Play</button>');
				});

			}




			//What rendering to choose ?
			
			function echoResponse (response) {
				switch(action) {
					case 'album' : 
						albumResponse(response);
						break;
					case 'artist' :
						artistResponse(response);
						break;
					case 'radio' :
						radiosResponse(response);
						break;
					case 'playlist' :
						playlistResponse(response);
						break;
					case 'search' :
						tracksResponse(response.data);
						break;
					case 'user' :
						switch(val) {
							case 'tracks': 
								tracksResponse(response.data);
								break;
							case 'albums': 
								albumsResponse(response.data);
								break;
							case 'playlists': 
								playlistsResponse(response.data);
								break;
							case 'radios': 
								radiosResponse(response.data);
								break;
							case 'artists': 
								artistsResponse(response.data);
								break;
						}
						break;
				}
			}

			echoResponse(response);




			/**
			 * Next page
			 */
			
			//If deezer return a next url, show me a button "Next"
			if(typeof response.next != 'undefined') {
				$('div.content table').after('<button class="btn btn-primary next">Next</button>');
				next = response.next; //the url to call
			}

			//User wants more
			$('div.content button.next').click(function() 
			{
				//We ask for more
				$.getJSON(next+"&callback=?", function(response){
					
					echoResponse(response); //We return the result

					//If next url
					if(typeof response.next != 'undefined')
						next = response.next; //the url to call
					else
						$('div.content button.next').remove();

				});
			});

		});

	}

}





/**
 * app method
 *
 * Called after the Deezer login and SocketIO connexion by remote.js or player.js
 * @return void
 */
function app() {

	general();

	commands();
}




/**
 * flash method
 *
 * Echo @params msg in color @params color
 *
 * @return void
 */
function flash(msg, color, timeout) {

	flasher.removeClass('open');

	if(!color) color = '#f9f9f9';
	else if(color == 'green') color = '#5bb75b';
	else if(color == 'red') color = '#da4f49';

	flasher.find('p').html(msg);
	flasher.css('backgroundColor', color);
	flasher.addClass('open');


	if(timeout || typeof timeout == "undefined") {
		setTimeout(function(){
			flasher.removeClass('open');
		}, 10000);
	}

}
