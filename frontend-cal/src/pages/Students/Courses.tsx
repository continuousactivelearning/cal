import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}
import KeyboardLock from "@/components/proctoring-components/KeyboardLock";
import RightClickDisabler from "@/components/proctoring-components/RightClickDisable";
import { FaPlay, FaPause, FaExpand } from "react-icons/fa";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

const Courses: React.FC = () => {
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<YT.Player | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(50);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const triggeredTimestamps = useRef<Set<number>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [data] = useState([
    {
      video: "1z-E_KOC2L0",
      timestamps: {
        5: [
          {
            question_id: 1,
            question: "What is the capital of France?",
            options: ["Paris", "London", "Berlin"],
            correctAnswer: "Paris",
          },
          {
            question_id: 2,
            question: "What is 2 + 2?",
            options: ["3", "4", "5"],
            correctAnswer: "4",
          },
        ],
        10: [
          {
            question_id: 3,
            question: "What is the capital of India?",
            options: ["Paris", "London", "Berlin"],
            correctAnswer: "Berlin",
          },
          {
            question_id: 4,
            question: "What is 2 + 3?",
            options: ["3", "4", "5"],
            correctAnswer: "5",
          },
        ],
        15: [
          {
            question_id: 5,
            question: "What is the capital of France?",
            options: ["Paris", "London", "Berlin"],
            correctAnswer: "Paris",
          },
          {
            question_id: 6,
            question: "What is 2 + 2?",
            options: ["3", "4", "5"],
            correctAnswer: "4",
          },
        ],
      },
    },
  ]);

  useEffect(() => {
    const videoData = data[0]; // Assuming single video data
    const ts = Object.keys(videoData.timestamps).map(Number);
    setTimestamps(ts);
  }, [data]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isPlaying) {
      interval = setInterval(() => {
        if (player) {
          const current = player.getCurrentTime();
          setCurrentTime(current);

          const currentTimestamp = Math.floor(current);
          if (
            timestamps.includes(currentTimestamp) &&
            !triggeredTimestamps.current.has(currentTimestamp)
          ) {
            triggeredTimestamps.current.add(currentTimestamp);
            pauseVideoAndShowPopup(currentTimestamp);
          }
        }
      }, 500);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, player, timestamps]);

  const initPlayer = () => {
    const playerInstance = new window.YT.Player(videoPlayerRef.current!, {
      videoId: "1z-E_KOC2L0",
      playerVars: {
        enablejsapi: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
    setPlayer(playerInstance);
  };

  const onPlayerReady = (event: YT.PlayerEvent) => {
    const duration = event.target.getDuration();
    setTotalDuration(duration);
    player?.setVolume(volume);
    setPlaybackSpeed(player?.getPlaybackRate() ?? 1);
  };

  const pauseVideoAndShowPopup = (timestamp: number) => {
    if (player) {
      player.pauseVideo();
      setIsPlaying(false);
    }
    setCurrentTimestamp(timestamp);
    setQuestions(data[0].timestamps[timestamp]); // Load questions for this timestamp
    setSelectedAnswer(""); // Clear previous selections
    setCurrentQuestionIndex(0); // Start at the first question for this timestamp
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setCurrentQuestionIndex(0); // Reset question index
    setSelectedAnswer(""); // Clear selected answer
    setQuestions([]); // Clear the current questions
    if (player) {
      player.playVideo();
      setIsPlaying(true);
    }
  };

  const handleIncorrectAnswer = () => {
    if (currentTimestamp !== null) {
      const lastTimestamp = [...triggeredTimestamps.current]
        .filter((t) => t < currentTimestamp)
        .sort((a, b) => b - a)[0];
      const resetTime = lastTimestamp ?? 0;
      setCurrentTime(resetTime);
      player?.seekTo(resetTime, true);
      triggeredTimestamps.current.delete(currentTimestamp);
      setShowPopup(false); // Close the popup
    }
    alert("Wrong answer. Try again!");
  };

  const onPlayerStateChange = (event: YT.OnStateChangeEvent) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    }
  };

  const handleAnswerSelection = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const goToNextQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (selectedAnswer !== currentQuestion.correctAnswer) {
      handleIncorrectAnswer();
      setSelectedAnswer(""); // Clear the selection for the current question
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(""); // Reset selected answer for the new question
    } else {
      closePopup(); // Reset state when all questions are answered
    }
  };

  const togglePlayPause = () => {
    if (player && !showPopup) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
      setIsPlaying(!isPlaying);
    } else if (showPopup) {
      alert("Please close the popup before resuming the video.");
    }
  };

  const seekVideo = (newTime: number) => {
    if (player && newTime <= currentTime) {
      player.seekTo(newTime, true);
      setCurrentTime(newTime);
    } else {
      alert("Skipping forward is not allowed.");
    }
  };

  const changeVolume = (newVolume: number) => {
    setVolume(newVolume);
    player?.setVolume(newVolume);
  };

  const changePlaybackSpeed = (speed: number) => {
    player?.setPlaybackRate(speed);
    setPlaybackSpeed(speed);
  };

  const toggleFullscreen = () => {
    const videoContainer = document.querySelector(
      ".video-container"
    ) as HTMLElement;
    if (videoContainer.requestFullscreen) {
      videoContainer.requestFullscreen();
    } else if ((videoContainer as any).mozRequestFullScreen) {
      (videoContainer as any).mozRequestFullScreen();
    } else if ((videoContainer as any).webkitRequestFullscreen) {
      (videoContainer as any).webkitRequestFullscreen();
    } else if ((videoContainer as any).msRequestFullscreen) {
      (videoContainer as any).msRequestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="youtube-player h-full relative">
      <RightClickDisabler />
      <KeyboardLock />
      <div className="youtube-player h-4/5">
        <div className="video-container h-full bg-gray-400 p-3 mx-20">
          <div
            ref={videoPlayerRef}
            className="w-full h-full no-interaction"
          ></div>
        </div>
        <div className="flex justify-center">
          <div className="controls-container w-full mx-20 mt-4 bg-white p-4 rounded-lg shadow">
            <div className="mt-2">
              <input
                type="range"
                className="w-full"
                min="0"
                max={totalDuration}
                value={currentTime}
                onChange={(e) => seekVideo(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-between">
              <div className="flex items-center">
                <button
                  onClick={togglePlayPause}
                  className="text-2xl p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <div className="ml-6 flex items-center">
                  <label htmlFor="volume" className="mr-2 text-sm font-medium">
                    Volume:
                  </label>
                  <input
                    id="volume"
                    type="range"
                    className="w-24"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center">
                <div className="text-sm font-medium">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </div>
              </div>
              <div className="flex items-center">
                {[0.5, 1, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => changePlaybackSpeed(speed)}
                    className={`mx-1 px-3 py-1 text-sm rounded-full ${
                      playbackSpeed === speed
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              <div>
                <button
                  onClick={toggleFullscreen}
                  className="text-xl p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                >
                  <FaExpand />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPopup && (
        <div className="popup absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="popup-content bg-white p-5 rounded shadow-lg w-1/2 h-1/2 px-10">
            <h1 className="text-2xl font-bold uppercase my-5 flex justify-center">
              Assesment
            </h1>
            <div className="flex pt-4">
              <div className="mb-4">
                <p className="font-semibold">
                  {questions[currentQuestionIndex].question}
                </p>
                {questions[currentQuestionIndex].options.map((option, i) => (
                  <div key={i} className="flex items-center mt-2">
                    <input
                      type="radio"
                      id={`option-${i}`}
                      name="current-question"
                      value={option}
                      onChange={() => handleAnswerSelection(option)}
                      checked={selectedAnswer === option} // Explicitly bind the state
                      className="mr-2"
                    />

                    <label htmlFor={`option-${i}`}>{option}</label>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={goToNextQuestion}
              disabled={!selectedAnswer}
              className={`mt-4 px-4 py-2 h-10 rounded ${
                selectedAnswer
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            >
              {currentQuestionIndex < questions.length - 1 ? "Next" : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;