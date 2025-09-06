declare module 'clsx' {
  export type ClassValue =
    | string
    | number
    | boolean
    | undefined
    | null
    | { [key: string]: unknown }
    | ClassValue[];
  export function clsx(...inputs: ClassValue[]): string;
  export default clsx;
}

declare module 'tailwind-merge' {
  export function twMerge(...inputs: string[]): string;
  export default twMerge;
}
