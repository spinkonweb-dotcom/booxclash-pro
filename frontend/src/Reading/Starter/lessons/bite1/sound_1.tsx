import { useRef, useState } from "react";
import {
  Volume2,
  Mic,
  StopCircle,
} from "lucide-react";

// --- Data ---
const letters = [
  { letter: "A", word: "apple", sound: "/a/", audio: "/audio/sounds/a.mp3", image: "/images/lessons/apple.jpeg" },
  { letter: "B", word: "ball", sound: "/b/", audio: "/audio/sounds/b.mp3", image: "/images/lessons/ball.jpg" },
  { letter: "C", word: "cat", sound: "/k/", audio: "/audio/sounds/c.mp3", image: "/images/lessons/cat.jpg" },
  { letter: "D", word: "dog", sound: "/d/", audio: "/audio/sounds/d.mp3", image: "/images/lessons/dog.jpg" },
  { letter: "E", word: "elephant", sound: "/e/", audio: "/audio/sounds/e.mp3", image: "/images/lessons/elephant.jpg" },
  { letter: "F", word: "fish", sound: "/f/", audio: "/audio/sounds/f.mp3", image: "/images/lessons/fish.jpg" },
  { letter: "G", word: "goat", sound: "/g/", audio: "/audio/sounds/g.mp3", image: "/images/lessons/goat.jpg" },
  { letter: "H", word: "hat", sound: "/h/", audio: "/audio/sounds/h.mp3", image: "/images/lessons/hat.jpg" },
  { letter: "I", word: "igloo", sound: "/i/", audio: "/audio/sounds/i.mp3", image: "/images/lessons/igloo.jpg" },
  { letter: "J", word: "jelly", sound: "/j/", audio: "/audio/sounds/j.mp3", image: "/images/lessons/jelly.jpg" },
  { letter: "K", word: "kite", sound: "/k/", audio: "/audio/sounds/k.mp3", image: "/images/lessons/kite.jpg" },
  { letter: "L", word: "lion", sound: "/l/", audio: "/audio/sounds/l.mp3", image: "/images/lessons/lion.jpg" },
  { letter: "M", word: "monkey", sound: "/m/", audio: "/audio/sounds/m.mp3", image: "/images/lessons/monkey.jpg" },
  { letter: "N", word: "nest", sound: "/n/", audio: "/audio/sounds/n.mp3", image: "/images/lessons/nest.jpg" },
  { letter: "O", word: "octopus", sound: "/o/", audio: "/audio/sounds/o.mp3", image: "/images/lessons/octopus.jpg" },
  { letter: "P", word: "pen", sound: "/p/", audio: "/audio/sounds/p.mp3", image: "/images/lessons/pen.jpg" },
  { letter: "Q", word: "queen", sound: "/kw/", audio: "/audio/sounds/q.mp3", image: "/images/lessons/queen.jpg" },
  { letter: "R", word: "rat", sound: "/r/", audio: "/audio/sounds/r.mp3", image: "/images/lessons/rat.jpg" },
  { letter: "S", word: "sun", sound: "/s/", audio: "/audio/sounds/s.mp3", image: "/images/lessons/sun.jpg" },
  { letter: "T", word: "top", sound: "/t/", audio: "/audio/sounds/t.mp3", image: "/images/lessons/top.jpg" },
  { letter: "U", word: "umbrella", sound: "/u/", audio: "/audio/sounds/u.mp3", image: "/images/lessons/umbrella.jpg" },
  { letter: "V", word: "van", sound: "/v/", audio: "/audio/sounds/v.mp3", image: "/images/lessons/van.jpg" },
  { letter: "W", word: "wig", sound: "/w/", audio: "/audio/sounds/w.mp3", image: "/images/lessons/wig.jpg" },
  { letter: "X", word: "box", sound: "/ks/", audio: "/audio/sounds/x.mp3", image: "/images/lessons/box.jpg" },
  { letter: "Y", word: "yak", sound: "/y/", audio: "/audio/sounds/y.mp3", image: "/images/lessons/yak.jpg" },
  { letter: "Z", word: "zebra", sound: "/z/", audio: "/audio/sounds/z.mp3", image: "/images/lessons/zebra.jpg" },
];

export default function AiSoundLesson() {
  const [index, setIndex] = useState(0);
  const [aiMessage, setAiMessage] = useState("👋 Hi! Let's learn sounds. Tap Start!");
  const [aiAudio, setAiAudio] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const current = letters[index];

  // --- Play AI Audio ---
  const playAiAudio = () => {
    if (!aiAudio) return;
    const audio = new Audio(aiAudio);
    audio.play();
  };

  // --- Start Lesson Step ---
  const startLesson = async () => {
    const res = await fetch("/ai-intro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letter: current.letter, word: current.word, sound: current.sound })
    });

    const data = await res.json();
    setAiMessage(data.text);
    setAiAudio(data.audioUrl);
  };

  // --- Start/Stop Recording ---
  const toggleRecording = async () => {
    if (!recording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => sendAudio();

      mediaRecorder.current.start();
      setRecording(true);
      setAiMessage("🎤 Listening... say the sound");
      return;
    } else {
      mediaRecorder.current?.stop();
      setRecording(false);
    }
  };

  // --- Send Audio to Backend for Pronunciation Check ---
  const sendAudio = async () => {
    const blob = new Blob(chunks.current, { type: "audio/webm" });

    const form = new FormData();
    form.append("audio", blob);
    form.append("target", current.sound);

    const res = await fetch("/evaluate", {
      method: "POST",
      body: form,
    });

    const data = await res.json();

    setAiMessage(data.aiReply);
    setAiAudio(data.aiAudioUrl);

    if (data.correct) {
      setTimeout(() => {
        if (index + 1 < letters.length) setIndex(index + 1);
        else setAiMessage("🎉 Amazing! You've finished the alphabet!");
      }, 2000);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <img
        src={current.image}
        alt={current.word}
        className="w-full h-64 object-cover rounded-xl mb-4"
      />

      <div className="p-4 bg-white rounded-xl shadow mb-4">
        <p className="text-lg leading-relaxed">{aiMessage}</p>

        {aiAudio && (
          <button
            onClick={playAiAudio}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            <Volume2 size={18} /> Play Voice
          </button>
        )}
      </div>

      <button
        onClick={startLesson}
        className="w-full mb-3 p-3 bg-purple-600 text-white rounded-xl text-lg"
      >
        Start / Repeat
      </button>

      <button
        onClick={toggleRecording}
        className={`w-full flex items-center justify-center gap-3 p-3 rounded-xl text-white text-lg ${
          recording ? "bg-red-600" : "bg-green-600"
        }`}
      >
        {recording ? <StopCircle /> : <Mic />}
        {recording ? "Stop" : "Record"}
      </button>
    </div>
  );
}
