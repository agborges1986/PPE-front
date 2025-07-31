import React from "react";
import { Alert } from "react-bootstrap";

const SettingsHelp = () => (
  <Alert variant="danger">
    Hay un problema con la configuración de su configuración. Si está ejecutando el
    código front-end desde su máquina local, es posible que necesite seguir{" "}
    <a
      href="https://github.com/aws-samples/amazon-rekognition-ppe/blob/master/CONTRIBUTING.md#working-with-the-web-ui"
      rel="noopener noreferrer"
      target="_blank"
    >
      esta guía
    </a>
    .
  </Alert>
);

export default SettingsHelp;
