import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import {
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase/firebase";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate(); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // 🧩 Connexion email + mot de passe
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ type: "error", text: "Veuillez remplir tous les champs" });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      await login(email, password);
      setMessage({ type: "success", text: "Connexion réussie ✅" });
      navigate("/dashboard");
    } catch (error) {
      setMessage({ type: "error", text: "Erreur : " + error.message });
    } finally {
      setLoading(false);
    }
  };

  // 🔑 Navigation vers la page de réinitialisation
  const handleForgotPasswordClick = () => {
    navigate("/forgot-password"); // ← Navigation vers la page ForgotPassword
  };

  // 🟢 Connexion via Google
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setMessage({ type: "success", text: "Connexion Google réussie ✅" });
      navigate("/dashboard");
    } catch (error) {
      setMessage({ type: "error", text: "Erreur Google : " + error.message });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
       
        <div className="separator"></div>

        {/* Titre principal */}
        <h1 className="login-title">Bienvenue sur EduConnect</h1>
        <p className="login-subtitle">
          Connectez-vous pour accéder à vos cours ou créer un nouveau compte.
        </p>

        {/* Messages */}
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleLogin}>
          {/* Champ Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-container">
              <div className="input-icon">
                <div className="icon-email"></div>
              </div>
              <input
                type="email"
                placeholder="votre.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>
          </div>

          {/* Champ Mot de passe */}
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <div className="input-container">
              <div className="input-icon">
                <div className="icon-lock"></div>
              </div>
              <input
                type="password"
                placeholder="........"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
            </div>
          </div>

          {/* Lien mot de passe oublié - MAINTENANT NAVIGUE VERS LA PAGE */}
          <div className="forgot-password">
            <button
              type="button"
              onClick={handleForgotPasswordClick} // ← Appelle la navigation
              className="forgot-link"
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* Bouton Se connecter */}
          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? "Connexion..." : "Se connecter"}
            {!loading && <span className="cu-badge"></span>}
          </button>
        </form>

        {/* Séparateur */}
        <div className="button-separator">
          <span className="separator-text">ou</span>
        </div>

        {/* Bouton Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="google-button"
        >
          <div className="icon-google"></div>
          {googleLoading ? "Connexion..." : "Se connecter avec Google"}
        </button>

        {/* Lien vers inscription */}
        <p className="signup-link">
          Pas de compte ?{" "}
          <a href="/register">
            S'inscrire
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;