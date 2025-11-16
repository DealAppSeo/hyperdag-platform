declare module 'qrcode' {
  export function toDataURL(text: string): Promise<string>;
  export function toCanvas(canvas: HTMLCanvasElement, text: string): Promise<any>;
  export function toString(text: string): Promise<string>;
  export function toFile(path: string, text: string): Promise<any>;
}