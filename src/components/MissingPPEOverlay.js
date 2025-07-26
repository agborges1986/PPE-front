import React from "react";
import BoundingBox from "./BoundingBox";

const MissingPPEOverlay = ({ testResults, webcamCoordinates }) => {
  const missingPPEItems = [];

  testResults.forEach((person) => {
    if (person.hasAlarm && person.missingPPE) {
      person.missingPPE.forEach((item) => {
        // Create a bounding box for missing PPE
        // We'll position it based on typical body part locations
        const bodyPartCoordinates = getBodyPartCoordinates(item.bodyPart, person.boundingBox);
        if (bodyPartCoordinates) {
          missingPPEItems.push({
            id: `${person.id}-${item.bodyPart}-${item.type}`,
            coordinates: bodyPartCoordinates,
            label: `Missing ${item.type}`,
            personId: person.id,
            bodyPart: item.bodyPart,
            type: item.type,
          });
        }
      });
    }
  });

  return (
    <>
      {missingPPEItems.map((item) => (
        <BoundingBox
          key={item.id}
          coordinates={item.coordinates}
          label={item.label}
          webcamCoordinates={webcamCoordinates}
          isMissing={true}
        />
      ))}
    </>
  );
};

// Helper function to estimate body part coordinates based on person bounding box
const getBodyPartCoordinates = (bodyPart, personBoundingBox) => {
  const { Width, Height, Left, Top } = personBoundingBox;
  
  switch (bodyPart) {
    case "face":
      return {
        Width: Width * 0.3,
        Height: Height * 0.25,
        Left: Left + Width * 0.35,
        Top: Top + Height * 0.1,
      };
    case "head":
      return {
        Width: Width * 0.4,
        Height: Height * 0.3,
        Left: Left + Width * 0.3,
        Top: Top + Height * 0.05,
      };
    case "left hand":
      return {
        Width: Width * 0.15,
        Height: Height * 0.2,
        Left: Left + Width * 0.1,
        Top: Top + Height * 0.4,
      };
    case "right hand":
      return {
        Width: Width * 0.15,
        Height: Height * 0.2,
        Left: Left + Width * 0.75,
        Top: Top + Height * 0.4,
      };
    default:
      return null;
  }
};

export default MissingPPEOverlay; 