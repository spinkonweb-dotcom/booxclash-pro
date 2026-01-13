// readingStarter.data.ts

// ------------------------
// IMPORTS
// ------------------------
import bite1 from "./Starter/bites/bite1";

import sound_1 from "./Starter/lessons/bite1/sound_1";
import phoneme_match_1 from "./Starter/lessons/bite1/phoneme_match_1";
import sound_sort from "./Starter/lessons/bite1/sound_sort";
import letter_sound_bins from "./Starter/lessons/bite1/letter_sound_bins";
import phonics_dash from "./Starter/lessons/bite1/phonics_dash";

import video_vignettes from "./Starter/lessons/bite2/video_vignettes";
import listen_and_match from "./Starter/lessons/bite2/listen_and_match";
import listen_and_repeat from "./Starter/lessons/bite2/listen_and_repeat";
import what_do_you_say from "./Starter/lessons/bite2/what_do_you_say";
import greeting_dash from "./Starter/lessons/bite2/greeting_dash";

// ------------------------
// DATA: BITE 1 LESSONS
// ------------------------

// Lesson 2: Phoneme Match (Ship vs Sheep)
const phonemeMatchData = {
  audioUrl: "/assets/audio/ship.mp3",
  options: [
    {
      id: "opt1",
      word: "Ship",
      imageUrl: "https://images.unsplash.com/photo-1548600916-dc8492f8e845?w=400",
      isCorrect: true,
    },
    {
      id: "opt2",
      word: "Sheep",
      imageUrl: "https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=400",
      isCorrect: false,
    },
  ],
};

// Lesson 3: Sound Sort
const soundSortData = {
  options: [
    {
      id: "opt1",
      word: "Cat",
      imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400",
      isOddOneOut: false,
      audioUrl: "/assets/audio/cat.mp3",
    },
    {
      id: "opt2",
      word: "Cup",
      imageUrl: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=400",
      isOddOneOut: false,
      audioUrl: "/assets/audio/cup.mp3",
    },
    {
      id: "opt3",
      word: "Dog",
      imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400",
      isOddOneOut: true,
      audioUrl: "/assets/audio/dog.mp3",
    },
  ],
};

// Lesson 4: Letter Sound Bins
const letterSoundBinsData = {
  bins: [
    {
      id: "bin_b",
      label: "B",
      colorClass: "bg-blue-50 border-blue-200 hover:border-blue-400",
    },
    {
      id: "bin_p",
      label: "P",
      colorClass: "bg-pink-50 border-pink-200 hover:border-pink-400",
    },
  ],
  items: [
    {
      id: "item1",
      word: "Bear",
      imageUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=400",
      correctBinId: "bin_b",
      audioUrl: "/assets/audio/bear.mp3",
    },
    {
      id: "item2",
      word: "Pan",
      imageUrl: "https://images.unsplash.com/photo-1584949514123-474cfa705d52?w=400",
      correctBinId: "bin_p",
      audioUrl: "/assets/audio/pan.mp3",
    },
    {
      id: "item3",
      word: "Ball",
      imageUrl: "https://images.unsplash.com/photo-1530968464165-7a1861cbaf9f?w=400",
      correctBinId: "bin_b",
      audioUrl: "/assets/audio/ball.mp3",
    },
  ],
};

// Lesson 5: Phonics Dash
const phonicsDashData = {
  timePerRound: 4000,
  rounds: [
    {
      id: "dash1",
      audioUrl: "/assets/audio/sound_m.mp3",
      correctLetter: "M",
      distractors: ["S", "T"],
    },
    {
      id: "dash2",
      audioUrl: "/assets/audio/sound_s.mp3",
      correctLetter: "S",
      distractors: ["M", "B"],
    },
    {
      id: "dash3",
      audioUrl: "/assets/audio/sound_t.mp3",
      correctLetter: "T",
      distractors: ["P", "S"],
    },
    {
      id: "dash4",
      audioUrl: "/assets/audio/sound_a.mp3",
      correctLetter: "A",
      distractors: ["O", "I"],
    },
  ],
};

// ------------------------
// DATA: BITE 2 LESSONS
// ------------------------

// Video Vignettes (Greetings)
const greetingsVignetteData = {
  vignettes: [
    {
      id: "v1",
      greeting: "Good morning",
      contextLabel: "Morning • Sunrise",
      icon: "sun",
      videoUrl: "https://youtu.be/d95PPykB2vE",
      posterUrl: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600",
    },
    {
      id: "v2",
      greeting: "Hi!",
      contextLabel: "Casual • Café",
      icon: "coffee",
      videoUrl: "https://youtu.be/d95PPykB2vE",
      posterUrl: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=600",
    },
    {
      id: "v3",
      greeting: "Hello",
      contextLabel: "Formal • Office",
      icon: "school",
      videoUrl: "https://youtu.be/d95PPykB2vE",
      posterUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600",
    },
    {
      id: "v4",
      greeting: "Good evening",
      contextLabel: "Evening • Sunset",
      icon: "moon",
      videoUrl: "https://youtu.be/d95PPykB2vE",
      posterUrl: "https://images.unsplash.com/photo-1517504734587-2890819debab?w=600",
    },
  ],
};

// Listen + Match
const greetingMatchData = {
  audioUrl: "/assets/audio/good_morning.mp3",
  options: [
    {
      id: "opt_sunrise",
      label: "Sunrise",
      imageUrl: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400",
      isCorrect: true,
    },
    {
      id: "opt_noon",
      label: "Midday Sun",
      imageUrl: "https://images.unsplash.com/photo-1605218427306-022ba8c696b9?w=400",
      isCorrect: false,
    },
    {
      id: "opt_moon",
      label: "Moon",
      imageUrl: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=400",
      isCorrect: false,
    },
  ],
};

// Listen + Repeat
const practiceHelloData = {
  word: "Hello",
  audioUrl: "/assets/audio/hello.mp3",
};

// Context Choice
const greetingsContextData = {
  scenarios: [
    {
      id: "s1",
      timeLabel: "8:00 AM",
      locationLabel: "Classroom",
      situationText: "You walk into class and see your teacher. What do you say?",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
      options: [
        {
          id: "opt_a",
          text: "Good morning",
          isCorrect: true,
          feedback: "Perfect! It is 8:00 AM, so 'Good Morning' is correct.",
        },
        {
          id: "opt_b",
          text: "Good evening",
          isCorrect: false,
          feedback: "Oops! 'Good evening' is used after 6:00 PM.",
        },
        {
          id: "opt_c",
          text: "Hi",
          isCorrect: true,
          feedback: "That works! 'Hi' is friendly, but 'Good Morning' is more polite for a teacher.",
        },
      ],
    },
    {
      id: "s2",
      timeLabel: "7:00 PM",
      locationLabel: "Restaurant",
      situationText: "You meet your friends for dinner. What do you say?",
      avatarUrl: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=400",
      options: [
        {
          id: "opt_a",
          text: "Good morning",
          isCorrect: false,
          feedback: "Not quite. The sun has gone down!",
        },
        {
          id: "opt_b",
          text: "Good evening",
          isCorrect: true,
          feedback: "Correct! It is dinner time.",
        },
        {
          id: "opt_c",
          text: "Good night",
          isCorrect: false,
          feedback: "Careful! 'Good night' is only used when you are leaving or going to sleep.",
        },
      ],
    },
  ],
};

// Dash Game (Greetings)
const greetingDashData = {
  timePerRound: 5000,
  rounds: [
    {
      id: "dash_1",
      imageUrl: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600",
      timeLabel: "7:00 AM",
      options: [
        { id: "o1", text: "Good evening", isCorrect: false },
        { id: "o2", text: "Good morning", isCorrect: true },
        { id: "o3", text: "Good night", isCorrect: false },
      ],
    },
    {
      id: "dash_2",
      imageUrl: "https://images.unsplash.com/photo-1517504734587-2890819debab?w=600",
      timeLabel: "8:00 PM",
      options: [
        { id: "o1", text: "Good morning", isCorrect: false },
        { id: "o2", text: "Hi", isCorrect: false },
        { id: "o3", text: "Good evening", isCorrect: true },
      ],
    },
    {
      id: "dash_3",
      imageUrl: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=600",
      timeLabel: "11:00 PM",
      options: [
        { id: "o1", text: "Good night", isCorrect: true },
        { id: "o2", text: "Good morning", isCorrect: false },
        { id: "o3", text: "Hello", isCorrect: false },
      ],
    },
  ],
};

// ------------------------
// FINAL EXPORTED STRUCTURE
// ------------------------

export const readingStarterData = {
  bites: [
    {
      id: 1,
      component: bite1,
      lessons: [
        {
          id: "l1",
          type: "sound_intro",
          component: sound_1,
          props: { audioUrl: "/assets/audio/short_i_sound.mp3" },
        },
        {
          id: "l2",
          type: "phoneme_match",
          component: phoneme_match_1,
          props: phonemeMatchData,
        },
        {
          id: "l3",
          type: "sound_sort",
          component: sound_sort,
          props: soundSortData,
        },
        {
          id: "l4",
          type: "letter_sound_bins",
          component: letter_sound_bins,
          props: letterSoundBinsData,
        },
        {
          id: "l5",
          type: "phonics_dash",
          component: phonics_dash,
          props: phonicsDashData,
        },
        {
          id: "b2_l1",
          type: "video_vignettes",
          component: video_vignettes,
          props: greetingsVignetteData,
        },
        {
          id: "b2_l2",
          type: "listen_match",
          component: listen_and_match,
          props: greetingMatchData,
        },
        {
          id: "b2_l3",
          type: "listen_repeat",
          component: listen_and_repeat,
          props: practiceHelloData,
        },
        {
          id: "b2_l4",
          type: "context_choice",
          component: what_do_you_say,
          props: greetingsContextData,
        },
        {
          id: "b2_l5",
          type: "greeting_dash",
          component: greeting_dash,
          props: greetingDashData,
        },
      ],
    },
  ],
};
