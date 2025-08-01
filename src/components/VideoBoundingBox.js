import React from "react";

const VideoBoundingBox = ({ person, webcamCoordinates, isMissing = false }) => {
  const { BoundingBox } = person;
  const { Width, Height, Left, Top } = BoundingBox;

  const boxStyle = {
    position: "absolute",
    left: `${Left * 100}%`,
    top: `${Top * 100}%`,
    width: `${Width * 100}%`,
    height: `${Height * 100}%`,
    border: "3px solid #6c757d", // Neutral gray border
    backgroundColor: "rgba(108, 117, 125, 0.1)", // Light neutral background
    borderRadius: "4px",
    pointerEvents: "none",
    zIndex: 10,
  };

  const labelStyle = {
    position: "absolute",
    top: "-25px",
    left: "0",
    backgroundColor: "#6c757d", // Neutral gray background
    color: "white",
    padding: "2px 6px",
    borderRadius: "3px",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  };

  return (
    <div style={boxStyle}>
      <div style={labelStyle}>
        Persona #{person.Id}
      </div>
    </div>
  );
};

export default VideoBoundingBox; 