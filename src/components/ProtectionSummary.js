import React from "react";
import ProtectionCard from "./ProtectionCard";
import AlarmSummary from "./AlarmSummary";

const ProtectionSummary = ({ testResults, webcamCoordinates }) => (
  <div className="people-container">
    <AlarmSummary testResults={testResults} />
    {testResults.map((person) => (
      <ProtectionCard
        key={person.id}
        person={person}
        webcamCoordinates={webcamCoordinates}
      />
    ))}
  </div>
);

export default ProtectionSummary;
