// var time = require('time');
// var a = new time.Date(1337324400000);
// a.setTimezone('Europe/Amsterdam');
process.env.TZ = 'America/Los_Angeles'


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
	timeNeeded *= (60*60*1000);

	// console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
	// console.log("duration: " + timeNeeded);

	if (schedules.length == 0) return null;

	for (var i = 0; i < schedules.length; i++) {
		var schedule = schedules[i];
		masterSchedule = editMasterSchedule(masterSchedule, schedule, timeNeeded);
		// console.log("i th masterSched: " + masterSchedule);
	}
	return masterSchedule;
}


function editMasterSchedule(masterSchedule, newSchedule, timeNeeded) {
	// console.log("oldMaster: " + masterSchedule + "////");
	// console.log("newSched: " + newSchedule + "////");

	;

	var combinedSchedule = new Array();

	// keeps track of where in each schedule we currently are.
	var masterScheduleIndex = 0;
	var newScheduleIndex = 0;

	for ( ; masterScheduleIndex < masterSchedule.length; masterScheduleIndex++) {
		var masterWindowStartTime = masterSchedule[masterScheduleIndex][0];
		var masterWindowEndTime = masterSchedule[masterScheduleIndex][1];
		

		for (var i = newScheduleIndex; i < newSchedule.length; i++) {
			var newWindowStartTime = new Date(Date.parse(newSchedule[i][0]));
			var newWindowEndTime = new Date(Date.parse(newSchedule[i][1]));

			// present for efficiency purposes to avoid unnecessary checks. 
			if (newWindowStartTime > masterWindowEndTime) break; // This means that no future windows will fit in this slot

			var newBlock = [0, 0];



			if (newWindowStartTime >= masterWindowStartTime && newWindowStartTime <= masterWindowEndTime) {
				newBlock = findOverlap(masterWindowStartTime, masterWindowEndTime, newWindowStartTime, newWindowEndTime);
			}
			else if (masterWindowStartTime >= newWindowStartTime && masterWindowStartTime <= newWindowEndTime) {
				newBlock = findOverlap(newWindowStartTime, newWindowEndTime, masterWindowStartTime, masterWindowEndTime);
			}

			// console.log("Duration: " + ((newBlock[1] - newBlock[0])/(60*60*1000)));
			// console.log("Start: " + newBlock[1]);
			// console.log("End: " + newBlock[0]);
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



function getNextDay(date) {
	var newDate = new Date();
	newDate.setTime((new Date(Date.parse(date)).getTime() + (24*60*60*1000))); 
	return newDate;
	// month = (month < 10) ? "0" + month : "" + month;
	// date = (date < 10) ? "0" + date : "" + date;
}


function convertToFreetime(calendar) {
	var times = new Array();
	var daysEvents = new Array();

	var today = new Date();
	// console.log("after initialization: " + today);
	// today = new Date(today.getFullYear + "/" + today.getMonth + "/" + today.getDate + " 00:00:00 GMT-0800");
	// console.log("after slight modification: " + today);

	var currYear = today.getFullYear();

	var currMonth = today.getMonth() + 1;
	var currDay = today.getDate();
	var justStarted = true;

	

	var hour, minute;
	var lastEnd = "00:00";

	var endingDate = today;

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
			var nextDate = getNextDay(currYear + "/" + currMonth + "/" + currDay + " " + lastEnd);
			var nextYear = "" + nextDate.getFullYear();
			var nextMonth = "" + (nextDate.getMonth() + 1);
			// nextMonth = (newMonth < 10) ? "0" + newMonth : "" + newMonth;
			var nextDay = "" + nextDate.getDate();
			nextDay = (nextDay < 10) ? "0" + nextDay : "" + nextDay;

			// if a day was skipped...
			while (parseInt(nextDay) != parseInt(newDay) || parseInt(nextMonth) != parseInt(newMonth) || parseInt(nextYear) != parseInt(newYear)) {
				times.push([ 
					new Date(Date.parse(nextYear + "/" + nextMonth + "/" + nextDay + " " + "00:00:00 GMT-0800")), 
					new Date(Date.parse(nextYear + "/" + nextMonth + "/" + nextDay + " " + "23:59:59 GMT-0800"))
				]);
				nextDate = getNextDay(nextDate);
				nextYear = "" + nextDate.getFullYear();
				nextMonth = nextDate.getMonth() + 1;
				nextMonth = (newMonth < 10) ? "0" + newMonth : "" + newMonth;
				nextDay = "" + nextDate.getDate();
				nextDay = (nextDay < 10) ? "0" + nextDay : "" + nextDay;
			}
			
			if (!justStarted) {
				// var nextDate = getNextDay(currYear + "/" + currMonth + "/" + currDay + " " + lastEnd);
				// var nextYear = "" + nextDate.getFullYear();
				// var nextMonth = "" + (nextDate.getMonth() + 1);
				// // nextMonth = (newMonth < 10) ? "0" + newMonth : "" + newMonth;
				// var nextDay = "" + nextDate.getDate();
				// nextDay = (nextDay < 10) ? "0" + nextDay : "" + nextDay;

				// // if a day was skipped...
				// while (parseInt(nextDay) != parseInt(newDay) || parseInt(nextMonth) != parseInt(newMonth) || parseInt(nextYear) != parseInt(newYear)) {
				// 	times.push([ 
				// 		new Date(Date.parse(nextYear + "/" + nextMonth + "/" + nextDay + " " + "00:00:00 GMT-0800")), 
				// 		new Date(Date.parse(nextYear + "/" + nextMonth + "/" + nextDay + " " + "23:59:59 GMT-0800"))
				// 	]);
				// 	nextDate = getNextDay(nextDate);
				// 	nextYear = "" + nextDate.getFullYear();
				// 	nextMonth = nextDate.getMonth() + 1;
				// 	nextMonth = (newMonth < 10) ? "0" + newMonth : "" + newMonth;
				// 	nextDay = "" + nextDate.getDate();
				// 	nextDay = (nextDay < 10) ? "0" + nextDay : "" + nextDay;
				// }



				times.push([ 
					new Date(Date.parse(currYear + "/" + currMonth + "/" + currDay + " " + lastEnd)), 
					new Date(Date.parse(currYear + "/" + currMonth + "/" + currDay + " " + "23:59:59 GMT-0800"))
				]);

				times.push([ 
					new Date(Date.parse(newYear + "/" + newMonth + "/" + newDay + " " + "00:00:00 GMT-0800")), 
					new Date(Date.parse(newYear + "/" + newMonth + "/" + newDay + " " + start.getHours() + ":" + start.getMinutes()))
				]);


			} else {
				justStarted = false;
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

		if (i == calendar.length-1) {
			endingDate = new Date(Date.parse(currYear + "/" + currMonth + "/" + currDay + " 00:00:00 GMT-0800"));
		}
	}

	if (calendar.length != 0) {
		times.push([ 
			new Date(Date.parse(currYear + "/" + currMonth + "/" + currDay + " " + lastEnd)), 
			new Date(Date.parse(currYear + "/" + currMonth + "/" + currDay + " " + "23:59:59 GMT-0800"))
		]);
	}	


	// console.log("when i need it: " + today);
	var weekFromNow = new Date(today);
	for (var i = 0; i < 6; i++) {
		weekFromNow = new Date(Date.parse(getNextDay(weekFromNow)));
	}
	

	// console.log("actual end: " + weekFromNow.toDateString());
	// console.log("last scheduled: " + endingDate.toDateString());
	endingDate.setHours(23);
	endingDate.setMinutes(59);
	endingDate.setSeconds(59);
	endingDate.setMilliseconds(999);
	while (+weekFromNow > +endingDate) {//calendar.length == 0) {
		// console.log("actual end: " + weekFromNow.toDateString())
		// console.log("last scheduled: " + endingDate.toDateString());
		var startSuffix = "00:00:00 GMT-0800"
		var endSuffix = "23:59:59 GMT-0800"
		
		times.push([ 
			new Date(Date.parse(currYear + "/" + currMonth + "/" + currDay + " " + startSuffix)), 
			new Date(Date.parse(currYear + "/" + currMonth + "/" + currDay + " " + endSuffix))
		]);

		endingDate = new Date(Date.parse(getNextDay(endingDate)));
	}

	// console.log("returning: " + times);
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


module.exports = {
	createEvent: createEvent,
	editEvent: editEvent,
	deleteEvent: deleteEvent,
	saveEvent: saveEvent,
	addEvent: addEvent,
	confirmEvent: confirmEvent,
	rejectEvent: rejectEvent,
	scheduleEvent: scheduleEvent,
	selectTime: selectTime,
	viewEvents: view
}

// exports.createEvent = function(req, res){
function createEvent(req, res) {
  res.render('createEvent');
  console.log(users["users"]);
  console.log(users["events"]);
};

// exports.editEvent = function(req, res){
function editEvent(req, res) {
	var id = req.params.id;
	var currEvent;
	for (var i in users["events"]) {
		if (users["events"][i].id == id) {
			currEvent = i;
		}
	}
	var guests = "";
	for (var guest in users["events"][currEvent].guests) {
		if (guest != 0) {
			guests += users["events"][currEvent].guests[guest][0] + ", "; 
		}
	}
	guests = guests.substring(0, guests.length - 2);
	console.log(guests);
	var morning = users["events"][currEvent].timePeriod[0];
	var afternoon = users["events"][currEvent].timePeriod[1];
	var evening = users["events"][currEvent].timePeriod[2];
	var duration = (users["events"][currEvent].eventDuration + "").split(".");
	var hours = parseInt(duration[0]);
	if (duration[1]) {
		var mins = parseFloat("0." + duration[1]) * 60;
	}
	if (mins == 0) var first = true;
	if (mins == 15) var second = true;
	if (mins == 30) var third = true;
	if (mins == 45) var fourth = true;
	var populatedFields = {
		"id": id,
		"eventName": users["events"][currEvent].eventName,
		"eventHrs": hours,
		"first": first,
		"second": second,
		"third": third,
		"fourth": fourth,
		"eventLocation": users["events"][currEvent].eventLocation,
		"morning": morning,
		"afternoon": afternoon, 
		"evening": evening,
		"guests": guests
	}
  	res.render('editEvent', populatedFields);
};

function saveEvent(req, res) {
	var id = req.params.id;

	var organizer = req.session.current_user;
	var currUser;
	for (var user in users["users"]) {
		if (users["users"][user].email == req.session.current_user) {
			currUser = user;
		}
	}
	var currEvent;
	for (var i in users["events"]) {
		if (users["events"][i].id == id) {
			currEvent = i;
		}
	}
	var guests = users["events"][currEvent].guests;
	for (var i in guests) {
		if (i == 0) {
			var inside = false;
			var index;
			for (var ev in users["users"][currUser].eventsToSchedule) {
				if (users["users"][currUser].eventsToSchedule[ev] == id) {
					index = ev;
					inside = true;
				}
			}
			if (inside) users["users"][currUser].eventsToSchedule.splice(index, 1);
			else {
				for (var ev in users["users"][currUser].eventsAwaitingConfirmation) {
					if (users["users"][currUser].eventsAwaitingConfirmation[ev] == id)
						index = ev;
				}
				users["users"][currUser].eventsAwaitingConfirmation.splice(index, 1);
			}
		} else {
			for (var user in users["users"]) {
				if (guests[i][0] == users["users"][user].email) {
					var inside = false;
					var index;
					for (var ev in users["users"][user].invites) {
						if (users["users"][user].invites[ev] == id) {
							index = ev;
							inside = true;
						}
					}
					if (inside) users["users"][user].invites.splice(index, 1);
					else {
						for (var ev in users["users"][user].pendingEvents) {
							if (users["users"][user].pendingEvents[ev] == id)
								index = ev;
						}
						users["users"][user].pendingEvents.splice(index, 1);
					}
				}
			}
		}
	}

	users["events"].splice(currEvent, 1);
	req.query["edit"] = true;
	addEvent(req, res);
};

function deleteEvent(req, res) {
	var id = req.params.id;
	var organizer = req.session.current_user;
	var currUser;
	for (var user in users["users"]) {
		if (users["users"][user].email == req.session.current_user) {
			currUser = user;
		}
	}
	var currEvent;
	for (var i in users["events"]) {
		if (users["events"][i].id == id) {
			currEvent = i;
		}
	}

	var calendarID = users["users"][currUser].calendarID;
	var gCalID = users["events"][currEvent].gCalID;
	var myClient = req.app.get('client');
	var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
	oauth2Client.credentials = users["users"][currUser].tokens;

	var guests = users["events"][currEvent].guests;
	for (var i in guests) {
		if (i == 0) {
			var blah = myClient.calendar.events.delete({'calendarId': calendarID, 'eventId': gCalID, 'sendNotifications': true});
			blah.withAuthClient(oauth2Client).execute(function(err, results) {
			});
			var inside = false;
			var index;
			for (var ev in users["users"][currUser].eventsToSchedule) {
				if (users["users"][currUser].eventsToSchedule[ev] == id) {
					index = ev;
					inside = true;
				}
			}
			if (inside) users["users"][currUser].eventsToSchedule.splice(index, 1);
			else {
				for (var ev in users["users"][currUser].eventsAwaitingConfirmation) {
					if (users["users"][currUser].eventsAwaitingConfirmation[ev] == id)
						index = ev;
				}
				users["users"][currUser].eventsAwaitingConfirmation.splice(index, 1);
			}
		} else {
			for (var user in users["users"]) {
				if (guests[i][0] == users["users"][user].email) {
					var inside = false;
					var index;
					for (var ev in users["users"][user].invites) {
						if (users["users"][user].invites[ev] == id) {
							index = ev;
							inside = true;
						}
					}
					if (inside) users["users"][user].invites.splice(index, 1);
					else {
						for (var ev in users["users"][user].pendingEvents) {
							if (users["users"][user].pendingEvents[ev] == id)
								index = ev;
						}
						users["users"][user].pendingEvents.splice(index, 1);
					}
				}
			}
		}
	}

	users["events"].splice(currEvent, 1);
  	view(req, res);
};

// exports.addEvent = function(req, res){
function addEvent(req, res) {
	var organizer = req.session.current_user;
	var currUser;
	for (var user in users["users"]) {
		if (users["users"][user].email == req.session.current_user) {
			currUser = user;
		}
	}
	var eventName = req.query.name;
	var eventDuration = parseInt(req.query.hrs) + parseFloat(req.query.mins)/60;
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
		guests = req.query.attendees.split(",");
	var guestsArray = [[organizer, true]];
	console.log(guests);
	for (var i = 0; i < guests.length; i++) {
		guestsArray.push([guests[i].trim(), false]);
		console.log(guestsArray);
		console.log(guests[i].trim());
		var present = false;
		for (var user in users["users"]) {
			if (users["users"][user].email == guests[i].trim()) {
				present = true;
				break;
			}
		}
		if (!present) {
			var newUser = {
	           "name": "",
	           "email": guests[i].trim(), 
	           "calendarID": -1,
	           "calendar": [],
	           "eventsToSchedule": [],
	           "eventsAwaitingConfirmation": [],
	           "pendingEvents": [],
	           "invites": [],
	           "historicEvents": [],
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
	// var calendarID = currUser.calendarID;//req.session.calendar_id;
	// console.log("1 ", req.session.calendar_id, " 2 ", currUser.calendarID);
	// var calendarID = currUser.calendarID;
	var eventBody = createGCalendarJSON(guests, req.session.current_user, 
		eventName, eventLocation, eventDuration);
	// console.log(eventBody.end);
	//var myClient = req.session.client;
	// var myClient = req.app.get('client')
	// var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
	// var oauth2Client = require("../app").oauth2[req.session.current_user];
	// oauth2Client.credentials = users["users"][currUser].tokens;
	// var request = myClient.oauth2.userinfo.get();
	// request.execute(function(err, results) {
	// 	console.log("errors");
	// 	console.log(err);
	// 	console.log(results);
	// });
	// var oauth2 = req.app.get('oauth');
	// oauth2.userinfo.get().withAuthClient(oauth2Client).execute(function(err, results){
	//	console.log("try #2");
	//	console.log(err);
	//	console.log(results);
	// });
	// var blah = myClient.calendar.events.insert({'calendarId': calendarID, 'sendNotifications': false}, eventBody);
	// blah.withAuthClient(oauth2Client).execute(function(err, results) {
		// console.log("wef5", blah);
      	    // console.log("Create event ", err);
            //newEvent.gcalID = results.id
            //newEvent.gcalID = results.id;
            
        // });	
	users["events"].push(newEvent);
	users["users"][currUser].eventsAwaitingConfirmation.push(id);
	for (var guest in guests) {
		var currUser;
		for (var user in users["users"]) {
			// console.log(users["users"][user]);
			if (users["users"][user].email == guests[guest].trim()) {
				currUser = user;
				break;
			}
			res.render('confirm');
        });	


	// console.log(users);
	// res.render('confirm', {'isOrganizer': true, 'calendarID': calendarID, 
	// 	'body': eventBody , 'event': newEvent});
	// res.render('confirm', {'isOrganizer': true});
	res.render('confirm', {'isEdit': req.query.edit});
};

// function view1(req, res) {
// 	view(req, res, true);
// }

// exports.viewEvents = function(req, res){
function view(req, res, original) {
	var currUser;
	for (var user in users["users"]) {
		if (users["users"][user].email == req.session.current_user) {
			currUser = user;
		}
	}
	console.log("CURRENT USER IS " + req.session.current_user);
	var invites = [];
	for (var invite in users["users"][currUser].invites) {
		for (var i in users["events"]) {
			if (users["events"][i].id == users["users"][currUser].invites[invite]) {
				invites.push(users["events"][i]);
				break;
			}
		}
	}

	var toSchedule = [];
	for (var j in users["users"][currUser].eventsToSchedule) {
		for (var i in users["events"]) {
			// console.log(users["users"][user]);
			if (users["events"][i].id == users["users"][currUser].eventsToSchedule[j]) {
				toSchedule.push(users["events"][i]);
				break;
			}
		}
	}

	var awaitingConfirmation = [];
	for (var j in users["users"][currUser].eventsAwaitingConfirmation) {
		for (var i in users["events"]) {
			// console.log(users["users"][user]);
			if (users["events"][i].id == users["users"][currUser].eventsAwaitingConfirmation[j]) {
				awaitingConfirmation.push(users["events"][i]);
				break;
			}
		}
	}

  	var pending = [];
	for (var j in users["users"][currUser].pendingEvents) {
		for (var i in users["events"]) {
			// console.log(users["users"][user]);
			if (users["events"][i].id == users["users"][currUser].pendingEvents[j]) {
				pending.push(users["events"][i]);
				break;
			}
		}
	}

	var history = [];
	for (var j in users["users"][currUser].historicEvents) {
		for (var i in users["events"]) {
			// console.log(users["users"][user]);
			if (users["events"][i].id == users["users"][currUser].historicEvents[j]) {
				history.push(users["events"][i]);
				break;
			}
		}
	}
	// console.log(invites);
	// console.log(pending);
	console.log(req.session.drawers);
	if (req.session.drawers) {
		res.render('viewEvents', { 'invites': invites, 'toSchedule': toSchedule, 'awaitingConfirmation': awaitingConfirmation, 'pending': pending, 'history': history });	
	} else {
		res.render('viewEvents2', { 'invites': invites, 'toSchedule': toSchedule, 'awaitingConfirmation': awaitingConfirmation, 'pending': pending, 'history': history });
	}
};

// exports.confirmEvent = function(req, res){
function confirmEvent(req, res) {
	var id = req.params.id;
	// console.log(id);
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
	// console.log("id: " + id);
	// console.log("currUser " + currUser);
	// console.log("currEvent " + currEvent);
	// var invites = users["users"][currUser].invites;
	// var index = invites.indexOf(id);
	// console.log(invites);
	var index;
	for (var ev in users["users"][currUser].invites) {
		if (users["users"][currUser].invites[ev] == id)
			index = ev;
	}
	// console.log(index);
	users["users"][currUser].invites.splice(index, 1);
	users["users"][currUser].pendingEvents.push(id);
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
				var calendarID = users["users"][user].calendarID;
				var gCalID = users["events"][currEvent].gCalID;
				var myClient = req.app.get('client');
				var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
				oauth2Client.credentials = users["users"][user].tokens;

	var guests = users["events"][currEvent].guests;
	for (var i in guests) {
		if (i == 0) {
			var blah = myClient.calendar.events.delete({'calendarId': calendarID, 'eventId': gCalID, 'sendNotifications': true});
			blah.withAuthClient(oauth2Client).execute(function(err, results) {
			});

				// console.log(users["users"][user]);
				// var pos = users["users"][user].eventsAwaitingConfirmation.indexOf(id);
				var pos;
				for (var ev in users["users"][user].eventsAwaitingConfirmation) {
					if (users["users"][user].eventsAwaitingConfirmation[ev] == id)
						pos = ev;
				}
				users["users"][user].eventsAwaitingConfirmation.splice(pos, 1);
				users["users"][user].eventsToSchedule.push(id);
				break;
			}
		}
	}
	// res.render('viewEvents');
	// $.get("/view/#tentaive");
	view(req, res);
};

function rejectEvent(req, res) {
	var id = req.params.id;
	var currUser;
	for (var user in users["users"]) {
		if (users["users"][user].email == req.session.current_user) {
			currUser = user;
		}
	}
	var currEvent;
	for (var i in users["events"]) {
		if (users["events"][i].id == id) {
			currEvent = i;
		}
	}
	// var index = users["users"][currUser].invites.indexOf(id);
	var index;
	for (var ev in users["users"][currUser].invites) {
		if (users["users"][currUser].invites[ev] == id)
			index = ev;
	}
	users["users"][currUser].invites.splice(index, 1);
	users["users"][currUser].historicEvents.push(id);
	var attendees = users.events[currEvent].guests;
	for (var i in attendees){
		if (i != 0) {
			if (attendees[i][0] == req.session.current_user)
				index = i;
		}
	}
	users.events[currEvent].guests.splice(index, 1);
	if (users.events[currEvent].guests.length == 1) {
		// console.log("IN HERE");
		var organizer = users.events[currEvent].guests[0][0];
		for (var user in users["users"]) {
			if (users["users"][user].email == organizer) {
				// var pos = users["users"][user].eventsAwaitingConfirmation.indexOf(id);
				var pos;
				for (var ev in users["users"][user].eventsAwaitingConfirmation) {
					if (users["users"][user].eventsAwaitingConfirmation[ev] == id)
						pos = ev;
				}
				users["users"][user].eventsAwaitingConfirmation.splice(pos, 1);
				users["users"][user].historicEvents.push(id);
				break;
			}
		}
	}
	view(req, res);
};

Date.prototype.addHours = function(h) {   
	this.setTime(this.getTime() + (h*60*60*1000)); 
	return this;   
}


// exports.scheduleEvent = function(req, res){
function scheduleEvent(req, res) {
	var id = req.params.id;
	var currUser = users["users"][req.session.current_user_id];
	//var currEvent = getObjects(users["events"], 'id', id);
	var attendees = getObjects(users["events"], 'id', id)[0].guests;
	var internal_counter = 0;
	listSchedules = []

	var toDateObject = function(time) { // toDateObject(results.items[item].start.date)
		// console.log(time);           // '2014-02-20T13:00:00-08:00', '2014-02-20T14:00:00-08:00'
		var indexOfT = time.indexOf('T');
		var newDate = time.substring(0, indexOfT) + " " + time.substring(indexOfT+1, indexOfT+9);
		newDate += (" GMT" + time.substring(indexOfT+9)); // GMT-0800"
		// console.log(newDate);
		return newDate;
	}

	var toRender = function() {
		if (++internal_counter == attendees.length) {
			var eventsToShow = getTimes();
			// console.log(listSchedules);
			var events = [];
			for (var item in eventsToShow) {
				eventsToShow[item][2] = eventsToShow[item][2].replace("/", "-");
				eventsToShow[item][2] = eventsToShow[item][2].replace("/", "-");
				events.push({
					"id": id,
					"time": eventsToShow[item]
				});
			}
			res.render('schedule', { "events": events });
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
							currSchedule.push([toDateObject(results.items[item].start.dateTime), toDateObject(results.items[item].end.dateTime)]);
						} else if (results.items[item].start.date != undefined && results.items[item].end.date != undefined) {
							currSchedule.push([toDateObject(results.items[item].start.date), toDateObject(results.items[item].end.date)]);
						}
					}
					// console.log(attendees[i][0], "currSchedule is ", currSchedule)
					listSchedules.push(currSchedule);
				}
				toRender();
			});
		})(i);	
	} 

	var getTimes = function() {
		var eventToSchedule;
		for (var ev in users["events"]) {
			if (users["events"][ev].id == id) { // ? 
				eventToSchedule = users["events"][ev];
				break;
			}
		}

		var guests = eventToSchedule.guests
		var organizer = eventToSchedule.guests[0];

		// console.log("organizer: " + organizer);

		var timePeriods = eventToSchedule.timePeriod;
		var start = organizer.dayStart;
		var end = organizer.dayEnd;

		if (start == undefined) {
			start = "10:00:00";
		}
		if (end == undefined) {
			end = "20:00:00";
		}

		// console.log("timePeriods: " + timePeriods);
		// console.log("start: " + start);
		// console.log("end: " + end);
		// console.log("current: " + new Date());

		var masterSchedule = createWeekMasterSchedule(timePeriods, start, end, today);
		
		// console.log("pre scheduler: ");
		// console.log(masterSchedule);

		for (var i = 0; i < listSchedules.length; i++) {
			listSchedules[i] = convertToFreetime(listSchedules[i]);
		}

		console.log("free times: ");
		console.log(listSchedules);

		masterSchedule = scheduler(masterSchedule, listSchedules, eventToSchedule.eventDuration);

		console.log("time slots to choose from: ");
		console.log(masterSchedule);

	// 	// now just needs to select three time periods from the master schedule,
	// 	// make them the requested duration (only use the start period of the period)
	// 	// and then use the start, start+ duration, and date of each of these three.
		var numEvents = 0;
		var eventsToShow = new Array();


		while (masterSchedule.length > 0 && numEvents < 3) {
			var newEvent = masterSchedule.shift();
			console.log("length: " + masterSchedule.length);
			console.log("numEvents: " + numEvents);
			console.log("nextEvent: " + newEvent);
			var periodStart = new Date(Date.parse(newEvent[0]));
			var periodEnd = new Date(Date.parse(newEvent[1]));


			var eventStart = "" + (((periodStart.getHours()+11) % 12 ) + 1) + ":" + ((periodStart.getMinutes() < 10) ? "0" : "") + periodStart.getMinutes() + " " + ((periodStart.getHours() / 12 >= 1) ? "PM" : "AM");
			console.log("start: " + periodStart + " -- eventStart: " + eventStart);


			// console.log("equation: periodStart + (eventToSchedule.eventDuration*60000*60)");
			// console.log("periodStart = " + periodStart);
			// console.log("(eventToSchedule.eventDuration*60000*60) = " + (eventToSchedule.eventDuration*60000*60));
			
			var newEndTime = new Date(periodStart).addHours(eventToSchedule.eventDuration);
			

			var eventEnd = "" + (((newEndTime.getHours()+11) % 12 ) + 1) + ":" + ((newEndTime.getMinutes() < 10) ? "0" : "") + newEndTime.getMinutes() + " " + ((newEndTime.getHours() / 12 >= 1) ? "PM" : "AM");
			console.log("end: " + periodEnd + " -- eventEnd: " + newEndTime);

			if (periodStart.getHours() - periodEnd.getHours() > eventToSchedule.eventDuration * 2) {
				masterSchedule.push([new Date(periodStart.addHours(eventToSchedule.eventDuration)), periodEnd]);
			}
			
			var date = "" + (periodStart.getMonth() + 1) + "/" + periodStart.getDate() + "/" + periodStart.getFullYear();
			
			eventsToShow.push([eventStart, eventEnd, date]);
			numEvents++;
		}

		console.log("Awesome stuff: ");
		console.log(eventsToShow);
		return eventsToShow;
	}

};

// exports.selectTime = function(req, res) {
function selectTime(req, res) {
	var id = req.params.id;
	var startTime = req.params.start;
	var endTime = req.params.end;
	var day = req.params.day;
	console.log(startTime);
	console.log(endTime);
	console.log(day);
	for (var user in users["users"]) {
		if (users["users"][user].email == req.session.current_user) {
			var currUser = user;
		}
	}
	// var index = users["users"][currUser].eventsToSchedule.indexOf(id);
	var index;
	for (var ev in users["users"][currUser].eventsToSchedule) {
		if (users["users"][currUser].eventsToSchedule[ev] == id)
			index = ev;
	}
	users["users"][currUser].eventsToSchedule.splice(index, 1);
	users["users"][currUser].historicEvents.push(id);
	var currEvent;
	for (var i in users["events"]) {
		if (users["events"][i].id == id) {
			currEvent = i;
		}
	}
	var attendees = users.events[currEvent].guests;
	var gCalID = user.events[currEvent].gCalID;
	var calendarID = users["users"][currUser].calendarID;
	var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
	oauth2Client.credentials = user["users"][currUser].tokens;
	var myClient = req.app.get('client');
	myClient.calendar.events.get({'calendarId': calendarID, 'eventId': gCalID}).withAuthClient(oauth2Client).execute(function(err, results) {
		
	});
			
	for (var i in attendees){
		if (i != 0) {
			for (var user in users["users"]) {
				if (attendees[i][0] == users["users"][user].email) {
					// var j = users["users"][user].pendingEvents.indexOf(id);
					var pos;
					for (var ev in users["users"][user].pendingEvents) {
						if (users["users"][user].pendingEvents[ev] == id)
							pos = ev;
					}
					users["users"][user].pendingEvents.splice(pos, 1);
					users["users"][user].historicEvents.push(id);
				}
			}
		}
	}

	var gcalStartTime = new Date(day + " " + startTime);
	var gcalEndTime = new Date(day + " " + endTime);
	var calendarID = users["users"][currUser].calendarID;
	var eventBody = createGCalendarJSON(gcalStartTime, gcalEndTime, attendees, req.session.current_user, 
		users.events[currEvent].eventName, users.events[currEvent].eventLocation, users.events[currEvent].eventDuration);
	var myClient = req.app.get('client');
	var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
	oauth2Client.credentials = users["users"][currUser].tokens;

	myClient.calendar.events.insert({'calendarId': calendarID, 'sendNotifications': true}, eventBody).
		withAuthClient(oauth2Client).execute(function(err, results) {
			if (err) { 
				console.log("ERROR in inserting event ", err);
			} else {
	      	    console.log("Create event ", err);
	            users.events[currEvent].gCalID = results.id;
	        }
	    });

	res.render('confirm', { 'isScheduled': true });
};

function createGCalendarJSON(attendees, creator, summary, location, duration) {
	var listAttendees = []
	for (var attendee in attendees) {
		if (attendee > 0) {
			listAttendees.push({
				"email": attendees[attendee][0]
			});
		}
	}
<<<<<<< HEAD
	var today = new Date();
    var nextweek = new Date(today.getFullYear(), today.getMonth(), today.getDate()+7);
    var description = "Duration: " + duration + " hours. " + "Go to http://scheduleus.herokuapp.com to RSVP!" 
=======
	// var today = new Date();
    // var nextweek = new Date(today.getFullYear(), today.getMonth(), today.getDate()+7);
    // var description = "Duration: " + duration + " hours." + "Go to http://scheduleus.herokuapp.com to RSVP!" 
>>>>>>> 396752d8f1c88b3acc466bea2df5cabf336808d6
	return {
		"start": { "dateTime": start.toISOString() },
		"end": { "dateTime": end.toISOString() },
		"attendees": listAttendees,
		"creator": creator,
		"summary": summary,
		"location": location,
		// "description": description,
		// "status": "tentative",
		"guestsCanInviteOthers": false
	}
};

Date.prototype.yyyymmdd = function() {                                         
    var yyyy = this.getFullYear().toString();                                    
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based         
    var dd  = this.getDate().toString();             
                            
    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
};  
