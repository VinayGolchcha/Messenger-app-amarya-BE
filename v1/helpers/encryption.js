import crypto from 'crypto';
import dotenv from "dotenv";
dotenv.config();


const encryptionKey = process.env.ENCRYPTION_KEY; 
const ivLength = 16;
const keyBuffer = Buffer.from(encryptionKey, 'hex');

export const encryptMessage = (messageContent) => {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
  let encrypted = cipher.update(messageContent, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

const decryptMessage = (encryptedContent) => {
    const [iv, encryptedText] = encryptedContent.split(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

export const decryptMessages = (messages) => {
    return messages.map((message) => {
      if (message.content) {
        message.content = decryptMessage(message.content);
      }
      return message;
    });
};
