function scheduler(masterSchedule, schedules, timeNeeded) {
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
  console.log(users["users"]);
  console.log(users["events"]);
};

exports.viewEvents = function(req, res){
  res.render('viewEvents');
};

exports.editEvent = function(req, res){
  res.render('editEvent');
};

exports.addEvent = function(req, res){
	var organizer = req.session.current_user;
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
	users["events"].push(newEvent);

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
	res.render('confirm', {'isOrganizer': true });
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
		console.log(j);
		for (var i in users["events"]) {
			// console.log(users["users"][user]);
			if (users["events"][i].id == users.users[currUser].eventsAwaitingConfirmation[j]) {
				toSchedule.push(users["events"][i]);
				break;
			}
		}
	}

	console.log(toSchedule);
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
	res.render('confirm', {'isOrganizer': false });
};

exports.scheduleEvent = function(req, res){
	var id = req.params.id;
	res.render('schedule', { "id": id });
};

exports.selectTime = function(req, res){
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