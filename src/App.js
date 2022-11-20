import React, { Component } from 'react';
import axios from 'axios';
import './App.scss';

class App extends Component {

  constructor(props) {
    super(props)
    this.init()
    this.state = {
      videos: [],
      urls: {},
      nowPlayingIdx: -1,
      currentUrl: ""
    }

    window['onYouTubeIframeAPIReady'] = (e) => {
      this.YT = window['YT']
      this.player = new window['YT'].Player('player', {
        videoId: '03gkNcYKj3k',
        width: '640',
        height: '360',
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
        this.search(document.getElementById('search-input').value);
      }
    }
    if (e.key === "q" || e.key === "Q") {
      const origin = new URL(window.location.href).origin;
      window.location.href = `${origin}/discogs-artistvids/`;
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
    let currentUrl = this.state.urls[videoId]
    this.setState({ nowPlayingIdx, currentUrl })
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
    const res = await axios.get(`https://api.discogs.com/labels/${labelId}/releases?${token}`).catch(this.logError);

    if (!res) {
      return false;
    }

    const releases = res.data.releases.map((release) => {
      return release.resource_url;
    });

    releases.forEach((releaseUrl) => {
      axios.get(`${releaseUrl}?token=${token}`).then((res) => {
        if (!res.data.videos)
          return
        res.data.videos.forEach((video) => {
          if (!this.videoExists(video.uri)) {
            const videoId = video.uri.replace("https://www.youtube.com/watch?v=", "")
            video["released"] = res.data.released
            this.setState({
              videos: this.sortVideos([...this.state.videos, video], res.data.tracklist),
              urls: {
                ...this.state.urls,
                [videoId]: res.data.uri
              }
            });
          }
        })
      }).catch(this.logError);
    });
  }

  sortVideos = (videos, tracklist) => {
    return videos.sort((a, b) => {
      // Some videos has release dates such as "2014-02-00"
      const releaseDate1 = new Date(a.released.replaceAll("-00", "-01"))
      const releaseDate2 = new Date(b.released.replaceAll("-00", "-01"))
      const trackIndex1 = tracklist.findIndex(t => a.title.toLowerCase().includes(t.title.toLowerCase()))
      const trackIndex2 = tracklist.findIndex(t => b.title.toLowerCase().includes(t.title.toLowerCase()))

      return releaseDate1 - releaseDate2 || trackIndex1 - trackIndex2
    });
  }

  logError = (error) => {
    if (error.response) {
      console.error("discogs_labelvids: Request made and server responded")
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      console.error("discogs_labelvids: Request was made but no response was received")
      console.error(error.request);
      console.error(error.message);
      alert(`${error.message}: Probably too many requests was sent to Discogs too fast`);
    } else {
      console.error("discogs_labelvids: Something happened in setting up the request that triggered an Error")
      console.error('Error', error.message);
    }
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
        {
          this.state.videos.length > 0 ?
          <div id="player-control">
            <div onClick={this.playPrevious}>&lt;&lt;</div>
            <a href={this.state.currentUrl} target="_blank" rel="noopener noreferrer">
              <img id="discogs-icon" title={this.state.currentUrl} alt={this.state.currentUrl} src="images/discogs.svg" ></img>
            </a>
            <div onClick={this.playNext}>&gt;&gt;</div>
          </div> : <div></div>
        }
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
