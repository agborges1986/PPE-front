import React, { useState, useRef } from "react";
import { Button, Card, ProgressBar, Row, Col } from "react-bootstrap";
import gateway from "../utils/gateway";
import { ppeMapper } from "../utils/ppe";
import VideoBoundingBox from "./VideoBoundingBox";
import PPEChart from "./PPEChart";

const VideoUpload = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [webcamCoordinates, setWebcamCoordinates] = useState({});
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Configuration for frame extraction
  const FRAME_INTERVAL = 1; // Check every 1 second

  // Extract frames from video at regular intervals
  const extractFrames = async (videoBlob) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.muted = true; // Mute to avoid audio issues
      video.playsInline = true; // Prevent fullscreen on mobile
      video.src = URL.createObjectURL(videoBlob);
      
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const frames = [];
        const frameInterval = FRAME_INTERVAL * 1000; // Convert to milliseconds
        const duration = video.duration * 1000;
        const totalFrames = Math.ceil(duration / frameInterval);
        let processedFrames = 0;
        
        // Set canvas dimensions once
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const extractFrameAtTime = (time) => {
          return new Promise((resolveFrame) => {
            // Use a separate video element for each frame to avoid conflicts
            const frameVideo = document.createElement('video');
            frameVideo.muted = true;
            frameVideo.playsInline = true;
            frameVideo.src = URL.createObjectURL(videoBlob);
            
            frameVideo.onloadedmetadata = () => {
              frameVideo.currentTime = time / 1000;
              
              frameVideo.onseeked = () => {
                // Draw frame to canvas
                ctx.drawImage(frameVideo, 0, 0);
                
                // Convert to blob with lower quality to reduce memory usage
                canvas.toBlob((blob) => {
                  const frame = {
                    time: time,
                    image: blob,
                    timestamp: time / 1000
                  };
                  frames.push(frame);
                  processedFrames++;
                  
                  // Clean up frame video element
                  URL.revokeObjectURL(frameVideo.src);
                  
                  if (processedFrames === totalFrames) {
                    // Clean up main video element
                    URL.revokeObjectURL(video.src);
                    resolve(frames);
                  } else {
                    // Extract next frame with a small delay to prevent blocking
                    const nextTime = processedFrames * frameInterval;
                    if (nextTime < duration) {
                      setTimeout(() => extractFrameAtTime(nextTime), 10);
                    }
                  }
                  resolveFrame(frame);
                }, 'image/jpeg', 0.7); // Reduced quality to 0.7 for better performance
              };
            };
          });
        };
        
        // Start extracting frames with initial delay
        setTimeout(() => extractFrameAtTime(0), 100);
      };
    });
  };

  // Process video frames through API
  const processVideoFrames = async (frames) => {
    const results = [];
    const batchSize = 5; // Process 5 frames at a time to prevent blocking
    
    for (let i = 0; i < frames.length; i += batchSize) {
      const batch = frames.slice(i, i + batchSize);
      const batchPromises = batch.map(async (frame, batchIndex) => {
        const frameIndex = i + batchIndex;
        setProcessingProgress((frameIndex / frames.length) * 100);
        
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
          return {
            timestamp: frame.timestamp,
            time: frame.time,
            result: result
          };
        } catch (error) {
          console.error('Error processing frame:', error);
          // Add empty result for failed frames
          return {
            timestamp: frame.timestamp,
            time: frame.time,
            result: { Persons: [] }
          };
        }
      });
      
      // Wait for current batch to complete before processing next batch
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to prevent blocking
      if (i + batchSize < frames.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return results;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      // Check file size and warn for large files
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 100) {
        const proceed = window.confirm(
          `El archivo es muy grande (${fileSizeMB.toFixed(1)} MB). ` +
          'El procesamiento puede tomar mucho tiempo y causar pausas en la reproducción. ' +
          '¿Desea continuar?'
        );
        if (!proceed) {
          return;
        }
      }
      
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
      const requiredFrames = Math.ceil(3 / FRAME_INTERVAL); // 3 second delay
      
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
    
    // Consolidate overlapping alerts (within 2 seconds of each other)
    const consolidatedAlerts = [];
    
    alerts.sort((a, b) => a.timestamp - b.timestamp);
    
    alerts.forEach(alert => {
      // Check if this alert overlaps with any already processed
      const isOverlapping = consolidatedAlerts.some(existingAlert => {
        const existingStart = existingAlert.timestamp;
        const existingEnd = existingStart + existingAlert.duration;
        const newStart = alert.timestamp;
        const newEnd = newStart + alert.duration;
        
        // Check if the time ranges overlap
        return (newStart < existingEnd && newEnd > existingStart);
      });
      
      if (!isOverlapping) {
        consolidatedAlerts.push(alert);
      }
    });
    
    return consolidatedAlerts;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (timestamp) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };





  const getCurrentFrameResults = () => {
    const currentAlerts = analysisResults.filter(result => 
      Math.abs(result.timestamp - currentTime) < 0.5
    );
    if (currentAlerts.length > 0) {
      return currentAlerts[0].result;
    }
    return { Persons: [] };
  };







  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Análisis de Video EPP</h2>
        {videoFile && (
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => {
              setVideoFile(null);
              setAnalysisResults([]);
              setCurrentTime(0);
              setProcessingProgress(0);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          >
            Cambiar Video
          </Button>
        )}
      </div>
      
      {/* File Upload */}
      {!videoFile && (
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
      )}

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
      {videoFile && (
        <Row>
          <Col md={4} sm={6}>
            {/* PPE Chart */}
            {analysisResults.length > 0 ? (
              <PPEChart 
                key={`chart-${Math.round(currentTime)}`}
                analysisResults={analysisResults}
                currentTime={currentTime}
              />
            ) : (
              <Card>
                <Card.Header>
                  <strong>Estado EPP</strong>
                </Card.Header>
                <Card.Body>
                  {isProcessing ? (
                    <div>
                      <ProgressBar 
                        now={processingProgress} 
                        label={`${Math.round(processingProgress)}%`}
                      />
                      <small style={{ color: "#6c757d", marginTop: "10px", display: "block" }}>
                        Procesando video...
                      </small>
                    </div>
                  ) : (
                    <p className="text-muted">No hay análisis disponible</p>
                  )}
                </Card.Body>
              </Card>
            )}
          </Col>
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
                  {analysisResults.length > 0 && (
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
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default VideoUpload; 