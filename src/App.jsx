// src/App.js
import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Hand,
  Mic,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

const App = () => {
  // --- STATE ---
  const [magicianName, setMagicianName] = useState('');
  const [audienceName] = useState('Chris');

  // Stages:
  // setup, instructions, intro, deckCheck, deckTimer, trick_shuffle,
  // choose_number_mode, deal_number, first_guess, first_guess_hit,
  // questions, confirmation, ask_specific_card, drumroll, apology, finale
  const [stage, setStage] = useState('setup');
  const [previousStage, setPreviousStage] = useState(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(10);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Trick values
  const [targetNumber, setTargetNumber] = useState(null);

  // Fallback flow tracking (color -> suit -> high/low)
  const [qStep, setQStep] = useState(0); // 0=color, 1=suit, 2=high
  const [wasFirstCorrect, setWasFirstCorrect] = useState(null); // true/false for "red?"
  const [cardAttributes, setCardAttributes] = useState({
    color: '', // Red/Black
    suit: '', // Heart/Diamond/Club/Spade
    range: '', // High/Low
  });

  // Confirmation
  const [confirmationText, setConfirmationText] = useState('');

  // --- CONFIGURATION ---
  const TARGET_URL = 'https://www.chriswheel.com';

  const FINALE_SONG_URL = 'https://cdn1.suno.ai/436bd471-0369-4a2d-8db0-1541e0a671b0.mp3';
  const MAGIC_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.mp3';
  const TIMER_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3';
  const DRUMROLL_SOUND_URL = MAGIC_SOUND_URL;

  const magicRef = useRef(new Audio(MAGIC_SOUND_URL));
  const finaleRef = useRef(new Audio(FINALE_SONG_URL));
  const timerRef = useRef(new Audio(TIMER_SOUND_URL));
  const drumRef = useRef(new Audio(DRUMROLL_SOUND_URL));

  // --- EFFECT: TIMER WITH DELAY ---
  useEffect(() => {
    let interval = null;
    let delayTimeout = null;

    if (stage === 'deckTimer') {
      if (!isTimerActive) {
        delayTimeout = setTimeout(() => setIsTimerActive(true), 6000);
      } else if (timeLeft > 0) {
        try {
          timerRef.current.currentTime = 0;
          timerRef.current.play().catch(() => {});
        } catch (e) {}

        interval = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev > 1) {
              try {
                timerRef.current.currentTime = 0;
                timerRef.current.play().catch(() => {});
              } catch (e) {}
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      setIsTimerActive(false);
      try {
        timerRef.current.pause();
        timerRef.current.currentTime = 0;
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      clearTimeout(delayTimeout);
    };
  }, [stage, timeLeft, isTimerActive]);

  // --- EFFECT: FINALE MUSIC ---
  useEffect(() => {
    if (stage === 'finale') {
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

  const playMagicSound = () => {
    try {
      magicRef.current.volume = 0.5;
      magicRef.current.currentTime = 0;
      magicRef.current.play().catch(() => {});
    } catch (e) {}
  };

  const playDrumroll = () => {
    try {
      drumRef.current.volume = 0.7;
      drumRef.current.currentTime = 0;
      drumRef.current.play().catch(() => {});
    } catch (e) {}
  };

  // --- HANDLERS ---
  const handleStart = () => {
    if (magicianName.trim()) setStage('instructions');
  };

  const handleMessedUp = () => {
    setPreviousStage(stage);
    setStage('apology');
  };

  const handleApologyRecover = () => {
    // If they messed up during fallback Q flow
    if (previousStage === 'questions' || previousStage === 'confirmation') {
      if (qStep > 0) {
        setQStep((s) => s - 1);
        setStage('questions');
      } else {
        setStage('first_guess'); // back right before the fallback starts
      }
      return;
    }

    if (previousStage) setStage(previousStage);
    else setStage('intro');
  };

  const handleRestart = () => {
    setStage('setup');
    setPreviousStage(null);

    setTimeLeft(10);
    setIsTimerActive(false);

    setTargetNumber(null);

    setQStep(0);
    setWasFirstCorrect(null);
    setCardAttributes({ color: '', suit: '', range: '' });

    setConfirmationText('');
    setMagicianName('');
  };

  // --- FALLBACK QUESTION FLOW HELPERS ---
  const getSuitPair = () => {
    if (cardAttributes.color === 'Red') return ['Heart', 'Diamond'];
    if (cardAttributes.color === 'Black') return ['Club', 'Spade'];
    return ['Heart', 'Diamond'];
  };

  // We ask about the first suit in the pair, then "No" implies the other.
  const getSuitAsked = () => getSuitPair()[0];
  const getAlternativeSuit = () => getSuitPair()[1];

  const makeConfirmationForColor = (answerYes) => {
    // Question is: "…your card is a red card, correct?"
    return answerYes ? 'I knew that.' : "I didn’t think so.";
  };

  const makeConfirmationForSuit = (answerYes) => {
    if (answerYes) {
      return wasFirstCorrect ? 'Yes, 2 for 2.' : 'I am locked in now.';
    }
    // No
    return wasFirstCorrect ? `I meant to say ${getAlternativeSuit()}.` : "I didn’t think so either.";
  };

  const makeConfirmationForHigh = (answerYes) => {
    return answerYes ? 'I think I know what it is!' : 'I meant to say I screwed up.';
  };

  const onAnswerFallback = (answerYes) => {
    if (qStep === 0) {
      const color = answerYes ? 'Red' : 'Black';
      setWasFirstCorrect(answerYes);
      setCardAttributes((prev) => ({
        ...prev,
        color,
        suit: '',
        range: '',
      }));
      setConfirmationText(makeConfirmationForColor(answerYes));
      setStage('confirmation');
      playMagicSound();
      return;
    }

    if (qStep === 1) {
      const suit = answerYes ? getSuitAsked() : getAlternativeSuit();
      setCardAttributes((prev) => ({ ...prev, suit }));
      setConfirmationText(makeConfirmationForSuit(answerYes));
      setStage('confirmation');
      playMagicSound();
      return;
    }

    if (qStep === 2) {
      const range = answerYes ? 'High' : 'Low';
      setCardAttributes((prev) => ({ ...prev, range }));
      setConfirmationText(makeConfirmationForHigh(answerYes));
      setStage('confirmation');
      playMagicSound();
      return;
    }
  };

  const handleProceedAfterConfirmation = () => {
    if (qStep >= 2) {
      setStage('ask_specific_card');
      return;
    }
    setQStep((s) => s + 1);
    setStage('questions');
  };

  // --- UI HELPERS ---
  const ScriptView = ({ children, onNext, nextLabel = 'NEXT STEP' }) => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 pt-8 pb-6 animate-fadeIn font-['Poppins']">
      <div className="flex-grow flex flex-col justify-center space-y-6 min-h-0 overflow-hidden">
        {children}
      </div>
      <button
        onClick={onNext}
        className="shrink-0 w-full py-4 mt-5 bg-[#D4C5B0] hover:bg-[#c2b29c] rounded-sm text-black text-lg font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        {nextLabel} <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  // GREEN = spoken, RED = actions (same size)
  const Spoken = ({ children, center = true }) => (
    <p
      className={[
        'text-2xl md:text-4xl leading-tight text-emerald-400 font-bold drop-shadow-md',
        center ? 'text-center' : 'text-left',
      ].join(' ')}
    >
      {children}
    </p>
  );

  const Action = ({ children }) => (
    <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4 text-left">
      {children}
    </p>
  );

  // --- RENDERERS ---
  const renderSetup = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fadeIn max-w-md mx-auto px-6 font-['Poppins'] relative z-10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white uppercase leading-tight tracking-wider">
          THE INSTANT
          <br />
          MAGICIAN
        </h1>
        <div className="w-16 h-1 bg-[#D4C5B0] mx-auto mt-6"></div>
      </div>

      <p className="text-gray-400 text-center font-light">Enter your name to become an amazing magician.</p>

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
              ? 'bg-[#D4C5B0] text-black hover:bg-white shadow-lg'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          Begin Experience
        </button>
      </div>
    </div>
  );

  const renderInstructions = () => (
    <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto px-6 text-center animate-fadeIn font-['Poppins']">
      <h2 className="text-3xl font-bold text-white mb-8 uppercase tracking-wide">Script Guide</h2>

      <div className="space-y-8 bg-[#1a1a1a] p-8 w-full shadow-2xl border-l-4 border-[#D4C5B0]">
        <div className="flex items-start gap-6 text-left">
          <div className="bg-emerald-500/10 p-3 rounded-full">
            <Mic className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-emerald-400 font-bold text-lg uppercase tracking-wider mb-1">Green Text</h3>
            <p className="text-gray-400 text-sm font-light">Read these words out loud.</p>
          </div>
        </div>

        <div className="w-full h-px bg-white/5" />

        <div className="flex items-start gap-6 text-left">
          <div className="bg-red-500/10 p-3 rounded-full">
            <Hand className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-red-400 font-bold text-lg uppercase tracking-wider mb-1">Red Text</h3>
            <p className="text-gray-400 text-sm font-light">Silent actions for you to do.</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setStage('intro')}
        className="mt-10 px-8 py-4 bg-transparent border border-[#D4C5B0] text-[#D4C5B0] hover:bg-[#D4C5B0] hover:text-black text-sm font-bold tracking-[0.2em] uppercase transition-all flex items-center gap-3"
      >
        I Understand <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  const renderIntro = () => (
    <ScriptView onNext={() => setStage('deckCheck')}>
      <Spoken>
        "HELLO {audienceName}! I am {magicianName} the Great."
      </Spoken>

      <Action>(Strike a confident pose)</Action>

      <Spoken>"For the next 2 minutes, I am the greatest magician in this room. Sorry, but it's true."</Spoken>
    </ScriptView>
  );

  const renderDeckCheck = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 justify-center animate-fadeIn text-center font-['Poppins']">
      <Spoken>"Do you happen to have a normal, regular deck of cards I can borrow for this trick?"</Spoken>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <button
          onClick={() => setStage('trick_shuffle')}
          className="py-7 bg-[#1a1a1a] border border-gray-800 hover:border-emerald-500/50 text-emerald-400 text-xl font-bold flex flex-col items-center gap-3 transition-all group"
        >
          <CheckCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <span className="uppercase tracking-widest text-sm">Yes</span>
        </button>

        <button
          onClick={() => {
            setTimeLeft(10);
            setIsTimerActive(false);
            setStage('deckTimer');
          }}
          className="py-7 bg-[#1a1a1a] border border-gray-800 hover:border-red-500/50 text-red-400 text-xl font-bold flex flex-col items-center gap-3 transition-all group"
        >
          <XCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <span className="uppercase tracking-widest text-sm">No</span>
        </button>
      </div>
    </div>
  );

  const renderTimer = () => (
    <div className="flex flex-col h-full justify-center items-center text-center px-6 font-['Poppins']">
      <Spoken>"Well darn... I guess we'll wait for you to find one. You have 10 seconds!"</Spoken>

      <div
        className={`text-7xl md:text-8xl font-black mt-10 mb-10 tracking-tighter ${
          !isTimerActive ? 'text-[#D4C5B0]' : 'text-red-500'
        }`}
      >
        {!isTimerActive ? (
          <span className="text-4xl md:text-5xl animate-pulse tracking-widest">WAITING...</span>
        ) : timeLeft > 0 ? (
          `00:${timeLeft.toString().padStart(2, '0')}`
        ) : (
          '00:00'
        )}
      </div>

      <button
        onClick={() => {
          try {
            timerRef.current.pause();
          } catch (e) {}
          setStage('trick_shuffle');
        }}
        className="px-10 py-5 bg-[#D4C5B0] text-black text-xl font-bold uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl"
      >
        Found It
      </button>
    </div>
  );

  const renderTrickShuffle = () => (
    <ScriptView onNext={() => setStage('choose_number_mode')}>
      <Action>(Hand the deck to Chris)</Action>
      <Spoken>"Shuffle the deck as much as you want. Really mix them up!"</Spoken>
      <Spoken>"Now—without taking a card out—just think of any card in the deck and lock it in your head."</Spoken>
      <Action>(Watch their face. Let them “commit” to the thought.)</Action>
    </ScriptView>
  );

  // UPDATED number page (1–25) + your exact scripting
  const renderChooseNumberMode = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 justify-center animate-fadeIn text-center font-['Poppins']">
      <Spoken>"Now think of that card and I will peer into your soul...."</Spoken>

      <Action>(Look at Chris and do a mind reading gesture. Then type in any number between 1 and 25.)</Action>

      <div className="bg-[#1a1a1a] p-6 mt-10 border-l-4 border-[#D4C5B0] w-full">
        <p className="text-gray-300 mb-4 text-sm uppercase tracking-[0.25em] font-bold">
          TYPE NUMBER HERE
        </p>

        <input
          type="number"
          min="1"
          max="25"
          placeholder="#"
          className="w-full bg-black border border-gray-700 rounded-sm p-4 text-center text-4xl text-white mb-6 focus:border-[#D4C5B0] outline-none font-bold"
          id="manualNumInput"
        />

        <button
          onClick={() => {
            const val = document.getElementById('manualNumInput')?.value;
            const n = parseInt(val, 10);
            if (!Number.isNaN(n) && n >= 1 && n <= 25) {
              setTargetNumber(n);

              // reset fallback flow in case they've run it before
              setQStep(0);
              setWasFirstCorrect(null);
              setCardAttributes({ color: '', suit: '', range: '' });
              setConfirmationText('');

              setStage('deal_number');
            }
          }}
          className="w-full py-4 bg-[#D4C5B0] hover:bg-white text-black text-sm font-bold uppercase tracking-[0.2em] transition-all"
        >
          Use That Number
        </button>
      </div>
    </div>
  );

  // UPDATED: big number green + instructions green
  const renderDealNumber = () => (
    <ScriptView onNext={() => setStage('first_guess')}>
      <div className="bg-[#1a1a1a] p-6 border-l-4 border-[#D4C5B0] mb-8 text-center shrink-0">
        <p className="text-[#D4C5B0] text-xs uppercase tracking-[0.3em] mb-2 font-bold">The Magic Number</p>
        <div className="text-7xl md:text-8xl font-bold text-emerald-400 font-['Poppins'] tracking-tighter">
          {targetNumber}
        </div>
      </div>

      <Spoken>
        "The card you are thinking of is exactly {targetNumber} cards down in the deck. So deal down{' '}
        {targetNumber - 1} cards down in a pile and put the {targetNumber} card next to it face down."
      </Spoken>

      <Action>(Let them deal. Keep it slow. Don’t rush the moment.)</Action>
    </ScriptView>
  );

  // FIRST GUESS page
  const renderFirstGuess = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 animate-fadeIn relative font-['Poppins']">
      <div className="flex-grow flex flex-col justify-center space-y-8">
        <Spoken>"Did you choose the 3 of hearts?"</Spoken>
        <Action>Click the answer below.</Action>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              playMagicSound();
              setStage('first_guess_hit');
            }}
            className="py-8 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            YES
          </button>
          <button
            onClick={() => {
              playMagicSound();
              setStage('questions'); // start fallback questions
            }}
            className="py-8 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            NO
          </button>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-800 text-center">
        <button
          onClick={handleMessedUp}
          className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 mx-auto transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Wait, I messed up
        </button>
      </div>
    </div>
  );

  // IF FIRST GUESS IS YES
  const renderFirstGuessHit = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 justify-center items-center text-center animate-fadeIn relative font-['Poppins']">
      <Spoken>"I knew it."</Spoken>

      <Spoken>
        "By reading your mind I could tell that your card was exactly {targetNumber} cards down. Not{' '}
        {targetNumber - 1}, or {targetNumber + 1}, but exactly {targetNumber} cards down. Turn your card over."
      </Spoken>

      <Action>(Press the button when the card turns over.)</Action>

      <button
        onClick={() => {
          playMagicSound();
          setStage('finale');
        }}
        className="mt-10 w-full max-w-md py-6 bg-[#D4C5B0] hover:bg-white text-black text-xl font-bold uppercase tracking-[0.25em] shadow-lg transition-all"
      >
        REVEAL
      </button>

      <div className="mt-8 pt-6 border-t border-gray-800 w-full text-center">
        <button
          onClick={handleMessedUp}
          className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 mx-auto transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Wait, Back One Step
        </button>
      </div>
    </div>
  );

  // FALLBACK QUESTIONS page (starts after "NO" on first guess)
  const renderQuestions = () => {
    let spokenLine = '';
    if (qStep === 0) spokenLine = 'That would have been amazing... But I do feel that your card is a red card, correct?';
    if (qStep === 1) spokenLine = `Is it a ${getSuitAsked()}?`;
    if (qStep === 2) spokenLine = 'Think if the card is low, like Ace to 7, or high like 8 to King. Was it a high card?';

    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 animate-fadeIn relative font-['Poppins']">
        <div className="flex-grow flex flex-col justify-center space-y-8">
          <Spoken>"{spokenLine}"</Spoken>
          <Action>Click the answer below.</Action>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onAnswerFallback(true)}
              className="py-8 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
            >
              YES
            </button>
            <button
              onClick={() => onAnswerFallback(false)}
              className="py-8 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
            >
              NO
            </button>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-800 text-center">
          <button
            onClick={handleMessedUp}
            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Wait, I messed up
          </button>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 justify-center items-center text-center animate-fadeIn relative font-['Poppins']">
      <Sparkles className="w-12 h-12 text-[#D4C5B0] mb-8 animate-bounce" />
      <Spoken>"{confirmationText}"</Spoken>

      <button
        onClick={handleProceedAfterConfirmation}
        className="mt-10 px-10 py-5 bg-[#D4C5B0] hover:bg-white text-black rounded-sm text-lg font-bold uppercase tracking-[0.2em] shadow-lg transition-all"
      >
        Continue
      </button>

      <div className="mt-8 pt-6 border-t border-gray-800 w-full text-center">
        <button
          onClick={handleMessedUp}
          className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 mx-auto transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Wait, I messed up
        </button>
      </div>
    </div>
  );

  const renderAskSpecific = () => (
    <ScriptView onNext={() => { setStage('drumroll'); playDrumroll(); }} nextLabel="NEXT">
      <Spoken>
        "For the first time, what {cardAttributes.range} {cardAttributes.suit} card did you think of?"
      </Spoken>
      <Action>(Wait for Chris to name it.)</Action>

      <Spoken>"I knew it, I knew your card was exactly {targetNumber} cards down! But how?"</Spoken>

      <Spoken>
        "You shuffled the deck, thought of a card, and I told you to deal exactly {targetNumber} cards down... a number you could not have known."
      </Spoken>
    </ScriptView>
  );

  const renderDrumroll = () => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-zoomIn px-6 font-['Poppins'] relative">
      <div className="relative z-10 w-full max-w-md">
        <Spoken>"Please turn over the card."</Spoken>
        <Action>(Drumroll...)</Action>

        <button
          onClick={() => { setStage('finale'); playMagicSound(); }}
          className="mt-10 w-full py-6 bg-[#D4C5B0] hover:bg-white text-black text-xl font-bold uppercase tracking-[0.25em] shadow-lg transition-all"
        >
          REVEAL
        </button>

        <div className="mt-8 pt-6 border-t border-gray-800 w-full text-center">
          <button
            onClick={handleMessedUp}
            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Wait, Back One Step
          </button>
        </div>
      </div>
    </div>
  );

  const renderApology = () => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn px-6 bg-red-950/20 font-['Poppins']">
      <AlertTriangle className="w-16 h-16 text-orange-500 mb-6" />
      <h2 className="text-2xl text-orange-200 mb-8 font-bold uppercase tracking-widest">Correction Mode</h2>
      <p className="text-2xl md:text-4xl text-red-200 font-bold mb-10">
        "OH... the spirits are confused. I meant to say...."
      </p>
      <button
        onClick={handleApologyRecover}
        className="px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-sm text-lg font-bold uppercase tracking-[0.2em] shadow-lg"
      >
        Try That Again
      </button>
    </div>
  );

  const renderFinale = () => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-zoomIn px-6 font-['Poppins'] relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D4C5B0] blur-[100px] opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10">
          <Spoken>"Amazing. I'm the best."</Spoken>
          <Spoken>"Give me a round of applause."</Spoken>
        </div>

        <p className="text-[#D4C5B0] italic mb-10 font-light tracking-widest text-sm">(Playing Finale Music...)</p>

        <button
          onClick={() => window.location.assign(TARGET_URL)}
          className="w-full py-6 bg-[#D4C5B0] hover:bg-white text-black rounded-sm font-bold text-xl uppercase tracking-[0.25em] shadow-[0_0_30px_rgba(212,197,176,0.3)] mb-6 transition-all transform hover:scale-105"
        >
          Take a Bow
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

  // --- PROGRESS BAR ---
  const progressStages = [
    'instructions',
    'intro',
    'deckCheck',
    'deckTimer',
    'trick_shuffle',
    'choose_number_mode',
    'deal_number',
    'first_guess',
    'questions',
    'ask_specific_card',
    'drumroll',
  ];
  const progressIndex = Math.max(0, progressStages.indexOf(stage));
  const progressPct = ((progressIndex + 1) / progressStages.length) * 100;

  return (
    <div className="appRoot bg-[#111111] text-white overflow-hidden font-sans flex flex-col selection:bg-[#D4C5B0] selection:text-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;900&display=swap');

        .appRoot{
          height: 100dvh;
          height: 100svh;
          overflow: hidden;
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
        }
        .appMain{
          height: 100%;
          overflow: hidden;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-zoomIn { animation: zoomIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>

      <main className="appMain relative z-10 flex-grow w-full max-w-4xl mx-auto p-0 flex flex-col">
        {stage === 'setup' && renderSetup()}
        {stage === 'instructions' && renderInstructions()}
        {stage === 'intro' && renderIntro()}
        {stage === 'deckCheck' && renderDeckCheck()}
        {stage === 'deckTimer' && renderTimer()}
        {stage === 'trick_shuffle' && renderTrickShuffle()}
        {stage === 'choose_number_mode' && renderChooseNumberMode()}
        {stage === 'deal_number' && renderDealNumber()}
        {stage === 'first_guess' && renderFirstGuess()}
        {stage === 'first_guess_hit' && renderFirstGuessHit()}
        {stage === 'questions' && renderQuestions()}
        {stage === 'confirmation' && renderConfirmation()}
        {stage === 'ask_specific_card' && renderAskSpecific()}
        {stage === 'drumroll' && renderDrumroll()}
        {stage === 'apology' && renderApology()}
        {stage === 'finale' && renderFinale()}
      </main>

      {!['setup', 'finale', 'apology', 'confirmation'].includes(stage) && (
        <div className="fixed bottom-0 left-0 w-full h-2 bg-black z-50">
          <div
            className="h-full bg-[#D4C5B0] transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default App;
