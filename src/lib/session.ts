import { useSyncExternalStore } from "react";
import { googleAuthApi, loginApi, registerApi } from "./api";
import { getToken, setToken } from "./api/client";
import type { Customer } from "./api/types";

/**
 * Client session store — same useSyncExternalStore + localStorage pattern as
 * dark-store-portal's lib/auth.ts, under a distinct key so both apps can
 * coexist in one browser.
 */

export type Session = (Customer & { token: string }) | null;

const SESSION_KEY = "customer_session";
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedSession: Session = null;

function notify() {
  listeners.forEach((l) => l());
}

function read(): Session {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw === cachedRaw) return cachedSession;
    cachedRaw = raw;
    cachedSession = raw ? (JSON.parse(raw) as Session) : null;
    return cachedSession;
  } catch {
    return null;
  }
}

function write(session: Session) {
  if (typeof window === "undefined") return;
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setToken(session.token);
  } else {
    localStorage.removeItem(SESSION_KEY);
    setToken(null);
  }
  cachedRaw = null;
  cachedSession = session;
  notify();
}

function sessionFromAuth(token: string, customer: Customer): NonNullable<Session> {
  return { token, ...customer };
}

export async function signIn(email: string, password: string) {
  const { token, customer } = await loginApi(email, password);
  const session = sessionFromAuth(token, customer);
  write(session);
  return session;
}

export async function signUp(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const { token, customer } = await registerApi(input);
  const session = sessionFromAuth(token, customer);
  write(session);
  return session;
}

export async function signInWithGoogle(idToken: string) {
  const { token, customer } = await googleAuthApi(idToken);
  const session = sessionFromAuth(token, customer);
  write(session);
  return session;
}

export function signOut() {
  write(null);
}

export function useSession(): Session {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      const onStorage = () => {
        cachedRaw = null;
        cb();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    read,
    () => null,
  );
}

/** Ensure token in localStorage stays in sync if session exists (hydration edge). */
export function hydrateTokenFromSession() {
  const session = read();
  if (session?.token && getToken() !== session.token) setToken(session.token);
}
