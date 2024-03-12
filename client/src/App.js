// App.js
import React from "react";
import VideoPlayer from "./VideoPlayer";

const App = () => {
  return (
    <div className="text-center">
      <h1 className="mt-5">HLS Player</h1>
      <VideoPlayer />
    </div>
  );
};

export default App;
