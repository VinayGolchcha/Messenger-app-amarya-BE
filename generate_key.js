import crypto from 'crypto';
import dotenv from "dotenv";
dotenv.config();
// Generate a 32-byte encryption key (AES-256)
const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('Generated Encryption Key:', encryptionKey);



// const encryptionKey = process.env.ENCRYPTION_KEY; 
// const ivLength = 16;
// const keyBuffer = Buffer.from(encryptionKey, 'hex');

// const encryptMessage = (messageContent) => {
//   const iv = crypto.randomBytes(ivLength);
//   const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
//   let encrypted = cipher.update(messageContent, 'utf8', 'hex');
//   encrypted += cipher.final('hex');
//   return `${iv.toString('hex')}:${encrypted}`;
// };

// const messageContent = "my name is sanjana jain";
// const encryptedContent = encryptMessage(messageContent);
// console.log("encrypted message", encryptedContent);


// const decryptMessage = (encryptedContent) => {
//     const [iv, encryptedText] = encryptedContent.split(':');
//     const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), Buffer.from(iv, 'hex'));
//     let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
//     decrypted += decipher.final('utf8');
//     return decrypted;
// };

// // const encryptedContent = fetchedMessage.content; // This is the encrypted content from MongoDB
// const decryptedContent = decryptMessage(encryptedContent);
// console.log('Decrypted message content:', decryptedContent);