var htmlVideoPlayer = function(params) {
    params = params || {};

    var me = {};

    var init = function(params) {
        me.tooltipElements = ['button-play', 'button-volume', 'volume-bar', 'button-quality', 'button-quality-block', 'button-quality-box', 'button-fullscreen', 'logo'];

        me.vid = null;
        me.aid = null;

        me.thumbs = {};

        me.controlsFn = 0;

        me.isShowControls = 1;
        me.stShowControls = 0;

        me.popups = [];
        me.popupClicked = 0;

        me.hide_spot = 0;
        me.spot_url = null;
        me.spot_bottom_url = null;
        me.spot_title = '';
        me.spot_close_play = '';
        me.spot_like = '';
        me.spot_share = '';

        me.spot_like_attrs = {};
        me.like_button_selector = null;
        me.fav_button_selector = null;

        me.show_bottom_spot = 0;

        me.spotSt = 0;
        me.spotBottomShown = 0;
        me.spotBottomSt = 0;
        me.spotBottomTimes = 2;
        me.spotBottomIntervals = [3, 10];

        me.show_sponsored = 0;
        me.sponsorSt = 0;
        me.player_16_9_only = false;
        me.isShowSponsored = 0;
        me.sponsored = {
            text: '',
            link_text: '',
            link_url: ''
        };
        me.has_embed_code = true;
        me.video_preroll = false;
        me.preroll_max_shown = 2;
        me.isAllClosePlay = 0;
        me.play_callback = null;
        me.pre_ad = {
            url: '',
            time_before_skip: 0,
            use_in_embed: 1,
            geo: null,
            stats: {
                view: '',
                click: ''
            }
        };

        if (params.show_sponsored) {
            params.isShowSponsored = params.show_sponsored;
        }

        me.isLogProgress = 0;
        me.isStopBtnPlay = 0;
        me.isForceBtnPlay = 0;
        me.sentLogPlay = 0;

        me.params = params;

        dea.extend(me, params);
        dea.extend(me, new baseVideoPlayer(me));

        if (!$.cookie("dwnld_speed") && window.hasOwnProperty('speedTest')) {
            if (window.hasOwnProperty('applicationData')
                && window.applicationData.hasOwnProperty('server')
                && window.applicationData.server.hasOwnProperty('static')
            ) {
                speedTest.run(window.applicationData.server.static + '/templates/base_master/css/speedtest.woff', 524288);
            }
        }

        console.log('init web');

        me.init();

        return me;
    };

    me.onBeforeSetup = function() {

    };

    me.setupHTML = function() {
        console.log('setupHTML');

        var self = this;

        // main elements
        this.$container = this.createEl('div', { 'class': 'video-player', 'tabindex': 1 });
        this.$poster = this.createEl('div', { 'class': 'poster' });

        this.$play = this.createEl('div', { 'class': 'play-button' });
        this.$pause = this.createEl('a', { 'class': 'pause-link', 'target': '_blank' });
        this.$waiting = this.createEl('div', { 'class': 'preloader' });

        dea.appendTo(this.$container, this.$poster);
        dea.appendTo(this.$container, this.$play);
        dea.appendTo(this.$container, this.createEl('div', { 'class': 'quality-status' }));
        dea.appendTo(this.$container, this.$waiting);
        dea.appendTo(this.$container, this.$pause);

        // context menu
        this.$context_menu = dea.appendTo(this.$container, this.createEl('div', { 'class': 'context-menu' }));
        this.$context_menu_list = dea.appendTo(this.$context_menu, this.createEl('div', { 'class': 'context-menu-list' }));

        dea.appendTo(this.$container, _createMenuBlock());
        dea.appendTo(this.$container, _createMenuBar());
        dea.appendTo(this.$container, _createSpotBox());
        dea.appendTo(this.$container, _createSpotBottomBox());
        dea.appendTo(this.$container, _createHiddenInputs());

        // sponsored block
        if (this.isShowSponsored) {
            this.$sponsor_block = _createSponsorBlock();
            dea.appendTo(this.$container, this.$sponsor_block);

            dea.addClass(this.$container, 'sponsored');
            setTimeout(function() {
                dea.addClass(self.$container, 'sponsored-on');
            }, 5000);

            this.sponsorSt = setTimeout(function() {
                dea.removeClass(self.$container, 'sponsored-on');
            }, 26000);
        }

        var video_data = $(this.$video).data(); // ---
        this.videoHeight = video_data['height'];
        this.videoWidth = video_data['width'];

        if (this.videoWidth < this.videoHeight) {
            dea.addClass(this.$container, 'is-vertical');
        }

        setupContainerStyles();

        var browser = navigator.userAgent.toLowerCase();
        if (browser.indexOf('mobile') > -1 || browser.indexOf('android') > -1 || browser.indexOf('ios') > -1) {
            dea.addClass(this.$container, 'is-mobile');
            this.isMobile = true;
        }

        dea.removeProperty(this.$video, 'controls');
        dea.insertBefore(this.$video, this.$container);
        dea.prependTo(this.$container, this.$video);

        function _createSponsorBlock() {
            var $sponsor_block = self.createEl('div', { 'class': 'sponsor-block' });

            dea.appendTo($sponsor_block, self.createEl('span', { 'class': 'spot-close', 'html': self.createEl('span', { 'class': 'spot-close-icon' }) }));
            dea.appendTo($sponsor_block, self.createEl('div', {
                'class': 'sponsor-data',
                'html': self.createEl('p', {
                    'class': 'sponsor-text',
                    'html': self.sponsored.text + ' <a href="' + self.sponsored.link_url + '" target="_blank" rel="nofollow">' + self.sponsored.link_text + '</a>'
                })
            }));

            return $sponsor_block;
        }

        function _createHiddenInputs() {
            var $inputs_block = self.createEl('div', { 'class': 'inputs' });

            dea.appendTo($inputs_block, self.createEl('input', { 'class': 'video-url', 'type': 'text', 'value': '' }));
            dea.appendTo($inputs_block, self.createEl('input', { 'class': 'embed-code', 'type': 'text', 'value': '' }));

            return $inputs_block;
        }

        function _createSpotBottomBox() {
            self.$spot_bottom_box = self.createEl('div', { 'class': 'spot-bottom-box', 'data-spot': '' });

            dea.appendTo(self.$spot_bottom_box, self.createEl('span', { 'class': 'spot-close', 'html': self.createEl('span', { 'class': 'spot-close-icon' }) }));
            self.$spot_bottom_iframe = dea.appendTo(self.$spot_bottom_box, self.createEl('iframe', { 'class': 'spot-bottom-iframe', 'frameborder': 'no', 'scrolling': 'no', 'src': '' }));

            return self.$spot_bottom_box;
        }

        function _createSpotBox() {
            self.$spot_box = self.createEl('div', { 'class': 'spot-box', 'data-spot': '' });

            var $spot_box_inner = self.createEl('div', { 'class': 'spot-inner' });
            var $spot_box_title = self.createEl('div', { 'class': 'spot-title' });
            self.$spot_box_iframe = self.createEl('iframe', {
                'id': 'spot_video_inside_player',
                'class': 'spot-iframe',
                'frameborder': 'no',
                'scrolling': 'no',
                'src': ''
            });

            dea.appendTo($spot_box_title, self.createEl('div', { 'class': 'spot-header', 'html': self.spot_title }));
            dea.appendTo($spot_box_title, self.createEl('span', { 'class': 'spot-close', 'html': self.createEl('span', { 'class': 'spot-close-icon' }) }));

            dea.appendTo($spot_box_inner, $spot_box_title);
            dea.appendTo($spot_box_inner, self.createEl('div', {
                'class': 'spot-frame',
                'html': self.$spot_box_iframe
            }));

            dea.appendTo(self.$spot_box, $spot_box_inner);

            self.$spot_box_close_play = self.createEl('a', {
                'class': [ 'spot-close-play', 'spot-button' ],
                'href': location.href,
                'html': self.spot_close_play
            });

            if (self.isAllClosePlay) {
                dea.addClass(self.$spot_box_close_play, 'wrap-better-content');
            }

            var $spot_box_close_play_box = dea.appendTo(self.$spot_box, self.createEl('div', {
                'class': 'spot-close-play-box',
                'html': self.$spot_box_close_play
            }));

            if (self.spot_like || self.spot_share) {
                var $spot_box_buttons = self.createEl('div', { 'class': 'spot-buttons' });
                if (self.spot_like) {
                    var $spot_box_like = dea.appendTo($spot_box_buttons, self.createEl('a', { 'class': 'spot-like', 'html': self.createEl('span', { 'class': 'spot-like-text', 'html': self.spot_like }) }));

                    // fav
                    if (self.fav_button_selector) {
                        $($spot_box_like).bind('click', function(e) { // ---
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            $(self.fav_button_selector).trigger('click');
                        });
                    }
                }

                if (self.spot_share) {
                    var $spot_box_share = self.createEl('a', { 'class': 'spot-share', 'html': self.createEl('span', { 'class': 'spot-share-text', 'html': self.spot_share }) });
                    dea.addClass($spot_box_share, 'do-share');
                    dea.appendTo($spot_box_buttons, $spot_box_share);
                }

                dea.appendTo(self.$spot_box, $spot_box_buttons);
            } else {
                dea.addClass(self.$spot_box, 'no-buttons');
            }

            // extra spot buttons
            var $adx_extra = dea.getById('adx_extra_data');
            if ($adx_extra) {
                var $clone = dea.cloneEl($adx_extra);
                var $extra_buttons = dea.getByTag('a', $clone);
                var i = 0;
                for ( ; i < $extra_buttons.length; i++) {
                    if ($extra_buttons[i].parentElement === $clone) {
                        dea.addClass($extra_buttons[i], self.prefixize('spot-button'));
                        dea.appendTo($spot_box_close_play_box, $extra_buttons[i]);
                    }
                }
            }

            return self.$spot_box;
        }

        function _createMenuBar() {
            var $menu_bar = self.createEl('div', { 'class': 'menu-bar' });

            self.$title_box = dea.appendTo($menu_bar, self.createEl('div', { 'class': 'title-box', 'text': self.title }));
            dea.appendTo($menu_bar, self.createEl('a', { 'class': 'link-related menu-link state-active', 'html': 'related' }));
            dea.appendTo($menu_bar, self.createEl('a', { 'class': 'link-top_rated menu-link', 'html': 'top rated' }));
            dea.appendTo($menu_bar, self.createEl('a', { 'class': 'link-most_viewed menu-link', 'html': 'most viewed' }));
            dea.appendTo($menu_bar, self.createEl('a', { 'class': 'link-more_from_user menu-link', 'html': 'more from this user' }));
            dea.appendTo($menu_bar, self.createEl('a', { 'class': 'link-share' }));

            self.$link_like = dea.appendTo($menu_bar, self.createEl('a', { 'class': 'link-like' }));

            var like_buttons = [];
            if (!self.isEmbed) {
                like_buttons.push(self.$link_like);
            }

            var i = 0;
            if (self.like_button_selector) {
                function _likeBtnClick(e) {
                    e.preventDefault();
                    $(self.like_button_selector).trigger('click');
                }

                for ( ; i < like_buttons.length; i++) {
                    $(like_buttons[i]).on('click', _likeBtnClick);
                }
            }

            function likeBtnClick(e) {
                e.preventDefault();

                var data = $(this).data(),
                    arr = [];

                for (var k in data) {
                    arr.push('[' + k + '="' + data[k] + '"]');
                }

                if (arr.length) {
                    $(a.join('')).trigger('click');
                }
            }

            // add click events for like buttons throught native page button
            for (i = 0; i < like_buttons.length; i++) {
                $(like_buttons[i]).bind('click', likeBtnClick);
            }

            return $menu_bar;
        }

        function _createMenuBlock() {
            var $menu_block = self.createEl('div', { 'class': 'menu-block' });
            dea.appendTo(dea.appendTo($menu_block, self.createEl('div', {
                'class': 'menu-block-related state-active',
                'html': '<h2>Related video</h2>'
            })), self.createEl('div', { 'class': 'video-list' }));

            dea.appendTo(dea.appendTo($menu_block, self.createEl('div', {
                'class': 'menu-block-top_rated',
                'html': '<h2>Top rated video</h2>'
            })), self.createEl('div', { 'class': 'video-list' }));

            dea.appendTo(dea.appendTo($menu_block, self.createEl('div', {
                'class': 'menu-block-most_viewed',
                'html': '<h2>Most viewed video</h2>'
            })), self.createEl('div', { 'class': 'video-list' }));

            dea.appendTo(dea.appendTo($menu_block, self.createEl('div', {
                'class': 'menu-block-more_from_user',
                'html': '<h2>More video from this user</h2>'
            })), self.createEl('div', { 'class': 'video-list' }));

            var $block_share = dea.appendTo($menu_block, self.createEl('div', { 'class': 'menu-block-share' }));
            dea.appendTo($block_share, self.createEl('h2', { 'class': 'share-h2', 'html': 'Share video' }));
            self.$share_list = dea.appendTo($block_share, self.createEl('div', { 'class': 'share-list' }));

            var $block_share_direct_link = dea.appendTo($block_share, self.createEl('div', { 'class': 'direct-link-block' }));
            dea.appendTo($block_share_direct_link, self.createEl('h3', { 'class': 'direct-link-h3', 'html': 'Direct link' }));
            dea.appendTo($block_share_direct_link, self.createEl('input', { 'class': 'direct-link-input', 'type': 'text', 'readonly': 'readonly', 'data-input-direct_link': '' }));

            var $block_share_embed_code = dea.appendTo($block_share, self.createEl('div', { 'class': 'embed-code-block' }));
            dea.appendTo($block_share_embed_code, self.createEl('h3', { 'class': 'embed-code-h3', 'html': 'Embed code' }));
            dea.appendTo($block_share_embed_code, self.createEl('input', { 'class': 'direct-link-input', 'type': 'text', 'readonly': 'readonly', 'data-input-embed_code': '' }));

            return $menu_block;
        }
    };

    me.setupPlayer = function() {
        if (this.has_hq && !dea.hasClass(this.$container, 'has-hq')) {
            dea.addClass(this.$container, 'has-hq');
        }

        this.setVideoSrc(this.currentSource);

        dea.addClass(this.$elBtnPlay, this.prefixize('control-item'));
        dea.addClass(this.$elBtnVolume, this.prefixize('control-item'));
        dea.addClass(this.$elBtnFullscreen, this.prefixize('control-item'));

        if (this.isStopBtnPlay) {
            dea.addClass(this.$elBtnPlay, 'stop-better-popunder');

            // if (this.$elProgressBarInner && this.$elProgressBarInner.parentNode) {
            //     dea.addClass(this.$elProgressBarInner.parentNode, 'stop-better-popunder');
            // }
        }

        if (this.isForceBtnPlay) {
            dea.addClass(this.$elBtnPlay, 'wrap-better-content');
            dea.addClass(this.$play, 'wrap-better-content');
        }

        var i = 0;
        for ( ; i < this.tooltipElements.length; i++) {
            $('.' + this.prefixize(this.tooltipElements[i]))
                .bind('click', function(e) {
                    $(this).tooltip('close');
                })
                .tooltip({
                    position: { my: "center bottom-35", at: "center bottom" }
                });
        }

        var self = this;

        // play callback (convert detected function into it's name (into string))
        if (this.play_callback && typeof window[this.play_callback.name] !== 'function') {
            $('body').on('player_start', window[this.play_callback.name]);
        }

        // title box
        dea.text(this.$title_box, this.title);

        // direct link // ---
        $.each([$('[data-input-direct_link]'), $('.' + this.prefixize('video-url'))], function() {
            $(this).val(self.url);
        });

        // embed code
        if (this.share && this.share.embed_code && this.has_embed_code) {
            $.each([$('[data-input-embed_code]'), $('.' + this.prefixize('embed-code'))], function() {
                $(this).val(self.share.embed_code);
            });
        } else {
            $('.' + this.prefixize('embed-code-block')).hide();
        }

        var $a;
        // share links
        if (this.share) {
            for (var network in this.share.icons) {
                $a = this.createEl('a', { 'href': this.share.social[network], 'target': '_blank' });

                dea.appendTo($a, dea.createEl('div', { 'class': 'share-img', 'html': this.createEl('img', { 'src': this.share.icons[network] }) }));
                dea.appendTo($a, dea.createEl('span', { 'html': network.charAt(0).toUpperCase() + network.slice(1) }));
                dea.appendTo(this.$share_list, $a);
            }
        }

        // like link
        dea.setAttr(this.$link_like, 'href', this.isEmbed ? this.click_urls.like : 'javascript:void(0);');
        dea.setAttr(this.$link_like, 'target', this.isEmbed ? '_blank' : '_self');

        // $('.' + this.prefixize('menu-block')).show();

        // videos lists
        for (var list in this.lists) {
            if (!this.lists[list].length) {
                $('.' + this.prefixize('menu-block-' + list) + ',' + '.' + this.prefixize('link-' + list)).hide();
                continue;
            }

            var block = $('.' + this.prefixize('menu-block-' + list)).find('.' + this.prefixize('video-list')),
                thumb_prefix = this.thumbs['common_url'] + '/%s/' + this.thumbs['sizes']['lists'] + '/';

            block.addClass('thumbs');
            block.parent().css({
                'padding-top': '30px',
                'height': '100%',
            });

            var ii = 0;
            for (var l in this.lists[list]) {
                if (this.lists[list][l]['video_url']) {
                    var videoUrl = this.lists[list][l]['video_url']; // decodeURIComponent(this.lists[list][l]['video_url']);
                    videoUrl = videoUrl.replace('&amp;', '&');

                    $a = this.createEl('a', {
                        'href': videoUrl,
                        'target': '_blank',
                        'class': 'th',
                        'style': {
                            'background-image': "url(" + thumb_prefix.replace('%s', this.lists[list][l][this.video_key]) + this.lists[list][l].thumb + this.thumbs['extension'] + ")",
                        }
                    });

                    // dea.addClass($a, 'th');

                    dea.appendTo($a, dea.createEl('video', {
                        'muted': true,
                        'autoplay': true,
                        'loop': true,
                        'src': this.lists[list][l]['webm_url'],
                    }));

                    dea.appendTo($a, dea.createEl('em', {
                        'class': 'webm-bar',
                        'data-webm_bar': '',
                    }));

                    dea.appendTo($a, dea.createEl('img', {
                        'src': thumb_prefix.replace('%s', this.lists[list][l][this.video_key]) + this.lists[list][l].thumb + this.thumbs['extension'],
                    }));

                    dea.appendTo($a, dea.createEl('span', {
                        'class': 'video-list-title',
                        'html': dea.createEl('em', {
                            'html': this.lists[list][l].title,
                        }),
                    }));

                    block.append($a);

                    // block.append('<a href="' + this.lists[list][l]['video_url'] + '" target="_blank" style="background-image:url(\'' + thumb_prefix.replace('%s', this.lists[list][l][this.video_key]) + this.lists[list][l].thumb + this.thumbs['extension'] + '\');"><span>' + this.lists[list][l].title + '</span></a>');

                    ii++;

                    if (ii === 3) {
                        block.append(this.createEl('br'));
                    }

                    if (ii > 5) {
                        break;
                    }
                }
            }
        }

        // context menu
        for (var p in this.context) {
            if (typeof this.context[p].data !== 'undefined' && this.context[p].data == 'copy-embed-code' && !this.has_embed_code) {
                continue;
            }

            $a = this.createEl('a', { 'href': this.context[p].link, 'target': '_blank', 'html': this.context[p].title });
            if (typeof this.context[p].data !== 'undefined') {
                dea.setAttr($a, 'data-' + this.context[p].data, '');
            }

            dea.appendTo(this.$context_menu_list, $a);
        }
        // ---

        if (this.isEmbed) {
            dea.addClass(this.$container, 'mode-embed');
        } else {
            _showSpot();
        }

        if (this.video_preroll && this.initAd) {
            var tt = $.cookie('traffic_type');

            var params = {
                vast_config_url: this.videoAdData['vast_config_url'],
                vast_time_out: this.vastTimeOut,
                preroll_max_shown: tt === '3' ? this.preroll_max_shown : 10000,
                preroll_cookie_name: 'video_preroll'
            };

            if (this.videoAdData['vast_url']) {
                params["vast_url"] = this.videoAdData['vast_url'];
            }

            if (this.videoAdData['retarget_vast_url']) {
                params["vast_retarget_url"] = this.videoAdData['retarget_vast_url'];
            }

            this.initAd.call(this, params);
        }

        // for flex
        setTimeout(setupContainerStyles, 100);
    };

    me.setupPlayerEvents = function() {
        dea.addEvent(me.$container, 'on_controls_hide', function() {
            dea.addClass(me.$container, 'mouse-move');
            dea.removeClass(me.$container, 'mouse-over');
        });

        dea.addEvent(me.$container, 'on_controls_show', function() {
            dea.addClass(me.$container, 'mouse-over');
            dea.removeClass(me.$container, 'mouse-move');
        });

        if (me.isLogProgress) {
            dea.addEvent(me.$container, "on_click_progress", function(event, data) {
                var progress = 0;

                if (event.detail && event.detail.progress) {
                    progress = event.detail.progress;
                }

                dea.ajax('/ajax/log/', {
                    method: 'POST',
                    dataType: 'json',
                    data: {
                        "log": "player",
                        "type": "progress",
                        "url": window.location.href,
                        "progress": progress,
                        "action": "rewind"
                    }
                });
            });
        }

        if (me.isMobile) {
            dea.addEvent(me.$elControlBar, 'click', showControls);
        }

        dea.addEvent(me.$video, 'resize', setupContainerStyles);
        dea.addEvent(window, 'resize', function() { // todo (for chrome): ref to after resize
            setTimeout(setupContainerStyles, 10);
        });

        // menu links
        $('.' + me.prefixize('menu-bar')).find('a').bind('click', function(e) {
            var code = $(this).attr('class').replace('menu-link', '').replace(me.classPrefix + '-link-', ''),
                block = $('.' + me.prefixize('menu-block-' + $.trim(code)));

            if (block.length) {
                e.preventDefault();
                $.each([$(this), block], function() {
                    $(this).addClass('state-active').siblings().removeClass('state-active');
                });
            }
        });

        // context menu
        $(me.$context_menu).bind('click', function(e) {
            if (dea.hasClass(e.target, me.prefixize('context-menu'))) {
                dea.setStyle(this, { 'display': 'none' });
            } else if (e.target.tagName.toLowerCase() === 'a') {
                dea.setStyle(me.$context_menu, { 'display': 'none' });
            }
        });

        $(me.$container).bind('contextmenu', function(e) {
            e.preventDefault();

            dea.setStyle(me.$context_menu_list, {
                'left': e.pageX - $(me.$container).offset().left + 'px',
                'top': e.pageY - $(me.$container).offset().top + 'px'
            });

            dea.setStyle(me.$context_menu, { 'display': 'block' });
        });

        // context menu events
        $('[data-copy-embed-code]').bind('click', function(e) { e.preventDefault(); _copyClipboard('.' + me.prefixize('embed-code')); });
        $('[data-copy-video-url]').bind('click', function(e) { e.preventDefault(); _copyClipboard('.' + me.prefixize('video-url')); });
        $('[data-copy-video-url-time]').bind('click', function(e) { e.preventDefault(); _copyClipboard('.' + me.prefixize('video-url'), true); });

        // dea.removeEvent(me.$pause, 'click');
        // dea.addEvent(me.$pause, 'click', function(e) {
        //     if (!me.$video.paused) {
        //         if (me.popups && me.popups.length && me.popupClicked < me.popups.length) {
        //             var popup_link = me.popups[me.popupClicked];
        //             me.popupClicked++;
        //
        //             dea.setAttr(this, 'href', popup_link);
        //             // return true;
        //         } else {
        //             e.preventDefault();
        //         }
        //     } else {
        //         e.preventDefault();
        //     }
        //
        //     me.playerPlayAndPause.call(me);
        // });

        // spot
        dea.addEvent(me.$spot_box, 'click', function(e) {
            if (me.started && dea.hasClass(e.target, me.prefixize('spot-box'))) {
                e.preventDefault();

                dea.dispatchEvent(me.$spot_box_close_play, 'click');
            }
        });

        function closeAndPlay(e) {
            e.preventDefault();

            _hideSpot();
            dea.dispatchEvent(me.$elBtnPlay, 'click');
        }

        dea.addEvent(me.$spot_box_close_play, 'click', closeAndPlay);

        var $spot_close;
        $spot_close = dea.getByClass(me.prefixize('spot-close'));

        if (me.isAllClosePlay) {
            dea.addEvent($spot_close, 'click', closeAndPlay);
        } else {
            dea.addEvent($spot_close, 'click', function() {
                $(this).parents('[data-spot]').eq(0).hide();
            });
        }

        if (me.$sponsor_block) {
            $spot_close = dea.getByClass(me.prefixize('spot-close'), me.$sponsor_block);
            dea.addEvent($spot_close, 'click', function() {
                clearTimeout(me.sponsorSt);
                dea.toggleClass(me.$container, 'sponsored-on');
            });
        }

        // bottom spot
        $spot_close = dea.getByClass(me.prefixize('spot-close'), me.$spot_bottom_box);
        dea.addEvent($spot_close, 'click', _taskBottomSpot);

        // player premium button
        $('.premium_bar_close').click(function(e){
            e.preventDefault();
            $('.player_premium_bar').hide();
        });

        // sponsored top level
        if (me.$sponsor_block) {
            dea.addEvent(me.$sponsor_block, 'mousemove', function() {
                dea.addClass(this, me.prefixize('top-level'));
            });

            dea.addEvent(me.$sponsor_block, 'mouseleave', function() {
                dea.removeClass(this, me.prefixize('top-level'));
            });

            dea.addEvent(me.$progress_bar, 'mouseover', function() {
                dea.removeClass(me.$sponsor_block, me.prefixize('top-level'));
            });
        }
    };

    me.setupVideoEvents = function() {
        // custom events for external functions
        $(me.$video).unbind('pleasestartplayer').bind('pleasestartplayer', me.playerPlayAndPause);

        $(me.$video).unbind('pause').bind('pause', function() {
            if (me.currentSource !== me.VIDEO_SOURCE_AD) {
                if (me.params['doNotShowInPlayerBannerWhenPause'] != 1) {
                    _showSpot();
                }
            }
        });

        if (me.params['doNotShowInPlayerBannerWhenPause'] != 1) {
            dea.addEvent(this.$container, 'on_ad_load', _showSpot);
        }

        me.onTimeUpdate();
    };

    me.onAfterSetup = function() {
        if (dea.hasClass(this.$container, 'is-vertical')) {
            dea.dispatchEvent(window, 'resize');
        }

        if (this.isForceBtnPlay) {
            var self = this;

            dea.removeEvent(this.$play, 'click');
            dea.addEvent(this.$play, 'click', function(e) {
                self.playerPlayAndPause.call(self);

                return false;
            });
        }

        if (me.isEmbed) {
            dea.removeEvent(me.$pause, 'click');
            dea.addEvent(me.$pause, 'click', function(e) {
                if (!me.$video.paused) {
                    if (me.popups && me.popups.length && me.popupClicked < me.popups.length) {
                        var popup_link = me.popups[me.popupClicked];
                        me.popupClicked++;

                        dea.setAttr(this, 'href', popup_link);
                        // return true;
                    } else {
                        e.preventDefault();
                    }
                } else {
                    e.preventDefault();
                }

                me.playerPlayAndPause.call(me);
            });
        }
    };

    me.onError = function() {
        if (me.currentSource !== me.VIDEO_SOURCE_AD) {
            dea.removeClass(me.$container, 'state-pause');
            _playerStop(); /////

            dea.ajax('/ajax/log/', {
                method: 'POST',
                dataType: 'json',
                data: {
                    "log": "player",
                    "type": "error",
                    "url": window.location.href,
                    "source": me.currentSource
                }
            });
        }
    };

    me.onEnded = function() {
        console.log('onEnded');

        _playerStop();
    };

    me.onSeeked = function() {
        me.onWaiting(0);
    };

    me.onTimeUpdate = function() {
        // _waitingByTime();
    };

    me.onWaiting = function(state) {
        dea[state ? 'addClass' : 'removeClass'](me.$container, 'state-waiting');
    };

    me.onAfterSetSource = function() {
        console.log('onAfterSetSource');

        setPlayerQuality(me.previousSource, me.currentSource);
    };

    me.playerPlay = function() {
        dea.removeClass(me.$container, 'state-ended');
        dea.removeClass(me.$container, 'state-pause');
        dea.addClass(me.$container, 'state-started');

        if (me.isLogProgress && !me.sentLogPlay) {
            dea.ajax('/ajax/log/', {
                method: 'POST',
                dataType: 'json',
                data: {
                    "log": "player",
                    "type": "progress",
                    "url": window.location.href,
                    "progress": 0,
                    "action": "play"
                }
            });

            me.sentLogPlay = 1;
        }

        // player premium button
        $('.player_premium_bar').hide();

        // clearTimeout(me.spotSt);
        _hideSpot();
    };

    me.playerPause = function() {
        me.onWaiting(0);

        dea.addClass(me.$container, 'state-pause');
        dea.removeClass(me.$container, 'state-started');

        // if (me.currentSource !== me.VIDEO_SOURCE_AD) {
        //     _showSpot();
        // }
    };

    me.playerReplay = function() {
        me.popupClicked = 0; // reset popunders

        dea.removeClass(me.$container, 'state-ended');
    };

    var _playerStop = function() {
        console.log('_playerStop');

        if (me.currentSource !== me.VIDEO_SOURCE_AD) {
            me.started = 0;

            me.onWaiting(0);

            dea.addClass(me.$container, 'state-ended');
            dea.removeClass(me.$container, 'state-started');

            clearTimeout(me.spotSt);
            _hideSpot();
        }
    };

    var setPlayerQuality = function(old_src, new_src) {
        var $quality = dea.getByClass(me.prefixize('quality-status'), me.$container);
        dea.removeClass($quality, 'mode-' + old_src);
        dea.addClass($quality, 'mode-' + new_src);
    };

    /**
     * Перевести в функции
     *
     * Draw css elements when inited and when resized (fullscreen)
     */
    var setupLayout = function() {
        var width = ($(me.$container).width() - 16 - (2 * parseInt(dea.getStyle(me.$elControlBar, 'padding-left') || 0, 10)) - parseInt($(me.$elBtnPlay).outerWidth(true), 10) - parseInt($(me.$elRightBar).outerWidth(true), 10) - 16);

        dea.setStyle(me.$elProgressBar, {
            width: width + 'px'
        });

        me['styles']['container'] = {
            width: $(me.$container).width(),
            offset: $(me.$container).offset()
        };

        me['styles']['progress'] = {
            width: width - 6 // margin left
        };
    };

    var setupContainerStyles = function() {
        var videoWidth = me.videoWidth,
            videoHeight = me.videoHeight;

        var _videoWidth = dea.getAttr(me.$video, "data-width");
        var _videoHeight = dea.getAttr(me.$video, "data-height");
        var videoRatio = _videoWidth / _videoHeight;

        var parentWidth = parseInt($(me.$video).parent().width(), 10) || 720,
            parentHeight = 500,
            isVertical = parseInt(videoWidth, 10) < parseInt(videoHeight, 10),
            ratio, height;

        if (typeof videoWidth === 'undefined') {
            videoWidth = parentWidth;
        }

        if (isVertical) {
            ratio = videoHeight / parentHeight;
            videoWidth = parentHeight;
            videoHeight = videoWidth / ratio;
        } else {
            ratio = videoWidth / parentWidth;
            videoWidth = parentWidth;
            videoHeight = videoHeight / ratio;

            videoHeight = videoWidth / videoRatio;
        }

        height = me.isEmbed ? '100%' : (!isVertical ? videoHeight + 'px' : '100%');
        ratio = (videoHeight > 0) ? (videoWidth / videoHeight) : 0;

        if (me.player_16_9_only && ratio < 1.77) {
            height = (videoWidth / 1.77) + 'px';
        }

        dea.setStyle(me.$container, {
            height: height,
            width: !isVertical || me.isEmbed ? '100%' : videoWidth + 'px'
        });

        setTimeout(setupLayout, 100);
    };

    var showControls = function() {
        if (!me.isShowControls) {
            me.isShowControls = 1;

            dea.addClass(me.$container, 'mouse-over');
            dea.removeClass(me.$container, 'mouse-move');
        }

        autoHideControls();
    };

    var hideControls = function() {
        me.isShowControls = 0;

        hidePlayerQualityChoice();

        dea.addClass(me.$container, 'mouse-move');
        dea.removeClass(me.$container, 'mouse-over');
    };

    var autoHideControls = function() {
        clearTimeout(me.stShowControls);
        me.stShowControls = setTimeout(hideControls, me.isMobile ? 3000 : 1000);
    };

    var hidePlayerQualityChoice = function() {
        if (me.$quality_choice) {
            dea.setStyle(me.$quality_choice, { 'display': 'none' });
        }
    };

    var _waitingByTime = function() {
        if (me.currentTime && me.currentTime !== me.$video.currentTime) {
            me.onWaiting(0, 'event timeupdate');
        }

        me.currentTime = me.$video.currentTime;
    };

    /**
     * Adv
     * @private
     */
    var _showSpot = function() {
        if (!me.hide_spot && me.spot_url) {
            dea.setAttr(me.$spot_box_iframe, 'src', me.spot_url + (me.spot_url.indexOf('?') === -1 ? '?' : '&') + 'r=' + Math.random());

            me.spotSt = setTimeout(function() {
                dea.addClass(me.$spot_box, me.prefixize('spot-visible'));
            }, 100);
        }
    };

    var _hideSpot = function() {
        dea.removeClass(me.$spot_box, me.prefixize('spot-visible'));
    };

    var _taskBottomSpot = function() {
        if (me.spotBottomShown < me.spotBottomTimes) {
            setTimeout(function() {
                _showBottomSpot();
            }, me.spotBottomIntervals[me.spotBottomShown] * 1000);
        }
    };

    var _showBottomSpot = function() {
        if (!me.hide_spot && me.spot_bottom_url && me.show_bottom_spot) {
            dea.setAttr(me.$spot_bottom_iframe, 'src', me.spot_bottom_url + (me.spot_bottom_url.indexOf('?') === -1 ? '?' : '&') + 'r=' + Math.random());

            me.spotBottomSt = setTimeout(function() {
                me.spotBottomShown++;

                dea.setStyle(me.$spot_bottom_box, { 'display': 'block' });
            }, 100);
        }
    };

    var _copyClipboard = function(field, from_time) {
        field = $(field);
        var field_value = field.val();
        if (typeof from_time !== 'undefined' && from_time == true) {
            field.val(field_value + '#time' + Math.round(me.$video.currentTime));
        }
        field.select();
        document.execCommand('copy');
        field.val(field_value);
    };

    return init(params);
};
