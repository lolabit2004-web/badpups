// logger.ts
var Logger = class {
  constructor(level) {
    this.level = level;
  }
  debug(message, ...optionalParams) {
    if (this.level <= 0 /* DEBUG */)
      console.debug(message, ...optionalParams);
  }
  warn(message, ...optionalParams) {
    if (this.level <= 2 /* WARN */)
      console.warn(message, ...optionalParams);
  }
  info(message, ...optionalParams) {
    if (this.level <= 1 /* INFO */)
      console.info(message, ...optionalParams);
  }
  log(message, ...optionalParams) {
    if (this.level <= 1 /* INFO */)
      console.log(message, ...optionalParams);
  }
  error(message, ...optionalParams) {
    if (this.level <= 3 /* ERROR */)
      console.error(message, ...optionalParams);
  }
};

// stream-drm-engine.ts
var StreamDrmEngine = class {
  constructor(fpLicenseUrl, fpCertificateUrl, logLevel) {
    this.preparedMediaKeysPromise = null;
    this.keysPromise = null;
    this.fpLicenseUrl = fpLicenseUrl;
    this.fpCertificateUrl = fpCertificateUrl;
    this.logger_ = new Logger(logLevel);
  }
  async loadFpCertificate() {
    if (this.fpCertificate)
      return;
    try {
      const response = await fetch(this.fpCertificateUrl);
      if (!response.ok)
        throw new Error(`Certificate fetch failed: ${response.status}`);
      this.fpCertificate = await response.arrayBuffer();
    } catch (e) {
      this.logger_.error(`Could not load FairPlay certificate at ${this.fpCertificateUrl}`);
      throw e;
    }
  }
  async prepareMediaKeys() {
    if (this.preparedMediaKeysPromise)
      return this.preparedMediaKeysPromise;
    this.preparedMediaKeysPromise = (async () => {
      if (!this.fpCertificate)
        await this.loadFpCertificate();
      const accessPromise = navigator.requestMediaKeySystemAccess("com.apple.fps", [{
        initDataTypes: ["cenc", "sinf", "skd"],
        videoCapabilities: [{ contentType: "application/vnd.apple.mpegurl", robustness: "" }],
        distinctiveIdentifier: "not-allowed",
        persistentState: "not-allowed",
        sessionTypes: ["temporary"]
      }]);
      const access = await accessPromise;
      const keys = await access.createMediaKeys();
      await keys.setServerCertificate(this.fpCertificate);
      return keys;
    })();
    try {
      return await this.preparedMediaKeysPromise;
    } catch (e) {
      this.preparedMediaKeysPromise = null;
      throw e;
    }
  }
  async createMediaKeys(video) {
    if (video.mediaKeys)
      return video.mediaKeys;
    if (this.keysPromise) {
      const keys = await this.keysPromise;
      if (!video.mediaKeys)
        await video.setMediaKeys(keys);
      return keys;
    }
    this.keysPromise = (async () => {
      const keys = await this.prepareMediaKeys();
      if (!video.mediaKeys)
        await video.setMediaKeys(keys);
      return keys;
    })();
    try {
      return await this.keysPromise;
    } catch (e) {
      this.keysPromise = null;
      throw e;
    }
  }
  async initFairPlay(videoEl) {
    videoEl.addEventListener("encrypted", (e) => this.onFpEncrypted(e));
    this.prepareMediaKeys().catch((e) => {
      this.logger_.error(`Could not prepare FairPlay MediaKeys due to exception "${e}"`);
    });
  }
  async onFpEncrypted(event) {
    try {
      const initDataType = event.initDataType;
      const initData = event.initData;
      if (!initDataType || !initData)
        return;
      const video = event.target;
      await this.createMediaKeys(video);
      const session = video.mediaKeys.createSession();
      let messageTimeout = 0;
      const messagePromise = new Promise((resolve, reject) => {
        messageTimeout = setTimeout(() => {
          reject(new Error("Timeout waiting for license request message"));
        }, 3e4);
        session.addEventListener("message", (e) => {
          clearTimeout(messageTimeout);
          resolve(e);
        }, { once: true });
      });
      try {
        await session.generateRequest(initDataType, initData);
      } catch (e) {
        clearTimeout(messageTimeout);
        throw e;
      }
      const message = await messagePromise;
      let response = await this.getResponse(message, this.fpLicenseUrl);
      await session.update(response).catch(() => this.logger_.error("FP license update failed;"));
      return session;
    } catch (e) {
      this.logger_.error(`Could not start FP encrypted playback due to exception "${e}"`);
    }
  }
  async getResponse(event, license_server_url) {
    const licenseResponse = await fetch(license_server_url, {
      method: "POST",
      body: event.message
    });
    return await licenseResponse.arrayBuffer();
  }
};
StreamDrmEngine.prototype.fpLicenseUrl = "";
