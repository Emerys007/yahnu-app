
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, User as FirebaseUser, sendPasswordResetEmail, linkWithPopup, sendEmailVerification, verifyBeforeUpdateEmail } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, writeBatch } from "firebase/firestore";
import { app } from '@/lib/firebase'; // Ensure your firebase config is correctly exported from here
import Cookies from 'js-cookie';

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export type Role = 'graduate' | 'company' | 'school' | 'admin' | 'super_admin' | 'content_manager' | 'support_staff';
export type UserStatus = 'pending' | 'active' | 'suspended' | 'declined';

export type EducationEntry = {
  degree: string;
  field: string;
  gradYear: string;
  verified: boolean;
};

export interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  role: Role;
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  schoolId?: string;
  schoolName?: string;
  companyName?: string;
  contactName?: string;
  industry?: string;
  experience?: string;
  education?: EducationEntry[];
  skills?: string[] | string;
  phone?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  role: Role;
  signUp: (profile: Omit<UserProfile, 'uid' | 'status'>, password: string, inviteToken?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  isGoogleProvider: () => boolean;
  createPassword: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

const identifyHubSpotUser = (user: UserProfile) => {
    const _hsq = (window as any)._hsq = (window as any)._hsq || [];
    _hsq.push(["identify", {
        id: user.uid,
        email: user.email,
        firstname: user.firstName,
        lastname: user.lastName,
        role: user.role,
        company: user.companyName,
    }]);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDocument = async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...userDoc.data(),
      } as UserProfile;
    }
    return null;
  }
  
  const updateUserState = (profile: UserProfile | null) => {
    setUser(profile);
    if (profile) {
      Cookies.set('userRole', profile.role, { expires: 7, path: '/' });
      identifyHubSpotUser(profile);
    } else {
      Cookies.remove('userRole', { path: '/' });
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userProfile = await fetchUserDocument(firebaseUser);
         if (userProfile && userProfile.status === 'active') {
          // Sync email from Firebase Auth to Firestore if they differ.
          // This handles the case where a user verifies a new email.
          if (userProfile.email !== firebaseUser.email) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            await updateDoc(userDocRef, { email: firebaseUser.email });
            userProfile.email = firebaseUser.email; // Update in-memory profile
          }
          updateUserState(userProfile);
        } else {
           updateUserState(null);
        }
      } else {
        updateUserState(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const createUserDocument = async (firebaseUser: FirebaseUser, profile: Omit<UserProfile, 'uid' | 'email'>, email: string) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    
    // Graduates need approval from their school. Companies/Schools need admin approval. Admins are active immediately.
    const status: UserStatus = (profile.role === 'admin' || profile.role === 'content_manager' || profile.role === 'support_staff' || profile.role === 'super_admin') ? 'active' : 'pending';
    
    await setDoc(userDocRef, {
        ...profile,
        uid: firebaseUser.uid,
        email: email, // ensure email from auth is stored
        status: status,
        createdAt: new Date(),
    });

    return status;
  }

  const signUp = async (profile: Omit<UserProfile, 'uid' | 'status'>, password: string, inviteToken?: string) => {
    if (!profile.email) throw new Error("Email is required for sign up.");
    
    const userCredential = await createUserWithEmailAndPassword(auth, profile.email, password);
    const firebaseUser = userCredential.user;
    
    await sendEmailVerification(firebaseUser);

    const { email, ...profileData } = profile;
    
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const status: UserStatus = (profile.role === 'admin' || profile.role === 'content_manager' || profile.role === 'support_staff' || profile.role === 'super_admin') ? 'active' : 'pending';
    
    const batch = writeBatch(db);

    batch.set(userDocRef, {
        ...profileData,
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        status: status,
        createdAt: new Date(),
    });

    if (inviteToken) {
        const inviteDocRef = doc(db, "invites", inviteToken);
        batch.update(inviteDocRef, { status: "used", usedBy: firebaseUser.uid, usedAt: new Date() });
    }
    
    await batch.commit();

    await firebaseSignOut(auth);
  };

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await fetchUserDocument(userCredential.user);

    if (!userProfile) {
        await firebaseSignOut(auth);
        throw new Error("User data not found. Please contact support.");
    }

    if (userProfile.status !== 'active') {
        await firebaseSignOut(auth);
        if (userProfile.role === 'graduate') {
            throw new Error("pending_graduate");
        } else if (userProfile.status === 'pending') {
            throw new Error("pending_org");
        } else if (userProfile.status === 'suspended') {
            throw new Error("suspended");
        }
    }
    
    updateUserState(userProfile);
  };

  const signInWithGoogle = async () => {
    if (auth.currentUser) {
        try {
            const result = await linkWithPopup(auth.currentUser, googleProvider);
            const userProfile = await fetchUserDocument(result.user);
            if(userProfile) updateUserState(userProfile);
        } catch (error: any) {
             console.error("Failed to link Google account:", error);
            if(error.code === 'auth/credential-already-in-use') {
                throw new Error("This Google account is already linked to another Yahnu user.");
            }
            throw new Error("Failed to link Google account.");
        }
    } else {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        const userDocRef = doc(db, "users", firebaseUser.uid);
        let userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            const [firstName, ...lastNameParts] = (firebaseUser.displayName || "").split(" ");
            const lastName = lastNameParts.join(" ");
            const profile: Omit<UserProfile, 'uid' | 'email' | 'status'> = {
                name: firebaseUser.displayName || "Google User",
                firstName,
                lastName,
                role: 'graduate', // Default to graduate for Google sign-ups
            };
            await createUserDocument(firebaseUser, profile, firebaseUser.email!);
            userDoc = await getDoc(userDocRef);
        }
        
        const userProfile = userDoc.data() as UserProfile;
        
        if (userProfile?.status !== 'active') {
            await firebaseSignOut(auth);
            if (userProfile?.role === 'graduate') {
                throw new Error("pending_graduate");
            } else if (userProfile?.status === 'pending') {
                throw new Error("pending_org");
            } else if (userProfile?.status === 'suspended') {
                throw new Error("suspended");
            }
        }
        
        if (userProfile) updateUserState(userProfile);
    }
  };


  const signOut = async () => {
    await firebaseSignOut(auth);
    updateUserState(null);
  };

  const isGoogleProvider = () => {
      if (!auth.currentUser) return false;
      return auth.currentUser.providerData.some(p => p.providerId === 'google.com');
  }

  const createPassword = async () => {
      if (!auth.currentUser || !auth.currentUser.email) {
          throw new Error("No user is currently signed in or user has no email.");
      }
      await sendPasswordResetEmail(auth, auth.currentUser.email);
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!auth.currentUser) {
      throw new Error("No user is currently signed in.");
    }

    const { email, ...otherUpdates } = updates;
    const userDocRef = doc(db, "users", auth.currentUser.uid);

    // Handle email update separately.
    if (email && email !== auth.currentUser.email) {
      try {
        await verifyBeforeUpdateEmail(auth.currentUser, email);
        // Do NOT update the email in firestore here.
        // It will be updated by onAuthStateChanged after verification.
      } catch (error: any) {
        console.error("Error sending verification email for email update:", error);
        if (error.code === 'auth/requires-recent-login') {
          throw new Error("Please sign out and sign in again to update your email.");
        }
        if (error.code === 'auth/email-already-in-use') {
          throw new Error("This email is already in use by another account.");
        }
        throw new Error("Failed to send verification email for email update.");
      }
    }

    // Handle other profile updates.
    if (Object.keys(otherUpdates).length > 0) {
      await updateDoc(userDocRef, otherUpdates);
    }

    // Refresh the user state with the latest data.
    const userProfile = await fetchUserDocument(auth.currentUser);
    updateUserState(userProfile);
  };

  const value = {
    user,
    loading,
    role: user?.role || 'graduate',
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    isGoogleProvider,
    createPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
