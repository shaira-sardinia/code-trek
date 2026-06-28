/**
 * Centralised event name constants for cross-component communication via
 * game.events
 * All emit/on call sites use these
 * This is the source of truth for the full event contract
 */

// Boot and landing
export const EVENT_BOOT_COMPLETE = "boot-complete";
export const EVENT_LANDING_COMPLETE = "landing-complete";
export const EVENT_LANDING_CONTINUE = "landing-continue";

// Toolbar - scenes
export const EVENT_RUN_CODE = "run-code";
export const EVENT_CLOSE_LOGBOOK = "close-logbook";

// Scenes - Transitions
export const EVENT_RUN_RESULT = "run-result";
export const EVENT_CANTEEN_PUZZLE_COMPLETE = "canteen-puzzle-complete";
export const EVENT_CUTSCENE_COMPLETE = "cutscene-complete";
export const EVENT_TITLECARD_COMPLETE = "titlecard-complete";
export const EVENT_HANGAR_ARRIVAL_COMPLETE = "hangar-arrival-complete";

// Iris transition
export const EVENT_TRANSITION_CLOSE = "transition:close";
export const EVENT_TRANSITION_OPEN = "transition:open";
export const EVENT_TRANSITION_CLOSED = "transition:closed";
export const EVENT_TRANSITION_OPENED = "transition:opened";
