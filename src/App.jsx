```jsx
// src/App.js
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Hand, Mic, CheckCircle, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';

const App = () => {
  // --- STATE ---
  const [magicianName, setMagicianName] = useState('');
  const [audienceName, setAudienceName] = useState('Chris');

  /**
   * Stages:
   * setup
   * instructions
   * intro
   * deckCheck
   * deckTimer
   * shuffle
   * thinkCard
   * chooseNumber
   * dealNumber
   * guess_3h
   * guess_3h_yes
   * guess_3h_no
   * q_red
   * q_suit
   * q_high
   * ask_specific
   * reveal_prompt
   * finale
   * apology
   */
  const [stage, setStage] = useState('setup');
  const [previousStage, setPreviousStage] = useState(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(10);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Number + logic attributes
  const [targetNumber, setTargetNumber] = useState(null);

  const [cardAttributes, setCardAttributes] = useState({
    color: '', // 'Red' | 'Black'
    suit: '',  // 'Heart' | 'Diamond' | 'Club' | 'Spade'
    range: '', // 'High' | 'Low'
  });

  // Track whether the first (red?) was correct so suit responses can be funny/conditional
  const [wasFirstCorrect, setWasFirstCorrect] = useState(null); // true/false/null
  const [confirmationText, setConfirmationText] = useState('');

  // --- CONFIG ---
  const TARGET_URL = 'https://www.chriswheel.com';

  const FINALE_SONG_URL = 'https://cdn1.suno.ai/436bd471-0369-4a2d-8db0-1541e0a671b0.mp3';
  const MAGIC_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.mp3';
  const TIMER_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3';
  const DRUMROLL_URL = 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3';

  const magicRef = useRef(new Audio(MAGIC_SOUND_URL));
  const finaleRef = useRef(new Audio(FINALE_SONG_URL));
  const timerRef = useRef(new Audio(TIMER_SOUND_URL));
  const drumRef = useRef(new Audio(DRUMROLL_URL));

  const playMagicSound = () => {
    try {
      magicRef.current.volume = 0.5;
      magicRef.current.currentTime = 0;
      magicRef.current.play().catch(() => {});
    } catch {}
  };

  const playDrumroll = () => {
    try {
      drumRef.current.volume = 0.7;
      drumRef.current.currentTime = 0;
      drumRef.current.play().catch(() => {});
    } catch {}
  };

  // --- EFFECT: TIMER WITH DELAY ---
  useEffect(() => {
    let interval = null;
    let delayTimeout = null;

    if (stage === 'deckTimer') {
      if (!isTimerActive) {
        delayTimeout = setTimeout(() => {
          setIsTimerActive(true);
        }, 6000);
      } else if (timeLeft > 0) {
        try {
          timerRef.current.currentTime = 0;
          timerRef.current.play().catch(() => {});
        } catch {}

        interval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev > 1) {
              try {
                timerRef.current.currentTime = 0;
                timerRef.current.play().catch(() => {});
              } catch {}
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
        timerRef.current.pause();
        timerRef.current.currentTime = 0;
      } catch {}
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
      } catch {}
    } else {
      try {
        finaleRef.current.pause();
      } catch {}
    }
  }, [stage]);

  // --- HANDLERS ---
  const handleStart = () => {
    if (magicianName.trim()) setStage('instructions');
  };

  const handleMessedUp = () => {
    setPreviousStage(stage);
    setStage('apology');
  };

  const handleApologyRecover = () => {
    if (previousStage) setStage(previousStage);
    else setStage('intro');
  };

  const handleRestart = () => {
    setStage('setup');
    setPreviousStage(null);
    setTimeLeft(10);
    setIsTimerActive(false);
    setTargetNumber(null);
    setCardAttributes({ color: '', suit: '', range: '' });
    setWasFirstCorrect(null);
    setConfirmationText('');
    setMagicianName('');
    setAudienceName('Chris');
  };

  // --- HELPERS FOR EQUIVOQUE SECTIONS ---
  const suitOptionsForColor = (color) => {
    if (color === 'Red') return ['Heart', 'Diamond'];
    return ['Club', 'Spade'];
  };

  const otherSuitSameColor = (color, suit) => {
    const opts = suitOptionsForColor(color);
    if (!opts.includes(suit)) return opts[0];
    return opts[0] === suit ? opts[1] : opts[0];
  };

  // --- UI COMPONENTS ---
  const ScriptView = ({ children, onNext, nextLabel = 'NEXT STEP', hideNext = false }) => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 pt-10 pb-8 animate-fadeIn font-['Poppins'] overflow-hidden">
      <div className="flex-grow flex flex-col justify-center space-y-6 overflow-hidden">
        {children}
      </div>

      {!hideNext && (
        <button
          onClick={onNext}
          className="shrink-0 w-full py-5 mt-6 bg-[#D4C5B0] hover:bg-[#c2b29c] rounded-sm text-black text-lg font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          {nextLabel} <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  const BigGreen = ({ children, center = true }) => (
    <p
      className={`text-2xl md:text-4xl leading-tight text-emerald-400 font-bold drop-shadow-md ${
        center ? 'text-center' : 'text-left'
      }`}
    >
      {children}
    </p>
  );

  const BigRed = ({ children, center = false }) => (
    <p
      className={`text-2xl md:text-4xl leading-tight text-red-400 italic font-bold ${
        center ? 'text-center' : 'text-left'
      }`}
    >
      {children}
    </p>
  );

  const TwoButtons = ({ leftLabel, rightLabel, onLeft, onRight }) => (
    <div className="grid grid-cols-2 gap-4 w-full">
      <button
        onClick={onLeft}
        className="py-7 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
      >
        {leftLabel}
      </button>
      <button
        onClick={onRight}
        className="py-7 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
      >
        {rightLabel}
      </button>
    </div>
  );

  // --- RENDERERS ---
  const renderSetup = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fadeIn max-w-md mx-auto px-6 font-['Poppins'] relative z-10 overflow-hidden">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white uppercase leading-tight tracking-wider">
          THE INSTANT
          <br />
          MAGICIAN
        </h1>
        <div className="w-16 h-1 bg-[#D4C5B0] mx-auto mt-6"></div>
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
    <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto px-6 text-center animate-fadeIn font-['Poppins'] overflow-hidden">
      <h2 className="text-3xl font-bold text-white mb-8 uppercase tracking-wide">Script Guide</h2>

      <div className="space-y-8 bg-[#1a1a1a] p-8 w-full shadow-2xl border-l-4 border-[#D4C5B0]">
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

        <div className="flex items-start gap-6 text-left">
          <div className="bg-red-500/10 p-3 rounded-full">
            <Hand className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-red-400 font-bold text-lg uppercase tracking-wider mb-1">Red Text</h3>
            <p className="text-gray-400 text-sm font-light">Silent actions for you to perform.</p>
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
      <BigGreen>"HELLO {audienceName}! I am {magicianName} the Great."</BigGreen>
      <BigRed>(Strike a confident pose)</BigRed>
      <BigGreen>"For the next 2 minutes, I am the greatest magician in this room. Sorry, but it's true."</BigGreen>
    </ScriptView>
  );

  const renderDeckCheck = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 justify-center animate-fadeIn text-center font-['Poppins'] overflow-hidden">
      <BigGreen>"Do you happen to have a normal, regular deck of cards I can borrow for this trick?"</BigGreen>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <button
          onClick={() => setStage('shuffle')}
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
    <div className="flex flex-col h-full justify-center items-center text-center px-6 font-['Poppins'] overflow-hidden">
      <BigGreen>"Well darn... I guess we'll wait for you to find one. You have 10 seconds!"</BigGreen>

      <div className={`text-7xl md:text-8xl font-black my-10 tracking-tighter ${!isTimerActive ? 'text-[#D4C5B0]' : 'text-red-500'}`}>
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
            timerRef.current.currentTime = 0;
          } catch {}
          setStage('shuffle');
        }}
        className="px-10 py-5 bg-[#D4C5B0] text-black text-xl font-bold uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl"
      >
        Found It
      </button>
    </div>
  );

  const renderShuffle = () => (
    <ScriptView onNext={() => setStage('thinkCard')}>
      <BigRed>(Hand the deck to Chris)</BigRed>
      <BigGreen>"Please shuffle the deck as much as you want. Really mix them up!"</BigGreen>
      <BigGreen>"Let me know when you're done."</BigGreen>
    </ScriptView>
  );

  const renderThinkCard = () => (
    <ScriptView onNext={() => setStage('chooseNumber')}>
      <BigGreen>"Now just think of any card in the deck... and lock it in your head."</BigGreen>
      <BigGreen>"Don't say it. Don't point. Just think it."</BigGreen>
    </ScriptView>
  );

  const renderChooseNumber = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 justify-center animate-fadeIn text-center font-['Poppins'] overflow-hidden">
      <div className="space-y-6">
        <BigGreen>"Now think of that card and I will peer into your soul..."</BigGreen>
        <BigRed>(Look at Chris and do a mind-reading gesture)</BigRed>

        <div className="bg-[#1a1a1a] p-6 border-l-4 border-red-500 text-left">
          <p className="text-red-400 font-bold uppercase tracking-widest text-sm mb-3">TYPE NUMBER HERE</p>

          <input
            type="number"
            min="1"
            max="52"
            placeholder="#"
            id="manualNumInput"
            className="w-full bg-black border border-gray-700 rounded-sm p-4 text-center text-4xl text-white mb-5 focus:border-[#D4C5B0] outline-none font-bold"
          />

          <BigRed center={false}>
            Think of a number and type it in the box below and then press "Use That Number"
          </BigRed>

          <button
            onClick={() => {
              const val = document.getElementById('manualNumInput')?.value;
              const n = parseInt(val, 10);
              if (!Number.isNaN(n) && n >= 1 && n <= 52) {
                setTargetNumber(n);

                // reset logic for later branch
                setCardAttributes({ color: '', suit: '', range: '' });
                setWasFirstCorrect(null);
                setConfirmationText('');

                setStage('dealNumber');
              }
            }}
            className="w-full mt-5 py-4 bg-[#D4C5B0] hover:bg-white text-black text-sm font-bold uppercase tracking-[0.2em] transition-all"
          >
            Use That Number
          </button>
        </div>
      </div>
    </div>
  );

  const renderDealNumber = () => (
    <ScriptView onNext={() => setStage('guess_3h')}>
      <div className="bg-[#1a1a1a] p-8 border-l-4 border-[#D4C5B0] mb-2 text-center shrink-0">
        <p className="text-[#D4C5B0] text-xs uppercase tracking-[0.3em] mb-2 font-bold">The Magic Number</p>
        <div className="text-7xl md:text-8xl font-bold text-emerald-400 font-['Poppins'] tracking-tighter">
          {targetNumber}
        </div>
      </div>

      <BigGreen>
        "The card you are thinking of is exactly {targetNumber} cards down in the deck."
      </BigGreen>

      <BigGreen>
        "So deal down {targetNumber - 1} cards into a pile... and put the {targetNumber}th card next to it, face down."
      </BigGreen>
    </ScriptView>
  );

  const renderGuess3H = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 animate-fadeIn font-['Poppins'] overflow-hidden">
      <div className="flex-grow flex flex-col justify-center space-y-8">
        <BigGreen>"Did you choose the 3 of hearts?"</BigGreen>
        <BigRed center>(Click the answer below)</BigRed>

        <TwoButtons
          leftLabel="YES"
          rightLabel="NO"
          onLeft={() => {
            playMagicSound();
            setStage('guess_3h_yes');
          }}
          onRight={() => {
            playMagicSound();
            setStage('guess_3h_no');
          }}
        />
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

  const renderGuess3HYes = () => (
    <ScriptView
      onNext={() => {
        setStage('reveal_prompt');
        playMagicSound();
      }}
      nextLabel="REVEAL"
    >
      <BigGreen>"I knew it."</BigGreen>
      <BigGreen>
        "By reading your mind I could tell that your card was exactly {targetNumber} cards down."
      </BigGreen>
      <BigGreen>
        "Not {targetNumber - 1}. Not {targetNumber + 1}. Exactly {targetNumber}."
      </BigGreen>
      <BigRed>(Press the button when the card turns over)</BigRed>
    </ScriptView>
  );

  const renderGuess3HNo = () => (
    <ScriptView onNext={() => setStage('q_red')} nextLabel="KEEP GOING">
      <BigGreen>"That would have been amazing."</BigGreen>
      <BigGreen>"But I do feel your card is a red card... correct?"</BigGreen>
      <BigRed>(Click the answer below)</BigRed>
    </ScriptView>
  );

  const renderQRed = () => {
    const onYes = () => {
      // they said "Yes" to "is your card red?"
      setCardAttributes(prev => ({ ...prev, color: 'Red' }));
      setWasFirstCorrect(true);
      setConfirmationText('I knew that.');
      playMagicSound();
      setStage('q_red_confirm');
    };

    const onNo = () => {
      // they said "No" to "is your card red?" -> implies Black
      setCardAttributes(prev => ({ ...prev, color: 'Black' }));
      setWasFirstCorrect(false);
      setConfirmationText("I didn't think so.");
      playMagicSound();
      setStage('q_red_confirm');
    };

    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 animate-fadeIn font-['Poppins'] overflow-hidden">
        <div className="flex-grow flex flex-col justify-center space-y-8">
          <BigGreen>"I am getting a strange feeling about your card..."</BigGreen>
          <BigGreen>"Is your card red?"</BigGreen>
          <BigRed center>(Click the answer below)</BigRed>

          <TwoButtons leftLabel="YES" rightLabel="NO" onLeft={onYes} onRight={onNo} />
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

  const renderQRedConfirm = () => (
    <ScriptView onNext={() => setStage('q_suit')} nextLabel="CONTINUE">
      <BigGreen>"{confirmationText}"</BigGreen>
    </ScriptView>
  );

  const renderQSuit = () => {
    const color = cardAttributes.color || 'Red';
    const [a, b] = suitOptionsForColor(color);

    const askSuit = a; // we "ask" about suit a first, and treat NO as "I meant to say b"
    const altSuit = b;

    const onYes = () => {
      setCardAttributes(prev => ({ ...prev, suit: askSuit }));

      if (wasFirstCorrect === true) {
        setConfirmationText('Yes... 2 for 2.');
      } else {
        setConfirmationText("I am locked in now.");
      }

      playMagicSound();
      setStage('q_suit_confirm');
    };

    const onNo = () => {
      // If first was correct: "I meant to say (the alternative suit that matches the flow so far)"
      // If first was incorrect: "I didnt think so either."
      if (wasFirstCorrect === true) {
        setCardAttributes(prev => ({ ...prev, suit: altSuit }));
        setConfirmationText(`I meant to say ${altSuit}.`);
      } else {
        setConfirmationText("I didn't think so either.");
      }

      playMagicSound();
      setStage('q_suit_confirm');
    };

    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 animate-fadeIn font-['Poppins'] overflow-hidden">
        <div className="flex-grow flex flex-col justify-center space-y-8">
          <BigGreen>
            "Okay... I’m seeing {color} energy."
          </BigGreen>
          <BigGreen>
            "Is it a {askSuit}?"
          </BigGreen>
          <BigRed center>(Click the answer below)</BigRed>

          <TwoButtons leftLabel="YES" rightLabel="NO" onLeft={onYes} onRight={onNo} />
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

  const renderQSuitConfirm = () => (
    <ScriptView onNext={() => setStage('q_high')} nextLabel="CONTINUE">
      <BigGreen>"{confirmationText}"</BigGreen>
    </ScriptView>
  );

  const renderQHigh = () => {
    const onYes = () => {
      setCardAttributes(prev => ({ ...prev, range: 'High' }));
      setConfirmationText('I think I know what it is!');
      playMagicSound();
      setStage('q_high_confirm');
    };

    const onNo = () => {
      setCardAttributes(prev => ({ ...prev, range: 'Low' }));
      setConfirmationText('I meant to say I screwed up.');
      playMagicSound();
      setStage('q_high_confirm');
    };

    return (
      <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 animate-fadeIn font-['Poppins'] overflow-hidden">
        <div className="flex-grow flex flex-col justify-center space-y-8">
          <BigGreen>
            "Think if the card is low, like Ace to 7... or high like 8 to King."
          </BigGreen>
          <BigGreen>"Was it a high card?"</BigGreen>
          <BigRed center>(Click the answer below)</BigRed>

          <TwoButtons leftLabel="YES" rightLabel="NO" onLeft={onYes} onRight={onNo} />
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

  const renderQHighConfirm = () => (
    <ScriptView onNext={() => setStage('ask_specific')} nextLabel="CONTINUE">
      <BigGreen>"{confirmationText}"</BigGreen>
    </ScriptView>
  );

  const renderAskSpecific = () => {
    const color = cardAttributes.color || 'Red';
    const suit = cardAttributes.suit || suitOptionsForColor(color)[0];
    const range = cardAttributes.range || 'High';

    return (
      <ScriptView
        onNext={() => {
          setStage('reveal_prompt');
          playMagicSound();
        }}
        nextLabel="NEXT"
      >
        <BigGreen>
          "For the first time... what {range} {suit} card did you choose?"
        </BigGreen>
        <BigRed>(Wait for Chris to name the card)</BigRed>

        <BigGreen>
          "I knew it, I knew your card was exactly {targetNumber} cards down! But how?"
        </BigGreen>

        <BigGreen>
          "You shuffled the deck, thought of a card, and I told you to deal exactly {targetNumber} cards down... a number you could not have known."
        </BigGreen>
      </ScriptView>
    );
  };

  const renderRevealPrompt = () => (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 animate-fadeIn font-['Poppins'] overflow-hidden">
      <div className="flex-grow flex flex-col justify-center space-y-8">
        <BigGreen>"Please turn over the card."</BigGreen>
        <BigRed>(Press REVEAL as the card turns over)</BigRed>

        <button
          onClick={() => {
            playDrumroll();
            setTimeout(() => {
              setStage('finale');
              playMagicSound();
            }, 600);
          }}
          className="w-full py-6 bg-[#D4C5B0] hover:bg-white text-black text-xl font-bold uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3"
        >
          Reveal <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-800 text-center">
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

  const renderApology = () => (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn px-6 bg-red-950/20 font-['Poppins'] overflow-hidden">
      <AlertTriangle className="w-16 h-16 text-orange-500 mb-6" />
      <h2 className="text-2xl text-orange-200 mb-8 font-bold uppercase tracking-widest">Correction Mode</h2>
      <p className="text-3xl md:text-4xl text-emerald-400 font-bold mb-12 leading-tight">
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
    <div className="flex flex-col items-center justify-center h-full text-center animate-zoomIn px-6 font-['Poppins'] relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D4C5B0] blur-[100px] opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10">
          <p className="text-5xl md:text-7xl text-emerald-400 font-bold drop-shadow-2xl tracking-tighter uppercase mb-4">
            "Amazing. I'm the best."
          </p>
          <p className="text-emerald-400 text-3xl md:text-5xl font-bold uppercase tracking-tight leading-tight">
            "Give me a round of applause."
          </p>
        </div>

        <p className="text-[#D4C5B0] italic mb-10 font-light tracking-widest text-sm">(Playing Finale Music...)</p>

        <button
          onClick={() => {
            // safest redirect for deployed sites
            window.location.assign(TARGET_URL);
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;900&display=swap');
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        html, body, #root { height: 100%; }
        body { margin: 0; overscroll-behavior: none; }
        main { height: 100vh; }
        @supports (height: 100dvh) {
          main { height: 100dvh; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-zoomIn { animation: zoomIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>

      <main className="relative z-10 flex-grow w-full max-w-4xl mx-auto p-0 flex flex-col">
        {stage === 'setup' && renderSetup()}
        {stage === 'instructions' && renderInstructions()}
        {stage === 'intro' && renderIntro()}
        {stage === 'deckCheck' && renderDeckCheck()}
        {stage === 'deckTimer' && renderTimer()}
        {stage === 'shuffle' && renderShuffle()}
        {stage === 'thinkCard' && renderThinkCard()}
        {stage === 'chooseNumber' && renderChooseNumber()}
        {stage === 'dealNumber' && renderDealNumber()}
        {stage === 'guess_3h' && renderGuess3H()}
        {stage === 'guess_3h_yes' && renderGuess3HYes()}
        {stage === 'guess_3h_no' && renderGuess3HNo()}
        {stage === 'q_red' && renderQRed()}
        {stage === 'q_red_confirm' && renderQRedConfirm()}
        {stage === 'q_suit' && renderQSuit()}
        {stage === 'q_suit_confirm' && renderQSuitConfirm()}
        {stage === 'q_high' && renderQHigh()}
        {stage === 'q_high_confirm' && renderQHighConfirm()}
        {stage === 'ask_specific' && renderAskSpecific()}
        {stage === 'reveal_prompt' && renderRevealPrompt()}
        {stage === 'apology' && renderApology()}
        {stage === 'finale' && renderFinale()}
      </main>
    </div>
  );
};

export default App;
```
