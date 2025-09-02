export const pad = (n: number, width = 6) => String(n).padStart(width, '0');
export const y = (d = new Date()) => d.getFullYear();
export const newId = () => crypto.randomUUID();


export const buildCaseNumber = (seq: number, typePrefix = 'GEN', courtCode = 'LUS-HC') => {
    // Example format: 2025/GEN/000123/LUS-HC
    return `${y()}/${typePrefix}/${pad(seq)}/${courtCode}`;
};