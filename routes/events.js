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
function convertToDaysAndFreetime(calendar) {
	var days = new Array();
	var daysEvents = new Array();

	var currYear = 0;
	var currMonth = 0;
	var currDay = 0;
	var hour, minute;

	var lastEnd = "0:00";

	for (var i = 0; i < calendar.length; i++) {
		var start = calendar[i][0].split(":");
		var end = calendar[i][1].split(":");

		var newYear = start[0];
		var newMonth = start[1];
		var newDay = start[2];

		if (newDay == currDay && newMonth == currMonth && newYear == currYear) {
			daysEvents.push([lastEnd, start[3] + ":" + start[4]]);

			if (start[0] == end[0] && start[1] == end[1] && start[2] == end[2]) {
				lastEnd = end[3] + ":" + end[4];
			} else {
				lastEnd = "24:00"
			}
			
		} else {
			if (currYear != 0) {
				daysEvents.push([lastEnd, "24:00"]);
				days.push([currYear + ":" + currMonth + ":" + currDay, daysEvents]);
				daysEvents = new Array();
				daysEvents.push(["0:00", start[3] + ":" + start[4]]);
				lastEnd = end[3] + ":" + end[4];
				

			} else {
				daysEvents.push([lastEnd, start[3] + ":" + start[4]]);
				lastEnd = end[3] + ":" + end[4];
			}
			currYear = newYear;
			currMonth = newMonth;
			currDay = newDay;
		}
	}
	daysEvents.push([lastEnd, "24:00"]);
	days.push([currYear + ":" + currMonth + ":" + currDay, daysEvents]);
	return days;
}


/*
 *  Example calendar array, to be passed into convertToDaysAndFreetime
 *
 *	var calendar = [
 *			["14:2:14:9:00", "14:2:14:9:30"],
 *			["14:2:14:12:00", "14:2:14:13:00"],
 *			["14:2:14:14:00", "14:2:14:16:00"],
 *			["14:2:14:16:00", "14:2:14:17:00"],
 *			["14:3:14:9:00", "14:3:14:9:30"],
 *			["14:3:14:12:00", "14:3:14:13:00"],
 *			["14:3:14:14:00", "14:3:14:16:00"],
 *			["14:3:14:16:00", "14:3:14:17:00"],
 *		];
 */



exports.createEvent = function(req, res){
  res.render('createEvent');
};

exports.viewEvents = function(req, res){
  res.render('viewEvents');
};

exports.editEvent = function(req, res){
  res.render('editEvent');
};

exports.addEvent = function(req, res){
	var organizer = ;
	var eventName = ;
	var eventDuration = ;
	var eventLocation = ;
	var morningAfternoonEvening = [];
	var guests = new Array();
	



	res.render('confirm');
};