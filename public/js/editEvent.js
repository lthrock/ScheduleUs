'use strict';

// Call this function when the page loads (the "ready" event)
$(document).ready(function() {
	initializePage();
})

/*
 * Function that is called when the document is ready.
 */
function initializePage() {
	// add any functionality and listeners you want here
	var select = $("select[id$='hrs']");
    // var number = select.name;
    var id = select.attr('id');
    var number = id.substring(0, id.length-3);
	for(var i = 0; i < 24; i++){
	    var option = document.createElement("OPTION");
	    select.append(option);
	    if (i == 1) {
	    	option.text = i + " hour";
	    } else {
		    option.text = i + " hours";
		}
		if (i == number)
			option.selected = "selected";
	    option.value = i;
	}
}

function validateForm() {
	var name = document.forms["createEventForm"]["name"].value;
	var guests = document.forms["createEventForm"]["attendees"].value;
	var location = document.forms["createEventForm"]["location"].value;
	var hours = document.forms["createEventForm"]["hrs"].value;
	var mins = document.forms["createEventForm"]["mins"].value;
	var morning = document.forms["createEventForm"]["morning"].checked;
	var afternoon = document.forms["createEventForm"]["afternoon"].checked;
	var evening = document.forms["createEventForm"]["evening"].checked;
	if (name == null || name == "") {
		alert("Please enter a name for your event.");
		return false;
	}
	if (guests == null || guests == "") {
		alert("Please enter the email addresses of everyone you would like to invite to your event.");
		return false;
	}
	if (location == null || location == "") {
		alert("Please enter a location for your event.");
		return false;
	}
	if (hours == "0" && mins == "0"){
		alert("Please select a duration for your event.");
		return false;
	}
	if (!morning && !afternoon && !evening) {
		alert("Please select a time of day for this event.");
		return false;
	}
	var emails = guests.split(",");
	for (var i = 0; i < emails.length; i++) {
		var email = emails[i].trim();
		var atpos = email.indexOf("@");
		var dotpos = email.lastIndexOf(".");
		if (atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= email.length) {
			alert("One or more email addresses entered are invalid.");
		  	return false;
		}
	}
}