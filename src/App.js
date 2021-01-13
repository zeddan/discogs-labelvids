import React, { Component } from 'react';
import axios from 'axios';
import './App.scss';

class App extends Component {

  constructor(props) {
    super(props)
    this.init()
    this.state = {
      videos: [],
      nowPlayingIdx: -1
    }

    window['onYouTubeIframeAPIReady'] = (e) => {
      this.YT = window['YT']
      this.player = new window['YT'].Player('player', {
        videoId: '03gkNcYKj3k',
        height: '390',
        width: '640',
        events: {
          onStateChange: this.onPlayerStateChange.bind(this),
        }
      })
    }
  }

  onPlayerStateChange(e) {
    if (e.data === this.YT.PlayerState.ENDED) {
      this.playNext()
    }
  }

  init() {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
  }

  play = (uri) => {
    let videoId = uri.replace("https://www.youtube.com/watch?v=", "")
    let nowPlayingIdx = this.state.videos.findIndex((e) => e.uri === uri)
    this.setState({ nowPlayingIdx })
    this.player.loadVideoById({ videoId })
  }

  playNext = () => {
    let nextIdx = (this.state.nowPlayingIdx + 1) % this.state.videos.length
    this.play(this.state.videos[nextIdx].uri)
  }

  playPrevious = () => {
    let prevIdx = this.state.nowPlayingIdx - 1
    if (prevIdx < 0)
      prevIdx = this.state.videos.length - 1
    this.play(this.state.videos[prevIdx].uri)
  }

  search = async () => {
    this.setState({ videos: [], nowPlayingIdx: -1 })

    const token = 'a_discogs_token'
    const id = document.getElementById("search-input").value
    const res = await axios.get(`https://api.discogs.com/labels/${id}/releases?${token}`)
    const releases = res.data.releases.map((release) => {
      return release.resource_url;
    });

    releases.forEach((releaseUrl) => {
      axios.get(`${releaseUrl}?token=${token}`).then((res) => {
        if (!res.data.videos)
          return
        res.data.videos.forEach((video) => {
          if (!this.videoExists(video.uri)) {
            this.setState({
              videos: [...this.state.videos, video]
            });
          }
        })
      })
    });
  }

  videoExists = (uri) => this.state.videos.find(e => e.uri === uri)

  setThumbnailBg = (uri) => {
    let id = uri.replace("https://www.youtube.com/watch?v=", "")
    let imgUrl = `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    return ({
      backgroundImage: `url(${imgUrl})`
    })
  }

  render() {
    return (
      <div className="App">
        <div id="search-container">
          <input id="search-input" placeholder="Enter label's discogs-id"></input>
          <div id="search-button" onClick={this.search}>Search</div>
        </div>
        <div id="player"></div>
        <div id="player-control">
          <div onClick={
            this.state.videos.length > 0 ? this.playPrevious : undefined
            }>&lt;&lt;</div>
          <div onClick={
            this.state.videos.length > 0 ? this.playNext : undefined
            }>&gt;&gt;</div>
        </div>
        <div id="list">
          { 
            this.state.videos.length > 0 ?
            this.state.videos.map((video, i) => {
              return (
                <div className="list-item" key={i}>
                  <div className="list-item__thumbnail"
                    style={ this.setThumbnailBg(video.uri) }></div>
                  <div className="list-item__text"
                    onClick={() => {this.play(video.uri)}}>
                    { video.title }
                  </div>
                </div>
              )
            }) 
            : <div></div>
          }
        </div>
      </div>
    );
  }
}

export default App;
