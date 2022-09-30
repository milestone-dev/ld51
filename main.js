document.addEventListener("DOMContentLoaded", evt => {
	console.log("Hello world");

	document.addEventListener("click", evt => {
		console.log(evt.pageX, evt.pageY);
	});

	document.addEventListener("contextmenu", evt => {
		evt.preventDefault();
		console.log(evt.pageX, evt.pageY);
	});
});