/**
 * @flow
 */
'use strict';

var EventEmitter = require('EventEmitter');
var React = require('react-native');
var {
  DeviceEventEmitter,
  NativeModules: {
    EXURLHandler,
  },
} = React;

var url = require('url');

var emitter = new EventEmitter();

var URLHandler = {
  /**
   * The list of URL protocols handled by this app.
   */
  schemes: EXURLHandler.schemes,

  /**
   * The URL that opens the settings for this app. It is defined on iOS 8 and
   * up.
   */
  settingsURL: EXURLHandler.settingsURL,

  /**
   * The URL that launched this app if it was launched from a URL.
   */
  initialURL: EXURLHandler.initialURL,

  /**
   * Referrer information about the URL that launched this app if it was
   * launched from a URL.
   */
  initialReferrer: EXURLHandler.initialReferrer,

  /**
   * Opens the given URL. The URL may be an external URL or an in-app URL. URLs
   * without a host are treated as in-app URLs.
   */
  openURL(targetURL: string) {
    if (this.isInternalURL(targetURL)) {
      emitter.emit('request', targetURL);
    } else {
      EXURLHandler.openURL(targetURL, () => {}, (error) => {
        console.error('Error opening URL: ' + error.stack);
      });
    }
  },

  /**
   * Returns whether the given URL is an in-app URL or an external URL.
   */
  isInternalURL(targetURL: string): bool {
    // Parse the query string and have "//" denote the hostname
    var {protocol} = url.parse(targetURL, false, true);
    if (!protocol) {
      return true;
    }
    return false; // TODO: Come up with a better way to handle this.
    // We want a message passing channel between different instances of the JavaScript
    // The problem here is that an event is fired within the inner Frame, but the browser
    // can't repond to events fired within the frame in JavaScript
    var scheme = protocol.substring(0, protocol.length - 1);
    return this.schemes.indexOf(scheme) !== -1;
  },

  /**
   * Adds a listener that receives an object with URL information when the app
   * has been instructed to open a URL. See the Request type.
   *
   * This method returns a subscription to later remove the listener.
   */
  addListener(listener: (url: string, referrer: ?Referrer) => void) {
    return emitter.addListener('request', listener);
  },
};

DeviceEventEmitter.addListener('EXURLHandler.openURL', (event) => {
  var {url, sourceApplication, annotation} = event;
  if (sourceApplication != null) {
    var referrer = {sourceApplication, annotation};
  }
  emitter.emit('request', url, referrer);
});

type Referrer = {
  sourceApplication: string;
  annotation?: any;
};

module.exports = URLHandler;
