import "server-only";

// createHmac creates a signature using some data and a secret
// timingSafeEqual securely compares two signatures
import { createHmac, timingSafeEqual } from "crypto";

// retrieves the private newsletter secret from the .env file
// : string is the explicit return type, basically guarantees that the returned value will be a string
function getNewsletterSecret(): string {
  const secret = process.env.NEWSLETTER_SECRET;

  if (!secret) {
    throw new Error("Missing NEWSLETTER_SECRET");
  }

  return secret;
}

const newsletterSecret = getNewsletterSecret();

export function createUnsubscribeToken(userId: string) {
  // creates an HMAC using the SHA-256 hashing algorithm and the private newsletter secret
  // HMAC means Hash-based Message Authentication Code
  // it proves that the value was signed by your server and has not been changed
  const signature = createHmac("sha256", newsletterSecret)
    // adds the user ID as the data being signed
    .update(userId)
    // finishes the calculation and returns the signature as hexadecimal text
    .digest("hex");

  // returns a token containing the user ID, a period separator, and the signature
  return `${userId}.${signature}`;
}

export function verifyUnsubscribeToken(token: string) {
  // divides the token at the period and assigns the pieces to userId and signature
  const [userId, signature] = token.split(".");

  if (!userId || !signature) {
    return null;
  }

  // server signs the supplied user ID again using its private secret
  // if the token is authentic and unchanged, this recreated signature will match the signature
  // included in the token
  const expectedSignature = createHmac("sha256", newsletterSecret)
    .update(userId)
    .digest("hex");

  // converts both hexadecimal strings into binary Buffer values
  // timingSafeEqual() requires buffers or another supported binary representation rather than ordinary strings
  // supplied is the signature received from the link
  // expected is the signature independantly calculated by the server
  const supplied = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  if (
    // checks whether they contain the same number of bytes
    // required because timingSafeEqual() will throw an error if the inputs have different lengths
    supplied.length !== expected.length ||
    // securely compares the bytes
    !timingSafeEqual(supplied, expected)
  ) {
    return null;
  }

  return userId;
}
