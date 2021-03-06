const host = window.location.host;
const overlayCheckInterval = setInterval(checkForEmbeds, 3000);

self.port.on('detach', function() {
  clearInterval(overlayCheckInterval);
  Array.from(document.querySelectorAll('.minvid__overlay__wrapper'))
       .forEach(removeOverlay);
});

function removeOverlay(el) {
  el.classList.remove('minvid__overlay__wrapper');
  const containerEl = el.querySelector('.minvid__overlay__container');
  if (containerEl) containerEl.remove();
}

function checkForEmbeds() {
  ytEmbedChecks();
  vimeoEmbedChecks();
}

function ytEmbedChecks() {
  // YouTube Home Page
  const ytHomeContainers = Array.from(document.querySelectorAll('#feed .yt-lockup-thumbnail'));
  if ((host.indexOf('youtube.com') > -1) && ytHomeContainers.length) {
    sendMetric('available');
    ytHomeContainers.forEach(ytHomePageHandler);
  }

  // YouTube Watch Page
  const ytWatchContainer = document.querySelector('.html5-video-player');
  if ((host.indexOf('youtube.com') > -1) && ytWatchContainer) {
    ytWatchElementHandler(ytWatchContainer);
    sendMetric('available');
  }
}

function ytHomePageHandler(el) {
  el.classList.add('minvid__overlay__wrapper');
  const tmp = getTemplate();
  tmp.addEventListener('click', function(ev) {
    evNoop(ev);
    const urlEl = el.querySelector('.yt-uix-sessionlink');
    if (urlEl && urlEl.getAttribute('href')) {
      self.port.emit('launch', {
        url: 'https://youtube.com' + urlEl.getAttribute('href'),
        domain: host
      });
    } else console.error('Error parsing url from YT home page', el); // eslint-disable-line no-console
  });
  el.appendChild(tmp);
}

function ytWatchElementHandler(el) {
  el.classList.add('minvid__overlay__wrapper');
  const tmp = getTemplate();
  tmp.addEventListener('click', function(ev) {
    evNoop(ev);
    self.port.emit('launch', {
      url: window.location.href,
      domain: host
    });
  });
  el.appendChild(tmp);
}

function vimeoEmbedChecks() {
  // VIMEO HOME PAGE
  const vimeoHomeContainers = Array.from(document.querySelectorAll('.player_wrapper'));
  if ((host.indexOf('vimeo.com') > -1)  && vimeoHomeContainers.length) {
    vimeoHomeContainers.forEach(el => {
      el.classList.add('minvid__overlay__wrapper');
      const tmp = getTemplate();
      tmp.addEventListener('click', function(ev) {
        evNoop(ev);
        const fauxEl = el.querySelector('.faux_player');
        if (fauxEl) {
          self.port.emit('launch', {
            url: 'https://vimeo.com/' + fauxEl.getAttribute('data-clip-id'),
            domain: host
          });
        } else console.error('Error: failed to locate vimeo url'); // eslint-disable-line no-console
      });
      el.appendChild(tmp);
    });
    sendMetric('available');
  }

  // VIMEO DETAIL PAGE
  const vimeoDetailContainer = document.querySelector('.video-wrapper');
  if ((host.indexOf('vimeo.com') > -1)  && vimeoDetailContainer) {
    vimeoDetailContainer.classList.add('minvid__overlay__wrapper');
    const tmp = getTemplate();
    tmp.addEventListener('mouseup', evNoop);
    tmp.addEventListener('click', function(ev) {
      evNoop(ev);
      self.port.emit('launch', {
        url: window.location.href,
        domain: host
      });
    }, true);
    vimeoDetailContainer.appendChild(tmp);
    sendMetric('available');
  }
}

// General Helpers
function getTemplate() {
  const containerEl = document.createElement('div');
  const iconEl = document.createElement('div');

  containerEl.className = 'minvid__overlay__container';
  iconEl.className = 'minvid__overlay__icon';

  containerEl.appendChild(iconEl);
  return containerEl;
}

function sendMetric(method) {
  self.port.emit('metric', {
    object: 'overlay_icon',
    method: method,
    domain: host
  });
}

function evNoop(ev) {
  ev.preventDefault();
  ev.stopImmediatePropagation();
}
