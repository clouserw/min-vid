const cm = require('sdk/context-menu');
const launchVideo = require('./launch-video.js');
const sendMetricsData = require('./send-metrics-data.js');

const getYouTubeUrl = require('./get-youtube-url.js');
const getVimeoUrl = require('./get-vimeo-url.js');
const getVineUrl = require('./get-vine-url.js');

const contextMenuLabel = 'Send to mini player';
const contextMenuContentScript = `
self.on('click', function (node, data) {
  self.postMessage(node.href || node['data-feed-url']);
});`;

const URLS = {
  'vimeo': ['vimeo.com/'],
  'youtube': ['youtube.com/', 'youtu.be/'],
  'vine': ['vine.co/']
}

// Given a video service name from the URLS object, return an href *= selector
// for the corresponding urls.
// Arguments:
//   videoService: a key from URLS or '*' for all domains from URLS
//   shouldEncode: (optional) encode domains if true
function getSelectors(videoService, shouldEncode) {
  let domains = [];
  if (videoService in URLS) {
    domains = URLS[videoService]
  } else if (videoService === '*') {
    domains = Object.keys(URLS).map(name => URLS[name])
                    .reduce((prev, curr) => prev.concat(curr))
  } else {
    console.error(`Error: ${videoService} missing or not supported`) // eslint-disable-line no-console
  }
  const selectors = domains.map(url => `[href*="${shouldEncode ? encodeURIComponent(url) : url}"]`)
                           .reduce((prev, curr) => `${prev}, ${curr}`)

  return selectors;
}

module.exports = init;

function init(panel) {
  /*
   * YouTube handling
   */
  cm.Item({
    label: contextMenuLabel,
    context: cm.SelectorContext(getSelectors('youtube')),
    contentScript: contextMenuContentScript,
    onMessage: (url) => {
      sendMetricsData({changed: 'activate', domain: 'youtube.com'}, panel);
      launchVideo({url: url,
                   domain: 'youtube.com',
                   getUrlFn: getYouTubeUrl}, panel);
    }
  });

  cm.Item({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.youtube.com']),
      cm.SelectorContext('[class*="yt-uix-sessionlink"]')
    ],
    contentScript: contextMenuContentScript,
    onMessage: (url) => {
      sendMetricsData({changed: 'activate', domain: 'youtube.com'}, panel);
      launchVideo({url: url,
                   domain: 'youtube.com',
                   getUrlFn: getYouTubeUrl}, panel);
    }
  });

  /*
   * Vimeo handling
   */

  cm.Item({
    label: contextMenuLabel,
    context: cm.SelectorContext(getSelectors('vimeo')),
    contentScript: contextMenuContentScript,
    onMessage: (url)=> {
      sendMetricsData({changed: 'activate', domain: 'vimeo.com'}, panel);
      launchVideo({url: url,
                   domain: 'vimeo.com',
                   getUrlFn: getVimeoUrl}, panel);
    }
  });

  cm.Item({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.vimeo.com']),
      cm.SelectorContext('[class*="faux_player"]')
    ],
    contentScript: `self.on('click', function (node, data) {
      self.postMessage('https://vimeo.com/' + node.getAttribute('data-clip-id'));
    });`,
    onMessage: (url)=> {
      sendMetricsData({changed: 'activate', domain: 'vimeo.com'}, panel);
      launchVideo({url: url,
                   domain: 'vimeo.com',
                   getUrlFn: getVimeoUrl}, panel);
    }
  });

  cm.Item({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.vimeo.com']),
      cm.SelectorContext('.contextclip-header a')
    ],
    contentScript: `self.on('click', function (node, data) {
      self.postMessage('https://vimeo.com/' + node.href);
    });`,
    onMessage: (url)=> {
      sendMetricsData({changed: 'activate', domain: 'vimeo.com'}, panel);
      launchVideo({url: url,
                   domain: 'vimeo.com',
                   getUrlFn: getVimeoUrl}, panel);
    }
  });

  cm.Item({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.vimeo.com']),
      cm.SelectorContext('.contextclip-img-thumb')
    ],
    contentScript: `self.on('click', function (node, data) {
      self.postMessage('https://vimeo.com/' + node.href);
    });`,
    onMessage: (url)=> {
      sendMetricsData({changed: 'activate', domain: 'vimeo.com'}, panel);
      launchVideo({url: url,
                   domain: 'vimeo.com',
                   getUrlFn: getVimeoUrl}, panel);
    }
  });

  /*
   * Vine.co handling
   */
  cm.Item({
    label: contextMenuLabel,
    context: cm.SelectorContext(getSelectors('vine')),
    contentScript: contextMenuContentScript,
    onMessage: function(url) {
      sendMetricsData({changed: 'activate', domain: 'vine.co'}, panel);
      launchVideo({url: url,
                   domain: 'vine.co',
                   getUrlFn: getVineUrl}, panel);
    }
  });

  cm.Item({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['https://vine.co/*']),
      cm.SelectorContext('video')
    ],
    contentScript: `self.on('click', function (node, data) {
      self.postMessage(node.poster);
    });`,
    onMessage: function(url) {
      const mp4 = url.replace(/thumbs/, 'videos').split(/\.jpg/)[0];
      sendMetricsData({changed: 'activate', domain: 'vine.co'}, panel);
      launchVideo({url: url,
                   domain: 'vine.co',
                   src: mp4}, panel);
    }
  });

  /*
   * google.com search results handling
   */
  cm.Item({
    label: contextMenuLabel,
    context: [
      cm.URLContext(['*.google.com']),
      cm.SelectorContext(getSelectors('*', true)),
    ],
    contentScript: contextMenuContentScript,
    onMessage: function(url) {
      const regex = /url=(https?[^;]*)/.exec(url)[1];
      const decoded = decodeURIComponent(regex).split('&usg')[0];
      let getUrlFn, domain;
      if (decoded.indexOf('youtube.com' || 'youtu.be') > -1) {
        getUrlFn = getYouTubeUrl;
        domain = 'youtube.com';
      } else if (decoded.indexOf('vimeo.com')  > -1) {
        getUrlFn = getVimeoUrl;
        domain = 'vimeo.com';
      } else if (decoded.indexOf('vine.co') > -1) {
        getUrlFn = getVineUrl;
        domain = 'vine.co';
      }
      if (domain && getUrlFn) {
        sendMetricsData({changed: 'activate', domain: domain}, panel);
        launchVideo({url: decoded,
                     domain: domain,
                     getUrlFn: getUrlFn}, panel);
      }
    }
  });
}
