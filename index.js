require("dotenv").config();
const { XMLParser } = require("fast-xml-parser");
const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 5000;
// NDZ distance
const distanceLimit = 100000;

// serves the frontend build as the main page
app.use(express.static("frontend/build"));

// routing for render's server condition checkup
app.get("/healthz", (req, res) => {
  res.send("OK");
});

// routing for app to fetch the closest flight data for all NDZ violating drones data
app.get("/closestDrones", (req, res) => {
  res.send(closestDroneData);
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

// all relevant data on drones which have flown within NDZ during last 10 min
let droneData = {};

// droneData with with only the flight data involving their closest position to the nest from the last 10 min
let closestDroneData = {};

// fetch new data for review every 2 seconds
setInterval(async () => {
  try {
    const response = await fetch(
      "https://assignments.reaktor.com/birdnest/drones"
    );
    const xmlString = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const result = parser.parse(xmlString);
    
    if (result.report) {
      // time of recording
      const time = result.report.capture["@_snapshotTimestamp"];

      // loop through the latest data on drone's positions
      for (const drone of result.report.capture.drone) {
        // calculate distance of the drone to the nest
        const distance = checkDistance(drone.positionX, drone.positionY);

        // if within the NDZ (orig 100m radius)
        if (distance < distanceLimit) {
          // add data to existing drone record
          if (droneData[drone.serialNumber]) {
            droneData[drone.serialNumber].posData.push({
              time: time,
              positionY: drone.positionY,
              positionX: drone.positionX,
              distance: distance,
            });
          } else {
            // for drones with no existing data, fetch pilot data and add the drone data to the record
            const response = await fetch(
              `https://assignments.reaktor.com/birdnest/pilots/${drone.serialNumber}`
            );
            const ownerData = await response.json();

            droneData[drone.serialNumber] = {
              pilot: {
                firstName: ownerData.firstName,
                lastName: ownerData.lastName,
                phoneNumber: ownerData.phoneNumber,
                email: ownerData.email,
              },
              posData: [
                {
                  time: time,
                  positionY: drone.positionY,
                  positionX: drone.positionX,
                  distance: distance,
                },
              ],
            };
          }
        }
      }
    }
    // delete drone records that are older than 10 min
    delOldData();
    // update the record of the closest distance each violator has flown to the nest during the last 10 min, based on all drone data
    closestDroneData = findClosestPos();
  } catch (e) {
    console.error(e);
  }
}, 2000);

/**
 * Function for determining drone position's (X, Y) from the nest (250000, 250000).
 * @param {number} posX     Drone's X-position.
 * @param {number} posY     Drone's Y-position.
 * @returns Distance of (posX, posY) from the nest (250000, 250000).
 */
const checkDistance = (posX, posY) => {
  const nestPosX = (nestPosY = 250000);

  const dist = Math.sqrt(
    Math.pow(nestPosX - posX, 2) + Math.pow(nestPosY - posY, 2)
  );

  return dist;
};

/**
 * Loops through droneData, removing position data older than 10 minutes and then drone data with no position data newer than 10 minutes.
 */
const delOldData = () => {
  // Remove posData older than 10 min
  Object.keys(droneData).forEach((serialNumber) => {
    droneData[serialNumber].posData = droneData[serialNumber].posData.filter(
      (data) => {
        const diff = new Date() - new Date(data.time);
        const limit = 1000 * 60 * 10;
        return diff < limit;
      }
    );
  });

  // Remove droneData with no posData left
  droneData = Object.keys(droneData)
    .filter((serialNumber) => droneData[serialNumber].posData.length > 0)
    .reduce((filteredData, serialNumber) => {
      return { ...filteredData, [serialNumber]: droneData[serialNumber] };
    }, {});
};

/**
 * Creates copy of droneData, which it then fliters so the posData only contains the positional data closest to the nest, meaning smallest distance.
 * @returns Copy of droneData filtered for smallest distance to the nest.
 */
const findClosestPos = () => {
  // create deep copy of droneData
  const filteredData = JSON.parse(JSON.stringify(droneData));

  // replace filteredData.posData with object containing only the data with the smallest distance
  Object.keys(filteredData).forEach(
    (serialNumber) =>
      (filteredData[serialNumber].posData = filteredData[
        serialNumber
      ].posData.reduce((prevPosData, currPosData) => {
        return prevPosData.distance < currPosData.distance
          ? prevPosData
          : currPosData;
      }))
  );

  return filteredData;
};
