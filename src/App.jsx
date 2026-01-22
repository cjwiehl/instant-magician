// src/App.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  ArrowRight,
  Hand,
  Mic,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

const App = () => {
  // -----------------------------
  // STATE
  // -----------------------------
  const [magicianName, setMagicianName] = useState("");
  const [audienceName, setAudienceName] = useState("Chris");

  /**
   * Stages:
   * setup
   * instructions
   * intro
   * deckCheck
   * deckTimer
   * trick_shuffle
   * think_card
   * choose_number
   * deal_number
   * guess_3h
   * confirm_3h
   * color_q
   * suit_q
   * range_q
   * ask_specific_card
   * recap_turnover
   * finale
   * apology
   */
  const [stage, setStage] = useState("setup");
  const [previousStage, setPreviousStage] = useState(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(10);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Trick state
  const [targetNumber, setTargetNumber] = useState(null);

  const [cardState, setCardState] = useState({
    color: "", // "Red" | "Black"
    suit: "", // "Heart" | "Diamond" | "Club" | "Spade"
    range: "", // "High" | "Low"
  });

  // This controls your special “I meant to say…” chain.
  const [usedIMeantToSay, setUsedIMeantToSay] = useState(false);

  // Confirmation (between questions)
  const [confirmationText, setConfirmationText] = useState("");

  // -----------------------------
  // CONFIG
  // -----------------------------
  const TARGET_URL = "https://www.chriswheel.com";

  const FINALE_SONG_URL =
    "https://cdn1.suno.ai/436bd471-0369-4a2d-8db0-1541e0a671b0.mp3";
  const MAGIC_SOUND_URL =
    "https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.mp3";
  const TIMER_SOUND_URL =
    "https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3";

  const audioRef = useRef(new Audio(MAGIC_SOUND_URL));
  const finaleRef = useRef(new Audio(FINALE_SONG_URL));
  const timerAudioRef = useRef(new Audio(TIMER_SOUND_URL));

  // -----------------------------
  // Helpers: color scheme
  // Spoken text = GREEN
  // Silent actions = RED
  // -----------------------------
  const SPOKEN = "text-emerald-400";
  const ACTION = "text-red-400 border-red-500";

  // Make red action text the same size as spoken.
  const spokenSize = "text-2xl md:text-4xl";
  const actionSize = "text-2xl md:text-4xl";

  // -----------------------------
  // EFFECT: Timer with delay
  // -----------------------------
  useEffect(() => {
    let interval = null;
    let delayTimeout = null;

    if (stage === "deckTimer") {
      if (!isTimerActive) {
        delayTimeout = setTimeout(() => {
          setIsTimerActive(true);
        }, 6000);
      } else if (timeLeft > 0) {
        try {
          timerAudioRef.current.currentTime = 0;
          timerAudioRef.current.play().catch(() => {});
        } catch (e) {}

        interval = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev > 1) {
              try {
                timerAudioRef.current.currentTime = 0;
                timerAudioRef.current.play().catch(() => {});
              } catch (e) {}
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      setIsTimerActive(false);
      try {
        timerAudioRef.current.pause();
        timerAudioRef.current.currentTime = 0;
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      clearTimeout(delayTimeout);
    };
  }, [stage, timeLeft, isTimerActive]);

  // -----------------------------
  // EFFECT: Finale music
  // -----------------------------
  useEffect(() => {
    if (stage === "finale") {
      try {
        finaleRef.current.currentTime = 0;
        finaleRef.current.volume = 0.6;
        finaleRef.current.play().catch(() => {});
      } catch (e) {}
    } else {
      try {
        finaleRef.current.pause();
      } catch (e) {}
    }
  }, [stage]);

  // -----------------------------
  // Handlers
  // -----------------------------
  const playMagicSound = () => {
    try {
      audioRef.current.volume = 0.5;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch (e) {}
  };

  const handleStart = () => {
    if (magicianName.trim()) setStage("instructions");
  };

  const handleMessedUp = () => {
    setPreviousStage(stage);
    setStage("apology");
  };

  const handleApologyRecover = () => {
    if (previousStage) setStage(previousStage);
    else setStage("intro");
  };

  const handleRestart = () => {
    setStage("setup");
    setPreviousStage(null);
    setTimeLeft(10);
    setIsTimerActive(false);
    setTargetNumber(null);
    setCardState({ color: "", suit: "", range: "" });
    setUsedIMeantToSay(false);
    setConfirmationText("");
    setMagicianName("");
    setAudienceName("Chris");
  };

  // -----------------------------
  // Derived: suits based on color
  // -----------------------------
  const suitsForColor = useMemo(() => {
    if (cardState.color === "Red") return ["Heart", "Diamond"];
    if (cardState.color === "Black") return ["Club", "Spade"];
    // default (shouldn’t happen) – pick red family
    return ["Heart", "Diamond"];
  }, [cardState.color]);

  const suitA = suitsForColor[0];
  const suitB = suitsForColor[1];

  // -----------------------------
  // Reusable wrappers
  // -----------------------------
  const ScriptView = ({ children, onNext, nextLabel = "NEXT STEP" }) => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 pt-6 md:pt-10 pb-6 animate-fadeIn font-['Poppins']">
      <div className="flex-grow flex flex-col justify-center space-y-6 overflow-y-auto min-h-0 scrollbar-hide">
        {children}
      </div>
      <button
        onClick={onNext}
        className="shrink-0 w-full py-5 mt-6 bg-[#D4C5B0] hover:bg-[#c2b29c] rounded-sm text-black text-lg font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        {nextLabel} <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  const BottomMistakeButton = () => (
    <div className="mt-auto pt-6 border-t border-gray-800 text-center">
      <button
        onClick={handleMessedUp}
        className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 mx-auto transition-colors"
      >
        <AlertTriangle className="w-4 h-4" />
        Wait, I messed up
      </button>
    </div>
  );

  // -----------------------------
  // Renders
  // -----------------------------
  const renderSetup = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fadeIn max-w-md mx-auto px-6 font-['Poppins'] relative z-10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white uppercase leading-tight tracking-wider">
          THE INSTANT
          <br />
          MAGICIAN
        </h1>
        <div className="w-16 h-1 bg-[#D4C5B0] mx-auto mt-6" />
      </div>

      <p className="text-gray-400 text-center font-light">
        Enter your name to become an amazing magician.
      </p>

      <div className="w-full space-y-4">
        <input
          type="text"
          value={magicianName}
          onChange={(e) => setMagicianName(e.target.value)}
          placeholder="YOUR NAME"
          className="w-full px-6 py-4 bg-transparent border-b-2 border-gray-700 text-center text-white text-xl placeholder-gray-600 focus:outline-none focus:border-[#D4C5B0] transition-colors uppercase font-bold tracking-wider"
        />

        <button
          onClick={handleStart}
          disabled={!magicianName.trim()}
          className={`w-full py-4 mt-4 font-bold text-sm tracking-[0.2em] uppercase transition-all ${
            magicianName.trim()
              ? "bg-[#D4C5B0] text-black hover:bg-white shadow-lg"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          Begin Experience
        </button>
      </div>
    </div>
  );

  const renderInstructions = () => (
    <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto px-6 text-center animate-fadeIn font-['Poppins']">
      <h2 className="text-3xl font-bold text-white mb-8 uppercase tracking-wide">
        Script Guide
      </h2>

      <div className="space-y-8 bg-[#1a1a1a] p-8 w-full shadow-2xl border-l-4 border-[#D4C5B0]">
        <div className="flex items-start gap-6 text-left">
          <div className="bg-emerald-500/10 p-3 rounded-full">
            <Mic className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-emerald-400 font-bold text-lg uppercase tracking-wider mb-1">
              Green Text
            </h3>
            <p className="text-gray-400 text-sm font-light">
              Read these words out loud to the audience.
            </p>
          </div>
        </div>

        <div className="w-full h-px bg-white/5" />

        <div className="flex items-start gap-6 text-left">
          <div className="bg-red-500/10 p-3 rounded-full">
            <Hand className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-red-400 font-bold text-lg uppercase tracking-wider mb-1">
              Red Text
            </h3>
            <p className="text-gray-400 text-sm font-light">
              These are silent actions for you to perform.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setStage("intro")}
        className="mt-12 px-8 py-4 bg-transparent border border-[#D4C5B0] text-[#D4C5B0] hover:bg-[#D4C5B0] hover:text-black text-sm font-bold tracking-[0.2em] uppercase transition-all flex items-center gap-3"
      >
        I Understand <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  const renderIntro = () => (
    <ScriptView onNext={() => setStage("deckCheck")}>
      <p
        className={`${spokenSize} leading-tight ${SPOKEN} font-bold drop-shadow-md text-center`}
      >
        HELLO {audienceName}! I am {magicianName} the Great.
      </p>

      <p
        className={`${actionSize} ${ACTION} italic font-light tracking-wide border-l-2 pl-4 text-left`}
      >
        (Strike a confident pose)
      </p>

      <p
        className={`${spokenSize} leading-tight ${SPOKEN} font-bold drop-shadow-md text-center`}
      >
        For the next 2 minutes, I am the greatest magician in this room. Sorry,
        but it's true.
      </p>
    </ScriptView>
  );

  const renderDeckCheck = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 justify-center animate-fadeIn text-center font-['Poppins']">
      <p className={`${spokenSize} leading-tight ${SPOKEN} font-bold mb-12`}>
        Do you happen to have a normal, regular deck of cards I can borrow for
        this trick?
      </p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setStage("trick_shuffle")}
          className="py-8 bg-[#1a1a1a] border border-gray-800 hover:border-emerald-500/50 text-emerald-400 text-xl font-bold flex flex-col items-center gap-3 transition-all group"
        >
          <CheckCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <span className="uppercase tracking-widest text-sm">Yes</span>
        </button>

        <button
          onClick={() => {
            setTimeLeft(10);
            setIsTimerActive(false);
            setStage("deckTimer");
          }}
          className="py-8 bg-[#1a1a1a] border border-gray-800 hover:border-red-500/50 text-red-400 text-xl font-bold flex flex-col items-center gap-3 transition-all group"
        >
          <XCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <span className="uppercase tracking-widest text-sm">No</span>
        </button>
      </div>
    </div>
  );

  const renderTimer = () => (
    <div className="flex flex-col h-full justify-center items-center text-center px-6 font-['Poppins']">
      <p className={`${spokenSize} ${SPOKEN} font-bold mb-10 leading-relaxed`}>
        Well darn... I guess we'll wait for you to find one. You have 10 seconds!
      </p>

      <div
        className={`text-7xl md:text-8xl font-black mb-10 tracking-tighter ${
          !isTimerActive ? "text-[#D4C5B0]" : "text-red-500"
        }`}
      >
        {!isTimerActive ? (
          <span className="text-4xl md:text-5xl animate-pulse tracking-widest">
            WAITING...
          </span>
        ) : timeLeft > 0 ? (
          `00:${timeLeft.toString().padStart(2, "0")}`
        ) : (
          "00:00"
        )}
      </div>

      <button
        onClick={() => {
          try {
            timerAudioRef.current.pause();
          } catch (e) {}
          setStage("trick_shuffle");
        }}
        className="px-10 py-5 bg-[#D4C5B0] text-black text-xl font-bold uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl"
      >
        Found It
      </button>
    </div>
  );

  const renderTrickShuffle = () => (
    <ScriptView onNext={() => setStage("think_card")}>
      <p className={`${actionSize} ${ACTION} italic font-light border-l-2 pl-4`}>
        (Hand the deck to Chris)
      </p>

      <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
        Please shuffle the deck as much as you want. Really mix them up!
      </p>
    </ScriptView>
  );

  const renderThinkCard = () => (
    <ScriptView onNext={() => setStage("choose_number")}>
      <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
        Now just think of any card in the deck and lock it in your head.
      </p>
      <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
        Don’t say it. Don’t point. Just think it.
      </p>
    </ScriptView>
  );

  const renderChooseNumber = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 justify-center animate-fadeIn text-center font-['Poppins']">
      <p className={`${spokenSize} ${SPOKEN} font-bold mb-6 leading-tight`}>
        Now think of that card and I will peer into your soul...
      </p>

      <p className={`${actionSize} ${ACTION} italic font-light border-l-2 pl-4 text-left mb-10`}>
        (Look at Chris and do a mind-reading gesture.)
      </p>

      <p className={`${actionSize} ${ACTION} italic font-light mb-8`}>
        Think of a number and type it in the box below and then press{" "}
        <span className="underline underline-offset-4">"Use That Number"</span>
      </p>

      <div className="bg-[#1a1a1a] p-6 border border-gray-800">
        <p className="text-gray-400 mb-3 text-sm font-bold uppercase tracking-[0.25em]">
          TYPE NUMBER HERE
        </p>

        <input
          type="number"
          min="1"
          max="52"
          placeholder="#"
          className="w-full bg-black border border-gray-700 rounded-sm p-4 text-center text-4xl text-white mb-5 focus:border-[#D4C5B0] outline-none font-bold"
          id="manualNumInput"
        />

        <button
          onClick={() => {
            const raw = document.getElementById("manualNumInput")?.value;
            const n = parseInt(raw, 10);
            if (!Number.isFinite(n) || n < 1 || n > 52) return;

            // reset downstream state
            setTargetNumber(n);
            setCardState({ color: "", suit: "", range: "" });
            setUsedIMeantToSay(false);
            setConfirmationText("");

            setStage("deal_number");
            playMagicSound();
          }}
          className="w-full py-4 bg-[#D4C5B0] hover:bg-white text-black text-sm font-bold uppercase tracking-[0.2em] transition-all"
        >
          Use That Number
        </button>
      </div>

      <BottomMistakeButton />
    </div>
  );

  const renderDealNumber = () => (
    <ScriptView onNext={() => setStage("guess_3h")} nextLabel="NEXT">
      <div className="bg-[#1a1a1a] p-8 border-l-4 border-[#D4C5B0] mb-8 text-center shrink-0">
        <p className="text-[#D4C5B0] text-xs uppercase tracking-[0.3em] mb-2 font-bold">
          The Number
        </p>
        <div className="text-8xl font-black text-emerald-400 tracking-tighter">
          {targetNumber}
        </div>
      </div>

      <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
        The card you are thinking of is exactly {targetNumber} cards down in the
        deck.
      </p>

      <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
        So deal down {targetNumber - 1} cards into a pile and put the{" "}
        {targetNumber}th card next to it face down.
      </p>
    </ScriptView>
  );

  const renderGuess3H = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 animate-fadeIn relative font-['Poppins']">
      <div className="flex-grow flex flex-col justify-center space-y-8">
        <p className={`${spokenSize} ${SPOKEN} font-bold text-center leading-tight`}>
          Did you choose the 3 of hearts?
        </p>

        <p className={`${actionSize} ${ACTION} italic font-light text-center`}>
          Click the answer below.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setConfirmationText("I knew it.");
              setStage("confirm_3h");
              playMagicSound();
            }}
            className="py-8 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            YES
          </button>

          <button
            onClick={() => {
              setConfirmationText("That would have been amazing.");
              setStage("color_q");
              playMagicSound();
            }}
            className="py-8 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            NO
          </button>
        </div>
      </div>

      <BottomMistakeButton />
    </div>
  );

  const renderConfirm3H = () => (
    <ScriptView onNext={() => setStage("recap_turnover")} nextLabel="Click when the card is turned over">
      <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
        I knew it.
      </p>
      <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
        By reading your mind I could tell that your card was exactly{" "}
        {targetNumber} cards down.
      </p>
      <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
        Not {targetNumber - 1}... not {targetNumber + 1}... exactly{" "}
        {targetNumber}.
      </p>
      <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
        Turn your card over.
      </p>
    </ScriptView>
  );

  const renderColorQ = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 animate-fadeIn relative font-['Poppins']">
      <div className="flex-grow flex flex-col justify-center space-y-8">
        <p className={`${spokenSize} ${SPOKEN} font-bold text-center leading-tight`}>
          That would have been amazing.
        </p>

        <p className={`${spokenSize} ${SPOKEN} font-bold text-center leading-tight`}>
          But I do feel that your card is a red card… correct?
        </p>

        <p className={`${actionSize} ${ACTION} italic font-light text-center`}>
          Click the answer below.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setCardState((s) => ({ ...s, color: "Red" }));
              setUsedIMeantToSay(false);
              setConfirmationText("I knew that.");
              setStage("suit_q");
              playMagicSound();
            }}
            className="py-8 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            YES
          </button>

          <button
            onClick={() => {
              setCardState((s) => ({ ...s, color: "Black" }));
              setUsedIMeantToSay(false);
              setConfirmationText("I didn’t think so.");
              setStage("suit_q");
              playMagicSound();
            }}
            className="py-8 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            NO
          </button>
        </div>
      </div>

      <BottomMistakeButton />
    </div>
  );

  const renderSuitQ = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 animate-fadeIn relative font-['Poppins']">
      <div className="flex-grow flex flex-col justify-center space-y-8">
        <p className={`${spokenSize} ${SPOKEN} font-bold text-center leading-tight`}>
          Is it a {suitA.toUpperCase()}?
        </p>

        <p className={`${actionSize} ${ACTION} italic font-light text-center`}>
          Click the answer below.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              // YES -> suitA
              setCardState((s) => ({ ...s, suit: suitA }));
              // Response text depends on whether they said YES to "red card?"
              if (cardState.color === "Red") {
                // they said "YES" to red card (acted confident)
                setConfirmationText("Yes… 2 for 2.");
              } else {
                // they said "NO" to red card (deadpan path)
                setConfirmationText("I’m locked in now.");
              }
              setUsedIMeantToSay(false);
              setStage("range_q");
              playMagicSound();
            }}
            className="py-8 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            YES
          </button>

          <button
            onClick={() => {
              // NO -> suitB
              setCardState((s) => ({ ...s, suit: suitB }));

              // If they were "confident" on color (they answered YES to red card),
              // use the "I meant to say..." line and set the flag.
              if (cardState.color === "Red") {
                setConfirmationText(`I meant to say… ${suitB}.`);
                setUsedIMeantToSay(true);
              } else {
                setConfirmationText("I didn’t think so either.");
                setUsedIMeantToSay(false);
              }

              setStage("range_q");
              playMagicSound();
            }}
            className="py-8 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            NO
          </button>
        </div>
      </div>

      <BottomMistakeButton />
    </div>
  );

  const renderRangeQ = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 animate-fadeIn relative font-['Poppins']">
      <div className="flex-grow flex flex-col justify-center space-y-8">
        {confirmationText ? (
          <p className={`${spokenSize} ${SPOKEN} font-bold text-center leading-tight`}>
            {confirmationText}
          </p>
        ) : null}

        <p className={`${spokenSize} ${SPOKEN} font-bold text-center leading-tight`}>
          Think if the card is low like Ace to 7, or high like 8 to King. Was it a
          high card?
        </p>

        <p className={`${actionSize} ${ACTION} italic font-light text-center`}>
          Click the answer below.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setCardState((s) => ({ ...s, range: "High" }));
              setConfirmationText("I think I know what it is!");
              setStage("ask_specific_card");
              playMagicSound();
            }}
            className="py-8 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            YES
          </button>

          <button
            onClick={() => {
              setCardState((s) => ({ ...s, range: "Low" }));

              // Your new rule:
              // Only do the “I meant to say...” low card line if the suit step used “I meant to say…”
              if (usedIMeantToSay) {
                setConfirmationText("I meant to say… sorry — I meant to say it was a low card.");
              } else {
                setConfirmationText("Perfect. Low card.");
              }

              setStage("ask_specific_card");
              playMagicSound();
            }}
            className="py-8 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            NO
          </button>
        </div>
      </div>

      <BottomMistakeButton />
    </div>
  );

  const renderAskSpecific = () => (
    <ScriptView
      onNext={() => setStage("recap_turnover")}
      nextLabel="NEXT"
    >
      <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
        For the first time… what {cardState.range} {cardState.suit} card did you choose?
      </p>

      <p className={`${actionSize} ${ACTION} italic font-light border-l-2 pl-4 text-left`}>
        (Wait for Chris to name the card.)
      </p>

      <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
        {confirmationText}
      </p>
    </ScriptView>
  );

  const renderRecapTurnover = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 pt-6 md:pt-10 pb-6 animate-fadeIn font-['Poppins']">
      <div className="flex-grow flex flex-col justify-center space-y-6 overflow-y-auto min-h-0 scrollbar-hide">
        <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
          You shuffled the deck, thought of any card — that I could not have known.
        </p>

        <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
          I had a feeling about the number {targetNumber}… a number you could not have known.
        </p>

        <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
          You dealt down that many cards.
        </p>

        <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
          The chances of your thought-of card to be at that exact number is a million to one....
          don’t fact check me.
        </p>

        <p className={`${spokenSize} ${SPOKEN} font-bold leading-tight text-center`}>
          Now, turn over the card to see if it is your thought of card.
        </p>

        <p className={`${actionSize} ${ACTION} italic font-light border-l-2 pl-4 text-left`}>
          (When the card is turned over, press the button.)
        </p>
      </div>

      <button
        onClick={() => {
          setStage("finale");
          playMagicSound();
        }}
        className="shrink-0 w-full py-5 mt-6 bg-[#D4C5B0] hover:bg-[#c2b29c] rounded-sm text-black text-lg font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        Click when the card is turned over <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderFinale = () => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-zoomIn px-6 font-['Poppins'] relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D4C5B0] blur-[100px] opacity-20 animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10">
          <p className="text-5xl md:text-7xl text-emerald-400 font-black drop-shadow-2xl tracking-tighter uppercase mb-6">
            THANK YOU.
          </p>
          <p className="text-emerald-400 text-2xl md:text-4xl font-bold leading-tight">
            You can clap for me now…
          </p>
          <p className="text-emerald-400 text-3xl md:text-5xl font-black leading-tight mt-3">
            {magicianName || "NAME"} the AMAZING!
          </p>
        </div>

        <p className="text-[#D4C5B0] italic mb-8 font-light tracking-widest text-sm">
          (Playing Finale Music...)
        </p>

        <button
          onClick={() => {
            window.location.href = TARGET_URL;
          }}
          className="w-full py-6 bg-[#D4C5B0] hover:bg-white text-black rounded-sm font-bold text-xl uppercase tracking-[0.25em] shadow-[0_0_30px_rgba(212,197,176,0.3)] mb-5 transition-all transform hover:scale-105"
        >
          END
        </button>

        <button
          onClick={handleRestart}
          className="text-gray-600 hover:text-white transition-colors uppercase tracking-[0.2em] text-xs font-bold flex items-center justify-center gap-2 mx-auto"
        >
          <RotateCcw className="w-3 h-3" />
          Reset App
        </button>
      </div>
    </div>
  );

  const renderApology = () => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn px-6 bg-red-950/20 font-['Poppins']">
      <AlertTriangle className="w-16 h-16 text-orange-500 mb-6" />
      <h2 className="text-2xl text-orange-200 mb-8 font-bold uppercase tracking-widest">
        Correction Mode
      </h2>
      <p className="text-3xl md:text-5xl text-emerald-400 font-bold mb-10 leading-tight">
        OH... the spirits are confused. I meant to say....
      </p>
      <button
        onClick={handleApologyRecover}
        className="px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-sm text-lg font-bold uppercase tracking-[0.2em] shadow-lg"
      >
        Try That Again
      </button>
    </div>
  );

  // -----------------------------
  // MAIN
  // -----------------------------
  return (
    <div className="min-h-screen bg-[#111111] text-white overflow-hidden font-sans flex flex-col selection:bg-[#D4C5B0] selection:text-black">
      {/* Font Import + global tweaks to prevent scroll bounce */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;900&display=swap');

        html, body, #root { height: 100%; }
        body { margin: 0; overscroll-behavior: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <main className="relative z-10 flex-grow w-full max-w-4xl mx-auto p-0 flex flex-col h-screen">
        {stage === "setup" && renderSetup()}
        {stage === "instructions" && renderInstructions()}
        {stage === "intro" && renderIntro()}
        {stage === "deckCheck" && renderDeckCheck()}
        {stage === "deckTimer" && renderTimer()}
        {stage === "trick_shuffle" && renderTrickShuffle()}
        {stage === "think_card" && renderThinkCard()}
        {stage === "choose_number" && renderChooseNumber()}
        {stage === "deal_number" && renderDealNumber()}
        {stage === "guess_3h" && renderGuess3H()}
        {stage === "confirm_3h" && renderConfirm3H()}
        {stage === "color_q" && renderColorQ()}
        {stage === "suit_q" && renderSuitQ()}
        {stage === "range_q" && renderRangeQ()}
        {stage === "ask_specific_card" && renderAskSpecific()}
        {stage === "recap_turnover" && renderRecapTurnover()}
        {stage === "finale" && renderFinale()}
        {stage === "apology" && renderApology()}
      </main>

      {/* Progress Bar (hidden on setup/finale/apology) */}
      {!["setup", "finale", "apology"].includes(stage) && (
        <div className="fixed bottom-0 left-0 w-full h-2 bg-black z-50">
          <div
            className="h-full bg-[#D4C5B0] transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(
                8,
                [
                  "instructions",
                  "intro",
                  "deckCheck",
                  "deckTimer",
                  "trick_shuffle",
                  "think_card",
                  "choose_number",
                  "deal_number",
                  "guess_3h",
                  "color_q",
                  "suit_q",
                  "range_q",
                  "ask_specific_card",
                  "recap_turnover",
                ].indexOf(stage) * 7
              )}%`,
            }}
          />
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-zoomIn { animation: zoomIn 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
