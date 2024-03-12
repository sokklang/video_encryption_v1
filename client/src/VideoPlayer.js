import React, { useRef, useEffect } from "react";
import Hls from "hls.js";

const VideoPlayer = () => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource("http://localhost:8080/video/master.m3u8");
      hls.attachMedia(video);

      // Removed video.play() call

      return () => {
        if (hls) {
          hls.destroy();
        }
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = "http://localhost:8080/video/master.m3u8";
      // Removed video.play() call
    }
  }, []);

  return (
    <div>
      {/* Width and margin for styling */}
      <video
        ref={videoRef}
        controls
        width="1280"
        height="720"
        autoPlay={false} // Disable autoplay
      />
    </div>
  );
};

export default VideoPlayer;
