# PPE Alarm System

This extension adds comprehensive PPE (Personal Protective Equipment) alarm functionality to the AWS Rekognition PPE detection app.

## Features Added

### 1. Missing PPE Detection
- Automatically detects when required PPE is missing for each person
- Required PPE items:
  - **Mask** on face
  - **Helmet** on head
  - **Gloves** on both hands

### 2. Visual Alarm Indicators
- **Red alarm badges** on person cards when PPE is missing
- **Pulsing red bounding boxes** on the video feed showing where missing PPE should be
- **Comprehensive alarm summary** showing total missing PPE across all detected persons

### 3. Alarm Components

#### AlarmSummary Component
- Shows overall compliance status
- Displays count of people with missing PPE
- Shows total number of missing PPE items
- Green "All Clear" message when everyone has proper PPE

#### PPEAlarm Component
- Individual alarm for each person with missing PPE
- Lists specific missing equipment by body part
- Visual indicators with warning icons

#### MissingPPEOverlay Component
- Overlays red bounding boxes on the video feed
- Shows estimated locations where missing PPE should be worn
- Pulsing animation to draw attention

## Technical Implementation

### Data Flow
1. **AWS Rekognition Response** → Raw detection data
2. **ppeMapper Function** → Processes data and identifies missing PPE
3. **React State** → Stores processed data with alarm flags
4. **UI Components** → Display alarms and visual indicators

### Key Functions

#### `getMissingPPE(person)`
- Analyzes detected body parts and equipment
- Compares against required PPE list
- Returns array of missing PPE items

#### `ppeMapper(person)`
- Enhanced to include `missingPPE` and `hasAlarm` properties
- Maintains backward compatibility with existing functionality

### CSS Enhancements
- Added pulsing animation for alarm elements
- Red color scheme for missing PPE indicators
- Responsive design for alarm components

## Usage

The alarm system works automatically when the app detects people. When PPE is missing:

1. **Video Feed**: Red bounding boxes appear where missing PPE should be worn
2. **Summary Panel**: Shows overall compliance status at the top
3. **Person Cards**: Individual alarms for each person with missing PPE
4. **Visual Indicators**: Pulsing animations and warning icons

## Testing

The system includes comprehensive tests:
- Missing PPE detection accuracy
- Alarm flag generation
- Data structure compatibility
- Edge cases (no people, all PPE present, etc.)

Run tests with:
```bash
npm test -- --testPathPattern=ppe.test.js
```

## Customization

To modify required PPE items, update the `REQUIRED_PPE` object in `src/utils/ppe.js`:

```javascript
const REQUIRED_PPE = {
  FACE: ["MASK"],
  HEAD: ["HELMET"],
  LEFT_HAND: ["GLOVE"],
  RIGHT_HAND: ["GLOVE"],
  // Add more body parts and required equipment
};
```

## Future Enhancements

Potential improvements:
- Audio alarms for missing PPE
- Configurable PPE requirements per environment
- Historical compliance tracking
- Export compliance reports
- Integration with safety management systems 