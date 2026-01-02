import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

export function auth() {
    return getAuth();
}

export async function signupEmail(email, password) {
    const a = getAuth();
    const cred = await createUserWithEmailAndPassword(a, email, password);
    return cred.user;
}

export async function loginEmail(email, password) {
    const a = getAuth();
    const cred = await signInWithEmailAndPassword(a, email, password);
    return cred.user;
}

export async function logout() {
    const a = getAuth();
    await signOut(a);
}
