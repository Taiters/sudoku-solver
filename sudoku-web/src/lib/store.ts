import { writable } from "svelte/store";

export const cameraStream = writable<MediaStream | null>(null);
export const image = writable<string | null>(null)
