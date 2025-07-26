import React from "react";
import { Badge } from "react-bootstrap";

const AlarmSummary = ({ testResults }) => {
  const peopleWithAlarms = testResults.filter(person => person.hasAlarm);
  const totalMissingPPE = testResults.reduce((total, person) => 
    total + (person.missingPPE ? person.missingPPE.length : 0), 0
  );

  if (peopleWithAlarms.length === 0) {
    return (
      <div className="compliance-status success">
        ✅ Todas las personas detectadas tienen el EPP adecuado.
      </div>
    );
  }

  return (
    <div className="compliance-status danger">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "1.2em", marginRight: "8px" }}>🚨</span>
        <strong>ALARMA DE CUMPLIMIENTO EPP</strong>
      </div>
      <div>
        <strong>Resumen:</strong>
        <ul style={{ marginTop: "8px", marginBottom: "0", textAlign: "left" }}>
          <li>
            <Badge variant="danger" style={{ marginRight: "8px" }}>
              {peopleWithAlarms.length}
            </Badge>
            persona(s) con EPP faltante
          </li>
          <li>
            <Badge variant="danger" style={{ marginRight: "8px" }}>
              {totalMissingPPE}
            </Badge>
            elemento(s) de EPP faltantes en total
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AlarmSummary; 