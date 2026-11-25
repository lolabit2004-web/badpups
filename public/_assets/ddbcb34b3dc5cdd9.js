(() => {
    const analyticsMeta = document.querySelector('meta[name="badpups-ga-measurement-id"]');
    const analyticsId = analyticsMeta?.getAttribute('content')?.trim();
    if (analyticsId && /^G-[A-Z0-9]+$/.test(analyticsId)) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', analyticsId, { anonymize_ip: true });
        const analyticsScript = document.createElement('script');
        analyticsScript.async = true;
        analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
        document.head.append(analyticsScript);
    }

    const drawer = document.querySelector('[data-drawer]');
    const drawerOpen = document.querySelector('[data-drawer-open]');
    const drawerScrim = document.querySelector('[data-drawer-scrim]');
    const drawerClosers = document.querySelectorAll('[data-drawer-close]');

    const setDrawer = (open) => {
        if (!(drawer instanceof HTMLElement) || !(drawerOpen instanceof HTMLElement)) return;
        drawer.classList.toggle('open', open);
        drawer.setAttribute('aria-hidden', String(!open));
        drawerOpen.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('drawer-open', open);
        if (drawerScrim instanceof HTMLElement) drawerScrim.hidden = !open;
    };

    drawerOpen?.addEventListener('click', () => setDrawer(true));
    drawerClosers.forEach((closer) => closer.addEventListener('click', () => setDrawer(false)));
    drawerScrim?.addEventListener('click', () => setDrawer(false));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setDrawer(false); });

    document.querySelectorAll('[data-password-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
            const inputId = button.getAttribute('aria-controls');
            const input = inputId ? document.getElementById(inputId) : null;

            if (!(input instanceof HTMLInputElement)) {
                return;
            }

            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            button.textContent = show ? 'Hide' : 'Show';
            button.setAttribute('aria-pressed', String(show));
        });
    });

    const errorSummary = document.querySelector('[data-error-summary]');
    if (errorSummary instanceof HTMLElement) {
        errorSummary.focus();
    }

    document.querySelectorAll('[data-existing-thumbnail-selector]').forEach((selector) => {
        const scrubber = selector.querySelector('[data-existing-thumbnail-scrubber]');
        const preview = selector.querySelector('[data-existing-thumbnail-preview]');
        const timeValue = selector.querySelector('[data-existing-thumbnail-time-value]');
        const output = selector.querySelector('[data-existing-thumbnail-time]');
        const status = selector.querySelector('[data-existing-thumbnail-status]');
        const previewUrl = selector.dataset.framePreviewUrl;
        const configuredDuration = Math.max(1, Number(selector.dataset.durationMs || 0));
        const initialTime = Math.max(0, Number(selector.dataset.initialTimeMs || 0));
        if (!(scrubber instanceof HTMLInputElement) || !(preview instanceof HTMLImageElement) || !(timeValue instanceof HTMLInputElement) || !previewUrl) return;

        const frameMs = 33;
        let previewTimer = null;
        let requestNumber = 0;
        const formatClock = (milliseconds) => {
            const totalSeconds = Math.max(0, milliseconds) / 1000;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = Math.floor(totalSeconds % 60);
            const fraction = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
            return `${hours ? `${hours}:` : ''}${String(minutes).padStart(hours ? 2 : 1, '0')}:${String(seconds).padStart(2, '0')}.${String(fraction).padStart(3, '0')}`;
        };
        const loadFrame = (milliseconds) => {
            const maximum = Math.max(0, Number(scrubber.max || configuredDuration));
            const selected = Math.min(maximum, Math.max(0, Math.round(milliseconds / frameMs) * frameMs));
            scrubber.value = String(Math.round(selected));
            timeValue.value = String(Math.round(selected));
            if (output instanceof HTMLOutputElement) output.textContent = `Loading frame at ${formatClock(selected)}…`;
            if (status instanceof HTMLElement) status.textContent = 'Loading the selected frame…';
            clearTimeout(previewTimer);
            const thisRequest = ++requestNumber;
            previewTimer = setTimeout(() => {
                const image = new Image();
                image.onload = () => {
                    if (thisRequest !== requestNumber) return;
                    preview.src = image.src;
                    if (output instanceof HTMLOutputElement) output.textContent = `Selected frame at ${formatClock(selected)}`;
                    if (status instanceof HTMLElement) status.textContent = 'This exact frame will become the new thumbnail when you save changes.';
                };
                image.onerror = () => {
                    if (thisRequest !== requestNumber) return;
                    timeValue.value = '';
                    if (status instanceof HTMLElement) status.textContent = 'That frame could not be loaded. Try another position or try again shortly.';
                };
                image.src = `${previewUrl}?time_ms=${encodeURIComponent(Math.round(selected))}&v=${Date.now()}`;
            }, 300);
        };

        scrubber.max = String(configuredDuration);
        scrubber.step = String(frameMs);
        if (initialTime > 0 && output instanceof HTMLOutputElement) output.textContent = `Current thumbnail at ${formatClock(initialTime)}`;
        if (status instanceof HTMLElement) status.textContent = 'Drag the red bar for fast selection, then use Previous frame or Next frame to fine tune it.';
        scrubber.addEventListener('input', () => loadFrame(Number(scrubber.value || 0)));
        selector.querySelectorAll('[data-thumbnail-frame-step]').forEach((button) => button.addEventListener('click', () => {
            const direction = Number(button.dataset.thumbnailFrameStep || 0);
            loadFrame(Number(scrubber.value || initialTime) + (direction * frameMs));
        }));
    });

    const root = document.documentElement;
    const applyTextScale = (scale) => {
        const bounded = Math.min(1.3, Math.max(.85, scale));
        root.style.setProperty('--bp-text-scale', String(bounded));
        localStorage.setItem('bp-text-scale', String(bounded));
    };
    const savedScale = Number(localStorage.getItem('bp-text-scale'));
    if (Number.isFinite(savedScale) && savedScale > 0) applyTextScale(savedScale);

    document.querySelector('[data-text-larger]')?.addEventListener('click', () => applyTextScale(Number(getComputedStyle(root).getPropertyValue('--bp-text-scale')) + .1));
    document.querySelector('[data-text-smaller]')?.addEventListener('click', () => applyTextScale(Number(getComputedStyle(root).getPropertyValue('--bp-text-scale')) - .1));
    document.querySelector('[data-text-reset]')?.addEventListener('click', () => applyTextScale(1));

    const restoreToggle = (key, className, buttonSelector) => {
        const active = localStorage.getItem(key) === 'true';
        document.body.classList.toggle(className, active);
        document.querySelector(buttonSelector)?.setAttribute('aria-pressed', String(active));
    };
    restoreToggle('bp-light-mode', 'light-mode', '[data-light-mode]');
    restoreToggle('bp-high-contrast', 'high-contrast-mode', '[data-high-contrast]');
    restoreToggle('bp-highlight-links', 'bp-highlight-links', '[data-highlight-links]');

    document.querySelector('[data-light-mode]')?.addEventListener('click', (event) => {
        const active = document.body.classList.toggle('light-mode');
        localStorage.setItem('bp-light-mode', String(active));
        event.currentTarget.setAttribute('aria-pressed', String(active));
    });
    document.querySelector('[data-high-contrast]')?.addEventListener('click', (event) => {
        const active = document.body.classList.toggle('high-contrast-mode');
        localStorage.setItem('bp-high-contrast', String(active));
        event.currentTarget.setAttribute('aria-pressed', String(active));
    });
    document.querySelector('[data-highlight-links]')?.addEventListener('click', (event) => {
        const active = document.body.classList.toggle('bp-highlight-links');
        localStorage.setItem('bp-highlight-links', String(active));
        event.currentTarget.setAttribute('aria-pressed', String(active));
    });

    const previewSettingKey = 'bp_video_preview_autoplay';
    const previewImages = [...document.querySelectorAll('.bp-video-thumb[data-preview-src]')];
    const previewToggles = [...document.querySelectorAll('[data-preview-autoplay-toggle]')];
    let previewObserver = null;

    const cookieValue = (name) => document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))
        ?.split('=')[1];

    const readPreviewSetting = () => {
        const stored = localStorage.getItem(previewSettingKey) ?? cookieValue(previewSettingKey);
        if (stored === '1' || stored === 'true') return true;
        if (stored === '0' || stored === 'false') return false;

        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData;
    };

    let previewEnabled = readPreviewSetting();

    const rememberPreviewSetting = (enabled) => {
        localStorage.setItem(previewSettingKey, enabled ? '1' : '0');
        const secure = location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `${previewSettingKey}=${enabled ? '1' : '0'}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
    };

    const showStill = (image) => {
        const still = image.dataset.stillSrc;
        image.dataset.previewing = '0';
        if (still && image.getAttribute('src') !== still) image.src = still;
        image.classList.remove('is-preview-loading');
    };

    const showPreview = (image) => {
        const preview = image.dataset.previewSrc;
        if (!preview || image.getAttribute('src') === preview) return;
        image.dataset.previewing = '1';
        image.classList.add('is-preview-loading');
        image.src = preview;
    };

    previewImages.forEach((image) => {
        image.addEventListener('load', () => image.classList.remove('is-preview-loading'));
        image.addEventListener('error', () => {
            if (image.dataset.previewing === '1') showStill(image);
        });

        const card = image.closest('.video-card');
        card?.addEventListener('pointerenter', (event) => {
            if (previewEnabled && event.pointerType !== 'touch') showPreview(image);
        });
        card?.addEventListener('pointerleave', (event) => {
            if (event.pointerType !== 'touch') showStill(image);
        });
        card?.addEventListener('focusin', () => { if (previewEnabled) showPreview(image); });
        card?.addEventListener('focusout', () => showStill(image));
    });

    const refreshMobilePreviews = () => {
        previewObserver?.disconnect();
        previewObserver = null;
        previewImages.forEach(showStill);

        if (!previewEnabled || !window.matchMedia('(hover: none)').matches || !('IntersectionObserver' in window)) return;

        previewObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => entry.isIntersecting ? showPreview(entry.target) : showStill(entry.target));
        }, { rootMargin: '-15% 0px -15% 0px', threshold: .55 });
        previewImages.forEach((image) => previewObserver.observe(image));
    };

    const setPreviewSetting = (enabled, persist = false) => {
        previewEnabled = enabled;
        previewToggles.forEach((toggle) => { toggle.checked = enabled; });
        if (persist) rememberPreviewSetting(enabled);
        refreshMobilePreviews();
    };

    previewToggles.forEach((toggle) => toggle.addEventListener('change', () => {
        rememberPreviewSetting(toggle.checked);
        if (window.matchMedia('(hover: none)').matches) {
            window.location.reload();
            return;
        }
        setPreviewSetting(toggle.checked);
    }));
    setPreviewSetting(previewEnabled);

    const setupTokenPicker = (picker) => {
        if (!(picker instanceof HTMLElement) || picker.dataset.tokenReady === '1') return;
        picker.dataset.tokenReady = '1';
        const input = picker.querySelector('[data-token-input]');
        const list = picker.querySelector('[data-token-list]');
        const suggestions = picker.querySelector('[data-token-suggestions]');
        const hidden = picker.querySelector('[data-token-hidden]');
        const type = picker.dataset.tokenType;
        const allowCreate = picker.dataset.tokenCreate === '1';
        const maximum = Number(picker.dataset.tokenMax || 20);
        const suggestionLimit = Number(picker.dataset.tokenSuggestionLimit || 12);
        let options = [];
        try { options = JSON.parse(picker.querySelector('[data-token-options]')?.textContent || '[]'); } catch (_) {}
        let selected = [];
        try { selected = JSON.parse(picker.querySelector('[data-token-selected]')?.textContent || '[]'); } catch (_) {}
        const same = (a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'accent' }) === 0;
        const sync = () => {
            list.innerHTML = '';
            hidden.innerHTML = '';
            selected.forEach((item, index) => {
                const token = document.createElement('span'); token.className = 'upload-token';
                token.append(document.createTextNode(item.name));
                const remove = document.createElement('button'); remove.type = 'button'; remove.setAttribute('aria-label', `Remove ${item.name}`); remove.innerHTML = '&times;';
                remove.addEventListener('click', () => { selected.splice(index, 1); sync(); }); token.append(remove); list.append(token);
            });
            if (type === 'categories') selected.forEach((item) => { const node = document.createElement('input'); node.type = 'hidden'; node.name = 'category_ids[]'; node.value = item.id; hidden.append(node); });
            if (type === 'tags') { const node = document.createElement('input'); node.type = 'hidden'; node.name = 'tags'; node.value = selected.map((item) => item.name).join(','); hidden.append(node); }
            if (type === 'performers') {
                selected.filter((item) => item.id).forEach((item) => { const node = document.createElement('input'); node.type = 'hidden'; node.name = 'performer_ids[]'; node.value = item.id; hidden.append(node); });
                const fresh = document.createElement('input'); fresh.type = 'hidden'; fresh.name = 'new_performers'; fresh.value = selected.filter((item) => !item.id).map((item) => item.name).join(','); hidden.append(fresh);
            }
            if (type === 'languages') selected.forEach((item) => {
                const node = document.createElement('input');
                node.type = 'hidden';
                node.name = picker.dataset.tokenName;
                node.value = item.id;
                hidden.append(node);
            });
            input.placeholder = selected.length >= maximum ? `Maximum ${maximum} selected` : input.dataset.originalPlaceholder;
            input.disabled = selected.length >= maximum;
        };
        const add = (item, { focusInput = true } = {}) => {
            if (!item?.name || selected.length >= maximum || selected.some((entry) => same(entry.name, item.name))) return;
            selected.push({ id: item.id || null, name: item.name.trim(), label: item.label || item.name.trim() }); input.value = ''; suggestions.hidden = true; sync();
            if (focusInput) {
                input.focus();
                if (type === 'tags') render();
            }
        };
        const render = () => {
            const query = input.value.trim();
            let matches = options.filter((item) => !selected.some((entry) => same(entry.name, item.name)) && (!query || (item.label || item.name).toLowerCase().includes(query.toLowerCase())));
            if (suggestionLimit > 0) matches = matches.slice(0, suggestionLimit);
            suggestions.innerHTML = '';
            matches.forEach((item) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = item.label || item.name; button.addEventListener('click', () => add(item)); suggestions.append(button); });
            if (allowCreate && query && !options.some((item) => same(item.name, query)) && !selected.some((item) => same(item.name, query))) {
                const button = document.createElement('button'); button.type = 'button'; button.innerHTML = `<strong>Add new:</strong> ${query.replace(/[<>&"]/g, '')}`; button.addEventListener('click', () => add({ name: query })); suggestions.append(button);
            }
            suggestions.hidden = !suggestions.children.length;
        };
        input.dataset.originalPlaceholder = input.placeholder;
        input.addEventListener('input', render); input.addEventListener('focus', render);
        input.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); const exact = options.find((item) => same(item.name, input.value.trim())); if (exact) add(exact); else if (allowCreate && input.value.trim()) add({ name: input.value.trim() }); } if (event.key === 'Escape') suggestions.hidden = true; });
        document.addEventListener('click', (event) => { if (!picker.contains(event.target)) suggestions.hidden = true; });
        picker.querySelectorAll('[data-token-quick-add]').forEach((button) => button.addEventListener('click', () => add({ id: button.dataset.tokenId || null, name: button.dataset.tokenName || '' }, { focusInput: false })));
        picker.bpTokenPicker = { get: () => selected.map((item) => ({ ...item })), set: (items) => { selected = items.map((item) => ({ ...item })); sync(); }, add };
        sync();
    };
    document.querySelectorAll('[data-token-picker]').forEach(setupTokenPicker);

    const setupSiteSelect = (wrapper) => {
        if (!(wrapper instanceof HTMLElement) || wrapper.dataset.selectReady === '1') return;
        wrapper.dataset.selectReady = '1';
        const select = wrapper.querySelector('select');
        if (!(select instanceof HTMLSelectElement)) return;
        wrapper.addEventListener('click', (event) => {
            if (event.target === select) return;
            select.focus({ preventScroll: true });
            try { select.showPicker?.(); } catch (_) { select.click(); }
        });
    };
    document.querySelectorAll('.site-select').forEach(setupSiteSelect);

    const profileSettings = document.querySelector('[data-profile-settings]');
    const publicAboutHeading = document.querySelector('.profile-personal-information > h2');
    if (publicAboutHeading instanceof HTMLElement) publicAboutHeading.textContent = 'About';
    if (profileSettings instanceof HTMLFormElement) {
        const typeSelect = profileSettings.querySelector('[data-profile-type]');
        const peopleSection = profileSettings.querySelector('[data-profile-people]');
        const peopleList = profileSettings.querySelector('[data-profile-person-list]');
        const personTemplate = profileSettings.querySelector('[data-profile-person-template]');
        const addPerson = profileSettings.querySelector('[data-add-profile-person]');
        let nextPersonIndex = peopleList?.children.length || 0;
        profileSettings.querySelectorAll('input[name$="[city]"]').forEach((input) => { input.placeholder = 'For example: Los Angeles'; });
        const refreshPeople = () => {
            const type = typeSelect?.value || 'individual';
            const enabled = type === 'couple' || type === 'group' || type === 'brand';
            if (peopleSection instanceof HTMLElement) peopleSection.hidden = !enabled;
            const cards = [...(peopleList?.querySelectorAll('[data-profile-person]') || [])];
            cards.forEach((card, index) => {
                card.hidden = type === 'couple' && index >= 2;
                card.querySelector('[data-person-number]').textContent = String(index + 1);
                const remove = card.querySelector('[data-remove-profile-person]');
                if (remove instanceof HTMLElement) remove.hidden = type !== 'group' || cards.length <= 2;
            });
            if (addPerson instanceof HTMLElement) addPerson.hidden = !['group', 'brand'].includes(type) || cards.length >= 10;
        };
        const addProfilePerson = () => {
            if (!(personTemplate instanceof HTMLTemplateElement) || !(peopleList instanceof HTMLElement) || peopleList.children.length >= 10) return;
            const wrapper = document.createElement('div');
            wrapper.innerHTML = personTemplate.innerHTML.replaceAll('__INDEX__', String(nextPersonIndex++));
            const card = wrapper.firstElementChild;
            if (!(card instanceof HTMLElement)) return;
            peopleList.append(card);
            card.querySelectorAll('[data-token-picker]').forEach(setupTokenPicker);
            card.querySelectorAll('.site-select').forEach(setupSiteSelect);
            card.querySelectorAll('input[name$="[city]"]').forEach((input) => { input.placeholder = 'For example: Los Angeles'; });
            window.bpInitUploadEditors?.(card);
            refreshPeople();
        };
        typeSelect?.addEventListener('change', () => {
            if (['couple', 'group'].includes(typeSelect.value)) while ((peopleList?.children.length || 0) < 2) addProfilePerson();
            refreshPeople();
        });
        addPerson?.addEventListener('click', addProfilePerson);
        peopleList?.addEventListener('click', (event) => {
            const remove = event.target.closest('[data-remove-profile-person]');
            if (!remove || typeSelect?.value !== 'group' || peopleList.children.length <= 2) return;
            const card = remove.closest('[data-profile-person]');
            card?.querySelectorAll('textarea[id]').forEach((textarea) => window.tinymce?.get(textarea.id)?.remove());
            card?.remove();
            refreshPeople();
        });
        refreshPeople();
    }

    const setupUploadForm = (uploadForm) => {
        if (!(uploadForm instanceof HTMLFormElement)) return;
        if (uploadForm.dataset.uploadReady === '1') return;
        uploadForm.dataset.uploadReady = '1';
        uploadForm.querySelectorAll('[data-token-picker]').forEach(setupTokenPicker);
        const fileInput = uploadForm.querySelector('[data-upload-file]');
        const submitButton = uploadForm.querySelector('button[type="submit"]');
        const statuses = [...uploadForm.querySelectorAll('[data-upload-status],[data-upload-wizard-status]')];
        const progress = uploadForm.querySelector('[data-upload-progress]');
        const progressBar = uploadForm.querySelector('[data-upload-progress-bar]');
        const fileArea = uploadForm.querySelector('[data-video-file-area]');
        const filePrimary = uploadForm.querySelector('[data-upload-file-primary]');
        const fileSecondary = uploadForm.querySelector('[data-upload-file-secondary]');
        const bulkFileMeta = uploadForm.querySelector('[data-bulk-file-meta]');
        const fileClear = uploadForm.querySelector('[data-upload-file-clear]');
        const completeDialog = uploadForm.parentElement?.querySelector(':scope > [data-upload-complete-dialog]');
        const thumbnailSelector = uploadForm.querySelector('[data-thumbnail-selector]');
        const thumbnailPreview = uploadForm.querySelector('[data-thumbnail-preview]');
        const thumbnailScrubber = uploadForm.querySelector('[data-thumbnail-scrubber]');
        const thumbnailTime = uploadForm.querySelector('[data-thumbnail-time]');
        let durationState = { checking: false, tooShort: false, detectionFailed: false, seconds: null };
        let thumbnailObjectUrl = null;
        let uploadStage = 'waiting';
        let currentVideoId = null;
        let failureLogUrl = uploadForm.dataset.uploadLogUrl || null;
        let latestPercent = 0;
        let uploadActive = false;

        const formatDuration = (totalSeconds) => {
            const total = Math.max(0, Math.round(Number(totalSeconds) || 0));
            const hours = Math.floor(total / 3600);
            const minutes = Math.floor((total % 3600) / 60);
            const seconds = total % 60;
            const parts = [];
            if (hours) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
            if (minutes) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
            if (seconds || !parts.length) parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
            return parts.join(' ');
        };
        const formatBytes = (bytes) => {
            const value = Number(bytes) || 0;
            if (value < 1024) return `${value} B`;
            const units = ['KB', 'MB', 'GB', 'TB']; let amount = value / 1024; let unit = units[0];
            for (let index = 1; index < units.length && amount >= 1024; index++) { amount /= 1024; unit = units[index]; }
            return `${amount >= 100 ? amount.toFixed(0) : amount.toFixed(1)} ${unit}`;
        };
        const formatClock = (totalSeconds) => {
            const total = Math.max(0, Math.round(Number(totalSeconds) || 0));
            const hours = Math.floor(total / 3600);
            const minutes = Math.floor((total % 3600) / 60);
            const seconds = total % 60;
            return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`;
        };
        const releaseThumbnailSource = () => {
            if (thumbnailObjectUrl) URL.revokeObjectURL(thumbnailObjectUrl);
            thumbnailObjectUrl = null;
            if (thumbnailPreview instanceof HTMLVideoElement) { thumbnailPreview.removeAttribute('src'); thumbnailPreview.load(); }
        };
        const syncThumbnailFrame = () => {
            if (!(thumbnailScrubber instanceof HTMLInputElement) || !(thumbnailPreview instanceof HTMLVideoElement)) return;
            const seconds = Math.max(0, Number(thumbnailScrubber.value || 0) / 1000);
            if (thumbnailTime instanceof HTMLOutputElement) thumbnailTime.textContent = `${formatClock(seconds)} of ${formatClock(durationState.seconds)}`;
            if (thumbnailPreview.readyState >= 1 && Number.isFinite(thumbnailPreview.duration)) {
                try { thumbnailPreview.currentTime = Math.min(seconds, Math.max(0, thumbnailPreview.duration - 0.05)); } catch (_) {}
            }
        };
        thumbnailScrubber?.addEventListener('input', syncThumbnailFrame);
        thumbnailPreview?.addEventListener('loadedmetadata', syncThumbnailFrame);

        const logUploadIssue = (eventType, stage, technicalMessage, file) => {
            if (!failureLogUrl) return;
            fetch(failureLogUrl, {
                method: 'POST', keepalive: true,
                headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': uploadForm.querySelector('[name="_token"]')?.value || '' },
                body: JSON.stringify({ video_id: currentVideoId, event_type: eventType, stage, technical_message: String(technicalMessage || '').slice(0, 10000), file_name: file?.name, file_size: file?.size, file_type: file?.type, progress: latestPercent }),
            }).catch(() => {});
        };

        const setProgress = (message, percent = latestPercent, state = 'active') => {
            latestPercent = Math.max(0, Math.min(100, Number(percent) || 0));
            progress.hidden = false;
            progress.classList.toggle('is-active', state === 'active');
            progress.classList.toggle('is-complete', state === 'complete');
            progress.classList.toggle('is-error', state === 'error');
            progress.setAttribute('aria-valuenow', String(latestPercent));
            progressBar.style.width = `${latestPercent}%`;
            showUploadStatus(message, state === 'error');
        };

        completeDialog?.querySelector('[data-upload-another]')?.addEventListener('click', () => window.location.reload());
        window.addEventListener('pagehide', () => {
            releaseThumbnailSource();
            if (uploadActive) logUploadIssue('incomplete', 'browser_closed_or_navigated', 'The page was closed or navigated away from before the upload completed.', uploadForm._bpFile || fileInput?.files?.[0]);
        });

        const showUploadStatus = (message, failed = false) => {
            statuses.forEach((status) => {
                if (!(status instanceof HTMLElement)) return;
                status.textContent = message;
                status.classList.toggle('is-error', failed);
            });
        };
        const showFileStatus = (message, failed = false) => {
            const target = fileSecondary instanceof HTMLElement ? fileSecondary : bulkFileMeta;
            if (target instanceof HTMLElement) target.textContent = message;
            fileArea?.classList.toggle('is-error', failed);
            uploadForm.querySelector('.bulk-video-file-summary')?.classList.toggle('is-error', failed);
        };
        const shortDialog = uploadForm.querySelector('[data-short-video-dialog]');
        const showTooShortDialog = (seconds) => {
            const message = `Your selected video is too short (${formatDuration(seconds)}). It needs to be 1 min 30 sec (i.e. 90 seconds) long to be eligible. Please pick another video.`;
            showFileStatus(message, true);
            if (!(shortDialog instanceof HTMLDialogElement)) return;
            const messageNode = shortDialog.querySelector('[data-short-video-message]');
            if (messageNode instanceof HTMLElement) messageNode.textContent = message;
            if (!shortDialog.open) shortDialog.showModal();
        };
        shortDialog?.querySelector('[data-short-video-pick]')?.addEventListener('click', () => {
            if (shortDialog instanceof HTMLDialogElement) shortDialog.close();
            if (fileInput instanceof HTMLInputElement) { fileInput.value = ''; updateFileState(); fileInput.click(); return; }
            uploadForm.closest('.bulk-video-card')?.querySelector('[data-bulk-remove]')?.click();
            const bulkPicker = document.querySelector('[data-bulk-file-picker]');
            if (bulkPicker instanceof HTMLInputElement) { bulkPicker.value = ''; bulkPicker.click(); }
        });

        const affiliateHelp = uploadForm.querySelector('[data-affiliate-help]');
        uploadForm.bpSyncAffiliate = () => {
            const selected = uploadForm.querySelector('[name="contains_store_products"]:checked');
            if (affiliateHelp instanceof HTMLElement) affiliateHelp.hidden = selected?.value !== '0';
        };
        uploadForm.querySelectorAll('[name="contains_store_products"]').forEach((radio) => radio.addEventListener('change', uploadForm.bpSyncAffiliate));
        uploadForm.bpSyncAffiliate();

        const prefillButton = uploadForm.querySelector('[data-upload-prefill-last]');
        const prefillPayload = uploadForm.querySelector('[data-upload-last-video]');
        prefillButton?.addEventListener('click', () => {
            let details = null;
            try { details = JSON.parse(prefillPayload?.textContent || 'null'); } catch (_) {}
            if (!details) return showUploadStatus('Your previous video details could not be loaded. Refresh and try again.', true);
            const setRadio = (name, value) => {
                uploadForm.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`).forEach((input) => { input.checked = String(input.value) === String(value); });
            };
            if (details.video_type != null) setRadio('video_type', details.video_type);
            if (details.production_type != null) setRadio('production_type', details.production_type);
            if (details.contains_store_products != null) setRadio('contains_store_products', details.contains_store_products ? '1' : '0');
            if (details.has_tattoo != null) setRadio('has_tattoo', details.has_tattoo ? '1' : '0');
            if (details.has_piercing != null) setRadio('has_piercing', details.has_piercing ? '1' : '0');
            Object.entries(details.attributes || {}).forEach(([field, values]) => {
                const selectedValues = Array.isArray(values) ? values.map(String) : [];
                uploadForm.querySelectorAll(`input[name="${CSS.escape(field)}[]"]`).forEach((input) => { input.checked = selectedValues.includes(String(input.value)); });
            });
            uploadForm.querySelector('[data-token-type="categories"]')?.bpTokenPicker?.set(details.categories || []);
            uploadForm.querySelector('[data-token-type="tags"]')?.bpTokenPicker?.set(details.tags || []);
            uploadForm.bpSyncAffiliate?.();
            showUploadStatus('Video details copied from your last published video. Review them before continuing.');
        });

        const updateFileState = async () => {
            const file = uploadForm._bpFile || fileInput?.files?.[0];
            durationState = { checking: Boolean(file), tooShort: false, detectionFailed: false, seconds: null };
            fileArea?.classList.toggle('has-file', Boolean(file));
            if (filePrimary instanceof HTMLElement) filePrimary.textContent = file ? file.name : 'Drag and drop your video here';
            if (fileSecondary instanceof HTMLElement) fileSecondary.textContent = file ? `${(file.size / 1024 / 1024).toFixed(1)} MB selected` : 'or click to browse your files';
            if (fileClear instanceof HTMLButtonElement) fileClear.hidden = !file;
            releaseThumbnailSource();
            if (thumbnailSelector instanceof HTMLElement) thumbnailSelector.hidden = !file;
            if (thumbnailScrubber instanceof HTMLInputElement) { thumbnailScrubber.disabled = true; thumbnailScrubber.min = '0'; thumbnailScrubber.max = '0'; thumbnailScrubber.value = '0'; }
            if (thumbnailTime instanceof HTMLOutputElement) thumbnailTime.textContent = '0:00';
            if (!file) { fileArea?.classList.remove('is-error'); uploadForm.querySelector('.bulk-video-file-summary')?.classList.remove('is-error'); return; }
            showFileStatus('Checking the selected video duration…');
            const source = URL.createObjectURL(file);
            thumbnailObjectUrl = source;
            if (thumbnailPreview instanceof HTMLVideoElement) { thumbnailPreview.src = source; thumbnailPreview.load(); }
            const probe = document.createElement('video');
            probe.preload = 'metadata';
            const cleanup = () => { probe.removeAttribute('src'); };
            const detectionFailed = () => {
                durationState = { checking: false, tooShort: false, detectionFailed: true, seconds: null };
                cleanup();
                if (thumbnailTime instanceof HTMLOutputElement) thumbnailTime.textContent = 'Thumbnail selection unavailable for this file';
                showFileStatus('We could not detect this video’s duration in your browser. You may continue, but the minimum permitted duration is 1 minute 30 seconds (90 seconds).');
            };
            const timer = window.setTimeout(detectionFailed, 12000);
            probe.addEventListener('loadedmetadata', () => {
                window.clearTimeout(timer);
                const detected = Number.isFinite(probe.duration) && probe.duration > 0;
                const exactDuration = detected ? probe.duration : null;
                const duration = detected ? Math.round(exactDuration) : null;
                durationState = { checking: false, tooShort: detected && exactDuration < 90, detectionFailed: !detected, seconds: duration };
                cleanup();
                if (detected && thumbnailScrubber instanceof HTMLInputElement) {
                    thumbnailScrubber.disabled = false;
                    thumbnailScrubber.max = String(Math.max(0, Math.round(exactDuration * 1000)));
                    thumbnailScrubber.value = String(Math.round(exactDuration * 250));
                    syncThumbnailFrame();
                }
                if (durationState.tooShort) showTooShortDialog(duration);
                else if (durationState.detectionFailed) showFileStatus('We could not detect this video’s duration in your browser. You may continue, but the minimum permitted duration is 1 minute 30 seconds (90 seconds).');
                else showFileStatus(`Video selected and ready to upload (${formatDuration(duration)}).`);
            }, { once: true });
            probe.addEventListener('error', () => { window.clearTimeout(timer); detectionFailed(); }, { once: true });
            probe.src = source;
        };

        fileInput?.addEventListener('change', updateFileState);
        fileClear?.addEventListener('click', () => {
            if (fileInput instanceof HTMLInputElement) fileInput.value = '';
            updateFileState();
        });
        uploadForm.querySelector('[data-upload-disclaimer]')?.addEventListener('click', () => {
            const description = uploadForm.querySelector('[data-upload-description]');
            const template = uploadForm.querySelector('[data-upload-disclaimer-template]');
            if (!(description instanceof HTMLTextAreaElement) || !(template instanceof HTMLTemplateElement)) return;
            const disclaimer = template.content.textContent.trim();
            const editor = description.id && window.tinymce ? window.tinymce.get(description.id) : null;
            const currentText = editor ? editor.getContent({ format: 'text' }) : description.value;
            if (currentText.includes(disclaimer)) return showUploadStatus('The template disclaimer is already in the description.');
            if (currentText.length + disclaimer.length + 2 > 700) return showUploadStatus('The disclaimer will not fit within the 700 character description limit. Shorten your description first.', true);
            if (editor) {
                editor.setContent(`${editor.getContent()}${currentText.trim() ? '<p></p>' : ''}<p>${disclaimer.replace(/[<>&]/g, (value) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[value]))}</p>`);
                editor.focus();
                editor.fire('input');
            } else {
                description.value = `${description.value.trim()}${description.value.trim() ? '\n\n' : ''}${disclaimer}`;
                description.focus();
                description.setSelectionRange(description.value.length, description.value.length);
                description.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        uploadForm.bpValidateDetails = (step = 'all') => {
            window.tinymce?.triggerSave();
            const description = uploadForm.querySelector('[data-upload-description]');
            if ((step === 'all' || step === 2) && description instanceof HTMLTextAreaElement) {
                const holder = document.createElement('div'); holder.innerHTML = description.value;
                const length = (holder.textContent || '').trim().length;
                if (length > 700) { showUploadStatus(`The video description is ${length} characters. Shorten it to 700 characters or fewer.`, true); return false; }
            }
            for (const picker of step === 'all' || step === 3 ? uploadForm.querySelectorAll('[data-token-required="1"]') : []) {
                if (!picker.bpTokenPicker?.get().length) {
                    const label = picker.querySelector('label')?.textContent?.replace(/\s+/g, ' ').trim() || 'This field';
                    showUploadStatus(`${label.replace(/\(.*$/, '').trim()} is required. Select at least one option.`, true);
                    picker.querySelector('[data-token-input]')?.focus(); return false;
                }
            }
            for (const group of step === 'all' || step === 4 ? uploadForm.querySelectorAll('[data-checkbox-required="1"]') : []) {
                if (!group.querySelector('input[type="checkbox"]:checked')) {
                    showUploadStatus('Select at least one performer orientation to continue.', true);
                    group.querySelector('input[type="checkbox"]')?.focus(); return false;
                }
            }
            return true;
        };

        uploadForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            window.tinymce?.triggerSave();
            const file = uploadForm._bpFile || fileInput?.files?.[0];
            const maxBytes = Number(uploadForm.dataset.maxBytes || 0);

            if (!file) return showUploadStatus('Choose a video file first.', true);
            if (durationState.checking) { showFileStatus('Please wait while we check the selected video duration.', true); return; }
            if (durationState.tooShort) return showTooShortDialog(durationState.seconds);
            if (!uploadForm.bpValidateDetails()) return;
            if (maxBytes > 0 && file.size > maxBytes) return showUploadStatus('This file exceeds the 20 GB upload limit.', true);
            if (!window.tus?.Upload) return showUploadStatus('The uploader could not load. Refresh and try again.', true);

            if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true;
            uploadStage = 'creating_post';
            uploadActive = true;
            setProgress('Creating post for video...', 2);

            try {
                const payload = new FormData(uploadForm);
                payload.set('file_name', file.name);
                payload.set('file_type', file.type);
                payload.set('file_size', String(file.size));
                const response = await fetch(uploadForm.action, {
                    method: 'POST',
                    body: payload,
                    headers: { Accept: 'application/json' },
                });
                const credentials = await response.json();
                if (!response.ok) throw new Error(credentials.message || 'The upload could not be prepared.');

                currentVideoId = credentials.localVideoId || null;
                failureLogUrl = credentials.failureLogUrl || null;
                uploadStage = 'starting_upload';
                setProgress('Starting upload...', 4);
                const upload = new window.tus.Upload(file, {
                    endpoint: credentials.endpoint,
                    retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
                    headers: {
                        AuthorizationSignature: credentials.signature,
                        AuthorizationExpire: String(credentials.expirationTime),
                        VideoId: credentials.videoId,
                        LibraryId: String(credentials.libraryId),
                    },
                    metadata: { filetype: file.type, title: file.name },
                    onError: (error) => {
                        uploadActive = false;
                        if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
                        logUploadIssue('failure', uploadStage, error?.message || 'The resumable upload was interrupted.', file);
                        setProgress('Something went wrong, please try again.', latestPercent, 'error');
                        uploadForm.dispatchEvent(new CustomEvent('bp-upload-finished', { detail: { success: false } }));
                    },
                    onProgress: (uploaded, total) => {
                        const percent = total > 0 ? Math.round((uploaded / total) * 100) : 0;
                        uploadStage = uploaded >= total ? 'finishing_upload' : 'uploading';
                        setProgress(uploaded >= total ? 'Finishing upload...' : `Uploading ${formatBytes(uploaded)} of ${formatBytes(total)} (${percent}% complete)...`, percent);
                    },
                    onSuccess: async () => {
                        uploadStage = 'updating_server'; setProgress('Updating server...', 100);
                        try {
                            const complete = await fetch(credentials.completeUrl, { method: 'POST', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': uploadForm.querySelector('[name="_token"]').value } });
                            if (!complete.ok) throw new Error(`Completion request returned HTTP ${complete.status}.`);
                            setProgress('Done! Your video has been sent to moderation.', 100, 'complete');
                            uploadActive = false;
                            if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
                            if (completeDialog instanceof HTMLDialogElement && !completeDialog.open) completeDialog.showModal();
                            uploadForm.dispatchEvent(new CustomEvent('bp-upload-finished', { detail: { success: true } }));
                        } catch (error) {
                            uploadActive = false;
                            logUploadIssue('incomplete', uploadStage, error instanceof Error ? error.message : 'Completion request failed.', file);
                            setProgress('Something went wrong, please try again.', 100, 'error');
                            if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
                            uploadForm.dispatchEvent(new CustomEvent('bp-upload-finished', { detail: { success: false } }));
                        }
                    },
                });

                const previous = await upload.findPreviousUploads();
                if (previous.length > 0) upload.resumeFromPreviousUpload(previous[0]);
                upload.start();
            } catch (error) {
                uploadActive = false;
                if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
                logUploadIssue('failure', uploadStage, error instanceof Error ? error.message : 'The upload could not start.', file);
                setProgress('Something went wrong, please try again.', latestPercent, 'error');
                uploadForm.dispatchEvent(new CustomEvent('bp-upload-finished', { detail: { success: false } }));
            }
        });
        uploadForm.bpStartUpload = () => uploadForm.requestSubmit();
        uploadForm.bpCanAdvanceFile = () => {
            if (durationState.checking) { showFileStatus('Please wait while we check the selected video duration.', true); return false; }
            if (durationState.tooShort) { showTooShortDialog(durationState.seconds); return false; }
            return true;
        };
        updateFileState();
    };
    document.querySelectorAll('[data-video-upload]').forEach(setupUploadForm);

    document.querySelectorAll('[data-upload-wizard]').forEach((wizard) => {
        const steps = [...wizard.querySelectorAll('[data-upload-step]')]; const indicators = [...wizard.querySelectorAll('[data-upload-step-indicator]')];
        const back = wizard.querySelector('[data-upload-back]'); const next = wizard.querySelector('[data-upload-next]'); let current = 0;
        const show = () => { steps.forEach((step, index) => { step.hidden = index !== current; }); indicators.forEach((item, index) => item.classList.toggle('is-active', index <= current)); back.hidden = current === 0; next.hidden = current === steps.length - 1; };
        next?.addEventListener('click', () => { window.tinymce?.triggerSave(); const invalid = steps[current].querySelector(':invalid'); if (invalid) return invalid.reportValidity(); if (current === 1 && wizard.bpCanAdvanceFile && !wizard.bpCanAdvanceFile()) return; if ((current === 2 || current === 3 || current === 4) && wizard.bpValidateDetails && !wizard.bpValidateDetails(current)) return; current = Math.min(steps.length - 1, current + 1); show(); window.scrollTo({ top: wizard.offsetTop - 110, behavior: 'smooth' }); });
        back?.addEventListener('click', () => { current = Math.max(0, current - 1); show(); }); show();
    });

    const bulkPicker = document.querySelector('[data-bulk-file-picker]'); const bulkList = document.querySelector('[data-bulk-upload-list]'); const bulkTemplate = document.querySelector('[data-bulk-card-template]');
    if (bulkPicker instanceof HTMLInputElement && bulkList instanceof HTMLElement && bulkTemplate instanceof HTMLTemplateElement) {
        const bulkActions = document.querySelector('[data-bulk-actions]'); const bulkStart = document.querySelector('[data-bulk-start]'); const bulkSummary = document.querySelector('[data-bulk-summary]');
        bulkPicker.addEventListener('change', () => {
            bulkList.innerHTML = '';
            [...bulkPicker.files].forEach((file, index) => {
                const fragment = bulkTemplate.content.cloneNode(true); const card = fragment.querySelector('.bulk-video-card'); const form = fragment.querySelector('[data-video-upload]');
                form._bpFile = file; card.querySelector('[data-bulk-card-title]').textContent = `Video ${index + 1}: ${file.name}`; card.querySelector('[data-bulk-card-meta]').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
                card.querySelector('[data-bulk-file-name]').textContent = file.name; card.querySelector('[data-bulk-file-meta]').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB selected`;
                form.querySelector('[name="title"]').value = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
                card.querySelector('[data-bulk-remove]').addEventListener('click', () => { card.remove(); bulkActions.hidden = !bulkList.querySelector('[data-video-upload]'); });
                bulkList.append(fragment); setupUploadForm(form); window.bpInitUploadEditors?.(card);
            });
            bulkActions.hidden = !bulkPicker.files.length;
        });
        bulkList.addEventListener('click', (event) => {
            const sourceButton = event.target.closest('[data-apply-to-all]'); if (!sourceButton) return;
            const source = sourceButton.closest('form'); const targets = [...bulkList.querySelectorAll('form')].filter((form) => form !== source);
            targets.forEach((target) => {
                source.querySelectorAll('input,textarea').forEach((field) => {
                    if (!field.name || ['_token','title','uploader_confirmation','thumbnail_time_ms'].includes(field.name) || field.type === 'hidden') return;
                    const matches = target.querySelectorAll(`[name="${CSS.escape(field.name)}"]`);
                    matches.forEach((match) => { if (field.type === 'checkbox' || field.type === 'radio') { if (match.value === field.value) match.checked = field.checked; } else match.value = field.value; });
                });
                source.querySelectorAll('[data-token-picker]').forEach((picker) => { const other = target.querySelector(`[data-token-type="${picker.dataset.tokenType}"]`); other?.bpTokenPicker?.set(picker.bpTokenPicker.get()); });
                target.bpSyncAffiliate?.();
            });
            if (bulkSummary) bulkSummary.textContent = 'Details applied to the other selected videos.';
        });
        bulkStart?.addEventListener('click', async () => {
            const forms = [...bulkList.querySelectorAll('form')]; bulkStart.disabled = true; let completed = 0;
            for (const form of forms) {
                window.tinymce?.triggerSave();
                if (!form.reportValidity() || !form.bpValidateDetails?.()) { bulkSummary.textContent = `Check the required fields for video ${completed + 1}.`; break; }
                bulkSummary.textContent = `Uploading video ${completed + 1} of ${forms.length}…`;
                const success = await new Promise((resolve) => { form.addEventListener('bp-upload-finished', (event) => resolve(Boolean(event.detail.success)), { once: true }); form.bpStartUpload(); });
                if (!success) { bulkSummary.textContent = `Video ${completed + 1} needs attention before the remaining uploads can continue.`; break; } completed++;
            }
            if (completed === forms.length) { bulkSummary.textContent = `All ${completed} videos were uploaded and sent to moderation.`; const dialog = document.querySelector('[data-bulk-complete-dialog]'); if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal(); } bulkStart.disabled = false;
        });
        document.querySelector('[data-bulk-complete-dialog] [data-upload-another]')?.addEventListener('click', () => window.location.reload());
    }

    document.querySelectorAll('[data-video-report-form]').forEach((form) => {
        if (!(form instanceof HTMLFormElement)) return;
        const reason = form.querySelector('[data-video-report-reason]');
        const details = form.querySelector('[data-video-report-details]');
        if (!(reason instanceof HTMLSelectElement) || !(details instanceof HTMLTextAreaElement)) return;
        const syncReportRequirements = () => {
            details.required = reason.value !== 'thumbnail_missing';
            details.setAttribute('aria-required', String(details.required));
        };
        reason.addEventListener('change', syncReportRequirements);
        syncReportRequirements();
    });

    document.querySelectorAll('[data-recaptcha-v3]').forEach((form) => {
        if (!(form instanceof HTMLFormElement)) return;
        form.addEventListener('submit', (event) => {
            if (form.dataset.recaptchaComplete === '1') return;
            event.preventDefault();
            const key = form.dataset.recaptchaKey;
            const action = form.dataset.recaptchaAction;
            const input = form.querySelector('[name="g-recaptcha-response"]');
            const button = form.querySelector('button[type="submit"]');
            if (!key || !action || !(input instanceof HTMLInputElement) || !window.grecaptcha) return;
            if (button instanceof HTMLButtonElement) button.disabled = true;
            window.grecaptcha.ready(() => window.grecaptcha.execute(key, { action }).then((token) => {
                input.value = token;
                form.dataset.recaptchaComplete = '1';
                form.requestSubmit();
            }).catch(() => {
                if (button instanceof HTMLButtonElement) button.disabled = false;
            }));
        });
    });

    const advancedFilterToggle = document.querySelector('[data-advanced-filter-toggle]');
    const advancedFilterOptions = document.querySelector('[data-advanced-filter-options]');
    if (advancedFilterToggle instanceof HTMLButtonElement && advancedFilterOptions instanceof HTMLElement) {
        advancedFilterToggle.addEventListener('click', () => {
            const open = advancedFilterOptions.hidden;
            advancedFilterOptions.hidden = !open;
            advancedFilterToggle.setAttribute('aria-expanded', String(open));
            const label = advancedFilterToggle.querySelector('span');
            const icon = advancedFilterToggle.querySelector('i');
            const state = document.querySelector('[data-advanced-filter-state]');
            if (state instanceof HTMLInputElement) state.value = open ? 'open' : 'closed';
            if (label) label.textContent = open ? (advancedFilterToggle.dataset.openLabel || 'Hide Video Filters') : (advancedFilterToggle.dataset.closedLabel || 'Show Video Filters');
            if (icon) { icon.classList.toggle('fa-chevron-up', open); icon.classList.toggle('fa-chevron-down', !open); }
        });
    }

    const videoFilterForm = document.querySelector('[data-video-filters]');
    const videoResults = document.querySelector('[data-video-results]');
    const infiniteStatus = document.querySelector('[data-infinite-scroll]');
    let loadingVideos = false;
    const refreshVideoPreviews = () => setPreviewSetting(previewEnabled);
    const fetchVideos = async (url, append = false) => {
        if (!(videoResults instanceof HTMLElement) || loadingVideos) return;
        loadingVideos = true;
        infiniteStatus?.removeAttribute('hidden');
        try {
            const response = await fetch(url, { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
            if (!response.ok) throw new Error('Videos could not be loaded.');
            const result = await response.json();
            if (append) videoResults.insertAdjacentHTML('beforeend', result.html || '');
            else videoResults.innerHTML = result.html || '<div class="empty-state"><h2>No videos found</h2><p>Try changing or resetting the filters.</p></div>';
            if (infiniteStatus instanceof HTMLElement) {
                infiniteStatus.dataset.nextUrl = result.next_url || '';
                infiniteStatus.hidden = !result.next_url;
            }
            refreshVideoPreviews();
        } catch (_) {
            if (infiniteStatus instanceof HTMLElement) {
                infiniteStatus.innerHTML = '<button class="button button--secondary" type="button">Try loading more videos</button>';
                infiniteStatus.hidden = false;
            }
        } finally { loadingVideos = false; }
    };
    if (videoFilterForm instanceof HTMLFormElement && videoResults instanceof HTMLElement) {
        videoFilterForm.querySelectorAll('input[name="sort"]').forEach((radio) => radio.addEventListener('change', () => {
            const filterState = videoFilterForm.querySelector('[data-advanced-filter-state]');
            if (filterState instanceof HTMLInputElement) filterState.value = 'closed';
            if (radio.value === 'random') {
                const seed = videoFilterForm.querySelector('input[name="seed"]');
                if (seed instanceof HTMLInputElement) seed.value = String(Date.now() % 1000000000);
            }
            videoFilterForm.requestSubmit();
        }));
    }
    if (infiniteStatus instanceof HTMLElement && 'IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && infiniteStatus.dataset.nextUrl) fetchVideos(infiniteStatus.dataset.nextUrl, true);
        }, { rootMargin: '500px 0px' }).observe(infiniteStatus);
        infiniteStatus.addEventListener('click', () => { if (infiniteStatus.dataset.nextUrl) fetchVideos(infiniteStatus.dataset.nextUrl, true); });
    }

    const viewTracker = document.querySelector('[data-video-view-tracker]');
    if (viewTracker instanceof HTMLElement) {
        const visitorStorageKey = 'bp-video-view-visitor';
        let visitorId = localStorage.getItem(visitorStorageKey);
        if (!visitorId) {
            visitorId = window.crypto?.randomUUID?.() || Array.from(window.crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
            localStorage.setItem(visitorStorageKey, visitorId);
        }
        let sent = false;
        const recordView = async () => {
            if (sent || document.visibilityState !== 'visible') return;
            sent = true;
            try {
                const response = await fetch(viewTracker.dataset.videoViewTracker, {
                    method: 'POST', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '', 'X-BP-Visitor': visitorId },
                });
                if (!response.ok) return;
                const result = await response.json();
                document.querySelectorAll('[data-video-view-count]').forEach((node) => { node.textContent = Number(result.views || 0).toLocaleString(); });
            } catch (_) {}
        };
        window.setTimeout(recordView, 8000);
    }

    const accountTabs = [...document.querySelectorAll('[data-account-tab]')];
    const accountPanels = [...document.querySelectorAll('[data-account-panel]')];
    const showAccountPanel = (name, updateHash = true) => {
        if (!accountPanels.some((panel) => panel.dataset.accountPanel === name)) name = 'dashboard';
        accountTabs.forEach((tab) => {
            const active = tab.dataset.accountTab === name;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', String(active));
        });
        accountPanels.forEach((panel) => { panel.hidden = panel.dataset.accountPanel !== name; });
        if (updateHash) history.replaceState(null, '', name === 'dashboard' ? location.pathname : `#${name}`);
    };
    accountTabs.forEach((tab) => tab.addEventListener('click', () => showAccountPanel(tab.dataset.accountTab)));
    if (accountTabs.length) showAccountPanel(location.hash.replace('#', '') || new URLSearchParams(location.search).get('section') || 'dashboard', false);

    const settingsTabs = [...document.querySelectorAll('[data-settings-tab]')];
    const settingsPanels = [...document.querySelectorAll('[data-settings-panel]')];
    const settingsSave = document.querySelector('[data-settings-save]');
    const dangerZone = document.querySelector('.account-danger-zone');
    const showSettingsPanel = (name, updateHash = true) => {
        if (!settingsPanels.some((panel) => panel.dataset.settingsPanel === name)) name = 'profile';
        settingsTabs.forEach((tab) => {
            const active = tab.dataset.settingsTab === name;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', String(active));
        });
        settingsPanels.forEach((panel) => { panel.hidden = panel.dataset.settingsPanel !== name; });
        if (settingsSave) settingsSave.hidden = name === 'security';
        if (dangerZone) dangerZone.hidden = name !== 'security';
        if (updateHash) history.replaceState(null, '', `#${name}`);
    };
    settingsTabs.forEach((tab) => tab.addEventListener('click', () => showSettingsPanel(tab.dataset.settingsTab)));
    if (settingsTabs.length) showSettingsPanel(location.hash.replace('#', '') || 'profile', false);

    document.querySelectorAll('.admin-top-menu details').forEach((details) => {
        details.addEventListener('toggle', () => {
            if (!details.open) return;
            document.querySelectorAll('.admin-top-menu details[open]').forEach((other) => {
                if (other !== details) other.open = false;
            });
        });
    });
    const adminMenu = document.querySelector('[data-admin-menu]');
    const adminMenuToggle = document.querySelector('[data-admin-menu-toggle]');
    const closeAdminMenu = () => {
        adminMenu?.classList.remove('is-open');
        adminMenuToggle?.setAttribute('aria-expanded', 'false');
    };
    adminMenuToggle?.addEventListener('click', () => {
        const open = !adminMenu?.classList.contains('is-open');
        adminMenu?.classList.toggle('is-open', open);
        adminMenuToggle.setAttribute('aria-expanded', String(open));
    });
    document.querySelector('[data-admin-menu-close]')?.addEventListener('click', closeAdminMenu);

    document.querySelectorAll('[data-site-notice]').forEach((notice) => {
        const key = `bp-site-notice-${notice.dataset.siteNotice}`;
        if (localStorage.getItem(key) === 'dismissed') notice.classList.add('is-dismissed');
        notice.querySelector('[data-dismiss-site-notice]')?.addEventListener('click', () => {
            localStorage.setItem(key, 'dismissed');
            notice.classList.add('is-dismissed');
        });
    });

    document.querySelectorAll('[data-rejection-preset]').forEach((preset) => {
        preset.addEventListener('change', () => {
            const reason = preset.closest('form')?.querySelector('[data-rejection-reason]');
            if (!(reason instanceof HTMLTextAreaElement) || !preset.value || preset.value === 'other') return;
            reason.value = preset.value;
        });
    });

    document.querySelectorAll('[data-lazy-video-preview]').forEach((button) => button.addEventListener('click', () => {
        const frame = document.createElement('iframe');
        frame.src = button.dataset.previewUrl || '';
        frame.title = button.dataset.previewTitle || 'Video moderation preview';
        frame.allow = 'autoplay; fullscreen; picture-in-picture';
        frame.allowFullscreen = true;
        button.closest('.moderation-card__preview')?.replaceChildren(frame);
    }, { once: true }));

    document.querySelectorAll('[data-moderation-edit]').forEach((button) => button.addEventListener('click', () => {
        const editor = button.closest('.moderation-card')?.querySelector(`[data-moderation-editor="${CSS.escape(button.dataset.moderationEdit || '')}"]`);
        if (!(editor instanceof HTMLElement)) return;
        editor.hidden = !editor.hidden;
        button.setAttribute('aria-expanded', String(!editor.hidden));
        if (!editor.hidden) editor.querySelector('input,textarea,select')?.focus();
    }));

    document.querySelectorAll('[data-description-toggle]').forEach((button) => button.addEventListener('click', () => {
        const section = button.closest('.moderation-description-summary');
        const shortText = section?.querySelector('[data-description-short]');
        const fullText = section?.querySelector('[data-description-full]');
        if (!(shortText instanceof HTMLElement) || !(fullText instanceof HTMLElement)) return;
        const expanded = button.getAttribute('aria-expanded') === 'true';
        shortText.hidden = !expanded;
        fullText.hidden = expanded;
        button.setAttribute('aria-expanded', String(!expanded));
        const label = button.querySelector('span');
        const icon = button.querySelector('i');
        if (label) label.textContent = expanded ? 'View full description' : 'Hide full description';
        if (icon) {
            icon.classList.toggle('fa-chevron-down', expanded);
            icon.classList.toggle('fa-chevron-up', !expanded);
        }
    }));

    const moderationSuccessDialog = document.querySelector('[data-moderation-success-dialog]');
    if (moderationSuccessDialog instanceof HTMLDialogElement && !moderationSuccessDialog.open) moderationSuccessDialog.showModal();
    const commentDeletedDialog = document.querySelector('[data-comment-deleted-dialog]');
    if (commentDeletedDialog instanceof HTMLDialogElement && !commentDeletedDialog.open) commentDeletedDialog.showModal();
    document.querySelectorAll('[data-dialog-close]').forEach((button) => button.addEventListener('click', () => button.closest('dialog')?.close()));

    document.querySelectorAll('[data-rejection-toggle]').forEach((button) => button.addEventListener('click', () => {
        const panel = button.closest('form')?.querySelector('[data-rejection-panel]');
        if (!(panel instanceof HTMLElement)) return;
        panel.hidden = !panel.hidden;
        button.setAttribute('aria-expanded', String(!panel.hidden));
        if (!panel.hidden) panel.querySelector('input[type="radio"]')?.focus();
    }));

    document.querySelectorAll('[data-rejection-panel]').forEach((panel) => {
        const custom = panel.querySelector('[data-rejection-custom]');
        const sync = () => {
            const other = panel.querySelector('[name="rejection_reason_choice"]:checked')?.value === 'other';
            if (custom instanceof HTMLElement) custom.hidden = !other;
        };
        panel.querySelectorAll('[name="rejection_reason_choice"]').forEach((radio) => radio.addEventListener('change', sync));
        sync();
    });

    document.querySelectorAll('[data-community-video-overlay]').forEach((overlay) => window.setTimeout(() => overlay.remove(), 3825));

    const mobileSearchToggle = document.querySelector('[data-mobile-search-toggle]');
    const mobileSearchForm = document.querySelector('.header-search-form');
    const closeMobileSearch = () => {
        mobileSearchForm?.classList.remove('is-open');
        mobileSearchToggle?.setAttribute('aria-expanded', 'false');
    };
    mobileSearchToggle?.addEventListener('click', () => {
        const open = !mobileSearchForm?.classList.contains('is-open');
        mobileSearchForm?.classList.toggle('is-open', open);
        mobileSearchToggle.setAttribute('aria-expanded', String(open));
        if (open) window.setTimeout(() => mobileSearchForm?.querySelector('input[type="search"]')?.focus(), 30);
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMobileSearch(); });
    document.addEventListener('click', (event) => {
        if (!mobileSearchForm?.classList.contains('is-open') || mobileSearchForm.contains(event.target) || mobileSearchToggle?.contains(event.target)) return;
        closeMobileSearch();
    });
    document.querySelectorAll('[data-share-video]').forEach((button) => button.addEventListener('click', async () => {
        const url = button.dataset.shareUrl || location.href;
        try { if (navigator.share) await navigator.share({ title: button.dataset.shareTitle || document.title, url }); else { await navigator.clipboard.writeText(url); button.textContent = 'Link copied'; } } catch (_) {}
    }));
    document.querySelectorAll('[data-copy-text]').forEach((button) => button.addEventListener('click', async () => { try { await navigator.clipboard.writeText(button.dataset.copyText || ''); button.textContent = 'Copied'; } catch (_) {} }));

    // Keep dense staff tables readable on small screens. Header text is copied
    // onto each data cell so CSS can present rows as labelled cards without
    // losing context or hiding any administrative fields.
    document.querySelectorAll('.admin-body table').forEach((table) => {
        if (!(table instanceof HTMLTableElement)) return;
        const headerRow = table.tHead?.rows[0];
        if (!headerRow) return;
        const labels = Array.from(headerRow.cells, (cell, index) => cell.textContent.trim() || (index === headerRow.cells.length - 1 ? 'Actions' : 'Details'));
        Array.from(table.tBodies).forEach((body) => Array.from(body.rows).forEach((row) => {
            Array.from(row.cells).forEach((cell) => {
                if (cell.colSpan > 1) {
                    cell.classList.add('dashboard-table__full-row');
                    return;
                }
                cell.dataset.label = labels[cell.cellIndex] || 'Details';
            });
        }));
        table.classList.add('admin-responsive-table');
        table.dataset.mobileCards = 'true';
    });

    const moderationHeading = document.querySelector('[data-user-moderation-state]');
    if (moderationHeading instanceof HTMLElement) {
        const current = moderationHeading.dataset.userModerationState || 'active';
        document.querySelectorAll('form select[name="status"]').forEach((select) => {
            if (!(select instanceof HTMLSelectElement)) return;
            select.name = 'moderation_state';
            select.replaceChildren(...[
                ['active', 'Active'], ['hidden', 'Hidden'], ['disabled', 'Disabled'], ['hidden_disabled', 'Hidden and disabled'],
            ].map(([value, label]) => new Option(label, value, false, value === current)));
            const label = select.closest('.form-field')?.querySelector('label');
            if (label) label.textContent = 'Account status';
            const help = document.createElement('small');
            help.textContent = 'Hidden removes the profile, videos and comments from public pages. Disabled signs the user out and prevents login, comments and uploads. Hidden and disabled does both.';
            select.after(help);
        });
        document.querySelectorAll('input[name="status_reason"]').forEach((input) => {
            input.placeholder = 'Required unless status is Active';
            const label = input.closest('.form-field')?.querySelector('label');
            if (label) label.textContent = 'Moderation reason';
        });
    }

    document.querySelectorAll('[data-use-blog-image]').forEach((button) => button.addEventListener('click', () => {
        const selector = button.dataset.target || '[data-blog-featured-image]';
        const input = document.querySelector(selector);
        if (input instanceof HTMLInputElement) { input.value = button.dataset.useBlogImage || ''; input.focus(); }
    }));
    const ageGate = document.querySelector('[data-age-gate]');
    if (ageGate instanceof HTMLElement && localStorage.getItem('bp-age-gate-accepted') !== '1') { ageGate.hidden = false; document.body.classList.add('age-gate-open'); }
    ageGate?.querySelector('[data-age-gate-enter]')?.addEventListener('click', () => { localStorage.setItem('bp-age-gate-accepted', '1'); document.cookie = 'bp_age_gate=accepted; Max-Age=31536000; Path=/; SameSite=Lax; Secure'; ageGate.hidden = true; document.body.classList.remove('age-gate-open'); });

    const backToTop = document.querySelector('[data-back-to-top]');
    if (backToTop instanceof HTMLButtonElement) {
        const refreshBackToTop = () => backToTop.classList.toggle('is-visible', window.scrollY > 500);
        window.addEventListener('scroll', refreshBackToTop, { passive: true });
        backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        refreshBackToTop();
    }

    const staffBody = document.querySelector('.page--staff .rich-content');
    if (staffBody instanceof HTMLElement) {
        Array.from(staffBody.querySelectorAll(':scope > h2')).filter((heading) => /^(Senior Staff|Staff|Trial Staff)/i.test(heading.textContent.trim())).forEach((heading) => {
            let cursor = heading.nextElementSibling;
            while (cursor && cursor.tagName !== 'FIGURE' && cursor.tagName !== 'H2') cursor = cursor.nextElementSibling;
            if (!cursor || cursor.tagName !== 'FIGURE') return;
            const grid = document.createElement('div');
            grid.className = 'staff-profile-grid';
            cursor.before(grid);
            while (cursor && cursor.tagName !== 'H2' && cursor.tagName !== 'HR') {
                if (cursor.tagName !== 'FIGURE') { cursor = cursor.nextElementSibling; continue; }
                const card = document.createElement('section');
                card.className = 'staff-profile-card';
                grid.append(card);
                card.append(cursor);
                cursor = grid.nextElementSibling;
                while (cursor && !['FIGURE', 'H2', 'HR'].includes(cursor.tagName)) {
                    if (cursor.tagName === 'P' && /^This page also serves/i.test(cursor.textContent.trim())) break;
                    const next = cursor.nextElementSibling;
                    card.append(cursor);
                    cursor = next;
                }
            }
        });
    }

    document.querySelectorAll('[data-search-autocomplete]').forEach((wrapper) => {
        const input = wrapper.querySelector('input[type="search"]');
        const panel = wrapper.querySelector('[data-search-suggestions]');
        const endpoint = wrapper.dataset.suggestionsUrl;
        if (!(input instanceof HTMLInputElement) || !(panel instanceof HTMLElement) || !endpoint) return;
        let timer = null;
        let request = null;
        const labels = { videos: 'Videos', creators: 'Creators', performers: 'Performers', categories: 'Categories', tags: 'Tags' };
        const close = () => { panel.hidden = true; panel.replaceChildren(); input.setAttribute('aria-expanded', 'false'); };
        const render = (groups) => {
            panel.replaceChildren();
            Object.entries(groups || {}).forEach(([group, items]) => {
                if (!Array.isArray(items) || !items.length) return;
                const section = document.createElement('section');
                const heading = document.createElement('strong'); heading.textContent = labels[group] || group; section.append(heading);
                items.forEach((item) => { const link = document.createElement('a'); link.href = item.url; link.textContent = item.label; link.setAttribute('role', 'option'); section.append(link); });
                panel.append(section);
            });
            panel.hidden = !panel.children.length;
            input.setAttribute('aria-expanded', String(!panel.hidden));
        };
        const refresh = () => {
            const query = input.value.trim();
            request?.abort();
            if (query.length < 2) { close(); return; }
            request = new AbortController();
            fetch(`${endpoint}?q=${encodeURIComponent(query)}`, { headers: { Accept: 'application/json' }, signal: request.signal })
                .then((response) => response.ok ? response.json() : Promise.reject())
                .then((data) => render(data.groups)).catch(() => {});
        };
        input.setAttribute('aria-expanded', 'false');
        input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(refresh, 180); });
        input.addEventListener('focus', () => { if (input.value.trim().length >= 2 && !panel.children.length) refresh(); else if (panel.children.length) panel.hidden = false; });
        input.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
        document.addEventListener('click', (event) => { if (!wrapper.contains(event.target)) close(); });
    });

    document.querySelectorAll('[data-banner-rotation]').forEach((slot) => {
        const items = Array.from(slot.querySelectorAll('img,video'));
        if (items.length < 2) return;
        let active = 0;
        const seconds = Math.max(.5, Number(slot.dataset.bannerRotation || 4));
        window.setInterval(() => {
            items[active].hidden = true;
            active = (active + 1) % items.length;
            items[active].hidden = false;
        }, seconds * 1000);
    });

    document.querySelectorAll('[data-third-party-bulk-select]').forEach((form) => {
        const candidates = Array.from(form.querySelectorAll('[data-third-party-candidate]')).filter((input) => input instanceof HTMLInputElement);
        const selectAll = Array.from(form.querySelectorAll('[data-third-party-select-all]')).filter((input) => input instanceof HTMLInputElement);
        const counts = form.querySelectorAll('[data-third-party-selected-count]');
        const submits = form.querySelectorAll('[data-third-party-submit]');
        const refresh = () => {
            const selected = candidates.filter((input) => input.checked).length;
            selectAll.forEach((input) => {
                input.checked = candidates.length > 0 && selected === candidates.length;
                input.indeterminate = selected > 0 && selected < candidates.length;
            });
            counts.forEach((node) => { node.textContent = `${selected} selected`; });
            submits.forEach((button) => { if (button instanceof HTMLButtonElement) button.disabled = selected === 0; });
        };
        selectAll.forEach((input) => input.addEventListener('change', () => {
            candidates.forEach((candidate) => { candidate.checked = input.checked; });
            refresh();
        }));
        candidates.forEach((input) => input.addEventListener('change', refresh));
        refresh();
    });

    const supporterAccentChoices = [...document.querySelectorAll('input[name="supporter_accent_choice"]')];
    const supporterCustomColor = document.querySelector('[data-supporter-custom-color]');
    if (supporterAccentChoices.length && supporterCustomColor) {
        const updateSupporterCustomColor = () => {
            const selected = supporterAccentChoices.find((input) => input.checked);
            supporterCustomColor.hidden = selected?.value !== 'custom';
        };
        supporterAccentChoices.forEach((input) => input.addEventListener('change', updateSupporterCustomColor));
        updateSupporterCustomColor();
    }

    if (window.tinymce) {
        window.bpInitUploadEditors = (root = document) => {
            root.querySelectorAll('textarea[data-upload-rich-text]:not([data-upload-editor-ready])').forEach((textarea) => {
                textarea.dataset.uploadEditorReady = '1';
                const counter = textarea.closest('.form-field')?.querySelector('[data-upload-description-count]');
                window.tinymce.init({
                    target: textarea, menubar: false, branding: false, promotion: false,
                    plugins: 'autoresize lists', toolbar: 'undo redo | bold italic strikethrough | bullist numlist outdent indent | removeformat',
                    skin: 'badpups', skin_url: '/assets/vendor/tinymce/skins/ui/badpups', content_css: '/assets/vendor/tinymce/skins/content/badpups/content.min.css', cache_suffix: '?v=3', toolbar_mode: 'wrap', min_height: 240,
                    paste_as_text: true, valid_elements: 'p,br,strong/b,em/i,s,ul,ol,li[style]', invalid_elements: 'a,img,video,audio,iframe,object,embed,script,style,code,pre',
                    setup: (editor) => {
                        const updateCount = () => {
                            const length = editor.getContent({ format: 'text' }).trim().length;
                            if (counter instanceof HTMLElement) {
                                counter.textContent = `${length} / 700 characters`;
                                counter.classList.toggle('is-error', length > 700);
                            }
                            editor.save();
                        };
                        editor.on('input change undo redo keyup SetContent', updateCount);
                        editor.on('init', updateCount);
                    },
                    init_instance_callback: (editor) => { const container = editor.getContainer(); container.style.visibility = 'visible'; const loader = container.querySelector('.tox-throbber'); if (loader instanceof HTMLElement) loader.style.display = 'none'; },
                });
            });
        };
        window.bpInitUploadEditors(document);
        window.tinymce.init({
            selector: 'textarea[data-rich-text]:not([data-upload-rich-text]),textarea[data-wysiwyg]:not([data-upload-rich-text])', menubar: 'edit view insert format tools table help', branding: false, promotion: false,
            plugins: 'advlist autolink autoresize charmap code emoticons fullscreen image link lists media preview searchreplace table visualblocks wordcount',
            toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media emoticons charmap | blockquote table | removeformat visualblocks code fullscreen preview',
            skin: 'badpups', skin_url: '/assets/vendor/tinymce/skins/ui/badpups', content_css: '/assets/vendor/tinymce/skins/content/badpups/content.min.css', cache_suffix: '?v=2', toolbar_mode: 'wrap', min_height: 420,
            init_instance_callback: (editor) => { const container = editor.getContainer(); container.style.visibility = 'visible'; const loader = container.querySelector('.tox-throbber'); if (loader instanceof HTMLElement) loader.style.display = 'none'; },
        });
    }
})();
