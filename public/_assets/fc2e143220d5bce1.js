
function getFlashMovie(movieName) { 
    var isIE = navigator.appName.indexOf("Microsoft") != -1; 
    return (isIE) ? window[movieName] : document[movieName]; 
} 

var listners = [];
var playerTicks = -1;
var play_counter = 0;

function playButtonClick(){
	if (!play_counter++)
    	$.get('/embed/play', {ref: document.referrer, url: location.href});
}

function playerTimer() {
	var abc = Object();
	abc.id = "viptube_embed";
	abc.position = playerTicks;
	exoJw.time(abc);
	playerTicks++;
	setTimeout(playerTimer, 1000);
}

var popup_was_clicked = false;

function playerReady(e) {
    if (e) {
		$('#playerLink').one('click', function() {
			//openTraffURLs('player', TRAFF_TARGETS);
			setTimeout(function() {
				$('#adx_ad').html('');
				$('#adx_ad').hide();
			}, 1500);
			playerPlay();
		});
		
		if (typeof ADX != 'undefined') {
			var abc = Object();
			abc.id = "viptube_embed";
			
			if (topAdvABC) {
				player = document.getElementById(abc.id);
				player.addModelListener = function (a, b) {
					if (a == "TIME") {
						listners.push(b);
					}
				}
				
				playerReadyABC(abc);     
				ADX.ads.playertext.prototype.cfg.timer = {};
			}

			playerReadyA(abc);
		}
    }
}

function showBottomAdv(num) {
    var src = !$('#bottom_banner_block').hasClass('adx_hidden') ? '<iframe allowtransparency="true" frameborder="0" scrolling="no" width="468" height="60" src="' + base_url + '/adx_iframe_bottom_' + num + '.html"></iframe>' : '';
/*    if ($.browser.msie) {
        $('#bottom_banner_block').css('margin-top', '395px');
        $('#close_bottom_banner').css('margin-left', '537px');
        $('#close_bottom_banner').css('margin-top', '405px');
    }
*/
    $('#bottom_banner_block').html(src);
    $('#bottom_banner_block, #close_bottom_banner').show();
}

function playerPlay() {
    getFlashMovie("viptube_embed").sendTextToFlash("true");
    playButtonClick();
}

var BOTTOM_BANNER_SHOWN_FIRST = false; 

function adxprepare(){
	var doc = {w: $(document.body).width(), h: $(document.body).height()};
	$('#adx_ad, #bottom_banner_block').each(function(){
		var wh = {w: $(this).outerWidth(), h: $(this).outerHeight()},
			is_big = wh.w + 2*20 >= doc.w || wh.h + 2*20 + 35 >= doc.h;
		$(this).toggleClass('adx_hidden', is_big);
		if ($(this).attr('id') == 'bottom_banner_block')
			$('#close_bottom_banner').toggleClass('adx_hidden', is_big);
	});
}

function adxjwstate(a) {
	if (typeof ADX != 'undefined') {
		var t=ADX.ads.playertext;
		if(t.status!='launched'&&t.cfg.max_ads>=t.countAds&&t.status!='closed'&&a=='PLAYING') {
			t.status='launched';
			t.launchTimer();
		}
		if(t.status=='launched'&&(a=='PAUSED'||a=='IDLE'||a=='COMPLETED')) {
			t.status='stopped';
			clearTimeout(t.timerHide);
			clearTimeout(t.timerLaunch);
			if (typeof t.ad != "undefined")
				t.ad.style.display='none';
		}
	}

    if (a=='PAUSED') {
        var adx_code = getAdxCode();
		if (adx_code != "") {
	        $('#adx_ad').html(adx_code);
        	$('#adx_ad').show();
		}
    }

    if (a == 'PLAYING') {
    	playButtonClick();
    }
	
    if (a == 'PLAYING' || a == 'BUFFERING' || a == 'PAUSED_MENU' || a == 'PAUSED_SHARE') {		
		if (playerTicks == -1 && a == 'PLAYING' && topAdvABC)// && !$.cookie('no_ads'))
			playerTimer();
        
		$('#adx_ad').html('');
        $('#adx_ad').hide();
		
        if ($('#bottom_banner_block')) {
			if (!BOTTOM_BANNER_SHOWN_FIRST) {
				BOTTOM_BANNER_SHOWN_FIRST = true;
				//if (!$.cookie('no_ads')) {
					setTimeout(function () {
						showBottomAdv(5);
					}, 3000);
				//}
			}
		}
    }
}

function getAdxCode() {
    var num = 5;
      
    iframe_src = '<iframe allowtransparency="true" frameborder="2" scrolling="no" width="300" height="250" src="' + base_url + '/adx_iframe_middle_' + num + '.html"></iframe>'; 

    if (typeof adx_adhead == 'undefined'){
      var adx_adhead='<div align="center" style="font-family:arial; border:1px solid #676968; background-color:white; padding:0;margin:0; position:relative; width:335px;height:285px"><div align="left" style="background-color:#a31c20; color:#ffffff; margin:0; padding:3px 2px 2px 7px;font-size:15px;">Advertisement:</a></div><div style="margin:15px 15px 0 15px;    border:1px solid #bfbfbf; padding:0; width:320px; height:285px;">';
    }
    if (typeof adx_adfoot == 'undefined') {
      var adx_adfoot='</div><a href="javascript:void(0);" onclick="javascript:playerPlay();return false;" style="border:0; text-decoration: none; color : #000000"><div style="margin: 5px 0 5px 0;font-size: 18px;background: url(http://media.adxpansion.com/default/jwp/button_grey.png) no-repeat; width:174px; line-height:36px;" onmouseover="this.style.backgroundPosition=\'0 -37px\'" onmouseout="this.style.backgroundPosition=\'0 0\'">Close & Play</div></a></div>';
    }

    var adx_head = '<div style="border:1px solid #676968; background-color:#666666;padding:0px;margin:0px; position:relative; text-align:center;width:326px;height:276px;"><div style="height:13px;text-align:right;margin-bottom:0px;"><a href="javascript:void(0);" onClick="playerPlay();return false;"><img src="' + static_tpl + '/images/close_icon.jpg"></a></div>';

    var adx_foot = '</div>';

    var adx_adhtml = adx_head + iframe_src + adx_foot;

    return !$('#adx_ad').hasClass('adx_hidden') ? adx_adhtml : '';
}

var BOTTOM_BANNER_SHOWN_TWICE = false; 

$(function() {
    $('#close_bottom_banner').click(function () {
        $('#bottom_banner_block').hide();
        $('#close_bottom_banner').hide();

		if (!BOTTOM_BANNER_SHOWN_TWICE) {
			setTimeout(function () {
				showBottomAdv(5);
			}, 10000);
			BOTTOM_BANNER_SHOWN_TWICE = true;
		}
	});
	
	adxprepare();
	$(window).resize(function(){ adxprepare(); });
});