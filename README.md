# PPE Detection App

A React application for Personal Protective Equipment (PPE) detection using AWS Rekognition. The app provides two modes of operation:

## Features

### 📹 Live Camera Mode
- Real-time PPE detection using your device's camera
- Continuous monitoring with automatic frame capture
- Live display of detection results with bounding boxes
- Real-time alerts for missing PPE

### 🎥 Video Upload Mode
- Upload and analyze video files for PPE detection
- Process video frames at regular intervals (every 1 second)
- Timestamped alerts for missing PPE throughout the video
- Interactive timeline of all PPE violations
- Video replay with synchronized detection results
- Click on timeline alerts to jump to specific video timestamps

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Usage

1. **Authentication**: Sign in using your credentials
2. **Choose Mode**: Switch between Live Camera and Video Upload modes using the navigation bar
3. **Live Camera**: Click "Start Detection" to begin real-time monitoring
4. **Video Upload**: 
   - Select a video file
   - Click "Analyze Video" to process the video
   - View results and click on timeline alerts to jump to specific timestamps

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
