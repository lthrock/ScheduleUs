var googleapis = require('googleapis');
var OAuth2Client = googleapis.OAuth2Client;
var CLIENT_ID = "93833969413-qi1rveqpc52ut179c40dbdeba5a19k9q.apps.googleusercontent.com";
var CLIENT_SECRET = "_m1_ZRsGUeo-fb2AMdkltmv8";
var REDIRECT_URL = "http://localhost:3000/oauth2callback";

// 
function getObjects(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));
        } else if (i == key && obj[key] == val) {
            objects.push(obj);
        }
    }
    return objects;
}

function scheduler(masterSchedule, schedules, timeNeeded) {
	console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
	console.log(schedules);

	if (schedules.length == 0) return null;

	for (var i = 0; i < schedules.length; i++) {
		var schedule = schedules[i];
		masterSchedule = editMasterSchedule(masterSchedule, schedule, timeNeeded);
	}
	return masterSchedule;
}


function editMasterSchedule(masterSchedule, newSchedule, timeNeeded) {

	var combinedSchedule = new Array();

	// keeps track of where in each schedule we currently are.
	var masterScheduleIndex = 0;
	var newScheduleIndex = 0;

	for ( ; masterScheduleIndex < masterSchedule.length; masterScheduleIndex++) {
		var masterWindowStartTime = masterSchedule[masterScheduleIndex][0];
		var masterWindowEndTime = masterSchedule[masterScheduleIndex][1];
		

		for (var i = newScheduleIndex; i < newSchedule.length; i++) {
			var newWindowStartTime = newSchedule[i][0];
			var newWindowEndTime = newSchedule[i][1];

			// present for efficiency purposes to avoid unnecessary checks. 
			if (newWindowStartTime > masterWindowEndTime) break; // This means that no future windows will fit in this slot

			var newBlock = [0, 0];

			if (newWindowStartTime >= masterWindowStartTime && newWindowStartTime <= masterWindowEndTime) {
				newBlock = findOverlap(masterWindowStartTime, masterWindowEndTime, newWindowStartTime, newWindowEndTime);
			}
			else if (masterWindowStartTime >= newWindowStartTime && masterWindowStartTime <= newWindowEndTime) {
				newBlock = findOverlap(newWindowStartTime, newWindowEndTime, masterWindowStartTime, masterWindowEndTime);
			}

			if (newBlock[1] - newBlock[0] >= timeNeeded) {
				combinedSchedule.push(newBlock);
			}

			// present for efficiency purposes to avoid redundant checks. 
			if (newWindowEndTime < masterWindowEndTime) newScheduleIndex = i;
		}
	}
	return combinedSchedule;
}

function findOverlap(firstEventStart, firstEventEnd, secondEventStart, secondEventEnd) {
	var firstEndTime = (firstEventEnd < secondEventEnd) ? firstEventEnd : secondEventEnd;
	return [secondEventStart, firstEndTime];
}

/*
 * converts a single array of all events of the form [[start, end]]
 * in which start/end are of the form yy:mm:dd:hh:mm 
 * (year/month/day/hour/minute) into an array of different days, 
 * where each day is its own array containing all the free blocks 
 * of time.
 */
function convertToFreetime(calendar) {
	var times = new Array();
	var daysEvents = new Array();

	var currYear = "2000";
	var currMonth = "01";
	var currDay = "01";
	var hour, minute;

	var lastEnd = "00:00";

	for (var i = 0; i < calendar.length; i++) {
		var start = new Date(Date.parse(calendar[i][0]));
		var end = new Date(Date.parse(calendar[i][1]));

		var newYear = "" + start.getFullYear();
		var newMonth = start.getMonth() + 1;
		newMonth = (newMonth < 10) ? "0" + newMonth : "" + newMonth;
		var newDay = "" + start.getDate();
		newDay = (newDay < 10) ? "0" + newDay : "" + newDay;



		if (newDay == currDay && newMonth == currMonth && newYear == currYear) {
			times.push([ 
				new Date(Date.parse(currYear + "/" + currMonth + "/" + currDay + " " + lastEnd)), 
				new Date(Date.parse(currYear + "/" + currMonth + "/" + currDay + " " +start.getHours() + ":" + start.getMinutes()))
			]);

			if (start.getFullYear() == end.getFullYear() && start.getMonth() == end.getMonth() && start.getDate() == end.getDate()) {
				lastEnd = end.getHours() + ":" + end.getMinutes() + ":00 GMT-0800";
			} else {
				lastEnd = "23:59:59 GMT-0800"
			}
			
		} else {
			if (currYear != "2000") {
				times.push([ 
					new Date(Date.parse(currYear + "/" + currMonth + "/" + currDay + " " + lastEnd)), 
					new Date(Date.parse(currYear + "/" + currMonth + "/" + currDay + " " + "23:59:59 GMT-0800"))
				]);

				times.push([ 
					new Date(Date.parse(newYear + "/" + newMonth + "/" + newDay + " " + "00:00:00 GMT-0800")), 
					new Date(Date.parse(newYear + "/" + newMonth + "/" + newDay + " " + start.getHours() + ":" + start.getMinutes()))
				]);


			} else {
				times.push([ 
					new Date(Date.parse(newYear + "/" + newMonth + "/" + newDay + " " + lastEnd)), 
					new Date(Date.parse(newYear + "/" + newMonth + "/" + newDay + " " + start.getHours() + ":" + start.getMinutes()))
				]);

				
			}
			lastEnd = end.getHours() + ":" + end.getMinutes() + ":00 GMT-0800";
			currYear = newYear;
			currMonth = newMonth;
			currDay = newDay;
		}
	}

	times.push([ 
		new Date(Date.parse(currYear + "/" + currMonth + "/" + currDay + " " + lastEnd)), 
		new Date(Date.parse(currYear + "/" + currMonth + "/" + currDay + " " + "23:59:59 GMT-0800"))
	]);
	return times;
}

function createWeekMasterSchedule(morningAfternoonEvening, dayStart, dayEnd, startDate) {
	var masterSchedule = new Array();


	for (var i = 0; i < 6; i++) {
		var start = new Date(Date.parse(startDate));
		var nextDay = new Date(start.getTime() + i*(24 * 60 * 60 * 1000));
		var date = "" + nextDay.getFullYear() + "/" + (nextDay.getMonth()+1) + "/" + nextDay.getDate();

		if (morningAfternoonEvening[0] && morningAfternoonEvening[1] && morningAfternoonEvening[2]) {
			masterSchedule.push([
				new Date(Date.parse(date + " " + dayStart + " GMT-0800")),
				new Date(Date.parse(date + " " + dayEnd + " GMT-0800"))
			]);
		} else if (morningAfternoonEvening[0] && morningAfternoonEvening[1]) {
			masterSchedule.push([
				new Date(Date.parse(date + " " + dayStart + " GMT-0800")),
				new Date(Date.parse(date + " 17:00:00 GMT-0800"))

			]);
		} else if (morningAfternoonEvening[1] && morningAfternoonEvening[2]) {
			masterSchedule.push([
				new Date(Date.parse(date + " 12:00:00 GMT-0800")),
				new Date(Date.parse(date + " " + dayEnd + " GMT-0800"))
			]);
		} else {
			if (morningAfternoonEvening[0]) {
				masterSchedule.push([
					new Date(Date.parse(date + " " + dayStart + " GMT-0800")),
					new Date(Date.parse(date + " 12:00:00 GMT-0800"))
				]);
			}
			if (morningAfternoonEvening[1]) {
				masterSchedule.push([
					new Date(Date.parse(date + " 12:00:00 GMT-0800")),
					new Date(Date.parse(date + " 17:00:00 GMT-0800"))
				]);
			}
			if (morningAfternoonEvening[2]) {
				masterSchedule.push([
					new Date(Date.parse(date + " 17:00:00 GMT-0800")),
					new Date(Date.parse(date + " " + dayEnd + " GMT-0800"))
				]);
			}

		}
	}
	return masterSchedule;
}


// var calendar1 = [
// 			["2014-02-14 08:00:00 GMT-0800", "2014-02-14 10:30:00 GMT-0800"],
// 			["2014-02-14 12:00:00 GMT-0800", "2014-02-14 13:00:00 GMT-0800"],
// 			["2014-02-14 14:00:00 GMT-0800", "2014-02-14 16:00:00 GMT-0800"],
// 			["2014-02-14 17:00:00 GMT-0800", "2014-02-14 18:00:00 GMT-0800"],
// 			["2014-02-15 09:00:00 GMT-0800", "2014-02-15 09:30:00 GMT-0800"],
// 			["2014-02-15 12:00:00 GMT-0800", "2014-02-15 13:00:00 GMT-0800"],
// 			["2014-02-15 14:00:00 GMT-0800", "2014-02-15 14:30:00 GMT-0800"],
// 			["2014-02-15 15:00:00 GMT-0800", "2014-02-15 17:00:00 GMT-0800"],
// 		];

// var calendar2 = [
// 			["2014-02-14 08:00:00 GMT-0800", "2014-02-14 09:30:00 GMT-0800"],
// 			["2014-02-14 12:00:00 GMT-0800", "2014-02-14 13:00:00 GMT-0800"],
// 			["2014-02-14 14:00:00 GMT-0800", "2014-02-14 16:00:00 GMT-0800"],
// 			["2014-02-14 16:00:00 GMT-0800", "2014-02-14 17:00:00 GMT-0800"],
// 			["2014-02-15 09:00:00 GMT-0800", "2014-02-15 09:30:00 GMT-0800"],
// 			["2014-02-15 12:00:00 GMT-0800", "2014-02-15 13:00:00 GMT-0800"],
// 			["2014-02-15 14:00:00 GMT-0800", "2014-02-15 16:00:00 GMT-0800"],
// 			["2014-02-15 16:00:00 GMT-0800", "2014-02-15 17:00:00 GMT-0800"],
// 		];


// var freeCal1 = convertToFreetime(calendar1);
// var freeCal2 = convertToFreetime(calendar2);
// var masterSchedule = createWeekMasterSchedule([true, true, false], "09:00:00", "21:00:00", "2014-02-14 14:00:00 GMT-0800")

// var masterSchedule = scheduler(masterSchedule, [freeCal1, freeCal2], 30);
// console.log(masterSchedule);

var users = require("../users.json");

exports.createEvent = function(req, res){
  res.render('createEvent');
  /*console.log(users["users"]);
  console.log(users["events"]);*/
};

exports.viewEvents = function(req, res){
  res.render('viewEvents');
};

exports.editEvent = function(req, res){
  res.render('editEvent');
};

exports.addEvent = function(req, res){
	var organizer = req.session.current_user;
	var currUser;
	for (var user in users["users"]) {
		if (users["users"][user].email == req.session.current_user) {
			currUser = user;
		}
	}
	var eventName = req.query.name;
	var eventDuration = req.query.duration;
	var eventLocation = req.query.location;
	var morningAfternoonEvening = [];
	if (req.query.morning) {
		morningAfternoonEvening.push(true);
	} else {
		morningAfternoonEvening.push(false);
	}
	if (req.query.afternoon) {
		morningAfternoonEvening.push(true);
	} else {
		morningAfternoonEvening.push(false);
	}
	if (req.query.evening) {
		morningAfternoonEvening.push(true);
	} else {
		morningAfternoonEvening.push(false);
	}
	var guests = [];
	if (req.query.attendees != '')
		guests = req.query.attendees.split(", ");
	var guestsArray = [[organizer, true]];
	for (var i = 0; i < guests.length; i++) {
		guestsArray.push([guests[i], false]);
		var present = false;
		for (var user in users["users"]) {
			if (users["users"][user].email == guests[i]) {
				present = true;
				break;
			}
		}
		if (!present) {
			var newUser = {
	           "name": "",
	           "email": guests[i], 
	           "calendarID": -1,
	           "calendar": [],
	           "eventsToSchedule": [],
	           "eventsAwaitingConfirmation": [],
	           "pendingEvents": [],
	           "invites": [],
	           "dayStart": "10:00",
	           "dayEnd": "22:00"
	        };
	        users["users"].push(newUser);
		}
	}
	var id = Date.now();
	var newEvent = {
		"id": id,
		"organizer": req.session.current_user_name,
		"eventName": eventName,
		"eventDuration": eventDuration,
		"eventLocation": eventLocation,
		"timePeriod": morningAfternoonEvening,
		"guests": guestsArray,
		"time": ""
	}
	var calendarID = users["users"][currUser].calendarID;
	//var calendarID = currUser.calendarID;//req.session.calendar_id;
	// console.log("1 ", req.session.calendar_id, " 2 ", currUser.calendarID);
	//var calendarID = currUser.calendarID;
	var eventBody = createGCalendarJSON("2015-01-01", "2015-01-02", guests, req.session.current_user, 
		eventName, eventLocation, eventDuration);
	// console.log(eventBody.end);
	//var myClient = req.session.client;
	var myClient = req.app.get('client')
	var oauth2Client = require("../app").oauth2[req.session.current_user];
	// calendarID = req.session.calendar_id;
	var request = myClient.oauth2.userinfo.get();
	request.execute(function(err, results) {
	// 	console.log("errors");
	// 	console.log(err);
	// 	console.log(results);
	});
	var oauth2 = req.app.get('oauth');
	oauth2.userinfo.get().withAuthClient(oauth2Client).execute(function(err, results){
	//	console.log("try #2");
	//	console.log(err);
	//	console.log(results);
	});
	var blah = myClient.calendar.events.insert({'calendarId': calendarID, 'sendNotifications': true}, eventBody);
	blah.withAuthClient(oauth2Client).execute(function(err, results) {
		// console.log("wef5", blah);
      	    console.log("Create event ", err);
            //newEvent.gcalID = results.id
            //newEvent.gcalID = results.id;
            users["events"].push(newEvent);
        });	

	for (var guest in guests) {
		var currUser;
		for (var user in users["users"]) {
			// console.log(users["users"][user]);
			if (users["users"][user].email == guests[guest]) {
				currUser = user;
				break;
			}
		}
		users["users"][currUser].invites.push(id);
	}

	// console.log(users);
	res.render('confirm', {'isOrganizer': true, 'calendarID': calendarID, 
		'body': eventBody , 'event': newEvent});
};

exports.scheduleList = function(req, res){
	var currUser;
	for (var user in users["users"]) {
		if (users["users"][user].email == req.session.current_user) {
			currUser = user;
		}
	}
	// console.log(users["users"][currUser]);
	toSchedule = []
	for (var j in users.users[currUser].eventsAwaitingConfirmation) {
		for (var i in users["events"]) {
			// console.log(users["users"][user]);
			if (users["events"][i].id == users.users[currUser].eventsAwaitingConfirmation[j]) {
				toSchedule.push(users["events"][i]);
				break;
			}
		}
	}

  	res.render('readyToScheduleEvents', { 'toSchedule': toSchedule });
};

exports.invitations = function(req, res){
	var currUser;
	for (var user in users["users"]) {
		if (users["users"][user].email == req.session.current_user) {
			currUser = user;
		}
	}
	console.log("CURRENT USER IS " + req.session.current_user);
	invites = []
	for (var invite in users.users[currUser].invites) {
		for (var i in users["events"]) {
			if (users["events"][i].id == users.users[currUser].invites[invite]) {
				invites.push(users["events"][i]);
				break;
			}
		}
	}

	console.log(invites);
    res.render('invitations', { 'invites': invites });
};

exports.confirmEvent = function(req, res){
	var id = req.params.id;
	var currUser;
	for (var user in users["users"]) {
		if (users["users"][user].email == req.session.current_user) {
			currUser = user;
		}
	}
	var currEvent;
	for (var i in users["events"]) {
		// console.log(users["events"][i].id);
		// console.log(id);
		if (users["events"][i].id == id) {
			currEvent = i;
		}
	}
	var index = users.users[currUser].invites.indexOf(id);
	users.users[currUser].invites.splice(index, 1);
	var attendees = users.events[currEvent].guests;
	for (var i in attendees){
		if (attendees[i][0] == req.session.current_user)
			users.events[currEvent].guests[i][1] = true;
	}
	// console.log(users.events[currEvent].guests);
	var readyToSchedule = true;
	for (var i in attendees){
		// console.log(attendees[i][1]);
		if (!attendees[i][1]) {
			readyToSchedule = false;
			break;
		}
	}
	if (readyToSchedule) {
		var organizer = users.events[currEvent].guests[0][0];
		for (var user in users["users"]) {
			if (users["users"][user].email == organizer) {
				console.log(users["users"][user]);
				users["users"][user].eventsAwaitingConfirmation.push(id);
				break;
			}
		}
	}
	res.render('confirm', {'isOrganizer': false});
};


// exports.scheduleEvent = function(req, res) {
// 	var id = req.params.id;
// 	var eventToSchedule;
// 	for (var ev in users["events"]) {
// 		if (users["events"][ev].id == id) { // ? 
// 			eventToSchedule = users["events"][ev];
// 			break;
// 		}
// 	}

// 	var guests = eventToSchedule.guests
	
// 	var calendars = new Array();
// 	var organizer = eventToSchedule.guests[0];


// 	for (var user in users["users"]) {
// 		console.log("hubbubbub: " + users["users"][user].email);
// 		console.log("organizer: " + organizer);;
// 		if (users["users"][user].email == organizer) {
// 			organizer = users["users"][user];
// 			calendars.push(organizer.calendar);
// 		}
// 		for (var i = 0; i < guests.length; i++) {
// 			if (guests[i].email == users["users"][user].email) {
// 				calendars.push(guests[i].calendar);
// 			}
// 		}
// 	}

// 	console.log("organizer: " + organizer);
// 	console.log("organizer email: " + organizer.email);

// 	var timePeriods = eventToSchedule.timePeriod;
// 	// var start = organizer.dayStart;
// 	// var end = organizer.dayEnd;

// 	console.log("timePeriods: " + timePeriods);
// 	console.log("start: " + start);
// 	console.log("end: " + end);
// 	console.log("current: " + new Date());

// 	var masterSchedule = createWeekMasterSchedule(timePeriods, start, end, new Date());
	
// 	console.log("pre scheduler: " + masterSchedule);

// 	masterSchedule = scheduler(masterSchedule, calendars, eventToSchedule.eventDuration);

// 	console.log("post scheduler: " + masterSchedule);

// 	// now just needs to select three time periods from the master schedule,
// 	// make them the requested duration (only use the start period of the period)
// 	// and then use the start, start+ duration, and date of each of these three.
// 	var numEvents = 0;
// 	var eventsToShow = new Array();

// 	console.log(masterSchedule);

// 	while (masterSchedule.length > 0 && numEvents < 3) {
// 		var newEvent = masterSchedule.shift();
// 		var periodStart = new Date(Date.parse(newEvent[0]));
// 		var periodEnd = new Date(Date.parse(newEvent[1]));


// 		var eventStart = "" + (periodStart.getHours() % 12) + ":" + periodStart.getMinutes() + " " + ((newEndTime / 12 >= 1) ? "PM" : "AM");
// 		var newEndTime = new Date(periodStart + (eventToSchedule.eventDuration*60000*60));
// 		var eventEnd = "" + (newEndTime.getHours() % 12) + ":" + newEndTime.getMinutes() + " " + ((newEndTime / 12 >= 1) ? "PM" : "AM");

// 		if (periodStart.getHours() - periodEnd.getHours() > eventToSchedule.eventDuration * 2) {
// 			masterSchedule.push([new Date(periodStart + (eventToSchedule.eventDuration*60000*60)), periodEnd]);
// 		}
		
// 		var date = "" + (periodStart.getMonth()() + 1) + "/" + periodStart.getDate() + "/" + period.getFullYear();
		
// 		eventsToShow.add([eventStart, eventEnd, date]);
// 	}
// }


exports.scheduleEvent = function(req, res){
	var id = req.params.id;
	var currUser = users["users"][req.session.current_user_id];
	//var currEvent = getObjects(users["events"], 'id', id);
	var attendees = getObjects(users["events"], 'id', id)[0].guests;
	var internal_counter = 0;
	listSchedules = []
	var toRender = function() {
		if (++internal_counter == attendees.length) {
			console.log(listSchedules);
			res.render('schedule', { "id": id });
		}
	}

	var myClient = req.app.get('client');
	var today = new Date();
    var nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate()+7);
	for (var i in attendees){
		(function(i) {
			var currSchedule = []
			var user = getObjects(users["users"], 'email', attendees[i][0])[0];
			var currCalendar = {
			    calendarId: user.email, 
			    timeMin: today.toISOString(), 
			    timeMax: nextWeek.toISOString(),
			    singleEvents: true,
			    orderBy: "startTime"
			}
			var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
			oauth2Client.credentials = user.tokens;
			myClient.calendar.events.list(currCalendar).withAuthClient(oauth2Client).execute(function(err, results) {
				// console.log("Calendar ", currCalendar.calendarId, "The tokens we used here were ", oauth2Client.credentials);
				console.log("Errors are ", err);
				if (results != undefined) {
					for (var item = 0; item < results.items.length; item++) {
						// console.log(results.items[item]);
						if (results.items[item]["status"] != "confirmed") continue;
						if (results.items[item].start.dateTime != undefined && results.items[item].end.dateTime != undefined) {
							currSchedule.push([results.items[item].start.dateTime, results.items[item].end.dateTime]);
						} else if (results.items[item].start.date != undefined && results.items[item].end.date != undefined) {
							currSchedule.push([results.items[item].start.date, results.items[item].end.date]);
						}
					}
					// console.log(attendees[i][0], "currSchedule is ", currSchedule)
					listSchedules.push(currSchedule);
				}
				toRender();
			});
		})(i);	
	} 

	var eventToSchedule;
	for (var ev in users["events"]) {
		if (users["events"][ev].id == id) { // ? 
			eventToSchedule = users["events"][ev];
			break;
		}
	}

	var guests = eventToSchedule.guests
	

	var organizer = eventToSchedule.guests[0];




// 	console.log("organizer: " + organizer);
// 	console.log("organizer email: " + organizer.email);

	var timePeriods = eventToSchedule.timePeriod;
	var start = organizer.dayStart;
	var end = organizer.dayEnd;

	if (start == undefined) {
		start = "10:00:00";
	}
	if (end == undefined) {
		end = "20:00:00";
	}

	console.log("timePeriods: " + timePeriods);
	console.log("start: " + start);
	console.log("end: " + end);
	console.log("current: " + new Date());

	var masterSchedule = createWeekMasterSchedule(timePeriods, start, end, today);
	
	console.log("pre scheduler: " + masterSchedule);

	masterSchedule = scheduler(masterSchedule, listSchedules, eventToSchedule.eventDuration);

// 	console.log("post scheduler: " + masterSchedule);

// 	// now just needs to select three time periods from the master schedule,
// 	// make them the requested duration (only use the start period of the period)
// 	// and then use the start, start+ duration, and date of each of these three.
	var numEvents = 0;
	var eventsToShow = new Array();

// 	console.log(masterSchedule);

	while (masterSchedule.length > 0 && numEvents < 3) {
		var newEvent = masterSchedule.shift();
		var periodStart = new Date(Date.parse(newEvent[0]));
		var periodEnd = new Date(Date.parse(newEvent[1]));


		var eventStart = "" + (periodStart.getHours() % 12) + ":" + periodStart.getMinutes() + " " + ((newEndTime / 12 >= 1) ? "PM" : "AM");
		var newEndTime = new Date(periodStart + (eventToSchedule.eventDuration*60000*60));
		var eventEnd = "" + (newEndTime.getHours() % 12) + ":" + newEndTime.getMinutes() + " " + ((newEndTime / 12 >= 1) ? "PM" : "AM");

		if (periodStart.getHours() - periodEnd.getHours() > eventToSchedule.eventDuration * 2) {
			masterSchedule.push([new Date(periodStart + (eventToSchedule.eventDuration*60000*60)), periodEnd]);
		}
		
		var date = "" + (periodStart.getMonth()() + 1) + "/" + periodStart.getDate() + "/" + period.getFullYear();
		
		eventsToShow.add([eventStart, eventEnd, date]);
	}

	console.log("Awesome stuff: ");
	console.log(masterSchedule);

};

exports.selectTime = function(req, res) {
	var id = req.params.id;
	for (var user in users["users"]) {
		if (users["users"][user].email == req.session.current_user) {
			var currUser = user;
		}
	}
	var index = users["users"][currUser].eventsAwaitingConfirmation.indexOf(id);
	users["users"][currUser].eventsAwaitingConfirmation.splice(index, 1);
	res.render('confirm', { 'isScheduled': true });
};

function createGCalendarJSON(start, end, attendees, creator, summary, location, duration) {
	var listAttendees = []
	for (var attendee in attendees) {
		listAttendees.push({
			"email": attendees[attendee]
		})
	}
	var today = new Date();
    var nextweek = new Date(today.getFullYear(), today.getMonth(), today.getDate()+7);
    var description = "Duration: " + duration + " hours." + "Go to http://scheduleus.herokuapp.com to RSVP!" 
	return {
		"end": { "date": nextweek.yyyymmdd() },
		"start": { "date": today.yyyymmdd() },
		"attendees": listAttendees,
		"creator": creator,
		"summary": summary,
		"location": location,
		"description": description,
		"status": "tentative",
		"guestsCanInviteOthers": false
	}
};

Date.prototype.yyyymmdd = function() {                                         
    var yyyy = this.getFullYear().toString();                                    
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based         
    var dd  = this.getDate().toString();             
                            
    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
};  
