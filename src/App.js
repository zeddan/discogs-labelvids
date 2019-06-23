// import React from 'react';
import React, { Component } from 'react';
import axios from 'axios';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props)
    this.init()
    this.state = {
      videos: []
    }


    window['onYouTubeIframeAPIReady'] = (e) => {
      this.YT = window['YT']
      this.player = new window['YT'].Player('player', {
        videoId: 'M7lc1UVf-VE',
        height: '390',
        width: '640',
        events: {
          // 'onStateChange': this.onPlayerStateChange.bind(this),
          // 'onError': this.onPlayerError.bind(this),
          'onReady': (e) => {}
        }
      })
    }
  }

  componentDidMount() {
    axios.get('https://api.discogs.com/labels/869700/releases').then((res) => {
      const releases = res.data.releases.map((release) => {
        return release.resource_url;
      });

      const videos = releases.map((releaseUrl) => {
        axios.get(releaseUrl).then((res) => {
          return res.data.videos;
        });
      });
    });

  }

  init() {
    var tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    var firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
  }

  render() {
    return (
      <div className="App">
        <div id="player"></div>
        <div id="list"></div>
      </div>
    );
  }
}

export default App;
