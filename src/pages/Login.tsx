import React from 'react';

const IconGoogle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 48 48"
    aria-hidden="true"
    focusable="false"
    style={{ marginRight: 8 }}
  >
    <path fill="#FFC107" d="M43.611 20.083h-1.611V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.59 16.108 18.936 14 24 14c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.164 0 9.86-1.977 13.409-5.197l-6.191-5.238C29.179 35.6 26.715 36.5 24 36.5c-5.198 0-9.612-3.317-11.267-7.962l-6.5 5.006C9.54 39.43 16.232 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.793 2.237-2.262 4.166-4.094 5.565.001-.001 6.191 5.238 6.191 5.238.437-.402 8.6-6.287 6.211-18.72z"/>
  </svg>
);

const IconFacebook = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    style={{ marginRight: 8 }}
  >
    <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.093 10.125 24v-8.438H7.078V12.07h3.047V9.412c0-3.007 1.792-4.668 4.533-4.668 1.313 0 2.686.235 2.686.235v2.953h-1.513c-1.492 0-1.956.93-1.956 1.884v2.254h3.328l-.532 3.493h-2.796V24C19.612 23.093 24 18.1 24 12.073z"/>
    <path fill="#FFF" d="M16.469 15.563l.532-3.493h-3.328V9.816c0-.954.464-1.884 1.956-1.884h1.513V5.98s-1.373-.235-2.686-.235c-2.741 0-4.533 1.661-4.533 4.668v2.659H7.078v3.093h3.047V24h3.547v-8.438h2.797z"/>
  </svg>
);

type LoginProps = {
  onSignUp: () => void;
  onLogin: () => void;
  onLoginWithGoogle: () => void;
  onLoginWithFacebook: () => void;
  onForgotPassword: () => void;
};

function Login({
  onSignUp,
  onLogin,
  onLoginWithGoogle,
  onLoginWithFacebook,
  onForgotPassword,
}: LoginProps) {
  return (
    <div className="login-screen">
      <img
        src="/assets/events_illustration.png"
        alt="Meet people at events"
        className="hero-image"
      />
      <div className="content">
        <h1>Meet people at events</h1>
        <p>
          Find people who are going to the same events as you. Meet them there!
        </p>

        <button className="primary-button" onClick={onSignUp}>Sign up</button>
        <button className="secondary-button" onClick={onLogin}>Log in</button>
        <button className="secondary-button" onClick={onLoginWithGoogle}>
          <IconGoogle />
          Continue with Google
        </button>
        <button className="secondary-button" onClick={onLoginWithFacebook}>
          <IconFacebook />
          Continue with Facebook
        </button>
        <a href="#" onClick={onForgotPassword} className="forgot-password">Forgot Password?</a>
      </div>
      {/** Bottom nav intentionally removed for the login page */}
    </div>
  );
}

export default Login;


