// Demo credentials
import { getUserByRole } from "./users";

export const demoCredentials = [
    { role: 'admin', email: getUserByRole("admin")?.email, password: 'admin123' },
    { role: 'judge', email: getUserByRole("judge")?.email, password: 'judge123' },
    { role: 'lawyer', email: getUserByRole("lawyer")?.email, password: 'lawyer123' },
    { role: 'public', email: getUserByRole("public")?.email, password: 'public123' },
];