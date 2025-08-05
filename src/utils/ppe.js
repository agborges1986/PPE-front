const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const percentageToString = (percentage) => Math.floor(percentage * 10) / 10;
const formatText = (t) => t.replace(/_/gi, " ").toLowerCase();

// Define required PPE for each body part - updated to match actual AWS Rekognition types
const REQUIRED_PPE = {
  FACE: ["MASK", "FACE_COVER"],  // AWS might return either MASK or FACE_COVER
  HEAD: ["HELMET", "HEAD_COVER"], // AWS returns HEAD_COVER
  LEFT_HAND: ["GLOVE", "HAND_COVER"], // AWS returns HAND_COVER
  RIGHT_HAND: ["GLOVE", "HAND_COVER"], // AWS returns HAND_COVER
};

// Function to translate equipment types to Spanish
const translateEquipmentType = (type) => {
  const translations = {
    "mask": "Mascarilla",
    "face_cover": "Cubrebocas",
    "helmet": "Casco",
    "head_cover": "Casco",
    "glove": "Guante",
    "hand_cover": "Guante"
  };
  
  const normalizedType = type.toLowerCase().replace(/_/g, " ");
  return translations[normalizedType] || capitalize(type);
};

// Function to translate body parts to Spanish
const translateBodyPart = (bodyPart) => {
  const translations = {
    "face": "cara",
    "head": "cabeza", 
    "left hand": "mano izquierda",
    "right hand": "mano derecha"
  };
  
  return translations[bodyPart] || bodyPart;
};

// Function to determine missing PPE
export const getMissingPPE = (person) => {
  const detectedPPE = {};
  const missingPPE = [];

  // Collect all detected PPE by body part
  (person.BodyParts || []).forEach((bodyPart) => {
    const bodyPartName = bodyPart.Name;
    if (bodyPart.EquipmentDetections && bodyPart.EquipmentDetections.length > 0) {
      detectedPPE[bodyPartName] = bodyPart.EquipmentDetections.map(
        (eq) => eq.Type
      );
    } else {
      detectedPPE[bodyPartName] = [];
    }
  });

  // Check for missing PPE
  Object.entries(REQUIRED_PPE).forEach(([bodyPart, requiredTypes]) => {
    const detected = detectedPPE[bodyPart] || [];
    
    // Check if ANY of the required types are found
    const hasAnyRequiredType = requiredTypes.some(requiredType => 
      detected.includes(requiredType)
    );
    
    // If none of the required types are found, mark as missing
    if (!hasAnyRequiredType) {
      // Use the first required type as the display name
      const displayType = requiredTypes[0];
      missingPPE.push({
        bodyPart: translateBodyPart(formatText(bodyPart)),
        type: translateEquipmentType(displayType),
      });
    }
  });

  return missingPPE;
};

const EQUIPMENT_CONFIDENCE_THRESHOLD = 95; // Change this value to adjust threshold

export const ppeMapper = (person) => {
  const bodyParts = (person.BodyParts || []).filter(
    (x) => x.EquipmentDetections && x.EquipmentDetections.length > 0
  );

  const results = bodyParts
    .map((p) =>
      p.EquipmentDetections
        .filter(eq => eq.Confidence >= EQUIPMENT_CONFIDENCE_THRESHOLD)
        .map((eq) => ({
          bodyPart: translateBodyPart(formatText(p.Name)),
          confidence: percentageToString(p.Confidence),
          type: translateEquipmentType(eq.Type),
          coversBodyPart: eq.CoversBodyPart.Value,
          coversBodyPartConfidence: percentageToString(
            eq.CoversBodyPart.Confidence
          ),
          boundingBox: eq.BoundingBox,
        }))
    )
    .flat();

  const missingPPE = getMissingPPE({
    ...person,
    BodyParts: bodyParts.map(bp => ({
      ...bp,
      EquipmentDetections: bp.EquipmentDetections.filter(eq => eq.Confidence >= EQUIPMENT_CONFIDENCE_THRESHOLD)
    }))
  });

  return {
    id: person.Id,
    boundingBox: person.BoundingBox,
    results,
    missingPPE,
    hasAlarm: missingPPE.length > 0,
  };
};
