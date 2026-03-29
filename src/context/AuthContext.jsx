import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start as true

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Don't flip loading back and forth. Just start the process.
      try {
        if (currentUser) {
          const q = query(
            collection(db, "dairyDetails"), 
            where("reader", "==", currentUser.uid)
          );
          
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const dairyData = querySnapshot.docs[0].data();
            setUser({
              ...currentUser,
              uid: dairyData.userId, 
              isReadOnly: true,      
              realUid: currentUser.uid 
            });
          } else {
            setUser({ ...currentUser, isReadOnly: false });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        // ONLY set loading to false once EVERYTHING is done
        setLoading(false); 
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);