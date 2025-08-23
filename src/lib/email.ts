import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

interface EmailPayload {
  to: string;
  template: {
    name: string;
    data: Record<string, unknown>;
  };
}

/**
 * Sends an email by adding a document to the 'mail' collection in Firestore.
 * The 'Trigger Email' Firebase extension must be installed and configured
 * to listen to this collection.
 *
 * @param {EmailPayload} payload - The email payload.
 * @returns {Promise<void>}
 */
export const sendEmail = async (payload: EmailPayload): Promise<void> => {
  try {
    const mailCollectionRef = collection(db, "mail");
    await addDoc(mailCollectionRef, {
      to: payload.to,
      template: {
        name: payload.template.name,
        data: payload.template.data,
      },
    });
    console.log("Email request added to Firestore for:", payload.to);
  } catch (error) {
    console.error("Error adding email request to Firestore:", error);
    // Depending on requirements, you might want to throw the error
    // or handle it gracefully.
  }
};
