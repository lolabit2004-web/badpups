if (!document.createElement('video').canPlayType || video_type == 'flash') {
	initFlashVideoPlayer();
}

if ($('[data-no_adobe]').length && $('#hidden_html5_block').length && !!document.createElement('video').canPlayType && video_type !== 'flash') {
    $('[data-no_adobe]').remove();
    $('#hidden_html5_block').show();
    video_type = 'html5';
    $('.player-adx-block, .player-sponsor-block').remove();
    if (typeof window['initHTML5VideoPlayer'] == 'function') {
        initHTML5VideoPlayer();
    }
}