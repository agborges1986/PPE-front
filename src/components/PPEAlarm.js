import React from "react";
import { Alert, Badge } from "react-bootstrap";
import Icon from "./Icon";

const PPEAlarm = ({ missingPPE, personId }) => {
  if (!missingPPE || missingPPE.length === 0) {
    return null;
  }

  return (
    <Alert variant="danger" className="ppe-alarm" style={{ marginTop: "10px" }}>
      <div className="alarm-header">
        <Icon type="fail" size="20" />
        <span style={{ marginLeft: "8px" }}>
          ⚠️ ALARMA EPP - Persona #{personId}
        </span>
      </div>
      <div>
        <strong>EPP Requerido Faltante:</strong>
        <div style={{ marginTop: "8px" }}>
          {missingPPE.map((item, index) => (
            <div key={index} className="missing-ppe-item">
              <Badge variant="danger" style={{ marginRight: "8px" }}>
                {item.type}
              </Badge>
              en {item.bodyPart}
            </div>
          ))}
        </div>
      </div>
    </Alert>
  );
};

export default PPEAlarm; 