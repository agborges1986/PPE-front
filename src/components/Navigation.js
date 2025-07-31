import React from "react";
import { Nav, Navbar } from "react-bootstrap";

const Navigation = ({ activeMode, onModeChange }) => {
  return (
    <Navbar bg="light" expand="lg" style={{ marginBottom: "20px" }}>
      <Navbar.Brand>EPP Analysis System</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Nav className="mr-auto">
          <Nav.Link 
            active={activeMode === "live"}
            onClick={() => onModeChange("live")}
            style={{ cursor: "pointer" }}
          >
            📹 Cámara en Vivo
          </Nav.Link>
          <Nav.Link 
            active={activeMode === "video"}
            onClick={() => onModeChange("video")}
            style={{ cursor: "pointer" }}
          >
            🎬 Análisis de Video
          </Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Navigation; 