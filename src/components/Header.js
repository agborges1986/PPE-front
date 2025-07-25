import { Auth } from "aws-amplify";
import React, { useEffect, useState } from "react";
import { Button, Nav, Navbar } from "react-bootstrap";
import tivitLogo from '../images/tivit.png';

import { retryWrapper } from "../utils";

import RekognitionButton from "./RekognitionButton";

import "./Header.css";

const Header = ({ readyToStream, signedIn, toggleRekognition }) => {
  const [authError, setAuthError] = useState(null);
  const [userEmail, setUserEmail] = useState(undefined);

  const reload = () => window.location.reload();

  const signOut = () => Auth.signOut().then(reload).catch(reload);

  useEffect(() => {
    if (signedIn) {
      retryWrapper(() => Auth.currentAuthenticatedUser())
        .then((user) => setUserEmail(user.username))
        .catch(setAuthError);
    }
  }, [signedIn]);

  return (
    <Navbar bg="dark" expand="lg">
      <Navbar.Brand>
        <img src={tivitLogo} alt="My Company Logo" className="company-logo" />
        <span className="header-title"> Demo computer vision</span>
      </Navbar.Brand>
      <Navbar.Toggle />
      {(userEmail || authError) && (
        <Navbar.Collapse className="justify-content-end">
          <Nav>
            {authError && (
              <>
                <span className="auth-error">
                  Authentication error: {authError}
                </span>
                <Button variant="link" className="headerLink" onClick={reload}>
                  Reintentar
                </Button>
              </>
            )}
            {userEmail && (
              <>
                <RekognitionButton
                  onClick={toggleRekognition}
                  enabled={readyToStream}
                />

                <Button onClick={signOut} variant="warning" size="sm">
                  Cerrar sesión
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      )}
    </Navbar>
  );
};

export default Header;
