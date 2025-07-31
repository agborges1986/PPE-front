import React, { useState, useRef } from "react";
import { Button, Card, ProgressBar, Alert, Row, Col } from "react-bootstrap";
import Icon from "./Icon";
import gateway from "../utils/gateway";
import { ppeMapper } from "../utils/ppe";
import VideoBoundingBox from "./VideoBoundingBox";

const VideoUpload = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [webcamCoordinates, setWebcamCoordinates] = useState({});
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Configuration for alert delays
  const ALERT_DELAY_SECONDS = 3; // Alert after 3 seconds of missing PPE
  const FRAME_INTERVAL = 1; // Check every 1 second

  // Extract frames from video at regular intervals
  const extractFrames = async (videoBlob) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const frames = [];
        const frameInterval = 1000; // Extract frame every 1 second
        const duration = video.duration * 1000;
        const totalFrames = Math.ceil(duration / frameInterval);
        let processedFrames = 0;
        
        const extractFrameAtTime = (time) => {
          return new Promise((resolveFrame) => {
            video.currentTime = time / 1000;
            video.onseeked = () => {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0);
              canvas.toBlob((blob) => {
                const frame = {
                  time: time,
                  image: blob,
                  timestamp: time / 1000
                };
                frames.push(frame);
                processedFrames++;
                
                if (processedFrames === totalFrames) {
                  resolve(frames);
                } else {
                  // Extract next frame
                  const nextTime = (processedFrames) * frameInterval;
                  if (nextTime < duration) {
                    extractFrameAtTime(nextTime);
                  }
                }
                resolveFrame(frame);
              }, 'image/jpeg', 0.8);
            };
          });
        };
        
        // Start extracting frames
        extractFrameAtTime(0);
      };
    });
  };

  // Process video frames through API
  const processVideoFrames = async (frames) => {
    const results = [];
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      setProcessingProgress((i / frames.length) * 100);
      
      try {
        // Convert blob to base64
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
          };
          reader.readAsDataURL(frame.image);
        });

        // Call actual API
        const result = await gateway.processImage(base64);
        results.push({
          timestamp: frame.timestamp,
          time: frame.time,
          result: result
        });
      } catch (error) {
        console.error('Error processing frame:', error);
        // Add empty result for failed frames
        results.push({
          timestamp: frame.timestamp,
          time: frame.time,
          result: { Persons: [] }
        });
      }
    }
    
    return results;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setIsProcessing(true);
      setProcessingProgress(0);
      
      try {
        // Extract frames
        const frames = await extractFrames(file);
        
        // Process frames
        const results = await processVideoFrames(frames);
        setAnalysisResults(results);
        
      } catch (error) {
        console.error('Error processing video:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      // Update webcam coordinates for bounding boxes
      const videoElement = videoRef.current;
      if (videoElement) {
        setWebcamCoordinates(videoElement.getBoundingClientRect());
      }
    }
  };

  const handleTimelineClick = (timestamp) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  const getAlertsForTime = (time) => {
    return analysisResults.filter(result => 
      Math.abs(result.timestamp - time) < 0.5
    );
  };

  const getCurrentFrameResults = () => {
    const currentAlerts = getAlertsForTime(currentTime);
    if (currentAlerts.length > 0) {
      return currentAlerts[0].result;
    }
    return { Persons: [] };
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAlerts = () => {
    const alerts = [];
    const personAlerts = {}; // Track consecutive alerts per person
    
    // Group results by timestamp and check for consecutive alerts
    analysisResults.forEach(result => {
      result.result.Persons.forEach(person => {
        const mappedPerson = ppeMapper(person);
        const personKey = `person_${person.Id}`;
        
        if (mappedPerson.hasAlarm) {
          if (!personAlerts[personKey]) {
            personAlerts[personKey] = {
              startTime: result.timestamp,
              consecutiveFrames: 1,
              lastFrameTime: result.timestamp
            };
          } else {
            // Check if this is a consecutive frame (within 1.5 seconds)
            if (result.timestamp - personAlerts[personKey].lastFrameTime <= 1.5) {
              personAlerts[personKey].consecutiveFrames++;
              personAlerts[personKey].lastFrameTime = result.timestamp;
            } else {
              // Reset if gap is too large
              personAlerts[personKey] = {
                startTime: result.timestamp,
                consecutiveFrames: 1,
                lastFrameTime: result.timestamp
              };
            }
          }
        } else {
          // Reset if person is compliant
          delete personAlerts[personKey];
        }
      });
    });
    
    // Only create alerts for persons with enough consecutive frames
    Object.entries(personAlerts).forEach(([personKey, alertData]) => {
      const requiredFrames = Math.ceil(ALERT_DELAY_SECONDS / FRAME_INTERVAL);
      
      if (alertData.consecutiveFrames >= requiredFrames) {
        // Find the first frame that triggered this alert
        const alertFrame = analysisResults.find(result => 
          result.timestamp >= alertData.startTime && 
          result.result.Persons.some(person => 
            person.Id.toString() === personKey.split('_')[1] && 
            ppeMapper(person).hasAlarm
          )
        );
        
        if (alertFrame) {
          alerts.push({
            timestamp: alertData.startTime,
            time: alertData.startTime * 1000,
            result: alertFrame.result,
            duration: alertData.consecutiveFrames * FRAME_INTERVAL
          });
        }
      }
    });
    
    return alerts;
  };

  const renderPersonCard = (person, personIndex) => {
    // Define all required PPE for this person
    const allRequiredPPE = [
      { key: "FACE", bodyPart: "Cara", type: "Mascarilla" },
      { key: "HEAD", bodyPart: "Cabeza", type: "Casco" },
      { key: "LEFT_HAND", bodyPart: "Mano Izquierda", type: "Guante" },
      { key: "RIGHT_HAND", bodyPart: "Mano Derecha", type: "Guante" }
    ];

    // Create a map of detected PPE for easy checking
    const detectedPPE = {};
    person.BodyParts.forEach(bodyPart => {
      detectedPPE[bodyPart.Name] = bodyPart.EquipmentDetections;
    });

    // Check if all required PPE are present
    const allPPEPresent = allRequiredPPE.every(required => 
      detectedPPE[required.key] && detectedPPE[required.key].length > 0
    );

    // Hide the card if all PPE are present
    if (allPPEPresent) {
      return null;
    }

    return (
      <Card key={personIndex} style={{ marginBottom: "10px" }}>
        <Card.Header>
          <strong>Persona #{person.Id}</strong>
        </Card.Header>
        <Card.Body>
          <div style={{ marginBottom: "15px" }}>
            <h6>Estado del EPP:</h6>
            {allRequiredPPE.map((required, index) => {
              const detected = detectedPPE[required.key] || [];
              const isPresent = detected.length > 0;
              const confidence = isPresent ? detected[0].Confidence : 0;
              const coversBodyPart = isPresent ? detected[0].CoversBodyPart : null;

              return (
                <div key={index} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  marginBottom: "8px",
                  padding: "8px",
                  backgroundColor: isPresent ? "#d4edda" : "#f8d7da",
                  borderRadius: "4px"
                }}>
                  <Icon 
                    type={isPresent ? "success" : "fail"} 
                    style={{ marginRight: "10px" }}
                  />
                  <div style={{ flex: 1 }}>
                    <strong>{required.type} en {required.bodyPart}</strong>
                    <div style={{ 
                      color: isPresent ? "#155724" : "#721c24",
                      fontSize: "0.9em"
                    }}>
                      {isPresent ? (
                        <>
                          ✅ Presente ({confidence.toFixed(1)}% confianza)
                          {coversBodyPart && (
                            <span style={{ marginLeft: "10px" }}>
                              • Cubre parte: {coversBodyPart.Value ? "Sí" : "No"} ({coversBodyPart.Confidence.toFixed(1)}%)
                            </span>
                          )}
                        </>
                      ) : (
                        "❌ Faltante"
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Análisis de Video EPP</h2>
      
      {/* File Upload */}
      <Card style={{ marginBottom: "20px" }}>
        <Card.Body>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          <Button 
            onClick={() => fileInputRef.current.click()}
            disabled={isProcessing}
            variant="primary"
          >
            {isProcessing ? "Procesando..." : "Seleccionar Video"}
          </Button>
          
          {isProcessing && (
            <div style={{ marginTop: "10px" }}>
              <ProgressBar 
                now={processingProgress} 
                label={`${Math.round(processingProgress)}%`}
              />
              <small style={{ color: "#6c757d" }}>
                Extrayendo y analizando frames del video...
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Timeline */}
      {analysisResults.length > 0 && (
        <Card style={{ marginBottom: "20px" }}>
          <Card.Header>
            <strong>Timeline de Alertas</strong>
            <span style={{ marginLeft: "10px", fontSize: "0.9em", color: "#6c757d" }}>
              {getAlerts().length} alertas detectadas
            </span>
          </Card.Header>
          <Card.Body>
            <div style={{ 
              display: "flex", 
              overflowX: "auto", 
              padding: "10px",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px"
            }}>
              {getAlerts().map((alert, index) => (
                <div
                  key={index}
                  onClick={() => handleTimelineClick(alert.timestamp)}
                  style={{
                    cursor: "pointer",
                    padding: "8px 12px",
                    margin: "0 4px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    borderRadius: "4px",
                    fontSize: "0.9em",
                    whiteSpace: "nowrap"
                  }}
                  title={`Duración: ${alert.duration}s`}
                >
                  🚨 {formatTime(alert.timestamp)}
                  {alert.duration > 1 && (
                    <span style={{ fontSize: "0.8em", opacity: 0.9 }}>
                      ({alert.duration}s)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Video and Analysis Layout */}
      {videoFile && analysisResults.length > 0 && (
        <Row>
          <Col md={8} sm={6}>
            {/* Video Player with Bounding Boxes */}
            <Card>
              <Card.Body>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <video
                    ref={videoRef}
                    controls
                    style={{ width: "100%", maxHeight: "400px" }}
                    onTimeUpdate={handleVideoTimeUpdate}
                  >
                    <source src={URL.createObjectURL(videoFile)} type={videoFile.type} />
                  </video>
                  
                  {/* Bounding Boxes Overlay */}
                  <div style={{ 
                    position: "absolute", 
                    top: 0, 
                    left: 0, 
                    width: "100%", 
                    height: "100%",
                    pointerEvents: "none"
                  }}>
                    {getCurrentFrameResults().Persons.map((person, index) => {
                      const mappedPerson = ppeMapper(person);
                      return (
                        <VideoBoundingBox
                          key={index}
                          person={person}
                          webcamCoordinates={webcamCoordinates}
                          isMissing={mappedPerson.hasAlarm}
                        />
                      );
                    })}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} sm={6}>
            {/* Current Analysis */}
            <Card>
              <Card.Header>
                <strong>Análisis en Tiempo Real</strong>
                <span style={{ marginLeft: "10px", fontSize: "0.9em", color: "#6c757d" }}>
                  {formatTime(currentTime)}
                </span>
              </Card.Header>
              <Card.Body>
                {(() => {
                  const currentResults = getCurrentFrameResults();
                  const personCards = currentResults.Persons.map((person, index) => 
                    renderPersonCard(person, index)
                  ).filter(card => card !== null);

                  if (personCards.length > 0) {
                    return personCards;
                  } else {
                    return (
                      <Alert variant="success">
                        ✅ Todas las personas tienen el EPP requerido en este momento
                      </Alert>
                    );
                  }
                })()}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default VideoUpload; 