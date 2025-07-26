import React from "react";
import { Col, Row } from "react-bootstrap";

const CameraHelp = (props) => {
  const currentUrl = window.location.href;
  if (props.show) {
    return (
      <Row>
        <Col md={12}>
          Cuando se le solicite, debe hacer clic en <i>Permitir</i> para usar la aplicación
          con su cámara web.
          <br />
          Si no ve el diálogo, intente{" "}
          <a href={currentUrl}>abrir la aplicación</a> en una nueva ventana de incógnito,
          o revise la configuración de su cámara web en su navegador.
        </Col>
      </Row>
    );
  }
  return "";
};

export default CameraHelp;
