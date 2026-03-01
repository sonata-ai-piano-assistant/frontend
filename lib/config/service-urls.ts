// URLs des services backend (à adapter selon vos environnements)
export const IA_SERVICE_URL = process.env.NEXT_PUBLIC_IA_SERVICE_URL || 'http://localhost:4003';
export const BDD_SERVICE_URL = process.env.NEXT_PUBLIC_BDD_SERVICE_URL || 'http://localhost:4001';
export const NOTIF_SERVICE_URL = process.env.NEXT_PUBLIC_NOTIF_SERVICE_URL || 'http://localhost:4004';
export const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:4002';
export const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:4000';
