import React, { useEffect } from "react";
import { db } from "./api/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

function App() {
  useEffect(() => {
    const loadCourses = async () => {
      const snapshot = await getDocs(collection(db, "courses"));
      console.log("Courses:", snapshot.docs.map(doc => doc.data()));
    };
    loadCourses();
  }, []);

  return (
    <div>
      <h1>LEARNIO Platform</h1>
      <p>Firebase is connected ✅</p>
    </div>
  );
}

export default App;
