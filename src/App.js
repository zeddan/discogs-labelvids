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
          onError: this.onPlayerError.bind(this)
        }
      })
    }
  }

  onPlayerStateChange(e) {
    if (e.data === this.YT.PlayerState.ENDED) {
      this.playNext()
    }
  }

  onPlayerError(e) {
    this.playNext();
  }

  init() {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
  }

  onKeyDown = (e) => {
    if (e.ctrlKey && e.key == "p" && this.state.videos.length > 0) {
      this.playPrevious();
    }
    if (e.ctrlKey && e.key == "n" && this.state.videos.length > 0) {
      this.playNext();
    }
    if (e.key === "Enter") {
      if (document.activeElement === document.getElementById('search-input')) {
        this.search(document.getElementById('search-input').uri)
      }
    }
  }

  componentDidMount(){
    const url = new URL(window.location.href);
    const labelId = parseInt(url.pathname.replace(/\D+/g, ""));
    if (labelId) {
      document.getElementById("search-input").value = labelId;
      this.search(labelId);
    }
    document.addEventListener("keydown", this.onKeyDown, false);
  }

  componentWillUnmount(){
    document.removeEventListener("keydown", this.onKeyDown, false);
  }

  play = (uri) => {
    let videoId = uri.replace("https://www.youtube.com/watch?v=", "")
    let nowPlayingIdx = this.state.videos.findIndex((e) => e.uri === uri)
    this.setState({ nowPlayingIdx })
    this.player.loadVideoById({ videoId })
    this.scrollToPlaying()
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

  isPlaying = (idx) => {
    return this.state.nowPlayingIdx === idx
  }

  scrollToPlaying = () => {
    setTimeout(() => {
      let pos = document.getElementsByClassName("now-playing")[0]
                        .parentElement
                        .offsetTop
      document.getElementById("list").scrollTop = pos
    }, 20);
  }

  search = async (labelId) => {
    this.setState({ videos: [], nowPlayingIdx: -1 })

    const token = 'a_discogs_token'
    const res = await axios.get(`https://api.discogs.com/labels/${labelId}/releases?${token}`)
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

  onSearchButtonClicked = () => {
    const labelId = document.getElementById("search-input").value
    this.search(labelId);
    window.history.pushState("", "", labelId);
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
          <div id="search-button" onClick={this.onSearchButtonClicked}>Search</div>
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
                  <div
                    className={
                      `list-item__text
                       ${this.isPlaying(i) ? "now-playing" : ""}`
                    }
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
