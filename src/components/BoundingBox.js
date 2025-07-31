import React from "react";

const BoundingBox = ({
  coordinates,
  label,
  color = "#000",
  webcamCoordinates,
  isMissing = false,
}) => (
  <div
    style={{
      height: webcamCoordinates.height * coordinates.Height,
      left: webcamCoordinates.left + coordinates.Left * webcamCoordinates.width,
      top: webcamCoordinates.top + coordinates.Top * webcamCoordinates.height,
      width: webcamCoordinates.width * coordinates.Width,
      border: `2px solid ${isMissing ? "#dc3545" : color}`,
      color: "#fff",
      fontWeight: "bold",
      position: "fixed",
      backgroundColor: isMissing ? "rgba(220, 53, 69, 0.2)" : "transparent",
      animation: isMissing ? "pulse 1s infinite" : "none",
    }}
  >
    <span style={{ 
      backgroundColor: isMissing ? "#dc3545" : color, 
      padding: "2px",
      display: "block",
      textAlign: "center"
    }}>
      {isMissing ? "❌ " : ""}{label}
    </span>
  </div>
);

export default BoundingBox;
