(function() {
	var SVG = document.getElementById('drawArea');

	function windowSize() {
		SVG.setAttribute('height', window.innerHeight);
		SVG.setAttribute('width', window.innerWidth - 400);
		console.log('tic')
	}

	window.onresize = windowSize;
	windowSize();
})();