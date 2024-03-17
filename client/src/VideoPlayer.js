import React, { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import "./styles.css";

const VideoPlayer = () => {
  const [currentTime, setCurrentTime] = useState("0:00");
  const [totalTime, setTotalTime] = useState("0:00");
  const [progressPosition, setProgressPosition] = useState(0);
  const [previewPosition, setPreviewPosition] = useState(0);
  const [bufferedPercentage, setBufferedPercentage] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  //const [waitingBufferPercentage, setWaitingBufferPercentage] = useState(0);

  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const volumeSliderRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tagName = document.activeElement.tagName.toLowerCase();

      if (tagName === "input" || tagName === "textarea" || tagName === "select")
        return;

      switch (e.key.toLowerCase()) {
        case " ":
          if (tagName === "button") return;
        // Intentional fallthrough
        case "k":
          togglePlay();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "m":
          toggleMute();
          break;
        case "arrowleft":
        case "j":
          skip(-5);
          break;
        case "arrowright":
        case "l":
          skip(5);
          break;
        default:
          // Handle unexpected key

          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const skip = (duration) => {
    const video = videoRef.current;
    video.currentTime += duration;
  };

  const toggleFullscreen = () => {
    const elem = videoContainerRef.current;

    if (document.fullscreenElement == null) {
      elem.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  document.addEventListener("fullscreenchange", () => {
    const elem = videoContainerRef.current;
    if (elem) {
      elem.classList.toggle("full-screen", document.fullscreenElement);
    }
  });

  useEffect(() => {
    const video = videoRef.current;

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
    };

    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    return () => {
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    const updateTime = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      const percentage = (currentTime / duration) * 100;
      setProgressPosition(percentage);
      setCurrentTime(formatTime(currentTime));
    };

    const updateBuffered = () => {
      const buffered = video.buffered;
      const currentTime = video.currentTime;
      let maxBufferedEnd = 0;
      for (let i = 0; i < buffered.length; i++) {
        if (
          buffered.start(i) <= currentTime &&
          buffered.end(i) > maxBufferedEnd
        ) {
          maxBufferedEnd = buffered.end(i);
        }
      }
      const duration = video.duration;
      const percentage = (maxBufferedEnd / duration) * 100;
      setBufferedPercentage(percentage);
    };

    const updateTotalTime = () => setTotalTime(formatTime(video.duration));

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("progress", updateBuffered);
    video.addEventListener("durationchange", updateTotalTime);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("progress", updateBuffered);
      video.removeEventListener("durationchange", updateTotalTime);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const handleVideoSource = () => {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource("http://localhost:8080/video/master.m3u8");
        hls.attachMedia(video);
        return () => hls.destroy();
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = "http://localhost:8080/video/master.m3u8";
      }
    };
    handleVideoSource();
  }, []);

  const formatTime = (time) => {
    const formattedHours = Math.floor(time / 3600)
      .toString()
      .padStart(2, "0");
    const formattedMinutes = Math.floor((time % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const formattedSeconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  const togglePlay = () => {
    const video = videoRef.current;
    const elem = videoContainerRef.current;
    if (video.paused) {
      video.play();

      elem.classList.remove("paused");
    } else {
      video.pause();

      elem.classList.add("paused");
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    video.muted = !video.muted;
  };

  useEffect(() => {
    const video = videoRef.current;
    const volumeSlider = volumeSliderRef.current;
    const videoContainer = videoContainerRef.current;

    const handleVolumeChange = () => {
      volumeSlider.value = video.volume;
      let volumeLevel;
      if (video.muted || video.volume === 0) {
        volumeSlider.value = 0;
        volumeLevel = "muted";
      } else if (video.volume >= 0.5) {
        volumeLevel = "high";
      } else {
        volumeLevel = "low";
      }
      videoContainer.dataset.volumeLevel = volumeLevel;
    };

    video.addEventListener("volumechange", handleVolumeChange);

    volumeSlider.addEventListener("input", (e) => {
      video.volume = e.target.value;
      video.muted = e.target.value === "0";
    });

    return () => {
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, []);

  const handleTimelineHover = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setPreviewPosition(percent * 100);
  }, []);

  const handleTimelineClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const timelineWidth = rect.width;
    const percent = (clickPosition / timelineWidth) * 100;
    setProgressPosition(percent);
    videoRef.current.currentTime = (percent / 100) * videoRef.current.duration;
  }, []);

  return (
    <div
      ref={videoContainerRef}
      className="video-container paused"
      data-volume-level="high"
    >
      <div className="video-controls-container">
        <div
          className="timeline-container"
          onMouseMove={handleTimelineHover}
          onClick={handleTimelineClick}
        >
          <div
            className="timeline"
            style={{
              "--progress-position": `${progressPosition}%`,
              "--preview-position": `${previewPosition}%`,
            }}
          >
            <div
              className="loaded-bar"
              style={{
                "--download-position": `${bufferedPercentage}%`,
              }}
            ></div>
            <div className="thumb-indicator"></div>
          </div>
        </div>
        <div className="controls">
          <button className="play-pause-btn" onClick={togglePlay}>
            <svg className="play-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
            <svg className="pause-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M14,19H18V5H14M6,19H10V5H6V19Z" />
            </svg>
          </button>
          <div className="volume-container">
            <button className="mute-btn" onClick={toggleMute}>
              <svg className="volume-high-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
                />
              </svg>
              <svg className="volume-low-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M5,9V15H9L14,20V4L9,9M18.5,12C18.5,10.23 17.5,8.71 16,7.97V16C17.5,15.29 18.5,13.76 18.5,12Z"
                />
              </svg>
              <svg className="volume-muted-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z"
                />
              </svg>
            </button>
            <input
              ref={volumeSliderRef}
              className="volume-slider"
              type="range"
              min="0"
              max="1"
              step="any"
              //onChange={handleVolumeChange}
            />
          </div>
          <div className="duration-container">
            <div className="current-time">{currentTime}</div>/
            <div className="total-time">{totalTime}</div>
          </div>
          <button className="full-screen-btn" onClick={toggleFullscreen}>
            <svg className="open" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
              />
            </svg>
            <svg className="close" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"
              />
            </svg>
          </button>
        </div>
      </div>
      <video ref={videoRef}></video>
      <div className={`loading-spinner ${isBuffering ? "visible" : ""}`}>
        <div className="spinner"></div>
        <div className="spinner-text"></div>
      </div>
    </div>
  );
};

export default VideoPlayer;
