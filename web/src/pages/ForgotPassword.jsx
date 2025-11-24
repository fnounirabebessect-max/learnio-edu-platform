import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const ForgotPassword = () => {
  const auth = getAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({
        type: "success",
        text: "✅ Email de réinitialisation envoyé ! Vérifiez votre boîte mail.",
      });
      setEmail("");
    } catch (error) {
      let msg = "❌ Une erreur est survenue.";
      if (error.code === "auth/user-not-found") {
        msg = "❌ Aucun compte trouvé avec cet e-mail.";
      } else if (error.code === "auth/invalid-email") {
        msg = "❌ L'adresse e-mail n'est pas valide.";
      }
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        
        <div className="separator"></div>

        {/* Titre principal */}
        <h1 className="forgot-title">Réinitialiser le mot de passe</h1>
        <p className="forgot-subtitle">
          Entrez votre adresse e-mail pour recevoir un lien de réinitialisation
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

          {/* Bouton Envoyer */}
          <button
            type="submit"
            disabled={loading}
            className="forgot-button"
          >
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
            {!loading && <span className="forgot-badge"></span>}
          </button>
        </form>

        {/* Lien retour */}
        <p className="back-link">
          <a href="/login">
            Retour à la connexion
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;