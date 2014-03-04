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
	$('div.clickable').click(function(e) {
		var id = $(this).attr('id');
		var idNumber = id.substr('host'.length);
		$('#modal-dialog' + idNumber).modal('show');
		// $('#awaiting').on('click', function() {
		//     $modal.modal('show');
		// });
	});

	$("button.schedule").click(actionClicked);
	$("input.accept").click(actionClicked);
	$("input.reject").click(actionClicked);
}

function actionClicked(e) {
	var prevTime = e.target.getAttribute("data-prevtime");
	var recentPrevTime = e.target.getAttribute("data-recentprevtime");
	var timeSpent = new Date() - new Date(prevTime);
	var recentTimeSpent = new Date() - new Date(recentPrevTime);
	console.log(timeSpent);
	console.log(recentTimeSpent);
	var label = 'schedule';
	if (e.target.className.indexOf('accept') != -1) {
		label = 'accept';
	} else if (e.target.className.indexOf('reject') != -1) {
		label = 'reject';
	}
	ga("send", "event", "button", "click", label, timeSpent);
	ga("send", "event", "button", "click", label, recentTimeSpent);
}