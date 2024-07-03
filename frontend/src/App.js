import "./App.css";
import Dashboard from "./modules/Dashbord/Dashboard";
import Form from "./modules/Form/Form";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import React from "react";

const ProtectedRoute = ({ children, auth = false }) => {
  const isLoggedIn = localStorage.getItem("user:token") !== null || false;
  if (!isLoggedIn && auth) {
    return <Navigate to={"/users/sign_in"} />;
  } else if (
    isLoggedIn &&
    ["/users/sign_in", "/users/sign_up"].includes(window.location.pathname)
  ) {
    console.log("object :>> ");
    return <Navigate to={"/"} />;
  }
  return children;
};

function App() {
  return (
    <>
       <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute auth={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/users/sign_in"
            element={
              <ProtectedRoute>
                <Form isSignInPage={true} />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/users/sign_up"
            element={
              <ProtectedRoute>
                <Form isSignInPage={false} />
              </ProtectedRoute>
            }
          ></Route>
        </Routes>
      </BrowserRouter> 

      {/* <div className="bg-[#e6f0fe] h-screen">
      <BrowserRouter>
        <Form />
        <Dashboard />
        </BrowserRouter>
      </div> */}
    </>
  );
}

export default App;
