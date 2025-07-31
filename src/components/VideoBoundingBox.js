import React from "react";
import { ppeMapper } from "../utils/ppe";

const VideoBoundingBox = ({ person, webcamCoordinates, isMissing = false }) => {
  const { BoundingBox } = person;
  const { Width, Height, Left, Top } = BoundingBox;

  const boxStyle = {
    position: "absolute",
    left: `${Left * 100}%`,
    top: `${Top * 100}%`,
    width: `${Width * 100}%`,
    height: `${Height * 100}%`,
    border: isMissing ? "3px solid #dc3545" : "3px solid #28a745",
    backgroundColor: isMissing ? "rgba(220, 53, 69, 0.2)" : "rgba(40, 167, 69, 0.2)",
    borderRadius: "4px",
    pointerEvents: "none",
    zIndex: 10,
  };

  const labelStyle = {
    position: "absolute",
    top: "-25px",
    left: "0",
    backgroundColor: isMissing ? "#dc3545" : "#28a745",
    color: "white",
    padding: "2px 6px",
    borderRadius: "3px",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  };

  const mappedPerson = ppeMapper(person);
  const hasAlarm = mappedPerson.hasAlarm;

  return (
    <div style={boxStyle}>
      <div style={labelStyle}>
        {hasAlarm ? "❌ " : "✅ "}Persona #{person.Id}
      </div>
    </div>
  );
};

export default VideoBoundingBox; 