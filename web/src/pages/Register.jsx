import { useState } from "react";
import { useAuth } from "../context/authContext";

const Register = () => {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await register(email, password);
      setMessage({ type: "success", text: "✅ Inscription réussie !" });
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="separator"></div>

        {/* Titre principal */}
        <h1 className="register-title">Bienvenue sur EduConnect</h1>
        <p className="register-subtitle">
          Créez votre compte pour accéder à vos cours ou vous connecter à un compte existant.
        </p>

        {/* Messages */}
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          {/* Champ Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-container">
              <span className="input-icon">
                <div className="icon icon-email"></div>
              </span>
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
              <span className="input-icon">
                <div className="icon icon-lock"></div>
              </span>
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

          {/* Bouton S'inscrire */}
          <button
            type="submit"
            disabled={loading}
            className="register-button"
          >
            {loading ? "Création du compte..." : "S'inscrire"}
            {!loading && <span className="register-badge"></span>}
          </button>
        </form>

        {/* Lien vers connexion */}
        <p className="login-link">
          Déjà un compte ?{" "}
          <a href="/login">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;