import type { CharacterConfig, AppearanceName, CharacterAppearance } from "./types";

export type { CharacterConfig, AppearanceName, CharacterAppearance };
export type { CharacterRole } from "./types";

export const allCharacters: CharacterConfig[] = [
  {
    id: "hero-1",
    displayName: "Crew",
    role: "hero",
    appearances: {
      default: {
        walkSpritesheetKey: "hero-1-walk",
        idleSpritesheetKey: "hero-1-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 56,
      },
    },
  },
  {
    id: "hero-2",
    displayName: "Crew",
    role: "hero",
    appearances: {
      default: {
        walkSpritesheetKey: "hero-2-walk",
        idleSpritesheetKey: "hero-2-idle",
        frameWidth: 36,
        walkFrameHeight: 46,
        idleFrameHeight: 56,
      },
    },
  },
  {
    id: "captain-1",
    displayName: "Captain",
    role: "captain",
    appearances: {
      default: {
        walkSpritesheetKey: "captain-walk",
        idleSpritesheetKey: "captain-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 56,
      },
    },
  },
  {
    id: "char-1",
    displayName: "Crew",
    role: "human",
    appearances: {
      default: {
        walkSpritesheetKey: "char-1-walk",
        idleSpritesheetKey: "char-1-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 48,
      },
    },
  },
  {
    id: "char-2",
    displayName: "Crew",
    role: "human",
    appearances: {
      default: {
        walkSpritesheetKey: "char-2-walk",
        idleSpritesheetKey: "char-2-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 48,
      },
    },
  },
  {
    id: "char-3",
    displayName: "Crew",
    role: "human",
    appearances: {
      default: {
        walkSpritesheetKey: "char-3-walk",
        idleSpritesheetKey: "char-3-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 56,
      },
    },
  },
  {
    id: "char-4",
    displayName: "Crew",
    role: "human",
    appearances: {
      default: {
        walkSpritesheetKey: "char-4-walk",
        idleSpritesheetKey: "char-4-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 48,
      },
    },
  },
  {
    id: "char-5",
    displayName: "Crew",
    role: "human",
    appearances: {
      default: {
        walkSpritesheetKey: "char-5-walk",
        idleSpritesheetKey: "char-5-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 48,
      },
    },
  },
  {
    id: "astro-1",
    displayName: "Astronaut",
    role: "astro",
    appearances: {
      default: {
        walkSpritesheetKey: "astro-1-walk",
        idleSpritesheetKey: "astro-1-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 48,
      },
    },
  },
  {
    id: "engineer",
    displayName: "Engineer",
    role: "human",
    appearances: {
      default: {
        walkSpritesheetKey: "engineer-walk",
        idleSpritesheetKey: "engineer-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 48,
      },
    },
  },
  {
    id: "robot-1",
    displayName: "Robot",
    role: "robot",
    appearances: {
      default: {
        walkSpritesheetKey: "robot-1-walk",
        idleSpritesheetKey: "robot-1-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 56,
      },
    },
  },
  {
    id: "robot-2",
    displayName: "Robot",
    role: "robot",
    appearances: {
      default: {
        walkSpritesheetKey: "robot-2-walk",
        idleSpritesheetKey: "robot-2-idle",
        frameWidth: 36,
        walkFrameHeight: 46,
        idleFrameHeight: 56,
      },
    },
  },
  {
    id: "robot-3",
    displayName: "Robot",
    role: "robot",
    appearances: {
      default: {
        walkSpritesheetKey: "robot-3-walk",
        idleSpritesheetKey: "robot-3-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 56,
      },
    },
  },
  {
    id: "robot-4",
    displayName: "Robot",
    role: "robot",
    appearances: {
      default: {
        walkSpritesheetKey: "robot-4-walk",
        idleSpritesheetKey: "robot-4-idle",
        frameWidth: 36,
        walkFrameHeight: 54,
        idleFrameHeight: 56,
      },
    },
  },
  {
    id: "robot-5",
    displayName: "Robot",
    role: "robot",
    appearances: {
      default: {
        walkSpritesheetKey: "robot-5-walk",
        idleSpritesheetKey: "robot-5-idle",
        frameWidth: 36,
        walkFrameHeight: 46,
        idleFrameHeight: 56,
      },
    },
  },
  {
    id: "robot-6",
    displayName: "Robot",
    role: "robot",
    appearances: {
      default: {
        walkSpritesheetKey: "robot-6-walk",
        idleSpritesheetKey: "robot-6-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 48,
      },
    },
  },
  {
    id: "captain",
    displayName: "Captain",
    role: "captain",
    appearances: {
      default: {
        walkSpritesheetKey: "captain-walk",
        idleSpritesheetKey: "captain-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 56,
      },
    },
  },
  {
    id: "hero-astro",
    displayName: "Crew",
    role: "hero",
    appearances: {
      default: {
        walkSpritesheetKey: "hero-astro-walk",
        idleSpritesheetKey: "hero-astro-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 56,
      },
    },
  },
  {
    id: "captain-astro",
    displayName: "Captain",
    role: "captain",
    appearances: {
      default: {
        walkSpritesheetKey: "captain-astro-walk",
        idleSpritesheetKey: "captain-astro-idle",
        frameWidth: 36,
        walkFrameHeight: 44,
        idleFrameHeight: 48,
      },
    },
  },
];

export function getCharacterById(id: string): CharacterConfig | undefined {
  return allCharacters.find((c) => c.id === id);
}

export function getAppearance(character: CharacterConfig, name: AppearanceName = "default"): CharacterAppearance {
  return character.appearances[name] ?? character.appearances.default;
}

export function idleFrameForFacing(facing: "up" | "down" | "left" | "right"): number {
  switch (facing) {
    case "left":
      return 0;
    case "down":
      return 1;
    case "right":
      return 2;
    case "up":
      return 3;
  }
}

export function walkAnimKey(
  characterId: string,
  appearance: AppearanceName,
  direction: "down" | "left" | "right" | "up",
): string {
  return `${characterId}-${appearance}-walk-${direction}`;
}
