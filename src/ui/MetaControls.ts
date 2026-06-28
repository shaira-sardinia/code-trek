export class MetaControls {
  private container: HTMLElement;
  private homeAction: () => void;
  private isMuted = false;

  constructor(homeAction: () => void) {
    this.homeAction = homeAction;
    const el = document.getElementById("meta-controls");
    if (!el) throw new Error("meta-controls element not found in DOM");
    this.container = el;
    this.setupHomeButton();
    this.setupMuteButton();
    this.hide();
  }

  private setupHomeButton(): void {
    document.getElementById("home-button")!.addEventListener("click", () => this.homeAction());
  }

  private setupMuteButton(): void {
    document.getElementById("mute-button")!.addEventListener("click", () => {
      this.isMuted = !this.isMuted;
      this.updateMuteIcon();
    });
  }

  private updateMuteIcon(): void {
    const unmuted = document.getElementById("mute-icon-unmuted")!;
    const muted = document.getElementById("mute-icon-muted")!;
    unmuted.style.display = this.isMuted ? "none" : "block";
    muted.style.display = this.isMuted ? "block" : "none";
  }

  public show(): void {
    this.container.classList.remove("hidden");
  }

  public hide(): void {
    this.container.classList.add("hidden");
  }
}
