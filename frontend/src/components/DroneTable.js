import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import compareAsc from "date-fns/compareAsc";
import parse from "date-fns/parse";

/**
 * Returns react table for presenting drone data.
 * @returns React table for presenting drone data.
 */
const DroneTable = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    loadData();

    const interval = setInterval(async () => {
      await loadData();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Fetch new data drone data, reformat the data a bit and add the data into an array and set it to the rows to be presented in the table
   */
  const loadData = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND}/closestDrones`
      );
      const droneData = await response.json();

      if (droneData) {
        const data = [];
        // format the data for presentation
        Object.keys(droneData).forEach((serial) => {
          data.push({
            time: format(
              new Date(droneData[serial].posData.time),
              "HH:mm:ss dd.MM.yyyy"
            ),
            pilot: `${droneData[serial].pilot.firstName} ${droneData[serial].pilot.lastName}`,
            phone: droneData[serial].pilot.phoneNumber,
            email: droneData[serial].pilot.email,
            distance: droneData[serial].posData.distance,
            serial: serial,
          });
        });
        data.sort((drone1, drone2) => {
          return compareAsc(
            parse(drone1.time, "HH:mm:ss dd.MM.yyyy", new Date()),
            parse(drone2.time, "HH:mm:ss dd.MM.yyyy", new Date())
          );
        });
        setRows(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // present data when loaded
  return (
    <>
      {rows.length === 0 && <p>Loading...</p>}{" "}
      {rows.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow key={"table-head-row"}>
                {Object.keys(rows[0]).map((field, idx) => {
                  return (
                    <TableCell key={`${idx}-table-head-cell`}>
                      {field.toUpperCase()}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, rowIdx) => (
                <TableRow key={`${rowIdx}-table-row-cell`}>
                  {Object.keys(row).map((cell, cellIdx) => (
                    <TableCell key={`${rowIdx}-table-row-${cellIdx}-cell`}>
                      {cell === "distance"
                        ? (row[cell] / 1000).toFixed(2) + " m"
                        : row[cell]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default DroneTable;
