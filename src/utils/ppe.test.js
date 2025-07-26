import { ppeMapper, getMissingPPE } from "./ppe";

const testData = {
  Persons: [
    {
      BodyParts: [
        {
          Confidence: 99.99930572509766,
          EquipmentDetections: [
            {
              BoundingBox: {
                Height: 0.3095385730266571,
                Left: 0.2645637094974518,
                Top: 0.29297786951065063,
                Width: 0.1740061491727829,
              },
              Confidence: 98.30194854736328,
              CoversBodyPart: {
                Confidence: 79.82731628417969,
                Value: true,
              },
              Type: "MASK",
            },
            {
              BoundingBox: {
                Height: 0.3095385730266571,
                Left: 0.2645637094974518,
                Top: 0.29297786951065063,
                Width: 0.1740061491727829,
              },
              Confidence: 98.30194854736328,
              CoversBodyPart: {
                Confidence: 79.82731628417969,
                Value: true,
              },
              Type: "FOO",
            },
          ],
          Name: "FACE",
        },
        {
          Confidence: 99.99846649169922,
          EquipmentDetections: [
            {
              BoundingBox: {
                Height: 0.37994688749313354,
                Left: 0.342035174369812,
                Top: 0.16647937893867493,
                Width: 0.2135859727859497,
              },
              Confidence: 85.8783187866211,
              CoversBodyPart: {
                Confidence: 84.20125579833984,
                Value: true,
              },
              Type: "HELMET",
            },
          ],
          Name: "HEAD",
        },
        {
          Confidence: 99.72054290771484,
          EquipmentDetections: [
            {
              BoundingBox: {
                Height: 0.33101364970207214,
                Left: 0.5892353653907776,
                Top: 0.23174917697906494,
                Width: 0.18587328493595123,
              },
              Confidence: 96.79559326171875,
              CoversBodyPart: {
                Confidence: 100,
                Value: true,
              },
              Type: "GLOVE",
            },
          ],
          Name: "LEFT_HAND",
        },
        {
          Confidence: 99.87159729003906,
          EquipmentDetections: [
            {
              BoundingBox: {
                Height: 0.32489436864852905,
                Left: 0.20085042715072632,
                Top: 0.2759649455547333,
                Width: 0.18243715167045593,
              },
              Confidence: 78.28016662597656,
              CoversBodyPart: {
                Confidence: 100,
                Value: true,
              },
              Type: "GLOVE",
            },
          ],
          Name: "RIGHT_HAND",
        },
      ],
      BoundingBox: {
        Height: 0.7783375382423401,
        Left: 0.062234796583652496,
        Top: 0.20151133835315704,
        Width: 0.7751060724258423,
      },
      Confidence: 96.86412811279297,
      Id: 0,
    },
  ],
  ProtectiveEquipmentModelVersion: "1.0",
};

// Test data for person with missing PPE
const testDataMissingPPE = {
  Persons: [
    {
      BodyParts: [
        {
          Confidence: 99.99930572509766,
          EquipmentDetections: [], // No mask detected
          Name: "FACE",
        },
        {
          Confidence: 99.99846649169922,
          EquipmentDetections: [], // No helmet detected
          Name: "HEAD",
        },
        {
          Confidence: 99.72054290771484,
          EquipmentDetections: [
            {
              BoundingBox: {
                Height: 0.33101364970207214,
                Left: 0.5892353653907776,
                Top: 0.23174917697906494,
                Width: 0.18587328493595123,
              },
              Confidence: 96.79559326171875,
              CoversBodyPart: {
                Confidence: 100,
                Value: true,
              },
              Type: "GLOVE",
            },
          ],
          Name: "LEFT_HAND",
        },
        {
          Confidence: 99.87159729003906,
          EquipmentDetections: [], // No glove detected
          Name: "RIGHT_HAND",
        },
      ],
      BoundingBox: {
        Height: 0.7783375382423401,
        Left: 0.062234796583652496,
        Top: 0.20151133835315704,
        Width: 0.7751060724258423,
      },
      Confidence: 96.86412811279297,
      Id: 1,
    },
  ],
  ProtectiveEquipmentModelVersion: "1.0",
};

// Real API output data from user
const realApiData = {
  ProtectiveEquipmentModelVersion: "1.0",
  Persons: [
    {
      BodyParts: [
        {
          Name: "FACE",
          Confidence: 99.57547760009766,
          EquipmentDetections: []
        }
      ],
      BoundingBox: {
        Width: 0.5456053018569946,
        Height: 0.9485903978347778,
        Left: 0.009950248524546623,
        Top: 0.02985074557363987
      },
      Confidence: 99.18273162841797,
      Id: 0
    },
    {
      BodyParts: [
        {
          Name: "FACE",
          Confidence: 99.7826156616211,
          EquipmentDetections: []
        },
        {
          Name: "LEFT_HAND",
          Confidence: 97.396484375,
          EquipmentDetections: [
            {
              BoundingBox: {
                Width: 0.05136622115969658,
                Height: 0.10679341852664948,
                Left: 0.6697998046875,
                Top: 0.18561430275440216
              },
              Confidence: 96.45838928222656,
              Type: "HAND_COVER",
              CoversBodyPart: {
                Confidence: 98.72128295898438,
                Value: true
              }
            }
          ]
        },
        {
          Name: "HEAD",
          Confidence: 99.93659973144531,
          EquipmentDetections: [
            {
              BoundingBox: {
                Width: 0.08192756772041321,
                Height: 0.10493817180395126,
                Left: 0.5956298112869263,
                Top: 0.10765298455953598
              },
              Confidence: 93.49637603759766,
              Type: "HEAD_COVER",
              CoversBodyPart: {
                Confidence: 99.4092788696289,
                Value: true
              }
            }
          ]
        }
      ],
      BoundingBox: {
        Width: 0.26119402050971985,
        Height: 0.6898838877677917,
        Left: 0.5323383212089539,
        Top: 0.12106136232614517
      },
      Confidence: 94.01846313476562,
      Id: 1
    }
  ]
};

describe("ppe Mapper", () => {
  test("maps with body parts and confidence", () => {
    const mapped = testData.Persons.map(ppeMapper);
    expect(mapped).toMatchSnapshot();
  });

  test("detects missing PPE correctly", () => {
    const missingPPE = getMissingPPE(testDataMissingPPE.Persons[0]);
    expect(missingPPE).toEqual([
      { bodyPart: "cara", type: "Mascarilla" },
      { bodyPart: "cabeza", type: "Casco" },
      { bodyPart: "mano derecha", type: "Guante" }
    ]);
  });

  test("includes missing PPE in mapped result", () => {
    const mapped = testDataMissingPPE.Persons.map(ppeMapper);
    expect(mapped[0].hasAlarm).toBe(true);
    expect(mapped[0].missingPPE).toHaveLength(3);
    expect(mapped[0].missingPPE).toEqual([
      { bodyPart: "cara", type: "Mascarilla" },
      { bodyPart: "cabeza", type: "Casco" },
      { bodyPart: "mano derecha", type: "Guante" }
    ]);
  });

  test("person with all PPE has no alarm", () => {
    const mapped = testData.Persons.map(ppeMapper);
    expect(mapped[0].hasAlarm).toBe(false);
    expect(mapped[0].missingPPE).toHaveLength(0);
  });

  test("handles real API data with HAND_COVER and HEAD_COVER", () => {
    const mapped = realApiData.Persons.map(ppeMapper);
    
    // Person 0: Only FACE detected, no equipment
    expect(mapped[0].hasAlarm).toBe(true);
    expect(mapped[0].missingPPE).toContainEqual({ bodyPart: "cara", type: "Mascarilla" });
    
    // Person 1: Has HAND_COVER and HEAD_COVER, missing FACE_COVER
    expect(mapped[1].hasAlarm).toBe(true);
    expect(mapped[1].missingPPE).toContainEqual({ bodyPart: "cara", type: "Mascarilla" });
    expect(mapped[1].missingPPE).toContainEqual({ bodyPart: "mano derecha", type: "Guante" });
    
    // Should NOT have missing HEAD_COVER since it's detected
    const headCoverMissing = mapped[1].missingPPE.find(item => 
      item.bodyPart === "cabeza" && item.type === "Casco"
    );
    expect(headCoverMissing).toBeUndefined();
    
    // Should NOT have missing LEFT_HAND since HAND_COVER is detected
    const leftHandMissing = mapped[1].missingPPE.find(item => 
      item.bodyPart === "mano izquierda" && item.type === "Guante"
    );
    expect(leftHandMissing).toBeUndefined();
  });

  test("demonstrates correct handling of user's real API data", () => {
    const mapped = realApiData.Persons.map(ppeMapper);
    
    // Verify the expected behavior
    expect(mapped[0].hasAlarm).toBe(true); // Missing face cover
    expect(mapped[1].hasAlarm).toBe(true); // Missing face cover and right hand cover
    expect(mapped[1].missingPPE).toHaveLength(2); // Face and right hand
  });
});
