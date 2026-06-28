import type { HangarLevelConfig } from "./types";
import type { LogbookContent } from "../ui/LogbookOverlay";

const alienDictionary: LogbookContent = {
  title: "ALIEN DICTIONARY",
  sections: [
    {
      heading: "Vocabulary",
      lines: [
        "vex  →  hello",
        "tor  →  friend",
        "kala  →  we",
        "sito  →  peace",
        "morr  →  come",
        "ren  →  in",
        "shol  →  open",
        "ki  →  to",
        "talu  →  speak",
      ],
    },
  ],
};

export const hangarOne: HangarLevelConfig = {
  id: "hangar-one",
  sceneKey: "HangarScene",
  title: "The Hangar",
  levelGroup: "hangar",
  tilemapKey: "hangar-two",

  startPosition: { col: 6, row: 7 },
  startFacing: "up",
  heroWorkingPosition: { col: 6, row: 6 },

  captain: {
    startPosition: { col: 4, row: 7 },
    workingPosition: { col: 4, row: 5 },
    facing: "up",
    characterId: "captain-astro",
  },

  alienPlaceholders: [
    { col: 6, row: 2, facing: "down", alienId: "alien-3" },
    { col: 8, row: 3, facing: "down", alienId: "alien-1" },
    { col: 4, row: 3, facing: "down", alienId: "alien-2" },
  ],

  speakerAlienPosition: { col: 6, row: 2 },

  expectedClassName: "Translator",

  dictionary: {
    vex: "hello",
    tor: "friend",
    kala: "we",
    sito: "peace",
    morr: "come",
    ren: "in",
    shol: "open",
    ki: "to",
    talu: "speak",
  },

  exchanges: [
    { alienPhrase: "vex tor", expectedTranslation: "hello friend" },
    { alienPhrase: "kala morr sito", expectedTranslation: "we come peace" },
    { alienPhrase: "shol ki talu", expectedTranslation: "open to speak" },
  ],

  trustMeter: {
    initialValue: 50,
    correctDelta: 20,
    wrongDelta: -10,
    passThreshold: 95,
  },

  logbookContent: alienDictionary,

  storyBeats: [
    "<strong>Task</strong>: define a <code>Translator</code> class.",

    "Until now, your classes have stood alone with its own data and methods. This time, you'll build a class that uses other classes. This holds instances of them and coordinates their work. This concept in programming is called <em>composition</em>.",

    "Two classes are provided:\n  • <code>Communicator</code> — sends messages\n  • <code>Dictionary</code> — translates alien phrases",

    "Your task involves defining a class called <code>Translator</code>. Its constructor should take the two existing classes as parameters and stores both on the instance.",
    "Next define a method <code>speakTo(alienPhrase)</code> that uses the dictionary to translate the phrase, then uses the communicator to send the result. Return what the communicator returns.",
    "If the translator is successful, trust will built between the two parties.",
  ],

  starterCode: `// Pre-defined classes
// Don't modify
class Communicator {
  send(message) {
    return message;
  }
}

class Dictionary {
  constructor(phraseMapping) {
    this.phraseMapping = phraseMapping;
  }

  translate(phrase) {
    return this.phraseMapping[phrase] ?? phrase;
  }
}

// Define your Translator class
class Translator {
  constructor(communicator, dictionary) {
  // Your code to store both on the instance
  }

  speakTo(alienPhrase) {
  // Your code to translate using the dictionary, then send using the communicator
  }
}

// Check your Logbook to correct translations
const comm = new Communicator();
const dict = new Dictionary({
  "vex tor": "&#10",
  "kala morr sito": "01101&*(!",
  "shol ki talu": ")&*011@010011&!",
});

const translator = new Translator(comm, dict);
`,

  solutionCode: `class Communicator {
  send(message) {
    return message;
  }
}

class Dictionary {
  constructor(phraseMapping) {
    this.phraseMapping = phraseMapping;
  }

  translate(phrase) {
    return this.phraseMapping[phrase] ?? phrase;
  }
}

class Translator {
  constructor(communicator, dictionary) {
    this.communicator = communicator;
    this.dictionary = dictionary;
  }

  speakTo(alienPhrase) {
    const translated = this.dictionary.translate(alienPhrase);
    return this.communicator.send(translated);
  }
}

const comm = new Communicator();
const dict = new Dictionary({
  "vex tor": "hello friend",
  "kala morr sito": "we come peace",
  "shol ki talu": "open to speak",
});

const translator = new Translator(comm, dict);
`,
};
