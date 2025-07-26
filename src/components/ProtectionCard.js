import React from "react";
import { Card, ListGroup } from "react-bootstrap";

import BoundingBox from "./BoundingBox";
import Icon from "./Icon";
import PPEAlarm from "./PPEAlarm";

const ProtectionCard = ({ person, webcamCoordinates }) => (
  <Card style={{ marginTop: "20px", textAlign: "left" }}>
    <Card.Header>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{`Persona #${person.id}`}</span>
        {person.hasAlarm && (
          <span style={{ color: "#dc3545", fontWeight: "bold" }}>
            ⚠️ ALARMA
          </span>
        )}
      </div>
    </Card.Header>
    <BoundingBox
      label={`Persona #${person.id}`}
      coordinates={person.boundingBox}
      webcamCoordinates={webcamCoordinates}
    />
    <Card.Body>
      <PPEAlarm missingPPE={person.missingPPE} personId={person.id} />
      {person.results.map((r, index) => (
        <ListGroup key={index} className="detection-part">
          <BoundingBox
            label={r.type}
            coordinates={r.boundingBox}
            webcamCoordinates={webcamCoordinates}
            color="#28a745"
          />
          <ListGroup.Item>
            {r.type} detectado
            <span className="confidence">{r.confidence}%</span>
          </ListGroup.Item>
          <ListGroup.Item key={index}>
            {r.type} en {r.bodyPart}:{" "}
            <Icon type={r.coversBodyPart ? "success" : "fail"} />{" "}
            <span style={{ color: r.coversBodyPart ? "#1d8102" : "#d13212" }}>
              {r.coversBodyPart ? "Sí" : "No"}
            </span>
            <span className="confidence">{r.coversBodyPartConfidence}%</span>
          </ListGroup.Item>
        </ListGroup>
      ))}
    </Card.Body>
  </Card>
);

export default ProtectionCard;
