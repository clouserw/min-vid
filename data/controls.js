/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

document.querySelector('.controls').style.display = 'none';
document.querySelector('.video-wrapper').style.display = 'none';
var frame = document.getElementById('video');

Array.from(document.querySelectorAll('a')).forEach(el => {
  el.addEventListener('click', ev => {
    ev.preventDefault();
    ev.stopPropagation();
    self.port.emit('link', {
      title: el.title,
      src: document.querySelector('iframe').src
    });
  });
});

document.querySelector('.controls [title="play"]').addEventListener('click', ev => {
  ytPlay();
  post('play');
});

document.querySelector('.controls [title="pause"]').addEventListener('click', ev => {
  ytPause();
  post('pause');
});

document.querySelector('.controls [title="mute"]').addEventListener('click', ev => {
  ytToggleMute();
  vimeoToggleMute();
});

-self.port.on('set-video', url => {
  document.querySelector('iframe').src = url;
});

function ytPlay() {
  if (unsafeWindow.ytPlayer.getPlayerState() !== unsafeWindow.YT.PlayerState.PLAYING) {
    unsafeWindow.ytPlayer.playVideo();
  }
}

function ytToggleMute() {
  if (unsafeWindow.ytPlayer.isMuted()) {
    unsafeWindow.ytPlayer.unMute();
  } else {
    unsafeWindow.ytPlayer.mute();
  }
}

function ytPause() {
  if (unsafeWindow.ytPlayer.getPlayerState() === unsafeWindow.YT.PlayerState.PLAYING) {
    unsafeWindow.ytPlayer.pauseVideo();
  }
}

var playerOrigin = '*';
unsafeWindow.addEventListener('message', onMessageReceived, false);

function onMessageReceived(event) {
  // Handle messages from the vimeo player only
  if (!(/^https?:\/\/player.vimeo.com/).test(event.origin)) {
    return false;
  }

  if (playerOrigin === '*') {
    playerOrigin = event.origin;
  }

  var data = JSON.parse(event.data);

  switch (data.event) {
  case 'ready': onReady();
    break;
  case 'playProgress': onPlayProgress(data.data);
    break;
  case 'pause': onPause();
    break;
  case 'finish':onFinish();
    break;
  }
}

function post(action, value) {
  var data = {method: action};
  if (value) {data.value = value;}
  var message = JSON.stringify(data);
  frame.contentWindow.postMessage(message, playerOrigin);
}

function onReady() {
  console.log('ready');
  post('addEventListener', 'pause');
  post('addEventListener', 'finish');
  post('addEventListener', 'playProgress');
}

function onPause() {
  console.log('paused');
}

function onFinish() {
  console.log('finished');
}

function onPlayProgress() {
  // console.log(data.seconds);
}

function vimeoToggleMute() {
  // TODO (DJ)
  // post('setVolume', 0);
  // post('setVolume', 1);
  // setVolume(volume:Number):void
}
