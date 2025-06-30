import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import axios from "axios";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("https://machine-backend.azurewebsites.net/ajouter/login", { email, password });
      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("user_id", response.data.user_id);
        
      }
      if(response.data.role === 'ADMIN'){
        navigate('/home');
      } else if(response.data.role === 'VIEWER'){
        navigate('/home');
      } else if (response.data.role === 'EXECUTOR'){
        navigate('/home');
      }else if (response.data.role === 'MANAGER'){
        navigate('/home');
      }
    } catch (error) {
      alert("Invalid email or password. Please try again.");
    }
  };
  return (
    <div className="flex flex-col flex-1">
   
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
       
          </div>
          <div>
           
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
         
            </div>
            <form onSubmit={handleSubmit}>
  <div className="space-y-6">
    <div>
      <Label>
        Email <span className="text-error-500">*</span>
      </Label>
      <Input
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="info@gmail.com"
      />
    </div>
    <div>
      <Label>
        Password <span className="text-error-500">*</span>
      </Label>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Checkbox checked={isChecked} onChange={setIsChecked} />
        <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
          Keep me logged in
        </span>
      </div>
      <Link
        to="/reset-password"
        className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
      >
        Forgot password?
      </Link>
    </div>
    <div>
      <Button type="submit" className="w-full" size="sm">
        Sign in
      </Button>
    </div>
  </div>
</form>


            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
