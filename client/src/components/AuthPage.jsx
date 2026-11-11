import { useState } from "react";
import { ListTodo, Eye, EyeOff } from "lucide-react";
import { authApi, getApiError } from "../api/tasks";

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isRegister = mode === "register";
  const update = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setError("");
    if (isRegister && form.name.trim().length < 2) return setError("Name must contain at least 2 characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Please enter a valid email address.");
    if (form.password.length < 8) return setError("Password must contain at least 8 characters.");
    setLoading(true);
    try {
      const { data } = await (isRegister ? authApi.register : authApi.login)({
        ...(isRegister ? { name: form.name.trim() } : {}),
        email: form.email.trim(), password: form.password
      });
      localStorage.setItem("taskflow_token", data.token);
      onAuthenticated(data.user);
    } catch (err) { setError(getApiError(err)); }
    finally { setLoading(false); }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <a className="brand auth-brand" href="#"><span className="brand-mark"><ListTodo size={21}/></span><span>task<span className="brand-accent">flow</span></span></a>
        <span className="eyebrow">{isRegister ? "GET STARTED" : "WELCOME BACK"}</span>
        <h1>{isRegister ? "Create your account" : "Sign in to TaskFlow"}</h1>
        <p className="auth-subtitle">{isRegister ? "Organise your work, one task at a time." : "Your tasks are waiting for you."}</p>
        <form onSubmit={submit} className="auth-form">
          {isRegister && <label>Full name<input name="name" value={form.name} onChange={update} placeholder="Your name" maxLength="60" autoComplete="name" required/></label>}
          <label>Email address<input name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" required/></label>
          <label>Password<div className="password-wrap">
            <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={update} placeholder="At least 8 characters" autoComplete={isRegister ? "new-password" : "current-password"} minLength="8" required/>
            <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
          </div></label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary auth-submit" disabled={loading}>{loading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}</button>
        </form>
        <p className="auth-switch">{isRegister ? "Already have an account?" : "New to TaskFlow?"} <button onClick={() => {setMode(isRegister ? "login" : "register");setError("");}}>{isRegister ? "Sign in" : "Create an account"}</button></p>
      </section>
      <p className="auth-footnote">Your tasks are private to your account.</p>
    </main>
  );
}
