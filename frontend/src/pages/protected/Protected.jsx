
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const Protected = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const location = useLocation();


  useEffect(() => {   
    const checkAuth = () => {
      const token = localStorage.getItem("token");

       if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try { 
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Date.now() / 1000;
        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        setIsAuthenticated(true);
        setLoading(false);
      } catch (error) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

   if (loading) {
    return <div>Loading...</div>;
  }

   if (!isAuthenticated) {
    return (<Navigate to="/login"state={{ from: location }} replace />);
  }

  return <Outlet />;
};

export default Protected;
