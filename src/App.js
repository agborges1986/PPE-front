import React, { useEffect, useRef, useState } from "react";
import { findDOMNode } from "react-dom";
import { AmplifyAuthenticator, AmplifySignIn } from "@aws-amplify/ui-react/legacy";
import { onAuthUIStateChange } from "@aws-amplify/ui-components";
import Webcam from "react-webcam";
import { Alert, Col, Row, Nav, Navbar } from "react-bootstrap";

import gateway from "./utils/gateway";
import { ppeMapper } from "./utils/ppe";
import { isUndefined, formatErrorMessage } from "./utils";

import CameraHelp from "./components/CameraHelp";
import ProtectionSummary from "./components/ProtectionSummary";
import Header from "./components/Header";
import SettingsHelp from "./components/SettingsHelp";
<<<<<<< HEAD
=======
import Navigation from "./components/Navigation";
>>>>>>> adapt2
import VideoUpload from "./components/VideoUpload";

const App = () => {
  const [authState, setAuthState] = useState("signin");
  const [testResults, setTestResults] = useState([]);
  const [errorDetails, setErrorDetails] = useState(undefined);
  const [readyToStream, setReadyToStream] = useState(false);
  const [webcamCoordinates, setWebcamCoordinates] = useState({});
<<<<<<< HEAD
  const [activeMode, setActiveMode] = useState("camera"); // "camera" or "video"

=======
  const [activeMode, setActiveMode] = useState("live");
>>>>>>> adapt2
  const iterating = useRef(false);
  const webcam = useRef(undefined);

  const getSnapshot = async () => {
    setWebcamCoordinates(findDOMNode(webcam.current).getBoundingClientRect());
    const image = webcam.current.getScreenshot();
    const b64Encoded = image.split(",")[1];

    try {
      const result = await gateway.processImage(b64Encoded);
      const people = result.Persons.map(ppeMapper);
      setTestResults(people);
      if (iterating.current) setTimeout(getSnapshot, 300);
      else setTestResults([]);
    } catch (e) {
      setErrorDetails(formatErrorMessage(e));
      console.log(e);
    }
  };

  const setupWebcam = (instance) => {
    webcam.current = instance;

    const checkIfReady = () => {
      if (
        webcam.current &&
        webcam.current.state &&
        webcam.current.state.hasUserMedia
      ) {
        setReadyToStream(true);
      } else setTimeout(checkIfReady, 250);
    };

    checkIfReady();
  };

  const toggleRekognition = () => {
    iterating.current = !iterating.current;

    if (iterating.current) {
      getSnapshot();
    } else setTestResults([]);
  };

  useEffect(() => {
    return onAuthUIStateChange((s) => setAuthState(s));
  }, []);

  const signedIn = authState === "signedin";

<<<<<<< HEAD
  const renderCameraMode = () => (
=======
  const renderLiveCamera = () => (
>>>>>>> adapt2
    <>
      <CameraHelp show={!readyToStream} />
      <Row>
        <Col md={8} sm={6}>
          <Webcam
            audio={false}
            ref={setupWebcam}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 1280,
              height: 640,
              facingMode: "user",
            }}
            style={{ width: "100%", marginTop: "10px" }}
          />
        </Col>
        <Col md={4} sm={6}>
          <Alert
            variant="danger"
            style={{
              display: isUndefined(errorDetails) ? "none" : "block",
            }}
          >
<<<<<<< HEAD
            An error happened{errorDetails && `: ${errorDetails}`}.{" "}
            <a href={window.location.href}>Retry</a>.
=======
            Ocurrió un error{errorDetails && `: ${errorDetails}`}.{" "}
            <a href={window.location.href}>Reintentar</a>.
>>>>>>> adapt2
          </Alert>
          <ProtectionSummary
            testResults={testResults}
            webcamCoordinates={webcamCoordinates}
          />
        </Col>
      </Row>
    </>
  );

<<<<<<< HEAD
  const renderVideoMode = () => (
    <div className="container-fluid">
      <VideoUpload />
    </div>
=======
  const renderVideoUpload = () => (
    <VideoUpload />
>>>>>>> adapt2
  );

  return (
    <div className="App">
      <Header
        readyToStream={readyToStream}
        signedIn={signedIn}
        toggleRekognition={toggleRekognition}
        activeMode={activeMode}
      />
      {!window.rekognitionSettings ? (
        <SettingsHelp />
      ) : signedIn ? (
        <>
<<<<<<< HEAD
          <Navbar bg="light" expand="lg" className="mb-3">
            <Navbar.Brand>PPE Detection</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="mr-auto">
                <Nav.Link 
                  active={activeMode === "camera"}
                  onClick={() => setActiveMode("camera")}
                >
                  📹 Live Camera
                </Nav.Link>
                <Nav.Link 
                  active={activeMode === "video"}
                  onClick={() => setActiveMode("video")}
                >
                  🎥 Video Upload
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
          
          {activeMode === "camera" ? renderCameraMode() : renderVideoMode()}
=======
          <Navigation 
            activeMode={activeMode} 
            onModeChange={setActiveMode} 
          />
          {activeMode === "live" ? renderLiveCamera() : renderVideoUpload()}
>>>>>>> adapt2
        </>
      ) : (
        <div className="amplify-auth-container">
          <AmplifyAuthenticator usernameAlias="email">
            <AmplifySignIn
              slot="sign-in"
              usernameAlias="email"
              formFields={[
                {
                  type: "email",
                  label: "Correo electrónico *",
                  placeholder: "Correo electrónico",
                  required: true,
                  inputProps: { autoComplete: "off" },
                },
                {
                  type: "password",
                  label: "Contraseña *",
                  placeholder: "Contraseña",
                  required: true,
                  inputProps: { autoComplete: "off" },
                },
              ]}
            >
              <div slot="secondary-footer-content"></div>
            </AmplifySignIn>
          </AmplifyAuthenticator>
        </div>
      )}
    </div>
  );
};

export default App;
