import React, { useState, useRef, useEffect } from "react";
import { Button, Card, Alert, ProgressBar, ListGroup, Badge } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";

import gateway from "../utils/gateway";
import { ppeMapper } from "../utils/ppe";
import { formatErrorMessage } from "../utils";

const VideoUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [frameResults, setFrameResults] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorDetails, setErrorDetails] = useState(undefined);
  const [ppeAlerts, setPpeAlerts] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setFrameResults([]);
      setPpeAlerts([]);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const extractFrame = (video, time) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const processFrame = async (frameData, timestamp) => {
    try {
      const b64Encoded = frameData.split(",")[1];
      const result = await gateway.processImage(b64Encoded);
      const people = result.Persons.map(ppeMapper);
      
      return {
        timestamp,
        people,
        frameData
      };
    } catch (e) {
      console.error('Error processing frame:', e);
      setErrorDetails(formatErrorMessage(e));
      return null;
    }
  };

  const analyzeVideo = async () => {
    if (!selectedFile || !videoRef.current) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setFrameResults([]);
    setPpeAlerts([]);
    setErrorDetails(undefined);

    const video = videoRef.current;
    const duration = video.duration;
    const frameInterval = 1; // Process every 1 second
    const totalFrames = Math.floor(duration / frameInterval);
    let processedFrames = 0;

    const results = [];
    const alerts = [];

    for (let time = 0; time < duration; time += frameInterval) {
      video.currentTime = time;
      
      await new Promise((resolve) => {
        video.onseeked = () => {
          const frameData = extractFrame(video, time);
          processFrame(frameData, time).then((result) => {
            if (result) {
              results.push(result);
              
                             // Check for missing PPE and create alerts
               result.people.forEach(person => {
                 const missingPPE = person.results.filter(r => !r.coversBodyPart);
                 if (missingPPE.length > 0) {
                   alerts.push({
                     id: uuidv4(),
                     timestamp: time,
                     personId: person.id,
                     missingPPE: missingPPE.map(r => r.type)
                   });
                 }
               });
            }
            
            processedFrames++;
            setProcessingProgress((processedFrames / totalFrames) * 100);
            resolve();
          });
        };
      });
    }

    setFrameResults(results);
    setPpeAlerts(alerts);
    setIsProcessing(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);

  const getCurrentFrameResults = () => {
    const currentFrame = frameResults.find(frame => 
      Math.abs(frame.timestamp - currentTime) < 0.5
    );
    return currentFrame ? currentFrame.people : [];
  };

  const getCurrentAlerts = () => {
    return ppeAlerts.filter(alert => 
      Math.abs(alert.timestamp - currentTime) < 0.5
    );
  };

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <div className="video-upload-container">
      <Card className="mb-4">
        <Card.Header>
          <h4>Video Upload & Analysis</h4>
        </Card.Header>
        <Card.Body>
          <div className="mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button 
              variant="primary" 
              onClick={() => fileInputRef.current.click()}
              disabled={isProcessing}
            >
              Select Video File
            </Button>
            {selectedFile && (
              <span className="ml-3">
                Selected: {selectedFile.name}
              </span>
            )}
          </div>

          {selectedFile && (
            <Button 
              variant="success" 
              onClick={analyzeVideo}
              disabled={isProcessing}
              className="mb-3"
            >
              {isProcessing ? 'Processing...' : 'Analyze Video'}
            </Button>
          )}

          {isProcessing && (
            <div className="mb-3">
              <ProgressBar 
                now={processingProgress} 
                label={`${Math.round(processingProgress)}%`}
              />
            </div>
          )}

          {errorDetails && (
            <Alert variant="danger">
              An error occurred: {errorDetails}
            </Alert>
          )}
        </Card.Body>
      </Card>

      {videoUrl && (
        <div className="video-container">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            style={{ width: '100%', maxWidth: '800px' }}
            onTimeUpdate={handleVideoTimeUpdate}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <div className="current-time-display mt-2">
            <strong>Current Time: {formatTime(currentTime)}</strong>
          </div>

          {frameResults.length > 0 && (
            <div className="analysis-results mt-3">
              <h5>Analysis Results</h5>
              
              {/* Current Frame Results */}
              <div className="current-frame-results">
                <h6>Current Frame ({formatTime(currentTime)})</h6>
                {getCurrentFrameResults().map((person) => (
                  <Card key={person.id} className="mb-2">
                    <Card.Header>Person #{person.id}</Card.Header>
                    <Card.Body>
                      {person.results.map((result, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center">
                          <span>{result.type} on {result.bodyPart}</span>
                          <Badge variant={result.coversBodyPart ? "success" : "danger"}>
                            {result.coversBodyPart ? "✓" : "✗"} {result.confidence}%
                          </Badge>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                ))}
              </div>

                             {/* Current Alerts */}
               {getCurrentAlerts().length > 0 && (
                 <div className="current-alerts mt-3">
                   <h6>⚠️ PPE Alerts at {formatTime(currentTime)}</h6>
                   {getCurrentAlerts().map((alert) => (
                     <Alert key={alert.id} variant="warning">
                       <strong>Person #{alert.personId}</strong> - Missing: {alert.missingPPE.join(', ')}
                     </Alert>
                   ))}
                 </div>
               )}

              {/* All Alerts Timeline */}
              {ppeAlerts.length > 0 && (
                <div className="alerts-timeline mt-4">
                  <h6>All PPE Alerts Timeline</h6>
                  <ListGroup>
                    {ppeAlerts.map((alert) => (
                      <ListGroup.Item 
                        key={alert.id}
                        action
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = alert.timestamp;
                          }
                        }}
                        className="d-flex justify-content-between align-items-center"
                      >
                                               <div>
                         <strong>{formatTime(alert.timestamp)}</strong> - 
                         Person #{alert.personId}: Missing {alert.missingPPE.join(', ')}
                       </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoUpload; 