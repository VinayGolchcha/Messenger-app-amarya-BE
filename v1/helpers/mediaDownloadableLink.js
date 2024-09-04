import { MongoClient, GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import {MediaModel} from '../user/models/mediaModel.js';

export const generateDownloadLink = async (buffer, type, name) => {
  try {
    // Convert the buffer to a Base64 string
    const base64FileData = buffer.toString('base64');
    let mimeType = 'application/octet-stream'; // Default MIME type

    switch (type) {
      case 'image':
        mimeType = `image/${name.split('.').pop()}`;
        break;
      case 'audio':
        mimeType = 'audio/mpeg';
        break;
      case 'video':
        mimeType = 'video/mp4';
        break;
      case 'document':
        // Extract file extension
        const extension = name.split('.').pop().toLowerCase();
        switch (extension) {
          case 'pdf':
            mimeType = 'application/pdf';
            break;
          case 'doc':
            mimeType = 'application/msword';
            break;
          case 'docx':
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          case 'ppt':
            mimeType = 'application/vnd.ms-powerpoint';
            break;
          case 'pptx':
            mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            break;
          case 'xls':
            mimeType = 'application/vnd.ms-excel';
            break;
          case 'xlsx':
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            break;
          case 'exe':
            mimeType = 'application/x-msdownload';
            break;
          // Add other document types as needed
          default:
            mimeType = 'application/octet-stream';
            break;
        }
        break;
      default:
        mimeType = 'application/octet-stream'; // Fallback for unknown types
    }
    // Create a downloadable link
    const downloadLink = `data:${mimeType};base64,${base64FileData}`;
    return downloadLink;
  } catch (err) {
    console.error('Failed to generate download link: ' + err);
    throw err;
  }
};