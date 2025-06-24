import React, { useState, useEffect, useRef} from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import axios from "axios";
import { Snackbar, Alert } from '@mui/material';

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [FullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [emailError, setEmailError] = React.useState('');
  const typingTimeoutRef = useRef(null);

const navigate = useNavigate();
  // Cleanup timeout if component unmounts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

 const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to validate after 700ms of no typing
    typingTimeoutRef.current = setTimeout(() => {
      if (value && !value.endsWith('@avocarbon.com')) {
        setEmailError('Email must end with @avocarbon.com');
      } else {
        setEmailError('');
      }
    }, 2500);
  };



const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post("https://machine-backend.azurewebsites.net/ajouter/register", {
      email,
      password,
      role:'VIEWER'
    });


    if (response.status === 201) {
      setSuccessMessage('User registered successfully!');
      setOpenSnackbar(true);

      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("role", 'VIEWER');

      // Optional: delay navigation to show the message for a moment
      setTimeout(() => {
        navigate("/signin");
      }, 1500);
    }
  } catch (error) {

    console.error("Registration Error:", error);
  }
};



  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">

      <Snackbar
  open={openSnackbar}
  autoHideDuration={3000}
  onClose={() => setOpenSnackbar(false)}
  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
>
  <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>
    {successMessage}
  </Alert>
</Snackbar>

   
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
         
          </div>
          <div>
         
           
            <form onSubmit={handleSubmit}>
  <div className="space-y-5">
    {/* Full Name */}
    <div>
      <Label>
        Full Name<span className="text-error-500">*</span>
      </Label>
      <Input
        type="text"
        id="FullName"
        value={FullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Enter your full name"
      />
    </div>

    {/* Email */}
    <div>
      <Label>
        Email<span className="text-error-500">*</span>
      </Label>
      <Input
        type="email"
        id="email"
        value={email}
        onChange={handleEmailChange}
        placeholder="Enter your email"
      />
        {emailError && <p className="text-error-500 text-sm mt-1">{emailError}</p>}
    </div>

    {/* Password */}
    <div>
      <Label>
        Password<span className="text-error-500">*</span>
      </Label>
      <div className="relative">
        <Input
          placeholder="Enter your password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span
          onClick={() => setShowPassword(!showPassword)}
          className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
        >
          {showPassword ? (
            <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
          ) : (
            <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
          )}
        </span>
      </div>
    </div>

    {/* Submit Button */}
    <div>
      <button
        type="submit"
        className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
      >
        Sign Up
      </button>
    </div>
  </div>
</form>


            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account? {""}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
