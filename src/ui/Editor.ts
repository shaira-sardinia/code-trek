import "./MonacoSetup";
import * as monaco from "monaco-editor";

export interface EditorOptions {
  container: HTMLElement;
  initialValue: string;
  language?: "typescript" | "javascript";
  readOnly?: boolean;
}

export class Editor {
  private instance: monaco.editor.IStandaloneCodeEditor;

  constructor(options: EditorOptions) {
    this.instance = monaco.editor.create(options.container, {
      value: options.initialValue,
      language: options.language ?? "javascript",
      theme: "hc-black",
      readOnly: options.readOnly ?? false,

      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: "'Menlo', 'Consolas', monospace",
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      tabSize: 2,
      insertSpaces: true,

      scrollbar: {
        useShadows: false,
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },

      padding: { top: 12, bottom: 12 },
    });
  }

  getValue(): string {
    return this.instance.getValue();
  }

  setValue(code: string): void {
    this.instance.setValue(code);
  }

  setReadOnly(readOnly: boolean): void {
    this.instance.updateOptions({ readOnly });
  }

  layout(): void {
    this.instance.layout();
  }

  dispose(): void {
    this.instance.dispose();
  }
}
