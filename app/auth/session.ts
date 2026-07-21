import "server-only";

// this whole thing is server management, the user won't see this only me


// a session is the authenticated state "this request belongs to user_123"
//  like showing your ID at a concert
// a JWT is the signed data that represents the state in your implementation
//  the wristband showing you were approved
// a cookie is the browser storage and delivery mechanism carrying the JWT
//  keeping and presenting that wristband on later request

// SignJWT creates and cryptographically signs a JSON Web Token
// function createSession produces a string like xxxxx.yyyyy.zzzzz
// Signing stops someone from modifying the token w/o detection. 
// It doesn't encrypt the payload, users can decode it but they can't change it without the secret key

// jwtVerify checks that:
// JWT has a valid cryptographic signature
// was signed using the expected secret
// hasn't expired, if it includes an expiration time
// has structurally valid JWT data
import { SignJWT, jwtVerify } from "jose";

// gives server-side Next.js code access to cookies sent by the browser
// can also set a cookie from a server function or route handler
// A cookie is a small text file stored in the browser that lets a website
// remember information about a user, such as their login status or preferences,
// and sends that information back to the server with future requests.
import { cookies } from "next/headers";

// defines the shape of data stored in the JSON Web Token, meaning its a string
type SessionPayload = {
    userId: string;
}

// reads the session-signing secret from env.local
const secret = process.env.SESSION_SECRET;

// stops the app if the session secret is missing
if (!secret) {
    throw new Error("Missing SESSION_SECRET");
}

// Converts the secret string into bytes required by jose (the library).
// TextEncoder converts the secret string into a Uint8Array (an array of bytes), each num representing the UTF-8 encoding of a character
const encodedSecret = new TextEncoder().encode(secret);

// creates a signed JWT session and stores it in a browser cookie
// @param userId is the ID of the authenticated user
export async function createSession(userId: string) {
    // sets the session to expire 7 days after creation
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // creates a JSON Web Token containing the user's ID
    const token = await new SignJWT({ userId })
        // Sets the JWT header to use the HS256 (HMAC SHA-256) signing algorithm.
        // HS256 uses a shared secret key to create a digital signature, allowing
        // the receiver to verify that the token is authentic and hasn't been modified.
        .setProtectedHeader({ alg: "HS256" })
        // add the current time as the token's "issued at" time
        .setIssuedAt()
        // add the date when the token is no longer valid
        .setExpirationTime(expiresAt)
        // signs the token with the session secret
        .sign(encodedSecret);

    // get Next.js' cookie store for the current request
    // meaning reading the cookies that the browser sent along with the HTTP request
    const cookieStore = await cookies();

    // store signed JWT in the user's browser
    cookieStore.set("session", token, {
        // Prevents client-side javascript from reading the cookie
        httpOnly: true,

        // only send the cookie over to HTTPS in production
        secure: process.env.NODE_ENV === "production",

        // Reduce the risk of cross-site request attacks
        // means only send this cookie for requests that mostly come from my own website.
        sameSite: "lax",

        // make the cookie available throughout the website
        // / means the root of the website, so every page of this website can recieve the cookie
        path: "/",

        // makes the cookie expire at the date set by expiresDate
        // even without it, the JWT itself will expire after 7 days
        // however, the cookie itself is a browser session cookie, meaning it has no explicit expiration date
        expires: expiresAt,
    });
}

// Reads and validates the current user's session
// Promise<SessionPayload | null> means the final result will be either:
//  a valid session { userId: "user_123" }
//  null when there's no valid session
export async function getSession(): Promise<SessionPayload | null> {
    // get Next.js' cookie store for the current request
    // meaning reading the cookies that the browser sent along with the HTTP request
    const cookieStore = await cookies();

    // looks for the cookie named "session" and extracts it's value, which is the JWT created by createSession()
    // ?. is an optional chaining operator that prevents an error when the cookie doesn't exist
    // the "session" cookie is the signed JWT string that was stored in the token variable earlier
    const token = cookieStore.get("session")?.value;

    // if there is no session cookie, the user doesn't have a session so the function returns null
    if (!token) {
        return null;
    }

    // try the code inside, if not then throw an error
    try {
        // jwtVerify will throw an error is the token is expired, malformed, altered, or signed with the wrong secret
        // if the verification succeeds, it returns info including the decoded payload
        /** Example:
         * 
        {
            payload: {
                userId: "user_123",
                iat: 1784560000,
                exp: 1785164800
            },
                protectedHeader: {
                    alg: "HS256"
            }
        }
         */
        // with algorithms: ["HS256"] the verification only accepts the same algorithm used by SignJWT
        const { payload } = await jwtVerify(token, encodedSecret, {
            algorithms: ["HS256"],
        });

        // if the userId is not a string, return null
        if (typeof payload.userId !== "string") {
            return null;
        }

        // if the token and payload are both valid, the function returns a clean SessionPayload
        // {
        //   userId: "user_123"
        // }
        // will only return the session data rather than the entire JWT payload
        return {
            userId: payload.userId,
        };
    
    // if verification fails for any reason, the error is caught and the function returns null
    } catch {
        return null;
    }
}

// declares a function that removes the current session
export async function deleteSession() {
    // get Next.js' cookie store for the current request
    // meaning reading the cookies that the browser sent along with the HTTP request
    const cookieStore = await cookies();

    // tells browser to remove the "session" cookie
    // after running this function if you used getSession() it would return null
    // the logout operation is basically await deleteSession();
    cookieStore.delete("session");
}
