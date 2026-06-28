export interface TypewriterOptions {
  element: HTMLElement;
  speed?: number;
  beatDelay?: number;
  onStart?: () => void;
  onComplete?: () => void;
}

export class Typewriter {
  private element: HTMLElement;
  private speed: number;
  private beatDelay: number;
  private timeoutId: number | null = null;
  private currentRun: number = 0;
  private activeBeats: string[] = [];
  private onStart?: () => void;
  private onComplete?: () => void;

  constructor(options: TypewriterOptions) {
    this.element = options.element;
    this.speed = options.speed ?? 30;
    this.beatDelay = options.beatDelay ?? 600;
    this.onStart = options.onStart;
    this.onComplete = options.onComplete;
  }

  async typeBeats(beats: string[]): Promise<void> {
    this.cancel();
    const runId = ++this.currentRun;
    this.activeBeats = beats;

    this.element.innerHTML = "";
    this.onStart?.();

    for (let i = 0; i < beats.length; i++) {
      if (runId !== this.currentRun) {
        return;
      }

      const paragraph = document.createElement("p");
      paragraph.className = "beat";
      this.element.appendChild(paragraph);

      await this.typeText(paragraph, beats[i], runId);

      if (runId !== this.currentRun) {
        return;
      }

      if (i < beats.length - 1) {
        await this.delay(this.beatDelay);
      }
    }

    if (runId === this.currentRun) {
      this.onComplete?.();
    }
  }

  skip(): void {
    if (this.activeBeats.length === 0) return;

    this.currentRun++;
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.element.innerHTML = "";
    for (const beat of this.activeBeats) {
      const paragraph = document.createElement("p");
      paragraph.className = "beat";
      paragraph.innerHTML = beatToHtml(beat);
      this.element.appendChild(paragraph);
    }

    this.element.scrollTop = this.element.scrollHeight;
    this.onComplete?.();
  }

  showInstant(html: string): void {
    this.cancel();
    this.activeBeats = [];
    this.element.innerHTML = html;
    this.onComplete?.();
  }

  prependInstant(html: string): void {
    this.element.querySelector(".run-result")?.remove();
    const p = document.createElement("p");
    p.className = "beat run-result";
    p.innerHTML = html;
    this.element.prepend(p);
    this.element.scrollTop = 0;
  }

  cancel(): void {
    this.currentRun++;
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private typeText(target: HTMLElement, beat: string, runId: number): Promise<void> {
    const snapshots = buildSnapshots(beat);

    return new Promise((resolve) => {
      let index = 0;

      const typeNext = () => {
        if (runId !== this.currentRun) {
          resolve();
          return;
        }

        if (index < snapshots.length) {
          target.innerHTML = snapshots[index];
          this.element.scrollTop = this.element.scrollHeight;
          index++;
          this.timeoutId = window.setTimeout(typeNext, this.speed);
        } else {
          target.innerHTML = beatToHtml(beat);
          this.element.scrollTop = this.element.scrollHeight;
          resolve();
        }
      };

      typeNext();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.timeoutId = window.setTimeout(() => resolve(), ms);
    });
  }
}

function beatToHtml(beat: string): string {
  return beat.replace(/\n/g, "<br>");
}

/**
 * Walks HTML character by character (skipping tags), producing one innerHTML
 * snapshot per visible character with all open tags properly closed.
 */
function buildSnapshots(beat: string): string[] {
  const html = beatToHtml(beat);
  const snapshots: string[] = [];
  const openTags: string[] = [];
  let current = "";
  let i = 0;

  while (i < html.length) {
    if (html[i] === "<") {
      const end = html.indexOf(">", i);
      if (end === -1) {
        current += html[i++];
        continue;
      }
      const tag = html.slice(i, end + 1);
      const inner = tag.slice(1, -1).trim();
      const tagName = inner.split(/[\s/]/)[0].toLowerCase();

      if (inner.startsWith("/")) {
        openTags.pop();
      } else if (!inner.endsWith("/") && tagName !== "br") {
        openTags.push(`</${tagName}>`);
      }

      current += tag;
      i = end + 1;

      if (tagName === "br") {
        snapshots.push(current + [...openTags].reverse().join(""));
      }
    } else {
      current += html[i++];
      snapshots.push(current + [...openTags].reverse().join(""));
    }
  }

  return snapshots;
}
