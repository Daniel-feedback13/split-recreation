"use client";

const PARTICIPANT_ID_KEY = "recreation.participantId";
const NICKNAME_KEY = "recreation.nickname";

export function getStoredPlayer() {
  return {
    participantId: window.localStorage.getItem(PARTICIPANT_ID_KEY) || undefined,
    nickname: window.localStorage.getItem(NICKNAME_KEY) || "",
  };
}

export function storePlayer(participantId: string, nickname: string) {
  window.localStorage.setItem(PARTICIPANT_ID_KEY, participantId);
  window.localStorage.setItem(NICKNAME_KEY, nickname);
}

export function clearStoredPlayer() {
  window.localStorage.removeItem(PARTICIPANT_ID_KEY);
  window.localStorage.removeItem(NICKNAME_KEY);
}
