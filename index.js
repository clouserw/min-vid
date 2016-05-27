/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

const getVideoId = require('get-video-id');
const qs = require('sdk/querystring');
var panel = require("sdk/panel").Panel({
  contentURL: "./default.html",
  contentScriptFile: "./controls.js",
  width: 300,
  height: 250,
  position: {
    bottom: 10,
    left: 10
  }
});

var { getActiveView } = require("sdk/view/core");
getActiveView(panel).setAttribute("noautohide", true);

panel.port.on('link', opts => {
  var title = opts.title;

  if (title === 'send-to-tab') {
    const pageUrl = getPageUrl(url);
    if (pageUrl) require('sdk/tabs').open(pageUrl);
    else console.log('could not parse page url for ', url);
    panel.hide();
  } else if (title === 'close') {
    updatePanel('');
    panel.hide();
  }
});

function getPageUrl(url) {
  let pageUrl = '';
  if (url.indexOf('youtube')) {
    pageUrl = 'https://youtube.com/watch?v=' + getVideoId(url);
  } else if(url.indexOf('vimeo')) {
    pageUrl = 'https://vimeo.com/video/' + getVideoId(url);
  }

  return pageUrl;
}

var cm = require("sdk/context-menu");

cm.Item({
  label: "Send to mini player",
  context: cm.SelectorContext('[href*="youtube.com"], [href*="youtu.be"]'),
  contentScript: "self.on('click', function (node, data) {" +
                 "  self.postMessage(node.href);" +
                 "});",
  onMessage: function(url) {
    updatePanel(constructYoutubeEmbedUrl(url));
  }
});

cm.Item({
  label: "Send to mini player",
  context: cm.SelectorContext('[href*="vimeo.com"]'),
  contentScript: "self.on('click', function (node, data) {" +
                 "  self.postMessage(node.href);" +
                 "});",
  onMessage: function(url) {
    updatePanel(constructVimeoEmbedUrl(url));
  }
});

function updatePanel(url) {
  panel.port.emit('set-video', url);
  panel.show();
}

function constructVimeoEmbedUrl(url) {
  const params = qs.stringify({
    autoplay: 1,
    badge: 0,
    byline: 0,
    portrait: 0,
    title: 0
  });

  return 'https://player.vimeo.com/video/' + getVideoId(url) + '?' + params;
}

function constructYoutubeEmbedUrl(url) {
  const params = qs.stringify({
    autoplay: 0,
    showinfo: 0,
    controls: 0,
    enablejsapi: 1,
    modestbranding: 1
  });

  return "https://www.youtube.com/embed/" + getVideoId(url) + '?' + params;
}
