const QUESTIONS = {
  reflex: [
    { id: 1, tag: "MATH REFLEX", prompt: "Quick! What is 7 × 8?", word: "7 × 8", options: ["54","56","58","64"], answer: "56" },
    { id: 2, tag: "MATH REFLEX", prompt: "Quick! What is 9 × 7?", word: "9 × 7", options: ["54","63","72","81"], answer: "63" },
    { id: 3, tag: "MATH REFLEX", prompt: "Quick! What is 12 × 12?", word: "12²", options: ["124","144","132","148"], answer: "144" },
    { id: 4, tag: "MATH REFLEX", prompt: "Quick! What is 15 × 4?", word: "15 × 4", options: ["50","55","60","65"], answer: "60" },
    { id: 5, tag: "TRIVIA", prompt: "How many sides in a hexagon?", word: "⬡", options: ["5","6","7","8"], answer: "6" },
    { id: 6, tag: "ODD ONE OUT", prompt: "Which is NOT a planet?", word: "Planets?", options: ["Mars","Pluto","Earth","Venus"], answer: "Pluto" },
    { id: 7, tag: "TRIVIA", prompt: "What is the fastest land animal?", word: "Speed?", options: ["Lion","Horse","Cheetah","Leopard"], answer: "Cheetah" },
    { id: 8, tag: "MATH REFLEX", prompt: "Quick! What is 8 × 8?", word: "8 × 8", options: ["56","62","64","66"], answer: "64" },
    { id: 9, tag: "TRIVIA", prompt: "How many days in a leap year?", word: "Leap year?", options: ["364","365","366","367"], answer: "366" },
    { id: 10, tag: "MATH REFLEX", prompt: "Quick! What is 6 × 7?", word: "6 × 7", options: ["36","40","42","48"], answer: "42" }
  ],
  rialoMcq: [
    { id: 11, tag: "RIALO TRIVIA", prompt: "Platform for decentralized AI?", word: "Decentralized AI", options: ["Ethereum","GenLayer","Solana","Polygon"], answer: "GenLayer" },
    { id: 12, tag: "WEB3 TRIVIA", prompt: "What does NFT stand for?", word: "NFT", options: ["Non-Fungible Token","New Finance Tech","Net Fund Token","Network File Transfer"], answer: "Non-Fungible Token" },
    { id: 13, tag: "CRYPTO TRIVIA", prompt: "Which consensus does Ethereum use now?", word: "Ethereum", options: ["Proof of Work","Proof of Stake","Delegated PoS","PoA"], answer: "Proof of Stake" },
    { id: 14, tag: "WEB3 TRIVIA", prompt: "What does 'WAGMI' mean?", word: "WAGMI", options: ["We Are Getting More Inu","We All Gonna Make It","Web3 Arena Game Mode Incoming","Wait And Get More Info"], answer: "We All Gonna Make It" },
    { id: 15, tag: "CRYPTO TRIVIA", prompt: "What is a 'gas fee'?", word: "Gas fee", options: ["Network cost","Mining reward","Staking yield","Burn fee"], answer: "Network cost" },
    { id: 16, tag: "RIALO TRIVIA", prompt: "Rialo rewards players with?", word: "Rewards", options: ["NFTs only","Tokens","Fiat","Points only"], answer: "Tokens" },
    { id: 17, tag: "WEB3 TRIVIA", prompt: "What is a smart contract?", word: "Smart contract", options: ["A legal document","Self-executing code on blockchain","A type of wallet","An NFT standard"], answer: "Self-executing code on blockchain" },
    { id: 18, tag: "CRYPTO MATH", prompt: "1 RIALO = $0.5. How much is 200 RIALO?", word: "200 × $0.5", options: ["$50","$100","$200","$150"], answer: "$100" },
    { id: 19, tag: "WEB3 TRIVIA", prompt: "What does DeFi stand for?", word: "DeFi", options: ["Decentralized Finance","Digital Finance","Distributed Fiat","Deferred Financing"], answer: "Decentralized Finance" },
    { id: 20, tag: "RIALO TRIVIA", prompt: "What is Rialo's game genre?", word: "Rialo is...", options: ["RPG","DeFi","Competitive Gaming","NFT Marketplace"], answer: "Competitive Gaming" }
  ],
  rialoType: [
    { id: 21, tag: "UNSCRAMBLE", prompt: "Unscramble:", word: "GNLYRAEEG", answer: "GENLAYER" },
    { id: 22, tag: "UNSCRAMBLE", prompt: "Unscramble:", word: "OLIARI", answer: "RIALO" },
    { id: 23, tag: "UNSCRAMBLE", prompt: "Unscramble:", word: "KBCHINOLA", answer: "BLOCKCHAIN" },
    { id: 24, tag: "UNSCRAMBLE", prompt: "Unscramble:", word: "TNOKE", answer: "TOKEN" },
    { id: 25, tag: "UNSCRAMBLE", prompt: "Unscramble:", word: "TGNSAKI", answer: "STAKING" },
    { id: 26, tag: "UNSCRAMBLE", prompt: "Unscramble:", word: "LATELW", answer: "WALLET" },
    { id: 27, tag: "UNSCRAMBLE", prompt: "Unscramble:", word: "TNFM", answer: "MINT" },
    { id: 28, tag: "UNSCRAMBLE", prompt: "Unscramble:", word: "ODECC", answer: "CODEC" },
    { id: 29, tag: "UNSCRAMBLE", prompt: "Unscramble:", word: "EGIMNR", answer: "MINER" },
    { id: 30, tag: "UNSCRAMBLE", prompt: "Unscramble:", word: "SEHBNAICL", answer: "CHAINLESS" }
  ]
};

function getShuffled(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getQuestionsForMode(mode, count = 10) {
  const map = { reflex: 'reflex', 'rialo-mcq': 'rialoMcq', 'rialo-type': 'rialoType' };
  const key = map[mode] || 'reflex';
  return getShuffled(QUESTIONS[key]).slice(0, count);
}

module.exports = { getQuestionsForMode };
