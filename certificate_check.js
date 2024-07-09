import fs from 'fs';
import forge  from 'node-forge';

const certPem = fs.readFileSync('certificate.crt')

const parseCertificate = (certPem) => {
    const cert = forge.pki.certificateFromPem(certPem);
  const validity = {
    valid_from: cert.validity.notBefore,
    valid_to: cert.validity.notAfter
  };
  return validity;
};

const certValidity = parseCertificate(certPem);
console.log('Certificate Valid From:', certValidity.valid_from);
console.log('Certificate Valid To:', certValidity.valid_to);
