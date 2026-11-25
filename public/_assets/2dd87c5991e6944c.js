
var sponsor_tmt;

$(document).ready(function(){
	setTimeout(function(){ $('.player-sponsor-block').addClass('sponsored-on'); }, 5000);
	sponsor_tmt = setTimeout(function(){ $('.player-sponsor-block').removeClass('sponsored-on'); }, 26000);

	$('.player-spot-close').on('click', function(e){
		e.preventDefault();
		clearTimeout(sponsor_tmt);
		$('.player-sponsor-block').toggleClass('sponsored-on');
	});

	$('.player-sponsor-block').bind('mousemove', function(e){ $(this).addClass('player-sponsor-top-level'); });
	$('.player-sponsor-block').bind('mouseleave', function(e){ $(this).removeClass('player-sponsor-top-level'); });
});