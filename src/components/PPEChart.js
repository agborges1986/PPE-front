import React from "react";
import { Card, Table } from "react-bootstrap";

const PPEChart = ({ analysisResults, currentTime }) => {
  // Get current 5-second window results
  const getCurrentWindowResults = () => {
    const windowStart = Math.floor(currentTime / 3) * 3; // 3-second windows
    const windowEnd = windowStart + 3;
    
    // Get all results within the current 5-second window
    const windowResults = analysisResults.filter(result => 
      result.timestamp >= windowStart && result.timestamp < windowEnd
    );
    
    if (windowResults.length === 0) {
      return { Persons: [] };
    }
    
    // Count how many times each person appears in the window
    const personCounts = {};
    const personData = {};
    
    windowResults.forEach(result => {
      result.result.Persons.forEach(person => {
        const personId = person.Id;
        if (!personCounts[personId]) {
          personCounts[personId] = 0;
          personData[personId] = { bodyParts: {} };
        }
        personCounts[personId]++;
        // Track PPE detection for this person (union of all frames)
        person.BodyParts.forEach(bodyPart => {
          if (!personData[personId].bodyParts[bodyPart.Name]) {
            personData[personId].bodyParts[bodyPart.Name] = new Set();
          }
          bodyPart.EquipmentDetections.forEach(equipment => {
            personData[personId].bodyParts[bodyPart.Name].add(equipment.Type);
          });
        });
      });
    });
    
    // Only include people who appear in more than half the frames
    const minFrames = Math.ceil(windowResults.length / 2);
    const reliablePersons = Object.entries(personCounts)
      .filter(([personId, count]) => count > minFrames)
      .map(([personId, count]) => {
        const person = {
          Id: personId,
          BodyParts: Object.entries(personData[personId].bodyParts).map(([bodyPartName, equipmentSet]) => ({
            Name: bodyPartName,
            EquipmentDetections: Array.from(equipmentSet).map(equipmentType => ({
              Type: equipmentType,
              Confidence: 100 // Mark as present if detected in any frame
            }))
          }))
        };
        return person;
      });
    
    return { Persons: reliablePersons };
  };

  // Get all unique PPE types from current frame only
  const getAllPPETypes = () => {
    // Only consider the three specific PPE types with separate gloves
    const requiredPPETypes = [
      "MASK",
      "HELMET",
      "LEFT_GLOVE",
      "RIGHT_GLOVE"
    ];
    
    return requiredPPETypes;
  };

  // Get Spanish title for PPE type
  const getSpanishTitle = (ppeType) => {
    const titles = {
      "MASK": "Mascarilla",
      "HELMET": "Casco",
      "LEFT_GLOVE": "Guante Izquierdo",
      "RIGHT_GLOVE": "Guante Derecho"
    };
    return titles[ppeType] || ppeType;
  };

  // Check if a person has a specific PPE type
  const hasPPE = (person, ppeType) => {
    // Debug logging
    console.log('Checking PPE:', ppeType, 'for person:', person.Id);
    console.log('Person body parts:', person.BodyParts);
    
    if (ppeType === "LEFT_GLOVE") {
      const leftHand = person.BodyParts.find(bp => bp.Name === "LEFT_HAND");
      const hasGlove = leftHand && leftHand.EquipmentDetections && leftHand.EquipmentDetections.some(eq => 
        eq.Type === "GLOVE" || eq.Type === "HAND_COVER"
      );
      console.log('LEFT_GLOVE check:', hasGlove, leftHand);
      return hasGlove;
    } else if (ppeType === "RIGHT_GLOVE") {
      const rightHand = person.BodyParts.find(bp => bp.Name === "RIGHT_HAND");
      const hasGlove = rightHand && rightHand.EquipmentDetections && rightHand.EquipmentDetections.some(eq => 
        eq.Type === "GLOVE" || eq.Type === "HAND_COVER"
      );
      console.log('RIGHT_GLOVE check:', hasGlove, rightHand);
      return hasGlove;
    } else if (ppeType === "MASK") {
      const face = person.BodyParts.find(bp => bp.Name === "FACE");
      const hasMask = face && face.EquipmentDetections && face.EquipmentDetections.some(eq => 
        eq.Type === "MASK" || eq.Type === "FACE_COVER"
      );
      console.log('MASK check:', hasMask, face);
      return hasMask;
    } else if (ppeType === "HELMET") {
      const head = person.BodyParts.find(bp => bp.Name === "HEAD");
      // Check for both HELMET and HEAD_COVER
      const hasHelmet = head && head.EquipmentDetections && head.EquipmentDetections.some(eq => 
        eq.Type === "HELMET" || eq.Type === "HEAD_COVER"
      );
      console.log('HELMET check:', hasHelmet, head);
      return hasHelmet;
    }
    return false;
  };

  // Get person identifier - always use consistent numbering
  const getPersonId = (person, index) => {
    return `Persona ${index}`;
  };

  const currentResults = getCurrentWindowResults();
  const allPPETypes = getAllPPETypes();

  // Debug logging for current results
  const windowStart = Math.floor(currentTime / 3) * 3;
  console.log('Current 5-second window:', windowStart, 'to', windowStart + 3);
  console.log('Current results:', currentResults);
  console.log('All PPE types:', allPPETypes);
  console.log('Number of persons:', currentResults.Persons.length);

  // Only show chart if there are people detected
  if (currentResults.Persons.length === 0) {
    return (
      <Card>
        <Card.Header>
          <strong>Estado EPP</strong>
        </Card.Header>
        <Card.Body>
          <p className="text-muted">
            No hay personas detectadas en este momento
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <strong>Estado EPP</strong>
        <span style={{ marginLeft: "10px", fontSize: "0.9em", color: "#6c757d" }}>
          {currentResults.Persons.length} personas detectadas
        </span>
        <br />
        <small style={{ color: "#6c757d" }}>
          Ventana de 3s: {windowStart}s - {windowStart + 3}s
        </small>
      </Card.Header>
      <Card.Body>
        <div style={{ overflowX: "auto", fontSize: "0.7em" }}>
          <Table striped bordered hover size="sm" style={{ fontSize: "0.8em" }}>
            <thead>
              <tr>
                <th>Persona</th>
                {allPPETypes.map(ppeType => (
                  <th key={ppeType} style={{ textAlign: "center" }}>
                    {getSpanishTitle(ppeType)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentResults.Persons.map((person, index) => (
                <tr key={index}>
                  <td>
                    <strong>{getPersonId(person, index)}</strong>
                  </td>
                  {allPPETypes.map(ppeType => {
                    const hasEquipment = hasPPE(person, ppeType);
                    return (
                      <td key={ppeType} style={{ textAlign: "center" }}>
                        {hasEquipment ? (
                          <span style={{ color: "#28a745", fontSize: "0.9em" }}>
                            ✅
                          </span>
                        ) : (
                          <span style={{ color: "#dc3545", fontSize: "0.9em" }}>
                            ❌
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        
        {/* Summary */}
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
          <small className="text-muted">
            <strong>Leyenda:</strong> ✅ EPP Presente | ❌ EPP Faltante
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PPEChart; 