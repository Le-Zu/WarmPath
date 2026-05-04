import { useState, useEffect } from "react";
import { getPaths } from "@/services/paths.js";

/**
 * Custom hook to fetch and manage warm paths based on an intent.
 * @param {string|null} intent 
 * @returns {{ paths: Array, loading: boolean, error: string|null, refresh: Function }}
 */
export function usePaths(intent) {
   const [paths, setPaths] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   const fetchPaths = () => {
      setLoading(true);
      setError(null);
      getPaths(intent)
         .then(({ paths: fetchedPaths }) => {
            setPaths(fetchedPaths.map((p) => ({ ...p, warmScore: p.strength })));
         })
         .catch((err) => {
            console.error("[usePaths] Failed to fetch paths:", err);
            setError(err.message);
         })
         .finally(() => setLoading(false));
   };

   useEffect(() => {
      fetchPaths();
   }, [intent]);

   return { paths, loading, error, refresh: fetchPaths };
}
