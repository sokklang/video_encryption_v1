// HLSPlayer.js
import React, { useRef, useEffect } from "react";
import Hls from "hls.js";

const VideoPlayer = () => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource("http://192.168.1.200:8080/output/output.m3u8");
      hls.attachMedia(videoRef.current);

      return () => {
        if (hls) {
          hls.destroy();
        }
      };
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = "http://192.168.1.200:8080/output/output.m3u8";
    }
  }, []);

  return (
    <div>
      <video ref={videoRef} controls className="video-js vjs-default-skin" />
    </div>
  );
};

export default VideoPlayer;
