import React, { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import "./styles.css";

const VideoPlayer = () => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [totalTime, setTotalTime] = useState("0:00");
  const [progressPosition, setProgressPosition] = useState(0);
  const [previewPosition, setPreviewPosition] = useState(0);

  const handleTimelineHover = (e) => {
    const timelineContainer = e.currentTarget;
    const rect = timelineContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setPreviewPosition(percent * 100);
  };

  const handleVolumeChange = useCallback((event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    videoRef.current.muted = newVolume === 0;
    setIsMuted(videoRef.current.muted);
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    const updateCurrentTime = () => {
      const formattedTime = formatTime(video.currentTime);
      setCurrentTime(formattedTime);
      const percent = (video.currentTime / video.duration) * 100;
      setProgressPosition(percent);
    };

    const updateTotalTime = () => {
      const formattedTime = formatTime(video.duration);
      setTotalTime(formattedTime);
    };

    video.addEventListener("timeupdate", updateCurrentTime);
    video.addEventListener("durationchange", updateTotalTime);

    return () => {
      video.removeEventListener("timeupdate", updateCurrentTime);
      video.removeEventListener("durationchange", updateTotalTime);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource("http://localhost:8080/sovadart/master.m3u8");
      hls.attachMedia(video);

      return () => {
        if (hls) {
          hls.destroy();
        }
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = "http://localhost:8080/sovadart/master.m3u8";
    }
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    setVolume(video.muted ? 0 : volume);
  };

  const handleTimelineClick = (e) => {
    const timelineContainer = e.currentTarget;
    const rect = timelineContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const video = videoRef.current;
    video.currentTime = percent * video.duration;
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    const formattedHours = hours > 0 ? `${hours}:` : "";
    const formattedMinutes = `${
      minutes < 10 && hours > 0 ? "0" : ""
    }${minutes}:`;
    const formattedSeconds = `${seconds < 10 ? "0" : ""}${seconds}`;

    return `${formattedHours}${formattedMinutes}${formattedSeconds}`;
  };

  return (
    <div className="video-container paused" data-volume-level="high">
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
            <div className="thumb-indicator"></div>
          </div>
        </div>
        <div className="controls">
          <button onClick={togglePlay}>
            {isPlaying ? (
              <svg className="icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M14,19H18V5H14M6,19H10V5H6V19Z" />
              </svg>
            ) : (
              <svg className="icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
              </svg>
            )}
          </button>

          <div className="volume-container">
            <button className="mute-btn" onClick={toggleMute}>
              {isMuted || volume === 0 ? (
                <svg className="volume-muted-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z"
                  />
                </svg>
              ) : volume >= 0.5 ? (
                <svg className="volume-high-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
                  />
                </svg>
              ) : (
                <svg className="volume-low-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M5,9V15H9L14,20V4L9,9M18.5,12C18.5,10.23 17.5,8.71 16,7.97V16C17.5,15.29 18.5,13.76 18.5,12Z"
                  />
                </svg>
              )}
            </button>

            <input
              className="volume-slider"
              type="range"
              min="0"
              max="1"
              step="any"
              value={volume}
              onChange={handleVolumeChange}
            />
          </div>
          <div className="duration-container">
            <div className="current-time">{currentTime}</div>/
            <div className="total-time">{totalTime}</div>
          </div>

          <button className="full-screen-btn">
            <svg className="open" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
              />
            </svg>
          </button>
        </div>
      </div>
      <video ref={videoRef}></video>
    </div>
  );
};

export default VideoPlayer;
