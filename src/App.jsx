import React, { useState, useEffect, useRef } from 'react';
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
  const [audienceName, setAudienceName] = useState('Chris');

  /**
   * Stages:
   * setup, instructions, intro, deckCheck, deckTimer,
   * trick_shuffle, trick_select, choose_number_mode, deal_number,
   * questions, confirmation,
   * ask_specific_card, turnover, apology, finale
   */
  const [stage, setStage] = useState('setup');
  const [previousStage, setPreviousStage] = useState(null);
  const [questionStep, setQuestionStep] = useState(0);

  // Timer
  const [timeLeft, setTimeLeft] = useState(10);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const [targetNumber, setTargetNumber] = useState(null);

  // Card attributes
  const [cardAttributes, setCardAttributes] = useState({
    color: '', // Red / Black
    suit: '',  // Heart / Diamond / Club / Spade
    valueRange: '', // High / Low
  });

  const [confirmationText, setConfirmationText] = useState('');

  // --- CONFIGURATION ---
  const TARGET_URL = 'https://www.chriswheel.com';

  const FINALE_SONG_URL =
    'https://cdn1.suno.ai/436bd471-0369-4a2d-8db0-1541e0a671b0.mp3';
  const MAGIC_SOUND_URL =
    'https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.mp3';
  const TIMER_SOUND_URL =
    'https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3';

  // A quick drumroll for the “turn over the card” moment
  const DRUMROLL_URL =
    'https://assets.mixkit.co/active_storage/sfx/1108/1108-preview.mp3';

  const audioRef = useRef(new Audio(MAGIC_SOUND_URL));
  const finaleRef = useRef(new Audio(FINALE_SONG_URL));
  const timerAudioRef = useRef(new Audio(TIMER_SOUND_URL));
  const drumrollRef = useRef(new Audio(DRUMROLL_URL));

  // --- EFFECT: TIMER WITH DELAY ---
  useEffect(() => {
    let interval = null;
    let delayTimeout = null;

    if (stage === 'deckTimer') {
      if (!isTimerActive) {
        delayTimeout = setTimeout(() => setIsTimerActive(true), 6000);
      } else if (timeLeft > 0) {
        try {
          timerAudioRef.current.currentTime = 0;
          timerAudioRef.current.play().catch(() => {});
        } catch (e) {}

        interval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev > 1) {
              try {
                timerAudioRef.current.currentTime = 0;
                timerAudioRef.current.play().catch(() => {});
              } catch (e) {}
            }
            return prev - 1;
          });
        }, 1000);
      } else if (timeLeft === 0) {
        clearInterval(interval);
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

  // --- EFFECT: DRUMROLL ON TURNOVER SCREEN ---
  useEffect(() => {
    if (stage === 'turnover') {
      try {
        drumrollRef.current.currentTime = 0;
        drumrollRef.current.volume = 0.9;
        drumrollRef.current.play().catch(() => {});
      } catch (e) {}
    } else {
      try {
        drumrollRef.current.pause();
        drumrollRef.current.currentTime = 0;
      } catch (e) {}
    }
  }, [stage]);

  // --- HANDLERS ---
  const handleStart = () => {
    if (magicianName.trim()) setStage('instructions');
  };

  const playMagicSound = () => {
    try {
      audioRef.current.volume = 0.5;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch (e) {}
  };

  const handleMessedUp = () => {
    setPreviousStage(stage);
    setStage('apology');
  };

  const handleApologyRecover = () => {
    if (previousStage === 'questions' || previousStage === 'confirmation') {
      if (questionStep > 0) {
        setQuestionStep(questionStep - 1);
        setStage('questions');
      } else {
        setStage('deal_number');
      }
    } else if (previousStage === 'ask_specific_card') {
      setStage('questions');
    } else if (previousStage === 'turnover') {
      setStage('ask_specific_card');
    } else if (previousStage) {
      setStage(previousStage);
    } else {
      setStage('intro');
    }
  };

  const handleRestart = () => {
    setStage('setup');
    setPreviousStage(null);
    setQuestionStep(0);
    setTimeLeft(10);
    setIsTimerActive(false);
    setTargetNumber(null);
    setCardAttributes({ color: '', suit: '', valueRange: '' });
    setConfirmationText('');
    setMagicianName('');
    setAudienceName('Chris');
  };

  const handleProceedToNextQuestion = () => {
    const isLastStep = questionFlow.length === questionStep + 1;
    if (isLastStep) {
      setStage('ask_specific_card');
    } else {
      setQuestionStep(questionStep + 1);
      setStage('questions');
    }
  };

  // --- QUESTION LOGIC (UPDATED TO YOUR NEW YES/NO FLOW) ---

  // Helper: suit pair based on color
  const suitPair =
    cardAttributes.color === 'Red'
      ? { ask: 'HEART', askValue: 'Heart', other: 'DIAMOND', otherValue: 'Diamond' }
      : { ask: 'CLUB', askValue: 'Club', other: 'SPADE', otherValue: 'Spade' };

  const questionFlow = [
    {
      q: 'I am getting a strange feeling about your card… Is your card a red card?',
      options: [
        {
          label: 'YES',
          key: 'color',
          value: 'Red',
          joke: 'I knew that.',
        },
        {
          label: 'NO',
          key: 'color',
          value: 'Black',
          joke: "I didn’t think so.",
        },
      ],
    },
    {
      q: `Okay. Is it a ${suitPair.ask}?`,
      options: [
        {
          label: 'YES',
          key: 'suit',
          value: suitPair.askValue,
          joke: 'Yes. 2 for 2.',
        },
        {
          label: 'NO',
          key: 'suit',
          value: suitPair.otherValue,
          // IMPORTANT: explicit alternative suit
          joke: `I meant to say ${suitPair.otherValue}.`,
        },
      ],
    },
    {
      q: 'Now think of the value… Was it a HIGH card? Like 8 through King?',
      options: [
        {
          label: 'YES',
          key: 'valueRange',
          value: 'High',
          joke: 'Okay… I think I know what it is!',
        },
        {
          label: 'NO',
          key: 'valueRange',
          value: 'Low',
          joke: 'Yeah… I meant to say I screwed up.',
        },
      ],
    },
  ];

  // --- RENDERERS ---

  const ScriptView = ({ children, onNext, nextLabel = 'NEXT STEP' }) => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 pt-6 pb-6 animate-fadeIn font-['Poppins']">
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
          onChange={e => setMagicianName(e.target.value)}
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
        {/* SPOKEN (GREEN) */}
        <div className="flex items-start gap-6 text-left">
          <div className="bg-emerald-500/10 p-3 rounded-full">
            <Mic className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-emerald-400 font-bold text-lg uppercase tracking-wider mb-1">Green Text</h3>
            <p className="text-gray-400 text-sm font-light">Read these words out loud to the audience.</p>
          </div>
        </div>

        <div className="w-full h-px bg-white/5" />

        {/* ACTIONS (RED) */}
        <div className="flex items-start gap-6 text-left">
          <div className="bg-red-500/10 p-3 rounded-full">
            <Hand className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-red-400 font-bold text-lg uppercase tracking-wider mb-1">Red Text</h3>
            <p className="text-gray-400 text-sm font-light">These are silent actions for you to perform.</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setStage('intro')}
        className="mt-12 px-8 py-4 bg-transparent border border-[#D4C5B0] text-[#D4C5B0] hover:bg-[#D4C5B0] hover:text-black text-sm font-bold tracking-[0.2em] uppercase transition-all flex items-center gap-3"
      >
        I Understand <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  const renderIntro = () => (
    <ScriptView onNext={() => setStage('deckCheck')}>
      <p className="text-2xl md:text-4xl leading-tight text-emerald-400 font-bold drop-shadow-md text-center">
        "HELLO {audienceName}! I am {magicianName} the Great."
      </p>

      {/* moved up + made bigger to match spoken size */}
      <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4 text-left">
        (Strike a confident pose)
      </p>

      <p className="text-2xl md:text-4xl leading-tight text-emerald-400 font-bold drop-shadow-md text-center">
        "For the next 2 minutes, I am the greatest magician in this room. Sorry, but it's true."
      </p>
    </ScriptView>
  );

  const renderDeckCheck = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 justify-center animate-fadeIn text-center font-['Poppins']">
      <p className="text-2xl md:text-4xl leading-tight text-emerald-400 font-bold mb-10">
        "Do you happen to have a normal, regular deck of cards I can borrow for this trick?"
      </p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setStage('trick_shuffle')}
          className="py-8 bg-[#1a1a1a] border border-gray-800 hover:border-emerald-500/50 text-emerald-400 text-xl font-bold flex flex-col items-center gap-3 transition-all group"
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
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold mb-12 leading-relaxed">
        "Well darn... I guess we'll wait for you to find one. You have 10 seconds!"
      </p>

      <div
        className={`text-8xl font-black mb-12 tracking-tighter ${
          !isTimerActive ? 'text-[#D4C5B0]' : 'text-red-500'
        }`}
      >
        {!isTimerActive ? (
          <span className="text-5xl animate-pulse tracking-widest">WAITING...</span>
        ) : timeLeft > 0 ? (
          `00:${timeLeft.toString().padStart(2, '0')}`
        ) : (
          '00:00'
        )}
      </div>

      <button
        onClick={() => {
          try {
            timerAudioRef.current.pause();
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
    <ScriptView onNext={() => setStage('trick_select')}>
      <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4">
        (Hand the deck to Chris)
      </p>
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
        "Please shuffle the deck as much as you want. Really mix them up!"
      </p>
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
        "Let me know when you are satisfied."
      </p>
    </ScriptView>
  );

  const renderTrickSelect = () => (
    <ScriptView onNext={() => setStage('choose_number_mode')}>
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
        "Ok now Chris, I want you to take any card out and peek at it."
      </p>
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
        "Make sure I do not see it, and make sure{' '}
        <span className="underline decoration-[#D4C5B0] underline-offset-4">nobody here</span> sees it."
      </p>
      <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4">
        (Briefly turn your body to the side, away from Chris, so you cannot see the card he chooses.)
      </p>
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
        "Now lose the card back in the deck and shuffle again. Destroy the evidence. Tell me when you're done."
      </p>
    </ScriptView>
  );

  // UPDATED: Only manual number entry (no random generator), and instruction text without quotes
  const renderChooseNumberMode = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 justify-center animate-fadeIn text-center font-['Poppins']">
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold mb-4 leading-tight">
        "Now I'm going to say a number between 1 and 52."
      </p>

      <p className="text-2xl md:text-4xl text-red-400 italic font-light mb-10 leading-tight">
        Think of a number and type it in the box below and then press "Use That Number"
      </p>

      <div className="bg-[#1a1a1a] p-6 border-l-4 border-[#D4C5B0] w-full">
        <p className="text-gray-300 mb-3 text-sm font-bold uppercase tracking-[0.25em]">
          TYPE NUMBER HERE
        </p>

        <input
          type="number"
          min="1"
          max="52"
          placeholder="#"
          className="w-full bg-black border-2 border-gray-700 rounded-sm p-4 text-center text-4xl text-white mb-6 focus:border-[#D4C5B0] outline-none font-bold"
          id="manualNumInput"
        />

        <button
          onClick={() => {
            const el = document.getElementById('manualNumInput');
            const val = el ? el.value : '';
            if (val && Number(val) >= 1 && Number(val) <= 52) {
              setTargetNumber(parseInt(val, 10));
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

  const renderDealNumber = () => (
    <ScriptView onNext={() => setStage('questions')}>
      <div className="bg-[#1a1a1a] p-8 border-l-4 border-[#D4C5B0] mb-8 text-center shrink-0">
        <p className="text-[#D4C5B0] text-xs uppercase tracking-[0.3em] mb-2 font-bold">The Magic Number</p>
        <div className="text-8xl font-bold text-white font-['Poppins'] tracking-tighter">{targetNumber}</div>
      </div>

      <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
        "When I snap my fingers, your card will end up at the {targetNumber}th position."
      </p>
      <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4">
        (Snap your fingers.)
      </p>
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
        "So deal down {targetNumber - 1} cards and put the {targetNumber}th card next to the pile."
      </p>
    </ScriptView>
  );

  const renderQuestions = () => {
    const currentQ = questionFlow[questionStep];

    const handleAnswer = option => {
      setCardAttributes(prev => ({ ...prev, [option.key]: option.value }));
      setConfirmationText(option.joke);
      setStage('confirmation');
      playMagicSound();
    };

    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-6 animate-fadeIn relative font-['Poppins']">
        <div className="flex-grow flex flex-col justify-center space-y-8">
          {/* SPOKEN (GREEN) */}
          <p className="text-2xl md:text-4xl text-emerald-400 font-bold text-center leading-tight">
            "{currentQ.q}"
          </p>

          {/* ACTION (RED) */}
          <p className="text-2xl md:text-4xl text-red-400 italic font-light text-center leading-tight">
            Click the correct choice below.
          </p>

          {/* ANSWERS */}
          <div className="grid grid-cols-2 gap-4">
            {currentQ.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                className="py-8 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* MISTAKE BUTTON */}
        <div className="mt-auto pt-5 border-t border-gray-800 text-center">
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
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-6 justify-center items-center text-center animate-fadeIn relative font-['Poppins']">
      <Sparkles className="w-12 h-12 text-[#D4C5B0] mb-8 animate-bounce" />
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold mb-10 leading-tight">"{confirmationText}"</p>
      <button
        onClick={handleProceedToNextQuestion}
        className="px-10 py-5 bg-[#D4C5B0] hover:bg-white text-black rounded-sm text-lg font-bold uppercase tracking-[0.2em] shadow-lg transition-all"
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

  const renderAskSpecific = () => {
    const prettySuit = cardAttributes.suit ? cardAttributes.suit.toLowerCase() : '____';
    const prettyRange = cardAttributes.valueRange ? cardAttributes.valueRange.toLowerCase() : '____';

    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-6 animate-fadeIn relative font-['Poppins']">
        <div className="flex-grow flex flex-col justify-center space-y-8">
          <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
            "For the first time… what {prettyRange} {prettySuit} card did you choose?"
          </p>

          <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4">
            (Wait for Chris to name the card.)
          </p>

          <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
            "I knew it. I knew your card was exactly {targetNumber} cards down!"
          </p>

          <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
            "But how? You shuffled the deck, thought of a card, and I told you to deal exactly {targetNumber} cards down… a number you could not have known."
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setStage('turnover')}
            className="w-full py-6 bg-[#D4C5B0] hover:bg-white text-black text-xl font-bold uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3"
          >
            Next <ArrowRight className="w-6 h-6" />
          </button>

          <div className="pt-4 border-t border-gray-800 text-center">
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
  };

  const renderTurnover = () => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn px-6 font-['Poppins']">
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight mb-10">
        "Please turn over the card."
      </p>

      <button
        onClick={() => {
          setStage('finale');
          playMagicSound();
        }}
        className="px-10 py-5 bg-[#D4C5B0] hover:bg-white text-black rounded-sm text-lg font-bold uppercase tracking-[0.2em] shadow-lg transition-all"
      >
        REVEAL
      </button>
    </div>
  );

  const renderApology = () => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn px-6 bg-red-950/20 font-['Poppins']">
      <AlertTriangle className="w-16 h-16 text-orange-500 mb-6" />
      <h2 className="text-2xl text-orange-200 mb-8 font-bold uppercase tracking-widest">Correction Mode</h2>
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold mb-10 leading-tight">
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
          <p className="text-5xl md:text-7xl text-emerald-400 font-bold drop-shadow-2xl tracking-tighter uppercase mb-6">
            "Amazing. I'm the best."
          </p>
          <p className="text-emerald-400 text-3xl md:text-5xl font-bold uppercase tracking-tight mb-4 leading-tight">
            "Give me a round of applause."
          </p>
        </div>

        <p className="text-[#D4C5B0] italic mb-10 font-light tracking-widest text-sm">(Playing Finale Music...)</p>

        <button
          onClick={() => {
            window.location.href = TARGET_URL;
          }}
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

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-[#111111] text-white overflow-hidden font-sans flex flex-col selection:bg-[#D4C5B0] selection:text-black">
      {/* Font Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;900&display=swap');
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <main className="relative z-10 flex-grow w-full max-w-4xl mx-auto p-0 flex flex-col h-screen">
        {stage === 'setup' && renderSetup()}
        {stage === 'instructions' && renderInstructions()}
        {stage === 'intro' && renderIntro()}
        {stage === 'deckCheck' && renderDeckCheck()}
        {stage === 'deckTimer' && renderTimer()}
        {stage === 'trick_shuffle' && renderTrickShuffle()}
        {stage === 'trick_select' && renderTrickSelect()}
        {stage === 'choose_number_mode' && renderChooseNumberMode()}
        {stage === 'deal_number' && renderDealNumber()}
        {stage === 'questions' && renderQuestions()}
        {stage === 'confirmation' && renderConfirmation()}
        {stage === 'ask_specific_card' && renderAskSpecific()}
        {stage === 'turnover' && renderTurnover()}
        {stage === 'apology' && renderApology()}
        {stage === 'finale' && renderFinale()}
      </main>

      {/* Progress Bar (Bottom) */}
      {!['setup', 'finale', 'apology', 'confirmation', 'turnover'].includes(stage) && (
        <div className="fixed bottom-0 left-0 w-full h-2 bg-black z-50">
          <div
            className="h-full bg-[#D4C5B0] transition-all duration-700 ease-out"
            style={{
              width: `${
                [
                  'instructions',
                  'intro',
                  'deckCheck',
                  'deckTimer',
                  'trick_shuffle',
                  'trick_select',
                  'choose_number_mode',
                  'deal_number',
                  'questions',
                  'ask_specific_card',
                ].indexOf(stage) * 10
              }%`,
            }}
          />
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-zoomIn { animation: zoomIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
