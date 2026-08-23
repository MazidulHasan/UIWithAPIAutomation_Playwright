import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const BASE_URL = required('BASE_URL', 'https://conduit.bondaracademy.com');
export const API_URL = required('API_URL', 'https://conduit-api.bondaracademy.com/api');

export const TEST_USER = {
  username: required('TEST_USER_USERNAME', 'mazidul'),
  email: required('TEST_USER_EMAIL', 'md.mazidulhasan1@gmail.com'),
  password: required('TEST_USER_PASSWORD', 'ConduitQA@2026!'),
};

export const AUTH_STORAGE_STATE = path.resolve(__dirname, '../../playwright/.auth/user.json');
