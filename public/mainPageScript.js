var userID;
$(document).ready(function() {
	// Starts with menu button shown
	let menuIsDown = true;
	$('#menuButton').click(() => {
		$('#menu').toggleClass('menuUp');
		// Hides menu
		$('#menu').toggleClass('menuDown');

		if (menuIsDown) {
			// Shows close icon when menu is shown
			$('#menuButton img').attr('src', 'close_button.png');
			menuIsDown = false;
		} else {
			// Shows menu icon when menu is hidden
			$('#menuButton img').attr('src', 'menu_button.png');
			menuIsDown = true;
		}
	});

	// Command for when the searched building is clicked
	$('#buildingOutline').on('click', (e) => {
		$('#locationInput').val("That doesn't do anything");
	});

	$('#logout').click(() => {
		firebase.auth().signOut().then(
			() => {
				window.location = 'index.html';
			},
			(e) => {
				console.log("You can't sign out.");
			}
		);
	});

	// Starts with debug information hidden
	let debugIsShown = false;
	$('#debugShow').click(() => {
		if (debugIsShown) {
			// Hides debug information
			$('#debug').css({ display: 'none' });
			$('#debugShow').text('Show Debug Info');
			debugIsShown = false;
		} else {
			// Shows debug information
			$('#debug').css({ display: 'block' });
			$('#debugShow').text('Hide Debug Info');
			debugIsShown = true;
		}
	});

	$('#locationInput').focus(function(e) {
		// Shows search button when input field is focused
		$('#searchClick').css({ display: 'block' });
		displayHistory();
	});

	// Search history
	function displayHistory() {
		$('#historyDrop').empty();
		$('#historyDrop').css({ display: 'block' });
		db.collection('users').doc(userID).collection('history').doc('locations').get().then(function(data) {
			for (let i of data.data().location) {
				let para = $('<p>' + i + '</p>');
				$('#historyDrop').prepend(para.clone());
			}
		});
	}
	// When building number in history is clicked, adds data to history
	$('#historyDrop').on('click', (e) => {
		console.log(e.target.innerText);
		$('#locationInput').val(e.target.innerText);
		addHistoryData();
	});

	$('#locationInput').blur(async function(e) {
		// Waits for button to be pressed before disappearing
		await sleep(100);
		$('#searchClick').css({ display: 'none' });
		$('#historyDrop').css({ display: 'none' });
	});

	// When Enter key is pressed, adds data to history
	$('#locationInput').keydown(function(e) {
		let keycode = e.keyCode ? e.keyCode : e.which;
		if (keycode == 13) {
			addHistoryData();
		}
	});

	// When search button is clicked, adds data to history
	$('#searchClick').click(function(e) {
		addHistoryData();
	});

	// Adds search history to database
	function addHistoryData() {
		let input = $('#locationInput');
		let snapData = [ 'emptyLocation' ];
		db
			.collection('users')
			.doc(userID)
			.collection('history')
			.doc('locations')
			.get()
			.then((snap) => {
				// Checks if location attribute exists
				try {
					// If it does, no error
					snapData = snap.data()['location'];
				} catch (e) {
					// If it doesn't, data will correctly be added in the next .then()
					console.log('Location doc does not exist, add later');
				}
				//console.log(snapData);
			})
			.then(() => {
				if (userID && input.val() != '') {
					// If snapData has some new information in it
					if (snapData[0] != 'emptyLocation') {
						console.log('SnapData exists');
						let addedValue = false;
						// Checks to see if entry is already in snapData
						for (let i in snapData) {
							// If it is, remove and re-add entry
							if (snapData[i] == input.val()) {
								console.log('Found value ' + i + ', already in the array');
								snapData.splice(i, 1);
								snapData.push(input.val());
								addedValue = true;
							}
						}
						if (!addedValue) {
							snapData.push(input.val());
						}
						// Otherwise, clear and initialize snapData
					} else {
						console.log('Array does not exist, initializing');
						snapData = [];
						snapData.push(input.val());
					}
					console.log('Array before setting is ' + snapData);
					console.log('Setting location');
					db
						.collection('users')
						.doc(userID)
						.collection('history')
						.doc('locations')
						.set({
							location: snapData
						})
						.then(console.log('Updated location'));
				} else {
					console.log('Not logged in or no input');
				}
				findBuilding();
			});

		// Retrieves location from database
		function findBuilding() {
			db.collection('location').get().then((data) => {
				for (let i = 0; i < data.docs.length; i++) {
					// Changes all lower case letters into upper case for search entry
					if ($('#locationInput').val().toUpperCase() == data.docs[i].id) {
						db.collection('location').doc(data.docs[i].id).get().then((doc) => {
							let outlineRight = doc.data().right;
							let outlineLeft = doc.data().left;
							let outlineTop = doc.data().top;
							let outlineBottom = doc.data().bottom;
							let leftEdge = 2.25 * (bcitLeft - outlineLeft) / xWidth * 100;
							let topEdge = (bcitTop - outlineTop) / yHeight * 100;
							let rightEdge = 2.25 * ((bcitLeft - outlineRight) / xWidth * 100) - leftEdge;
							let bottomEdge = (bcitTop - outlineBottom) / yHeight * 100 - topEdge;
							console.log(leftEdge);
							console.log(rightEdge);
							//Building outline
							$('#buildingOutline').css({
								display: 'block',
								width: rightEdge + 'vw',
								height: bottomEdge + 'vh',
								transform: 'translate(' + leftEdge + 'vw, ' + topEdge + 'vh)'
							});
						});
					}
				}
			});
		}
	}
});

var bcitLeft = -123.004512;
// var bcitRight = -122.998273;
var bcitRight = -122.99;
var bcitTop = 49.254732;
// var bcitBottom = 49.24295;
var bcitBottom = 49.2432;

var xWidth = bcitLeft - bcitRight;
var yHeight = bcitTop - bcitBottom;

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retrieves current location
function getLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.watchPosition(showPosition);
	} else {
		document.getElementById('latlongdebug').innerHTML = 'No Geolocation :(';
	}
}

//Shows current location
function showPosition(position) {
	console.log('Updated Position');

	document.getElementById('latlongdebug').innerHTML =
		'Lat: ' + position.coords.latitude + '<br />Long: ' + position.coords.longitude;

	var relLat = bcitTop - position.coords.latitude;
	var relLong = bcitRight - position.coords.longitude;

	var latPercent = 1.1 * (relLat / xWidth * 100 * -1);
	var longPercent = relLat / yHeight * 100;

	document.getElementById('bcitsize').innerHTML = 'BCIT width: ' + xWidth + '<br />BCIT height: ' + yHeight;
	document.getElementById('relbcitloc').innerHTML = 'Relative width: ' + relLat + '<br />Relative height: ' + relLong;
	document.getElementById('relbcitlocpercent').innerHTML =
		'% width: ' + latPercent + '<br />% height: ' + longPercent;

	var pos = document.getElementById('locationDot');
	pos.style.transform = 'translate(' + latPercent + 'vw, ' + longPercent + 'vh)';
}

firebase.auth().onAuthStateChanged(function() {
	var user = firebase.auth().currentUser;
	// When user logs in, writes user name and email in Firestore
	if (user) {
		let userdb = db.collection('users');
		userID = user.uid;

		userdb.doc(user.uid).set({
			name: user.displayName,
			email: user.email
		});

		db.collection('users').doc(userID).get().then(function(doc) {
			document.getElementById('userName').innerHTML = doc.data().name;
		});
	} else {
		console.log('No user logged in');
	}
});
// Reads user current location stored in Firestore
getLocation();
