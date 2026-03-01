"use server"
import { AES, enc } from 'crypto-js';

export const encryptData = async (data) => {
  console.log('data', data);
  console.log('process.env.SECRET_KEY', process.env.NEXT_PUBLIC_SECRET_KEY);
  return AES.encrypt(JSON.stringify(data), process.env.NEXT_PUBLIC_SECRET_KEY).toString();

};

export const decryptData = async (data) => {
  return JSON.parse(AES.decrypt(data, process.env.NEXT_PUBLIC_SECRET_KEY).toString(enc.Utf8));
};
