// import React from 'react';
import React, { Component } from 'react';
import axios from 'axios';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props)
    this.init()
    this.state = {
      videos: [],
      currentVideo: ''
    }


    window['onYouTubeIframeAPIReady'] = (e) => {
      this.YT = window['YT']
      this.player = new window['YT'].Player('player', {
        videoId: 'M7lc1UVf-VE',
        height: '390',
        width: '640',
      })
    }
  }

  init() {
    var tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    var firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
  }

  play = (uri) => {
    let id = uri.replace("https://www.youtube.com/watch?v=", "")
    this.player.loadVideoById({ videoId: id })
  }

  search = async () => {
    this.setState({ videos: [] })
    const id = document.getElementById("search-input").value
    const res = await axios.get(`https://api.discogs.com/labels/${id}/releases`)
    const releases = res.data.releases.map((release) => {
      return release.resource_url;
    });
    releases.forEach((releaseUrl) => {
      axios.get(releaseUrl).then((res) => {
        res.data.videos.forEach((video) => {
          this.setState({
            videos: [...this.state.videos, video]
          });
        })
      });
    });
  }

  setThumbnailBg = (uri) => {
    let id = uri.replace("https://www.youtube.com/watch?v=", "")
    let imgUrl = `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    return ({
      backgroundImage: 'url(' + imgUrl + ')'
    })
  }

  render() {
    var divStyle = {  }
    return (
      <div className="App">
        <div id="search-container">
          <input id="search-input" placeholder="Enter label's discogs-id"></input>
          <div id="search-button" onClick={this.search}>Search</div>
        </div>
        <div id="player"></div>
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
