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
	ga("send", "event", "response", "cilck");
}