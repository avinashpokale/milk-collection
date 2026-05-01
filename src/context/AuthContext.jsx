import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dairyDetails, setDairyDetails] = useState(null); // Added state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // 1. Fetch Dairy Details (Added this section)
          const dairyDocRef = doc(db, "dairyDetails", currentUser.uid);
          const dairyDocSnap = await getDoc(dairyDocRef);
          
          if (dairyDocSnap.exists()) {
            setDairyDetails(dairyDocSnap.data());
          }

          // 2. Existing Reader Permission Logic
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
          setDairyDetails(null);
        }
      } catch (error) {
        setUser(null);
        setDairyDetails(null);
      } finally {
        setLoading(false); 
      }
    });

    return () => unsubscribe();
  }, []);

  // Added dairyDetails to the Provider value
  return (
    <AuthContext.Provider value={{ user, dairyDetails, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);