// lib/resetCodeStore.ts

type CodeEntry = {
    code: string;
    expiresAt: number;
};

const resetCodeStore = new Map<string, CodeEntry>();

export function storeResetCode(email: string, code: string, ttlMinutes = 10) {
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
    resetCodeStore.set(email, { code, expiresAt });
}

export function verifyResetCode(email: string, inputCode: string): boolean {
    const entry = resetCodeStore.get(email);
    if (!entry) return false;

    const { code, expiresAt } = entry;
    if (Date.now() > expiresAt) {
        resetCodeStore.delete(email);
        return false;
    }

    const isValid = code === inputCode;
    if (isValid) resetCodeStore.delete(email); // invalidate on success
    return isValid;
}
