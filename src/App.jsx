// src/App.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
   * Stages
   * setup -> instructions -> intro -> deckCheck -> deckTimer? -> trick_shuffle
   * -> choose_number_mode -> deal_number -> quick_guess -> instant_win? -> finale
   * -> OR quick_guess(no) -> questions_color -> questions_suit -> questions_range -> questions_name -> recap -> finale
   */
  const [stage, setStage] = useState('setup');
  const [previousStage, setPreviousStage] = useState(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(10);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const [targetNumber, setTargetNumber] = useState(null);

  // Backup-question state
  const [color, setColor] = useState(''); // 'Red' or 'Black'
  const [suit, setSuit] = useState(''); // 'Heart'|'Diamond'|'Club'|'Spade'
  const [range, setRange] = useState(''); // 'High'|'Low'
  const [usedIMeantToSay, setUsedIMeantToSay] = useState(false);

  const [confirmationText, setConfirmationText] = useState('');

  // --- CONFIGURATION ---
  const TARGET_URL = 'https://www.chriswheel.com';

  const FINALE_SONG_URL = 'https://cdn1.suno.ai/436bd471-0369-4a2d-8db0-1541e0a671b0.mp3';
  const MAGIC_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2073/2073-preview.mp3';
  const TIMER_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3';

  const audioRef = useRef(new Audio(MAGIC_SOUND_URL));
  const finaleRef = useRef(new Audio(FINALE_SONG_URL));
  const timerAudioRef = useRef(new Audio(TIMER_SOUND_URL));

  // --- HELPERS FOR SUITS ---
  const suitA = useMemo(() => {
    if (color === 'Red') return 'Heart';
    if (color === 'Black') return 'Club';
    return '';
  }, [color]);

  const suitB = useMemo(() => {
    if (color === 'Red') return 'Diamond';
    if (color === 'Black') return 'Spade';
    return '';
  }, [color]);

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
      timerAudioRef.current.pause();
      timerAudioRef.current.currentTime = 0;
    }

    return () => {
      clearInterval(interval);
      clearTimeout(delayTimeout);
    };
  }, [stage, timeLeft, isTimerActive]);

  // --- EFFECT: FINALE MUSIC ---
  useEffect(() => {
    if (stage === 'finale') {
      finaleRef.current.currentTime = 0;
      finaleRef.current.volume = 0.6;
      finaleRef.current.play().catch(() => {});
    } else {
      finaleRef.current.pause();
    }
  }, [stage]);

  // --- HANDLERS ---
  const handleStart = () => {
    if (magicianName.trim()) setStage('instructions');
  };

  const playMagicSound = () => {
    audioRef.current.volume = 0.5;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  const handleMessedUp = () => {
    setPreviousStage(stage);
    setStage('apology');
  };

  const handleApologyRecover = () => {
    // Simple, safe recovery
    if (previousStage) setStage(previousStage);
    else setStage('intro');
  };

  const handleRestart = () => {
    setStage('setup');
    setPreviousStage(null);

    setTimeLeft(10);
    setIsTimerActive(false);

    setTargetNumber(null);

    setColor('');
    setSuit('');
    setRange('');
    setUsedIMeantToSay(false);
    setConfirmationText('');

    setMagicianName('');
    setAudienceName('Chris');
  };

  // --- UI WRAPPERS (NO SCROLL / PHONE-FIT) ---
  const Screen = ({ children }) => (
    <div className="w-full h-[100svh] overflow-hidden flex flex-col">
      {/* Safe top padding so nothing looks cut off on phones */}
      <div className="flex-1 flex flex-col justify-center px-6 pt-8 pb-6">{children}</div>
    </div>
  );

  const ScriptView = ({ children, onNext, nextLabel = 'NEXT STEP' }) => (
    <Screen>
      <div className="flex-1 flex flex-col justify-center gap-5">{children}</div>
      <button
        onClick={onNext}
        className="w-full py-4 bg-[#D4C5B0] hover:bg-[#c2b29c] rounded-sm text-black text-base md:text-lg font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        {nextLabel} <ArrowRight className="w-5 h-5" />
      </button>
    </Screen>
  );

  // --- RENDERERS ---
  const renderSetup = () => (
    <Screen>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 font-['Poppins']">
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-6xl font-bold text-white uppercase leading-tight tracking-wider">
            THE INSTANT
            <br />
            MAGICIAN
          </h1>
          <div className="w-16 h-1 bg-[#D4C5B0] mx-auto" />
        </div>

        <p className="text-gray-400 text-center font-light">
          Enter your name to become an amazing magician.
        </p>

        <div className="w-full max-w-md space-y-4">
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
            className={`w-full py-4 font-bold text-sm tracking-[0.2em] uppercase transition-all ${
              magicianName.trim()
                ? 'bg-[#D4C5B0] text-black hover:bg-white shadow-lg'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            Begin Experience
          </button>
        </div>
      </div>
    </Screen>
  );

  const renderInstructions = () => (
    <Screen>
      <div className="w-full max-w-xl mx-auto text-center animate-fadeIn font-['Poppins']">
        <h2 className="text-3xl font-bold text-white mb-6 uppercase tracking-wide">Script Guide</h2>

        <div className="space-y-6 bg-[#1a1a1a] p-6 w-full shadow-2xl border-l-4 border-[#D4C5B0]">
          <div className="flex items-start gap-4 text-left">
            <div className="bg-emerald-500/10 p-3 rounded-full">
              <Mic className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-emerald-400 font-bold text-lg uppercase tracking-wider mb-1">
                Green Text
              </h3>
              <p className="text-gray-400 text-sm font-light">Read these words out loud.</p>
            </div>
          </div>

          <div className="w-full h-px bg-white/5" />

          <div className="flex items-start gap-4 text-left">
            <div className="bg-red-500/10 p-3 rounded-full">
              <Hand className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-red-400 font-bold text-lg uppercase tracking-wider mb-1">
                Red Text
              </h3>
              <p className="text-gray-400 text-sm font-light">Silent actions for you to perform.</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setStage('intro')}
          className="mt-8 px-8 py-4 bg-transparent border border-[#D4C5B0] text-[#D4C5B0] hover:bg-[#D4C5B0] hover:text-black text-sm font-bold tracking-[0.2em] uppercase transition-all inline-flex items-center gap-3"
        >
          I Understand <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Screen>
  );

  const renderIntro = () => (
    <ScriptView onNext={() => setStage('deckCheck')}>
      <p className="text-2xl md:text-4xl leading-tight text-emerald-400 font-bold drop-shadow-md text-center">
        HELLO {audienceName}! I am {magicianName} the Great.
      </p>

      {/* Move pose instruction up + make it larger */}
      <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4 text-left">
        (Strike a confident pose)
      </p>

      <p className="text-2xl md:text-4xl leading-tight text-emerald-400 font-bold drop-shadow-md text-center">
        For the next 2 minutes, I am the greatest magician in this room. Sorry, but it's true.
      </p>
    </ScriptView>
  );

  const renderDeckCheck = () => (
    <Screen>
      <div className="w-full max-w-2xl mx-auto text-center font-['Poppins'] flex-1 flex flex-col justify-center">
        <p className="text-2xl md:text-4xl leading-tight text-emerald-400 font-bold mb-8">
          Do you happen to have a normal, regular deck of cards I can borrow for this trick?
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setStage('trick_shuffle')}
            className="py-6 bg-[#1a1a1a] border border-gray-800 hover:border-emerald-500/50 text-emerald-400 text-lg font-bold flex flex-col items-center gap-2 transition-all group"
          >
            <CheckCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="uppercase tracking-widest text-xs">Yes</span>
          </button>

          <button
            onClick={() => {
              setTimeLeft(10);
              setIsTimerActive(false);
              setStage('deckTimer');
            }}
            className="py-6 bg-[#1a1a1a] border border-gray-800 hover:border-red-500/50 text-red-400 text-lg font-bold flex flex-col items-center gap-2 transition-all group"
          >
            <XCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="uppercase tracking-widest text-xs">No</span>
          </button>
        </div>
      </div>
    </Screen>
  );

  const renderTimer = () => (
    <Screen>
      <div className="w-full max-w-2xl mx-auto text-center font-['Poppins'] flex-1 flex flex-col justify-center">
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold mb-6 leading-relaxed">
          Well darn... I guess we’ll wait for you to find one. You have 10 seconds!
        </p>

        <div
          className={`text-6xl md:text-7xl font-black mb-6 tracking-tighter ${
            !isTimerActive ? 'text-[#D4C5B0]' : 'text-red-500'
          }`}
        >
          {!isTimerActive ? (
            <span className="text-3xl animate-pulse tracking-widest">WAITING...</span>
          ) : timeLeft > 0 ? (
            `00:${timeLeft.toString().padStart(2, '0')}`
          ) : (
            '00:00'
          )}
        </div>

        <button
          onClick={() => {
            timerAudioRef.current.pause();
            setStage('trick_shuffle');
          }}
          className="w-full max-w-sm mx-auto py-4 bg-[#D4C5B0] text-black text-base md:text-lg font-bold uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl"
        >
          Found It
        </button>
      </div>
    </Screen>
  );

  const renderTrickShuffle = () => (
    <ScriptView onNext={() => setStage('choose_number_mode')}>
      <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4">
        (Hand the deck to Chris)
      </p>
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
        Please shuffle the deck as much as you want. Really mix them up!
      </p>
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
        Now just think of any card in the deck and lock it in your head.
      </p>
    </ScriptView>
  );

  // UPDATED: number mode is ONLY manual entry (no random generate)
  const renderChooseNumberMode = () => (
    <Screen>
      <div className="w-full max-w-2xl mx-auto text-center font-['Poppins'] flex-1 flex flex-col justify-center gap-6">
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">
          Now think of that card and I will peer into your soul…
        </p>

        <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4 text-left">
          (Look at Chris and do a mind-reading gesture.)
        </p>

        <p className="text-2xl md:text-4xl text-red-400 font-bold leading-tight">
          Think of a number and type it in the box below and then press &quot;Use That Number&quot;.
        </p>

        <div className="bg-[#1a1a1a] p-5 border border-gray-800 rounded-sm text-left">
          <p className="text-gray-300 mb-2 text-xs font-bold uppercase tracking-[0.25em]">
            TYPE NUMBER HERE
          </p>

          <input
            type="number"
            min="1"
            max="52"
            placeholder="#"
            className="w-full bg-black border-2 border-gray-700 rounded-sm p-4 text-center text-4xl text-white mb-4 focus:border-[#D4C5B0] outline-none font-bold"
            id="manualNumInput"
            inputMode="numeric"
          />

          <button
            onClick={() => {
              const raw = document.getElementById('manualNumInput')?.value;
              const val = Number(raw);
              if (Number.isFinite(val) && val >= 1 && val <= 52) {
                setTargetNumber(val);
                setStage('deal_number');
              }
            }}
            className="w-full py-4 bg-[#D4C5B0] hover:bg-white text-black text-sm font-bold uppercase tracking-[0.2em] transition-all"
          >
            Use That Number
          </button>
        </div>
      </div>
    </Screen>
  );

  const renderDealNumber = () => (
    <ScriptView onNext={() => setStage('quick_guess')} nextLabel="NEXT">
      <div className="bg-[#1a1a1a] p-6 border-l-4 border-[#D4C5B0] text-center">
        <p className="text-[#D4C5B0] text-xs uppercase tracking-[0.3em] mb-2 font-bold">The Number</p>
        {/* BIG NUMBER SHOULD BE GREEN */}
        <div className="text-7xl md:text-8xl font-bold text-emerald-400 font-['Poppins'] tracking-tighter">
          {targetNumber}
        </div>
      </div>

      <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
        The card you are thinking of is exactly {targetNumber} cards down in the deck.
      </p>
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
        So deal down {targetNumber - 1} cards in a pile and put the {targetNumber}th card next to it, face down.
      </p>
    </ScriptView>
  );

  // 3 of hearts quick guess page
  const renderQuickGuess = () => (
    <Screen>
      <div className="w-full max-w-2xl mx-auto text-center font-['Poppins'] flex-1 flex flex-col justify-center gap-8">
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">
          Did you choose the 3 of Hearts?
        </p>

        <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4 text-left">
          (Click the answer below.)
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              playMagicSound();
              setStage('instant_win');
            }}
            className="py-6 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            YES
          </button>
          <button
            onClick={() => {
              playMagicSound();
              // Start backup path cleanly
              setColor('');
              setSuit('');
              setRange('');
              setUsedIMeantToSay(false);
              setStage('questions_color');
            }}
            className="py-6 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            NO
          </button>
        </div>

        <div className="pt-4 border-t border-gray-800 text-center">
          <button
            onClick={handleMessedUp}
            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2 mx-auto transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Wait, I messed up
          </button>
        </div>
      </div>
    </Screen>
  );

  // IMPORTANT: YES path should go to THANK YOU page (finale) after this button (no recap)
  const renderInstantWin = () => (
    <Screen>
      <div className="w-full max-w-2xl mx-auto text-center font-['Poppins'] flex-1 flex flex-col justify-center gap-6">
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">
          I knew it. By reading your mind I could tell your card was exactly {targetNumber} cards down…
          not {targetNumber - 1}, not {targetNumber + 1}… exactly {targetNumber}.
        </p>

        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">
          Turn your card over.
        </p>

        <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4 text-left">
          (Press the button when the card is turned over.)
        </p>

        <button
          onClick={() => setStage('finale')}
          className="w-full py-4 bg-[#D4C5B0] hover:bg-white text-black rounded-sm text-base md:text-lg font-bold uppercase tracking-[0.2em] shadow-lg transition-all"
        >
          Click when the card is turned over
        </button>

        <div className="pt-4 border-t border-gray-800 text-center">
          <button
            onClick={handleMessedUp}
            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2 mx-auto transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Wait, I messed up
          </button>
        </div>
      </div>
    </Screen>
  );

  // --- BACKUP QUESTIONS (YES/NO style; no suit mismatch; low/high fixed) ---
  const renderQColor = () => (
    <Screen>
      <div className="w-full max-w-2xl mx-auto text-center font-['Poppins'] flex-1 flex flex-col justify-center gap-8">
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">
          Okay… your card is a red card, correct?
        </p>

        <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4 text-left">
          (Click the answer below.)
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setColor('Red');
              setConfirmationText('I knew that.');
              playMagicSound();
              setStage('confirm_then_suit');
            }}
            className="py-6 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            YES
          </button>
          <button
            onClick={() => {
              setColor('Black');
              setConfirmationText("I didn’t think so.");
              playMagicSound();
              setStage('confirm_then_suit');
            }}
            className="py-6 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            NO
          </button>
        </div>

        <div className="pt-4 border-t border-gray-800 text-center">
          <button
            onClick={handleMessedUp}
            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2 mx-auto transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Wait, I messed up
          </button>
        </div>
      </div>
    </Screen>
  );

  const renderConfirmThenSuit = () => (
    <Screen>
      <div className="w-full max-w-2xl mx-auto text-center font-['Poppins'] flex-1 flex flex-col justify-center gap-6">
        <Sparkles className="w-12 h-12 text-[#D4C5B0] mx-auto animate-bounce" />
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">{confirmationText}</p>
        <button
          onClick={() => setStage('questions_suit')}
          className="w-full py-4 bg-[#D4C5B0] hover:bg-white text-black rounded-sm text-base md:text-lg font-bold uppercase tracking-[0.2em] shadow-lg transition-all"
        >
          Continue
        </button>

        <div className="pt-4 border-t border-gray-800 text-center">
          <button
            onClick={handleMessedUp}
            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2 mx-auto transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Wait, I messed up
          </button>
        </div>
      </div>
    </Screen>
  );

  const renderQSuit = () => (
    <Screen>
      <div className="w-full max-w-2xl mx-auto text-center font-['Poppins'] flex-1 flex flex-col justify-center gap-8">
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">
          Is it a {suitA}?
        </p>

        <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4 text-left">
          (Click the answer below.)
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setSuit(suitA);
              // If they said YES to red earlier we treat as "confident" and go "2 for 2", otherwise "locked in now"
              const confident = color === 'Red'; // (their YES was “red”, their NO was “not red”; we just pick a consistent behavior)
              setConfirmationText(confident ? 'Yes… 2 for 2.' : 'I am locked in now.');
              setUsedIMeantToSay(false);
              playMagicSound();
              setStage('confirm_then_range');
            }}
            className="py-6 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            YES
          </button>
          <button
            onClick={() => {
              setSuit(suitB);
              // If they were “confident” earlier (YES to red card), you do “I meant to say… SuitB”
              // otherwise: “I didn’t think so either.”
              const confident = color === 'Red';
              setUsedIMeantToSay(confident);
              setConfirmationText(confident ? `I meant to say… ${suitB}.` : `I didn’t think so either.`);
              playMagicSound();
              setStage('confirm_then_range');
            }}
            className="py-6 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            NO
          </button>
        </div>

        <div className="pt-4 border-t border-gray-800 text-center">
          <button
            onClick={handleMessedUp}
            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2 mx-auto transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Wait, I messed up
          </button>
        </div>
      </div>
    </Screen>
  );

  const renderConfirmThenRange = () => (
    <Screen>
      <div className="w-full max-w-2xl mx-auto text-center font-['Poppins'] flex-1 flex flex-col justify-center gap-6">
        <Sparkles className="w-12 h-12 text-[#D4C5B0] mx-auto animate-bounce" />
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">{confirmationText}</p>
        <button
          onClick={() => setStage('questions_range')}
          className="w-full py-4 bg-[#D4C5B0] hover:bg-white text-black rounded-sm text-base md:text-lg font-bold uppercase tracking-[0.2em] shadow-lg transition-all"
        >
          Continue
        </button>

        <div className="pt-4 border-t border-gray-800 text-center">
          <button
            onClick={handleMessedUp}
            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2 mx-auto transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Wait, I messed up
          </button>
        </div>
      </div>
    </Screen>
  );

  const renderQRange = () => (
    <Screen>
      <div className="w-full max-w-2xl mx-auto text-center font-['Poppins'] flex-1 flex flex-col justify-center gap-8">
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">
          Was it a high card? (8 to King)
        </p>

        <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4 text-left">
          (Click the answer below.)
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setRange('High');
              setConfirmationText('I think I know what it is!');
              playMagicSound();
              setStage('confirm_then_name');
            }}
            className="py-6 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            YES
          </button>
          <button
            onClick={() => {
              setRange('Low');
              // Your rule: if earlier you used "I meant to say", keep that vibe:
              setConfirmationText(
                usedIMeantToSay
                  ? 'I meant to say… sorry — I meant to say it was a low card.'
                  : 'Sorry—low card.'
              );
              playMagicSound();
              setStage('confirm_then_name');
            }}
            className="py-6 bg-[#1a1a1a] border border-gray-700 hover:border-[#D4C5B0] text-white text-lg font-bold uppercase tracking-widest transition-all"
          >
            NO
          </button>
        </div>

        <div className="pt-4 border-t border-gray-800 text-center">
          <button
            onClick={handleMessedUp}
            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2 mx-auto transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Wait, I messed up
          </button>
        </div>
      </div>
    </Screen>
  );

  const renderConfirmThenName = () => (
    <Screen>
      <div className="w-full max-w-2xl mx-auto text-center font-['Poppins'] flex-1 flex flex-col justify-center gap-6">
        <Sparkles className="w-12 h-12 text-[#D4C5B0] mx-auto animate-bounce" />
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">{confirmationText}</p>
        <button
          onClick={() => setStage('questions_name')}
          className="w-full py-4 bg-[#D4C5B0] hover:bg-white text-black rounded-sm text-base md:text-lg font-bold uppercase tracking-[0.2em] shadow-lg transition-all"
        >
          Continue
        </button>

        <div className="pt-4 border-t border-gray-800 text-center">
          <button
            onClick={handleMessedUp}
            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2 mx-auto transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Wait, I messed up
          </button>
        </div>
      </div>
    </Screen>
  );

  const renderQName = () => (
    <ScriptView onNext={() => setStage('recap')} nextLabel="NEXT">
      <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
        For the first time… what {range.toLowerCase()} {suit.toLowerCase()} card did you choose?
      </p>
      <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4">
        (Wait for Chris to name the card.)
      </p>
      {range === 'Low' && (
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight text-center">
          Perfect. Low card.
        </p>
      )}
    </ScriptView>
  );

  const renderRecap = () => (
    <Screen>
      <div className="w-full max-w-2xl mx-auto font-['Poppins'] flex-1 flex flex-col justify-center gap-6 text-center">
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">
          You shuffled the deck, thought of any card that I could not have known.
        </p>
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">
          I had a feeling about the number {targetNumber}… a number you could not have known.
        </p>
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">
          You dealt down that many cards. The chances of your thought-of card being at that exact number is a million to one…
          don’t fact check me.
        </p>
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold leading-tight">
          Now, turn over the card to see if it is your thought-of card.
        </p>

        <p className="text-2xl md:text-4xl text-red-400 italic font-light tracking-wide border-l-2 border-red-500 pl-4 text-left">
          (Press the button when the card is turned over.)
        </p>

        <button
          onClick={() => setStage('finale')}
          className="w-full py-4 bg-[#D4C5B0] hover:bg-white text-black rounded-sm text-base md:text-lg font-bold uppercase tracking-[0.2em] shadow-lg transition-all"
        >
          Click when the card is turned over
        </button>

        <div className="pt-4 border-t border-gray-800 text-center">
          <button
            onClick={handleMessedUp}
            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2 mx-auto transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Wait, I messed up
          </button>
        </div>
      </div>
    </Screen>
  );

  const renderApology = () => (
    <Screen>
      <div className="w-full max-w-md mx-auto text-center font-['Poppins'] flex-1 flex flex-col justify-center">
        <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-5" />
        <h2 className="text-2xl text-orange-200 mb-6 font-bold uppercase tracking-widest">Correction Mode</h2>
        <p className="text-2xl md:text-4xl text-emerald-400 font-bold mb-8 leading-tight">
          OH… the spirits are confused. I meant to say…
        </p>
        <button
          onClick={handleApologyRecover}
          className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-sm text-base md:text-lg font-bold uppercase tracking-[0.2em] shadow-lg"
        >
          Try That Again
        </button>
      </div>
    </Screen>
  );

  // Thank you page + END button to website
  const renderFinale = () => (
    <Screen>
      <div className="relative w-full max-w-md mx-auto text-center font-['Poppins'] flex-1 flex flex-col justify-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D4C5B0] blur-[100px] opacity-20 animate-pulse"></div>
        </div>

        <div className="relative z-10">
          <p className="text-4xl md:text-6xl text-emerald-400 font-bold drop-shadow-2xl tracking-tighter uppercase mb-4">
            Amazing. I&apos;m the best.
          </p>

          <p className="text-4xl md:text-6xl text-emerald-400 font-bold drop-shadow-2xl tracking-tighter uppercase mb-6">
            Thank you.
          </p>

          <p className="text-[#D4C5B0] italic mb-6 font-light tracking-widest text-sm">
            (Playing Finale Music...)
          </p>

          <button
            onClick={() => {
              window.location.href = TARGET_URL;
            }}
            className="w-full py-5 bg-[#D4C5B0] hover:bg-white text-black rounded-sm font-bold text-lg md:text-xl uppercase tracking-[0.25em] shadow-[0_0_30px_rgba(212,197,176,0.3)] mb-4 transition-all transform hover:scale-105"
          >
            END
          </button>

          <button
            onClick={handleRestart}
            className="text-gray-600 hover:text-white transition-colors uppercase tracking-[0.2em] text-xs font-bold inline-flex items-center justify-center gap-2 mx-auto"
          >
            <RotateCcw className="w-3 h-3" />
            Reset App
          </button>
        </div>
      </div>
    </Screen>
  );

  return (
    <div className="bg-[#111111] text-white overflow-hidden font-sans selection:bg-[#D4C5B0] selection:text-black">
      {/* Font Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;900&display=swap');
        html, body { height: 100%; margin: 0; }
      `}</style>

      {stage === 'setup' && renderSetup()}
      {stage === 'instructions' && renderInstructions()}
      {stage === 'intro' && renderIntro()}
      {stage === 'deckCheck' && renderDeckCheck()}
      {stage === 'deckTimer' && renderTimer()}
      {stage === 'trick_shuffle' && renderTrickShuffle()}
      {stage === 'choose_number_mode' && renderChooseNumberMode()}
      {stage === 'deal_number' && renderDealNumber()}
      {stage === 'quick_guess' && renderQuickGuess()}
      {stage === 'instant_win' && renderInstantWin()}
      {stage === 'questions_color' && renderQColor()}
      {stage === 'confirm_then_suit' && renderConfirmThenSuit()}
      {stage === 'questions_suit' && renderQSuit()}
      {stage === 'confirm_then_range' && renderConfirmThenRange()}
      {stage === 'questions_range' && renderQRange()}
      {stage === 'confirm_then_name' && renderConfirmThenName()}
      {stage === 'questions_name' && renderQName()}
      {stage === 'recap' && renderRecap()}
      {stage === 'apology' && renderApology()}
      {stage === 'finale' && renderFinale()}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-zoomIn { animation: zoomIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
